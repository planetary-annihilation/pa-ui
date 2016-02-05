// !LOCNS:leaderboard

var LeaderboardUtility = (function() {
    var currentTimeSeconds = UberUtility.getCurrentTimeObservable();
    var allowUbernetActions = ko.computed(function() {
        return !_.isEmpty(api.net.uberId());
    });

    function RankedPlayerModel(rank, displayName, entry) {
        var self = this;

        self.rank = rank;
        self.displayName = displayName;
        self.uberId = entry.UberId;

        self.secondsSinceLastGame = ko.computed(function() {
            var lastMatch = ko.utils.unwrapObservable(entry.LastMatchAt);
            if (!lastMatch)
                return 0;

            lastMatch = (new Date(lastMatch).getTime() / 1000) | 0;
            if (lastMatch > currentTimeSeconds())
                return 0;
            else
                return currentTimeSeconds() - lastMatch;
        });

        self.displayRank = ko.computed(function() {
            var rank = ko.utils.unwrapObservable(self.rank);
            if (rank > 0)
                return rank;
            else
                return "?";
        });

        self.timeSinceLastGame = ko.computed(function() {
            var formatNumber = function(n, info) {
                if (n === 1)
                    return [info.description_singular];
                else
                    return [info.description_plural, { n: n }];
            };

            var units = [
                { scale: 60, description_singular: '!LOC:1 second ago', description_plural: '!LOC:__n__ seconds ago' },
                { scale: 60, description_singular: '!LOC:1 minute ago', description_plural: '!LOC:__n__ minutes ago' },
                { scale: 24, description_singular: '!LOC:1 hour ago', description_plural: '!LOC:__n__ hours ago' },
                { scale:  7, description_singular: '!LOC:1 day ago', description_plural: '!LOC:__n__ days ago' },
                { description_singular: '!LOC:1 week ago', description_plural: '!LOC:__n__ weeks ago' }
            ];

            var unit = self.secondsSinceLastGame();
            if (unit === 0)
                return '!LOC:Just now';

            for (var i = 0; i < units.length; ++i) {
                var unitInfo = units[i];
                if (!unitInfo.scale || unit < unitInfo.scale)
                    return formatNumber(unit, unitInfo);
                unit = (unit / unitInfo.scale) | 0;
            }

            return formatNumber(unit, units[units.length - 1]);
        });

        self.lastGameLobbyId = entry.LastLobby;
        self.lastRankChange = entry.LastRankChange;

        self.watchReplay = function() {
            var params = {
                action: 'start',
                replayid: self.lastGameLobbyId,
                content: api.content.activeContent(),
            };

            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
        };

        self.canWatchReplay = ko.computed(function() {
            if (ko.utils.unwrapObservable(self.lastGameLobbyId) === 0)
                return false;
            if (!allowUbernetActions())
                return false;
            return true;
        });
    };

    var displayNames = {};
    var displayNameLookupQueue = {};
    var pendingFlush = null;
    var waitForAjax = false;
    var LIMIT = 50;

    api.net.ubernetUrl.subscribe(function() { displayNames = {}; });
    function flushDisplayNameLookupQueue() {
        pendingFlush = null;

        if (waitForAjax || _.isEmpty(displayNameLookupQueue))
            return;

        var ids = _.keys(displayNameLookupQueue);
        displayNameLookupQueue = {};

        /* limit the max size of the request */
        if (ids.length > LIMIT)
        {
            var extra = ids.splice(LIMIT, ids.length - LIMIT);

            _.forEach(extra, function (element) {
                displayNameLookupQueue[element] = true;
            });
        }

        var query = 'UberIds=' + ids.join('&UberIds=');
        var ubernetUrl = api.net.ubernetUrl();
        var url = ubernetUrl + "/GameClient/UserNames?TitleId=4&" + query;

        waitForAjax = true;

        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json",
            success: function (data, textStatus) {
                if (ubernetUrl !== api.net.ubernetUrl())
                    return;

                _.forOwn(data.Users, function(user, uberid) {
                    var name = displayNames[uberid];
                    name.fetched = true;
                    var observable = name.observable;
                    if (!_.isEmpty(user.TitleDisplayName))
                        observable(user.TitleDisplayName);
                    else
                        observable(user.UberName);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error({ url: url, count: ids.length, ids: ids });
                console.error('ubernet.UserNames: fail', textStatus, errorThrown);
            },
            complete: function () {
                waitForAjax = false;
                if (!_.isEmpty(displayNameLookupQueue))
                    pendingFlush = _.defer(flushDisplayNameLookupQueue);
            }
        });
    };

    function getPlayerDisplayName(uberId) {
        if (isNaN(uberId))
            return ko.observable('');

        if (!_.contains(displayNames, uberId)) {
            displayNames[uberId] = {
            	observable: ko.observable(''),
            	fetched: false
            };
        }

        var name = displayNames[uberId];
        if (!name.fetched) {
            displayNameLookupQueue[uberId] = true;
            if (!pendingFlush)
                pendingFlush = _.defer(flushDisplayNameLookupQueue);
        }

        return name.observable;
    };

    function fetchLeagueInfo(league, gameType) {
    	var response = $.Deferred();
        var url = api.net.ubernetUrl() + "/MatchMaking/GetRankLeaderboard?GameType=" + gameType + "&TitleId=4&Rank=" + league;
        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json",
            success: function (data, textStatus) {
                var uberIds = [];
                var players = [];
                _.forEach(data.LeaderboardEntries, function(entry, index) {
                    var displayName = getPlayerDisplayName(entry.UberId);
                    players.push(new LeaderboardUtility.RankedPlayerModel(index + 1, displayName, entry));
                });

                response.resolve(data.NumberOfPlayersWithRank, players);
            },
            error: function (jqXHR, textStatus, errorThrown) {
            	response.reject(textStatus, errorThrown);
            }
        });

        return response.promise();
    };

    return {
        RankedPlayerModel: RankedPlayerModel,
        fetchLeagueInfo: fetchLeagueInfo,
        getPlayerDisplayName: getPlayerDisplayName
    };
})();

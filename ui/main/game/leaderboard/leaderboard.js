var model;

$(document).ready(function () {
    var currentTimeSeconds = UberUtility.getCurrentTimeObservable();

    function LeagueModel(leaderboard, rankNumber)
    {
        var self = this;
        self.players = ko.observableArray();
        self.size = ko.observable(0);
        self.displaySize = ko.computed(function() {
            if (self.size() === 1)
                return '!LOC:One ranked player at this level.';
            else if (self.size() === 0)
                return '!LOC:No ranked players at this level.';
            else
                return ['!LOC:__num_players__ ranked players at this level.', { num_players: self.size() }];
        });

        self.showYourselfException = ko.computed(function() {
            var playerRankNumber = MatchmakingUtility.getRankNumber(leaderboard.playerRatingInfo().Rating);
            return playerRankNumber === rankNumber && leaderboard.playerRankPosition() > self.players().length;
        });

        self.showLeaderboardLoading = ko.observable(true);
        self.showLeaderboardError = ko.observable(false);

        self.showLeaderboardEmpty = ko.computed(function() {
            return !self.showLeaderboardError() && !self.showLeaderboardLoading() && self.players().length === 0;
        });

        self.showLeaderboard = ko.computed(function() {
            return !self.showLeaderboardError() && !self.showLeaderboardLoading() && !self.showLeaderboardEmpty();
        });
    }

    function LeaderboardViewModel() {
        var self = this;

        // This is populated by start.js.
        self.playerDisplayName = ko.observable('').extend({ session: 'displayName' });

        // This one is populated by start.js, but we update it.
        self.playerRatingInfo = ko.observable({}).extend({ session: 'playerRatingInfo' });

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.leagues = {};

        self.playerRankInactive = ko.computed(function() {
            return self.playerRatingInfo().Status === "Inactive";
        });

        self.playerRankPosition = ko.computed(function() {
            var position = self.playerRatingInfo().LeaderboardPosition | 0;
            if (position > 0)
                return position;
            if (self.playerRankInactive())
                return loc("!LOC:Inactive");
            return '?';
        });

        self.playerBadge = ko.computed(function() {
            var rank = self.playerRatingInfo().Rating;
            if (!rank || rank == "unranked")
                return MatchmakingUtility.getBadgeSlotURL();
            return MatchmakingUtility.getBadgeURL(rank);
        });

        self.playerBadgeTitle = ko.computed(function() {
            var rank = self.playerRatingInfo().Rating;
            if (!rank)
                return loc("!LOC:Unknown");
            if (rank == "unranked")
                return loc("!LOC:Unranked");
            return MatchmakingUtility.getTitle(rank);
        });

        self.playerGameCount = ko.computed(function() {
            return self.playerRatingInfo().GameCount | 0;
        });

        self.playerHasRank = ko.computed(function() {
            var rank = self.playerRatingInfo().Rating;
            if (!rank)
                return true;
            var level = MatchmakingUtility.getLevel(rank);
            return level > 0;
        });

        var playerHasRankRule = function() {
            var hasActivated = false;
            return ko.computed(function() {
                if (!_.isEmpty(self.playerRatingInfo()))
                {
                    hasActivated = true;

                    var rating = self.playerRatingInfo().Rating;
                    var name = MatchmakingUtility.getName(rating);
                    if (MatchmakingUtility.getLevel(rating) > 0)
                        $('[href="#' + name + '"]').tab('show');
                }
            }, this, { disposeWhen: function() { return hasActivated; } });
        }();

        self.playerIsProvisional = ko.computed(function() {
            return !self.playerHasRank();
        });

        var yourEntry = {
            LastMatchAt: ko.computed(function() { return self.playerRatingInfo().LastMatchAt; }),
            LastLobby: ko.computed(function() { return self.playerRatingInfo().LastLobby; }),
            LastRankChange: ko.computed(function() { return self.playerRatingInfo().LastRankChange; }),
            UberId: api.net.uberId()
        };

        self.yourself = new LeaderboardUtility.RankedPlayerModel(self.playerRankPosition, self.playerDisplayName, yourEntry);

        // Click handler for back button
        self.back = function () {
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

        self.getPlayerInfo = function () {
            engine.asyncCall('ubernet.getPlayerRating', MatchmakingUtility.getMatchmakingType()).done(function (data) {
                data = JSON.parse(data)
                self.playerRatingInfo(data);
            }).fail(function (data) {
                console.error('get player rank fail');
            });
        };

        self.getLeagueInfo = function (league) {
            self.leagues[league].showLeaderboardError(false);
            self.leagues[league].showLeaderboardLoading(true);
            LeaderboardUtility.fetchLeagueInfo(league, MatchmakingUtility.getMatchmakingType()).done(function(numberOfPlayersWithRank, players) {
                self.leagues[league].players(players);
                self.leagues[league].size(numberOfPlayersWithRank);
            }).fail(function(textStatus, errorThrown) {
                self.leagues[league].showLeaderboardError(true);
                self.leagues[league].players([]);
                self.leagues[league].size(0);

                console.error("Unable to fetch league info", league, textStatus, errorThrown);
            }).always(function() {
                self.leagues[league].showLeaderboardLoading(false);
            });
        };

        self.startMatchmaking = function() {
            window.location.href = 'coui://ui/main/game/start/start.html?startMatchMaking=true';
        };

        for (var league = 1; league <= 5; ++league)
            self.leagues[league] = new LeagueModel(self, league);

        self.getPlayerInfo();

        var firstLeague = MatchmakingUtility.getRankNumber(self.playerRatingInfo().Rating);
        if (firstLeague > 0)
            self.getLeagueInfo(firstLeague);
        for (var league = 1; league <= 5; ++league)
        {
            if (league === firstLeague)
                continue;
            self.getLeagueInfo(league);
        }
    }

    model = new LeaderboardViewModel();
    model.lastSceneUrl('coui://ui/main/game/leaderboard/leaderboard.html');

    // inject per scene mods
    if (scene_mod_list['leaderboard']) {
        loadMods(scene_mod_list['leaderboard']);
    }

    // setup send/recv messages and signals
    app.registerWithCoherent(model, {});

    // Activates knockout.js
    ko.applyBindings(model);
});

var SaveGameUtility = (function () {

    var localSavedGames = ko.observable([]);
    var remoteSavedGames = ko.observable([]);
    var galacticWarSavedGames = ko.observable([]);

    var lastCompletedGameTimestamp = ko.observable().extend({ local: 'last_completed_game_timestamp' });

    var savedGames = ko.computed(function () {
        var list = _.flatten([localSavedGames(), remoteSavedGames(), galacticWarSavedGames()]);

        var unlocked = api.content.unlocked();
        _.forEach(list, function (element) {
            element.content = element.content || '';
            element.is_missing_content = element.content && !_.contains(unlocked, element.content);
            element.inactive_content = element.content !== api.content.activeContent();
        });
        var result = _.sortBy(list, function (element) { return -element.timestamp; });
        return result;
    });

    var baseSavedGame = {
        name: '',
        armies: 0,
        mode: '',
        duration: 0,
        lastSaved: 0,
        path: '',
        replayId: null,
        localReplay: false,
        remote: false,
        galacticWar: false,
        galacticWarId: null,
        hide: true,
        timestamp: 0,
        content: '',
    };

    var fetchLocalSaves = function () {

        api.file.listReplays().then(function (replays) {
            var list = _.map(replays, function (paths, replay) {
                var deferred = $.Deferred();

                var result = _.cloneDeep(baseSavedGame);
                result.name = replay;
                result.path = paths.replay;

                api.file.loadReplayMetadata(replay).then(function (data) {
                    if (!data || (data.save && data.save.type === 'gw')) {
                        deferred.resolve(null);
                        return;
                    }

                    result.localReplay = !data.save || data.save.type === 'replay';

                    if (data.save && data.save.utc_timestamp) {
                        result.timestamp = data.save.utc_timestamp * 1000; /* convert time stamp to ms.  c++ ctime call return seconds, while js uses ms */
                        result.lastSaved = UberUtility.createDateTimeString(result.timestamp /* in ms */);
                    }

                    if (_.has(data, 'required_content'))
                        result.content = _.first(data.required_content);

                    result.hide = false;

                    deferred.resolve(result);
                });

                return deferred.promise();
            });

            UberUtility.waitForAll(list).then(function (finished) {
                localSavedGames(_.compact(finished));
            });
        });
    };

    var fetchUbernetSaves = function () {

        if (!api.net.uberId())
            return;

        api.net.getReplays("Recent", api.net.uberId())
            .done(function (data) {
                try {
                    var list = decode(data);

                    list = _.map(list.Games, function (element) {
                        element.Info = decode(element.ReplayInfoJson);
                        delete element.ReplayInfoJson;
                        return element;
                    });

                    list = _.filter(list, function (element) {
                        return element.Info.save;
                    });

                    remoteSavedGames(_.map(list, function (element) {
                        var result = _.cloneDeep(baseSavedGame);
                        result.name = element.Info.save.name;
                        result.replayId = element.LobbyId;
                        result.remote = true;
                        result.hide = false;
                        if (_.has(element.Info, 'required_content'))
                            result.content = _.first(element.Info.required_content);
                        return result;
                    }));

                } catch (error) {
                    console.log('getReplays failed to decode');
                    console.log(data);
                }
            })
            .fail(function (data) {
                console.log('fetchUbernetSaves: failed');
                console.log(data);
            });
    };

    api.net.uberId.subscribe(fetchUbernetSaves);

    var abandonGalacticWarGame = null;

    var fetchGalacticWarSaves = function () {
        requireGW(['require', 'shared/gw_common'], function (require, GW) {

            var manifestLoadingRule = ko.computed(function () {
                if (!GW.manifest.ready())
                    return;

                var list = _.filter(GW.manifest.games(), function (game) { return game.state === GW.Game.gameStates.active; });

                galacticWarSavedGames(_.map(list, function (element) {
                    var result = _.cloneDeep(baseSavedGame);
                    result.name = element.name;
                    result.galacticWar = true;
                    result.galacticWarId = element.id;
                    result.hide = false;
                    if (_.isString(element.content))
                        result.content = element.content;

                    if (element.timestamp) {
                        result.lastSaved = UberUtility.createDateTimeString(element.timestamp /* in ms */);
                        result.timestamp = element.timestamp;
                    }

                    return result;
                }));
            });

            abandonGalacticWarGame = function (id) {
                GW.manifest.removeGameById(id);
                galacticWarSavedGames(_.reject(galacticWarSavedGames(), function (element) {
                    return element.galacticWarId === id;
                }));
            }

        });
    };

    fetchLocalSaves();
    fetchUbernetSaves();
    fetchGalacticWarSaves();

    var canLoadGame = function (game)
    {
        if (!game)
            return false;
        if (game.path)
            return true;
        if (game.replayId)
            return true;
        if (game.galacticWarId)
            return true;

        return false;
    };

    var loadGame = function (game) {

        var isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        var serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        var serverType = ko.observable().extend({ session: 'game_server_type' });
        var gameType = ko.observable().extend({ session: 'game_type' });

        // currently no way to know game type until loaded
        gameType(undefined);

        var selectedGamePath = game ? game.path : null;
        var selectedGameReplayId = game ? game.replayId : null;
        var selectedGameGalacticWarId = game ? game.galacticWarId : null;

        var contentQuery = '';
        if (game.content)
            contentQuery = '&' + $.param({'content': game.content});

        if (selectedGamePath) {
            isLocalGame(true);
            serverType('local');
            var mode = game.localReplay ? 'loadreplay' :'loadsave';
            serverSetup(mode);
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?action=start&mode=' + mode + '&loadpath=' + selectedGamePath + contentQuery;
            return; /* window.location.href will not stop execution. */
        }
        else if (selectedGameReplayId) {
            isLocalGame(false);
            serverType('uber');
            serverSetup('loadsave');
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?action=start&mode=loadsave&replayid=' + selectedGameReplayId + contentQuery;
            return; /* window.location.href will not stop execution. */
        }
        else if (selectedGameGalacticWarId) {
            var forward = ko.observable().extend({ local: 'gw_active_game' });
            forward(selectedGameGalacticWarId);
            window.location.href = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html';
            return; /* window.location.href will not stop execution. */
        }
    };

    var mostRecentGame = ko.computed(function () {
        var recent = savedGames()[0];

        // once we complete a game, we should hide the continue last game button.
        // however, Galactic Wars use a different system.  They will be filtered out when they are completed.
        var filter = !recent
                || (recent.timestamp < lastCompletedGameTimestamp() && !recent.galacticWar)
                || recent.localReplay
                || (recent.content || '') !== api.content.activeContent();

        return filter ? null : recent;
    });

    var canDeleteGame = function (game)
    {
        return canLoadGame(game) && !game.replayId;
    };

    var deleteGame = function (game) {
        var selectedGamePath = game ? game.path : null;
        var selectedGameReplayId = game ? game.replayId : null;
        var selectedGameGalacticWarId = game ? game.galacticWarId : null;

        if (selectedGameReplayId) {
            console.log('{{Error}} cannot delete PlayFab replays.  The will automatically expire after ~30 days.');
            return;
        }

        if (game === mostRecentGame())
            lastCompletedGameTimestamp(_.now());

        if (selectedGamePath) {
            api.file.deleteReplay(game.name);
            localSavedGames(_.reject(localSavedGames(), function (element) {
                return element.name === game.name;
            }));
            return;
        }
        else if (selectedGameGalacticWarId) {
            abandonGalacticWarGame(selectedGameGalacticWarId);
            return; /* window.location.href will not stop execution. */
        }
    };

    var loadMostRecentGame = function () {
        loadGame(mostRecentGame());
    };

    return {
        savedGames: savedGames,
        canLoadGame: canLoadGame,
        loadGame: loadGame,
        canDeleteGame: canDeleteGame,
        deleteGame: deleteGame,
        mostRecentGame: mostRecentGame,
        loadMostRecentGame: loadMostRecentGame
    }
}());

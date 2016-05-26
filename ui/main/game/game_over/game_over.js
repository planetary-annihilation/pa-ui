var model;
var handlers = {};

$(document).ready(function () {

    function parentInvoke() {
        api.Panel.message(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function MenuButtonModel(params) {
        var self = this;

        self.label = ko.observable(params.game_over);
        self.action = ko.observable(params.action);
        self.click = function() {
            parentInvoke(self.action());
        };
    }

    function GameOverViewModel() {
        var self = this;

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });

        self.state = ko.observable({});
        self.show = ko.computed(function() { return !!self.state().show; });
        self.gameOver = ko.computed(function() { return !!self.state().game_over; });
        self.autoShow = ko.computed(function() { return !!self.state().auto_show; });
        self.open = ko.computed(function() { return !!self.state().open; });
        self.record = ko.computed(function () { return !!self.state().record; });
        self.alwaysSpectating = ko.computed(function () { return !!self.state().always_spectating; });
        self.defeated = ko.computed(function () { return !!self.state().defeated; });

        self.draw = ko.observable(false);
        self.endOfTimeInSeconds = ko.observable(0);

        self.recordToken = ko.observable(0);
        self.recorded = ko.observable(false);

        self.hideDefeated = ko.observable(false);
        self.showDefeated = ko.computed(function () {
            if (self.hideDefeated())
                return false;

            return self.open() || (self.defeated() && !self.gameOver());
        });

        self.menuButtons = ko.observableArray();

        self.playerStats = ko.observable(/* {} */);
        self.victorStats = ko.observable(/* {} */);

        self.hasPlayerStats = ko.computed(function () {
            return !_.isEmpty(self.playerStats());
        });
        self.hasVictorStats = ko.computed(function () {
            return !_.isEmpty(self.victorStats());
        });

        self.showVictorStats = ko.observable(false);

        self.stats = ko.computed(function () {
            var show = self.showVictorStats(),
                player = self.playerStats(),
                victor = self.victorStats();

            return show ? victor : player;
        });

        self.displayName = ko.observable();
        self.armyIndex = ko.observable();

        self.game_over_msg = ko.observable('');

        self.defeatTime = ko.observable(0);
        self.defeated.subscribe(function (value) {
            if (value)
                self.defeatTime(_.now());
        });

        var hasPlayedWinLoseVO = false;

        self.victors = ko.observableArray([]);
        self.playerIsWinner = ko.observable(false);

        self.showPlayerDefeated = ko.computed(function () {
            return !self.showVictorStats() && self.defeated() && !self.playerIsWinner();
        });

        self.showAnnihilationComplete = ko.computed(function () {
            return self.showVictorStats() && !self.playerIsWinner();
        });

        self.teamGame = ko.observable(false);

        self.ranked = ko.observable(false);

        self.spectating = ko.computed(function () { return !self.defeated() && !self.playerIsWinner() });

        self.connected = ko.observable(false);

        self.formatedRateString = function (number, showSign) {
            var formats = [{ postfix: '', divisor: 1 },
                           { postfix: 'K', divisor: 1000 },
                           { postfix: 'M', divisor: 1000000 },
                           { postfix: 'G', divisor: 1000000000 },
                           { postfix: 'T', divisor: 1000000000000 }];

            number = Math.floor(number);
            if (number === 0)
                return '0';
            var numDigits = String(Math.abs(number)).length;
            var format = formats[Math.floor((numDigits - 1) / 3)];

            number = format.postfix ? (number / format.divisor).toFixed(1) : number / format.divisor;
            number = (number > 0) ? '+' + number + format.postfix : '' + number + format.postfix;
            return showSign ? number : number.slice(1);
        };

        self.league = ko.observable('unranked');
        self.getPlayerRank = function (gameType) {
            self.showLeagueLoading(true);
            self.league('unranked');

            engine.asyncCall('ubernet.getPlayerRating', gameType).done(function (data) {
                data = JSON.parse(data)
                api.debug.log('getPlayerRank succeded', data);
                self.league(data.Rating);
                self.showLeagueLoading(false);
            }).fail(function (data) {
                console.error('getPlayerRank failed', data);
                self.showLeagueLoading(false);
            });
        };

        self.showLeague = ko.computed(function () {
            if (self.ranked()) {
                return !self.spectating();
            }
            return false;
        });

        self.leagueLevel = ko.computed(function () {
            return MatchmakingUtility.getLevel(self.league());
        });
        self.leagueText = ko.computed(function () {
            return MatchmakingUtility.getTitle(self.league());
        });

        self.haveLeague = ko.computed(function () {
            return self.leagueLevel() > 0;
        });

        self.showLeagueLoading = ko.observable(true);

        var getSlotURL = function(slotRank) {
            var slotLevel = MatchmakingUtility.getLevel(slotRank);
            if (self.leagueLevel() == slotLevel)
                return MatchmakingUtility.getBadgeURL(slotRank);
            else if (self.leagueLevel() > slotLevel)
                return MatchmakingUtility.getDisabledBadgeURL(slotRank);
            else
                return MatchmakingUtility.getBadgeSlotURL();
        };

        self.league1Src = ko.computed(function () {
            return getSlotURL('rank_5');
        });
        self.league2Src = ko.computed(function () {
            return getSlotURL('rank_4');
        });
        self.league3Src = ko.computed(function () {
            return getSlotURL('rank_3');
        });
        self.league4Src = ko.computed(function () {
            return getSlotURL('rank_2');
        });
        self.league5Src = ko.computed(function () {
            return getSlotURL('rank_1');
        });

        self.navToMainMenu = function () {
            api.Panel.message(api.Panel.parentId, 'game_over.nav', {
                url: 'coui://ui/main/game/start/start.html',
                disconnect: true
            });
        };

        self.navToMatchMaking = function () {
            api.Panel.message(api.Panel.parentId, 'game_over.nav', {
                url: 'coui://ui/main/game/matchmaking/matchmaking.html',
                disconnect: true
            });
        };

        var hasPlayedNavVO = false;
        var hasClosedPanel = false;

        self.navToReview = function () {
            hasClosedPanel = true;
            api.Panel.message('players', 'set_pin_state', true);
            if (self.gameOver()) {
                if (!hasPlayedNavVO) {
                    api.audio.playSoundAtLocation('/VO/Computer/cronocam_on');
                    hasPlayedNavVO = true;
                }
            }
            else {
                if (!hasPlayedNavVO) {
                    api.audio.playSoundAtLocation('/VO/Computer/spectator_mode_enter');
                    hasPlayedNavVO = true;
                }
            }

            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['controlTime', true]);
            api.Panel.message(api.Panel.parentId, 'game_over.review');
            parentInvoke('signalShowGameOver', false);
        };

        self.navToReviewStats = function () {
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['setStatsPanelState', true]);
            api.Panel.message(api.Panel.parentId, 'game_over.review');
            parentInvoke('signalShowGameOver', false);
        };

        var hasShownWinnerStats = false;

        self.displayVictorStats = function () {
            hasShownWinnerStats = true;
            self.hideDefeated(true);
            self.showVictorStats(true);
        };

        self.recordResults = function() { /* should be called exactely once */
            self.recorded(true);
            if (!self.alwaysSpectating()) {
                var forward = ko.observable().extend({ local: 'last_completed_game_timestamp' });
                forward(_.now());

                api.tally.incStatInt('game_played');
                if (self.playerIsWinner()) {
                    api.tally.incStatInt('game_victory');

                    api.Panel.query('players', 'query.player_opponent_ratio')
                        .then(function (payload) {
                            var ratio = Number(payload);
                            if (ratio >= 3.0)
                                api.tally.incStatInt('game_win_outnumbered');
                        });

                }
                else if (self.defeated())
                    api.tally.incStatInt('game_loss');

                if (self.teamGame())
                    api.tally.incStatInt('team_games_completed');

                var processStats = function (payload) {
                    if (!payload)
                        return;

                    var metal_ratio = (payload.metal_produced - payload.metal_wasted) / payload.metal_produced;
                    var energy_ratio = (payload.energy_produced - payload.energy_wasted) / payload.energy_produced;

                    if (metal_ratio > 0.95 && energy_ratio > 0.95)
                        api.tally.incStatInt('game_efficient');
                }

                if (self.hasPlayerStats())
                    processStats(self.playerStats())
                else
                    api.Panel.query('gamestats', 'query.player_summary', [self.armyIndex()])
                        .then(processStats);
            }

            var gameTime = self.endOfTimeInSeconds();
            if (!self.spectating()) {

                api.tally.updateStatAvg('game_play_avg_time', gameTime, 1);
                if (self.playerIsWinner())
                    api.tally.updateStatAvg('game_victory_avg_time', gameTime, 1);
                else if (self.defeated())
                    api.tally.updateStatAvg('game_loss_avg_time', gameTime, 1);
            }

            api.Panel.query('options_bar', 'query.time_in_session')
                .then(function (payload) {
                    var time_in_seconds = Number(payload);
                    if (self.alwaysSpectating())
                        api.tally.incStatFloat('game_spectate_time', time_in_seconds);
                    else
                        api.tally.incStatFloat('game_play_time', time_in_seconds);
                });
        };

        var recordResultsRule = ko.computed(function() {
            var hasStats = self.hasPlayerStats();

            var show = self.show();
            var gameOver = self.gameOver();
            var open = self.open();
            var defeated = self.defeated();
            var record = self.record();
            var recorded = self.recorded();
            var spectating = self.alwaysSpectating();

            if (!hasStats && !spectating)
                return;

            if (record && !recorded) {
                var recordToken = self.recordToken() + 1;
                self.recordToken(recordToken);
                // Wait a bit before recording to give delayed results an opportunity to settle before recording
                _.delay(function() {
                    if (self.recordToken() !== recordToken)
                        return;
                    parentInvoke('recordGameOver', false);
                    self.recordResults();
                }, 1000);
            }
        });

        self.restart = ko.observable(false);

        var showWinnerStatsRule = ko.computed(function () {
            var game_over = self.gameOver(),
                winner = self.playerIsWinner(),
                show = self.show(),
                not_playing = game_over && !winner && !self.defeated(),
                victorStats = self.hasVictorStats(),
                restart = self.restart();

            if (restart || !victorStats || self.showVictorStats() || not_playing)
                return; 

            if (hasClosedPanel) 
                self.showVictorStats(true);      
        });

        self.hasSignaledDefeat = ko.observable(false);
        self.hasSignaledGameOver = ko.observable(false);

      
        self.restart.subscribe(function (value) {
            if (value) {
                self.showVictorStats(false);
                self.hasSignaledDefeat(false);
                self.hasSignaledGameOver(false);
                self.playerStats({});
                self.victorStats({});

                hasPlayedNavVO = false;
                hasClosedPanel = false;
                hasShownWinnerStats = false;

                parentInvoke('signalShowGameOver', false);
            }
        });

        /* controls visiblity. should be set from true to false just before the panel is revealed. */
        self.doFadeIn = ko.observable(false);

        self.triggerFadeIn = function () {
            self.doFadeIn(false);

            /* if you cycle the variable without the defer, the css animation will not trigger */
            _.defer(function () {
                self.doFadeIn(true);
            });     
        };

        self.readyToShow = ko.computed(function () {
            var player = self.hasPlayerStats(),
                victor = self.hasVictorStats(),
                showPlayer = !self.showVictorStats(),
                showVictor = self.showVictorStats(),
                draw = self.draw();

            return (player && showPlayer) || ((victor || draw) && showVictor);
        });

        self.showViewResultsButton = ko.computed(function () {
            var victor = self.hasVictorStats(),
                showPlayer = !self.showVictorStats(),
                draw = self.draw();
                
            return (victor || draw) && showPlayer;
        });

        var endGameVORule = ko.computed(function () {

            var defeated = self.showPlayerDefeated(),
                winner = self.playerIsWinner(),
                show = self.readyToShow();

            if (show && !hasPlayedWinLoseVO) {
                if (winner) {
                    _.delay(function () { api.audio.playSoundAtLocation('/VO/Computer/endgame_win') }, 1000);
                    hasPlayedWinLoseVO = true;
                }
                else if (defeated) {
                    _.delay(function () { api.audio.playSoundAtLocation('/VO/Computer/endgame_lose') }, 1000)
                    hasPlayedWinLoseVO = true;
                }
            }
        });

        var readyToShowRule = ko.computed(function () {
            var show = self.show(),
                gameOver = self.gameOver(),
                winner = self.playerIsWinner(),
                defeated = self.defeated(),
                spectating = self.alwaysSpectating(),
                player = self.hasPlayerStats(),
                victor = self.hasVictorStats(),
                draw = self.draw(),
                signaledDefeat = self.hasSignaledDefeat(),
                signaledGameOver = self.hasSignaledGameOver(),
                restart = self.restart();

            if (restart)
                return;

            if (signaledDefeat && signaledGameOver)
                return;

            if (spectating && signaledGameOver)
                return;

            var state = show && (defeated || gameOver);
            var data = (player && (!gameOver || winner || victor || draw))
                || (spectating && victor);

            if (state && data) {
                if (defeated)
                    self.hasSignaledDefeat(true);
                if (gameOver) {
                    self.hasSignaledDefeat(true);
                    self.hasSignaledGameOver(true);
                }

                if (spectating && victor)
                    self.showVictorStats(true);

                parentQuery('showGameOver').then(function (showing) {
                    if (showing) 
                        return;
                    
                    self.triggerFadeIn();
                    parentInvoke('signalShowGameOver', true);
                });
            }
        });

        var requestPlayerSummary = (function () {
            var pending = false;

            return function () {
                if (pending)
                    return;

                pending = true;

                var query_parameters = [self.armyIndex()];

                api.Panel.query('gamestats', 'query.player_summary', query_parameters)
                    .then(function (stats) {
                        pending = false;
                        if (stats) {
                            api.debug.log('requestPlayerSummary stats for: ' + self.armyIndex());
                            api.debug.log(stats);
                            self.playerStats(stats);
                        }
                        else
                            api.debug.log('bad requestPlayerSummary for: ' + self.armyIndex());
                    });
            };
        })();

        var requestVictorSummary = (function () {
            var pending = false;

            return function () {

                if (pending)
                    return;

                pending = true;

                api.Panel.query('gamestats', 'query.victors_summary', self.victors())
                       .then(function (stats) {
                           pending = false;
                           if (stats) {
                               api.debug.log('requestVictorSummary stats for: ' + JSON.stringify(self.victors()));
                               api.debug.log(stats);
                               self.victorStats(stats);

                               hasVictorStats = true;
                           }
                           else
                               api.debug.log('bad requestVictorSummary for: ' + JSON.stringify(self.victors()));
                       });
            };
        })();

        self.requestStatsRule = ko.computed(function () {
            var game_over = self.gameOver(),
                winner = self.playerIsWinner(),
                defeated = self.defeated(),
                not_playing = game_over && !winner && !defeated,
                victors = self.victors(),
                army_index = self.armyIndex(),
                restart = self.restart();

            if (restart)
                return;

            if (!self.hasPlayerStats() && !_.isUndefined(army_index))
                if (defeated || winner)
                    requestPlayerSummary();

            if (!self.playerIsWinner())
                if (!self.hasVictorStats() && !_.isEmpty(self.victors()) && game_over)
                    requestVictorSummary();
        });

        self.handlePlayerData = function (payload) {
            self.armyIndex(payload.army_index);
        }

        self.setup = function() {
            parentQuery('gameOverState').then(function(state) { self.state(state); });
            parentQuery('playerName').then(function(name) { self.displayName(name); });
            parentQuery('originalArmyIndex').then(function (value) { self.armyIndex(value); });
            parentQuery('playerData').then(self.handlePlayerData);

            parentQuery('menuConfig').then(function (menu) {
                var menuButtons = _.map(_.filter(menu, 'game_over'), function(button) {
                    return new MenuButtonModel(button);
                });
                self.menuButtons(menuButtons);
            });
        };
    }

    model = new GameOverViewModel();

    handlers.connection_disconnected = function() {
        model.connected(false);
    };

    handlers.server_state = function (msg) {
        if (!msg.state.endsWith('game_over'))
            return;

        var gameOverMsg;
        var gameOverText;
        var numWinners;

        if (msg.data)
        {
            model.connected(true);
            model.playerIsWinner(!!msg.data.client.winner);
            model.draw(false);

            gameOverMsg = msg.data.game_over;
            gameOverText = "";
            if (gameOverMsg && gameOverMsg.victor_name) {
                numWinners = gameOverMsg.victor_players.length;
                gameOverText = (numWinners > 1 ? loc("!LOC:Winners:") : loc("!LOC:Winner:")) + " ";
                if (numWinners) {
                    gameOverText += gameOverMsg.victor_players.join(", ");
                    model.victors(gameOverMsg.victor_players);
                }
                else {
                    gameOverText += gameOverMsg.victor_name;
                    model.victors([gameOverMsg.victor_name]);
                }
            }
            else {
                model.draw(true);
                gameOverText = loc("!LOC:Draw");
            }
            model.game_over_msg(gameOverText);
        }
    };

    handlers.state = function (payload) {
        model.state(payload);
        model.teamGame(payload.team);
        model.ranked(payload.ranked);
    };

    handlers.time = function (payload) {
        if (payload.view !== 0)
            return;
        model.endOfTimeInSeconds(payload.end_time);
    };

    handlers.rating_updated = function(payload) {
        api.debug.log("Server informed us of updated ratings, retrieving new ones and marking game as no longer relevant.", payload);
        model.getPlayerRank(payload.game_type);
        api.net.removePlayerFromGame();
    };

    handlers.player_stats = function (payload) {
        if (payload)
            model.playerStats(payload);
    };

    handlers.victor_stats = function (payload) {
        if (payload)
            model.victorStats(payload);
    };

    handlers.menu_config = function (payload) {

        var list = _.map(_.filter(payload, 'game_over'), function (button) {
            return new MenuButtonModel(button);
        });

        if (!_.isEmpty(list))
            model.menuButtons(list);
    };

    handlers.ready = function (payload) {
        var result = model.readyToShow();

        // panels should only check to see if the panel is ready right before they reveal it.
        // so we start the animation.
        if (result)
            model.triggerFadeIn();

        return result;
    };

    handlers.player_data = model.handlePlayerData;

    handlers.control_state = function (payload) {
        model.restart(payload.restart);
    }

    // inject per scene mods
    if (scene_mod_list['game_over'])
        loadMods(scene_mod_list['game_over']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();

    app.hello(handlers.server_state, handlers.connection_disconnected);
});

var model;

$(document).ready(function () {

    function MatchmakingViewModel() {
        var self = this;

        self.lobbyId = ko.observable('');
        self.isLocalGame = ko.observable(false).extend({ session: 'is_local_game' });
        self.gameTicket = ko.observable('').extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.connectionAttempts = ko.observable().extend({ session: 'connection_attempts' });
        self.connectionRetryDelaySeconds = ko.observable().extend({ session: 'connection_retry_delay_seconds' })

        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        self.gameType = ko.observable().extend({ session: 'game_type' });
        self.gameModIdentifiers = ko.observable().extend({ session: 'game_mod_identifiers' });

        self.currentTimeSeconds = UberUtility.getCurrentTimeObservable();

        self.uberId = self.uberId = api.net.uberId;
        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });
        self.matchMakingRegion = ko.computed(function() { return self.uberNetRegion() || 'USCentral'; });
        self.matchMakingType = ko.observable('1v1');

        self.stateArray = ['idle', 'connecting', 'queue', 'challenge', 'disconnecting', 'error', 'penalized', 'reconnect'];
        self.state = ko.observable(0);
        self.stateString = ko.computed(function () { return self.stateArray[self.state()]; });

        self.startedQueueTimeSeconds = ko.observable(null);
        self.state.subscribe(function() {
            if (self.state() !== 2)
                self.startedQueueTimeSeconds(null);
            else if (!self.startedQueueTimeSeconds())
                self.startedQueueTimeSeconds((new Date().getTime() / 1000) | 0);

            self.showWarning(false);

            self.readyChallengeAcceptEnabled(true);
        });

        self.timeInQueue = ko.computed(function() {
            var startTime = self.startedQueueTimeSeconds() | 0;
            var elapsed = self.currentTimeSeconds() - startTime;
            return (elapsed > 0 ? elapsed : 0);
        });

        self.queueTimeString = ko.computed(function () { return UberUtility.createTimeString(self.timeInQueue()); });

        self.info = ko.observable('');
        self.showWarning = ko.observable(false);
        self.warningInfo = ko.observable('');
        self.errorInfo = ko.observable('');

        self.readyChallengeTimeout = ko.observable(0);
        self.matchMakingStats = ko.observable({});
        self.readyChallengeStats = ko.observable({});
        self.readyChallengeAcceptEnabled = ko.observable(true);

        self.selfConfirmed = ko.observable(false);

        self.titleMessage = ko.computed(function () {
            function getString() {
                switch (self.stateString()) {
                    case 'idle': return '!LOC:idle'; break;
                    case 'connecting': return '!LOC:connecting to matchmaker'; break;
                    case 'queue': return '!LOC:searching for opponents'; break;
                    case 'challenge': return self.info(); break;
                    case 'disconnecting': return '!LOC:leaving queue'; break;
                    case 'error': case 'penalized': return self.info(); break;
                    case 'reconnect': return '!LOC:reconnect'; break;
                };
            };

            return loc(getString());
        });

        self.matchMakingPenaltyExpirationTime = ko.observable();
        self.matchMakingPenaltySecondsRemaining = ko.computed(function() {
                var expiration = self.matchMakingPenaltyExpirationTime() | 0;
                var remaining = expiration - self.currentTimeSeconds();
                if (remaining > 0)
                    return remaining;
                else
                    return 0;
        });

        self.showRequeueButton = ko.computed(function () {
            return self.stateString() === 'penalized' && self.matchMakingPenaltySecondsRemaining() <= 0;
        });

        self.formatTimeStringCoarse = function (seconds) {
            if (seconds < 15)
                return '15 sec';
            if (seconds < 30)
                return '30 sec';
            if (seconds < 60)
                return '1 min';

            return Math.ceil(seconds / 60) + ' min';
        };

        self.averageLaunchTime = ko.computed(function () {
            return !_.isEmpty(self.matchMakingStats()) ? self.formatTimeStringCoarse(self.matchMakingStats().AvgLaunchSeconds) : '--';
        });
        self.playersInQueue = ko.computed(function () {
            //subtract 1 from PlayersInQueue stat so that it is other players in queue.
            return !_.isEmpty(self.matchMakingStats()) ?
                        self.matchMakingStats().PlayersInQueue > 0 ? self.matchMakingStats().PlayersInQueue - 1 :
                        self.matchMakingStats().PlayersInQueue : '--';
        });


        self.challengeSelfStyle = ko.computed(function () {
            return self.selfConfirmed() ?
                'div-queue-status-player-status-img-ready' :
                'div-queue-status-player-status-img-pending';
        });
        self.challengeOtherStyle = ko.computed(function () {
            var confirmed = self.readyChallengeStats().Confirms | 0;
            var declined = self.readyChallengeStats().Declines | 0;

            if (self.readyChallengeStats().ClientConfirmed)
                confirmed--;

            if (confirmed > 0)
                return 'div-queue-status-player-status-img-ready';
            return declined > 0 ?
                'div-queue-status-player-status-img-cancel' :
                'div-queue-status-player-status-img-pending';
        });

        self.tickCountdown = function () {
            self.readyChallengeTimeout(self.readyChallengeTimeout() - 1);
            if (self.readyChallengeTimeout() > 0)
                _.delay(self.tickCountdown, 1000);
        };

        self.maybeUpdateCountdown = function (time) {
            //start coundown
            if (self.readyChallengeTimeout() === 0 && time > 1) {
                self.readyChallengeTimeout(Math.floor(time));
                _.delay(self.tickCountdown, 1000);
                return;
            }

            //we are behind
            if (self.readyChallengeTimeout() - time > 1)
                self.readyChallengeTimeout(Math.floor(time));
            //we are ahead
            else if (self.readyChallengeTimeout() - time < -1)
                self.readyChallengeTimeout(Math.floor(time));
        };

        self.showIdle = ko.computed(function () {
            return self.stateString() === 'idle';
        });
        self.showConnecting = ko.computed(function () {
            return self.stateString() === 'connecting';
        });
        self.showQueue = ko.computed(function () {
            return self.stateString() === 'queue';
        });
        self.showChallenge = ko.computed(function () {
            return self.stateString() === 'challenge';
        });
        self.showDisconnecting = ko.computed(function () {
            return self.stateString() === 'disconnecting';
        });
        self.showError = ko.computed(function () {
            return self.stateString() === 'error';
        });
        self.showPenalized = ko.computed(function () {
            return self.stateString() === 'penalized';
        });
        self.showReconnect = ko.computed(function () {
            return self.stateString() === 'reconnect';
        });
        self.titleStyle = ko.computed(function () {
            if (self.showError() || self.showPenalized())
                return "error";
            else if (self.showChallenge())
                return "challenge";
            return "";
        });


        self.showReadyChallenge = ko.computed(function () {
            //return self.stateString() === 'challenge' && !_.isEmpty(self.readyChallengeStats()) && !self.readyChallengeStats().ClientConfirmed;
            return self.stateString() === 'challenge';
        });

        self.showCancel = ko.computed(function () {
            return self.stateString() === 'idle' || model.stateString() === 'connecting' || model.stateString() === 'queue';
        });

        self.showBack = ko.computed(function () {
            return _.contains(['error', 'disconnecting', 'penalized'], self.stateString());
        });

        self.showRequeue = ko.computed(function () {
            return self.stateString() === 'penalized' && self.matchMakingPenaltySecondsRemaining() <= 0;
        });


        self.resetState = function () {
            self.state(0);
            self.matchMakingType('1v1');
            self.info('!LOC:beginning match making');
            self.showWarning(false);
            self.warningInfo('');
            self.errorInfo('');
            self.readyChallengeTimeout(0);
            self.matchMakingStats({});
            self.readyChallengeStats({});
        };

        self.matchMakingClose = function () {
            self.resetState();
            window.location.href = 'coui://ui/main/game/start/start.html';
            return;
        };

        self.joinGame = function (lobbyId) {
            api.net.joinGame({lobbyId: lobbyId}).done(function (data) {
                api.debug.log("Joining game", data);
                self.isLocalGame(false);
                self.serverType('uber');
                self.serverSetup('game');
                self.gameType('Ladder1v1');
                self.gameModIdentifiers(undefined);
                self.gameTicket(data.Ticket);
                self.gameHostname(data.ServerHostname);
                self.gamePort(data.ServerPort);
                self.connectionAttempts(3);
                self.connectionRetryDelaySeconds(3);

                window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?content=' + api.content.activeContent();
            }).fail(function (data) {
                console.error("Unable to join game", lobbyId, data);
                model.handleError({ title: '!LOC:Failed to Join', desc: '!LOC:Unable to connect to server.' });
            });
        };

        self.handleWarning = function (data) {
            self.showWarning(true);
            self.warningInfo(loc(data.desc));
        };

        self.handleError = function (data) {
            self.state(5); //error state
            self.errorInfo(loc(data.desc));
            self.info(data.title);
        };

        self.changeState = function (stateString, delay, onChange) {
            _.delay(function () {
                self.state(self.stateArray.indexOf(stateString));
                if (onChange)
                    onChange();
            }, delay ? delay : 0);
        };

        var matchMakingRequestFailHandler = function (data) {
            try {
                data = JSON.parse(data);
            } catch (e) { }
            if (data.ErrorCode === "Penalized") {
                if (data.ErrorDuration) {
                    var expiration_time = (new Date().getTime() / 1000 + data.ErrorDuration) | 0;
                    self.matchMakingPenaltyExpirationTime(expiration_time);
                    self.state(6); //penalized state
                    self.info('!LOC:Match Making Penalty');
                } else {
                    self.handleError({ title: '!LOC:Match Making Penalty', desc: '!LOC:You have been penalized for abandoning a game, please try matchmaking again when your penalty has expired.' });
                }
            } else {
                console.error('MM request failed:', data);
                self.handleError({ title: '!LOC:Match Making Error', desc: '!LOC:Failed to connect to match making server.' });
            }
        };

        self.matchMakingBegin = function () {
            engine.asyncCall('matchmaking.begin', self.uberId(), self.matchMakingRegion(), api.content.activeContent())
                .then(function (data) {
                    api.debug.log('MM Begin done:', data);
                })
                .fail(matchMakingRequestFailHandler);

            self.state(1); //connecting state
        }

        self.getGameWithPlayer = function () {
            engine.asyncCall("ubernet.getGameWithPlayer").done(function (data) {
                data = JSON.parse(data);
                api.debug.log("game with player:", data);
                if (data.PlayerInGame) {
                    self.lobbyId(data.LobbyID);
                    self.state(7); //reconnecting state
                }
                else
                    self.matchMakingBegin();
            });
        };

        self.abandon = function () {
            api.net.removePlayerFromGame();
            self.matchMakingBegin();
        }

        self.reconnect = function () {
            self.joinGame(self.lobbyId());
        }

        self.matchMakingEnd = function () {
            engine.asyncCall('matchmaking.end')
                .done(function (data) {
                    api.debug.log('MM End done: ', data);
                })
                .fail(matchMakingRequestFailHandler);

            self.info('!LOC:leaving match making');
            self.state(4); //disconnecting state
        }

        self.matchMakingAccept = function () {
            api.debug.log('calling matchmaking.confirm');
            self.readyChallengeAcceptEnabled(false);

            engine.asyncCall('matchmaking.confirm', self.readyChallengeStats().GameID)
                .done(function (data) {
                    api.debug.log('MM Accept done: ', data);
                })
                .fail(matchMakingRequestFailHandler);
        };

        self.matchMakingDecline = function () {
            api.debug.log('calling matchmaking.decline');

            engine.asyncCall('matchmaking.decline', self.readyChallengeStats().GameID)
                .done(function (data) {
                    api.debug.log('MM Decline done: ', data);
                })
                .fail(function (data) {
                    self.readyChallengeAcceptEnabled(true);
                    self.matchMakingRequestFailHandler(data);
                });
        };
    }
    model = new MatchmakingViewModel();

    handlers = {};

    handlers.matchmaking_message = function (data) {
        api.debug.log(data);

        switch (data.MessageCodeString) {
            case 'Added': /*This means you've successfully been added to the matchmaking queue.*/
                model.info('!LOC:searching for opponent');
                model.changeState('queue');
                break;
            case 'AddFailed': /*Your matchmaking.begin call failed to add you to the matchmaking queue*/
                model.handleError({ title: '!LOC:Match Making Error', desc: '!LOC:Failed to connect to match making server.' });
                break;
            case 'Removed': /*You asked to be removed from the queue, and you have.*/
                model.matchMakingClose();
                break;
            case 'KeepAlive': /*maintain connection. no action required*/
                break;
            case 'RegionStats': /*Information about the queue state.*/
                model.matchMakingStats(data.RegionStats);
                break;
            case 'ReadyChallenge': /*We've found a match, call matchmaking.confirm or matchmaking.decline to confirm readiness.*/
                model.readyChallengeStats(data);
                model.maybeUpdateCountdown(data.ChallengeTimeout);
                model.selfConfirmed(!!data.ClientConfirmed);
                model.info('!LOC:match found');

                //play sound if we just found a match
                if (model.stateString() != 'challenge')
                {
                    api.game.isWindowFocused().then(function(focused) {
                        if (focused)
                            api.audio.playSound('/SE/UI/UI_lobby_match_found_big');
                        else
                            api.audio.playSound('/SE/UI/UI_lobby_match_found_big_away');
                    });
                    api.game.outOfGameNotification(loc('!LOC:Matchmaking found a match!'));
                }

                model.changeState('challenge');
                break;
            case 'Confirmed': /*Your matchmaking.confirm was received*/
                model.selfConfirmed(true);
                break;
            case 'ConfirmFailed': /*Your confirm happened too late (timed out for AFK or someone else declined), and you're back in the queue*/
                model.handleError({ title: '!LOC:Match Making Error', desc: '!LOC:Your confirmation was not received in time.' });
                break;
            case 'Declined': /*Your decline was OK*/;
                model.matchMakingClose();
                break;
            case 'DeclineFailed': /*Your decline failed, game has gone away (maybe you timed out for AFK or someone else declined first.)*/;
                model.handleError({ title: '!LOC:Match Making Error', desc: '!LOC:Failed to connect to match making server.' });
                break;
            case 'CreateGameFailed': /* Everybody accepted, but we couldn't start the game.*/
                model.handleError({ title: '!LOC:Match Making Error', desc: '!LOC:Failed to create game.' });
                break;
            case 'GameAborted': /* Someone else timed out or declined, you're back in the queue.*/
                model.changeState('queue', 1000, function () {
                    model.handleWarning({ desc: '!LOC:One or more other players declined or the match expired.' });
                });
                break;
            case 'StartGame': /*connect to game*/
                model.info('!LOC:finding game server');
                _.delay(function () {
                    model.joinGame(data.LobbyID);
                }, 500);
                break;
            default: console.error('Unhandled MM message: ', data);
                break;
        }
    }

    handlers.matchmaking_error = function (data) {
        console.error(data.error);
    }

    // inject per scene mods
    if (scene_mod_list['matchmaking'])
        loadMods(scene_mod_list['matchmaking']);

    // Activates knockout.js
    ko.applyBindings(model);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    var skipGameCheck = ko.observable(false).extend({ session: 'matchmaking_skip_game_check' });
    if (skipGameCheck())
        model.matchMakingBegin();
    else
        model.getGameWithPlayer();
});

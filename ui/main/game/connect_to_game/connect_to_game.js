var model;

loadScript( 'coui://download/community-mods-connect_to_game.js');

$(document).ready(function () {

    var DEFAULT_CONNECTION_ATTEMPTS = 2;

    function ConnectViewModel() {
        var self = this;

        self.displayName = ko.observable().extend({ session: 'displayName' });
        self.uberId = ko.observable().extend({ session: 'uberId' });

        // deprecated and no longer used
        self.joinLocalServer = ko.observable().extend({ session: 'join_local_server' });
        //

        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.connectionAttemptsRemaining = 0;
        self.connectionRetryDelaySeconds = ko.observable(3).extend({ session: 'connection_retry_delay_seconds' })

        self.gameContent = ko.observable().extend({ session: 'game_content' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameType = ko.observable().extend({ session: 'game_type' });

        self.isPrivateGame = ko.observable().extend({ session: 'is_private_game' });
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.uuid = ko.observable('').extend({ session: 'invite_uuid' });

        self.clientData = ko.computed(function () {
            var result = {
                password: self.privateGamePassword(),
                uberid: self.uberId(),
                uuid: self.uuid()
            }
            return result;
        });

        self.gameModIdentifiers = ko.observable().extend({ session: 'game_mod_identifiers' });
        
        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });

        self.gameInfo = ko.computed( function() {
            var result = {
                uberId: self.uberId(),
                lobby_id: self.lobbyId(),
                content: self.gameContent(),
                uuid: self.uuid(),
                game_hostname: self.gameHostname(),
                game_port: self.gamePort(),
                game_password: self.privateGamePassword(),
                local_game: self.isLocalGame(),
                type: self.serverType(),
                setup: self.serverSetup(),
                game: self.gameType(),
                mods: self.gameModIdentifiers(),
                timestamp: Date.now()
// excludes ticket
            };
            return result;
        });

        self.pageTitle = ko.observable();
        self.pageSubTitle = ko.observable();

        self.fail = function(primary, secondary) {

            self.reconnectToGameInfo(false);

            // Input parameter.
            var connectFailDestination = ko.observable().extend({ session: 'last_scene_url' });

            // Output for transit.html
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            transitPrimaryMessage(primary);
            transitSecondaryMessage(secondary || loc("!LOC:Returning to Main Menu"));
            transitDestination(connectFailDestination() || 'coui://ui/main/game/start/start.html');
            transitDelay(5000);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return; /* window.location.href will not stop execution. */
        };

        self.connectToGame = function() {
            if (self.isLocalGame())
                self.pageTitle(loc("!LOC:CREATING WORLD SIMULATION"));
            else
                self.pageTitle(loc("!LOC:CONNECTING TO SERVER"));

            if (self.connectionAttemptsRemaining != DEFAULT_CONNECTION_ATTEMPTS)
                self.pageSubTitle(loc("!LOC:ATTEMPTS REMAINING: __num_attempts_remaining__", { num_attempts_remaining: self.connectionAttemptsRemaining }));
            else
                self.pageSubTitle('');
            self.connectionAttemptsRemaining--;
            return api.net.connect({
                host: self.gameHostname(),
                port: self.gamePort(),
                displayName: self.displayName() || 'Player',
                ticket: self.gameTicket(),
                clientData: self.clientData(),
                content: self.gameContent(),
            });
        };

        self.shouldRetry = function() {
            return (self.connectionAttemptsRemaining > 0);
        };

        self.retryConnection = function() {
            if (self.connectionRetryDelaySeconds())
                _.delay(self.connectToGame, self.connectionRetryDelaySeconds() * 1000);
            else
                self.connectToGame();
        };

        var localServerRecommended = ko.observable().extend({ session: 'local_server_recommended' });
        var offlineNotRecommendedDismissed = ko.observable(false).extend({ session: 'offline_not_recommended_warning_dismissed' });
        self.showOfflineNotRecommended = ko.pureComputed(function() { return self.isLocalGame() && !localServerRecommended() && !offlineNotRecommendedDismissed(); });
        self.dismissOfflineNotRecommended = function() { offlineNotRecommendedDismissed(true); };

        self.setup = function () {

            console.log('connect_to_game ' + window.location.search );
            api.debug.log( JSON.stringify(self.gameInfo()));

            api.Panel.message('uberbar', 'lobby_info', undefined);
            api.Panel.message('uberbar', 'lobby_status', '');

            var action = $.url().param('action');
            var mode = $.url().param('mode') || 'Config';
            var content = $.url().param('content') || '';
            var replayid = $.url().param('replayid');
            var local = $.url().param('local') === 'true';
            var params = $.url().param('params');
            var loadpath = $.url().param('loadpath');
            var loadtime = $.url().attr().fragment;

            var start = action === 'start';

            if (loadtime) {
                loadpath = loadpath + "#" + loadtime;
            }

            var connectionAttempts = ko.observable(DEFAULT_CONNECTION_ATTEMPTS).extend({ session: 'connection_attempts' });
            self.connectionAttemptsRemaining = connectionAttempts() | 0;
            connectionAttempts(DEFAULT_CONNECTION_ATTEMPTS);

            self.gameContent(content);

            // local parameter overrides
            if (local) {
                self.isLocalGame(true);
                self.serverType('local');
            }
            else if (start) {
                self.isLocalGame(false);
                self.serverType('uber');
            }

            var serverType = self.serverType();
            var gameType = self.gameType();
            
// server and game type should be set in all new builds with exception of old mods
// Ladder1v1 games are already joined
            var needsJoinGame = ( serverType && serverType == 'uber' && gameType != 'Ladder1v1' ) || ( ! serverType && ! local );
            
            if (mode && !_.isEmpty(self.gameContent()))
                mode = self.gameContent() + ':' + mode;
            
            if (start) {
                model.pageTitle(loc("!LOC:STARTING GAME"));
                self.uuid(UberUtility.createHexUUIDString());

                var region = local ? 'Local' : (self.uberNetRegion() || "USCentral");

                var startCall;

                if (replayid !== undefined)
                    startCall = api.net.startReplay(region, mode, replayid);
                else if (loadpath !== undefined)
                    startCall = api.net.loadSave(region, mode, loadpath);
                else
                    startCall = api.net.startGame(region, mode, params ? JSON.parse(params) : []);

                startCall.done(function(data) {
                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.lobbyId(data.LobbyID);
                    self.connectToGame();
                });
                startCall.fail(function(data) {
                    data = parse(data);
                    if (data && data.ErrorCode) {
                        switch (data.ErrorCode) {
                            case 200: { self.fail('Selected region is not valid', 'Please contact support'); } break; /* Message: InvalidRegion */
                            case 201: { self.fail('Region at capacity ', 'Please try again later'); } break; /* Message: RegionAtCapacity */
                            case 202: { self.fail('Server failed to start', 'Please contact support'); } break; /* Message: ServerFailedToStart */
                            default: self.fail('Unknown PlayFab error ' + data.Message + ' (#' + data.ErrorCode + ')', 'Please contact support');
                        }
                    }
                    else
                    {
                        if (replayid !== undefined)
                            self.fail(loc("!LOC:FAILED TO START REPLAY"));
                        else if (loadpath !== undefined)
                            self.fail(loc("!LOC:FAILED TO LOAD GAME"));
                        else
                            self.fail(loc("!LOC:FAILED TO START GAME"));
                    }
                });
            } else if ( ! needsJoinGame && self.gameHostname() && self.gamePort()) {
                self.connectToGame();
            } else if ( needsJoinGame && self.lobbyId()) {
                // uber servers must resolve via lobbyId to obtain ticket
                self.pageTitle(loc('!LOC:CONNECTING TO SERVER'));
                self.pageSubTitle(loc('!LOC:REQUESTING PERMISSION'));

                api.net.joinGame({lobbyId: self.lobbyId()}).done(function (data) {
                    self.isLocalGame(false);
                    self.gameTicket(data.Ticket);
                    self.gameHostname(data.ServerHostname);
                    self.gamePort(data.ServerPort);
                    self.connectToGame();
                }).fail(function (data) {
                    console.error("Unable to join game", self.lobbyId(), data);
                    self.fail(loc("!LOC:FAILED TO GET PERMISSION"));
                });
            }  else {
                console.error('failed to join game', self.gameHostname(), self.gamePort());
                self.fail(loc("!LOC:FAILED TO JOIN GAME"));
            }
        }
    }

    model = new ConnectViewModel();

    handlers = {};
    handlers.connection_failed = function (payload) {
        console.error('connection_failed');
        console.error(JSON.stringify(payload));
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:UNABLE TO ACCESS WORLD SIMULATION"));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER FAILED"));
        }
    };

    handlers.login_accepted = function (payload) {
        api.debug.log('login_accepted');
// set game info for invites and direct reconnects
        api.debug.log(JSON.stringify(_.omit(model.gameInfo(),'game_password')));

        var gameInfo = model.gameInfo();

        model.reconnectToGameInfo(gameInfo);

// can't invite to localhost, replays or resumed games
        if (gameInfo.game_hostname == 'localhost' || gameInfo.setup == 'replay' || gameInfo.setup == 'loadsave') {
            gameInfo = undefined;
        }

        api.Panel.message('uberbar', 'lobby_info', gameInfo);
        api.Panel.message('uberbar', 'lobby_status', '');

        if (model.isLocalGame())
            model.pageTitle(loc("!LOC:ACCESSING WORLD SIMULATION"));
        else
            model.pageTitle(loc('!LOC:LOGIN ACCEPTED'));
        model.pageSubTitle('');
        app.hello(handlers.server_state, handlers.connection_disconnected);
    };

    handlers.login_rejected = function (payload) {
        console.error('login_rejected');
        console.error(JSON.stringify(payload));
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc("!LOC:ACCESS TO WORLD SIMULATION DENIED"));
            else
                model.fail(loc("!LOC:LOGIN TO SERVER REJECTED"));
        }
    };

    handlers.server_state = function (payload) {
        if (payload.url && payload.url !== window.location.href) {
            window.location.href = payload.url;
            return; /* window.location.href will not stop execution. */
        }
    };

    handlers.connection_disconnected = function (payload) {
        console.error('disconnected');
        console.error(JSON.stringify(payload));
        if (model.shouldRetry())
            model.retryConnection();
        else
        {
            if (model.isLocalGame())
                model.fail(loc('!LOC:WORLD SIMULATION WENT AWAY'));
            else
                model.fail(loc("!LOC:CONNECTION TO SERVER LOST"));
        }
    };

    if ( window.CommunityMods ) {
        CommunityMods();
    }

    loadSceneMods('connect_to_game');

    // Activates knockout.js
    ko.applyBindings(model);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    model.setup();
});

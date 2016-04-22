var model;
var handlers = {};

loadScript( 'coui://download/community-mods-replay_loading.js');

$(document).ready(function () {

    function ReplayLoadingViewModel() {
        var self = this;

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });

        self.displayName = ko.observable().extend({ session: 'displayName' });

        self.replay_loading_msg = ko.observable().extend({ session: 'replay_loading_msg' });

        var forwardLoadGame = ko.observable().extend({ session: 'load_game' });
        self.loadGame = ko.observable(forwardLoadGame());
        forwardLoadGame(false);

        self.heartbeat = function () {
            model.send_message('heartbeat', {}, function (success, response) {
                if (!success)
                    api.debug.log('heartbeatFailed');
            });
        };
        self.heartbeatInterval = setInterval(self.heartbeat, 10000);

        self.clearHeartbeat = function () {
            if (self.heartbeatInterval !== undefined) {
                clearInterval(self.heartbeatInterval);
                self.heartbeatInterval = undefined;
            }
        }

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable(0).extend({ session: 'transit_delay' });

        self.navToMainMenu = function () {
            self.reconnectToGameInfo(undefined);
            self.disconnect();
            self.replay_loading_msg({});
            self.clearHeartbeat();
            self.config('');
            model.transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            model.transitSecondaryMessage('');
            model.transitDestination('coui://ui/main/game/start/start.html');
            model.transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return; /* window.location.href will not stop execution. */
        };

        /* should only exist for gw */
        self.config = ko.observable().extend({ memory: 'gw_battle_config' });

        self.connected = ko.observable(false);

        self.handleDisconnect = function()
        {
            self.reconnectToGameInfo(undefined);
            self.connected(false);

            var lastSceneUrl = ko.observable('coui://ui/main/game/start/start.html').extend({ session: 'last_scene_url' });
            var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
            var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
            var transitDestination = ko.observable().extend({ session: 'transit_destination' });
            var transitDelay = ko.observable().extend({ session: 'transit_delay' });

            transitDelay(5000);
            transitDestination(lastSceneUrl());
            if (self.loadGame())
                transitPrimaryMessage('!LOC:Unable to load save game');
            else
                transitPrimaryMessage('!LOC:Unable to load replay')
            transitSecondaryMessage('!LOC:Returning to menu');

            window.location.href = 'coui://ui/main/game/transit/transit.html';
        };

        self.setup = function () {
            model.send_message('heartbeat', {});
        };
    }
    model = new ReplayLoadingViewModel();


    handlers.login_rejected = function() {
        console.error("Login rejected from server");
        model.handleDisconnect();
    };

    handlers.connection_disconnected = function() {
        console.error("Login disconnected from server");
        model.handleDisconnect();
    };

    handlers.request_config = function() {
        model.sendConfig();
    };

    handlers.server_state = function (msg) {
        if (msg.url && msg.url !== window.location.href) {
            model.config('');
            model.clearHeartbeat();
            window.location.href = msg.url;
            return; /* window.location.href will not stop execution. */
        } else if (msg.data) {
            model.connected(true);
            model.replay_loading_msg(loc("!LOC:Starting replay server, please be patient..."));
        }
    };

    /* not really sure when this should be used, and I don't know what sv_ccl stands for. */
    handlers.mod_msg_sv_ccl_set_replay_config = function (msg) {
        if (msg.files) {
            var cookedFiles = _.mapValues(msg.files, function (value) {
                if (typeof value !== 'string')
                    return JSON.stringify(value);
                else
                    return value;
            });
            api.game.getUnitSpecTag().then(function (tag) {
                if (tag === '') {
                    api.file.unmountAllMemoryFiles().then* function() {
                        api.file.mountMemoryFiles(cookedFiles);
                        api.game.setUnitSpecTag('.player');
                    };
                }
                model.send_message('mod_msg_ccl_sv_replay_config_received', {}, function (success, response) {});
            });
        } else {
            model.send_message('mod_msg_ccl_sv_replay_config_received', {}, function (success, response) {});
        }
    }

    /* if you attempt to load a replay file (saves are replays) which contains mounted files,
       it will send this message and wait for a response */
    handlers.memory_files = function (msg) {
        /* the server is sending file overwrites. if we already have file overwrites,
           then we don't want to use the files, because the local files have higher priority */
        api.game.getUnitSpecTag().then(function (tag) {
            if (tag === '') {
                var cookedFiles = _.mapValues(msg, function (value) {
                    if (typeof value !== 'string')
                        return JSON.stringify(value);
                    else
                        return value;
                });

                api.file.unmountAllMemoryFiles().then( function() {
                    api.file.mountMemoryFiles(cookedFiles);
                    api.game.setUnitSpecTag('.player');
                });
            }
        });

        model.send_message('memory_files_received', {}, function (success, response) {});
    };

    if ( window.CommunityMods ) {
        CommunityMods();
    }

    // inject per scene mods
    loadSceneMods('replay_loading');

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();

    app.hello(handlers.server_state, handlers.connection_disconnected);
});

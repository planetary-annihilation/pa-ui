// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function OptionsBarViewModel() {
        var self = this;

        self.active = ko.observable(true);

        var minimum_interval = 750; /* in ms */
        var interlock = {};

        // Define pass-throughs to live_game
        _.forEach(
            [
                'toggleStreaming',
                'toggleMicrophone',
                'toggleSounds',
                'toggleCustomFormations',
                'togglePips',
                'toggleTimeControls',
                'toggleUberBar',
                'toggleMenu'
            ],
            function (fn) {
                interlock[fn] = true;

                self[fn] = function () {
                    if (!interlock[fn]) /* false indicates that the previous message has not been processed. */
                        return;

                    if (_.now() < (interlock[fn] + minimum_interval)) /* prevents double clicks from cancelling the previous invocation.  */
                        return;

                    interlock[fn] = false;
                    api.Panel.query(api.Panel.parentId, 'panel.invoke', [fn]).then(function (result) {
                        interlock[fn] = _.now();
                    });
                };
            }
        );

        self.state = ko.observable({});
        self.state.subscribe(function() {
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        });

        self.squelchGlobalChat = ko.observable(false).extend({ session: 'squelch_global_chat' });
        self.squelchGlobalChat.subscribe(function (value) {
            api.Panel.message('chat', 'set_squelch_global_chat', value);
        });
        self.squelchGlobalChatImage = ko.computed(function () {
            return self.squelchGlobalChat() ?
                'img/ingame_options_bar/global_chat_off.png' :
                'img/ingame_options_bar/global_chat_on.png';
        });

        self.customFormations = ko.computed(function() { return self.state().custom_formations; });
        self.customFormationsImage = ko.computed(function() {
            return self.customFormations() ?
                'img/ingame_options_bar/custom_formations_on.png' :
                'img/ingame_options_bar/custom_formations_off.png';
        });

        self.pip = ko.computed(function () { return self.state().pip; });
        self.pipImage = ko.computed(function () {
            return self.pip() ?
                'img/ingame_options_bar/pip_off.png' :
                'img/ingame_options_bar/pip_on.png';
        });

        self.uberBar = ko.computed(function() { return self.state().uber_bar; });
        self.uberBarImage = ko.computed(function() {
            return self.uberBar() ?
                'img/ingame_options_bar/uberbar_hide.png' :
                'img/ingame_options_bar/uberbar_show.png';
        });

        self.saving = ko.computed(function () { return self.state().saving; });

        self.endOfTimeInSeconds = ko.observable(0.0);
        self.earliestEndOfTimeInSeconds = ko.observable();
        self.endOfTimeString = ko.computed(function () {
            return UberUtility.createTimeString(self.endOfTimeInSeconds());
        });

        self.startCommandModePing = function () {
            api.Panel.message(api.Panel.parentId, 'action_bar.set_command_index', 13);
        };

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'query.options_state').then(self.state);
        };
    }
    model = new OptionsBarViewModel();

    handlers.time = function (payload) {
        if (payload.view !== 0)
            return;
        model.endOfTimeInSeconds(payload.end_time);
        if (_.isUndefined(model.earliestEndOfTimeInSeconds()))
            model.earliestEndOfTimeInSeconds(payload.end_time);
    };

    handlers['query.time_in_session'] = function () {
        return Number(model.endOfTimeInSeconds() - model.earliestEndOfTimeInSeconds());
    }

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_options_bar'])
        loadMods(scene_mod_list['live_game_options_bar']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

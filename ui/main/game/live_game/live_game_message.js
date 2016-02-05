// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function MessageViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.message = ko.computed(function() { return self.state().message || ''; });
        self.buttonLabel = ko.computed(function () { return self.state().button || ''; });
        self.helper = ko.computed(function () { return !!self.state().helper; });

        self.state.subscribe(function() {
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        });

        self.clickButton = function() {
            api.Panel.message(api.Panel.parentId, 'message.clickButton');
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
            parentQuery('messageState').then(self.state);
        };
    }
    model = new MessageViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_message'])
        loadMods(scene_mod_list['live_game_message']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

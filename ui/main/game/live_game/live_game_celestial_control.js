// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentInvoke() {
        api.Panel.message(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function CelestialControlViewModel() {
        var self = this;

        self.state = ko.observable({});

        self.cancel = function() {
            api.Panel.message(api.Panel.parentId, 'celestialControl.cancel');
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
            parentQuery('celestialControlState').then(self.state);
        };
    }
    model = new CelestialControlViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_celestial_control'])
        loadMods(scene_mod_list['live_game_celestial_control']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

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

    function PiPControlViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.alertMode = ko.computed(function() { return !!self.state().alert; });
        self.mirrorMode = ko.computed(function() { return !!self.state().mirror; });

        self.active = ko.observable(true);

        self.togglePips = function() { parentInvoke('togglePips'); };
        self.swapPips = function() { parentInvoke('swapPips'); };
        self.copyToPip = function() { parentInvoke('copyToPip'); };
        self.toggleAlertMode = function() { parentInvoke('togglePipAlertMode'); };
        self.toggleMirrorMode = function() { parentInvoke('togglePipMirrorMode'); };

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            parentQuery('pipState').then(self.state);
        };
    }
    model = new PiPControlViewModel();

    handlers.state = function(state) { model.state(state); }

    // inject per scene mods
    if (scene_mod_list['live_game_pip'])
        loadMods(scene_mod_list['live_game_pip']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

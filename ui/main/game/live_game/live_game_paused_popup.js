// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {
    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function setupFromParent(model, attributes) {
        _.forEach(attributes, function (element) {
            parentQuery(element).then(function (result) {
                model[element](result);
            });
        });
    }

    function GamePausedViewModel() {
        var self = this;

        self.paused = ko.observable(false);
        self.paused.subscribe(function (value) {
            if (!value) {
                self.restartComplete(false);
                self.saveComplete(false);
            }
        });

        self.ranked = ko.observable(false);
        self.restart = ko.observable(false);
        self.restartComplete = ko.observable(false);
        self.restart.subscribe(function (value) {
            if (value)
                self.restartComplete(true);
        });

        self.saving = ko.observable(false);
        self.saveComplete = ko.observable(false);
        self.saving.subscribe(function (value) {
            if (value)
                self.saveComplete(true);
        });

        self.normalComplete = ko.computed(function () {
            return !self.restartComplete() && !self.saveComplete();
        });

        self.normal = ko.computed(function () {
            return !self.restart() && !self.saving() && !self.ranked();
        });

        self.messageResume = function () {
            api.Panel.message(api.Panel.parentId, 'game_paused.resume');
        };

        self.messageShowGuide = function () {
            api.Panel.message(api.Panel.parentId, 'guide.show');
        };

        self.active = ko.observable(false);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function () { self.active(false); });

            setupFromParent(self, ['paused', 'ranked', 'restart', 'saving']);
        };
    }

    model = new GamePausedViewModel();

    handlers.ranked = function (payload) {
        model.ranked(payload);
    };

    handlers.control_state = function (payload) {
        model.paused(payload.paused);
        model.restart(payload.restart);
        model.saving(payload.saving);
    };


    // inject per scene mods
    if (scene_mod_list['live_game_paused_popup'])
        loadMods(scene_mod_list['live_game_paused_popup']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();
});

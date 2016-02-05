var model;
var handlers = {};

$(document).ready(function () {

    function SandboxViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.unitSpecs = ko.observable({});

        self.sandbox_expanded = ko.observable(false);

        self.pauseSim = function () { self.send_message('control_sim', { paused: true  }); };
        self.playSim =  function () { self.send_message('control_sim', { paused: false }); };

        self.sandbox_stepSim = function () { self.send_message('control_sim', { step: true }); };
        self.sandbox_units = ko.computed(function() {
            if (!self.sandbox_expanded())
                return [];
            var result = _.map(self.unitSpecs(), function(unit, spec) {
                return({
                    spec: spec,
                    icon: Build.iconForSpecId(spec),
                });
            });
            result.sort(function (a, b) { return a.spec < b.spec ? -1 : (a.spec > b.spec ? 1 : 0); });
            return result;
        });
        self.sandbox_unit_hover = ko.observable('');
        self.sandbox_copy_unit = function() {
            engine.call("unit.debug.setSpecId", self.sandbox_unit_hover());
        };
        self.toggleExpanded = function () { self.sandbox_expanded(!self.sandbox_expanded()); };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['sandboxState']).then(self.state);
        };
    }
    model = new SandboxViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    handlers.unit_specs = model.unitSpecs;

    // inject per scene mods
    if (scene_mod_list['live_game_sandbox'])
        loadMods(scene_mod_list['live_game_sandbox']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

var model;
var handlers = {};

$(document).ready(function () {
    
    function DevModeViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.cheatAllowChangeVision = ko.computed(function() { return !!self.state().cheatVision; });
        self.cheatAllowChangeControl = ko.computed(function() { return !!self.state().cheatControl; });
        self.players = ko.computed(function() { return self.state().players || []; });
        self.playerVisionFlags = ko.computed(function() { return self.state().vision || []; });
        self.playerControlFlags = ko.computed(function() { return self.state().control || []; });

        self.updatePlayerVisionFlag = function (index) {

            if (!self.cheatAllowChangeVision())
                return;

            var newFlags = self.playerVisionFlags().slice(0);
            newFlags[index] = !newFlags[index];

            // Tell the server
            self.send_message('change_vision_flags', { 'vision_flags': newFlags });
            
            // Tell the parent panel
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['playerVisionFlags', newFlags]);
        };
        
        self.updatePlayerControlFlag = function (index) {
            if (!self.cheatAllowChangeControl())
                return;
            
            var newControlFlags = _.times(self.players().length, _.constant(false));
            newControlFlags[index] = true;
            
            var newVisionFlags = self.playerVisionFlags().slice(0);
            newVisionFlags[index] = true;
            
            var clientControlFlags = _.map(newControlFlags, function(flag) { return flag ? 1 : 0; });
            var clientVisionFlags = _.map(newVisionFlags, function(flag) { return flag ? 1 : 0; });
            
            // Tell the server
            self.send_message('change_control_flags', { 'control_flags': newControlFlags });
            self.send_message('change_vision_flags', { 'vision_flags': newVisionFlags });


            // Tell the parent panel
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['playerControlFlags', newControlFlags]);
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['playerVisionFlags', newVisionFlags]);
        };

        self.active = ko.observable(true);
        
        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
            
            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['devModeState']).then(self.state);
        };
    }
    model = new DevModeViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_devmode'])
        loadMods(scene_mod_list['live_game_devmode']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

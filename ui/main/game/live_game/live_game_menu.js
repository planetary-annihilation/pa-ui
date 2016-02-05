// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function MenuViewModel() {
        var self = this;

        self.state = ko.observableArray([]);

        self.menuAction = function(action) {
            api.Panel.message(api.Panel.parentId, 'menu.action', action);
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() {
                // Note: Wait for a mouse move on active to avoid stale mouse positions.
                var activate = function() {
                    self.active(true);
                    $(window).off('mousemove', activate);
                };
                $(window).on('mousemove', activate);
            });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['menuConfig']).then(function(state) { self.state(state || []); });
        };
    }
    model = new MenuViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_menu'])
        loadMods(scene_mod_list['live_game_menu']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

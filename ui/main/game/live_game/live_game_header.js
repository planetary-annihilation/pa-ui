// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function HeaderViewModel() {
        var self = this;

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
        };
    }
    model = new HeaderViewModel();

    // inject per scene mods
    if (scene_mod_list['live_game_header'])
        loadMods(scene_mod_list['live_game_header']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

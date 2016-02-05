// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function FooterViewModel() {
        var self = this;

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
        };
    }
    model = new FooterViewModel();

    // inject per scene mods
    if (scene_mod_list['live_game_footer'])
        loadMods(scene_mod_list['live_game_footer']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

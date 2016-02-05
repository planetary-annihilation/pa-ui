var model;
var handlers;

$(document).ready(function () {

    function IconAtlasViewModel() {
        var self = this;

        self.specialIconSource = function (string) { return 'coui://ui/main/shared/img/icons/' + string + '.png' }
        self.specialIcons = ko.observableArray([
            'selection',
            'hover_target',
            'unit_health_bar_parts',
            'icons_command_move',
            'icons_command_move_special',
            'icons_command_patrol',
            'icons_command_attack',
            'icons_command_attack_move',
            'icons_command_reclaim',
            'icons_command_repair',
            'icons_command_assist',
            'icons_command_unload',
            'icons_command_attack_special',
            'icons_command_mass_teleport'
        ]);

        self.sendIconList = function () {
            var list = model.specialIcons();
            engine.call('handle_icon_list', list, 120);
        }
    }
    model = new IconAtlasViewModel();
    handlers = {};

    // inject per scene mods
    if (scene_mod_list['special_icon_atlas'])
        loadMods(scene_mod_list['special_icon_atlas']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.sendIconList();

});

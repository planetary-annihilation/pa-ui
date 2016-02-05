// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Super Weapon Tech enables nuclear missiles, metal planet controllers, and planetary engines to be built. An advanced fabricator is required to build super weapons.';
        },
        summarize: function(params) {
            return '!LOC:Super Weapon Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_super_weapon'
            }
        },
        getContext: function (galaxy) {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = 0;
            return { chance: chance };

        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/land/nuke_launcher/nuke_launcher.json',
                '/pa/units/orbital/delta_v_engine/delta_v_engine.json',
                '/pa/units/land/control_module/control_module.json',
            ]);
        },
        dull: function(inventory) {
        }
    };
});

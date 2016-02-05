// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Artillery Fabrication Tech reduces metal build costs of all artillery structures and mobile artillery units by 75%. Requires technology to build artillery structures and units.';
        },
        summarize: function(params) {
            return '!LOC:Artillery Fabrication Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_cost_reduction'
            }
        },
        getContext: function (galaxy) {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = 0;
            if( inventory.hasCard('gwc_enable_artillery') || inventory.hasCard('gwc_start_artillery') )
            {
                chance = 60;
            }

            return { chance: chance };
        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/land/artillery_short/artillery_short.json',
                '/pa/units/land/artillery_long/artillery_long.json',
                '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json'
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'build_metal_cost',
                    op: 'multiply',
                    value: 0.25
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

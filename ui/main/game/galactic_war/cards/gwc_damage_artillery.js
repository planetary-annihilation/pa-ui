// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their energy usage by 90%. Requires technology to build artillery structures and units.';
        },
        summarize: function(params) {
            return '!LOC:Artillery Ammunition Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_ammunition'
            }
        },
        getContext: function (galaxy) {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = 0;
            var dist = system.distance();
            if( inventory.hasCard('gwc_enable_artillery') || inventory.hasCard('gwc_start_artillery') )
                chance = 50;

            return { chance: chance };

        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/land/artillery_short/artillery_short_ammo.json',
                '/pa/units/land/artillery_long/artillery_long_ammo.json',
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'damage',
                    op: 'multiply',
                    value: 1.25
                });
                mods.push({
                    file: unit,
                    path: 'splash_damage',
                    op: 'multiply',
                    value: 1.25
                });
            };
            _.forEach(units, modUnit);
            var weaps = [
                '/pa/units/land/artillery_short/artillery_short_tool_weapon.json',
                '/pa/units/land/artillery_long/artillery_long_tool_weapon.json',
                '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json'
            ];
            var modWeap = function (weap) {
                mods.push({
                    file: weap,
                    path: 'ammo_capacity',
                    op: 'multiply',
                    value: 0.1
                });
                mods.push({
                    file: weap,
                    path: 'ammo_demand',
                    op: 'multiply',
                    value: 0.1
                });
                mods.push({
                    file: weap,
                    path: 'ammo_per_shot',
                    op: 'multiply',
                    value: 0.1
                });
            };
            _.forEach(weaps, modWeap);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

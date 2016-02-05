// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return "!LOC:Improved Energy Weapons tech reduces energy costs for energy based weapons by 75%";
        },
        summarize: function(params) {
            return '!LOC:Improved Energy Weapons';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_weapon_upgrade'
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
            var weaps = [
                '/pa/units/orbital/ion_defense/ion_defense_tool_weapon.json',
                '/pa/units/orbital/orbital_laser/orbital_laser_tool_weapon.json',
                '/pa/units/land/artillery_short/artillery_short_tool_weapon.json',
                '/pa/units/land/artillery_long/artillery_long_tool_weapon.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher_tool_weapon.json',
                '/pa/units/air/bomber/bomber_tool_weapon.json',
                '/pa/units/air/bomber_adv/bomber_adv_tool_weapon.json',
                '/pa/units/sea/missile_ship/missile_ship_tool_weapon.json',
                '/pa/tools/uber_cannon/uber_cannon.json'
            ];
            var mods = [];
            var modWeap = function (weap) {
                mods.push({
                    file: weap,
                    path: 'ammo_capacity',
                    op: 'multiply',
                    value: 0.25
                });
                mods.push({
                    file: weap,
                    path: 'ammo_demand',
                    op: 'multiply',
                    value: 0.25
                });
                mods.push({
                    file: weap,
                    path: 'ammo_per_shot',
                    op: 'multiply',
                    value: 0.25
                });
            };
            _.forEach(weaps, modWeap);
            
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

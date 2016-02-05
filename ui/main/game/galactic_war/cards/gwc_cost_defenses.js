// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Defense Fabrication Tech reduces metal build costs of all defensive structures by 50%';
        },
        summarize: function(params) {
            return '!LOC:Defense Fabrication Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png';
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
            var chance = 50;
            /*var dist = system.distance();
            if (dist > 0) {
                if (context.totalSize <= GW.balance.numberOfSystems[0]) {
                    chance = 100;
                    if (dist > 4)
                        chance = 50;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 100;
                    if (dist > 5)
                        chance = 50;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 100;
                    if (dist > 9)
                        chance = 50;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 28;
                    if (dist > 11)
                        chance = 50;
                }
                else {
                    chance = 28;
                    if (dist > 13)
                        chance = 50;
                }
            }*/

            return { chance: chance };
        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/land/land_barrier/land_barrier.json',
                '/pa/units/land/land_mine/land_mine.json',
                '/pa/units/land/air_defense/air_defense.json',
                '/pa/units/land/laser_defense_single/laser_defense_single.json',
                '/pa/units/land/laser_defense/laser_defense.json',
                '/pa/units/land/air_defense_adv/air_defense_adv.json',
                '/pa/units/land/laser_defense_adv/laser_defense_adv.json',
                '/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json',
                '/pa/units/sea/torpedo_launcher/torpedo_launcher.json',
                '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json',
                '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
                '/pa/units/orbital/ion_defense/ion_defense.json',
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'build_metal_cost',
                    op: 'multiply',
                    value: 0.5
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

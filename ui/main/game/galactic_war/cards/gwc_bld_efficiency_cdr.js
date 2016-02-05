// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return "!LOC:Improved Commander Build Arms increase build speed of all Commanders' build arms by 50% and reduces energy usage by 50%.";
        },
        summarize: function(params) {
            return '!LOC:Improved Commander Build Arm';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_efficiency'
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
            if (dist > 0) {
                if (context.totalSize <= GW.balance.numberOfSystems[0]) {
                    chance = 50;
                    if (dist > 2)
                        chance = 500;
                    else if (dist > 4)
                        chance = 250;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 50;
                    if (dist > 3)
                        chance = 500;
                    else if (dist > 6)
                        chance = 250;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 50;
                    if (dist > 5)
                        chance = 500;
                    else if (dist > 9)
                        chance = 250;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 50;
                    if (dist > 6)
                        chance = 500;
                    else if (dist > 10)
                        chance = 250;
                }
                else {
                    chance = 50;
                    if (dist > 7)
                        chance = 500;
                    else if (dist > 12)
                        chance = 250;
                }
            }
            return { chance: chance };
        },
        buff: function (inventory, params) {
            var units = [
                '/pa/tools/commander_build_arm/commander_build_arm.json'
            ];
            var mods = [];
            var modUnit = function (unit) {
                mods.push({
                    file: unit,
                    path: 'construction_demand.energy',
                    op: 'multiply',
                    value: 0.5
                });
                mods.push({
                    file: unit,
                    path: 'construction_demand.metal',
                    op: 'multiply',
                    value: 1.5
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

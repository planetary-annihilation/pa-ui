// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Commander Engine Tech increases the speed of your commanders by 100%.';
        },
        summarize: function(params) {
            return '!LOC:Commander Engine Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_speed.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_speed'
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
                    chance = 16;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 16;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 32;
                    if (dist > 6)
                        chance = 166;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 32;
                    if (dist > 9)
                        chance = 166;
                }
                else {
                    chance = 32;
                    if (dist > 12)
                        chance = 166;
                }
            }
            return { chance: chance };
        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/commanders/base_commander/base_commander.json',
            ];
            var mods = [];
            var modUnit = function (unit) {
                mods.push({
                    file: unit,
                    path: 'navigation.move_speed',
                    op: 'multiply',
                    value: 2
                });
                mods.push({
                    file: unit,
                    path: 'navigation.brake',
                    op: 'multiply',
                    value: 2
                });
                mods.push({
                    file: unit,
                    path: 'navigation.acceleration',
                    op: 'multiply',
                    value: 2
                });
                mods.push({
                    file: unit,
                    path: 'navigation.turn_speed',
                    op: 'multiply',
                    value: 2
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

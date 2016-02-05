// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Metal and energy storage on all commanders and storage structures increased by 300%. Adds in blueprints for storage structures.';
        },
        summarize: function(params) {
            return '!LOC:Storage Compression Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_economy'
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
                    chance = 500;
                    if (dist > 4)
                        chance = 250;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 75;
                    if (dist > 6)
                        chance = 50;
                } 
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 500;
                    if (dist > 9)
                        chance = 250;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 500;
                    if (dist > 10)
                        chance = 250;
                }
                else {
                    chance = 500;
                    if (dist > 12)
                        chance = 250;
                }
            }
            return { chance: chance };
        },
        buff: function(inventory, params) {
            // This is an example of how to use duplicated specs.  This would 
            // only be necessary if the build arms were being shared, which they
            // currently are not.
//            var units = [
//                '/pa/units/land/fabrication_bot/fabrication_bot.json',
//                '/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json',
//                '/pa/units/land/fabrication_vehicle/fabrication_vehicle.json',
//                '/pa/air/fabrication_aircraft/fabrication_aircraft.json',
//                '/pa/sea/fabrication_ship/fabrication_ship.json',
//            ];
//            var mods = [];
//            var modUnit = function(unit) {
//                var newBuildArm = unit + '.' + params.id + '.build_arm.' + (inventory.mods().length + mods.length).toString();
//                mods = mods.concat([{
//                    file: unit,
//                    path: 'tools.0.spec_id',
//                    op: 'clone',
//                    value: newBuildArm
//                }, {
//                    file: newBuildArm,
//                    path: 'construction_demand.energy',
//                    op: 'multiply',
//                    value: params.multiplier
//                }, {
//                    file: unit,
//                    path: 'tools.0.spec_id',
//                    op: 'replace',
//                    value: newBuildArm
//                }, {
//                    file: unit,
//                    path: 'tools.0.spec_id',
//                    op: 'tag',
//                    value: ''
//                }]);
            //            };
            inventory.addUnits([
                '/pa/units/land/metal_storage/metal_storage.json',
                '/pa/units/land/energy_storage/energy_storage.json'
            ]);
            var units = [
                '/pa/units/commanders/base_commander/base_commander.json',
                '/pa/units/land/metal_storage/metal_storage.json',
                '/pa/units/land/energy_storage/energy_storage.json',
                '/pa/units/orbital/mining_platform/mining_platform.json'
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'storage.energy',
                    op: 'multiply',
                    value: 4.0
                });
                mods.push({
                    file: unit,
                    path: 'storage.metal',
                    op: 'multiply',
                    value: 4.0
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

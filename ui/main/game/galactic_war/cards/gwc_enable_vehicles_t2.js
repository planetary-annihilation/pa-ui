// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Advanced Vehicle tech enables building of vehicles and vehicle factories. Advanced vehicle Factories are built by a basic or advanced vehicle fabricator. Also enables the Basic Vehicle Factory and the Basic Vehicle Fabricator.';
        },
        summarize: function(params) {
            return '!LOC:Advanced Vehicle Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_vehicle'
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
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 50;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 250;
                    if (dist > 5)
                        chance = 62;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 250;
                    if (dist > 6)
                        chance = 62;
                }
                else {
                    chance = 250;
                    if (dist > 7)
                        chance = 62;
                }
            }
            return { chance: chance };

        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json',
                '/pa/units/land/vehicle_factory/vehicle_factory.json',
            ]);
        },
        dull: function(inventory) {
        }
    };
});

// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Basic Vehicle tech enables building of basic vehicle and basic vehicle factories. Basic vehicle factories are built via your commander or any basic fabricator.';
        },
        summarize: function(params) {
            return '!LOC:Basic Vehicle Tech';
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
            var chanceMod = 1;
            if( inventory.hasCard('gwc_enable_vehicles_all') || inventory.hasCard('gwc_start_vehicle') || inventory.hasCard('gwc_start_allfactory') )
            {
                chanceMod = 0;
            }
            if (dist > 0) {
                if (context.totalSize <= GW.balance.numberOfSystems[0]) {
                    chance = 250;
                    if (dist > 2)
                        chance = 100;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
                    chance = 250;
                    if (dist > 3)
                        chance = 100;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
                    chance = 250;
                    if (dist > 4)
                        chance = 100;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 250;
                    if (dist > 5)
                        chance = 100;
                }
                else {
                    chance = 250;
                    if (dist > 6)
                        chance = 100;
                }
            }
            chance *= chanceMod;
            return { chance: chance };

        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/land/vehicle_factory/vehicle_factory.json',
                '/pa/units/land/tank_light_laser/tank_light_laser.json',
                '/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json',
                '/pa/units/land/tank_armor/tank_armor.json',
                '/pa/units/land/tank_hover/tank_hover.json'
            ]);
        },
        dull: function(inventory) {
        }
    };
});

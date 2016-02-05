// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function (params) { return true; },
        describe: function (params) {
            return '!LOC:Advanced Naval Tech enables building of the Advanced Naval Factory and advanced naval units. Advanced Naval Factories are built via your Advanced Naval Fabricators.';
        },
        summarize: function (params) {
            return '!LOC:Advanced Naval Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_sea'
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
                    chance = 181;
                    if (dist > 5)
                        chance = 45;
                }
                else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
                    chance = 181;
                    if (dist > 6)
                        chance = 45;
                }
                else {
                    chance = 181;
                    if (dist > 7)
                        chance = 45;
                }
            }
            return { chance: chance };
        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/sea/naval_factory_adv/naval_factory_adv.json',
            ]);
        },
        dull: function(inventory) {
        }
    };
});

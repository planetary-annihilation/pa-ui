// !LOCNS:galactic_war
define([
    'module',
    'shared/gw_common',
    'cards/gwc_start'
], function (
    module,
    GW,
    GWCStart
) {
    var CARD = { id: /[^\/]+$/.exec(module.id).pop() };

    return {
        visible: function (params) { return false; },
        summarize: function (params) {
            return '!LOC:Education Commander';
        },
        icon: function (params) {
            return 'coui://ui/main/game/galactic_war/shared/img/red-commander.png';
        },
        describe: function (params) { return '!LOC:The Education Commander will help you understand the control interfaces to destroy your enemies.'; },
        hint: function () {
            return {
                icon: 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png',
                description: '!LOC:The Education Commander will help you understand the control interfaces to destroy your enemies.'
            };
        },
        deal: function (system) {
            return {
                params: {
                    allowOverflow: true
                },
                chance: 0
            };
        },
        buff: function (inventory) {
            if (inventory.lookupCard(CARD) === 0) {
                // Make sure we only do the start buff/dull once
                var buffCount = inventory.getTag('', 'buffCount', 0);
                inventory.maxCards(inventory.maxCards() + 3);
                var commander = inventory.getTag('global', 'commander');
                commander && inventory.addUnits([commander]);

                if (!buffCount) {
                    inventory.addUnits([
                        '/pa/units/land/vehicle_factory/vehicle_factory.json',
                        '/pa/units/land/energy_plant/energy_plant.json',
                        '/pa/units/land/metal_extractor/metal_extractor.json',
                        '/pa/units/land/tank_light_laser/tank_light_laser.json',
                        '/pa/units/land/titan_bot/titan_bot.json',
                    ]);
                    var units = [
                        '/pa/units/land/vehicle_factory/vehicle_factory.json',
                        '/pa/units/land/energy_plant/energy_plant.json',
                        '/pa/units/land/metal_extractor/metal_extractor.json',
                        '/pa/units/land/tank_light_laser/tank_light_laser.json',
                        '/pa/units/land/titan_bot/titan_bot.json'
                    ];
                    var mods = [];
                    var modUnit = function (unit) {
                        mods.push({
                            file: unit,
                            path: 'build_metal_cost',
                            op: 'multiply',
                            value: 0.25
                        });
                    };
                    _.forEach(units, modUnit);
                    inventory.addMods(mods);
                }
                else {
                    // Don't clog up a slot.
                    inventory.maxCards(inventory.maxCards() + 1);
                }
                ++buffCount;
                inventory.setTag('', 'buffCount', buffCount);
            }
            else {
                // Don't clog up a slot.
                inventory.maxCards(inventory.maxCards() + 1);
                GW.bank.addStartCard(CARD);
            }
        },
        dull: function (inventory) {
            if (inventory.lookupCard(CARD) === 0) {
                var buffCount = inventory.getTag('', 'buffCount', 0);
                if (buffCount) {
                    // Perform dulls here

                    inventory.setTag('', 'buffCount', undefined);
                }
            }
        }
    };
});

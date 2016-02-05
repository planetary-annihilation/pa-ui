// !LOCNS:galactic_war
define([
    'module',
    'shared/gw_common',
    'cards/gwc_start',
    'cards/gwc_storage_and_buff'
], function(
    module,
    GW,
    GWCStart,
    GWCStorage
) {
    var CARD = {id: /[^\/]+$/.exec(module.id).pop() };
    
    return {
        visible: function(params) { return false; },
        summarize: function(params) {
            return '!LOC:Storage Commander';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/shared/img/red-commander.png';
        },
        describe: function (params) { return '!LOC:Trades flame tanks for storage'; },
        deal: function(system) { 
            return {
                params: {
                    allowOverflow: true
                },
                chance: 0
            };
        },
        buff: function(inventory) {
            if (inventory.lookupCard(CARD) === 0) {
                // Make sure we only do the start buff/dull once
                var buffCount = inventory.getTag('', 'buffCount', 0);
                if (!buffCount) {
                    GWCStart.buff(inventory);
                    GWCStorage.buff(inventory);
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
        dull: function(inventory) {
            if (inventory.lookupCard(CARD) === 0) {
                var buffCount = inventory.getTag('', 'buffCount', 0);
                if (buffCount) {
                    // Perform dulls here
                    inventory.removeUnits([
                        '/pa/units/land/tank_armor/tank_armor.json',
                        '/pa/units/land/tank_heavy_armor/tank_heavy_armor.json'
                    ]);
                    
                    inventory.setTag('', 'buffCount', undefined);
                }
            }
        }
    };
});

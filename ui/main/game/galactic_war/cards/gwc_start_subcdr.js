// !LOCNS:galactic_war
define([
    'module',
    'shared/gw_common',
    'shared/gw_factions',
    'cards/gwc_start',
], function (
    module,
    GW,
    GWFactions,
    GWCStart
) {
    var CARD = { id: /[^\/]+$/.exec(module.id).pop() };

    return {
        visible: function (params) { return false; },
        summarize: function (params) {
            return '!LOC:General Commander';
        },
        icon: function (params) {
            return 'coui://ui/main/game/galactic_war/shared/img/red-commander.png';
        },
        describe: function (params) { return '!LOC:The General Commander loadout contains very limited mobile forces and only two data banks. However, the loadout comes with two Sub Commanders that accompany you into each battle.'; },
        hint: function () {
            return {
                icon: 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png',
                description: '!LOC:Seek out First Seeker Osiris on Xianyao. There you will find the loadout your friends desire.'
            };
        },
        getContext: function (galaxy, inventory) {
            return {
                faction: inventory.getTag('global', 'playerFaction') || 0
            };
        },
        deal: function (system, context, inventory) {
            var minions = _.shuffle(GWFactions[context.faction].minions.slice(0));
            return {
                params: {
                    minions: minions.slice(0, 2),
                    allowOverflow: true
                },
                chance: 0
            };
        },
        buff: function (inventory, context) {
            if (inventory.lookupCard(CARD) === 0) {
                // Make sure we only do the start buff/dull once
                var buffCount = inventory.getTag('', 'buffCount', 0);
                if (!buffCount) {
                    GWCStart.buff(inventory);
                    inventory.maxCards(inventory.maxCards() - 1);
                    inventory.addUnits([
                        '/pa/units/land/vehicle_factory/vehicle_factory.json',
                        '/pa/units/land/tank_light_laser/tank_light_laser.json'
                    ]);
                    _.forEach(context.minions, function(minion) {
                        inventory.minions.push(minion);
                    });
                    var minionSpecs = _.filter(_.pluck(context.minions, 'commander'));
                    inventory.addUnits(minionSpecs);
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

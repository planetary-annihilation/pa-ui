// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return false; }, // Can't discard this card
        describe: function(params) { 
            return '!LOC:Adds a new slot for another technology.';
        },
        summarize: function(params) {
            return '!LOC:Additional Data Bank';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_slot_increased'
            }
        },
        getContext: function (galaxy) {
            return {
                chance: 300,
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = system.distance() > 0 ? context.chance : 0;
            if( inventory.handIsFull() )
                chance = 1000;

            return {
                params: {
                    allowOverflow: true,
                    unique: Math.random()
                },
                chance: chance
            };
        },
        buff: function(inventory, params) {
            inventory.maxCards(inventory.maxCards() + 2); // Note: One for us, and one for an extra.
        },
        dull: function(inventory) {
        },
        keep: function (params, context) {
            //api.debug.log("SLOT KEEP");
            context.chance = 100;
        },
        discard: function (params, context) {
            context.chance *= Math.log(context.totalSize) * 0.4;
            //context.chance *= (context.totalSize / 16);
            //api.debug.log("discard: chance: " + context.chance);
        }
    };
});

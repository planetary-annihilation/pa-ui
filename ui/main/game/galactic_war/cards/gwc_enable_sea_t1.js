// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function (params) { return true; },
        describe: function (params) {
            return '!LOC:Basic Naval Tech enables building of the basic naval factory and basic naval units. Basic naval factories are built via your commander or any fabricator.';
        },
        summarize: function (params) {
            return '!LOC:Basic Naval Tech';
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
            return { chance: chance };
        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/sea/naval_factory/naval_factory.json',
            ]);
        },
        dull: function(inventory) {
        }
    };
});

// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Naval Armor Tech increases health of all naval units by 50%';
        },
        summarize: function(params) {
            return '!LOC:Naval Armor Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_armor'
            }
        },
        getContext: function (galaxy) {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = 0;
            chance = 35;
            return { chance: chance };

        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/sea/fabrication_ship/fabrication_ship.json',
                '/pa/units/sea/frigate/frigate.json',
                '/pa/units/sea/destroyer/destroyer.json',
                '/pa/units/sea/sea_scout/sea_scout.json',
                '/pa/units/sea/attack_sub/attack_sub.json',
                '/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json',
                '/pa/units/sea/missile_ship/missile_ship.json',
                '/pa/units/sea/battleship/battleship.json',
                '/pa/units/sea/nuclear_sub/nuclear_sub.json',
                '/pa/units/sea/fabrication_barge/fabrication_barge.json',
                '/pa/units/sea/hover_ship/hover_ship.json',
                '/pa/units/sea/drone_carrier/carrier/carrier.json',
                '/pa/units/sea/drone_carrier/drone/drone.json'
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'max_health',
                    op: 'multiply',
                    value: 1.5
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

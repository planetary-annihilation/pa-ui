// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Naval Ammunition Tech increases the damage of all naval vessels by 25%';
        },
        summarize: function(params) {
            return '!LOC:Naval Ammunition Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_ammunition'
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
            chance = 35;

            return { chance: chance };
        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/sea/frigate/frigate_ammo_shell.json',
                '/pa/units/sea/frigate/frigate_ammo_aa.json',
                '/pa/units/sea/destroyer/destroyer_ammo.json',
                '/pa/units/sea/destroyer/destroyer_torpedo_ammo.json',
                '/pa/units/sea/sea_scout/sea_scout_ammo.json',
                '/pa/units/sea/attack_sub/attack_sub_ammo.json',
                '/pa/units/sea/missile_ship/missile_ship_aa_ammo.json',
                '/pa/units/sea/missile_ship/missile_ship_ammo.json',
                '/pa/units/sea/battleship/battleship_ammo.json',
                '/pa/units/sea/nuclear_sub/nuclear_sub_ammo.json',
                '/pa/units/sea/nuclear_sub/nuclear_sub_ammo_missile.json',
                '/pa/units/sea/battleship/battleship_ammo.json',
                '/pa/units/sea/hover_ship/hover_ship_ammo.json',
                '/pa/units/sea/hover_ship/hover_ship_ammo_side.json',
                '/pa/units/sea/drone_carrier/drone/drone_ammo.json'
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'damage',
                    op: 'multiply',
                    value: 1.25
                });
            };
            _.forEach(units, modUnit);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

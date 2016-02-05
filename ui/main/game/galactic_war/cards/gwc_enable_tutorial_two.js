// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return 'Orbital blueprints restored. You can now build orbital units and structures, including planetary motion engines.';
        },
        summarize: function(params) {
            return 'Orbital Blueprint Library';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_orbital'
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
                '/pa/units/orbital/orbital_lander/orbital_lander.json',
                '/pa/units/orbital/orbital_launcher/orbital_launcher.json',
                '/pa/units/orbital/delta_v_engine/delta_v_engine.json',
                '/pa/units/land/teleporter/teleporter.json',
                '/pa/units/sea/naval_factory/naval_factory.json',
                '/pa/units/sea/fabrication_ship/fabrication_ship.json',
                '/pa/units/sea/frigate/frigate.json',
                '/pa/units/sea/destroyer/destroyer.json',
                '/pa/units/sea/sea_scout/sea_scout.json',
                '/pa/units/sea/attack_sub/attack_sub.json',
                '/pa/units/sea/fabrication_barge/fabrication_barge.json',
                '/pa/units/sea/naval_factory_adv/naval_factory_adv.json',
                '/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json',
                '/pa/units/sea/missile_ship/missile_ship.json',
                '/pa/units/sea/battleship/battleship.json',
                '/pa/units/sea/nuclear_sub/nuclear_sub.json',
                '/pa/units/sea/hover_ship/hover_ship.json',
                '/pa/units/sea/drone_carrier/carrier/carrier.json',
            ]);
            var units = [
                '/pa/units/orbital/orbital_lander/orbital_lander.json',
                '/pa/units/orbital/orbital_launcher/orbital_launcher.json',
                '/pa/units/orbital/delta_v_engine/delta_v_engine.json',
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

        },
        dull: function(inventory) {
        }
    };
});

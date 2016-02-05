// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Air Combat Tech increases the speed of all air units by 25%, health by 50%, and damage by 25%';
        },
        summarize: function(params) {
            return '!LOC:Air Combat Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png';
        },
        audio: function (parms) {
            return {
                found: 'PA/VO/Computer/gw/board_tech_available_combat'
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
            if( inventory.hasCard('gwc_enable_air_t1') || inventory.hasCard('gwc_enable_air_all') || inventory.hasCard('gwc_start_air') )
                chance = 60;
            return { chance: chance };
        },
        buff: function(inventory, params) {
            var units = [
                '/pa/units/air/fabrication_aircraft/fabrication_aircraft.json',
                '/pa/units/air/air_scout/air_scout.json',
                '/pa/units/air/bomber/bomber.json',
                '/pa/units/air/fighter/fighter.json',
                '/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json',
                '/pa/units/air/bomber_adv/bomber_adv.json',
                '/pa/units/air/fighter_adv/fighter_adv.json',
                '/pa/units/air/gunship/gunship.json',
                '/pa/units/air/transport/transport.json',
                '/pa/units/air/solar_drone/solar_drone.json',
                '/pa/units/air/bomber_heavy/bomber_heavy.json',
                '/pa/units/air/support_platform/support_platform.json'
            ];
            var mods = [];
            var modUnit = function(unit) {
                mods.push({
                    file: unit,
                    path: 'navigation.move_speed',
                    op: 'multiply',
                    value: 1.25
                });
                mods.push({
                    file: unit,
                    path: 'navigation.brake',
                    op: 'multiply',
                    value: 1.25
                });
                mods.push({
                    file: unit,
                    path: 'navigation.acceleration',
                    op: 'multiply',
                    value: 1.25
                });
                mods.push({
                    file: unit,
                    path: 'navigation.turn_speed',
                    op: 'multiply',
                    value: 1.25
                });
                mods.push({
                    file: unit,
                    path: 'max_health',
                    op: 'multiply',
                    value: 1.5
                });
            };
            _.forEach(units, modUnit);
            var ammos = [
                '/pa/units/air/bomber/bomber_ammo.json',
                '/pa/units/air/figher/fighter_ammo.json',
                '/pa/units/air/bomber_adv/bomber_adv_ammo.json',
                '/pa/units/air/figher_adv/figher_adv_ammo.json',
                '/pa/units/air/gunship/gunship_ammo.json',
                '/pa/units/air/solar_drone/solar_drone_ammo.json',
                '/pa/units/air/bomber_heavy/bomber_heavy_ammo.json'
            ];
            var ammoMod = function (ammo) {
                mods.push({
                    file: ammo,
                    path: 'damage',
                    op: 'multiply',
                    value: 1.25
                });
            };
            _.forEach(ammos, ammoMod);
            inventory.addMods(mods);
        },
        dull: function(inventory) {
        }
    };
});

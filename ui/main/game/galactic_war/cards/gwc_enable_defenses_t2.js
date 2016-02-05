// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:Advanced Defense Technology enables more powerful defenses. Advanced defenses are built via advanced fabricators. Advanced defenses include tactical missile launchers, triple barrel laser turrets, and anti-air flak towers.';
        },
        summarize: function(params) {
            return '!LOC:Advanced Defense Technology';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_defence'
            }
        },
        getContext: function (galaxy) {
            return {
                totalSize: galaxy.stars().length
            };
        },
        deal: function (system, context, inventory) {
            var chance = 0;
            if( inventory.hasCard('gwc_enable_vehicles_all') || inventory.hasCard('gwc_enable_bots_all') || inventory.hasCard('gwc_enable_air_all') )
                chance = 100;
            return { chance: chance };
        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/land/laser_defense_adv/laser_defense_adv.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
                '/pa/units/land/air_defense_adv/air_defense_adv.json',
                '/pa/units/orbital/defense_satellite/defense_satellite.json'
            ]);
        },
        dull: function(inventory) {
        }
    };
});

// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC: Allows advanced fabricators to build all Titan-class units.';
        },
        summarize: function(params) {
            return '!LOC:Titan Tech';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_titans_all'
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
            if( (inventory.hasCard('gwc_enable_bots_all') || inventory.hasCard('gwc_enable_vehicles_all') || inventory.hasCard('gwc_enable_air_all') || inventory.hasCard('gwc_enable_sea_all')) )
            {
                chance = 150;
            }
            if( !api.content.usingTitans() || inventory.hasCard('gwc_start_titan') )
            {
                chance = 0;
            }
            return { chance: chance };

        },
        buff: function(inventory, params) {
            inventory.addUnits([
                '/pa/units/land/titan_bot/titan_bot.json',
                '/pa/units/land/titan_vehicle/titan_vehicle.json',
                '/pa/units/orbital/titan_orbital/titan_orbital.json',
                '/pa/units/land/titan_structure/titan_structure.json',
                '/pa/units/air/titan_air/titan_air.json'
            ]);
        },
        dull: function(inventory) {
        }
    };
});

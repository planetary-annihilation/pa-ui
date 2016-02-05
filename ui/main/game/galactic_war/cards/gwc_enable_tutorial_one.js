// !LOCNS:galactic_war
define(['shared/gw_common'], function (GW) {
    return {
        visible: function(params) { return true; },
        describe: function(params) { 
            return '!LOC:This technology unlocks advanced units and structures.';
        },
        summarize: function(params) {
            return 'Advanced Blueprint Library';
        },
        icon: function(params) {
            return 'coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander.png';
        },
        audio: function (parms) {
            return {
                found: '/VO/Computer/gw/board_tech_available_advanced'
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
                '/pa/units/land/energy_plant/energy_plant.json',
                '/pa/units/land/energy_plant_adv/energy_plant_adv.json',
                '/pa/units/land/energy_storage/energy_storage.json',
                '/pa/units/land/metal_extractor/metal_extractor.json',
                '/pa/units/land/metal_extractor_adv/metal_extractor_adv.json',
                '/pa/units/land/metal_storage/metal_storage.json',
                '/pa/units/land/vehicle_factory/vehicle_factory.json',
                '/pa/units/land/fabrication_vehicle/fabrication_vehicle.json',
                '/pa/units/land/tank_light_laser/tank_light_laser.json',
                '/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json',
                '/pa/units/land/tank_armor/tank_armor.json',
                '/pa/units/land/tank_hover/tank_hover.json',
                '/pa/units/land/land_scout/land_scout.json',
                '/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json',
                '/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json',
                '/pa/units/land/tank_laser_adv/tank_laser_adv.json',
                '/pa/units/land/tank_heavy_armor/tank_heavy_armor.json',
                '/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json',
                '/pa/units/land/tank_flak/tank_flak.json',
                '/pa/units/land/tank_nuke/tank_nuke.json',
                '/pa/units/land/bot_factory/bot_factory.json',
                '/pa/units/land/fabrication_bot/fabrication_bot.json',
                '/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json',
                '/pa/units/land/assault_bot/assault_bot.json',
                '/pa/units/land/bot_grenadier/bot_grenadier.json',
                '/pa/units/land/bot_bomb/bot_bomb.json',
                '/pa/units/land/bot_tesla/bot_tesla.json',
                '/pa/units/land/bot_factory_adv/bot_factory_adv.json',
                '/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json',
                '/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json',
                '/pa/units/land/assault_bot_adv/assault_bot_adv.json',
                '/pa/units/land/bot_tactical_missile/bot_tactical_missile.json',
                '/pa/units/land/bot_sniper/bot_sniper.json',
                '/pa/units/land/bot_nanoswarm/bot_nanoswarm.json',
                '/pa/units/land/bot_support_commander/bot_support_commander.json',
                '/pa/units/air/air_factory/air_factory.json',
                '/pa/units/air/fabrication_aircraft/fabrication_aircraft.json',
                '/pa/units/air/air_scout/air_scout.json',
                '/pa/units/air/bomber/bomber.json',
                '/pa/units/air/fighter/fighter.json',
                '/pa/units/air/transport/transport.json',
                '/pa/units/air/solar_drone/solar_drone.json',
                '/pa/units/air/air_factory_adv/air_factory_adv.json',
                '/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json',
                '/pa/units/air/bomber_adv/bomber_adv.json',
                '/pa/units/air/fighter_adv/fighter_adv.json',
                '/pa/units/air/gunship/gunship.json',
                '/pa/units/air/bomber_heavy/bomber_heavy.json',
                '/pa/units/air/support_platform/support_platform.json',
                '/pa/units/land/land_barrier/land_barrier.json',
                '/pa/units/land/land_mine/land_mine.json',
                '/pa/units/land/air_defense/air_defense.json',
                '/pa/units/land/laser_defense_single/laser_defense_single.json',
                '/pa/units/land/laser_defense/laser_defense.json',
                '/pa/units/land/artillery_short/artillery_short.json',
                '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json',
                '/pa/units/land/air_defense_adv/air_defense_adv.json',
                '/pa/units/land/laser_defense_adv/laser_defense_adv.json',
                '/pa/units/land/artillery_long/artillery_long.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
                '/pa/units/land/nuke_launcher/nuke_launcher.json',
                '/pa/units/land/radar/radar.json',
                '/pa/units/land/teleporter/teleporter.json',
                '/pa/units/land/radar_adv/radar_adv.json',
            ]);
            var units = [
                '/pa/units/land/energy_plant_adv/energy_plant_adv.json',
                '/pa/units/land/energy_storage/energy_storage.json',
                '/pa/units/land/metal_extractor_adv/metal_extractor_adv.json',
                '/pa/units/land/metal_storage/metal_storage.json',
                '/pa/units/land/fabrication_vehicle/fabrication_vehicle.json',
                '/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json',
                '/pa/units/land/tank_armor/tank_armor.json',
                '/pa/units/land/tank_hover/tank_hover.json',
                '/pa/units/land/land_scout/land_scout.json',
                '/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json',
                '/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json',
                '/pa/units/land/tank_laser_adv/tank_laser_adv.json',
                '/pa/units/land/tank_heavy_armor/tank_heavy_armor.json',
                '/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json',
                '/pa/units/land/tank_flak/tank_flak.json',
                '/pa/units/land/tank_nuke/tank_nuke.json',
                '/pa/units/land/bot_factory/bot_factory.json',
                '/pa/units/land/fabrication_bot/fabrication_bot.json',
                '/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json',
                '/pa/units/land/assault_bot/assault_bot.json',
                '/pa/units/land/bot_grenadier/bot_grenadier.json',
                '/pa/units/land/bot_bomb/bot_bomb.json',
                '/pa/units/land/bot_tesla/bot_tesla.json',
                '/pa/units/land/bot_factory_adv/bot_factory_adv.json',
                '/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json',
                '/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json',
                '/pa/units/land/assault_bot_adv/assault_bot_adv.json',
                '/pa/units/land/bot_tactical_missile/bot_tactical_missile.json',
                '/pa/units/land/bot_sniper/bot_sniper.json',
                '/pa/units/land/bot_nanoswarm/bot_nanoswarm.json',
                '/pa/units/land/bot_support_commander/bot_support_commander.json',
                '/pa/units/air/air_factory/air_factory.json',
                '/pa/units/air/fabrication_aircraft/fabrication_aircraft.json',
                '/pa/units/air/air_scout/air_scout.json',
                '/pa/units/air/bomber/bomber.json',
                '/pa/units/air/fighter/fighter.json',
                '/pa/units/air/transport/transport.json',
                '/pa/units/air/solar_drone/solar_drone.json',
                '/pa/units/air/air_factory_adv/air_factory_adv.json',
                '/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json',
                '/pa/units/air/bomber_adv/bomber_adv.json',
                '/pa/units/air/fighter_adv/fighter_adv.json',
                '/pa/units/air/gunship/gunship.json',
                '/pa/units/air/bomber_heavy/bomber_heavy.json',
                '/pa/units/air/support_platform/support_platform.json',
                '/pa/units/land/land_barrier/land_barrier.json',
                '/pa/units/land/land_mine/land_mine.json',
                '/pa/units/land/air_defense/air_defense.json',
                '/pa/units/land/laser_defense_single/laser_defense_single.json',
                '/pa/units/land/laser_defense/laser_defense.json',
                '/pa/units/land/artillery_short/artillery_short.json',
                '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json',
                '/pa/units/land/air_defense_adv/air_defense_adv.json',
                '/pa/units/land/laser_defense_adv/laser_defense_adv.json',
                '/pa/units/land/artillery_long/artillery_long.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
                '/pa/units/land/nuke_launcher/nuke_launcher.json',
                '/pa/units/land/radar/radar.json',
                '/pa/units/land/teleporter/teleporter.json',
                '/pa/units/land/radar_adv/radar_adv.json', ];
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

// !LOCNS:galactic_war
define([
    'shared/gw_tutorial_p2'
], function(
    planets2
) {
    return {
        "name": "!LOC:Economy and Construction",
        "coordinates": [-0.8, -0.3, 1.8],
        "biome": "lava",
        "distance": 3,
        "explored": false,
        "hasCard": true,
        "cardList": [
            "gwc_enable_tutorial_one"
        ],
        "history": [],
        "ai": {
            "commander": {
                "ObjectName": "TankAeson",
                "UnitSpec": "/pa/units/commanders/tutorial_ai_commander_2/tutorial_ai_commander_2.json",
            },
            "econ_rate": 0.5,
            "color": [
                [236, 34, 35],
                [192, 192, 192]
            ],
            "team": 2,
            "name": "Target",
            "personality": {
                "percent_land": 1.0,
                "percent_air": 0.00,
                "percent_naval": 0.00,
                "percent_orbital": 0.00,
                "metal_drain_check": 0.24,
                "energy_drain_check": 0.25,
                "metal_demand_check": 0.41,
                "energy_demand_check": 0.50,
                "micro_type": 0,
                "go_for_the_kill": false,
                "neural_data_mod": 2.0,
                "personality_tags":                             [
                    "Tutorial",
                    "SlowerExpansion"
                ],
                "priority_scout_metal_spots": false,
                "factory_build_delay_min": 60,
                "factory_build_delay_max": 120,
                "min_basic_fabbers": 1,
                "max_basic_fabbers": 1,
                "fabber_to_factory_ratio_basic": 1.5,
                "fabber_to_factory_ratio_advanced": 1.0,
                "fabber_alone_on_planet_mod": 2.0,
                "min_advanced_fabbers": 1,
                "max_advanced_fabbers": 1,
                "basic_to_advanced_factory_ratio": 0,
                "adv_eco_mod": 100.0,
                "adv_eco_mod_alone": 100.0,
                "unable_to_expand_delay": 12000,
                "per_expansion_delay": 60000,
                "enable_commander_danger_responses": false
            },
            "faction": 2
        },
        "system": {
            "name": "!LOC:Economy and Construction",
            "isRandomlyGenerated": false,
            "description": [
                "<div class='figure_wrapper'>",
                "   <img src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                "   <div class='text'>", "!LOC:[style=control]Left click[/style] [strong]JUMP[/strong] to warp to this star system.", "</div>",
                "</div>",
                "<div class='figure_wrapper'>",
                "   <img src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                "   <div class='text'>", "!LOC:[style=control]Left click[/style] [strong]FIGHT[/strong] to initiate landing in this star system.", "</div>",
                "</div>",
                "<div class='figure_wrapper'>",
                "   <img src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                "   <div class='text'>", "!LOC:After the enemy is defeated, [style=control]Left click[/style] [strong]EXPLORE[/strong] to gain a new technology.", "</div>",
                "</div>",
                "<div class='figure_wrapper'>",
                "   <img src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                "   <div class='text'>", "!LOC:[style=control]Left click[/style] the next star system to select it.", "</div>",
                "</div>",
            ],
            "players": [3,100],
            "planets": [
                planets2
            ],
            "tutorial": [
                {
                    "title": "!LOC:Choose Landing Zone",
                    "body": [
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_scroll_45.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Zoom in to the planet[/style] and [style=control]pan to the green circle landing zone.[/style]", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click[/style] inside the green circle indicating the landing zone.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click[/style] [strong]START ANNIHILATION[/strong]", "</div>",
                        "</div>"
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/1"
                },
                {
                    "title": "!LOC:The Commander",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "   <img src='coui://ui/main/game/guide/article/img/commander_x.png'/>",
                        "   <div class='text'>", "!LOC:Annihilation of all enemy commanders results in a [strong]victory[/strong].",
                        "   <br>", "!LOC:Loss of your commander results in [strong]defeat[/strong].", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/vehicle_factory.png'/>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/icons_command_attack_move.png'/>",
                        "   <div class='text'>", "!LOC:The commander can build structures and destroy enemy units with its powerful weaponry.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/alt_fire_icon.png'/>",
                        "    <div class='text'>", "!LOC:When needed, [style=control]Left click the alt-fire button[/style] and [style=control]left click a location or enemy unit to fire[/style] the very powerful [strong]Uber Cannon[/strong].", "</div>",
                        "</div>",
                        "</span>"
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/2"
                },
                {
                    "title": "!LOC:Economy",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/icon_econ.png'/>",
                        "    <div class='text'>", "!LOC:It takes two resources to run a war.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/icon_metal.png'/>",
                        "    <div class='text'>", "!LOC:Metal is used to build mobile units and structures.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/icon_energy.png'/>",
                        "    <div class='text'>", "!LOC:Energy is used to run fabricators, factories, radar, and some weapons.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/fabrication_vehicle.png'/>",
                        "    <div class='text'>", "!LOC:Every fabrication unit and factory will require [strong]metal[/strong] and [strong]energy[/strong] to construct units and structures.", "</div>",
                        "</div>",
                        "</span>"
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/3"
                },
                {
                    "title": "!LOC:Build a Metal Extractor",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click on the commander[/style] to select it.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/metal_extractor.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click on the metal extractor[/style] in the build bar at the bottom of the screen.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/icon_si_metal_splat.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click on a [strong]green[/strong] metal spot[/style] to initiate the build command.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='text'>", "!LOC:After the metal extractor is complete, observe the economy UI at the top of the screen and the increase in metal income.", "</div>",
                        "<img class='visual' src='coui://ui/main/game/guide/article/img/metal_econ_ui.png'/>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/4"
                },
                {
                    "title": "!LOC:Build an Energy Plant",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click[/style] on the commander to select it.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/energy_plant.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click on the energy plant[/style] in the build bar at the bottom of the screen.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click anywhere on a valid ground location[/style] to initiate the build command.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='text'>", "!LOC:After the energy plant is complete, observe the economy UI at the top of the screen and the increase in energy income.", "</div>",
                        "<img class='visual' src='coui://ui/main/game/guide/article/img/energy_econ_ui.png'/>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/5"
                },
                {
                    "title": "!LOC:Building Units",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/vehicle_factory.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Select the commander[/style] and [style=control]issue an order[/style] to build a [strong]vehicle factory[/strong].", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Select the [strong]vehicle factory[/strong][/style].", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/tank_build_bar.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Left click[/style] on the [strong]tank[/strong] icon to issue a build order to the factory.", "</div>",
                        "</div>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/6"
                },
                {
                    "title": "!LOC:Factory Controls",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/vehicle_factory.png'/>",
                        "   <div class='text'>", "!LOC:Factories will queue build orders in the order they are given.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                        "   <div class='text'>", "!LOC:[style=control]Shift + left click[/style] to queue up five units at a time.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_rclick.png'/>",
                        "   <div class='text'>", "!LOC:[style=control]Right click[/style] on the unit icon to remove it from the queue.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/icons_command_stop.png'/>",
                        "   <div class='text'>", "!LOC:[style=control]Issue a stop order[/style] on the factory to clear the build queue and stop all construction.", "</div>",
                        "</div>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/7"
                },
                {
                    "title": "!LOC:Destroy the Enemy",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "   <img class='visual' src='coui://ui/main/game/guide/article/img/commander_x.png'/>",
                        "   <div class='text'>", "!LOC:[style=control]Build tanks and [strong]annihilate[/strong] the enemy commander.[/style]", "</div>",
                        "</div>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/8"
                },
                {
                    "title": "!LOC:Commander Quotes",
                    "body": [
                        "<span>",
                        "<i>",
                        "<div class='text'>", '!LOC:"Why build one factory when you can build twenty?"', "</div>",
                        "<br>",
                        "<div class='text'>", '!LOC:"When you think you have enough metal, build more."',
                        "<br>", '!LOC:"When you think you have enough energy, build more."',
                        "</div>",
                        "<br>",
                        "<div class='text'>", '!LOC:"Wars are never lost by having too much metal."', "</div>",
                        "</i>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_2/9"
                }
            ]
        }
    }
});

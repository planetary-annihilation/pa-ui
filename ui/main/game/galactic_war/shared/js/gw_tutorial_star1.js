// !LOCNS:galactic_war
define([
    'shared/gw_tutorial_p1'
], function(
    planets1
) {
    return {
        "name": "!LOC:Origin",
        "coordinates":[-0.6,-0.75,0.75],
        "biome":"earth",
        "distance": 0,
        "explored": true,
        "hasCard":false,
        "cardList":[],
        "history": [],
        "ai": {
            "commander": {
                "ObjectName": "TankAeson",
                "UnitSpec": "/pa/units/commanders/tutorial_ai_commander/tutorial_ai_commander.json",
            },
            "econ_rate": 1.0,
            "color": [
                [236, 34, 35],
                [192, 192, 192]
            ],
            "team": 2,
            "name": "Target",
            "personality": {
                "percent_vehicle": 1.00,
                "percent_bot": 0.00,
                "percent_air": 0.00,
                "percent_naval": 0.00,
                "percent_orbital": 0.00,
                "metal_drain_check": 0.5,
                "energy_drain_check": 0.5,
                "metal_demand_check": 4.0,
                "energy_demand_check": 4.0,
                "micro_type": 0,
                "go_for_the_kill": false,
                "neural_data_mod": 1.75,
                "personality_tag": "Tutorial",
                "priority_scout_metal_spots": false,
                "factory_build_delay_min": 1,
                "factory_build_delay_max": 3,
                "adv_eco_mod": 0.5,
                "adv_eco_mod_alone": 0.5,
                "unable_to_expand_delay": 12000,
                "enable_commander_danger_responses": false
            },
            "faction": 2
        },
        "system": {
            "name": "!LOC:Origin",
            "isRandomlyGenerated": false,
            "description": [
                "<span>",
                "<div class='figure_wrapper'>",
                "   <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_lclick.png'/>",
                "   <div class='text'>",
                "!LOC:[style=control]Left click[/style] on the connected star system with the orange highlight to continue.",
                "   </div>",
                "</div>",
                "</span>"
            ],
            "force_start": true,
            "players": [3, 100],
            "planets":[
                planets1
            ],
            "tutorial": [
                {
                    "title": "!LOC:Introduction",
                    "body": [
                        "<span>",
                        "<div class='figure_wrapper'>",
                        "    <img src='coui://ui/main/game/guide/article/img/img_paex1_logo.png'/>",
                        "    <div class='text'>", "!LOC:Welcome Commander.", "</div>",
                        "</div>",
                        "<br>",
                        " <div>", "!LOC:Click Next to learn how to use the command and control interface.", "</div>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_1/1",
                    "delaySeconds": 11
                },
                {
                    "title": "!LOC:Camera Controls",
                    "body": [
                        "<div class='figure_wrapper'>",
                        "    <img class='visual' src='coui://ui/main/game/guide/article/img/img_mouse_scroll_45.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Scroll the mouse wheel[/style] to control the camera zoom level.",
                        "    <br>", "!LOC:The camera will zoom in under the cursor location.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "    <img src='coui://ui/main/game/guide/article/img/img_mouse_pan_45.png'/>",
                        "    <div class='text'>", "!LOC:[style=control]Click and drag the mouse wheel[/style] to pan the camera around the planet.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='text_wrapper'>",
                        "    <span class='visual glyphicon glyphicon-arrow-right'>[/style]",
                        "    <div class='text'>", "!LOC:[style=control]Press N[/style] to reorient the planet, north up.", "</div>",
                        "</div>"
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_1/2"
                },
                {
                    "title": "!LOC:Unit Selection",
                    "body": [
                        "<div class='figure_wrapper'>",
                        "   <img src='coui://ui/main/game/guide/article/img/titan_bot_icon.png'/>",
                        "   <div class='text'>", "!LOC:[style=control]Left click[/style] on the blue Atlas Titan to select it.", "</div>",
                        "</div>",
                        "   <br>",
                        "<div class='figure_wrapper'>",
                        "   <img src='coui://ui/main/game/guide/article/img/img_mouse_rclick.png'/>",
                        "   <div class='text'>", "!LOC:Once the Atlas is selected, [style=control]right click on the ground [/style]to issue a move order to that location.", "</div>",
                        "</div>",
                        "   <br>",
                        "<div class='figure_wrapper'>",
                        "   <img src='coui://ui/main/shared/img/icons/icons_command_move.png'/>",
                        "   <div class='text'>", "!LOC:Move the Atlas toward the enemy base. Destroy the enemy commander and its base.", "</div>",
                        "</div>",
                        "<br>",
                        "<div class='figure_wrapper'>",
                        "   <img src='coui://ui/main/game/galactic_war/shared/img/commander_icon.png'/>",
                        "   <div class='text'>", "!LOC:Annihilation of  all enemy commanders wins the game.", "</div>",
                        "</div>"
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_1/3"
                },
                {
                    "title": "!LOC:Commander Quotes",
                    "body": [
                        "<span>",
                        "<i>",
                        "<div class='text'>", '!LOC:"When in doubt, get a bigger bot."', "</div>",
                        "<br>",
                        "<div class='text'>", '!LOC:"Crush your enemies and erase their code."', "</div>",
                        "</i>",
                        "</span>",
                    ],
                    "audio": "/VO/Computer/Tutorial/Tutorial_1/4"
                }
            ]
        }
    }
});

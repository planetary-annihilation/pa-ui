
function ai_types() {

    /*
    {
        idle: true | false,

        percent_vehicle [0 1],
		percent_bot [0 1],
        percent_air [0 1],
        percent_naval [0 1],
		percent_orbital [0 1],

        personality_tags: [<string>, <string>, ...],

        metal_drain_check [0 1],
        energy_drain_check [0 1],
        metal_demand_check [0 1],
        energy_demand_check [0 1],

        micro_type 0:none | 1:platoon | 2:squad,

        go_for_the_kill: true | false,
        priority_scout_metal_spots: true | false,
        enable_commander_danger_responses: true | false,

        neural_data_mod: [0 ... )
        adv_eco_mod: [0 ... )
        adv_eco_mod_alone: [0 ... )
        factory_build_delay_min: [0 ... ] (in seconds)
        factory_build_delay_max: [0 ... ] (in seconds)
        unable_to_expand_delay: [0 ... ] (in seconds)
        per_expansion_delay: [0 ... ] (in seconds)
        fabber_to_factory_ratio_basic: [0 ... ]
        fabber_to_factory_ratio_advanced: [0 ... ]
        fabber_alone_on_planet_mod: [0 ... ]
        basic_to_advanced_factory_ratio: [0 ... ]
        factory_alone_on_planet_mod: [0 ... ]
        min_basic_fabbers: [0 ... ]
        max_basic_fabbers: [0 ... ]
        min_advanced_fabbers: [0 ... ]
        max_advanced_fabbers: [0 ... ]
    }
    */

    var result = {
        'Idle': {
            display_name: '!LOC:Idle',
            idle: true
        },
        'Normal': {
            display_name: '!LOC:Normal',
            percent_vehicle: 0.45,
            percent_bot: 0.25,
            percent_air: 0.2,
            percent_naval: 0.05,
            percent_orbital: 0.05,
            personality_tags:
            [
                "SlowerExpansion"
            ],
            metal_drain_check: 0.14,
            energy_drain_check: 0.25,
            metal_demand_check: 0.21,
            energy_demand_check: 0.3,
            micro_type: 0,
            go_for_the_kill: false,
            priority_scout_metal_spots: false,
            enable_commander_danger_responses: false,
            neural_data_mod: 2.0,
            adv_eco_mod: 3.0,
            adv_eco_mod_alone: 3.0,
            factory_build_delay_min: 15,
            factory_build_delay_max: 30,
            unable_to_expand_delay: 60,
            per_expansion_delay: 120,
            fabber_to_factory_ratio_basic: 5.0,
            fabber_to_factory_ratio_advanced: 1.0,
            fabber_alone_on_planet_mod: 1.0,
            basic_to_advanced_factory_ratio: 0,
            factory_alone_on_planet_mod: 1.0,
            min_basic_fabbers: 5,
            max_basic_fabbers: 15,
            min_advanced_fabbers: 3,
            max_advanced_fabbers: 20
        },
        'Hard': {
            display_name: '!LOC:Hard',
            percent_vehicle: 0.45,
            percent_bot: 0.25,
            percent_air: 0.2,
            percent_naval: 0.05,
            percent_orbital: 0.05,
            personality_tags:
            [
                "PreventsWaste"
            ],
            metal_drain_check: 0.34,
            energy_drain_check: 0.45,
            metal_demand_check: 0.51,
            energy_demand_check: 0.6,
            micro_type: 0,
            go_for_the_kill: false,
            priority_scout_metal_spots: true,
            enable_commander_danger_responses: true,
            neural_data_mod: 1.5,
            adv_eco_mod: 1.1,
            adv_eco_mod_alone: 1.0,
            factory_build_delay_min: 1,
            factory_build_delay_max: 3,
            fabber_to_factory_ratio_basic: 1.0,
            fabber_to_factory_ratio_advanced: 1.0,
            fabber_alone_on_planet_mod: 2.0,
            basic_to_advanced_factory_ratio: 0,
            factory_alone_on_planet_mod: 0.5,
            min_basic_fabbers: 2,
            max_basic_fabbers: 6,
            min_advanced_fabbers: 3,
            max_advanced_fabbers: 20
        },
        'Relentless': {
            display_name: '!LOC:Relentless',
            percent_vehicle: 0.45,
            percent_bot: 0.25,
            percent_air: 0.2,
            percent_naval: 0.05,
            percent_orbital: 0.05,
            personality_tags:
            [
                "PreventsWaste"
            ],
            metal_drain_check: 0.44,
            energy_drain_check: 0.55,
            metal_demand_check: 0.61,
            energy_demand_check: 0.7,
            micro_type: 1,
            go_for_the_kill: true,
            priority_scout_metal_spots: true,
            enable_commander_danger_responses: true,
            neural_data_mod: 1.2,
            adv_eco_mod: 1.2,
            adv_eco_mod_alone: 0.95,
            fabber_to_factory_ratio_basic: 1.0,
            fabber_to_factory_ratio_advanced: 1.0,
            fabber_alone_on_planet_mod: 2.0,
            basic_to_advanced_factory_ratio: 0,
            factory_alone_on_planet_mod: 0.5,
            min_basic_fabbers: 2,
            max_basic_fabbers: 6,
            min_advanced_fabbers: 3,
            max_advanced_fabbers: 20
        },
        'Absurd': {
            display_name: '!LOC:Absurd',
            percent_vehicle: 0.45,
            percent_bot: 0.25,
            percent_air: 0.2,
            percent_naval: 0.05,
            percent_orbital: 0.05,
            personality_tags:
            [
                "PreventsWaste"
            ],
            metal_drain_check: 0.54,
            energy_drain_check: 0.65,
            metal_demand_check: 0.71,
            energy_demand_check: 0.8,
            micro_type: 2,
            go_for_the_kill: true,
            priority_scout_metal_spots: true,
            enable_commander_danger_responses: true,
            neural_data_mod: 1.0,
            adv_eco_mod: 1.3,
            adv_eco_mod_alone: 0.85,
            fabber_to_factory_ratio_basic: 1.0,
            fabber_to_factory_ratio_advanced: 1.0,
            fabber_alone_on_planet_mod: 2.0,
            basic_to_advanced_factory_ratio: 0,
            factory_alone_on_planet_mod: 0.5,
            min_basic_fabbers: 2,
            max_basic_fabbers: 6,
            min_advanced_fabbers: 3,
            max_advanced_fabbers: 20
        },
    };

    _.forEach(result, function (element, key) {
        result[key]['name'] = key;
    });

    return result;
}

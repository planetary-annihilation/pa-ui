var audioModel = (function () {

    /* determines the minimum time between responses. */
    /* triggered responses (of the same or higher priority) that occur during the timeout will be queued. */
    var audio_response_que = [];
    var global_audio_response_timeout = 3 * 1000 /* in ms*/;
    var global_timeout_active = false;

    var audio_response_priority_level = 0;
    var starting_priority_level = 3;
    var priority_level_cooldown = 30 * 1000 /* in ms*/;
    var priority_level_timeout;

    var defeated = false;

    var maybePlayQueuedResponse = function (clear_cooldown) {
        if (clear_cooldown && !audio_response_que.length)
            global_timeout_active = false;
        else
            global_timeout_active = true;

        if (!audio_response_que.length)
            return;

        var entry = audio_response_que.shift();

        if (audio_response_priority_level <= entry.priority || entry.priority === -1)
            api.audio.playSoundAtLocation(entry.cue, 0, 0, 0);

        setTimeout(function () { maybePlayQueuedResponse(true) }, global_audio_response_timeout);
    };
    var enqueueAudioResponse = function (cue, priority) {
        audio_response_que.push({ cue: cue, priority: priority });

        if (audio_response_que.length === 1 && !global_timeout_active)
            maybePlayQueuedResponse();
    };

    var setAudioResponsePriorityLevel = function (level) {
        if (level < 0)
            return;

        if (level > audio_response_priority_level)
            audio_response_que.length = 0;

        audio_response_priority_level = level;
        clearTimeout(priority_level_timeout);

        if (level > 0)
            priority_level_timeout = setTimeout(function () {
                setAudioResponsePriorityLevel(level - 1);
            }, priority_level_cooldown);
    };
    setAudioResponsePriorityLevel(starting_priority_level);

    function AudioResponseModel(options) {
        var self = this;

        var simple_audio = typeof options.audio === 'string';
        var lastTriggerTime = _.now();
        var sequence = -1;
        var has_played = false;
        var priority = options.ignore_priority ? -1 : (options.priority || 0);
        var always_play = options.always_play;

        var resolve = function (cue, skip) {
            var simple_cue = typeof cue === 'string';
            var target = simple_cue ? cue : cue[Math.min(sequence, cue.length - 1)];

            if (skip)
                api.audio.playSoundAtLocation(target, 0, 0, 0);
            else
                enqueueAudioResponse(target, priority);
        }

        var play = function () {
            ++sequence;

            if (options.play_once && has_played)
                return;

            if (priority && !options.ignore_priority && priority >= audio_response_priority_level)
                setAudioResponsePriorityLevel(priority);

            has_played = true;

            if (simple_audio)
                resolve(options.audio);
            else
                _.forEach(options.audio, function (element, index) { /* expects an array of arrays where the first value is a delay and the second value is an audio cue */
                    _.delay(function () {
                        resolve(element[1], !!index); /* only enqueue the first value... that way we can ignore the global audio cooldown */
                    }, element[0]);
                });
        };

        self.trigger = function () {
            if (!always_play)
                if (!options.ignore_priority && priority < audio_response_priority_level)
                    return;

            var now = _.now();
            var delta = now - lastTriggerTime;

            if (!options.reset || delta > options.reset) {
                sequence = -1;
            }

            if (!options.interval || delta > options.interval) {
                lastTriggerTime = now;
                play();
            }

        };
    };

    function MusicCueGroupModel(list, priority, minimum_duration) {
        var self = this;

        var cues = list;
        var last_index = -1;

        var sample_fn = (cues.length > 1)
                ? function () { return _.sample(_.pull(_.range(cues.length), last_index)) }
                : function () { return 0 };

        var start_time = 0;

        self.priority = priority;
        self.minimum_duration = minimum_duration || 0;

        self.start = function () {

            var next = sample_fn();
            last_index = next;
            start_time = _.now();

            engine.call('audio.setMusic', cues[next]);
        };

        self.minimumRemainingDuration = function () {
            minimum_duration - _.now() - start_time;
        };

        self.allowExit = function () {
            if (!minimum_duration)
                return true;

            return (_.now() - start_time) > minimum_duration;
        };
    }

    function MusicCueModel () {
        var self = this;

        var groups = {
            'spectator': new MusicCueGroupModel(['/Music/Music_Launch_Commander_spectating'], 1),
            'launch': new MusicCueGroupModel(['/Music/Music_Launch_Commander'], 1),
            'base': new MusicCueGroupModel(['/Music/Music_Base'], 2, 40 * 1000 /* ms */),
            'battle': new MusicCueGroupModel(['/Music/Music_battle'], 2, 85 * 1000 /* ms */),
            'smash': new MusicCueGroupModel(['/Music/Music_Planets_smash_long'], 2, 85 * 1000 /* ms */),
            'victory': new MusicCueGroupModel(['/Music/Music_Gameover_Win'], 3),
            'defeat': new MusicCueGroupModel(['/Music/Music_Commander_Death'], 3),
            'celestial_targeting': new MusicCueGroupModel(['/Music/Music_Halley_Select_planet'], 2),
            'ragnarok_ready': new MusicCueGroupModel(['/Music/Music_Ragnarock_complete'], 4, 80 * 1000 /* ms */),
            'rewind': new MusicCueGroupModel(['/Music/Music_Launch_Commander_spectating'], 5)
        };

        var active_group = '';

        var building_timeout_delay = 40 * 1000; /* in ms */
        var building_timeout;

        var current_priority = function () {
            return groups[active_group] ? groups[active_group].priority : 0;
        }

        var makeActiveAndStart = function (target) {
            active_group = target;
            groups[active_group].start();
        }

        self.clearCurrentMusic = function() {
            active_group = '';
            clearTimeout(building_timeout);
        }

        self.stopRagnarokMusic = function() {
            if (active_group !== 'victory' && active_group !== 'defeat') {
                self.clearCurrentMusic();
                self.startCueGroup('base');
            }
        }

        self.startCueGroup = function (target) {
            var buildingTimeoutCancelTargets = ['battle', 'victory', 'defeat', 'ragnarok_ready'];
            if (_.contains(buildingTimeoutCancelTargets, target))
                clearTimeout(building_timeout);

            if (target === 'ragnarok_ready' && active_group !== 'ragnarok_ready') {
                makeActiveAndStart(target);
                return;
            }

            var ragnarokCancelTargets = ['victory', 'defeat'];
            if (active_group === 'ragnarok_ready' && _.contains(ragnarokCancelTargets, target))
                self.clearCurrentMusic();

            if (target === 'battle')
                building_timeout = setTimeout(function () { self.startCueGroup('base') }, building_timeout_delay);

            if (target === active_group
                    || current_priority() > groups[target].priority)
                return;

            if (groups[active_group] && !groups[active_group].allowExit() && current_priority() === groups[target].priority) {
                if (target === 'base')
                    building_timeout = setTimeout(function () { self.startCueGroup('base') }, groups[active_group].minimumRemainingDuration() + 1);
                return;
            }

            makeActiveAndStart(target);
        }
    }

    function AudioModel() {

        var self = this;

        var music = new MusicCueModel();
        self.music = music;

        var responses = {};

        responses[constants.event_type.low_metal] = new AudioResponseModel({
            audio: [
                [0, ['',
                     '/SE/UI/UI_Alert_metal_low',
                     '',
                     '',
                     '',
                     '',
                     '',
                     '',
                     '',
                     '']],
                [2 * 1000 /* in ms */, ['',
                                        '/VO/Computer/economy_low_metal',
                                        '',
                                        '',
                                        '/VO/Computer/economy_low_metal_seq2',
                                        '',
                                        '',
                                        '',
                                        '/VO/Computer/economy_low_metal_seq3',
                                        '']]
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 90 * 1000,
            priority: 1
        });
        responses[constants.event_type.low_energy] = new AudioResponseModel({
            audio: [
                [0, ['',
                     '/SE/UI/UI_Alert_energy_low',
                     '',
                     '',
                     '',
                     '']],
                [2 * 1000 /* in ms */, ['',
                                        '/VO/Computer/economy_low_power',
                                        '',
                                        '',
                                        '/VO/Computer/economy_low_power',
                                        '']]
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 90 * 1000 /* in ms */,
            priority: 1
        });
        responses[constants.event_type.full_metal] = new AudioResponseModel({
            audio: [
                [2 * 1000 /* in ms */, ['',
                                        '',
                                        '/VO/Computer/economy_metal_full',
                                        '',
                                        '',
                                        '/VO/Computer/economy_metal_full',
                                        '']]
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 360 * 1000 /* in ms */,
            priority: 0
        });
        responses[constants.event_type.full_energy] = new AudioResponseModel({
            audio: [
                [2 * 1000 /* in ms */, ['',
                                        '',
                                        '',
                                        '/VO/Computer/economy_power_full',
                                        '',
                                        '',
                                        '/VO/Computer/economy_power_full',
                                        '']]
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 360 * 1000 /* in ms */,
            priority: 0
        });

        responses[constants.event_type.under_attack] = new AudioResponseModel({
            audio: [
                [0, '/SE/UI/UI_under_attack'],
                [2 * 1000 /* in ms */, '/VO/Computer/under_attack']
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 90 * 1000 /* in ms */,
            priority: 3
        });
        responses[constants.event_type.commander_healed] = new AudioResponseModel({
            audio: '/VO/Computer/commander_healed',
            interval: 60 * 1000 /* in ms */,
            reset: 90 * 1000 /* in ms */,
            priority: 3
        });
        responses[constants.event_type.commander_under_attack] = new AudioResponseModel({
            audio: [
                [0, '/SE/UI/UI_commander_under_attack'],
                [2 * 1000 /* in ms */, '/VO/Computer/commander_under_attack']
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 3
        });

        responses[constants.event_type.allied_commander_under_attack] = new AudioResponseModel({
            audio: '/VO/Computer/commander_under_attack_allied',
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 3
        });

        responses[constants.event_type.allied_commander_low_health] = new AudioResponseModel({
            audio: '/VO/Computer/commander_under_attack_lowhealth_allied',
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 3
        });

        responses[constants.event_type.enemy_commander_under_attack] = new AudioResponseModel({
            audio: '/VO/Computer/attacking_enemy_commander',
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 3
        });

        responses[constants.event_type.enemy_commander_low_health] = new AudioResponseModel({
            audio: '/VO/Computer/commander_under_attack_lowhealth_enemy',
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 3
        });

        responses[constants.event_type.commander_low_health] = new AudioResponseModel({
            audio: [
                [0, '/SE/UI/UI_commander_low_health'],
                [2 * 1000 /* in ms */, '/VO/Computer/commander_under_attack_lowhealth']
            ],
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 4
        });

        responses[constants.event_type.commander_under_attack_very_low_health] = new AudioResponseModel({
            audio: '/VO/Computer/commander_under_attack_extremly_lowhealth',
            interval: 60 * 1000 /* in ms */,
            reset: 60 * 1000 /* in ms */,
            priority: 4
        });

        responses[constants.event_type.commander_destroyed] = new AudioResponseModel({
            audio: '/VO/Computer/commander_destroyed',
            priority: 5
        });

        responses[constants.event_type.asteroid_incoming] = new AudioResponseModel({
            audio: '/VO/Computer/annihiation_orbit_altered',
            priority: 5
        });

        responses[constants.event_type.asteroid_imminent] = new AudioResponseModel({
            audio: '/VO/Computer/annihiation_imminent',
            priority: 5
        });

        responses[constants.event_type.asteroid_impact] = new AudioResponseModel({
            audio: '', /* we just want to set the priority level here, we don't need to play a cue */
            priority: 6
        });

        responses[constants.event_type.new_enemy_contact] = new AudioResponseModel({
            audio: '/VO/Computer/site_unit_enemy',
            ignore_priority: true,
            //priority: 4
        });
        responses[constants.event_type.enemy_commander_sighted] = new AudioResponseModel({
            audio: '/VO/Computer/site_commander_enemy',
            always_play: true,
            priority: 4
        });
        responses[constants.event_type.enemy_commander_destroyed] = new AudioResponseModel({
            audio: '/VO/Computer/commander_destroyed_enemy',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.projectile] = {
            '/pa/units/land/nuke_launcher/nuke_launcher_ammo.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_nuke_incoming',
                priority: 3
            })
        };

        responses[constants.event_type.death] = {
            '/pa/units/land/nuke_launcher/nuke_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_nuke',
                priority: 2
            }),
            '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_anti_nuke',
                priority: 3
            }),
            '/pa/units/orbital/delta_v_engine/delta_v_engine.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_hally',
                priority: 4
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_orbital_radar',
                priority: 2
            }),
            '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_catapult',
                priority: 1
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_orbital_radar',
                priority: 2
            }),
            '/pa/units/orbital/orbital_laser/orbital_laser.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_ssx',
                priority: 2
            }),
            '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_orbital_radar',
                priority: 1
            }),
            '/pa/units/land/artillery_long/artillery_long.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_holkins',
                priority: 1
            }),
            '/pa/units/sea/battleship/battleship.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_battleship',
                priority: 2,
            }),
            '/pa/units/sea/missile_ship/missile_ship.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_stingray',
                priority: 2
            }),
            '/pa/units/orbital/defense_satellite/defense_satellite.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_anchor',
                priority: 2
            }),
            '/pa/units/orbital/ion_defense/ion_defense.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_umbrella',
                priority: 2
            }),
            '/pa/units/land/unit_cannon/unit_cannon.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_unit_cannon',
                priority: 4
             }),
            '/pa/units/land/control_module/control_module.json' : new AudioResponseModel({
                audio: '/VO/Computer/lost_control_module',
                priority: 4
            }),
            '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_lob',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/bot_support_commander/bot_support_commander.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_support_commander',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tank_nuke/tank_nuke.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_nuke_tank',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/hover_ship/hover_ship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_hover_boat',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/drone_carrier/carrier/carrier.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_drone_aircraft_carrier',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_battleship/orbital_battleship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_orbital_destroyer',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_railgun/orbital_railgun.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/lost_orbital_laser_longinus',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/air/titan_air/titan_air.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/lost_zeus_airship',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_bot/titan_bot.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/lost_altlas_seismic',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_vehicle/titan_vehicle.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/lost_hover_tank',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/titan_orbital/titan_orbital.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/lost_orbital_station',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_structure/titan_structure.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/lost_Ragnarok',
                priority: 5,
                interval: 30 * 1000 /* in ms */,
            })
        };

        responses[constants.event_type.allied_death] = {};

        var advanced_factory_response = new AudioResponseModel({
            audio: '/VO/Computer/construction_building_factory_T2_built',
            priority: 1,
            play_once: true,
        });

        responses[constants.event_type.ready] = {
            '/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json': advanced_factory_response,
            '/pa/units/land/bot_factory_adv/bot_factory_adv.json': advanced_factory_response,
            '/pa/units/air/air_factory_adv/air_factory_adv.json': advanced_factory_response,
            '/pa/units/naval/naval_factory_adv/naval_factory_adv.json': advanced_factory_response,

            '/pa/units/orbital/orbital_launcher/orbital_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/construction_building_orbital_factory_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/land/nuke_launcher/nuke_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_nuke_built',
                priority: 2,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_anti_nuke_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/orbital/delta_v_engine/delta_v_engine.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_halley_built',
                priority: 2
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_orbital_radar_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_tactical_missile_launcher_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_deep_space_radar_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/orbital/orbital_laser/orbital_laser.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_orbital_laser_ssx_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_radar_satellite_adv_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/land/artillery_long/artillery_long.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_building_artillery_long_built',
                priority: 1,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/sea/battleship/battleship.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_battleship_built',
                priority: 2,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/sea/missile_ship/missile_ship.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_missile_ship_built',
                priority: 2,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/orbital/defense_satellite/defense_satellite.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_defense_satellite_anchor_built',
                priority: 2,
                interval: 10 * 1000 /* in ms */
            }),
            '/pa/units/land/unit_cannon/unit_cannon.json' : new AudioResponseModel({
                audio: '/VO/Computer/construction_unit_cannon',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
             }),
            '/pa/units/land/control_module/control_module.json': new AudioResponseModel({
                audio: '/VO/Computer/construction_control_module_built',
                priority: 3
            }),
            '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_lob_built',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/bot_support_commander/bot_support_commander.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_support_commander_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tank_nuke/tank_nuke.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_nuke_tank_built',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/hover_ship/hover_ship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_hover_boat_built',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/drone_carrier/carrier/carrier.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_drone_aircraft_carrier_built',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_battleship/orbital_battleship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_orbital_destroyer_built',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_railgun/orbital_railgun.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/construction_orbital_laser_longinus_built',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/air/titan_air/titan_air.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_zeus_airship_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/titan_sea/titan_sea.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_warpship_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_bot/titan_bot.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_altlas_seismic_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_vehicle/titan_vehicle.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_hover_tank_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/titan_orbital/titan_orbital.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_orbital_station_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_structure/titan_structure.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/construction_Ragnarok_built',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            })

        };

        responses[constants.event_type.sight] = {
            '/pa/units/land/nuke_launcher/nuke_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_nuke_installation',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_anti_nuke',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/delta_v_engine/delta_v_engine.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_hally',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_orbital_radar',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_catapult',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_laser/orbital_laser.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_ssx',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_orbital_radar',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/artillery_long/artillery_long.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_holkins',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/battleship/battleship.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_battleship',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/defense_satellite/defense_satellite.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_anchor',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/ion_defense/ion_defense.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_umbrella',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
             }),
             '/pa/units/land/unit_cannon/unit_cannon.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_unit_cannon',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
             }),
            '/pa/units/land/control_module/control_module.json' : new AudioResponseModel({
                audio: '/VO/Computer/site_control_module',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/bot_support_commander/bot_support_commander.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_support_commander',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tank_nuke/tank_nuke.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_nuke_tank',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/hover_ship/hover_ship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_hover_boat',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/drone_carrier/carrier/carrier.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_drone_aircraft_carrier',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_battleship/orbital_battleship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_orbital_destroyer',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_railgun/orbital_railgun.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/site_orbital_laser_longinus',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/air/titan_air/titan_air.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_zeus_airship',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/titan_sea/titan_sea.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_warpship',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_bot/titan_bot.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_altlas_seismic',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_vehicle/titan_vehicle.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_hover_tank',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/titan_orbital/titan_orbital.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_orbital_station',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_structure/titan_structure.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/site_Ragnarok',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            })
        };

        responses[constants.event_type.target_destroyed] = {
            '/pa/units/land/nuke_launcher/nuke_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_nuke',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json' : new AudioResponseModel({ /* didn't play */
                audio: '/VO/Computer/destroyed_anti_nuke',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/delta_v_engine/delta_v_engine.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_hally',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/deep_space_radar/deep_space_radar.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_orbital_radar',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_catapult',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_laser/orbital_laser.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_ssx',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_orbital_radar',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/artillery_long/artillery_long.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_holkins',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/battleship/battleship.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_battleship',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/missile_ship/missile_ship.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_stingray',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/defense_satellite/defense_satellite.json' : new AudioResponseModel({ /* didn't play */
                audio: '/VO/Computer/destroyed_anchor',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/ion_defense/ion_defense.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_umbrella',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/unit_cannon/unit_cannon.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_unit_cannon',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
             }),
            '/pa/units/land/control_module/control_module.json' : new AudioResponseModel({
                audio: '/VO/Computer/destroyed_control_module',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_lob',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/bot_support_commander/bot_support_commander.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_support_commander',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/tank_nuke/tank_nuke.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_nuke_tank',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/hover_ship/hover_ship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_hover_boat',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/drone_carrier/carrier/carrier.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_drone_aircraft_carrier',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_battleship/orbital_battleship.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_orbital_destroyer',
                priority: 2,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/orbital_railgun/orbital_railgun.json': new AudioResponseModel({
                audio: '/VO/Computer/X1/destroyed_orbital_laser_longinus',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/air/titan_air/titan_air.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_zeus_airship',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/sea/titan_sea/titan_sea.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_warpship',
                priority: 1,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_bot/titan_bot.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_altlas_seismic',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_vehicle/titan_vehicle.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_hover_tank',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/orbital/titan_orbital/titan_orbital.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_orbital_station',
                priority: 3,
                interval: 30 * 1000 /* in ms */,
            }),
            '/pa/units/land/titan_structure/titan_structure.json': new AudioResponseModel({
                audio: '/VO/Computer/Titan/destroyed_Ragnarok',
                priority: 4,
                interval: 30 * 1000 /* in ms */,
            })
        };

        responses[constants.event_type.enemy_commander_destroyed] = new AudioResponseModel({
            audio: '/VO/Computer/commander_destroyed_enemy',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.allied_commander_destroyed] = new AudioResponseModel({
            audio: '/VO/Computer/commander_destroyed_allied',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.thrust_control_established] = new AudioResponseModel({
            audio: '/VO/Computer/annihiation_hallys_needed_met',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.weapon_control_established] = new AudioResponseModel({
            audio: '/VO/Computer/annihilation_m_control_met',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.asteroid_respawned] = new AudioResponseModel({
            audio: '/VO/Computer/astroid_new_sighted',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.teleporter_linked] = new AudioResponseModel({
            audio: '/VO/Computer/teleporter_linked',
            always_play: true,
            priority: 2
        });

        responses[constants.event_type.transport_arrival] = new AudioResponseModel({
            audio: '/VO/Computer/transport_orbital_reached_destination',
            always_play: true,
            priority: 2
        });

        responses[constants.event_type.commander_arrival] = new AudioResponseModel({
            audio: '/VO/Computer/transport_orbital_reached_destination_Commander',
            always_play: true,
            priority: 4
        });

        responses[constants.event_type.enemy_commander_departure] = new AudioResponseModel({
            audio: '/VO/Computer/commander_orbital_transport_enemy',
            always_play: true,
            priority: 2
        });

        responses[constants.event_type.unit_energy_shutdown] = new AudioResponseModel({
            audio: '/VO/Computer/economy_power_low_teleports_radars_powered_down',
            priority: 2,
            interval: 30 * 1000 /* in ms */,
        });

        responses[constants.event_type.unit_energy_startup] = new AudioResponseModel({
            audio: '/VO/Computer/economy_power_restored_teleports_radars_powered_up',
            priority: 2,
            interval: 30 * 1000 /* in ms */,
        });

        responses[constants.event_type.ragnarok_loaded] = new AudioResponseModel({
            audio: '/VO/Computer/Titan/Ragnarok_loaded',
            priority: 5,
            always_play: true
        });

        responses[constants.event_type.nuke_ready] = new AudioResponseModel({
            audio: '/VO/Computer/missile_ready_nuke',
            priority: 2,
            always_play: true
        });

        responses[constants.event_type.unitcannon_full] = new AudioResponseModel({
            audio: '/VO/Computer/unitcannon_full',
            priority: 2,
            always_play: true
        });

        responses[constants.event_type.anti_nuke_ready] = new AudioResponseModel({
            audio: '/VO/Computer/missile_ready_antinuke',
            priority: 2,
            always_play: true
        });

        responses[constants.event_type.bounty_recieved] = new AudioResponseModel({
            audio: '/VO/Computer/mode_bounty_recieved',
            priority: 5
        });

        responses[constants.event_type.bounty_claimed_ally] = new AudioResponseModel({
            audio: '/VO/Computer/mode_bounty_claimed_ally',
            priority: 4
        });

        responses[constants.event_type.bounty_claimed_enemy] = new AudioResponseModel({
            audio: '/VO/Computer/mode_bounty_claimed_enemy',
            priority: 4
        });

        responses[constants.event_type.construction_continuous_on] = new AudioResponseModel({
            audio: '/VO/Computer/construction_continuous_on',
            interval: 30 * 1000 /* in ms */,
            priority: 2
        });

        responses[constants.event_type.construction_continuous_off] = new AudioResponseModel({
            audio: '/VO/Computer/construction_continuous_off',
            interval: 30 * 1000 /* in ms */,
            priority: 2
        });

        self.stopRagnarokMusic  = function () {
            music.stopRagnarokMusic();
        }

        self.triggerRagnarokMusic = function () {
            music.startCueGroup('ragnarok_ready');
        }

        self.triggerSpectatorMusic = function () {
            music.startCueGroup('spectator');
        }

        self.triggerLaunchMusic = function () {
            music.startCueGroup('launch');
        }

        self.triggerBuildingMusic = function () {
            music.startCueGroup('base');
        }

        self.triggerBattleMusic = function () {
            music.startCueGroup('battle');
        }

        self.triggerPlanetSmashMusic = function () {
            music.startCueGroup('smash');
        }

        self.triggerVictoryMusic = function () {
            music.startCueGroup('victory');
        }

        self.triggerDefeatMusic = function () {
            music.startCueGroup('defeat');
        }

        self.triggerCelestialTargetingMusic = function () {
            music.startCueGroup('celestial_targeting');
        }

        self.triggerRewindMusic = function () {
            music.startCueGroup('rewind');
        }

        self.setDefeated = function (value) {
            if (defeated && !value)
                setAudioResponsePriorityLevel(starting_priority_level);
            defeated = value;
        }

        self.processEvent = function (event_type, sub_type) {
            if (defeated)
                return;

            var response = responses[event_type];
            var use_sub_type = sub_type !== -1;

            if (response) {
                // Note: This strips off spec tags when looking for a sub-type
                var specNameMatch = /.*\.json/.exec(sub_type);
                if (specNameMatch)
                    sub_type = specNameMatch.pop();
                if (use_sub_type && response[sub_type])
                    response = response[sub_type];

                if (response.trigger)
                    response.trigger();
            }
        };
    }

    return new AudioModel();
})()

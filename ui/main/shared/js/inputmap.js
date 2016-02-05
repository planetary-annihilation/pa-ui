var inputmap = {
    paused: ko.observable(false)
};

(function() {
    var resumeFn = Mousetrap.stopCallback;
    var pausedFn = function() { return true; };
    inputmap.paused.subscribe(function(paused) {
        Mousetrap.stopCallback = paused ? pausedFn : resumeFn;
    });
})();

var maybeInvoke = function (target) {
    if (model[target])
        model[target]();
};

var maybeInvokeWith = function (target, p1, p2) {
    if (model[target])
        model[target](p1, p2);
};

var getValueOf = function (target) {
    return model[target] ? model[target]() : null;
};

var action_sets = {
    'general': {
        show_hide_ui: api.game.toggleUI,
        show_hide_ar: api.arch.toggleAR,
        show_hide_performance_panel: api.game.toggleStatsPanel,
        toggle_music: api.audio.toggleMusic,
        toggle_fullscreen: function() {
            var curMode = api.settings.value('graphics', 'display_mode').toLowerCase();
            var newMode = (curMode === 'windowed') ? 'fullscreen' : 'windowed';
            api.settings.set('graphics', 'display_mode', newMode);
            api.settings.save();
            api.game.setFullscreen(newMode === 'fullscreen');
        },
        normal_chat: function () { maybeInvoke('startNormalChat'); },
        team_chat: function () { maybeInvoke('startTeamChat'); },
        toggle_pips: function () { maybeInvoke('togglePips'); },
        swap_pips: function () { maybeInvoke('swapPips'); },
        copy_to_pip: function () { maybeInvoke('copyToPip'); },
        toggle_pip_mirror: function () { maybeInvoke('togglePipMirrorMode'); },
        toggle_gamestats: function () { maybeInvoke('toggleGamestatsPanel'); },
        modal_back: function () { maybeInvoke('modalBack'); }
    },
    'camera controls': {
        camera_move_left: function () {},
        camera_move_right: function () {},
        camera_move_up: function () {},
        camera_move_down: function () {},
        camera_zoom_in: function() {},
        camera_zoom_out: function() {}
    },
    'gameplay': {
        command_mode_move: function () { maybeInvokeWith('setCommandIndex', 0); },
        command_mode_attack: function () { maybeInvokeWith('setCommandIndex', 1); },
        command_mode_assist: function () { maybeInvokeWith('setCommandIndex', 2); },
        command_mode_repair: function () { maybeInvokeWith('setCommandIndex', 3); },
        command_mode_reclaim: function () { maybeInvokeWith('setCommandIndex', 4); },
        command_mode_patrol: function () { maybeInvokeWith('setCommandIndex', 5); },

        command_mode_special_move: function () { maybeInvokeWith('setCommandIndex', 7); },
        command_mode_unload: function () { maybeInvokeWith('setCommandIndex', 9); },
        command_mode_load: function () { maybeInvokeWith('setCommandIndex', 10); },
        command_mode_alt_fire: function () { maybeInvokeWith('setCommandIndex', 12); },
        command_mode_ping: function () { maybeInvokeWith('setCommandIndex', 13); },
        command_mode_mass_teleport: function() { maybeInvokeWith('setCommandIndex', 14); },

        stop_command: function () { maybeInvokeWith('setCommandIndex', -1); },

        fire_at_will: function () { maybeInvoke('selectionFireAtWill'); },
        return_fire: function () { maybeInvoke('selectionReturnFire'); },
        hold_fire: function () { maybeInvoke('selectionHoldFire'); },
        toggle_fire_orders: function () { maybeInvoke('toggleFireOrderIndex'); },

        maneuver: function () { maybeInvoke('selectionManeuver'); },
        roam: function () { maybeInvoke('selectionRoam'); },
        hold_position: function () { maybeInvoke('selectionHoldPosition'); },
        toggle_move_orders: function () { maybeInvoke('toggleMoveOrderIndex'); },

        energy_on: function () { maybeInvoke('selectionConsume'); },
        energy_off: function () { maybeInvoke('selectionConserve'); },
        toggle_energy_orders: function () { maybeInvoke('toggleEnergyOrderIndex'); },

        build_once: function () { maybeInvoke('selectionBuildStanceNormal'); },
        build_loop: function () { maybeInvoke('selectionBuildStanceContinuous'); },
        toggle_build_orders: function () { maybeInvoke('toggleBuildStanceOrderIndex'); },

        acknowledge_alert: function () { maybeInvoke('acknowledgeAlert'); },
        acknowledge_combat: function () { maybeInvoke('acknowledgeCombat'); },

        enable_navigation_debug_info: function () { api.arch.setNavDebug(true); },
        disable_navigation_debug_info: function () { api.arch.setNavDebug(false); },
        select_commander: input.doubleTap(api.select.commander, function () { api.camera.track(true); input.doubleTap.reset(); }),
        select_idle_fabbers: input.doubleTap(api.select.idleFabber, function () { api.camera.track(true); }),

        select_all_factories: api.select.allFactories,
        select_all_idle_factories: api.select.allIdleFactories,
        select_all_factories_on_screen: api.select.allFactoriesOnScreen,
        select_all_idle_factories_on_screen: api.select.allIdleFactoriesOnScreen,
        select_all_combat_units: api.select.allCombatUnits,
        select_all_combat_units_on_screen: api.select.allCombatUnitsOnScreen,

        select_all_air_combat_units_on_screen: api.select.allAirCombatUnitsOnScreen,
        select_all_naval_combat_units_on_screen: api.select.allNavalCombatUnitsOnScreen,
        select_all_land_combat_units_on_screen: api.select.allLandCombatUnitsOnScreen,

        select_all_air_combat_units: api.select.allAirCombatUnits,
        select_all_naval_combat_units: api.select.allNavalCombatUnits,
        select_all_land_combat_units: api.select.allLandCombatUnits,

        select_all_matching_units_on_screen: function () { maybeInvoke('selectedAllMatchingCurrentSelectionOnScreen'); },

        track_selection_with_camera: function () { api.camera.track(true); },
        self_destruct_selected_unit: function () { maybeInvoke('maybeDeleteUnits'); },

        resume_at_latest_time: api.time.resume,
        pause_time: api.time.pause,
        play_forward_at_100: function () { api.time.play(1.0); },
        play_backwards_at_100: function () { api.time.play(-1.0); },
        play_forward_at_50: function () { api.time.play(0.5); },
        play_backwards_at_50: function () { api.time.play(-0.5); },

        play_forward_at_10: function () { api.time.play(0.1); },
        play_backwards_at_10: function () { api.time.play(-0.1); },

        skip_forward_1sec: function () { api.time.skip(1.0); },
        skip_backwards_1sec: function () { api.time.skip(-1.0); },

        last_pseudo_frame: api.time.frameBack,
        next_pseudo_frame: api.time.frameForward,

        capture_group_1: function () { api.select.captureGroup(1); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_2: function () { api.select.captureGroup(2); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_3: function () { api.select.captureGroup(3); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_4: function () { api.select.captureGroup(4); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_5: function () { api.select.captureGroup(5); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_6: function () { api.select.captureGroup(6); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_7: function () { api.select.captureGroup(7); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_8: function () { api.select.captureGroup(8); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_9: function () { api.select.captureGroup(9); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },
        capture_group_0: function () { api.select.captureGroup(0); api.audio.playSound('/SE/UI/UI_Controlgroup_add'); },

        recall_group_1: input.doubleTap(function () { api.select.recallGroup(1); }, function () { api.camera.track(true); }),
        recall_group_2: input.doubleTap(function () { api.select.recallGroup(2); }, function () { api.camera.track(true); }),
        recall_group_3: input.doubleTap(function () { api.select.recallGroup(3); }, function () { api.camera.track(true); }),
        recall_group_4: input.doubleTap(function () { api.select.recallGroup(4); }, function () { api.camera.track(true); }),
        recall_group_5: input.doubleTap(function () { api.select.recallGroup(5); }, function () { api.camera.track(true); }),
        recall_group_6: input.doubleTap(function () { api.select.recallGroup(6); }, function () { api.camera.track(true); }),
        recall_group_7: input.doubleTap(function () { api.select.recallGroup(7); }, function () { api.camera.track(true); }),
        recall_group_8: input.doubleTap(function () { api.select.recallGroup(8); }, function () { api.camera.track(true); }),
        recall_group_9: input.doubleTap(function () { api.select.recallGroup(9); }, function () { api.camera.track(true); }),
        recall_group_0: input.doubleTap(function () { api.select.recallGroup(0); }, function () { api.camera.track(true); }),
        pause_game: function () { maybeInvoke('togglePause'); },
        show_guide: function () { maybeInvoke('toggleShowPlayerGuide'); },
    },
    'build structure': {
        start_build_utility: function () { maybeInvokeWith('startBuild', 'utility', true); },
        start_build_factory: function () { maybeInvokeWith('startBuild', 'factory', true); },
        start_build_combat: function () { maybeInvokeWith('startBuild', 'combat', true); },
        start_build_orbital_structure: function () { maybeInvokeWith('startBuild', 'orbital_structure', true); },
        start_build_ammo: function () { maybeInvokeWith('startBuild', 'ammo', true); },
    },
    'build unit': {
        start_build_vehicle: function () { maybeInvokeWith('startBuild', 'vehicle', true); },
        start_build_bot: function () { maybeInvokeWith('startBuild', 'bot', true); },
        start_build_air: function () { maybeInvokeWith('startBuild', 'air', true); },
        start_build_sea: function () { maybeInvokeWith('startBuild', 'sea', true); },
        start_build_orbital_unit: function () { maybeInvokeWith('startBuild', 'orbital', true); }
    },
    'build': {
        build_item_1: function () { maybeInvokeWith('buildItemFromList', 0); },
        build_item_2: function () { maybeInvokeWith('buildItemFromList', 1); },
        build_item_3: function () { maybeInvokeWith('buildItemFromList', 2); },
        build_item_4: function () { maybeInvokeWith('buildItemFromList', 3); },
        build_item_5: function () { maybeInvokeWith('buildItemFromList', 4); },
        build_item_6: function () { maybeInvokeWith('buildItemFromList', 5); },

        build_item_7: function () { maybeInvokeWith('buildItemFromList', 6); },
        build_item_8: function () { maybeInvokeWith('buildItemFromList', 7); },
        build_item_9: function () { maybeInvokeWith('buildItemFromList', 8); },
        build_item_10: function () { maybeInvokeWith('buildItemFromList', 9); },
        build_item_11: function () { maybeInvokeWith('buildItemFromList', 10); },
        build_item_12: function () { maybeInvokeWith('buildItemFromList', 11); },

        build_item_13: function () { maybeInvokeWith('buildItemFromList', 12); },
        build_item_14: function () { maybeInvokeWith('buildItemFromList', 13); },
        build_item_15: function () { maybeInvokeWith('buildItemFromList', 14); },
        build_item_16: function () { maybeInvokeWith('buildItemFromList', 15); },
        build_item_17: function () { maybeInvokeWith('buildItemFromList', 16); },
        build_item_18: function () { maybeInvokeWith('buildItemFromList', 17); }
    },
    'camera': {
        capture_anchor_1: function () { api.camera.captureAnchor(1); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_2: function () { api.camera.captureAnchor(2); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_3: function () { api.camera.captureAnchor(3); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_4: function () { api.camera.captureAnchor(4); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_5: function () { api.camera.captureAnchor(5); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_6: function () { api.camera.captureAnchor(6); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_7: function () { api.camera.captureAnchor(7); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_8: function () { api.camera.captureAnchor(8); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_9: function () { api.camera.captureAnchor(9); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },
        capture_anchor_0: function () { api.camera.captureAnchor(0); api.audio.playSound('/SE/UI/UI_camera_anchor_saved'); },

        recall_anchor_1: function () { api.camera.recallAnchor(1); },
        recall_anchor_2: function () { api.camera.recallAnchor(2); },
        recall_anchor_3: function () { api.camera.recallAnchor(3); },
        recall_anchor_4: function () { api.camera.recallAnchor(4); },
        recall_anchor_5: function () { api.camera.recallAnchor(5); },
        recall_anchor_6: function () { api.camera.recallAnchor(6); },
        recall_anchor_7: function () { api.camera.recallAnchor(7); },
        recall_anchor_8: function () { api.camera.recallAnchor(8); },
        recall_anchor_9: function () { api.camera.recallAnchor(9); },
        recall_anchor_0: function () { api.camera.recallAnchor(0); },

        history_back: function () { api.camera.back(); },
        history_forward: function () { api.camera.forward(); },

        set_planet_camera: function () { model.cameraMode('planet'); },
        set_free_camera: function () { model.cameraMode('free'); },
        set_debug_camera: function () { model.cameraMode('debug'); },
        set_space_camera: function () { model.cameraMode('space'); },
        toggle_free_camera: function () { model.cameraMode(model.cameraMode() === 'free' ? 'planet' : 'free'); },
        toggle_debug_camera: function () { model.cameraMode(model.cameraMode() === 'debug' ? 'planet' : 'debug'); },
        toggle_space_camera: function () { model.cameraMode(model.cameraMode() === 'space' ? 'planet' : 'space'); },
        zoom_to_surface: function () { api.camera.setZoom('surface'); },
        zoom_to_air: function () { api.camera.setZoom('air'); },
        zoom_to_orbital: function () { api.camera.setZoom('orbital'); },
        zoom_to_celestial: function () { api.camera.setZoom('celestial'); },
        previous_planet: function () { model.focusPreviousPlanet(); },
        next_planet: function () { model.focusNextPlanet(); },
        align_to_pole: function () { model.alignCameraToPole(); },

        increase_camera_pan_speed: function () { api.camera.changeKeyPanSpeed(0.01); },
        decrease_camera_pan_speed: function () { api.camera.changeKeyPanSpeed(-0.01); },

        smooth_zoom_out: function () { api.camera.zoom( -1); },
        smooth_zoom_in: function () { api.camera.zoom( 1); },

        relax_constraints: function () { engine.call("camera.relaxConstraints", 2); },
        restore_constraints: function () { engine.call("camera.restoreConstraints"); }
    },
    'free camera controls': {
        free_move_left: function () {},
        free_move_right: function () {},
        free_move_up: function () {},
        free_move_down: function () {},
        free_move_forward: function () {},
        free_move_backward: function () {},
        free_roll_left: function () {},
        free_roll_right: function () {},
        free_pitch_forward: function() {},
        free_pitch_backward: function() {},
        free_yaw_left: function() {},
        free_yaw_right: function() {},
        free_zoom_in: function () { },
        free_zoom_out: function() {}
    },
    'terrain editor': {
        toggle_edit_terrain_mode: api.terrain_editor.toggleEditTerrainMode,
        delete_selected: api.terrain_editor.deleteSelectedCsg,
        copy_selected: api.terrain_editor.copySelectedCsg,
        paste: api.terrain_editor.pasteCsg,
        rotate_csg_cw: api.terrain_editor.rotateCsgCW,
        rotate_csg_ccw: api.terrain_editor.rotateCsgCCW,
        scale_csg_up: api.terrain_editor.scaleCsgUp,
        scale_csg_down: api.terrain_editor.scaleCsgDown,
		disconnect_csg_twin: api.terrain_editor.disconnectCsgTwin,

        scale_csg_vertically_up: api.terrain_editor.scaleCsgVerticallyUp,
        scale_csg_vertically_down: api.terrain_editor.scaleCsgVerticallyDown,
        scale_csg_horizontally_up: api.terrain_editor.scaleCsgHorizontallyUp,
        scale_csg_horizontally_down: api.terrain_editor.scaleCsgHorizontallyDown,

        move_csg_up: api.terrain_editor.moveCsgUp,
        move_csg_down: api.terrain_editor.moveCsgDown,
        grab_csg: api.terrain_editor.grabCsg,
        set_pathable_csg: api.terrain_editor.setPathableCsg,
        toggle_edit_metal_spot: api.terrain_editor.toggleEditMetalSpots,
        add_metal_spot: api.terrain_editor.addMetalspot,
        delete_metal_spot: api.terrain_editor.deleteMetalSpot,
        add_landing_zone: api.terrain_editor.addLandingZone,
        delete_landing_zone: api.terrain_editor.deleteLandingZone,
        toggle_show_water: api.terrain_editor.toggleShowWater
    },
    'debugging': {
        abort: api.debug.abort,
        crash: api.debug.crash,
        reload_view: function() { api.game.debug.reloadScene(api.Panel.pageId); },
        toggle_audio_logging: api.audio.toggleLogging,
        quick_profile: api.game.debug.quickProbe,
        bug_report: function () {
            //model.browserHome("http://pa.lennardf1989.com/Tracker/");
            //model.openBrowser();
            //model.navBrowserHome();
        },
        toggle_nav_debug: api.arch.toggleNavDebug,
        toggle_console: gameConsole.toggle
    },
    /* hacks have to be enabled on the server for these commands to work */
    'hacks': {
        copy_unit: api.unit.debug.copy,
        paste_unit: api.unit.debug.paste,
        set_army_from_hover: api.arch.debug.setArmyFromHover,
        toggle_fow: api.arch.debug.toggleIgnoreVisibility,
        build_avatar: function () { if (model['maybeSetBuildTarget']) model['maybeSetBuildTarget']('/pa/units/commanders/avatar/avatar.json'); },
        build_avatar_factory: function () { if (model['maybeSetBuildTarget']) model['maybeSetBuildTarget']('/pa/units/land/avatar_factory/avatar_factory.json'); },
        publish_server_mods: api.mods.publishServerMods
    }
};

var input_audio_response_overrides = {
    'build_item_1': '',
    'build_item_2': '',
    'build_item_3': '',
    'build_item_4': '',
    'build_item_5': '',

    'build_item_6': '',
    'build_item_7': '',
    'build_item_8': '',
    'build_item_9': '',
    'build_item_10': '',

    'build_item_11': '',
    'build_item_12': '',
    'build_item_13': '',
    'build_item_14': '',
    'build_item_15': '',

    'build_item_16': '',
    'build_item_17': '',
    'build_item_18': '',

    'paste_unit': '',
    'rotate_csg_cw': '',
    'rotate_csg_ccw': '',
    'scale_csg_up': '',
    'scale_csg_down': '',
    'move_csg_up': '',
    'move_csg_down': '',
};

var allow_repeat = ['last_pseudo_frame',
                    'next_pseudo_frame',
                    'paste_unit',
                    'rotate_csg_cw',
                    'rotate_csg_ccw',
                    'scale_csg_up',
                    'scale_csg_down',
                    'move_csg_up',
                    'move_csg_down',
                    'scale_csg_vertically_up',
                    'scale_csg_vertically_down',
                    'scale_csg_horizontally_up',
                    'scale_csg_horizontally_down'
];

/* note: these should be refactored into a module */
var input_maps;
var input_maps_reload;
(function () {

    function create_input_maps() {
        var result = {};

        function create_dictionary_and_keymap(group) {
            var dictionary = {};
            var keymap = {};
            var used_in_combo = {};

            _.forIn(action_sets[group], function (fn, key) {
                var binding = api.settings.value('keyboard', key);
                if (!binding)
                    return;

                var parts = binding.split('+');
                if (parts.length > 1)
                    _.forEach(parts, function (element) {
                        used_in_combo[element] = true;
                    });
            })

            _.forIn(action_sets[group], function (fn, key) {
                var wrapping_fn = function () {
                    fn.apply(this, arguments);
                    var audio_response = _.isUndefined(input_audio_response_overrides[key]) ? '/SE/UI/UI_Click' : input_audio_response_overrides[key];
                    if (audio_response)
                        api.audio.playSound(audio_response);
                };

                var alt;
                var use_alt = false;
                var binding = api.settings.value('keyboard', key);
                if (!binding)
                    return;

                if (binding.split('+').length === 1 && !used_in_combo[binding]) {
                    dictionary[binding.toLowerCase()] = wrapping_fn;
                    dictionary['shift+' + binding.toLowerCase()] = wrapping_fn;
                }
                else
                    dictionary[binding.toLowerCase()] = wrapping_fn;

                keymap[binding] = key;
            });

            return {
                dictionary: dictionary,
                keymap: keymap
            };
        }

        _.forIn(action_sets, function (set, group) {
            result[group] = create_dictionary_and_keymap(group);
        });

        return result;
    }

    input_maps = create_input_maps();

    var reload = $.Deferred();
    input_maps_reload = reload.promise();

    globalHandlers['inputmap.reload'] = function () {
        api.settings.loadLocalData();
        input_maps = create_input_maps();
        reload.notify(input_maps);
    };

})();

var squelch_list = ['backspace', 'alt+left', 'alt+right', 'ctrl+w', 'shift+backspace'];

var prev_camera_controls_hash = '';

var active_maps = ko.observable({});
input_maps_reload.progress(function() {
    active_maps(active_maps());
});

var active_dictionary = ko.computed(function () {
    var result = {};

    _.forIn(active_maps(), function (element, key) {
        if (key === 'camera controls')
            return;

        if (input_maps[key]) {
            var partial = input_maps[key].dictionary;
            _.assign(result, partial);
        }
        else
            console.log('could not find input map: ' + key);
    });

    // apply squelch
    _.forEach(squelch_list, function (keypress) {
        var userBinding = result[keypress];
        result[keypress] = userBinding ? (function () {
            userBinding();
            return false;
        }) : (function () {
            return false;
        });
    });

    return result;
});

var apply_camera_controls = function () {
    var group = 'free camera controls';
    var active = active_maps()[group];
    var camera_controls;
    var hash;
    var result = {};

    if (!active) {
        group = 'camera controls';
        active = active_maps()[group];
        camera_controls = input_maps[group];

        _.forIn(camera_controls.keymap, function (element, key) {
            var found = !!active_dictionary()[key];
            /* the js keys for camera controls do not perfectly match the c++ keys,
               so the the keys must be changed to the expected format before passing the payload to 'set_camera_key_map'.
               this does not modify the persistant js data. */
            var action = element.replace('camera_', '');
            result[action] = (active && !found) ? key : 'none';
        });
    }
    else {
        camera_controls = input_maps[group];
        _.forIn(camera_controls.keymap, function (element, key) {
            /* the js keys for camera controls do not perfectly match the c++ keys,
             so the the keys must be changed to the expected format before passing the payload to 'set_camera_key_map'.
             this does not modify the persistant js data. */
            var action = element.replace('free_', '');
            result[action] = key;
        });
    }

    hash = JSON.stringify(result);

    if (hash !== prev_camera_controls_hash)
        engine.call('set_camera_key_map', JSON.stringify(result));
    prev_camera_controls_hash = hash;
};

active_dictionary.subscribe(function () {
    Mousetrap.reset();
    Mousetrap.bind(active_dictionary(), 'keydown');
});

var active_keymap = ko.computed(function () {
    var result = {};

    _.forIn(active_maps(), function (element, key) {
        if (key !== 'camera controls') {
            if (input_maps[key]) {
                var partial = input_maps[key].keymap;
                _.assign(result, partial);
            }
            else
                console.log('could not find input map: ' + key);
        }
    });

    return result;
});

var active_actionmap = ko.computed(function () {
    return _.invert(active_keymap());
});
active_actionmap.subscribe(function (value) {

    var allow_repeat_map = {};

    _.forEach(allow_repeat, function (element) {
        allow_repeat_map[value[element]] = true;
    });

    /* we have to allow the squelched keybinds to repeat
       or holding down the key combinations will cause the default behavior to trigger.*/
    _.forEach(squelch_list, function (element) {
        allow_repeat_map[element] = true;
    });

    Mousetrap.setAllowRepeatMap(allow_repeat_map);
});

function apply_keybinds(group) {
    if (group === 'camera controls')
        return;

    var maps = active_maps();
    if (!maps[group]) {
        maps[group] = true;
        active_maps(maps);
    }
}

function remove_keybinds (group) {
    var maps = active_maps();
    if (maps[group]) {
        delete maps[group];
        active_maps(maps);
    }
}

function modify_keybinds(options /* remove: [], add : [] */) {
    var maps = active_maps();
    var hash = JSON.stringify(maps);

    _.forEach(options.remove, function (element) {
        delete maps[element];
    });

    _.forEach(options.add, function (element) {
        maps[element] = true;
    });

    if (hash !== JSON.stringify(maps))
        active_maps(maps);
}

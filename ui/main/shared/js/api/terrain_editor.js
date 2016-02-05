(function (api) {

    var editingTerrain = ko.observable(false);
    var editingMetalSpots = ko.observable(false);
    var editingLandingZones = ko.observable(false);

    var waitForPlanetReady = $.Deferred();

    var speedFactor = function () {
        return Mousetrap.isShiftDown() ? 2.0 : 1.0;
    };

    var waitForEndAllModes = function () {
        waitForPlanetReady = $.Deferred();

        waitForPlanetReady.then(function () {
            if (editingMetalSpots())
                engine.call('systemEditor.end_edit_planet_metal_spots');
            if (editingLandingZones())
                engine.call('systemEditor.end_edit_landing_zones');

            editingTerrain(false);
            editingMetalSpots(false);
            editingLandingZones(false);
        });

        if (editingTerrain())
            engine.call('systemEditor.end_edit_planet_csg');
        else
            waitForPlanetReady.resolve();

        return waitForPlanetReady.promise();
    };

    api.terrain_editor = {
        editingTerrain: editingTerrain,
        editingMetalSpots: editingMetalSpots,
        editingLandingZones: editingLandingZones,
        signalPlanetReady: function () { waitForPlanetReady.resolve(); },
        startEditPlanetCsg: function () {
            waitForEndAllModes().then(function () {
                editingTerrain(true);
                return engine.call('systemEditor.start_edit_planet_csg');
            });
        },
        endEditPlanetCsg: function () {
            editingTerrain(false);
            return engine.call('systemEditor.end_edit_planet_csg');
        },
        toggleEditTerrainMode: function () {
            if (editingTerrain())
                return api.terrain_editor.endEditPlanetCsg();
            else
                return api.terrain_editor.startEditPlanetCsg();
        },
        deleteSelectedCsg: function () {
            return engine.call('systemEditor.delete_selected_csg');
        },
        copySelectedCsg: function () {
            return engine.call('systemEditor.copy_selected_csg');
        },
        disconnectCsgTwin: function () {
        	return engine.call('systemEditor.disconnect_csg_twin');
        },
        pasteCsg: function () {
            return engine.call('systemEditor.paste_csg');
        },
        setCsgDescription: function (brush) {
            if (!api.terrain_editor.isBrushAvailable(brush))
                return null;

            var payload;
            try {
                payload = JSON.stringify(brush);
            }
            catch (error) {
                console.error('failed to stringify brush');
                return null;
            }
            return engine.call('systemEditor.set_target_brush_description', payload);
        },
        rotateCsgCW: function () {
            return engine.call('systemEditor.rotate_selected_csg', Number(0.01 * speedFactor()));
        },
        rotateCsgCCW: function () {
            return engine.call('systemEditor.rotate_selected_csg', Number(-0.01 * speedFactor()));
        },
        scaleCsgUp: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(0.01 * speedFactor()), Number(0.01 * speedFactor()), Number(0.01 * speedFactor()));
        },
        scaleCsgDown: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(-0.01 * speedFactor()), Number(-0.01 * speedFactor()), Number(-0.01 * speedFactor()));
        },
        scaleCsgVerticallyUp: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(0.0), Number(0.0), Number(0.01 * speedFactor()));
        },
        scaleCsgVerticallyDown: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(0.0), Number(0.0), Number(-0.01 * speedFactor()));
        },
        scaleCsgHorizontallyUp: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(0.01 * speedFactor()), Number(0.01 * speedFactor()), Number(0.0));
        },
        scaleCsgHorizontallyDown: function () {
            return engine.call('systemEditor.scale_selected_csg', Number(-0.01 * speedFactor()), Number(-0.01 * speedFactor()), Number(0.0));
        },
        moveCsgUp: function () {
            return engine.call('systemEditor.move_vertically_selected_csg', Number(1 * speedFactor()));
        },
        moveCsgDown: function () {
            return engine.call('systemEditor.move_vertically_selected_csg', Number(-1 * speedFactor()));
        },
        grabCsg: function () {
            return engine.call('systemEditor.grab_selected_csg');
        },
        placeCsg: function () {
            return engine.call('systemEditor.place_selected_csg');
        },
        setPathableCsg: function () {
            return engine.call('systemEditor.set_pathable_csg', true);
        },
        clearPathableCsg: function () {
            return engine.call('systemEditor.set_pathable_csg', false);
        },
        setMergableCsg: function () {
            return engine.call('systemEditor.set_mergable_csg', true);
        },
        startEditMetalSpots: function () {
            return waitForEndAllModes().then(function () {
                editingMetalSpots(true);
                return engine.call('systemEditor.start_edit_planet_metal_spots');
            });
        },
        endEditMetalSpots: function () {
            editingMetalSpots(false);
            return engine.call('systemEditor.end_edit_planet_metal_spots');
        },
        toggleEditMetalSpots: function () {
            if (editingMetalSpots())
                return api.terrain_editor.endEditMetalSpots();
            else
                return api.terrain_editor.startEditMetalSpots();
        },
        addMetalspot: function () {
            return engine.call('systemEditor.add_metal_spot');
        },
        deleteMetalSpot: function () {
            return engine.call('systemEditor.delete_metal_spot');
        },
        startEditLandingZones: function () {
            return waitForEndAllModes().then(function () {
                editingLandingZones(true);
                return engine.call('systemEditor.start_edit_landing_zones');
            });
        },
        endEditLandingZones: function () {
            editingLandingZones(false);
            return engine.call('systemEditor.end_edit_landing_zones');
        },
        toggleEditLandingZones: function () {

            if (editingLandingZones())
                return api.terrain_editor.endEditLandingZones();
            else
                return api.terrain_editor.startEditLandingZones();
        },
        addLandingZone: function () {
            return engine.call('systemEditor.add_landing_zone');
        },
        deleteLandingZone: function () {
            return engine.call('systemEditor.delete_landing_zone');
        },
        setLandingZoneRules: function (rules) {
            return engine.call('systemEditor.set_landing_zone_rules', JSON.stringify(rules));
        },
        isBrushAvailable: function(brush) {
            if (!brush || !brush.required_content)
                return true;

            return _.contains(api.content.unlocked(), brush.required_content);
        },
        toggleShowWater: function () {
            return engine.call('systemEditor.toggle_show_water');
        }
    };
})(window.api);

(function (api) {
    api.ar_system = {
        changePlanetSelectionState: function (index, new_state) {
            var i = Number(index);

            if (index >= 0)
                engine.call('planet.changeSelectionState', i, new_state);
        },
        changeSkyboxOverlayColor: function (r, g, b, a) {
            if (_.every([r, g, b, a], function (v) { return v >= 0 && v <= 1.0; }))
                engine.call('skybox.changeOverlayColor', r, g, b, a);
            else
                console.error('changeSkyboxOverlayColor expects a color values in [0.0,1.0]');          
        },
    };
})(window.api);

function init_arch(api) {

    api.arch = {
        toggleMetalSpots: function () { engine.call('arch.toggleMetalSpotIcons'); },
        toggleHealthBars: function () { engine.call('arch.toggleHealthBars'); },
        toggleSIcons: function () { engine.call('arch.toggleSIcons'); },
        toggleShowFriendOrFoeColorsOnly: function () { engine.call('arch.toggleShowFriendOrFoeColorsOnly'); },
        toggleAR: function () { engine.call('arch.toggleAR'); },
        setIconScale: function (scale) { engine.call('arch.setIconScale', typeof (scale) === 'number' ? scale : 1.0); },
        setNavDebug: function (enable) { engine.call('arch.setNavDebug', typeof (enable) === 'boolean' ? enable : false); },
        toggleNavDebug: function (enable) { engine.call('arch.toggleNavDebug'); },
        beginFabMode: function(spec) {
            return engine.call('arch.beginFabMode', spec);
        },
        endFabMode: function() {
            engine.call('arch.endFabMode');
        },
        endAreaCommandMode: function() {
            engine.call('arch.endAreaCommandMode');
        },
        /* hacks have to be enabled on the server for these commands to work */
        debug: {
            setArmyFromHover: function() { return engine.call('arch.debug.setArmyFromHover'); },
            toggleIgnoreVisibility: function () { return engine.call('arch.debug.toggleIgnoreVisibility'); }
        }
    };
};

init_arch(window.api);

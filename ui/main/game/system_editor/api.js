// API overlay for the system editor

define(function() {
    
    api.systemEditor = {
        start: function() {
            return engine.call("start_system_editor");
        },
        
        beginControlCamera: function() {
            return engine.call('systemEditor.beginControlCamera');
        },
        endControlCamera: function() {
            return engine.call('systemEditor.endControlCamera');
        },

        addPlanet: function(planetSpec) {
            return engine.call('execute', 'add_planet', JSON.stringify(planetSpec));
        },
        
        preloadPlanet: function(planetSpec) {
            return engine.call('systemEditor.preloadPlanet', JSON.stringify(planetSpec));
        },
        movePlanets: function(system) {
            return engine.call('systemEditor.movePlanets', JSON.stringify(system));
        },
        
        pause: function(paused) {
            return engine.call('execute', 'pause', JSON.stringify({ paused: paused }));
        },
        setTime: function(time) {
            return engine.call('systemEditor.setTime', time);
        },
    };
    
    return api;
});

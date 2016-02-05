function init_unit(api) {
    api.unit = {
        selfDestruct: function () { engine.call('unit.selfDestruct'); },
        build: function(spec, count, immediate) {
            return engine.call('unit.build', spec, count, immediate);
        },        
        cancelBuild: function(spec, count, immediate) {
            return engine.call('unit.cancelBuild', spec, count, immediate);
        },
        targetCommand: function(command, target, queue) {
            return engine.call('unit.targetCommand', command, target, !!queue);
        },    
        debug: {
            copy: function () { engine.call('unit.debug.copy'); },
            paste: function () { engine.call('unit.debug.paste'); }
        }
    };
};
init_unit(window.api);
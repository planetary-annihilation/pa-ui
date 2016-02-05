var DEV_MODE = (gEngineParams && gEngineParams.devmode);

var globalHandlers = {};
var model = {};
var global_mod_list = [];
var scene_mod_list = {};
var messageLog = {};
var app = {};

var constants = {
    PLANET_CSG_DATABASE: 'planet_csg',
    PLANET_METAL_SPOTS_DATABASE: 'planet_metal_spots',
    PLANET_LANDING_ZONES_DATABASE: 'planet_landing_zones'
};

var wrapWithTiming = function(label, func) {
    return func;
};
var profileAllTheThings = false;
if (profileAllTheThings)
{
    wrapWithTiming = function(label, func) {
        return function() {
            console.time(label);
            func.apply(this, arguments);
            console.timeEnd(label);
        };
    };
}

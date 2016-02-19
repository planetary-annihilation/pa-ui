function init_mods(api) {

    api.mods = {
        // This API is deprecated.  Use api.mods.getMounted() instead.
        getMountedMods: function (context, callback) {
            api.mods.getMounted(context, false).then(function(obj) {
              return obj.mounted_mods
            }).then(callback);
        },

        getMounted: function (context, raw) {
            return engine.call('mods.getMountedMods', context, !!raw).then(function(data) {
                var message;
                try {
                    message = JSON.parse(data);
                } catch (e) {
                    console.log("mods.getMountedMods: JSON parsing error");
                    console.log(data);
                    message = [];
                }
                return message;
            });
        },
        publishServerMods: function () { engine.call('mods.publishServerMods'); },
        sendModFileDataToServer: function (auth_token) { engine.call("mods.sendModFileDataToServer", auth_token); },
        mountModFileData: function () { engine.call("mods.mountModFileData"); }
    };
};

init_mods(window.api);


function init_mods(api) {

    api.mods = {
        // This API is deprecated.  Use api.mods.getMounted() instead.
        getMountedMods: function (context, callback) {
            api.mods.getMounted(context, false).then(function(data) {
              return data;
            }).then(callback);
        },

        getMounted: function (context, raw) {
            return engine.call('mods.getMountedMods', context, !!raw).then(function(data) {
                var message;
                try {
                    message = JSON.parse(data).mounted_mods || [];
                } catch (e) {
                    console.error("mods.getMountedMods: JSON parsing error");
                    console.error(data);
                    message = [];
                }
                return message;
            });
        },
        publishServerMods: function () { return engine.call('mods.publishServerMods'); },
        sendModFileDataToServer: function (auth_token) { return engine.call("mods.sendModFileDataToServer", auth_token); },
        mountModFileData: function () { return engine.call("mods.mountModFileData"); }
    };
};

init_mods(window.api);


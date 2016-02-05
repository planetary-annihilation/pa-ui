function init_mods(api) {

    api.mods = {
        getMountedMods: function (context, callback) {
            engine.call('mods.getMountedMods', context).then(function (data) {
                var message;
                try {
                    message = JSON.parse(data);
                } catch (e) {
                    console.log("mods.getMountedMods: JSON parsing error");
                    console.log(data);
                    message = {};
                }
                if (message.mounted_mods !== undefined) {
                    callback(message.mounted_mods);
                } else {
                    console.log("mods.getMountedMods: mounted_mods is undefined");
                }
            });
        },
        publishServerMods: function () { engine.call('mods.publishServerMods'); },
        sendModFileDataToServer: function (auth_token) { engine.call("mods.sendModFileDataToServer", auth_token); },
        mountModFileData: function () { engine.call("mods.mountModFileData"); }
    };
};

init_mods(window.api);


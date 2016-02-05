function init_game(api) {

    var keyboardActivation = 0;

    api.game = {
        getSetupInfo: function() { return engine.call('game.getSetupInfo').then(JSON.parse); },
        toggleUI: function () { engine.call('game.toggleUI'); },
        hideUI: function () { engine.call('game.hideUI'); },
        showUI: function () { engine.call('game.showUI'); },
        toggleStatsPanel: function () { engine.call('game.toggleStatsPanel'); },
        toggleFullscreen: function() { engine.call('game.toggleFullscreen'); },
        setFullscreen: function(fullscreen) { engine.call('game.toggleFullscreen', !!fullscreen); },
        captureKeyboard: function (force) {
            if (force || keyboardActivation === 0)
                engine.call('game.allowKeyboard', false);
            if (!force)
                ++keyboardActivation;
        },
        releaseKeyboard: function (force) {
            if (!force) {
                if (keyboardActivation > 0)
                    --keyboardActivation;
                if (keyboardActivation !== 0)
                    return;
            }
            engine.call('game.allowKeyboard', true);
        },
        setUnitSpecTag: function(tag) { engine.call('game.setUnitSpecTag', tag); },
        getUnitSpecTag: function() { return engine.call('game.getUnitSpecTag'); },
        cleanupViews: function() { engine.call('game.cleanupViews'); },
        getRandomPlanetName: function() { return engine.call('game.getRandomPlanetName'); },
        debug: {
            reloadScene: function (panel) { engine.call('game.debug.reloadScene', panel); },
            reloadRoot: function() {
                if (api.Panel.pageId === api.Panel.parentId)
                    api.game.debug.reloadScene(api.Panel.pageId);
                else
                    api.Panel.message(api.Panel.parentId, 'game.reload_root');
            },
            quickProbe: function() { engine.call('game.debug.quickProbe'); },
            startProbe: function() { engine.call('game.debug.startProbe'); },
            endProbe: function() { engine.call('game.debug.endProbe'); },
        },
        outOfGameNotification: function(message) { engine.call('game.outOfGameNotification', message); },
        isWindowFocused: function() { return engine.call('game.isWindowFocused'); },
        chatSpecialMsg: function(message) { return engine.call('game.chatSpecialMsg', message); },
        getCrashReason: function() {
            var deferred = $.Deferred();
            engine.call('game.getCrashReason').then(function(reason) {
                if (!_.isEmpty(reason))
                    deferred.resolve(reason);
                else
                    deferred.reject();
            }, function() { deferred.reject(); });

            return deferred.promise();
        },
        clearCrashReason: function() { engine.call('game.clearCrashReason'); },
    };

    globalHandlers['game.reload_root'] = function() {
        api.game.debug.reloadRoot();
    };

    $(window).unload(function() { engine.call('game.unloadPage'); });
};

init_game(window.api);

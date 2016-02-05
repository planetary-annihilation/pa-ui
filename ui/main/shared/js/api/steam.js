(function (api, handlers) {

    var accountContent = ko.observable(_.get(gEngineParams, ['steam', 'owned_content'], [])).extend({ session: 'steam_owned_content' });
    var overlayDisplayed = ko.observable(false);
    engine.call('steam.isOverlayDisplayed').then(function(displayed) { overlayDisplayed(displayed); });

    api.steam = {
        errors: {
            UNKNOWN_ERROR: 'unknown_error',
            OVERLAY_DISABLED: 'overlay_disabled',
            CONTENT_OWNED: 'content_owned',
        },

        hasClient: ko.observable(_.get(gEngineParams, 'steam', 'confirmed', false)).extend({ session: 'has_steam_client' }),
        openContentStorePage: function(content) {
            var deferred = $.Deferred();
            if (api.content.getInfo(content).owned)
                deferred.reject(api.steam.errors.CONTENT_OWNED);
            else
            {
                api.steam.isOverlayEnabled().then(function(overlay_enabled) {
                    if (!overlay_enabled)
                        deferred.reject(api.steam.errors.OVERLAY_DISABLED);
                    else
                    {
                        engine.call("steam.openContentStorePage", content).then(function(result) {
                            if (result)
                                deferred.resolve();
                            else
                                deferred.reject(api.steam.errors.UNKNOWN_ERROR);
                        });
                    }
                });
            }

            return deferred.promise();
        },
        addContentToCart: function(content) {
            var deferred = $.Deferred();
            if (api.content.getInfo(content).owned)
                deferred.reject(api.steam.errors.CONTENT_OWNED);
            else
            {
                api.steam.isOverlayEnabled().then(function(overlay_enabled) {
                    if (!overlay_enabled)
                        deferred.reject(api.steam.errors.OVERLAY_DISABLED);
                    else
                    {
                        engine.call("steam.addContentToCart", content).then(function(result) {
                            if (result)
                                deferred.resolve();
                            else
                                deferred.reject(api.steam.errors.UNKNOWN_ERROR);
                        });
                    }
                });
            }

            return deferred.promise();
        },
        launchContent: function(content) {
            if (!_.includes(accountContent(), content))
                console.error("Attempting to launch content that we do not own " + content);
            return engine.call("steam.launchContent", content || '');
        },
        updateAccountContent: function() {
            return engine.call("steam.getAccountContent").then(function(content) {
                accountContent(content);
                return content;
            });
        },
        accountOwnsTitans: ko.pureComputed(function() { return _.includes(accountContent(), 'PAExpansion1'); }),
        isOverlayEnabled: function() { return engine.call("steam.isOverlayEnabled"); },
        isOverlayDisplayed: ko.pureComputed(function() { return overlayDisplayed(); }),
    };

    handlers.steam_overlay_activated = function (activated) {
        overlayDisplayed(activated);
        api.steam.updateAccountContent();
    };
})(window.api, globalHandlers);

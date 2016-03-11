(function(api, handlers) {

    var titansWasKSGift = ko.observable(!!gEngineParams.steam.titans_kickstarter_gift);

    var unlockedContent = ko.observableArray(gUnlockedContent || []).extend({ session: 'unlocked_content' });
    var activeContent = ko.observable(gActiveContent || '').extend({ session: 'active_content' });

    var contentDescriptions = {
        PAExpansion1: "Titans"
    };
    var defaultContentDescription = "Classic";

    api.content = {
        unlocked: ko.pureComputed(function() { return unlockedContent(); }),
        getInfo: function(content) {
            var owned = _.contains(unlockedContent(), content);
            var description = _.get(contentDescriptions, content) || defaultContentDescription;

            return {
                owned: owned,
                description: description
            };
        },

        active: ko.pureComputed(function() {
            if (!_.isEmpty(activeContent()) && !_.contains(unlockedContent(), activeContent()))
                return '';
            return activeContent();
        }),

        ownsTitans: ko.pureComputed(function () { return api.content.getInfo('PAExpansion1').owned; }),
        usingTitans: ko.pureComputed(function() {
            return api.content.active() === 'PAExpansion1';
        }),

        setActive: function(content) {
            return engine.call('content.setActive', content);
        },
        mountUntilReset: function(content) {
            return engine.call('content.mountUntilReset', content);
        },
        remount: function() {
            return api.content.mountUntilReset(activeContent());
        },

        catalogUpdated: function() {
            if (PlayFab.isItemOwned('PAExpansion1KickstarterGift'))
                titansWasKSGift(true);
        },

        titansWasKSGift: ko.pureComputed(function() { return titansWasKSGift(); }),
    };

    // Legacy compatibility shim.
    api.content.activeContent = api.content.active;

    handlers.unlocked_content_updated = function(content) {
        unlockedContent(content);
    };

    handlers.active_content_updated = function(content) {
        activeContent(content);
    };
})(window.api, globalHandlers);

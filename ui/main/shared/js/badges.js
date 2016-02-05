(function (global) {
    var exports = {
        all: [
            {
                objectName: 'AlphaBadge',
                name: 'Alpha Participant',
                image: 'coui://ui/main/shared/img/badges/badge_alpha.png',
            },
            {
                objectName: 'BetaBadge',
                name: 'Beta Participant',
                image: 'coui://ui/main/shared/img/badges/badge_beta.png',
            },
            {
                objectName: 'VIPBadge',
                name: 'Uber VIP',
                image: 'coui://ui/main/shared/img/badges/badge_uber_vip.png',
            },
            {
                objectName: 'CustomComBadge',
                name: 'Custom Commander Backer',
                image: 'coui://ui/main/shared/img/badges/badge_custom_commander.png',
            },
            {
                objectName: 'KickstarterBadge',
                name: 'Kickstarter Backer',
                image: 'coui://ui/main/shared/img/badges/badge_kickstarter.png',
            },
            {
                objectName: 'CosmicBadge',
                name: 'PA Founding Commander',
                image: 'coui://ui/main/shared/img/badges/badge_cosmic.png',
            },
        ],
    };

    global.Badges = exports;
})(window);

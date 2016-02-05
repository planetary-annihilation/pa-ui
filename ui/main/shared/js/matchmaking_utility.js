// !LOCNS:leaderboard
var MatchmakingUtility = (function() {
    var ranks = {
        rank_1: {
            level: 5,
            name: 'uber',
            title: '!LOC:Uber'
        },
        rank_2: {
            level: 4,
            name: 'platinum',
            title: '!LOC:Platinum'
        },
        rank_3: {
            level: 3,
            name: 'gold',
            title: '!LOC:Gold'
        },
        rank_4: {
            level: 2,
            name: 'silver',
            title: '!LOC:Silver'
        },
        rank_5: {
            level: 1,
            name: 'bronze',
            title: '!LOC:Bronze'
        },
        provisional: {
            level: 0,
            name: 'provisional',
            title: '!LOC:Provisional'
        },
        unranked: {
            level: -1,
            name: '',
            title: ''
        }
    };

    var badgeUrlBase = 'coui://ui/main/shared/img/level_badges';

    function getRank(rank) {
        if (rank in ranks) {
            return ranks[rank];
        } else {
            return ranks.unranked;
        }
    }

    function getLevel(rank) {
        return getRank(rank).level;
    }

    function getRankNumber(rank) {
        var level = getLevel(rank);
        if (level > 0)
            return 6 - level;
        return level;
    }

    function getName(rank) {
        return getRank(rank).name;
    }

    function getTitle(rank) {
        return loc(getRank(rank).title);
    }

    function getBadgeURL(rank) {
        var level = getLevel(rank);
        if (level < 0)
            return '';
        return badgeUrlBase + '/badge_level_' + level + '_96px.png';
    }

    function getDisabledBadgeURL(rank) {
        var level = getLevel(rank);
        if (level < 0)
            return '';
        return badgeUrlBase + '/badge_level_' + level + '_96px_bw.png';
    }

    function getSmallBadgeURL(rank) {
        var level = getLevel(rank);
        if (level < 0)
            return '';
        return badgeUrlBase + '/badge_level_' + level + '_28px.png';
    }

    function getBadgeSlotURL() {
        return badgeUrlBase + '/badge_slot_96px.png';
    }

    function getMatchmakingType() {
        var type = 'Ladder1v1';
        if (!_.isEmpty(api.content.activeContent()))
            type = api.content.activeContent() + ':' + type;

        return type;
    };

    return {
        getLevel: getLevel,
        getRankNumber: getRankNumber,
        getName: getName,
        getTitle: getTitle,
        getBadgeURL: getBadgeURL,
        getDisabledBadgeURL: getDisabledBadgeURL,
        getSmallBadgeURL: getSmallBadgeURL,
        getBadgeSlotURL: getBadgeSlotURL,
        getMatchmakingType: getMatchmakingType,
    };
})();

define([
    'shared/gw_galaxy',
    'shared/gw_inventory',
    'shared/gw_stats',
    'shared/gw_bank',
    'shared/gw_game_patches'
], function(
    GWGalaxy,
    GWInventory,
    GWStats,
    GWBank,
    GWGamePatches
) {
    var CURRENT_VERSION = 3;

    var genId = function() {
        return ((Math.random() * 1024 * 1024) | 0).toString();
    };

    var GWGame = function(id) {
        var self = this;
        self.id = (id === undefined) ? genId() : id;
        self.galaxy = ko.observable(new GWGalaxy());
        self.inventory = ko.observable(new GWInventory());
        self.stats = ko.observable(new GWStats());
        self.name = ko.observable("");
        self.mode = ko.observable('');
        self.currentStar = ko.observable();
        self.turnState = ko.observable();
        self.gameState = ko.observable('active');
        self.version = ko.observable(CURRENT_VERSION);
        self.replayName = ko.observable();
        self.replayLobbyId = ko.observable();
        self.hardcore = ko.observable();
        self.previousStar = ko.observable();
        self.timestamp = ko.observable();
        self.lastBattleResult = ko.observable();
        self.isTutorial = ko.observable();
        self.content = ko.observable();

        self.saved = self.galaxy().saved;

        var busy = $.Deferred();
        self.busy = busy.promise();
        busy.resolve(this);
    };

    GWGame.turnStates = {
        begin: 'begin',
        fight: 'fight',
        explore: 'explore',
        end: 'end'
    };

    GWGame.gameStates = {
        active: 'active',
        won: 'won',
        lost: 'lost'
    };

    GWGame.loadSystems = function(systems, config) {
        GWGalaxy.loadSystems(systems.galaxy, config.galaxy);
    };

    GWGame.saveSystems = function(config) {
        var galaxy = GWGalaxy.saveSystems(config.galaxy);
        if (_.isEmpty(galaxy))
            return {};
        return {
            id: config.id,
            galaxy: galaxy
        };
    };

    GWGame.prototype = {
        load : function(config) {
            var self = this;
            config = config || {};
            self.id = config.id || genId();
            self.galaxy().load(config.galaxy || {});
            self.inventory().load(config.inventory || {});
            self.stats().load(config.stats || {});
            self.name(config.name || "");
            self.mode(config.mode || '');
            self.currentStar(config.currentStar);
            self.turnState(config.turnState || 'begin');
            self.gameState(config.gameState || 'active');
            self.version(config.version);
            self.replayName(config.replayName);
            self.replayLobbyId(config.replayLobbyId);
            self.hardcore = ko.observable(_.isUndefined(config.hardcore) ? true : config.hardcore);
            self.previousStar(config.previousStar || config.currentStar);
            self.timestamp(config.timestamp || _.now());
            self.lastBattleResult(config.lastBattleResult);
            self.isTutorial(config.isTutorial);
            self.content(config.content);

            GWGamePatches.patch(self, CURRENT_VERSION);

            var busy = $.Deferred();
            self.busy = busy.promise();
            self.inventory().applyCards(function() {
                busy.resolve(self);
            });

            return self.busy;
        },

        save: function () {
            var self = this;

            self.timestamp(_.now());

            var result = {
                id: self.id,
                galaxy: self.galaxy().save(),
                inventory: self.inventory().save(),
                stats: self.stats().save(),
                name: self.name(),
                mode: self.mode(),
                currentStar: self.currentStar(),
                turnState: self.turnState(),
                gameState: self.gameState(),
                version: self.version(),
                replayName: self.replayName(),
                replayLobbyId: self.replayLobbyId(),
                hardcore: self.hardcore(),
                previousStar: self.previousStar(),
                timestamp: self.timestamp(),
                lastBattleResult: self.lastBattleResult(),
                isTutorial: self.isTutorial(),
                content: self.content(),
            };

            return result;
        },

        fight: function() {
            var self = this;
            if (self.turnState() !== GWGame.turnStates.begin)
                return false;
            self.turnState(GWGame.turnStates.fight);
            return true;

        },

        defeatTeam: function(team) {
            var self = this;
            var aiCount = 0;
            api.tally.incStatInt('gw_eliminate_faction');
            _.forEach(self.galaxy().stars(), function(star) {
                if (star.ai()) {
                    if (star.ai().team === team)
                        star.ai(undefined);
                    else
                        ++aiCount;
                }
            });
            if (!aiCount) {
                self.gameState(GWGame.gameStates.won);
            }
        },

        winTurn: function(selected_card_index, done) {
            var self = this;
            var result = $.Deferred();
            if (self.turnState() !== GWGame.turnStates.fight &&
                self.turnState() !== GWGame.turnStates.explore) {
                result.resolve(false);
                return result;
            }

            var stats = self.stats();
            var stars = self.galaxy().stars();
            var inventory = self.inventory();
            var star = stars[self.currentStar()];
            var card = star.cardList()[selected_card_index];

            var addCard;

            if (self.turnState() === GWGame.turnStates.fight) {
                star.log(stats.turns(), { win: { ai: star.ai() } });
                var ai = star.ai();
                if (ai) {
                    stats.wins(stats.wins() + 1);
                    if (ai.boss)
                        self.defeatTeam(ai.team);
                    else {
                        star.ai(undefined);
                        var winGame = _.all(stars, function (checkStar) { return !checkStar.ai(); });
                        if (winGame)
                            self.gameState(GWGame.gameStates.won);
                    }
                }
                self.turnState(GWGame.turnStates.begin);
            }
            else {
                var duplicate = card && inventory.hasCard(card);
                var full = card && !inventory.canFitCard(card);
                star.log(stats.turns(), { win: { card: card, duplicate: duplicate || undefined, full: full || undefined } });
                if (card)
                    if (!duplicate && !full)
                        addCard = card;

                if (card || selected_card_index === -1) {
                    star.cardList([]);
                    star.explored(true);
                }
                self.turnState(GWGame.turnStates.end);
            }
            if (addCard) {
                var busy = $.Deferred();
                self.busy = busy.promise();
                inventory.cards.push(addCard);
                inventory.applyCards(function() {
                    busy.resolve(self);
                    result.resolve(true);
                });
            }
            else {
                result.resolve(true);
            }
            return result.promise();
        },

        loseTurn: function() {
            var self = this;
            if (self.turnState() !== GWGame.turnStates.fight)
                return false;
            var stars = self.galaxy().stars();
            var star = stars[self.currentStar()];
            if (star.ai()) {
                var stats = self.stats();
                stats.losses(stats.losses() + 1);
                star.log(stats.turns(), { lose: star.ai() });
            }
            self.turnState(GWGame.turnStates.end);
            if (self.hardcore())
                self.gameState(GWGame.gameStates.lost);
            else {
                var stars = self.galaxy().stars();
                var star = stars[self.currentStar()];
                star.history([]);
                self.currentStar(self.previousStar());
            }
            return true;
        },

        explore: function() {
            var self = this;
            if (self.turnState() !== GWGame.turnStates.begin)
                return false;
            self.turnState(GWGame.turnStates.explore);
            return true;
        },

        move: function(destination) {
            var self = this;
            self.turnState(GWGame.turnStates.begin);

            self.previousStar(self.currentStar() || destination);
            self.currentStar(destination);

            var stats = self.stats();
            stats.turns(stats.turns() + 1);

            var stars = self.galaxy().stars();
            var star = stars[self.currentStar()];
            star.log(stats.turns(), { move: 1 });

            return true;
        }
    };

    return GWGame;
});

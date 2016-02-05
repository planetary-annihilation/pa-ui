var model;
var handlers;

requireGW([
    'require',
    'shared/gw_common',
    'shared/popup'
], function(
    require,
    GW,
    PopUp
) {

    function GameViewModel(game) {
        var self = this;

        self.startNewWar = function () {
            window.location.href = 'coui://ui/main/game/galactic_war/gw_start/gw_start.html';
        }

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.game = ko.observable(game);
        self.isTutorial = ko.computed(function () {
            var game = self.game();
            return game.isTutorial();
        });

        // don't archive tutorial wars
        if (self.isTutorial()) 
            GW.manifest.removeGame(game);

        self.back = function () {
            window.location.href = self.isTutorial() 
                ? 'coui://ui/main/game/start/start.html'
                : 'coui://ui/main/game/galactic_war/gw_start/gw_start.html';
        };

        self.gameWon = ko.computed(function() {
            return self.game().gameState() == GW.Game.gameStates.won || self.game().lastBattleResult() === 'win';
        });
        self.backdrop = ko.computed(function() {
            switch (self.game().gameState()) {
                case GW.Game.gameStates.won:
                    return 'victory_planet.png';
                    break;

                case GW.Game.gameStates.lost:
                    return 'loss_planet.png';
                    break;

            }
        });
        self.commander = ko.observable(self.game().inventory().tags().global.commander);
        self.commanderImage = ko.pureComputed(function() { return CommanderUtility.bySpec.getImage(self.commander()); });

        self.techCards = ko.computed(function() {
            var inventory = self.game().inventory();
            return _.map(inventory.cards(), function(card) { return new CardViewModel(card); });
        });

        self.trashCards = ko.computed(function() {
            var kept = _.map(self.techCards(), function(card) { return card.params(); });
            var stars = self.game().galaxy().stars();
            var all = _.filter(_.map(stars, function(star) {
                if (star.hasCard())
                    return;
                var cardTurn = _.find(star.history(), function(turn) {
                    return turn && turn.details && turn.details.win && turn.details.win.card;
                });
                return cardTurn && cardTurn.details.win.card;
            }));
            // Remove all the cards that were won & kept.
            // Also remove from the kept list so we keep the right number of them.
            var filtered = _.filter(all, function(card) {
                if (card.duplicate)
                    return card;
                var keptIndex = _.findIndex(kept, _.bind(_.isEqual, this, card));
                if (keptIndex < 0)
                    return card;
                kept.splice(keptIndex, 1);
            });
            return _.map(filtered, function(card) { return new CardViewModel(card); });
        });

        PopUp.mixin(self, $('.popup-container'));

        self.abandonGame = function() {
            self.confirm('!LOC:Are you sure you want to abandon this Galactic War?', function() {
                GW.manifest.removeGame(game)
                    .then(function() {
                        self.back();
                    });
            });
        };

        self.start = function() {
            $(".primary_msg").show();

            if (model.gameWon()) {
                api.audio.setMusic('/Music/Music_GW_Win');
                api.audio.playSound(self.isTutorial() ? '/VO/Computer/Tutorial/Outro' : '/VO/Computer/gw/endgame_win_all_gallactic_war');
            }
            else {
                api.audio.setMusic('/Music/Music_GW_Lose');
                api.audio.playSound('/VO/Computer/gw/endgame_lose');
            }
        };
    }

    // Start loading the game & document
    var activeGameId = ko.observable().extend({ local: 'gw_active_game'});
    var gameLoader = GW.manifest.loadGame(activeGameId());
    var documentLoader = $(document).ready();

    // We can start when both are ready
    $.when(
        gameLoader,
        documentLoader
    ).then(function(
        game,
        $document
    ) {
        model = new GameViewModel(game);

        handlers = {};

       // inject per scene mods
        if (scene_mod_list['gw_war_over']) {
            loadMods(scene_mod_list['gw_war_over']);
        }

        // setup send/recv messages and signals
        app.registerWithCoherent(model, handlers);

        // Activates knockout.js
        ko.applyBindings(model);

        // Tell the model we're really, really here
        model.lastSceneUrl('coui://ui/main/game/galactic_war/gw_war_over/gw_war_over.html');

        model.start();
    });

});

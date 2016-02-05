var model;
var handlers;

requireGW([
    'require',
    'shared/gw_common',
    'shared/gw_game'
], function(
    require,
    GW,
    GWGame
) {

$(document).ready(function () {
    UIMediaUtility.startMusic();

    function GameViewModel() {
        var self = this;

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.archivedGames = ko.computed(function() {
            return _.filter(GW.manifest.games(), function(game) { return game.state !== GWGame.gameStates.active; });
        });

        self.back = function() {
            window.location.href = self.lastSceneUrl();
        };

        self.activeGame = ko.observable(self.archivedGames()[0]);
        self.activeGameId = ko.observable().extend({ local: 'gw_active_game'});
        ko.computed(function(game) {
            var game = self.activeGame();
            self.activeGameId(game && game.id);
        });

        self.abandonGame = function () {
            GW.manifest.removeGame(self.activeGame());
        }

        self.navToDetails = function() {
            if (!self.ready())
                return;

            self.lastSceneUrl('coui://ui/main/game/galactic_war/gw_start/gw_start.html');
            window.location.href = 'coui://ui/main/game/galactic_war/gw_war_over/gw_war_over.html';
        }

        self.ready = ko.computed(function() {
            return !!self.archivedGames().length && !!self.activeGameId();
        });

        self.getCommanderIcon = function (name) {
            return CommanderUtility.byObjectName.getThumbImage(name);
        };

        self.setup = function () {};
    }

    ko.computed(function() {
        if (!GW.manifest.ready())
            return;

        _.delay(function() {
            model = new GameViewModel();

            handlers = {};

           // inject per scene mods
            if (scene_mod_list['gw_archive'])
                loadMods(scene_mod_list['gw_archive']);

            // setup send/recv messages and signals
            app.registerWithCoherent(model, handlers);

            // Activates knockout.js
            ko.applyBindings(model);

            model.setup();
        });
    });
});

});

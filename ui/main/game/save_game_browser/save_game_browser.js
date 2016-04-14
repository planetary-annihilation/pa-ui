var model;
var handlers;
var hack;
var foo;
$(document).ready(function () {

    function SaveGameBrowserViewModel() {
        var self = this;

        // Get session information about the user, his game, environment, and so on
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });
        self.buildVersion = ko.observable().extend({ session: 'build_version' });

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.useLocalServer = ko.observable().extend({ session: 'use_local_server' });

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.uberNetRegions = ko.observableArray().extend({ session: 'uber_net_regions' });
        self.hasUberNetRegions = ko.computed(function () { return (self.uberNetRegions().length > 0); });

        self.remoteServerAvailable = ko.computed(function () {
            return self.hasUberNetRegions();
        });

        self.back = function () {
            self.lastSceneUrl(window.location.href);
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

        self.failedToRetrieveGameList = ko.observable(false);

        self.savedGames = SaveGameUtility.savedGames;

        self.selectedGameIndex = ko.observable(-1);
        self.selectedGame = ko.computed(function () {
            return self.savedGames()[self.selectedGameIndex()];
        });
        self.hasSelectedGame = ko.computed(function () {
            return SaveGameUtility.canLoadGame(self.selectedGame()) && !self.selectedGame().is_missing_content;
        });
        self.selectedGameRequiresModeSwitch = ko.computed(function () {
            return self.selectedGame() && !self.selectedGame().is_missing_content && self.selectedGame().inactive_content;
        });

        self.canDeleteSelectedGame = ko.computed(function () {
            return SaveGameUtility.canDeleteGame(self.selectedGame());
        });

        self.loadGame = function () {
            if (!self.hasSelectedGame())
                return;

            if (self.selectedGameRequiresModeSwitch()){
                $('#confirmSwitchModes').modal('show');
                return;
            }
            
            model.lastSceneUrl('coui://ui/main/game/save_game_browser/save_game_browser.html');
            SaveGameUtility.loadGame(self.selectedGame());
        };

        self.switchModesAndloadGame = function () {
            if (!self.selectedGameRequiresModeSwitch())
                return;

            api.content.setActive(self.selectedGame().content || "").then(function () {
                model.lastSceneUrl('coui://ui/main/game/save_game_browser/save_game_browser.html');
                SaveGameUtility.loadGame(self.selectedGame());
            });    
        };

        self.maybeDeleteGame = function () {
            if (self.canDeleteSelectedGame())
                $('#confirmDelete').modal('show');
        };

        self.deleteGame = function () {
            SaveGameUtility.deleteGame(self.selectedGame());
        };

        self.setup = function () {}
    }

    model = new SaveGameBrowserViewModel();

    handlers = {};

    // inject per scene mods
    if (scene_mod_list['save_game_browser'])
        loadMods(scene_mod_list['save_game_browser']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    api.Panel.message('uberbar', 'lobby_info' /*, undefined */);
    api.Panel.message('uberbar', 'visible', { value: true });

    model.setup();
});

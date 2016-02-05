// !LOCNS:galactic_war
var model;

$(document).ready(function () {

    function GWLobbyViewModel() {
        var self = this;

        self.serverLoading = ko.observable(true);
        self.clientLoading = ko.observable(true);
        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.ready = ko.computed(function() {
            return !self.clientLoading() && !self.serverLoading();
        })
        self.ready.subscribe(function() { self.updateReadyState(); });

        self.gameSystemReadyInfo = ko.observable('');
        self.gameSystemReady = ko.computed(function() {
            var result = self.serverLoading() || self.clientLoading();
            if (result)
                self.gameSystemReadyInfo('Planets are building');
            else
                self.gameSystemReadyInfo('');
            return !result;
        });

        self.gameIsNotOkInfo = ko.computed(function() {
            return self.gameSystemReadyInfo();
        });
        self.gameIsNotOk = ko.computed(function () { return !self.gameSystemReady(); });

        // TODO: Remove when planets are generated using the new schema
        self.fixupPlanetConfig = function (system) {

            var planets = system.planets || [];
            for (var p = 0; p < planets.length; ++p)
            {
                var planet = planets[p];
                if (planet.hasOwnProperty('position_x'))
                {
                    planet.position = [planet.position_x, planet.position_y];
                    delete planet.position_x;
                    delete planet.position_y;
                }
                if (planet.hasOwnProperty('velocity_x'))
                {
                    planet.velocity = [planet.velocity_x, planet.velocity_y];
                    delete planet.velocity_x;
                    delete planet.velocity_y;
                }
                if (planet.hasOwnProperty('planet'))
                {
                    planet.generator = planet.planet;
                    delete planet.planet;
                }
            }
            return system;
        }

        self.config = ko.observable('').extend({ memory: 'gw_battle_config' });

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.navBack = function () {
            if (self.lastSceneUrl())
                window.location.href = self.lastSceneUrl();
        };

        self.updateReadyState = function() {
            if (self.ready())
                self.send_message('set_ready', {ready: true});
        };
        self.updateReadyState();

        var $loadingPage = $('#building_planets');
        var baseLoadingUrl = $loadingPage.attr('src');
        var loadingMessages = [
            '!LOC:APPROACHING STAR SYSTEM',
            '!LOC:PREPARE FOR LANDING',
            '!LOC:CONFIGURING LANDING ZONE',
            '!LOC:CALCULATING APPROACH VECTOR'
        ];
        var newLoadingUrl = baseLoadingUrl + '?message=' + encodeURIComponent(_.sample(loadingMessages));
        $loadingPage.attr('src', newLoadingUrl);
    }
    model = new GWLobbyViewModel();

    handlers = {};

    handlers.control = function(control) {
        model.serverLoading(!control.sim_ready);
        if (!control.has_config) {
            var config = model.config();
            config.sandbox = !!model.devMode();
            model.send_message('set_config', model.config());
        }
    };

    handlers.server_state = function (payload) {
        if (payload.url && payload.url !== window.location.href) {
            window.location.href = payload.url;
            return;
        }

        handlers.control(payload.data.control);
    };

    handlers.connection_disconnected = function (payload) {
        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));
        transitSecondaryMessage('');
        transitDestination(model.lastSceneUrl());
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
    }

    // inject per scene mods
    if (scene_mod_list['gw_lobby'])
        loadMods(scene_mod_list['gw_lobby']);

    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    app.hello(handlers.server_state, handlers.connection_disconnected);

    var testLoading = function() {
        var worldView = api.getWorldView(0);
        if (worldView) {
            worldView.arePlanetsReady().then(function(ready) {
                model.clientLoading(!ready);
                setTimeout(testLoading, 500);
            });
        }
        else
            setTimeout(testLoading, 500);
    };
    setTimeout(testLoading, 500);
});

var model;
var handlers;

function respondToResize() {
    model.containerHeight($("body").height() +'px');
    model.containerWidth(($("body").width() - 10)+'px');
    model.contentWrapperHeight(($("#main .content").height()) +'px');
}

$(document).ready(function () {

    ko.extenders.slider = function (target, option) {
        var v;

        // write changes to storage
        target.subscribe(function (newValue) {
            if (newValue !== $('#slider_' + option).slider("option", "value"))
                $('#slider_' + option).slider("option", "value", newValue);
        });

        return target;
    };

    function PlanetSelectorViewModel() {
        var self = this;

        var urlTabs = $.url().param('tabs');
        self.enableTabs = ko.observable(_.isString(urlTabs) ? !!JSON.parse(urlTabs) : true);
        var urlSystems = $.url().param('systems');
        self.enableSystems = ko.observable(_.isString(urlSystems) ? !!JSON.parse(urlSystems) : true);
        var urlPlanets = $.url().param('planets');
        self.enablePlanets = ko.observable(_.isString(urlPlanets) ? !!JSON.parse(urlPlanets) : true);
        var urlTitle = $.url().param('title');
        self.title = ko.observable(_.isString(urlTitle) ? urlTitle : '!LOC:System Designer');

        // Get session information about the user, his game, environment, and so on
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });
        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.devMode = ko.observable().extend({ session: 'dev_mode' });

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });
        self.nextSceneUrl = ko.observable().extend({ session: 'next_scene_url' });

        // Set up dynamic sizing elements
        self.containerHeight = ko.observable('');
        self.containerWidth = ko.observable('');
        self.contentWrapperHeight = ko.observable('');

        self.waitForPlanetToLoad = function (planet_spec) {
            var deferred = $.Deferred();

            UberUtility.waitForAttributeLoad(planet_spec, 'csg_key', 'planetCSG', constants.PLANET_CSG_DATABASE).then(function (first) {
                UberUtility.waitForAttributeLoad(first, 'metal_spots_key', 'metal_spots', constants.PLANET_METAL_SPOTS_DATABASE).then(function (second) {
                    UberUtility.waitForAttributeLoad(second, 'landing_zones_key', 'landing_zones', constants.PLANET_LANDING_ZONES_DATABASE).then(function (third) {
                        _.omit(third, 'source');
                        deferred.resolve(third);
                    });;
                });
            });

            return deferred.promise();
        };

        // save planet csg, then remove the csg item
        self.waitForSystemToLoad = function (system, options /* { omit_keys } */) {
            var deferred = $.Deferred();
            var array = _.map(system.planets, self.waitForPlanetToLoad);

            UberUtility.waitForAll(array).then(function (results) {
                system.planets = results;

                if (options.omit_keys)
                    system.planets = _.map(system.planets, function (element) {
                        return _.omit(element, ['csg_key', 'metal_spots_key', 'landing_zones_key']);
                    });

                deferred.resolve(system);
            });

            return deferred.promise();
        };

       // Click handler for back button
        self.back = function() {
            window.location.href = self.lastSceneUrl();
            return; /* window.location.href will not stop execution. */
        };

        self.imageSourceForPlanet = function (planetSpec) {
            if (typeof planetSpec != "undefined" && typeof planetSpec.planet != "undefined") {
                var ice = planetSpec.planet.biome === 'earth' && planetSpec.planet.temperature <= 33;
                var s = (ice) ? 'ice' : planetSpec.planet.biome;

                return 'coui://ui/main/shared/img/' + s + '.png';
            }
        }

        self.imageSourceForSystem = function (system) {
            planetSpec = system.planets[0];
            return self.imageSourceForPlanet(planetSpec);
        }

        self.imageUrlForSystem = function (system) {
            return 'url(' + self.imageSourceForSystem(system) + ')';
        }

        self.imageSizeForPlanet = function (size) {
            return '' + 100 + 'px';
        }

        self.planetSizeClass = function (radius) {
            if (radius <= 250)
                return '1';
            if (radius <= 450)
                return '2';
            if (radius <= 650)
                return '3';
            if (radius <= 850)
                return '4';
            return '5';
        }

        self.loadedPlanet = ko.observable({}).extend({ session: 'loaded_planet' });
        self.planetName = ko.observable();

        self.showValue = ko.observable('systems');
        self.showSystems = ko.computed(function() { return self.enableSystems() && self.showValue() == 'systems'});
        self.showPlanets = ko.computed(function() { return self.enablePlanets() && self.showValue() == 'planets'});
        self.toggleShowSystemText = ko.computed(function () { if (self.showSystems()) return loc("!LOC:SHOW PLANETS"); return loc("!LOC:SHOW SYSTEMS"); });
        self.toggleShowSystem = function () { self.showSystems(!self.showSystems()) };

        self.userSystems = ko.observableArray([]).extend({ db: { local_name: 'systems', db_name: 'misc' }});
        self.premadeSystems = ko.observableArray([]);
        self.systems = ko.computed(function () {
            return self.premadeSystems().concat(self.userSystems());
        });
        self.loadedSystem = ko.observable({}).extend({ session: 'loaded_system' });
        self.loadedSystemIsCustom = ko.observable(false).extend({ session: 'loaded_system_is_custom' });

        self.selectedSystemIndex = ko.observable(-1);
        self.selectedSystem = ko.computed(function () { return self.systems()[self.selectedSystemIndex()] ? self.systems()[self.selectedSystemIndex()] : {}; });
        self.selectedSystemName = ko.computed(function () { return self.selectedSystem().name || '' });
        self.selectedSystemEmpty = ko.computed(function () { return (jQuery.isEmptyObject(self.selectedSystem())) });
        self.selectedSystemIsUserSystem = ko.computed(function () {
            return self.selectedSystemIndex() >= self.premadeSystems().length;
        });

        self.selectedSystemImageSource = ko.computed(function () { if (!self.selectedSystemEmpty()) return self.imageSourceForPlanet(self.selectedSystem().planets[0].planet); });
        self.selectedSystemRadiusWidthString = ko.computed(function () { if (!self.selectedSystemEmpty()) return String(self.selectedSystem().planets[0].planet.radius / 10) + 'px'; });
        self.selectedSystemHeightWidthString = ko.computed(function () { if (!self.selectedSystemEmpty()) return String(self.selectedSystem().planets[0].planet.heightRange * 2) + 'px'; });
        self.selectedSystemWaterWidthString = ko.computed(function () { if (!self.selectedSystemEmpty()) return String(self.selectedSystem().planets[0].planet.waterHeight * 2) + 'px'; });
        self.selectedSystemTemperatureWidthString = ko.computed(function () { if (!self.selectedSystemEmpty()) return String(self.selectedSystem().planets[0].planet.temperature * 2) + 'px'; });

        self.planets = ko.observableArray([]).extend({ local: 'planets' });

        self.selectedPlanetIndex = ko.observable(-1);
        self.selectedPlanet = ko.computed(function () { return self.planets()[self.selectedPlanetIndex()] ? self.planets()[self.selectedPlanetIndex()] : {}; });
        self.selectedPlanetName = ko.computed(function () { return (self.planets()[self.selectedPlanetIndex()]) ? self.planets()[self.selectedPlanetIndex()].name : '' });
        self.selectedPlanetEmpty = ko.computed(function () { return (jQuery.isEmptyObject(self.selectedPlanet())) });

        self.selectedPlanetImageSource = ko.computed(function () { if (!self.selectedPlanetEmpty()) return self.imageSourceForPlanet(self.selectedPlanet().planet); });
        self.selectedPlanetRadiusWidthString = ko.computed(function () { if (!self.selectedPlanetEmpty()) return String(self.selectedPlanet().planet.radius / 10) + 'px'; });
        self.selectedPlanetHeightWidthString = ko.computed(function () { if (!self.selectedPlanetEmpty()) return String(self.selectedPlanet().planet.heightRange * 2) + 'px'; });
        self.selectedPlanetWaterWidthString = ko.computed(function () { if (!self.selectedPlanetEmpty()) return String(self.selectedPlanet().planet.waterHeight * 2) + 'px'; });
        self.selectedPlanetTemperatureWidthString = ko.computed(function () { if (!self.selectedPlanetEmpty()) return String(self.selectedPlanet().planet.temperature * 2) + 'px'; });

        self.allowCreateNewSystem = ko.computed(function () {
            return self.lastSceneUrl() === 'coui://ui/main/game/start/start.html';
        });

        self.navForward = function () {
           window.location.href = self.nextSceneUrl();
           return; /* window.location.href will not stop execution. */
        }

        self.loadPlanet = function () {
            if (self.selectedPlanetIndex() < 0)
                return;
            self.loadedPlanet(self.selectedPlanet());
            self.loadedSystem({});
            self.navForward();
        }

        self.navToNewSystem = function () {
            window.location.href = 'coui://ui/main/game/system_editor/system_editor.html';
            return; /* window.location.href will not stop execution. */
        }


        self.loadSystem = function () {
            if (self.selectedSystemIndex() < 0)
                return;

            self.loadedSystem(self.selectedSystem());
            self.loadedPlanet({});

            self.loadedSystemIsCustom(self.selectedSystemIndex() >= self.premadeSystems().length);

            self.waitForSystemToLoad(self.loadedSystem(), { omit_keys: false }).then(function (result) {
                self.loadedSystem(result);
                self.navForward();
            });
        }

        self.allowDeleteSystem = ko.computed(function() {
            return self.allowCreateNewSystem();
        });

        self.canDeleteSelected = ko.computed(function() {
            return self.selectedSystemIndex() !== -1 && self.selectedSystemIsUserSystem();
        });

        self.deletePlanet = function () {
            var a = self.planets();

            if (self.selectedPlanetIndex() < 0)
                return;

            a.splice(self.selectedPlanetIndex(), 1);
            self.planets(a);
            self.selectedPlanetIndex(-1);
        }

        self.deleteSystem = function () {
            var a = self.userSystems();

            if (self.selectedSystemIndex() < 0)
                return;

            a.splice(self.selectedSystemIndex() - self.premadeSystems().length, 1);
            self.userSystems(a);
            self.selectedSystemIndex(-1);
        }

        self.delete = function () {
            if (self.showSystems())
                self.deleteSystem();
            else
                self.deletePlanet();
            $('#confirm').modal('hide');
        }

        self.allowExportSystem = ko.computed(function() {
            return self.allowCreateNewSystem();
        });

        self.canExportSelected = ko.computed(function() {
            return self.selectedSystemIndex() !== -1;
        });

        self.waitForPlanetToSave = function (planet_spec) {
            var deferred = $.Deferred();

            UberUtility.waitForAttributeSave(planet_spec, 'csg_key', 'planetCSG', constants.PLANET_CSG_DATABASE).then(function (first) {
                UberUtility.waitForAttributeSave(first, 'metal_spots_key', 'metal_spots', constants.PLANET_METAL_SPOTS_DATABASE).then(function (second) {
                    UberUtility.waitForAttributeSave(second, 'landing_zones_key', 'landing_zones', constants.PLANET_LANDING_ZONES_DATABASE).then(function (third) {
                        _.omit(third, 'source');
                        deferred.resolve(third);
                    });
                });
            });

            return deferred.promise();
        };

        self.waitForStrippedSystem = function (system) {
            var deferred = $.Deferred();

            var array = _.map(system.planets, self.waitForPlanetToSave);

            UberUtility.waitForAll(array).then(function (results) {
                system.planets = results;
                deferred.resolve(system);
            });

            return deferred.promise();
        };

        self.importSystem = function() {
            api.file.loadDialog('system.pas').then(function(loadResult) {
                if (!_.has(loadResult, 'contents'))  // Cancelled
                    return;

                var newSystem = JSON.parse(loadResult.contents);

                self.waitForStrippedSystem(newSystem).then(function (item) {
                    var oldSelection = self.selectedSystemIndex();
                    self.selectedSystemIndex(self.systems().length);
                    self.userSystems.push(item);
                    if (!self.selectedSystemValid()) {
                        // TODO: Error dialog
                        self.systems.pop();
                        self.selectedSystemIndex(oldSelection);
                    }
                });
            });
        }

        self.debugExportFixedSystem = false;

        self.exportSystem = function () {
            if (!self.selectedSystem())
                return;

            self.waitForSystemToLoad(self.selectedSystem(), { omit_keys: true }).then(function (result) {
                var suggestedFilename = self.selectedSystem().name.toLowerCase().replace(' ', '_') + '.pas';

                if (self.debugExportFixedSystem)
                    result = UberUtility.fixupPlanetConfig(result);

                api.file.saveDialog(suggestedFilename, JSON.stringify(result, null, 4));
            });
        }

        self.validatePlanetConfig = function (config) {
            var planet = config ? config.planet : null;
            if (!planet || planet.radius > 1300)
                return false;

            return true;
        }

        self.displayExperimentalPlanet = function (config) {
            return !self.validatePlanetConfig(config);
        }

        self.displayExperimentalSystem = function (planets) {
            return !_.every(planets, self.validatePlanetConfig);
        }

        self.selectedPlanetValid = ko.computed(function () {
            if (self.nextSceneUrl() === 'coui::/ui/main/game/new_game/new_game.html')
                return self.validatePlanetConfig(self.planets()[self.selectedPlanetIndex()]);
            else
                return !!self.selectedPlanetName()
        })

        self.selectedSystemValid = ko.computed(function () {
            var i;
            var a;
            var p;

            if (!self.selectedSystem() && self.selectedSystem().planets)
                return false;

            a = self.selectedSystem().planets;

            if (!a || !a.length)
                return false;

            if (self.nextSceneUrl() === 'coui://ui/main/game/new_game/new_game.html') {

                for (i = 0; i < a.length; i++) {

                    p = a[i];
                    if (!p || !self.validatePlanetConfig(p))
                        return false;
                }

                return true;
            }
            else
                return !!self.selectedSystemName();
        });

        self.generateDescription = function (range) {
            if (!range)
                return '';
            if (range[0] === range[1])
                return loc('!LOC:__num_players__ Players', { num_players: range[0] });
            return loc('!LOC:__min_players__-__max_players__ Players', { min_players: range[0], max_players: range[1] });
        };

        self.sortPlanets = function (planets) {
            return _.flatten([
                _.filter(planets, 'starting_planet'),
                _.reject(planets, 'starting_planet')
            ]);
        };
    }

    model = new PlanetSelectorViewModel();

    handlers = {};

   // inject per scene mods
    if (scene_mod_list['load_planet']) {
        loadMods(scene_mod_list['load_planet']);
    }

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // Set up resize event for window so we can smart-size the game list
    $(window).resize(respondToResize);

    // Do some initial resizing, since resize isn't called on page load (but this may not be accurate)
    model.containerHeight($("body").height() +'px');
    model.containerWidth(($("body").width() - 10)+'px');
    // Have to delay a few milliseconds, as immediate call was sometimes not calculating correctly
    window.setTimeout(respondToResize,100);

    require(['../../shared/js/premade_systems'], function (premade_systems) {
        model.premadeSystems(premade_systems);
    });

});

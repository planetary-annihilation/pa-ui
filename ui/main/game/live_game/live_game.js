var model;
var handlers = {};

//  fix for alt-tab to PA then backspace with chat window open triggering window back then reload or connecting to server

try {
   window.addEventListener('keydown',function(e) {
        if( ( e.keyIdentifier=='U+0008'|| e.keyIdentifier=='Backspace' ) && e.target==document.body ) {
            e.preventDefault();
        }
    }, true );
}
catch (e) {
}

$(document).ready(function () {
    var idleTime = 0;

    api.game.releaseKeyboard(true);

    var start = /[^\/]*$/;  // ^ : start , \/ : '/', $ : end // as wildcard: /*.json
    var end = /[.]json[^\/]*$/;

    function UnitDetailModel(options) {
        var options = options || {};

        var self = this;
        // Guard loc function from undefined values.
        // In the future the loc function should be able handle undefined values as an argument.
        self.name = ko.observable(loc(options.name || ""));
        self.desc = ko.observable(loc(options.description || ""));
        self.cost = ko.observable(options.cost);
        self.maxHealth = ko.observable(options.max_health);

        self.damage = ko.observable(options.damage);
        self.fireRate = ko.observable(options.rate_of_fire);

        // soon to be kept:
        self.build_arm = ko.observable(options.build_arm);
        self.production = ko.observable(options.production);
        self.consumption = ko.observable(options.consumption);
        self.storage = ko.observable(options.storage);
        self.energy_weapon = ko.observable(options.ammo_capacity ? {
            ammo_capacity: options.ammo_capacity,
            ammo_demand: options.ammo_demand,
            ammo_per_shot: options.ammo_per_shot
        } : null);

        if (options.teleporter) {
            /* hack in teleporter energy on top of consumption */
            self.consumption({
                energy: options.teleporter.energy_demand,
                mental: 0
            });
        }

        self.sicon = ko.observable(options.sicon);
        self.siconUrl = ko.observable('coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_' + options.sicon + '.png');
    }

    var endOfTime = ko.observable(0);
    var lastSuperWeaponTime = ko.observable(0).extend({ local: 'last_super_weapon_time' });
    var smashedPlanetSet = ko.observable({}).extend({ local: 'smashed_planet_set' });
    var annilaseredPlanetSet = ko.observable({}).extend({ local: 'annilasered_planet_set' });
    var annilaseredPlanetUnderEnemyControlSet = ko.observable({}).extend({ local: 'annilasered_planet_under_enemy_control_set' });
    var clearStatsSets = function () {
        smashedPlanetSet({});
        annilaseredPlanetSet({});
        annilaseredPlanetUnderEnemyControlSet({});
        lastSuperWeaponTime(0);
    };
    endOfTime.subscribe(function (value) {
        if (value < lastSuperWeaponTime())
            clearStatsSets();
    });

    smashedPlanetSet.subscribe(function (value) {
        if (endOfTime() < lastSuperWeaponTime())
            return;

        if (!_.isEmpty(value))
            api.tally.incStatInt('planets_smashed');
    });
    annilaseredPlanetSet.subscribe(function (value) {
        if (endOfTime() < lastSuperWeaponTime())
            return;

        if (!_.isEmpty(value))
            api.tally.incStatInt('lasers_activated');
    });
    annilaseredPlanetUnderEnemyControlSet.subscribe(function (value) {
        if (endOfTime() < lastSuperWeaponTime())
            return;

        if (!_.isEmpty(value))
            api.tally.incStatInt('lasers_activated_toward_activated_planets');
    });

    function CelestialViewModel(object, previous) {
        var self = this;

        self.isSun = ko.observable(!!object.isSun);

        self.dead = ko.observable(object.dead);

        self.radius = ko.observable(self.isSun() ? 5000 : object.radius);
        self.name = ko.observable(object.name);
        self.image = ko.observable('coui://ui/main/shared/img/' + object.biome + '.png');
        self.imageSmall = ko.observable('coui://ui/main/shared/img/planets/small/' + object.biome + '.png');
        self.metalSpots = ko.observable(object.metal_spots);

        self.isHover = ko.observable(false);

        self.index = ko.observable(object.index);
        self.id = ko.observable(object.id);
        self.thrust_control = ko.observable(object.thrust_control);
        self.collisionImminent = ko.observable(object.collision_imminent);
        self.weapon_control = ko.observable(object.weapon_control);
        self.weaponFiring = ko.observable(object.weapon_firing);
        self.biome = ko.observable(object.biome);

        // the opponent loses control of the planet at the exact same time as the laser fires, so we have to look at the previous value
        self.targetActiveUnderEnemyControl = ko.observable(object.weapon_firing ? previous.targetActiveUnderEnemyControl() : object.target_under_enemy_control);
        self.target_index = ko.observable(object.target_index);

        self.selfGuided = ko.observable(object.self_guided);
        self.has_terrain = ko.observable(object.biome !== 'gas');

        var updateStatsSetsRule = ko.computed(function () {

            var key = self.index() + '.' + self.target_index();
            var changed = false;

            var interlock = function (observable) {
                var set = observable();
                if (set[key])
                    return;

                set[key] = true;
                observable(set);
                changed = true;
            }

            if (self.weapon_control() && self.weaponFiring())
                interlock(annilaseredPlanetSet);

            if (self.thrust_control() && self.collisionImminent())
                interlock(smashedPlanetSet);

            if (self.weapon_control() && self.weaponFiring() && self.targetActiveUnderEnemyControl())
                interlock(annilaseredPlanetUnderEnemyControlSet);

            if (changed)
                lastSuperWeaponTime(endOfTime());
        });

        if (self.weapon_control() && model.planetIndexToWeaponControlMap[self.index()] !== 'friendly') {
            model.planetIndexToWeaponControlMap[self.index()] = 'friendly';
            if (!model.squelchNotifications()) {
                model.doCustomAlert({
                    name: 'Weapon control established',
                    special_weapon: true,
                    lazer: true,
                    index: self.index(),
                    name: self.name()
                })
                .then(function () {
                    model.celestialControlModel.firePlanetWeapon(self.index())
                }); // you may fire when ready
                eventSystem.processEvent(constants.event_type.weapon_control_established);
            }
        }
        else if (!self.weapon_control()) {
            var lost_control = model.planetIndexToWeaponControlMap[self.index()] === 'friendly';
            if (lost_control) {
                if (!model.squelchNotifications())
                    model.doCustomAlert({
                        name: 'Weapon control lost',
                        special_weapon: true,
                        lazer: true,
                        lost: true,
                        index: self.index()
                    });
            }
            model.planetIndexToWeaponControlMap[self.index()] = 'none';
        }

        if (self.thrust_control() && model.planetIndexToThrustControlMap[self.index()] !== 'friendly') {
            model.planetIndexToThrustControlMap[self.index()] = 'friendly';
            if (!model.squelchNotifications()) {
                model.doCustomAlert({
                    name: 'Thrust control established',
                    special_weapon: true,
                    thrust: true,
                    index: self.index(),
                    name: self.name()
                })
                .then(function () {
                    model.celestialControlModel.smashPlanet(self.index())
                });
                eventSystem.processEvent(constants.event_type.thrust_control_established);
            }
        }
        else if (!self.thrust_control()) {
            var lost_control = model.planetIndexToThrustControlMap[self.index()] === 'friendly';
            if (lost_control) {
                if (!model.squelchNotifications())
                    model.doCustomAlert({
                        name: 'Thrust control lost',
                        special_weapon: true,
                        thrust: true,
                        lost: true,
                        index: self.index()
                    });
            }
            model.planetIndexToThrustControlMap[self.index()] = 'none';
        }

        if (!self.dead() && previous && previous.dead()) {
            if (!model.squelchNotifications()) {
                model.doCustomAlert({
                    name: 'New asteroid detected orbiting the system',
                    special_weapon: false,
                    thrust: false,
                    lost: false,
                    index: self.index()
                }).then(function () {
                    if (model.celestialControlModel.notActive()) {
                        api.camera.focusPlanet(self.index());
                        model.selectedCelestialIndex(self.index());
                        api.camera.setZoom("orbital", false);
                    }
                });
                eventSystem.processEvent(constants.event_type.asteroid_respawned);
            }
        }

        if (self.dead() && previous && !previous.dead()) {
            model.considerPlayingSound(
                "/VO/Computer/Annhilated_Planet_" + previous.biome(),
                { 'asteroid': 1, 'moon': 2}[previous.biome()] || 3);

            model.stopRagnarokMusic();
        }

        self.status = ko.observable((self.thrust_control()) ? "READY" : "");
        self.thrust_active = ko.observable(object.target);
        self.weapon_active = ko.observable(object.weapon_active);

        self.delta_v_threshold = ko.observable(object.required_thrust_power);
        self.delta_v_current = ko.observable(object.army_thrust_power);

        if (self.delta_v_current() > self.delta_v_threshold())
            self.delta_v_current(self.delta_v_threshold());

        self.starting_planet = !!object.starting_planet;

        self.isSelected = ko.computed(function () { return self.index() === model.selectedCelestialIndex() });

        self.delta_v_current_array = ko.computed(function () {
            var array = [];
            var l = self.delta_v_current();

            l = Math.floor(l);

            try { array.length = l } catch (e) { }
            return array;
        });

        self.delta_v_theshold_array = ko.computed(function () {
            var array = [];
            var l = self.delta_v_threshold() - self.delta_v_current();

            l = Math.ceil(l);

            try { array.length = l } catch (e) { }
            return array;
        });

        self.isValidTarget = ko.computed(function () {
            return _.contains(model.celestialControlModel.validTargetPlanetIndexList(), self.index());
        });

        self.handleClick = function () {
            if (model.celestialControlModel.notActive()) {
                api.camera.focusPlanet(self.index());
            }
        }

        var current, previous, map;
        if (self.thrust_active() && !self.dead()) {

            self.status(self.thrust_control() ? "ENGAGED" : "ACTIVITY");

            previous = model.planetIndexToCelestialStatusMap()[self.index()];
            current = self.collisionImminent() ? 'collision_imminent' : (self.selfGuided() ? 'self_guided' : 'movement_detected');
            if (current !== previous) {
                map = model.planetIndexToCelestialStatusMap();
                map[self.index()] = current;
                model.planetIndexToCelestialStatusMap(map);

                switch (current) {
                    case 'movement_detected':
                        api.debug.log('movement_detected');
                        _.delay(function () {
                            eventSystem.processEvent(constants.event_type.asteroid_incoming);
                            if (!model.squelchNotifications())
                                model.doCustomAlert({
                                    name: 'Celestial movement detected'
                                }).then(function () {
                                    if (model.celestialControlModel.notActive()) {
                                        api.camera.focusPlanet(self.index());
                                        api.camera.setZoom("orbital", false);
                                    }
                                });
                        }, self.thrust_control() ? 10 * 1000 : 0); // why is there a delay based on thrust control?
                        break;

                    case 'self_guided':
                        api.debug.log('self_guided');
                        eventSystem.processEvent(constants.event_type.asteroid_imminent);
                        api.audio.playSound('/SE/Celestial/Planet_Siren');
                        audioModel.triggerPlanetSmashMusic();
                        break;

                    case 'collision_imminent':
                        api.debug.log('collision_imminent');
                        eventSystem.processEvent(constants.event_type.asteroid_impact);
                        api.audio.playSound('/SE/Celestial/Planet_Siren_last');
                        break;
                }
            }
        }
    }

    function CelestialControlModel() {
        var self = this;

        self.actionsList = ['do_nothing', 'change_orbit', 'smash_planet', 'fire_weapon'];
        self.actionIndex = ko.observable(0);
        self.actionIsChangeOrbit = ko.computed(function () { return self.actionIndex() === 1; });
        self.actionIsSmashPlanet = ko.computed(function () { return self.actionIndex() === 2; });
        self.actionIsFireWeapon = ko.computed(function () { return self.actionIndex() === 3; });

        self.validTargetPlanetIndexList = ko.observableArray([]).extend({ withPrevious: true });
        self.validTargetPlanetIndexList.subscribe(function (value) {
            _.forEach(self.validTargetPlanetIndexList.previous(), function (element) {
                api.ar_system.changePlanetSelectionState(element, 'none');
            });

            _.forEach(value, function (element) {
                api.ar_system.changePlanetSelectionState(element, 'potential_target');
            });
        });
        self.generateValidTargetPlanetList = function (index) {
            var list = [];
            var source = model.celestialViewModels()[index];

            if (source)
                _.forEach(model.celestialViewModels(), function (element) {
                    /* don't target destroyed planets, the source planet, or gas giants */
                    if (element.dead() || element.index() == index || !element.has_terrain())
                        return;

                    var motion = self.actionIsChangeOrbit() || self.actionIsSmashPlanet();

                    /* if the target is moving dont' try and chase it */
                    if (motion && element.thrust_active())
                        return;

                    /* larger planets cannont orbit smaller planets */
                    if (self.actionIsChangeOrbit() && element.radius() < source.radius())
                        return;

                    /* dont't try to destroy the sun */
                    if (element.isSun() && !self.actionIsChangeOrbit())
                        return;

                    list.push(element.index());
                });

            self.validTargetPlanetIndexList(list);
        }

        self.sourcePlanetIndex = ko.observable(-1).extend({ withPrevious: true });
        self.sourcePlanetIndex.subscribe(function (value) {
            if (value === -1) {
                //model.mode('default');

                self.targetPlanetIndex(-1);
                self.selectedPlanetIndex(-1);
                self.mousedownTargetPlanetIndex(-1)
                self.hoverTargetPlanetIndex(-1);
                self.validTargetPlanetIndexList([]);

                self.hasSurfaceTarget(false)
                self.requireConfirmation(false);

                _.forEach(model.celestialViewModels(), function (element) {
                    api.ar_system.changePlanetSelectionState(element.index(), 'none');
                });
            }
            else {
                //model.mode('celestial_control');
                api.select.empty();

                self.generateValidTargetPlanetList(value);
                api.ar_system.changePlanetSelectionState(self.sourcePlanetIndex.previous(), 'none');
                api.ar_system.changePlanetSelectionState(value, 'source');

                api.audio.playSoundAtLocation('/VO/Computer/annihiation_choose_target');
            }
        });

        self.actionIndex.subscribe(function () {
            self.generateValidTargetPlanetList(self.sourcePlanetIndex());
        });

        self.hasSource = ko.computed(function () { return self.sourcePlanetIndex() !== -1 });

        self.hasSurfaceTarget = ko.observable(false);
        self.requireConfirmation = ko.observable(false);

        self.hasSurfaceTarget.subscribe(function (value) {
            if (value)
                self.requireConfirmation(true);
        });

        self.targetPlanetIndex = ko.observable(-1).extend({ withPrevious: true });
        self.targetPlanetIndex.subscribe(function (value) {
            self.validTargetPlanetIndexList([]);
            api.ar_system.changePlanetSelectionState(self.targetPlanetIndex.previous(), 'none');
            api.ar_system.changePlanetSelectionState(value, 'target');

            if (value !== -1) {
                self.executeCelestialAction();
            }
            else {
                api.ar_system.changeSkyboxOverlayColor(0.0, 0.0, 0.0, 0.0);
                engine.call("holodeck.endRequestInterplanetaryTarget");
            }
        });

        self.mousedownTargetPlanetIndex = ko.observable(-1).extend({ withPrevious: true });
        self.hoverTargetPlanetIndex = ko.observable(-1);

        self.mousedownTargetPlanetIndex.subscribe(function (value) {
            if (value === self.hoverTargetPlanetIndex())
                api.ar_system.changePlanetSelectionState(value, 'target');

            if (_.contains(self.validTargetPlanetIndexList(), self.mousedownTargetPlanetIndex.previous()))
                api.ar_system.changePlanetSelectionState(self.mousedownTargetPlanetIndex.previous(), 'potential_target');
        });

        self.hoverTargetPlanetIndex.subscribe(function (value) {
            if (value === self.mousedownTargetPlanetIndex()) {
                api.ar_system.changePlanetSelectionState(value, 'target');
            }
            else if (_.contains(self.validTargetPlanetIndexList(), self.mousedownTargetPlanetIndex())) {
                api.ar_system.changePlanetSelectionState(self.mousedownTargetPlanetIndex(), 'potential_target');
            }
        });

        self.selectedPlanetIndex = ko.observable(-1).extend({ withPrevious: true });
        self.selectedPlanetIndex.subscribe(function (value) {
            api.ar_system.changePlanetSelectionState(self.selectedPlanetIndex.previous(), 'none');
            api.ar_system.changePlanetSelectionState(value, 'selected');
        });

        self.needsReset = ko.observable(true);
        self.reset = function () {
            self.needsReset(false);

            self.sourcePlanetIndex(-1);
            self.targetPlanetIndex(-1);
            self.selectedPlanetIndex(-1);
            self.validTargetPlanetIndexList([]);

            self.hasSurfaceTarget(false);
            self.requireConfirmation(false);

            api.ar_system.changeSkyboxOverlayColor(0.0, 0.0, 0.0, 0.0);

            _.forEach(model.celestialViewModels(), function (element) {
                api.ar_system.changePlanetSelectionState(element.index(), 'none');
            });
        };

        self.notActive = ko.computed(function () { return self.sourcePlanetIndex() === -1; });
        self.active = ko.computed(function () { return !self.notActive(); });
        self.findingTargetSurfacePosition = ko.computed(function () { return self.targetPlanetIndex() !== -1; });
        self.findingTargetPlanet = ko.computed(function () { return self.sourcePlanetIndex() !== -1 && !self.findingTargetSurfacePosition(); });

        self.smashPlanet = function (index) {
            self.actionIndex(2);
            self.sourcePlanetIndex(index);
            api.camera.setZoom('celestial', false);
            audioModel.triggerCelestialTargetingMusic();
        };

        self.movePlanet = function (index) {
            self.actionIndex(1);
            self.sourcePlanetIndex(index);
            api.camera.setZoom('celestial', false);
        };


        self.cancelMove = function (index) {
            engine.call('planet.cancelMove', index);
            self.reset();
        };

        self.firePlanetWeapon = function (index) {
            self.actionIndex(3);
            self.sourcePlanetIndex(index);
            api.camera.setZoom('celestial');
            audioModel.triggerCelestialTargetingMusic();
        };

        self.cancelFire = function (index) {
            engine.call('planet.cancelFire', index);
            self.reset();
        };

        self.cancelControl = function() {
            self.sourcePlanetIndex(-1);
            self.reset();
            model.setMessage('');
        };

        self.setTargetPlanet = function (index) {
            if (_.contains(self.validTargetPlanetIndexList(), index))
                self.targetPlanetIndex(index);
        }

        self.setMousedownTargetPlanetIndex = function (index) {
            if (_.contains(self.validTargetPlanetIndexList(), index) || index === -1)
                self.mousedownTargetPlanetIndex(index);
        }

        self.executeCelestialAction = function () {
            switch (self.actionIndex()) {
                case 0: /* do nothing */ break;
                case 1:
                    engine.call('planet.movePlanet', self.sourcePlanetIndex(), self.targetPlanetIndex(), 10000.0);
                    break;
                case 2:
                    engine.call('planet.attackPlanet', self.sourcePlanetIndex(), self.targetPlanetIndex()).then( function(success) {
                        if (success)
                        {
                            api.audio.playSound('/SE/UI/UI_Annihilate');
                            api.audio.playSoundAtLocation('/VO/Computer/annihiation_initiated');
                        }
                    });
                    break;
                case 3:
                    engine.call('planet.firePlanetWeapon', self.sourcePlanetIndex(), self.targetPlanetIndex()).then( function(success) {
                        if (success)
                        {
                            api.audio.playSound('/SE/UI/UI_Annihilate');
                            api.audio.playSoundAtLocation('/VO/Computer/annihiation_initiated');
                        }
                    });
                    break;
            }

            self.reset();
        }

        self.mousedown = function (mdevent) {
            _.forEach(model.celestialViewModels(), function (element) {
                if (element.isHover()) {
                    self.setMousedownTargetPlanetIndex(element.index());
                    return false; /* ends forEach */
                }
            });
        }

        self.mouseup = function (mdevent) {
            if (self.mousedownTargetPlanetIndex() === self.hoverTargetPlanetIndex())
                self.setTargetPlanet(self.mousedownTargetPlanetIndex());

            self.hoverTargetPlanetIndex(-1);
            self.setMousedownTargetPlanetIndex(-1);
        }
    }

    function GameOptionModel(object) {
        var self = this;
        self.game_type = ko.observable(object && object.game_type ? object.game_type : 'FreeForAll');
        self.dynamic_alliances = ko.observable(object && object.dynamic_alliances ? object.dynamic_alliances : false);
        self.dynamic_alliance_victory = ko.observable(object && object.dynamic_alliance_victory ? object.dynamic_alliance_victory : false);
        self.land_anywhere = ko.observable(!!(object && object.land_anywhere));
        self.sandbox = ko.observable(!!(object && object.sandbox));

        self.listenToSpectators = ko.observable(!!(object && object.listen_to_spectators));

        self.isFFA = ko.computed(function () { return self.game_type() === 'FreeForAll' });
        self.isTeamArmy = ko.computed(function () { return self.game_type() === 'TeamArmies' });
        self.isGalaticWar = ko.computed(function () { return self.game_type() === 'Galactic War' });
        self.isLadder1v1 = ko.computed(function () { return self.game_type() === 'Ladder1v1' });
    }

    function LiveGameViewModel() {
        var self = this;

        self.gameOptions = new GameOptionModel();

        self.showPopUp = ko.observable(false);
        self.popUp = function(params) {
            var messages = params.messages || [params.message || loc('!LOC:Exit Game?')];
            var buttons = params.buttons || [
                '!LOC:Yes',
                '!LOC:Cancel'
            ];
            self.showPopUp(true);
            api.Panel.update();
            return api.panels.popup.query('show', {
                messages: messages,
                textfield: params.textfield,
                filename: params.filename,
                defaultText: params.defaultText,
                buttons: buttons
            }).then(function(result) {
                self.showPopUp(false);
                Mousetrap.resetRepeatState();
                return result;
            });
        };

        self.messageDeferred = ko.observable($.Deferred());
        self.messageState = ko.observable({}).extend({ session: 'lg_message_state' });
        self.setMessage = function(params) {
            if (_.isString(params))
                params = { message: params };
            else if (!_.isObject(params))
                params = {};
            params.button = params.button || '';
            self.messageState(params);
            self.messageDeferred($.Deferred());
            return self.messageDeferred();
        };
        self.messageState.subscribe(function(newState) {
            api.panels.message && api.panels.message.message('state', newState);
        });

        self.showMessage = ko.computed(function() {
            var state = self.messageState();
            return state.message || state.button;
        });


        self.showSettings = ko.observable(false);
        self.showPlayerGuide = ko.observable(false);
        self.toggleShowPlayerGuide = function () {
            self.showPlayerGuide(!self.showPlayerGuide());
        };

        self.showGameLoading = ko.observable(true);
        self.updateGameLoading = function () {
            var loadingPanel = api.panels.building_planets;
            if (loadingPanel)
                loadingPanel.message('toggle', { show: self.showGameLoading() });
        };
        self.showGameLoading.subscribe(function () { self.updateGameLoading(); });

        self.mode = ko.observable('default');
        self.serverMode = ko.observable();
        self.paused = ko.observable(false);
        self.restart = ko.observable(false);
        self.saving = ko.observable(false);
        self.viewReplay = ko.observable(false);
        self.malformed = ko.observable(false);
        self.showPause = ko.computed(function () {
            if (self.showGameLoading() || self.viewReplay() || self.showPopUp() || self.showPlayerGuide())
                return false;

            return self.paused() || self.restart();
        });

        self.minValidTime = ko.observable(-1);
        self.maxValidTime = ko.observable(-1);

        self.ranked = ko.observable(false);
        self.ranked.subscribe(function(newRankedValue) {
            api.panels.game_paused_panel && api.panels.game_paused_panel.message('ranked', newRankedValue);
        });

        self.allowCustomFormations = ko.observable(false);
        self.toggleCustomFormations = function () { self.allowCustomFormations(!self.allowCustomFormations()); };

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.cheatAllowChangeVision = ko.observable(false).extend({ session: 'cheat_allow_change_vision' });
        self.cheatAllowChangeControl = ko.observable(false).extend({ session: 'cheat_allow_change_control' });
        self.cheatAllowCreateUnit = ko.observable(false).extend({ session: 'cheat_allow_create_unit' });
        self.cheatAllowModDataUpdates = ko.observable(false).extend({ session: 'cheat_allow_mod_data_updates' });

        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.haveUberNet = ko.computed(function () {
            return !!self.uberId();
        });

        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });

        /* the settings panel will query for this */
        self.uberNetRegions = ko.observableArray().extend({ session: 'uber_net_regions' });

        self.reviewMode = ko.observable(false).extend({ session: 'review_mode' });
        self.forceResumeAfterReview = ko.observable(false);

        self.economyHandicaps = ko.observable([]);

        self.armyId = ko.observable();

        self.players = ko.observableArray();

        self.originalArmyIndex = ko.observable();
        self.armyIndex = ko.computed(function () {

            var armies = self.players(),
                id = self.armyId(),
                result = -1;

            _.forEach(armies, function (element, index) {
                if (id === element.id)
                    result = index;
            });

            if (result !== -1 && _.isUndefined(self.originalArmyIndex()))
                self.originalArmyIndex(result);

            return result;
        });
        self.defeated = ko.computed(function () {
            var index = self.originalArmyIndex();
            if (_.isUndefined(index) || index === -1)
                return false;

            var player = self.players()[index];

            return player.defeated;
        });

        self.playerWasAlwaysSpectating = ko.computed(function () {
            var index = self.originalArmyIndex();
            return (_.isUndefined(index) || index === -1);
        });

        self.singleHumanPlayer = ko.computed(function () {
            var humanArmies = _.reject(self.players(), 'ai');

            if (humanArmies.length !== 1)
                return false;

            // multiple commanders implies multiple human players in a shared army.
            if (humanArmies[0].commanders.length !== 1)
                return false;

            return true;
        });

        self.sendablePlayers = ko.computed(function () {
            return _.map(self.players(), function (player) {
                var clone = _.clone(player);
                // Remove circular player references
                clone.allies = player.allies && _.pluck(player.allies, 'id');
                return clone;
            });
        });

        self.playerData = ko.computed(function () {
            return {
                colors: _.pluck(self.sendablePlayers(), 'color'),
                primary_color: _.pluck(self.sendablePlayers(), 'primary_color'),
                names: _.pluck(self.sendablePlayers(), 'name'),
                ids: _.pluck(self.sendablePlayers(), 'id'),
                commanders: _.pluck(self.sendablePlayers(), 'commanders'),
                army_index: self.originalArmyIndex()
            };
        });
        self.playerData.subscribe((function () {
            var hash = '';

            return function (value) {
                var new_hash = JSON.stringify(value);
                if (hash !== new_hash) {
                    api.Panel.message('', 'player_data', value);
                }
                hash = new_hash;
            };
        })());

        self.player = ko.computed(function () {
            var player = '';
            if (self.players() && self.players().length && self.armyId()) {
                player = _.find(self.players(), function (player) {
                    return player.id === self.armyId();
                });
            }
            return player;
        });
        self.playerWasInTeam = ko.observable(false);
        self.playerInTeam = ko.computed(function () {
            if (!self.player() || !self.player().allies || !self.player().slots)
                return false;

            var result = !!self.player().allies.length || self.player().slots.length > 1;

            if (result)
                self.playerWasInTeam(true)

            return result;
        });

        self.playerName = ko.observable(self.player().name || '');
        self.player.subscribe(function () {
            if (self.player().name)
                self.playerName(self.player().name);
        });

        self.gameOver = ko.observable(false);
        self.showGameOver = ko.observable(false);

        /* called from game_over scene */
        self.signalShowGameOver = function (value) {
            self.showGameOver(value);
        };

        self.showDefeatPending = ko.observable(false);
        self.showGameOver.subscribe(function (value) {
            self.showDefeatPending(false);
        });

        self.baseGameOverState = ko.observable({});
        self.recordGameOver = ko.observable(false);
        self.gameOverState = ko.computed(function() {
            var base = self.baseGameOverState();
            return _.assign({}, base, {
                record: self.recordGameOver(),
                team: self.playerWasInTeam()
            });
        });
        self.gameOverDelay = ko.observable(14 * 1000 /* in ms */);
        function delayShowGameOver() {
            // Wait a bit to show off the effect
            _.delay(function() {
                var curState = self.gameOverState();
                if (!curState.show && curState.auto_show) {
                    curState.show = true;
                    self.gameOverState.notifySubscribers();
                }
            }, self.gameOverDelay());
        };

        self.restart.subscribe(function (value) {
            if (value) {
                self.baseGameOverState({
                    game_over: false,
                    defeated: false,
                    open: false,
                    auto_show: false,
                    ranked: self.gameOptions.isLadder1v1()
                });

                audioModel.triggerRewindMusic();
                audioModel.setDefeated(false);
            }
            else {
                self.baseGameOverState({
                    game_over: self.gameOver(),
                    defeated: self.defeated(),
                    open: false,
                    auto_show: (self.gameOver() || self.gameOver()),
                    ranked: self.gameOptions.isLadder1v1()
                });
            }
        });

        self.showDefeat = function () {
            self.baseGameOverState({
                defeated: true,
                auto_show: true,
                always_spectating: self.playerWasAlwaysSpectating(),
                ranked: self.gameOptions.isLadder1v1()
            });
            delayShowGameOver();
            self.gamestatsPanelIsOpen(false);
            self.showTimeControls(false);
            self.showDefeatPending(true);
        };
        self.clearDefeat = function () {
            self.baseGameOverState({
                defeated: false,
                auto_show: false,
                always_spectating: self.playerWasAlwaysSpectating(),
                ranked: self.gameOptions.isLadder1v1()
            });
            self.gamestatsPanelIsOpen(false);
            self.showTimeControls(false);
        };
        self.showGameComplete = function () {

            self.baseGameOverState({
                game_over: true,
                always_spectating: self.playerWasAlwaysSpectating(),
                defeated: self.defeated(),
                open: self.showGameOver() || self.showDefeatPending(),
                auto_show: !(self.gamestatsPanelIsOpen() || self.showTimeControls()),
                ranked: self.gameOptions.isLadder1v1()
            });
            delayShowGameOver();
        };
        self.gameOverState.subscribe(function() {
            api.panels.game_over_panel && api.panels.game_over_panel.message('state', self.gameOverState());
        });

        var refreshPanel = function (name, visible) {
            engine.call("game.allowKeyboard", !visible);
            if (visible)
                api.panels[name] && api.panels[name].focus();
            else
                api.Holodeck.refreshSettings();

            _.delay(api.panels[name].update);
        };

        self.showSettings.subscribe(function() {
            refreshPanel('settings', self.showSettings());

            if (self.showSettings() && self.singleHumanPlayer())
                self.pauseSim();
        });
        self.showPlayerGuide.subscribe(function () {
            refreshPanel('player_guide', self.showPlayerGuide());

             if (self.showPlayerGuide() && self.singleHumanPlayer())
                self.pauseSim();
        });

        // Sandbox
        self.sandbox = ko.observable(false);

        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.showDevControls = ko.computed(function () {
            return self.devMode() || self.cheatAllowChangeVision() || self.cheatAllowChangeControl() || self.sandbox();
        });

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });
        self.userTriggeredDisconnect = ko.observable(false);

        self.celestialControlModel = new CelestialControlModel();
        self.celestialControlActive = ko.computed(function () { return !self.celestialControlModel.notActive() });

        ko.computed(function() {
            if (!self.celestialControlActive())
                return;
            var control = self.celestialControlModel;
            if (control.requireConfirmation()) {
                self.setMessage({
                    button: 'Confirm Destination'
                }).then(function() {
                    control.executeCelestialAction();
                    self.setMessage('');
                });
            }
        });

        self.systemName = ko.observable('');
        self.celestialViewModels = ko.observableArray([]);
        self.startingPlanetBiome = ko.observable('earth');


        self.cameraFocus = {
            primary: ko.observable(),
            pip_0: ko.observable(),
            preview: ko.observable()
        };

        self.selectedCelestialIndex = ko.computed(function() {
            var focus = self.cameraFocus.primary();
            return focus ? focus.planet() : -1;
        });
        self.selectSun = function () {
            api.camera.setZoom('celestial', false);
        }
        self.isSunSelected = ko.computed(function () {
            return self.selectedCelestialIndex() === -1 || self.selectedCelestialIndex() === self.celestialViewModels().length;
        });

        self.hoverCelestialIndex = ko.observable(-1);

        self.chatSelected = ko.observable(false);
        self.teamChat = ko.observable(false);

        self.defeated.subscribe(function (value) {

            if (value) {
                audioModel.triggerDefeatMusic();
                audioModel.setDefeated(true);
                self.showDefeat();
            }
            else {
                audioModel.triggerRewindMusic();
                audioModel.setDefeated(false);
                self.clearDefeat();
            }
        });

        self.planetIndexToThrustControlMap = ko.observable({ /* 'friendly' | 'enemy' */ });
        self.planetIndexToWeaponControlMap = ko.observable({ /* 'friendly' | 'enemy' */ });
        self.planetIndexToCelestialStatusMap = ko.observable({});

        self.playerContactMap = ko.observable({}).extend({ session: 'player_contact_map' });
        self.playerContactMap.subscribe(function (value) {
            self.player.notifySubscribers();
        });

        self.showAllAvailableVisionFlags = ko.observable(false);
        self.visionSelectAll = function (from_server) {
            var i;
            var flags = [];

            var prev = _.clone(self.playerVisionFlags());

            for (i = 0; i < self.players().length; i++)
                flags.push(1);

            self.playerVisionFlags([]);
            self.playerVisionFlags(flags);
            self.showAllAvailableVisionFlags(true);

            if (!_.isEqual(prev, self.playerVisionFlags()) && !from_server) {
                self.send_message('change_vision_flags', { 'vision_flags': flags });
                engine.call('vision.setVisionMask', JSON.stringify(flags));
            }
        };
        self.visionSelect = function (index, event) {
            var flags = [];
            var i;

            var prev = _.clone(self.playerVisionFlags());

            for (i = 0; i < self.players().length; i++) {
                // If the shift key is held down add the player to the list of visible armies.
                if (event.shiftKey) {
                    var idx = self.playerVisionFlags()[i] ? 1 : 0;
                    var idxFlipped = self.playerVisionFlags()[i] ? 0 : 1;
                    flags.push(i === index ? idxFlipped : idx);
                } else {
                    flags.push(i === index ? 1 : 0);
                }
            }

            self.playerVisionFlags([]);
            self.playerVisionFlags(flags);
            self.showAllAvailableVisionFlags(false);

            if (!_.isEqual(prev, self.playerVisionFlags())) {
                self.send_message('change_vision_flags', { 'vision_flags': flags });
                engine.call('vision.setVisionMask', JSON.stringify(flags));
            }
        };

        self.playerVisionFlags = ko.observableArray([]);
        self.availableVisionFlags = ko.observableArray([]);
        self.availableVisionFlags.subscribe(function (value) {
            api.Panel.message('gamestats', 'available_vision_flags', value);
        });

        self.showPlayerVisionFlags = ko.computed(function () {
            return self.devMode() || self.reviewMode() || self.cheatAllowChangeVision();
        });

        self.playerControlFlags = ko.observableArray([]);
        self.showPlayerControlFlags = ko.computed(function () {
            return self.devMode() || self.cheatAllowChangeControl();
        });

        self.controlSingleArmy = function () {
            var i;
            var armies = self.players();
            var isPlayerArmy;

            for (i = 0; i < self.armyCount() ; i++) {
                isPlayerArmy = (self.armyId() === armies[i].id);
                self.playerVisionFlags()[i] = isPlayerArmy;
                self.playerControlFlags()[i] = isPlayerArmy;
            }

            self.playerVisionFlags.notifySubscribers();
            self.playerControlFlags.notifySubscribers();

            self.send_message('change_control_flags', { 'control_flags': self.playerControlFlags() });
            self.send_message('change_vision_flags', { 'vision_flags': self.playerVisionFlags() });
        }


        self.observerModeCalledOnce = ko.observable(false);
        self.startObserverMode = function () {
            var i;
            var v_flags = [];
            var c_flags = [];

            if (self.observerModeCalledOnce() && self.mode() !== "replay")
                return;

            //currently only the playing state on the server send available vision bits
            if (self.mode() === "game_over" || self.mode() === "replay") {
                for (i = 0; i < self.armyCount() ; i++)
                    v_flags.push(1);
                self.availableVisionFlags(v_flags);
                v_flags = [];
            }

            for (i = 0; i < self.armyCount() ; i++) {
                self.playerVisionFlags()[i] = self.availableVisionFlags()[i];
                self.playerControlFlags()[i] = false;

                v_flags.push(self.availableVisionFlags()[i] ? 1 : 0);
                c_flags.push(0);
            }

            self.playerVisionFlags.notifySubscribers();
            self.playerControlFlags.notifySubscribers();
            self.showAllAvailableVisionFlags(true);

            self.send_message('change_control_flags', { 'control_flags': self.playerControlFlags() });
            self.send_message('change_vision_flags', { 'vision_flags': self.playerVisionFlags() });

            self.reviewMode(true);
            self.observerModeCalledOnce(true);
        }

        self.canSave = ko.pureComputed(function() {
            var serverCanSave = (self.serverMode() === 'playing') || (self.serverMode() === 'game_over');
            return (self.singleHumanPlayer() || self.gameOptions.sandbox()) && serverCanSave;
        });

        /*  Time  */
        self.showTimeControls = ko.observable(false).extend({ session: 'show_time_controls' });
        self.showTimeControls.subscribe(function (value) {
            self.onShowTimeControls(value);
        });
        self.onShowTimeControls = function (value) {
            if (!value && (self.defeated() || self.gameOver()))
                api.panels.game_over_panel.query('ready').then(function (ready) {
                    if (ready)
                        self.showGameOver(true);
                });
        };
        self.toggleTimeControls = function() {
            self.showTimeControls(!self.showTimeControls());
        };

        self.timeBarState = ko.computed(function () {

            var require = self.singleHumanPlayer() || self.gameOptions.sandbox();
            var prevent = self.serverMode() === 'replay' || self.malformed();

            var state = {
                visible: self.showTimeControls(),
                showPlayFromHere: require && !prevent,
                minValidTime: self.minValidTime(),
                maxValidTime: self.maxValidTime()
            };

            return state;
        });
        self.timeBarState.subscribe(function() {
            api.panels.time_bar && api.panels.time_bar.message('state', self.timeBarState());
        });

        self.controlTime = function (value) {
            if (!!value === !!self.showTimeControls())
                return;

            if (value) {
                self.showTimeControls(true);
                api.time.control();
            }
            else {
                self.showTimeControls(false);
                api.time.resume();
            }
        };
        self.viewReplay.subscribe(function (value) {
            if (value)
            {
                self.controlTime(value);
                self.reviewMode(true);
                api.time.set(0);
            }
            else
            {
                self.controlTime(false);
                self.reviewMode(false);
            }
        });
        self.resumeIfNotReview = function () {
            if ((!self.reviewMode()) || self.forceResumeAfterReview()) {
                api.time.resume();
            }
        };
        ko.computed(function () {
            if (self.showTimeControls()) {
                api.time.control();
            } else {
                self.resumeIfNotReview();
            }
        });


        self.menuIsOpen = ko.observable(false);

        self.showMenu = ko.computed(function () { return self.menuIsOpen(); });
        self.showSelectionBar = ko.computed(function () {
            return !self.showMenu()
                    && !self.reviewMode()
                    && self.celestialControlModel.notActive();
        });

        self.idleTime = 0;

        self.timedOut = ko.observable(false);
        self.updateIdleTimer = function () {
            self.idleTime += 1;
            if (self.idleTime >= 120) {
                self.timedOut(true);
                self.navToMainMenu();
            }
        }

        self.showLanding = ko.observable().extend({ session: 'showLanding' });

        self.currentMetal = ko.observable();
        self.maxMetal = ko.observable();
        self.metalFraction = ko.computed(function () {
            return (self.maxMetal()) ? self.currentMetal() / self.maxMetal() : 0.0;
        });

        self.currentEnergy = ko.observable(1);
        self.maxEnergy = ko.observable();
        self.energyFraction = ko.computed(function () {
            return (self.maxEnergy()) ? self.currentEnergy() / self.maxEnergy() : 0.0;
        });

        self.combatUnitsInCombat = ko.observable(0);
        self.metalLost = ko.observable(0);
        self.enemyMetalDestroyed = ko.observable(0);

        self.commands = ko.observableArray(['move',
                                           'attack',
                                           'assist',

                                           'repair',
                                           'reclaim',
                                           'patrol',

                                           'use',
                                           'special_move',
                                           'special_attack',

                                           'unload',
                                           'load',
                                           'link_teleporters',

                                           'fire_secondary_weapon',
                                           'ping',

                                           'mass_teleport'
        ]);

        self.targetableCommands = ko.observableArray([false,
                                                      true,
                                                      true,

                                                      true,
                                                      true,
                                                      false,

                                                      true,
                                                      false,
                                                      true,

                                                      false,
                                                      true,
                                                      true,

                                                      false,
                                                      false]);

        self.toPascalCase = function (command) {
            if (!command || !command.length)
                return '';

            return command
                    .replace(/^[a-z]/, function (m) { return m.toUpperCase() })
                    .replace(/_[a-z]/g, function (m) { return m.toUpperCase() })
                    .replace(/_/g, '');
        }

        self.allowedCommands = {};

        self.cmdIndex = ko.observable();
        self.cmd = ko.computed(function () {
            if (self.cmdIndex() === -1)
                return 'stop';
            return self.commands()[self.cmdIndex()];
        });

        self.commanderHealth = ko.observable(1.0);
        self.armySize = ko.observable(0.0);

        self.armyCount = ko.observable();

        self.isSpectator = ko.computed(function () {
            return !self.armyId() || self.defeated() || self.viewReplay();
        });
        self.showControlGroups = ko.computed(function () {
            return !self.isSpectator();
        });
        self.squelchNotifications = ko.computed(function () {
            var result = self.isSpectator() || !self.armySize() || self.showTimeControls();

            audioModel.setDefeated(result);
            return result;
        });

        self.showResources = ko.computed(function () {
            return !self.showLanding() && !self.defeated() && self.celestialControlModel.notActive() && !self.isSpectator();
        });

        self.cmdQueueCount = ko.observable(0);

        self.endCommandMode = function () {
            self.cmdIndex(-1);
            self.mode('default');
            api.arch.endFabMode();
            self.currentBuildStructureId('');
            api.arch.endAreaCommandMode();
            engine.call('set_command_mode', '');
        };

        self.setCommandIndex = function (index) {
            var stop = (index === -1);
            var ping = (index === 13);

            if (!stop && !ping && !self.allowedCommands[self.toPascalCase(self.commands()[index])])
                return;

            self.endCommandMode()

            self.cmdIndex(index);
            self.cmdQueueCount(0);
            if (!stop && self.cmd())
                self.mode('command_' + self.cmd());
            else
                self.mode('default');

            engine.call("set_command_mode", self.cmd());
        };

        self.toggleFireOrderIndex = function () {
            api.panels.action_bar && api.panels.action_bar.message('toggle_order', 'Fire');
        };
        self.selectionFireAtWill = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'FireAtWill');
        }
        self.selectionReturnFire = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'ReturnFire');
        }
        self.selectionHoldFire = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'HoldFire');
        }

        self.toggleMoveOrderIndex = function () {
            api.panels.action_bar && api.panels.action_bar.message('toggle_order', 'Move');
        };
        self.selectionManeuver = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'Maneuver');
        }
        self.selectionRoam = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'Roam');
        }
        self.selectionHoldPosition = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'HoldPosition');
        }

        self.toggleEnergyOrderIndex = function () {
            api.panels.action_bar && api.panels.action_bar.message('toggle_order', 'Energy');
        }
        self.selectionConsume = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'Consume');
        }
        self.selectionConserve = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'Conserve');
        }

        self.toggleBuildStanceOrderIndex = function () {
            api.panels.action_bar && api.panels.action_bar.message('toggle_order', 'BuildStance');
        }
        self.selectionBuildStanceNormal = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'BuildStanceNormal');
        }
        self.selectionBuildStanceContinuous = function () {
            api.panels.action_bar && api.panels.action_bar.message('selection_order', 'BuildStanceContinuous');
        }

        self.considerPlayingSound = (function() {
            var bestCue = '',
                bestPriority = 0,
                timeoutId = null,
                playSound = function() {
                    api.audio.playSound(bestCue);

                    bestCue = '';
                    bestPriority = 0;
                    timeoutId = null;
                },
                considerPlayingSound = function (cue, priority) {
                    /* this simple version of the trigger model is used only for planet VO, and only because triggers don't prioritize correctly across panels */
                    if (priority > bestPriority) {
                        bestCue = cue;
                        bestPriority = priority;
                        if (!timeoutId) {
                            timeoutId = window.setTimeout(playSound, 15);
                        }
                    }
                }

                return considerPlayingSound;
        })();

        self.buildHotkeyModel = new Build.HotkeyModel();

        self.buildTabs = ko.observable({});
        self.orderedBuildTabs = ko.computed(function () {
            var result = [];
            var order = ['factory',
                         'combat',
                         'utility',
                         'vehicle',
                         'bot',
                         'air',
                         'sea',
                         'orbital',
                         'ammo'];

            _.forEach(order, function (element) {
                if (self.buildTabs()[element])
                    result.push(element);
            });

            return result;
        });
        self.buildTabLists = ko.computed(function () {
            var result = [];

            _.forEach(self.orderedBuildTabs(), function (element) {
                result.push(self.buildTabs()[element]);
            });

            return result;
        });

        self.selectedMobile = ko.observable(false);

        self.activeBuildGroup = ko.observable();
        self.activeBuildGroupLocked = ko.observable(false);

        self.buildSequenceTimeout = ko.computed(function () {
            return self.selectedMobile() ? 0 : 500;
        });

        self.clearBuildSequence = function () {
            self.activeBuildGroup(null);
            self.activeBuildGroupLocked(false);
            self.activatedBuildId('');
            remove_keybinds('build');
            api.panels.build_bar.message('clear_build_sequence');
        };

        var clear_build_sequence_timeout;
        self.resetClearBuildSequence = function () {
            clearTimeout(clear_build_sequence_timeout);
            clear_build_sequence_timeout = setTimeout(self.clearBuildSequence, self.buildSequenceTimeout());
        }

        self.startBuild = function (group, override_lock) {

            if (self.activeBuildGroupLocked() && !override_lock)
                return;

            self.activeBuildGroup(group);

            if (override_lock)
                self.activeBuildGroupLocked(true);

            apply_keybinds('build');

            api.panels.build_bar.message('start_build_sequence', {
                group: group,
                lock: override_lock
            });
        };

        self.activatedBuildId = ko.observable('');

        self.buildItemFromList = function (index) {
            // Reset any fab build selections we may have had.
            self.currentBuildStructureId('');

            api.panels.build_bar.query('build_item', index).then(function(id) {
                if (!id)
                    return;

                keyupResponse = self.resetClearBuildSequence;
                self.buildItemBySpec(id);
            });
        };


        self.buildTabOrders = ko.observableArray([]);

        self.toggleBuildTab = function () {
            var index = 0;
            if (self.buildTabLists().length)
                index = (self.selectedBuildTabIndex() + 1) % self.buildTabLists().length;

            self.selectedBuildTabIndex(index);
        }

        self.buildItemMinIndex = ko.observable(0);

        self.selectedBuildTabIndex = ko.observable(0);

        self.selectedBuildTabIndex.subscribe(function (newProductId) {
            self.buildItemMinIndex(0);
        }.bind(self));

        self.windowWidth = ko.observable(window.innerWidth);
        self.windowHeight = ko.observable(window.innerHeight);
        $(window).resize(function () {
            self.windowWidth(window.innerWidth);
            self.windowHeight(window.innerHeight);
        });


        self.navDebug = ko.observable(false);
        self.toggleNavDebug = function () {
            self.navDebug(!self.navDebug());
            api.arch.setNavDebug(self.navDebug());
        };

        self.itemDetails = {};

        self.buildHover = ko.observable(new UnitDetailModel());
        self.showBuildHover = ko.computed(function () {
            if (self.showTimeControls())
                return false;
            return self.buildHover() && self.buildHover().name() ? true : false;
        });
        self.setBuildHover = function (id) {
            var details = self.itemDetails[id];
            self.buildHover(details);
        };
        self.clearBuildHover = function () { self.setBuildHover(''); };

        self.buildHoverState = ko.computed(function() { return self.buildHover() && ko.toJS(self.buildHover()); });
        self.buildHoverState.subscribe(function(state) {
            if (state && state.name) {
                api.panels.build_hover && api.panels.build_hover.query('state', state).then(function() { api.panels.build_hover.update(); });
            }
        });

        self.buildItemSize = ko.observable(60);

        self.worldHoverTarget = ko.observable();
        self.hasWorldHoverTarget = ko.observable(false);

        self.fabCount = ko.observable(0);
        self.batchBuildSize = ko.observable(5);

        self.currentBuildStructureId = ko.observable('');

        self.buildItem = function (item) {

            self.activatedBuildId(item.id);

            if (item.structure || item.titan) {

                if (self.currentBuildStructureId() === item.id && self.mode() === 'fab')
                    return;

                self.currentBuildStructureId(item.id);
                self.endCommandMode();
                api.arch.beginFabMode(item.id)
                    .then(function (ok) { if (!ok) { self.endFabMode(); } });
                self.mode('fab');
                self.fabCount(0);
            }
            else {
                api.unit.build(item.id, 1, false).then(function (success) {
                    if (success)
                        api.audio.playSound('/SE/UI/UI_Command_Build');
                });
            }
        }

        self.buildItemBySpec = function (spec_id) {
            var item = self.unitSpecs[spec_id];
            if (item)
                self.buildItem(item);
        }

        self.executeStartBuild = function (params) {
            var id = params.item;
            var batch = params.batch;
            var cancel = params.cancel;
            var urgent = params.urgent;
            var more = params.more;

            if (self.selectedMobile()) {
                self.endCommandMode();
                self.currentBuildStructureId(id);
                api.arch.beginFabMode(id)
                        .then(function (ok) {
                            if (!ok)
                                self.endFabMode();
                        });

                self.mode('fab');
                self.fabCount(0);
            }
            else {
                var count = batch ? self.batchBuildSize() : 1;
                if (cancel) {
                    api.unit.cancelBuild(id, count, urgent);
                    api.audio.playSound('/SE/UI/UI_factory_remove_from_queue');
                }
                else {
                    api.unit.build(id, count, urgent).then(function (success) {
                        if (success) {
                            var secondary = more ? '_secondary' : '';
                            api.audio.playSound('/SE/UI/UI_Command_Build' + secondary);
                        }
                    });
                }
            }
        };

        ko.computed(function() {
            var buildId = self.activatedBuildId() || self.currentBuildStructureId() || '';
            api.panels.build_bar && api.panels.build_bar.message('active_build_id', buildId);
        });

        self.endFabMode = function () {
            self.mode('default');
            api.arch.endFabMode();
            self.currentBuildStructureId('');
        };

        self.maybeSetBuildTarget = function (spec_id) {
            var list = (self.buildTabLists().length) ? self.buildTabLists()[0] : [];
            var i;

            engine.call("unit.debug.setSpecId", spec_id);

            for (i = 0; i < list.length; i++) {
                if (list[i].id === spec_id) {
                    self.buildItemBySpec(spec_id);
                    return;
                }
            }
        }

        self.maybeSetBuildTargetFromSequence = function (target_index, spec_id_list) {
            var list = (self.buildTabLists().length) ? self.buildTabLists()[0] : [];
            var index = -1;

            var valid = [];

            _.forEach(spec_id_list, function (target) {
                _.forEach(list, function (element) {
                    if (element.id === target.specId())
                        valid.push(element.id);
                });
            });

            if (valid.length)
                self.buildItemBySpec(valid[target_index % valid.length]);
        }

        self.spawnCommander = function () {
            engine.call('send_launch_message');
        };

        self.landingOk = function () {
            engine.call('launch_commander');
        };

        self.abandon = function () {
            var removeDeferred = $.Deferred();
            $.when(self.haveUberNet() && api.net.removePlayerFromGame()).always(removeDeferred.resolve);

            if (self.serverMode() !== 'replay') {
                var surrenderDeferred = $.Deferred();
                api.select.commander().always(function () {
                    api.camera.track(true);
                    self.send_message("surrender", {}, function() {
                        surrenderDeferred.resolve();
                    });
                });

                // Make sure this promise is fulfilled in at least 3 seconds.
                _.delay(function() {
                    // Calling reject() after resolve() leaves the promise as resolved,
                    // *not* rejected, and fail() callbacks are not called. This is
                    // intended & documented. That makes this fine to do unconditionally.
                    surrenderDeferred.reject();
                }, 3000);

                return $.when(removeDeferred, surrenderDeferred);
            } else {
                return removeDeferred.promise();
            }
        }

        self.navToGameOptions = function () {
            engine.call('pop_mouse_constraint_flag');
            engine.call("game.allowKeyboard", true);

            window.location.href = 'coui://ui/main/game/settings/settings.html';
            return; /* window.location.href will not stop execution. */
        }

        self.mainMenuUrl = ko.observable('coui://ui/main/game/start/start.html');
        self.navToMainMenu = function () {
            engine.call('pop_mouse_constraint_flag');
            engine.call("game.allowKeyboard", true);

            self.abandon().always(function () {
                self.userTriggeredDisconnect(true);
                self.disconnect();
                window.location.href = self.mainMenuUrl();
            });
        }

        self.navToTransit = function () {

            engine.call('pop_mouse_constraint_flag');
            engine.call("game.allowKeyboard", true);

            self.disconnect();

            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return; /* window.location.href will not stop execution. */
        }

        self.exitGame = function () {
            engine.call('pop_mouse_constraint_flag');
            engine.call("game.allowKeyboard", true);

            self.abandon().always(function() {
                self.userTriggeredDisconnect(true);
                self.disconnect();
                self.exit();
            });
        }

        // from handlers
        self.selection = ko.observable(null);
        self.hasSelection = ko.computed(function () { return !!self.selection() && self.selection().spec_ids && !$.isEmptyObject(self.selection().spec_ids) });

        self.hasSelection.subscribe(function (value) {
            api.panels.control_group_bar.message('has_selection', value);
        });

        self.selectionTypes = ko.observableArray([]);

        self.selectedAllMatchingCurrentSelectionOnScreen = function () {
            self.holodeck.selectMatchingTypes('add', self.selectionTypes());
        }

        var selectionDisplayClickState = {
            doubleTime: undefined,
            index: undefined
        };
        self.onSelectionDisplayClick = function (index, event, force_remove) {

            var option = getSelectOption(event);
            if (event.button === 2 || force_remove) /* right click */
                option = 'remove';
            var now = new Date().getTime();
            var double = (now <= selectionDisplayClickState.doubleTime) && (index === selectionDisplayClickState.index) && !force_remove;
            var invert = false;
            var types = self.selectionTypes();

            selectionDisplayClickState = {
                doubleTime: now + input.doubleTap.timeout,
                index: index
            };

            switch (option) {
                case 'toggle': option = 'remove'; break;
                case 'add': if (!double) return; break; // Already in the selection
                case '':
                    if (!double) {
                        if (types.length === 1)
                            return;
                        invert = true;
                        option = 'remove';
                    }
                    break;
            }
            var type = types[index % types.length];
            if (type) {
                if (invert) {
                    types = types.slice(0);
                    types.splice(index % types.length, 1);
                    self.holodeck.view.selectByTypes(option, types);
                }
                else
                    self.holodeck.view.selectByTypes(option, [type]);
            }
        }

        // Command Bar
        self.build_orders = {};

        self.showOrders = ko.computed(function () {
            return !self.showTimeControls()
                    && self.hasSelection()
                    && !self.showLanding()
                    && !self.reviewMode()
                    && self.celestialControlModel.notActive();
        });
        self.showBuildList = ko.computed(function () {
            return !self.showTimeControls()
                    && !self.showLanding()
                    && !self.reviewMode()
                    && self.celestialControlModel.notActive();
        });

        self.showCommands = ko.computed(function () {
            if (self.showTimeControls() || self.reviewMode() || self.celestialControlModel.active() || self.isSpectator())
                return false;

            return true;
        });

        self.showActionBar = ko.computed(function() {
            return self.showCommands() || self.showOrders();
        });

        self.parseSelection = function (payload) {
            var i = 0;
            var tabs = {};
            var selectionCanBuild = false;

            self.allowedCommands = {};

            self.buildItemMinIndex(0);

            self.cmdIndex(-1);
            self.selectionTypes([]);

            if (self.reviewMode())
                return;

            for (var id in payload.spec_ids) {
                var unit = self.unitSpecs[id];
                if (!unit)
                    continue;

                for (i = 0; i < unit.commands.length; i++)
                    self.allowedCommands[unit.commands[i]] = true;

                selectionCanBuild |= unit.canBuild;

                self.selectionTypes().push(id);
            }

            if (!tabs[self.activeBuildGroup()])
                self.activeBuildGroup(null);

            self.selectedMobile(payload.selected_mobile);

            if (selectionCanBuild) {
                if (self.selectedMobile()) {
                    modify_keybinds({ remove: ['build unit'], add: ['build structure'] });
                } else {
                    modify_keybinds({ remove: ['build structure'], add: ['build unit'] });
                }
            }
            else {
                modify_keybinds({ remove: ['build structure', 'build unit'] });
                model.clearBuildSequence();
            }

            if (!$.isEmptyObject(payload.spec_ids))
                self.selection(payload);
            else
                self.selection(null);
        };

        self.actionBarState = ko.computed(function() {
            return {
                show_commands: self.showCommands(),
                show_orders: self.showOrders(),
                cmd_index: self.cmdIndex(),
            };
        });
        self.actionBarStateMutation = ko.observable(0);
        self.actionBarState.subscribe(function() {
            self.actionBarStateMutation(self.actionBarStateMutation() + 1);
            var mutation = self.actionBarStateMutation();
            _.delay(function() {
                if (mutation === self.actionBarStateMutation())
                    api.panels.action_bar && api.panels.action_bar.message('state', self.actionBarState());
            });
        });


        /// Camera API
        self.cameraMode = ko.observable('planet');
        self.cameraMode.subscribe(function (mode) {
            api.camera.track(false);
            api.camera.setMode(mode);
            if (mode === 'free' || mode === 'debug')
                apply_keybinds('free camera controls');
            else
                remove_keybinds('free camera controls');
        });
        self.pauseCamera = ko.observable(false);

        self.alignCameraToPole = function () {
            api.camera.alignToPole();
        };
        self.focusSun = function () {
            api.camera.focusPlanet(-1);
        };

        self.changeFocusPlanet = function (delta) {
            var planets = self.celestialViewModels(),
                oldFocus = api.camera.getFocus(api.Holodeck.focused.id).planet(),
                idx = (oldFocus != -1) ? oldFocus : (delta > 0 ? 0 : planets.length - 1),
                sentinel = idx,
                advance = function() {
                    idx = (idx + delta + planets.length) % planets.length;
                    return (idx === sentinel) ? null : planets[idx];
                },
                planet;

            if (delta !== -1 && delta !== 1)
                return;

            while (planet = advance()) {
                if (!planet.dead() && !planet.isSun()) {
                    api.camera.focusPlanet(idx);
                    api.audio.playSound('/SE/UI/UI_planet_switch_select');
                    return;
                }
            }
        }

        self.focusNextPlanet = function () {
            self.changeFocusPlanet(1);
        }
        self.focusPreviousPlanet = function () {
            self.changeFocusPlanet(-1);
        }

        var pauseCameraRule = ko.computed(function() {
            if (self.pauseCamera()) {
                api.camera.freeze(true);
                return;
            }

            var ccm = self.celestialControlModel;

            if (ccm.targetPlanetIndex() !== -1) {
                api.camera.setAllowZoom(false);
                api.camera.setAllowPan(true);
                api.camera.setAllowRoll(true);
                return;
            }

            if (ccm.sourcePlanetIndex() !== -1) {
                api.camera.freeze(true);
                return;
            }

            // Fully enable the camera.
            api.camera.freeze(false);
        });
        /// End Camera API

        /// Unit alert integration
        self.doCustomAlert = function(payload) {
            return api.panels.unit_alert.query('custom_alert', payload);
        };

        self.clippingPanels = { };

        var updatePreviewClipping = function() {
            var $deck = self.preview.$div,
                visible = $deck.is(":visible"),
                deckOffset = $deck.offset(),
                w = $deck.width(),
                h = $deck.height();

            _.forEach(self.clippingPanels, function(active, panelName) {
                var panel = api.panels[panelName],
                    panelOffset = $(panel._div).offset();

                api.Panel.message(panelName, 'preview.clip', {
                    visible: visible,
                    gap: [
                        deckOffset.left - panelOffset.left - 1,
                        deckOffset.top - panelOffset.top - 1,
                        w + 2,
                        h + 2
                    ]
                });
            });
        };

        self.showAlertPreview = function(request) {
            var target = request.target,
                placement = request.placement,
                previewHolodeck = placement.holodeck ? (new Function('self', 'return self.' + placement.holodeck))(self) : self.preview;

            if (previewHolodeck === self.pips[0] && self.pips.length === 1)
                self.showPips(true);
            else
                previewHolodeck.$div.show();

            if (previewHolodeck === self.preview) {
                var
                    panelOffset = $(api.panels[placement.panelName]._div).offset(),
                    left = panelOffset.left + placement.offset[0] + placement.alignDeck[0] * $(previewHolodeck.div).width(),
                    top = panelOffset.top + placement.offset[1] + placement.alignDeck[1] * $(previewHolodeck.div).height();

                // todo soon: grab planet info off the holodeck's camera and use it to display the planet name!
                previewHolodeck.$div.css({left: left + 'px', top: top + 'px', position: 'absolute'});
            }

            previewHolodeck.update();
            _.delay(api.Panel.update);

            var focused = api.Holodeck.focused;
            previewHolodeck.focus();

            if (!previewHolodeck.hasLookedAtPlanet) {
                /* patch around an arcane focus issue */
                api.camera.focusPlanet(0);
                previewHolodeck.hasLookedAtPlanet = true;
            }

            if (typeof target.control_group === 'number') {
                api.camera.track(true, target.control_group);
            } else if (typeof target.planetIdx === 'number') {
                var anchor = api.camera.getPlanetAnchor(self.holodeck, target.planetIdx);
                /* this could be a nice place to use holodeck tracking, if the primary holodeck is currently looking at this planet */
                if (anchor) {
                    api.camera.recallAnchor(anchor);
                } else {
                    api.camera.focusPlanet(target.planetIdx);
                }
            } else if (target.planetIdx === 'sun') {
                api.camera.setZoom('celestial', false);
            } else {
                api.camera.lookAt(target);
            }
            if (focused)
                focused.focus();

            updatePreviewClipping();
        };
        self.hideAlertPreview = function () {
            self.preview.$div.hide();
            self.preview.update();

            updatePreviewClipping();

            _.delay(api.Panel.update);
        };

        self.update = function () {

            if (self.defeated())
                return;

            if (!self.showTimeControls()) {
                triggerModel.testEvent(constants.event_type.low_metal, self.metalFraction());
                triggerModel.testEvent(constants.event_type.full_metal, 1.0 - self.metalFraction());
                triggerModel.testEvent(constants.event_type.low_energy, self.energyFraction());
                triggerModel.testEvent(constants.event_type.full_energy, 1.0 - self.energyFraction());
                triggerModel.testEvent(constants.event_type.under_attack, self.metalLost());
                if (self.commanderHealth() > 0) {
                    triggerModel.testEvent(constants.event_type.commander_under_attack, self.commanderHealth());
                    triggerModel.testEvent(constants.event_type.commander_healed, self.commanderHealth());
                    triggerModel.testEvent(constants.event_type.commander_low_health, self.commanderHealth());
                    triggerModel.testEvent(constants.event_type.commander_under_attack_very_low_health, self.commanderHealth());
                }
                triggerModel.testEvent(constants.event_type.in_combat, self.combatUnitsInCombat());
                triggerModel.testEvent(constants.event_type.metal_lost, self.metalLost());
                triggerModel.testEvent(constants.event_type.enemy_metal_destroyed, self.enemyMetalDestroyed());

            }
        };

        self.startRagnarokMusic = function() {
            audioModel.triggerRagnarokMusic();
        };

        self.stopRagnarokMusic = function() {
            audioModel.stopRagnarokMusic();
        };

        self.processExternalUnitEvent = function (type, payload) {
            eventSystem.processEvent(type, payload);
        };

        self.musicHasStarted = ko.observable(false);

        self.maybePlayStartingMusic = function () {
            if (self.musicHasStarted())
                return;

            var starting_music_map = {
                earth: '/Music/Music_Planet_Load_Earth',
                lava: '/Music/Music_Planet_Load_Lava',
                moon: '/Music/Music_Planet_Load_Moon',
                ice: '/Music/Music_Planet_Load_Ice',
                tropical: '/Music/Music_Planet_Load_Tropical',
                gas: '/Music/Music_Planet_Load_Gas',
                water: '/Music/Music_Planet_Load_water',
                metal: '/Music/Music_Planet_Load_Metal'
            }

            var starting_music = starting_music_map[model.startingPlanetBiome()];
            if (!starting_music)
                starting_music = starting_music_map.earth;

            api.audio.setMusic(starting_music);

            self.musicHasStarted(true);
        }

        self.gamestatsPanelIsOpen = ko.observable(false);
        self.gamestatsPanelIsOpen.subscribe(function (value) {
            if (!value && (self.defeated() || self.gameOver()))
                api.panels.game_over_panel.query('ready').then(function (ready) {
                    if (ready)
                        self.showGameOver(true);
                });
        });

        self.toggleGamestatsPanel = function() {
            self.gamestatsPanelIsOpen(!self.gamestatsPanelIsOpen());
            self.closeMenu();
        };
        self.setStatsPanelState = function (open) {
            self.gamestatsPanelIsOpen(open);
        };

        self.toggleMenu = function () {
            if (self.saving())
                return;

            self.menuIsOpen(!self.menuIsOpen());

            if (self.menuIsOpen())
                engine.call('push_mouse_constraint_flag', false);
            else
                engine.call('pop_mouse_constraint_flag');
        };
        self.closeMenu = function() {
            if (self.menuIsOpen())
                self.toggleMenu();
        };

        self.menuPauseGame = function () {
            self.pauseSim();
            self.closeMenu();
        };
        self.menuResumeGame = function () {
            self.playSim();
            self.closeMenu();
        };
        self.menuTogglePlayerGuide = function () {
            self.toggleShowPlayerGuide();
            self.closeMenu();
        };
        self.menuToggleChronoCam = function() {
            self.showTimeControls(!self.showTimeControls());
            self.closeMenu();
        };
        self.menuSettings = function() {
            self.showSettings(true);
            self.closeMenu();
        };
        self.menuSurrender = function () {
            self.closeMenu();
            self.popUp({ message: '!LOC:Surrender Game?' }).then(function (result) {
                if (result === 0) {
                    self.closeMenu();

                    // Abandoning should take you to the game_over state, but if it fails (times out), we disconnect
                    // and move you to the main menu. It's probably happening because the server is hanging.
                    self.abandon().fail(function () {
                        engine.call('pop_mouse_constraint_flag');
                        engine.call("game.allowKeyboard", true);

                        self.userTriggeredDisconnect(true);
                        self.disconnect();
                        window.location.href = self.mainMenuUrl();
                    });
                }
            });
        };
        self.menuExit = function () {
            self.closeMenu();
            self.popUp({
                buttons : [
                    '!LOC:Quit to Main Menu',
                    '!LOC:Cancel'
                ],
                message: '!LOC:Quit Game'
            }).then(function (result) {
                switch (result) {
                    case 0: self.navToMainMenu(); break;
                    case 2: /* do nothing */ break;
                }
            });
        };

        self.menuSave = function () {
            self.closeMenu();

            var was_paused = self.paused();
            if (!was_paused && !self.gameOver())
                self.pauseSim();

            var text = (self.singleHumanPlayer() ? 'AI Skirmish' : 'Multiplayer Battle')
                    + ' ' + UberUtility.createDateString();

            self.popUp({
                message: '!LOC:Save Game',
                textfield: true,
                defaultText: text,
                filename: true,
                buttons: [
                    '!LOC:Save',
                    '!LOC:Cancel'
                ],
            }).then(function (result) {
                if (result) { /* popup will return the entered text or a falsely value */
                    var payload = { name: String(result), type: String('') };
                    model.send_message('write_replay', payload);
                }
                else if (!was_paused)
                    self.playSim();
            });
        };

        self.maybeDeleteUnits = function () {
            if (!model.selection())
                return;

            self.popUp({ message: '!LOC:Destroy selected units?' }).then(function (result) {
                if (result === 0)
                    api.unit.selfDestruct();
            });
        };

        self.menuAction = function (action) { self[action](); };

        /* affected by gw live_game_patch. check patch before changing. */
        self.menuConfigGenerator = ko.observable(function() {
            var list = [];

            var allow_pause = self.singleHumanPlayer() || self.sandbox() || !self.isSpectator();
            var reject_pause = self.ranked() || self.viewReplay();
            if (allow_pause && !reject_pause) {
                var togglePause = self.paused() ? {
                        label: '!LOC:Resume Game',
                        action: 'menuResumeGame'
                    } : {
                        label: '!LOC:Pause Game',
                        action: 'menuPauseGame'
                    };

                list.push(togglePause);
            }

            list.push({
                label: '!LOC:Game Stats',
                action: 'toggleGamestatsPanel'
            });

            list.push({
                label: '!LOC:Player Guide',
                action: 'menuTogglePlayerGuide'
            });

            list.push({
                label: '!LOC:Chrono Cam',
                action: 'menuToggleChronoCam'
            });

            list.push({
                label: '!LOC:Game Settings',
                action: 'menuSettings'
            });

            if (!self.isSpectator() && self.serverMode() !== 'replay') {
                list.push({
                    label: '!LOC:Surrender',
                    action: 'menuSurrender',
                });
            }

            if (self.canSave()) {
                list.push({
                    label: '!LOC:Save Game',
                    action: 'menuSave'
                });
            }

            if (!self.ranked()) {
                list.push({
                    label: '!LOC:Quit',
                    action: 'menuExit'
                });
            }

            return _.map(list, function(entry) { return { label: loc(entry.label), action: entry.action }; });
        });

        self.menuConfig = ko.computed(function() {
            return self.menuConfigGenerator() && self.menuConfigGenerator()();
        });

        ko.computed(function() {
            api.panels.menu && api.panels.menu.query('state', self.menuConfig()).then(api.panels.menu.update());
        });
        self.showMenu.subscribe(function() {
            _.delay(function() { api.panels.menu.update(); });
        });

        self.modalBack = function () {
            if (model.mode() === 'fab')
                model.endFabMode();
            else if (model.chatSelected()) {
                model.chatSelected(false);
            }
            else if (model.mode() === 'landing') {
                model.toggleMenu();
            }
            else if (model.mode() === 'default') {
                if (model.hasSelection()) {

                    if (model.activeBuildGroup())
                        model.clearBuildSequence();
                    else {
                        api.select.empty();
                        model.selection(null);
                    }
                }
                else if (model.showTimeControls()) {
                    model.showTimeControls(false)
                }
                else {
                    model.toggleMenu();
                }
            }
            else if (model.mode().startsWith('command_'))
                model.endCommandMode();
            else
                model.mode('default');
        }

        self.globalMousemoveHandler = function (element, event) {
            self.idleTime = 0;
        };

        self.globalClickHandler = function (element, event) {
            input.doubleTap.reset();
        };

        var keyupResponse = null;
        self.globalKeyupHandler = function (element, event) {
            if (keyupResponse)
                keyupResponse();
            keyupResponse = null;
        };

        self.setupWatchList = function () {
            engine.call('watchlist.setCreationAlertTypes', JSON.stringify(['Factory', 'Recon', 'Titan', 'Important']), JSON.stringify([]));
            engine.call('watchlist.setIdleAlertTypes', JSON.stringify([/*'Factory'*/]), JSON.stringify([])); /* disabled until the alert ui can be cleaned up. */
            engine.call('watchlist.setArrivalAlertTypes', JSON.stringify(['Commander', 'Transport']), JSON.stringify([]));
            engine.call('watchlist.setDamageAlertTypes', JSON.stringify(['Commander', 'Titan']), JSON.stringify([]));
            engine.call('watchlist.setDeathAlertTypes', JSON.stringify(['Factory', 'Commander', 'Recon', 'Important', 'Titan']), JSON.stringify(['Wall']));
            engine.call('watchlist.setSightAlertTypes', JSON.stringify(['Factory', 'Commander', 'Recon', 'Important', 'Titan']), JSON.stringify(['Wall']));
            engine.call('watchlist.setTargetDestroyedAlertTypes', JSON.stringify(['Factory', 'Commander', 'Recon', 'Titan', 'Important']), JSON.stringify(['Wall']));
            engine.call('watchlist.setAmmoAlertTypes', JSON.stringify(['SelfDestruct', 'Nuke', 'Artillery', 'NukeDefense']), JSON.stringify([]));
        };

        self.setup = function () {

            ko.observable().extend({ session: 'has_entered_game' })(true);

            engine.call('push_mouse_constraint_flag', true);
            engine.call('request_spec_data');
            engine.call('request_model_refresh');
            engine.call('set_ui_music_state', 'in_game');

            self.showGameLoading(true);
            self.holodeck.view.arePlanetsReady().then(function (ready) {
                if (!ready) {
                    self.holodeck.view.whenPlanetsReady().done(function () {
                        // Note: delayed a bit to avoid a black screen in some situations
                        setTimeout(function () { self.showGameLoading(false); }, 10);
                    });
                }
                else {
                    self.showGameLoading(false);
                }
            });

            self.lastSceneUrl('coui://ui/main/game/live_game/live_game.html');

            // start periodic update
            setInterval(model.update, 250);
            if (!self.isLocalGame())
                setInterval(model.updateIdleTimer, 60000);

            active_dictionary.subscribe(function () {
                apply_camera_controls();
            });

            modify_keybinds({ add: ['camera controls', 'gameplay', 'camera', 'hacks'] });

            self.setupWatchList();

            window.onbeforeunload = function() {
                api.Panel.message(api.Panel.parentId, 'game.layout', false);
            };
        };

        ko.computed(function() {
            var pauseInput = self.chatSelected() || self.showPopUp();
            if (pauseInput) {
                api.game.captureKeyboard(true);
                if (self.chatSelected())
                    api.panels.chat.focus();
                else if (self.showPopUp())
                    api.panels.popup.focus();
            }
            else
                api.game.releaseKeyboard(true);
            inputmap.paused(pauseInput);
        });

        self.startOrSendChat = function () {
            if (self.chatSelected())
                api.panels.chat.message('submit');

            self.chatSelected(!self.chatSelected());
            engine.call("game.allowKeyboard", !self.chatSelected());

            if (self.chatSelected()) {
                api.panels.chat.message('scrollToTop');

                var oldMode = self.mode();
                self.mode('default');
                var modeChangeSubscription = self.chatSelected.subscribe(function(newValue) {
                    if (!newValue) {
                        self.mode(oldMode);
                        modeChangeSubscription.dispose();
                    }
                });
            }
        };

        self.startTeamChat = function () {
            self.startOrSendChat();

            // if global spectator chat is enabled and not game over then make spectator chat default to team chat

            self.teamChat(self.gameOptions.listenToSpectators() && self.isSpectator() && ! self.gameOver() || self.playerInTeam());
        }

        self.startNormalChat = function () {
            self.startOrSendChat();
            self.teamChat(false);
        }

        self.chatState = ko.computed(function() {
            return {
                selected: self.chatSelected(),
                team: self.teamChat()
            };
        });
        ko.computed(function() {
            api.panels.chat && api.panels.chat.message('state', self.chatState());
        });

        self.keybindsForBuildTabs = ko.computed(function () {
            var list = self.orderedBuildTabs();
            var active = active_actionmap();

            return _.map(list, function (element) {
                return active['start build ' + element]
            });
        });

        self.keybindsForBuildItems = ko.computed(function () {
            var list = _.range(1, 17);
            var active = active_actionmap();

            return _.map(list, function (element) {
                return active['build item ' + element];
            });
        });

        self.keybindsForCommandModes = ko.computed(function () {
            var list = ['move',
                        'attack',
                        'alt fire',
                        'assist',
                        'repair',
                        'reclaim',
                        'patrol',
                        'use',
                        'special move',
                        'unload',
                        'load',
                        'ping'];
            var active = active_actionmap();


            var result = _.map(list, function (element) {
                return active['command mode [' + element + ']'];
            });

            result.push(active['stop command']);

            return result;
        });

        self.keybindsForOrders = ko.computed(function () {
            var list = ['fire',
                        'move',
                        'energy',
                        'build'];
            var active = active_actionmap();

            return _.map(list, function (element) {
                return active['toggle ' + element + ' orders'];
            });
        });

        self.actionKeybinds = ko.computed(function() {
            return {
                commands: self.keybindsForCommandModes(),
                orders: self.keybindsForOrders()
            };
        });
        self.actionKeybinds.subscribe(function() {
            api.panels.action_bar && api.panels.action_bar.message('keybinds', self.actionKeybinds());
        });

        self.acknowledgeAlert = function () {
            api.panels.unit_alert.message('acknowledge_alert');
        };

        self.acknowledgeCombat = function () {
            api.panels.unit_alert.message('acknowledge_combat');
        };

        var
            holodeckReady = function(hdeck) {
                var focus = api.camera.getFocus(hdeck.id);
                if (self.cameraFocus[hdeck.name]) {
                    self.cameraFocus[hdeck.name](focus);
                } else {
                    self.cameraFocus[hdeck.name] = ko.observable(focus);
                }

                if (hdeck.isPrimary) {
                    hdeck.focus();
                }
            };

        var $holodeck = $('holodeck');
        self.pips = [];
        $holodeck.each(function () {
            var $this = $(this);
            var holodeck = new api.Holodeck($this, {}, holodeckReady);

            if ($this.is('.primary')) {
                holodeck.isPrimary = true;
                holodeck.name = 'primary';
                self.holodeck = holodeck;
            } else if ($this.is('.pip')) {
                holodeck.name = 'pip_' + self.pips.length;
                self.pips.push(holodeck);
            } else if ($this.is('.preview')) {
                holodeck.name = 'preview';
                self.preview = holodeck;
            }
        });

        self.showPips = ko.observable(false);
        var firstPipShow = true;
        self.showPips.subscribe(function () {
            var show = self.showPips();
            _.forEach(self.pips, function (pip) { pip.update(); });
            if (firstPipShow && show) {
                // Without this extra delay, the camera copy will go through before the initial holodeck state.
                _.delay(function () { _.forEach(self.pips, function (pip) { pip.copyCamera(self.holodeck); }); }, 30);
                firstPipShow = false;
            }
            _.delay(function() {
                api.Holodeck.update();
                _.delay(api.Panel.update);
            });
        });
        self.togglePips = function () {
            self.showPips(!self.showPips());
        };
        self.swapPips = function () {
            if (firstPipShow)
                return;
            if (api.Holodeck.focused === self.holodeck) {
                for (var h = 0; h < self.pips.length; ++h) {
                    var swap = (h + 1) < self.pips.length ? self.pips[h + 1] : self.holodeck;
                    self.pips[h].swapCamera(swap);
                }
            }
            else {
                self.holodeck.swapCamera(api.Holodeck.focused);
            }
        };
        self.copyToPip = function () {
            if (!self.pips.length)
                return;
            self.pips[0].copyCamera(self.holodeck);
            if (!self.showPips())
                self.togglePips();
        };

        self.showPipControls = ko.observable(false);
        self.showPipControls.subscribe(function() {
            api.Panel.update();
            _.delay(api.Panel.update);
        });

        self.pipAlertMode = ko.observable(false);
        self.togglePipAlertMode = function() { self.pipAlertMode(!self.pipAlertMode()); };

        self.pipMirrorMode = ko.observable(false);
        self.pipMirrorMode.subscribe(function() {
            var mirror = self.pipMirrorMode();
            if (mirror) {
                self.pipAlertMode(false);
                self.pips[0].mirrorCamera(self.holodeck);
            }
            else {
                self.pips[0].mirrorCamera(self.pips[0]);
                self.holodeck.mirrorCamera(self.holodeck);
            }
        });
        self.togglePipMirrorMode = function() { self.pipMirrorMode(!self.pipMirrorMode()); };
        self.pipAlertMode.subscribe(function() {
            var alert = self.pipAlertMode();
            if (alert)
                self.pipMirrorMode(false);
        });

        self.pipState = ko.computed(function() {
            return {
                alert: self.pipAlertMode(),
                mirror: self.pipMirrorMode()
            };
        });
        self.pipState.subscribe(function() {
            var state = self.pipState();
            api.panels.pip_br_tl && api.panels.pip_br_tl.message('state', state);
            api.panels.pip_br_tr && api.panels.pip_br_tr.message('state', state);
        });

        self.unitAlertState = ko.computed(function() {
            return {
                spectator: self.isSpectator(),
                autoPip: self.pipAlertMode(),
                viewReplay: self.viewReplay()
            };
        });
        self.unitAlertState.subscribe(function() {
            api.panels.unit_alert && api.panels.unit_alert.message('state', self.unitAlertState());
        });

        self.showUberBar = ko.observable(false).extend({ session: 'show_uber_bar' });
        function updateUberBarVisibility() {
            api.Panel.message('uberbar', 'visible', { 'value': self.showUberBar() });
        }
        self.showUberBar.subscribe(updateUberBarVisibility);
        self.toggleUberBar = function() {
            self.showUberBar(!self.showUberBar());
        };
        updateUberBarVisibility();

        self.optionsBarState = ko.computed(function() {
            return {
                custom_formations: self.allowCustomFormations(),
                uber_bar: self.showUberBar(),
                pip: self.showPips(),
                saving: self.saving()
            };
        });
        self.optionsBarStateMutation = ko.observable(0);
        self.optionsBarState.subscribe(function() {
            self.optionsBarStateMutation(self.optionsBarStateMutation() + 1);
            var mutation = self.optionsBarStateMutation();
            _.delay(function() {
                if (mutation === self.optionsBarStateMutation())
                    api.panels.options_bar && api.panels.options_bar.message('state', self.optionsBarState());
            });
        });


        var getSelectOption = function(event) {
            if (event.shiftKey)
            {
                if (event.ctrlKey)
                    return 'remove';
                else
                    return 'add';
            }
            else if (event.ctrlKey)
                return 'toggle';
            else
                return '';
        };

        self.playSelectionSound = function (wasSelected, prevSelection, isSelected, curSelection) {
            if (!isSelected) {
                if (wasSelected)
                    api.audio.playSound("/SE/UI/UI_Unit_UnSelect");
                return;
            }

            var playSelect = !wasSelected;
            var playUnselect = false;
            if (!playSelect) {
                for (var id in curSelection.spec_ids) {
                    var prev = prevSelection.spec_ids[id];
                    if (!prev) {
                        playSelect = true;
                        break;
                    }
                    var cur = curSelection.spec_ids[id];
                    var selected = _.difference(cur, prev);
                    if (selected.length) {
                        playSelect = true;
                        break;
                    }
                    if (!playUnselect) {
                        var removed = _.difference(prev, cur);
                        if (removed.length) {
                            playUnselect = true;
                        }
                    }
                }
                if (!playSelect && !playUnselect) {
                    for (var id in prevSelection.spec_ids) {
                        if (!curSelection.spec_ids[id]) {
                            playUnselect = true;
                            break;
                        }
                    }
                }
            }
            if (playSelect)
                api.audio.playSound("/SE/UI/UI_Unit_Select");
            else if (playUnselect)
                api.audio.playSound("/SE/UI/UI_Unit_UnSelect");
        };

        var scaleMouseEvent = function (mdevent) {
            if (mdevent.uiScaled)
                return;

            mdevent.uiScaled = true;

            var scale = api.settings.getSynchronous('ui', 'ui_scale') || 1.0;

            mdevent.offsetX = Math.floor(mdevent.offsetX * scale);
            mdevent.offsetY = Math.floor(mdevent.offsetY * scale);
            mdevent.clientX = Math.floor(mdevent.clientX * scale);
            mdevent.clientY = Math.floor(mdevent.clientY * scale);
        };

        var holodeckModeMouseDown = {};

        holodeckModeMouseDown.fab = function (holodeck, mdevent) {
            scaleMouseEvent(mdevent);

            var queue = false,
                enterQueueMode = function(shiftHeld) {
                    if (queue || !shiftHeld)
                        return;

                    queue = true;
                    if (model.fabCount() === 1) {
                        var shiftWatch = function (keyEvent) {
                            if (!keyEvent.shiftKey) {
                                $('body').off('keyup', shiftWatch);
                                if (self.mode() === 'fab')
                                    self.endFabMode();
                                else if (self.mode() === 'fab_rotate')
                                    self.mode('fab_end');
                            }
                        };
                        $('body').on('keyup', shiftWatch);
                    }
                };

            if (mdevent.button === 0) {
                model.fabCount(model.fabCount() + 1);
                var beginFabX = mdevent.offsetX;
                var beginFabY = mdevent.offsetY;
                var beginSnap = !mdevent.ctrlKey;
                holodeck.unitBeginFab(beginFabX, beginFabY, beginSnap);
                self.mode('fab_rotate');
                input.capture(holodeck.div, function (event) {
                    scaleMouseEvent(event);
                    if ((event.type === 'mouseup') && (event.button === 0)) {
                        var snap = !event.ctrlKey;

                        enterQueueMode(event.shiftKey); // capture an updated queue request to line up with what the client view shows the player

                        holodeck.unitEndFab(event.offsetX, event.offsetY, queue, snap).then(function (success) {
                            holodeck.showCommandConfirmation("", event.offsetX, event.offsetY);
                            if (success)
                                api.audio.playSound("/SE/UI/UI_Building_place");
                        });
                        queue &= (self.mode() !== 'fab_end');
                        self.mode('fab');
                        input.release();
                        if (!queue)
                            self.endFabMode();
                    }
                    else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                        input.release();
                        holodeck.unitCancelFab();
                        self.endFabMode();
                    }
                });
                return true;
            }
            else if (mdevent.button === 2) {
                self.endFabMode();
                return true;
            }
            return false;
        };

        var holodeckOnSelect = function (wasSelected, prevSelection, promise) {
            return promise.then(function (selection) {
                if (selection) {
                    var jSelection = JSON.parse(selection);
                    self.parseSelection(jSelection);
                    self.playSelectionSound(wasSelected, prevSelection, self.hasSelection(), self.selection());
                    return jSelection;
                }
                else
                    return null;
            });
        };

        holodeckModeMouseDown['default'] = function (holodeck, mdevent) {
            scaleMouseEvent(mdevent);

            if (mdevent.button === 0) {
                if (model.celestialControlActive()) {
                    if (model.celestialControlModel.findingTargetPlanet()) {
                        model.celestialControlModel.mousedown(mdevent);

                        input.capture($('body'), function (event) {
                            scaleMouseEvent(event);
                            if (event.type === 'mouseup' && event.button === 0) {
                                model.celestialControlModel.mouseup(event);
                                input.release();
                            }
                        });
                    }
                    return true;
                }

                var startx = mdevent.offsetX;
                var starty = mdevent.offsetY;
                var dragging = false;
                var now = new Date().getTime();
                if (holodeck.hasOwnProperty('doubleClickId') && (now < holodeck.doubleClickTime)) {
                    holodeckOnSelect(self.hasSelection(), self.selection(),
                        holodeck.selectMatchingUnits(getSelectOption(mdevent), [holodeck.doubleClickId])
                    );
                    delete holodeck.doubleClickTime;
                    delete holodeck.doubleClickId;
                }
                else {
                    self.mode('select');

                    var wasSelected = model.hasSelection();
                    var prevSelection = model.selection();

                    holodeck.doubleClickTime = now + 250;
                    delete holodeck.doubleClickId;
                    input.capture(holodeck.div, function (event) {
                        scaleMouseEvent(event);
                        if (!dragging && (event.type === 'mousemove')) {
                            dragging = true;
                            holodeck.beginDragSelect(startx, starty);
                            delete holodeck.doubleClickTime;
                        }
                        else if ((event.type === 'mouseup') && (event.button === 0)) {

                            input.release();
                            var option = getSelectOption(event);
                            if (dragging)
                                holodeckOnSelect(wasSelected, prevSelection,
                                    holodeck.endDragSelect(option, { left: startx, top: starty, right: event.offsetX, bottom: event.offsetY })
                                );
                            else {
                                if (self.hasWorldHoverTarget())
                                    holodeck.doubleClickId = self.worldHoverTarget();
                                var index = (holodeck.clickOffset || 0);
                                holodeckOnSelect(wasSelected, prevSelection,
                                    holodeck.selectAt(option, startx, starty, index)
                                ).then(function (selection) {
                                    if (selection && selection.selectionResult) {
                                        holodeck.doubleClickId = selection.selectionResult[0];
                                        ++holodeck.clickOffset;
                                        if (!selection.selectionResult.length)
                                            api.camera.maybeSetFocusPlanet();

                                    }
                                });
                            }
                            self.mode('default');
                            holodeck.showCommandConfirmation("", event.offsetX, event.offsetY);
                        }
                        else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                            input.release();
                            holodeck.endDragSelect('cancel');
                            self.mode('default');
                        }
                    });
                }

                return true;
            }
            else if ((mdevent.button === 2) && (!self.showTimeControls())) {
                if (model.celestialControlActive())
                    return false;

                var startx = mdevent.offsetX;
                var starty = mdevent.offsetY;
                var dragCommand = "";
                // TODO: Consider changing this once we have event timestamps.
                // WLott is concerned that framerate dips will cause this to be wonky.
                var now = new Date().getTime();
                var dragTime = now + 75;
                var queue = mdevent.shiftKey;

                input.capture(holodeck.div, function (event) {
                    scaleMouseEvent(event);
                    var eventTime = new Date().getTime();
                    if (self.showTimeControls())
                        self.endCommandMode();

                    if (dragCommand === "" && event.type === 'mousemove' && eventTime >= dragTime)
                    {
                        holodeck.unitBeginGo(startx, starty, model.allowCustomFormations()).then( function(ok) {
                            dragCommand = ok;
                            if (dragCommand)
                                self.mode("command_" + dragCommand);
                        } );
                    }
                    else if ((event.type === 'mouseup') && (event.button === 2)) {
                        input.release();
                        if (dragCommand === 'move') {
                            holodeck.unitChangeCommandState(dragCommand, event.offsetX, event.offsetY, queue).then(function (success) {
                                if (!success)
                                    return;

                                input.capture(holodeck.div, function (event) {
                                    scaleMouseEvent(event);
                                    if ((event.type === 'mousedown') && (event.button === 2)) {
                                        input.release();
                                        holodeck.unitEndCommand(dragCommand, event.offsetX, event.offsetY, queue).then(function (success) {
                                            holodeck.showCommandConfirmation(success ? dragCommand : "", event.offsetX, event.offsetY);
                                        });
                                        self.mode('default');
                                    }
                                    else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                                        input.release();
                                        holodeck.unitCancelCommand();
                                        self.mode('default');
                                    }
                                });
                                return;
                            });
                        }
                        else if (dragCommand !== "") {
                            holodeck.unitEndCommand(dragCommand, event.offsetX, event.offsetY, queue).then(function (success) {
                                holodeck.showCommandConfirmation(success ? dragCommand : "", event.offsetX, event.offsetY);
                                if (!success)
                                    return;
                                var action = dragCommand.charAt(0).toUpperCase() + dragCommand.slice(1);
                                api.audio.playSound("/SE/UI/UI_Command_" + action);
                            });
                        }
                        else {
                            holodeck.unitGo(startx, starty, queue).then(function (action) {
                                holodeck.showCommandConfirmation(action, event.offsetX, event.offsetY);
                                if (!action || (action === 'move')) {
                                    // Note: move currently plays its own sound.
                                    return;
                                }
                                var action = action.charAt(0).toUpperCase() + action.slice(1);
                                api.audio.playSound("/SE/UI/UI_Command_" + action);
                            });
                            self.mode('default');
                        }
                    }
                    else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                        input.release();
                        holodeck.unitCancelCommand();
                        self.mode('default');
                    }
                });

                return true;
            }
            return false;
        };

        var holodeckCommandMouseDown = function (command, targetable) {

            return function (holodeck, mdevent) {
                scaleMouseEvent(mdevent);

                var queue = false,
                    enterQueueMode = function(shiftHeld) {
                        if (queue || !shiftHeld)
                            return;
                        queue = true;
                        model.cmdQueueCount(model.cmdQueueCount() + 1);
                        if (model.cmdQueueCount() === 1) {
                            var shiftWatch = function (keyEvent) {
                                if (!keyEvent.shiftKey) {
                                    $('body').off('keyup', shiftWatch);
                                    self.endCommandMode();
                                }
                            };
                            $('body').on('keyup', shiftWatch);
                        }
                    };

                if (mdevent.button === 0 || mdevent.button === 2) {
                    api.camera.maybeSetFocusPlanet();
                    var startx = mdevent.offsetX;
                    var starty = mdevent.offsetY;
                    var dragging = false;
                    // TODO: Consider changing this once we have event timestamps.
                    // WLott is concerned that framerate dips will cause this to be wonky.
                    var now = new Date().getTime();
                    var dragTime = now + 125;

                    input.capture(holodeck.div, function (event) {
                        scaleMouseEvent(event);
                        var playSound = function (success) {
                            holodeck.showCommandConfirmation(success ? command : "", event.offsetX, event.offsetY);
                            if (!success || (command === 'move')) {
                                // Note: move currently plays its own sound.
                                return;
                            }
                            var action = command.charAt(0).toUpperCase() + command.slice(1);
                            api.audio.playSound("/SE/UI/UI_Command_" + action);
                        };

                        var eventTime = new Date().getTime();

                        if (!model.allowCustomFormations() && (command === 'move' || command === 'unload')) {
                            input.release();
                            enterQueueMode(event.shiftKey);
                            holodeck.unitCommand(command, mdevent.offsetX, mdevent.offsetY, queue).then(playSound);
                            if (!queue)
                                self.endCommandMode();
                        }
                        else if (!dragging && event.type === 'mousemove' && eventTime >= dragTime) {
                            holodeck.unitBeginCommand(command, startx, starty).then(function (ok) { dragging = ok; });
                        }
                        else if ((event.type === 'mouseup') && ((event.button === 0) || (event.button === 2))) {
                            input.release();
                            enterQueueMode(event.shiftKey);
                            if (dragging && (command === 'move' || command === 'unload')) {
                                holodeck.unitChangeCommandState(command, event.offsetX, event.offsetY, queue).then(function (success) {
                                    if (!success)
                                        return;
                                    // move and unload have extra input for their area command so recapture for it
                                    input.capture(holodeck.div, function (event) {
                                        scaleMouseEvent(event);
                                        if ((event.type === 'mousedown') && ((event.button === 0) || (event.button === 2))) {
                                            input.release();
                                            holodeck.unitEndCommand(command, event.offsetX, event.offsetY, queue).then(playSound);
                                            if (!queue)
                                                self.endCommandMode();
                                        }
                                        else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                                            input.release();
                                            holodeck.unitCancelCommand();
                                            self.mode('command_' + command);
                                        }
                                    });
                                });
                            }
                            else if (dragging) {
                                enterQueueMode(event.shiftKey);
                                holodeck.unitEndCommand(command, event.offsetX, event.offsetY, queue).then(function (success) {
                                    holodeck.showCommandConfirmation(success ? command : "", event.offsetX, event.offsetY);
                                    if (!success)
                                        return;
                                    var action = command.charAt(0).toUpperCase() + command.slice(1);
                                    api.audio.playSound("/SE/UI/UI_Command_" + action);
                                });
                                if (!queue)
                                    self.endCommandMode();
                            }
                            else {
                                enterQueueMode(event.shiftKey);
                                holodeck.unitCommand(command, mdevent.offsetX, mdevent.offsetY, queue).then(playSound);

                                if (!queue)
                                    self.endCommandMode();
                            }
                        }
                        else if ((event.type === 'keydown') && (event.keyCode === keyboard.esc)) {
                            input.release();
                            holodeck.unitCancelCommand();
                            self.mode('command_' + command);
                        }
                    });

                    return true;
                }
            };
        };
        for (var i = 0; i < self.commands().length; ++i) {
            var command = self.commands()[i];
            var targetable = self.targetableCommands()[i];
            holodeckModeMouseDown['command_' + command] = holodeckCommandMouseDown(command, targetable);
        }

        $holodeck.on('mousedown.stock', function (mdevent) {
            if (mdevent.target.nodeName !== 'HOLODECK')
                return;

            scaleMouseEvent(mdevent);

            var holodeck = api.Holodeck.get(this);

            var handler = holodeckModeMouseDown[self.mode()];
            if (handler && handler(holodeck, mdevent)) {
                mdevent.preventDefault();
                mdevent.stopPropagation();
                return;
            }

            if (mdevent.button === 1) // middle click
            {
                var oldMode = self.mode();
                self.mode('camera');
                holodeck.beginControlCamera();
                input.capture(holodeck.div, function (event) {
                    scaleMouseEvent(event);
                    var mouseDone = ((event.type === 'mouseup') && (mdevent.button === 1));
                    var escKey = ((event.type === 'keydown') && (event.keyCode === keyboard.esc));
                    if (mouseDone || escKey) {
                        input.release();
                        holodeck.endControlCamera();
                        if (self.mode() === 'camera')
                            self.mode(oldMode);
                    }
                });
                mdevent.preventDefault();
                mdevent.stopPropagation();
                return;
            }

            if (mdevent.button === 2 && self.mode() !== 'default') // right click
            {
                self.endCommandMode()
            }
        });

        //Diplomacy
        self.allowDynamicAlliances = ko.observable(false);
        self.allianceRequestsReceived = ko.observableArray();

        self.showEconSharing = ko.observable(false);
        self.showEconSharing.subscribe(function () {
            api.Panel.message('econ', 'showSharedResources', { 'value': self.showEconSharing() });
        });
        self.updateShowEconSharing = function () {
            var sharing = false;
            //check if our army is sharing eco
            _.forEach(self.player().diplomaticState, function (item) {
                if (item.state === 'allied_eco')
                    sharing = true;
            });
            //check if allies are sharing eco with us.
            _.forEach(self.player().allies, function (ally) {
                if (ally.diplomaticState[self.armyId()].state === 'allied_eco')
                    sharing = true;
            });
            self.showEconSharing(sharing);
        };

        self.newInvite = ko.observable(false);
        self.previousInviteNumber = ko.observable(0);
        self.allianceRequestsReceived.subscribe(function (requests) {
            if (requests.length > self.previousInviteNumber())
                self.newInvite(true);
            else
                self.newInvite(false);
            self.previousInviteNumber(requests.length);
        });

        self.processDiplomaticState = function (army) {
            var allies = [];
            if (self.players() && self.players().length && army) {
                _.forEach(_.keys(army.diplomaticState), function (key) {
                    var target_army = _.find(self.players(), function (player) {
                        return player.id === parseInt(key);
                    });
                    if (target_army) {
                        if (army.diplomaticState[key].state === 'allied' || army.diplomaticState[key].state === 'allied_eco')
                            allies.push(target_army);
                    }
                });
            }
            army.allies = allies;
            if (!self.isSpectator()) {
                army.stateToPlayer = army.diplomaticState && army.diplomaticState[self.armyId()] ? army.diplomaticState[self.armyId()].state : 'self';
                if (!(army.stateToPlayer === 'allied' || army.stateToPlayer === 'allied_eco')) {
                    if (army.diplomaticState && army.diplomaticState[self.armyId()] && army.diplomaticState[self.armyId()].allianceRequest) {
                        var request = _.find(self.allianceRequestsReceived(), function (request) { return request.id === army.id; });
                        if (!request)
                            self.allianceRequestsReceived.push({ id: army.id });
                    }
                }
                if (army.diplomaticState && army.diplomaticState[self.armyId()] && !army.diplomaticState[self.armyId()].allianceRequest) {
                    var request = _.find(self.allianceRequestsReceived(), function (request) { return request.id === army.id; });
                    if (request) {
                        var i = self.allianceRequestsReceived().indexOf(request);
                        self.allianceRequestsReceived.splice(i, 1);
                    }
                }
            }
        };

        self.playerListState = ko.computed(function() {
            return {
                spectator: self.isSpectator(),
                army: self.armyId(),
                players: self.sendablePlayers(),
                landing: self.showLanding(),
                vision: self.playerVisionFlags(),
                defeated: self.defeated(),
                contact: self.playerContactMap(),
                allianceReqs: self.allianceRequestsReceived(),
                gameOptions: ko.toJS(self.gameOptions),
                economyHandicaps: self.economyHandicaps()
            };
        });
        self.playerListStateMutation = 0;
        ko.computed(function() {
            var state = self.playerListState();
            self.playerListStateMutation = self.playerListStateMutation + 1;
            var mutation = self.playerListStateMutation;
            _.delay(function() {
                if (mutation === self.playerListStateMutation)
                    api.panels.players && api.panels.players.message('state', state);
            });
        });

        self.devModePanelUrl = ko.computed(function() {
            return self.showDevControls() ? 'coui://ui/main/game/live_game/live_game_devmode.html' : '';
        });
        self.devModePanelUrl.subscribe(function() {
            _.delay(api.Panel.bindPanels);
        });
        self.devModeState = ko.computed(function() {
            if (!self.showDevControls())
                return {};
            return {
                cheatVision: self.devMode() || self.cheatAllowChangeVision(),
                cheatControl: self.devMode() || self.cheatAllowChangeControl(),
                players: self.sendablePlayers(),
                vision: self.playerVisionFlags(),
                control: self.playerControlFlags()
            };
        });
        self.devModeState.subscribe(function(state) {
            api.panels.devmode && api.panels.devmode.message('state', state);
        });

        self.sandboxPanelUrl = ko.computed(function() {
            return self.sandbox() ? 'coui://ui/main/game/live_game/live_game_sandbox.html' : '';
        });
        self.sandboxPanelUrl.subscribe(function() {
            _.delay(api.Panel.bindPanels);
        });
        self.sandboxState = ko.computed(function() {
            if (!self.showDevControls())
                return {};
            return {
            };
        });
        self.sandboxState.subscribe(function(state) {
            api.panels.sandbox && api.panels.sandbox.message('state', state);
        });

        self.pauseSim = function () { self.send_message('control_sim', { paused: true  }); };
        self.playSim = function () { self.send_message('control_sim', { paused: false }); };
        self.togglePause = function () {
            if (self.paused())
                self.playSim();
            else
                self.pauseSim();
        };

        self.planetListState = ko.computed(function() {
            return {
                system: self.systemName(),
                landing: self.showLanding(),
                planets: ko.toJS(self.celestialViewModels()),
                selected: self.selectedCelestialIndex(),
                targeting: self.celestialControlModel.findingTargetPlanet(),
                control: !self.celestialControlModel.notActive()
            };
        });

        self.planetListState.subscribe(function() {
            api.panels.planets && api.panels.planets.message('state', self.planetListState());
            api.panels.unit_alert.message('planets', self.planetListState()); /* todo: alerts only care about planetListState().planets, change this? */
        });

        self.showCelestialControl = ko.computed(function() {
            return self.celestialControlModel.active() || self.celestialControlModel.requireConfirmation();
        });
        self.celestialControlState = ko.computed(function() {
            var control = self.celestialControlModel;
            return {
                active: control.active(),
                findingTargetPlanet: control.findingTargetPlanet(),
                actionIndex: control.actionIndex(),
                findingTargetSurfacePosition: control.findingTargetSurfacePosition()
            };
        });
        self.celestialControlState.subscribe(function() {
            api.panels.celestial_control && api.panels.celestial_control.message('state', self.celestialControlState());
        });

        // Controls layout mode for the panel.  Layout mode is highly recommended.
        // However, if it must be disabled, set this observable to false.
        self.layoutMode = ko.observable(true);
        ko.computed(function() {
            api.Panel.message(api.Panel.parentId, 'game.layout', self.layoutMode());
        });

        self.hideAllExceptGameOver = ko.observable(false);

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });

        var sessionTutorial = ko.observable().extend({ session: 'current_system_tutorial' });
        self.tutorial = ko.observable(sessionTutorial());

        self.hasTutorial = ko.computed(function () {
            return !!self.tutorial();
        });

        self.showTutorial = ko.computed(function () {
            return self.hasTutorial() && !self.showGameOver();
        });

        self.tutorialPanelSource = ko.computed(function () {
            return self.showTutorial()
                ? 'coui://ui/main/game/live_game/live_game_tutorial.html'
                : '';
        });

        /* expose our processed unit data to panels that want it */
        self.unitDataSubscribers = { }; /* a map from panel name to the version we've sent it */
        self.sendUnitData = function() {
            if (self.itemDetails) {
                var unitJs = ko.toJS(self.itemDetails),
                    unitJson = JSON.stringify(unitJs);

                _.forEach(self.unitDataSubscribers, function(oldVersion, panelName) {
                    if (oldVersion !== unitJson) {
                        api.Panel.message(panelName, 'augmented_unit_data', unitJs);
                        self.unitDataSubscribers[panelName] = unitJson;
                    }
                });
            }
        };

        self.subscribeToUnitData = function(panelName) {
            self.unitDataSubscribers[panelName] = true;
            self.sendUnitData();
        };

        /* expose our player info to panels that want it */
        self.playerInfoSubscribers = { }; /* a map from panel name to the version we've sent it */
        self.sendPlayerInfo = function() {
            var playerDataJs = ko.toJS({
                    armyId: self.armyId(),
                    playerData: self.playerData()
                }),
                playerDataJson = JSON.stringify(playerDataJs);

            _.forEach(self.playerInfoSubscribers, function(oldVersion, panelName) {
                if (oldVersion !== playerDataJson) {
                    api.Panel.message(panelName, 'player_info.update', playerDataJs);
                    self.playerInfoSubscribers[panelName] = playerDataJson;
                }
            });
        }
        self.armyId.subscribe(self.sendPlayerInfo);
        self.playerData.subscribe(self.sendPlayerInfo);

        // nuke hack
        // the projectiles are not magically added to the unit_list, so the display details aren't sent to the ui
        self.ammoBuildHover = {
            '/pa/units/land/nuke_launcher/nuke_launcher_ammo.json': {
                name: '!LOC:LR-96 -Pacifier- Missile',
                description: '!LOC:Nuclear missile - Long range, large area damage, projectile.',
                cost: api.content.usingTitans() ? 30000 : 50000,
                sicon_override: 'nuke_launcher_ammo',
                damage: 33000
            },
            '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json': {
                name: '!LOC:SR-24 -Shield- Missile Defense',
                description: '!LOC:Anti-nuke - Intercepts incoming nuclear missiles.',
                cost: api.content.usingTitans() ? 5000 : 6750,
                sicon_override: 'anti_nuke_launcher_ammo',
                damage: 1
            },
        };
    }
    model = new LiveGameViewModel();

    handlers.client_state = function (client) {
        switch (model.mode()) {
            case 'landing':
                if (client.landing_position || model.isSpectator()) {
                    model.landingOk();
                    model.setMessage({
                        message: loc('!LOC:Waiting for other players to select a spawn location.')
                    });
                }
                else
                    model.setMessage({
                        message: loc("!LOC:Pick a location inside one of the green zones to spawn your Commander."),
                        helper: true
                    });
                break;
            default: /* do nothing */ break;
        }
    };

    handlers.server_state = function (msg) {

        switch (msg.state) {
            case 'game_over': {

                model.showGameComplete();
                model.gameOver(true);
                api.game.showUI();

                break;
            }
            default: {
                model.gameOver(false);
                if (msg.url && msg.url !== window.location.href) {
                    window.location.href = msg.url;
                    return;
                }
                break;
            }
        }

        if (msg.data) {
            model.reviewMode(false);
            model.forceResumeAfterReview(false);

            var oldServerMode = model.serverMode();
            model.serverMode(msg.state);
            if (!_.isUndefined(oldServerMode) && oldServerMode !== model.serverMode() && model.serverMode() === 'game_over') {
                model.recordGameOver(true);
            }

            model.mode(msg.state);

            model.setMessage('');

            if (msg.data.client && msg.data.client.hasOwnProperty('army_id'))
                model.armyId(msg.data.client.army_id);
            else
                model.armyId(undefined);

            if (msg.data.client && msg.data.client.vision_bits)
                handlers.vision_bits(msg.data.client.vision_bits)

            if (msg.data.client && msg.data.client.game_options)
                model.gameOptions = new GameOptionModel(msg.data.client.game_options);

            if (msg.data.client && msg.data.client.commander)
                engine.call("holodeck.setCommanderId", msg.data.client.commander.id);

            if (msg.data.armies) {
                if ((msg.state !== 'replay') && (msg.state !== 'load_replay')) {
                    engine.call('execute', 'army_id', JSON.stringify({
                        army_id: !!model.armyId() ? model.armyId() : -1,
                        army_list: _.map(msg.data.armies, function (army) { return army.id; })
                    }));
                }

                handlers.army_state(msg.data.armies);
            }

            if (msg.data.ranked)
                model.ranked(msg.data.ranked);
            else
                model.ranked(false);

            if (msg.data.client)
                handlers.client_state(msg.data.client);

            // Make sure we start with fab mode and area command mode turned off to match our state.
            api.arch.endFabMode();
            model.currentBuildStructureId('');
            api.arch.endAreaCommandMode();

            switch (msg.state) {
                case 'landing':
                    model.showTimeControls(false);
                    model.showLanding(true);
                    model.mode('landing');
                    if (msg.data.client && msg.data.client.zones) {
                        var zones = msg.data.client.zones;
                        if (model.gameOptions.land_anywhere()) {
                            var planetZones = _.uniq(zones, 'planet_index');
                            zones = _.map(planetZones, function(zone) {
                                return _.extend({}, zone, {radius: -1});
                            });
                        }
                        engine.call('execute', 'landing_zones', JSON.stringify({ landing_zones: zones }));
                    }

                    if (!msg.data.force_start) {
                        api.audio.playSoundAtLocation('/VO/Computer/gamestart', 0, 0, 0);
                    }

                    if (!model.reviewMode() && model.armyId() !== undefined)
                        model.controlSingleArmy();
                    break;

                case 'playing':
                    handlers.control_state(msg.data.control);
                    if (model.showLanding()) {
                        api.audio.playSound('/SE/UI/UI_commander_launch');

                        if (model.isSpectator())
                            audioModel.triggerSpectatorMusic();
                        else
                            audioModel.triggerLaunchMusic();
                        model.landingOk();
                    }
                    engine.call('execute', 'all_landings_selected', '{}');
                    model.showLanding(false);
                    model.mode('default');
                    model.forceResumeAfterReview(true);
                    if (!model.reviewMode() && model.armyId() !== undefined)
                        model.controlSingleArmy();
                    break;

                case 'game_over':
                    model.showLanding(false);
                    model.showTimeControls(false);
                    model.mode('game_over');
                    model.startObserverMode();
                    break;

                case 'replay':
                case 'load_replay':
                    model.showTimeControls(true);
                    model.mode('replay');
                    //model.startObserverMode();
                    api.time.set(0);
                    break;

                case 'sandbox_playing':
                    model.mode('default');
                    model.controlSingleArmy();
                    model.sandbox(true);
                    model.forceResumeAfterReview(true);
                    break;
            }
        }
    };

    /* indicates player has been brought back by rewinding time. */
    handlers.resurrection = function (payload) {
        model.reviewMode(false);
        model.armyId(payload.army_id);
    }

    handlers.zoom_level = function (payload) {
        var hdeck = api.holodecks[payload.holodeck_id];
        hdeck.showCelestial = payload.zoom_level === 'celestial';
    };

    handlers.selection = function (payload) {
        model.parseSelection(payload);
    };

    handlers.hover = function (payload) {
        model.hasWorldHoverTarget(!$.isEmptyObject(payload));
        model.worldHoverTarget(payload.entity);
    };

    handlers.unit_specs = function (payload) {
        delete payload.message_type;
        model.unitSpecs = _.assign(payload, model.ammoBuildHover);

        // Fix up cross-unit references
        function crossRef(units) {
            for (var id in units) {
                var unit = units[id];
                unit.id = id;
                if (unit.build) {
                    for (var b = 0; b < unit.build.length; ++b) {
                        var ref = units[unit.build[b]];
                        if (!ref) {
                            ref = { id: unit.build[b] };
                            units[ref.id] = ref;
                        }
                        unit.build[b] = ref;
                    }
                }
                if (unit.projectiles) {
                    for (var p = 0; p < unit.projectiles.length; ++p) {
                        var ref = units[unit.projectiles[p]];
                        if (!ref) {
                            ref = { id: unit.projectiles[p] };
                            units[ref.id] = ref;
                        }
                        unit.projectiles[p] = ref;
                    }
                }
            }
        }
        crossRef(model.unitSpecs);

        // attach to our build details too (unit_data which would become itemDetails, both of which are getting nuked like RIGHT NOW)
        function processAsUnitData(payload) {
            var siconFor = function(id) {
                return id.substring(id.search(start), id.search(end));
            }

            model.itemDetails = {};

            _.forEach(payload, function (element, id) {
                var sicon = (element.sicon_override)
                        ? element.sicon_override
                        : siconFor(id);

                element.sicon = sicon;
                model.itemDetails[id] = new UnitDetailModel(element);

                // If this id has a spec tag, add it as a generic version without a spec tag
                if (!id.endsWith('.json')) {
                    var strip = /.*\.json/.exec(id);
                    if (strip) {
                        var strippedSpecId = strip.pop();
                        if (!model.itemDetails[strippedSpecId])
                            model.itemDetails[strippedSpecId] = model.itemDetails[id];
                    }
                }
            });

            // tell any panels that want unit data about the units we just got
            model.sendUnitData();
        };
        processAsUnitData(payload);


        var misc_unit_count = 0;

        function getBaseFileName(unit) {
            return unit.id.substring(unit.id.search(start), unit.id.search(end));
        };
        function addBuildInfo(unit, id) {
            unit.buildIcon = Build.iconForUnit(unit);

            var strip = /.*\.json/.exec(id);
            if (strip)
                id = strip.pop();
            var target = model.buildHotkeyModel.SpecIdToGridMap()[id];
            if (!target) {
                target = ['misc', misc_unit_count];
                misc_unit_count++;
            }

            unit.buildGroup = target[0];
            unit.buildIndex = target[1];
        };
        for (var id in model.unitSpecs) {
            addBuildInfo(model.unitSpecs[id], id);
        }

        _.forIn(model.unitSpecs, function(unit, id) {
            if (!unit.build && !unit.projectiles)
                return;

            _.forEach(['build', 'projectiles'], function (element) {
                unit.canBuild |= _.some(unit[element] || [], function(target) { return target.buildGroup !== 'misc'; });
            });
        });
    };

    handlers.request_augmented_unit_data = function (payload) {
        model.subscribeToUnitData(payload.panel_name);
    }

    handlers.army = function (payload) {
        model.currentEnergy(payload.energy.current);
        model.maxEnergy(payload.energy.storage);

        model.currentMetal(payload.metal.current);
        model.maxMetal(payload.metal.storage);

        model.commanderHealth(payload.commander_health);
        model.armySize(payload.army_size);

        model.combatUnitsInCombat(payload.units_in_combat);
        model.metalLost(payload.metal_lost);
        model.enemyMetalDestroyed(payload.metal_destroyed);
    };

    handlers.celestial_data = function (payload) {
        model.systemName(payload.name);

        if (payload.planets.length)
            model.startingPlanetBiome(payload.planets[0].biome);

        if (payload.planets && payload.planets.length) {
            var previous = _.clone(model.celestialViewModels());
            model.celestialViewModels.removeAll();

            _.forEach(payload.planets, function (element, index) {
                model.celestialViewModels.push(new CelestialViewModel(element, previous[index]));
            });

            model.celestialViewModels.push(new CelestialViewModel({ isSun: true, index: payload.planets.length }));
        }

        if (model.celestialControlModel.needsReset())
            model.celestialControlModel.reset();

        model.maybePlayStartingMusic(); // starting music depends on planet data
    }

    handlers.celestial_hover = function (payload) {
        var has_hover = false;
        var hover_index = -1;

        if (payload.planets && payload.planets.length) {

            payload.planets.forEach(function (element, index, array) {
                var target = model.celestialViewModels()[index];
                if (target) {
                    target.isHover(!!element.hover);

                    if (target.isHover())
                        hover_index = target.index();
                }
            });
        }

        if (payload.is_sun_hover)
            hover_index = payload.planets.length;

        if (hover_index !== -1)
            model.celestialViewModels()[hover_index].isHover(true);
        model.celestialControlModel.hoverTargetPlanetIndex(hover_index);
    }

    handlers.sim_terminated = function (payload) {
        if (model.isLocalGame())
            model.transitPrimaryMessage(loc('!LOC:WORLD SIMULATION WENT AWAY'));
        else
            model.transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));

        model.transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
        model.transitDestination('coui://ui/main/game/start/start.html');
        model.transitDelay(5000);
        model.navToTransit();
    }
    handlers.connection_disconnected = function (payload) {

        if (model.userTriggeredDisconnect())
            return;

        if (model.isLocalGame())
            model.transitPrimaryMessage(loc('!LOC:WORLD SIMULATION WENT AWAY'));
        else
            model.transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));

        model.transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
        model.transitDestination('coui://ui/main/game/start/start.html');
        model.transitDelay(5000);
        model.navToTransit();
    }

    handlers.time = function (payload) {

        if (payload.view !== 0)
            return;

        endOfTime(Math.floor(payload.end_time));

        // ###chargrove $REPLAYS temporary workaround for race condition related to lack of armies on client in replays;
        //   the client workaround involves setting its observable army set based on the entities coming from the history,
        //   however that won't help if the JS tries to startObserverMode before the history has made it over to the client.
        //   Using the time handler is a sub-optimal workaround but it's fine for now; remove this once the observable army set
        //   issue is fixed under the hood (see associated $REPLAYS comments)
        if (model.mode() === 'replay' && payload.current_time > 0 && model.replayStartObserverModeCalled !== true) {
            model.startObserverMode();
            model.replayStartObserverModeCalled = true; // we should only need to do this once
        }
    }

    handlers.army_state = function (armies) {
        var i;
        var army;
        var observer = model.armyId() === undefined;
        var replayArmyCount = 0;
        var landing = false;

        for (i = 0; i < armies.length; i++) {
            army = armies[i];

            army.color = 'rgb(' + Math.floor(army.primary_color[0]) + ',' + Math.floor(army.primary_color[1]) + ',' + Math.floor(army.primary_color[2]) + ')';
            army.defeated = !!army.defeated;
            army.disconnected = !!army.disconnected;
            army.landing = !!army.landing;
            army.replay = !!army.replay; // ###chargrove temporary part of the army schema until server state properly reflects observers/replays (re: conversation w/ kfrancis)
            army.metalProductionStr = '';
            army.energyProductionStr = '';
            army.armySize = 0;
            army.armyMetal = 0;
            army.mobileCount = 0;
            army.fabberCount = 0;
            army.factoryCount = 0;
            army.buildEfficiencyStr = 0;
            army.allies = [];
            army.stateToPlayer = '';
            army.commanders = army.commanders || [];

            if (army.landing)
                landing = true;

            if (army.replay) {
                replayArmyCount++;
            }

            if (army.defeated && army.id === model.armyId())
                observer = true;
        }

        model.armyCount(armies.length);
        model.players(armies);

        _.forEach(model.players(), model.processDiplomaticState);
        model.players.notifySubscribers();
        model.updateShowEconSharing();

        if ((model.armyCount() - replayArmyCount) <= 0) {
            observer = true;
        }

        if (observer)
            model.startObserverMode();
        else
            model.reviewMode(false);
    }
    handlers.control_state = function (payload) {

        if (!payload.restart && model.restart()) {
            engine.call('watchlist.reset');
            model.setupWatchList();
        }

        model.paused(payload.paused);
        model.restart(payload.restart);
        model.viewReplay(payload.view_replay);
        model.malformed(payload.malformed);
        model.saving(payload.saving);

        model.minValidTime(payload.valid_time_range.min);
        model.maxValidTime(payload.valid_time_range.max);
    }
    handlers.signal_has_valid_launch_site = function (payload) {
        model.setMessage({
            message: loc('!LOC:Position targeted. Click to confirm.'),
            button: loc('!LOC:START ANNIHILATION')
        }).then(model.spawnCommander);
    }
    handlers.signal_has_valid_target = function (payload) { /* for planet smash */
        model.celestialControlModel.hasSurfaceTarget(true);
    }
    handlers.victory = function (payload) {
        audioModel.triggerVictoryMusic();
    }

    handlers.building_planets_ready = function () {
        model.updateGameLoading();
    };

    handlers['game_over.nav'] = function(payload) {
        engine.call('pop_mouse_constraint_flag');
        engine.call("game.allowKeyboard", true);

        if (payload.disconnect) {
            var navAway = function() {
                model.userTriggeredDisconnect(true);
                model.disconnect();

                window.location.href = payload.url;
            };

            if (model.haveUberNet())
                api.net.removePlayerFromGame().always(navAway);
            else
                navAway();
        }
        else
            window.location.href = payload.url;
    };

    handlers['game_paused.resume'] = model.playSim;

    handlers.vision_bits = function (payload) {
        model.availableVisionFlags(payload);
        model.playerVisionFlags(model.availableVisionFlags());
        if (model.showAllAvailableVisionFlags())
            model.visionSelectAll(true);
    };

    handlers['time_bar.close'] = function() {
        model.showTimeControls(false);
    };

    handlers['time_bar.play_from_here'] = function (time) {
        var control_sim = !model.paused() && !model.gameOver();
        if (control_sim)
            model.pauseSim();

        model.popUp({ message: '!LOC:Resume from here?' }).then(function (result) {
            if (result === 0) {
                model.showTimeControls(false);
                model.send_message('trim_history_and_restart', { time: time });
            }
            else if (control_sim)
                model.playSim();
        });
    };

    handlers['preview.show'] = function (request /* target placement */) {
        model.showAlertPreview(request);
    };

    handlers['preview.hide'] = function() {
        model.hideAlertPreview();
    };

    handlers['preview.panel_will_clip'] = function(request) {
        model.clippingPanels[request.panel_name] = true;
    };

    handlers['player_info.request'] = function(request) {
        model.playerInfoSubscribers[request.panelName] = true;
        model.sendPlayerInfo()
    }

    handlers['unit_alert.player_contact'] = function(contact) {
        var contact = JSON.parse(contact);
        if (!_.isObject(model.playerContactMap()))
            model.playerContactMap({});
        model.playerContactMap()[contact.army] = contact;
        model.playerContactMap.notifySubscribers();
    };

    handlers['build_bar.build'] = function(params) {
        model.executeStartBuild(params);
    };

    handlers['build_bar.select_group'] = function(group) {
        model.startBuild(group, true);
    };

    handlers['build_bar.set_hover'] = function (id) {
        model.setBuildHover(id);
    };

    handlers['action_bar.set_command_index'] = model.setCommandIndex;

    handlers['chat.selected'] = model.chatSelected;

    handlers['menu.action'] = model.menuAction;

    handlers['planets.click'] = function(index) {
        model.celestialViewModels()[index].handleClick();
    };

    handlers['planets.target'] = function(index) {
        model.celestialControlModel.targetPlanetIndex(index);
    };

    handlers['planets.smash'] = function(index) {
        model.celestialControlModel.smashPlanet(index);
    };


    handlers['planets.cancelMove'] = function(index) {
        model.celestialControlModel.cancelMove(index);
    };

    handlers['planets.fireweapon'] = function(index) {
        model.celestialControlModel.firePlanetWeapon(index);
    };

    handlers['planets.cancelFire'] = function(index) {
        model.celestialControlModel.cancelFire(index);
    };

    handlers['celestialControl.cancel'] = function() {
        model.celestialControlModel.cancelControl();
    };

    handlers['message.clickButton'] = function() {
        model.messageDeferred().resolve();
        _.delay(api.Panel.update);
    };

    handlers['settings.exit'] = function() {
        model.showSettings(false);
    };

    handlers['guide.hide'] = function () {
        model.showPlayerGuide(false);
    };

    handlers['guide.show'] = function () {
        model.showPlayerGuide(true);
    };

    handlers['query.tutorial'] = function()
    {
        return model.tutorial();
    };

    handlers['query.action_keybinds'] = function() { return model.actionKeybinds(); }
    handlers['query.action_state'] = function() { return model.actionBarState(); }

    handlers['query.options_state'] = function() { return model.optionsBarState(); }

    handlers['panel.invoke'] = function(params) {
        var fn = params[0];
        var args = params.slice(1);
        return model[fn] && model[fn].apply(model, args);
    };

    handlers.mount_mod_file_data = function (payload) {
        api.mods.mountModFileData();
    };

    handlers.server_mod_info_updated = function (payload) {
        api.game.debug.reloadScene(api.Panel.pageId);
    };

    handlers.event_message = function (payload) {
        switch (payload.type) {
            case 'countdown':
                var count = payload.message;
                if (count > 1)
                    api.audio.playSound('/SE/UI/UI_lobby_count_down');
                else
                    api.audio.playSound('/SE/UI/UI_lobby_count_down_last');
                model.setMessage(loc('!LOC:Game starts in') + ' : ' + count);
                break;
            case 'start':
                model.setMessage('');
                break;
            case 'commander_spawn':

                var target = {};
                target.planet_id = payload.planet_index;
                target.location = payload.location;
                target.zoom = "air"
                api.camera.lookAt(target, true);

                api.select.unitsById(payload.units, true).then(function () {
                    api.select.captureGroup(1);
                    api.camera.captureAnchor(1);
                });
                if (payload.units.length)
                    engine.call("holodeck.setCommanderId", payload.units[0]);

                break;
            case 'camera_focus':
                var target = {};
                target.planet_id = payload.planet_index;
                target.location = payload.location;
                target.zoom = "air"
                api.camera.lookAt(target);

            default:
                api.debug.log("unhandled event message");
                api.debug.log(payload);
                break;
        }
    }

    handlers.commander_ids = function (payload) {
        api.debug.log('cmdrs');
        api.debug.log(payload);
    };

    handlers.economy_handicaps = function (payload) {
        model.economyHandicaps(payload.payload);
    };

    // allow the camera api to handle focus_planet_changed, camera_movement, and camera_api for us
    api.camera.injectHandlers(handlers);

    // inject per scene mods
    if (scene_mod_list['live_game'])
        loadMods(scene_mod_list['live_game']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();

    app.hello(handlers.server_state, handlers.connection_disconnected);
});

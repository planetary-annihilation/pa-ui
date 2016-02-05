// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function UnitAlertModel() {
        var self = this;
        var timeout = 10000;

        self.unitData = ko.observable();
        self.hasUnitData = ko.computed(function() { return !!self.unitData(); });

        self.builtEachBasicFactoryCredit = ko.observable(false).extend({ local: 'built_each_basic_factory_credit' });
        self.builtEachBuildingCredit = ko.observable(false).extend({ local: 'built_each_building_credit' });
        self.builtEachUnitCredit = ko.observable(false).extend({ local: 'built_each_unit_credit' });
        self.lastBuildCreditAwardedTime = ko.observable(0).extend({ local: 'last_build_credit_awarded_time' });
        self.endOfTimeInSeconds = ko.observable(0);
        self.endOfTimeInSeconds.subscribe(function (value) {
            if (value < self.lastBuildCreditAwardedTime()) {
                self.builtEachBasicFactoryCredit(false);
                self.builtEachBuildingCredit(false);
                self.builtEachUnitCredit(false);
            }
        });

        self.scrubbing = ko.observable(false); /* set to true if the player is scrubbing in chronocam */
      
        self.armyNames = ko.observableArray([]);
        self.armyColors = ko.observableArray([]);
        self.armyCommanders = ko.observableArray([]);
        self.armyIds = ko.observableArray([]);

        self.showingPreview = ko.observable(false);

        self.processPlayerData = function (payload) {
            self.armyColors(payload.colors);
            self.armyNames(payload.names);
            self.armyIds(payload.ids);
            self.armyCommanders(payload.commanders);
        };

        self.armyIdToColorMap = ko.computed(function () {
            return _.zipObject(self.armyIds(), self.armyColors());
        });

        self.defeatedArmyAlerts = ko.observableArray([]);

        self.state = ko.observable({});
        self.isSpectator = ko.computed(function() { return !!self.state().spectator; });
        self.autoPip = ko.computed(function () { return !!self.state().autoPip; });
        self.viewReplay = ko.computed(function () { return !!self.state().viewReplay; });

        self.map = {}; /* unit alert map */
        self.signalRecalculate = ko.observable();
        self.dirty = false;
        self.focusId = ko.observable(-1);

        self.lastCustomId = ko.observable(0);

        self.builtSpecSet = ko.observable({});

        var buildEachBasicFactoryRule = ko.computed(function () {

            if (self.builtEachBasicFactoryCredit() || self.isSpectator())
                return;

            var set = self.builtSpecSet();
            var match = _.every([
                '/pa/units/air/air_factory/air_factory.json',
                '/pa/units/land/bot_factory/bot_factory.json',
                '/pa/units/land/vehicle_factory/vehicle_factory.json',
                '/pa/units/orbital/orbital_launcher/orbital_launcher.json',
                '/pa/units/sea/naval_factory/naval_factory.json',
            ], function (element) {
                return set[element];
            });

            if (!match)
                return;

            self.builtEachBasicFactoryCredit(true);
            self.lastBuildCreditAwardedTime(self.endOfTimeInSeconds());
            api.tally.incStatInt('game_build_all_basic_factories');
        });

        var buildEachBuildingRule = ko.computed(function () {

            if (self.builtEachBuildingCredit() || self.isSpectator())
                return;

            var set = self.builtSpecSet();
            var match = _.every([
                '/pa/units/air/air_factory/air_factory.json',
                '/pa/units/air/air_factory_adv/air_factory_adv.json',
                '/pa/units/land/air_defense/air_defense.json',
                '/pa/units/land/air_defense_adv/air_defense_adv.json',
                '/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json',
                '/pa/units/land/artillery_long/artillery_long.json',
                '/pa/units/land/artillery_short/artillery_short.json',
                '/pa/units/land/bot_factory/bot_factory.json',
                '/pa/units/land/bot_factory_adv/bot_factory_adv.json',
                '/pa/units/land/control_module/control_module.json',
                '/pa/units/land/energy_plant/energy_plant.json',
                '/pa/units/land/energy_plant_adv/energy_plant_adv.json',
                '/pa/units/land/energy_storage/energy_storage.json',
                '/pa/units/land/land_barrier/land_barrier.json',
                '/pa/units/land/laser_defense/laser_defense.json',
                '/pa/units/land/laser_defense_adv/laser_defense_adv.json',
                '/pa/units/land/laser_defense_single/laser_defense_single.json',
                '/pa/units/land/metal_extractor/metal_extractor.json',
                '/pa/units/land/metal_extractor_adv/metal_extractor_adv.json',
                '/pa/units/land/metal_storage/metal_storage.json',
                '/pa/units/land/nuke_launcher/nuke_launcher.json',
                '/pa/units/land/radar/radar.json',
                '/pa/units/land/radar_adv/radar_adv.json',
                '/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
                '/pa/units/land/teleporter/teleporter.json',
                '/pa/units/land/vehicle_factory/vehicle_factory.json',
                '/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json',
                '/pa/units/orbital/defense_satellite/defense_satellite.json',
                '/pa/units/orbital/ion_defense/ion_defense.json',
                '/pa/units/orbital/mining_platform/mining_platform.json',
                '/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json',
                '/pa/units/orbital/orbital_factory/orbital_factory.json',
                '/pa/units/orbital/orbital_launcher/orbital_launcher.json',
                '/pa/units/sea/naval_factory/naval_factory.json',
                '/pa/units/sea/naval_factory_adv/naval_factory_adv.json',
                '/pa/units/sea/torpedo_launcher/torpedo_launcher.json',
                '/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json',
                '/pa/units/orbital/delta_v_engine/delta_v_engine.json'
            ], function (element) {
                return set[element];
            });

            if (!match)
                return;

            self.builtEachBuildingCredit(true);
            self.lastBuildCreditAwardedTime(self.endOfTimeInSeconds());
            api.tally.incStatInt('game_build_all_buildings');
        });

        var buildEachUnitRule = ko.computed(function () {

            if (self.builtEachUnitCredit() || self.isSpectator())
                return;

            var set = self.builtSpecSet();
            var match = _.every([
                '/pa/units/air/air_scout/air_scout.json',
                '/pa/units/air/bomber/bomber.json',
                '/pa/units/air/bomber_adv/bomber_adv.json',
                '/pa/units/air/fabrication_aircraft/fabrication_aircraft.json',
                '/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json',
                '/pa/units/air/fighter/fighter.json',
                '/pa/units/air/gunship/gunship.json',
                '/pa/units/air/transport/transport.json',
                '/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json',
                '/pa/units/land/assault_bot/assault_bot.json',
                '/pa/units/land/assault_bot_adv/assault_bot_adv.json',
                '/pa/units/land/bot_bomb/bot_bomb.json',
                '/pa/units/land/bot_grenadier/bot_grenadier.json',
                '/pa/units/land/bot_sniper/bot_sniper.json',
                '/pa/units/land/bot_tactical_missile/bot_tactical_missile.json',
                '/pa/units/land/fabrication_bot/fabrication_bot.json',
                '/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json',
                '/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json',
                '/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json',
                '/pa/units/land/fabrication_vehicle/fabrication_vehicle.json',
                '/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json',
                '/pa/units/land/land_scout/land_scout.json',
                '/pa/units/land/tank_armor/tank_armor.json',
                '/pa/units/land/tank_heavy_armor/tank_heavy_armor.json',
                '/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json',
                '/pa/units/land/tank_laser_adv/tank_laser_adv.json',
                '/pa/units/land/tank_light_laser/tank_light_laser.json',
                '/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json',
                '/pa/units/orbital/orbital_fighter/orbital_fighter.json',
                '/pa/units/orbital/orbital_lander/orbital_lander.json',
                '/pa/units/orbital/orbital_laser/orbital_laser.json',
                '/pa/units/orbital/radar_satellite/radar_satellite.json',
                '/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json',
                '/pa/units/orbital/solar_array/solar_array.json',
                '/pa/units/sea/battleship/battleship.json',
                '/pa/units/sea/destroyer/destroyer.json',
                '/pa/units/sea/fabrication_ship/fabrication_ship.json',
                '/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json',
                '/pa/units/sea/frigate/frigate.json',
                '/pa/units/sea/missile_ship/missile_ship.json',
                '/pa/units/sea/sea_scout/sea_scout.json',
            ], function (element) {
                return set[element];
            });

            if (!match)
                return;

            self.builtEachUnitCredit(true);
            self.lastBuildCreditAwardedTime(self.endOfTimeInSeconds());
            api.tally.incStatInt('game_build_all_units');
        });

        self.clean = function () {
            var current_time = _.now();
            var dirty = false;
            var id;

            for (id in self.map) {
                var alert = self.map[id];

                if (!alert.special && current_time - alert.time > timeout) {
                    dirty = true;
                    delete self.map[id];
                }
            }

            if (dirty)
                self.signalRecalculate.notifySubscribers();

            self.hidePreview();
        }

        self.isMisc = function (watch_type) {
            if (self.isSpectator()) /* force all spectator alerts to render in white to avoid conflicts with army color. */
                return true;

            return (watch_type !== constants.watch_type.damage) &&
                    (watch_type !== constants.watch_type.ready) &&
                    (watch_type !== constants.watch_type.death);
        }

        self.alerts = ko.computed(function () {
            self.signalRecalculate(); /* force dependency */
            var sorted = _.sortBy(_.values(self.map), function (v) {
                return -v.time;
            });
            var result = _.reject(sorted, function (element) {
                return element.special;
            });
            return result;
        });

        self.specialWeaponAlerts = ko.observableArray([]);
        self.combatList = ko.observableArray([]); /* the combats we are currently displaying -- not necessarily all the candidate combats */

        self.showLabel = function (id, index) {
            if (id === self.focusId())
                return true;
            return self.focusId() === -1 && index === 0;
        }

        self.setFocus = function (id) {
            if (self.focusId() !== id)
                self.focusId(id);
        }

        self.clearFocus = function () {
            if (self.focusId() !== -1)
                self.focusId(-1);
        }

        self.close = function (id) {
            delete self.map[id];
            if (self.focusId() === id)
                self.focusId(-1);
            self.signalRecalculate.notifySubscribers();
            self.hidePreview();
        }

        self.acknowledge = function (id) {

            var alert = self.map[id];
            if (alert) {
                var target = {
                    location: alert.location,
                    planet_id: alert.planet_id
                };

                alert.cb && alert.cb.resolve(self);
                if (!alert.custom) {
                    api.camera.lookAt(target);
                }
            }

            self.close(id);
        }

        self.activeSpecialWeapon = function (data) {
            self.acknowledge(data.alert.id);
            self.specialWeaponAlerts(_.reject(self.specialWeaponAlerts(), function (element) {
                return data === element;
            }));
        };

        self.dismissSpecialWeapon = function (data) {
            self.close(data.alert.id);
            self.specialWeaponAlerts(_.reject(self.specialWeaponAlerts(), function (element) {
                return data === element;
            }));
        };

        self.processSpecialWeaponLost = function (data) {
            var matched = _.filter(self.specialWeaponAlerts(), function (element) {
                return (element.index === data.index)
                        && (element.lazer === data.lazer)
                        && (element.thrust === data.thrust);
            });

            _.forEach(matched, self.dismissSpecialWeapon);
        };

        self.recordPlayerContact = function(alert) {
            var contactInfo = {
                army: alert.army_id,
                location: alert.location,
                planet_id: alert.planet_id
            };
            api.Panel.message(api.Panel.parentId, 'unit_alert.player_contact', JSON.stringify(contactInfo));
        };

        self.fixAlertSpec = function(alert) {
            // The alert system doesn't support spec tags.
            if (_.has(alert, 'full_spec'))
                return;
            alert.full_spec = alert.spec_id;
            var strip = /.*\.json/.exec(alert.full_spec);
            if (strip)
                alert.spec_id = strip.pop();
        };

        self.alertStrings = (function () {
            var alertStrings = {};
            alertStrings[constants.watch_type.damage] = '!LOC:__unit_name__ under attack.';
            alertStrings[constants.watch_type.ready] = '!LOC:__unit_name__ ready.';
            alertStrings[constants.watch_type.allied_death] = '!LOC:Allied __unit_name__ lost.';
            alertStrings[constants.watch_type.death] = '!LOC:__unit_name__ lost.';
            alertStrings[constants.watch_type.sight] = '!LOC:__unit_name__ located.';
            alertStrings[constants.watch_type.projectile] = '!LOC:__unit_name__ launched!';
            alertStrings[constants.watch_type.target_destroyed] = '!LOC:__unit_name__ destroyed.';
            alertStrings[constants.watch_type.idle] = '!LOC:__unit_name__ idle.';
            alertStrings[constants.watch_type.arrival] ='!LOC:__unit_name__ arrived.';
            alertStrings[constants.watch_type.ping] = '!LOC:Ping!';
            alertStrings[constants.watch_type.first_contact] = '!LOC:Enemy Contact!';
            alertStrings[constants.watch_type.ammo_fraction_change] = '!LOC:__unit_name__ ready.'; /* we want to use the loc string for readiness when ammo is full */

            return alertStrings;
        })();


        self.getAlertText = function(alert) {
            if (alert.custom && alert.watch_type === constants.watch_type.ping)
                return alert.name;

            if (_.has(self.alertStrings, alert.watch_type))
                return loc(self.alertStrings[alert.watch_type], { unit_name: alert.name });
            return alert.name;
        };

        self.getAlertSummary = function(alert) {
            self.fixAlertSpec(alert);

            var result = $.Deferred();

            switch (alert.watch_type) {
                case constants.watch_type.damage: alert.color = 'red'; break;
                case constants.watch_type.ready: alert.color = 'green'; break;
                case constants.watch_type.death: alert.color = 'black'; break;
                default: alert.color = 'white'; break;
            }
            if (alert.watch_type === constants.watch_type.ping || alert.watch_type === constants.watch_type.first_contact) {
                alert.name = alert.name || '';
                alert.sicon = 'coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_ping.png';
                result.resolve(alert);
            }
            else {
                var finalizeAlert = function () {
                        var spec = self.unitData()[alert.full_spec] || self.unitData()[alert.spec_id];
                        if (spec) {
                            alert.name = spec.name;
                            alert.sicon = 'coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_' + spec.sicon + '.png';
                            result.resolve(alert);
                        } else {
                            result.reject('No such unit');
                        }
                    };

                if (self.hasUnitData()) {
                    finalizeAlert();
                } else {
                    /* wait until we actually have unit data and then show the alert */
                    var subscription = hasUnitData.subscribe(function() {
                        subscription.dispose();
                        finalizeAlert();
                    });
                }
            }

            return $.when(result).then(function() {
                alert.text = self.getAlertText(alert);
                alert.army_color = self.armyIdToColorMap()[alert.army_id];
                return alert;
            });
        };

        self.processSpecialWeapon = function (payload) {
            self.specialWeaponAlerts.push(payload);
        };

        self.suppressVisualAlert = function (alert) {
            return (alert.watch_type === constants.watch_type.death
                || alert.watch_type === constants.watch_type.damage
                || alert.watch_type === constants.watch_type.departure
                || alert.watch_type === constants.watch_type.linked
                || alert.watch_type === constants.watch_type.energy_requirement_met_change
                || alert.watch_type === constants.watch_type.ammo_fraction_change);
        }

        self.processAlert = function (alert, ready) {
            if (!self.map[alert.id])
                self.dirty = true;

            if (_.isUndefined(alert.id)) {
                alert.id = '.' + self.lastCustomId();
                self.lastCustomId(self.lastCustomId() + 1);
            }

            if (!self.suppressVisualAlert(alert)) {
                self.map[alert.id] = alert;
            }

            alert.time = _.now();
            alert.cb = alert.cb || $.Deferred();

            self.fixAlertSpec(alert);
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', alert.watch_type, alert]);

            var getDetails = self.getAlertSummary(alert);

            $.when(getDetails).then(function (alert) {
                if (alert.watch_type === constants.watch_type.ammo_fraction_change &&
                    eventSystem.isType(constants.unit_type.Important, alert.unit_types)) {
                    var ammoFraction = alert.ammo_count / alert.max_ammo_count;

                    if (ammoFraction >= 1.0) {
                        if (eventSystem.isType(constants.unit_type.SelfDestruct, alert.unit_types)) {
                            self.map[alert.id] = alert; // To negate visual alert suppression above.
                            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.ragnarok_loaded]);
                        } else if (eventSystem.isType(constants.unit_type.Nuke, alert.unit_types)) {
                            self.map[alert.id] = alert;
                            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.nuke_ready]);
                        } else if (/unit_cannon/.test(alert.spec_id)) {
                            self.map[alert.id] = alert;
                            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.unitcannon_full]);
                        } else if (eventSystem.isType(constants.unit_type.NukeDefense, alert.unit_types)) {
                            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.anti_nuke_ready]);
                        }
                    }
                }

                if (alert.watch_type === constants.watch_type.energy_requirement_met_change && eventSystem.isType(constants.unit_type.Teleporter, alert.unit_types)) {
                    if (alert.energy_requirement_met) {
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.unit_energy_startup]);
                    }
                    else
                    {
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.unit_energy_shutdown]);
                    }
                }

                if (alert.watch_type === constants.watch_type.damage) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types)) {
                        // Magnitude on damage even now means unit health instead of damage amount
                        // It wasn't being used for anything anyway

                        if (alert.is_allied) {
                            triggerModel.testEvent(constants.event_type.allied_commander_under_attack, alert.magnitude);
                            triggerModel.testEvent(constants.event_type.allied_commander_low_health, alert.magnitude);
                        }

                        if (alert.is_hostile) {
                            triggerModel.testEvent(constants.event_type.enemy_commander_low_health, alert.magnitude);
                            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.enemy_commander_under_attack]);
                        }
                    }
                }

                if (alert.watch_type === constants.watch_type.death) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types))
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.commander_destroyed]);
                }

                if (alert.watch_type === constants.watch_type.sight) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types)){
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.enemy_commander_sighted]);
                        self.recordPlayerContact(alert);
                    }
                }

                if (alert.watch_type === constants.watch_type.first_contact) {
                    api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.new_enemy_contact]);
                    self.recordPlayerContact(alert);
                }

                if (alert.watch_type === constants.watch_type.target_destroyed) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types)) {
                        self.map[alert.id] = alert;
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.enemy_commander_destroyed]);
                    }
                }

                if (alert.watch_type === constants.watch_type.allied_death) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types)) {
                        self.map[alert.id] = alert;
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.allied_commander_destroyed]);
                    }
                }

                if (alert.watch_type === constants.watch_type.linked) {
                    if (eventSystem.isType(constants.unit_type.Teleporter, alert.unit_types)) {
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.teleporter_linked]);
                    }
                }

                if (alert.watch_type === constants.watch_type.arrival) {
                    if (eventSystem.isType(constants.unit_type.Commander, alert.unit_types)) {
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.commander_arrival]);
                    }

                    // Only send transport notification if it isn't delivering a commander
                    if (eventSystem.isType(constants.unit_type.Transport, alert.unit_types) &&
                        alert.payload_types && !eventSystem.isType(constants.unit_type.Commander, alert.payload_types)) {
                        api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.transport_arrival]);
                    }
                }

                if (ready)
                    ready.resolve(alert);
            });

            if (self.autoPip())
                preview.jump(self.getAlertTarget(alert.id), 'pips[0]');

            return alert.cb.promise();
        }

        self.processList = function (array) {
            self.dirty = false;
            var readyAlert = function(alert) {
                var ready = $.Deferred();
                self.processAlert(alert, ready);
                return ready.promise();
            };
            var ready = _.map(array, readyAlert);
            $.when.apply($, ready).then(function() {
                /* trigger update only if there was a new alert */
                if (self.dirty)
                    self.signalRecalculate.notifySubscribers();

                setTimeout(self.clean, timeout + 1);
            });
        };

        self.processCustomAlert = function (payload) {
            self.dirty = false;

            if (payload.lost) {
                self.processSpecialWeaponLost(payload);
                return;
            }
            var ready = $.Deferred();
            var result = self.processAlert({
                watch_type: constants.watch_type.ping,
                name: payload.name || '',
                custom: true,
                special: payload.special_weapon
            }, ready);

            ready.promise().then(function (alert) {
                if (payload.special_weapon) {
                    payload.alert = alert;
                    self.processSpecialWeapon(payload);
                }
            });

            /* trigger update only if there was a new alert */
            if (self.dirty)
                self.signalRecalculate.notifySubscribers();

            setTimeout(self.clean, timeout + 1);
            return result;
        };

        self.acknowledgeCombat = function () {
            self.combat.acknowledgeNext();
        };

        self.acknowledgeAlert = function () {
            var alert = self.alerts()[0];
            if (alert)
                self.acknowledge(alert.id);
            else
                self.acknowledgeCombat();
        };

        self.getAlertTarget = function (id) {
            var alert = self.map[id];

            return alert && {
                location: alert.location,
                planet_id: alert.planet_id,
                zoom: 'air'
            };
        }

        self.showPreview = function (element, id, holodeck) {
            var target = self.getAlertTarget(id),
                placement = {
                    element: element,
                    holodeck: holodeck,
                    alignElement: [.5, 1],
                    alignDeck: [-.5, 0],
                    offset: [0, 8]
                };

            if (target) {
                self.showingPreview(true);
                preview.show(target, placement);
            }
        };

        self.hidePreview = function () {
            if (self.showingPreview()) {
                self.showingPreview(false);
                preview.hide()
            }
        };

        self.processArmyDefeated = function (payload) {

            /* don't display army defeated messages while viewing a replay. 
               they pop up at the very start, since the client is getting all the data. 
               no spoilers. */
            if (self.viewReplay())
                return;

            var defeated_commanders = self.armyCommanders()[payload.defeated.index];
            payload.defeated.commander = defeated_commanders[0];
            if (defeated_commanders.length > 1)
                payload.defeated.name = loc('!LOC:army') + ' ' + (payload.defeated.index + 1);

            if (payload.killer) {
                var killer_commanders = self.armyCommanders()[payload.killer.index];
                payload.killer.commander = killer_commanders[0];
                if (killer_commanders.length > 1)
                    payload.killer.name = loc('!LOC:army') + ' ' + (payload.killer.index + 1);
            }

            var alerts = self.defeatedArmyAlerts();
            if (!alerts)
                return;

            alerts.push(payload);
            self.defeatedArmyAlerts(alerts);
            _.delay(function () {
                var array = self.defeatedArmyAlerts();
                array.shift();
                self.defeatedArmyAlerts(array);
            }, 6 * 1000 /* ms */);
        };

        self.active = ko.observable(true);

        /* combat notifications live in a sub-model for convenient namespacing */
        self.combat = {
            nextExpirationTime: Infinity,
            hovered: false, /* we won't expire any combats while any combats are hovered */
            planetsById: { },
            planetCount: ko.observable(0),
            selectedPlanetId: ko.observable(0),
            combats: { }, /* by id */
            getCombat: function (id) {
                var combats = self.combat.combats,
                    combat = combats[id];

                if (!combat) {
                    combat = {
                        id: id,
                        firstSlot: ko.observable(), /* either a planet or the player's loss leader */
                        secondSlot: ko.observable(), /* either the player's loss leader or an enemy */
                        isDisplayed: false,
                        includesLocalPlayer: false,
                        planet: {
                            id: 0,
                            icon: ko.observable(),
                            filterCss: '',
                            slotContent: 'slot-planet'
                        },
                        groupedLosses: {
                            /*
                                indexed by army_idx
                                armyId: {
                                    losses: ko.observableArray( ), <-- an element from this is actually used as the lossLeader or enemyLossLeader
                                    lossesBySpecId: { }
                                }
                            */
                        },
                        alertState: ko.observable(), /* used to control flashing and coolness */

                        firstGroup: null,
                        secondGroup: null,

                        hovered: ko.observable(false),

                        recent: null
                    };

                    combats[id] = combat;
                }

                return combat;
            },
            assignSlots: function (combat) {
                var showPlanet = self.combat.selectedPlanetId() !== combat.planet.id;
                if (showPlanet) {
                    combat.firstSlot(combat.planet);
                    combat.secondSlot(combat.firstGroup && combat.firstGroup.lossLeader);
                } else {
                    combat.firstSlot(combat.firstGroup && combat.firstGroup.lossLeader);
                    combat.secondSlot(combat.secondGroup && combat.secondGroup.lossLeader);
                }
            },
            setPlanets: function (planets) {
                var livingPlanetCount = 0;
                _.forEach(planets, function(planet) {
                    self.combat.planetsById[planet.id] = planet;

                    if (!planet.isSun && !planet.dead)
                        livingPlanetCount++;

                    if (planet.isSelected)
                        self.combat.selectedPlanetId(planet.id);
                });
                self.combat.planetCount(livingPlanetCount);

                _.forEach(self.combatList(), function(combat) {
                    /* just in case we want to switch the planet icon away */
                    self.combat.assignSlots(combat);
                });
            },
            updateCombat: function(combat_payload) {
                var planet = self.combat.planetsById[combat_payload.planet_id];

                if (!combat_payload.damaged_entities) /* sometimes the watchlist sees fit to send an empty combat -- not sure why */
                    return;

                if (!planet || planet.dead) /* ignore extra combat notifications before planets are available or when a whole planet goes away */
                    return;

                var id = combat_payload.combat_id,
                    combat = self.combat.getCombat(id),
                    getLossGroup = function(unit) {
                        var lossGroup = combat.groupedLosses[unit.army_idx],
                            localArmy = playerInfoHelper.localArmy();

                        if (!lossGroup) {
                            lossGroup = {
                                army_idx: unit.army_idx,
                                isLocalPlayer: localArmy && localArmy.idx === unit.army_idx,
                                score: 0, /* we use the total score to decide the severity of the combat and which enemy army to show (if any) */
                                losses: ko.observableArray( ),
                                lossLeader: null, /* the loss display for the unit type we want to have represent this battle */
                                groupIsNew: true,
                                lossesBySpecId: { }
                            };

                            combat.groupedLosses[unit.army_idx] = lossGroup;
                        }
                        return lossGroup;
                    },
                    getLossDisplay = function(group, unit) {
                        var lossDisplay = group.lossesBySpecId[unit.spec_id],
                            army = playerInfoHelper.armies()[unit.army_idx];

                        if (!lossDisplay) {
                            lossDisplay = {
                                /* this is what we actually bind to in our html */
                                spec_id: unit.spec_id,
                                army_idx: unit.army_idx,
                                filterCss: army && army.filterCss,
                                slotContent: 'slot-unit',
                                icon: ko.observable(''),
                                name: ko.observable(''),
                                units_lost: ko.observable(0),
                                metal_lost: ko.observable(0),
                                score: 0, /* as we actually lose metal we'll bump this up higher, but we can initialize it to bias in favor of big stuff */
                                displayIsNew: true /* bucketDamagedEntity will lower this flag */
                            };

                            group.lossesBySpecId[unit.spec_id] = lossDisplay;
                            group.losses.push(lossDisplay); /* not sure */
                        }
                        return lossDisplay;
                    },
                    fixLossDisplayIcon = function(lossDisplay, unit) {
                        if (!lossDisplay.icon()) {
                            var spec = self.unitData() && self.unitData()[unit.spec_id];

                            if (spec) {
                                lossDisplay.name(spec.name);
                                lossDisplay.icon('coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_' + spec.sicon + '.png');
                            }
                        }
                    },
                    jostleLossGroup = function(lossGroup) {
                        var better = function(a, b) {
                            return !b || !b.isLocalPlayer && (a.isLocalPlayer || a.score > 1.2 * b.score);
                        };

                        if (lossGroup === combat.firstGroup)
                            return;

                        if (better(lossGroup, combat.firstGroup)) {
                            combat.secondGroup = combat.firstGroup;
                            combat.firstGroup = lossGroup;
                        } else if (better(lossGroup, combat.secondGroup)) {
                            combat.secondGroup = lossGroup;
                        }
                    },
                    bucketDamagedEntity = function(unit) {
                        var lossGroup = getLossGroup(unit),
                            lossDisplay = getLossDisplay(lossGroup, unit);

                        fixLossDisplayIcon(lossDisplay, unit); // if we start the client while a unit is taking damage, we have to try this twice since live_game won't have sent us our unit details yet

                        lossDisplay.metal_lost(unit.metal_lost + lossDisplay.metal_lost());

                        lossDisplay.score += unit.metal_lost;
                        lossGroup.score += unit.metal_lost;

                        if (unit.dead) {
                            lossDisplay.units_lost(1 + lossDisplay.units_lost());
                        }

                        if (lossGroup.groupIsNew) {
                            /* a new army has entered the fray! */                            
                            lossGroup.lossLeader = lossDisplay;

                            if (lossGroup.isLocalPlayer)
                                combat.includesLocalPlayer = true;

                            lossGroup.groupIsNew = false;
                        }

                        if (lossDisplay.displayIsNew) {
                            lossGroup.losses.push(lossDisplay);
                            lossDisplay.displayIsNew = false;
                        }

                        if (lossGroup.lossLeader.score < lossDisplay.score) {
                            combat.lossLeader = lossDisplay;
                        }

                        jostleLossGroup(lossGroup);
                    };

                combat.recent = combat_payload;

                combat.planet.id = combat_payload.planet_id;
                combat.planet.icon(planet.imageSmall);
                combat.expirationTime = combat_payload.lifespan + combat_payload.last_event_time;

                _.forEach(combat_payload.damaged_entities, bucketDamagedEntity);

                if (self.combat.nextExpirationTime > combat.expirationTime) {
                    self.combat.nextExpirationTime = combat.expirationTime;
                }

                self.combat.assignSlots(combat);

                if (!combat.isDisplayed && (self.isSpectator() || combat.includesLocalPlayer) && self.combatList().length < 8) {
                    combat.isDisplayed = true;
                    self.combatList.push(combat);
                }
            },
            jump: function(id) {
                var combat = self.combat.combats[id],
                    target = {
                        location: combat.recent.last_location,
                        zoom: 'air',
                        planet_id: combat.planet.id
                    };

                api.camera.lookAt(target, combat.planet.id === self.combat.selectedPlanetId()); /* trying a smooth jump when the combat is on the current planet */
            },
            preview: function(element, id, holodeck) {
                var combat = self.combat.combats[id];

                if (!(combat && combat.recent))
                    return;

                var target = {
                    location: combat.recent.last_location,
                    planet_id: combat.recent.planet_id,
                    zoom: 'air' // todo: do we need an orbital zoom level for an orbital combat?
                }, placement = {
                    element: element,
                    holodeck: holodeck,
                    alignElement: [0, 1],
                    alignDeck: [0, 0],
                    offset: [-8, 8 + (self.alerts().length > 0 ? 48 : 0)]
                };

                preview.show(target, placement);
                self.combat.hovered = true;
                self.combat.hoveredCombatId = id;
                combat.hovered(true);
            },
            hide: function() {
                var hoveredCombat = self.combat.combats[self.combat.hoveredCombatId];
                preview.hide();
                self.combat.hovered = false;

                if (hoveredCombat) {
                    hoveredCombat.hovered(false);
                }
            },
            acknowledgeNext: function() {
                var
                    combatList = self.combatList(), // we want to scan in the order they appear in the display
                    lastAcknowledgedId = self.combat.lastAcknowledgedId,
                    lookingIdx = _.findIndex(combatList, function(combat) {
                        return combat.id === lastAcknowledgedId;
                    }),
                    combat = combatList[(1 + lookingIdx) % combatList.length];

                if (!combat)
                    return;

                /* todo: add a check for whether we're still looking at the most recently acknowledged combat */
                var target = {
                    location: combat.recent.average_location,
                    planet_id: combat.recent.planet_id
                };

                api.camera.lookAt(target, combat.planet.id === self.combat.selectedPlanetId());

                self.combat.lastAcknowledgedId = combat.id;
            },
            clean: function(newTime) {
                /* this function subscribes to self.endOfTimeInSeconds */
                var dirty = false;

                if (newTime < self.combat.nextExpirationTime)
                    return;

                if (self.combat.hovered)
                    return;

                var nextExpirationTime = Infinity,
                    combats = self.combat.combats;

                _.forEach(combats, function(combat, key) {
                    if (combat.expirationTime <= newTime || !combat.firstGroup) {
                        dirty = true;
                        combat.isDisplayed = false;
                        delete combats[key];
                    } else {
                        if (combat.expirationTime < nextExpirationTime)
                            nextExpirationTime = combat.expirationTime;
                    }
                });

                self.combat.nextExpirationTime = nextExpirationTime;
                
                if (dirty) {
                    self.combatList(_.filter(self.combatList(), function(combat) {
                        return combat.isDisplayed;
                    }));
                }
            }
        }

        self.setup = function() {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            parentQuery('unitAlertState').then(self.state);
            parentQuery('playerData').then(self.processPlayerData);

            api.Panel.message(api.Panel.parentId, 'request_augmented_unit_data', {panel_name: api.Panel.pageName});
        };
    }

    model = new UnitAlertModel();

    handlers.watch_list = function (payload) {
        if (model.active())
            model.processList(payload.list);

        if (model.isSpectator())
            return;

        // Trigger Ragnarok music
        _.forEach(payload.list, function(alert) {

            // Is a Ragnarok
            if (!(eventSystem.isType(constants.unit_type.Important, alert.unit_types) &&
                eventSystem.isType(constants.unit_type.Structure, alert.unit_types) &&
                eventSystem.isType(constants.unit_type.SelfDestruct, alert.unit_types)))
                return;

            switch (alert.watch_type) {
                case constants.event_type.ready:
                case constants.event_type.sight:
                    parentQuery('startRagnarokMusic');
                    break;
                case constants.event_type.death:
                case constants.event_type.allied_death:
                case constants.event_type.target_destroyed:
                    parentQuery('stopRagnarokMusic');
                    break;
                default:
                    break;
            }

        });
    };

    handlers.custom_alert = function (payload) {
        return model.processCustomAlert(payload);
    };

    handlers.combat_list = function (payload) {
        _.forEach(payload.list, model.combat.updateCombat);
    };

    handlers.augmented_unit_data = function (payload) {
        model.unitData(payload);
    }

    model.endOfTimeInSeconds.subscribe(model.combat.clean);

    handlers.built_spec_list = function (payload) {
        var set = {};

        _.forEach(payload.list, function (element) {
            set[element] = true;
        });

        model.builtSpecSet(set);
    };

    handlers.time = function (payload) {
        if (payload.view !== 0)
            return;
        model.endOfTimeInSeconds(Math.floor(payload.end_time));
        model.scrubbing(payload.current_time < .995 * payload.end_time);
    };

    handlers.acknowledge_alert = model.acknowledgeAlert;

    handlers.acknowledge_combat = model.acknowledgeCombat;

    handlers.state = function (payload) {
        model.state(payload);
    };

    handlers.player_data = model.processPlayerData;

    handlers.army_defeated = model.processArmyDefeated;

    handlers.planets = function(payload) {
        model.combat.setPlanets(payload.planets);
    }

    handlers['panel.invoke'] = function(params) {
        var fn = params[0];
        var args = params.slice(1);
        return model[fn] && model[fn].apply(model, args);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_unit_alert'])
        loadMods(scene_mod_list['live_game_unit_alert']);

    // get team colors!
    playerInfoHelper.injectHandlers(handlers);
    model.playerInfo = playerInfoHelper;

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

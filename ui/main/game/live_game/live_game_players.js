// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentInvoke() {
        api.Panel.message(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function PlayerListViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.spectatorArmyData = ko.observable([]);
        self.armyId = ko.computed(function() { return self.state().army; });
        self.isSpectator = ko.computed(function() { return !!self.state().spectator; });
        self.showLanding = ko.computed(function() { return !!self.state().landing; });
        self.playerVisionFlags = ko.computed(function() { return self.state().vision || []; });
        self.defeated = ko.computed(function() { return !!self.state().defeated; });
        self.playerContactMap = ko.computed(function() { return self.state().contact || {}; });
        self.allianceRequestsReceived = ko.computed(function() { return self.state().allianceReqs || []; });
        self.gameOptions = ko.computed(function () { return self.state().gameOptions || {}; });

        self.orginalArmyId = ko.observable();
        self.armyId.subscribe(function (value) {
            if (_.isUndefined(self.orginalArmyId())) 
                if (!_.isUndefined(value) && value !== -1) 
                    self.orginalArmyId(value);
        });
        self.previousBountyEconomyHandicaps = null;

        self.players = ko.computed(function() {
            var playersTemp = _.cloneDeep(self.state().players);

            var economyHandicaps = self.state().economyHandicaps;

            _.forEach(playersTemp, function (player, index) {

                // Fix up ally references
                player.allies = player.allies && _.map(player.allies, function(id) {
                    return _.find(playersTemp, {id: id});
                });
                
                // apply handicap data
                var handicap = economyHandicaps[index];
                player.economyHandicap = _.isUndefined(handicap) ? 1.0 : handicap.toFixed(1);
            });

            for (i = 0; i < self.spectatorArmyData().length; i++) {
                var spectatorData = self.spectatorArmyData()[i];

                var playerData = _.find(playersTemp, function (data) {
                    return data.name === spectatorData.name;
                });

                if (playerData) {
                    // copy production
                    var metalInc = spectatorData.metal.production;
                    var energyInc = spectatorData.energy.production;

                    var metalWaste = 0;
                    if (metalInc > spectatorData.metal.demand && spectatorData.metal.current === spectatorData.metal.storage) {
                        metalWaste = metalInc - spectatorData.metal.demand;
                    } else if (metalInc < spectatorData.metal.demand && spectatorData.metal.current === 0) {
                        metalWaste = metalInc - spectatorData.metal.demand;
                    }

                    var energyWaste = 0;
                    if (energyInc > spectatorData.energy.demand && spectatorData.energy.current === spectatorData.energy.storage) {
                        energyWaste = energyInc - spectatorData.energy.demand;
                    } else if (energyInc < spectatorData.energy.demand && spectatorData.energy.current === 0) {
                        energyWaste = energyInc - spectatorData.energy.demand;
                    }

                    playerData.metalProductionStr = '' + metalInc + ' / ' + metalWaste;
                    playerData.energyProductionStr = '' + Number(energyInc / 1000).toFixed(2) + 'K / ' + Number(energyWaste / 1000).toFixed(2) + 'K';

                    // copy army size
                    playerData.armySize = spectatorData.army_size;

                    // copy army metal value
                    playerData.armyMetal = Number(spectatorData.total_army_metal / 1000).toFixed(2);
                    playerData.mobileCount = spectatorData.mobile_army_count;
                    playerData.fabberCount = spectatorData.fabber_army_count;
                    playerData.factoryCount = spectatorData.factory_army_count;

                    // calculate efficiency
                    var metalEfficiency;
                    if (spectatorData.metal.demand > 0 && spectatorData.metal.current === 0) {
                        metalEfficiency = Math.min(1, Math.max(metalInc / spectatorData.metal.demand, 0));
                    } else {
                        metalEfficiency = 1;
                    }

                    var energyEfficiency;
                    if (spectatorData.energy.demand > 0 && spectatorData.energy.current === 0) {
                        energyEfficiency = Math.min(1, Math.max(energyInc / spectatorData.energy.demand, 0));
                    } else {
                        energyEfficiency = 1;
                    }

                    playerData.buildEfficiencyStr = '' + Number(100 * metalEfficiency * energyEfficiency).toFixed(0) + '%';
                }
            }
            return playersTemp;
        });
        self.show = ko.computed(function () {
            return !_.isEmpty(self.players());
        });
        self.player = ko.computed(function () {
            var player = '';
            if (self.players() && self.players().length && !_.isUndefined(self.orginalArmyId())) {
                player = _.find(self.players(), function (player) {
                    return player.id === self.orginalArmyId();
                })
            }
            return player;
        });
        self.sortedPlayersArray = ko.computed(function () {
            var p = [];
            var r = [];
            var i = -1;
            var t;
            if (self.players) {
                //sort each army by its alliance group
                _.forEach(self.players(), function (player) {
                    if (!_.isArray(p[player.alliance_group]))
                        p[player.alliance_group] = [];
                    p[player.alliance_group].push(player);
                });
                //break alliance group 0 into individuals (shared armies)
                _.forEach(p[0], function (player) { r.push([player]) });
                p.shift()
                r = r.concat(p);
            }
            //find player group and move to front of array
            if (self.player()) {
                _.forEach(r, function (group, index) {
                    if (group.indexOf(self.player()) > -1)
                        i = index;
                });
                t = r.splice(i, 1);
                r.unshift(t[0]);
            }
            return r;
        });
        self.playerOpponentRatio = ko.computed(function () {
            var groups = self.sortedPlayersArray();

            if (!groups || !groups.length || groups.length < 2)
                return 0.0;

            var counts = _.map(groups, function (element) {
                return element.length;
            });

            var player_group_count = counts.shift();
            var max_opponent_group_count = _.reduce(counts, function (accumulator, element) {
                return (element > accumulator) ? element : accumulator;
            });

            return max_opponent_group_count / player_group_count;
        });
        self.sortedPlayerList = ko.computed(function () {
            return _.flatten(self.sortedPlayersArray());
        })
        self.showPlayerViewModels = ko.computed(function () {
            return self.players() && self.players().length;
        });

        self.playerToolTip = function (army) {
            return ["<div class='div_player_name_status_tooltip'>",
                       "<span class='div_player_name_tooltip truncate'> " + army.name + " </span>",
                       "<span class='div_player_landing'>", (self.showLanding() ? army.landing ? '!LOC:SELECTING' : '!LOC:READY' : ''), "</span>",
                       "<span class='div_player_defeated'>", (army.defeated ? '!LOC:ANNIHILATED' : ''), "</span>",
                   "</div>"];
        };

        self.playerLandingText = function (army) {
            return self.showLanding() ? army.landing ? loc('!LOC:SELECTING') : loc('!LOC:READY') : '';
        }

        self.playerDefeatedText = function (army) {
            return army.defeated ? loc('!LOC:ANNIHILATED') : '';
        }

        var toggleImage = function(open) {
            return open ? 'coui://ui/main/shared/img/controls/pin_open.png' : 'coui://ui/main/shared/img/controls/pin_closed.png';
        };
        var bodyResize = function() {
            api.Panel.onBodyResize();
            // Wait a frame and try again, just in case.
            _.delay(api.Panel.onBodyResize);
        };

        // Pinning
        self.pinPlayerListPanel = ko.observable(false);
        self.togglePinPlayerListPanel = function () { self.pinPlayerListPanel(!self.pinPlayerListPanel()); };
        self.showPlayerListPanel = ko.computed(function () { return self.pinPlayerListPanel() && self.showPlayerViewModels() });
        self.showPlayerListPanel.subscribe(bodyResize);
        self.playerPanelToggleImage = ko.computed(function() { return toggleImage(self.showPlayerListPanel()); });

        self.pinSpectatorPanel = ko.observable(false);
        self.togglePinSpectatorPanel = function () { self.pinSpectatorPanel(!self.pinSpectatorPanel()); };
        self.showSpectatorPanel = ko.computed(function () { return self.pinSpectatorPanel() && self.showPlayerViewModels() && self.isSpectator() });
        self.showSpectatorPanel.subscribe(bodyResize);
        self.spectatorPanelToggleImage = ko.computed(function() { return toggleImage(self.showSpectatorPanel()); });

        var DEFAULT_SPECTATOR_MODE = 'economy';
        self.spectatorPanelMode = ko.observable(DEFAULT_SPECTATOR_MODE); /* mode : 'economy' | 'army' | 'alliance' */
        self.showEconomyData = ko.computed(function () {
            return self.spectatorPanelMode() === 'economy';
        });
        self.showArmyData = ko.computed(function () {
            return self.spectatorPanelMode() === 'army';
        });
        self.showAllianceData = ko.computed(function () {
            return self.spectatorPanelMode() === 'alliance';
        });


        self.setDiplomaticState = function (targetArmyid, state) {
            self.send_message('change_diplomatic_state', { targetArmyId: targetArmyid, state: state });
        };

        self.acceptAllianceRequest = function (army) {
            self.setDiplomaticState(army.id, 'allied');
        };

        self.ignoreRequests = ko.observable({});
        self.allianceRequestsReceived.subscribe(function(newReqs) {
            if (!newReqs.length)
                self.ignoreRequests({});
        });
        self.ignoreAllianceRequest = function(army) {
            army.diplomaticState[self.armyId()].allianceRequest = false;
            self.ignoreRequests()[army.id] = true;
            self.ignoreRequests.notifySubscribers();
            self.players.notifySubscribers();
        };

        self.sendAllianceRequest = function (army) {
            self.setDiplomaticState(army.id, 'allied');
        };

        self.isHostile = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return army ? self.player().diplomaticState[army.id].state === 'hostile' : false;
        };
        self.isNeutral = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return army ? self.player().diplomaticState[army.id].state === 'neutral' : false;
        };
        self.isAlly = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return army ? self.player().diplomaticState[army.id].state === 'allied'
                || self.player().diplomaticState[army.id].state === 'allied_eco' : false;
        };
        self.isAllyLocked = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return
            var diplomatic_state = self.player().diplomaticState[army.id];
            return (diplomatic_state.state === 'allied' || diplomatic_state.state === 'allied_eco')
                    && !diplomatic_state.mutable;
        };
        self.isSharingEco = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return army ? self.player().diplomaticState[army.id].state === 'allied_eco' : false;
        };
        self.hasAllianceRequest = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return !!self.player().diplomaticState[army.id].allianceRequest;
        };

        self.showRequestAlliance = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return !self.player().diplomaticState[army.id].allianceRequest && !self.isAlly(army)
        };
        self.showSentAllianceRequest = function (army) {
            if (!army || !self.player() || !self.player().diplomaticState || !self.player().diplomaticState[army.id])
                return;
            return self.player().diplomaticState[army.id].allianceRequest && !self.isAlly(army)
        };
        self.showAllied = function (army) {
            return self.isAlly(army) && !self.isAllyLocked(army)
        };
        self.showAlliedLocked = function (army) {
            return self.isAllyLocked(army)
        };
        self.numAllianceRequests = ko.computed(function() {
            return self.allianceRequestsReceived().length - _.keys(self.ignoreRequests()).length;
        });
        self.showAllianceRequestReceived = function (army) {
            if (!army || !army.diplomaticState || !army.diplomaticState[self.armyId()])
                return;
            return army.diplomaticState[self.armyId()].allianceRequest && !self.isAlly(army) && !self.ignoreRequests()[army.id];
        };

        self.visionSelectAll = function() {
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['visionSelectAll']);
        };
        self.visionSelect = function(index, event) {
            api.Panel.message(api.Panel.parentId, 'panel.invoke',
                ['visionSelect', index, {shiftKey: event.shiftKey}]);
        };

        self.energyTextColorCSS = function (index) {
            if (index >= self.spectatorArmyData().length)
                return 'color_positive';

            var spectatorData = self.spectatorArmyData()[index];
            var energyEfficiency;
            if (spectatorData.energy.demand > 0 && spectatorData.energy.current === 0) {
                energyEfficiency = Math.min(1, Math.max(spectatorData.energy.production / spectatorData.energy.demand, 0));
            } else {
                energyEfficiency = 1;
            }

            var energyFraction = spectatorData.energy.current / spectatorData.energy.storage;

            if (energyEfficiency === 1 && energyFraction === 1) {
                return 'color_waste';
            } else if (energyEfficiency < 1 && energyFraction === 0) {
                return 'color_negative';
            } else {
                return 'color_positive';
            }
        };

        self.metalTextColorCSS = function (index) {
            if (index >= self.spectatorArmyData().length)
                return 'color_positive';

            var spectatorData = self.spectatorArmyData()[index];
            var metalEfficiency;
            if (spectatorData.metal.demand > 0 && spectatorData.metal.current === 0) {
                metalEfficiency = Math.min(1, Math.max(spectatorData.metal.production / spectatorData.metal.demand, 0));
            } else {
                metalEfficiency = 1;
            }

            var metalFraction = spectatorData.metal.current / spectatorData.metal.storage;

            if (metalEfficiency === 1 && metalFraction === 1) {
                return 'color_waste';
            } else if (metalEfficiency < 1 && metalFraction === 0) {
                return 'color_negative';
            } else {
                return 'color_positive';
            }
        };

        self.efficiencyTextColorCSS = function (index) {
            if (index >= self.spectatorArmyData().length)
                return 'color_positive';

            var spectatorData = self.spectatorArmyData()[index];

            var metalEfficiency;
            if (spectatorData.metal.demand > 0 && spectatorData.metal.current === 0) {
                metalEfficiency = Math.min(1, Math.max(spectatorData.metal.production / spectatorData.metal.demand, 0));
            } else {
                metalEfficiency = 1;
            }

            var energyEfficiency;
            if (spectatorData.energy.demand > 0 && spectatorData.energy.current === 0) {
                energyEfficiency = Math.min(1, Math.max(spectatorData.energy.production / spectatorData.energy.demand, 0));
            } else {
                energyEfficiency = 1;
            }

            var efficiency = metalEfficiency * energyEfficiency;

            if (efficiency === 1) {
                return 'color_positive';
            } else if (efficiency >= 0.8) {
                return 'color_warning';
            } else {
                return 'color_negative';
            }
        };

        self.isPlayerKnown = function(armyId) {
            return self.playerContactMap()[armyId];
        };

        self.lookAtPlayerIfKnown = function(armyId) {
            if (!self.isPlayerKnown(armyId))
                return;

            api.camera.lookAt(self.playerContactMap()[armyId]);
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['playerListState']).then(self.state);
        };
    }
    model = new PlayerListViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };
    handlers.spectator_data = function (payload) {
        model.spectatorArmyData(payload.armies);
    };
    handlers.set_pin_state = function (payload) {
        if (model.isSpectator())
            model.pinSpectatorPanel(!!payload);
        else
            self.pinPlayerListPanel = ko.observable(false); // TODO: joeld: Is this a bug?
    };

    handlers.economy_handicaps = function (payload) {
        var bountyEconomyHandicaps = payload.payload;

        if (!model.previousBountyEconomyHandicaps) {
            model.previousBountyEconomyHandicaps = bountyEconomyHandicaps;
            return;
        }

        _.forEach(model.players(), function(player, index) {
            if (bountyEconomyHandicaps[index] <= model.previousBountyEconomyHandicaps[index])
                return;

            if (player === model.player()) {
                api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.bounty_recieved]);
            } else if (model.isAlly(player)) {
                api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.bounty_claimed_ally]);
            } else {
                api.Panel.message(api.Panel.parentId, 'panel.invoke', ['processExternalUnitEvent', constants.event_type.bounty_claimed_enemy]);
            }
        });

        model.previousBountyEconomyHandicaps = bountyEconomyHandicaps;
    };

    handlers['query.player_opponent_ratio'] = function () {
        return model.playerOpponentRatio();
    }

    // inject per scene mods
    if (scene_mod_list['live_game_players'])
        loadMods(scene_mod_list['live_game_players']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

var model;

$(document).ready(function () {

   function SlotViewModel(options /* ai economy_factor */) {
        var self = this;
        var states = ['empty', 'player'];

        self.player = ko.observable(null);
        self.stateIndex = ko.observable(options.ai ? 2 : 0);
        self.isEmpty = ko.computed(function () { return self.stateIndex() === 0 });
        self.isPlayer = ko.computed(function () { return self.stateIndex() === 1 });
        self.ai = ko.observable(false);

        self.hover = ko.observable(false);

        self.playerName = ko.observable();
        self.playerId = ko.observable();
        self.isCreator = ko.observable(false);
        self.creatorName = ko.observable();
        self.isReady = ko.observable(false);
        self.isLoading = ko.observable(false);
        self.primaryColor = ko.observable('');
        self.rawColor = ko.observable([]);

        self.secondaryColor = ko.observable('');
        self.commander = ko.observable();

        self.serverEconFactor = ko.observable(parseFloat(options.economy_factor));
        self.clientEconFactor = ko.observable(null);
        self.economyFactor = ko.computed({
            read: function() {
                var server = self.serverEconFactor();
                var client = self.clientEconFactor();
                if (_.isFinite(client))
                    return client.toFixed(1);
                if (_.isFinite(server))
                    return server.toFixed(1);
                return '1.0';
            },
            write: function(value) {
                if (!model.isGameCreator())
                    return;

                var newValue = parseFloat(value);
                if (!_.isFinite(newValue))
                    newValue = 1.0;

                newValue = Math.min(Math.max(0.0, newValue), 5.0);

                if (newValue !== self.clientEconFactor()) {
                    model.send_message('set_econ_factor', {
                        id: self.playerId(),
                        economy_factor: newValue.toFixed(1)
                    });
                }
                self.clientEconFactor(newValue);
                self.economyFactor.notifySubscribers();
            }
        });

        self.adjustEconFactor = function (value) {
            var newValue = (parseFloat(self.economyFactor()) + value).toFixed(1)
            self.economyFactor(newValue);
        };

        self.lockColorIndex = ko.observable(false);
        self.colorIndex = ko.observable();
        self.secondaryColorIndex = ko.observable(-1);

        self.colorIndex.subscribe(function (value) {
            if (self.lockColorIndex())
                return;

            self.secondaryColorIndex(-1);

            if (self.ai())
                model.send_message('set_primary_color_index_for_ai', {
                    id: self.playerId(),
                    color: Number(self.colorIndex())
                });
            else
                model.send_message('set_primary_color_index', Number(self.colorIndex()));

            model.showColorPicker(false);
            model.colorPickerSlot(null);
        });

        self.secondaryColorIndex.subscribe(function (value) {
            if (self.lockColorIndex())
                return;

            if (value === -1)
                return;

            if (self.ai())
                model.send_message('set_secondary_color_index_for_ai', {
                    id: self.playerId(),
                    color: Number(value)
                });
            else
                model.send_message('set_secondary_color_index', Number(value));

            model.showColorPicker(false);
            model.colorPickerSlot(null);
        });

        self.lockAIPersonality = ko.observable(false);
        self.aiPersonality = ko.observable(model.aiPersonalityNames()[0]);
        self.aiPersonality.subscribe(function (value) {
            if (!value || !self.ai() || self.lockAIPersonality() || !model.isGameCreator())
                return;

            var personalities = model.aiPersonalities();

            var personality = personalities[value];

            if (!personality)
                return;

            personality.name = value;
            model.previousAIPersonality(value);

            model.send_message('set_ai_personality', {
                id: self.playerId(),
                ai_personality: personality
            });
        });

        self.lockAILandingPolicy = ko.observable(false);
        self.aiLandingPolicy = ko.observable(model.aiLandingPolicyOptions()[0]);
        self.aiLandingPolicy.subscribe(function (value) {
            if (self.lockAILandingPolicy() || !model.isGameCreator())
                return;

            if (!self.ai() || !value)
                return;

            model.previousAILandingPolicy(value);

            model.send_message('set_ai_landing_policy', {
                id: self.playerId(),
                ai_landing_policy: value
            });
        });

        self.updateFromJson = function (json) {
            if (_.isEmpty(json)) {
                self.stateIndex(0);
                self.playerName('');
            }
            else if (_.has(json, 'name')) {
                self.stateIndex(1);
                self.playerName(json.name);
            }

            if (_.has(json, 'id'))
                self.playerId(json.id);

            self.isCreator(!!json.creator);

            self.ai(!!json.ai);

            if (json.personality) {
                self.lockAIPersonality(true);
                self.aiPersonality(json.personality.name);
                self.lockAIPersonality(false);
            }

            if (json.landing_policy) {
                self.lockAILandingPolicy(true);
                self.aiLandingPolicy(json.landing_policy);
                self.lockAILandingPolicy(false);
            }

            self.serverEconFactor(parseFloat(json.economy_factor));

            if (json.color) {
                self.rawColor(json.color);
                if (json.color[0])
                    self.primaryColor('rgb(' + json.color[0].join() + ')');
                if (json.color[1])
                    self.secondaryColor('rgb(' + json.color[1].join() + ')');
            }

            if (UberUtility.isDefinedAndValid(json.color_index)) {
                self.lockColorIndex(true);
                self.colorIndex(json.color_index);
                self.lockColorIndex(false);
            }

            if (json.commander)
                self.commander(json.commander);

            self.isReady(json.ready);
            self.isLoading(json.loading);
        };

        self.clearPlayers = function () {
            if (self.isPlayer())
                self.stateIndex(0);

            self.playerName('');
            self.rawColor([]);
            self.primaryColor('');
            self.secondaryColor('');
        };

        self.containsThisPlayer = ko.computed(function () {
            return self.playerName() === model.displayName();
        });

        self.allowColorModification = ko.computed(function () {
            return self.containsThisPlayer() || (self.ai() && model.isGameCreator())
        });

        self.cinematicInfo = ko.computed(function() {
            return {
                ai: self.ai(),
                commander: self.commander(),
                name: self.playerName(),
                color: self.rawColor()
            };
        });
    }

    function ArmyViewModel(army_index, options /* slots alliance ai economy_factor */) {
        var self = this;

        self.index = ko.observable(army_index);

        self.aiArmy = ko.observable(!!options.ai);
        self.aiArmy.subscribe(function (value) {
            _.invoke(self.slots(), 'setIsAI', !!value);
        });
        self.toggleAiControl = function () {
            //model.send_message('modify_army', {
            //    army_index: self.index(),
            //    options: { ai: !self.aiArmy() }
            //});
        };

        self.slots = ko.observableArray([]);

        var slot_count = options ? options.slots : 1;
        for (var i = 0; i < slot_count; i++)
            self.slots().push(new SlotViewModel({ ai: self.aiArmy() }));

        self.allianceGroup = ko.observable(0);
        self.maxAllianceGroup = ko.observable(6);
        self.allianceGroupImageSource = ko.computed(function () {
            return 'coui://ui/main/shared/img/alliance_group/alliance_group_' + self.allianceGroup() + '.png';
        });

        self.numberOfSlots = ko.computed(function () { return self.slots().length; });
        self.numberOfEmptySlots = ko.computed(function () {
            return _.filter(self.slots(), function (element) { return element.isEmpty() }).length;
        });
        self.isEmpty = ko.computed(function () {
            return self.numberOfEmptySlots() === self.slots().length;
        });

        self.alliance = ko.observable(!!options.alliance);
        self.sharedArmy = ko.computed(function () { return !self.alliance(); });

        self.showToggleSharedArmy = ko.computed(function () {
            return model.isTeamGame() && self.numberOfSlots() > 1;
        });
        self.toggleSharedArmy = function () {
            if (!model.isGameCreator())
                return;

            model.send_message('modify_army', {
                army_index: self.index(),
                options: { alliance: !self.alliance() }
            });
        };

        self.metal = ko.observable(1000);
        self.energy = ko.observable(1000);
        self.rate = ko.observable(1.0);

        self.changeAllianceGroup = function () {
            self.allianceGroup((self.allianceGroup() + 1) % self.maxAllianceGroup());
        }

        self.showAddSlot = ko.computed(function () {
            return model.canAddMorePlayers() && model.isGameCreator();
        });
        self.addSlot = function () {
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { slots: self.numberOfSlots() + 1 }
            });
        }
        self.addSlotCSS = ko.computed(function() {
            if (self.showAddSlot())
                return 'btn_std_gray';
            else
                return 'btn_std_gray_disabled';
        });

        self.showRemoveSlot = function () {
            return self.numberOfSlots() > 1;
        }
        self.removeSlot = function () {
            model.send_message('modify_army', {
                army_index: self.index(),
                options: { slots: self.numberOfSlots() - 1 }
            });
        }

        self.join = function () {
            if (self.aiArmy() || model.thisPlayerIsReady())
                return;

            model.send_message('join_army', {
                army: self.index(),
                commander: model.selectedCommander()
            });
        };

        self.nextPrimaryColor = function () {
            if (model.thisPlayerIsReady())
                return;

            model.send_message('next_primary_color');
        };

        self.nextSecondaryColor = function () {
            if (model.thisPlayerIsReady())
                return;

            model.send_message('next_secondary_color');
        };

        self.dirtySlots = function() {
            _.forEach(self.slots(), function(slot) {
                slot.dirty = true;
            });
        };
        self.cleanupSlots = function() {
            _.forEach(self.slots(), function(slot) {
                if (slot.dirty) {
                    slot.clearPlayers();
                    delete slot.dirty;
                }
            });
        };

        self.clearPlayers = function () {
            _.forEach(self.slots(), function (element) {
                element.clearPlayers();
            });
        }

        self.addPlayer = function (slot_index, options /* name, id, [color] */) {
            var slot = self.slots()[slot_index];

            if (slot) {
                slot.updateFromJson(options);
                delete slot.dirty;
            }
        }

        self.updateFromJson = function (json) {
            self.aiArmy(!!json.ai);
            self.alliance(!!json.alliance);

            while (self.slots().length < json.slots) {
                self.slots.push(new SlotViewModel({ ai: self.aiArmy() }));
            }
            while (self.slots().length > json.slots)
                self.slots.pop();
        };

        self.asJson = function() {
            return {
                slots: _.invoke(self.slots(), 'asJson'),
                alliance : self.alliance(),
                ai: self.aiArmy(),
                economy_factor: self.econFactor
            }
        };

        self.armyContainsThisPlayer = function () {
            return !!(_.find(self.slots(), function (s) { return (s.playerName() == model.displayName()); }));
        };

        self.slotTag = ko.computed(function () { return (self.aiArmy()) ? loc("!LOC:AI Commander") : loc("!LOC:Player Slot") })
        self.addSlotTag = ko.computed(function () { return (self.aiArmy()) ? loc("!LOC:Add AI Commander") : loc("!LOC:Add Slot") })

        self.cinematicInfo = ko.computed(function() {
            return {
                players: _.invoke(self.slots(), 'cinematicInfo'),
                shared: self.sharedArmy()
            };
        });
    }

    function ChatMessageViewModel(name, type  /* 'invalid' | 'lobby' | 'server' */, payload) {
        var self = this;

        self.username = ko.observable(name);
        self.type = type; /* 'invalid' | 'lobby' | 'server' | 'settings' */
        self.payload = ko.observable(payload);
    }

    function NewGameViewModel() {
        var self = this;

        self.buildVersion = ko.observable().extend({session: 'build_version'});

        self.reconnectToGameInfo = ko.observable().extend({ local: 'reconnect_to_game_info' });

        self.returnFromLoad = ko.observable(!!$.url().param('returnFromLoad'));

        self.userTriggeredDisconnect = ko.observable(false);

       // Click handler for leave button
        self.leave = function() {
            model.send_message('leave');
            _.delay(function() {
                self.userTriggeredDisconnect(true);
                self.navToStart();
            }, 30);
        };

        // signal from server_browser.  indicates that the player wants to join a spectator spot
        self.tryToSpectate = ko.observable().extend({ session: 'try_to_spectate' });
        self.playersWithoutArmies = ko.observableArray([]);

        self.allPlayersAreReady = ko.observable(false);

        self.thisPlayerIsReady = ko.observable(false);

        self.startingGameCountdown = ko.observable(-1);
        self.showStartingGameCountdown = ko.computed(function () {
            return self.startingGameCountdown() !== -1;
        });

        self.spectatorLimit = ko.observable(1);
        self.spectatorLimitLock = ko.observable(true);
        self.spectatorLimit.subscribe(function (value) {
            if (self.spectatorLimitLock())
                return;
            self.changeSettings();
        });

        self.spectators = ko.observableArray([]);
        self.spectatorCount = ko.computed(function() {
            return self.spectators().length;
        });
        self.emptySpectatorSlots = ko.computed(function() {
// avoid negative when format changed creating players without armies 
            return Math.max(0, self.spectatorLimit() - self.spectatorCount());
        });

        self.showSpectators = ko.computed(function () {
            return self.spectatorLimit() > 0 || self.spectatorCount();
        });

        // Set up dynamic sizing elements
        self.containerHeight = ko.observable('600px');
        self.containerWidth = ko.observable('600px');
        self.armyListHeight = ko.observable('600');
        self.armyListHeightMinusSpectators = ko.computed(function () {
            return self.armyListHeight() - (self.showSpectators() ? 108 : 0);
        });

        self.armyListHeightString = ko.computed(function () {
            return '' + self.armyListHeightMinusSpectators() + 'px';
        });

        self.chatHeight = ko.observable('400px');

        self.chatSelected = ko.observable(false);
        self.chatMessages = ko.observableArray([]);
        self.sendChat = function (message) {
            var msg = {};
            msg.message = $(".input_chat_text").val();

            if (msg.message) {
                model.send_message("chat_message", msg);
            }
            msg.message = $(".input_chat_text").val("");
        };

        self.localChatMessage = function(name, message) {
            model.chatMessages.push(new ChatMessageViewModel(name, 'mod', message));
        };

        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });

        self.uberName = ko.observable().extend({ local: 'uberName' });
        self.displayName = ko.observable('').extend({ session: 'displayName' });
        if (!self.displayName())
            self.displayName('Player');
        self.uberId = ko.observable().extend({ local: 'uberId' });
        self.preferredCommander = ko.observable().extend({ local: 'preferredCommander_v2' });
        self.preferredCommanderValid = ko.computed(function() {
            var commander = self.preferredCommander();
            if (_.has(commander, 'UnitSpec'))
                return true;
            else
                return _.isString(commander);
        });

        self.commanders = ko.observableArray([]);
        
        self.updateCommanders = function(commanders) {
            self.commanders(_.filter(CommanderUtility.getKnownCommanders(), function(commander) {
                // need a better way to do this
                var spec = CommanderUtility.bySpec.getSpec(commander) || {};
                return spec.custom || PlayFab.isCommanderOwned(CommanderUtility.bySpec.getObjectName(commander));
            }));
        }

        CommanderUtility.afterCommandersLoaded(function() {
           self.updateCommanders();
            if (!self.returnFromLoad())
                self.usePreferredCommander();
        });

        self.selectedCommanderIndex = ko.observable(-1).extend({ session: 'selectedCommander' });
        self.selectedCommander = ko.computed(function () {
            // If we haven't gotten a commander list yet, just return nothin'.
            if (!self.commanders() || !self.commanders().length)
                return null;

            var index = self.selectedCommanderIndex();

            if (index === -1) { /* if nothing is selected, either use the preferred cmdr or the first cmdr in the list */
                if (self.preferredCommanderValid())
                {
                    var commander = self.preferredCommander();
                    if (_.has(commander, 'UnitSpec'))
                        return commander.UnitSpec;
                    else
                        return commander;
                }
                index = 0;
            }

			return self.commanders()[index];
        });

        self.usePreferredCommander = function () {
            if (!self.preferredCommanderValid())
                return;

            self.selectedCommanderIndex(-1);
            self.send_message('update_commander', {
                commander: self.selectedCommander()
            });
        };

        self.setCommander = function (index) {
            if (model.thisPlayerIsReady())
                return;

            self.selectedCommanderIndex(index % self.commanders().length);

            model.send_message('update_commander', {
                commander: self.selectedCommander()
            });
        }

        self.changeCommander = function () {
            self.setCommander(self.selectedCommanderIndex() + 1)
        };

        self.gameType       = ko.observable('FreeForAll').extend({ session: 'game_type' });
        self.isFFAGame      = ko.computed(function() { return self.gameType() === 'FreeForAll'; });
        self.isTeamGame     = ko.computed(function() { return self.gameType() === 'TeamArmies'; });
        self.isVersusAIGame = ko.computed(function() { return self.gameType() === 'VersusAI'; });

        self.allowSpectate = ko.computed(function () {
            if (self.thisPlayerIsReady())
                return false;

            return self.emptySpectatorSlots() > 0
                    && !_.contains(_.pluck(self.spectators(), 'name'), self.displayName())
        });

        self.leaveArmy = function (options /* force */) {

            if (self.thisPlayerIsReady() && !options.force)
                return;

            if (!self.allowSpectate() && !options.force)
                return;

            model.send_message('leave_army');
        };

        self.changeSettings = function () {
            if (!self.isGameCreator())
                return;

            var payload = {
                'spectators': Number(self.spectatorLimit()),
                'password': self.privateGamePassword(),
                'friends': self.whitelist(),
                'public': self.isPublicGame(),
                'blocked': self.blocked(),
                'tag': self.tag(),
                'game_name': self.gameName(),
                'game_options': {
                    'game_type': self.gameType(),
                    'listen_to_spectators': self.listenToSpectators(),
                    'land_anywhere': self.landAnywhere(),
                    'dynamic_alliances': self.dynamicAlliances(),
                    'dynamic_alliance_victory': self.dynamicAllianceVictory(),
                    'bounty_mode': self.isTitansGame() && self.bountyMode(),
                    'bounty_value': self.bountyValue(),
                    'sandbox': self.sandbox()
                }
            }

            model.send_message('modify_settings', payload);
        };

        self.changeBouncer = function () {
            if (!self.isGameCreator())
                return;

            model.send_message('modify_bouncer', {
                'password': self.privateGamePassword(),
                'friends': self.whitelist(),
                'blocked': self.blocked()
            });
        }

        self.kickUser = function (user_id) {
            api.debug.log('kick', user_id);
            self.send_message('kick', { 'id': user_id });
        };

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.gameTicket = ko.observable().extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });
        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });

        self.isFriendsOnlyGame = ko.observable(false);
        self.setFriendsOnlyGame = function () {
            self.isFriendsOnlyGame(true);
            self.isPublicGame(false);
            self.changeSettings();
        }

        self.aiSkirmish = ko.observable().extend({ session: 'ai_skirmish' });
        self.pushAIButton = ko.observable(self.aiSkirmish());

        self.tagOptions = ko.observableArray(['Casual', 'Competitive', 'AI Battle', 'Testing']);
        self.tagLock = ko.observable(false);
        self.tag = ko.observable(self.tagOptions()[0]).extend({ session: 'lobby_tag' });
        self.tag.subscribe(function (value) {
            if (self.tagLock())
                return;
            self.changeSettings();
        });

        self.isPublicGame = ko.observable(false);
        self.setPublicGame = function () {
            self.isFriendsOnlyGame(false);
            self.isPublicGame(true);
            self.changeSettings();
        }
        self.isHiddenGame = ko.computed(function() { return !self.isFriendsOnlyGame() && !self.isPublicGame(); });
        self.setHiddenGame = function() {
            self.isFriendsOnlyGame(false);
            self.isPublicGame(false);
            self.changeSettings();
        };

// preserve password on refresh or when connecting to password protected custom servers
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password', rateLimit: { timeout: 1000, method: "notifyWhenChangesStop" } });

        self.privateGamePassword.subscribe(self.changeBouncer);

        self.friends = ko.observableArray([]).extend({ session: 'friends' });
        self.hasFriends = ko.computed(function () { return self.friends().length });

        self.invites = ko.observableArray([]).extend({ session: 'invites' });
        self.hasInvites = ko.computed(function () { return self.invites().length });

        self.lobbyContacts = ko.observableArray([]);
        self.lobbyContacts.subscribe(function (value) {
            //api.debug.log('lobby contacts');
            api.Panel.message('uberbar', 'lobby_contacts', value);
        });
        self.lobbyContactsMap = ko.computed(function () {
            result = {};
            _.forEach(self.lobbyContacts(), function (element) {
                result[element] = true;
            });
            return result;
        });

        self.whitelist = ko.computed(function () {
            if (self.isFriendsOnlyGame())
                return self.friends();
            return [];
        });
        self.whitelist.subscribe(self.changeBouncer);

        self.blocked = ko.observableArray([]).extend({ session: 'blocked' });
        self.blocked.subscribe(self.changeBouncer);

        self.createdGameId = ko.observable();

        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.waitingString = ko.observable('');

        self.listenToSpectators = ko.observable(false);
        self.landAnywhere = ko.observable(false);
        self.toggleLandAnywhere = function () {
            if (self.canChangeSettings())
            {
                self.landAnywhere(!self.landAnywhere());
                self.changeSettings();
            }
        };
        self.dynamicAlliances = ko.observable(false);
        self.dynamicAllianceVictory = ko.observable(false);

        self.bountyMode = ko.observable(false);
        self.bountyModeLock = ko.observable(false);

        self.bountyModeChanged = self.bountyMode.subscribe(function()
        {
            if (self.bountyModeLock())
                return;

            self.updateSettings();
        });

        self.bountyValueLock = false;
        self.bountyValue = ko.observable(0.5);
        self.bountyValueInput = ko.observable(0.5).extend({ rateLimit: { timeout: 750, method: "notifyWhenChangesStop" } });
        self.bountyValueInput.subscribe(function(value) {
            self.bountyValueInput(Math.max(0.01, Math.min(10.0, Number(Number(value).toFixed(2)))));
            self.bountyValue(self.bountyValueInput());
        });
        self.bountyValue.subscribe(function(v) {
            self.bountyValueInput(v);
            if (!self.bountyValueLock)
                self.updateSettings();
        });

        self.sandbox = ko.observable(false);

        self.requiredContent = ko.observable();
        self.isTitansGame = ko.pureComputed(function() {
            return _.contains(self.requiredContent(), 'PAExpansion1');
        });

        self.allowResetArmiesOnChange = ko.observable(false);

        self.gameType.subscribe(function (value) {
            if (self.allowResetArmiesOnChange()) {
                self.resetArmies();
                self.updateSettings();
            }
        });


        self.armies = ko.observableArray([]);

        self.nextSceneUrl = ko.observable().extend({ session: 'next_scene_url' });

        self.isGameCreator = ko.observable(false);

        self.updateSettings = function () {
            self.changeSettings();
            return true; //required to allow the ko checked binding to update when also bound with ko clicked binding
        }

        /* Can the player change settings? True if they're the creator. */
        self.canChangeSettings = ko.computed(function () {
            return self.isGameCreator();
        });
        /* Can the player change a setting that we allow to be changed during a ladder match? */
        self.canChangeLadderMutableSettings = ko.computed(function() {
            return self.isGameCreator();
        });
        self.canChangeDynamicAllianceVictory = ko.computed(function () {
            return self.canChangeSettings() && self.dynamicAlliances();
        });

        self.isGameCreator.subscribe(function (value) {
            if (value && self.devMode()) {
                self.sandbox(true);
                self.changeSettings();
            }
        });

        self.slots = ko.computed(function () {
            var slots = 0;
            var i;

            for (i = 0; i < self.armies().length; i++)
                slots += self.armies()[i].numberOfSlots();
            return slots;
        });

        self.playerSlots = ko.computed(function () {
            var slots = 0;
            var i;

            for (i = 0; i < self.armies().length; i++)
                if (!self.armies()[i].aiArmy())
                    slots += self.armies()[i].numberOfSlots();

            return slots;
        });
        self.numberOfEmptySlots = ko.computed(function () {
            var slots = 0;
            var i;

            for (i = 0; i < self.armies().length; i++)
                slots += self.armies()[i].numberOfEmptySlots();

            return slots;
        });
        self.numberOfEmptySlots.subscribe(function (value) {
            api.Panel.message('uberbar', 'lobby_empty_slots', { slots: value });
        });

        self.playerCount = ko.computed(function () {
            return self.playerSlots();
        });

        self.maxSpectatorsLimit = ko.observable(3);
        self.maxPlayersLimit = ko.observable(10);

        self.spectatorLimitOptions = ko.computed(function () {
            return _.range(self.maxSpectatorsLimit()+1);
        });

        self.gameName = ko.observable().extend({ maxLength: 128, rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });
        self.gameNameLock = ko.observable(false);
        self.gameName.subscribe(function (value) {
            if (self.gameNameLock())
                return;
            self.changeSettings();
        });

        self.gameModeString = ko.computed(function () {
            return self.gameType() + self.playerCount();
        });

        self.armyDescription = function(number) {
            if (self.isTeamGame())
                return loc('!LOC:Team __team_number__', { team_number: number });
            else
                return loc('!LOC:Slot __slot_number__', { slot_number: number });
        };

        self.addTeamLabel = ko.pureComputed(function() {
            if (self.isTeamGame())
                return loc('!LOC:Add Team');
            else
                return loc('!LOC:Add Slot');
        });

        self.teamDescription = ko.computed(function () {
            if (self.isTeamGame())
                return loc('!LOC:Team');
            else
                return loc('!LOC:Slot');
        });

        self.serverLoading = ko.observable(false);
        self.clientHasLoadedOnce = ko.observable(false);
        self.clientLoading = ko.observable(true);
        self.clientLoading.subscribe(function(loading) {
            self.send_message('set_loading', { loading: loading });
            if (!loading)
                self.clientHasLoadedOnce(true);
        });

        self.serverModsState = ko.observable(undefined);

        self.serverModsStatus = ko.computed(function() {

            var status = '';

            switch(self.serverModsState()) {

                case 'uploading':
                    status = 'Uploading server mods...';
                    break;
                case 'downloading':
                    status = 'Downloading server mods...';
                    break;
                case 'mounting':
                    status = 'Mounting server mods...';
                    break;
                case 'mounted':
                    break;
                default:
            }
            api.debug.log(status);
            return loc(status);
        });

        self.slotsAreEmptyInfo = ko.observable('');
        self.slotsAreEmpty = ko.computed(function() {
            var result = _.some(self.armies(), function(army) {
                if (army.aiArmy())
                    return false;
                return _.some(army.slots(), function(slot) {
                    return slot.isEmpty();
                });
            })
            if (result)
                self.slotsAreEmptyInfo(loc("!LOC:Slots are empty."));
            else
                self.slotsAreEmptyInfo('');
            return result;
        });

        self.friendsAreMissingInfo = ko.observable('');
        self.friendsAreMissing = ko.computed(function () {
            var result = self.isFriendsOnlyGame() && !self.friends().length;
            if (result)
                self.friendsAreMissingInfo(loc("!LOC:You must have friends to play a friends-only game."));
            else
                self.friendsAreMissingInfo('');
            return result;
        });

        self.holdReadyMap = ko.observable({/* identifier: info */});

        self.registerHoldReady = function(identifier, info) {
            self.holdReadyMap()[identifier] = info;
            self.holdReadyMap.valueHasMutated();
        }

        self.unregisterHoldReady = function(identifier) {
            delete self.holdReadyMap()[identifier];
            self.holdReadyMap.valueHasMutated();
        }

        self.holdReadyInfo = ko.computed(function() {
            return _.last(_.values(self.holdReadyMap())) || '';
        });

        self.holdReady = ko.computed(function() {
            var hold = _.size(self.holdReadyMap()) > 0;

            if (hold && self.thisPlayerIsReady()) {
                self.send_message('toggle_ready');
            }

            return hold;
        });

        self.gameSystemReadyInfo = ko.observable('');
        self.gameSystemReady = ko.computed(function() {
            var info = self.holdReadyInfo();
            if (!info && (self.serverLoading() || self.clientLoading())) {
                info = loc('!LOC:Building planets...');
            }
            self.gameSystemReadyInfo(info);
            return !info;
        });

        self.gameIsNotOkInfo = ko.computed(function() {
            if (self.isGameCreator()) {
                return self.serverModsStatus() || self.friendsAreMissingInfo() || self.slotsAreEmptyInfo() || self.gameSystemReadyInfo();
            } else {
                return self.gameSystemReadyInfo();
            }
        });
        self.gameIsNotOk = ko.computed(function () { return self.friendsAreMissing() || self.slotsAreEmpty() || !self.gameSystemReady(); });

        self.startEnabled = ko.computed(function() {
            return self.allPlayersAreReady() && !self.serverLoading() && !self.clientLoading() && !self.gameIsNotOk();
        });
        var hasPlayedReadyVO = false;
        self.startEnabled.subscribe(function (value) {
            if (value && self.clientHasLoadedOnce() && !hasPlayedReadyVO) {
                hasPlayedReadyVO = true;
                api.audio.playSound('/SE/UI/UI_lobby_game_loaded');
            }
        });

        self.canAddMorePlayers = ko.computed(function() {
           return self.playerCount() < self.maxPlayersLimit()
        });

        self.showAddSlot = ko.computed(function () {
            if (!self.isGameCreator())
                return false;

            if (self.isFFAGame())
                return false

            return self.canAddMorePlayers();
        });

        self.showAddArmy = ko.computed(function () {
            return self.canAddMorePlayers();
        });

        self.hideAddArmy = ko.computed(function () {
            return !self.showAddArmy();
        });

        self.addArmy = function () {
            if (!self.showAddArmy())
                return;

            self.send_message('add_army', {
                options: {
                    slots: 1,
                    ai: false,
                    alliance: self.isTeamGame()
                }
            });
        };

        self.showRemoveArmy = ko.computed(function () {
            return self.armies().length > 2 && self.isGameCreator();
        });
        self.removeArmy = function (army_index) {
            self.send_message('remove_army', { 'army_index': army_index } );
        };

        self.resetArmies = function () {

            if (!self.isGameCreator())
                return;

            if (self.isFFAGame()) {
                self.send_message('reset_armies', [
                    { slots: 1, ai: false, alliance: false },
                    { slots: 1, ai: false, alliance: false }
                ]);
            }
            else {
                self.send_message('reset_armies', [
                   { slots: 2, ai: false, alliance: true },
                   { slots: 2, ai: false, alliance: true }
                ]);
            }

            if (self.loadedSystemIsEmpty() && !model.updateSystemInProgress())
                self.loadRandomSystem();
        };

        self.newGameWhenLoaded = ko.observable(false).extend({ session: 'new_game_when_loaded' });

        self.navToEditPlanet = function () {
            self.lastSceneUrl('coui://ui/main/game/new_game/new_game.html?returnFromLoad=true');
            self.nextSceneUrl(self.lastSceneUrl());

            window.location.href = 'coui://ui/main/game/load_planet/load_planet.html?tabs=false&systems=true&planets=false&title=' + encodeURI('!LOC:Select System');
            return; /* window.location.href will not stop execution. */
        }

        self.choosePremadeSystem = function (index) {
            self.showSystemPicker(false);
            self.system(_.cloneDeep(self.defaultSystems()[index]));
            self.updateSystem(self.system());
            self.changeSettings();
            self.requestUpdateCheatConfig();
        };

        self.updateSystemInProgress = ko.observable(false);

        self.updateSystem = function (system) {

            self.send_message('modify_system', UberUtility.fixupPlanetConfig(system), function (success, reason) {
                if (success)
                    self.updateSystemInProgress(true);

                if (!success) {
                    self.chatMessages.push(new ChatMessageViewModel('server', 'server', 'Loading system failed: ' + reason));
                    self.chatMessages.push(new ChatMessageViewModel('server', 'server', 'Generating random system.'));
                }
            });
        }

        /* signal server to start building planets and start the game */
        self.startGame = function () {
            if (!self.startEnabled())
                return;

            if (self.gameIsNotOk())
                return;

            if (!self.allPlayersAreReady())
                return;

 // update invite if spectator slots available otherise reset to cancel invites
            if (self.emptySpectatorSlots() > 0) {
                self.sendLobbyStatus(loc('Started') + ' ' + self.lobbyFormat());
            }
            else {
                self.resetLobbyInfo();
            }

            api.audio.playSound('/SE/UI/UI_lobby_start_button');
            self.send_message('start_game', {
                countdown: 5
            });
        };

        self.toggleReady = function () {
            if (self.holdReady()) {
                return;
            }
            if (!self.showStartingGameCountdown()) {
                // Toggle predictively so we can recognize deliberate unready
                self.thisPlayerIsReady(!self.thisPlayerIsReady());

                self.send_message('toggle_ready');
            }
        };

        self.aiPersonalities = ko.observable( ai_types() ); /* from js/ai.js */

        self.aiPersonalityNames = ko.computed(function() {
            return _.keys(self.aiPersonalities());
        });

        self.previousAIPersonality = ko.observable('Normal').extend({ local: 'previousAIPersonality' });
        self.getAIPersonalityDescription = function(name) {
            return loc(_.get(self.aiPersonalities(), [name, 'display_name']));
        };

        self.aiLandingPolicyOptions = ko.observableArray(['no_restriction', 'on_player_planet', 'off_player_planet']);
        self.aiLandingPolicyDescriptions = ko.observable({
            'no_restriction': '!LOC:Start Anywhere',
            'on_player_planet': '!LOC:Start Nearby',
            'off_player_planet': '!LOC:Start Offworld'
        });
        self.getAILandingPolicyDescription = function (value) {
            return loc(self.aiLandingPolicyDescriptions()[value]);
        };

        self.previousAILandingPolicy = ko.observable(self.aiLandingPolicyOptions()[0]).extend({ local: 'previousAILandingPolicy' });

        self.targetAIArmyIndex = ko.observable();
        self.targetAISlotIndex = ko.observable();

        self.addAI = function (index) {
            var personality = self.aiPersonalities()[self.previousAIPersonality()];
api.debug.log(personality);
            model.send_message('add_ai', {
                army_index: self.targetAIArmyIndex(),
                slot_index: self.targetAISlotIndex(),
                options: { 'ai': true, 'personality': personality, 'landing_policy': self.previousAILandingPolicy() }
            });
        }

        self.system = ko.observable({});
        self.systemIsEmpty = ko.computed(function () {
            return !self.system() || _.isEmpty(self.system()) || !self.system().planets.length;
        });
        self.systemHasMultiPlanetSpawns = ko.computed(function () {
            var system = self.system();

            var count = _.filter(system.planets, function (element) {
                return element.starting_planet || element.planet.landingZonesPerArmy > 0;
            });

            return count.length > 1;
        });

        self.processSystemPlayersText = function (players) {
            if (!players)
                return '';
            var minPlayers = Math.max(players[0], 2);
            var maxPlayers = Math.max(players[1], 2);
            return (minPlayers !== maxPlayers) ? minPlayers + '-' + maxPlayers : minPlayers;
        };

        self.processSystemPlayersCSS =  function (players) {
            var slotCount = self.slots();

            if (!players)
                return 'valid';

            var ok =
                (!_.isFinite(players[0]) || slotCount >= players[0]) &&
                (!_.isFinite(players[1]) || slotCount <= players[1]);
            return ok ? 'valid' : 'invalid';
        };

        self.systemPlayerText = ko.computed(function() {
            var players = self.system().players;
            if (!players)
                return '';
            var minPlayers = Math.max(players[0], 2);
            var maxPlayers = Math.max(players[1], 2);
            return (minPlayers !== maxPlayers) ? minPlayers + '-' + maxPlayers : minPlayers;
        });

        self.systemPlayersCSS = ko.computed(function() {

            return self.processSystemPlayersCSS(self.system().players);

            var systemPlayers = (self.system().players || []);
            var slotCount = self.slots();
            var ok =
                (!_.isFinite(systemPlayers[0]) || slotCount >= systemPlayers[0]) &&
                (!_.isFinite(systemPlayers[1]) || slotCount <= systemPlayers[1]);
            return ok ? 'valid' : 'invalid';
        });

        self.planetTooltip = function(planet) {

            if (!planet) {
                return '';
            }

            var tooltip = '';
            var planetSpec = planet.planet;

            if (planetSpec) {
            
                if (planetSpec.radius) {
                    tooltip = tooltip + 'Radius: ' + planetSpec.radius + '<br />';
                }
                
                if (planetSpec.biome != 'gas') {
                    
                    if (planet.metal_spots_count) {
                        tooltip = tooltip + 'Custom Metal: ' + planet.metal_spots_count + '<br />';
                    } else {
                        tooltip = tooltip + 'Metal Clusters: ' + Math.round(planetSpec.metalClusters) + '<br />' + 'Metal Density: ' + Math.round(planetSpec.metalDensity) + '<br />';
                    }
                    
                    if (planet.planetCSG_count) {
                        tooltip = tooltip + 'Custom CSG: ' + planet.planetCSG_count + '<br />';
                    }

                    if (planet.landing_zones_count) {
                        tooltip = tooltip + 'Custom Landing: ' + planet.landing_zones_count + '<br />';
                    }
                }
            }

            return tooltip;
        }

        self.processPlanet = function(planet) {

            if (!planet) {
                return null;
            }

           var tooltip = self.planetTooltip(planet);

            var result = {
                biome: planet.planet && planet.planet.biome || '',
                start: planet.starting_planet,
                move_thrust: planet.required_thrust_to_move,
                tooltip: tooltip
            };
            return result;
        }

        self.processSystem = function (system) {
            if (_.isEmpty(system))
                return null;

            var planets = _.map(system.planets, self.processPlanet);

            var result = {
                name: system.name,
                planets: planets,
                playersText: self.processSystemPlayersText(system.players),
                playersCSS: self.processSystemPlayersCSS(system.players)
            };

            return result;
        };

        self.premadeSystems = ko.observableArray([]);

        self.preferredDefaultSystemNames = ko.observable({
            'Lock': true,
            'Clutch': true,
            'Crag': true,
            'Bedlam':true,
            'Pax': true
        });

        self.defaultSystems = ko.computed(function () {

            var list = _.filter(self.premadeSystems(), function (element) {
                return !!self.preferredDefaultSystemNames()[element.name];
            });

            return list;
        });
        self.firstPickRandomSystems = ko.computed(function () {

            var exclude = {
                'Pax': true
            };

            var list = _.reject(self.defaultSystems(), function (element) {
                return exclude[element.name];
            });

            return list;
        });

        self.processedDefaultSystems = ko.computed(function () {
            return _.map(self.defaultSystems(), self.processSystem);
        });
        self.processedSelectedSystem = ko.computed(function () {
// hide any planet tooltips to prevent ghosting
            $('div.section_content > div.tooltip').tooltip('hide');
            return self.processSystem(self.system());
        });

        function SystemGenerator(model) {
            var self = this;

            self.symmetricalOption = ko.observable(true);
            self.largeOption = ko.observable(false);

            self.templates = {
                arena: [
                    {
                        mass: 30000,
                        planet: [
                            { type: 'temperate_start', size: [0, 2] },
                            { type: 'desert_start', size: [0, 2] },
                            { type: 'ice_start', size: [0, 2] },
                            { type: 'lava_start', size: [0, 1] },
                            { type: 'tropical_start', size: [0, 1]}
                        ],
                        position_x: 25000,
                        position_y: 0,
                        required_thrust_to_move: 0,
                        starting_planet: true,
                        velocity_x: 0,
                        velocity_y: 140
                    }
                ],
                moon_race: [
                    {
                        mass: 30000,
                        planet: [
                           { type: 'temperate_start', size: [0, 2] },
                            { type: 'desert_start', size: [0, 2] },
                            { type: 'ice_start', size: [0, 2] },
                            { type: 'lava_start', size: [0, 1] },
                            { type: 'tropical_start', size: [0, 1]}
                        ],
                        position_x: 25000,
                        position_y: 0,
                        required_thrust_to_move: 0,
                        starting_planet: true,
                        velocity_x: 0,
                        velocity_y: 140
                    },
                    {
                        mass: 5000,
                        planet: [
                            { type: 'normal_moon', size: [0, 1] },
                            { type: 'lava_moon', size: [0, 1] },
                            { type: 'weird_moon', size: [0, 1] }
                        ],
                        position_x: 28000,
                        position_y: 0,
                        required_thrust_to_move: [1,3],
                        starting_planet: false,
                        velocity_x: 0,
                        velocity_y: 30
                    }
                ],
                harvest: [
                    {
                        mass: 30000,
                        starting_planet: true,
                        required_thrust_to_move: 0,
                        position_x: 32400,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: -40,
                        planet: [
                            { type: 'temperate_start', size: [0, 2] },
                            { type: 'desert_start', size: [0, 2] },
                            { type: 'ice_start', size: [0, 2] },
                            { type: 'lava_start', size: [0, 1] },
                            { type: 'tropical_start', size: [0, 1]}
                        ],
                    },
                    {
                        mass: 5000,
                        starting_planet: false,
                        required_thrust_to_move: [1, 3],
                        position_x: 14000,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: -180,
                        planet: [
                            { type: 'normal_moon', size: [0, 1] },
                            { type: 'lava_moon', size: [0, 1] },
                            { type: 'weird_moon', size: [0, 1] }
                        ],
                    },
                    {
                        mass: 50000,
                        starting_planet: false,
                        required_thrust_to_move: 0,
                        position_x: 28200,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: 130,
                        planet: { type: 'gas', size: 0 }
                    }
                ],
                metal: [
                     {
                         mass: 30000,
                         planet: { type: 'metal_start', size: 0 },
                         position_x: 25000,
                         position_y: 0,
                         required_thrust_to_move: 0,
                         starting_planet: true,
                         velocity_x: 0,
                         velocity_y: 140
                    },
                    {
                        mass: 5000,
                        planet: [
                            { type: 'temperate_start', size: 0 },
                            { type: 'desert_start', size: 0 },
                            { type: 'ice_start', size: 0 },
                            { type: 'lava_start', size: 0 },
                            { type: 'tropical_start', size: 0 }
                        ],
                        position_x: 28000,
                        position_y: 0,
                        required_thrust_to_move: 0,
                        starting_planet: false,
                        velocity_x: 0,
                        velocity_y: 140
                    },
                ],
                space: [
                    {
                        mass: 30000,
                        starting_planet: true,
                        required_thrust_to_move: 0,
                        position_x: 25400,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: 140,
                        planet: [
                            { type: 'temperate_start', size: [0, 2] },
                            { type: 'desert_start', size: [0, 2] },
                            { type: 'ice_start', size: [0, 2] },
                            { type: 'lava_start', size: [0, 1] },
                            { type: 'tropical_start', size: [0, 1]}
                        ]
                    },
                    {
                        mass: 5000,
                        starting_planet: false,
                        required_thrust_to_move: [1, 3],
                        position_x: 28000,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: 40,
                        planet: [
                            { type: 'normal_moon', size: [0, 1] },
                            { type: 'lava_moon', size: [0, 1] },
                            { type: 'weird_moon', size: [0, 1] }
                        ],
                    },
                    {
                        mass: 5000,
                        starting_planet: false,
                        required_thrust_to_move: [1, 3],
                        position_x: 29800,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: -10,
                        planet: [
                            { type: 'normal_moon', size: [0, 1] },
                            { type: 'lava_moon', size: [0, 1] },
                            { type: 'weird_moon', size: [0, 1] }
                        ],
                    },
                    {
                        mass: 5000,
                        starting_planet: false,
                        required_thrust_to_move: [1, 3],
                        position_x: 40200,
                        position_y: 0,
                        velocity_x: 0,
                        velocity_y: 110,
                        planet: [
                            { type: 'normal_moon', size: [0, 1] },
                            { type: 'lava_moon', size: [0, 1] },
                            { type: 'weird_moon', size: [0, 1] }
                        ],
                    }
                ]
            };

            self.templateNames = ko.observable(_.keys(self.templates));

            var MIN_RADIUS_SMALL = 250;
            var MAX_RADIUS_SMALL = 350;
            var MIN_RADIUS_LARGE = 400;
            var MAX_RADIUS_LARGE = 800;

            var MIN_METAL_CLUSTERS = 0;
            var MIN_METAL_DENSITY = 30;

            var LOW_METAL_CLUSTERS = 0;
            var LOW_METAL_DENSITY = 45;

            var AVG_METAL_CLUSTERS = 50;
            var AVG_METAL_DENSITY = 50;

            var MAX_METAL_CLUSTERS = 65;
            var MAX_METAL_DENSITY = 70;

            var MIN_RANDOM_SEED = 1;
            var MAX_RANDOM_SEED = 4294967295;

            var generateRandomSeed = function () {
                var min = MIN_RANDOM_SEED,
                    max = MAX_RANDOM_SEED;
                return Math.floor(Math.random() * (max - min)) + min;
            };

            self.planets = {
                temperate_start: [
                    { /* small temperate */
                        biome: 'earth',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [MIN_RADIUS_LARGE, 550],
                        seed: generateRandomSeed(),
                        temperature: [60, 100],
                        waterHeight: [35, 45],
                        waterDepth: 100,
                    },
                    { /* med temperate */
                         biome: 'earth',
                         biomeScale: 50,
                         heightRange: [10, 30],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [500, 650],
                         seed: generateRandomSeed(),
                         temperature: [35, 40],
                         waterHeight: [35, 45],
                         waterDepth: 100,
                    },
                    { /* naval temperate */
                         biome: 'earth',
                         biomeScale: 50,
                         heightRange: [20, 40],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [550, 650],
                         seed: generateRandomSeed(),
                         temperature: [35, 40],
                         waterHeight: [45, 60],
                         waterDepth: 100,
                    },
                    { /* large temperate */
                        biome: 'earth',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [650, MAX_RADIUS_LARGE],
                        seed: generateRandomSeed(),
                        temperature: [35, 40],
                        waterHeight: [35, 45],
                        waterDepth: 100,
                    }
                ],

                desert_start: [
                    { /* small desert */
                        biome: 'desert',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [MIN_RADIUS_LARGE, 550],
                        seed: generateRandomSeed(),
                        temperature: [100, 100],
                        waterHeight: [20, 45],
                        waterDepth: 100,
                    },
                    { /* med desert */
                         biome: 'desert',
                         biomeScale: 50,
                         heightRange: [10, 30],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [500, 650],
                         seed: generateRandomSeed(),
                         temperature: [100, 100],
                         waterHeight: [20, 45],
                         waterDepth: 100,
                    },
                    { /* naval desert */
                         biome: 'desert',
                         biomeScale: 50,
                         heightRange: [20, 40],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [550, 650],
                         seed: generateRandomSeed(),
                         temperature: [100, 100],
                         waterHeight: [45, 60],
                         waterDepth: 100,
                    },
                    { /* large desert */
                        biome: 'desert',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [650, MAX_RADIUS_LARGE],
                        seed: generateRandomSeed(),
                        temperature: [100, 100],
                        waterHeight: [20, 45],
                        waterDepth: 100,
                    }
                ],

                ice_start: [
                    { /* small ice */
                        biome: 'earth',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [MIN_RADIUS_LARGE, 550],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: [20, 45],
                        waterDepth: 100,
                    },
                    { /* med ice */
                         biome: 'earth',
                         biomeScale: 50,
                         heightRange: [10, 30],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [500, 650],
                         seed: generateRandomSeed(),
                         temperature: 0,
                         waterHeight: [20, 45],
                         waterDepth: 100,
                    },
                    { /* naval ice */
                         biome: 'earth',
                         biomeScale: 50,
                         heightRange: [20, 40],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [550, 650],
                         seed: generateRandomSeed(),
                         temperature: 0,
                         waterHeight: [45, 60],
                         waterDepth: 100,
                    },
                    { /* large ice */
                        biome: 'earth',
                        biomeScale: 50,
                        heightRange: [10, 30],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [650, MAX_RADIUS_LARGE],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: [20, 45],
                        waterDepth: 100,
                    }
                ],

                tropical_start: [
                    { /* small tropical */
                        biome: 'tropical',
                        biomeScale: 50,
                        heightRange: [20, 40],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [MIN_RADIUS_LARGE, 550],
                        seed: generateRandomSeed(),
                        temperature: [60, 100],
                        waterHeight: [40, 60],
                        waterDepth: 100,
                    },
                    { /* med tropical */
                         biome: 'tropical',
                         biomeScale: 50,
                         heightRange: [20, 40],
                         metalClusters: AVG_METAL_CLUSTERS,
                         metalDensity: AVG_METAL_DENSITY,
                         radius: [500, 650],
                         seed: generateRandomSeed(),
                         temperature: [60, 100],
                        waterHeight: [40, 60],
                         waterDepth: 100,
                    },
                    { /* large tropical */
                        biome: 'tropical',
                        biomeScale: 50,
                        heightRange: [20, 40],
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [650, MAX_RADIUS_LARGE],
                        seed: generateRandomSeed(),
                        temperature: [60, 100],
                        waterHeight: [40, 60],
                        waterDepth: 100,
                    }
                ],

                lava_start: [
                   { /* small lava */
                       biome: 'lava',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [AVG_METAL_CLUSTERS, MAX_METAL_CLUSTERS],
                       metalDensity: [AVG_METAL_DENSITY, MAX_METAL_CLUSTERS],
                       radius: [MIN_RADIUS_LARGE, 550],
                       seed: generateRandomSeed(),
                       temperature: 100,
                       waterHeight: 35,
                       waterDepth: 0,
                   },
                   { /* med lava */
                       biome: 'lava',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [AVG_METAL_CLUSTERS, MAX_METAL_CLUSTERS],
                       metalDensity: [AVG_METAL_DENSITY, MAX_METAL_CLUSTERS],
                       radius: [550, 650],
                       seed: generateRandomSeed(),
                       temperature: 0,
                       waterHeight: [40, 45],
                       waterDepth: 0,
                   },
                   { /* large lava */
                       biome: 'lava',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [AVG_METAL_CLUSTERS, MAX_METAL_CLUSTERS],
                       metalDensity: [AVG_METAL_DENSITY, MAX_METAL_CLUSTERS],
                       radius: [650, MAX_RADIUS_LARGE],
                       seed: generateRandomSeed(),
                       temperature: 100,
                       waterHeight: [40, 45],
                       waterDepth: 0,
                   },
                ],

                normal_moon: [
                    { /* tiny */
                        biome: 'moon',
                        biomeScale: 50,
                        heightRange: [0, 5],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [MIN_RADIUS_SMALL, 275],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                    { /* small */
                        biome: 'moon',
                        biomeScale: 50,
                        heightRange: [0, 10],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [275, 325],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                    { /* medium */
                        biome: 'moon',
                        biomeScale: 50,
                        heightRange: [0, 10],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [325, MAX_RADIUS_SMALL],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                ],
                lava_moon: [
                    { /* tiny */
                        biome: 'lava',
                        biomeScale: 50,
                        heightRange: [0, 10],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [MIN_RADIUS_SMALL, 275],
                        seed: generateRandomSeed(),
                        temperature: 100,
                        waterHeight: [35, 40],
                        waterDepth: 0,
                    },
                    { /* small */
                        biome: 'lava',
                        biomeScale: 50,
                        heightRange: [0, 15],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [275, 325],
                        seed: generateRandomSeed(),
                        temperature: [40, 80],
                        waterHeight: [35, 45],
                        waterDepth: 0,
                    },
                    { /* medium */
                        biome: 'lava',
                        biomeScale: 50,
                        heightRange: [0, 20],
                        metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                        metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                        radius: [325, 375],
                        seed: generateRandomSeed(),
                        temperature: [40, 80],
                        waterHeight: [35, 50],
                        waterDepth: 0,
                    }
                ],
                weird_moon: [
                   { /* tiny */
                       biome: 'tropical',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                       metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                       radius: [MIN_RADIUS_SMALL, 275],
                       seed: generateRandomSeed(),
                       temperature: 0,
                       waterHeight: [25, 35],
                       waterDepth: 0,
                   },
                   { /* small forest moon */
                       biome: 'tropical',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                       metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                       radius: [275, 325],
                       seed: generateRandomSeed(),
                       temperature: [100],
                       waterHeight: 30,
                       waterDepth: 0,
                   },

                   { /* medium */
                       biome: 'desert',
                       biomeScale: 50,
                       heightRange: [10, 30],
                       metalClusters: [MIN_METAL_CLUSTERS, AVG_METAL_CLUSTERS],
                       metalDensity: [MIN_METAL_DENSITY, AVG_METAL_DENSITY],
                       radius: [325, 375],
                       seed: generateRandomSeed(),
                       temperature: 0,
                       waterHeight: [0, 20],
                       waterDepth: 0,
                   },
                ],
                metal_start: [
                    { /* large */
                        biome: 'metal',
                        biomeScale: 50,
                        heightRange: 0,
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: 500,
                        seed: generateRandomSeed(),
                        temperature: [40, 80],
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                    { /* large */
                        biome: 'metal',
                        biomeScale: 50,
                        heightRange: 0,
                        metalClusters: AVG_METAL_CLUSTERS,
                        metalDensity: AVG_METAL_DENSITY,
                        radius: [600, 800],
                        seed: generateRandomSeed(),
                        temperature: 0,
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                ],
                gas: [
                    { /* medium */
                        biome: 'gas',
                        biomeScale: 50,
                        heightRange: 0,
                        metalClusters: 0,
                        metalDensity: 0,
                        radius: [1000, 1200],
                        seed: generateRandomSeed(),
                        temperature: [0, 75],
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                    { /* large */
                        biome: 'gas',
                        biomeScale: 50,
                        heightRange: 0,
                        metalClusters: 0,
                        metalDensity: 0,
                        radius: [1400, 1600],
                        seed: generateRandomSeed(),
                        temperature: [25, 100],
                        waterHeight: 0,
                        waterDepth: 0,
                    },
                ]
            };

            var sampleRange = function (range) {
                if (_.isString(range))
                    return range;

                if (range.length > 2)
                    return _.sample(range);

                if (range.length == 2) {
                    if (_.isNumber(range[0]) && _.isNumber(range[1]))
                        return _.random(range[0], range[1]);
                    else
                        return _.sample(range);
                }

                if (range.length == 1)
                    return range[0];

                return range;
            }

            var createPlanet = function (description) {

                var result = _.cloneDeep(self.planets[description.type][description.size]);
                result = _.mapValues(result, sampleRange);
                return result;
            };

            /* this behavior should be wrapped into an UberUtility function, eventually */
            var pending = 0;
            var wait = $.Deferred();

            var watch = function (request) {
                pending = pending + 1;

                var deferred = $.Deferred();
                request.then(function (value) {
                    deferred.resolve(value);
                    pending = pending - 1;
                    if (pending === 0) {
                        wait.resolve(true);
                        wait = $.Deferred();
                    }
                });

                return deferred.promise();
            }

            var createSpec = function (description) {
                var result = _.mapValues(_.cloneDeep(description), sampleRange);
                result.name = '';

                var request = api.game.getRandomPlanetName();
                watch(request).then(function (name) {
                    result.name = name;
                });

                var planet_description = _.mapValues(sampleRange(result.planet), sampleRange);

                if (self.largeOption())
                    planet_description.size = planet_description.size + 1;

                result.planet = createPlanet(planet_description);

                if (result.starting_planet) {
                    if (self.symmetricalOption()) {
                        result.planet.symmetricalMetal = !!self.symmetricalOption();
                        result.planet.symmetricalStarts = !!self.symmetricalOption();
                        result.planet.symmetryType = self.symmetricalOption() ? 'terrain and CSG' : 'none';
                    }
                }

                return result;
            };

            var createSystem = function (name) {

                var result = {
                    name: '',
                    planets: []
                }

                var request = api.game.getRandomPlanetName();
                watch(request).then(function (name) {
                    result.name = name;
                });

                var template = self.templates[name];
                result.planets = _.map(template, createSpec);

                return result;
            }

            self.createdRandomSystems = ko.observable();

            self.createRandomSystems = function () {
                var result = _.map(self.templateNames(), createSystem);
                wait.then(function () {
                    self.createdRandomSystems(result);
                });
            };

            var createRandomSystemsRule = ko.computed(function () {
                self.symmetricalOption();
                self.largeOption();

                self.createRandomSystems();
            });

            self.processedRandomSystems = ko.computed(function () {
                return _.map(self.createdRandomSystems(), model.processSystem);
            });
        };

        self.systemGenerator = new SystemGenerator(self);

        self.showSystemPicker = ko.observable(false);

        self.loadedSystem = ko.observable({}).extend({ session: 'loaded_system' });
        self.loadedSystemIsEmpty = ko.computed(function () { return _.isEmpty(self.loadedSystem()); });

        self.loadedSystemIsCustom = ko.observable(false).extend({ session: 'loaded_system_is_custom' });
        var loadedSystemIsCustomRule = ko.computed(function (value) {
            if (!self.loadedSystemIsCustom())
                return;

            api.tally.incStatInt('custom_systems_used');
            _.defer(function () { self.loadedSystemIsCustom(false); });
        });

        self.planetBiomes = ko.computed(function () {
            if (!self.system() || !self.system().planets)
                return [];

            var ok = true;
            var result = _.map(self.system().planets, function (element) {
                if (element && element.planet && element.planet.biome)
                    return element.planet.biome;
                ok = false;
                return null;
            });

            return ok ? result : [];
        });

        self.biomes = ko.observableArray(['earth', 'moon', 'tropical', 'lava', 'metal', 'desert', 'gas']);
        self.moonBiomes = ko.observableArray(['earth', 'moon', 'tropical', 'lava', 'desert']);
        self.asteroidBiomes = ko.observableArray(['moon', 'lava']);

        self.loadRandomSystem = function () {

            if (!self.premadeSystems().length)
                return;

            self.system(_.cloneDeep(_.sample(self.firstPickRandomSystems())));
            self.updateSystem(self.system());
            self.changeSettings();
            self.requestUpdateCheatConfig();
        };

        self.chooseRandomSystem = function (index) {
            self.showSystemPicker(false);
            self.system(self.systemGenerator.createdRandomSystems()[index]);
            self.updateSystem(self.system());
            self.changeSettings();
        };

        self.imageSourceForPlanet = function (planet) {

            var ice = planet.biome === 'earth' && planet.temperature <= -0.5;
            var s = (ice) ? 'ice' : planet.biome;
            s = (s) ? s : 'unknown';

            return 'coui://ui/main/shared/img/' + s + '.png';
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

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

// always return to start via transit for community mods reset
        self.navToStart = function () {
            self.resetGameInfo();
            self.transitPrimaryMessage(loc('!LOC:Returning to Main Menu'));
            self.transitSecondaryMessage('');
            self.transitDestination('coui://ui/main/game/start/start.html');
            self.transitDelay(0);
            window.location.href = 'coui://ui/main/game/transit/transit.html';
            return; /* window.location.href will not stop execution. */
        };

        self.cancel = function () {
            self.navToStart();
        };

        self.colors = ko.observable([]);
        self.secondaryColors = function (slot) {
            var result = self.colors()[slot.colorIndex()];
            return result ? result.secondary : [];
        };

        self.showColorPicker = ko.observable(false);
        self.showSecondaryColorPicker = ko.observable(false);
        self.colorPickerSlot = ko.observable(null);
        self.showColorPickerForSlot = function (slot) {
            return slot === self.colorPickerSlot();
        };
        self.toggleColorPickerSlot = function (slot, secondary) {
            if (self.colorPickerSlot() === null)
                self.colorPickerSlot(slot);
            else
                self.colorPickerSlot(null);

            self.showColorPicker(self.colorPickerSlot() !== null);
            self.showCommanderPicker(false);

            if (secondary)
                self.showSecondaryColorPicker(self.showColorPicker());
            else
                self.showSecondaryColorPicker(false);
        };

        self.showCommanderPicker = ko.observable(false);
        self.toggleCommanderPicker = function () {
            self.showCommanderPicker(!self.showCommanderPicker());
            model.showColorPicker(false);
            model.colorPickerSlot(null);
        };

        self.closeDropDowns = function () {
            self.showColorPicker(false);
            self.showCommanderPicker(false);
        }

        // deprecated
        self.activeModTextArray = ko.observableArray([]);
        self.activeCheatTextArray = ko.observableArray([]);
        //

        self.serverMods = ko.observableArray();
        self.gameCheats = ko.observableArray();
        
        self.hasServerMods = ko.computed(function() {
            return self.serverMods().length > 0;
        });

        self.hasGameCheats = ko.computed(function() {
            return self.gameCheats().length > 0;
        });
        
        self.modDataSent = ko.observable(false);
        self.cheatAllowChangeVision = ko.observable(false).extend({ session: 'cheat_allow_change_vision' });
        self.cheatAllowChangeControl = ko.observable(false).extend({ session: 'cheat_allow_change_control' });
        self.cheatAllowCreateUnit = ko.observable(false).extend({ session: 'cheat_allow_create_unit' });
        self.cheatAllowModDataUpdates = ko.observable(false).extend({ session: 'cheat_allow_mod_data_updates' });

        self.setCheatsFromCheatConfig = function(config) {
            self.cheatAllowChangeVision(config.cheat_flags.allow_change_vision);
            self.cheatAllowChangeControl(config.cheat_flags.allow_change_control);
            self.cheatAllowCreateUnit(config.cheat_flags.allow_create_unit);
            self.cheatAllowModDataUpdates(config.cheat_flags.allow_mod_data_updates);
            self.updateActiveModAndCheatText();
        }

        self.requestUpdateCheatConfig = function () {
            self.send_message('request_cheat_config', {}, function (success, response) {
                if (success)
                    model.setCheatsFromCheatConfig(response.cheat_config);
            });
        }

        // deprecated
        self.updateActiveModAndCheatText = function () {
        }

        self.updateMountedServerMods = function () {
            api.mods.getMounted("server", true).then(function (mods) {
                if (mods) {

// even though we have gameModIdentifiers from beacon, etc we will update here

                    var identifiers = [];

                    mods = _.map(mods, function(mod) {
                        if (!mod.description || ! mod.description.trim()) {
                            mod.description = '';
                        }
                        identifiers.push(mod.identifier);
                        return mod;
                    });
                    model.gameModIdentifiers(identifiers);
                    model.serverMods(mods);
                    model.activeModTextArray(_.pluck(mods, 'display_name'));
                }
            });
        }
 
        self.updateActiveCheatText = function () {
            var cheats = [];
            if (self.cheatAllowChangeControl()) cheats.push("Allow Change Control");
            if (self.cheatAllowChangeVision()) cheats.push("Allow Change Vision");
            if (self.cheatAllowCreateUnit()) cheats.push("Allow Create Unit");
            if (self.cheatAllowModDataUpdates()) cheats.push("Allow Mod Data Updates");
            self.activeCheatTextArray(cheats);
            self.gameCheats(cheats);
        }

        self.updateActiveCheatText();

        self.showCommanderCinematic = ko.observable(false);

        self.cinematicState = ko.computed(function() {
            if (!self.showCommanderCinematic())
                return {};

            return {
                animate: true,
                teams: _.invoke(self.armies(), 'cinematicInfo')
            };
        });
        self.cinematicState.subscribe(function() {
            api.panels.cinematic && api.panels.cinematic.message('state', self.cinematicState());
            _.delay(api.Panel.update);
        });

        // allow this to be moddable

        self.setupAISkirmish = function() {
            if (!self.pushAIButton() || !self.isGameCreator() || self.armies().length < 2) {
                return;
            }

            api.debug.log('setupAISkirmish');
            if (self.armies()[1].slots()[0].isEmpty()) {
                self.targetAIArmyIndex(1);
                self.targetAISlotIndex(0);
                self.addAI();
            }
        };

        self.checkAISkirmish = ko.computed(function() {
            if (!self.pushAIButton() || !self.isGameCreator() || self.armies().length < 2) {
                return;
            }

            self.setupAISkirmish();

            self.pushAIButton(false);

        });

        var passwordRevealed = ko.observable(false);
        self.togglePasswordReveal = function() {
            passwordRevealed(!passwordRevealed());
        };
        self.passwordInputType = ko.pureComputed(function() {
            if (passwordRevealed())
                return "text";
            else
                return "password";
        });

        var localServerRecommended = ko.observable().extend({ session: 'local_server_recommended' });
        var offlineNotRecommendedDismissed = ko.observable(false).extend({ session: 'offline_not_recommended_warning_dismissed' });
        self.showOfflineNotRecommended = ko.pureComputed(function() { return self.isLocalGame() && !localServerRecommended() && !offlineNotRecommendedDismissed(); });
        self.dismissOfflineNotRecommended = function() { offlineNotRecommendedDismissed(true); };

        self.resetLobbyInfo = function() {
            api.Panel.message('uberbar', 'lobby_info', undefined);            
        };

        self.resetGameInfo = function() {
            self.reconnectToGameInfo(undefined);
            self.resetLobbyInfo();           
        };

        self.privateGamePassword.subscribe( function(password) {
            api.Panel.message( 'uberbar', 'lobby_password', { password: password } );
        });

        self.lobbyFormat = ko.computed( function() {

            var format = '';

            try {

                var gameType = self.gameType();
                var isTeamGame = self.isTeamGame();
                var players = self.playerCount();
                var armies = self.armies();    

                switch ( gameType ) {
                    case 'FreeForAll': gameType = 'FFA'; break;
                    case 'TeamArmies': gameType = 'Team'; break;
                    case 'Galactic War': gameType = 'GW'; break;
                    case 'Ladder1v1': gameType = 'Ranked'; break;
                }

                if ( players > 1 )
                {
                    if ( players == 2 )
                    {
                        format = '1v1';
                        
                        if ( gameType == 'Ranked' )
                        {
                            format = format + ' ' + gameType;
                        }
                    }
                    else
                    {
                        format = players + ' ' + gameType;
                    }
                
                    var shared = false;
                    
                    if ( isTeamGame )
                    {   
                        var counts = [];
                        
                        _.forEach( armies, function( army )
                        {
                            counts.push( army.slots().length );
                            
                            if ( ! army.alliance() )
                            {
                                shared = true;
                            }
                        });
                        
                        if ( players > 2 )
                        {
                            format = counts.join( 'v' ) + ' ' + ( shared ? 'shared' : 'unshared' );
                        }
                    }
                
                }
            }
            catch ( e ) {
                console.error( JSON.stringify( e ) );
            }

            return format;

        }).extend({
            rateLimit: 1000
        });

        self.lobbyStatus = ko.computed( function() {

            var status = '';

            try
            {

                var format = self.lobbyFormat();

                if ( !format ) {
                    return '';
                }

                var isGameCreator = self.isGameCreator();
                var requiredContent = self.requiredContent();
                var players = self.playerCount();
                var emptySlots = self.numberOfEmptySlots();

                var items = [];

                items.push( isGameCreator ? 'Hosting' : 'Joined' );

                if ( ! requiredContent ) {
                    items.push('classic');
                }

                items.push(format);

                if (emptySlots == 0) {
                    items.push( '(full)' );
                }
                else if ( players > 2 && emptySlots > 0 ) {
                    items.push('(' + emptySlots + ' more)');
                }

                var status = items.join(' ');

                self.sendLobbyStatus(status);

            }
            catch ( e ) {
                console.error( JSON.stringify( e ) );
            }

            return status;

        }).extend({
            rateLimit: 1000
        });

        self.sendLobbyStatus = function(status) {
            api.Panel.message( 'uberbar', 'lobby_status', { status: status } );
        }

// update the timestamp in reconnect to game info every minute
        self.updateReconnectToGameInfoTimestamp = function() {
            var reconnectToGameInfo = self.reconnectToGameInfo();
            if (!reconnectToGameInfo) {
                return;
            }
            reconnectToGameInfo.timestamp = Date.now();
            self.reconnectToGameInfo.valueHasMutated();
            setTimeout(self.updateReconnectToGameInfoTimestamp, 60*1000);
        }
        self.updateReconnectToGameInfoTimestamp();
        
        self.jsonMessageHandlers = {}
        
        self.registerJsonMessageHandler = function(identifier, handler, priority) {
            if (!identifier || !handler) {
                return false;
            }
            var registeredJsonMessageHandlers = self.jsonMessageHandlers[identifier];

            if (!registeredJsonMessageHandlers) {
                registeredJsonMessageHandlers = [];
                self.jsonMessageHandlers[identifier] = registeredJsonMessageHandlers;
            }

            registeredJsonMessageHandlers.push({ handler: handler, priority: priority || 100});

            return true;
        };

        self.unregisterJsonMessageHandler = function(identifier, handler) {
            if (!identifier || !handler) {
                return false;
            }
            var registeredJsonMessageHandlers = self.jsonMessageHandlers[identifier];

            if (!registeredJsonMessageHandlers) {
                return false;
            }

            var found = false;

            _.remove(registeredJsonMessageHandlers, function(registeredJsonMessageHandler) {
                var remove = registeredJsonMessageHandler.handler === handler;
                if (remove) {
                    found = true;
                }
                return remove;
            });

            return found;
        };

        self.sendJsonMessage = function(payload) {
            if (!payload.identifier) {
                return false;
            }
            model.send_message("json_message", payload);
        }

        self.requestChatHistory = function() {
            model.send_message("chat_history", {}, function(sucesss, response) {
                if (sucesss && response && response.chat_history) {
                    _.forEach(response.chat_history, function(msg) {
                        model.chatMessages.push(new ChatMessageViewModel(msg.player_name, 'lobby', msg.message));
                    });
                }
            });
        }
    }

    model = new NewGameViewModel();

    handlers = {};

    handlers.game_config = function (payload) { /* deprecated. */
        /* ignore if we created the game, since it is just an echo */
        if (model.isGameCreator() || _.isEmpty(payload))
            return;

        model.createdGameDesc(payload);
    }

    handlers.chat_message = function (msg) {
        model.chatMessages.push(new ChatMessageViewModel(msg.player_name, 'lobby', msg.message));
    };

    handlers.json_message = function (jsonMsg) {
 api.debug.log(JSON.stringify(jsonMsg));
        var payload = jsonMsg.payload;
        if (!payload) {
            return;
        }
        var identifier = payload.identifier;
        if (!identifier) {
            return;
        }
        var handlers = model.jsonMessageHandlers[identifier];
        if (handlers) {
            try {
                _.forEach(handlers, function(handlerObj) {
                    var handler = handlerObj.handler;
                    if (_.isFunction(handler)) {
                        handler(jsonMsg);
                    }
                });
            }
            catch (e) {
                console.trace(e);
            }
        }
    };

    handlers.remove_disconnected_player = function(payload) {
        if (payload && payload.ticket) {
            $.ajax(api.net.ubernetUrl() + '/GameAcquisition/RemovePlayerFromGame', {
                type: 'POST',
                contentType:'application/json; charset=utf-8',
                dataType: 'json',
                data: '',
                beforeSend: function(request) {
                    request.setRequestHeader('X-Authorization', payload.ticket);
                }
            });
        }
    }

    handlers.event_message = function (payload) {
        switch (payload.type) {
            case 'countdown':
                model.showCommanderCinematic(true);

                if (Number(payload.message) === 1)
                    api.audio.playSound('/SE/UI/UI_lobby_count_down_last');
                else if (Number(payload.message) > 1)
                    api.audio.playSound('/SE/UI/UI_lobby_count_down');

                model.startingGameCountdown(Number(payload.message))
                break;

            case 'settings':
                api.debug.log(payload);
                var msg = payload.message.charAt(0).toUpperCase() + payload.message.slice(1);
                model.chatMessages.push(new ChatMessageViewModel('server', 'settings', msg));
                break;

            default:
                model.chatMessages.push(new ChatMessageViewModel('server', 'server', payload.target + payload.message));
                break;
        }
    };

    handlers.colors = function (payload) {
        var fn = function (color) {
            return 'rgb(' + color.join() + ')';
        };

        var result = _.map(payload, function (element) {
            return {
                taken: element.taken,
                color: fn(element.primary),
                secondary: _.map(element.secondary, fn)
            };
        });

        model.colors(result);
    }
    var prev_players = {};
    handlers.players = function (payload, force) {
        prev_players = payload;

        var orphans = [];
        var contacts = [];

        _.invoke(model.armies(), 'dirtySlots');

        var ready = true;

        _.forEach(payload, function (element) {
            if (element.creator && element.name === model.displayName()) {
                model.isGameCreator(true);

                if (!model.modDataSent()) {
                    model.send_message('mod_data_available', {}, function (success, response) {
                        api.debug.log('mod_data_available');
                        if (success) {
                            api.debug.log('server mods uploading');
                            model.serverModsState('uploading');
                            api.mods.sendModFileDataToServer(response.auth_token).then( function(data) {
                                api.debug.log('server mods uploaded');
                                api.debug.log(data);
                            });
                        }
                        else {
// a refresh, selecting system or settings clears everything
                            api.debug.log(response);
                            if( !model.serverModsState()) {
                                model.serverModsState('mounted');
                                model.updateMountedServerMods();
                            }                        }
                    });
                    model.modDataSent(true);
                }
            }
            else
            {
// non hosts already have server mods mounted during connect
                if( !model.serverModsState()) {
                    model.serverModsState('mounted');
                    model.updateMountedServerMods();
                }
            }

            if (element.name === model.displayName()) {
                if (!element.ready && model.thisPlayerIsReady()) {
                    api.audio.playSound('/SE/UI/UI_lobby_made_unready');
                }
                model.thisPlayerIsReady(element.ready);
            }

            if (element.army_index !== -1 && model.armies().length > element.army_index) {
                model.armies()[element.army_index].addPlayer(element.slot_index, element);

                if (!element.creator && !element.ai && (!element.ready || element.loading))
                    ready = false;
            }
            else
                orphans.push(element);

            contacts.push(element.id);
        });

        _.invoke(model.armies(), 'cleanupSlots');
        model.playersWithoutArmies(orphans);
        model.spectators(orphans);
        model.lobbyContacts(contacts);

        model.allPlayersAreReady(ready);
    }

    /* from server_state.data.armies */
    handlers.armies = function (payload, force) {
        while (model.armies().length > payload.length)
            model.armies.pop();

        _.forEach(model.armies(), function (army, index) {
            army.updateFromJson(payload[index]);
        });

        while (model.armies().length < payload.length)
            model.armies.push(new ArmyViewModel(model.armies().length, payload[model.armies().length]));

        handlers.players(prev_players);
    }

    handlers.control = function (payload) {
        if (!payload.has_first_config && model.isGameCreator())
            model.resetArmies();

        model.serverLoading(payload.has_first_config && !payload.sim_ready);
        if (payload.system_ready)
            model.updateSystemInProgress(true);
    };

    handlers.settings = function (payload) {
        model.isFriendsOnlyGame(!!payload.friends);
        model.isPublicGame(!!payload.public);
        model.requiredContent(payload.required_content);

        if ( payload.max_players )
            model.maxPlayersLimit( payload.max_players );

        if ( payload.max_spectators )
            model.maxSpectatorsLimit( payload.max_spectators );

        model.spectatorLimitLock(true);
        model.spectatorLimit(payload.spectators);
        model.spectatorLimitLock(false);

        model.tagLock(true);
        model.tag(payload.tag);
        model.tagLock(false);

        model.gameNameLock(true);
        model.gameName(payload.game_name);
        model.gameNameLock(false);

        model.dynamicAlliances(payload.game_options ? !!payload.game_options.dynamic_alliances : false);
        model.dynamicAllianceVictory(payload.game_options ? !!payload.game_options.dynamic_alliance_victory : false);

        if (_.has(payload, 'game_options'))
        {
            model.bountyModeLock(true);
            model.bountyMode(!!payload.game_options.bounty_mode);
            model.bountyModeLock(false);
        }

        if (_.has(payload, 'game_options') && _.has(payload.game_options, 'bounty_value'))
        {
            model.bountyValueLock = true;
            model.bountyValue(payload.game_options.bounty_value);
            model.bountyValueLock = false;
        }
        model.sandbox(payload.game_options ? !!payload.game_options.sandbox : false);
        if (payload.game_options)
            model.gameType(payload.game_options.game_type);

        model.listenToSpectators(payload.game_options ? payload.game_options.listen_to_spectators : false);
        model.landAnywhere(payload.game_options ? payload.game_options.land_anywhere : false);

        model.requestUpdateCheatConfig();
    };

    handlers.system = function (payload) {
        var unfixedSystem = UberUtility.unfixupPlanetConfig(payload);
        model.system(unfixedSystem);
    };

    handlers.server_state = function (payload) {
        if (payload.url && !window.location.href.startsWith(payload.url))
        {
            // Transitioning can take a little while.  Don't show a dirty page while we do that.
            $('body').hide();
            window.location.href = payload.url;
            return; /* window.location.href will not stop execution. */
        }

        if (payload.data) {
            handlers.armies(payload.data.armies, true);
            handlers.players(payload.data.players, model.armies().length !== 0);
            handlers.colors(payload.data.colors);
            handlers.control(payload.data.control);
            handlers.settings(payload.data.settings);
            handlers.system(payload.data.system);
        }
    };

    handlers.connection_disconnected = function (payload) {
        if (model.userTriggeredDisconnect())
            return;
        model.resetLobbyInfo();
        model.transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));
        model.transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
        model.transitDestination('coui://ui/main/game/start/start.html');
        model.transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
        return; /* window.location.href will not stop execution. */
    }

    handlers.friends = function (payload) {
        model.friends(payload);
    }

    handlers.blocked = function (payload) {
        model.blocked(payload);
    }

// server mods have been updated by host using allow mod updates cheat
    handlers.downloading_mod_data = function(payload) {
        api.debug.log("server mods downloading: " + JSON.stringify(payload));
        if (_.size(payload) > 0) {
            model.serverMods(payload);
        }
        model.serverModsState('downloading');
    }

// server mods have been downloaded for host or updated by host using allow mod updates cheat
    handlers.mount_mod_file_data = function (payload) {
        api.debug.log("server mods downloaded... mounting: " + JSON.stringify(payload));
        model.serverModsState('mounting');
        api.mods.mountModFileData().always(function() {
            api.debug.log("server mods mounted " + JSON.stringify(payload));
            model.serverModsState('mounted');
        });
    }

// server mods have been mounted for host or updated by host using allow mod updates cheat
    handlers.server_mod_info_updated = function (payload) {
        api.debug.log("server mods updated " + JSON.stringify(payload));
        model.updateMountedServerMods();
        CommanderUtility.update().always(function() {
            // allow other promises to complete first
            _.defer(model.updateCommanders);
        });
        api.panels.cinematic && api.panels.cinematic.message('update_commanders');
    }

    handlers.set_cheat_config = function (payload) {
        model.setCheatsFromCheatConfig(payload);
    }
    handlers['panel.invoke'] = function(params) {
        var fn = params[0];
        var args = params.slice(1);
        return model[fn] && model[fn].apply(model, args);
    };

    // inject per scene mods
    if (scene_mod_list['new_game'])
        loadMods(scene_mod_list['new_game']);

    app.registerWithCoherent(model, handlers);

    api.Panel.message('uberbar', 'request_friends');
    api.Panel.message('uberbar', 'request_blocked');

    model.lastSceneUrl('coui://ui/main/game/start/start.html');

    // Activates knockout.js
    ko.applyBindings(model);

    $("#radio").buttonset();

    $('body').keydown(
        function (event) {
            if (event.keyCode === keyboard.esc)
            {
                if (model.chatSelected())
                    model.chatSelected(false);
            }
            else if (event.keyCode === keyboard.enter)
            {
                if (model.chatSelected())
                    $(".chat_input_form").submit();

                model.chatSelected(true);
            }
        }
    );

    app.hello(handlers.server_state, handlers.connection_disconnected);

    if (model.tryToSpectate()) {
        model.leaveArmy({ force: true });
        model.tryToSpectate(false);
    }

    /* maybe use loaded system */
    if (!model.loadedSystemIsEmpty()) {
        model.system(model.loadedSystem());
        model.updateSystem(model.system());
        model.loadedSystem({});
    }

    model.requestUpdateCheatConfig();

    model.requestChatHistory();

    // Note: Loading is tested every 500ms.  Instead of using setInterval,
    // however, this uses repeating delays in order to avoid having multiple
    // calls to arePlanetsReady() in flight at a time.
    var testLoading = function () {
        var worldView = api.getWorldView(0);
        if (worldView) {
            worldView.arePlanetsReady().then(function (ready) {
                model.clientLoading(!ready);
                _.delay(testLoading, 500);
            });
        }
        else
            _.delay(testLoading, 500);
    };
    testLoading();

    require(['../../shared/js/premade_systems'], function (premade_systems) {
        model.premadeSystems(premade_systems);
        if (model.systemIsEmpty() && model.loadedSystemIsEmpty() && !model.updateSystemInProgress())
            model.loadRandomSystem();
    });

});
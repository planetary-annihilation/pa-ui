//LOCNS:new_game
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
        self.isLoading = ko.observable(false);
        self.primaryColor = ko.observable('');
        self.rawColor = ko.observable([]);

        self.secondaryColor = ko.observable('');
        self.commander = ko.observable();

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

            self.ai(!!json.ai);

            if (json.personality) {
                self.lockAIPersonality(true);
                self.aiPersonality(json.personality.name);
                self.lockAIPersonality(false);
            }

            if (json.color) {
                self.rawColor(json.color);
                if (json.color[0])
                    self.primaryColor('rgb(' + json.color[0].join() + ')');
                if (json.color[1])
                    self.secondaryColor('rgb(' + json.color[1].join() + ')');
            }

            if (json.color_index) {
                self.lockColorIndex(true);
                self.colorIndex(json.color_index);
                self.lockColorIndex(false);
            }

            if (json.commander)
                self.commander(json.commander);

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
            return self.containsThisPlayer();
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

        self.slots = ko.observableArray([]);

        var slot_count = options ? options.slots : 1;
        for (var i = 0; i < slot_count; i++)
            self.slots().push(new SlotViewModel({ ai: false }));

        self.numberOfSlots = ko.computed(function () { return self.slots().length; });
        self.numberOfEmptySlots = ko.computed(function () {
            return _.filter(self.slots(), function (element) { return element.isEmpty() }).length;
        });
        self.isEmpty = ko.computed(function () {
            return self.numberOfEmptySlots() === self.slots().length;
        });

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
            while (self.slots().length < json.slots) {
                self.slots.push(new SlotViewModel({ ai: false }));
            }
            while (self.slots().length > json.slots)
                self.slots.pop();
        };

        self.armyContainsThisPlayer = function () {
            return !!(_.find(self.slots(), function (s) { return (s.playerName() == model.displayName()); }));
        };

        self.cinematicInfo = ko.computed(function() {
            return {
                players: _.invoke(self.slots(), 'cinematicInfo'),
                shared: true
            };
        });
    }

    function ChatMessageViewModel(name, type  /* 'invalid' | 'lobby' | 'server' */, payload) {
        var self = this;

        self.username = ko.observable(name);
        self.type = type; /* 'invalid' | 'lobby' | 'server' */
        self.payload = ko.observable(payload);
    }

    function NewGameViewModel() {
        var self = this;

        self.showGameAbandoned = ko.observable(false);
        self.showWaitingForOpponent = ko.observable(true);
        self.showLobby = ko.computed(function() {
            return (!self.showGameAbandoned() && !self.showWaitingForOpponent());
        });

        self.showAbandonWarning = ko.observable(false);

        // Run the following on the debugger to enable this debugging.
        // window.sessionStorage.debug_pre_lobby_screen = "true" to enable this debugging.
        // It'll disable transitioning away from the pre-lobby screen and telling the server you're done loading.
        // Run model.showWaitingForOpponent(false); to manually switch to the lobby screen.
        self.debugPreLobbyScreen = ko.observable(false).extend({ session: 'debug_pre_lobby_screen' });

        self.dontNavigateOnShutdown = ko.observable(false);

       // Click handler for leave button
        self.leave = function() {
            model.send_message('leave');
            _.delay(function() {
                self.dontNavigateOnShutdown(true);
                window.location.href = 'coui://ui/main/game/start/start.html';
                return; /* window.location.href will not stop execution. */
            }, 30);
        };

        // Set up messaging for the social bar
        self.pageMessage = ko.observable();

        self.startingGameCountdown = ko.observable(-1);
        self.showStartingGameCountdown = ko.computed(function () {
            return self.startingGameCountdown() !== -1;
        });

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
        CommanderUtility.afterCommandersLoaded(function() {
            self.commanders(_.filter(CommanderUtility.getKnownCommanders(), function(commander) {
                return PlayFab.isCommanderOwned(CommanderUtility.bySpec.getObjectName(commander));
            }));

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
            self.selectedCommanderIndex(index % self.commanders().length);

            model.send_message('update_commander', {
                commander: self.selectedCommander()
            });
        }

        self.changeCommander = function () {
            self.setCommander(self.selectedCommanderIndex() + 1)
        };

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

        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });

        self.requiredContent = ko.observable();
        self.isTitansGame = ko.pureComputed(function() {
            return _.contains(self.requiredContent(), 'PAExpansion1');
        });

        self.armies = ko.observableArray([]);

        self.spectators = ko.observableArray([]);

        self.nextSceneUrl = ko.observable().extend({ session: 'next_scene_url' });

        self.systems = ko.observableArray([]).extend({ local: 'systems' });

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

        self.teamDescription = ko.computed(function () {
                return 'Slot';
        });

        self.serverLoading = ko.observable(false);
        self.clientHasLoadedOnce = ko.observable(false);
        self.clientLoading = ko.observable(true);
        self.clientLoading.subscribe(function(loading) {
            self.send_message('set_loading', { loading: loading });
            if (!loading)
                self.clientHasLoadedOnce(true);
        });

        self.slotsAreEmptyInfo = ko.observable('');
        self.slotsAreEmpty = ko.computed(function () {
            var result = _.some(self.armies(), function (army) {
                return _.some(army.slots(), function (slot) {
                    return slot.isEmpty();
                });
            })
            if (result)
                self.slotsAreEmptyInfo("Slots are empty.");
            else
                self.slotsAreEmptyInfo('');
            return result;
        });

        self.gameSystemReadyInfo = ko.observable('');
        self.gameSystemReady = ko.computed(function() {
            var result = self.serverLoading() || self.clientLoading();
            if (result)
                self.gameSystemReadyInfo('Building planets...');
            else
                self.gameSystemReadyInfo('');
            return !result;
        });

        self.gameIsNotOkInfo = ko.computed(function() {
            return self.gameSystemReadyInfo();
        });
        self.gameIsNotOk = ko.computed(function () { return self.slotsAreEmpty() || !self.gameSystemReady(); });

        self.system = ko.observable({});

        self.loadedSystem = ko.observable({}).extend({ session: 'loaded_system' });
        self.loadedSystemIsEmpty = ko.computed(function () { return _.isEmpty(self.loadedSystem()); });

        self.planetBiomes = ko.computed(function () {
            if (!self.system() || !self.system().planets)
                return [];
            return _.map(self.system().planets, function (element) { return element.generator.biome; });
        });

        self.loadedPlanet = ko.observable({}).extend({ session: 'loaded_planet' });
        self.planets = ko.observableArray([]).extend({ local: 'planets' });

        self.biomes = ko.observableArray(['earth', 'moon', 'tropical', 'lava', 'metal', 'desert', 'gas']);
        self.moonBiomes = ko.observableArray(['earth', 'moon', 'tropical', 'lava', 'desert']);
        self.asteroidBiomes = ko.observableArray(['moon', 'lava']);

        self.imageSourceForPlanet = function (planet) {

            var ice = planet.biome === 'earth' && planet.temperature <= -0.5;
            var s = (ice) ? 'ice' : planet.biome;
            s = (s) ? s : 'unknown';

            return 'coui://ui/main/shared/img/' + s + '.png';
        }

        self.navToStart = function () {
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

        self.navToMatchMaking = function () {
            window.location.href = 'coui://ui/main/game/start/start.html?startMatchMaking=true';
            return; /* window.location.href will not stop execution. */
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
    }
    model = new NewGameViewModel();

    handlers = {};

    handlers.game_config = function (payload) { /* deprecated. */
        model.createdGameDesc(payload);
        model.loadFromGameDesc();
    }

    handlers.chat_message = function (msg) {
        model.chatMessages.push(new ChatMessageViewModel(msg.player_name, 'lobby', msg.message));
        //$("#chat-bar .container_embed").scrollTop($("#chat-bar .container_embed")[0].scrollHeight);
    };

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
            case 'abandonment':
                // Create dialog informing the user that the server was shut down from a player abandoning.
                model.showWaitingForOpponent(false);
                model.showGameAbandoned(true);

                model.dontNavigateOnShutdown(true);
                model.send_message('leave');
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

        _.invoke(model.armies(), 'dirtySlots');


        _.forEach(payload, function (element) {
            if (element.army_index !== -1 && model.armies().length > element.army_index)
                model.armies()[element.army_index].addPlayer(element.slot_index, element);
            else
                orphans.push(element);

            if (!model.lobbyContactsMap()[element.id])
                model.lobbyContacts.push(element.id);
        });

        if (payload.length - orphans.length > 1 && !model.debugPreLobbyScreen())
            model.showWaitingForOpponent(false);

        _.invoke(model.armies(), 'cleanupSlots');
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
        model.serverLoading(payload.has_first_config && !payload.sim_ready);
    };

    handlers.settings = function (payload) {
        model.requiredContent(payload.required_content);
    };

    handlers.system = function (payload) {
        model.system(payload);
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
        if (model.dontNavigateOnShutdown())
            return;

        var transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        var transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        var transitDestination = ko.observable().extend({ session: 'transit_destination' });
        var transitDelay = ko.observable().extend({ session: 'transit_delay' });

        transitPrimaryMessage(loc('!LOC:CONNECTION TO SERVER LOST'));
        transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
        transitDestination('coui://ui/main/game/start/start.html');
        transitDelay(5000);
        window.location.href = 'coui://ui/main/game/transit/transit.html';
        return; /* window.location.href will not stop execution. */
    }

    handlers.mount_mod_file_data = function (payload) {
        api.debug.log("Mounting mod file data: " + JSON.stringify(payload));
        api.mods.mountModFileData();
    }

    handlers.server_mod_info_updated = function (payload) {
        model.updateActiveModAndCheatText();
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
    if (scene_mod_list['new_game_ladder'])
        loadMods(scene_mod_list['new_game_ladder']);

    app.registerWithCoherent(model, handlers);

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

    // Note: Loading is tested every 500ms.  Instead of using setInterval,
    // however, this uses repeating delays in order to avoid having multiple
    // calls to arePlanetsReady() in flight at a time.
    var testLoading = function () {
        var worldView = api.getWorldView(0);
        if (worldView) {
            worldView.arePlanetsReady().then(function (ready) {
                if (!model.debugPreLobbyScreen())
                    model.clientLoading(!ready);
                _.delay(testLoading, 500);
            });
        }
        else
            _.delay(testLoading, 500);
    };
    testLoading();
});

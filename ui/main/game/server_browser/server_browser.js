var model;
var handlers;

loadScript( 'coui://download/community-mods-server_browser.js');

$(document).ready(function () {

    function ServerBrowserViewModel() {
        var self = this;

        // Get session information about the user, his game, environment, and so on
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });
        self.buildVersion = ko.observable().extend({ session: 'build_version' });
        self.gameTicket = ko.observable().extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });

        // deprecated and no longer used
        self.joinLocalServer = ko.observable().extend({ session: 'join_local_server' });
        self.joinCustomServer = ko.observable().extend({ session: 'join_custom_server' });
        //

        self.isLocalGame = ko.observable().extend({ session: 'is_local_game' });
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.gameModIdentifiers = ko.observableArray().extend({ session: 'game_mod_identifiers' });
        self.serverType = ko.observable().extend({ session: 'game_server_type' });
        self.serverSetup = ko.observable().extend({ session: 'game_server_setup' });
        self.gameType = ko.observable().extend({ session: 'game_type' });
        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });
        self.devMode = ko.observable().extend({ session: 'dev_mode' });

        self.useLocalServer = ko.observable().extend({ session: 'use_local_server' });

        self.lobbyId = ko.observable().extend({ session: 'lobbyId' });
        self.uuid = ko.observable('').extend({ session: 'invite_uuid' });

        // Stuff for dealing with locked games
        self.privateGamePassword = ko.observable().extend({ session: 'private_game_password' });
        self.hasEnteredPassword = ko.observable(false);

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        // Filters
        self.uberNetRegions = ko.observableArray().extend({ session: 'uber_net_regions' });
        self.regionNameList = ko.computed(function() {
            var result = [{text: loc('!LOC:Any'), value: 'any'}];
            _.forEach(self.uberNetRegions(), function(region) {
                result.push({text: region.Name, value: region.Name});
            });
            return result;
        });

        self.hasUberNetRegions = ko.computed(function () { return (self.uberNetRegions().length > 0); });

        self.localServerSetting = ko.observable().extend({ setting: { 'group': 'server', 'key': 'local' } });
        self.localServerDisabledInSettings = ko.pureComputed(function () {
            return self.localServerSetting() === 'OFF';
        });

        self.remoteServerAvailable = ko.computed(function() {
            return self.hasUberNetRegions();
        });

        self.disableServerOption = ko.pureComputed(function () {
            return !self.remoteServerAvailable() || self.localServerDisabledInSettings();
        });

        self.defaultFilters = {
            'searchFilter': '',
            'regionFilter': 'any',
            'gameStateFilter': 'inlobby',
            'gameStatusFilter': 'canplay',
            'gameModeFilter': 'any',
            'planetCountMinFilter': 'any',
            'planetCountMaxFilter': 'any',
            'playerCountMinFilter': 'any',
            'playerCountMaxFilter': 'any',
            'gameTagFilter': 'any',
            'moddedGameFilter': 'any',
            'lockedFilter': 'any',
            'bountyModeFilter': 'any'
        };

        self.searchFilter = ko.observable('');
        self.gameStateFilter = ko.observable('inlobby').extend( { session: 'game_state_filter' } );
        self.gameStatusFilter = ko.observable('canplay').extend( { session: 'game_status_filter' } );
        self.gameModeFilter = ko.observable('any').extend( { session: 'game_mode_filter' } );

        self.planetCountMinFilter = ko.observable('any').extend( { session: 'game_planet_count_min_filter' } );
        self.planetCountMaxFilter = ko.observable('any').extend( { session: 'game_planet_count_max_filter' } );
        self.playerCountMinFilter = ko.observable('any').extend( { session: 'game_player_count_min_filter' } );
        self.playerCountMaxFilter = ko.observable('any').extend( { session: 'game_player_count_max_filter' } );
        self.regionFilter = ko.observable('any').extend( { session: 'game_region_filter' } );
        self.gameTagFilter = ko.observable('any').extend( { session: 'game_tag_filter' } );
        self.lockedFilter = ko.observable('any').extend( { session: 'game_locked_filter' } );

        self.lockedGameFilterOptions = ko.observableArray([ { text: loc('!LOC:Any'), value: 'any' }, { text: loc('!LOC:Locked'), value: 'locked' }, { text: loc('!LOC:Open'), value: 'open' } ]);

        self.showCheatServers = ko.observable(true);
        self.visibleLobbyIds = ko.observable({});

        self.bountyModeFilterOptions = ko.observableArray([ { text: loc('!LOC:Any'), value: 'any' }, { text: loc('!LOC:Not Bounty Mode'), value: 'notBountyMode' }, { text: loc('!LOC:Bounty Mode'), value: 'bountyMode' } ] );

        self.bountyModeFilter = ko.observable('any').extend( { session : 'game_bounty_mode_filter' } );

        self.moddedGameFilterDefaultOptions = ko.observableArray([ { text: loc('!LOC:Any'), value: 'any' }, { text: loc('!LOC:Not Modded'), value: 'notModded' }, { text: loc('!LOC:Modded'), value: 'modded' }]);

        self.moddedGameFilterOptions = ko.observableArray( _.clone( self.moddedGameFilterDefaultOptions() ) );

        self.moddedGameFilter = ko.observable('any').extend( { session : 'game_modded_filter' } );

        self.resetFilters = function() {
            for( key in self.defaultFilters ) { 
                self[ key ]( self.defaultFilters[ key ] );
            }
        };

        var filterRule = ko.computed(function () {
            self.searchFilter();
            self.gameStateFilter();
            self.gameStatusFilter();
            self.gameModeFilter();
            self.bountyModeFilter();
            self.moddedGameFilter();
            self.planetCountMinFilter();
            self.planetCountMaxFilter();
            self.playerCountMinFilter();
            self.playerCountMaxFilter();
            self.regionFilter();
            self.gameTagFilter();
            self.lockedFilter();
            self.showCheatServers();

            self.visibleLobbyIds({});
        });

        self.navigateToConnectToGame = function(params)
        {
            self.lastSceneUrl('coui://ui/main/game/server_browser/server_browser.html');

            var query = '';
            if (_.isObject(params))
                query = $.param(params);
            if (!_.isEmpty(query))
                query = '?' + query;
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html' + query;
        };

        self.createRemoteGame = function () {
            if (!self.remoteServerAvailable())
                return;

            self.navigateToConnectToGame({ action: 'start', content: api.content.activeContent() });
        };

        self.createLocalGame = function() {
            if (!self.useLocalServer())
                return;

            self.navigateToConnectToGame({ action: 'start', local: true, content: api.content.activeContent() });
        };

        self.doCreateLocalGame = ko.observable(!self.remoteServerAvailable());
        self.canCreateGame = ko.computed(function () {
            return self.remoteServerAvailable() || self.useLocalServer();
        });

        self.createGame = function () {
            if (self.doCreateLocalGame())
                self.createLocalGame();
            else
                self.createRemoteGame();
        };

        self.existingLobbyMap = ko.observable({}); /* lobby_id uuid : timestamp */

        // Game lists: available and filtered
        self.gameList = ko.observableArray();
        self.lanGameList = ko.observableArray();
        self.customGameList = ko.observableArray();
        self.allGames = ko.computed(function () {
            return self.gameList().concat(self.lanGameList()).concat(self.customGameList());
        });

        self.firstSetOfLobbyIds = ko.observable({});
        self.knownLobbyIds = ko.observable({});

        self.gameModeText = function(mode) {
            var lowerMode = mode.toLowerCase();
            if (lowerMode === 'freeforall')
                return '!LOC:Free For All';
            else if (lowerMode === 'teamarmies')
                return '!LOC:Team Armies';
            return mode;
        };

        self.allGames.subscribe((function () {
            var mod_list_hash = JSON.stringify(self.moddedGameFilterOptions());

            return function (value) {
                var result = _.clone( self.moddedGameFilterDefaultOptions() );
                var set = {};

                _.forEach(value, function (element) {
                    _.forEach(element.mod_names, function (name) {
                        set[name] = true;
                    });
                });
                _.forEach( _.keys(set).sort(), function (mod) {
                    result.push( { text: mod, value: mod } );
                });   

                var hash = JSON.stringify(result);
                if (hash === mod_list_hash)
                    return;

                mod_list_hash = hash;
                self.moddedGameFilterOptions(result);
            };
        })());

        self.filteredGameList = ko.computed({read: function () {
            var allGames = self.allGames();
            var filteredGames = [];
            var selectedGameStillVisible = false;
            var cheats_ok = self.showCheatServers();
            var visible = self.visibleLobbyIds();
            var filterRetired = self.filterRetiredGames();

            _.forEach(allGames, function (game) {
                var retired = false;

                // Check for valid game
                if (!game)
                    return;

                if (!game.max_players && (!game.players && game.mode !== 'Waiting'))
                    retired = true;

                if (self.bountyModeFilter() !== 'any') {
                    if (!!game.bounty_mode && self.bountyModeFilter() === 'notBountyMode') {
                        retired = true;
                        visible[game.lobby_id] = false;
                    }

                    if (!game.bounty_mode && self.bountyModeFilter() === 'bountyMode') {
                        retired = true;
                        visible[game.lobby_id] = false;
                    }
                }

                // Check for valid game state
                var started = game.started;
                if (self.gameStateFilter() !== 'any') {
                    if (self.gameStateFilter() === 'inlobby' && started)
                        retired = true;

                    if (self.gameStateFilter() === 'inprogress' && !started)
                        retired = true;
                }

                var can_play = game.players < game.max_players;
                var can_spectate = game.spectators < game.max_spectators;
                if (self.gameStatusFilter() !== 'any') {
                    if (!can_play && self.gameStatusFilter() === 'canplay')
                        retired = true;
                    if (!can_spectate && self.gameStatusFilter() === 'canspectate')
                        retired = true;
                    if (!can_play && !can_spectate && self.gameStatusFilter() === 'canjoin')
                        retired = true;
                }

                var ffa = game.mode === 'FreeForAll';
                if (self.gameModeFilter() !== 'any') {
                    if (ffa && self.gameModeFilter() === 'teamarmies')
                        retired = true;
                    if (!ffa && self.gameModeFilter() === 'freeforall')
                        retired = true;
                }

                // Check for valid number of planets
                var planets = game.planet_count;
                if (self.planetCountMinFilter() !== 'any')
                    if (planets < Number(self.planetCountMinFilter()))
                        retired = true;

                if (self.planetCountMaxFilter() !== 'any')
                    if (planets > Number(self.planetCountMaxFilter()))
                        retired = true;

                // Check for valid number of players
                var players = game.max_players;
                if (self.playerCountMinFilter() !== 'any')
                    if (players < Number(self.playerCountMinFilter()))
                        retired = true;

                if (self.playerCountMaxFilter() !== 'any')
                    if (players > Number(self.playerCountMaxFilter()))
                        retired = true;

                // Check for lobby tag
                var tag = game.tag;
                if (self.gameTagFilter() !== 'any' && tag !== self.gameTagFilter())
                    retired = true;

                var locked = game.locked;
                if (self.lockedFilter() !== 'any') {
                    if (locked && self.lockedFilter() !== 'locked')
                        retired = true;
                    if (!locked && self.lockedFilter() !== 'open')
                        retired = true;
                }

                // Check for modded servers
                var modded = game.mod_names.length > 0;
                var mod_match;
                var reject_modded_games = self.moddedGameFilter() === 'notModded';
                var reject_normal_games = self.moddedGameFilter() === 'modded';

                if (self.moddedGameFilter() !== 'any') {

                    if (reject_modded_games || reject_normal_games) {
                        if (reject_modded_games && modded)
                            retired = true;

                        if (reject_normal_games && !modded)
                            retired = true;
                    }
                    else {
                        mod_match = _.any(game.mod_names, function (element) {
                            return element === self.moddedGameFilter();
                        });

                        if (!mod_match)
                            retired = true;
                    }
                }

                // Check for cheat servers
                if (game.cheats_enabled && !cheats_ok)
                    retired = true;

                // Check for matching regions
                if (self.regionFilter() !== 'any')
                    if (self.regionFilter() !== game.region)
                        retired = true;

                // Look for games matching the search string
                if (self.searchFilter().length > 0)
                    if (game.searchable.indexOf(self.searchFilter().toUpperCase()) === -1)
                        retired = true;

                game.retired = retired;

                // Is this the currently selected game? If so, we need to retain the selection
                if (self.currentSelectedGame() && game.uuid === self.currentSelectedGame().uuid) {
                    selectedGameStillVisible = true;
                    self.currentSelectedGame(game);
                }

                if (!retired)
                    visible[game.lobby_id] = true;

                if (!retired || ! filterRetired && visible[game.lobby_id])
                    filteredGames.push(game);
            });

            self.visibleLobbyIds.valueHasMutated();

            if (!selectedGameStillVisible)
                self.setSelected(null);

            return _.sortBy(filteredGames, 'timestamp');

        }, deferEvaluation: true});

        // Support selection, retained even on list refresh
        self.currentSelectedGame = ko.observable(null);
        self.currentSelectedGameHost = ko.observable(-1);
        self.setSelected = function(data) {
            self.currentSelectedGame(data);
            if (self.currentSelectedGame())
                self.currentSelectedGameHost(data.lobby_id || data.host);
            else
                self.currentSelectedGameHost(-1);
        }

        /* used for debugging reconnect behavior */
        self.lastSelectedGame = ko.observable().extend({ local: 'lastSelectedGame' });
        self.currentSelectedGame.subscribe(function(value) {
            if (!_.isEmpty(value))
                self.lastSelectedGame(value);
        });
        self.enterLastSelectedGame = function () {
            var lastGame = self.lastSelectedGame();
            if (!lastGame)
                return;
            self.joinGame(lastGame);
        };

        self.canJoinGame = ko.computed(function () {
            var game = self.currentSelectedGame();
            return !!game && (game.players < game.max_players) && !game.started && !game.retired;
        });
        self.canSpectateGame = ko.computed(function () {
            var game = self.currentSelectedGame();
            return !!game && (game.spectators < game.max_spectators) && !game.retired;
        });
        self.canEnterGame = ko.computed(function () {
            return self.canJoinGame() || self.canSpectateGame();
        });

        self.tryToSpectate = ko.observable().extend({session: 'try_to_spectate'});
        self.tryToSpectateGame = function () {
            // the selected game will reject the client. do not attempt to join.
            if (!self.canSpectateGame())
                return;

            self.tryToSpectate(true);
            self.tryToEnterGame();
        }

        self.tryToJoinGame = function () {
            // the selected game will reject the client. do not attempt to join.
            if (!self.canJoinGame())
                return;

            if (!_.isEmpty(self.currentSelectedGame().missing_content))
            {
                $('#buyContent').modal('show');
                return;
            }

            self.tryToSpectate(false);
            self.tryToEnterGame();
        }

        self.missingContentDescription = function() {
            var game = self.currentSelectedGame();
            if (game && game.missing_content)
                return api.content.getInfo(_.first(game.missing_content)).description;
            return '';
        }

        self.buyMissingContent = function() {
            window.location.href = 'coui://ui/main/game/armory/armory.html?action=buy_content&content=' + _.first(self.currentSelectedGame().missing_content);
        };

        self.tryToEnterGame = function () {
            // If we're looking at a locked game, we need to make sure we presented the password modal
            if (self.currentSelectedGame().locked && !self.hasEnteredPassword()) {
                self.privateGamePassword();
                $('#getPassword').modal('show');
                return;
            }
            self.hasEnteredPassword(false);
            self.joinGame(self.currentSelectedGame());
        };

        self.joinGame = function (game) {

            self.lobbyId(game.lobby_id);
            self.gameHostname(game.host);
            self.gamePort(game.port);
            self.isLocalGame(game.server_type == 'local');
            self.uuid(game.uuid);
            self.serverType(game.server_type);
            self.serverSetup('game');
            self.gameType(game.mode);
            self.gameModIdentifiers(game.mod_identifiers);

            var params = {};
            if (_.has(game, 'required_content'))
            {
                if (_.size(game.required_content) > 1)
                    console.error("joinGame on server with > 1 piece of content required -- don't know what to do!");
                params.content = _.last(game.required_content);
            }
            self.navigateToConnectToGame(params);
        };

        // When the player clicks the Join Game on the modal box, we know he just entered a password, try a join
        self.joinWithPassword = function () {
            self.hasEnteredPassword(true);
            self.tryToEnterGame();
        }

        self.back = function() {
            model.lastSceneUrl('coui://ui/main/game/server_browser/server_browser.html');
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

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

        // Takes a game beacon (sent by the game server) and turns it into our game data object
        self.processGameBeacon = function (beacon, region, lobby_id, host, port) {
            try { /* server modding allows users to modify the structure of the beacon,
                     but we don't want a single malformed game from breaking the entire list,
                     so we guard the processing function with a try catch. */

                var game = {};
                var gameData = beacon.game;

                if (!gameData)
                    return false;

                if (_.isEmpty(gameData.system))
                    gameData.system = { planets: [] };

                var extraPlanets = gameData.system.planets.length ? '+ '+ (gameData.system.planets.length - 1) +' more' : '';
                var playerDetail = beacon.player_names;
                for (var i=beacon.player_names.length; i<beacon.max_players; i++)
                    playerDetail.push(loc("!LOC:Open slot"));

                var spectatorDetail = ['Not Available'];
                if (beacon.spectator_names) {
                    var spectatorDetail = beacon.spectator_names;
                    for (var i=beacon.spectator_names.length; i<beacon.max_spectators; i++)
                        spectatorDetail.push(loc("!LOC:Open slot"));
                }

                if (_.contains(beacon.blacklist, self.uberId()))
                    return false;

                if (beacon.whitelist.length)
                    if (!_.contains(beacon.whitelist, self.uberId()))
                        return false;

                var p = new Array();
                _.forEach(beacon.game.system.planets,function(planet) {
                    p.push({
                        'name' : (planet.name.length < 16 ? planet.name : planet.name.substring(0,15)+'...'),
                        'biome' : planet.generator.biome,
                        'move_thrust' : planet.required_thrust_to_move,
                        'scale' : self.planetSizeClass(planet.generator.radius),
                        'radius' : planet.generator.radius,
                        'starting_planet': planet.starting_planet,
                        'metalClusters': planet.generator.metalClusters,
                        'metalDensity': planet.generator.metalDensity,
                        'landing_zones_count': planet.landing_zones_count,
                        'metal_spots_count': planet.metal_spots_count,
                        'planetCSG_count': planet.planetCSG_count
                    });
                });

                // These don't appear to always to be defined, so let's check for that with early out logic.
                var cheats_enabled = beacon.cheat_config &&
                                        beacon.cheat_config.cheat_flags &&
                                        beacon.cheat_config.cheat_flags.cheat_mod_enabled;

                var mods_summary = "";
                _.forEach(beacon.mod_names, function (element) {
                    if (mods_summary.length > 0)
                        mods_summary += ", ";
                    mods_summary += '"' + element + '"';
                });

                var name = beacon.creator + " : " + beacon.tag;
                if (!_.isEmpty(gameData.name))
                    name = gameData.name;

                var map = self.knownLobbyIds();
                if (!map[lobby_id]) {
                    map[lobby_id] = _.now();
                    self.knownLobbyIds.valueHasMutated();
                }

                var requiredContent = beacon.required_content;
                if (!_.isArray(requiredContent))
                    requiredContent = [];
                var missingContent = _.filter(requiredContent, function(content) { return !_.contains(api.content.unlocked(), content); });


                var planets = _.map(gameData.system.planets, function (element) {
                    if (!element || !element.generator)
                        return null;

                    return {
                        biome: element.generator.biome,
                        start: element.starting_planet
                    };
                });

                game = {
                    'server_type': beacon.server_type,
                    'region': region,
                    'uuid': beacon.uuid,
                    'lobby_id' : lobby_id,
                    'host' : host,
                    'port' : port,
                    'name': name,
                    'locked': beacon.require_password,
                    'started': beacon.started,
                    'mode': beacon.mode,
                    'modded': (beacon.mod_names && beacon.mod_names.length > 0) ? (cheats_enabled ? "Y+Cheat" : "Yes") : "No",
                    'mods_summary': mods_summary,
                    'mod_names': beacon.mod_names,
                    'mod_identifiers': beacon.mod_identifiers,
                    'cheats_enabled': cheats_enabled,
                    'planet_count' : beacon.game.system.planets.length,
                    'planets' : extraPlanets,
                    'planet_detail' : p,
                    'biomes': _.map(gameData.system.planets, function (element) { return element.generator.biome }),
                    'simplePlanets': planets,
                    'players' : beacon.players,
                    'max_players' : beacon.max_players,
                    'player_display' : beacon.players+'/'+beacon.max_players,
                    'player_detail' : playerDetail,
                    'spectators' : beacon.spectators,
                    'max_spectators' : beacon.max_spectators,
                    'spectator_display' : beacon.spectators+'/'+beacon.max_spectators,
                    'spectator_detail': spectatorDetail,
                    'tag': beacon.tag || '',
                    'searchable': (gameData.name + ' ' + beacon.player_names.join(' ')).toUpperCase(),
                    'timestamp': map[lobby_id],
                    'required_content': requiredContent,
                    'titans': _.contains(requiredContent, 'PAExpansion1'),
                    'missing_content': missingContent,
                    'is_missing_content': !_.isEmpty(missingContent),
                    'bounty_mode': beacon.bounty_mode,
                    'bounty_value': beacon.bounty_value,
                    'sandbox': beacon.sandbox
                };

                return game;

            } catch (e) {
                return false;
            }
        };

        var updateTimeout;
        var updateCustomServerGamesTimeout;

        self.disableGameUpdates = function() {

            if ( updateTimeout )
                clearTimeout(updateTimeout);

            if ( updateCustomServerGamesTimeout )
                clearTimeout(updateCustomServerGamesTimeout);
        }

        self.updateGames = function() {

            self.disableGameUpdates();

            if (self.remoteServerAvailable())
                self.updateServerData();

            self.updateCustomServerGames();
        }

        self.manualRefresh = function () {
            self.visibleLobbyIds({});
            self.updateGames();
        };

        self.filterRetiredGames = ko.observable(false);
        self.toggleHideRetiredGames = function () {
            self.filterRetiredGames(!self.filterRetiredGames());
        };

        self.autoRefresh = ko.observable(true);
        self.autoRefresh.subscribe(function () {
            if(self.autoRefresh())
                self.updateGames();
            else
                self.disableGameUpdates();
        });

        self.failedToRetrieveGameList = ko.observable(false);

        // This is set up to periodically poll UberNet and see what games are being reported
        self.updateServerData = function () {

            api.net.requestCurrentGames()
                .done(function (data) {

                    // If we started with nothing in the game list, we'll need to trigger a resize
                    var startingGameListSize = self.gameList().length;
                    var games = data.Games;

                    var newGameList = [];

                    for (var i = 0; i < games.length; i++) {
                        try {
                            if (games[i].BuildVersion === self.buildVersion()) {
                                if (games[i].TitleData) {
                                    var gameData = JSON.parse(games[i].TitleData);

                                    gameData.server_type = 'uber';

                                    var game = self.processGameBeacon(gameData, games[i].Region, games[i].LobbyID);
                                    if (game)
                                        newGameList.push(game);
                                }
                            }
                        } catch (e) {
                            console.log('failed to parse TitleData');
                            console.log(games[i].TitleData);
                        }
                    }

                    // Update the master game list
                    self.gameList(newGameList);

                    if (self.autoRefresh())
                        updateTimeout = setTimeout(self.updateServerData, 1000);
                })
                .fail(function (data) {
                    self.failedToRetrieveGameList(true);
                    self.autoRefresh(false);
                });
        }

        self.customServersUrl = ko.observable().extend( { session: 'custom_servers_url'});
        self.customServersRefresh = ko.observable().extend({ session: 'custom_servers_refresh'});
        self.customServersRetry = ko.observable().extend({ session: 'custom_servers_retry'}); 

        self.updateCustomServerGames = function () {

            var url = self.customServersUrl();

            if (!url) {
                return;
            }

            $.getJSON(url)
                .done(function (games) {

                    var newGameList = [];

                    for (var i = 0; i < games.length; i++) {
                        try {

                            var customGame = games[i];

                            if (customGame.version == self.buildVersion() && customGame.beacon) {
                                var lobbyId = customGame.id;
                                var host = customGame.ip;
                                var port = customGame.port;

                                var gameData = JSON.parse(customGame.beacon);

                                gameData.server_type = 'custom';

                                var region = 'Custom: ' + gameData.region;

                                var game = self.processGameBeacon(gameData, region, lobbyId, host, port);

                                if (game)
                                    newGameList.push(game);
                            }
                        } catch (e) {
                            console.log('failed to process custom game');
                            console.log(e);
                        }
                    }

                   // Update the custom game list
                    self.customGameList(newGameList);

                    if (self.autoRefresh())
                        updateCustomServerGamesTimeout = setTimeout(self.updateCustomServerGames, self.customServersRefresh() || 5000);
                })
                .fail(function (data) {
                    if (self.autoRefresh())
                        updateCustomServerGamesTimeout = setTimeout(self.updateCustomServerGames, self.customServersRetry() || 30000);
                });
        }
    }

    model = new ServerBrowserViewModel();

    handlers = {};

    var match = function (game, beacon) {
        if (!beacon || !beacon.TitleData)
            return false;

        return game.host === beacon.host && game.port === beacon.Port && game.uuid === beacon.TitleData.uuid;
    };

    // LAN games do direct broadcast of a beacon, which comes in through this function
    // Process the incoming beacon to make sure the LAN game is on the list
    handlers.update_beacon = function (payload) {
        var game = null;

        if (payload.TitleData && payload.BuildVersion == model.buildVersion()) {
            payload.TitleData.server_type = 'local';
            game = model.processGameBeacon(payload.TitleData, 'Local', payload.LobbyId, payload.host, payload.Port);
        }

        // Get the current list so we can edit it
        var currentLanGames = model.lanGameList();

        var foundIt = false;

        // Scan the games and see if we already have it
        for (var i=0; i<currentLanGames.length; i++) {
            if (match(currentLanGames[i], payload)) {
                // Hey, found it! Let's update.
                if (game) {
                    currentLanGames[i] = game;
                } else {
                    currentLanGames.splice(i);
                }
                foundIt = true;
                break;
            }
        }

        // Didn't find the game, add it to the list
        if (!foundIt && game) {
            currentLanGames.push(game);
        }

        // Put the updated list back into the observable array
        model.lanGameList(currentLanGames);
    }

    handlers.new_beacon = function (payload) {
        handlers.update_beacon(payload);
    }

    handlers.lost_beacon = function (payload) {
        // Get the current list so we can edit it
        var currentLanGames = model.lanGameList();

        // Scan the games and see if we already have it
        for (var i=0; i<currentLanGames.length; i++) {
            if (match(currentLanGames[i], payload)) {
                // Hey, found it! Let's remove it.
                currentLanGames.splice(i);
                break;
            }
        }

        // Put the updated list back into the observable array
        model.lanGameList(currentLanGames);
    }

    if ( window.CommunityMods ) {
        try {
            CommunityMods();
        } catch ( e ) {
            console.error( e );
        }
    }

    loadSceneMods('server_browser');


    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.updateGames();

    // Set up the password box
    $('#getPassword').modal();
    $('#buyContent').modal();

    api.Panel.message('uberbar', 'lobby_info' /*, undefined */);
    api.Panel.message('uberbar', 'visible', { value: true });

    // Start watching for LAN games
    engine.call('enable_lan_lookout');
    $(window).unload(function() { engine.call('disable_lan_lookout'); });
});
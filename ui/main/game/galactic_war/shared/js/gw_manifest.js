define([
    'require',
    'shared/gw_game'
], function(
    require,
    GWGame
) {
    var MANIFEST_DB = 'gw_manifest';
    var MANIFEST_STORE = 'manifest';
    var MANIFEST_KEY = 'manifest';

    var GAME_STORE = 'games';
    var SYSTEM_STORE = 'systems';

    var dbOpen = function() {
        var openRequest = indexedDB.open(MANIFEST_DB, 2);
        var result = $.Deferred();
        openRequest.onupgradeneeded = function(event) {
            var db = event.target.result;
            if (event.oldVersion < 1) {
                db.createObjectStore(MANIFEST_STORE);
                db.createObjectStore(GAME_STORE, {
                    keyPath: 'id'
                });
            }
            if (event.oldVersion < 2) {
                db.createObjectStore(SYSTEM_STORE, {
                    keyPath: 'id'
                });
            }
        };
        openRequest.onsuccess = function(event) {
            var db = event.target.result;
            db.onerror = function(event) {
                console.error("GWManifest db error: " + event.target.errorCode);
            };
            result.resolve(db);
        };
        openRequest.onerror = function(event) {
            console.error("Unable to open GWManifest db: " + event.target.errorCode);
        };

        return result.promise();
    }();

    var self;

    var loading = false;
    var saving = false;
    var subscriptions = ko.observable({});

    var removeFunctions = function(o) {
        if (typeof o === 'function') {
            return;
        }
        if (_.isArray(o)) {
            var needsFilter = false;
            for (var i = 0; i < o.length; ++i) {
                o[i] = removeFunctions(o[i]);
                if (o[i] === undefined)
                    needsFilter = true;
            }
            if (needsFilter)
                o = _.filter(o, function(element) { return element === undefined; });
        }
        else if (typeof o === 'object') {
            for (var key in o) {
                var value = removeFunctions(o[key]);
                if (value === undefined)
                    delete o[key];
                else
                    o[key] = value;
            }
        }
        return o;
    };

    var GWManifest = function() {
        self = this;

        self.games = ko.observableArray([]);
        self.games.subscribe(function() {
            if (!loading)
                self.save();
        });
        self.ready = ko.observable(false);

        self.load();
    };

    GWManifest.prototype = {

        load : function() {
            if (loading)
                return loading;

            var finishLoading = function() {
                self.ready(true);
                var wasLoading = loading;
                loading = false;
                wasLoading.resolve(self);
            };
            loading = $.Deferred();
            dbOpen.then(function(db) {
                var loadOp = db
                        .transaction([MANIFEST_STORE], 'readwrite')
                        .objectStore(MANIFEST_STORE)
                        .get(MANIFEST_KEY);
                loadOp.onsuccess = function(event) {
                    self.games(loadOp.result || []);
                    finishLoading();
                };
                loadOp.onerror = function(event) {
                    self.games([]); // Be empty.
                    finishLoading();
                };
            });
            return loading.promise();
        },

        save : function() {
            if (loading)
                return;

            // Capture games before we exit scope
            var games = self.games().slice(0);

            var result = $.Deferred();

            dbOpen.then(function(db) {
                var saveOp = db
                        .transaction([MANIFEST_STORE], 'readwrite')
                        .objectStore(MANIFEST_STORE)
                        .put(games, MANIFEST_KEY);
                saveOp.onsuccess = function(event) {
                    result.resolve();
                };
                saveOp.onerror = function(event) {
                    result.fail(event);
                };
            });
            return result.promise();
        },

        hasGame : function(game) {
            return _.some(self.games(), function(have) { return game.id === have.id; });
        },

        addGame : function(game) {
            if (!self.hasGame(game))
                self.games.push({id: game.id});

            if (!subscriptions()[game.id]) {
                subscriptions()[game.id] = game;
                subscriptions.valueHasMutated();
                var index = _.findIndex(self.games(), {id: game.id});
                ko.computed(function() {
                    var entry = self.games()[index];

                    // When adding data to the manifest, add reading here
                    entry.name = game.name();
                    entry.commander = game.inventory().tags().global.commander;
                    entry.stars = game.galaxy().stars().length;
                    entry.cards = game.inventory().cards().length;
                    entry.wins = game.stats().wins();
                    entry.turns = game.stats().turns();
                    entry.state = game.gameState();

                    var star = game.galaxy().stars()[game.currentStar()];
                    entry.currentStar = (star.ai() && star.ai().name) || star.system().name;
                    entry.timestamp = game.timestamp();
                    entry.content = game.content();
                    if (!saving) {
                        saving = _.defer(function() {
                            self.save();
                            saving = false;
                        });
                    }
                }, self, {
                    disposeWhen: ko.computed(function() {
                        return !subscriptions()[game.id];
                    })
                });
            }
        },

        removeGameById: function (id) {
            delete subscriptions()[id];
            subscriptions.valueHasMutated();
            var index = _.findIndex(self.games(), function (g) { return g.id === id });
            if (index >= 0)
                self.games.splice(index, 1);

            var result = $.Deferred();
            dbOpen.then(function (db) {
                var removeStore = function(store) {
                    var removeResult = $.Deferred();
                    var removeOp = db
                            .transaction([store], 'readwrite')
                            .objectStore(store)
                            .delete(id);
                    removeOp.onsuccess = function (event) {
                        removeResult.resolve();
                    };
                    removeOp.onerror = function (event) {
                        removeResult.fail(event);
                    };
                };
                var removeGame = removeStore(GAME_STORE);
                var removeSystems = removeStore(SYSTEM_STORE);
                $.when(removeGame, removeSystems).then(
                    function(a, b) {
                        result.resolve();
                    },
                    function(error) {
                        result.fail(error);
                    }
                );
            });
            return result.promise();
        },

        removeGame: function(game) {
            var id = game.id;
            return self.removeGameById(id);
        },

        loadGame : function(id) {
            var result = $.Deferred();

            if (id === "tutorial") {
                require(['shared/gw_tutorial'], function(GWTutorial) {
                    var config = GWTutorial.createTutorial();

                    var game = new GWGame(config.id);
                    game.load(config).then(function() {
                        self.addGame(game);
                        result.resolve(game);
                    });
                });

                return result.promise();
            }

            dbOpen.then(function(db) {
                var loadOp = db
                        .transaction([GAME_STORE], 'readwrite')
                        .objectStore(GAME_STORE)
                        .get(id);
                loadOp.onsuccess = function(event) {
                    var config = loadOp.result;
                    if (!config) {
                        result.resolve();
                        return;
                    }
                    var systemOp = db
                            .transaction([SYSTEM_STORE], 'readwrite')
                            .objectStore(SYSTEM_STORE)
                            .get(id);
                    var systems = $.Deferred();
                    systemOp.onsuccess = function(event) {
                        systems.resolve(systemOp.result);
                    };
                    systemOp.onerror = function(event) {
                        systems.resolve({});
                    };
                    systems.then(function(loadedSystems) {
                        if (!_.isEmpty(loadedSystems))
                            GWGame.loadSystems(systemOp.result, config);
                        var game = new GWGame(config.id);
                        game.load(config).then(function() {
                            self.addGame(game);
                            result.resolve(game);
                        });
                    });
                };
                loadOp.onerror = function(event) {
                    result.fail(event);
                };
            });
            return result.promise();
        },

        saveGame : function(game) {
            var result = $.Deferred();

            $.when(
                game.busy,
                dbOpen
            ).then(function(
                game,
                db
            ) {
                var config = game.save();
                removeFunctions(config);
                var systemWriteDone = $.Deferred();
                var systems = GWGame.saveSystems(config);
                if (!_.isEmpty(systems)) {
                    var systemWriteOp = db
                            .transaction([SYSTEM_STORE], 'readwrite')
                            .objectStore(SYSTEM_STORE)
                            .put(systems);
                    systemWriteOp.onsuccess = function(event) {
                        systemWriteDone.resolve(systems);
                    };
                    systemWriteOp.onerror = function(event) {
                        // Put them back...
                        GWGame.loadSystems(config);
                        systemWriteDone.resolve({});
                    };
                }
                else
                    systemWriteDone.resolve({});
                systemWriteDone.then(function() {
                    var saveOp = db
                            .transaction([GAME_STORE], 'readwrite')
                            .objectStore(GAME_STORE)
                            .put(config);
                    saveOp.onsuccess = function(event) {
                        self.addGame(game);
                        // Tell the game that it has been saved.
                        game.saved(true);
                        result.resolve(game);
                    };
                    saveOp.onerror = function(event) {
                        result.fail(event);
                    };
                });
            });
            return result.promise();
        },

        cleanup: function() {
            var waiting = 0;
            var result = $.Deferred();
            dbOpen.then(function(db) {
                var cleanupStore = function(store) {
                    var storeResult = $.Deferred();
                    var cleanupCursor = db
                            .transaction([store], 'readwrite')
                            .objectStore(store)
                            .openCursor();
                    cleanupCursor.onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            if (!self.hasGame({id: cursor.key})) {
                                var deleteOp = cursor.delete();
                                ++waiting;
                                deleteOp.onsuccess = function() {
                                    --waiting;
                                    if (!waiting)
                                        storeResult.resolve();
                                };
                                deleteOp.onerror = deleteOp.onsuccess;
                            }
                            cursor.continue();
                        }
                        else {
                            if (!waiting)
                                storeResult.resolve();
                        }
                    };
                    return storeResult;
                };
                var gameStoreResult = cleanupStore(GAME_STORE);
                var systemStoreResult = cleanupStore(SYSTEM_STORE);
                $.when(gameStoreResult, systemStoreResult).then(function() { result.resolve(); });
            });
            return result.promise();
        }
    };

    return new GWManifest();
});

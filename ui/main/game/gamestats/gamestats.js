var model;
var handlers = {};

$(document).ready(function () {

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function GamestatsViewModel() {
        var self = this;

        self.active = ko.observable(false);

        self.show = ko.pureComputed(function() {
            return self.active();
        });

        self.firstTimeLoaded = ko.observable();
        self.hasBeginningOfTime = ko.computed(function () {
            return self.firstTimeLoaded() <= 0;
        });

        self.lastTimeLoaded = ko.observable(0);
        self.currentTimeInSeconds = ko.observable(0);
        self.endOfTimeInSeconds = ko.observable(0);
        self.lastCommanderDestructionTime = ko.observable(0).extend({ local: 'last_commander_destrucition_time' });
        self.commanderFastDestructionCount = ko.observable(0).extend({ local: 'commander_fast_destruction_count' });
        self.commanderDestructionMap = ko.observable({}).extend({ local: 'commander_destruction_map' });
        self.endOfTimeInSeconds.subscribe(function (value) {
            if (value < self.lastCommanderDestructionTime()) {
                self.lastCommanderDestructionTime(0);
                self.commanderFastDestructionCount(0);
                self.commanderDestructionMap({});
            }
        });

        self.currentGameState = ko.observable('playing');
        self.gameIsOnGoing = ko.computed(function () {
            return self.currentGameState() === 'playing';
        });

        self.displayName = ko.observable();
        self.victors = ko.observableArray([]);
        self.singleWinner = ko.computed(function () {
            return self.victors().length === 1;
        });

        /* maps commander kill count to earliest recorded time for that kill.
           keys should always be 1 to 9. values should always be time in seconds. */
        self.creditCommanderDestruction = function (count, time) {

            var map = self.commanderDestructionMap();

            if (!map[count] || map[count] > time) {
                map[count] = time;
                self.commanderDestructionMap(map);
            }
        };
        self.commanderDestructionMap.subscribe(function (value) {

            if (!value || _.isEmpty(value))
                return;

            var previous = self.commanderFastDestructionCount();
            var current =_.max(_.filter(_.keys(self.commanderDestructionMap()), function (element) {
                return (self.commanderDestructionMap()[element] < 5 * 60) /* time in seconds */
            }));

            if (previous >= current)
                return;

            var time = self.commanderDestructionMap()[current];

            if (time <= self.lastCommanderDestructionTime())
                return;

            self.commanderFastDestructionCount(current);
            self.lastCommanderDestructionTime(time);

            api.tally.incStatInt('game_fast_commander_kill', Number(current - previous));
        });

        self.close = function () {
            api.Panel.message(api.Panel.parentId, 'panel.invoke', ['setStatsPanelState', false]);
        };

        self.definitions = ko.observableArray([
                {
                    name: 'buildEfficiency',
                    label: '!LOC:Build Efficiency',
                    min: 0,
                    max: 101,
                },

                 //{
                 //    name: 'cumulativeBuildEfficiency',
                 //    label: 'Cumulative Build Efficiency',
                 //},

                //{
                //    name: 'currentEnergy',
                //    label: 'Current Energy'
                //},
                //{
                //    name: 'currentMetal',
                //    label: 'Current Metal'
                //},

                {
                    name: 'productionMetal',
                    label: '!LOC:Metal Production'
                },
                {
                    name: 'demandMetal',
                    label: '!LOC:Metal Demand'
                },
                // {
                //     name: 'netProductionMetal',
                //     label: 'Metal Net Production',
                //     dash: [20, 6]
                // },
                // {
                //     name: 'storageMetal',
                //     label: 'Metal Storage',
                //     dash: [5, 6]
                // },
                {
                    name: 'wastedMetal',
                    label: '!LOC:Metal Wasted'
                },
                {
                    name: 'productionEnergy',
                    label: '!LOC:Energy Production'
                },
                {
                    name: 'demandEnergy',
                    label: '!LOC:Energy Demand'
                },
                // {
                //     name: 'netProductionEnergy',
                //     label: 'Energy Net Production',
                //     dash: [20, 4]
                // },
                // {
                //     name: 'storageEnergy',
                //     label: 'Energy Storage',
                //     dash: [5, 4]
                // },
                 {
                     name: 'wastedEnergy',
                     label: '!LOC:Energy Wasted'
                 },
                {
                    name: 'armyCountFabber',
                    label: '!LOC:Units: Fabricators'
                },
                {
                    name: 'armyCountFactory',
                    label: '!LOC:Units: Factory'
                },
                {
                    name: 'armyCountMobile',
                    label: '!LOC:Units: Mobile'
                },
                //{
                //    name: 'enemyCommandersDestroyed',
                //    label: 'Commanders Destroyed'
                //},
                {
                    name: 'unitCount',
                    label: '!LOC:Total Units'
                },
                {
                    name: 'unitsInCombat',
                    label: '!LOC:Units In Combat'
                },
                //{
                //    name: 'unitsCreated',
                //    label: 'Total Units Created'
                //},
                //{
                //    name: 'unitsLost',
                //    label: 'Total Units Lost'
                //},
                //{
                //    name: 'unitsDestroyed',
                //    label: 'Total Units Destroyed'
                //},
                //{
                //    name: 'commandsGiven',
                //    label: 'Total Commands Given'
                //},
                {
                    name: 'unitsCreatedDelta',
                    label: '!LOC:Unit Build Rate'
                },
                {
                    name: 'unitsLostDelta',
                    label: '!LOC:Unit Loss Rate'
                },
                {
                    name: 'metalDestroyedDelta',
                    label: '!LOC:Metal Destruction Rate'
                },
                {
                     name: 'metalLostDelta',
                     label: '!LOC:Metal Loss Rate'
                },
                {
                    name: 'unitsDestroyedDelta',
                    label: '!LOC:Unit Destruction Rate'
                },
                {
                    name: 'commandsGivenDelta',
                    label: '!LOC:Command Rate'
                },
                //{
                //     name: 'cumulativeProductionMetal',
                //     label: 'Cumulative Metal Production'
                //},
                //{
                //    name: 'cumulativeDemandMetal',
                //    label: 'Cumulative Metal Demand'
                //},

                //{
                //     name: 'cumulativeProductionEnergy',
                //     label: 'Cumulative Energy Production'
                //},
                //{
                //    name: 'cumulativeDemandEnergy',
                //    label: 'Cumulative Energy Demand'
                //},
        ]);

        self.visible = ko.observable(true);
        self.resolution = ko.observable(300);

        self.rawdata = [];
        self.activeData = ko.observableArray([]);//.extend({ session: 'active_data' });

        self.gameStartTime = -1;
        self.armyDefeatTimeMap = {};

        self.toggleActiveData = function (index) {
            var data = model.activeData();
            data[index] = !data[index];

            model.activeData(data);
        };

        self.initDataArrays = function (length) {
            self.rawdata.length = length;
            _.forEach(self.rawdata, function (element, index) {
                if (!self.rawdata[index]) {
                    self.rawdata[index] = ko.observableArray([]);

                    if (_.isUndefined(self.activeData()[index])) {
                        self.activeData()[index] = true;
                        self.activeData.notifySubscribers();
                    }
                }
            });
        };

        self.clearDataArrays = function () {
            _.forEach(self.rawdata, function (element, index) {
                if (self.rawdata[index])
                    self.rawdata[index]([]);
            });
        };

        self.first = function (army, key) {
            if (!self.rawdata[army])
                return -1;

            var data = self.rawdata[army]();
            return data[0][key];
        };

        self.latest = function (army, key) {
            if (!self.rawdata[army])
                return -1;

            var data = self.rawdata[army]();
            return data[data.length - 1][key];
        };

        self.hasCompleteHistory = ko.observable(false);
        self.statsHistorySampleIntervals = [30, 10, 1];
        self.statsHistoryInteration = ko.observable(0);
        self.statsHistorySampleInterval = ko.computed(function () {
            return self.statsHistorySampleIntervals[self.statsHistoryInteration()];
        });

        self.latestDataMinusSixty = function (army) {
            if (!self.rawdata[army])
                return null;

            var data = self.rawdata[army]();

            if (!data.length)
                return null;

            var offset = self.hasCompleteHistory() ? 60 : 60 / self.statsHistorySampleInterval();
            if (data.length <= offset)
                return null;

            var time = data.length - offset ;
            return data[time];
        };


        self.total = function (army, key) {
            if (!self.rawdata[army])
                return -1;

            return _.reduce(self.rawdata[army](), function (accumumulator, value) {
                if (!value.unitCount) /* ignore samples without units... since the army is 'dead' */
                    return accumumulator;
                return accumumulator + value[key];
            }, 0);
        };

        self.avg = function (army, key) {
            if (!self.rawdata[army])
                return -1;

            var result = 0,
                entry_count = 0;

            result = _.reduce(self.rawdata[army](), function (accumumulator, value) {
                if (!value.unitCount) /* ignore samples without units... since the army is 'dead' */
                    return accumumulator;
                ++entry_count;
                return accumumulator + value[key];
            }, 0);

            return result / entry_count;
        };

        self.duration = function (army) {
            if (!self.rawdata[army])
                return -1;

            var result = 0;
            _.forEach(self.rawdata[army](), function (element) {
                if (element.unitCount)
                    result = Math.max(result, element.time);
            });

            return result;
        };

        self.armyLifetime = function (army) {
            if (!self.armyDefeatTimeMap[army])
                return self.duration(army) - self.gameStartTime;
            return self.armyDefeatTimeMap[army] - self.gameStartTime;
        }

        self.process = function(time, army, prev_army) {
            var energy_full = army.current_resources.energy >= army.total_storage.energy;
            var metal_full = army.current_resources.metal >= army.total_storage.metal;

            var energy_empty = army.current_resources.energy <= 0 && army.total_storage.energy;
            var metal_empty = army.current_resources.metal <= 0 && army.total_storage.metal;

            var energy_eff = (energy_empty && army.total_demand.energy > 0) ? army.total_production.energy / army.total_demand.energy : 1;
            var metal_eff = (metal_empty && army.total_demand.metal > 0) ? army.total_production.metal / army.total_demand.metal : 1;

            if (army.unit_count && (time < self.gameStartTime || self.gameStartTime < 0))
                self.gameStartTime = time;

            if (army.enemy_commanders_destroyed && (!prev_army || prev_army.enemyCommandersDestroyed < army.enemy_commanders_destroyed))
                self.creditCommanderDestruction(army.enemy_commanders_destroyed, time);

            var result = {
                time: time,
                buildEfficiency: 100 * Math.min(energy_eff, metal_eff),
                currentEnergy: army.current_resources.energy,
                currentMetal: army.current_resources.metal,
                demandEnergy: army.total_demand.energy,
                demandMetal: army.total_demand.metal,
                productionEnergy: army.total_production.energy,
                productionMetal: army.total_production.metal,
                netProductionEnergy: army.net_production.energy,
                netProductionMetal: army.net_production.metal,
                storageEnergy: army.total_storage.energy,
                storageMetal: army.total_storage.metal,
                wastedEnergy: energy_full ? Math.abs(army.net_production.energy) : 0,
                wastedMetal: metal_full ? Math.abs(army.net_production.metal) : 0,
                armyCountFabber: army.fabber_army_count,
                armyCountFactory: army.factory_army_count,
                armyCountMobile: army.mobile_army_count,
                unitCount: army.unit_count,
                unitsCreated: army.units_created,
                unitsLost: army.units_lost,
                unitsDestroyed: army.enemy_units_destroyed,
                enemyCommandersDestroyed: army.enemy_commanders_destroyed,
                unitsInCombat: army.total_combat_units_in_combat,
                metalLost: army.metal_lost,
                metalDestroyed: army.enemy_metal_destroyed,
                commandsGiven: army.commands_given,

                unitsCreatedDelta: prev_army ? (army.units_created - prev_army.unitsCreated) : 0,
                unitsLostDelta: prev_army ? (army.units_lost - prev_army.unitsLost)  : 0,
                unitsDestroyedDelta: prev_army ? (army.enemy_units_destroyed - prev_army.unitsDestroyed) : 0,
                metalLostDelta: prev_army ? (army.metal_lost - prev_army.metalLost) : 0,
                metalDestroyedDelta: prev_army ? (army.enemy_metal_destroyed - prev_army.metalDestroyed) : 0,
                commandsGivenDelta: prev_army ? (army.commands_given - prev_army.commandsGiven) : 0,

                cumulativeDemandEnergy: army.cumulative_demand.energy,
                cumulativeDemandMetal: army.cumulative_demand.metal,
                cumulativeProductionEnergy: army.cumulative_production.energy,
                cumulativeProductionMetal: army.cumulative_production.metal,

                cumulativeBuildEfficency: army.cumulative_build_efficency / 10.0 /* calculated recorded 10 per second, but we only want 1 value per second */
            };

            //console.log('cbe:' + army.cumulative_build_efficency)

            return result;
        }
        self.step = function (army_index) {
            return Math.ceil(self.rawdata[army_index]().length / self.resolution());
        };
        self.selectedStat = ko.observable('unitCount');
        self.selectedStatDefinition = ko.computed(function() {
            return _.find(self.definitions(), { 'name': self.selectedStat() });
        });

        self.armyNames = ko.observableArray([]).extend({ session: 'army_names' });
        self.armyColors = ko.observableArray([]).extend({ session: 'army_colors' });

        self.availableVisionFlags = ko.observableArray([]).extend({ session: 'available_vision_flags' });
        self.hasCompleteVision = ko.computed(function () {
            return _.all(self.availableVisionFlags(), function (element) {
                return element;
            });
        });

        self.showArmyControls = ko.computed(function () {
            var count = 0;

            _.forEach(self.availableVisionFlags(), function (value) {
                count += value;
            });

            return count > 1;
        });

        self.graphDataPerArmy = function(army_index, stat) {
            var data = [];

            var size = self.rawdata[army_index]().length;
            var step = self.step(army_index);
            var raw = self.rawdata[army_index]();

            for (var t=1; t<size; t+=step)
                data.push([raw[t].time, raw[t][stat]]);

            return {
                data: data,
                dashes: { show: true, dashLength: _.find(self.definitions(), { 'name': stat }).dash },
                color: self.armyColors()[army_index]
            }
        };

        self.graphData = function () {
            var stat = self.selectedStat();
            var result = [];
            _.forEach(self.rawdata, function (element, index) {
                if (self.activeData()[index])
                    result.push(self.graphDataPerArmy(index, stat));
            });
            return result;
        };

        self.getSummarySnapshotForArmy = function (army_index) {

            if (!self.rawdata[army_index])
                return null;

            return {
                'efficiency': self.latest(army_index, 'buildEfficiency'),
                'metal_produced': self.latest(army_index, 'productionMetal'),
                'metal_demand': self.latest(army_index, 'demandMetal'),
                'metal_wasted': self.latest(army_index, 'wastedMetal'),

                'energy_produced': self.latest(army_index, 'productionEnergy'),
                'energy_demand': self.latest(army_index, 'demandEnergy'),
                'energy_wasted': self.latest(army_index, 'wastedEnergy'),

                'army_count': self.latest(army_index, 'unitCount'),
                'army_count_fabber': self.latest(army_index, 'armyCountFabber'),
                'army_count_factory': self.latest(army_index, 'armyCountFactory'),
                'army_count_mobile': self.latest(army_index, 'armyCountMobile'),

                'commands_given_delta': 60 * self.latest(army_index, 'commandsGivenDelta') /* multiply by 60 to get APM */,

                'duration': self.armyLifetime(army_index)
            };
        }

        self.getSummaryAggregateForArmy = function (army_index) {

            if (!self.rawdata[army_index]) {
                console.log('no data for ' + army_index);
                return null;
            }

            if (_.isEmpty(self.rawdata[army_index]()) || !self.rawdata[army_index]().length) {
                console.log('no data for ' + army_index);
                return null;
            }

            return {
                'efficiency': Math.min(self.latest(army_index, 'cumulativeBuildEfficency') / self.armyLifetime(army_index), 1.0) * 100,
                'metal_produced': self.latest(army_index, 'cumulativeProductionMetal') /* + self.first(army_index, 'currentMetal') */,
                'metal_wasted': self.latest(army_index, 'cumulativeProductionMetal') - self.latest(army_index, 'cumulativeDemandMetal'),
                'energy_produced': self.latest(army_index, 'cumulativeProductionEnergy') /*+ self.first(army_index, 'currentEnergy')*/,
                'energy_wasted': self.latest(army_index, 'cumulativeProductionEnergy') - self.latest(army_index, 'cumulativeDemandEnergy'),
                'commands_given_delta': 60 * self.latest(army_index, 'commandsGiven') / self.armyLifetime(army_index) /* multiply by 60 to get APM */,
                'units_build': self.latest(army_index, 'unitsCreated'),
                'units_lost': self.latest(army_index, 'unitsLost'),
                'units_destroyed': self.latest(army_index, 'unitsDestroyed'),
                'duration': self.armyLifetime(army_index)
            };
        }

        self.summarySnapshotData = function () {
            var result = [];
            _.forEach(self.rawdata, function (element, index) {
                result.push(self.getSummarySnapshotForArmy(index));
            });
            return result;
        };

        self.summaryAggregateData = function () {
            var result = [];
            _.forEach(self.rawdata, function (element, index) {
                result.push(self.getSummaryAggregateForArmy(index));
            });
            return result;
        };

        self.latestSnapshotSummary = ko.observableArray([]);
        self.latestAggregateSummary = ko.observableArray([]);

        self.requestedPlayerArmyIndex = ko.observable();
        self.getPlayerStats = function () {

            var army_index = self.requestedPlayerArmyIndex();

            if (_.isUndefined(army_index))
                return;

            var result = model.getSummaryAggregateForArmy(army_index);
            if (result)
                result.game_over = !model.gameIsOnGoing();

            return result;
        };

        self.requestedVictors = ko.observable();
        self.getVictorStats = function () {

            var victors = self.requestedVictors();

            if (_.isUndefined(victors))
                return;

            var armys = [];
            _.forEach(victors, function (victor) {
                var army_index = -1;
                _.forEach(model.armyNames(), function (name, index) {
                    if (name === victor) {
                        army_index = index;
                        return true;
                    }
                });

                if (army_index !== -1)
                    armys.push(army_index);
            });

            var result = model.getSummaryAggregateForArmy(armys[0]);
            if (!result)
                return result;

            _.forEach(armys, function (army_index, index) {
                if (index) {
                    var summary = model.getSummaryAggregateForArmy(armys[army_index]);
                    _.forIn(summary, function (value, key) {
                        result[key] = result[key] + value;
                    });
                }
            });

            // efficiency only makes sense as an avg
            result['efficiency'] = result['efficiency'] / armys.length;
            result.game_over = !model.gameIsOnGoing();

            return result;
        };

        self.broadcastStats = function () {
            if (!_.isUndefined(self.requestedPlayerArmyIndex()))
                api.Panel.message('', 'player_stats', self.getPlayerStats());

            if (!_.isUndefined(self.requestedVictors()))
                api.Panel.message('', 'victor_stats', self.getVictorStats());
        };

        var processStatsPayload = function (payload) {
            var data = JSON.parse(payload);

            self.initDataArrays(data.armies.length);

            _.forEach(self.rawdata, function (element, index) {
                var army_data = data.armies[index];

                if (self.rawdata[index] && army_data) {

                    if (army_data.defeated) {
                        if (!self.armyDefeatTimeMap[index])
                            self.armyDefeatTimeMap[index] = data.time;
                    }
                    else
                        self.rawdata[index].push(self.process(data.time, army_data, self.latestDataMinusSixty(index)));
                }

                if (_.isUndefined(self.firstTimeLoaded()))
                    self.firstTimeLoaded(0);
            });
        };

        self.fetchingHistory = ko.observable(false);
        var fetchStart = 0;
        var fetchEnd = 0;

        self.requestEndOfTimeStats = function () {
            api.gamestats.get(self.endOfTimeInSeconds())
               .then(processStatsPayload);
        }

        self.statsHistoryBuffer = [];

        self.processStatsHistoryBuffer = function () {
            self.clearDataArrays();
            _.forEach(self.statsHistoryBuffer, processStatsPayload);
            self.statsHistoryBuffer = [];

            if (self.show())
                $.plot($("#graph"), self.graphData(), {
                    xaxis: { tickDecimals: 0 },
                    yaxis: { tickDecimals: 0 },
                    series: {
                        lines: { show: true, fill: false },
                    }
                });
        }

        self.requestStatsHistory = function (time) {

            if (time > self.endOfTimeInSeconds() || time < 0) {
                fetchEnd = _.now();
                self.processStatsHistoryBuffer();

                self.broadcastStats();

                self.statsHistoryInteration(self.statsHistoryInteration() + 1);
                if (self.statsHistoryInteration() < self.statsHistorySampleIntervals.length) {
                    self.statsHistoryBuffer = [];
                    self.requestStatsHistory(0); /* iterate at a finer sample resolution */
                }
                else {
                    self.statsHistoryInteration(0);
                    self.hasCompleteHistory(true)
                    self.fetchingHistory(false);
                    if (self.hasCompleteVision())
                        self.hasCompleteSpectatorHistory(true);
                }
                return;
            }

            if (!self.fetchingHistory()) {
                fetchStart = _.now();
                self.fetchingHistory(true);
                self.statsHistoryBuffer = [];
                self.hasCompleteHistory(false);
            }

            api.gamestats.get(time)
                .then(function (payload) {
                    self.requestStatsHistory(time + self.statsHistorySampleInterval());
                    self.statsHistoryBuffer.push(payload);
                });
        }

        self.hasCompleteSpectatorHistory = ko.observable(false);
        self.hasCompleteVision.subscribe(function (value) {
            if (value && !self.hasCompleteSpectatorHistory() && !self.fetchingHistory()) {
                self.firstTimeLoaded(0);
                self.requestStatsHistory(0);
            }
        });


        self.update = function(force) {

            if (!self.fetchingHistory() && self.gameIsOnGoing()) {

                if (self.firstTimeLoaded() !== 0) {
                    self.requestStatsHistory(0);
                    return;
                }

                api.gamestats.get(self.endOfTimeInSeconds())
                    .then(function (payload) {
                        if (!self.fetchingHistory())
                            processStatsPayload(payload);
                    });
            }

            if (!self.fetchingHistory() || force) {
                if (self.show()) {
                    $.plot($("#graph"), self.graphData(), {
                        xaxis: { tickDecimals: 0 },
                        yaxis: { tickDecimals: 0 },
                        series: {
                            lines: { show: true, fill: false },
                        }
                    });
                }
            }
        }
        self.show.subscribe(function() {
            if (self.show())
                _.delay(function() { self.update(true); });
        });

        self.endOfTimeInSeconds.subscribe(self.update);
        self.selectedStat.subscribe(function () { self.update(true) });
        self.activeData.subscribe(self.update);
        self.currentGameState.subscribe(self.update);

        var doExit = true;
        self.maybeExitStats = function () {
            if (doExit)
                self.close();
            doExit = true;
            return true; /* lets the event propogate */
        };
        self.preventExitStats = function () {
            doExit = false;
        };

        $(window).focus(function() { self.active(true); });
        $(window).blur(function () { self.active(false); });

        self.handlePlayerData = function (payload) {
            model.armyColors(payload.colors);
            model.armyNames(payload.names);
        };

        self.setup = function () {
            parentQuery('playerData').then(self.handlePlayerData);
        };
    }

    model = new GamestatsViewModel();

    handlers.server_state = function (msg) {

        var gameOverMsg;
        var numWinners;

        model.currentGameState(msg.state);

        if (msg.data)
        {
            gameOverMsg = msg.data.game_over;
            if (gameOverMsg && gameOverMsg.victor_name) {
                numWinners = gameOverMsg.victor_players.length;
                if (numWinners)
                    model.victors(gameOverMsg.victor_players);
                else
                    model.victors([gameOverMsg.victor_name]);
            }
        }
    };
    handlers.time = function (payload) {
        if (payload.view !== 0)
            return;
        model.currentTimeInSeconds(payload.current_time);
        model.endOfTimeInSeconds(Math.floor(payload.end_time));
    };
    handlers.player_data = model.handlePlayerData;


    handlers.available_vision_flags = function (payload) {
        model.availableVisionFlags(payload);
        model.activeData(model.availableVisionFlags());

        model.requestEndOfTimeStats();
    };

    handlers['query.player_summary'] = function (payload) {
        model.requestedPlayerArmyIndex(payload[0]);
        return model.getPlayerStats();
    }
    handlers['query.victors_summary'] = function (victors) {
        model.requestedVictors(victors);
        return model.getVictorStats();
    }

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();

    app.hello(handlers.server_state);
});

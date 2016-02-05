// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    var ALERT_INDICATOR_MIN_WIDTH = 8; // pixels
    function AlertIndicatorModel(params) {

        var self = this;
        var time = params.time;
        var bar = params.bar;

        self.beginTime = ko.observable(time);
        self.endTime = ko.observable(time);
        self.middleTime = ko.computed(function() {
            return (self.beginTime() + self.endTime()) / 2;
        });

        self.merge = function(source) {
            if (source.beginTime() < self.beginTime())
                self.beginTime(source.beginTime());
            if (source.endTime() > self.endTime())
                self.endTime(source.endTime());
        };

        self.center = ko.computed(function() {
            return bar.timeProgressFrameWidth() * self.middleTime() / bar.endOfTimeInSeconds() + bar.timeScrubOffset();
        });
        self.left = ko.computed(function() {
            return Math.min(self.center() - ALERT_INDICATOR_MIN_WIDTH / 2,
                bar.timeProgressFrameWidth() * self.beginTime() / bar.endOfTimeInSeconds() + bar.timeScrubOffset()
            );
        });
        self.right = ko.computed(function() {
            return Math.max(self.center() + ALERT_INDICATOR_MIN_WIDTH / 2,
                bar.timeProgressFrameWidth() * self.endTime() / bar.endOfTimeInSeconds() + bar.timeScrubOffset()
            );
        });
        self.width = ko.computed(function() {
            return self.right() - self.left();
        });
        self.radius = ko.computed(function() {
            return self.width() / 2;
        });

        self.displayBeginTime = ko.computed(function() {
            return self.left() * bar.endOfTimeInSeconds() / bar.timeProgressFrameWidth();
        });
        self.displayEndTime = ko.computed(function() {
            return self.right() * bar.endOfTimeInSeconds() / bar.timeProgressFrameWidth();
        });

        // CSS
        self.widthPx = ko.computed(function() {
            return Math.round(self.width()).toString() + 'px';
        });
        self.leftPx = ko.computed(function() {
            return Math.round(self.left()).toString() + 'px';
        });

        self.activate = function() {
            bar.toggleAlertIndicator(self);
        };

        self.visible = ko.computed(function() {
            return true;
            // This hides the alert indicator when the scrubber is near.
            // (Currently disabled.  Prototype feature.)
            // var MARGIN = 5; // pixels
            // var scrubPos = bar.timeScrubValue() + bar.timeScrubMarginOffset();
            // return Math.abs(scrubPos - self.center()) > (self.radius() + MARGIN);
        });
    }

    function TimeBarViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.state.subscribe(function() {
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        });
        self.visible = ko.computed(function () { return self.state().visible; });
        self.isSpectator = ko.computed(function () {
            return self.state().isSpectator;
        });

        self.timeSpeed = ko.observable(1.0);
        self.paused = ko.observable(false);

        self.skipBack30 = function () {
            api.time.skip(-30.0);
        };
        self.skipBack15 = function () {
            api.time.skip(-15.0);
        };
        self.skipFwd30 = function () {
            api.time.skip(30.0);
        };
        self.skipFwd120 = function () {
            api.time.skip(120.0);
        };
        self.seekBack = function () {
            self.paused(false);
            var ts = self.timeSpeed();
            ts = ((ts < 0.0) ? ts * 2.0 : -2.0);
            self.timeSpeed(ts);
            api.time.play(ts);
        };
        self.playBack = function () {
            self.paused(false);
            self.timeSpeed(-1.0);
            api.time.play(-1.0);
        };
        self.pause = function () {
            self.paused(true);
            api.time.pause();
        };
        self.resume = function () {
            self.paused(false);
            api.time.resume();
        };
        self.playForward = function () {
            self.paused(false);
            self.timeSpeed(1.0);
            api.time.play(1.0);
        };
        self.seekForward = function () {
            self.paused(false);
            var ts = self.timeSpeed();
            ts = ((ts > 0.0) ? ts * 2.0 : 2.0);
            self.timeSpeed(ts);
            api.time.play(ts);
        };

        self.inTimeScrub = ko.observable(false);

        self.timeScrubStartX = ko.observable(0.0);
        self.timeScrubCurrentX = ko.observable(0.0);
        self.timeScrubBaseTime = ko.observable(0.0);

        self.currentTimeInSeconds = ko.observable(0.0);
        self.endOfTimeInSeconds = ko.observable(0.0);
        self.timeFraction = ko.computed(function () {
            return Math.min((self.endOfTimeInSeconds()) ? self.currentTimeInSeconds() / self.endOfTimeInSeconds() : 0.0, 1.0);
        });
        self.timePercentString = ko.computed(function () {
            return '' + (100 * self.timeFraction()) + '%';
        });

        var $time_progress_frame = $('.div_time_progress_frame');

        self.timeProgressFrameWidth = ko.observable($time_progress_frame.width());

        window.onresize = function () {
            self.timeProgressFrameWidth($time_progress_frame.width());
        }

        self.timeScrubValue = ko.computed(function () {
            return (self.timeProgressFrameWidth() * self.timeFraction());
        });

        self.timeScrubTargetTime = ko.computed(function () {
            return (self.timeScrubValue() / self.timeProgressFrameWidth()) * self.endOfTimeInSeconds();
        });

        self.timeScrubOffset = ko.observable(11);
        self.timeScrubMarginOffset = ko.observable(4);

        self.timeScrubPixel = ko.computed(function () {
            return '' + Math.round(self.timeScrubValue() - self.timeScrubOffset()) + 'px';
        });

        self.startTimeScrub = function () {
            var event = window.event;
            self.inTimeScrub(true);
            self.timeScrubStartX(event.screenX);
            self.timeScrubBaseTime(self.currentTimeInSeconds());
            api.time.pushSpeed();
            api.time.pause();
        };
        self.stopTimeScrub = function () {
            self.inTimeScrub(false);
            api.time.play(1.0);
            api.time.popSpeed();
        };
        self.scrubTime = ko.pureComputed(function() {
            if (!self.inTimeScrub())
                return self.currentTimeInSeconds();
            var dx = self.timeScrubCurrentX() - self.timeScrubStartX();
            var dt = (dx / self.timeProgressFrameWidth()) * self.endOfTimeInSeconds();
            var target = self.timeScrubBaseTime() + dt;

            if (target > self.endOfTimeInSeconds())
                target = self.endOfTimeInSeconds();
            if (target < 0)
                target = 0;
            return Number(target);
        });
        self.updateTimeScrub = function() {
            api.time.set(self.scrubTime());
        };

        self.close = function() {
            api.Panel.message(api.Panel.parentId, 'time_bar.close');
        };

        self.showPlayFromHere = ko.computed(function () { return self.state().showPlayFromHere; });
        self.disablePlayFromHere = ko.computed(function () {
            var difference = self.endOfTimeInSeconds() - self.currentTimeInSeconds();
            if (difference < 2)
                return true;

            var min = self.state().minValidTime;
            var max = self.state().maxValidTime;

            if (min === -1 || self.scrubTime() <= min)
                return true;

            if (max !== -1 && self.scrubTime() >= self.state().maxValidTime)
                return true;

            return false;
        });

        self.playFromHere = function () {
            if (self.disablePlayFromHere())
                return;
  
            api.Panel.message(api.Panel.parentId, 'time_bar.play_from_here', self.currentTimeInSeconds());
        };

        self.currentTimeString = ko.computed(function () {
            return UberUtility.createTimeString(self.currentTimeInSeconds());
        });

        self.endOfTimeString = ko.computed(function () {
            return UberUtility.createTimeString(self.endOfTimeInSeconds());
        });

        self.alertIndicators = ko.observableArray();
        self.minAlertDistance = ko.observable();
        self.alertMergeDistance = ko.computed(function() {
            var mergePixels = 2; // pixels
            return self.endOfTimeInSeconds() * mergePixels / self.timeProgressFrameWidth();
        });
        var mergeAlertInidicatorsRule = ko.computed(function() {
            var minDistance = self.minAlertDistance();
            if (!_.isFinite(minDistance))
                return; // Must have more than one alert
            var mergeDistance = self.alertMergeDistance();
            if (minDistance > mergeDistance)
                return; // Nothing is close enough to merge

            // Perform appropriate merges
            var indicators = self.alertIndicators();
            var mutated = false;
            for (var i = 0; i < (indicators.length - 1); ) {
                var left = indicators[i];
                var right = indicators[i + 1];
                if ((right.displayBeginTime() - left.displayEndTime()) < mergeDistance) {
                    mutated = true;
                    left.merge(right);
                    indicators.splice(i + 1, 1);
                }
                else
                    ++i;
            }

            if (mutated) {
                // Re-calculate minimum distance
                minDistance = Infinity;
                for (var i = 0; i < (indicators.length - 1); ++i) {
                    var left = indicators[i];
                    var right = indicators[i + 1];
                    minDistance = Math.min(minDistance, right.displayBeginTime() - left.displayEndTime());
                }
                self.minAlertDistance(minDistance);
                // Notify subscribers of the indicators
                self.alertIndicators.valueHasMutated();
            }
        });


        self.rejectedWatchTypes = (function () {
            var types = [
               'ready',
               'damage',
               'projectile',
               'target_destroyed',
               'idle',
               'linked',
               'energy_requirement_met_change',
               'ammo_fraction_change'
            ];

            var map = {};

            _.forEach(types, function (element) {
                map[constants.watch_type[element]] = true;
            });

            return map;

        })();

        self.filterList = function (list) {
            _.remove(list, function (element) {
                return self.rejectedWatchTypes[element.watch_type];
            });
        };

        self.alertData = ko.observable([]);

        self.processAlertList = function (alerts, custom) {

            self.filterList(alerts);

            if (alerts.length === 0)
                return;

            var updateMinAlertDistance = function(newDistance) {
                newDistance -= ALERT_INDICATOR_MIN_WIDTH;
                var oldDistance = self.minAlertDistance();
                if (!_.isFinite(oldDistance) || newDistance < oldDistance)
                    self.minAlertDistance(newDistance);
            };

            var now = self.currentTimeInSeconds();
            self.alertIndicators.push(new AlertIndicatorModel({ time: now, bar: this }));

            var alertData = self.alertData();
            var newEntry = {time: now, list: alerts, custom: custom};
            var lastAlert = _.last(alertData);
            if (!lastAlert || now > lastAlert.time) {
                alertData.push(newEntry);
                if (lastAlert)
                    updateMinAlertDistance(now - lastAlert.time);
            } else {
                var nextAlert = _.sortedIndex(alertData, {time: now}, 'time');
                alertData.splice(nextAlert, 0, newEntry);
                if (nextAlert > 0)
                    updateMinAlertDistance(alertData[nextAlert - 1].time - now);
                updateMinAlertDistance(now - alertData[nextAlert + 1].time);
            }
        };

        self.getAlertRange = function(beginTime, endTime) {
            var alertData = self.alertData();

            var startAlert = _.sortedIndex(alertData, {time: beginTime}, 'time');
            var endAlert = startAlert + 1;
            for (; endAlert < alertData.length && alertData[endAlert].time <= endTime; ++endAlert);
            return alertData.slice(startAlert, endAlert);
        };

        self.currentAlertIndicator = ko.observable(null);
        self.alertListLeft = ko.observable(0);
        self.alertListLeftPx = ko.computed(function() {
            var left = Math.max(Math.min(self.alertListLeft(), self.timeProgressFrameWidth() - $('#time_bar_alerts').width()), 0);
            return Math.round(left).toString() + 'px';
        });
        self.popupAlertList = ko.observableArray();
        self.clearAlertList = function() {
            self.currentAlertIndicator(null);
            self.popupAlertList.removeAll();
        };
        self.showAlertList = ko.computed(function() { return !!self.popupAlertList().length && self.visible(); });
        self.toggleAlertIndicator = function(indicator) {
            if (self.showAlertList() && self.currentAlertIndicator() === indicator) {
                self.clearAlertList();
                return;
            }
            self.clearAlertList();
            var alerts = self.getAlertRange(indicator.beginTime(), indicator.endTime());
            self.alertListLeft(indicator.left());
            self.popupAlertList(alerts);
            self.currentAlertIndicator(indicator);
        };

        self.alertListState = ko.computed(function() {
            return {
                visible: self.showAlertList(),
                items: self.popupAlertList()
            };
        });
        self.alertListState.subscribe(function() {
            api.panels.time_bar_alerts.message('state', self.alertListState());
            api.panels.time_bar_alerts.update();
            _.delay(function() {
                api.panels.time_bar_alerts.update();
            });
        });

        self.pauseEndOfTime = ko.computed(function() {
            return self.inTimeScrub() || self.showAlertList();
        });

        self.restart = ko.observable(false);

        self.discardData = function () {
            self.alertIndicators([]);
            self.alertData([]);
        };

        self.setup = function () {
            $(document).mousemove(function (event) {
                if (model.inTimeScrub()) {
                    self.timeScrubCurrentX(event.screenX);
                    model.updateTimeScrub();
                }
            });
            $(document).mouseup(function (event) {
                if (model.inTimeScrub())
                    model.stopTimeScrub();
            });

            parentQuery('timeBarState').then(self.state);
        };
    }
    model = new TimeBarViewModel();

    var pauseProbe = 0;
    handlers.time = function (payload) {
        if (payload.view !== 0)
            return;
        model.currentTimeInSeconds(payload.current_time);
        // On start-up, we don't know if time is already paused.  This detects that situation.
        if (!pauseProbe) {
            _.delay(function() {
                if (model.currentTimeInSeconds() === payload.current_time)
                    model.paused(true);
            }, 1000);
        }
        ++pauseProbe;

        if (!model.pauseEndOfTime())
            model.endOfTimeInSeconds(payload.end_time);
    };

    handlers.state = function(payload) {
        model.state(payload);
    };

    handlers.watch_list = function (payload) {
        if (model.isSpectator())
            return;

        model.processAlertList(payload.list);
    };

    handlers.custom_alert = function (name) {
        if (model.isSpectator())
            return;

        model.processAlertList([name], true);
    };

    handlers['panel.invoke'] = function(params) {
        var fn = params[0];
        var args = params.slice(1);
        return model[fn] && model[fn].apply(model, args);
    };

    handlers.control_state = function (payload) {
        if (!payload.restart && model.restart())
            model.discardData();
        
        model.restart(payload.restart);
    }

    // inject per scene mods
    if (scene_mod_list['live_game_time_bar'])
        loadMods(scene_mod_list['live_game_time_bar']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

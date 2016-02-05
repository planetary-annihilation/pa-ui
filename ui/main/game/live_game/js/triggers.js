
var triggerModel = (function () {

    function TriggerCondition(options /* threshold interval */) {

        var self = this;

        var threshold = _.has(options, 'threshold') ? options.threshold : 1.0;
        var interval = _.has(options, 'interval') ? options.interval : 0;
        var accumulate = !!_.has(options, 'accumulate');
        var normalize = !!options.normalize;
        var greater = !!options.greater;
        if (accumulate)
            interval = options.accumulate;

        var prev_sample; /* { time value } */
        var total = 0;

        var callback = options.callback;

        function testThreshold(value) {
            if (greater)
                return value > threshold;
            else
                return value <= threshold;
        }

        function testWithInterval (value) {
            var now = _.now();
            var delta;

            if (accumulate) 
                total += value;
            
            if (!prev_sample) {
                prev_sample = { 'time' : now, 'value' : value };
                return false;
            }

            if (now < prev_sample.time + interval)
                return false;
            
            if (normalize)
                delta = (value - prev_sample.value) / prev_sample.value;
            else
                delta = value - prev_sample.value;

            prev_sample.time = now;
            prev_sample.value = value;
            
            if (accumulate) {
                delta = total;
                total = 0;          
            }
            
            return testThreshold(delta);
        }

        self.test = function (value) {

            var fire;

            if (interval) 
                fire = testWithInterval(value);
            else
                fire = testThreshold(value);

            if (fire && callback)
                callback();

            return fire;
        }
    }

    function TriggerModel() {
        var self = this;

        var triggers = { /* event_type: TriggerModel */ };

        triggers[constants.event_type.low_metal] = new TriggerCondition({
            threshold: 0.2
        });
        triggers[constants.event_type.low_energy] = new TriggerCondition({
            threshold: 0.2
        });
        triggers[constants.event_type.auto_conservation_started] = new TriggerCondition({
            threshold: 0.0
        });
        triggers[constants.event_type.auto_conservation_stopped] = new TriggerCondition({
            threshold: 0.0
        });
        triggers[constants.event_type.full_metal] = new TriggerCondition({
            threshold: 0.0
        });
        triggers[constants.event_type.full_energy] = new TriggerCondition({
            threshold: 0.0
        });
        triggers[constants.event_type.under_attack] = new TriggerCondition({
            threshold: 1500,
            interval: 5 * 1000 /* in ms */,
            normalize: false,
            greater: true,
        });
        triggers[constants.event_type.enemy_metal_destroyed] = new TriggerCondition({
            threshold: 1500,
            interval: 5 * 1000 /* in ms */,
            normalize: false,
            greater: true,
            callback: function () { audioModel.triggerBattleMusic(); }
        });
        triggers[constants.event_type.metal_lost] = new TriggerCondition({
            threshold: 1500,
            interval: 5 * 1000 /* in ms */,
            normalize: false,
            greater: true,
            callback: function () { audioModel.triggerBattleMusic(); }
        });
        triggers[constants.event_type.in_combat] = new TriggerCondition({
            threshold: 10,
            normalize: false,
            greater: true,
            callback: function () { audioModel.triggerBattleMusic(); }
        });
        triggers[constants.event_type.commander_under_attack] = new TriggerCondition({
            threshold: -0.01,
            interval: 5 * 1000 /* in ms */,
            callback: function () { api.debug.log('commander_under_attack'); }
        });
        triggers[constants.event_type.allied_commander_under_attack] = new TriggerCondition({
            threshold: -0.01,
            interval: 5 * 1000 /* in ms */,
            callback: function () { api.debug.log('allied_commander_under_attack'); }
        });
        triggers[constants.event_type.commander_healed] = new TriggerCondition({
            threshold: 0.01,
            interval: 5 * 1000 /* in ms */,
            greater: true,
            callback: function () { api.debug.log('commander_healed'); }
        });
        triggers[constants.event_type.commander_low_health] = new TriggerCondition({
            threshold: 0.4,
            callback: function () { api.debug.log('commander_low_health'); }
        });
        triggers[constants.event_type.allied_commander_low_health] = new TriggerCondition({
            threshold: 0.4,
            callback: function () { api.debug.log('allied_commander_low_health'); }
        });
        triggers[constants.event_type.enemy_commander_low_health] = new TriggerCondition({
            threshold: 0.4,
            callback: function () { api.debug.log('enemy_commander_low_health'); }
        });
        triggers[constants.event_type.commander_under_attack_very_low_health] = new TriggerCondition({
            threshold: 0.2,
            callback: function () { api.debug.log('commander_under_attack_very_low_health'); }
        });

        self.testEvent = function (event_type, value, payload) {
            var trigger = triggers[event_type];
            if (trigger && trigger.test(value)) {
                eventSystem.processEvent(event_type, payload);
            }
        }
    }

    return new TriggerModel();
})();

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

    function AlertItem(params) {
        var self = this;
        var time = params.time;
        var data = params.data;
        var spectator = params.spectator;

        self.time = ko.observable(time);
        self.data = ko.observable(data);

        self.ready = ko.observable(false);
        self.name = ko.observable('');
        self.text = ko.observable('');
        self.sicon = ko.observable('');
        self.color = ko.observable('');
        self.spectator = ko.observable();
        self.armyColor = ko.observable('');

        self.cssClass = ko.computed(function() {
            var color = spectator ? 'white' : self.color();
            return color && ('alert_item_' + color);
        });

        self.activate = function() {
            api.time.set(time - 0.1);
            if (data.location) {
                var target = {
                    location: data.location,
                    planet_id: data.planet_id
                };
                api.camera.lookAt(target);
            }
            parentInvoke('clearAlertList');
        };

        api.Panel.query('unit_alert', 'panel.invoke', ['getAlertSummary', data]).then(function(summary) {
            self.name(summary.name);
            self.text(summary.text);
            self.sicon(summary.sicon);
            self.color(summary.color || '');
            self.armyColor(summary.army_color);
            self.ready(true);
            _.delay(api.Panel.onBodyResize);
        });
    }

    function TimeBarAlertListViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.state.subscribe(function() {
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        });
        self.visible = ko.computed(function() { return !!self.state().visible; });
        self.visible.subscribe(function() {
            if (self.visible())
                api.Panel.focus(api.Panel.pageId);
        });

        self.isSpectator = ko.computed(function () { return true || !!self.state().spectator; });

        self.items = ko.computed(function() {
            return _.flattenDeep(
                _.map(self.state().items || [], function(group) {
                    var time = group.time;
                    if (group.custom)
                        return new AlertItem({ time: time, data: { custom: true, name: group.list[0].name }, spectator: self.isSpectator() });
                    else
                        return _.map(group.list, function(item) {
                            return new AlertItem({ time: time, data: item, spectator: self.isSpectator() });
                        });
                })
            );
        });

        self.isMouseOver = ko.observable(false);
        self.gainMouse = function() { self.isMouseOver(true); };
        self.loseMouse = function() { self.isMouseOver(false); };

        var cameraPaused = false;
        var pauseCameraRule = ko.computed(function() {
            var pause = !!(self.visible() && self.items().length && self.isMouseOver());
            if (pause !== cameraPaused) {
                cameraPaused = pause;
                api.Panel.message('game', 'panel.invoke', ['pauseCamera', pause]);
            }
        });

        self.setup = function() {
            parentQuery('alertListState').then(self.state);
        };
    }
    model = new TimeBarAlertListViewModel();

    handlers.state = function(payload) {
        model.state(payload);
    };

    handlers['panel.focused'] = function(payload) {
        if (!payload.focused)
            parentInvoke('clearAlertList');
    };

    // inject per scene mods
    if (scene_mod_list['live_game_time_bar_alerts'])
        loadMods(scene_mod_list['live_game_time_bar_alerts']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    var formatResource = function(r) {
            if (!r) return '';
            if (r < 10000) return r;
            return (Math.floor(r / 10 + 0.5) / 100) + 'K'; /* we could do the whole M, G, T stack of suffixes, but our data never calls for it */
        },
        formatTime = function(t) {
            return t ? (Math.floor(t * 100 + 0.5) / 100 + 's') : '';
        },
        ResourceModel = function(state, key, name) {
            var resources = ko.pureComputed(function() {return state() && state()[key];}),
                model = {
                    name: loc(name),
                    energy: ko.pureComputed(function () {
                        return formatResource(resources() && resources().energy);
                    }),
                    metal: ko.pureComputed(function () {
                        return formatResource(resources() && resources().metal);
                    }),
                    visible: ko.pureComputed(function () {
                        return !!(model.energy() || model.metal());
                    })
                };

            return model;
        },
        EnergyWeaponModel = function(state, key) {
            var ammo = ko.pureComputed(function() {return state() && state()[key];}),
                model = {
                    perShot: ko.pureComputed(function () { return formatResource(ammo() && ammo().ammo_per_shot); }),
                    capacity: ko.pureComputed(function () { return formatResource(ammo() && ammo().ammo_capacity); }),
                    demand: ko.pureComputed(function () { return formatResource(ammo() && ammo().ammo_demand); }),
                    rechargeTime: ko.pureComputed(function () { return formatTime(ammo() && (ammo().ammo_per_shot / ammo().ammo_demand)); }),
                    visible: ko.pureComputed(function () {
                        return !!model.perShot();
                    })
                };

            return model;
        };

    function BuildHoverViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.name = ko.computed(function() { return self.state().name || ''; });
        self.desc = ko.computed(function() { return self.state().desc || ''; });
        self.health = ko.computed(function() { return self.state().maxHealth || ''; }).extend({ numeric: 2 });
        self.damage = ko.computed(function () { return self.state().damage || ''; }).extend({ numeric: 2 });
        self.cost = ko.computed(function () { return self.state().cost || ''; }).extend({ numeric: 2 });
        self.fireRate = ko.computed(function () { return self.state().fireRate || ''; }).extend({ numeric: 2 });
        self.fireTime = ko.computed(function () { return self.state().fireRate && formatTime(1 / self.state().fireRate);});

        self.buildArm = ResourceModel(self.state, 'build_arm', '!LOC:DRAW');
        self.storage = ResourceModel(self.state, 'storage', '!LOC:STORAGE');
        self.consumption = ResourceModel(self.state, 'consumption', '!LOC:DRAW');
        self.production = ResourceModel(self.state, 'production', '!LOC:PROD');

        self.energyWeapon = EnergyWeaponModel(self.state, 'energy_weapon');

        self.siconUrl = ko.computed(function() { return self.state().siconUrl || ''; });

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['buildHover']).then(function(state) { self.state(state || {}); });
        };
    }
    model = new BuildHoverViewModel();

    handlers.state = function (payload) {
        model.state(payload);
    };

    // get team colors!
    playerInfoHelper.injectHandlers(handlers);
    model.playerInfo = playerInfoHelper;

    // inject per scene mods
    if (scene_mod_list['live_game_build_hover'])
        loadMods(scene_mod_list['live_game_build_hover']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

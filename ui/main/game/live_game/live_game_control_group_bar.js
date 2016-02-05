// !LOCNS:live_game
var model;
var handlers = {};

var IDLE_FABBER_INDEX = 10;
var IDLE_FACTORY_INDEX = 11;

$(document).ready(function () {

    var baseGroup = {
        total: null,
        breakdown: {},
        types: {},
        index: 0
    }

    function ControlGroupBarViewModel() {
        var self = this;

        self.hasSelection = ko.observable(false);

        var createControlGroups = function () {
            var result = [];
            _.times(10, function (n) {
                var group = _.cloneDeep(baseGroup);
                group.index = n;
                result.push(group);
            });
            return result;
        };

        self.controlGroupList = ko.observable(createControlGroups());

        self.orderedControlGroupList = ko.computed(function () {
            var list = self.controlGroupList();

            if (_.isEmpty(list))
                return list;

            var result = self.controlGroupList().slice(1);
            result.push(self.controlGroupList()[0]);
            return result;
        });

        self.idleFabberMap = ko.observable({});
        self.idleFactoryMap = ko.observable({});
        self.currentFocusPlanetId = ko.observable(0);

        var defaultIdleFabberGroup = _.cloneDeep(baseGroup);
        defaultIdleFabberGroup.total = 0;
        defaultIdleFabberGroup.index = -2;

        var defaultIdleFactoryGroup = _.cloneDeep(baseGroup);
        defaultIdleFactoryGroup.total = 0;
        defaultIdleFactoryGroup.index = -3;

        self.currentFocusPlanetIdleFabberGroup = ko.computed(function () {
            var result = self.idleFabberMap()[self.currentFocusPlanetId()];
            return result ? result : defaultIdleFabberGroup;
        });
        self.currentFocusPlanetIdleFactoryGroup = ko.computed(function () {
            var result = self.idleFactoryMap()[self.currentFocusPlanetId()];
            return result ? result : defaultIdleFactoryGroup;
        });

        self.types = ko.observableArray([
           'Commander',
           'Bot',
           'Tank',
           'Air',
           'Naval',
           'Orbital',
           'Advanced',
           'Fabber',
           'Factory'
        ]);

        var typeDescriptions = {
            'Commander': '!LOC:Commander',
            'Bot': '!LOC:Bot',
            'Tank': '!LOC:Vehicle',
            'Air': '!LOC:Air',
            'Naval': '!LOC:Naval',
            'Orbital': '!LOC:Orbital',
            'Advanced': '!LOC:Advanced',
            'Fabber': '!LOC:Fabber',
            'Factory': '!LOC:Factory',
        };

        self.typeDescription = function(type) {
            return _.get(typeDescription, type, '');
        };

        self.hoverIndex = ko.observable(-1);

        self.setHover = function (element, index) {
            self.hoverIndex(index);

            var group = self.controlGroupList()[index];
            if (group && group.total) {
                self.group.preview(element, index);
            }
        };

        self.group = {
            preview: function(element, id, holodeck) {
                var target = {
                    control_group: id, // todo : we also want to allow a unit type filter here
                    zoom: 'air' // todo: should we pick this more cleverly, since we know what units are in the group?
                }, placement = {
                    element: element,
                    holodeck: holodeck,
                    alignElement: [.5, 0],
                    alignDeck: [-.5, -1],
                    offset: [0, -8],
                    slideshowDelay: 2500
                };

                preview.show(target, placement);
            },
            endPreview: function() {
                preview.hide();
            }
        }

        self.clearHover = function () {
            self.group.endPreview();
            self.hoverIndex(-1);
        };

        self.imageSourceForType = function (type) {
            return 'coui://ui/main/game/live_game/img/control_group_bar/icon_category_' + type.toLowerCase() + '.png'
        };

        var createTypeArrayForGroup = function (group, index, omit_type) {
            if (!group)
                return [];

            var result = _.compact(_.map(self.types(), function (element) {
                if (!group.types[element])
                    return null;

                return {
                    type: element,
                    count: group.types[element],
                    source: self.imageSourceForType(element),
                    index: index
                }
            }));

            if (omit_type)
                result = _.reject(result, { 'type': omit_type });

            return result;
        };

        self.typeItemsForGroup = function (index) {
            return createTypeArrayForGroup(self.controlGroupList()[index], index);
        };

        self.typeItemsForIdleFabberGroup = function () {
            return createTypeArrayForGroup(self.currentFocusPlanetIdleFabberGroup(), IDLE_FABBER_INDEX, 'Fabber');
        };

        self.typeItemsForIdleFactoryGroup = function () {
            return createTypeArrayForGroup(self.currentFocusPlanetIdleFactoryGroup(), IDLE_FACTORY_INDEX, 'Factory');
        };

        var controlMap = (function () {
            var result = {};

            _.forEach(self.controlGroupList(), function (element) {
                result[element.index] = input.doubleTap(
                    function () { api.select.recallGroup(element.index) },
                    function () { api.camera.track(true);
                })
            });

            return result;
        })();

        self.captureOrRecall = function (data, index) {
            if (!data || !data.total)
                api.select.captureGroup(index);
            else
                controlMap[index]();
        };

        self.forget = function (index) {
            api.select.forgetGroup(index);
        };

        var idleMap = {
            'Fabber': input.doubleTap(function () { api.select.idleFabbersOnScreenWithTypeFilter(self.currentFocusPlanetId(), [], null); },
                                      function () { api.select.idleFabbers(self.currentFocusPlanetId()); }),
            'Factory': input.doubleTap(function () { api.select.idleFactoriesOnScreenWithTypeFilter(self.currentFocusPlanetId(), [], null); },
                                       function () { api.select.idleFactories(self.currentFocusPlanetId()); }),
        };

        self.idleSelect = function (type) {
            idleMap[type]();
        }

        var quickSelectMap = (function () {
            var result = {};

            _.forEach(self.types(), function (element) {
                var rejection = element === 'Fabber' ?  null : 'Fabber';

                result[element] = input.doubleTap(function () { api.select.onScreenWithTypeFilter(self.currentFocusPlanetId(), element, rejection); },
                                                  function () { api.select.onPlanetWithTypeFilter(self.currentFocusPlanetId(), element, rejection); })
            });

            return result;
        })();

        self.quickSelect = function (type) {
            quickSelectMap[type]();
        };

        self.discardData = function () {
            self.idleFabberMap({});
            self.idleFactoryMap({});

            _.times(10, function (index) {
                api.select.forgetGroup(index);
            });

            self.controlGroupList(createControlGroups());
        };

        self.restart = ko.observable(false);

        self.setup = function () {

        };
    }

    model = new ControlGroupBarViewModel();

    var parseSelectionUnitTypes = function (type_counts) {
        var result = {};

        _.forEach(type_counts, function (element, key) {
            switch (Number(key)) {
                case constants.unit_type.Commander: result['Commander'] = element; break;
                case constants.unit_type.Fabber: result['Fabber'] = element; break;
                case constants.unit_type.Tank: result['Tank'] = element; break;
                case constants.unit_type.Bot: result['Bot'] = element; break;
                case constants.unit_type.Naval: result['Naval'] = element; break;
                case constants.unit_type.Air: result['Air'] = element; break;
                case constants.unit_type.Orbital: result['Orbital'] = element; break;
                case constants.unit_type.Advanced: result['Advanced'] = element; break;
                case constants.unit_type.Factory: result['Factory'] = element; break;
                default: api.debug.log('no match for '+ key); break;
            }
        });

        return result;
    };

    handlers.selection_group_counts = function (payload) {
        var result = _.clone(model.controlGroupList());
        model.controlGroupList([]);
        _.forEach(payload.list, function (element, index) {
            if (!element)
                return;

            var group = result[index];
            group.breakdown = element.spec_counts;
            group.total = _.reduce(group.breakdown, function (sum, num) {
                return sum + num;
            });
            group.types = parseSelectionUnitTypes(element.type_counts);
        });
        model.controlGroupList(result);
    };

    handlers.focus_planet_changed = function (payload) {
        model.currentFocusPlanetId(payload.focus_planet_id);
    };

    handlers.idle_unit_counts = function (payload) {

        var process =  function (element, key, index, result) {
            if (!element)
                return;

            var group = result[key];
            if (!group) {
                group = _.cloneDeep(baseGroup);
                group.index = index;
            }
            group.breakdown = element.spec_counts;
            group.total = _.reduce(group.breakdown, function (sum, num) {
                return sum + num;
            });
            group.types = parseSelectionUnitTypes(element.type_counts);
            result[key] = group;
        };

        var fabber = _.clone(model.idleFabberMap());
        _.forEach(payload.fabber, function (element, key) {
            process(element, key, IDLE_FABBER_INDEX, fabber);
        });
        model.idleFabberMap(fabber);

        var factory = _.clone(model.idleFactoryMap());
        _.forEach(payload.factory, function (element, key) {
            process(element, key, IDLE_FACTORY_INDEX, factory);
        });
        model.idleFactoryMap(factory);

        model.currentFocusPlanetId(payload.focus_planet_id);
    }

    handlers.has_selection = function (payload) {
        model.hasSelection(!!payload);
    };

    handlers.control_state = function (payload) {
        if (!payload.restart && model.restart())
            model.discardData();

        model.restart(payload.restart);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_control_group_bar'])
        loadMods(scene_mod_list['live_game_control_group_bar']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

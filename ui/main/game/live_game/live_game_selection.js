// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    var imageSourceForType = function (type) {
        return 'coui://ui/main/game/live_game/img/control_group_bar/icon_category_' + type.toLowerCase() + '.png'
    };

    function ParsedSelectionViewModel(map, groups) {
        var self = this;

        self.types = ko.observableArray(_.keys(map));
        self.counts = ko.observableArray(_.pluck(map, 'length'));
        self.groups = ko.observable(groups);

        self.total = ko.observable(0);

        self.list = ko.computed(function () {
            self.total(0);
            var counts = self.counts();
            return _.map(self.types(), function(type, index) {
                var groups = self.groups()[type];
                var group = '';
                if (groups && groups.length > 0) {
                    group = groups[0];
                    if (groups.length > 1)
                        group = group + '+';
                }
                self.total(self.total() + counts[index]);
                return {
                    type: type,
                    count: counts[index],
                    hasGroup: group !== '',
                    group: group,
                    icon: Build.iconForSpecId(type)
                };
            });
        });
    }

    function SelectionViewModel() {
        var self = this;

        self.selectionModel = ko.observable(new ParsedSelectionViewModel({}));
        self.selectionList = ko.computed(function () { return self.selectionModel().list() });

        self.types = ko.observableArray([
           'Bot',
           'Tank',
           'Air',
           'Naval',
           'Orbital',
           'Advanced',
           'Fabber',
           'Factory'
        ]);

        self.selectionTypeCounts = ko.observable({});

        self.typeArray = ko.computed(function () {

            var group = self.selectionTypeCounts();

            var result = _.compact(_.map(self.types(), function (element) {
                if (!group[element])
                    return null;

                return {
                    type: element,
                    count: group[element],
                    source: imageSourceForType(element)
                }
            }));

            return result;
        });

        self.parseSelection = function(payload) {
            self.selectionModel(new ParsedSelectionViewModel(payload.spec_ids, payload.spec_groups));
            api.Panel.onBodyResize();
            _.delay(api.Panel.onBodyResize);
        };

        self.onSelectionDisplayClick = function(index, event, force_remove) {
            api.Panel.message(api.Panel.parentId, 'panel.invoke', [
                'onSelectionDisplayClick',
                index,
                {
                    shiftKey: event.shiftKey,
                    ctrlKey: event.ctrlKey,
                    button: event.button
                },
                force_remove
            ]);
        };

        self.onTypeFilterClick = function (type, event) {
            api.select.fromSelectionWithTypeFilter(type, null, event.button === 2);
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });
        };
    }
    model = new SelectionViewModel();

    handlers.selection = model.parseSelection;

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
                default: api.debug.log('no match for ' + key); break;
            }
        });

        return result;
    };

    handlers.selection_instance_counts = function (payload) {
        model.selectionTypeCounts(parseSelectionUnitTypes(payload.counts.type_counts));
    };

    // inject per scene mods
    if (scene_mod_list['live_game_selection'])
        loadMods(scene_mod_list['live_game_selection']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

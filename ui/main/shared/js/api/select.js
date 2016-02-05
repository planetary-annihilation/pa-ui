function init_select(api) {

    var activeControlGroups = ko.observable({});
    var allControlGroupsCredit = ko.observable(false).extend({ session: 'all_control_groups_credit' });
    var allControlGroupsRule = ko.computed(function () {
        if (_.keys(activeControlGroups()).length < 10 || allControlGroupsCredit())
            return;

        allControlGroupsCredit(true);
        api.tally.incStatInt('games_played_using_all_control_groups');
    });

    var callWithFilter = function (command, group, acceptance_filter, rejection_filter, force_remove) {

        if (!acceptance_filter)
            return;

        if (typeof (command) !== 'string')
            return;

        if (typeof (acceptance_filter) === 'string')
            acceptance_filter = [acceptance_filter];

        if (typeof (rejection_filter) === 'string')
            rejection_filter = [rejection_filter];

        if (!rejection_filter)
            rejection_filter = [];

        if (model['endCommandMode'])
            model['endCommandMode']();
        
        var option = 'default';

        if (force_remove)
            option = 'remove';
        else if (Mousetrap.isShiftDown())
            option = 'add';

        if (group === null)
            return engine.call(command, JSON.stringify(acceptance_filter), JSON.stringify(rejection_filter), option);
        else
            return engine.call(command, group, JSON.stringify(acceptance_filter), JSON.stringify(rejection_filter), option);
    };

    api.select = {
        commander: function () { return engine.call("select.commander"); },
        idleFabber: function () { return engine.call("select.idleFabber"); },

        allCombatUnits: function () { return engine.call("select.allCombatUnits"); },
        allFabbers: function () { return engine.call("select.allFabbers"); },
        allFactories: function () { return engine.call("select.allFactories"); },
        allIdleFactories: function () { return engine.call("select.allIdleFactories"); },

        allLandCombatUnits: function () { return engine.call("select.allLandCombatUnits"); },
        allAirCombatUnits: function () { return engine.call("select.allAirCombatUnits"); },
        allNavalCombatUnits: function () { return engine.call("select.allNavalCombatUnits"); },
        allCombatUnitsOnScreen: function () { return engine.call("select.allCombatUnitsOnScreen"); },

        allFabbersOnScreen: function () { return engine.call("select.allFabbersOnScreen"); },
        allFactoriesOnScreen: function () { return engine.call("select.allFactoriesOnScreen"); },
        allIdleFactoriesOnScreen: function () { return engine.call("select.allIdleFactoriesOnScreen"); },

        allLandCombatUnitsOnScreen: function () { return engine.call("select.allLandCombatUnitsOnScreen") },
        allAirCombatUnitsOnScreen: function () { return engine.call("select.allAirCombatUnitsOnScreen") },
        allNavalCombatUnitsOnScreen: function () { return engine.call("select.allNavalCombatUnitsOnScreen") },

        unitsById: function (unitIds, tryRepeatedly) {
            // the tryRepeatedly flag is necessary because we will often learn the id of a spawning commander before we actually receive the commander

            if (tryRepeatedly) {
                var completion = $.Deferred(),
                    selectUnits = function() {
                        engine.call("select.byIds", unitIds).then(function (r) {
                            if (!r) {
                                _.delay(selectUnits, 50);
                            } else {
                                completion.resolve();
                            }
                        });
                    };

                selectUnits();

                return completion;
            } else {
                return engine.call("select.byIds", unitIds);
            }
        },

        fromSelectionWithTypeFilter: function (acceptance_filter, rejection_filter, force_remove) {
            return callWithFilter('select.fromCurrentSelectionWithTypeFilter', null, acceptance_filter, rejection_filter, force_remove);
        },

        onScreenWithTypeFilter: function (planet_id, acceptance_filter, rejection_filter) {
            return callWithFilter('select.unitsOnScreenWithTypeFilter', planet_id, acceptance_filter, rejection_filter);
        },

        onPlanetWithTypeFilter: function (planet_id, acceptance_filter, rejection_filter) {
            return callWithFilter('select.unitsOnPlanetWithTypeFilter', planet_id, acceptance_filter, rejection_filter);
        },

        idleFabbers: function (planet_id) {
            return callWithFilter('select.idleFabbersWithTypeFilter', planet_id, [], []);
        },

        idleFactories: function (planet_id) {
            return callWithFilter('select.idleFactoriesWithTypeFilter', planet_id, [], []);
        },

        idleFabbersWithTypeFilter: function (planet_id, filter) {
            return callWithFilter('select.idleFabbersWithTypeFilter', planet_id, filter, []);
        },

        idleFactoriesWithTypeFilter: function (planet_id, filter) {
            return callWithFilter('select.idleFactoriesWithTypeFilter', planet_id, filter, []);
        },

        idleFabbersOnScreenWithTypeFilter: function (planet_id, filter) {
            return callWithFilter('select.idleFabbersOnScreenWithTypeFilter', planet_id, filter, []);
        },

        idleFactoriesOnScreenWithTypeFilter: function (planet_id, filter) {
            return callWithFilter('select.idleFactoriesOnScreenWithTypeFilter', planet_id, filter, []);
        },

        captureGroup: function (group) {
            var groups = activeControlGroups();
            groups[group] = true;
            activeControlGroups(groups);
            return engine.call("select.captureGroup", typeof (group) == 'number' ? group : 0);
        },
        recallGroup: function (group) {
            if (model['endCommandMode'])
                model['endCommandMode']();

            var option = Mousetrap.isShiftDown() ? 'add' : 'default'; 
            return engine.call("select.recallGroup", typeof (group) == 'number' ? group : 0, option);
        },
        recallGroupWithTypeFilter: function (group, filter) {
            return callWithFilter('select.recallGroupWithTypeFilter', group, filter, []);
        },
        forgetGroup: function (group) {
            return engine.call("select.forgetGroup", typeof (group) == 'number' ? group : 0);
        },
        empty: function() { return engine.call('select.empty'); }
    };
};

init_select(api);

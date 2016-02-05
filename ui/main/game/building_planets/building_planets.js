var model;

$(document).ready(function () {

    function BuildingPlanetsViewModel(params)
    {
        var self = this;

        var message = params.message;

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.showGameLoading = ko.observable(true);

        self.message = ko.observable(loc(message) || loc('!LOC:GENERATING PLANETS'));
    }

    model = new BuildingPlanetsViewModel({
        message: $.url().param('message')
    });

    handlers = {};

    handlers.toggle = function(payload) {
        model.showGameLoading(payload.show);
    };

    // inject per scene mods
    if (scene_mod_list['building_planets'])
        loadMods(scene_mod_list['building_planets']);

    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // Tell our parent we are ready.
    api.Panel.message(api.Panel.parentId, 'building_planets_ready');
});

var model;

loadScript( 'coui://download/community-mods-transit.js');

$(document).ready(function () {

    function TransitViewModel() {
        var self = this;

        self.uberName = ko.observable().extend({ local: 'uberName' });
        self.uberId = ko.observable().extend({ local: 'uberId' });

        self.lobbyId = ko.observable().extend({ local: 'lobbyId' });
        self.gameTicket = ko.observable().extend({ local: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ local: 'gameHostname' });
        self.gamePort = ko.observable().extend({ local: 'gamePort' });

        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable(2000).extend({ session: 'transit_delay' });

        self.navToDestination = function () {
            self.transitPrimaryMessage('');
            self.transitSecondaryMessage('');
            window.location.href = self.transitDestination();
        };
    }
    model = new TransitViewModel();

    handlers = {};

    if ( window.CommunityMods ) {
        CommunityMods();
    }

    // inject per scene mods
    if (scene_mod_list['transit'])
        loadMods(scene_mod_list['transit']);

    // Activates knockout.js
    ko.applyBindings(model);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    if (!model.transitDestination()) {
        model.transitDestination('coui://ui/main/game/start/start.html');
        model.transitPrimaryMessage(loc('!LOC:Error'));
        model.transitSecondaryMessage(loc('!LOC:Returning to Main Menu'));
    }

    setTimeout(model.navToDestination, Number(model.transitDelay()));
});

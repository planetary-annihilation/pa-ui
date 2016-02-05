// !LOCNS:galactic_war
var globals = this;

globals.CardViewModel = function (params) {
    var self = this;

    self.params = ko.observable(params);
    self.id = ko.computed(function() {
        var p = self.params();
        return (typeof p === 'object') ? p.id : p;
    });

    self.visible = ko.observable(false);
    self.desc = ko.observable();
    self.locDesc = ko.computed(function () {
        return loc(self.desc());
    });
    self.summary = ko.observable();
    self.icon = ko.observable();
    self.iconPlaceholder = ko.observable(); // Displayed when the icon is empty
    self.audio = ko.observable();

    self.isEmpty = ko.computed(function() { return !self.id(); });
    self.isLoadout = ko.computed(function() { return self.id() && self.id().startsWith('gwc_start'); });

    var loaded = $.Deferred();
    self.card = loaded.promise();

    var loadCard = function(card, data) {
        if (_.isEmpty(card)) {
            self.desc('!LOC:Data Bank holds one Tech. Explore systems to find new Tech.');
            self.summary('!LOC:Empty Data Bank');
            self.icon('coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_empty.png');
            self.iconPlaceholder(undefined);
            self.visible(true);
        }
        else {
            self.desc(card.describe && card.describe(data));
            self.summary(card.summarize && card.summarize(data));
            self.icon(card.icon && card.icon(data));
            self.iconPlaceholder(!self.icon() && (self.summary() || self.desc()));
            self.audio(card.audio && card.audio(data));
            self.visible((card.visible === true) || !!(card.visible && card.visible(data)));
        }
        loaded.resolve(card);
    };

    var loadToken = 0;
    ko.computed(function() {
        var data = self.params();
        ++loadToken;
        var myToken = loadToken;
        var cardId = self.id();
        if (cardId) {
            requireGW(['cards/' + cardId], function(card) {
                if (loadToken !== myToken)
                    return;
                loadCard(card, data);
            });
        }
        else
            loadCard({}, data);
    });
};

define([
], function(
) {
    var LS_KEY = 'gw_bank';

    var self;

    var loading = false;

    var GWBank = function() {
        self = this;

        self.startCards = ko.observableArray();
        self.startCards.subscribe(function(value) {
            self.save();

            var unlocked = value.length;

            if (!unlocked)
                return;

            api.tally.getStatInt('gw_unlocked_loadouts')
                .then(function (stat) {
                    if (stat < unlocked)
                        api.tally.setStatInt('gw_unlocked_loadouts', unlocked);
                });
        });

        self.load();
    };

    GWBank.prototype = {

        load : function() {

            loading = true;
            var bankJson = localStorage[LS_KEY];
            if (typeof bankJson !== 'string') {
                self.startCards([]);
                loading = false;
                return;
            }

            var config = JSON.parse(bankJson);
            self.startCards(config.startCards);
            loading = false;
        },

        save : function() {
            if (loading)
                return;
            localStorage.setItem(LS_KEY, ko.toJSON(self));
        },

        addStartCard: function(card) {
            if (self.hasStartCard(card))
                return false;
            self.startCards.push(card);
            return true;
        },
        hasStartCard: function (card) {
            return _.any(self.startCards(), function (element) {
                return (card === element) || (_.isObject(card) && (card.id === element.id));
            });
        }
    };

    return new GWBank();
});

define([
], function(
) {
    var GWStats = function() {
        var self = this;
        self.turns = ko.observable(0);
        self.wins = ko.observable(0);
        self.losses = ko.observable(0);
    };
    GWStats.prototype = {
        load: function(config) {
            var self = this;
            config = config || {};
            self.turns(config.turns || 0);
            self.wins(config.wins || 0);
            self.losses(config.losses || 0);
        },
        save: function() {
            return ko.toJS(this);
        }
    }
    return GWStats;
});

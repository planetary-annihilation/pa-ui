define([
], function(
) {
    var GWStar = function() {
        var self = this;
        self.coordinates = ko.observable([0,0]);
        self.biome = ko.observable('');
        self.distance = ko.observable(0);
        self.cardList = ko.observable([]);
        self.history = ko.observableArray();
        self.system = ko.observable();
        self.ai = ko.observable();
        self.explored = ko.observable(false);
        self.hasCard = ko.computed(function () {
            return !self.explored();
        });
        self.tutorial = ko.computed(function () {
            return self.system() ? self.system().tutorial : null;
        });
    };

    GWStar.loadSystem = function(system, config) {
        config.system = system;
    };

    GWStar.saveSystem = function(config) {
        var result = config.system;
        delete config.system;
        return result;
    };

    GWStar.prototype = {
        load: function(config) {
            var self = this;
            config = config || {};
            self.coordinates(config.coordinates || [0,0]);
            self.biome(config.biome || '');
            self.distance(config.distance || 0);
			if (config.card && !config.cardList)
			    self.cardList([config.card]);
            else
                self.cardList(config.cardList);
            self.history(config.history || []);
            self.system(config.system || {});
            self.ai(config.ai);
            self.explored(config.explored);
        },
        save: function(noSystem) {
            var self = this;

            /* we save a huge chunk of time by saving stars explicitly */
            return {
                coordinates: self.coordinates(),
                biome: self.biome(),
                distance: self.distance(),
                cardList: self.cardList(),
                history: self.history(),
                system: noSystem ? undefined : self.system(),
                ai: self.ai(),
                explored: self.explored()
            }
        },
        log: function(date, details) {
            var self = this;
            self.history.push({date: date, details: details});
        }
    }
    return GWStar;
});

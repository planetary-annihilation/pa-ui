// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function LiveGameEconModel() {
        var self = this;

        self.formatedRateString = function (number, showSign) {
            var formats = [{ postfix: '', divisor: 1 },
                           { postfix: 'K', divisor: 1000 },
                           { postfix: 'M', divisor: 1000000 },
                           { postfix: 'G', divisor: 1000000000 },
                           { postfix: 'T', divisor: 1000000000000 }];

            number = Math.floor(number);
            if (number === 0)
                return '0';
            var numDigits = String(Math.abs(number)).length;
            var format = formats[Math.floor((numDigits - 1) / 3)];

            number = format.postfix ? (number / format.divisor).toFixed(1) : number / format.divisor;
            number = (number > 0) ? '+' + number + format.postfix : '' + number + format.postfix;
            return showSign ? number : number.slice(1);
        };

        self.mouseOver = ko.observable(false);
        self.setMouseOver = function () { self.mouseOver(true) };
        self.setMouseOut = function () { self.mouseOver(false) };

        self.displayMetalAsPercent = ko.observable(false);
        self.toggleMetalDisplay = function () { self.displayMetalAsPercent(!self.displayMetalAsPercent()); };

        self.displayEnergyAsPercent = ko.observable(false);
        self.toggleEnergyDisplay = function () { self.displayEnergyAsPercent(!self.displayEnergyAsPercent()); };

        self.hasFirstResourceUpdate = ko.observable(false);

        self.showSharedResources = ko.observable(false);

        self.currentEnergy = ko.observable(1.0);
        self.currentEnergyString = ko.computed(function () { return self.formatedRateString(self.currentEnergy(), false); });
        self.maxEnergy = ko.observable(2.0);
        self.maxEnergyString = ko.computed(function () { return self.formatedRateString(self.maxEnergy(), false); });
        self.energyFraction = ko.computed(function () {
            return (self.maxEnergy()) ? self.currentEnergy() / self.maxEnergy() : 0.0;
        });
        self.energyFractionString = ko.computed(function () {
            return '' + (100 * self.energyFraction()) + '%';
        });

        self.energyGain = ko.observable(3.0);
        self.energyGainString = ko.computed(function () { return self.formatedRateString(self.energyGain(), false); });
        self.energyLoss = ko.observable(4.0);
        self.energyLossString = ko.computed(function () { return self.formatedRateString(self.energyLoss(), false); });
        self.energyShared = ko.observable(0.0);
        self.energySharedString = ko.computed(function () {return self.formatedRateString(self.energyShared(), false); });
        self.energyNet = ko.computed(function () {
            return self.energyGain() - self.energyLoss() + self.energyShared();
        });
        self.energyNetString = ko.computed(function () {
            return self.formatedRateString(self.energyNet(), true);
        });


        self.currentMetal = ko.observable(5.0);
        self.currentMetalString = ko.computed(function () { return self.formatedRateString(self.currentMetal(), false); });
        self.maxMetal = ko.observable(12.0);
        self.maxMetalString = ko.computed(function () { return self.formatedRateString(self.maxMetal(), false); });
        self.metalFraction = ko.computed(function () {
            return (self.maxMetal()) ? self.currentMetal() / self.maxMetal() : 0.0;
        });
        self.metalFractionString = ko.computed(function () {
            return '' + (100 * self.metalFraction()) + '%';
        });

        self.metalGain = ko.observable(10.0);
        self.metalGainString = ko.computed(function () { return self.formatedRateString(self.metalGain(), false); });
        self.metalLoss = ko.observable(8.0);
        self.metalLossString = ko.computed(function () { return self.formatedRateString(self.metalLoss(), false); });
        self.metalShared = ko.observable(0.0);
        self.metalSharedString = ko.computed(function () { return self.formatedRateString(self.metalShared(), false); });
        self.metalNet = ko.computed(function () {
            return self.metalGain() - self.metalLoss() + self.metalShared();
        });
        self.metalNetString = ko.computed(function () {
            return self.formatedRateString(self.metalNet(), true);
        });

        self.econHandicap = ko.observable(1.0).extend({numeric:1});
        self.econHandicapString = ko.computed(function () {
            return '' + self.econHandicap();
        });

        self.metalEfficiencyPerc = ko.computed(function () {
            if (self.metalLoss() === 0) {
                // Forces this to be over 3 digits (when multiplied by 100 later) so
                // we can just display "(--)" in the UI.
                return 10;
            } else {
                return self.metalShared() < 0 ? (self.metalGain() / (self.metalLoss() + self.metalShared())) : ((self.metalGain() + self.metalShared()) / self.metalLoss());
            }
        });
        self.metalEfficiencyPercString = ko.computed(function () {
            var mPerc = Number(self.metalEfficiencyPerc() * 100).toFixed(0);
            if (mPerc > 999) {
                return '(--)';
            } else {
                return '(' + mPerc + '%)';
            }
        });

        self.energyEfficiencyPerc = ko.computed(function () {
            if (self.energyLoss() === 0) {
                // Forces this to be over 3 digits (when multiplied by 100 later) so
                // we can just display "(--)" in the UI.
                return 10;
            } else {
                return self.energyShared() < 0 ? (self.energyGain() / (self.energyLoss() + self.energyShared())) : ((self.energyGain() + self.energyShared()) / self.energyLoss());
            }
        });
        self.energyEfficiencyPercString = ko.computed(function () {
            var ePerc = Number(self.energyEfficiencyPerc() * 100).toFixed(0);
            if (ePerc > 999) {
                return '(--)';
            } else {
                return '(' + ePerc + '%)';
            }
        });

        self.economyEfficiencyPerc = ko.computed(function () {
            if (self.currentEnergy() > 0 && self.currentMetal() > 0) {
                return 100;
            } else {
                var eEff = self.currentEnergy() ? 1 : (Math.min(1, Math.max(self.energyEfficiencyPerc(), 0)));
                var mEff = self.currentMetal() ? 1 : (Math.min(1, Math.max(self.metalEfficiencyPerc(), 0)));

                return Number((eEff * mEff) * 100).toFixed(0);
            }
        });

        self.percentMetalSharedToIncome = ko.computed(function () {
            return self.metalShared() < 0
                    ? self.metalShared() / (Math.abs(self.metalShared()) + self.metalLoss())
                    : self.metalShared() / (self.metalShared() + self.metalGain());
        });

        self.percentEnergySharedToIncome = ko.computed(function () {
            return self.energyShared() < 0
                    ? self.energyShared() / (Math.abs(self.energyShared()) + self.energyLoss())
                    : self.energyShared() / (self.energyShared() + self.energyGain());
        });

        function clamp(val, min, max) {
            return Math.min(Math.max(val, min), max)
        }

        self.sharedMetalArray = ko.computed(function () {
            var result = [];

            if (self.percentMetalSharedToIncome())
                result.length = Math.ceil(clamp(self.percentMetalSharedToIncome(), 0, 1) * 3);

            return result;
        })

        self.sharedEnergyArray = ko.computed(function () {
            var result = [];

            if (self.percentEnergySharedToIncome())
                result.length = Math.ceil(clamp(self.percentEnergySharedToIncome(), 0, 1) * 3);

            return result;
        })

        self.hasHadEconomy = ko.observable(false);
        self.showResources = ko.computed(function () {
            /* if you want another panel to show or hide itself at the same time as this one, we'll want live_game to coordinate that,
               in which case this logic can go away */
            if (self.hasHadEconomy())
                return true;

            if (self.hasFirstResourceUpdate() && (self.currentMetal() > 0 || self.currentEnergy() > 0)) {
                self.hasHadEconomy(true);
                return true;
            }

            return false;
        });

        self.tooltipMetal = ko.observable('!LOC:Metal');
        self.tooltipMetalStorage = ko.observable('!LOC:Metal Storage');
        self.tooltipMetalProduced = ko.observable('!LOC:Metal Produced');
        self.tooltipMetalExpended = ko.observable('!LOC:Metal Expended');
        self.tooltipNetMetalProduced = ko.observable('!LOC:Net Metal Income');
        self.tooltipMetalEfficiency = ko.observable('!LOC:Metal Efficiency');

        self.tooltipEnergy = ko.observable('!LOC:Energy');
        self.tooltipEnergyStorage = ko.observable('!LOC:Energy Storage');
        self.tooltipEnergyProduced = ko.observable('!LOC:Energy Produced');
        self.tooltipEnergyExpended = ko.observable('!LOC:Energy Expended');
        self.tooltipNetEnergyProduced = ko.observable('!LOC:Net Energy Income');
        self.tooltipEnergyEfficiency = ko.observable('!LOC:Energy Efficiency');

        self.tooltipHandicap = ko.observable('!LOC:Bounty Econ Multiplier');

        self.sharedMetalTooltip = ko.computed(function () {
            return ["<div>","!LOC:SHARED METAL: ",self.metalShared(),"</div>"];
        })

        self.sharedEnergyTooltip = ko.computed(function () {
            return ["<div>","!LOC:SHARED ENERGY: ",self.energyShared(),"</div>"];
        })

        self.economyEfficiencyPercString = ko.computed(function () {
            return '' + self.economyEfficiencyPerc() + '%';
        });

        self.economyEfficiencyTooltip = ko.computed(function () {
            var short_metal = self.metalEfficiencyPerc() < 1,
                short_energy = self.energyEfficiencyPerc() < 1,
                text = '';

            if (short_metal && short_energy)
                text = '!LOC:Not enough metal or energy';
            else if (short_metal)
                text = '!LOC:Not enough metal';
            else if (short_energy)
                text = '!LOC:Not enough energy';
            else
                text = '!LOC:Build Efficiency';

            return ['<div>',text,'</div>'];
        })

        self.energyTextColorCSS = ko.computed(function () {
            if (self.energyEfficiencyPerc() >= 1 && self.energyFraction() >= 1) {
                return 'color_waste';
            } else if (self.energyNet() >= 0) {
                return 'color_positive';
            } else if (self.energyEfficiencyPerc() < 1 && self.energyFraction() > 0.60) {
                return 'color_positive';
            } else if (self.energyEfficiencyPerc() < 1 && self.energyFraction() > 0.30) {
                return 'color_warning';
            } else {
                return 'color_negative';
            }
        });

        self.metalTextColorCSS = ko.computed(function () {
            if (self.metalEfficiencyPerc() >= 1 && self.metalFraction() >= 1) {
                return 'color_waste';
            } else if (self.metalNet() >= 0) {
                return 'color_positive';
            } else if (self.metalEfficiencyPerc() < 1 && self.metalFraction() > 0.60) {
                return 'color_positive';
            } else if (self.metalEfficiencyPerc() < 1 && self.metalFraction() > 0.30) {
                return 'color_warning';
            } else {
                return 'color_negative';
            }
        });

        self.econTextColorCSS = ko.computed(function () {
            if (self.economyEfficiencyPerc() === 100) {
                return 'color_positive';
            } else if (self.economyEfficiencyPerc() >= 80) {
                return 'color_warning';
            } else {
                return 'color_negative';
            }
        });
    }
    model = new LiveGameEconModel();

    handlers.army = function (payload) {
        model.currentEnergy(payload.energy.current);
        model.maxEnergy(payload.energy.storage);
        model.energyGain(payload.energy.production);
        model.energyLoss(payload.energy.demand);
        model.energyShared(payload.energy.shared);

        model.currentMetal(payload.metal.current);
        model.maxMetal(payload.metal.storage);
        model.metalGain(payload.metal.production);
        model.metalLoss(payload.metal.demand);
        model.metalShared(payload.metal.shared);

        model.econHandicap(payload.handicap);
        //api.debug.log('EH', payload.handicap);

        model.hasFirstResourceUpdate(true);
    }

    handlers.showSharedResources = function (payload) {
        model.showSharedResources(payload.value);
    }

    // inject per scene mods
    if (scene_mod_list['live_game_econ'])
        loadMods(scene_mod_list['live_game_econ']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);
});

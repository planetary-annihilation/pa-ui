// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function TutorialViewModel() {
        var self = this;

        self.tutorial = ko.observable();

        self.active = ko.observable(true);

        self.pageCount = ko.computed(function() {
            return self.tutorial() ? self.tutorial().length : 0;
        });

        self.currentPageIndex = ko.observable(0);
        self.currentPage = ko.computed(function() {
            return self.tutorial() ? self.tutorial()[self.currentPageIndex()] : 0;
        });


        self.lastPageVisited = ko.observable(-1);
        self.defaultDelay = ko.observable(4); /* seconds per page, overriden by the delaySeconds property */
        self.blocked = ko.observable(false); /* flag raised to true when we are waiting on a delay */
        self.currentPage.subscribe(function (page) {
            var pageIdx = self.currentPageIndex();

            if (page && pageIdx > self.lastPageVisited()) {
                var audio = page.audio,
                    delaySeconds = (typeof(page.delaySeconds) === 'number') ? page.delaySeconds : self.defaultDelay();

                if (audio) {
                    api.audio.playSound(audio);
                }

                if (delaySeconds > 0) {
                    self.blocked(true);
                    _.delay(function () {
                        self.blocked(false);
                    }, delaySeconds * 1000);
                } else {
                    self.blocked(false);
                }

                self.lastPageVisited(pageIdx);
            }
        });

        self.currentTitle = ko.pureComputed(function() {
            return loc(self.currentPage().title);
        });

        self.currentBodyHTML = ko.pureComputed(function() {
            return loc(self.currentPage().body);
        });

        self.currentPageNumber = ko.computed(function() {
            return self.currentPageIndex() + 1;
        });

        self.canGoPrev = ko.computed(function() {
            return self.tutorial() ? self.currentPageIndex() > 0 : false;
        });

        self.canGoNext = ko.computed(function() {
            var unblocked = !(self.blocked() && self.currentPageIndex() === self.lastPageVisited());
            return self.tutorial() ? unblocked && self.currentPageIndex() < self.pageCount() - 1 : false;
        });

        self.hasImage = ko.computed(function() {
            return !!self.currentPage().image;
        });

        self.currentImageUrl = ko.computed(function() {
            if (!self.hasImage()) {
                return null;
            }

            return "url('" + self.currentPage().image + "')";
        });

        self.goPrev = function() {
            if (!self.tutorial() || !self.canGoPrev())
                return;

            self.currentPageIndex(self.currentPageIndex() - 1);
        };

        self.goNext = function() {
            if (!self.tutorial() || !self.canGoNext())
                return;

            self.currentPageIndex(self.currentPageIndex() + 1);
        };

        self.setup = function () {
            $(window).focus(function () { self.active(true); });
            $(window).blur(function () { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'query.tutorial').then(function (t) {
                self.tutorial(t);
                self.currentPageIndex(0);
            });
        };
    }
    model = new TutorialViewModel();

    // inject per scene mods
    if (scene_mod_list['live_game_footer'])
        loadMods(scene_mod_list['live_game_footer']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

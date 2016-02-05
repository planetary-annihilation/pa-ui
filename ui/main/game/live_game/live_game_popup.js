// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function ButtonViewModel(parent, label, index) {
        var self = this;

        self.index = index;
        self.label = ko.observable(loc(label));
        self.click = function() {
            parent.click(index);
        };
    }

    function PopupViewModel() {
        var self = this;

        self.visible = ko.observable(false);
        self.params = ko.observable({}).extend({ session: 'popup_params' });
        self.primaryMessage = ko.computed(function() { return loc((self.params().messages || [])[0] || ''); });
        self.secondaryMessage = ko.computed(function() { return loc((self.params().messages || [])[1] || ''); });
        self.buttons = ko.computed(function() {
            return _.map(self.params().buttons, function(button, index) {
                return new ButtonViewModel(self, button, index);
            });
        });
        self.textfield = ko.computed(function () { return !!self.params().textfield; });
        self.filenameFilter = ko.computed(function () { return !!self.params().filename; });
        self.textInputBasis = ko.observable('');
        self.textInput = ko.computed({
            read: function () {
                return self.textInputBasis()
            },
            write: function (value) {
                var basis = value;
                if (self.filenameFilter())
                    basis = value.replace(/[^a-zA-Z0-9_-]+/g, " ");

                self.textInputBasis(basis);
                if (!_.isEqual(basis, value))
                    _.defer(function () {
                        /* this is the only way to get the text field to update with the modified string. */
                        self.textInputBasis('');
                        self.textInputBasis(basis);
                    });
            }
        });
        self.params.subscribe(function (value) {
            self.textInput(self.params().defaultText || '');
        });
        self.cancelButton = ko.computed(function() {
            var params = self.params();
            if (params.hasOwnProperty('esc'))
                return params.esc;
            else
                return -1;
        });

        self.result = ko.observable($.Deferred());
        self.result().resolve();

        self.show = function(params) {
            self.params(params);
            self.result($.Deferred());
            self.visible(true);
            return self.result().promise();
        };

        self.click = function(index) {
            self.visible(false);

            if (self.textfield()) {
                if (index === 0 && self.textInput())
                    self.result().resolve(self.textInput());
                else
                    self.result().resolve(false);
            }
            else
                self.result().resolve(index);
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            $('body').keydown(function(event) {
                if (event.keyCode === keyboard.esc)
                    self.click(self.cancelButton());
                if (event.keyCode === keyboard.enter)
                    self.click(0);
            });
        };
    }
    model = new PopupViewModel();

    handlers.show = model.show;

    // inject per scene mods
    if (scene_mod_list['live_game_popup'])
        loadMods(scene_mod_list['live_game_popup']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

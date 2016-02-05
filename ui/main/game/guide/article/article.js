var model;

$(document).ready(function () {

    function ArticleModel() {
        var self = this;

        self.keybindFor = function (key) {
            var binding = api.settings.value('keyboard', key);
            if (!binding)
                return 'not bound';

            return binding;
        }
    }

    model = new ArticleModel();

    // Activates knockout.js
    ko.applyBindings(model);

});
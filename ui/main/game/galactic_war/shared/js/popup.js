// !LOCNS:galactic_war
define([], function () {
    return {
        mixin: function(model, root) {
            model.showPopUp = ko.observable(false);
            model.popUpPrimaryMsg = ko.observable('');

            model.popUpPrimaryButtonAction = function () { };
            model.popUpSecondaryButtonAction = function () { };
            model.popUpPrimaryButtonTag = ko.observable('');
            model.popUpSecondaryButtonTag = ko.observable('');
            model.popUp = function(params, secondary) {
                model.popUpPrimaryMsg(params.msg);
                var mapAction = function(action) {
                    return function() {
                        action && action();
                        model.showPopUp(false);
                    };
                };
                if (params.actions) {
                    model.popUpPrimaryButtonAction = mapAction(params.actions.primary);
                    model.popUpSecondaryButtonAction = mapAction(params.actions.secondary);
                }
                if (params.tags) {
                    model.popUpPrimaryButtonTag(params.tags.primary);
                    model.popUpSecondaryButtonTag(params.tags.secondary);
                }
                model.showPopUp(true);
            };
            model.confirm = function (message, yes, no) {
                model.popUp({
                    msg: loc(message),
                    actions: { primary: yes, secondary: no },
                    tags: { primary: '!LOC:Yes', secondary: '!LOC:Cancel' }
                });
            };

            $(root).html(loadHtml('coui://ui/main/game/galactic_war/shared/js/popup.html'));
        }
    }
});

var model;

$(document).ready(function () {

    function GuideViewModel() {
        var self = this;

        self.inPanel = ko.observable(api.Panel.pageName !== 'game');

        self.modalBack = function () {
            if (self.inPanel()) 
                api.Panel.message(api.Panel.parentId, 'guide.hide');
            else
            {
                window.location.href = 'coui://ui/main/game/start/start.html';
                return; /* window.location.href will not stop execution. */
            }
        };

        self.iframeLoaded = ko.observable(false);

        self.handleClick = function() {
            self.iframeLoaded(false);
// allow default action to load iframe
            return true;
        }

        self.handleLoad = function() {
// defer visibility: visible on iframe to prevent white flash and allow scrolling
            _.defer( function() {  model.iframeLoaded(true); } );
        }
    }

    model = new GuideViewModel();

    handlers = {};

    // inject per scene mods
    if (scene_mod_list['guide']) 
        loadMods(scene_mod_list['guide']);
    
    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

});
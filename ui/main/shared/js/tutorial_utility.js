var TutorialUtility = (function () {
    var startTutorial = function () {
        ko.observable().extend({ local: 'gw_active_game' })("tutorial");
        window.location.href = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html';
        return; /* window.location.href will not stop execution. */
    };

    return {
        startTutorial: startTutorial
    };
}());
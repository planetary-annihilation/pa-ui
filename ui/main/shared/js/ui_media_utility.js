var UIMediaUtility = (function () {
    var getIntroPlayedObservable = function() {
        var observable = ko.observable(false).extend({ local: 'has_played_release_intro' });
        var content = api.content.activeContent();
        if (!_.isEmpty(content))
            observable = ko.observable(false).extend({ local: 'has_played_release_intro_' + content });
        return observable;
    };

    var startMusic = function () {
        if (!getIntroPlayedObservable()())
            return;

        var hasEnteredGame = ko.observable().extend({ session: 'has_entered_game' });
        var usingTitans = api.content.usingTitans();

        var titansMusic = hasEnteredGame ? '/Music/Main_Menu_Music_return_from_game' : '/Music/Main_Menu_Music';
        var originalMusic = '/Music/Main_Menu_Music_PA_Original';

        api.audio.setMusic(usingTitans ? titansMusic : originalMusic);
    }

    return {
        hasPlayedIntroOnceObservable: getIntroPlayedObservable,
        startMusic: startMusic
    };
}());
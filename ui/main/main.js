function setLayoutMode(layoutMode)
{
    engine.call('panel.layout', api.Panel.pageId, layoutMode);
    if (layoutMode)
    {
        $('#player').attr('no-input', '');
        $('#game').removeAttr('no-input');
    }
    else
    {
        $('#player').removeAttr('no-input');
        $('#game').attr('no-input', '');
    }
    api.Panel.update();
}

// try a remote load of community mods and if that fails try the download cache
if (!loadScript( 'https://dfpsrd4q7p23m.cloudfront.net/community-mods/js/main.js')) {
    loadScript( 'coui://download/community-mods-main.js');
}

$(document).ready(function () {

    function MainViewModel() {
        var self = this;

        self.useLiveGameUberBar = ko.observable(false);

        self.showPlayer = ko.observable(false);
        self.isPlayingGWIntro = ko.observable(false);

        self.hasPlayedIntroOnce = function() {
            return UIMediaUtility.hasPlayedIntroOnceObservable()();
        };

        self.markIntroAsPlayed = function() {
            UIMediaUtility.hasPlayedIntroOnceObservable()(true);
        };

        self.playerUrl = ko.observable('');

        self.playVideo = function (video_url, callback) {
            $('#black_splash').removeClass();
            self.playerUrl("coui://ui/main/local_html5_video_player.html" + '?url=' + video_url + '&' + 'cb=' + callback);
            self.showPlayer(true);
            api.panels.player.focus();
        };

        self.showGame = function(delay) {
            setLayoutMode(true);
            api.Panel.message("game", "video_complete");
        };

        self.finishVideo = function() {
            api.panels.player.blur();
            setLayoutMode(false);
            $('#black_splash').addClass('black_splash_start');
            $('#black_splash').on('webkitAnimationEnd', function(evt) {
                if (evt.originalEvent.animationName === 'fadeIn')
                {
                    self.showPlayer(false);
                    self.playerUrl('');
                    self.markIntroAsPlayed(true);

                    if (!self.isPlayingGWIntro())
                        UIMediaUtility.startMusic();

                    self.isPlayingGWIntro(false);
                }
                else if (evt.originalEvent.animationName === 'fadeOut')
                {
                    $(this).off(evt);
                    self.showGame();
                }
            });
        };

        self.playIntroVideo = function () {
            var content = api.content.activeContent();
            var file = 'PAIntro.webm';
            if (!_.isEmpty(content))
                file = content + 'Intro.webm';
            self.playVideo('coui://ui/main/shared/video/' + file, 'coui://ui/main/signal_finish_video.html');
        };

        self.playGalaticWarVideo = function () {
            self.isPlayingGWIntro(true);
            self.playVideo('coui://ui/main/shared/video/GWIntro.webm', 'coui://ui/main/signal_finish_video.html');
        };

        self.splashHidden = false;
        self.hideSplash = function() {
            if (self.splashHidden)
                return;

            self.splashHidden = true;

            $('#splash_overlay').addClass('splash_start_fade_out');
            $("#img_splash").on('webkitAnimationEnd', function(evt) {
                if (evt.originalEvent.animationName === 'fadeOut')
                {
                    $(this).off(evt);
                    setLayoutMode(true);
                }
            });

            if (!DEV_MODE && !self.hasPlayedIntroOnce())
            {
                self.playIntroVideo();
            }
        };

        self.setup = function() {
            setLayoutMode(false);
            $('#black_splash').on('webkitAnimationEnd', function(evt) { $(this).addClass('black_splash_anim_done_' + evt.originalEvent.animationName); });
        };
    }
    model = new MainViewModel();

    handlers = {};
    handlers.live_game_uberbar = function (payload) {
        model.useLiveGameUberBar(payload.value);
    };

    handlers.toggle_uberbar = function () {
        model.useLiveGameUberBar(!model.useLiveGameUberBar());
        return model.useLiveGameUberBar();
    };

    handlers['query.live_game_uberbar'] = function () {
        return model.useLiveGameUberBar();
    };

    handlers.hide_splash = function() {
        model.hideSplash();
    };

    handlers['game.layout'] = function(layout) {
        var $game = $("#game");
        if (layout)
            $game.attr('layout', 'layout');
        else
            $game.removeAttr('layout');
        api.panels.game.updateAttr();
    };

    handlers.play_intro = function (payload) {
        model.playIntroVideo();
    };

    handlers.play_gw_intro = function (payload) {
        model.playGalaticWarVideo();
    };

    handlers.finish_video = function (payload) {
        model.finishVideo();
    };

    if ( window.CommunityMods ) {
        CommunityMods();
    }

    loadSceneMods('main');

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();
});


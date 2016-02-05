function init_audio(api) {
    api.audio = {
        toggleMusic: function () { engine.call('audio.toggleMusic'); },
        pauseMusic: function(paused) { engine.call('audio.pauseMusic', paused); },
        isMusicPaused: function() { return engine.call('audio.isMusicPaused'); },
        playSound: function (cue) {
            if (cue)
                engine.call('audio.playSound', String(cue));
        },
        playSoundAtLocation: function (cue, x, y, z) {
            if (cue)
            {
                x = Number(x) || 0;
                y = Number(y) || 0;
                z = Number(z) || 0;
                engine.call('audio.playSoundAtLocation', String(cue), x, y, z);
            }
        },
        setMusic: function (cue) {
            return api.audio.getCurrentMusic().then(function (current_music) {
                if (cue && cue !== current_music) {
                    engine.call('audio.setMusic', cue);
                }
            });
        },
        getCurrentMusic: function() {
            return engine.call('audio.getCurrentMusic');
        },
        toggleLogging: function () { engine.call('audio.toggleLogging'); }
    };
};
init_audio(window.api);



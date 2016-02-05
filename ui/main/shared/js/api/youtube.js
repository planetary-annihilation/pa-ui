function init_youtube(api) {
    api.youtube = {
 
        // Open the YouTube page in an external browser
        launchPage: function (videoId) { engine.call('youtube.launchPage', videoId); }
    };
};
init_youtube(window.api);

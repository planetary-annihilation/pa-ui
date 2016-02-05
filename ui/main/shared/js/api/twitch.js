(function(api) {
    api.twitch = {
        //
        // requestLiveStreamList to get a list of live Planetary Annihilation streams on Twith.tv
        //
        // Will get a promise that will be resolved with an array of:
        //      "channel_url" - The URL of the twitch channel
        //      "preview_url_medium" - The URL of the preview image
        //      "stream_title" - The title of the stream
        //      "channel_display_name" - The display name of the channel
        //      "channel_name" - The name of the channel
        //      "viewer_count" - The number of viewers
        //
        // This is not updated automatically and should be called whenever you wish to refresh the list
        //
        requestLiveStreamList: function () {
            var request = {
                'method':   'GET',
                'dataType': 'json',
                'url':      'https://api.twitch.tv/kraken/streams?game=Planetary+Annihilation',
                'headers': { 'Client-ID': '8l2im97lav4vgewitcxbm70capwinaz' },
            };

            var deferred = $.ajax(request).then(function(d) {
                streams = _.map(d.streams, function(stream) {
                    return {
                        'channel_url': stream.channel.url,
                        'channel_display_name': stream.channel.display_name,
                        'channel_name': stream.channel.name,
                        'stream_title': stream.channel.status,
                        'preview_url_large': stream.preview.large,
                        'preview_url_medium': stream.preview.medium,
                        'preview_url_small': stream.preview.small,
                        'viewer_count': stream.viewers,
                    };
                });
                return streams;
            });

            return deferred.promise();
        },

        // Open the twitch page in an external browser. This is probably temporary until we get in situ working
        launchTwitchPage: function (channel_name) { engine.call('twitch.launchTwitchPage', channel_name); },
    };
})(window.api);

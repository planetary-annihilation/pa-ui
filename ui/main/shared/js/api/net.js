(function (api) {
    var CLOUDFRONT_URL = 'http://d2803xoht194y.cloudfront.net';
    var CURRENT_GAMES_CALL = '/GameAcquisition/CurrentGames';
    var buildVersion = ko.observable().extend({ session: 'build_version' });

    var self = {
        uberId: ko.observable('').extend({ session: 'uberId' }),
        ubernetUrl: ko.observable('https://uberent.com').extend({ session: 'ubernet_url' }),
        useUbernetdev: ko.observable().extend({ session: 'use_ubernetdev' }),
        requestCurrentGames: function () {
            var url = self.useUbernetdev() ? self.ubernetUrl() : CLOUDFRONT_URL;
            url += CURRENT_GAMES_CALL
            url += '?BuildVersion=' + buildVersion();
            return $.ajax(url, {
                async: true,
                dataType: 'json'
            });
        },

// ajax version of engine ubernet API calls
        ubernet: function(api,type,dataType,data) {
            if (data && !_.isString(data)) {
                data = JSON.stringify(data);
            }
            var url = self.ubernetUrl() + api;
            var options = {
                type: type ? type : 'GET',
                contentType:'application/json; charset=utf-8',
                dataType: dataType ? dataType : 'json',
                data: data,
                beforeSend: function(request) {
                    request.setRequestHeader('X-Authorization', decode(sessionStorage.jabberToken));
                }
            };
            return $.ajax(url,options);
        },

        startReplay: function(region, mode, replayId) {
            return engine.asyncCall('ubernet.startReplay', region, mode, replayId).then(function(rawData) {
                return JSON.parse(rawData);
            });
        },
        loadSave: function(region, mode, loadpath) {
            var result;

                var forwardLoadGame = ko.observable().extend({ session: 'load_game' });
                forwardLoadGame(true);

                var prefix = '';

                result = $.when(prefix).then(function(data) {
                    return engine.asyncCall('localserver.loadSave', mode, data, loadpath);
                });

            return result.then(function(rawData) { return JSON.parse(rawData); });
        },
        startGame: function(region, mode) {
            var result;

            api.debug.log( 'api.net.startGame '+ region + ' ' + mode );

            if (region === 'Local' || !region) {
                var prefix = '';
                result = $.when(prefix).then(function(data) {

                    api.debug.log(data);

                    return engine.asyncCall('localserver.startGame', mode, data);
                });
            }
            else
                result = engine.asyncCall('ubernet.startGame', region, mode);

            return result.then(function(rawData) {
                api.debug.log(rawData);
                return JSON.parse(rawData);
            });
        },

        // Tell the network that the user should be added to the given lobby.
        // Note:
        //      Does not perform connection.  Just presence & host/port lookup
        //      when appropriate.
        // params:
        //  - lobbyId: Falsy for lan games
        //  - host: When provided, will be filled in if not provided by ubernet.
        //  - port: See above
        // returns:
        //  - Ticket: Connection ticket (optional)
        //  - ServerHostname: Connection host
        //  - ServerPort: Connection port
        joinGame: function(params) {

            console.log( 'api.net.joinGame ' + params.lobbyId + ' ' + params.host + ':' + params.port );

            var lobbyId = params.lobbyId || '';
            var host = params.host || '';
            var port = params.port || '';

            var deferred = $.Deferred();

            var internalRetryLimit = 5;
            var retryCount = 0;

            function internalJoinGame() {
                engine.asyncCall('ubernet.joinGame', lobbyId).then(function(rawData) {
                        api.debug.log( rawData );
                        var data = {};
                        try {
                            data = JSON.parse(rawData);
                        } catch (e) {
                            console.error('Error parsing join game result:', rawData);
                            deferred.reject(rawData);
                            throw e;
                        }

                        if ((data.PollWaitTimeMS | 0) > 0) {
                            
                            if (retryCount < internalRetryLimit)
                            {
                                _.delay(internalJoinGame, data.PollWaitTimeMS);
                                retryCount++;
                            }
                            else
                                deferred.reject('internal retry limit exceeded.');

                        } else {
                            data.ServerHostname = data.ServerHostname || host;
                            data.ServerPort = data.ServerPort || port;
                            deferred.resolve(data);
                        }
                    });
            };

            if (lobbyId && self.uberId())
                internalJoinGame();
            else
                deferred.resolve({ServerHostname: host, ServerPort: port});

            return deferred.promise();
        },

        connect: function(params) {
            console.log( 'api.net.connect ' + params.host + ':' + params.port + ' ' + params.content );
            api.debug.log( JSON.stringify(params) );
            var connectionData = {
                host: String(params.host || ''),
                port: Number(params.port || 0),
                display_name: String(params.displayName || ''),
                ticket: String(params.ticket || ''),
                with_content: String(params.content || ''),
            };

            var clientData = params.clientData || {};

            return engine.call('net.connect',
                String(JSON.stringify(connectionData)),
                String(JSON.stringify(clientData))
            );
        },

        removePlayerFromGame: function() {
            return engine.asyncCall("ubernet.removePlayerFromGame");
        },

        getReplays: function(sortOrder, uberIdFilter) {
            return engine.asyncCall("ubernet.getReplays", sortOrder, uberIdFilter);
        }
    };

    api.game.getSetupInfo().then(function (payload) { self.ubernetUrl(payload.ubernet_url); });

    api.net = self;
})(window.api);

function parse(string) {
    if (_.isObject(string))
        return string;

    var result = '';

    try {
        result = JSON.parse(string)
    } catch (e) {
        console.log('failed to parse json: ' + string)
    }

    return result;
}

function stringfy(object) {
    var result = '';

    try {
        result = JSON.stringify(object)
    } catch (e) {
        console.log('failed to stringify object:');
        console.log(object);
    }

    return result;
}

function loadHtml(src) {
    var start = Date.now();
    var xmlhttp = new XMLHttpRequest();
    try {
        xmlhttp.open("GET", src, false);
        xmlhttp.send();
    } catch (err) {
        console.error("error loading " + src + ' ' + err.message + " after " +  (Date.now() - start)/1000 + " seconds" );
        return;
    }
    console.log( src + ' loaded in ' + (Date.now() - start)/1000 + " seconds" );
    return xmlhttp.responseText;
}

function loadScript(src) {
    var start = Date.now();
    var o = new XMLHttpRequest();
    try {
        o.open('GET', src, false);
        o.send('');
    } catch (err) {
        console.error("error loading " + src + " after " +  (Date.now() - start)/1000 + " seconds");
        return false;
    }
    if (o.status > 200) {
        console.error('Failed loading ' + src + ' with ' + o.status + " after " +  (Date.now() - start)/1000 + " seconds");
        return false;
    }
    try {
        var se = document.createElement('script');
        se.type = "text/javascript";
        se.text = o.responseText;
        document.getElementsByTagName('head')[0].appendChild(se);
    } catch (err) {
        console.error(err);
        console.error("error loading " + src + " after " +  (Date.now() - start)/1000 + " seconds");
        return false;
    }
    console.log( src + ' loaded in ' + (Date.now() - start)/1000 + " seconds" );
    return true;
}

function loadCSS(src) {
    var link = document.createElement('link');
    link.href = src;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
}

function loadSceneMods(scene) {
    if (_.has(scene_mod_list, scene))
        loadMods(scene_mod_list[scene]);
}

function loadMods(list) {
    var start = Date.now();
    var i;
    var mod;
    var type;

    var js = /[.]js$/;
    var css = /[.]css$/;

    if (api.Panel.pageName === 'game')
        init_browser();

    for ( i = 0; i < list.length; i++) {
        mod = list[i];

        if (mod.match(js))
            loadScript(mod);

        if (mod.match(css))
            loadCSS(mod);
    }
    console.log( 'mods loaded in ' + (Date.now() - start)/1000 + " seconds" );
}

// Adds String.endsWith()
if ( typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

// Adds String.startsWith()
if ( typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(prefix) {
        return this.substring(0, prefix.length) === prefix;
    };
};

// usage: embedHtmlWithScript( "foo.html", "#container", "$('#dest') );
//
// Load the 'container' helement from foo.html and appends it to $('#dest').
// Also will ensure that top level script tags in foo.html are executed
//
function embedHtmlWithScript(srcHtml, srcSelector, target, cb) {
    target.load(srcHtml + " " + srcSelector, function() {
        $.get(srcHtml, function(data) {
            $(data).filter("script").each(function(i, script) {
                //console.log(script.src, "loading");
                loadScript(script.src);
            });
            cb();
        });
    });
}

// Parses the '--uioptions' string from the command line.  Note: Uses JS syntax
// instead of JSON parsing due to probable interactions with command line
// parsing.  (And for extra flexibility.)  Invalid JS will turn into a plain
// string.  Un-wrapped functions will be executed, recursively.  Non-string
// options will be assigned to the 'option' member of the result.
//
// Examples:
// - "" -> {}
// - "Data" -> { Data: 'Data' }
// - "'Data'" -> { Data: 'Data' }
// - "['Data', 'Flag', 'Option']" -> { Data: 'Data', Flag: 'Flag', Option: 'Option' }
// - "[{ Data : 42 }, { Flag : true }, { Option : [] }]" -> { Data: 42, Flag: true, Option: [] }
// - "{ custom: {}, options: [] }" -> { custom: {}, options: [] }
// - "{not,Valid:'JS'}" -> { 'not,Valid:\'JS\'': 'not,Valid:\'JS\'' }
// - "42" -> { option: 42 }
// - "true" -> { option: true }
// - "function() { return 42; }()" -> { option: 42 }
// - "function() { return 42; }" -> { option: 42 }
// - "function() { return function() { return 42; }; }" -> { option: 42 }
// - "function() { return [{Data:42}, {Flag:true}, {Option:[]}]; }" -> { Data: 42, Flag: true, Option: [] }
// - "[{ Data: 42 }, function() { return { Flag: true }; }, { Option: [] }]" -> { Data: 42, Flag: true, Option: [] }
// - "[{ DataFn: function() { return 42; } }]" -> { DataFn: function() { return 42; } }
function parseUIOptions(options) {
    if (!_.isString(options)) {
        if (!_.isObject(options))
            return {};
        return options;
    }

    function unwrapFunction(fn, defaultValue) {
        var unwrapResult = defaultValue;
        while (_.isFunction(fn)) {
            try {
                unwrapResult = fn();
                fn = unwrapResult;
            } catch (ex) {
                break;
            }
        }
        return unwrapResult;
    }

    var result = { };
    if (options !== '') {
        try {
            var fn = new Function('return ' + options);
            var fnResult = unwrapFunction(fn, options);
            if (!_.isArray(fnResult))
                fnResult = [fnResult];
            _.forEach(fnResult, function(item) {
                item = unwrapFunction(item, item);
                if (_.isObject(item))
                    _.assign(result, item);
                else if (_.isString(item))
                    result[item] = item;
                else
                    result.option = item;
            });
        } catch (ex) {
            result = {};
            result[options] = options;
        }
    }

    return result;
}

function encode(object) {
    return JSON.stringify(object);
}

function legacyDecode(string) {
    if (!string)
        return null;

    var index = string.indexOf(':');
    var type = string.slice(0, index);
    var value = string.slice(index + 1);

    try {
        switch (type) {
        case 'null':
            return null;
        case 'string':
            return String(value);
        case 'number':
            return Number(value);
        case 'boolean':
            return value === "true";
        case 'object':
            return JSON.parse(value);
        case 'undefined':
            return undefined;
        case 'function':
            return undefined;
        }
    } catch (error) {
        return null;
    }
}

function decode(string) {
    if (_.isObject(string))
        return string;
    try {
        return JSON.parse(string);
    } catch (error) {
        return legacyDecode(string);
    }
}

function cleanupLegacyStorage() {
    for (var key in localStorage)
    localStorage.setItem(key, encode(decode(localStorage[key])));
}

(function() {/* extend the coherent engine object with an async wrapper */
    var async_requests = {};

    engine.asyncCall = function(/* ... */) {
        var request = new $.Deferred();
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(arguments[0], api.Panel.pageId);
        engine.call.apply(engine, args).then(function(tag) {
            async_requests[tag] = request;
        });
        return request.promise();
    };

    function async_result(data) {
        var params = JSON.parse(data);
        var tag = params.tag;
        var success = !!params.success;
        var code = params.code;
        var result = params.result;
        var request = async_requests[tag];
        delete async_requests[tag];
        if (request) {
            if (success)
                request.resolve(result, code);
            else
                request.reject(result, code);
        }
    }


    engine.on("async_result", async_result);
})();

/* from: http://webdesignfan.com/htmlspecialchars-in-javascript/ */
// Create the function.
// First parameter: the string
// Second parameter: whether or not to "undo" the translation
var htmlSpecialChars = function(string, reverse) {

    // specialChars is a list of characters and that to which to translate them.
    // specialChars["<"] = "&lt;";
    // x is merely a variable used in for loops.
    var specialChars = {
        "&" : "&amp;",
        "<" : "&lt;",
        ">" : "&gt;",
        '"' : "&quot;",
        "'" : "&apos;"
    },
        x;

    // If we are reversing the translation...
    if ( typeof (reverse) != "undefined") {

        // We need to create a temporary array.
        reverse = [];

        // Put each special character in the array.
        for (x in specialChars)
        reverse.push(x);

        // Reverse the array.
        // ["<", ">"] becomes [">", "<"]
        reverse.reverse();

        // For each of the special characters,
        for ( x = 0; x < reverse.length; x++)

        // Replace all instances (g) of the entity with the original.
        // e.g. if x = 1, then
        // reverse[x] = reverse[1] = ">";
        // specialChars[reverse[x]] = specialChars[">"] = "&gt;";
            string = string.replace(new RegExp(specialChars[reverse[x]], "g"), reverse[x]);

        // Return the reverse-translated string.
        // Returning a value ends the function,
        // therefore no code after this line will execute,
        // therefore no need to use the else conditional.
        return string;
    }

    // If we are not reversing a translation,
    // For each of the special characters,
    for (x in specialChars)

    // Replace all instances of the special character with its entity.
    // Remember, unlike in the reverse algorithm where x is an integer,
    // x here is the key value (e.g. &, <, >, and ")
    string = string.replace(new RegExp(x, "g"), specialChars[x]);

    // Return the translated string.
    return string;
};

var onUbernetLogin;

(function() {
    var refresh_on_login = [];
    var logged_in = false;

    onUbernetLogin = function() {
        _.invoke(refresh_on_login, 'refresh');
        refresh_on_login.length = 0;
        logged_in = true;
    };

    ko.extenders.ubernet = function(target, option) {
        var base_key = option,
            ubernet_key = 'uberData.' + base_key,
            previous = {},
            timeout;

        var updateUbernetData = function(data) {

            timeout = undefined;
            
            if (_.isUndefined(data) || _.isNull(data))
                return;

            var payload = { Data:{} };
            payload.Data[ubernet_key] = data;

            var payload_string = JSON.stringify(payload);

            if (payload_string === previous[ubernet_key]) {
                return;
            }

            api.net.ubernet('/GameClient/UpdateUserCustomData', 'POST', 'text', payload).done(function(data) {
                    previous[ubernet_key] = payload_string;
                }).fail(function(error) {
                    console.log(error);
                    console.log('failed to save ubernet data: ' + base_key);
                });

            localStorage.setItem(base_key, encode(data));
            /* fallback to localstorage */
        };

// limit updates to once per second
        target.subscribe(function(value) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout( updateUbernetData, 1000, value );
        });

        target.refresh = function() {
            var request = api.net.ubernet('/GameClient/getUserCustomData', 'GET', 'text', JSON.stringify([ubernet_key])).done(function(data) {
                try {
                    var result = JSON.parse(data).Data[ubernet_key];

                    var invalid = _.isUndefined( result ) || _.isNull( result );

                    if (invalid)/* fallback to localstorage */
                        result = decode(localStorage[base_key]);

// no valid data
                    if ( _.isUndefined(result) || _.isNull(result)) {
                        throw ( 'no ubernet data' );
                    }
                    else {
                        if (invalid) {
                            /* replicate local data to PlayFab */
                            updateUbernetData(result);
                        }
                        else {
                            var payload = { Data: {} };
                            payload.Data[ ubernet_key ] = result;
                            previous[ ubernet_key ] = JSON.stringify( payload );
                        }
                        target(result);
                    }

                } catch (error) {
                    console.log(error);
                    console.log('malformed ubernet data: ' + base_key);
                }
            }).fail(function(error) {
                console.log(error);
                console.log('failed to load ubernet data: ' + base_key);
                var result = decode(localStorage[base_key]);
                if (!_.isUndefined(result) && !_.isNull(result)) {
                    updateUbernetData(result);
                    /* replicate local data to PlayFab */
                    target(result);
                }
            });
            
            return request;
        };

        if (!logged_in)
            refresh_on_login.push(target);
        else
            target.refresh();

        return target;
    };
})();

app.registerWithCoherent = function(model, handlers) {
    var response_key = Math.floor(Math.random() * 65536);
    var responses = {};
    globalHandlers.response = function(msg) {
        if (!msg.hasOwnProperty('key'))
            return;
        var key = msg.key;
        delete msg.key;
        if (!responses[key])
            return;

        var respond = responses[key];
        delete responses[key];
        respond(msg.status === 'success', msg.result);
    };

    globalHandlers.navigate_to = function(url) {
        console.log('navigate_to:' + url);
        window.location.href = url;
        return;
        /* window.location.href will not stop execution. */
    }

    globalHandlers.create_lobby = function() {
        var lastSceneUrl = ko.observable().extend({
            session : 'last_scene_url'
        });
        lastSceneUrl('coui://ui/main/game/start/start.html');

        var params = {
            action: 'start',
            content: api.content.activeContent(),
        };

        if (useLocalServer())
            params['local'] = true;

        window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
    };

    globalHandlers.join_lobby = function(payload) {

        /* Since this is a global handler we can't make any assumptions about the model.
         This sets up the persistance channels that would normally belong in the model. */
        var gameHostname = ko.observable().extend({
            session : 'gameHostname'
        });
        var gamePort = ko.observable().extend({
            session : 'gamePort'
        });
        var joinLocalServer = ko.observable().extend({
            session : 'join_local_server'
        });
        var joinCustomServer = ko.observable().extend({
            session : 'join_custom_server'
        });
        var lobbyId = ko.observable().extend({
            session : 'lobbyId'
        });

        lobbyId(payload.lobby_id);
        gameHostname(payload.game_hostname);
        gamePort(payload.game_port);
        joinLocalServer(payload.local_game);
        joinCustomServer(payload.custom_server);

        var invite_uuid = ko.observable().extend({
            session : 'invite_uuid'
        });
        invite_uuid(payload.uuid);

        window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?content=' + payload.content;
    }

    function read_message(message, payload) {
        if (handlers[message])
            handlers[message](payload);
        else if (globalHandlers[message])
            globalHandlers[message](payload);
    }

    function process_message(string) {
        var message;
        try {
            message = JSON.parse(string);
        } catch (e) {
            console.log('process_message: JSON parsing error');
            console.log(string);
            return;
        }

        var payload;
        if (!message.hasOwnProperty('payload')) {
            payload = _.clone(message);
            delete payload.message_type;
        } else
            payload = message.payload;
        read_message(message.message_type, payload);
    }


    engine.on("process_message", process_message);

    function process_signal(string) {
        read_message(string, {});
    }


    engine.on("process_signal", process_signal);

    model.send_message = function(message, payload, respond) {

        var m = {};
        if (!_.isUndefined(payload))
            m.payload = payload;

        m.message_type = message;
        if (respond) {
            m.response_key = ++response_key;
            responses[m.response_key] = respond;
        }

        engine.call("conn_send_message", JSON.stringify(m));
    }

    model.disconnect = function() {
        ko.observable().extend({ session: 'current_system_tutorial' })(null);
        engine.call("reset_game_state");
    }

    model.exit = function() {
        engine.call("exit");
    }

    app.hello = function(succeed, fail) {
        model.send_message('hello', {}, function(success, response) {
            if (success)
                succeed(response);
            else
                fail(response);
        });
    };

    api.Panel.ready(_.keys(handlers).concat(_.keys(globalHandlers)));
};

// Must be called inside of a script node.  Will load .js, .html, and .css
// For example:
// <script id="mytemplate">
//      app.loadTemplate('coui://ui/main/game/shared/templates/mytemplate');
// </script>
app.loadTemplate = function(baseFileName, cssFileName, jsFileName) {
    var $scriptNode = $('script').last();
    var scriptNode = $scriptNode.get(0);

    var cs = cssFileName || baseFileName;
    var js = jsFileName || baseFileName;

    var $css = $('<link href="' + cs + '.css" rel="stylesheet" type="text/css" />');
    $css.insertBefore($scriptNode);
    scriptNode.type = 'text/html';
    $scriptNode.load(baseFileName + '.html');
    $.getScript(js + '.js');
};
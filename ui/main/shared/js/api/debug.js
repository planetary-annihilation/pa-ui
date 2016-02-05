function init_debug(api) {
    var allow_logs = ko.observable().extend({local: 'debug_allow_logs'});

    api.debug = {
        abort: function () { engine.call('console_exec', 'debug_abort'); },
        crash: function () { engine.call('console_exec', 'debug_crash'); },
        enableLogging: function () { allow_logs(true); },
        disableLogging: function () { allow_logs(false);  },
        log: function () { /* forward arguments */
            if (allow_logs())
                Function.apply.call(console.log, console, arguments);
        }
    };

}
init_debug(window.api);
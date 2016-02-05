var allow_console = true;

var gameConsole = (function () {
    var con;
    var conWrapper;
    var conWin;
    var conInput;
    var isVisible = false;

    function init()
    {
        var isRootPanel = (typeof gPanelPageId === 'undefined') || gPanelPageName === 'game';
        if( con === undefined && isRootPanel)
        {
            con = $("<div id='consoleDiv'><div id='consoleWindow'><pre id='consolePre'></pre></div><input id='consoleInput' type='text' size='60'/></div>");
            conWrapper = $("<div class='console-wrapper' style='display: none' />");
            conWrapper.append(con);
            $("body").append(conWrapper);
            conWin = $("#consoleData");
            conInput = $("#consoleInput");

            conWrapper.keydown(function(event) {
                if (!isVisible)
                    return true;
                if (event.keyCode == keyboard.esc)
                {
                    toggle();
                    return false;
                }
                return true;
            });
            conInput.keydown(function(event) {
                if (!isVisible)
                    return true;
                if (event.keyCode == keyboard.enter)
                {
                    var command = conInput.val().toString();
                    conInput.val("");
                    execute(command);
                    return false;
                }
                return true;
            });

            engine.call('get_log_history').then(function(msg) {
                var payload = JSON.parse(msg);
                var msgs = payload.messages;
                for( var i=0; i < msgs.length; ++i )
                    log(msgs[i]);
            });
        }
    }

    function toggle() {
        if (!allow_console)
            return;

        init();
        isVisible = !isVisible;

        if (isVisible)
        {
            conWrapper.show();
            api.game.captureKeyboard();
        }
        con.slideToggle(200, function() {
            if (isVisible) {
                conInput.focus();
            }
            else {
                conWrapper.hide();
                conInput.blur();
                api.game.releaseKeyboard();
            }
        });
    }

    function execute(command)
    {
        var args = command.split(' ');
        if (args.length == 0)
            return;
        var op = args[0];
        var values = args.slice(1);
        if ((op == 'exit') ||
            (op == 'help') ||
            (op == 'viz') ||
            (op == 'profile') ||
            (op == 'debug_abort') ||
            (op == 'debug_crash') ||
            (op == 'set')) {
            engine.call('console_exec', command);
        }
        else {
            try {
                var result = eval(command);
                if (result === null)
                    result = 'null';
                else if (typeof result == 'object')
                    result = JSON.stringify(result); // TODO: Custom printer
                log(result + "<br>");
            }
            catch (e) {
                log(e);
                log("<br>");
            }
        }
    }

    function log(msg)
    {
        if( con == undefined )
            init();
        $("#consolePre").append(msg);

        var pre = jQuery("#consolePre");
        pre.scrollTop( pre.prop("scrollHeight") );
    }

    globalHandlers.log_message = function(payload) {
        //console.log(payload.message, "log_message");
        log(payload);
    }

    return {
        log: log,
        toggle: toggle,
        execute: execute
    }
}());

function init_time(api) {
    var current_speed = [1.0];
    var speed_stack = [[]];
    var getViewId = function(view) { return view ? view.id : 0; };

    api.time = {
        control: function (view) { engine.call("time.control", view ? view.id : -1); },
        resume: function (view) { engine.call("time.resume", view ? view.id : -1); },
        set: function (target, view) { engine.call("time.set", target, view ? view.id : -1); },
        skip: function (amount, view) { engine.call("time.skip", amount, view ? view.id : -1); },
        pause: function (view) {
            engine.call("time.pause", view ? view.id : -1);
            current_speed[getViewId(view)] = 0;
        },
        play: function (speed, view) {
            engine.call("time.play", speed, view ? view.id : -1);
            current_speed[getViewId(view)] = speed;
        },
        pushSpeed: function (view) {
            var s = current_speed[getViewId(view)];
            if (s === undefined)
                s = 1.0;
            speed_stack[getViewId(view)].push(s);
        },
        popSpeed: function (view) {
            var speed = speed_stack[getViewId(view)].pop();
            if (speed)
                engine.call("time.play", speed, view ? view.id : -1);
            else
                engine.call("time.pause", view ? view.id : -1);
        },
        frameBack: function (view) { engine.call("time.frameBack", view ? view.id : -1); },
        frameForward: function (view) { engine.call("time.frameForward", view ? view.id : -1); },
    };
};

init_time(window.api);


window.input = function () {
    var dt_doubleTime = new Date().getTime();
    var dt_firstDesc = {};

    var DT_DEFAULT_TIMEOUT = 750;

    function doubleTap(single, double) {
        var unique = {};
        return function(event, desc) {
            if (_.isUndefined(desc))
                desc = unique;
            dt_lastEvent = event;
            var now = new Date().getTime();
            var isDouble = (desc === dt_firstDesc) && (now < dt_doubleTime);
            dt_reset(desc, now);
            if (isDouble)
                return double(event, desc);
            else
                return single(event, desc);
        };
    }

    function dt_reset(desc, now) {
        dt_firstDesc = desc;
        dt_doubleTime = now + doubleTap.timeout;
    }

    doubleTap.reset = function() {
        dt_reset({}, 0);
    };
    doubleTap.timeout = DT_DEFAULT_TIMEOUT;

    var $captureWrapper;
    var captured = ko.observable(false);
    function capture(element, eventHandler) {

        if (typeof element === 'undefined' || typeof eventHandler === 'undefined') { return; }

        var offset = $(element).offset();
        $captureWrapper = $('<div class="input_capture" tabindex=1 />');
        $('body').prepend($captureWrapper);
        var filter = function(e) {
            e.offsetX -= offset.left;
            e.offsetY -= offset.top;

            Mousetrap.processModifiersForEvent(e);

            eventHandler(e);
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        $captureWrapper.on('mousedown mouseup click mousemove mouseover mouseenter mouseleave keydown keyup keypress', filter);
        $captureWrapper.focus();
        captured(true);
    };

    function release() {
        if ($captureWrapper) {
            $captureWrapper.remove();
            $captureWrapper = undefined;
            captured(false);
        }
    };

    return {
        doubleTap: doubleTap,
        capture: capture,
        captured: captured,
        release: release
    };
}();

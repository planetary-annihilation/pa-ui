var UberUtility = (function() {
    // Overflow/underflow/resize listener support from here: http://www.backalleycoder.com/
    // http://www.backalleycoder.com/2013/03/14/oft-overlooked-overflow-and-underflow-events/
    // http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/

    function addFlowListener(element, type, fn) {
        var flow = type == 'over';
        element.addEventListener('OverflowEvent' in window ? 'overflowchanged' : type + 'flow', function (e) {
            if (e.type == (type + 'flow') ||
            ((e.orient == 0 && e.horizontalOverflow == flow) ||
            (e.orient == 1 && e.verticalOverflow == flow) ||
            (e.orient == 2 && e.horizontalOverflow == flow && e.verticalOverflow == flow))) {
                e.flow = type;
                return fn.call(this, e);
            }
        }, false);
    }

    function fireEvent(element, type, data, options) {
        var options = options || {},
            event = document.createEvent('Event');
        event.initEvent(type, 'bubbles' in options ? options.bubbles : true, 'cancelable' in options ? options.cancelable : true);
        for (var z in data) event[z] = data[z];
        element.dispatchEvent(event);
    }

    function addResizeListener(element, fn) {
        var resize = ('onresize' in element) && !!element.onresize;
        if (!resize && !element._resizeSensor) {
            var sensor = element._resizeSensor = document.createElement('div');
            sensor.className = 'resize-sensor';
            sensor.innerHTML = '<div class="resize-overflow"><div></div></div><div class="resize-underflow"><div></div></div>';

            var x = 0, y = 0,
                first = sensor.firstElementChild.firstChild,
                last = sensor.lastElementChild.firstChild,
                matchFlow = function (event) {
                    var change = false,
                    width = element.offsetWidth;
                    if (x != width) {
                        first.style.width = width - 1 + 'px';
                        last.style.width = width + 1 + 'px';
                        change = true;
                        x = width;
                    }
                    var height = element.offsetHeight;
                    if (y != height) {
                        first.style.height = height - 1 + 'px';
                        last.style.height = height + 1 + 'px';
                        change = true;
                        y = height;
                    }
                    if (change && event.currentTarget != element) fireEvent(element, 'resize');
                };

            if (getComputedStyle(element).position == 'static') {
                element.style.position = 'relative';
                element._resizeSensor._resetPosition = true;
            }
            addFlowListener(sensor, 'over', matchFlow);
            addFlowListener(sensor, 'under', matchFlow);
            addFlowListener(sensor.firstElementChild, 'over', matchFlow);
            addFlowListener(sensor.lastElementChild, 'under', matchFlow);
            element.appendChild(sensor);
            matchFlow({});
        }
        var events = element._flowEvents || (element._flowEvents = []);
        if (events.indexOf(fn) == -1) events.push(fn);
        if (!resize) element.addEventListener('resize', fn, false);
        element.onresize = function (e) {
            events.forEach(function (fn) {
                fn.call(element, e);
            });
        };
    }

    function removeResizeListener(element, fn) {
        var index = element._flowEvents.indexOf(fn);
        if (index > -1) element._flowEvents.splice(index, 1);
        if (!element._flowEvents.length) {
            var sensor = element._resizeSensor;
            if (sensor) {
                element.removeChild(sensor);
                if (sensor._resetPosition) element.style.position = 'static';
                delete element._resizeSensor;
            }
            if ('onresize' in element) element.onresize = null;
            delete element._flowEvents;
        }
        element.removeEventListener('resize', fn);
    }

    function createTimeString(timeInSeconds) {
        var s = Math.floor(timeInSeconds);
        var m = Math.floor(s / 60);
        s = s - m * 60;

        return '' + m + (s < 10 ? ':0' : ':') + s;
    }

    var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    function createDateString(utc) { /* MON XX YYYY */
        var today = !!utc ? new Date(utc) : new Date(),
            dd = today.getDate(),
            mm = today.getMonth(),
            yyyy = today.getFullYear();

        if (dd < 10)
            dd = '0' + dd;


        return months[mm] + ' ' + dd + ' ' + yyyy;
    }

    function createDateTimeString(utc) { /* MON XX YYYY HH:NN PP */
        var today = !!utc ? new Date(utc) : new Date(),
            dd = today.getDate(),
            mm = today.getMonth(),
            yyyy = today.getFullYear(),
            hh = today.getHours(),
            nn = today.getMinutes(),
            pp = hh < 13 ? 'am' : 'pm';

        if (dd < 10)
            dd = '0' + dd;

        if (hh >= 13)
            hh -= 12;

        if (nn < 10)
            nn = '0' + nn;

        return months[mm] + ' ' + dd + ' ' + yyyy + ' ' + hh + ':' + nn + ' ' + pp;
    }

    function createHexUUIDString() {
        var result = '';
        _.times(32, function () {
            result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        });
        return result
    }

    var random_characters = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';

    function randomString(length) {
        var result = '';
        _.times(length, function () {
            var number = Math.floor(Math.random() * random_characters.length);
            result += random_characters.charAt(number);
        });
        return result;
    }

    function createUUIDString() {
        return randomString(32);
    }

    function isInvalidUUIDString(value) {
        return String(value).length !== 32;
    }

    function waitForAll(array) {
        var deferred = $.Deferred();

        // wait for an array of deferreds: see http://jsfiddle.net/YNGcm/21/
        $.when.apply(null, array).done(function () {
            // access magic arguments psuedo-array: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
            deferred.resolve(Array.prototype.slice.call(arguments)); /* returns an array containing the resolved values */
        });

        return deferred.promise();
    }

    function naivePluralize(x, unit) {
        if (x === 1)
            return x + ' ' + unit;
        else
            return x + ' ' + unit + 's';
    }

    function fixupPlanetConfig(system) {

        var planets = system.planets || [];
        for (var p = 0; p < planets.length; ++p) {
            var planet = planets[p];
            if (planet.hasOwnProperty('position_x')) {
                planet.position = [planet.position_x, planet.position_y];
                delete planet.position_x;
                delete planet.position_y;
            }
            if (planet.hasOwnProperty('velocity_x')) {
                planet.velocity = [planet.velocity_x, planet.velocity_y];
                delete planet.velocity_x;
                delete planet.velocity_y;
            }
            if (planet.hasOwnProperty('planet')) {
                planet.generator = planet.planet;
                delete planet.planet;
            }
        }
        return system;
    }

    function unfixupPlanetConfig(system) {
        if (!system.planets)
            system.planets = [];

        var planets = system.planets || [];
        for (var p = 0; p < planets.length; ++p) {
            var planet = planets[p];
            if (planet.hasOwnProperty('position')) {
                planet.position_x = planet.position[0];
                planet.position_y = planet.position[1];
                delete planet.position;
            }
            if (planet.hasOwnProperty('velocity')) {
                planet.velocity_x = planet.velocity[0];
                planet.velocity_y = planet.velocity[1];
                delete planet.velocity;
            }
            if (planet.hasOwnProperty('generator')) {
                planet.planet = planet.generator;
                delete planet.generator;
            }
        }
        return system;
    }

    function waitForAttributeSave(object, key_attr, payload_attr, database) {
        var deferred = $.Deferred();

        if (!object[payload_attr]) {
            deferred.resolve(object);
            return deferred.promise();
        }

        var object_key = object[key_attr];
        var payload = object[payload_attr];

        object = _.omit(object, payload_attr);

        if (UberUtility.isInvalidUUIDString(object_key))
            DataUtility.addObject(database, payload).then(function (result) {
                object[key_attr] = result;
                deferred.resolve(object);
            });
        else
            DataUtility.updateObject(database, object_key, payload).then(function (result) {
                deferred.resolve(object);
            });

        return deferred.promise();
    }

    function waitForAttributeLoad (object, key_attr, payload_attr, database) {
        var deferred = $.Deferred();

        var object_key = object[key_attr];

        if (!object_key || UberUtility.isInvalidUUIDString(object_key)) {
            deferred.resolve(object);
            return deferred.promise();
        }

        DataUtility.readObject(database, object_key).then(function (result) {
            object[payload_attr] = result;
            deferred.resolve(object);
        });

        return deferred.promise();
    }

    var currentTimeSeconds = ko.observable();
    var currentTimeUpdater = null;

    function updateCurrentTime() {
        currentTimeSeconds((_.now() / 1000) | 0);
    }

    function getCurrentTimeObservable() {
        if (currentTimeUpdater === null) {
            updateCurrentTime();
            currentTimeUpdater = setInterval(updateCurrentTime, 500);
        }

        return currentTimeSeconds;
    }

    function isUndefinedNullOrNaN(value) {
        return _.isUndefined(value) || _.isNull(value) || _.isNaN(value);
    }

    function isValidNumber(value) {
        return _.isNumber(value) && _.isFinite(value) && !_.isNaN(value);
    }

    function isDefinedAndValid(value) {
        return !isUndefinedNullOrNaN(value) && (!_.isNumber(value) || isValidNumber(value));
    }

    return {
        addFlowListener : addFlowListener,
        addResizeListener : addResizeListener,
        removeResizeListener: removeResizeListener,

        createTimeString: createTimeString,
        createDateString: createDateString,
        createDateTimeString: createDateTimeString,
        createHexUUIDString: createHexUUIDString,
        createUUIDString: createUUIDString,
        isInvalidUUIDString: isInvalidUUIDString,
        randomString: randomString,

        waitForAll: waitForAll,
        naivePluralize: naivePluralize,
        fixupPlanetConfig: fixupPlanetConfig,
        unfixupPlanetConfig: unfixupPlanetConfig,

        waitForAttributeSave: waitForAttributeSave,
        waitForAttributeLoad: waitForAttributeLoad,

        getCurrentTimeObservable: getCurrentTimeObservable,

        isUndefinedNullOrNaN: isUndefinedNullOrNaN,
        isDefinedAndValid: isDefinedAndValid,
        isValidNumber: isValidNumber
    };

})();


// Common non-UI knockout extensions

(function(window, ko) {

    if (window) {
        function makeStorageExtender(storage, onWrite) {
            return function (target, option) {
                var v;
                var loading = false;

                // write changes to storage
                target.subscribe(function (newValue) {
                    if (!loading) {
                        var encoded = encode(newValue);
                        storage.setItem(option, encoded);
                        if (onWrite) {
                            onWrite(option, encoded);
                        }
                    }
                });

                // init from storage
                if (storage[option]) {
                    v = decode(storage[option]);
                    loading = true;
                    try {
                        target(v);
                    } catch (e) {
                        loading = false;
                        throw e;
                    }
                    loading = false;
                }
                else if (gSessionBackup[option] !== undefined) {
                    target(gSessionBackup[option]);
                }

                return target;
            };
        }

        ko.extenders.local = makeStorageExtender(window.localStorage);
        ko.extenders.session = makeStorageExtender(window.sessionStorage, function(option, value) { engine.call('panel.writeSession', gPanelPageId, option, value || ''); });
    }
    else {
        ko.extenders.local = function(target, option) { return target; };
        ko.extenders.session = ko.extenders.local;
    }

    /* can adapt values previously stored with the local extender */
    ko.extenders.db = function (target, option) {

        var local_name = option.local_name;
        var database_name = option.db_name;

        /* read db_key from local storage */
        var db_key = window.localStorage[local_name];

        target.ready = $.Deferred();

        function ready() {
            target.ready.resolve(target.peek());
            target.subscribe(function (new_value) {
                DataUtility.updateObject(database_name, db_key, new_value);
            });
        }

        DataUtility.readObject(database_name, db_key).then(function (read_result) {
            if (read_result) { /* key was valid */
                target(read_result);
                ready();
                return;
            }

            /* key was not valid */
            var target_value = decode(db_key);
            if (_.isNull(target_value))
                target_value = target();

            /* store the local data as a new object */
            DataUtility.addObject(database_name, target_value).then(function (add_result) {
                if (!add_result) {
                    console.log('KO Utility: db add failed.');
                    target.ready.reject();
                    return;
                }

                db_key = add_result;
                window.localStorage[local_name] = db_key;
                target(target_value);
                ready();
            });
        });
    };


    ko.extenders.memory = function (target, option) {
        var v;
        var loading = false;

        // write changes to storage
        target.subscribe(function (newValue) {
            if (!loading) {
                api.memory.store(option, newValue, false);
            }
        });

        // init from storage
        loading = true;
        api.memory.load(option).then(function(newValue) {
            target(newValue);
            loading = false;
        });

        return target;
    };

    ko.extenders.withPrevious = function (target) {
        // Define new properties for previous value and whether it's changed
        target.previous = ko.observable();
        target.changed = ko.computed(function () { return target() !== target.previous(); });

        // Subscribe to observable to update previous, before change.
        target.subscribe(function (v) {
            target.previous(v);
        }, null, 'beforeChange');

        // Return modified observable
        return target;
    };

    ko.extenders.numeric = function (target, precision) {

        var isFrac = function (number) {
            return number % 1 !== 0;
        };

        var result = ko.computed({
            read: function () {
                var input = Number(target());
                return isFrac(input) ? input.toFixed(precision) : input;
            },
            write: target
        });

        result.raw = target;
        return result;
    };

    ko.extenders.positive = function (target) {

        var result = ko.computed({
            read: function () {
                var input = Number(target());
                return Math.max(0, input);
            },
            write: target
        });

        result.raw = target;
        return result;
    };

    ko.extenders.maxLength = function(target, maxLength) {
        // Use an internal observable to truncate on write
        var result = ko.computed({
            read: target,
            write: function(newValue) {
                var curValue = target();
                var truncated = newValue;
                if (_.isString(truncated))
                    truncated = truncated.substring(0, Math.min(newValue.length, maxLength));

                if (truncated !== curValue) {
                    target(truncated);
                } else if (newValue !== curValue) {
                    // Notify on equal truncation if the un-truncated version changed
                    target.notifySubscribers(truncated);
                }
            }
        });

        // Initialize the computed with the original value
        result(target());

        return result;
    };

})(window, ko);


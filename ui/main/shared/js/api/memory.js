// Data storage which persists until game shutdown

(function (api) {
    api.memory = {
        // store one key/value pair.  Send null or undefined to clear.  Returns the previous value.
        store: function(key, value, returnOld) {
            if (_.isUndefined(value) || _.isNull(value))
                value = '';
            else
                value = JSON.stringify(value);
            return engine.call('memory.store', String(key), value, !!returnOld)
                    .then(function(oldValue) {
                        if (oldValue === '')
                            return null;
                        return JSON.parse(oldValue);
                    });
        },
        // load the value for a given key
        load: function(key) {
            return engine.call('memory.load', String(key))
                    .then(function(value) {
                        if (value === '')
                            return null;
                        return JSON.parse(value);
                    });
        },
        // clear all memory with a given prefix
        // Returns the number of keys removed (via promise, of course.)
        clear: function(prefix) { return engine.call('memory.clear', String(prefix || '')); },
        // list all memory keys that start with a given prefix
        list: function(prefix) {
            return engine.call('memory.list', String(prefix || ''))
                    .then(function(result) {
                        return JSON.parse(result);
                    });
        },
    };
})(window.api);

(function(api, engine) {
    var pendingAutoSave = false;
    function doAutoSave(result, value) {
        if (!self.autoSave()) {
            result.resolve(value);
            return;
        }

        // This accumulates a first batch of tally calls when more than one stat
        // is getting updated.
        if (!pendingAutoSave) {
            pendingAutoSave = [];
            pendingAutoSave.push([result, value]);
            _.delay(function() {
                var results = pendingAutoSave;
                pendingAutoSave = false;
                self.save()
                    .done(function() {
                        _.forEach(results, function(pair) {
                            pair[0].resolve(pair[1]);
                        });
                    })
                    .fail(function() {
                        _.forEach(results, function(pair) {
                            pair[0].reject();
                        });
                    });
            });
        }
        else
            pendingAutoSave.push([result, value]);
    }
    
    var self = {
        autoSave: ko.observable(true),
        refresh: function() {
            var result = $.Deferred();
            engine.asyncCall('tally.refresh')
                .fail(function(value) {
                    result.reject(value);
                })
                .done(function() {
                    result.resolve();
                });
            return result.promise();
        },

        save: function() {
            var result = $.Deferred();
            engine.asyncCall('tally.save')
                .fail(function(value) {
                    result.reject(value);
                })
                .done(function() {
                    result.resolve();
                });
            return result.promise();
        },
        
        getStatInt: function(name) {
            var result = $.Deferred();
            engine.call('tally.getStatInt', name)
                .then(function(value) {
                    if (value !== '')
                        result.resolve(Number(value));
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },
        setStatInt: function(name, value) {
            var result = $.Deferred();
            engine.call('tally.setStatInt', name, value)
                .then(function(succeeded) {
                    if (succeeded)
                        doAutoSave(result, value);
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },
        incStatInt: function(name, adj) {
            var result = $.Deferred();
            if (_.isUndefined(adj))
                adj = 1;
            engine.call('tally.incStatInt', name, adj)
                .then(function(value) {
                    if (value !== '')
                        doAutoSave(result, Number(value));
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },
        getStatFloat: function(name) {
            var result = $.Deferred();
            engine.call('tally.getStatFloat', name)
                .then(function(value) {
                    if (value !== '')
                        doAutoSave(result, Number(value));
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },
        setStatFloat: function(name, value) {
            var result = $.Deferred();
            engine.call('tally.setStatFloat', name, value)
                .then(function(succeeded) {
                    if (succeeded)
                        doAutoSave(result, value);
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },
        incStatFloat: function(name, adj) {
            var result = $.Deferred();
            if (_.isUndefined(adj))
                adj = 1;
            engine.call('tally.incStatFloat', name, adj)
                .then(function(value) {
                    if (value !== '')
                        doAutoSave(result, Number(value));
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },

        updateStatAvg: function(name, value, period) { 
            var result = $.Deferred();
            engine.call('tally.updateStatAvg', name, value, period)
                .then(function(succeeded) {
                    if (succeeded)
                        doAutoSave(result);
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        },

        setAchievement: function(name) { 
            var result = $.Deferred();
            engine.call('tally.setAchievement', name)
                .then(function(succeeded) {
                    if (succeeded)
                        doAutoSave(result);
                    else
                        result.reject();
                }, function() { result.reject(); });
            return result.promise();
        }
    };
    
    api.tally = self;
})(window.api, engine);

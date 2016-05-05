(function (global) {
    var DISPLAY_NAME_STRIP_SUFFIX = ' Commander';

    var commandersList = ko.observableArray();
    
    function updateCommanders() {

        var commandersDeferred = $.Deferred();

        // TODO: error checking

        $.get('spec://pa/units/commanders/commander_list.json').then(function(list) {
            var commanders = list && list.commanders;

            commandersList(commanders);

            var completeRequest = (function() {
                var specObjectName = {};
                var specData = {};
                var commandersRemaining = commanders.length;
                return function(commander, data) {
                    commandersRemaining -= 1;
                    specObjectName[commander] = data.catalog_object_name;
                    specData[commander] = data;
                    if (commandersRemaining != 0)
                        return;

                    commandersDeferred.resolve({
                        specObjectName: specObjectName,
                        objectSpecPath: _.invert(specObjectName),
                        specs: specData,
                    });
                };
            })();

            _.forEach(commanders, function(commander) {
                $.get('spec:/' + commander).then(function(commanderData) {
                    completeRequest(commander, commanderData);
                });
            });
        });

        return commandersDeferred.promise();
    };

    var commandersLoaded = updateCommanders();

    var memoizedObservableAsyncAccessor = function (dflt, asyncFetcher)
    {
        var results = {};
        var observables = {};
        return function (key) {
            if (!_.has(results, key) && !_.has(observables, key))
            {
                observables[key] = ko.observable(dflt);
                asyncFetcher(key, function(result) {
                        results[key] = result;
                        observables[key](result);
                        delete observables[key];
                });
            }

            if (_.has(observables, key))
                return observables[key]();
            else
                return results[key];
        }
    };

    var memoizedComputeds = function (dflt, computer)
    {
        var computeds = {};
        return function (key) {
            if (!_.has(computeds, key))
                computeds[key] = ko.pureComputed(function() {
                    return computer(key);
                });
            return computeds[key]();
        };
    };

    var getSpec = memoizedObservableAsyncAccessor({}, function(specPath, callback) {
        commandersLoaded.then(function(commanders) {
            callback(commanders.specs[specPath]);
        });
    });

    var exports = {
        getKnownCommanders: commandersList,

        afterCommandersLoaded: function(cb) {
            commandersLoaded.then(function() {
                // Make sure all the other commandersLoaded callbacks get to run first.
                _.defer(cb);
            });
        },

        bySpec: {
            getObjectName: memoizedObservableAsyncAccessor(null, function(specPath, callback) {
                commandersLoaded.then(function(commanders) {
                    callback(commanders.specObjectName[specPath]);
                });
            }),

            getSpec: getSpec,

            getName: memoizedComputeds('', function(specPath) {
                if (specPath)
                {
                    var spec = getSpec(specPath);

                    var name = _.get(spec, 'display_name', '');
                    if (name && name.endsWith(DISPLAY_NAME_STRIP_SUFFIX))
                        name = name.substr(0, name.length - DISPLAY_NAME_STRIP_SUFFIX.length);
                    return name;
                }

                return '';
            }),

            getImage: memoizedComputeds(null, function (specPath) {
                if (specPath)
                {
                    var spec = getSpec(specPath);

                    var profile = _.get(spec, 'client.ui.image');
                    if (profile)
                        return 'coui:/' + profile;
                }
                return null;
            }),

            getProfileImage: memoizedComputeds(null, function (specPath) {
                if (specPath)
                {
                    var spec = getSpec(specPath);

                    var profile = _.get(spec, 'client.ui.profile_image');
                    if (profile)
                        return 'coui:/' + profile;
                }
                return null;
            }),

            getThumbImage: memoizedComputeds(null, function (specPath) {
                if (specPath)
                {
                    var spec = getSpec(specPath);

                    var thumb = _.get(spec, 'client.ui.thumb_image');
                    if (thumb)
                        return 'coui:/' + thumb;
                }
                return null;
            }),
        },

        byObjectName: {
            getSpecPath: memoizedObservableAsyncAccessor(null, function(objectName, callback) {
                commandersLoaded.then(function(commanders) {
                    callback(commanders.objectSpecPath[objectName]);
                });
            }),

            getImage: memoizedComputeds(null, function(objectName) {
                var specPath = exports.byObjectName.getSpecPath(objectName);
                if (specPath)
                    return exports.bySpec.getImage(specPath);
                else
                    return null;
            }),

            getProfileImage: memoizedComputeds(null, function(objectName) {
                var specPath = exports.byObjectName.getSpecPath(objectName);
                if (specPath)
                    return exports.bySpec.getProfileImage(specPath);
                else
                    return null;
            }),

            getThumbImage: memoizedComputeds(null, function(objectName) {
                var specPath = exports.byObjectName.getSpecPath(objectName);
                if (specPath)
                    return exports.bySpec.getThumbImage(specPath);
                else
                    return null;
            }),
        },

        update: function() { return commandersLoaded = updateCommanders() },
    };

    global.CommanderUtility = exports;
})(window);

var DataUtility = (function () {

    var utility = {};
    var version = 1;
    var open_databases = {};

    utility.openDatabase = function (database_name) {
        var deferred = $.Deferred();
        var db_request = indexedDB.open(database_name, version);

        db_request.onsuccess = function (event) {
            var result = event.target.result
            open_databases[database_name] = result;
            deferred.resolve(result);
        };

        db_request.onerror = function (event) {
            console.log('DataUtility error: could not open database "' + database_name + '"');
            deferred.resolve(null);
        };

        db_request.onupgradeneeded = function (event) {
            var db = event.target.result;
            var transaction = event.target.transaction;

            db.createObjectStore(database_name, { keyPath: 'db_key' }); /* note: webkit does not support autoIncrement */
            transaction.onerror = db_request.onerror;
        };

        return deferred.promise();
    };

    function waitForDB(database_name) {
        var deferred = $.Deferred();

        var db = open_databases[database_name];

        if (db)
            deferred.resolve(db);
        else
            utility.openDatabase(database_name).then(function (result) {
                deferred.resolve(result);
            });

        return deferred.promise();
    }

    function waitForUniqueKey(database_name, db) {
        var deferred = $.Deferred();

        var transaction = db.transaction([database_name], 'readonly'); /* blocks other transactions */
        var store = transaction.objectStore(database_name);

        var key = UberUtility.createUUIDString();
        var request = store.openCursor(key);

        request.onsuccess = function (event) {
            var cursor = event.target.target;
            if (!cursor) /* if we have a cursor, then the id is already in use by the db */
                deferred.resolve(key); /* the chance of a collision is nearly zero, but if we don't check we could overwrite data */
            else {
                waitForUniqueKey(database_name, db).then(function (new_key) { /* recurse */
                    deferred.resolve(new_key);
                });
            }
        }

        return deferred.promise();
    }

    utility.updateObject = function (database_name, object_key, payload) {

        var deferred = $.Deferred();

        waitForDB(database_name).then(function (db) {

            var transaction = db.transaction([database_name], 'readwrite'); /* does not block other transactions */
            var store = transaction.objectStore(database_name);

            var object = {
                db_key: object_key,
                value: payload
            };

            var request = store.put(object);

            transaction.oncomplete = function (event) {
                deferred.resolve(object_key);
            };

            transaction.onerror = function (event) {
                console.log('DataUtility: indexDB put failed.');
                console.log(event);
                deferred.resolve(null);
            };
        });

        return deferred.promise();
    };

    utility.addObject = function (database_name, payload) {
        var deferred = $.Deferred();

        waitForDB(database_name).then(function (db) {

            waitForUniqueKey(database_name, db).then(function (key) {
                utility.updateObject(database_name, key, payload).then(deferred.resolve); /* passes key to deferred */
            });
        });
        return deferred.promise();
    };


    utility.deleteObject = function (database_name, object_key) {
        var deferred = $.Deferred();

        waitForDB(database_name).then(function (db) {

            var transaction = db.transaction([database_name], 'readwrite'); /* blocks other transactions */
            var store = transaction.objectStore(database_name);

            var request = store.delete(object_key);

            transaction.oncomplete = function (event) {
                deferred.resolve(object_key);
            };

            transaction.onerror = function (event) {
                console.log('DataUtility: indexDB delete failed.');
                console.log(event);
                deferred.resolve(null);
            };
        });

        return deferred.promise();
    };

    utility.readObject = function (database_name, object_key) {
        var deferred = $.Deferred();

        if (UberUtility.isInvalidUUIDString(object_key)) {
            deferred.resolve(null);
            console.log('DataUtility: key was invalid.');
            return deferred.promise();
        }

        waitForDB(database_name).then(function (db) {

            var transaction = db.transaction([database_name], 'readonly'); /* does not block other transactions */
            var store = transaction.objectStore(database_name);

            var keyRange = IDBKeyRange.only(object_key);
            if (!keyRange) {
                console.log('DataUtility: key not found.');
                deferred.resolve(null);
                return;
            }

            var request = store.openCursor(keyRange);

            request.onsuccess = function (event) {

                var result = event.target.result;
                if (!result) {
                    console.log('DataUtility: no data found.');
                    deferred.resolve(null);
                    return;
                }

                var payload = result.value.value; /* value.value is expected */

                if (!payload) {
                    console.log('DataUtility: data is malformed. value is required.');
                    console.log(result.value);
                    deferred.resolve(null);
                    return;
                }

                deferred.resolve(payload);
            };

            request.onerror = function (event) {
                console.log('DataUtility: indexDB openCursor failed.');
                console.log(event);
                deferred.resolve(null);
            };
        });

        return deferred.promise();
    };

    return utility;
})();

if (false) { /* run tests */
    console.log('DataUtility: running tests');

    function write(result) {
        return result ? 'ok' : 'failed';
    }

    var db_name = 'db_test';
    var input = { foo: 'bar', array: [1, 2, 3, 4], map: { a: 'A', b: 'B' } };

    DataUtility.openDatabase(db_name).then(function (db) {
        console.log('DataUtility.openDatabase result: ' + write(db));

        DataUtility.addObject(db_name, input).then(function (db_key) {
            console.log('DataUtility.addObject result: ' + write(db_key));

            DataUtility.readObject(db_name, db_key).then(function (output) {
                console.log('DataUtility.readObject result: ' + write(output));
                console.log('DataUtility.reflection result: ' + write(_.isEqual(input, output)));

                DataUtility.deleteObject(db_name, db_key).then(function (db_key_again) {
                    console.log('DataUtility.deleteObject result: ' + write(db_key_again));
                });
            });
        });
    });
}

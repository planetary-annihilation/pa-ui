(function(global) {
    var catalog = ko.observableArray().extend({ session: 'playfabCatalog' });
    var signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });

    var addInventoryItem = function (destinationCatalog, objectName)
    {
        var item = _.find(destinationCatalog, { ObjectName: objectName });
        if (item)
        {
            item.IsOwned = true;
            item.Quantity = item.Quantity ? item.Quantity + 1 : 1;
            return true;
        }

        // If it is in your inventory, but it's not in the catalog any more, we don't let you use it.
        // We can mark things as NotForSale if we do not want new people to have it, but leave it for
        // current customers.
        return false;
    };

    var updateInventory = function (callback, newCatalog) {
        var call = engine.asyncCall("ubernet.getUserInventory");

        call.done(function (data) {
            data = JSON.parse(data);

            _.forEach(data.Inventory, function(item) {
                if (_.has(item, 'ObjectName'))
                    addInventoryItem(newCatalog, item.ObjectName);
            });

            catalog(newCatalog);
            if (callback) { callback(); }
        });

        call.fail(function (data) {
            if (callback) { callback(); }
        });
    }

    var exports = {};
    exports.catalog = catalog;

    exports.updateCatalog = function (callback) {
        var call = engine.asyncCall("ubernet.getCatalog");

        call.done(function (data) {
            data = JSON.parse(data);

            var newCatalog = [];
            if (_.isArray(data.Catalog))
                newCatalog = data.Catalog;
            updateInventory(callback, newCatalog);
        });

        call.fail(function (data) {
            if (callback) { callback(); }
        });
    };

    exports.addInventoryItem = function(objectName) {
        if (addInventoryItem(catalog(), objectName))
            catalog.valueHasMutated();
    };

    exports.getCatalogItem = function(objectName) {
        return _.find(catalog(), { ObjectName: objectName });
    };

    exports.isCommanderOwned = function(objectName) {
        if (!signedInToUbernet())
            return true;
        return exports.isItemOwned(objectName);
    }

    exports.isItemOwned = function(objectName) {
        var item = exports.getCatalogItem(objectName);
        if (!item)
            return false;
        return (item.IsFree || item.IsOwned);
    };

    global.PlayFab = exports;
})(window);

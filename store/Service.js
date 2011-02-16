dojo.provide("samiam.store.Service");

// based on a quick prototype by dmachi: http://jsfiddle.net/dmachi/LfVv8/
samiam.store.Service = function(service, options) {
    // summary:
    //        The Service store wraps an RPC Service using its methods for
    //        making the associated store calls. By default, the store will
    //        look for the standard store method names: query, get,add,put,delete.
    //        of a 'map' propery is provided to the option set, the store will
    //        will override the default mapping and use that service method instead.
    //
    //options:
    //        'map': An object where the properties define what method to map to
    //            and the value is a string identifying the service method
    //            to use.
    options = options || {};
    var _get, _query, _put, _del;

    if (!service) {
        throw Error("No service supplied to dojo.data.Service")
    }
    if (options && options.map) {
        _get = options.map.get;
        _query = options.map.query;
        _put = options.map.put;
        _del = options.map.del;
    }

    return {
        query: function(query, directives) {
            return service[_query || "query"].call(service, arguments);
        },
        get: function(id, directives) {
            return service[_get || "get"].call(service, arguments);
        },
        put: function(id, directives) {
            return service[_put || "put"].call(service, arguments);
        },
        "delete": function(id, directives) {
            return service[_del || "delete"].call(service, arguments);
        }
    }
};

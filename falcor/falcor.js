var Observable = require("../simplerx/observable");

module.exports = (function() {
    function falcor(options) {
        options = options || {};
        this._connection = options.connection
    }

    falcor.prototype = {
        _connection: null,
        //// Harvest the data out of the path
        // data: The object we are checking against
        // path: The path to check
        _processPath: function(data, path) {
                // If we need to set values on the cache, we want to remember the paths
            let pathValues = {},
                // The result of the cache access
                result,
                // The possible value returned from the cache
                value,
                // The possible new path we need to traverse
                newPath,
                // The possible path value returned to apply to cache
                pathValue,
                // The property the path value should be mapped to
                property;

            // Try to get the value from the cache
            while (path) {
                // Get the result and grab the values we are looking for
                result = this.getFromCache(data, path.slice());
                value = result && result.value;
                newPath = result && result.newPath;
                pathValue = result && result.pathValue;
                property = result && result.property;

                // If there isn't a new path or a value, it's a cache miss
                if (newPath === undefined && value === undefined) break;

                // If there was a path value, add it to our collection
                if (pathValue) pathValues[property] = pathValue;

                // Set the next path and carry on
                path = newPath;
            }

            return { value, path, pathValues };
        },
        // Get a value from the graph
        getFromCache: (data, path) => {
                // Get the first value from the graph
            let dataValue = data[path.shift()],
                server = server || false,
                newPath,
                property;

            // Traverse through the path
            while (path.length) {
                // If we hit a value that isn't defined, break
                if (dataValue === undefined) return;

                // Grab the next property to evaluate
                property = path.shift();

                // Get the next value in the path
                dataValue = dataValue[property];

                // Check if the value is an a path to something else in the graph
                if (Array.isArray(dataValue)) {
                    // Construct the ammended path to follow
                    newPath = dataValue.concat(path);

                    // Since we redirected the path, we want to start back at the beginning
                    return { pathValue: dataValue, property: property, newPath: newPath };
                }
            }

            // We hit the end so return our value
            return { value: dataValue };
        },
        //// Try and get the data from the server
        // data: The local cache
        // path: The path to evaluate on the server
        getFromServer: function(data, path) {
            var self = this;
            return new Observable((observer) => {
                function handleResult(result) {
                    let { value, pathValues } = result;
                    self.set(data, path, pathValues, value);
                    observer.onNext(value);
                }

                self._connection(path, handleResult);
            })
        },
        get: function(data, path) {
            let result = this._processPath(data, path),
                value = result.value,
                newPath = result.path;

            // The cache data is present, so notify the observer on subscription
            if (value !== undefined || !this._connection) return new Observable((observer) =>  {
                setTimeout(() => observer.onNext(value));
            })

            // The cache data was missing or invalid, so get it fromm the server
            return this.getFromServer(data, newPath);
        },
        set: function(data, path, pathValues, value) {
                // Set the first data value
            let dataValue = data,
                // Possible path to add to the graph
                pathValue,
                // The property values on the model
                property,
                propertyValue;

            // Loop through the path until the leaf
            while (path.length - 1) {
                // Grab the next part of the path
                property = path.shift();
                pathValue = pathValues[property];

                // Check if we need to add a path to the graph
                if (pathValue) {
                    // Set the property as the path value
                    dataValue[property] = pathValue;

                    // Reset the path
                    path = pathValue.concat(path);
                    dataValue = data;
                } else {
                    // Get the cached xsproperty value
                    propertyValue = dataValue[property];

                    // If it doesn't exist, create it
                    if (!propertyValue) dataValue[property] = {};

                    // Go deeper
                    dataValue = dataValue[property];
                }
            }

            // Set the last property as the value
            dataValue[path.shift()] = value;
        }
    }

    return falcor;
})();
var PathUtility = (function () {
    return {
        extractFilename: function(path) {
            var lastSlash = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
            return path.substring(lastSlash + 1);
        },
    };
})();

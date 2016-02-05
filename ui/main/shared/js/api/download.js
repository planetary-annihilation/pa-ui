(function (api) {

    api.download = {
        // Initiates a download of the given url, with results saved in /download/<file>
        // Completed downloads are automatically MD5 hashed.  (See status())
        start: function(url, file) { engine.call("download.start", String(url), String(file)); },
        // Cancels any active downloads for file, if downloading is currently in progress.
        cancel: function(file) { return engine.call("download.cancel", String(file)); },
        // Returns the result of status() for all known downloads
        list: function() {
            return engine.call("download.list").then(function(result) {
                return JSON.parse(result);
            });
        },
        // Permanently removes /download/<file> and /download/<file>.dlmeta
        delete: function(file) { return engine.call("download.delete", String(file)); },
        // Moves /download/<from> and /download/<from>.dlmeta to /download/<to> and /download/<to>.dlmeta
        move: function(from, to) { return engine.call("download.move", String(from), String(to)); },
        // Returns the current status for a given file.  (Stored persistently in /download/<file>.dlmeta)
        // Note: Updates download progress when called.  Querying via
        //       $.get('coui://download/file.dlmeta').then(...) will not update download progress.
        status: function(file) {
            return engine.call("download.status", file).then(function(result) {
                return JSON.parse(result);
            });
        },
        // Override to receive download notifications
        onDownload: function(status) {
        }
    };

    $(document).ready(function() {
        if (!globalHandlers.hasOwnProperty('download'))
            globalHandlers['download'] = function(stat) { api.download.onDownload(stat); }
    });

})(window.api);



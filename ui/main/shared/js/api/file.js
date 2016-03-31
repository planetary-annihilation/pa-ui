(function (api) {
    var replay_suffix = '.par.gz';
    var meta_suffix = '.par.info.json';

    api.file = {
        mountMemoryFiles: function (files) { return engine.call("file.mountMemoryFiles", JSON.stringify(files)); },
        unmountAllMemoryFiles: function () { return engine.call("file.unmountAllMemoryFiles"); },

        // Promise returns { name: fileHint, contents: '<Contents of the file>' }
        loadDialog: function (fileNameHint) { return engine.asyncCall('file.loadDialog', String(fileNameHint)).then(function (raw) { return JSON.parse(raw); }); },
        // Like loadDialog, but does not return file contents.
        saveDialog: function (fileNameHint, fileContents) { return engine.asyncCall('file.saveDialog', String(fileNameHint), String(fileContents)).then(function (raw) { return JSON.parse(raw); }); },
        listReplays: function () {
            return engine.asyncCall('file.listReplayDir').then(function (data) {
                data = JSON.parse(data);
                var replays = {};
                var meta = {};
                _.forEach(data.files, function (element) {
                    var filename = PathUtility.extractFilename(element);
                    if (filename.endsWith(replay_suffix))
                        replays[filename.substring(0, filename.length - replay_suffix.length)] = element;
                    else if (filename.endsWith(meta_suffix))
                        meta[filename.substring(0, filename.length - meta_suffix.length)] = element;
                });

                var intersection = _.intersection(_.keys(replays), _.keys(meta));
                var valid_replays = {};
                _.forEach(intersection, function(key) {
                    valid_replays[key] = {
                        replay: replays[key],
                        meta: meta[key]
                    };
                });

                return valid_replays;
            });
        },

        loadReplayMetadata: function (replay) {
            var filename = String(replay) + meta_suffix;
            return engine.asyncCall('file.loadFromReplayDir', filename).then(function (raw) {
                var result = null
                try {
                    result = decode(raw);
                    if (result && result.contents)
                        result = decode(result.contents);
                } catch (error) {
                    console.log('failed to parse results from loadFromReplayDir with file: ' + filename);
                    return null;
                }

                return result;
            });
        },
        deleteReplay: function (replay) {
            console.log('deleteReplay', replay);
            engine.call('file.deleteFromReplayDir', String(replay) + replay_suffix);
            engine.call('file.deleteFromReplayDir', String(replay) + meta_suffix);
        },
        list: function (root, recurse) {
            return engine.call('file.list', String(root), !!recurse).then(function(files) {
                if (files && files !== '') {
                    return JSON.parse(files);
                } else {
                    var promise = engine.createDeferred();
                    promise.reject(root + ' is not listable');
                    return promise;
                }
            });
        },

        // Zip archive support.
        // Supports RFC 1950: http://www.ietf.org/rfc/rfc1950.txt and RFC 1951: http://www.ietf.org/rfc/rfc1951.txt
        // Encryption, zip64, and spanning are not supported.  Files must be either stored or deflated.
        zip: {
            // Lists all files & directories in the archive.
            catalog: function (zipFile) {
                return engine.call('zip.catalog', String(zipFile)).then(function(catalog) {
                    return JSON.parse(catalog);
                });
            },
            // Mounts the catalog of files in the given zip file at the provided root path.
            // Note: Archive contents are mounted as memory files, and will be unloaded if
            //       api.file.unmountAllMemoryFiles() is called.
            // Also note: Mounted zip files will be inherited by local servers.
            mount: function (zipFile, root) { return engine.call('zip.mount', String(zipFile), String(root)); }
        }
    };
})(window.api);



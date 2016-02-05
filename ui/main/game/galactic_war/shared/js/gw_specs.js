define([], function() {
    
    function tagSpec(specId, tag, spec) {
        var moreWork = [];
        if (typeof spec !== 'object')
            return moreWork;
        var applyTag = function(obj, key) { 
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    moreWork.push(obj[key]);
                    obj[key] = obj[key] + tag;
                }
                else if (_.isArray(obj[key])) {
                    obj[key] = _.map(obj[key], function(value) { 
                        moreWork.push(value);
                        return value + tag; 
                    });
                }
            }
        };
        // Units
        applyTag(spec, 'base_spec');
        if (spec.tools) {
            _.forEach(spec.tools, function(tool) {
                applyTag(tool, 'spec_id');
            });
        }
        applyTag(spec, 'replaceable_units');
        applyTag(spec, 'buildable_projectiles');
        if (spec.factory && _.isString(spec.factory.initial_build_spec)) {
            applyTag(spec.factory, 'initial_build_spec');
        }
        // Tools
        if (spec.ammo_id) {
            if (_.isString(spec.ammo_id)) {
                applyTag(spec, 'ammo_id');
            }
            else {
                _.forEach(spec.ammo_id, function (ammo) {
                    applyTag(ammo, 'id');
                });
            }
        }
        return moreWork;
    }
    
    function flattenBaseSpecs(spec, specs, tag) {
        if (!spec.hasOwnProperty('base_spec'))
            return spec;
        
        var base = specs[spec.base_spec];
        if (!base) {
            base = specs[spec.base_spec + tag];
            if (!base)
                return spec;
        }
        
        spec = _.cloneDeep(spec);
        delete spec.base_spec;
        
        base = flattenBaseSpecs(base, specs, tag);
        
        return _.merge({}, base, spec);
    }
    
    return {
        // Splits a list of specs into a new internally referenced set of specs
        // with the tag appended to the references.
        // Note: Starting the tag with '.' is preferred for readability.
        // Returns a map of the form:
        //      {'spec_id.tag': { base_spec: 'base_spec_id.tag', ... }}
        genUnitSpecs: function(units, tag) {
            if (!tag)
                return;
            var result = $.Deferred();
            var results = {};
            var work = units.slice(0);
            var step = function() {
                var item;
                var pending = 0;
                var fetch = function(item) {
                    $.ajax({
                        url: 'coui:/' + item,
                        success: function(data) {
                            try
                            {
                                data = JSON.parse(data);
                            }
                            catch (e)
                            {
                            }
                            var newWork = tagSpec(item, tag, data);
                            work = work.concat(newWork);
                            results[item + tag] = data;
                        },
                        error: function(request, status, error) { 
                            console.log('error loading spec:', item, request, status, error);
                        },
                        complete: function() {
                            --pending;
                            if (!pending)
                                _.delay(step);
                        }
                    });
                };
                while (work.length)
                {
                    item = work.pop();
                    if (results.hasOwnProperty(item + tag))
                        continue;
                    ++pending;
                    fetch(item);
                }
                if (!pending)
                    _.delay(finish);
            };
            var finish = _.once(function() {
                results['/pa/units/unit_list.json' + tag] = { 
                    units: _.map(units, function(unit) { return unit + tag; })
                };
                result.resolve(results);
            });
            step();
            return result;
        },
        genAIUnitMap: function(unitMap, tag) {
            var result = _.cloneDeep(unitMap);
            var work = [result];
            while (work.length) {
                var obj = work.pop();
                if (obj.hasOwnProperty('spec_id'))
                    obj.spec_id = obj.spec_id + tag;
                _.mapValues(obj, function(value) {
                    if (typeof value === 'object')
                        work.push(value);
                });
            }
            return result;
        },
        /*
         * Each mod is in the following format:
         * {
         *      file: '/pa/units/some_unit/some_unit.json',
         *      path: 'attribute.child.dependent.value',
         *      op: 'multiply',
         *      value: 2.0
         * }
         * 
         * file - The un-tagged spec ID to modify.
         * path - A "." separated list of attributes.  Objects will traverse
         *      down the hierarchy.  Strings will be considered dependent 
         *      references to other specs.
         * op - The operation to apply to the attribute.  Currently supports
         *      multiply, add, replace, merge, push, clone, tag, and eval.  
         *          clone - Write to the value file with whatever is in the 
         *                  attribute.  
         *          eval - Execute value as raw javascript in a context with 
         *                  attribute defined.  Do whatever you want. (Be 
         *                  sure to return the attribute if using a path.)
         *          tag - Append specTag to the attribute.
         * value - The value to use with the operation.
         * 
         * Important Note:
         * Base specs will be flattened on any specs that get mod'ed.
         */
        modSpecs: function(specs, mods, specTag) {
            var load = function(specId) {
                taggedId = specId;
                if (!specs.hasOwnProperty(taggedId)) {
                    var taggedId = specId + specTag;
                    if (!specs.hasOwnProperty(taggedId))
                        return;
                }
                var result = specs[taggedId];
                if (result)
                    specs[taggedId] = result = flattenBaseSpecs(result, specs, specTag);
                return result;
            };
            var ops = {
                multiply: function(attribute, value) { return (attribute !== undefined) ? (attribute * value) : value; },
                add: function(attribute, value) { return (attribute !== undefined) ? (attribute + value) : value; },
                replace: function(attribute, value) { return value; },
                merge: function (attribute, value) { return _.extend({}, attribute, value); },
                push: function(attribute, value) { 
                    if (!_.isArray(attribute))
                        attribute = (attribute === undefined) ? [] : [attribute];
                    if (_.isArray(value))
                        attribute = attribute.concat(value);
                    else
                        attribute.push(value);
                    return attribute;
                },
                eval: function(attribute, value) { return new Function('attribute', value)(attribute); },
                clone: function(attribute, value) { 
                    var loaded = load(attribute);
                    if (loaded)
                        loaded = _.cloneDeep(loaded);
                    specs[value + specTag] = loaded || attribute; 
                },
                tag: function(attribute, value) { return attribute + specTag; }
            };
            var applyMod = function(mod) {
                var spec = load(mod.file);
                if (!spec)
                    return api.debug.log('Warning: File not found in mod', mod);
                if (!ops.hasOwnProperty(mod.op))
                    return console.error('Invalid operation in mod', mod);
                
                var originalPath = (mod.path || '').split('.');
                var path = originalPath.reverse();

                var reportError = function(error, path) {
                    console.error(error, spec[level], 'spec', spec, 'mod', mod, 'path', originalPath.slice(0, -path.length).join('.'));
                    return undefined;
                };
                
                var cookStep = function(step) {
                    if (_.isArray(spec)) {
                        if (step === '+') {
                            step = spec.length;
                            spec.push({});
                        }
                        else
                            step = Number(step);
                    }
                    else if (path.length && !spec.hasOwnProperty(step)) {
                        spec[step] = {};
                    }
                    return step;
                };
                                
                while (path.length > 1) {
                    var level = path.pop();
                    cookStep(level);
                    
                    if (typeof spec[level] === 'string') {
                        var newSpec = load(spec[level]);
                        if (!newSpec) {
                            return reportError('Undefined mod spec encountered,');
                        }
                        spec = newSpec;
                    }
                    else if (typeof spec[level] === 'object')
                        spec = spec[level];
                    else
                        return reportError('Invalid attribute encountered,');
                }

                if (path.length && path[0]) {
                    var leaf = cookStep(path[0]);
                    spec[leaf] = ops[mod.op](spec[leaf], mod.value);
                }
                else
                    ops[mod.op](spec, mod.value);
            };
            _.forEach(mods, applyMod);
        }
    }
});
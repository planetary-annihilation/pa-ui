window.api.camera = (function(api) {
    var hasOwnHandlers = false; // true if the panel we're instantiated for has allowed us to inject handlers -- otherwise, we'll defer everything to a parent

    var camera_pan_speed_factor = 1.0;
    var camera_zoom_speed_factor = 1.0;

    var activeAnchors = ko.observable({});
    var allAnchorsCredit = ko.observable(false).extend({ session: 'all_anchors_credit' });
    var allAnchorsRule = ko.computed(function () {
        if (_.keys(activeAnchors()).length < 10 || allAnchorsCredit())
            return;

        allAnchorsCredit(true);
        api.tally.incStatInt('games_played_using_all_camera_groups');
    });

    var
        recallStacks = { }, // one per holodeck, made on-demand
        foci = { }, // one per holodeck, made on-demand
        fakeSystemEditorHolodeck = { id: 'editor' },

        activeRecallStack = function () { return getRecallStack((api.Holodeck.focused || fakeSystemEditorHolodeck).id); },
        activeFocus = function () { return getFocus((api.Holodeck.focused || fakeSystemEditorHolodeck).id); },
        context_distance = function(ctxA, ctxB) {
            return (ctxA.planet === ctxB.planet) ? distance(ctxA.location, ctxB.location) : Infinity;
        },
        distance = function(locA, locB) {
            var radius2 = locA.x * locA.x + locA.y * locA.y + locA.z * locA.z,
                dot = locA.x * locB.x + locA.y * locB.y + locA.z * locB.z,
                angle = Math.acos(dot / radius2),
                dist = angle * Math.sqrt(radius2);

            return dist;
        };


    function getRecallStack(holodeckId) {
        var recallStack = recallStacks[holodeckId];

        if (!recallStack) {
            recallStack = makeRecallStack(getFocus(holodeckId), holodeckId);
            recallStacks[holodeckId] = recallStack;
        }

        return recallStack;
    }

    function getFocus(holodeckId) {
        var focus = foci[holodeckId];

        if (!focus) {
            focus = {
                // it could be nice to add zoom distance and the camera up vector here, which would give us full info
                planet: ko.observable(-1), // not in love with a "planet" being an integer
                planetId: ko.observable(-1),
                tryingToFocusPlanet: ko.observable(null), // when we are told that we've focused on a new planet, we make sure it's this one (if set) so our anchors stay in sync
                location: ko.observable({x: 0, y: 0, z: 0}),
                isMoving: ko.observable(false),
                isGrabbed: ko.observable(false),
                zoomLevel: ko.observable('celestial'),
                copy: function(other) {
                    this.planet(other.planet());
                    this.planetId(other.planetId());
                    this.location(other.location());
                    this.isMoving(other.isMoving());
                    this.isGrabbed(other.isGrabbed());
                    this.zoomLevel(other.zoomLevel());
                },
                repairPlanet: function() {
                    var focusedDeck = api.Holodeck.focused;
                    api.holodecks[holodeckId].focus()
                    api.camera.focusPlanet(focus.tryingToFocusPlanet(), true);
                    focusedDeck.focus();

                    focus.tryingToFocusPlanet(null);
                }
            };

            focus.tryingToFocusPlanet.subscribe(function (new_planet) {
                if (new_planet !== null) {
                    _.delay(function ( ) {
                        // if we're still waiting to look at the right planet, try again -- means something went wrong
                        if (focus.tryingToFocusPlanet() === new_planet && focus.planet() !== new_planet)
                            focus.repairPlanet();
                    }, 50);
                }
            });

            foci[holodeckId] = focus;
        }

        return focus;
    }

    function makeRecallStack(focus, holodeckId) {
        var history = [ ],
            historyIndex = 0, // points at the top member of the history that we're currently "at"
            planetRecall = { }, // planet id to a recall point for the last point seen on that planet, so we can jump back less confusingly

            dirty = false, // when we don't have a history entry for the current location
            pool = [ ], nextIdx = 1000 * (1 + holodeckId), // we try to reuse anchor points that we've removed from the history
            MAX_LENGTH = 640, // should be enough for anybody
            lastReport = { };

        return {
            handleMotion: function (report) {
                var
                    wasMoving = (lastReport.isPanning || lastReport.isSpinning || lastReport.isZooming),
                    isMoving = (report.isPanning || report.isSpinning || report.isZooming);

                report.isMoving = isMoving;

                if (isMoving) {
                    dirty = true;
                }

                if (dirty && !isMoving && !report.isGrabbed) {
                    markPlanet();
                    mark();
                }

                lastReport = report;
            },
            handleFocusChange: function ( ) {
                if (!lastReport.isMoving && !lastReport.isGrabbed) {
                    markPlanet();
                }
            },
            jumpBackToPlanet: function (planetIdx) {
                var recallContext = planetRecall[planetIdx];
                if (recallContext) {
                    // todo: can we mix this with the usual nifty planet jump effect? do we WANT to?
                    jumpToContext(recallContext);

                    return true;
                } else {
                    return false;
                }
            },
            getPlanetAnchor: function (planetIdx) {
                var recallContext = planetRecall[planetIdx];
                return (recallContext) ? recallContext.idx : null;
            },
            hint: function() {
                // for now, if we're jumping somewhere, we're going to mark the current position IF it hasn't been marked yet
                if (dirty) {
                    mark();
                }
            },
            mark: mark, // should use hint instead?
            markPlanet: markPlanet,
            back: function () {
                if (historyIndex > 1) {
                    var context = history[historyIndex - 2];
                    jumpToContext(context);

                    historyIndex--;
                }
            },
            forward: function () {
                if (historyIndex < history.length) {
                    var context = history[historyIndex];
                    engine.call('camera.recallAnchor', context.idx);

                    historyIndex++;
                }
            }
        }
    
        function capture() {
            var idx = getIdx();
            
            engine.call('camera.captureAnchor', idx);

            return {
                idx: idx,
                planet: focus.planet(),
                location: focus.location(),
                timestamp: new Date().getTime()
            };
        }

        function jumpToContext(context) {
            // we don't need to restore any info from the context (location or planet) because the client will send us that in a focus_planet_changed message
            engine.call('camera.recallAnchor', context.idx);
        }

        function getIdx() {
            var top;
            while (pool.length) {
                top = pool[pool.length - 1];
                if (top.length) {
                    return top.pop().idx;
                } else {
                    pool.pop();
                }
            }

            return nextIdx++;
        }

        function wipeFuture() {
            // chunk off the end of the history, push the sloughed off bit onto the pool
            if (historyIndex < history.length) {
                pool.push(history.splice(historyIndex));
            }
        }

        function cleanHistory() {
            // todo: use distance + timestamp to decide which history items to keep

            // ... but if that doesn't work (or isn't implemented yet) just chunk off the oldest items to stay under par
            if (history.length > MAX_LENGTH) {
                var chunk = history.length - ~~(.75 * MAX_LENGTH); // cut off 25% of the history so we don't do this constantly
                pool.push(history.splice(0, chunk));
                historyIndex -= chunk;
                if (historyIndex < 0) {
                    // should never happen -- we can't simultaneously push a history item triggering a clean, and also be viewing our history
                    historyIndex = 0;
                }
            }
        }

        function mark() {
            if (!focus.location()) {
                // make sure we've gotten valid info from the current camera mode
                return;
            }

            var context = capture();

            wipeFuture();
            history[historyIndex++] = context;

            // if (historyIndex > 2) {
            //     console.log(
            //         'the cursor jumped',
            //         context_distance(
            //             history[historyIndex - 1],
            //             history[historyIndex - 2])
            //     );
            // }

            cleanHistory(); // don't let it get too long

            dirty = false;
        }

        function markPlanet() {
            var planetIdx = focus.planet();

            // don't store anything if we're at the celestial zoom -- it's too far away
            if (focus.zoomLevel() === 'celestial')
                return;

            if (planetRecall[planetIdx]) {
                pool.push([planetRecall[planetIdx]]);
            }

            planetRecall[planetIdx] = capture();
        }
    };

    return {
        alignToPole: function() {
            activeRecallStack().hint('spin');
            engine.call('camera.alignToPole');
        },
        
        changeKeyPanSpeed: function (factor) {
            camera_pan_speed_factor += factor;
            camera_pan_speed_factor = (camera_pan_speed_factor < 0.01) ? 0.01 : camera_pan_speed_factor;
            engine.call('set_camera_key_pan_speed', camera_pan_speed_factor);
        },

        getRecallStack: getRecallStack,
        getFocus: getFocus,

        injectHandlers: function (handlers) {
            // it would be trivial to rely on the camera_api handler and wrap every api method by default, switching to the 'real' ones when we
            // inject handlers, instead of setting the hasOwnHandlers flag and cherry-picking, but haven't done it yet

            hasOwnHandlers = true;
            _.forEach(api.camera.handlers, function wrap(fn, key) {
                var old = handlers[key];

                if (old) {
                    handlers[key] = function(payload) {
                        fn(payload);
                        old(payload);
                    };
                } else {
                    handlers[key] = fn;
                }
            });
        },

        swapCamera: function (firstHolodeckId, secondHolodeckId) {
            // for now, we don't swap histories; we just swap the values in the current focus and tell the histories to mark
            var stackA = getRecallStack(firstHolodeckId), stackB = getRecallStack(secondHolodeckId),
                focusA = getFocus(firstHolodeckId), focusB = getFocus(secondHolodeckId), focusC = getFocus('swap');

            stackA.hint('jump');
            stackB.hint('jump');

            // swap the foci contents using the temporary focusC
            focusC.copy(focusA);
            focusA.copy(focusB);
            focusB.copy(focusC);
        },

        handlers: {
            camera_type: function(payload) {
                var focus = getFocus(payload.holodeck_id);
                if (payload.camera_type === 'space') {
                    focus.planet(-1);
                    focus.planetId(-1);
                    focus.zoomLevel('celestial');
                }
            },
            camera_movement: function(report) {
                // motion reports from the camera run from camera.cpp -> holodeck -> live_game -> here
                var focus = getFocus(report.holodeck_id);

                if (report.location) {
                    // attach lat/long info
                    report.location.lat = Math.atan2(report.location.x, report.location.y) * 180 / Math.PI;
                    report.location.long = Math.atan2(report.location.z, Math.sqrt(report.location.x * report.location.x + report.location.y * report.location.y)) * 180 / Math.PI;
                }

                focus.location(report.location);
                focus.isMoving(report.isPanning || report.isSpinning || report.isZooming);
                focus.isGrabbed(report.isGrabbed);

                getRecallStack(report.holodeck_id).handleMotion(report);
            },
            camera_tracking: function(payload) {
                var focus = getFocus(report.holodeck_id);
                focus.location(report.location);
            },
            focus_planet_changed: function(payload) {
                var focus = getFocus(payload.holodeck_id);

                focus.location(payload.location);
                focus.planet(payload.focus_planet);
                focus.planetId(payload.focus_planet_id);

                getRecallStack(payload.holodeck_id).handleFocusChange();

                if (focus.tryingToFocusPlanet() !== null && payload.focus_planet !== focus.tryingToFocusPlanet()) {
                    // the player is trying to look at a planet, and we looked, and this is the wrong planet!
                    focus.repairPlanet();
                }

                focus.tryingToFocusPlanet(null);
            },
            zoom_level: function(payload) {
                var focus = getFocus(payload.holodeck_id);
                focus.zoomLevel(payload.zoom_level);
            },
            camera_api: function(payload) {
                // this is the magical handler that lets child panels defer to live_game when calling lookAt,
                // without making them jump through hoops to do so
                var api_call = api.camera[payload[0]];
                api_call.apply(api.camera, payload.slice(1));
            }
        },

        focusPlanet: function (index, ignoreAnchors) {
            var recallStack = activeRecallStack();
            recallStack.hint('jump');

            // jump back to the last point we looked at on this planet ...
            if (ignoreAnchors || !recallStack.jumpBackToPlanet(index)) {
                // ... unless this is the first time we've been to this planet (or it's the sun, which we never
                // remember in the recallStack) so let's jump to it directly
                engine.call('camera.focusPlanet', typeof (index) === 'number' ? index : 0);
                engine.call('camera.setZoom', 'orbital', true);
            } else {
                // we've just set our focus by jumping to an anchor, which is dangerous in very very rare conditions (once
                // every ten hours of play or so) but just to make sure, we'll remember where we were trying to look!
                var focus = activeFocus();
                focus.tryingToFocusPlanet(index);
            }
        },
        maybeSetFocusPlanet: function () {
            // this is only called when we're in celestial mode without a planetary target
            engine.call('camera.maybeSetFocusPlanet');
        },

        getPlanetAnchor: function (holodeck, planetIdx) {
            return getRecallStack(holodeck.id).getPlanetAnchor(planetIdx);
        },

        freeze: function (enable) {
            engine.call('camera.freeze', enable)
        },
        lookAt: function (target, smooth) {
            if (hasOwnHandlers) {
                activeRecallStack().hint('jump');

                if (typeof (target) === 'object')
                    target = JSON.stringify(target);
                if (typeof (target) === 'string') 
                    engine.call('camera.lookAt', target, !!smooth);
            } else {
                api.Panel.message('game', 'camera_api', ['lookAt', target, !!smooth]);
            }
        },
        isLookingAt: function (target, radius) {
            var focus = activeFocus();

            return target.panet === focus.planet() && distance(target.location, focus.location()) < radius;
        },
        getWatchingComputed: function (target, radius) {
            var focus = activeFocus(),
                planet = target.planet,
                location = _.clone(target.location);

            return ko.pureComputed(function() {
                return planet === focus.planet() && distance(location, focus.location()) < radius;
            });
        },
        back: function() {
            activeRecallStack().back();
        },
        forward: function() {
            activeRecallStack().forward();
        },
        captureAnchor: function (anchor) {
            var groups = activeAnchors();
            groups[anchor] = true;
            activeAnchors(groups);
            engine.call('camera.captureAnchor', typeof (anchor) === 'number' ? anchor : 0);
        },
        recallAnchor: function (anchor) {
            activeRecallStack().hint('jump');
            engine.call('camera.recallAnchor', typeof (anchor) === 'number' ? anchor : 0);
        },
        activeAnchorCount : function () { return _.keys(active_anchors).length; },

        setAllowZoom: function (enable) { engine.call('camera.setAllowZoom', enable); },
        setZoom: function (zoom, smooth) { return engine.call('camera.setZoom', typeof (zoom) === 'string' ? zoom : '', !!smooth); },
        zoom: function (zoomDelta) { engine.call("camera.zoom", zoomDelta); },

        setAllowRoll: function (enable) { engine.call('camera.setAllowRoll', enable); },
        roll: function (rollDelta) { engine.call("camera.roll", rollDelta); },

        setAllowPan: function (enable) { engine.call('camera.setAllowPan', enable); },
        pan: function (deltaX, deltaY) {
            engine.call("camera.pan", deltaX, deltaY);
        },

        track: function (enable, controlGroupId) {
            if (hasOwnHandlers) {
                if (enable) {
                    activeRecallStack().mark();
                } else {
                    activeRecallStack().hint('tracking');
                }
                engine.call('camera.track',
                    typeof (enable) === 'boolean' ? enable : false,
                    typeof(controlGroupId) === 'number' ? controlGroupId : -1
                );
            } else {
                api.Panel.message('game', 'camera_api', ['track', enable, controlGroupId]);
            }
        },
        setMode: function (mode) { return engine.call('camera.setMode', typeof (mode) === 'string' ? mode : ''); }
    };
})(window.api);

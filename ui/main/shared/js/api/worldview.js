api.getWorldView = function() {

    var worldViews = [];

    function WorldView(index) {
        this.id = index;
    }
    WorldView.prototype.whenPlanetsReady = function() { return engine.asyncCall('worldview.whenPlanetsReady', this.id); };
    WorldView.prototype.arePlanetsReady = function() { return engine.call('worldview.arePlanetsReady', this.id); };

    WorldView.prototype.selectByTypes = function(option, types) {
        return engine.call('worldview.selectByTypes', this.id, option, types);
    };

    WorldView.prototype.getArmyUnits = function(armyIndex, planetIndex) {
        if (planetIndex === undefined)
            planetIndex = -1;
        return engine.call('worldview.getArmyUnits', this.id, Number(armyIndex), Number(planetIndex)).then(function(rawUnits) {
            return JSON.parse(rawUnits);
        });
    };
    WorldView.prototype.getUnitState = function(units) {
        var one = !_.isArray(units);
        if (one)
            units = [units];
        return engine.call('worldview.getUnitState', this.id, units).then(function(rawState) {
            var result = JSON.parse(rawState);
            if (one && _.isArray(result))
                result = result[0];
            return result;
        });
    };

    WorldView.prototype.puppet = function(config, describe) {
        var one = !_.isArray(config);
        if (one)
            config = [config];
        //  config = [{
        //      id: 5,  <- Makes a new puppet & returns the id in result if undefined, updates the specified puppet otherwise.  (Integers only)
        //      model: { ... },     <- As in unit specs
        //      animate: { ... },   <- As in anim tree playback node
        //      location: { ... },  <- As in call to movePuppet, with additional "snap" parameter.  (location: { snap: 5 } sets a 5m snap-to-ground offset.)
        //                             Also, orient_rel can be set to false to disable relative planet orientation.
        //      material: {
        //          shader: "pa_unit_ghost",    <- Defines a shader override
        //          constants: {
        //              GhostColor: [0,0,1,0],  <- Defines shader constants
        //              BuildInfo: [0,10,0,0]
        //          },
        //          textures: {
        //              Diffuse: "/pa/effects/diffuse_texture.papa"     <- Defines shader textures
        //          }
        //      },
        //      fx_offsets: [],     <- As in unit specs
        //      decal: "/pa/effects/specs/decal.json"  <- Adds a decal to the planet surface  (Warning: May not work well with moving puppets.)
        //  }]
        return engine.call('worldview.puppet', this.id, JSON.stringify(config), !!describe).then(function(raw) {
            var result = JSON.parse(raw);
            if (one && _.isArray(result))
                result = result[0];
            return result;
        });
    };

    WorldView.prototype.unPuppet = function(puppet, describe) {
        var one = !_.isArray(puppet);
        if (one)
            puppet = [Number(puppet)];
        return engine.call('worldview.unPuppet', this.id, puppet, !!describe).then(function(raw) {
            var result = JSON.parse(raw);
            if (one && _.isArray(result))
                result = result[0];
            return result;
        });
    };

    WorldView.prototype.movePuppet = function(puppet, location, duration, describe) {
        //  location = {
        //      planet: 0,
        //      pos: [0,100,0],
        //      orient: [0,90,0], <- yaw/pitch/roll (array of 3) or quaternion (array of 4)
        //      scale: 2  <- Supports non-uniform scale.  May not render properly, however.
        //  }
        //      Note: All location parameters are optional
        var one = !_.isArray(puppet);
        if (one) {
            puppet = [Number(puppet)];
            location = [location];
            duration = [Number(duration)];
            describe = [!!describe];
        }
        if (!duration)
            duration = [];
        if (!describe)
            describe = [];
        var params = _.zip(puppet, location, duration, describe).map(function(p) {
            return {
                puppet: Number(p[0]),
                location: p[1],
                duration: Number(p[2]),
                describe: !!p[3]
            };
        });
        return engine.call('worldview.movePuppet', this.id, JSON.stringify(params)).then(function(raw) {
            var result = JSON.parse(raw);
            if (one && _.isArray(result))
                result = result[0];
            return result;
        });
    };

    WorldView.prototype.getPuppet = function(puppet) {
        var one = !_.isArray(puppet);
        if (one)
            puppet = [Number(puppet)];
        return engine.call('worldview.getPuppet', this.id, puppet).then(function(raw) {
            var result = JSON.parse(raw);
            if (one && _.isArray(result))
                result = result[0];
            return result;
        });
    };

    WorldView.prototype.getAllPuppets = function(describe) {
        return engine.call('worldview.getAllPuppets', this.id, Boolean(describe)).then(function(raw) {
            return JSON.parse(raw);
        });
    };

    WorldView.prototype.clearPuppets = function() {
        engine.call('worldview.clearPuppets', this.id);
    };

    // Disables camera culling of entities on the server.
    // Note: This will cause the client to consume more bandwidth, and may cause a poor user experience in large games.
    WorldView.prototype.setServerCulling = function(enable) {
        engine.call('worldview.setServerCulling', this.id, Boolean(enable));
    };

    WorldView.prototype.sendOrder = function(order) {
        /*
            order = {
                units: [unit, unit, unit],  <- Target for the order.  Automatically coerced to an array if a single unit is provided.
                command: 'move'             <- See command list below
                location: {
                    entity: 1234,           <- Overrides position
                    planet: 1,
                    pos: [0,0,523],         <- if "multi_pos" instead of "pos", defines a curve location, which includes an array of positions
                    radius: 20              <- Optional - specifies area command radius
                },                          <- Note: Use array for multi-pos commands like patrol
                spec: '/pa/units/awesome_bot.json',      <- For build commands
                queue: true,                <- When specified, adds to queue
                count: 5,                   <- Queue count for factory build commands
                group: true,                <- When included, indicates a group command
                delay: 0.5,                 <- Delay for self_destruct command
                stance: 'fire_at_will'      <- Stance for movement_stance, weapon_stance, energy_stance, and build_stance commands
            }

            Command list:
                assist
                attack
                attack_ground
                build
                build_stance    (stance = normal/continuous)
                energy_stance   (stance = consume/conserve)
                factory_build
                fire_secondary_weapon
                link_teleporters
                load
                move
                movement_stance (stance = hold position/maneuver/roam)
                patrol
                ping
                reclaim
                repair
                special_move
                unload
                use
                self_destruct
                stop
                weapon_stance   (stance = fire at will/return fire/hold fire)
         */
        return engine.call('worldview.sendOrder', this.id, JSON.stringify(order)).then(function(raw) {
            return JSON.parse(raw);
        });
    };

    WorldView.prototype.fixupBuildLocations = function(spec, planet, locations) {
        /*
            locations = [
                {
                    pos: pos1,
                    orient: orient1     <- Optional
                },
                {
                    pos: pos2,
                    orient: orient2
                }
            ]
        */
        if (!_.isArray(locations))
            locations = [locations];
        return engine.call('worldview.fixupBuildLocations', this.id, String(spec), Number(planet), JSON.stringify(locations)).then(function(raw) {
            return JSON.parse(raw);
        });
    };

    return function(id) {
        id = (id >= 0) ? id : 0;
        // Note: If this ever gets particularly sparse (eg. thousands of views
        // with only a few active), this might have to use a different
        // aggregation mechanism.
        if ((id < worldViews.length) && worldViews[id])
            return worldViews[id];
        if (worldViews.length <= id)
            worldViews.length = id + 1;
        worldViews[id] = new WorldView(id);
        return worldViews[id];
    }
}();

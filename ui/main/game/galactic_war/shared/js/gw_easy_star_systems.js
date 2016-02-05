// !LOCNS:galactic_war

define([], function () {
    var table = [
        {
            Players: [0, 2],
            Systems: [
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [375, 450],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [45, 70],
                            MetalClusters: [25, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 600],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [45, 70],
                            MetalClusters: [25, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        }
                    ]
                }
            ]
        },
        {
            Players: [3, 100],
            Systems: [
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 600],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [50, 75],
                            MetalClusters: [25, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'metal', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [450, 600],
                            Height: [20, 30],
                            Water: [38, 65],
                            Temp: [0, 100],
                            MetalDensity: [50, 75],
                            MetalClusters: [25, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'tropical']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [500, 650],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [50, 75],
                            MetalClusters: [25, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 2],
                            Radius: [250, 300],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [5, 15],
                            MetalClusters: [0, 24],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                }
            ]
        }
    ];

    var planet_template =
    {
        name: "Default Planet",
        mass: 5000,
        position: [0, 0],
        velocity: [0, 0],
        required_thrust_to_move: 0,
        generator: {
            seed: 15,
            radius: 100,
            heightRange: 25,
            waterHeight: 35,
            temperature: 100,
            metalDensity: 50,
            metalClusters: 50,
            biomeScale: 100,
            biome: "earth"
        }
    };

    var systemInfo = [
        
    ];



    var generate = function (config) {
        var rng = new Math.seedrandom(config.seed !== undefined ? config.seed : Math.random());
        var getRandomInt = function (min, max) {
            return Math.floor(rng() * (max - min + 1)) + min;
        };

        var rSystem = {
            name: config.name || ("PA-" + getRandomInt(100, 30000)),
            isRandomlyGenerated: true
        };

        var cSys = config.template;
        if (!cSys) {
            // Choose a system from the templates
            var starSystemTempl = _.find(table, function (sst) {
                return (sst.Players[0] <= config.players && config.players <= sst.Players[1]);
            });
            if (!starSystemTempl)
                return;

            // we have found a star system group for this number of players. Choose a random system template
            var idx = getRandomInt(0, starSystemTempl.Systems.length - 1);
            cSys = starSystemTempl.Systems[idx];
        
            var inf = _.sample(systemInfo);
            if (inf) {
                rSystem.name = inf.name;
                rSystem.description = inf.description;
            }

            rSystem.players = starSystemTempl.Players;
        }

        // build the planets based on the random numbers in the system template.
        var pgen = _.map(cSys.Planets, function (plnt, index) {
            if (!!plnt.isExplicit) {
                var deferred = $.Deferred();
                deferred.resolve(plnt);
                return plnt.promise();
            }

            var bp = _.cloneDeep(planet_template);
            bp.generator.seed = getRandomInt(0, 32767);
            bp.generator.biome = _.sample(plnt.Biomes);

            var biomeGet = $.get('coui://pa/terrain/' + bp.generator.biome + '.json')
                .then(function (data) {
                    return parse(data);
                });
            var nameGet = plnt.name;
            if (!nameGet) {
                nameGet = $.Deferred();
                api.game.getRandomPlanetName().then(function (name) { nameGet.resolve(name); });
            }
            return $.when(biomeGet, nameGet).then(function (biomeInfo, name) {
                var radius_range = biomeInfo.radius_range;
                if (!_.isArray(radius_range))
                    radius_range = [100, 1300];

                bp.generator.radius = getRandomInt(Math.max(plnt.Radius[0], radius_range[0]),
                        Math.min(plnt.Radius[1], radius_range[1]));

                bp.generator.heightRange = getRandomInt(plnt.Height[0], plnt.Height[1]);
                bp.generator.waterHeight = getRandomInt(plnt.Water[0], plnt.Water[1]);
                bp.generator.waterDepth = 100;
                bp.generator.temperature = getRandomInt(plnt.Temp[0], plnt.Temp[1]);
                bp.generator.biomeScale = getRandomInt(plnt.BiomeScale[0], plnt.BiomeScale[1]);
                bp.generator.metalDensity = getRandomInt(plnt.MetalDensity[0], plnt.MetalDensity[1]);
                bp.generator.metalClusters = getRandomInt(plnt.MetalClusters[0], plnt.MetalClusters[1]);
                bp.generator.index = index;
                bp.name = name;
                bp.position = plnt.Position;
                bp.velocity = plnt.Velocity;
                bp.required_thrust_to_move = getRandomInt(plnt.Thrust[0], plnt.Thrust[1]);
                bp.mass = plnt.mass;
                bp.starting_planet = plnt.starting_planet;

                return bp;
            });
        });

        return $.when.apply($, pgen).then(function () {
            rSystem.planets = Array.prototype.slice.call(arguments, 0);
            return rSystem;
        });
    };

    return {
        generate: generate
    };
});


// !LOCNS:galactic_war

/* these are used both in gw and in the lobby, so we have to assign them to a global instead of using require.js */
window.star_system_templates = (function () {
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
                            Radius: [375, 425],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [50, 75],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: [ 'earth', 'desert', 'tropical' ]
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [450, 550],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [50, 75],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [350, 350],
                            Height: [20, 25],
                            Water: [38, 42],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [15000, 0],
                            Velocity: [-0.00000798057, 182.574],
                            Biomes: ['desert', 'lava']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 500],
                            Height: [20, 25],
                            Water: [38, 42],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [25000, 0],
                            Velocity: [-0.000006181723165354924, 141.42135620117188],
                            Biomes: ['desert', 'lava', 'tropical', 'earth']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 5000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [0, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [28700, 0],
                            Velocity: [0, -118.5163],
                            Biomes: ['lava', 'moon', 'earth']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [300, 300],
                            Height: [0, 10],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [300, 300],
                            Height: [0, 10],
                            Water: [0, 0],
                            Temp: [0, 0],
                            MetalDensity: [10, 25],
                            MetalClusters: [0, 10],
                            BiomeScale: [100, 100],
                            Position: [15000, 0],
                            Velocity: [-0.00000798057, 182.574],
                            Biomes: ['moon', 'desert']
                        }
                    ]
                }
            ]
        },
        {
            Players: [3, 40],
            Systems: [
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 550],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
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
                            Radius: [500, 600],
                            Height: [20, 30],
                            Water: [45, 65],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
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
                            Radius: [300, 300],
                            Height: [0, 10],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [500, 600],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [500, 600],
                            Height: [20, 30],
                            Water: [45, 65],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'tropical']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [-0.00000437114, 100],
                            Biomes: ['desert', 'lava']
                        },
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [500, 500],
                            Height: [0, 5],
                            Water: [1, 5],
                            Temp: [0, 100],
                            MetalDensity: [50, 100],
                            MetalClusters: [100, 100],
                            BiomeScale: [100, 100],
                            Position: [0, -100000],
                            Velocity: [70.7107, 0.00000309086],
                            Biomes: ['metal']
                        }
                    ]
                },
                {
                    Planets: [
                       {
                           starting_planet: false,
                           mass: 50000,
                           Thrust: [0, 0],
                           Radius: [1500, 1500],
                           Height: [0, 0],
                           Water: [0, 0],
                           Temp: [0, 100],
                           MetalDensity: [0, 0],
                           MetalClusters: [0, 0],
                           BiomeScale: [0, 0],
                           Position: [30000, 0],
                           Velocity: [0, 129.0994],
                           Biomes: ['gas']
                       },
                       {
                           starting_planet: true,
                           mass: 10000,
                           Thrust: [0, 0],
                           Radius: [450, 550],
                           Height: [10, 25],
                           Water: [0, 45],
                           Temp: [0, 100],
                           MetalDensity: [40, 65],
                           MetalClusters: [0, 49],
                           BiomeScale: [0, 100],
                           Position: [35000, 0],
                           Velocity: [0, -94.5074],
                           Biomes: ['earth', 'lava', 'desert', 'tropical']
                       },
                       {
                           starting_planet: true,
                           mass: 10000,
                           Thrust: [0, 0],
                           Radius: [450, 550],
                           Height: [10, 25],
                           Water: [0, 40],
                           Temp: [0, 100],
                           MetalDensity: [40, 65],
                           MetalClusters: [0, 49],
                           BiomeScale: [0, 100],
                           Position: [25000, 0],
                           Velocity: [0, 352.7061],
                           Biomes: ['earth', 'lava', 'desert', 'tropical']
                       }
                    ]
                }
            ]
        },
        {
            Players: [0, 0],
            Systems: [
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [700, 900],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [75, 100],
                            MetalClusters: [75, 100],
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
                            Radius: [800, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [550, 600],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        },
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [1500, 1500],
                            Height: [0, 0],
                            Water: [0, 0],
                            Temp: [0, 100],
                            MetalDensity: [0, 0],
                            MetalClusters: [0, 0],
                            BiomeScale: [100, 100],
                            Position: [-25000, 0],
                            Velocity: [0, -141.4213],
                            Biomes: ['gas']
                        },
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [25000, 0],
                            Velocity: [0.00000618172, -141.421],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [12500, -21700],
                            Velocity: [-122.439, -70.5296],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [-12500, -21700],
                            Velocity: [-122.439, 70.5296],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [-25000, 0],
                            Velocity: [-0.00000618172, 141.421],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [-12500, 21700],
                            Velocity: [122.439, 70.5297],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [400, 400],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [12500, 21700],
                            Velocity: [122.439, -70.5297],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [500, 600],
                            Height: [0, 1],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 50],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [-0.00000437114, 100],
                            Biomes: ['metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 1],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [0, 0],
                            BiomeScale: [100, 100],
                            Position: [55000, 0],
                            Velocity: [-0.000200886, 323.607],
                            Biomes: ['moon', 'lava']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 1],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [0, 0],
                            BiomeScale: [100, 100],
                            Position: [45000, 0],
                            Velocity: [-0.000181338, -123.607],
                            Biomes: ['moon', 'lava']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [250, 250],
                            Height: [0, 0],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [100, 100],
                            MetalClusters: [100, 100],
                            BiomeScale: [100, 100],
                            Position: [25000, 0],
                            Velocity: [0.00000618172, -141.421],
                            Biomes: ['moon', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [25000, 5000],
                            Velocity: [223.607, -141.421],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [29300, -2500],
                            Velocity: [-112.683, -335.237],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [20700, -2500],
                            Velocity: [-112.683, 52.3943],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [0, -50000],
                            Velocity: [100, 0.00000437114],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [-43300, 25000],
                            Velocity: [-50.0017, -86.6029],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [43300, 25000],
                            Velocity: [-50.0017, 86.6029],
                            Biomes: ['moon']
                        },
                    ]
                },
                {
                    Planets: [
                       {
                           starting_planet: false,
                           mass: 50000,
                           Thrust: [0, 0],
                           Radius: [1500, 1500],
                           Height: [0, 0],
                           Water: [0, 0],
                           Temp: [0, 100],
                           MetalDensity: [0, 0],
                           MetalClusters: [0, 0],
                           BiomeScale: [0, 0],
                           Position: [30000, 0],
                           Velocity: [0, 129.0994],
                           Biomes: ['gas']
                       },
                       {
                           starting_planet: true,
                           mass: 10000,
                           Thrust: [0, 0],
                           Radius: [450, 550],
                           Height: [10, 25],
                           Water: [0, 45],
                           Temp: [0, 100],
                           MetalDensity: [40, 65],
                           MetalClusters: [0, 49],
                           BiomeScale: [0, 100],
                           Position: [35000, 0],
                           Velocity: [0, -94.5074],
                           Biomes: ['earth', 'lava', 'desert', 'tropical']
                       },
                       {
                           starting_planet: true,
                           mass: 10000,
                           Thrust: [0, 0],
                           Radius: [450, 550],
                           Height: [10, 25],
                           Water: [0, 40],
                           Temp: [0, 100],
                           MetalDensity: [40, 65],
                           MetalClusters: [0, 49],
                           BiomeScale: [0, 100],
                           Position: [25000, 0],
                           Velocity: [0, 352.7061],
                           Biomes: ['earth', 'lava', 'desert', 'tropical']
                       },
                       {
                           starting_planet: true,
                           mass: 5000,
                           Thrust: [1, 3],
                           Radius: [200, 250],
                           Height: [0, 10],
                           Water: [0, 0],
                           Temp: [0, 0],
                           MetalDensity: [10, 20],
                           MetalClusters: [0, 49],
                           BiomeScale: [0, 100],
                           Position: [20000, 0],
                           Velocity: [0, 287.213287],
                           Biomes: ['moon', 'lava']
                       },
                       {
                           starting_planet: false,
                           mass: 50000,
                           Thrust: [0, 0],
                           Radius: [500, 525],
                           Height: [0, 0],
                           Water: [0, 0],
                           Temp: [0, 100],
                           MetalDensity: [50, 100],
                           MetalClusters: [50, 100],
                           BiomeScale: [0, 100],
                           Position: [14000, 0],
                           Velocity: [0, 188.98223],
                           Biomes: ['metal']
                       }
                    ]
                }
            ]
        },
        {
            Players: [0, 0],
            Systems: [
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [900, 1200],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [-15000, 0],
                            Velocity: [0, 244],
                            Biomes: ['earth', 'desert', 'lava', 'metal', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [900, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        }
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [800, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [0, 100],
                            Biomes: ['earth', 'desert', 'tropical', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [60000, 0],
                            Velocity: [0, -58.1138],
                            Biomes: ['lava', 'moon']
                        },
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [1500, 1500],
                            Height: [0, 0],
                            Water: [0, 0],
                            Temp: [0, 100],
                            MetalDensity: [0, 0],
                            MetalClusters: [0, 0],
                            BiomeScale: [100, 100],
                            Position: [-25000, 0],
                            Velocity: [0, -141.4213],
                            Biomes: ['gas']
                        },
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [900, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [25, 50],
                            BiomeScale: [100, 100],
                            Position: [0, 25000],
                            Velocity: [-141.421, -0.00000618172],
                            Biomes: ['earth', 'desert', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [-0.00000437114, 100],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [35400, -35400],
                            Velocity: [70.6661, 70.6661],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [0, -50000],
                            Velocity: [100, 0.00000437114],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-35400, -35400],
                            Velocity: [70.6661, -70.6661],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-50000, 0],
                            Velocity: [0.00000437114, -100],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-35400, 35400],
                            Velocity: [-70.6661, -70.6661],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [0, 50000],
                            Velocity: [-100, -0.00000437114],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [35400, 35400],
                            Velocity: [-70.6661, 70.6661],
                            Biomes: ['moon']
                        },
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [900, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [25, 50],
                            BiomeScale: [100, 100],
                            Position: [0, 25000],
                            Velocity: [-141.421, -0.00000618172],
                            Biomes: ['earth', 'desert', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: true,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [900, 1000],
                            Height: [20, 25],
                            Water: [33, 35],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [25, 50],
                            BiomeScale: [100, 100],
                            Position: [0, -25000],
                            Velocity: [141.421, 0.00000618172],
                            Biomes: ['earth', 'desert', 'lava', 'moon', 'metal']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [50000, 0],
                            Velocity: [-0.00000437114, 100],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 10],
                            Water: [1, 2],
                            Temp: [0, 100],
                            MetalDensity: [10, 20],
                            MetalClusters: [0, 49],
                            BiomeScale: [100, 100],
                            Position: [-50000, 0],
                            Velocity: [0.00000437114, -100],
                            Biomes: ['moon']
                        },
                    ]
                },
                {
                    Planets: [
                        {
                            starting_planet: false,
                            mass: 50000,
                            Thrust: [0, 0],
                            Radius: [250, 250],
                            Height: [0, 0],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [100, 100],
                            MetalClusters: [100, 100],
                            BiomeScale: [100, 100],
                            Position: [25000, 0],
                            Velocity: [0.00000618172, -141.421],
                            Biomes: ['moon', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [25000, 5000],
                            Velocity: [223.607, -141.421],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [29300, -2500],
                            Velocity: [-112.683, -335.237],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: true,
                            mass: 10000,
                            Thrust: [0, 0],
                            Radius: [600, 600],
                            Height: [20, 25],
                            Water: [30, 40],
                            Temp: [0, 100],
                            MetalDensity: [0, 10],
                            MetalClusters: [25, 25],
                            BiomeScale: [100, 100],
                            Position: [20700, -2500],
                            Velocity: [-112.683, 52.3943],
                            Biomes: ['earth', 'desert', 'lava']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [0, -50000],
                            Velocity: [100, 0.00000437114],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [-43300, 25000],
                            Velocity: [-50.0017, -86.6029],
                            Biomes: ['moon']
                        },
                        {
                            starting_planet: false,
                            mass: 5000,
                            Thrust: [1, 3],
                            Radius: [200, 250],
                            Height: [0, 25],
                            Water: [0, 1],
                            Temp: [0, 100],
                            MetalDensity: [40, 65],
                            MetalClusters: [0, 25],
                            BiomeScale: [100, 100],
                            Position: [43300, 25000],
                            Velocity: [-50.0017, 86.6029],
                            Biomes: ['moon']
                        },
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

    var generate = function(config) {
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
            var starSystemTempl = _.find(table, function(sst) {
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
        var pgen = _.map(cSys.Planets, function(plnt, index) {
            if (!!plnt.isExplicit) {
                var deferred = $.Deferred();
                deferred.resolve(plnt);
                return plnt.promise();
            }

            var bp = _.cloneDeep(planet_template);
            bp.generator.seed = getRandomInt(0, 32767);
            bp.generator.biome = _.sample(plnt.Biomes);

            var biomeGet = $.get('coui://pa/terrain/' + bp.generator.biome + '.json')
                .then(function(data) {
                    return parse(data);
                });
            var nameGet = plnt.name;
            if (!nameGet) {
                nameGet = $.Deferred();
                api.game.getRandomPlanetName().then(function(name) { nameGet.resolve(name); });
            }
            return $.when(biomeGet, nameGet).then(function(biomeInfo, name) {
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

        return $.when.apply($, pgen).then(function() {
            rSystem.planets = Array.prototype.slice.call(arguments, 0);
            return rSystem;
        });
    };

    return {
        generate: generate
    };
})();


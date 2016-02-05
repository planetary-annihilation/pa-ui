// !LOCNS:galactic_war
define([], function () {
    return {
        "name": "Origin",
        "mass": 50000,
        "position": [50000, 0],
        "velocity": [0, 100],
        "required_thrust_to_move": 0,
        "generator": {
            "seed": 9,
            "radius": 250,
            "heightRange": 20,
            "waterHeight": 50,
            "waterDepth": 50,
            "temperature": 80,
            "metalDensity": 50,
            "metalClusters": 50,
            "metalSpotLimit": -1,
            "biomeScale": 50,
            "biome": "earth",
            "symmetryType": "none",
            "symmetricalMetal": false,
            "symmetricalStarts": false,
            "numArmies": 2,
            "landingZonesPerArmy": 1,
            "landingZoneSize": 0
        },
        "units":[
            {
			    "pos":[164.57559204101562,-176.419921875,107.3885498046875],
			    "orient": [0, 0, 1, 4.371139E-08],
                "army": 1,
                "unit_spec":"/pa/units/land/metal_extractor/metal_extractor.json"
            },
            {
                "pos":[130.83627319335938,-197.81011962890625,114.42149353027344],
                "orient": [0, 0, 1, 4.371139E-08],
                "army": 1,
                "unit_spec":"/pa/units/land/metal_extractor/metal_extractor.json"
            },
            {
                "pos":[173.20687866210938,-189.06793212890625,64.79939270019531],
                "orient": [0, 0, 1, 4.371139E-08],
                "army": 1,
                "unit_spec":"/pa/units/land/metal_extractor/metal_extractor.json"
            },
            {
                "pos": [153.21578979492188,-208.12603759765625,45.428924560546875],
                "orient": [0, 0, 1, 4.371139E-08],
                "army": 1,
                "unit_spec":"/pa/units/land/metal_extractor/metal_extractor.json"
            }
        ],
        "starting_planet": true,
        "planetCSG": [
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.6139277219772339,
                        -0.029938414692878723,
                        0.8564159870147705,
                        212.17129516601562,
                        -0.8012400269508362,
                        0.3936750888824463,
                        -0.5606124401092529,
                        -138.88795471191406,
                        -0.3039064109325409,
                        -0.9774330854415894,
                        -0.25202637910842896,
                        -62.437835693359375
                    ],
                    "op": "BO_Add",
                    "rotation": 4.434232234954834,
                    "scale": [
                        1.05415940284729,
                        1.05415940284729,
                        1.05415940284729
                    ],
                    "height": 261.160888671875,
                    "position": [
                        212.17129516601562,
                        -138.88795471191406,
                        -62.43785095214844
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        0.48569414019584656,
                        -0.25065919756889343,
                        1.0653321743011475,
                        237.29025268554688,
                        1.0027551651000977,
                        -0.36502140760421753,
                        -0.543049693107605,
                        -120.95795440673828,
                        0.4384572505950928,
                        1.1124706268310547,
                        0.061853840947151184,
                        13.77721881866455
                    ],
                    "op": "BO_Add",
                    "rotation": 1.474816918373108,
                    "scale": [
                        1.1973559856414795,
                        1.1973559856414795,
                        1.1973559856414795
                    ],
                    "height": 266.697021484375,
                    "position": [
                        237.29025268554688,
                        -120.95795440673828,
                        13.777207374572754
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.646632969379425,
                        0.5585236549377441,
                        0.7495147585868835,
                        172.1578826904297,
                        -0.9240595102310181,
                        -0.5192869305610657,
                        -0.4102564752101898,
                        -94.2328109741211,
                        0.14083722233772278,
                        -0.8427618741989136,
                        0.7495147585868835,
                        172.1578826904297
                    ],
                    "op": "BO_Add",
                    "rotation": 4.045989036560059,
                    "scale": [
                        1.1365981101989746,
                        1.1365981101989746,
                        1.1365981101989746
                    ],
                    "height": 261.0679931640625,
                    "position": [
                        172.1578826904297,
                        -94.23282623291016,
                        172.1578826904297
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_02.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.8648344874382019,
                        0.4559929072856903,
                        0.6913278698921204,
                        147.7159881591797,
                        -0.037515997886657715,
                        0.9769651293754578,
                        -0.6913278698921204,
                        -147.7159881591797,
                        -0.8273187279701233,
                        -0.5209723114967346,
                        -0.691327691078186,
                        -147.71595764160156
                    ],
                    "op": "BO_Add",
                    "rotation": 4.935806751251221,
                    "scale": [
                        1.1974149942398071,
                        1.1974149942398071,
                        1.1974149942398071
                    ],
                    "height": 255.8516082763672,
                    "position": [
                        147.71600341796875,
                        -147.71600341796875,
                        -147.71603393554688
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_02.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.2258489578962326,
                        -0.4996565580368042,
                        0.8223589062690735,
                        220.9714813232422,
                        0.3002857267856598,
                        -0.8391193747520447,
                        -0.4273708462715149,
                        -114.83644104003906,
                        0.9141987562179565,
                        0.15218642354011536,
                        0.3435382544994354,
                        92.31024932861328
                    ],
                    "op": "BO_Add",
                    "rotation": 2.497361183166504,
                    "scale": [
                        0.9884021282196045,
                        0.9884021282196045,
                        0.9884021282196045
                    ],
                    "height": 265.5880126953125,
                    "position": [
                        220.97149658203125,
                        -114.8364486694336,
                        92.31023406982422
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        0.20157469809055328,
                        0.14429105818271637,
                        1.0478719472885132,
                        260.21453857421875,
                        0.10992211848497391,
                        1.0580964088439941,
                        -0.1668442189693451,
                        -41.43186950683594,
                        -1.0520325899124146,
                        0.13820259273052216,
                        0.18334466218948364,
                        45.52936935424805
                    ],
                    "op": "BO_Add",
                    "rotation": 6.255908012390137,
                    "scale": [
                        1.076795220375061,
                        1.076795220375061,
                        1.076795220375061
                    ],
                    "height": 267.39697265625,
                    "position": [
                        260.2145690917969,
                        -41.4318733215332,
                        45.52936935424805
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        0.6763195395469666,
                        0.012354239821434021,
                        1.0029913187026978,
                        218.204833984375,
                        0.9742196202278137,
                        -0.29611706733703613,
                        -0.6532711386680603,
                        -142.12179565429688,
                        0.23883157968521118,
                        1.1729085445404053,
                        -0.17549188435077667,
                        -38.17897033691406
                    ],
                    "op": "BO_Add",
                    "rotation": 1.194368839263916,
                    "scale": [
                        1.2097737789154053,
                        1.2097737789154053,
                        1.2097737789154053
                    ],
                    "height": 263.1911926269531,
                    "position": [
                        218.2048797607422,
                        -142.121826171875,
                        -38.17900466918945
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_01.json",
                    "proj": "BP_Bend",
                    "transform": [
                        0.1876237392425537,
                        0.73609858751297,
                        0.7009313702583313,
                        176.53384399414062,
                        -0.8574520945549011,
                        0.4973786175251007,
                        -0.2928122580051422,
                        -73.74655151367188,
                        -0.5458221435546875,
                        -0.5283199548721313,
                        0.7009313702583313,
                        176.53384399414062
                    ],
                    "op": "BO_Add",
                    "rotation": 5.118368148803711,
                    "scale": [
                        1.0336095094680786,
                        1.0336095094680786,
                        1.0336095094680786
                    ],
                    "height": 260.32086181640625,
                    "position": [
                        176.53384399414062,
                        -73.74655151367188,
                        176.53382873535156
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_02.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.24534322321414948,
                        0.45658940076828003,
                        -0.599155068397522,
                        -191.1689453125,
                        0.029292091727256775,
                        -0.6238728761672974,
                        -0.48742032051086426,
                        -155.5183868408203,
                        -0.752730131149292,
                        -0.1730974316596985,
                        0.17631959915161133,
                        56.25727844238281
                    ],
                    "op": "BO_Add",
                    "rotation": 3.5984890460968018,
                    "scale": [
                        0.7922461628913879,
                        0.7922461628913879,
                        0.7922461628913879
                    ],
                    "height": 252.77740478515625,
                    "position": [
                        -191.1689453125,
                        -155.5183868408203,
                        56.25726318359375
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_10.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.10780827701091766,
                        -0.4340820908546448,
                        0.8943992257118225,
                        238.28338623046875,
                        0.6922292709350586,
                        -0.6785058975219727,
                        -0.2458624392747879,
                        -65.50199890136719,
                        0.7135797142982483,
                        0.5926234126091003,
                        0.37363287806510925,
                        99.54224395751953
                    ],
                    "op": "BO_Add",
                    "rotation": 2.180267572402954,
                    "scale": [
                        1,
                        1,
                        1
                    ],
                    "height": 266.417236328125,
                    "position": [
                        238.2834014892578,
                        -65.50199890136719,
                        99.542236328125
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                },
                {
                    "weight": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "spec": "/pa/terrain/desert/brushes/desert_plateau_11.json",
                    "proj": "BP_Bend",
                    "transform": [
                        -0.2442283183336258,
                        0.10166031122207642,
                        0.9643742442131042,
                        259.7904968261719,
                        -0.7888144850730896,
                        0.557606041431427,
                        -0.25854820013046265,
                        -69.64968872070312,
                        -0.5640249848365784,
                        -0.8238572478294373,
                        -0.0559920072555542,
                        -15.0835542678833
                    ],
                    "op": "BO_Add",
                    "rotation": 5.050775051116943,
                    "scale": [
                        1,
                        1,
                        1
                    ],
                    "height": 269.38763427734375,
                    "position": [
                        259.7904968261719,
                        -69.64968872070312,
                        -15.083584785461426
                    ],
                    "weightHard": false,
                    "weightScale": [
                        1,
                        1,
                        1
                    ],
                    "mirrored": false,
                    "twinId": 0,
                    "flooded": false,
                    "pathable": false,
                    "mergeable": false,
                    "no_features": false
                }
        ],
        "metal_spots": [
            [
                164.57559204101562,
                -176.419921875,
                107.3885498046875
            ],
            [
                130.83627319335938,
                -197.81011962890625,
                114.42149353027344
            ],
            [
                173.20687866210938,
                -189.06793212890625,
                64.79939270019531
            ],
            [
                153.21578979492188,
                -208.12603759765625,
                45.428924560546875
            ]
        ],
        "landing_zones": {
            "list": [
                [
                    150.52053833007812,
                    -199.8223876953125,
                    85.05352783203125
                ],
                [
                    -118.01551818847656,
                    -194.17303466796875,
                    109.99285888671875
                ]
            ],
            "rules": [
                {
                    "min": 0,
                    "max": 10
                },
                {
                    "min": 0,
                    "max": 10
                },
                {
                    "min": 0,
                    "max": 10
                }
            ]
        }
    }
});
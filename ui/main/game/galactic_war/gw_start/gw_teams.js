define([
    'main/game/galactic_war/shared/js/systems/template-loader',
    'shared/gw_factions'
], function(
    activeStarSystemTemplates,
    GWFactions
) {
    return {
        getTeam: function(index) {
            var faction = GWFactions[index],
                team = _.sample(faction.teams);
            return _.extend({}, team, {
                color: faction.color,
                faction: faction,
                remainingMinions: _.clone(faction.minions)
            });
        },

        makeBoss: function(star, ai, team, sst) {
            if (team.boss) {
                _.assign(ai, team.boss);
            }
            else {
                ai.econ_rate = ai.econ_rate * 2;
            }
            if (team.bossCard) {
                star.cardList().push(team.bossCard);
            }
            if (team.systemTemplate) {
                var generatorConfig = {
                    name: team.systemTemplate.name,
                    template: {
                        Planets: team.systemTemplate.Planets
                    }
                };
                return activeStarSystemTemplates().generate(generatorConfig)
                    .then(function(system) {
                        if (team.systemDescription)
                            system.description = team.systemDescription;
                        system.biome = system.planets[0].generator.biome;
                        star.system(system);
                        return ai;
                    });
            }
            else
                return $.when(ai);
        },

        makeWorker: function(star, ai, team) {
            if (team.workers) {
                _.assign(ai, _.sample(team.workers));
            } else if (team.remainingMinions) {
                var minion = _.sample(team.remainingMinions.length ? team.remainingMinions : team.faction.minions)
                _.assign(ai, minion);
                _.remove(team.remainingMinions, function(minion) { return minion.name === ai.name; });
            }
            return $.when(ai);
        }
    };
});

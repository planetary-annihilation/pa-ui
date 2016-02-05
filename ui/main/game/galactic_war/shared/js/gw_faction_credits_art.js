// !LOCNS:galactic_war_credits
define([], function () {
    return {
        name: 'Art',
        color: [[255,242,93], [192,192,192]],
        teams: [
            {
                boss: {
                    name: 'Steve Thompson',
                    description: ['<div class="div_credits_title">','!LOC:Art Director','</div>'],
                    icon: 'coui://ui/main/game/galactic_war/shared/img/icon_faction_art.png',
                    iconColor: [255, 242, 93],
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                },
                workers: [
                    {
                        name: 'Ben Golus',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Tech Artist',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Andrew Christopherson',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Artist',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Russell Songco',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:UI Designer',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Tim Cox',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:World Art',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Brandon Orden',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Artist',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Matt Reynolds',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Artist',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                ]
            }
        ], // teams
        minions: [
        ] // minions
    };
});

// !LOCNS:galactic_war_credits
define([], function () {
    return {
        name: 'Production',
        color: [[93,242,255], [192,192,192]],
        teams: [
            {
                boss: {
                    name: 'Adam Overton',
                    description: [
                        '<div class="div_credits_title">',
                        '!LOC:Executive Producer',
                        '</div>'
                    ],
                    icon: 'coui://ui/main/game/galactic_war/shared/img/icon_faction_production.png',
                    iconColor: [93,242,255],
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                },
                workers: [
                    {
                        name: 'Marc Scattergood',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Producer',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Michelle Krater',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Support',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Brad Nicholson',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Community Management',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    },
                    {
                        name: 'Leila Blue Aram-Panahi',
                        description: [
                            '<div class="div_credits_title">',
                            '!LOC:Associate Producer',
                            '</div>'
                        ],
                        commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                    }
                ]
            }
        ], // teams
        minions: [
        ] // minions
    };
});

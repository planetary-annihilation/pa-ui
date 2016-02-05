// !LOCNS:galactic_war_credits
define([], function () {
    return {
        name: 'Thanks',
        color: [[236,34,35], [192,192,192]],
        teams: [
            {
                boss: {
                    name: '!LOC:Special Thanks',
                    html: [
                        '<div class="credits-category">',
                        '!LOC:Special Thanks',
                        '</div>',
                        '<div class="credits_list">',
                        'Scott Ludwig<br />',
                        'Sam Lantinga<br />',
                        'John Vert<br />',
                        'Ryan Gordon aka icculus<br />',
                        'Jurusha Emerson<br />',
                        'Israel Emerson<br />',
                        'Micah Emerson<br />',
                        'Levi Emerson<br />',
                        'Filter Talent<br />',
                        '</div>'
                    ],
                    icon: 'coui://ui/main/game/galactic_war/shared/img/icon_thanks.png',
                    commander: '/pa/units/commanders/tank_aeson/tank_aeson.json'
                },
                workers: [
                    {
                        name: '!LOC:Production Babies',
                        html: [
                            '<div class="credits-category">',
                            '!LOC:Production Babies',
                            '</div>',
                            '<div class="credits_list">',
                            'Ellis Marjorie Gaffney<br />',
                            'Abel Tiberius Wichlacz<br />',
                            '</div>'
                        ]
                    },
                    {
                        name: '!LOC:In Memoriam',
                        html: [
                            '<div class="credits-category">',
                            '!LOC:In Memoriam',
                            '</div>',
                            '<div class="credits_list">',
                            '!LOC:In loving memory of',
                            '<br/>Katherine Scattergood.<br />',
                            "!LOC:You'll be missed, Mom.",
                            '<br />',
                            '1946 - 2014<br />',
                            '</div>'
                        ]
                    }
                ]
            }
        ], // teams
        minions: [
        ] // minions
    };
});

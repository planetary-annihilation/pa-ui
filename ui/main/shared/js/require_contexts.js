var requireGW = require.config({
    context: "gw",
    waitSeconds: 0,
    baseUrl: 'coui://ui/main/game/galactic_war',
    paths: {
        shared: 'coui://ui/main/game/galactic_war/shared/js',
        cards: 'coui://ui/main/game/galactic_war/cards',
        pages: 'coui://ui/main/game/galactic_war',
        main: 'coui://ui/main'
    }
});

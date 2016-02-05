define([
    'shared/gw_balance',
    'shared/gw_bank',
    'shared/gw_game',
    'shared/gw_manifest',
    'shared/gw_specs'
], function(
    balance,
    bank,
    game,
    manifest,
    specs
) {
    return {
        balance: balance,
        bank: bank,
        Game: game,
        manifest: manifest,
        specs: specs
    };
});

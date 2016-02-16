var url = decode( sessionStorage['community_mods_url']);

if (url) {
    loadScript( url );
}
else {
    window.history.back();
}

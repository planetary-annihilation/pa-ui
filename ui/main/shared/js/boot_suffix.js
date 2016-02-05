if (profileAllTheThings)
{
    var path = document.location.pathname;
    var prefixes = ['/main/game/', '/main/'];
    for (var i = 0; i < prefixes.length; ++i)
    {
        if (path.startsWith(prefixes[i]))
        {
            path = path.substr(prefixes[i].length);
            break;
        }
    }
    console.profile("Load: " + path);
}
ko.applyBindings = wrapWithTiming("knockout.js: ko.applyBindings", ko.applyBindings);

console.timeStamp("boot_suffix.js locInit()");
locInit();

if (global_mod_list)
    loadMods(global_mod_list);

{
    // Some places in the code still relies on this session variable.
    var devModeSessionVar = ko.observable().extend({ session: 'dev_mode' });
    devModeSessionVar(DEV_MODE);
}

$(document).ready(function() {
	// disable middle mouse scrolling
	$('body').mousedown(function(e) {
		if (e.button === 1)
			return false;
	});

	if (api.Panel.pageName === 'game')
		modify_keybinds({
			add : ['general', 'debugging']
		});

    console.timeStamp("boot_suffix.js locUpdateDocument() start");
	locUpdateDocument();
    console.timeStamp("boot_suffix.js locUpdateDocument() finish");

	// now that loc has been updated, it's okay to show the page
	$('html').addClass('localization_done');

    if (profileAllTheThings)
        _.defer(function() { console.profileEnd(); });
});

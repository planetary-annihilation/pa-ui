var reSimple = /\[(\/?)(strong|em)\]/gi;
var reNoClosing = /\[(br)\]/gi;
var reStyleOpen = /\[style=([^\]]+)\]/gi;
var reStyleClose = /\[\/style\]/gi;
function applyStyleCode(str) {
    str = str.replace(reSimple, '<$1$2>');
    str = str.replace(reNoClosing, '<$1>');
    str = str.replace(reStyleOpen, '<span class="$1">');
    str = str.replace(reStyleClose, '</span>');
    return str;
};

// loc() - primary localization function
//   loc("!LOC:original text") -> i18n(id)              // !LOCSKIP this comment is so the loc update script knows to skip this line
//       id found -> translated text (yay!)
//       id not found -> id (uh oh! make the sure id is in the translation json files)
//       original text is ignored at this point (but will be used when you run the loc update script, so keep it intact)
//   loc("!LOC:original text") -> "RUNLOCSCRIPT! " + original text                 // !LOCSKIP this comment is so the loc update script knows to skip this line
//       should only show up if you've marked string for loc (good!) but haven't run the loc update script to generate ids (do it!)
//   loc(any_other_string) -> any_other_string
//       any string without a loc tag is a passthrough, so loc(loc(loc(text))) should equal loc(text)
//   loc([str1, str2]) -> loc(str1) + loc(str2)
//       support multiple loc strings that are combined. useful for combining non-loc and loc assets, like HTML layout and loc content.
//   loc(any_non_string) -> any_non_string
//       any non string is a passthrough. this is usefully for many cases where a ko observable needs loc but may be undefined at some point.
function loc(inText, inOptionalArgs) {
    inOptionalArgs = inOptionalArgs || {};

    if (_.isArray(inText))
    {
        var accum = '';
        for (var i = 0; i < _.size(inText); ++i)
        {
            var text = inText[i];
            var options = _.cloneDeep(inOptionalArgs);
            while (i + 1 < _.size(inText) && _.isObject(inText[i + 1]))
                _.assign(options, inText[++i]);
            accum += loc(text, options);
        }

        return accum;
    }

    if (!_.isString(inText))
        return inText;

    try {
        var locTag = "!LOC:"; // !LOCSKIP
        if (inText.substring(0, locTag.length) === locTag) {
            var remainingText = inText.substring(locTag.length);
            return applyStyleCode(i18n.t(_.trim(remainingText), inOptionalArgs));
        }
        return applyStyleCode(i18n.functions.applyReplacement(inText, inOptionalArgs || {}));
    } catch (error) {
        return "LOCEXCEPTION!";
    }
}

var locUpdateDocument = wrapWithTiming('localization.js: locUpdateDocument',  function () {
    function locTree(tree)
    {
        $('loc', tree).each(function() {
            var translated = i18n.t(_.trim($(this).text()));
            var formatted = applyStyleCode(htmlSpecialChars(translated));
            $(this).html(formatted);
        });

        $('option', tree).each(function() {
            if (!_.isUndefined($(this).data('noloc')))
                return;
            $(this).text(i18n.t(_.trim($(this).text())));
        });

        $('input[type=button]', tree).each(function() {
            if ($(this).attr('noloc'))
                return;
            var value = $(this).val();
            if (value)
                $(this).val(i18n.t(_.trim(value)));
        });
        $('input[placeholder]', tree).each(function() {
            if (!_.isUndefined($(this).data('noloc')))
                return;
            $(this).attr('placeholder', i18n.t(_.trim($(this).attr('placeholder'))));
        });
    }

    locTree(document);

    /* These are KO HTML templates. */
    $('script[type="text/html"]').each(function() {
        var rendered = $("<div/>").html($(this).text());
        locTree(rendered);
        $(this).text(rendered.html());
    });
});

function locInitInternal(localeString) {
    localStorage.setItem('locale', encode(localeString));

    var locNamespace = $('meta[locns]').attr('locns');
    if (!locNamespace)
    {
        locNamespace = location.pathname.substr(0, location.pathname.lastIndexOf("."));
        locNamespace = locNamespace.substr(locNamespace.lastIndexOf('/') + 1);
    }

    $.i18n.init({
        lng: localeString,
        lowerCaseLng: false,
        customLoad: function(lng, ns, options, loadComplete) {
            var strings = _.get(i18n_data, ['strings', lng]);
            if (!strings)
                loadComplete("No data for language " + lng, {});
            else
                loadComplete(null, _.mapValues(strings, function (value) { return value.message; }));
        },
        useLocalStorage: false, /* This option would be cool, but it does not consider that locNamespace could change. */
        debug: false,
        nsseparator: ';;',
        keyseparator: '::',
    });
}

var locInit = wrapWithTiming('localization.js: locInit', function() {
    var locale = decode(localStorage['locale']);
    if (!locale)
    {
        locale = _.get(i18n_data, 'locale');
        if (!locale || !_.isString(locale))
            locale = 'en-US';
        localStorage.setItem('locale', encode(locale));
    }

    // When we load the main panel, we make sure the native layer agrees with us about what the locale is.
    if (api.Panel.pageName === 'main')
        applyLocale(locale);

    locInitInternal(locale);
});

function applyLocale(locale) {
    if (locale === _.get(i18n_data, 'locale'))
        return;

    // Don't fire ready events if we're reloading. For the main panel first load,
    // we start creating panels, and reloading the page destroys them, causing
    // crossed wires and crashes.
    $.holdReady(true);
    engine.call('loc.setCurrentLocale', locale).then(function() {
        api.game.debug.reloadRoot();
    });
}

function saveAndApplyLocale(locale) {
    if (locale !== decode(localStorage['locale']))
        localStorage.setItem('locale', encode(locale));
    applyLocale(locale);
}

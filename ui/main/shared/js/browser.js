/* file from rBrowser mod by Raevn */

function init_browser() {
    model.showBrowser = ko.observable(false);
    model.browserHome = ko.observable('');
    model.browserTitle = ko.observable('');

    model.openBrowser = function () {}

    model.closeBrowser = function () {}

    model.navBrowserHome = function () {}

    model.setBrowserHtml = function (html) { }
}

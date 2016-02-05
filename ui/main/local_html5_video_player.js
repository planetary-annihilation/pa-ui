function getParameter(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);

    if (results)
        return results[1];

    return null;
}

window.addEventListener('load', function() {
    var cb = getParameter('cb'); /* url to return to */
    var video_url = getParameter('url'); /* url to return to */
    function callback()
    {
        if (cb)
            window.location.href = cb;
    }

    var video = document.getElementById('player');
    video.addEventListener('ended', callback, false);
    video.addEventListener('error', callback, false);
    video.src = video_url;
    document.addEventListener('keyup', function(e) {
        if (e.keyCode == 27)
            callback();
    }, false);
}, false);
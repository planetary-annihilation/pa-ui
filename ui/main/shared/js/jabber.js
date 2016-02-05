loadScript('coui://ui/main/shared/js/thirdparty/strophe.min.js');

var jabber;

var allowLogging = false; /* squelch logging by default */
function log(object) {
    if (allowLogging)
        console.log(object);
}

function Jabberer(uber_id, jabber_token, use_ubernetdev) {
    var self = this;
    var connection;

    var MAX_RETRIES = 3;
    var connection_attempts = 0;

    self.useUbernetdev = ko.observable().extend({ session: 'use_ubernetdev' });
    if (use_ubernetdev)
        self.useUbernetdev(!!use_ubernetdev);

    var SERVICE_URL = self.useUbernetdev() ? 'xmpp.uberentdev.com' : 'xmpp.uberent.com';

    self.uberId = ko.observable().extend({ session: 'uberId' });
    if (uber_id)
        self.uberId(uber_id);

    self.jabberToken = ko.observable().extend({ session: 'jabberToken' });
    if (jabber_token)
        self.jabberToken(jabber_token);

    self.jid = ko.observable('').extend({ session: 'jabberJid' });
    self.sid = ko.observable('').extend({ session: 'jabberSid' });
    self.rid = ko.observable('').extend({ session: 'jabberRid' });

    self.roster = ko.observableArray();
    self.rosterMap = ko.computed(function () {
        var result = {};
        _.forEach(self.roster(), function (element) {
            result[element] = true;
        });
        return result;
    });

    self.presenceType = ko.observable(/* 'available' | 'away' | 'dnd' | 'unavailable' | 'xa' */);
    self.presenceStatus = ko.observable( /* string set by user */);
    self.updatePresence = function () {
        var type = self.presenceType();
        var status = self.presenceStatus();

        if (!connection)
            return;

        var payload = {};
        if (type)
            payload.type = type;
        if (status)
            payload.status = status;
        connection.send($pres(payload));      
    };
    self.updatePresenceRule = ko.computed(self.updatePresence);

    var paMsgHandler;
    var paPresenceHandler;
    var paCommandHandler;
    self.setMsgHandler = function (handler) {
        paMsgHandler = handler;
    }
    self.setPresenceHandler = function (handler) {
        paPresenceHandler = handler;
    }
    self.setCommandHandler = function (handler) {
        paCommandHandler = handler;
    }

    self.connectOrResume = function () {
        connection = new Strophe.Connection('http://' + SERVICE_URL + ':5280/http-bind');
        connection.rawInput = rawInput;
        connection.rawOutput = rawOutput;

        if (self.jid() && self.sid() && self.rid()) {
            log('Attempting to attach. jid:' + self.jid() + ' sid:' + self.sid() + ' rid:' + self.rid());
            connection.attach(self.jid(), self.sid(), self.rid(), onConnect);
        }
        else if (self.uberId() && self.jabberToken()) {
            log('Attempting to connect');
            self.jid(UberidToJid(self.uberId()) + '/PA');
            connection.connect(self.jid(), self.jabberToken(), onConnect);
        }
        else {
            log('Unable to connect to jabber');
        }
        connection_attempts++;
    }

    self.saveSessionState = function (){
        if (connection && connection.connected){
            self.sid(connection._proto.sid);
            self.rid(connection._proto.rid);
        }
    }

    self.addContact = function (uberid) {

        if (!connection.connected)
            return;

        var jid = UberidToJid(uberid);

        var iq = $iq({ type: "set" }).c("query", { xmlns: "jabber:iq:roster" }).c("item", jid);
        connection.sendIQ(iq);

        connection.send($pres({ to: jid, type: "subscribe" }));
    }

    self.removeContact = function (uberid) {

        if (!connection.connected)
            return;

        var jid = UberidToJid(uberid);
        connection.send($pres({ to: jid, type: "unsubscribe" }));
        connection.send($pres({ to: jid, type: "unsubscribed" }));
    }

    self.sendChat = function (uberid, message) {

        if (!connection.connected || !uber_id || !message)
            return;

        var jid = UberidToJid(uberid);
        var msg = $msg({ to: jid, type: 'chat' }).c('body').t(message);
        connection.send(msg);
    }

    self.sendCommand = function (uberid, type, payload) {
        var jid = UberidToJid(uberid);
        var message = JSON.stringify({
            message_type: type,
            payload: payload
        });
        log(message)
        connection.send($msg({ to: jid, type: 'command' }).c('body').t(message));
    }

    self.getRoster = function () {
        var iq = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });
        connection.sendIQ(iq);
    }

    function JidToUberid(jid) {
        return jid.split('@')[0];
    }

    function UberidToJid(uberid) {
        return uberid + '@' + SERVICE_URL;
    }

    function onConnect(status) {
        log('!!! onConnect');
        switch (status) {
            case Strophe.Status.CONNECTING: 
                log('!!!Strophe is connecting to ' + SERVICE_URL + ' as ' + self.jid());
                break;
            case Strophe.Status.CONNFAIL:
                log('Strophe failed to connect.');
                break;
            case Strophe.Status.DISCONNECTING:
                log('Strophe is disconnecting.');
                break;
            case Strophe.Status.DISCONNECTED:
                log('Strophe is disconnected.');
                self.jid(undefined);
                self.sid(undefined);
                self.rid(undefined);
                if (connection_attempts < MAX_RETRIES) {
                    log('Attempting to reconnect to XMPP. Tries:' + connection_attempts);
                    setTimeout(connectOrResume, 3000);
                }
                break;
            case Strophe.Status.CONNECTED:
                log('!!!Strophe is connected as ' + self.jid());
                initHandlers();
                self.getRoster();
                connection.send($pres());
                connection_attempts = 0;
                break;
            case Strophe.Status.ATTACHED:
                log('!!!Strophe is attached as ' + self.jid());
                initHandlers();
                self.getRoster();
                connection.send($pres());
                connection_attempts = 0;
                break;
            case Strophe.Status.AUTHENTICATING:
                log('Strophe is authenticating.');
                break;
            case Strophe.Status.AUTHFAIL:
                log('Strophe failed to authenticate.');
                break;
            case Strophe.Status.ERROR:
                log('Strophe onConnect Error.');
                break;
            default:
                log('!!!Strophe unexpected status type');
                break;
        }
    }

    function initHandlers() {
        if (connection && connection.connected) {
            connection.addHandler(onPresence, null, 'presence', null, null, null);
            connection.addHandler(onRoster, null, 'iq', null, null, null);
            connection.addHandler(onCommand, null, 'message', 'command', null, null);
            connection.addHandler(onMessage, null, 'message', 'chat', null, null);
        }
    }

    function onPresence(message) {
        try {
            var type = $(message).attr('type');
            var from = $(message).attr('from');
            var to = $(message).attr('to');
            var status = $(message).attr('status');

            log('jabber::onPresence');
            log(message);
            log(type);
            log(status);

            /* store jid so we can broadcast status changes */
            if (!jabber.rosterMap()[from])
                jabber.roster.push(from);

            if (type === 'subscribe') {
                // Allow
                connection.send($iq({ type: "set" }).c("query", { xmlns: "jabber:iq:roster" }).c("item", from));
                connection.send($pres({ to: from, type: "subscribe" }));
                connection.send($pres({ to: from, type: 'subscribed' }));

                // Block
                //connection.send($pres({ to: from, "type": "unsubscribed" }));
            }
            else
                paPresenceHandler(JidToUberid(from), type || 'available', status);
            
            return true;
        }
        //If the handler doesn't return true, it will be deleted
        catch (e) {
            log('!!!PRESENCE error:' + e);
            return true;
        }
    }


    function onRoster(message) {

        try {
            var type = $(message).attr('type');
            var from = $(message).attr('from');
            var to = $(message).attr('to');
            var xmlns = $(message).attr('xmlns');
            var id = $(message).attr('id');

            if (message.firstChild) {
                var items = message.firstChild.getElementsByTagName('item');
                for (var i = 0; i < items.length; i++) {

                    var jid = items[i].getAttribute('jid');
                    var name = items[i].getAttribute('name');
                    var sub = items[i].getAttribute('subscription');
                    var ask = items[i].getAttribute('ask');

                    /* store jid so we can broadcast status changes */
                    if (!jabber.rosterMap()[jid])
                        jabber.roster.push(jid);

                    log('!!!   jid:' + jid + ' name:' + name + ' sub:' + sub + ' ask:' + ask);
                    connection.send($pres({ to: jid, type: "probe" })); 
                }
            }

            if (type === 'set') {
                var iq = $iq({ type: 'result', to: from, id: id });
                connection.sendIQ(iq);
            }
            return true;
        }
        //If the handler doesn't return true, it will be deleted
        catch (e) {
            log('!!!IQ error:' + e);
            return true;
        }
    }

    function onMessage(message) {
        try {
            var from = message.getAttribute('from');
            var to = message.getAttribute('to');
            var type = message.getAttribute('type');
            var body = message.getElementsByTagName('body');

            var content = '';
            if (Strophe.getText(body[0]))
                var content = Strophe.getText(body[0]);

            paMsgHandler(JidToUberid(from), htmlSpecialChars(content, true));
            return true;
        }
        //If the handler doesn't return true, it will be deleted
        catch (e) {
            log('!!!MESSAGE error:' + e);
            return true;
        }
    }

    function onCommand(message) {
        try {
            var from = message.getAttribute('from');
            var to = message.getAttribute('to');
            var type = message.getAttribute('type');
            var body = message.getElementsByTagName('body');
            
            var content = '';
            if (Strophe.getText(body[0])) 
                content = Strophe.getText(body[0]);

            var command = JSON.parse(htmlSpecialChars(content, true))

            paCommandHandler(JidToUberid(from), command);
            return true;
        }
        //If the handler doesn't return true, it will be deleted
        catch (e) {
            log('!!!MESSAGE error:' + e);
            return true;
        }
    }

    function rawInput(data) {
        self.saveSessionState();
    }

    function rawOutput(data) {
        log('SENT: ' + formatXml(data));
        self.saveSessionState(); /* attempting to save the sid and rid when it changes */
    }

    //http://stackoverflow.com/questions/376373/pretty-printing-xml-with-javascript
    function formatXml(xml) {
        var formatted = '';
        var reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        var pad = 0;
        jQuery.each(xml.split('\r\n'), function (index, node) {
            var indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            var padding = '';
            for (var i = 0; i < pad; i++) {
                padding += '  ';
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });

        return formatted;
    }
}

function initJabber(payload) {
    jabber = new Jabberer(payload.uber_id, payload.jabber_token, payload.use_ubernetdev);
    jabber.connectOrResume();

    var restoreJabber = ko.observable().extend({ session: 'restore_jabber' });
    restoreJabber(true);
}

(function () {
    var restoreJabber = ko.observable().extend({ session: 'restore_jabber' });
    if (restoreJabber())
    {
        jabber = new Jabberer();
        jabber.connectOrResume();
    }
})();

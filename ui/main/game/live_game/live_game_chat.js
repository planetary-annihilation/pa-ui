// !LOCNS:live_game
var model;
var handlers = {};

$(document).ready(function () {

    function ChatMessageModel(object) {
        var self = this;

        self.type = object.type ? object.type : "global";
        self.isGlobal = ko.computed(function () {
            return self.type === "global";
        });
        self.isTeam = ko.computed(function () {
            return self.type === "team";
        });
        self.isServer = ko.computed(function () {
            return self.type === "server";
        });

        self.message = object.message ? object.message : "";
        self.player_name = object.player_name ? object.player_name : "";

        if (self.isServer()) {
            self.message = loc(self.message, { 'player': self.player_name });
            self.player_name = "server";
        }

        self.time_stamp = new Date().getTime();
    }

    function ChatViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.chatSelected = ko.computed(function() { return !!self.state().selected; });
        self.teamChat = ko.computed(function() { return !!self.state().team; });
        self.spectatorChat = ko.computed(function() { return self.state().spectator; });

        self.visibleChat = ko.observableArray();
        self.chatLog = ko.observableArray();

        self.chatType = ko.computed(function () {
            if (self.spectatorChat()) {
                return 'SPECTATOR:';
            }
            return (self.teamChat()) ? "TEAM:" : "ALL:";
        });

        self.hideChat = function() {
            api.Panel.focus(api.Panel.parentId);
            api.Panel.message(api.Panel.parentId, 'chat.selected', false);
        };

        self.squelchGlobalChat = ko.observable(false);

        self.$form = function() { return $(".chat_input_form"); };
        self.$input = function() { return $(".input_chat_text"); };
        self.$input().blur(self.hideChat);
        self.$input().keydown(function(event) {
            if (event.keyCode === keyboard.esc)
                self.hideChat();
        });

        self.trySendChat = function (skipSpecial) {
            var value = self.$input().val();
            if (!value) {
                self.hideChat();
                return;
            }
            var msg = {message: value};

            if (!skipSpecial && msg.message.charAt(0) === "+") {
                return api.game.chatSpecialMsg(msg.message).then(function(wasSpecial) {
                    // Was not a valid chat command.
                    if (!wasSpecial) {
                        self.trySendChat(true);
                    }
                    else {
                        self.$input().val("");
                        self.hideChat();
                    }
                });
            }

            if (self.teamChat())
                model.send_message("team_chat_message", msg);
            else
                model.send_message("chat_message", msg);

            self.$input().val("");
            self.hideChat();
        }

        self.maybeSendChat = function () {
            self.trySendChat(false);
        };

        self.removeOldChatMessages = function () {
            var date = new Date();
            var cutoff = date.getTime() - 15 * 1000;

            while (self.visibleChat().length > 0 && self.visibleChat()[0].time_stamp < cutoff)
                self.visibleChat.shift();
        };

        self.active = ko.observable(true);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            api.Panel.query(api.Panel.parentId, 'panel.invoke', ['chatState']).then(model.state);
            setInterval(model.removeOldChatMessages, 500);
        };
    }
    model = new ChatViewModel();

    handlers.submit = function() {
        model.$form().submit();
        model.hideChat();
    };

    handlers.scrollToTop = function() {
        $(".div_chat_log_feed").scrollTop($(".div_chat_log_feed")[0].scrollHeight);
    };

    handlers.chat_message = function (payload) {
        var chat_message = new ChatMessageModel(payload);
        model.chatLog.push(chat_message);
        model.visibleChat.push(chat_message);
        $(".div_chat_feed").scrollTop($(".div_chat_feed")[0].scrollHeight);
        $(".div_chat_log_feed").scrollTop($(".div_chat_log_feed")[0].scrollHeight);
    };

    handlers.set_squelch_global_chat = function (payload) {
        model.squelchGlobalChat(!!payload);
    }

    handlers.state = function (payload) {
        model.state(payload);
    };

    // inject per scene mods
    if (scene_mod_list['live_game_chat'])
        loadMods(scene_mod_list['live_game_chat']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});

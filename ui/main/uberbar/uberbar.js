var model;
var handlers;

$(document).ready(function () {

    /* an ubernet user you have encounterd: includes friends, recent contacts, ignored, blocked */
    function UserViewModel(id) {
        var self = this;

        self.uberId = ko.observable(id);
        self.displayName = LeaderboardUtility.getPlayerDisplayName(id);

// requestUserName is required by update_display_name
        self.requestUserName = function() {
            LeaderboardUtility.getPlayerDisplayName(id).subscribe(function(displayName) {
                self.displayName(displayName);
            });
        }

        self.pendingChat = ko.observable(false);

        self.tags = ko.computed( function() {
            return model.userTagMap()[id] || {};
        });
        
        self.tagList = ko.computed(function () {
            var result = [];

            _.forEach(self.tags(), function (element, key) {
                if (element)
                    result.push(key);
            });

            return result;
        });

        self.friend = ko.computed(function () { return self.tags()['FRIEND'] });
        self.pendingFriend = ko.computed(function () { return self.tags()['PENDING_FRIEND'] });
        self.allowChat = ko.computed(function () { return self.friend() || self.tags()['ALLOW_CHAT'] });
        self.ignored = ko.computed(function () { return self.tags()['IGNORED'] });
        self.blocked = ko.computed(function () { return self.tags()['BLOCKED'] });
        self.search = ko.computed(function () { return self.tags()['SEARCH'] });

        self.lastInteractionTime = ko.computed(function () { return model.idToInteractionTimeMap()[self.uberId()] });

        self.hasName = ko.computed(function () { return !!self.displayName(); });

        self.presenceType = ko.computed(function () {
            if (!model.idToJabberPresenceTypeMap())
                return 'unavailable';
            var result = model.idToJabberPresenceTypeMap()[self.uberId()];
            return result || 'unavailable';
        });
        self.available = ko.computed(function () { return self.presenceType() === 'available' });
        self.away = ko.computed(function () { return self.presenceType() === 'away' });
        self.dnd = ko.computed(function () { return self.presenceType() === 'dnd' });
        self.offline = ko.computed(function () { return self.presenceType() === 'unavailable' });
        self.status = ko.computed(function () {
            if (!model.idToJabberPresenceStatusMap())
                return '';
            var s = model.idToJabberPresenceStatusMap()[self.uberId()];
            return (s && s !== 'undefined') ? s : '';
        });
        self.online = ko.computed(function () { return !self.offline() });

        self.startChat = function () {
            var exists = model.conversationMap()[self.uberId()];
            if (exists)
                exists.minimized(false);
            else
                model.startConversationsWith(self.uberId())
        };
        self.startChatIfOnline = function () {
            if (self.offline())
                return;
            self.startChat()
        }
        self.sendReply = function () {
            jabber.sendChat(self.partnerUberId(), self.reply());
            self.messageLog.push({ 'name': model.uberId, 'message': self.reply() });
            self.reply('');
        };

        self.sendChatInvite = function () {
            self.pendingChat(true);
            self.startChat();

            jabber.sendCommand(self.uberId(), 'chat_invite');
        }

        self.acceptChatInvite = function () {
            if (!self.pendingChat()) {
                self.pendingChat(true); //this is done to allow chat while ALLOW_CHAT tag is being added
                self.startChat();
                jabber.sendCommand(self.uberId(), 'accept_chat_invite');
            }

            self.addTag('ALLOW_CHAT', function () { self.pendingChat(false)});
            self.startChat();
        }

        self.declineChatInvite = function () {
            if (!self.pendingChat())
                jabber.sendCommand(self.uberId(), 'decline_chat_invite');
        }

        self.sendFriendRequest = function () {
            if (self.friend())
                return;

            self.addTag('PENDING_FRIEND');
            jabber.sendCommand(self.uberId(), 'friend_request');
        }
        self.acceptFriendRequest = function () {
            if (!self.pendingFriend())
                jabber.sendCommand(self.uberId(), 'accept_friend_request');

            self.addTag('FRIEND', function () { self.removeTag('PENDING_FRIEND') });
            jabber.addContact(self.uberId());
        }
        self.declineFriendRequest = function () {
            if (!self.pendingFriend())
                jabber.sendCommand(self.uberId(), 'decline_friend_request');

            self.removeTag('PENDING_FRIEND');
        }
        self.unfriend = function () {
            self.removeTag('FRIEND');
            jabber.removeContact(self.uberId());
        }
        self.sendUnfriend = function () {
            if (!self.friend())
                return;

            self.unfriend();
            jabber.sendCommand(self.uberId(), 'unfriend');
        }

        self.sendInviteToGame = function () {
            jabber.sendCommand(self.uberId(), 'game_invite');

            model.pendingGameInvites()[self.uberId()] = model.lobbyInfo() ? model.lobbyInfo().lobby_id : false;

            if (!model.lobbyInfo())
                api.Panel.message('game', 'create_lobby');
        }

        self.acceptInviteToGame = function () {
            model.acceptedGameInviteFrom(self.uberId());
            jabber.sendCommand(self.uberId(), 'accept_game_invite');
        }
        self.declineInviteToGame = function () {
            jabber.sendCommand(self.uberId(), 'decline_game_invite');
        }

        self.viewProfile = function () { }
        self.report = function () {
            self.block();
        }

        self.remove = function () {
            self.sendUnfriend();
            model.removeAllUserTagsFor(self.uberId());
            _.defer(model.requestUbernetUsers);
        }

        self.addTag = function (tag, callback) {
            model.addUserTags(self.uberId(), [tag]);
            if (callback)
                callback();
        }

        self.removeTag = function (tag, callback) {
            model.removeUserTags(self.uberId(), [tag]);
            if (callback)
                callback();
        }

        self.block = function () {
            self.addTag('BLOCKED', self.sendUnfriend);
            jabber.removeContact(self.uberId());
        }

        self.unblock = function () {
            self.removeTag('BLOCKED');
        }

    };

    function ConversationViewModel(uberid) {
        var self = this;

        self.partnerUberId = ko.observable(uberid);

        self.minimized = ko.observable(false);
        self.toggleMinimized = function () {
            self.minimized(!self.minimized());
        };
        self.minimized.subscribe(function (value) {
            if (!value)
                self.dirty(false);
        });

        self.dirty = ko.observable(false);

        self.messageLog = ko.observableArray([/* { name message } */]);
        self.addMessage = function (message /* name message */) {
            self.messageLog.push(message);
            self.dirty(self.minimized());
        };

        self.partner = ko.computed(function () { return model.idToContactMap()[self.partnerUberId()] });
        self.partnerDisplayName = ko.computed(function () {
            return self.partner() ? self.partner().displayName() : self.partnerUberId();
        });
        self.partnerDisplayName.subscribe(function (value) {
            _.forEach(self.messageLog(), function (element) {
                if (!element.name)
                    element.name = value;
            });
        });

        self.reply = ko.observable();
        self.sendReply = function () {
            jabber.sendChat(self.partnerUberId(), self.reply());
            self.messageLog.push({ 'name': model.displayName(), 'message': self.reply() });
            self.reply('');
        };

        self.close = function () {
            model.endConversationsWith(self.partnerUberId());
        }
    };

    function NotificationViewModel(options /* uberid type */) {
        var self = this;

        self.isNew = ko.observable(true);

        self.type = ko.observable(options.type);
        self.isFriendRequest = ko.computed(function () { return self.type() === 'friend_request' });
        self.isGameInvite = ko.computed(function () { return self.type() === 'game_invite' });
        self.isChatInvite = ko.computed(function () { return self.type() === 'chat_invite' });

        self.partnerUberId = ko.observable(options.uberid);
        self.partner = ko.computed(function () { return model.idToContactMap()[self.partnerUberId()] });
        self.partnerDisplayName = ko.computed(function () {
            return self.partner() ? self.partner().displayName() : self.partnerUberId();
        });

        self.ignore = function () {
            if (self.partner()) {
                if (self.isFriendRequest())
                    self.partner().declineFriendRequest();
                if (self.isGameInvite())
                    self.partner().declineInviteToGame();
                if (self.isChatInvite())
                    self.partner().declineChatInvite();
            }
            model.clearNotification(self);
        }
        self.ok = function () {
            if (self.partner()) {
                if (self.isFriendRequest())
                    self.partner().acceptFriendRequest();
                if (self.isGameInvite())
                    self.partner().acceptInviteToGame();
                if (self.isChatInvite())
                    self.partner().acceptChatInvite();
            }
            model.clearNotification(self);
        }
        self.block = function () {
            if (self.partner()) {
                self.partner().declineFriendRequest();
                self.partner().block();
            }
            model.clearNotification(self);
        }
        self.report = function () {
            if (self.partner()) {
                self.partner().declineFriendRequest();
                self.partner().report();
            }
            model.clearNotification(self);
        }
    };

    function SocialViewModel() {
        var self = this;
        var contact_limit = 40;

        self.uberName = ko.observable().extend({ local: 'uberName' });
        self.displayName = ko.observable('').extend({ session: 'displayName' });
        self.uberId = ko.observable('').extend({ session: 'uberId' });

        self.hoverSocialWidget = ko.observable(false);
        self.pinSocialWidget = ko.observable(false);
        self.showSocialWidget = ko.computed(function () {
            return self.hoverSocialWidget() || self.pinSocialWidget();
        });

        self.togglePinSocialWidget = function () {
            self.pinSocialWidget(!self.pinSocialWidget());

            if (self.pinSocialWidget())
                self.showOldNotifications(false);
        };

        /* checked every 500 ms. updated every minute */
        self.time = ko.observable();
        setInterval(function () {
            var d = new Date();
            var hh = d.getHours(),
                MM = d.getMinutes();
            var period = hh >= 12 ? 'PM' : 'AM';

            if (hh > 12)
                hh = hh - 12;
            if (hh === 0)
                hh = 12;

            self.time('' + hh + (MM < 10 ? ':0' : ':') + MM + ' ' + period);
        }, 500);

        self.contactSearch = ko.observable();
        self.showSearchResults = ko.observable(false);
        self.closeSearchResults = function () {
            self.showSearchResults(false);
            _.forEach(self.searchResults(), function (element) {
                element.removeTag('SEARCH');
            });
        };

        self.users = ko.observableArray([/* UserViewModel */]);

        self.userDisplayNameMap = ko.observable({ /* id: name */ }).extend({ local: 'user_display_name_map' });
        self.changeDisplayNameForId = function (id, name) {
            console.log('changeDisplayNameForId');
            var map = self.userDisplayNameMap();
            map[id] = name;
            self.userDisplayNameMap(map);
        }

        self.userTagMap = ko.observable({ /* id: { tag ... tag } */ }).extend({ ubernet: 'user_tag_map' });

        self.changeUserTags = function (uberid, tags /* [ tag ... tag ] */, add) {
            var map = self.userTagMap();
            var current = map[uberid] || {};

            _.forEach(tags, function (element) {
                current[element] = !!add;
            });

            map[uberid] = current;
            self.userTagMap.valueHasMutated();
            self.updateInteractionTimeMap(uberid);
        }

        self.addUserTags = function (id, tags /* [ tag ... tag ] */) {
            self.changeUserTags(id, tags, true);
        }

        self.removeUserTags = function (id, tags /* [ tag ... tag ] */) {
            self.changeUserTags(id, tags, false);
        }

        self.removeAllUserTagsFor = function (id) {
            var map = self.userTagMap();
            delete map[id];
            self.userTagMap.valueHasMutated();
        }

        self.usersSortedByLastInteractionTime = ko.computed(function () {
            var now = _.now();
            return _.sortBy(self.users(), function (element) { return now - element.lastInteractionTime() });
        });

        self.usersSortedAlphabetically = ko.computed(function () {
            return _.sortBy(self.users(), function (element) { return element.displayName() });
        });

        self.doSortByInteractionTime = ko.observable(false);
        self.sortedUsers = ko.computed(function () {
            var time_list = self.usersSortedByLastInteractionTime();
            var alpha_list = self.usersSortedAlphabetically();
            return self.doSortByInteractionTime() ? time_list : alpha_list;
        });

        self.idToContactMap = ko.computed(function () {
            var result = {};
            _.forEach(self.users(), function (element) {
                result[element.uberId()] = element;
            });
            return result;
        });
        self.idToJabberPresenceTypeMap = ko.observable({}).extend({ session: 'jabber_presence_type_map' });
        self.idToJabberPresenceStatusMap = ko.observable({}).extend({ session: 'jabber_presence_status_map' });

        self.idToInteractionTimeMap = ko.observable({}).extend({ local: 'interaction_time_map' });

        self.updateInteractionTimeMap = function(uberid) {
            self.idToInteractionTimeMap()[uberid] = _.now();
            self.idToInteractionTimeMap.valueHasMutated();
        }

        self.friends = ko.computed(function () {
            return _.filter(self.usersSortedAlphabetically(),
                            function (element) { return element.friend() && element.uberId() !== model.uberId() && element.hasName(); });
        });
        self.sortedFriendUberIds = ko.computed(function () {
            return _.sortBy(_.invoke(self.friends(), 'uberId'),
                            function (element) { return element });
        });
        self.sortedFriendUberIds.subscribe(function (value) {
            api.Panel.message('game', 'friends', value);
        });
        self.hasFriends = ko.computed(function () {
            return !!self.friends().length;
        });

        self.blocked = ko.computed(function () {
            return _.filter(self.users(),
                            function (element) { return element.blocked() });
        });
        self.sortedBlockedUberIds = ko.computed(function () {
            return _.sortBy(_.invoke(self.blocked(), 'uberId'),
                            function (element) { return element });
        });
        self.sortedBlockedUberIds.subscribe(function (value) {
            api.Panel.message('game', 'blocked', value);
        });

        self.contacts = ko.computed(function () {
            return _.filter(self.sortedUsers(),
                            function (element) { return !element.friend() && element.uberId() !== model.uberId() && element.hasName(); });
        });

        self.searchResults = ko.computed(function () {
            return _.filter(self.usersSortedByLastInteractionTime(),
                            function (element) { return element.search() });
        });

        self.onlineFriends = ko.computed(function () {
            return _.filter(self.friends(),
                            function (element) { return element.online() });
        });
        self.onlineFriendsCount = ko.computed(function () {
            return self.onlineFriends().length;
        });

        self.offlineFriends = ko.computed(function () {
            return _.filter(self.friends(), function (element) { return !element.online() });
        });

        self.conversationMap = ko.observable({ /* uberid: ConversationViewModel */ });
        self.conversations = ko.computed(function () {
            return _.values(self.conversationMap());
        });
        self.startConversationsWith = function (uberid, message) {
            self.maybeCreateNewContactWithId(uberid);

            var contact = self.idToContactMap()[uberid];
            if (!(contact.allowChat() || contact.pendingChat()))
                return;

            if (!self.conversationMap()[uberid])
                self.conversationMap()[uberid] = new ConversationViewModel(uberid);

            if (message)
                self.conversationMap()[uberid].addMessage({
                    'name': contact.displayName(),
                    'message': message
                });

            self.conversationMap.valueHasMutated();
        };

        self.endConversationsWith = function (uberid) {
            delete self.conversationMap()[uberid];
            self.conversationMap.valueHasMutated();
        };

        self.notifications = ko.observableArray([]);
        self.notificationCount = ko.computed(function () { return self.notifications().length });

        self.newNotifications = ko.computed(function () {
            return _.filter(self.notifications(),
                            function (element) { return element.isNew() });
        });
        self.showOldNotifications = ko.observable(false);

        self.toggleShowOldNotifications = function () {
            if (self.newNotifications().length) {
                _.forEach(self.notifications(), function (element) {
                    element.isNew(false);
                });
                self.showOldNotifications(false);
                return;
            }

            self.showOldNotifications(!self.showOldNotifications());
            if (self.showOldNotifications())
                self.pinSocialWidget(false);
        };

        self.visibleNotifications = ko.computed(function () {
            return self.showOldNotifications() ? self.notifications() : self.newNotifications();
        });

        self.hasVisibleNotifications = ko.computed(function () {
            return self.visibleNotifications().length;
        });

        self.showNotificationWidget = ko.computed(function () {
            return self.hasVisibleNotifications() || self.showOldNotifications();
        });

        self.clearNotification = function (notification) {
            self.notifications(_.filter(self.notifications(),
                                        function (element) { return element !== notification }));
            if (!self.notifications().length)
                self.showOldNotifications(false);
        };

        self.friendRequestMap = ko.computed(function () {
            var result = {};
            _.forEach(self.notifications(), function (element) {
                if (element.isFriendRequest())
                    result[element.partnerUberId()] = element;
            });
            return result;
        });

        self.gameInviteMap = ko.computed(function () {
            var result = {};
            _.forEach(self.notifications(), function (element) {
                if (element.isGameInvite())
                    result[element.partnerUberId()] = element;
            });
            return result;
        });

        self.chatInviteMap = ko.computed(function () {
            var result = {};
            _.forEach(self.notifications(), function (element) {
                if (element.isChatInvite())
                    result[element.partnerUberId()] = element;
            });
            return result;
        });

        self.pendingGameInvites = ko.observable({ /* uberid: false | lobbyid */ });
        self.hasSentInviteTo = function (uberid) {
            return _.has(self.pendingGameInvites(), uberid);
        }

        self.confirmedInvites = ko.observableArray([]);
        self.confirmedInvites.subscribe(function () {
            var result = self.confirmedInvites();
            api.Panel.message('game', 'invites', result);
        });

        self.acceptedGameInviteFrom = ko.observable();

        self.hasConvertedUbernetFriendsToLocalFriends = ko.observable(false).extend({ local: 'has_converted_friends' });
        self.maybeConvertFriends = function () {
            if (self.hasConvertedUbernetFriendsToLocalFriends())
                return;

            self.hasConvertedUbernetFriendsToLocalFriends(true);

            jabber.removeContact(self.uberId());

            function removeLegacyTags(id) {
                var payload = {
                    FriendUberId: id,
                    FriendString: '',
                    Tags: ['PA',
                           'FRIEND',
                           'PENDING_FRIEND',
                           'ALLOW_CHAT',
                           'BLOCKED',
                           'IGNORED',
                           'CONTACT',
                           'FOLLOW',
                           'SEARCH']
                };

                engine.asyncCall(String('ubernet.removeFriendTag'), JSON.stringify(payload))
                   .done(function (data) {
                        console.log('ubernetCall ubernet.removeFriendTag ok');
                   })
                   .fail(function (data) {
                       console.log('ubernetCall ubernet.removeFriendTag failed');
                   });
            }

            engine.asyncCall("ubernet.getFriends", false)
               .done(function (data) {
                   console.log('ubernet.getFriends: ok');

                   var result = parse(data);

                   _.forEach(result, function (element) {
                       if (_.contains(element.Tags, 'PA')) {
                            self.changeDisplayNameForId(element.FriendUberId, element.TrueDisplayName);
                            self.addUserTags(element.FriendUberId, element.Tags);
                            if (_.contains(element.Tags, 'FRIEND'))
                                jabber.addContact(element);
                            removeLegacyTags(element.FriendUberId);
                       }
                   });

                   self.requestUbernetUsers();
               })
               .fail(function (data) {
                   console.log('ubernet.getFriends: fail');
                   self.hasConvertedUbernetFriendsToLocalFriends(false);
               });
        }

        self.addContact = function (ubername, uberid, tags) {
            if (uberid === self.uberId())
                return;

            self.addUserTags(uberid, tags);
            self.users.push(new UserViewModel(uberid));
        }

        self.saveSearch = function (ubername, uberid) {

// check if contact already exists
            if (self.idToContactMap()[ uberid ]) {
                self.addUserTags( uberid, ['SEARCH'] );            
            }
            else {
                self.addContact(ubername, uberid, ['SEARCH']);
            }
        };

        self.maybeCreateNewContactWithId = function (uberid) {
            if (uberid === self.uberId()) {
                return;
            }
            if (self.idToContactMap()[uberid]) {
                self.updateInteractionTimeMap(uberid);
                return;
            }

            self.users.push(new UserViewModel({ 'FriendUberId': uberid }));
            self.addContact('', uberid, ['CONTACT']);
        }

        self.maybeAddFriendRequest = function (uberid, command) {
            var contact = self.idToContactMap()[uberid];

            if (contact.blocked() || self.friendRequestMap()[uberid])
                return;

            self.notifications.push(new NotificationViewModel({ uberid: uberid, type: command.message_type }));
        }

        self.maybeAddGameInvite = function (uberid, command) {
            var contact = self.idToContactMap()[uberid];

            if (contact.blocked() || self.gameInviteMap()[uberid])
                return;

            self.notifications.push(new NotificationViewModel({ uberid: uberid, type: command.message_type }));
        }

        self.maybeAddChatInvite = function (uberid, command) {
            var contact = self.idToContactMap()[uberid];

            if (contact.blocked() || self.chatInviteMap()[uberid])
                return;

            self.notifications.push(new NotificationViewModel({ uberid: uberid, type: command.message_type }));
        }

        self.lobbyInfo = ko.observable(/* { game_hostname game_port local_game game_password lobby_id } */);
        self.lobbyInfo.subscribe(function (new_info) {
            var lobby_id = new_info ? new_info.lobby_id : false;

            _.forEach(self.pendingGameInvites(), function (value, index, collection) {
                /* map value will be false if the game invite was sent before we have a lobby id.
                   so we replace the false value with a real lobby id when we get one. */
                if (!value)
                    collection[index] = lobby_id;

                /* if we have a lobby id for the invite and we get another lobby id, then the previous invite is no longer valid.
                   the invalid invite then removed from the map. */
                if (lobby_id && collection[index] && lobby_id !== collection[index])
                    delete collection[index];
            });
            self.pendingGameInvites.valueHasMutated();
        });
        self.lobbyEmptySlots = ko.observable();
        self.readyToSendLobbyInfo = ko.computed(function () {
            return (self.lobbyInfo() && self.lobbyEmptySlots());
        });
        self.readyToSendLobbyInfo.subscribe(function (value) {
            if (!value)
                return;

            var available = self.lobbyEmptySlots();
            _.forEach(self.confirmedInvites(), function (element) {
                if (available) {
                    jabber.sendCommand(element, 'game_lobby_info', self.lobbyInfo());
                    available = available - 1;
                }
            });
        });

        self.findUserId = function () {
            var searchText = model.contactSearch();

// search for display name if uberName not found
            api.net.ubernet( '/GameClient/UserId?' + $.param({ TitleDisplayName: searchText }), 'GET', 'text')
                    .done(function (data) {
                        var result = JSON.parse(data);
                        self.saveSearch('', result.UberId);
                    })
                    .fail(function (data) {

// search for uber name if not found
                        api.net.ubernet( '/GameClient/UserId?' + $.param({ UberName: searchText }), 'GET', 'text').done( function (data)
                        {
                            var result = JSON.parse(data);
                            self.saveSearch('', result.UberId);
                        })
                    });
        }

        self.newDisplayName = ko.observable();
        self.newDisplayNameError = ko.observable();
        self.isNewDisplayNameInvalid = ko.computed(function () {
            return !self.newDisplayName()
                    || !self.newDisplayName().length
                    || self.newDisplayName().length < 2
                    || self.newDisplayName().length > 20
        });

        self.startChangeDisplayName = function () {
            $('#confirm').modal('show');
        }

        self.notifyContactsAboutNameChange = function () {

            var contacts = _.keys(self.userTagMap());

            _.forEach(contacts, function (element) {
                jabber.sendCommand(element, 'update_display_name');
            });
        }

        self.showUsernamePolicyOptions = ko.computed(function () {
            return api.steam.hasClient() && !_.isEmpty(gEngineParams.steam.persona_name)
        });
        self.usernamePolicyDefinition = ko.computed(function () {
            var user = api.settings.definitions.user;
            var definition = user.settings.username_policy;
            return definition;
        });
        self.usernamePolicyOptions = ko.computed(function () {
            return _.map(self.usernamePolicyDefinition().options, function (element, index) {
                return {
                    value: element,
                    text: self.usernamePolicyDefinition().optionsText[index]
                };
            });
        });
        self.selectedNamePolicy = ko.observable(self.usernamePolicyOptions()[1].value);
        self.selectedNamePolicy.subscribe(function (value) {
            if (value === 'STEAM')
                self.newDisplayName(gEngineParams.steam.persona_name);
            else
                self.newDisplayName('');
        });
        self.lockDisplayName = ko.computed(function () {
           return self.selectedNamePolicy() === 'STEAM';
        });

        self.finishChangeDisplayName = function () {

            engine.asyncCall('ubernet.call', '/GameClient/UpdateUserTitleDisplayName?' + $.param({ DisplayName: self.newDisplayName() }), true)
                   .done(function (data) {
                       var result = JSON.parse(data);

                       if (result.Result === 'Success' && result.DisplayName) {
                           self.displayName(result.DisplayName);
                           api.Panel.message('game', 'display_name', { display_name: self.displayName() });

                           $('#confirm').modal('hide');

                           api.settings.set('user', 'username_policy', self.selectedNamePolicy(), false);
                           api.settings.save();

                           self.notifyContactsAboutNameChange();
                       }
                   })
                   .fail(function (data) {
                       var result = JSON.parse(data);

                       switch (result.ErrorCode) {
                           case 401: self.newDisplayNameError('Name is not available.'); break;
                           default: self.newDisplayNameError('Name is not valid.'); break;
                       }
                   });
        }

        self.jabberPresenceType = ko.observable('available').extend({ withPrevious: true });

        self.jabberPresenceType.subscribe(function (value) {
            if (!value)
                return;

            if (value === 'change_name') {
                self.startChangeDisplayName();
                _.defer(function () {
                    /* without the defer they widget will cycle between change_name and previous().
                       changing an observable within a subscription to the observable is 'tricky' and should be avoided if possible. */
                    self.jabberPresenceType(self.jabberPresenceType.previous());
                });
            }
            else
                jabber.presenceType(self.jabberPresenceType());

        });

        self.jabberPresenceStatus = ko.observable();
        self.jabberPresenceStatus.subscribe(function (value) {
            jabber.presenceStatus(self.jabberPresenceStatus());
        });

        self.requestUbernetUsers = function () {
            self.maybeConvertFriends();

            var contacts = _.reject(_.keys(self.userTagMap()), function (element) {
                return isNaN(element);
            });
            var results = _.map(contacts, function (element) {
                return new UserViewModel(element);
            });

            self.users(results);
        };

        self.optimiseUserTagMap = function() {

        	var interaction_time_map = self.idToInteractionTimeMap();
            var now = Date.now();

            var optimised = _.transform(self.userTagMap(), function(result, value, key, object) {

                var lastInteraction = interaction_time_map[ key ];

// keep friends, pending friends, chats and any searches or contacts within last 30 days

        		if (value.FRIEND || value.PENDING_FRIEND || value.ALLOW_CHAT || ( lastInteraction && (now - lastInteraction) < 30 * 24 * 60 * 60 * 1000)) {
        			result[ key ] = value;
        		}

                return result;
            }, {});

            self.userTagMap( optimised );
        };
        
        var hasUserTagMap = false;
        self.userTagMap.subscribe(function (value) {
            if (!hasUserTagMap && _.isObject(value) && !_.isEmpty(value)) {
                hasUserTagMap = true;
                self.optimiseUserTagMap();
                self.requestUbernetUsers();
            }
        });

        self.onPresence = function (uberid, presence_type, presence_status) {
            if (presence_type && presence_type !== 'undefined') {
                self.idToJabberPresenceTypeMap()[uberid] = presence_type;
                self.idToJabberPresenceTypeMap.valueHasMutated();
            }

            if (presence_status && presence_status !== 'undefined') {
                self.idToJabberPresenceStatusMap()[uberid] = presence_status;
                self.idToJabberPresenceStatusMap.valueHasMutated();
            }
        }

        self.onMessage = function (uberid, message) {
            var contact = self.idToContactMap()[uberid];
            if (!contact || !contact.allowChat())
                return;

            self.startConversationsWith(uberid, message);
        }

        self.onCommand = function (uberid, command) {
            self.maybeCreateNewContactWithId(uberid)
            var type = command.message_type;
            var contact = self.idToContactMap()[uberid];
            switch (type) {
                case 'update_display_name': contact.requestUserName(); break;
                case 'chat_invite': self.maybeAddChatInvite(uberid, command); break;
                case 'accept_chat_invite': contact.acceptChatInvite(); break;
                case 'decline_chat_invite': contact.declineChatInvite(); break;
                case 'friend_request': self.maybeAddFriendRequest(uberid, command); break;
                case 'accept_friend_request': contact.acceptFriendRequest(); break;
                case 'decline_friend_request': contact.declineFriendRequest(); break;
                case 'unfriend': contact.unfriend(); break;
                case 'game_invite': self.maybeAddGameInvite(uberid, command); break;
                case 'accept_game_invite':
                    if (self.hasSentInviteTo(uberid)){
                        self.confirmedInvites.push(uberid);
                        if (self.readyToSendLobbyInfo())
                            jabber.sendCommand(uberid, 'game_lobby_info', model.lobbyInfo());
                    }
                    break;
                case 'decline_game_invite':
                    delete model.pendingGameInvites()[uberid];
                    break;
                case 'game_lobby_info':
                    if (model.acceptedGameInviteFrom() === uberid) {
                        model.acceptedGameInviteFrom('');
                        self.maybeJoinGameLobby(command.payload);
                    }
                    break;
            }
        }

        self.selectedContact = ko.observable();
        self.contextMenuForContact = function (data, event) {
            self.selectedContact(data);
            $("#contextMenu").css({
                display: "block",
                left: event.pageX,
                top: event.pageY
            });
        }

        self.hideContextMenu = function() {
            var menu = $("#contextMenu");
            if (menu)
                menu.hide();
        }

        var missingContent = ko.observable();
        self.maybeJoinGameLobby = function(payload)
        {
            if (payload && !_.isEmpty(payload.content))
            {
                if (!api.content.getInfo(payload.content).owned)
                {
                    missingContent(payload.content);
                    $('#buyContent').modal('show');
                    return;
                }
            }
            api.Panel.message('game', 'join_lobby', payload);
        }

        self.missingContentDescription = function() {
            return api.content.getInfo(missingContent()).description;
        }

        self.buyMissingContent = function() {
            api.Panel.message('game', 'navigate_to', 'coui://ui/main/game/armory/armory.html?action=buy_content&content=' + missingContent());
        };

        self.showUserDetails = ko.observable(false);

        self.hasJabber = ko.observable(false);
        self.showUberBar = ko.observable(true);
        
        self.init = function() {
            jabber.setPresenceHandler(model.onPresence);
            jabber.setMsgHandler(model.onMessage);
            jabber.setCommandHandler(model.onCommand);
            model.hasJabber(true);
            onUbernetLogin();
        };

        self.setup = function () {

            $( window ).on('beforeunload', function() {
                if (jabber && jabber.connected()) {
                    jabber.disconnect( 'beforeunload' );
                }
                return '';
            });

            var restoreJabber = ko.observable().extend({ session: 'restore_jabber' });
            if (restoreJabber()) {
                self.init();
            }
        }
    }
    model = new SocialViewModel();

    handlers = {};

    handlers.jabber_authentication = function (payload) {
        initJabber(payload);
        model.init();
    }

    handlers.uberbar_identifiers = function (payload) {
        model.uberId(payload.uber_id);
        model.uberName(payload.uber_name);
        model.displayName(payload.display_name);
    }

    handlers.lobby_info = function (payload) {
        // allow invites to any server except localhost
        if ( payload.game_hostname == 'localhost' )
            payload = false;
        model.lobbyInfo(payload);
    }

    handlers.lobby_empty_slots = function (payload) {
        model.lobbyEmptySlots(payload.slots);
    }

    handlers.visible = function (payload) {
        if (_.has(payload, 'value'))
            model.showUberBar(!!payload.value);
        return model.showUberBar() && model.hasJabber();
    }

    handlers.lobby_contacts = function (payload) {
        _.forEach(payload, model.maybeCreateNewContactWithId);
    }

    handlers.request_friends = function () {
        api.Panel.message('game', 'friends', model.sortedFriendUberIds());
    }

    handlers.request_blocked = function () {
        api.Panel.message('game', 'blocked');
    }

    // inject per scene mods
    if (scene_mod_list['uberbar'])
        loadMods(scene_mod_list['uberbar']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();
});

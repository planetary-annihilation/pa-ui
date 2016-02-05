var model;
var handlers;

$(document).ready(function () {

    function SocialViewModel() {
        var self = this;
        var contact_limit = 40;

        self.uberName = ko.observable().extend({ local: 'uberName' });
        self.displayName = ko.observable('').extend({ session: 'displayName' });
        self.uberId = ko.observable('').extend({ session: 'uberId' });

        self.selectedIndex = ko.observable();

        /* contact : { UberName: '', FriendUberId: '', LastGame: UST }*/
        self.localRecentContacts = ko.observableArray([]).extend({ local: 'recentContacts' });
        self.approvedFriends = ko.observableArray([]).extend({ local: 'approvedFriends' });
        self.blockedFriends = ko.observableArray([]).extend({ local: 'blockedFriends' });

        self.ubernetFriends = ko.observableArray([]);
        self.tagFilteredFriends = ko.observableArray([]);

        self.refreshingFriendsList = ko.observable(false);
        self.allTags = ko.observableArray([]);

        self.showFriendPane = ko.observable(false);
        self.friendPaneState = ko.observable('');

        self.friendPaneName = ko.observable();
        self.friendPaneNickname = ko.observable();
        self.friendPaneUberId = ko.observable();
        self.friendPaneEmail = ko.observable();
        self.friendPaneTag = ko.observable();

        //self.filterContacts = function () {
        //    var time = (new Date()).getTime();
        //    var sorted = _.sortBy(self.contacts(), function (element) {
        //        return time - element.lastGame;
        //    });
        //    sorted.length = (sorted.length > contact_limit) ? contact_limit : sorted.length;

        //    self.contacts(sorted);
        //}
        //self.filterContacts();

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        self.moveUserToApproved = function (uberid) {
            var friendIdx = self.ubernetFriends().map(function (e) { return e.FriendUberId }).indexOf(uberid);

            if (friendIdx === -1) {
                self.addFriendTag(uberid, null, '_approved');
            }
            else {
                var tags = self.ubernetFriends()[friendIdx].Tags;
                tags.push('_approved');
                var idx = tags.indexOf('_blocked');
                if (idx != -1)
                    tags.splice(idx, 1);
                self.setFriendTags(uberid, tags);
            }
            self.selectedIndex(-1);
        }

        self.moveUserToBlocked = function (uberid) {
            var friendIdx = self.ubernetFriends().map(function (e) { return e.FriendUberId }).indexOf(uberid);

            if (friendIdx === -1) {
                self.addFriendTag(uberid, null, '_blocked');
            }
            else {
                var tags = self.ubernetFriends()[friendIdx].Tags;
                tags.push('_blocked');
                var idx = tags.indexOf('_approved');
                if(idx != -1)
                    tags.splice(idx, 1);
                self.setFriendTags(uberid, tags);
            }
            self.selectedIndex(-1);
        }

        self.removeFromApproved = function (uberid) {
            self.removeFriendTag(uberid, '_approved');
            self.selectedIndex(-1);
        }

        self.removeFromBlocked = function (uberid) {
            self.removeFriendTag(uberid, '_blocked');
            self.selectedIndex(-1);
        }

        self.navBack = function () {
            if (self.lastSceneUrl()) {
                engine.call('pop_mouse_constraint_flag');
                window.location.href = self.lastSceneUrl();
                return; /* window.location.href will not stop execution. */
            }
            else {
                api.debug.log('lastSceneUrl invalid');
            }
        };

        self.getFriends = function () {
            self.refreshingFriendsList(true);
            var call = engine.asyncCall("ubernet.getFriends", false);

            call.done(function (data) {
                data = JSON.parse(data);
                

                self.allTags([{ id: '_all', display: 'All' }]);
                for (i = 0; i < data.length; i++) {
                    var tags = data[i].Tags;
                    for (j = 0; j < tags.length; j++)
                    {
                        var tag = tags[j];
                        var display;
                        if (tag.charAt(0) === '_') {
                            display = tag.substr(1);
                        }
                        else
                            display = tag;

                        if (self.allTags().map(function(e) {return e.id;}).indexOf(tag) != -1)
                            continue;

                        self.allTags.push({ id: tag, display: display});
                    }
                }

                self.ubernetFriends(data);
                self.updateFilteredLists();
                self.refreshingFriendsList(false);

            });
            call.fail(function (data) {
                self.refreshingFriendsList(false);
            });
        }

        self.updateFilteredLists = function () {
            self.ubernetFriends(_.sortBy(self.ubernetFriends(), function (e) { return e.ModifiedDisplayName; }));

            var tag;
            if (!$('#tag_select')[0].value || $('#tag_select')[0].value == "_all") {
                self.tagFilteredFriends(self.ubernetFriends());
            }
            else{
                tag = $('#tag_select')[0].value;
                self.tagFilteredFriends(self.ubernetFriends().filter(function (e) { return e.Tags.indexOf(tag) != -1; }));
            }


            var tag = '_blocked'
            self.blockedFriends(self.ubernetFriends().filter(function (e) { return e.Tags.indexOf(tag) != -1; }));

            var tag = '_approved'
            self.approvedFriends(self.ubernetFriends().filter(function (e) { return e.Tags.indexOf(tag) != -1; }));

            self.tagFilteredFriends(_.sortBy(self.tagFilteredFriends(), function (e) { return e.ModifiedDisplayName; }));
            self.blockedFriends(_.sortBy(self.blockedFriends(), function (e) { return e.ModifiedDisplayName; }));
            self.approvedFriends(_.sortBy(self.approvedFriends(), function (e) { return e.ModifiedDisplayName; }));

            self.allTags(_.sortBy(self.allTags(), function (e) { return e.id.toLowerCase(); }));

        }

        self.renameFriend = function (uberid, nickname) {

            self.friendPaneState('pending');
            var renameFriendRequest = {
                FriendUberId: uberid,
                NewName: nickname
            };

            var call = engine.asyncCall("ubernet.renameFriend", JSON.stringify(renameFriendRequest));

            call.done(function (data) {
                data = JSON.parse(data);
                self.friendPaneState('updateSucceeded');
            });
            call.fail(function (data) {
                self.friendPaneState('updateFailed');
            });
        }

        // A note about UberFriends and tags. The UberNet contact doen't not have a notion about a fixed contact list where someone is either a friend or they are not.
        // Rather it tracks tags that you have applied to other players. If you have ever tagged a player, then they are a de-facto member of your contact list. 
        // Conversely, if you remove all tags for a player, then they are removed from your friends list. To replicate the bahvior of a more traditional friends list
        // a simple catch-all tag ('PA') is applied to all users whom you want to be 'just friends'.
        self.hideAddFriendPane = function () {
            self.getFriends();
            self.showFriendPane(false);
            self.friendPaneName(null);
            self.friendPaneNickname(null);
            self.friendPaneUberId(null);
            self.friendPaneEmail(null);
            self.friendPaneTag(null);
            self.friendPaneState('');
        }

        self.addFriend = function () {
            self.friendPaneState('addFriend');
            self.showFriendPane(true);
        }

        self.addFriendTag = function (uberid, ubername, tag) {
            self.friendPaneState('pending');

            var tags = new Array;
            tags.push('PA');
            if (tag)
                tags.push(tag);

            var addFriendTagRequest = {
                FriendUberId: uberid,
                FriendString: ubername,
                Tags: tags
            };

            var call = engine.asyncCall("ubernet.addFriendTag", JSON.stringify(addFriendTagRequest));

            call.done(function (data) {
                data = JSON.parse(data);
                self.friendPaneState('updateSucceeded');
            });
            call.fail(function (data) {
                self.friendPaneState('updateFailed');
            });
        }

        // remove friend <-> remove all tags
        self.removeFriendByUberId = function (uberId) {
            var friend = $.grep(self.ubernetFriends(), function (e) { return e.FriendUberId === uberId; });
            if (friend.length == 0)
                return;

            var removeFriendRequest = {
                FriendUberId: friend[0].FriendUberId,
                Tags: friend[0].Tags,
            }

            var call = engine.asyncCall("ubernet.removeFriendTag", JSON.stringify(removeFriendRequest));

            call.done(function (data) {
                data = JSON.parse(data);
                // an immediate getFriends might not be updated (without consistent reads) so slice them locally
                var removeIndex = self.ubernetFriends().map(function (e) { return e.FriendUberId; }).indexOf(uberId);
                self.ubernetFriends().splice(removeIndex, 1);
                self.updateFilteredLists();
            });
            call.fail(function (data) {
            });
        }

        self.removeFriendTag = function (uberid, tag) {
            var removeFriendTagRequest = {
                FriendUberId: uberid,
                Tags: [tag]
            };

            var call = engine.asyncCall("ubernet.removeFriendTag", JSON.stringify(removeFriendTagRequest));

            call.done(function (data) {
                data = JSON.parse(data);
                self.getFriends();
            });
            call.fail(function (data) {
            });
        }

        self.setFriendTags = function (uberid, tags) {
            var setFriendTagsRequest = {
                FriendUberId: uberid,
                Tags: tags
            };

            var call = engine.asyncCall("ubernet.setFriendTags", JSON.stringify(setFriendTagsRequest));

            call.done(function (data) {
                data = JSON.parse(data);
                self.getFriends();
            });
            call.fail(function (data) {
            });
        }
    }
    model = new SocialViewModel();

    handlers = {};
    handlers.update_beacon = function () { /* do nothing */ }

    // inject per scene mods
    if (scene_mod_list['social'])
        loadMods(scene_mod_list['social']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);



    $(function () { $("#social_tabs").tabs() });

    // Activates knockout.js
    ko.applyBindings(model);

    model.getFriends();
});

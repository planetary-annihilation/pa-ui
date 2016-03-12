var SPLASH_DELAY_SECONDS = 2.0;

if ( ! scene_mod_list.start ) {
    scene_mod_list.start = [];
}

$(document).ready(function () {
    engine.call('game.debug.menuDocumentReady');

    // Load videos
    $("#ubervideo .ytv-wrapper").ytv({
        channelId: 'UCcNE9TRcOCOoOB0Dy5ediPg',
        playlist: 'PLi9lQ-P6lhoNVScIK8m-6BtBQzc7x7HMQ',
        controls: false,
        annotations: false
    });

    // the check 'data_storage_model'
    if (!localStorage['data_storage_model'] || localStorage['data_storage_model'] != '2.0') {

        if (localStorage['data_storage_model'] != '1.0')
            localStorage.clear();
        else
            cleanupLegacyStorage();

        localStorage['data_storage_model'] = '2.0';
    }
    if (!localStorage['planet_storage_model'] || localStorage['planet_storage_model'] != '1.0') {
        //clear old format
        localStorage.setItem('planets', encode([]));
        localStorage.setItem('systems', encode([]));
        localStorage.setItem('planet_storage_model', '1.0');
    }

    function OneTimePopup(name, filter) {
        var self = this;

        var showPopup = ko.observable(true).extend({ local: 'do_show_notice_' + name + '_popup' });

        self.display = ko.observable(false);
        self.dismiss = function () {
            self.display(false);
        }

        self.setup = function() {
            if (showPopup() && filter())
            {
                self.display(true);
                showPopup(false);
            }
        };
    };

    function AccountCreationPopup() {
        var self = this;

        var messageUserNameInUse = loc('!LOC:Username already in use.');
        var messageUserNameLengthInvalid = loc('!LOC:UserName must be between 3 and 20 characters.');
        var messageEmailInUse = loc('!LOC:Email already in use.');
        var messageEmailInvalid = loc('!LOC:Email is invalid');
        var messagePasswordsDoNotMatch = loc('!LOC:Passwords do not match.');
        var messagePasswordLengthInvalid = loc('!LOC:Password must be between 6 and 20 characters.');

        var messageInvalidCode = loc('!LOC:The entered code was invalid.');
        var messageTitleAlreadyActivated = loc('!LOC:This account already owns this title.');
        var messageCodeAlreadyUsed = loc('!LOC:The entered code has already been used.');
        var messageCodeConvertedToSteam = loc('!LOC:The entered code has already been converted to a steam key.');

        self.username = ko.observable();
        self.email = ko.observable();
        self.password = ko.observable();
        self.confirmPassword = ko.observable();
        self.key = ko.observable();

        self.usernameError = ko.observable('');
        self.emailError = ko.observable('');
        self.passwordError = ko.observable('');
        self.passwordConfirmError = ko.observable('');
        self.keyError = ko.observable('');
        self.unknownError = ko.observable('');

        self.playfabError = ko.observable('');

        self.waitingForResult = ko.observable(false);
        self.accountCreated = ko.observable(false);
        self.accountAuthorized = ko.observable(false);
        self.accountAlreadyExisted = ko.observable(false);

        self.authorizeExistingAccount = function (username) {
            self.username(username);
            self.accountCreated(true);
            self.accountAuthorized(false);
            self.accountAlreadyExisted(true);
        }

        self.successMessage = ko.observable('');

        self.inputIsValid = ko.computed(function () {

            if (self.accountCreated())
                return !!self.key();

            if (!self.username() || !self.email() || !self.password() || !self.confirmPassword() || !self.key())
                return false;

            if (self.username().length < 3 || self.username().length > 30) {
                self.usernameError(messageUserNameLengthInvalid);
                return false;
            }
            else
                self.usernameError('');

            if (self.password() !== self.confirmPassword()) {
                self.passwordConfirmError(messagePasswordsDoNotMatch);
                return false;
            }
            else
                self.passwordConfirmError('');

            if (self.password().length < 6 || self.password().length > 30) {
                self.passwordError(messagePasswordLengthInvalid);
                return false;
            }
            else
                self.passwordError('');

            return true;
        });

        self.processErrors = function (errors) {
            self.playfabError('');

            var email = errors.Email && errors.Email[0];
            var username = errors.UserName && errors.UserName[0];

            if (email) {
                if (email === 'Email is not vaild.')
                    self.playfabError(messageEmailInvalid);
                else if (email === "Email address already exists. ")
                    self.playfabError(messageEmailInUse);
                else
                    self.playfabError(email);
            }
            else if (username) {
                if (username === 'User name already exists.')
                    self.playfabError(messageUserNameInUse);
                else
                    self.playfabError(username);
            }
        };

        self.next = function () {
            if (self.waitingForResult())
                return;

            self.playfabError('');
            self.waitingForResult(true);

            if (self.accountCreated())
                self.redeemKey();
            else
                self.createAccount();
        }

        self.createAccount = function () {
            engine.asyncCall("ubernet.createUberNetAccount",
                     String(self.username()),
                     String(self.email()),
                     String(self.password()),
                     String(self.confirmPassword()))
            .done(function (data) {
                var result = parse(data);
                if (result.Errors) {
                    self.processErrors(result.Errors);
                    return;
                }

                self.accountCreated(true);
                self.redeemKey();
            })
            .fail(function (data) {
                console.error('createUberNetAccount fail');
                console.error(data);

                var result = parse(data);
                if (result.Errors) {
                    self.processErrors(result.Errors);
                    return;
                }
            })
            .always(function () {
                self.waitingForResult(false);
            });
        };

        self.redeemKey = function () {

            var activationSuccess = function () {
                self.accountAuthorized(true);
                self.successMessage(loc('!LOC:Your username is: __username__', { username: self.username() }));
                model.uberName(self.username());
                model.password(self.password());
                model.authenticateWithUberNetLogin();
            };

            var activationError = function (error) {
                switch (error) {
                    case 'InvalidActivationCode':
                        self.playfabError(messageInvalidCode);
                        break;
                    case 'TitleAlreadyActivatedForUser':
                        self.playfabError(messageTitleAlreadyActivated);
                        break;
                    case 'ActivationCodeAlreadyUsed':
                        self.playfabError(messageCodeAlreadyUsed);
                        break;
                    case 'ActivationCodeConvertedToSteamKey':
                        self.playfabError(messageCodeConvertedToSteam);
                        break;
                }
            }

            var call = engine.asyncCall("ubernet.activateTitle", String(self.key()));
            call.done(function (data) {
                data = parse(data);
                if (data === 'Success')
                    activationSuccess();
                else
                    activationError(data);
            });
            call.fail(function (data) {
                console.error('activateTitle : fail');
                console.error(data);
                data = parse(data);

                if (!data)
                    return;

                data = parse(data);
            });
        }
    }

    function LoginViewModel() {
        var self = this;

        self.showTutorialPopup = ko.observable(false);
        self.doShowTutorialPopup = ko.observable(true).extend({ local: 'do_show_tutorial_popup' });

        self.maybeShowTutorialPopup = function () {

            if (!api.content.usingTitans())
                return false;

            if (self.doShowTutorialPopup()) {
                self.showTutorialPopup(true);
                self.doShowTutorialPopup(false);
                self.showSinglePlayerMenu(false);
                self.showMultiplayerMenu(false);
                return true;
            }

            return false;
        }

        self.doShowTutorialContinuePopup = ko.observable(false);
        self.showTutorialContinuePopup = ko.observable(false);
        var showTutorialContinuePopupRule = ko.computed(function () {
            var recent = SaveGameUtility.mostRecentGame();
            if (recent && recent.name === "Tutorial")
                self.doShowTutorialContinuePopup(true);
        });

        self.startTutorialOrShowPopup = function () {
            self.doShowTutorialPopup(false);
            if (!self.doShowTutorialContinuePopup())
                TutorialUtility.startTutorial();
            else
                self.showTutorialContinuePopup(true);
        };

        self.showRedirectToNewAppid = ko.observable(false);
        self.oneTimePopups = {
            titans_gift:          new OneTimePopup('titans_gift',   function() { return api.content.titansWasKSGift() && (!api.steam.hasClient() || api.content.usingTitans()); }),
            titans_gift_on_steam: new OneTimePopup('titans_gift',   function() { return api.content.titansWasKSGift() && api.steam.hasClient() && !api.content.usingTitans(); }),
            titans_upsell:        new OneTimePopup('titans_upsell', function() { return !api.content.ownsTitans() && (!api.steam.hasClient() || !api.steam.accountOwnsTitans()); }),
        };

        self.showCreateUbernetAccountPopup = ko.observable(false);
        self.accountCreationPopup = new AccountCreationPopup();
        self.openAccountCreationPopup = function () {
            self.showCreateUbernetAccountPopup(true);
        };
        self.closeAccountCreationPopup = function () {
            self.showCreateUbernetAccountPopup(false);
        };

        self.openTitleActivationPopup = function () {
            self.accountCreationPopup.authorizeExistingAccount(self.uberName());
            self.showCreateUbernetAccountPopup(true);
        };
        
        self.fullUpdate = ko.observable(false);
        self.fullUpdateText = ko.computed(function () {
            return loc(self.fullUpdate() ? '!LOC:Minimize' : '!LOC:View full column');
        });
        self.toggleFullUpdate = function () {
            self.fullUpdate(!self.fullUpdate());
        };

        self.hasCmdLineTicket = ko.observable(false);
        self.pageMessage = ko.observable();

        self.isSteamClientOnline = ko.observable().extend({ session: 'is_steam_client_online' });
        self.useSteam = ko.computed(function () {
            return api.steam.hasClient() && self.isSteamClientOnline();
        });
        self.notUsingSteam = ko.computed(function () {
            return !self.useSteam();
        });
        self.allowMicroTransactions = ko.observable().extend({ session: 'allow_micro_transactions' });

        self.displayMode = ko.observable().extend({ session: 'display_mode' });

        self.readyToLogin = ko.observable(false);
        self.modeArray = ['startup', 'sign-in', 'ready']
        self.mode = ko.observable(0).extend({ session: 'start_mode' });

        self.hasSetupInfo = ko.observable().extend({ session: 'has_setup_info' });
        self.uiOptions = ko.observable({}).extend({ session: 'ui_options' });

        self.modeString = ko.computed(function () { return self.modeArray[self.mode()]; });
        self.showingSignIn = ko.computed(function () { return self.mode() === 1 && !self.useSteam() && !self.hasCmdLineTicket(); });
        self.showingReady = ko.computed(function () { return self.mode() === 2; });
        self.hasEverSignedIn = ko.observable(false).extend({ local: 'has_ever_signed_in' });
        self.showFirstTimeSignIn = ko.observable(false);
        self.startFirstSignIn = function () {
            self.showFirstTimeSignIn(true);
        };

        self.ajaxCallsInFlight = ko.observable(0);
        self.waitingForAjax = ko.computed(function () { return self.ajaxCallsInFlight() > 0; });

        self.usernameError = ko.observable('');
        self.emailError = ko.observable('');
        self.passwordError = ko.observable('');

        self.introVideoComplete = function() {
            engine.call('audio.pauseMusic', false);
        };

        self.inRegionSetup = ko.observable(false);

        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });
        self.nextSceneUrl = ko.observable().extend({ session: 'next_scene_url' });

        self.passwordConfirm = ko.observable('');

        self.isLocalGame = ko.observable(false).extend({ session: 'isLocalGame' });

        self.commanderImageLoadedClass = ko.observable();
        var hasLoadedImage = false;

        self.loadPreferredCommanderImage = function() {
            hasLoadedImage = true;

            if (!self.preferredCommander())
            {
                self.preferredCommanderImage(null);
            }

            self.preferredCommanderImage(CommanderUtility.bySpec.getImage(self.preferredCommander()));
        };

        self.preferredCommander = ko.observable().extend({ local: 'preferredCommander_v2' });
        self.preferredCommanderImage = ko.observable();

        self.hasEverSelectedCommander = ko.observable().extend({ local: 'hasEverSelectedCommander_v2' });
        self.commanderImgList = ['coui://ui/main/shared/img/commanders/img_imperial_theta.png'
                                    , 'coui://ui/main/shared/img/commanders/img_raptor_nemicus.png'
                                    , 'coui://ui/main/shared/img/commanders/img_quad_osiris.png'
                                    , 'coui://ui/main/shared/img/commanders/img_tank_aeson.png'
                                    , 'coui://ui/main/shared/img/commanders/img_raptor_rallus.png'
                                    , 'coui://ui/main/shared/img/commanders/img_raptor_centurion.png'];
        self.commanderImgList = _.shuffle(self.commanderImgList);

        self.commanderImg = ko.computed(function() {
            if (!self.preferredCommanderImage() && !hasLoadedImage) {
                return null;
            }

            var image = self.preferredCommanderImage() || self.commanderImgList[0];
            self.commanderImageLoadedClass("loaded");
            return image;
        });

        CommanderUtility.afterCommandersLoaded(function() {
            self.loadPreferredCommanderImage();
        });

        self.lobbyId = ko.observable();
        self.reconnectContent = ko.observable();
        self.gameTicket = ko.observable('').extend({ session: 'gameTicket' });
        self.gameHostname = ko.observable().extend({ session: 'gameHostname' });
        self.gamePort = ko.observable().extend({ session: 'gamePort' });

        self.password = ko.observable('');
        self.uberName = ko.observable('').extend({ local: 'uberName' });
        self.uberUserInfo = ko.observable({}).extend({ session: 'uberUserInfo' });
        self.userTitleData = ko.observable({}).extend({ session: 'uberTitleInfo' });
        var userTitleDataRule = ko.computed(function () {
            var user_info = self.uberUserInfo();

            if (user_info && user_info.UserTitleData)
                self.userTitleData(user_info.UserTitleData);
        });

        self.uberId = api.net.uberId;

        self.displayName = ko.observable('').extend({ session: 'displayName' });
        self.displayNameRule = ko.computed(function () {
            var userInfo = self.uberUserInfo();
            var bestName = self.uberName();

            if (!_.isEmpty(userInfo)) {
                if (userInfo.TitleDisplayName)
                    bestName = userInfo.TitleDisplayName;
                else if (self.userTitleData() && self.userTitleData().DisplayName)
                    bestName = self.userTitleData().DisplayName
                else if (userInfo.DisplayName)
                    bestName = userInfo.DisplayName;
                else if (userInfo.UberName)
                    bestName = userInfo.UberName;
            }

            self.displayName(bestName);
        });

        self.uberbarIdentifiers = ko.computed(function () {
            return {
                'uber_id': self.uberId(),
                'uber_name': self.uberName(),
                'display_name': self.displayName()
            }
        });
        self.uberbarIdentifiers.subscribe(function () {
            api.Panel.message('uberbar', 'uberbar_identifiers', self.uberbarIdentifiers());
        });

        self.playerRatingInfo = ko.observable({}).extend({ session: 'playerRatingInfo' });
        self.league = ko.computed(function() {
            var league = self.playerRatingInfo().Rating;
            if (!league)
                league = '';
            return league;
        });
        self.leagueSrc = ko.computed(function () {
            return MatchmakingUtility.getSmallBadgeURL(self.league());
        });
        self.largeleagueSrc = ko.computed(function () {
            return MatchmakingUtility.getBadgeURL(self.league());
        });
        self.leagueText = ko.computed(function () {
            var level = MatchmakingUtility.getLevel(self.league());
            if (level < 0)
                return '';
            if (level === 0)
                return '!LOC:You must have played 5 ranked games to receive a rank';

            return loc('!LOC:__rank_title__ Rank', { rank_title: MatchmakingUtility.getTitle(self.league()) });
        });

        self.jabberToken = ko.observable().extend({ session: 'jabberToken' });

        self.buildVersion = ko.observable().extend({ session: 'build_version' });
        self.ubernetBuildVersion = ko.observable().extend({ session: 'ubernet_build_version' });
        self.buildNeedsUpdate = ko.pureComputed(function () {
            if (DEV_MODE)
                return false;
            if (!self.ubernetBuildVersion() || !self.buildVersion())
                return false;

            function getBranch(build)
            {
                var branchIndex = build.indexOf('-');
                if (branchIndex >= 0)
                    return build.substring(branchIndex);
                return '';
            }

            if (getBranch(self.buildVersion()) !== getBranch(self.ubernetBuildVersion()))
                return false;

            return self.buildVersion() < self.ubernetBuildVersion();
        });

        self.videoToPlayFullScreen = ko.observable('');

        self.videoToPlayAutoplay = ko.observable(false);
        self.videoAutoplayString = ko.computed(function () {
            return self.videoToPlayAutoplay() ? '1' : '0';
        });

        self.videoToPlayFullScreenIframeSource = ko.computed(function () {
            return 'http://www.youtube.com/embed/' + self.videoToPlayFullScreen() + '?modestbranding=1&amp;rel=0&amp;autoplay='
                    + self.videoAutoplayString() + '&amp;showinfo=0&amp;controls=0&amp;HD=1;vq=hd1080';
        });
        self.videoTitleFullScreen = ko.observable('Planetary Annihilation');
        self.videoLaunchExternal = function () {
            api.youtube.launchPage(self.videoToPlayFullScreen());
        }

        self.os = ko.observable('').extend({ session: 'os' });
        self.uberNetRegion = ko.observable().extend({ local: 'uber_net_region' });
        self.selectedUberNetRegion = ko.observable();
        self.uberNetRegions = ko.observableArray().extend({ session: 'uber_net_regions' });
        self.hasUberNetRegion = ko.computed(function () { return self.uberNetRegions().length ? true : false; });
        self.redirectToServer = ko.observable(false);
        self.redirectToReplay = ko.observable(false);
        self.redirectToCustomGame = ko.observable(false);
        self.redirectToGalacticWar = ko.observable(false);
        self.redirectToAISkirmish = ko.observable(false);
        self.redirectToMatchMaking = ko.observable(true);

        self.lastNewsSeen = ko.observable(0).extend({ local: 'lastNewsSeen' });

        self.useUbernetdev = ko.observable(false).extend({ session: 'use_ubernetdev' });

        self.localServerAvailable = ko.observable().extend({ session: 'local_server_available' });
        self.localServerRecommended = ko.observable().extend({ session: 'local_server_recommended' });
        self.localServerSetting = ko.observable().extend({ setting: { group: 'server', key: 'local' } });
        self.useLocalServer = ko.observable().extend({ session: 'use_local_server' });
        var useLocalServerRule = ko.computed(function () {
            if (!self.localServerAvailable())
                return false;
            var setting = self.localServerSetting();
            if (setting === 'OFF')
                return false;
            if (setting === 'ON')
                return true;
            return self.localServerRecommended();
        });
        useLocalServerRule.subscribe(self.useLocalServer);
        self.useLocalServer(useLocalServerRule());

        self.aiSkirmish = ko.observable().extend({ session: 'ai_skirmish' });

        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });

        self.jabberAuthentication = ko.computed(function () {
            return {
                'uber_id': self.uberId(),
                'jabber_token': self.jabberToken(),
                'use_ubernetdev': self.useUbernetdev()
            };
        });
        self.resetJabber = (function () {
            var previous = {};

            return function (value) {
                if (!self.uberId() || !self.jabberToken() || JSON.stringify(value) === JSON.stringify(previous))
                    return;

                previous = value;
                api.Panel.message('uberbar', 'jabber_authentication', self.jabberAuthentication());
            }
        })();

        self.jabberAuthentication.subscribe(self.resetJabber);

        self.showConnecting = ko.observable(false);
        self.showReconnect = ko.observable(false);
        self.showError = ko.observable(false);

        self.showNewBuild = ko.observable(false);

        self.signalRecompute = ko.observable();
        self.welcomeVideoId = ko.observable('PgVIMcFlWvQ'); // old: vGGCeWLlFFI, wrHcJpGxcK4
        self.helpVideoId = ko.observable('1zedpeYS0_s'); //old: DGW5Nmwyeqc //new: E7Zp32Nlu7Q //newest: http://youtu.be/
        self.showHelpVideo = ko.observable(false);
        self.showVideoFromList = ko.observable(false);
        self.currentVideoId = ko.computed(function () { return (self.showHelpVideo()) ? self.helpVideoId() : self.welcomeVideoId() });

        self.videoDialogHeight = ko.computed(function () {
            self.signalRecompute(); /* create dependency */
            return window.innerHeight - 10;
        });
        self.videoDialogWidth = ko.computed(function () {
            self.signalRecompute(); /* create dependency */
            return window.innerWidth - 10;
        });
        self.videoHeight = ko.computed(function () {
            self.signalRecompute(); /* create dependency */
            return window.innerHeight - 230;
        });
        self.videoWidth = ko.computed(function () {
            self.signalRecompute(); /* create dependency */
            return window.innerWidth - 200;
        });

        self.isUberNetRegionAvailable = ko.computed(function () {
            var i;

            for (i = 0; i < self.uberNetRegions().length ; i++)
                if (self.uberNetRegions()[i].Name === self.uberNetRegion())
                    return true;

            return false;
        });

        self.showUberNetGames = ko.computed(function () {
            return self.hasUberNetRegion();
        });

        self.allowUbernetActions = ko.computed(function () {
            return self.uberId().length > 0;
        });

        self.allowNewOrJoinGame = ko.computed(function () {
            return self.allowUbernetActions() || self.useLocalServer();
        });

        self.videoLoaded = ko.observable(false);

        self.graphicsVendor = ko.observable().extend({ session: 'graphics_vendor' });

        var steamID = ko.pureComputed(function() {
            if (!self.useSteam())
                return null;
            var steamID = _.get(gEngineParams, ['steam', 'steamid']);
            if (!_.isString(steamID) || _.isEmpty(steamID))
                return null;
            return steamID;
        });

        self.gogId = ko.observable().extend({ session: 'gog_id' });
        self.gogPersonaName = ko.observable().extend({ session: 'gog_persona_name' });

        self.canCreateAnonymousAccount = ko.pureComputed(function () {
            return !_.isEmpty(steamID());
        });

        var updateSteamName = function(deferred, suffix)
        {
            var name = gEngineParams.steam.persona_name;
            if (suffix)
                name += ' (' +  suffix + ')';
            else
                suffix = 0;

            var retry = function() {
                if (suffix >= 99)
                    return false;

                console.warn("Name " + name + " taken. Trying another one.");
                suffix += 1;
                updateSteamName(deferred, suffix);

                return true;
            };

            engine.asyncCall('ubernet.call', '/GameClient/UpdateUserTitleDisplayName?' +  $.param({ DisplayName: name }), true)
                .done(function(data) {
                    var result = null;
                    try {
                        result = JSON.parse(data);
                    } catch (e) {
                        console.error("Unable to parse UpdateUserTitleDisplayName result: " + data);
                    }

                    if (!result || result.Result !== 'Success' || result.DisplayName !== name)
                    {
                        if (!result || !retry())
                        {
                            console.error("Failed to update display name to match Steam name (" + gEngineParams.steam.persona_name + "): " + data);
                            deferred.resolve();
                        }
                    }
                    else
                    {
                        self.displayName(result.DisplayName);
                        deferred.resolve();
                    }
                })
                .fail(function(data) {
                    var handled = false;
                    if (!_.isEmpty(data))
                    {
                        try {
                            var result = JSON.parse(data);
                            if (result && result.ErrorCode == 401 && result.Message === "NameNotAvailable")
                            {
                                handled = retry();
                            }
                        } catch (e) {
                            console.error("Unable to parse UpdateUserTitleDisplayName error: " + data);
                        }
                    }

                    if (!handled)
                    {
                        console.error("Failed to update display name to match Steam name (" + gEngineParams.steam.persona_name + "): " + data);
                        deferred.resolve();
                    }
                });
        };

        var finishAuthentication = function(data)
        {
            self.uberUserInfo(data);
            self.uberName(data.UberName);
            self.uberId(data.UberIdString);

            if (data.SessionTicket)
                self.jabberToken(data.SessionTicket);

            self.hasEverSignedIn(true);
            self.signedInToUbernet(true);
            self.mode(2);
            self.requestRegions();
            self.getGameWithPlayer();
            self.startCheckingBuildVersion();

            var catalogDeferred = $.Deferred();
            PlayFab.updateCatalog(function () {
                api.content.catalogUpdated();

                _.forOwn(self.oneTimePopups, function(popup, name) { popup.setup(); });
                if (api.steam.hasClient() && !_.some(self.oneTimePopups, function(popup) { return popup.display(); }))
                    self.showRedirectToNewAppid(!api.content.ownsTitans() && api.steam.accountOwnsTitans());

                catalogDeferred.resolve();
            });

            var connectionCompleteDeferred = catalogDeferred;
            var useSteamName = api.settings.getSynchronous('user', 'username_policy') === 'STEAM';

            if (useSteamName && self.useSteam() && !_.isEmpty(gEngineParams.steam.persona_name) && self.displayName() !== gEngineParams.steam.persona_name)
            {
                var displayNameDeferred = $.Deferred();
                updateSteamName(displayNameDeferred);
                connectionCompleteDeferred = $.when(catalogDeferred, displayNameDeferred);
            }

            connectionCompleteDeferred.always(function() {
                if (self.showConnecting()) {
                    self.showConnecting(false);
                    $("#connecting").dialog("close");
                }
            });
        };

        self.createAnonymousSteamAccount = function () {
            var steamIDStr = steamID();
            if (_.isEmpty(steamIDStr))
            {
                console.error("Got createAnonymousSteamAccount, but no Steam ID.");
                return;
            }

            var hexID = bigInt2str(str2bigInt(steamIDStr, 10), 16);
            /* Usernames are limited to 20 characters. 64 bit number in hex is up to 16. */
            var ubername = "steam" + hexID;
            /* Passwords are limited to 30 characters. */
            var password = UberUtility.randomString(26);

            var email = "steamanonymous+" + steamIDStr + "@uberent.com";

            engine.asyncCall("ubernet.createUberNetAccountViaSteam",
                             ubername,
                             email,
                             password,
                             password)
                .done(function (data) {
                    var data = JSON.parse(data);

                    console.log('createUberNetAccount done');
                    console.log(data);
                    finishAuthentication(data);
                })
                .fail(function (data) {
                    var r = JSON.parse(data);

                    function showErrorDialog(extra_info) {
                        /* we could also show the error message from playfab (error.Message), however the client side messages for the error code are localized.
                           the client side messages were generated to match the playfab messages. */
                        $("#errorText").text(extra_info);
                        $("#error").dialog('open');
                        self.showError(true);
                    }

                    if (r.ErrorCode === 6 && r.Errors && r.Errors.UserName) {
                        showErrorDialog(loc('!LOC:Unable to link your Steam account (username in use), contact us at __email__', { email: "support@uberent.com" }));
                    } else if (r.ErrorCode === 7 && r.Errors && r.Errors.Email) {
                        showErrorDialog(loc('!LOC:Unable to link your Steam account (email address in use), contact us at __email__', { email: "support@uberent.com" }));
                    } else if (r.ErrorCode === 400 && r.Errors && r.Errors.ConfirmPassword) {
                        showErrorDialog(loc('!LOC:Unable to link your Steam account, try restarting the game or contact us at __email__', { email: "support@uberent.com" }));
                    } else if (r.ErrorCode === 400 && r.Errors && r.Errors.UserName) {
                        showErrorDialog(r.Errors.UserName[0]);
                    } else  if (r.ErrorCode === 400 && r.Errors && r.Errors.Email) {
                        showErrorDialog(loc('!LOC:Unable to link your Steam account (email address invalid), contact us at __email__', { email: "support@uberent.com" }));
                    } else {
                        showErrorDialog(loc('!LOC:Unable to link your Steam account (unknown error __code__), contact us at __email__', { code: r.ErrorCode, email: "support@uberent.com" }));
                    }
                });
        };

        function authenticateHelper(/* varargs */) {
            engine.asyncCall.apply(engine, arguments)
                .done(function (data_str) {
                    var data = parse(data_str);
                    finishAuthentication(data);

                    api.settings.load(true /* force */, false /* local */).then(function () {
                        api.settings.apply(['graphics', 'audio', 'camera', 'ui', 'server']);
                    });
                })
                .fail(function (error_str) {
                    var error = parse(error_str);
                    console.log('authenticateHelper : fail');
                    console.log(error);

                    self.signedInToUbernet(false);
                    self.hasCmdLineTicket(false);

                    $("#connecting").dialog("close");

                    function showErrorDialog(exit_on_close, extra_info) {
                        /* we could also show the error message from playfab (error.Message), however the client side messages for the error code are localized.
                           the client side messages were generated to match the playfab messages. */
                        $("#errorText").text(extra_info);
                        $("#error").dialog('open');
                        self.showError(true);
                    }
                    switch (error.ErrorCode) {
                        case -1: showErrorDialog(false, "Client Error -1."); break; /* Custom client error */
                        case -2: showErrorDialog(false, "Client Error -2."); break; /* Custom client error */
                        case -3: showErrorDialog(false, "Client Error -3."); break; /* Custom client error */
                        case -4: showErrorDialog(false, "Client Error -4."); break; /* Custom client error */
                        case -5: showErrorDialog(false, "Client Error -5: " + loc("!LOC:Invalid session ticket, please log in again.")); break; /* Custom client error */
                        case 1: showErrorDialog(false, loc("!LOC:Incorrect username or password. Please check your entry and try again.")); break; /* InvalidUsernameOrPassword */
                        case 2: /* UserNotLinkedToSteam */
                            if (self.canCreateAnonymousAccount())
                            {
                                self.createAnonymousSteamAccount();
                            }
                            else /* This shouldn't show up. */
                            {
                                showErrorDialog(false, loc("!LOC:There is a problem with Steam. Please restart Steam and try again, or contact us at __email__", { email: "support@uberent.com" }));
                            }
                            break;
                        case 6: /* RegistrationIncomplete */
                            if (self.canCreateAnonymousAccount())
                            {
                                self.createAnonymousSteamAccount();
                            }
                            else /* This shouldn't show up. */
                            {
                                showErrorDialog(false, loc("!LOC:Oops! Your account seems to be in an invalid state. If you are a Steam user, please restart Steam and try again. If the problem persists, contact us at __email__", { email: "support@uberent.com" }));
                            }
                            break;
                        case 3:
                            showErrorDialog(true, loc("!LOC:This shouldn't happen. Please contact us at  __email__", { email: "support@uberent.com" }));
                            break; /* Not Possible */
                        case 4:
                            showErrorDialog(true, loc("!LOC:This shouldn't happen. Please contact us at  __email__", { email: "support@uberent.com" }));
                            break; /* Not Possible */
                        case 5:
                            showErrorDialog(false, loc("!LOC:There is a problem with Steam. Please restart Steam and try again, or contact us at __email__", { email: "support@uberent.com" }));
                            break; /* InvalidSteamTicket */
                        case 7:
                            showErrorDialog(true, loc("!LOC:Your account has been banned. If you believe this is in error, contact us at __email__", { email: "support@uberent.com" }));
                            break; /* AccountBanned */
                        case 8:
                            self.openTitleActivationPopup();
                            break; /* TitleNotActivated */
                        case 9:
                            showErrorDialog(true, loc("!LOC:Oops! We can't find the game in your account.  If you are a Steam user, please restart Steam and try again.  If the problem persists, contact us at __email__", { email: "support@uberent.com" }));
                            break; /* SteamApplicationNotOwned */

                        default: {
                            var errorCode = error.ErrorCode;
                            if (!errorCode)
                                errorCode = error_str;
                            else
                                errorCode = errorCode.toString();
                            var message = loc("!LOC:Unknown Error authenticating, possibly related to firewall or antivirus settings.  Please contact support if problem persists. (__error_code__)", { error_code: errorCode });
                            showErrorDialog(false, message);
                            break;
                        }
                    }
                });
        }

        self.authenticateWithCmdLineTicket = function () {
            authenticateHelper("ubernet.authenticateWithCmdLineTicket");
        }

        self.authenticateWithUberNetLogin = function () {
            authenticateHelper("ubernet.authenticateWithUberNetLogin",
                               self.uberName(),
                               self.password());
        }

        self.authenticateWithSteamTicket = function () {
            authenticateHelper("ubernet.authenticateWithSteamTicket");
        }

        self.ubernetLoginIn = function () {

            self.showConnecting(true);
            $("#msg_progress").text(loc("!LOC:Connecting to PlayFab"));
            $("#connecting").dialog('open');

            if (self.hasCmdLineTicket())
                self.authenticateWithCmdLineTicket();
            else if (self.useSteam())
                self.authenticateWithSteamTicket();
            else
                self.authenticateWithUberNetLogin();
        };

        self.ubernetLogout = function () {
            self.mode(1);
            self.uberId('');
            self.jabberToken('');
            self.signedInToUbernet(false);
        };

        self.requestRegions = function () {
            engine.asyncCall("ubernet.getGameServerRegions").then(
                function (data, status) {
                    var i;

                    data = JSON.parse(data);

                    if (data.Regions) {
                        self.uberNetRegions([]);

                        for (i = 0; i < data.Regions.length; i++) {
                            self.uberNetRegions.push(data.Regions[i]);
                        }
                    }
                },
                function (error) {
                    console.log('regions:fail: ' + error);
                }
            );
        }

        self.rejoinGame = function () {
            self.showReconnect(false);

            var gameHostname = ko.observable().extend({ session: 'gameHostname' });
            var gamePort = ko.observable().extend({ session: 'gamePort' });
            var joinLocalServer = ko.observable().extend({ session: 'join_local_server' });
            var lobbyId = ko.observable().extend({ session: 'lobbyId' });

            lobbyId(self.lobbyId());
            gameHostname(null);
            gamePort(null);
            joinLocalServer(false);

            var params = {
                content: self.reconnectContent(),
            };
            window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
        };

        self.abandon = function () {
            api.net.removePlayerFromGame();
        }

        self.getGameWithPlayer = function () {
            engine.asyncCall("ubernet.getGameWithPlayer").done(function (data) {
                data = JSON.parse(data);
                if (data.PlayerInGame) {
                    // show reconnect / abandon
                    self.showReconnect(true);
                    self.lobbyId(data.LobbyID);

                    var mode = data.GameMode || '';
                    if (mode.indexOf(':') > 0)
                        self.reconnectContent(mode.substr(0, mode.indexOf(':')));
                    else
                        self.reconnectContent(null);
                    $("#reconnectDlg").dialog('open');
                }
            });
        }

        self.getUbernetBuildNumber = function () {
            if (!DEV_MODE) {
                engine.asyncCall("ubernet.getCurrentClientVersion").then(function (data) {
                    var old_version = self.ubernetBuildVersion();
                    self.ubernetBuildVersion(data);

                    if (self.buildNeedsUpdate() && old_version !== self.ubernetBuildVersion()) {
                        self.showNewBuild(true);
                        $(".div_build_number_dialog").dialog('open');
                    }
                });
            }
        };

        self.startCheckingBuildVersion = _.once(function () {
            self.getUbernetBuildNumber();
            setInterval(self.getUbernetBuildNumber, 60000);
        });

        self.getPlayerRank = function () {
            engine.asyncCall('ubernet.getPlayerRating', MatchmakingUtility.getMatchmakingType()).done(function (data) {
                data = parse(data)
                self.playerRatingInfo(data);
            }).fail(function (data) {
                console.error('getPlayerRating failed', data);
                self.playerRatingInfo({});
            });
        };

        var allowUbernetActionsRule = ko.computed(function () {
            if (self.allowUbernetActions())
                self.getPlayerRank();
            else
                self.playerRatingInfo({});
        });


        self.showLeague = ko.computed(function () {
            return MatchmakingUtility.getLevel(self.league()) >= 0;
        });
        self.leagueTooltip = ko.computed(function () {
            return ['<div class="tooltip_league">',
                        '<img src="' + self.largeleagueSrc() + '" />',
                        '<div class="text">', self.leagueText(), '</div>',
                    '</div>'];
        });

        self.navToServerBrowser = function () {

            if (self.maybeShowTutorialPopup())
                return;

            if (!self.allowNewOrJoinGame())
                return;

            self.redirectToServer(true);
            self.aiSkirmish(false);
            if (!model.hasUberNetRegion() || model.isUberNetRegionAvailable()) {
                model.inRegionSetup(false);
                window.location.href = 'coui://ui/main/game/server_browser/server_browser.html';
                return; /* window.location.href will not stop execution. */
            }
            else {
                model.inRegionSetup(true);
                $("#regionDlg").dialog('open');
            }
        }

        self.navToArmory = function () {
            if (!self.allowUbernetActions())
                return;

            window.location.href = 'coui://ui/main/game/armory/armory.html';
            return; /* window.location.href will not stop execution. */
        }

        self.navToReplayBrowser = function () {
            if (!self.allowUbernetActions())
                return;

            self.aiSkirmish(false);
            self.redirectToReplay(true);
            if (!model.hasUberNetRegion() || model.isUberNetRegionAvailable()) {
                model.inRegionSetup(false);
                window.location.href = 'coui://ui/main/game/replay_browser/replay_browser.html';
                return; /* window.location.href will not stop execution. */
            }
            else {
                model.inRegionSetup(true);
                $("#regionDlg").dialog('open');
            }
        }

        self.navToLoadSavedGame = function () {

            if (self.maybeShowTutorialPopup())
                return;

            window.location.href = 'coui://ui/main/game/save_game_browser/save_game_browser.html';
        }

        self.navToSettings = function () {
            window.location.href = 'coui://ui/main/game/settings/settings.html';
            return; /* window.location.href will not stop execution. */
        }

        self.mostRecentGame = SaveGameUtility.mostRecentGame;

        self.startMatchMaking = function (options) {

            if (self.maybeShowTutorialPopup())
                return;

            if (!self.allowUbernetActions())
                return;

            options = options || {};

            self.aiSkirmish(false);
            self.redirectToMatchMaking(true);
            if (model.isUberNetRegionAvailable()) {
                model.inRegionSetup(false);

                var skipGameCheck = ko.observable().extend({ session: 'matchmaking_skip_game_check' });
                skipGameCheck(!!options.skip_existing_game_check)

                window.location.href = 'coui://ui/main/game/matchmaking/matchmaking.html';
            }
            else {
                model.inRegionSetup(true);
                $("#regionDlg").dialog('open');
            }
        }

        self.navToLeaderBoard = function () {
            if (!self.allowUbernetActions())
                return;

            window.location.href = 'coui://ui/main/game/leaderboard/leaderboard.html';
            return; /* window.location.href will not stop execution. */
        };

        self.navToGuide = function () {
            window.location.href = 'coui://ui/main/game/guide/guide.html';
            return; /* window.location.href will not stop execution. */
        };

        self.showSinglePlayerMenu = ko.observable(false);
        self.toggleSinglePlayerMenu = function () {
            if (!self.allowNewOrJoinGame())
                return;
            self.showSinglePlayerMenu(!self.showSinglePlayerMenu());
            self.showMultiplayerMenu(false);
        };
        self.showMultiplayerMenu = ko.observable(false);
        self.toggleMultiplayerMenu = function () {
            if (!self.allowNewOrJoinGame())
                return;
            self.showMultiplayerMenu(!self.showMultiplayerMenu());
            self.showSinglePlayerMenu(false);
        };

        self.hideSubMenus = function(data, event) {
            if (document.getElementById("navigation_panel").contains(event.target))
                return;

            self.showSinglePlayerMenu(false);
            self.showMultiplayerMenu(false);
        };

        self.galacticWarMode = ko.observable('');
        this.navToGalacticWar = function (mode) {

            if (self.maybeShowTutorialPopup())
                return;

            self.aiSkirmish(false);
            self.redirectToGalacticWar(true);
            if (model.useLocalServer() || model.isUberNetRegionAvailable()) {
                model.inRegionSetup(false);
                var params = {};
                if (!_.isEmpty(self.galacticWarMode()))
                    params['mode'] = self.galacticWarMode();
                else
                    params['content'] = api.content.activeContent();
                window.location.href = 'coui://ui/main/game/galactic_war/gw_start/gw_start.html?' + $.param(params);
                return; /* window.location.href will not stop execution. */
            }
            else {
                model.inRegionSetup(true);
                $("#regionDlg").dialog('open');
            }
        }
        self.navToAISkirmish = function () {

            if (self.maybeShowTutorialPopup())
                return;

            self.aiSkirmish(true);
            self.redirectToAISkirmish(true);
            if (self.useLocalServer() || self.isUberNetRegionAvailable()) {
                self.inRegionSetup(false);
                self.lastSceneUrl(window.location.href);

                var params = {
                    action: 'start',
                    content: api.content.activeContent(),
                };
                if (self.useLocalServer())
                    params['local'] = true;

                window.location.href = 'coui://ui/main/game/connect_to_game/connect_to_game.html?' + $.param(params);
                return;
            }
            else {
                model.inRegionSetup(true);
                $("#regionDlg").dialog('open');
            }
        };

        this.navToNewPlanet = function () {
            window.location.href = 'coui://ui/main/game/system_editor/system_editor.html';
            return; /* window.location.href will not stop execution. */
        }

        this.navToEditPlanet = function () {
            self.nextSceneUrl('coui://ui/main/game/system_editor/system_editor.html');
            window.location.href = 'coui://ui/main/game/load_planet/load_planet.html';
            return; /* window.location.href will not stop execution. */
        }

        self.finishRegionSetup = function () {
            model.uberNetRegion(model.selectedUberNetRegion());

            if (!self.uberNetRegion() || !self.isUberNetRegionAvailable())
                return; /* do nothing */

            if (self.redirectToServer())
                return self.navToServerBrowser();

            if (self.redirectToCustomGame())
                return self.navToCustomGame();

            if (self.redirectToReplay())
                return self.navToReplayBrowser();

            if (self.redirectToGalacticWar())
                return self.navToGalacticWar();

            if (self.redirectToAISkirmish())
                return self.navToAISkirmish();

            if (self.redirectToMatchMaking())
                return self.startMatchMaking();
        }

        self.showCredits = function () {
            $(".div_credits_dialog").dialog('open');
            $('.ui-widget-overlay').on("click", function() {
                $(".div_credits_dialog").dialog("close");
                $('.ui-widget-overlay').off("click");
            });
        };
        self.launchCredits = function () {
            self.galacticWarMode('credits');
            self.navToGalacticWar();
        };

        self.showKickstarters = function () {
            $(".div_kickstarter_dialog").dialog('open');
            $('.ui-widget-overlay').on("click", function() {
                $(".div_kickstarter_dialog").dialog("close");
                $('.ui-widget-overlay').off("click");
            });
        }

        self.twitchChannelsReady = ko.observable(false);

        self.fetchTwitchChannels = function () {
            api.twitch.requestLiveStreamList().then(function (streams) {
                self.twitchLiveStream(streams);
            }).always(function () {
                self.twitchChannelsReady(true);
            });
        };

        self.hasShownOfflinePlayDialog = ko.observable(false).extend({ local: 'hasShownOfflinePlayDialog' });
        self.maybeShowOfflinePlayDialog = function() {
            // 32-bit users.
            if (!self.localServerAvailable())
            {
                if (!self.hasShownOfflinePlayDialog())
                {
                    self.hasShownOfflinePlayDialog(true);
                    $('#offlineUnavailable').modal('show');
                }
                return;
            }

            var setting = self.localServerSetting();
            if (setting === 'OFF' || setting === 'ON' || self.localServerRecommended())
            {
                self.hasShownOfflinePlayDialog(false);
                return;
            }

            if (!self.hasShownOfflinePlayDialog())
            {
                self.hasShownOfflinePlayDialog(true);
                $('#offlineInitiallyDisabled').modal('show');
            }
        };

        self.openOfflineUnavailableMoreInfo = function () {
            engine.call('web.launchPage', 'http://support.uberent.com/kb/?a=search&q=Offline+Play+Disabled');
            $("#offlineUnavailable").modal('hide');
            $("#offlineInitiallyDisabled").modal('hide');
        };

        self.enableOfflinePlay = function() {
            self.localServerSetting('ON');
            api.settings.save();
            $("#offlineInitiallyDisabled").modal('hide');
        };

        self.graphicsVendorDescription = ko.pureComputed(function() {
            var vendor = self.graphicsVendor();
            if (vendor === "amd")
                return "AMD/ATI";
            if (vendor === "intel")
                return "Intel";
            if (vendor === "nvidia")
                return "NVIDIA";
            return null;
        });

        var graphicsVendorDriverWebsite = ko.pureComputed(function() {
            var vendor = self.graphicsVendor();
            if (vendor === "amd")
                return "http://support.amd.com/en-us/download";
            if (vendor === "intel")
                return "https://downloadcenter.intel.com/";
            if (vendor === "nvidia")
                return "http://www.nvidia.com/Download/index.aspx?lang=en-us";
            return null;
        });

        $("#graphicsDriverCrash").modal();
        $("#graphicsDriverCrash").on('hidden.bs.modal', function (e) {
            api.game.clearCrashReason();
            self.maybeShowOfflinePlayDialog();
        });

        self.maybeShowCrashDialog = function() {
            api.game.getCrashReason().then(function(reason) {
                if (reason === 'opengl_driver' && graphicsVendorDriverWebsite() !== null)
                    $("#graphicsDriverCrash").modal('show');
                else
                {
                    api.game.clearCrashReason();
                    self.maybeShowOfflinePlayDialog();
                }
            })
            .fail(function() {
                self.maybeShowOfflinePlayDialog();
            });
        };

        self.openGraphicsVendorWebsite = function() {
            engine.call('web.launchPage', graphicsVendorDriverWebsite());
        };

        self.openForumWebsite = function() {
            var url = api.content.ownsTitans()
                    ? 'https://forums.uberent.com/categories/planetary-annihilation-titans.94/'
                    : 'https://forums.uberent.com/categories/planetary-annihilation.60/';

            engine.call('web.launchPage', url);
        };

        self.communityTabGroup = ko.observable().extend({ local: 'community_tab_group' });
        self.clearCommunityTabGroup = function () {
            self.communityTabGroup(null);
        };

        self.showUpdate = ko.pureComputed(function () {
            return self.communityTabGroup() == 'update';
        });
        self.toggleUpdateTab = function () {
            if (self.showUpdate())
                self.communityTabGroup(null);
            else
                self.communityTabGroup('update');
        };

        self.showVideos = ko.pureComputed(function () {
            return self.communityTabGroup() == 'videos';
        });
        self.toggleVideosTab = function () {
            if (self.showVideos())
                self.communityTabGroup(null);
            else
                self.communityTabGroup('videos');
        };

        self.showTwitch = ko.pureComputed(function () {
            return self.communityTabGroup() == 'twitch';
        });
        self.toggleTwitchTab = function () {
            if (self.showTwitch())
                self.communityTabGroup(null);
            else
                self.communityTabGroup('twitch');
        };

        self.showLeaderboard = ko.pureComputed(function () {
            return self.communityTabGroup() == 'leaderboard';
        });
        self.toggleLeaderboardTab = function () {
            if (self.showLeaderboard())
                self.communityTabGroup(null);
            else
                self.communityTabGroup('leaderboard');
        }

        self.hasUpdatePost = ko.observable(false);

        self.updateTitle = ko.observable();
        self.updateAuthor = ko.observable();
        self.updateDate = ko.observable();

        self.fetchPatchNews = function () {
            var html;
            var i;

            var replaceHtmlEntites = (function () {
                var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
                var translate = {
                    "nbsp": " ",
                    "amp": "&",
                    "quot": "\"",
                    "lt": "<",
                    "gt": ">"
                };
                return function (s) {
                    return (s.replace(translate_re, function (match, entity) {
                        return translate[entity];
                    }));
                }
            })();

            function formatDateFromTimestamp(timestamp) {
                var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

                // input format example: '2013-07-24.00:48:37'

                var year = timestamp.slice(0, 4);
                var month = months[Number(timestamp.slice(5, 7)) - 1];
                var day = timestamp.slice(8, 10);

                return '' + month + ' ' + day + ' ' + year;
            }

            function parseAndFixLinks(html) {
                var content = $.parseHTML(html);

                $(content).find('a').each(function () {
                    $(this).click(function () {
                        if (this.href)
                            engine.call('web.launchPage', this.href);
                        return false;
                    });
                });

                return content;
            }

            var update_url = api.content.usingTitans()
                    ? "http://www.uberent.com/pa/category/game-updates/?json=1&count=1"
                    : "http://www.uberent.com/pa-classic/category/game-updates/?json=1&count=1";

            $.ajax({
                type: "GET",
                url: update_url,
                contentType: "application/json",
                success: function (data, textStatus) {
                    var post, author;

                    if (data && data.posts && data.posts.length)
                    {
                        post = data.posts[0];
                        if (post) {
                            self.updateTitle(post.title);
                            $('.update_content').html(parseAndFixLinks(post.content));
                            author = post.author
                            if (author)
                                self.updateAuthor(author.name);

                            self.updateDate(formatDateFromTimestamp(post.date));
                            self.hasUpdatePost(true);
                        }
                    }

                    self.hasUpdatePost(true);
                },
                error: function () {
                    console.log('failed tor get news at : ' + update_url);
                    self.hasUpdatePost(true);
                }
            });
        }

        self.miniboardPlayers = ko.observableArray([]);

        self.leaderboardReady = ko.observable(false);

        self.fetchMiniboard = function() {
            LeaderboardUtility.fetchLeagueInfo(1, MatchmakingUtility.getMatchmakingType()).done(function(numberOfPlayersWithRank, players) {
                var players = players.splice(0, 3);
                self.miniboardPlayers(players);
            }).fail(function(textStatus, errorThrown) {
                self.miniboardPlayers([]);
            }).always(function() {
                self.leaderboardReady(true);
            });
        };

        api.net.ubernetUrl.subscribe(function() {
            self.miniboardPlayers([]);
            self.fetchMiniboard();
        });

        self.showYoutubeVideo = ko.observable(false);

        self.twitchLiveStream = ko.observableArray([]);

        self.modalBack = function () {
            api.Panel.message(api.Panel.parentId, "finish_video");
        }

        self.playIntroVideo = function () {
            engine.call('audio.pauseMusic', true);
            api.Panel.message(api.Panel.parentId, 'play_intro');
        };

        self.openTitansUpsellPage = function () {
            if (!api.content.ownsTitans() && (api.steam.hasClient() || self.allowUbernetActions())) {
                self.navToArmory();
            }
            else {
                engine.call('web.launchPage', 'http://store.steampowered.com/app/386070');
            }
        };

        self.localServerSetting = ko.observable().extend({ setting: { 'group': 'server', 'key': 'local' } });
        self.localServerDisabledInSettings = ko.pureComputed(function () {
            return self.localServerSetting() === 'OFF';
        });

        self.showOfflineWarning = ko.pureComputed(function() {
            /* Don't show it before we have gotten initialized. */
            if (!self.readyToLogin())
                return false;
            /* Don't show it while we're logging in. */
            if (self.showConnecting())
                return false;

            /* If we're logged on to Ubernet, then we are able to play. */
            if (self.allowUbernetActions())
                return false;

            /* Otherwise, if we can use the offline server, then we are able to play. */
            return !self.useLocalServer();
        });

        self.squelchTitansUpsellPage = ko.observable(false).extend({ local: 'squelch_titans_upsell' });

        self.showBuyTitans = ko.computed(function () {
            if (!self.allowMicroTransactions())
                return false;

            if (self.squelchTitansUpsellPage())
                return false;

            return !api.content.ownsTitans();
        });

        self.launchTitansAndExit = function() {
            api.steam.launchContent('PAExpansion1').then(function() {
                engine.call('exit');
            });
        };

        self.setup = function () {
            var initialContent = api.content.active();
            api.content.active.subscribe(function(newContent) {
                if (newContent !== initialContent)
                    api.game.debug.reloadScene(api.Panel.pageId);
            });

            self.isLocalGame(false);

            api.file.unmountAllMemoryFiles();
            api.game.setUnitSpecTag('');
            engine.call('reset_game_state');

            engine.call("audio.setVideoVolumeScale", 0.5);

            var needsLogin = !self.signedInToUbernet() && (self.hasCmdLineTicket() || self.useSteam());
            if (!self.hasSetupInfo() || needsLogin) {
                api.game.getSetupInfo().then(function (payload) {
                    self.hasSetupInfo(true);
                    self.uiOptions(parseUIOptions(payload.ui_options));
                    self.buildVersion(payload.version);
                    self.os(payload.os);
                    self.graphicsVendor(payload.graphics_vendor);
                    self.useUbernetdev(payload.use_ubernetdev);
                    self.localServerAvailable(payload.local_server_available);
                    self.localServerRecommended(payload.local_server_recommended);

                    self.hasCmdLineTicket(payload.has_cmdline_ticket);
                    api.steam.hasClient(!!payload.has_steam);
                    self.isSteamClientOnline(!!payload.steam_online);

                    self.allowMicroTransactions(!!payload.allow_micro_transactions);

                    self.signedInToUbernet(false);

                    if (self.hasCmdLineTicket() || self.useSteam())
                        self.ubernetLoginIn();
                    self.mode(1);

                    api.settings.load(true /* force */, false /* local */).then(function () {
                        api.settings.apply(['graphics', 'audio', 'camera', 'ui', 'server']);
                        UIMediaUtility.startMusic();
                    });

                    if (payload.username)
                        self.uberName(payload.username);

                    self.readyToLogin(true);

                    self.maybeShowCrashDialog();
                });
                engine.call('request_display_mode');
            }
            else
            {
                UIMediaUtility.startMusic();

                self.readyToLogin(true);
                self.maybeShowCrashDialog();
            }

            $("#signin, #reconnect, #abandon").button();

            self.lastSceneUrl('coui://ui/main/game/start/start.html');

            self.fetchPatchNews();
            self.fetchTwitchChannels();
            self.fetchMiniboard();

            api.Panel.message('uberbar', 'lobby_info' /*, undefined */);
            api.Panel.message('uberbar', 'visible', { value: true });
            api.Panel.message(gPanelParentId, 'live_game_uberbar', { 'value': false });

            setInterval(self.update, 500);
            setInterval(self.requestRegions, 60000);
            setInterval(self.fetchTwitchChannels, 20000);
            setInterval(self.fetchMiniboard, 30 * 60 * 1000);

            if (!!$.url().param('startMatchMaking'))
                self.startMatchMaking({ skip_existing_game_check: true });

            if (DEV_MODE)
            {
                api.Panel.message(gPanelParentId, 'hide_splash', true);
            }
            else
            {
                var pageIsReady = ko.pureComputed(function () {
                    var bind = [self.hasUpdatePost(),
                                self.leaderboardReady(),
                                self.twitchChannelsReady()];

                    var progress = _.size(_.compact(bind));
                    return progress === _.size(bind);
                });
                var pageIsReadyRule = ko.computed(function () {
                    if (pageIsReady())
                    {
                        _.delay(function() {
                            api.Panel.message(gPanelParentId, 'hide_splash', true);
                        }, SPLASH_DELAY_SECONDS * 1000);
                    }
                });
            }
        };
    }
    model = new LoginViewModel();

    handlers = {};

    handlers.display_mode = function (payload) {

        switch (payload.mode) {
            case 'FULLSCREEN': model.displayMode('FULLSCREEN');
            case 'WINDOWED': model.displayMode('WINDOWED');
            default: model.displayMode('WINDOWED');
        }
    }

    handlers.display_name = function (payload) {
        if (payload.display_name)
            model.displayName(payload.display_name);
    }

    handlers.video_complete = function () {
        model.introVideoComplete();
    }

    handlers.gog_auth_complete = function (payload) {
        console.log('gog_auth_complete');
        console.log(payload);

        model.gogId(payload.gog_id);
        model.gogPersonaName(payload.persona_name);
        model.accountCreationPopup.username(model.gogPersonaName());

        if (!model.hasEverSignedIn())
            model.openAccountCreationPopup();
    }

    //initalize dialogs
    $(".div_credits_dialog").dialog({
        width: 800,
        height: 630,
        modal: true,
        autoOpen: false,
        dialogClass: 'credits_wrapper'
    });

    $(".div_kickstarter_dialog").dialog({
        width: 800,
        height: 590,
        modal: true,
        autoOpen: false,
        dialogClass: 'credits_wrapper'
    });


    var CmdButtons = {};
    CmdButtons[loc("!LOC:OK")] = function () {
        $(this).dialog("close");
        model.showError(false);
        model.mode(1);
    };
    $("#error").dialog({
        dialogClass: "signin_notification",
        draggable: false,
        resizable: false,
        width: 600,
        modal: true,
        autoOpen: false,
        buttons: CmdButtons
    });

    $("#connecting").dialog({
        dialogClass: "signin_notification",
        draggable: false,
        resizable: false,
        height: 100,
        width: 500,
        modal: true,
        autoOpen: false,
        buttons: {}
    });

    CmdButtons = {};
    CmdButtons[loc("!LOC:RECONNECT")] = function () {
        $(this).dialog("close");
        console.log("reconnect");
        model.rejoinGame();
    };
    CmdButtons[loc("!LOC:ABANDON")] = function () {
        console.log("abandon");
        model.abandon();
        model.showReconnect(false);
        $(this).dialog("close");
    };
    $("#reconnectDlg").dialog({
        dialogClass: "no-close",
        draggable: false,
        resizable: false,
        width: 600,
        modal: true,
        autoOpen: false,
        complete: function (data, textStatus) {
            model.showReconnect(false);
        },
        buttons: CmdButtons
    });

    CmdButtons = {};
    CmdButtons[loc("!LOC:EXIT")] = function () {
        model.exit();
    },
    CmdButtons[loc("!LOC:LATER")] = function () {
        $(this).dialog("close");
        model.showNewBuild(false);
    }
    $(".div_build_number_dialog").dialog({
        dialogClass: "no-close",
        draggable: false,
        resizable: false,
        height: 400,
        width: 600,
        modal: true,
        autoOpen: false,
        closeOnEscape: false,
        buttons: CmdButtons
    });

    CmdButtons = {};
    CmdButtons[loc("!LOC:OK")] = function () {
        $(this).dialog("close");
        model.finishRegionSetup();
    }
    $("#regionDlg").dialog({
        dialogClass: "no-close",
        draggable: false,
        resizable: false,
        height: 450,
        width: 550,
        modal: true,
        autoOpen: false,
        closeOnEscape: false,
        buttons: CmdButtons
    });

// try a remote load of community mods and if that fails try the download cache for offline use
    if (!loadScript( 'https://dfpsrd4q7p23m.cloudfront.net/community-mods/start.js')) {
        loadScript( 'coui://download/community-mods-start.js');
    }

    // inject per scene mods
    if (scene_mod_list['start'])
        loadMods(scene_mod_list['start']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();
});

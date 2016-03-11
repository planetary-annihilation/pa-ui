var model;
var handlers;

function respondToResize() {
    model.containerHeight($("body").height() + 'px');
    model.containerWidth(($("body").width() - 10) + 'px');
    model.contentWrapperHeight(($("#main .content").height()) + 'px');
}

$(document).ready(function () {

    function ArmoryViewModel() {
        var self = this;

        // Get session information about the user, his game, environment, and so on
        self.uberId = ko.observable().extend({ session: 'uberId' });
        self.uberName = ko.observable('').extend({ local: 'uberName' });

        self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });
        self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
        self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
        self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
        self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

        self.devMode = ko.observable().extend({ session: 'dev_mode' });
        self.ubernetCallPending = ko.observable(false);

        self.allowMicroTransactions = ko.observable().extend({ session: 'allow_micro_transactions' });

        self.navToTab = function (target) {
            $('a[href="#'+target+'"]').click();
        }

        self.cart = ko.observableArray();

        self.cartTotalPrice = ko.computed(function () {
            var result = 0;
            _.forEach(self.cart(), function (element) {
                result += element.Item.Prices.RM;
            });
            return result;
        });

        self.createCartJson = function () {
            return JSON.stringify(_.map(self.cart(), function (element) {
                return {
                    Name: element.Item.ObjectName,
                    Quantity: element.Quantity
                }
            }));
        }

        self.createCartResult = ko.observable('');
        self.createInitatePurchaseRequestJson = function () {
            return JSON.stringify({
                OrderId: model.createCartResult().OrderId,
                /* 'ProviderName' is set by the client to be either Steam or Adyen */
                Currency: 'RM'
            });
        }

        self.completePurchaseResult = ko.observable();

        self.initiatePurchaseResult = ko.observable('');
        self.purchaseState = ko.observable('');

        self.showExternalOverlay = ko.observable(false);
        self.showLocalOverlay = ko.observable(false);
        self.showOverlay = ko.computed(function () { return self.showExternalOverlay() || self.showLocalOverlay() });

        self.overlaySequenceComplete = ko.observable(false);
        self.overlayUrl = ko.observable('coui://ui/main/game/overlay/overlay.html');

        // Tracked for knowing where we've been for pages that can be accessed in more than one way
        self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

        // Set up dynamic sizing elements
        self.containerHeight = ko.observable('');
        self.containerWidth = ko.observable('');
        self.contentWrapperHeight = ko.observable('');

        // Click handler for back button
        self.back = function () {
            engine.call('disable_lan_lookout');
            window.location.href = 'coui://ui/main/game/start/start.html';
            return; /* window.location.href will not stop execution. */
        };

        self.showValue = ko.observable('commanders');
        self.showExpansion = ko.computed(function () { return self.showValue() == 'expansion'; });
        self.showCommanders = ko.computed(function () { return self.showValue() == 'commanders' });
        self.showBadges = ko.computed(function () { return self.showValue() == 'badges' });
        self.showCart = ko.computed(function () { return self.showValue() == 'cart' });
        self.formatRM = function (value) {
            var whole = Math.floor(value / 100);
            var fraction = value % 100;
            var padding = fraction < 10 ? '0' : '';
            return '$' + whole + '.' + fraction + padding;
        };
        self.costForCommander = function (commander) {
            var result;

            if (commander.IsOwned || commander.IsFree)
                result = 'Owned';
            else if (commander.NotForSale)
                result = 'Locked';
            else
                result = commander.Prices ? self.formatRM(commander.Prices.RM) : 0;

            return result;
        };

        self.couponCode = ko.observable('');
        self.couponRedeemMessage = ko.observable('');

        self.selectedCommanderIndex = ko.observable(-1);
        self.selectedBadgeIndex = ko.observable(-1);

        self.preferredCommander = ko.observable().extend({ local: 'preferredCommander_v2' });
        if (_.has(self.preferredCommander(), 'UnitSpec'))
            self.preferredCommander(self.preferredCommander().UnitSpec);

        self.hasEverSelectedCommander = ko.observable().extend({ local: 'hasEverSelectedCommander_v2' });

        self.preferredCommanderObjectName = ko.computed(function() {
            return CommanderUtility.bySpec.getObjectName(self.preferredCommander());
        });

        self.commanders = ko.observableArray();
        self.showLockedCommanders = ko.observable(false);
        self.sortCommanders = function () {
            var available = [];
            var purchaseable = [];
            var locked = [];

            _.forEach(self.commanders(), function (element) {
                if (element.IsFree || element.IsOwned)
                    available.push(element);
                else if (element.NotForSale)
                    locked.push(element)
                else
                    purchaseable.push(element);
            });

            if (self.allowMicroTransactions()) {
                if (self.showLockedCommanders())
                    self.commanders(available.concat(purchaseable).concat(locked));
                else
                    self.commanders(available.concat(purchaseable));
            }
            else
                self.commanders(available);
        };

        var catalogCommanders = ko.pureComputed(function() {
            return PlayFab.catalog().filter(function (x) {
                // It's a commander - and it's represented by UberNet - and it's represented in the PA catalog
                return x.ClassName == 'Commander' && x.CatalogVersion != null && CommanderUtility.byObjectName.getSpecPath(x.ObjectName) != null;
            });
        });

        self.badges = ko.pureComputed(function() {
            return _.filter(Badges.all, function (badge) { return PlayFab.isItemOwned(badge.objectName); });
        });

        var expansionCatalogItem = ko.observable();
        self.costForExpansion = ko.pureComputed(function() {
            var realMoneyPrice = _.get(expansionCatalogItem(), ['Prices', 'RM']);
            if (realMoneyPrice)
                return self.formatRM(realMoneyPrice);
            else return '';
        });

        self.populateInventory = function () {
            expansionCatalogItem(PlayFab.getCatalogItem('PAExpansion1DLC'));
            self.commanders(_.map(catalogCommanders(), function(commander) {
                commander = _.cloneDeep(commander);
                var specPath = CommanderUtility.byObjectName.getSpecPath(commander.ObjectName);
                if (specPath)
                {
                    var spec = CommanderUtility.bySpec.getSpec(specPath);
                    commander.KSBacker = _.get(spec, 'kickstarter_backer');
                }
                return commander;
            }));
            self.sortCommanders();
            self.ubernetCallPending(false);
        }
        CommanderUtility.afterCommandersLoaded(function() {
            self.populateInventory();
        });

        self.ubernetRefreshInventory = function () {
            self.commanders([]);
            self.ubernetCallPending(true);
            PlayFab.updateCatalog(function () {
                self.populateInventory();
            });
        }

        self.inventoryError = function () {
            ownsIdx = PlayFab.catalog().map(function (e) { return e.IsOwned; }).indexOf(true);
            if (ownsIdx > -1)
                return false;

            return true;
        }

        self.ownsItem = function (item) {
            var result = $.grep(PlayFab.catalog(), function (e) { return e.ObjectName == item; });
            if (result.length == 0) {
                return false;
            } else {
                return result[0].IsOwned;
            }
        };

        self.selectedIsNotOwned = ko.computed(function () {
            var commander = self.commanders()[self.selectedCommanderIndex()];
            if (commander)
                return !self.ownsItem(commander.ObjectName);
            else
                return false;
        });
        self.selectedIsAvailableForUse = ko.computed(function () {
            var commander = self.commanders()[self.selectedCommanderIndex()];
            if (commander)
                return commander.IsOwned || commander.IsFree;
            else
                return false;
        });
        self.selectedIsNotAvailableForUse = ko.computed(function () { return !self.selectedIsAvailableForUse(); });
        self.selectedItemIsInCart = ko.computed(function () {
            var commander = self.commanders()[self.selectedCommanderIndex()];
            if (!commander)
                return false;

            return _.some(self.cart(), function (element) {
                return element.Item.ObjectName === commander.ObjectName
            });
        });
        self.selectedIsForSale = ko.computed(function () {
            var commander = self.commanders()[self.selectedCommanderIndex()];
            if (!commander)
                return false;

            if (commander.NotForSale)
                return false;

            if (self.selectedIsAvailableForUse())
                return false;

            if (self.selectedItemIsInCart())
                return false;

            return true;
        });
        self.selectedIsNotForSale = ko.computed(function () { return !self.selectedIsForSale(); });


        self.selectCommander = function () {
            if (self.selectedIsNotAvailableForUse())
                return;

            var commander = self.commanders()[self.selectedCommanderIndex()];

            if (self.selectedIsDefault()) {
            	self.preferredCommander(null);
            	self.hasEverSelectedCommander(false);
            } else {
            	self.preferredCommander(CommanderUtility.byObjectName.getSpecPath(commander.ObjectName));
            	self.hasEverSelectedCommander(true);
            }
        };

		self.selectedIsDefault = ko.computed(function () {
			var commander = self.commanders()[self.selectedCommanderIndex()];
			if (!commander) return false;

			return self.preferredCommander() && self.preferredCommander() === CommanderUtility.byObjectName.getSpecPath(commander.ObjectName);
		});

        self.selectedIsAvailableForUse = ko.computed(function () {
            var commander = self.commanders()[self.selectedCommanderIndex()];
            if (commander)
                return commander.IsOwned || commander.IsFree;
            else
                return false;
        });

        self.allowRedeemCoupon = ko.computed(function () {
            return !!(self.signedInToUbernet() && self.couponCode() && self.couponCode().length);
        });

        self.redeemCouponPending = ko.observable(false);

        self.redeemCoupon = function () {

            if (self.redeemCouponPending())
                return;

            var code = self.couponCode();
            if (!code || code.length == 0) {
                self.couponRedeemMessage("Please enter a coupon code.");
                return;
            }

            self.redeemCouponPending(true);

            var call = engine.asyncCall("ubernet.redeemCoupon", code);
            call.done(function (data) {
                self.redeemCouponPending(false);
                self.couponCode('');

                data = JSON.parse(data);
                if (data.GrantedItems) {
                    var msg;

                    var itemsDisplay = data.GrantedItems.map(function (e) {
                        var item = PlayFab.getCatalogItem(e.ObjectName);
                        if (item)
                            return item.DisplayName;
                        else {
                            debug.log('ubernet.redeemCoupon failed');
                            debug.log(e.ObjectName);
                            return 'Unknown Item';
                        }
                    });
                    msg = (itemsDisplay.length > 1) ? "You've successfully unlocked these commanders: ": "You've successfully unlocked the commander: ";
                    for (var i = 0; i < itemsDisplay.length; i++) {
                        msg = msg + JSON.stringify(itemsDisplay[i]) + "  ";
                    }
                    self.couponRedeemMessage(msg);

                    _.forEach(data.GrantedItems, function (item) {
                        if (_.has(item, 'ObjectName'))
                            PlayFab.addInventoryItem(item.ObjectName);
                    });
                }
            });
            call.fail(function (data) {
                self.redeemCouponPending(false);

                if (!data) {
                    self.couponRedeemMessage("Please sign in to PlayFab.");
                    return;
                }
                data = JSON.parse(data);
                if (data.ErrorCode) {
                    self.couponRedeemMessage(data.Message);
                    self.couponCode('');
                }
            });

        }

        self.addItemToCart = function (item, quant) {

            var catalogItem = PlayFab.getCatalogItem(item);

            var cartItem = _.find(self.cart(), function (element) {
                return element.Item.ObjectName === item;
            });

            quant = (quant >= 0) ? quant : 1;
            if (!cartItem) {
                cartItem = {
                    Item: catalogItem,
                    Quantity: quant
                };
                self.cart.push(cartItem);
            }
            else
                cartItem.Quantity += quant;

            self.createCart();
        };

        self.removeItemFromCartByIndex = function (index) {
            self.cart().splice(index, 1);
            self.cart.notifySubscribers();

            self.createCart();
        }

        self.cartSize = ko.computed(function () {
            var result = 0;

            if (self.createCartResult() && self.createCartResult().Contents)
                result = self.createCartResult().Contents.length;

            return result;
        });

        self.stringifyPrice = function (item) {
            // localize currency?
            var dollars = item / 100;
            return '$' + dollars.toFixed(2);
        };

        self.creditApplied = ko.computed(function () {
            if (!self.createCartResult())
                return '';

            /* StoreCredit (if applied) will show up on all payment options,
               so we just check the first one. */
            var t = _.find(self.createCartResult().PaymentOptions,
                           function (element) { return element.Currency === 'RM' && element.StoreCredit });

            if (!t)
                return '';

            return self.stringifyPrice(t.StoreCredit);
        });

        self.showCreditApplied = ko.computed(function () {

            if (!self.createCartResult())
                return false;

            /* StoreCredit (if applied) will show up on all payment options,
               so we just check the first one. */
            var t = _.find(self.createCartResult().PaymentOptions,
                           function (element) { return element.Currency === 'RM' && element.StoreCredit });

            return !!t;
        });

        self.getTotal = function () {
            var RMopt = $.grep(self.createCartResult().PaymentOptions, function (e) { return e.Currency == 'RM'; })[0];
            return self.stringifyPrice(RMopt.Price);
        };


        self.cartQuantity = function (item) {
            var cartItemIndex = self.cart().map(function (e) { return e.Name(); }).indexOf(item);
            if (cartItemIndex == -1) {
                return;
            }
            else {
                return self.cart()[cartItemIndex].Quantity;
            }
        };



        self.createCart = function () {
            self.ubernetCallPending(true);

            var call = engine.asyncCall("ubernet.createCart", model.createCartJson());
            call.done(function (data) {
                api.debug.log('ubernet.createCart: ok');
                data = JSON.parse(data);
                if (!data.Contents)
                    return;
                self.createCartResult(data);
                self.purchaseState('cartCreated');
                self.ubernetCallPending(false);
            });
            call.fail(function (data) {
                console.log('ubernet.createCart: fail');
                self.createCartResult(null);
                self.ubernetCallPending(false);
            });

        }

        self.initiatePurchase = function () {
            self.ubernetCallPending(true);
            model.overlaySequenceComplete(false);

            engine.asyncCall('ubernet.initiatePurchase', model.createInitatePurchaseRequestJson())
                .done(function (data) {
                    api.debug.log('ubernet.initiatePurchase: ok');

                    data = JSON.parse(data);
                    api.debug.log(data);
                    if (!data.Purchase) {
                        self.ubernetCallPending(false);
                        return;
                    }

                    self.initiatePurchaseResult(data);
                    if (data.PurchaseConfirmationPageURL) {
                        api.debug.log(data.PurchaseConfirmationPageURL);
                        self.overlayUrl(data.PurchaseConfirmationPageURL);
                        self.showExternalOverlay(true);
                    }
                    else {
                        if (data.Purchase.CreditApplied >= data.Purchase.PurchasePrice) {
                            self.completePurchaseResult(null);
                            self.showLocalOverlay(true);
                            model.overlaySequenceComplete(true);
                            self.completePurchase();
                        }
                    }

                    self.ubernetCallPending(false);
                })
                .fail(function (data) {
                    console.log('ubernet.initiatePurchase: fail');
                    self.ubernetCallPending(false);
                });
        }

        self.completePurchase = function () {

            if (!self.createCartResult())
                return;

            self.ubernetCallPending(true);

            var call = engine.asyncCall("ubernet.completePurchase", self.createCartResult().OrderId);

            call.done(function (data) {
                api.debug.log('ubernet.completePurchase: ok');
                data = JSON.parse(data);
                api.debug.log(data);
                model.completePurchaseResult(data);

                if (data.Purchase && data.Purchase.Status && data.Purchase.Status === 3) {
                    self.purchaseOver(true);
                    model.ubernetRefreshInventory();

                    if (!self.showLocalOverlay()) {
                        model.navToTab('commanders');
                        self.clearPurchase();
                    }
                }
                else {
                    api.debug.log('ubernet.completePurchase: unexpected status');
                    self.showExternalOverlay(false);
                    self.createCart();
                }

                self.ubernetCallPending(false);
            });
            call.fail(function (data) {
                console.log('ubernet.completePurchase: fail');
                self.purchaseOver(false);
                self.ubernetCallPending(false);
            });
        }

        self.clearPurchase = function () {
            self.showExternalOverlay(false);
            self.showLocalOverlay(false);
            self.completePurchaseResult(null);
            self.overlayUrl('coui://ui/main/game/overlay/overlay.html');
            self.initiatePurchaseResult(null);
            self.purchaseState(null);
            self.createCartResult(null);
            api.debug.log('clear purchase');
            self.cart([]);
        }

        self.purchaseOver = function (success) {
            api.debug.log('purchase over');
            self.showExternalOverlay(false);
            if(!success)
                self.createCart();
        }


        self.addCart = function () {
            if (self.selectedIsNotForSale())
                return;

            $('a[href="#cart"]').click();

            var commander = self.commanders()[self.selectedCommanderIndex()];
            self.addItemToCart(commander.ObjectName, 1);
        }


        self.addCartExpansion = function () {
            if (api.content.ownsTitans())
            {
                self.navToTab('commanders');
                return;
            }

            if (api.steam.hasClient())
            {
                api.steam.openContentStorePage('PAExpansion1').fail(function(error) {
                    // TODO: if (error === api.steam.errors.OVERLAY_DISABLED)
                    $('#steamOverlayDisabled').modal('show');
                });
                return;
            }

            self.navToTab('cart');
            var cartItem = _.find(self.cart(), function (element) { return element.Item.ObjectName === 'PAExpansion1DLC'; });
            if (!cartItem || cartItem.Quantity <= 0)
                self.addItemToCart('PAExpansion1DLC', 1);
        }

        $('#iframe').on('load', (function () {
            var url = $('#iframe')[0].src;
            self.currentURL(url);
        }));

        $('#iframe').on('error', (function () {
            var url = $('#iframe')[0].src;
            self.currentURL(url);
        }));


        self.showJustUnlockedTitansModal = function () {
            $('#justUnlockedTitans').modal('show');
        }

        self.launchTitansAndExit = function() {
            api.steam.launchContent('PAExpansion1').then(function() {
                engine.call('exit');
            });
        };

        if (api.steam.hasClient() && !api.steam.accountOwnsTitans()) {
            // start polling for titans purchase... there are better wasy to do this, but we don't really have time
            var process = function () {
                api.steam.updateAccountContent();

                if (api.steam.accountOwnsTitans())
                    self.showJustUnlockedTitansModal();
                else
                    _.delay(process, 1000 /* ms */);
            };

            process();
        }

        self.setup = function()
        {
            if (!api.content.ownsTitans())
                self.navToTab('expansion');
        }

    }

    model = new ArmoryViewModel();

    handlers = {};

    handlers.steam_payment_complete = function (payload) {

        if (payload.success) {
            model.completePurchaseResult(null);
            model.showLocalOverlay(true);
            model.overlaySequenceComplete(true);
            model.completePurchase();
        }
        else
            model.createCart();
    }

    handlers['panel.url'] = function (payload) {
        if (payload.url.indexOf('authResult=AUTHORISED') !== -1) {
            model.ubernetRefreshInventory();
            model.overlaySequenceComplete(true);
        }
    }

    // inject per scene mods
    if (scene_mod_list['armory']) {
        loadMods(scene_mod_list['armory']);
    }

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    model.setup();

    // Set up the modal box
    $('#getData').modal();

    // Set up selectpickers to work as multi-select dropdowns
    $('#view-select').selectpicker({ noneSelectedText: 'Any selection' });

    // Set up resize event for window so we can smart-size the game list
    $(window).resize(respondToResize);

    // Do some initial resizing, since resize isn't called on page load (but this may not be accurate)
    model.containerHeight($("body").height() + 'px');
    model.containerWidth(($("body").width() - 10) + 'px');
    // Have to delay a few milliseconds, as immediate call was sometimes not calculating correctly
    window.setTimeout(respondToResize, 100);

    // Tell the model we're really, really here
    model.lastSceneUrl('coui://ui/main/game/armory/armory.html');

});

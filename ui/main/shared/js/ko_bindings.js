(function() {
    // add useful binding handlers to knockout

    ko.bindingHandlers.resize = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            valueAccessor()();
            // invoke the bound fn once on init
            UberUtility.addResizeListener(element, valueAccessor());
            // invoke the bound fn on each resize
        }
    };

    ko.bindingHandlers.overflow = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            valueAccessor()();
            // invoke the bound fn once on init
            UberUtility.addFlowListener(element, 'over', valueAccessor());
            // invoke the bound fn overflow,
        }
    };

    ko.bindingHandlers.underflow = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            valueAccessor()();
            // invoke the bound fn once on init
            UberUtility.addFlowListener(element, 'under', valueAccessor());
            // invoke the bound fn underflow,
        }
    };

    ko.bindingHandlers.autoscroll = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // right before the value changes, check if the parent of the element was scrolled to the bottom
            var bottom = false;
            valueAccessor().subscribe(function () {
                if (!element || !element.parentNode)
                    return;
                var p = element.parentNode;
                bottom = p.scrollHeight - p.scrollTop === p.clientHeight;
            }, null, "beforeChange");

            // right after the value changed, if the parent of the element was scrolled to the bottom, scroll it to the bottom again
            valueAccessor().subscribe(function (value) {
                if (!element || !element.parentNode)
                    return;
                if (bottom)
                    element.scrollIntoView(true);
            });
        }
    };

    ko.bindingHandlers.observeAttributes = {

        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            valueAccessor()();
            // invoke the bound fn once on init

            var observer = new WebKitMutationObserver(function(mutations) {
                valueAccessor()();
                // invoke the bound fn wheneve a property of the element *is written to*
                // if you overwrite an existing value with the same value this will still trigger
            });

            observer.observe(element, {
                attributes : true,
                subtree : false
            });
        }
    };

    ko.bindingHandlers.resetScrollOnChange = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.unwrap(valueAccessor());
            if (!_.has(element, 'scrollTop'))
                return;
            element.scrollTop = 0;
        },
    };

    ko.bindingHandlers.observeLocalAttributes = {

        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            valueAccessor()();
            // invoke the bound fn once on init

            var observer = new WebKitMutationObserver(function(mutations) {
                valueAccessor()();
                // invoke the bound fn whenever a property of the element *is written to*
                // if you overwrite an existing value with the same value this will still trigger
            });

            var i;
            for ( i = 0; i < element.parentElement.children.length; i++)
                observer.observe(element.parentElement.children[i], {
                    attributes : true,
                    subtree : false
                });

            //observer.observe(element, { attributes: true, subtree: false });
            observer.observe(element.parentElement, {
                attributes : true,
                subtree : false
            });
        }
    };

    ko.bindingHandlers.click_sound = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value === 'default')
                value = '/SE/UI/UI_Click';

            $(element).click(function() {
                api.audio.playSound(value);
            });
        }
    }

    ko.bindingHandlers.rollover_sound = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value === 'default')
                value = '/SE/UI/UI_Rollover';

            $(element).mouseenter(function() {
                api.audio.playSound(value)
            });
        }
    }

    ko.bindingHandlers.right_click = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor());

            $(element).mousedown(function(event) {
                if (event.which === 3) {
                    value();
                }
            });
        }
    }

    var last_rollover_group = null;

    /* rollover sounds don't work correctly when the element is recreated in response to a mouse event.
     the rollover sound plays once each time the element is created (assuming the mouse is over the element).
     this binding prevents that behavior by squelching rollover sounds if they come from the same group. */
    ko.bindingHandlers.rollover_sound_exclusive = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            $(element).mouseenter(function() {

                if (valueAccessor().group !== last_rollover_group) {
                    api.audio.playSound((valueAccessor().sound === 'default') ? '/SE/UI/UI_Rollover' : valueAccessor().sound);
                    last_rollover_group = valueAccessor().group;
                }
            });

            $(element).mouseout(function() {
                last_rollover_group = null
            });
        }
    }

    ko.bindingHandlers.selectPicker = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {

                if (ko.isObservable(valueAccessor()))
                    ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);

                $(element).addClass('selectpicker').selectpicker();

                var updateValue = function(value) {
                    $(element).selectpicker('val', value);
                    if (ko.isObservable(valueAccessor()))
                        ko.bindingHandlers.value.update(element, valueAccessor, allBindingsAccessor);
                    $(element).selectpicker('refresh');
                };

                var refeshPicker = function() {
                    $(element).selectpicker('refresh');
                }
                if (ko.isObservable(valueAccessor())) {
                    updateValue(valueAccessor()());
                    valueAccessor().subscribe(updateValue);
                }

                // KO 3 requires subscriptions instead of relying on this binding's update
                // function firing when any other binding on the element is updated.
                var subscriptions = [];

                // Add them to a subscription array so we can remove them when KO
                // tears down the element.  Otherwise you will have a resource leak.
                var addSubscription = function(bindingKey) {
                    var targetObs = allBindingsAccessor.get(bindingKey);

                    var fn = null;
                    if (bindingKey === 'value')
                        fn = function() {
                            updateValue(targetObs())
                        };
                    else
                        fn = function() {
                            refeshPicker();
                        };

                    if (targetObs && ko.isObservable(targetObs))
                        subscriptions.push(targetObs.subscribe(fn));
                };

                _.map(['options', 'value', 'enable', 'disable'], addSubscription);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    while (subscriptions.length)
                    subscriptions.pop().dispose();
                });
            }
        }
    };

    ko.bindingHandlers.slider = {
        init : function(element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('input')) {

                var accessor = valueAccessor().value;
                ko.bindingHandlers.value.init(element, accessor, allBindingsAccessor);

                var options = {
                    min : 0,
                    max : 100,
                    step : 1
                };
                _.assign(options, valueAccessor().options());
                options.value = accessor();

                $(element).slider(options).on('slide', function(ev) {
                    $(this).trigger("change");
                    accessor(ev.value);
                });
            }
        }
    };

    //when using this binding adding a data-placement attribute to the element enables specifying
    //the postionion of the tool tip. (e.g. data-placement="left")

    //if data-tooltipkey has been added, the key binding will be concatenated to the end of the
    //tool tip.
    ko.bindingHandlers.tooltip = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var titleFunc = function() {
                var value = loc(ko.unwrap(valueAccessor()));
                if (element.dataset["tooltipkey"]) {
                    var keybind = api.settings.value('keyboard', element.dataset["tooltipkey"]);
                    if (keybind) {
                        return value + " <span class=\"span_tooltip_hotkey\">" + keybind + "</span>";
                    }
                }

                return value;
            };

            $(element).tooltip({
                title : titleFunc,
                html : true,
                delay : {
                    show : 0,
                    hide : 100
                },
                animation : 'fadeIn',
            });
        }
    };

    // Shorthand to apply a CSS class when the (img) element is loaded.
    // Usage: <img src="huge.png" data-bind="css_when_loaded: 'loaded'" />
    ko.bindingHandlers.css_when_loaded = {
        init : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementLoaded = ko.observable(element && element.complete);
            var eventConfiguration = {
                load : function() {
                    elementLoaded(true);
                },
                unload : function() {
                    elementLoaded(false);
                }
            };

            var klass = ko.utils.unwrapObservable(valueAccessor());
            var cssConfiguration = {
                loadedObservable: elementLoaded
            };

            ko.utils.domData.set(element, 'css_when_loaded_configuration', function() {
                return cssConfiguration;
            });
            ko.bindingHandlers.event.init(element, function() {
                return eventConfiguration;
            }, allBindingsAccessor, viewModel, bindingContext);
        },
        update : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var cssConfiguration = ko.utils.domData.get(element, 'css_when_loaded_configuration');
            var className = ko.utils.unwrapObservable(valueAccessor());

            if (!className) {
                return;
            }

            var cssBindingConfig = {};
            cssBindingConfig[className] = cssConfiguration().loadedObservable;

            ko.bindingHandlers.css.update(element, ko.observable(cssBindingConfig), allBindingsAccessor, viewModel, bindingContext);
        }
    };

    /* This is helpful for variables in strings that you want localized. It does not support dynamic DOM updates in the body.
     * TODO: If you're using templates that need HTML quoting, this might behave oddly. */
    ko.bindingHandlers.vars = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var domPlaceholders = _.reduce(valueAccessor(), function(result, value, key) {
                result[key] = "<span class='_variable_placeholder' data-placeholder-key='" + key + "'></span>";
                return result;
            }, {});

            function findTextNodes(element, texts) {
                texts = texts || [];
                for (var child = element.firstChild; child !== null; child = child.nextSibling)
                {
                    if (child.nodeType == Node.TEXT_NODE)
                        texts.push(child);
                    else if (child.nodeType === Node.ELEMENT_NODE)
                        findTextNodes(child, texts);
                }

                return texts;
            };

            _.forEach(findTextNodes(element), function(node) {
                var src = node.textContent;
                var rendered = i18n.functions.applyReplacement(src, domPlaceholders);
                if (src !== rendered)
                {
                    var newNode = document.createElement('span');
                    newNode.innerHTML = rendered;
                    node.parentNode.insertBefore(newNode, node);
                    node.parentNode.removeChild(node);
                }
            });
        },
        update: function (element, valueAccessor) {
            var variables = valueAccessor();
            $(element).find('._variable_placeholder').each(function(i, placeholder) {
                var key = _.get(placeholder, 'dataset.placeholderKey');
                placeholder.textContent = ko.unwrap(_.get(variables, key));
            });
        }
    };
    ko.virtualElements.allowedBindings.vars = true;

    function bindingWithLocAccessor(binding) {
        function locValueAccessorFor(valueAccessor) {
            return function() {
                var value = valueAccessor();
                return loc(ko.unwrap(value));
            };
        }

        var newBinding = {};
        if (_.isFunction(binding.init))
        {
            newBinding.init = function() {
                var args = Array.prototype.slice.call(arguments);
                args[1] = locValueAccessorFor(args[1]);
                return binding.init.apply(this, args);
            };
        }

        if (_.isFunction(binding.update))
        {
            newBinding.update = function() {
                var args = Array.prototype.slice.call(arguments);
                args[1] = locValueAccessorFor(args[1]);
                return binding.update.apply(this, args);
            };
        }

        return newBinding;
    }

    ko.bindingHandlers.locText = bindingWithLocAccessor(ko.bindingHandlers.text);
    ko.bindingHandlers.locValue = bindingWithLocAccessor(ko.bindingHandlers.value);

    ko.bindingHandlers.deferBindingsUntilVisible = {
        init: function(element, valueAccessor) {
            return { 'controlsDescendantBindings': !!valueAccessor() };
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            if (!valueAccessor())
                return;

            if (!allBindings.has('visible'))
            {
                console.error("Attempting to apply deferBindingsUntilVisible, but no visible binding.")
                return;
            }

            if (_.has(element.dataset, 'deferredKOBindingsApplied'))
                return;

            var isVisible = ko.unwrap(allBindings.get('visible'));
            if (isVisible)
            {
                element.dataset['deferredKOBindingsApplied'] = true;
                ko.applyBindingsToDescendants(bindingContext, element);
            }
        }
    };
    ko.virtualElements.allowedBindings.deferKOBindings = true;

})();

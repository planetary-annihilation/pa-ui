function init_panel() {
    var DEFAULT_UPDATE_PERIOD = 200;
    var PANEL_RESIZE_UPDATE_PERIOD = 200;
    var ANIMATION_UPDATE_PERIOD = 5;
    var INVISIBLE_UPDATE_PERIOD = 1000;
    
    // Note: $div should be equivalent to $(div).  Passing them both individually
    // saves some performance, and this is called in a very performance-sensitive
    // function.
    var calcRegion = function($div, div) {
        // TODO: This currently includes border size.  Therefore, panels do
        // not properly support borders in the enclosing page.
        
        var boundingRect = div.getBoundingClientRect();
        var docWidth = window.innerWidth;
        var docHeight = window.innerHeight;
        
        return {
            left: (boundingRect.left / docWidth),
            top: (boundingRect.top / docHeight),
            width: (boundingRect.width / docWidth),
            height: (boundingRect.height / docHeight),
            zIndex: ($div.zIndex())
        };
    };

    var regionsAreDifferent = function (a, b) {
        return a.left !== b.left
            || a.top !== b.top
            || a.width !== b.width
            || a.height !== b.height
            || a.zIndex !== b.zIndex;
    };
    
    var testAttrFlag = function($div, attr) {
        var value = $div.attr(attr);
        return !_.isUndefined(value) && (value !== false); 
    };
    
    var normalizeBorder = function(border) {
        // Note: Less secure than explicitly parsing, but a lot faster & more reliable.
        try
        {
            if (_.isString(border))
                border = (new Function("return " + border))();
            return JSON.stringify(border);
        }
        catch (ex)
        {
            console.log('Panel warning: Invalid border', border);
            return '';
        }
    };

    var panel = function(div, config, onReady) {
        var $div = $(div);
        config = $.extend({}, config || {});
        
        if (!config.hasOwnProperty('src'))
            config.src = $div.attr('src');
        if (!config.hasOwnProperty('parent'))
            config.parent = panel.pageId;
        if (!config.hasOwnProperty('noInput'))
            config.noInput = testAttrFlag($div, 'no-input');
        if (!config.hasOwnProperty('noKeyboard'))
            config.noKeyboard = testAttrFlag($div, 'no-keyboard');
        if (!config.hasOwnProperty('yieldFocus'))
            config.yieldFocus = testAttrFlag($div, 'yield-focus');
        if (!config.hasOwnProperty('fit'))
            config.fit = $div.attr('fit');
        if (!config.hasOwnProperty('border'))
            config.border = $div.attr('border');
        if (!config.hasOwnProperty('layout'))
            config.layout = testAttrFlag($div, 'layout');
         if (!config.hasOwnProperty('noGPU'))
            config.noGPU = testAttrFlag($div, 'no-gpu');
        if (!config.hasOwnProperty('name'))
            config.name = $div.attr('id');
        if (config.hasOwnProperty('visible'))
            config.visible = !!config.visible;
        else if (!$div.is(':visible'))
            config.visible = false;
        
        var updatePeriod = DEFAULT_UPDATE_PERIOD;
        if (config.hasOwnProperty('updatePeriod')) {
            updatePeriod = config.updatePeriod;
            delete config.updatePeriod;
        }
        
        var result = this;
        result.name = config.name || '';
        result.src = config.src || '';
        result.layout = !!config.layout;
        result.noGPU = !!config.noGPU;
        result.noInput = !!config.noInput;
        result.noKeyboard = !!config.noKeyboard;
        result.yieldFocus = !!config.yieldFocus;
        result.fit = config.fit || '';
        result.border = config.border || '';
        result.visible = config.hasOwnProperty('visible') ? !!config.visible : true;
        result._$div = $div;
        result._div = div;
        result._$dock = $($div.children('panel-dock')[0]);
        if (!result._$dock.length) {
            result._$dock = $('<panel-dock style="display:inline-block"></panel-dock>');
            $div.append(result._$dock);
        }
        result.region = calcRegion($div, div);
        result.updatePeriod = updatePeriod;

        $.extend(config, result.region, {name: config.name, parent: config.parent, border: normalizeBorder(result.border)});

        engine.call('panel.create', JSON.stringify(config)).then(function (id) {
            if (id < 0) {
                result.destroy();
                return;
            }
            result.id = id;
            api.panelsById[id] = result;
            result.observer = new MutationObserver(function() { 
                if (!result.hasOwnProperty('_observerTimer'))
                {
                    result._observerTimer = setTimeout(function() { 
                        result.updateAttr(); 
                        delete result._observerTimer; 
                    }, 0);
                }
            });
            result.observer.observe(div, {attributes: true, attributeFilter: ['src', 'layout', 'no-input', 'no-keyboard', 'yield-focus', 'fit', 'border']});
            result.updateAttr();
            result.update();
            if (onReady)
                onReady();
        });

        $div.on('DOMNodeRemoved', function() { result.destroy(); });
        $div.on('DOMNodeRemovedFromDocument', function() { result.destroy(); });
        $(window).on('beforeunload', function() { result.destroy(); });
        
        $div.data('panel', result);
    };
    
    panel.prototype.destroy = function() { 
        if (this.hasOwnProperty('observer')) {
            this.observer.disconnect();
            delete this.observer;
        }
        if (this.hasOwnProperty('id')) {
            engine.call('panel.destroy', this.id); 
            delete api.panelsById[this.id];
            delete this.id;
        }
        if (this.hasOwnProperty('name')) {
            if (api.panels[this.name] === this)
                delete api.panels[this.name];
            delete this.name;
        }
    };
    
    panel.prototype.update = function() {
        var self = this;
        
        if (!self.hasOwnProperty('id'))
            return;

        var curRegion = calcRegion(self._$div, self._div);
        var region;

        // Note: Must be part of polling to handle parent visibility properly
        self.updateVisibility();
        
        if (self.visible && regionsAreDifferent(curRegion, self.region)) {
            self.region = curRegion;

            region = JSON.stringify(self.region);

            engine.call('panel.move', self.id, region);
        }
        
        if (self._updateTimeout !== undefined)
            window.clearTimeout(self._updateTimeout);
        var refreshPeriod = self.visible ? Math.min(self.updatePeriod, panel.updatePeriod) : INVISIBLE_UPDATE_PERIOD;
        this._updateTimeout = window.setTimeout(function() { 
            self._updateTimeout = undefined;
            window.requestAnimationFrame(_.bind(self.update, self)); 
        }, refreshPeriod);
    };
    panel.update = function() {
        _.each(api.panels, function(p) { p.update(); });
    };
    
    panel.prototype.updateVisibility = function() {
        if (!this.hasOwnProperty('id'))
            return false;
        
        var isVisible = this._$div.is(':visible');
        if (this.visible !== isVisible)
        {
            this.visible = isVisible;
            engine.call('panel.visible', this.id, isVisible);
            return true;
        }
        return false;
    };
    
    panel.prototype.updateAttr = function() {
        var self = this;
        
        if (!self.hasOwnProperty('id'))
            return;

        if (self.updateVisibility()) {
            // Note: This updates the polling period to the invisible rate
            this.update();
        }
        
        var newSrc = self._$div.attr('src') || '';
        if (self.src !== newSrc) {
            self.src = newSrc;
            engine.call('panel.navigate', self.id, newSrc);
        }
        
        var newLayout = testAttrFlag(self._$div, 'layout');
        if (self.layout !== newLayout) {
            self.layout = newLayout;
            engine.call('panel.layout', self.id, newLayout);
        }
        
        var newNoInput = testAttrFlag(self._$div, 'no-input');
        if (self.noInput !== newNoInput) {
            self.noInput = newNoInput;
            engine.call('panel.noInput', self.id, newNoInput);
        }

        var newNoKeyboard = testAttrFlag(self._$div, 'no-keyboard');
        if (self.noKeyboard !== newNoKeyboard) {
            self.noKeyboard = newNoKeyboard;
            engine.call('panel.noKeyboard', self.id, newNoKeyboard);
        }

        var newYieldFocus = testAttrFlag(self._$div, 'yield-focus');
        if (self.yieldFocus !== newYieldFocus) {
            self.yieldFocus = newYieldFocus;
            engine.call('panel.yieldFocus', self.id, newYieldFocus);
        }

        var newFit = self._$div.attr('fit') || '';
        if (self.fit !== newFit) {
            self.fit = newFit;
            engine.call('panel.fit', self.id, newFit);
        }
        
        var newBorder = self._$div.attr('border') || '';
        if (self.border !== newBorder) {
            self.border = newBorder;
            engine.call('panel.border', self.id, normalizeBorder(newBorder));
        }
    };
    
    panel.prototype.focus = function() {
        var self = this;
        if (!self.hasOwnProperty('id'))
            return;
        
        panel.focus(self.id);
    };
    panel.prototype.blur = function() {
        panel.focus(-1);
    };
    panel.focus = function(id) {
        engine.call('panel.setFocus', id);
    };
    
    if (typeof gPanelPageId !== 'undefined')
        panel.pageId = gPanelPageId;
    if (typeof gPanelPageName !== 'undefined')
        panel.pageName = gPanelPageName;
    if (typeof gPanelParentId !== 'undefined')
        panel.parentId = gPanelParentId;
    
    panel.bindElement = function(element) {
        if (api.panels[element.id])
            api.panels[element.id].destroy();
        var panel = new api.Panel(element);
        api.panels[element.id] = panel;
    };
    panel.bindPanels = function() {
        $('panel').each(function() {
            if (!api.panels.hasOwnProperty(this.id))
                api.Panel.bindElement(this);
        });
    };

    function dockResize(payload) {
        var panel = api.panelsById[payload.id];
        if (!panel)
            return;
        
        panel._$dock.width(payload.width);
        panel._$dock.height(payload.height);
        panel.update();
        _.delay(function() { panel.update(); });
    }
    
    var bodySize = {width: -1, height: -1};
    if (panel.pageId !== panel.parentId) {
        panel.onBodyResize = function() {
            var dock = document.getElementsByTagName('body-dock')[0] || document.body;
            var newWidth = dock.offsetWidth;
            var newHeight = dock.offsetHeight;
            if ((newWidth !== bodySize.width) || (newHeight !== bodySize.height)) {
                bodySize.width = newWidth;
                bodySize.height = newHeight;
                panel.message(panel.parentId, 'panel.resize', 
                    {
                        id: panel.pageId,
                        width: newWidth,
                        height: newHeight
                    }
                );
            }
        };
    }
    else {
        panel.onBodyResize = function() {};
    }

    panel.message = function(name, message, payload) {
        var engineApi = 'panel.message';
        if (typeof(name) === 'number')
            engineApi = 'panel.messageById';
        engine.call(engineApi, name, message, JSON.stringify(payload) || '');
    };
    
    panel.prototype.message = function(message, payload) {
        engine.call('panel.messageById', this.id, message, JSON.stringify(payload) || '');
    };
    
    var lastQueryId = _.now() % 10000;
    var queries = {};
    var onQueryResponse = function(payload) {
        var deferred = queries[payload.id];
        if (!deferred) {
            console.error('Mismatched panel query response encountered', payload);
            return;
        }
        delete queries[payload.id];
        deferred.resolve(payload.response);
    };
    var onQuery = function(package) {
        var handler = handlers[package.message_type];
        if (!handler) {
            console.error('Unknown panel query', package);
        }
        var result = handler && handler(package.payload);
        $.when(result).then(function(response) {
            var responsePackage = {
                id: package.id,
                response: response
            };
            engine.call('panel.messageById', package.origin, 'panel.query_response', JSON.stringify(responsePackage));
        });
    };
    
    panel.query = function(name, message, payload) {
        lastQueryId = lastQueryId + 1;
        var package = {
            id: lastQueryId,
            origin: panel.pageId,
            message_type: message,
            payload: payload
        };
        var deferred = $.Deferred();
        queries[lastQueryId] = deferred;
        var engineApi = 'panel.message';
        if (typeof(name) === 'number')
            engineApi = 'panel.messageById';
        engine.call(engineApi, name, 'panel.query', JSON.stringify(package));
        return deferred.promise();
    };
    panel.prototype.query = function(message, payload) {
        return panel.query(this.id, message, payload);
    };
    
    panel.ready = function(filters) {
        if (!globalHandlers.hasOwnProperty('panel.resize')) 
            globalHandlers['panel.resize'] = dockResize;
        if (!globalHandlers.hasOwnProperty('panel.query')) 
            globalHandlers['panel.query'] = onQuery;
        if (!globalHandlers.hasOwnProperty('panel.query_response')) 
            globalHandlers['panel.query_response'] = onQueryResponse;
        // Make sure the filter includes our messages.
        filters = (filters || []);
        if (filters.length)
            filters = filters.concat(['panel.resize', 'panel.query', 'panel.query_response']);
        engine.call('panel.ready', panel.pageId, filters);

        if (panel.pageId !== panel.parentId) {
            // Note: The resize listener appears to be unreliable.  
            // Currently using a polling mechanism instead.
            //UberUtility.addResizeListener(document.body, onBodyResize);
            setInterval(panel.onBodyResize, PANEL_RESIZE_UPDATE_PERIOD);
            panel.onBodyResize();
        }
    };
    
    // "updatePeriod" controls how often the panel regions will be updated.
    // beginAnimation() can be called to change the update period, either on a 
    // specific panel, or globally across all panels.  (Period is measured in
    // ms.  Lower numbers use up more CPU, but animate more smoothly.)
    // When animation is finished, call the function returned by beginAnimation
    // to reset the update period to its previous value.
    // eg:
    //  $("#side_panel_container").animate({top:-100}, 500, "swing", api.panels.side.beginAnimation())
    
    panel.updatePeriod = DEFAULT_UPDATE_PERIOD;
    panel.beginAnimation = function(newPeriod) {
        var self = this;
        var oldPeriod = self.updatePeriod;
        if (newPeriod === undefined)
            newPeriod = ANIMATION_UPDATE_PERIOD;
        self.updatePeriod = Math.max(newPeriod, ANIMATION_UPDATE_PERIOD);
        self.update();
        return function() {
            self.updatePeriod = oldPeriod;
            self.update();
        };
    };
    panel.prototype.beginAnimation = panel.beginAnimation;
    
    api.Panel = panel;
    api.panels = {};
    api.panelsById = {};
}

init_panel(api);

$(document).ready(function() {
    api.Panel.bindPanels();
});

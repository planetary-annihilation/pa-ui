Mousetrap = (function (Mousetrap) {
    var self = Mousetrap,
        _oldHandleKey = self.handleKey,
        modifierState = {
            'shift': false,
            'ctrl': false,
            'alt': false,
            'meta': false
        };

    self.processModifiersForEvent = function (event) {

        if (!_.isUndefined(event.shiftKey))
            modifierState['shift'] = !!event.shiftKey;

        if (!_.isUndefined(event.ctrlKey))
            modifierState['ctrl'] = !!event.ctrlKey;

        if (!_.isUndefined(event.altKey))
            modifierState['alt'] = !!event.altKey;

        if (!_.isUndefined(event.metaKey))
            modifierState['meta'] = !!event.metaKey;
    }

    self.handleKey = function (character, modifiers, event) {
        if (self.isModifier(character))
        {
            if (event.type === 'keyup')
                modifierState[character] = false;
            else if (event.type === 'keydown')
                modifierState[character] = true;
        }

        _oldHandleKey(character, modifiers, event);
    };
    
    var isModifierDown = function (modifier) {
        return !!modifierState[modifier];
    };

    self.isShiftDown = function () {
        return isModifierDown('shift');
    };

    self.isCtrlDown = function () {
        return isModifierDown('ctrl');
    };

    self.isAltDown = function () {
        return isModifierDown('alt');
    };

    self.isMetaDown = function () {
        return isModifierDown('meta');
    };

    return self;
})(Mousetrap);

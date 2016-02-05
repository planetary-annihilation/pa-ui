Mousetrap = (function (Mousetrap) {
    var self = Mousetrap,
        _oldHandleKey = self.handleKey,
        _oldFireCallback = self.fireCallback,s
        prev_combo = '',
        allow_repeat_map = {};

    self.handleKey = function (character, modifiers, e) {
        if (e.type === 'keyup')
            prev_combo = '';
        _oldHandleKey(character, modifiers, e);
    };

    var stripModifiers = function (combo) {
        return combo
                .replace('shift+', '')
                .replace('ctrl+', '')
                .replace('alt+', '')
                .replace('meta+', '');
    };

    self.fireCallback = function (callback, e, combo, sequence) {

        if (prev_combo && prev_combo === combo && !allow_repeat_map[combo] && !allow_repeat_map[stripModifiers(combo)])
            return;
        prev_combo = combo;

        _oldFireCallback(callback, e, combo, sequence);
    };

    self.setAllowRepeatMap = function (map) {
        if (!map)
            return;
        allow_repeat_map = map;
    };

    self.resetRepeatState = function () {
        prev_combo = '';
    };

    return self;
})(Mousetrap);

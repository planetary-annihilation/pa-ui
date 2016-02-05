/* Does read/write to settings, stores in PlayFab and caches in local storage */

var VOLUME_LOG_ORDERS = 7;
var mapToLog = function(value, orders) {
    var power = (1.0 - (value / 100)) * orders;
    var factor = Math.pow(0.5, power);
    return (value) ? ((value === 100) ? 100 : factor * 100) : 0;
};

function init_settings(api) {

    api.settings = {
        // Get a settings value
        get: function (group, key) {
            var self = this;
            var result = $.Deferred();

            // Make sure the group and key are defined
            if (!self.isValid(group, key))
                result.reject('Group/key combination is not a valid setting');
            else
                result.resolve(self.value(group, key));

            return result.promise();
        },
        getSynchronous: function (group, key) {
            var self = this;
            // Make sure the group and key are defined
            if (!self.isValid(group, key))
                return null;

            return self.value(group, key);
        },
        // Set a settings value

        set: function (group, key, value, check_default) {
            var self = this;
            var result = $.Deferred();

            // Make sure the group and key are defined
            if (!self.isValid(group, key)) {
                result.reject('Group/key combination is not a valid setting');
                return result.promise();
            }

            if (check_default) {
                if (self.isDefaultValue(group, key, value)) {
                    result.resolve();
                    return result.promise();
                }
            }

            if (_.isUndefined(self.data[group]))
                self.data[group] = {};

            if (self.data[group][key] !== value) {
                self.isDirty(true);
                self.isDefault(false);
            }

            self.data[group][key] = value;

            if (self.observableMap[group] && self.observableMap[group][key])
                self.observableMap[group][key](value);

            result.resolve();

            return result.promise();
        },

        restoreDefaults: function () {
            var self = this;

            self.isDirty(!_.isEmpty(self.data));
            self.isDefault(true);

            self.data = {};
        },

        restoreGroupDefaults: function (group) {
            var self = this;

            self.isDirty(!_.isUndefined(self.data[group]));
            delete self.data[group];
            self.isDefault(_.isEmpty(self.data));
        },

        localStorageKey: function () {
            var uberName = localStorage.getItem('uberName');
            return uberName + '.paSettings';
        },

        loadLocalData: function () {
            var self = this;

            if (localStorage.getItem(self.localStorageKey()) === 'undefined')
                localStorage.setItem(self.localStorageKey(), JSON.stringify({}));

            // First load the local settings, which includes the locally cached remote settings
            var stored = localStorage.getItem(self.localStorageKey());

            try {
                self.isDefault(_.isEmpty(stored));
                self.data = _.isEmpty(stored) ? {} : JSON.parse(stored);
            } catch (error) {
                console.error('local settings data is malformed');
                console.error(stored);
            }
        },

        // Get our data from storage
        // Pass force=true to force a refresh from storage even if previously loaded
        load: function (force, local) {

            var self = this;
            var result = $.Deferred();

            if (force || !self.loaded) {

                // First load the local settings, which includes the locally cached remote settings
                self.loadLocalData();

                if (!local) // Get remote data from PlayFab, on success use that over local storage
                    engine.asyncCall("ubernet.getUserCustomData", JSON.stringify(['paSettings']))
					    .done(function (data) {
					        try {
					            if (data) {
					                var payload = JSON.parse(data).Data.paSettings
					                self.data = _.assign(payload, self.dataForLocal());
					                self.isDefault(_.isEmpty(payload));
					            }

					            localStorage.setItem(self.localStorageKey(), JSON.stringify(self.data));
    				            result.resolve({ loadedFromPlayFab: true });
					        } catch (error) {
					            result.resolve({ loadedFromPlayFab: false, badJsonData: true });
					        }
					    })
					    .fail(function (data) {
					        result.resolve({ loadedFromPlayFab: false });
					    });
            }
            else
                result.resolve({ loadedFromPlayFab: false });

            return result.promise();
        },

        // Push data to storage
        // Remotely stored data (like PlayFab) will be pushed there, but also stored locally
        save: function () {
            var self = this;
            var result = $.Deferred();

            // push a subset of the stored data to PlayFab
            engine.asyncCall("ubernet.updateUserCustomData", JSON.stringify({ paSettings: self.dataForPlayFab() }))
				.done(function (data) {
				    result.resolve({ savedToPlayFab: true });
				})
				.fail(function (data) {
				    result.resolve({ savedToPlayFab: false });
				});

            // and store all the data locally
            localStorage.setItem(self.localStorageKey(), JSON.stringify(self.data));

            self.isDirty(false);

            return result.promise();
        },

        // Determines if a given setting is defined
        isValid: function (group, key) {
            var self = this;

            if (!self.definitions[group] || _.isUndefined(self.definitions[group].settings[key]))
                return false;

            return true;
        },

        // Determines if we have an explicitly set value stored (versus using a default)
        // We're already in there, so we return the actual value if it is set and the "get" arg is true
        isSet: function (group, key, get) {
            var self = this;
            var result;

            if (!self.data[group])
                return;

            result = self.data[group][key];

            return get ? result : true;
        },

        value: function (group, key) {
            var self = this;

            var result = self.isSet(group, key, true);
            if (_.isUndefined(result)) {
                var def = self.definitions[group];
                if (def) {
                    var entry = def.settings[key];
                    if (entry)
                        result = entry.default;
                }
            }

            return result;
        },

        isDefaultValue: function (group, key, value) {
            var self = this;
            var result = false;
            var def = self.definitions[group];
            if (def) {
                var entry = def.settings[key];
                if (entry)
                    result = (entry.default === value);
            }

            return result;
        },

        apply: function (groups) {
            var self = this;

            if (!groups)
                groups = _.keys(self.definitions);

            if (_.contains(groups, 'graphics')) {
                engine.call('set_option', 'graphics', self.value('graphics', 'quality').toLowerCase());
                engine.call('set_option', 'graphics.vte', self.value('graphics', 'texture').toLowerCase());
                engine.call('set_option', 'graphics.headlights', self.value('graphics', 'headlights').toLowerCase());
                engine.call('set_option', 'graphics.shadows', self.value('graphics', 'shadows').toLowerCase());
                engine.call('set_option', 'graphics.ao', self.value('graphics', 'ambient_occlusion').toLowerCase());
                engine.call('set_option', 'graphics.hdr', self.value('graphics', 'hdr').toLowerCase());
                engine.call('set_option', 'graphics.aa', self.value('graphics', 'anti_aliasing').toLowerCase());
                engine.call("set_resolution_scaling", Number(self.value('graphics', 'resolution_scaling')));
                engine.call("set_option", "graphics.display_mode", self.value('graphics', 'display_mode').toLowerCase());
            }

            if (_.contains(groups, 'audio')) {
                engine.call("set_volume", 'master', mapToLog(self.value('audio', 'master'), VOLUME_LOG_ORDERS) / 100);
                engine.call("set_volume", 'music', mapToLog(self.value('audio', 'music'), VOLUME_LOG_ORDERS) / 100);
                engine.call("set_volume", 'SFX', mapToLog(self.value('audio', 'sfx'), VOLUME_LOG_ORDERS) / 100);
                engine.call("set_volume", 'Voice', mapToLog(self.value('audio', 'voice'), VOLUME_LOG_ORDERS) / 100);
            }

            if (_.contains(groups, 'camera')) {
                engine.call("set_camera_mouse_pan_speed", self.value('camera', 'mouse_pan_speed') / 10);
                engine.call("set_camera_key_pan_speed", self.value('camera', 'key_pan_speed') / 10);
                engine.call("set_camera_zoom_speed", self.value('camera', 'zoom_speed') / 10);
                engine.call("set_camera_friction", self.value('camera', 'camera_friction') / 10);
                engine.call("set_camera_edge_scroll", self.value('camera', 'edge_scroll_options').toLowerCase());
                engine.call("set_camera_pole_lock", self.value('camera', 'pole_lock').toLowerCase());
            }

            if (_.contains(groups, 'ui')) {
                engine.call('game.updateDisplaySettings', JSON.stringify({
                    'always_show_sicons': self.value('ui', 'show_unit_icons') === 'ALWAYS',
                    'never_show_sicons': self.value('ui', 'show_unit_icons') === 'NEVER',
                    'show_metal_icons': self.value('ui', 'show_metal_spot_icons') === 'ON',
                    'sicon_display_distance_scale': self.value('ui', 'icon_display_distance'),
                    'always_show_stat_bars': self.value('ui', 'show_stat_bars') === 'ALWAYS',
                    'never_show_stat_bars': self.value('ui', 'show_stat_bars') === 'NEVER',
                    'always_show_orders': self.value('ui', 'show_orders') === 'ALWAYS',
                    'never_show_orders': self.value('ui', 'show_orders') === 'NEVER',
                    'show_orders_if_selected': self.value('ui', 'order_behavior') === 'SELECTED',
                    'always_show_build_previews': self.value('ui', 'show_build_previews') === 'ALWAYS',
                    'never_show_build_previews': self.value('ui', 'show_build_previews') === 'NEVER',
                    'show_build_previews_if_selected': self.value('ui', 'build_preview_behavior') === 'SELECTED',
                    'always_show_orbital_shell': self.value('ui', 'orbital_shell') === 'RANGE DEPENDENT',
                    'never_show_orbital_shell': self.value('ui', 'orbital_shell') === 'NEVER'
                }));

                if (_.contains(groups, 'keyboard')) {
                    api.Panel.message('', 'inputmap.reload');
                }

                engine.call('ui.setUIScale', self.value('ui', 'ui_scale').toString());

                var activeExpansion = self.value('ui', 'active_expansion').toString();
                if (activeExpansion === 'NONE')
                    activeExpansion = '';
                engine.call('content.setActive', activeExpansion).then(function() {
                    saveAndApplyLocale(self.value('ui', 'language')); /* this must be last, since it could trigger a ui refresh */
                });
            }
        },

        isDirty: ko.observable(false),
        isDefault: ko.observable(false),

        // Cached storage for data in PlayFab
        data: { /* group.key */ },

        dataForPlayFab: function () {
            var self = this;
            var result = {};

            _.forIn(self.data, function (element, key) {
                var definition = self.definitions[key]
                if (definition && !definition.local_only)
                    result[key] = element;
            });

            return result;
        },

        dataForLocal: function() {
            var self = this;
            var result = _.clone(self.data);

            _.forIn(result, function (element, key) {
                var definition = self.definitions[key]
                if (definition && !definition.local_only)
                    delete self.data[key];
            });

            return result;
        },

        loaded: false,

        observableMap: {},

        definitions: {
            user: {
                title: '!LOC:User',
                hidden: true,
                settings: {
                    username_policy: {
                        title: '!LOC:Username Policy',
                        type: 'select',
                        options: ['STEAM', 'CUSTOM'],
                        optionsText: ['!LOC:USE STEAM NAME', '!LOC:USE CUSTOM NAME'],
                        default: 'STEAM'
                    }
                }
            },
            graphics: {
                title: '!LOC:Graphics',
                local_only: true,
                settings: {
                    quality: {
                        title: '!LOC:Quality Preset',
                        type: 'select',
                        options: ['LOW', 'MEDIUM', 'HIGH', 'UBER', 'CUSTOM'],
                        optionsText: ['!LOC:LOW', '!LOC:MEDIUM', '!LOC:HIGH', '!LOC:UBER', '!LOC:CUSTOM'],
                        callback: function (value) {

                            switch (value) {
                                case 'LOW':
                                    api.settings.set('graphics', 'texture', 'LOW');
                                    api.settings.set('graphics', 'headlights', 'OFF');
                                    api.settings.set('graphics', 'shadows', 'OFF');
                                    api.settings.set('graphics', 'hdr', 'OFF');
                                    api.settings.set('graphics', 'anti_aliasing', 'OFF');
                                    api.settings.set('graphics', 'ambient_occlusion', 'OFF');
                                    break;

                                case 'MEDIUM':
                                    api.settings.set('graphics', 'texture', 'MEDIUM');
                                    api.settings.set('graphics', 'headlights', 'MEDIUM');
                                    api.settings.set('graphics', 'shadows', 'MEDIUM');
                                    api.settings.set('graphics', 'hdr', 'ON');
                                    api.settings.set('graphics', 'anti_aliasing', 'OFF');
                                    api.settings.set('graphics', 'ambient_occlusion', 'OFF');
                                    break;

                                case 'HIGH':
                                    api.settings.set('graphics', 'texture', 'HIGH');
                                    api.settings.set('graphics', 'headlights', 'MEDIUM');
                                    api.settings.set('graphics', 'shadows', 'HIGH');
                                    api.settings.set('graphics', 'hdr', 'ON');
                                    api.settings.set('graphics', 'anti_aliasing', 'FXAA');
                                    api.settings.set('graphics', 'ambient_occlusion', 'ON');
                                    break;

                                case 'UBER':
                                    api.settings.set('graphics', 'texture', 'HIGH');
                                    api.settings.set('graphics', 'headlights', 'UBER');
                                    api.settings.set('graphics', 'shadows', 'UBER');
                                    api.settings.set('graphics', 'hdr', 'ON');
                                    api.settings.set('graphics', 'anti_aliasing', 'FXAA');
                                    api.settings.set('graphics', 'ambient_occlusion', 'ON');
                                    break;
                            }

                        },
                        default: 'MEDIUM',
                    },
                    texture: {
                        title: '!LOC:Virtual Texture',
                        type: 'select',
                        options: ['LOW', 'MEDIUM', 'HIGH'],
                        optionsText: ['!LOC:LOW', '!LOC:MEDIUM', '!LOC:HIGH'],
                        default: 'MEDIUM',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW':
                                    custom = (value !== 'LOW');
                                    break;

                                case 'MEDIUM':
                                    custom = (value !== 'MEDIUM');
                                    break;

                                case 'HIGH': /* fallthrough */
                                case 'UBER':
                                    custom = (value !== 'HIGH');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    headlights: {
                        title: '!LOC:Headlights',
                        type: 'select',
                        options: ['OFF', 'MEDIUM', 'UBER'],
                        optionsText: ['!LOC:OFF', '!LOC:MEDIUM', '!LOC:UBER'],
                        default: 'MEDIUM',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW':
                                    custom = (value !== 'OFF');
                                    break;

                                case 'MEDIUM': /* fallthrough */
                                case 'HIGH':
                                    custom = (value !== 'MEDIUM');
                                    break;

                                case 'UBER':
                                    custom = (value !== 'UBER');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    shadows: {
                        title: '!LOC:Shadows',
                        type: 'select',
                        options: ['OFF', 'LOW', 'MEDIUM', 'HIGH', 'UBER'],
                        optionsText: ['!LOC:OFF', '!LOC:LOW', '!LOC:MEDIUM', '!LOC:HIGH', '!LOC:UBER'],
                        default: 'MEDIUM',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW':
                                    custom = (value !== 'OFF');
                                    break;

                                case 'MEDIUM':
                                    custom = (value !== 'MEDIUM');
                                    break;

                                case 'HIGH':
                                    custom = (value !== 'HIGH');
                                    break;

                                case 'UBER':
                                    custom = (value !== 'UBER');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    ambient_occlusion: {
                        title: '!LOC:Ambient Occlusion',
                        type: 'select',
                        options: ['OFF', 'ON'],
                        optionsText: ['!LOC:OFF', '!LOC:ON'],
                        default: 'ON',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW': /* fallthrough */
                                case 'MEDIUM':
                                    custom = (value !== 'OFF');
                                    break;
                                case 'HIGH': /* fallthrough */
                                case 'UBER':
                                    custom = (value !== 'ON');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    hdr: {
                        title: '!LOC:HDR',
                        type: 'select',
                        options: ['OFF', 'ON'],
                        optionsText: ['!LOC:OFF', '!LOC:ON'],
                        default: 'ON',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW':
                                    custom = (value !== 'OFF');
                                    break;

                                case 'MEDIUM':  /* fallthrough */
                                case 'HIGH': /* fallthrough */
                                case 'UBER':
                                    custom = (value !== 'ON');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    anti_aliasing: {
                        title: '!LOC:Anti-Aliasing',
                        type: 'select',
                        options: ['OFF', 'FXAA'],
                        optionsText: ['!LOC:OFF', '!LOC:FXAA'],
                        default: 'OFF',
                        callback: function (value) {
                            var custom;

                            switch (api.settings.value('graphics', 'quality')) {
                                case 'LOW': /* fallthrough */
                                case 'MEDIUM':
                                    custom = (value !== 'OFF');
                                    break;

                                case 'HIGH': /* fallthrough */
                                case 'UBER':
                                    custom = (value !== 'FXAA');
                                    break;
                            }

                            if (custom)
                                api.settings.set('graphics', 'quality', 'CUSTOM');
                        }
                    },
                    resolution_scaling: {
                        title: '!LOC:Resolution Scaling',
                        type: 'select',
                        options: [-2, -1, 0, 1, 2, 3],
                        optionsText: ['!LOC:SUBSAMPLE (50%)',
                                      '!LOC:SUBSAMPLE (75%)',
                                      '!LOC:NATIVE (100%)',
                                      '!LOC:SUPERSAMPLE (110%)',
                                      '!LOC:SUPERSAMPLE (150%)',
                                      '!LOC:SUPERSAMPLE (175%)'],
                        default: 0,
                    },
                    display_mode: {
                        title: '!LOC:Display Mode',
                        type: 'select',
                        options: ['WINDOWED', 'FULLSCREEN'],
                        optionsText: ['!LOC:WINDOWED', '!LOC:FULLSCREEN'],
                        default: 'FULLSCREEN',
                    }
                }
            },
            audio: {
                title: '!LOC:Audio',
                settings: {
                    master: {
                        title: '!LOC:Master Volume',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 100,
                        callback: function (value) {
                            engine.call("set_volume", 'master', mapToLog(value, VOLUME_LOG_ORDERS) / 100);
                        }
                    },
                    music: {
                        title: '!LOC:Music Volume',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 100,
                        callback: function (value) {
                            engine.call("set_volume", 'music', mapToLog(value, VOLUME_LOG_ORDERS) / 100);
                        }
                    },
                    voice: {
                        title: '!LOC:Voice Volume',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 100,
                        callback: function (value) {
                            engine.call("set_volume", 'Voice', mapToLog(value, VOLUME_LOG_ORDERS) / 100);
                        }
                    },
                    sfx: {
                        title: '!LOC:Sound Effects Volume',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 100,
                        callback: function (value) {
                            engine.call("set_volume", 'SFX', mapToLog(value, VOLUME_LOG_ORDERS) / 100);
                        }
                    }
                },
            },
            camera: {
                title: '!LOC:Camera',
                settings: {
                    mouse_pan_speed: {
                        title: '!LOC:Mouse Pan Speed',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 10,
                    },
                    key_pan_speed: {
                        title: '!LOC:Key Pan Speed',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 10,
                    },
                    zoom_speed: {
                        title: '!LOC:Zoom Speed',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 40,
                    },
                    camera_friction: {
                        title: '!LOC:Camera Friction',
                        type: 'slider',
                        options: {
                            min: 0,
                            max: 100,
                            step: 1
                        },
                        default: 25,
                    },
                    edge_scroll_options: {
                        title: '!LOC:Edge Scroll Options',
                        type: 'select',
                        options: ['OFF (NO MOUSELOCK)', 'OFF (MOUSELOCK)', 'ON'],
                        optionsText: ['!LOC:OFF (NO MOUSELOCK)', '!LOC:OFF (MOUSELOCK)', '!LOC:ON'],
                        default: 'OFF (NO MOUSELOCK)',
                    },
                    pole_lock: {
                        title: '!LOC:Pole Lock',
                        type: 'select',
                        options: ['OFF', 'ON'],
                        optionsText: ['!LOC:OFF', '!LOC:ON'],
                        default: 'OFF',
                    }
                }
            },
            ui: {
                title: '!LOC:GAMEPLAY',
                settings: { // start settings
                    language: {
                        title: '!LOC:Language',
                        type: 'select',
                        options: [
                            'en-US',
                            'fr',
                            'de',
                            'it',
                            'es-ES',
                            'ar',
                            'cs-CZ',
                            'da',
                            'de-AT',
                            'fi',
                            'hu-HU',
                            'ko',
                            'nl',
                            'nl-BE',
                            'pl-PL',
                            'pt-BR',
                            'no',
                            'ro',
                            'ru',
                            'sv',
                            'tr-TR',
                            'uk',
                            'zh-CN',
                            'zh-HK',
                        ],
                        optionsText: [
                            'English, US',
                            'French',
                            'German',
                            'Italian',
                            'Spanish',
                            'Arabic (Community translation)',
                            'Czech (Community translation)',
                            'Danish (Community translation)',
                            'German, Austrian (Community translation)',
                            'Finnish (Community translation)',
                            'Hungarian (Community translation)',
                            'Korean (Community translation)',
                            'Dutch (Community translation)',
                            'Dutch, Belgium (Community translation)',
                            'Polish (Community translation)',
                            'Portuguese, Brazil (Community translation)',
                            'Norwegian (Community translation)',
                            'Romanian (Community translation)',
                            'Russian (Community translation)',
                            'Swedish (Community translation)',
                            'Turkish (Community translation)',
                            'Ukrainian (Community translation)',
                            'Chinese (Community translation)',
                            'Chinese, Hong Kong (Community translation)',
                        ],
                        default: decode(localStorage.getItem('locale'))
                    },
                    ui_scale: {
                        title: '!LOC:GUI Size',
                        type: 'slider',
                        options: {
                            min: 0.75,
                            max: 1,
                            step: 0.05
                        },
                        default: 1
                    },
                    show_unit_icons: {
                        title: '!LOC:Show Unit Icons',
                        type: 'select',
                        options: ['ALWAYS', 'RANGE DEPENDENT', 'NEVER'],
                        optionsText: ['!LOC:ALWAYS', '!LOC:RANGE DEPENDENT', '!LOC:NEVER'],
                        default: 'RANGE DEPENDENT',
                    },
                    icon_display_distance: {
                        title: '!LOC:ICON DISPLAY DISTANCE',
                        type: 'slider',
                        options: {
                            min: 0.5,
                            max: 4.0,
                            step: 0.1
                        },
                        default: 1.5,
                    },
                    show_metal_spot_icons: {
                        title: '!LOC:Show Metal Spot Icons',
                        type: 'select',
                        options: ['OFF', 'ON'],
                        optionsText: ['!LOC:OFF', '!LOC:ON'],
                        default: 'ON',
                    },
                    show_stat_bars: {
                        title: '!LOC:Show Stat Bars',
                        type: 'select',
                        options: ['VALUE DEPENDENT', 'NEVER'],
                        optionsText: ['!LOC:VALUE DEPENDENT', '!LOC:NEVER'],
                        default: 'VALUE DEPENDENT',
                    },
                    show_orders: {
                        title: '!LOC:Show Order Previews',
                        type: 'select',
                        options: ['ALWAYS', 'SHIFT', 'NEVER'],
                        optionsText: ['!LOC:ALWAYS', '!LOC:SHIFT', '!LOC:NEVER'],
                        default: 'SHIFT',
                    },
                    order_behavior: {
                        title: '!LOC:Order Preview Behavior',
                        type: 'select',
                        options: ['ALL', 'SELECTED'],
                        optionsText: ['!LOC:ALL', '!LOC:SELECTED'],
                        default: 'SELECTED',
                    },
                    show_build_previews: {
                        title: '!LOC:Show Build Previews',
                        type: 'select',
                        options: ['ALWAYS', 'SHIFT', 'NEVER'],
                        optionsText: ['!LOC:ALWAYS', '!LOC:SHIFT', '!LOC:NEVER'],
                        default: 'SHIFT',
                    },
                    build_preview_behavior: {
                        title: '!LOC:Build Preview Behavior',
                        type: 'select',
                        options: ['ALL', 'SELECTED'],
                        optionsText: ['!LOC:ALL', '!LOC:SELECTED'],
                        default: 'SELECTED'
                    },
                    orbital_shell: {
                        title: '!LOC:Orbital Shell',
                        type: 'select',
                        options: ['RANGE DEPENDENT', 'SELECTED', 'NEVER'],
                        optionsText: ['!LOC:RANGE DEPENDENT', '!LOC:SELECTED', '!LOC:NEVER'],
                        default: 'SELECTED',
                    },
                    active_expansion: {
                        title: '!LOC:Active Product',
                        type: 'select',
                        options: ['BEST', 'BASE'],
                        optionsText: ['THIS SHOULD NEVER SHOW UP', '!LOC:Classic'],
                        default: 'BEST',
                    },
                } // end settings
            },
            server: {
                title: '!LOC:Server',
                settings: {
                    local: {
                        title: '!LOC:Local Server',
                        type: 'select',
                        options: ['AUTO', 'ON', 'OFF'],
                        optionsText: [
                            '!LOC:AUTO',
                            '!LOC:ON',
                            '!LOC:OFF'
                        ],
                        default: 'AUTO'
                    }
                }
            },
            keyboard: {
                title: '!LOC:Keyboard',
                settings: {
                /* GENERAL ----------------*/

                    /* GENERAL ----------------*/
                    pause_game: {
                        title: '!LOC:pause game',
                        type: 'keybind',
                        set: 'gameplay',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'break'
                    },
                    show_guide: {
                        title: '!LOC:show player guide',
                        type: 'keybind',
                        set: 'gameplay',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'f1'
                    },
                    show_hide_ar: {
                        title: '!LOC:show/hide visual aid overlays',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'ctrl+y'
                    },
                    toggle_music: {
                        title: '!LOC:toggle music',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'ctrl+s'
                    },
                    toggle_fullscreen: {
                        title: '!LOC:toggle fullscreen',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'alt+enter'
                    },
                    toggle_gamestats: {
                        title: '!LOC:Show/Hide game stats',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'tab'
                    },

                    show_hide_ui: {
                        title: '!LOC:show/hide UI',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'ctrl+u'
                    },
                    modal_back: {
                        title: '!LOC:navigate back/exit',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'esc'
                    },
                    show_hide_performance_panel: {
                        title: '!LOC:show/hide performance panel',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:general',
                        default: 'ctrl+p'
                    },
                    /* CHAT */
                    normal_chat: {
                        title: '!LOC:all chat',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:communication',
                        default: 'shift+enter'
                    },
                    team_chat: {
                        title: '!LOC:team chat',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:communication',
                        default: 'enter'
                    },

                    /* ALERTS ----------------*/
                    command_mode_ping: {
                        title: '!LOC:ping',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:alerts',
                        default: 'g'
                    },
                    acknowledge_alert: {
                        title: '!LOC:dismiss alert notification',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:alerts',
                        default: 'space'
                    },

                    acknowledge_combat: {
                        title: '!LOC:zoom to combat',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:alerts',
                        default: 'ctrl+space'
                    },

                    /* PICTURE IN PICTURE ----------------*/
                    toggle_pips: {
                        title: '!LOC:Show/Hide pip',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:picture-in-picture',
                        default: 'q'
                    },
                    swap_pips: {
                        title: '!LOC:swap pip',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:picture-in-picture',
                        default: 'shift+q'
                    },
                    copy_to_pip: {
                        title: '!LOC:copy to pip',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:picture-in-picture',
                        default: 'alt+q'
                    },
                    toggle_pip_mirror: {
                        title: '!LOC:toggle pip mirror',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:picture-in-picture',
                        default: 'alt+m'
                    },

                    /* CHRONOCAM ----------------*/
                    resume_at_latest_time: {
                        title: '!LOC:resume at latest time',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    play_forward_at_50: {
                        title: '!LOC:play forward at 50%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    play_forward_at_100: {
                        title: '!LOC:play forward at 100%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    play_backwards_at_50: {
                        title: '!LOC:play backwards at 50%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    play_backwards_at_100: {
                        title: '!LOC:play backwards at 100%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    pause_time: {
                        title: '!LOC:pause time',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    last_pseudo_frame: {
                        title: '!LOC:last pseudo frame',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    next_pseudo_frame: {
                        title: '!LOC:next pseudo frame',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },

                    play_forward_at_10: {
                        title: '!LOC:play forwards at 10%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    play_backwards_at_10: {
                        title: '!LOC:play backwards at 10%',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    skip_forward_1sec: {
                        title: '!LOC:skip forward 1s',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },
                    skip_backwards_1sec: {
                        title: '!LOC:skip backward 1s',
                        type: 'keybind',
                        set: 'general',
                        display_group: '!LOC:general',
                        display_sub_group: '!LOC:chronocam',
                        default: ''
                    },

                /* UNITS ----------------*/

                    /* SELECTION ----------------*/
                    select_commander: {
                        title: '!LOC:select commander',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'alt+c'
                    },
                    select_idle_fabbers: {
                        title: '!LOC:select idle fabbers',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'f'
                    },
                    select_all_factories: {
                        title: '!LOC:select all factories',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'shift+f1'
                    },
                    select_all_idle_factories: {
                        title: '!LOC:select all idle factories',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'shift+f2'
                    },
                    select_all_factories_on_screen: {
                        title: '!LOC:select all factories on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'shift+f3'
                    },
                    select_all_idle_factories_on_screen: {
                        title: '!LOC:select all idle factories on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'shift+f4'
                    },
                    select_all_combat_units_on_screen: {
                        title: '!LOC:select all combat units on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'shift+f5'
                    },
                    select_all_combat_units: {
                        title: '!LOC:select all combat units',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f6'
                    },
                    select_all_land_combat_units_on_screen: {
                        title: '!LOC:select all land combat units on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f6'
                    },
                    select_all_land_combat_units: {
                        title: '!LOC:select all land combat units',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f7'
                    },
                    select_all_air_combat_units_on_screen: {
                        title: '!LOC:select all air combat units on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f8'
                    },
                    select_all_air_combat_units: {
                        title: '!LOC:select all air combat units',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f9'
                    },
                    select_all_naval_combat_units_on_screen: {
                        title: '!LOC:select all naval combat units on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f10'
                    },
                    select_all_naval_combat_units: {
                        title: '!LOC:select all naval combat units',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+shift+f4'
                    },
                    select_all_matching_units_on_screen: {
                        title: '!LOC:select all matching units on screen',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit selection',
                        default: 'ctrl+z'
                    },


                    /* COMMANDS ----------------*/
                    command_mode_move: {
                        title: '!LOC:move',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'm'
                    },
                    command_mode_attack: {
                        title: '!LOC:attack',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'a'
                    },
                    command_mode_assist: {
                        title: '!LOC:assist',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'i'
                    },
                    command_mode_repair: {
                        title: '!LOC:repair',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'r'
                    },
                    command_mode_reclaim: {
                        title: '!LOC:reclaim',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'e'
                    },
                    command_mode_patrol: {
                        title: '!LOC:patrol',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'p'
                    },
                    command_mode_special_move: {
                        title: '!LOC:special move',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: ''
                    },
                    command_mode_unload: {
                        title: '!LOC:unload',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: ''
                    },
                    command_mode_load: {
                        title: '!LOC:load',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: ''
                    },
                    command_mode_alt_fire: {
                        title: '!LOC:alt fire',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'd'
                    },
                    stop_command: {
                        title: '!LOC:stop',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 's'
                    },
                    self_destruct_selected_unit: {
                        title: '!LOC:self destruct selected unit',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit commands',
                        default: 'del'
                    },


                    /* ORDERS ----------------*/
                    fire_at_will: {
                        title: '!LOC:fire at will',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    return_fire: {
                        title: '!LOC:return fire',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    hold_fire: {
                        title: '!LOC:hold fire',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    toggle_fire_orders: {
                        title: '!LOC:toggle fire orders',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: 'h'
                    },
                    maneuver: {
                        title: '!LOC:maneuver',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    roam: {
                        title: '!LOC:roam',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    hold_position: {
                        title: '!LOC:hold position',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    toggle_move_orders: {
                        title: '!LOC:toggle move orders',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: 'j'
                    },

                    energy_on: {
                        title: '!LOC:energy on',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    energy_off: {
                        title: '!LOC:energy off',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: ''
                    },
                    toggle_energy_orders: {
                        title: '!LOC:toggle energy orders',
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit orders',
                        default: 'k'
                    },


                    /* CAPTURE ----------------*/
                    capture_group_1: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 1 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+1'
                    },
                    capture_group_2: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 2 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+2'
                    },
                    capture_group_3: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 3 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+3'
                    },
                    capture_group_4: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 4 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+4'
                    },
                    capture_group_5: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 5 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+5'
                    },
                    capture_group_6: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 6 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+6'
                    },
                    capture_group_7: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 7 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+7'
                    },
                    capture_group_8: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 8 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+8'
                    },
                    capture_group_9: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 9 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+9'
                    },
                    capture_group_0: {
                        title: ['!LOC:capture group __group_number__', { "group_number": 0 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit capture groups',
                        default: 'ctrl+0'
                    },

                    /* RECALL GROUP ----------------*/
                    recall_group_1: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 1 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '1'
                    },
                    recall_group_2: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 2 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '2'
                    },
                    recall_group_3: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 3 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '3'
                    },
                    recall_group_4: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 4 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '4'
                    },
                    recall_group_5: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 5 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '5'
                    },
                    recall_group_6: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 6 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '6'
                    },
                    recall_group_7: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 7 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '7'
                    },
                    recall_group_8: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 8 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '8'
                    },
                    recall_group_9: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 9 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '9'
                    },
                    recall_group_0: {
                        title: ['!LOC:recall group __group_number__', { "group_number": 0 }],
                        type: 'keybind',
                        set: 'units',
                        display_group: '!LOC:units',
                        display_sub_group: '!LOC:unit recall groups',
                        default: '0'
                    },

                /* BUILD ----------------*/

                    /* BUILD COMMANDS ----------------*/
                    start_build_vehicle: {
                        title: '!LOC:select vehicle group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'z'
                    },
                    start_build_bot: {
                        title: '!LOC:select bot group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'x',
                        allow_conflicts: {
                            key: ['start_build_factory']
                        }
                    },
                    start_build_air: {
                        title: '!LOC:select air group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'c',
                        allow_conflicts: {
                            key: ['start_build_combat']
                        }
                    },
                    start_build_sea: {
                        title: '!LOC:select sea group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'v',
                        allow_conflicts: {
                            key: ['start_build_utility']
                        }
                    },
                    start_build_orbital_unit: {
                        title: '!LOC:select orbital group (units)',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'b',
                        allow_conflicts: {
                            key: ['start_build_orbital_structure']
                        }
                    },
                    start_build_factory: {
                        title: '!LOC:select factory group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'x',
                        allow_conflicts: {
                            key: ['start_build_bot']
                        }
                    },
                    start_build_combat: {
                        title: '!LOC:select combat group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'c',
                        allow_conflicts: {
                            key: ['start_build_air']
                        }
                    },
                    start_build_utility: {
                        title: '!LOC:select utility group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'v',
                        allow_conflicts: {
                            key: ['start_build_sea']
                        }
                    },
                    start_build_orbital_structure: {
                        title: '!LOC:select orbital group (buildings)',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'b',
                        allow_conflicts: {
                            key: ['start_build_orbital_unit']
                        }
                    },

                    start_build_ammo: {
                        title: '!LOC:select ammo group',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build bar groups',
                        default: 'z',
                        allow_conflicts: true
                    },

                    build_once: {
                        title: '!LOC:build once',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build orders',
                        default: ''
                    },
                    build_loop: {
                        title: '!LOC:build loop',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build orders',
                        default: ''
                    },
                    toggle_build_orders: {
                        title: '!LOC:toggle build orders',
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build orders',
                        default: 'l'
                    },


                    /* BUILD ITEMS ----------------*/
                    build_item_1: {
                        title: ['!LOC:build item __item_number__', {"item_number": 1}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '1',
                        allow_conflicts: true
                    },
                    build_item_2: {
                        title: ['!LOC:build item __item_number__', {"item_number": 2}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '2',
                        allow_conflicts: true
                    },
                    build_item_3: {
                        title: ['!LOC:build item __item_number__', {"item_number": 3}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '3',
                        allow_conflicts: true
                    },
                    build_item_4: {
                        title: ['!LOC:build item __item_number__', {"item_number": 4}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '4',
                        allow_conflicts: true
                    },
                    build_item_5: {
                        title: ['!LOC:build item __item_number__', {"item_number": 5}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '5',
                        allow_conflicts: true
                    },
                    build_item_6: {
                        title: ['!LOC:build item __item_number__', {"item_number": 6}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: '6',
                        allow_conflicts: true
                    },
                    build_item_7: {
                        title: ['!LOC:build item __item_number__', {"item_number": 7}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'q',
                        allow_conflicts: true
                    },
                    build_item_8: {
                        title: ['!LOC:build item __item_number__', {"item_number": 8}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'w',
                        allow_conflicts: true
                    },
                    build_item_9: {
                        title: ['!LOC:build item __item_number__', {"item_number": 9}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'e',
                        allow_conflicts: true
                    },
                    build_item_10: {
                        title: ['!LOC:build item __item_number__', {"item_number": 10}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'r',
                        allow_conflicts: true
                    },
                    build_item_11: {
                        title: ['!LOC:build item __item_number__', {"item_number": 11}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 't',
                        allow_conflicts: true
                    },
                    build_item_12: {
                        title: ['!LOC:build item __item_number__', {"item_number": 12}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'y',
                        allow_conflicts: true
                    },
                    build_item_13: {
                        title: ['!LOC:build item __item_number__', {"item_number": 13}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'a',
                        allow_conflcts: true
                    },
                    build_item_14: {
                        title: ['!LOC:build item __item_number__', {"item_number": 14}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 's',
                        allow_conflicts: true
                    },
                    build_item_15: {
                        title: ['!LOC:build item __item_number__', {"item_number": 15}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'd',
                        allow_conflicts: true
                    },
                    build_item_16: {
                        title: ['!LOC:build item __item_number__', {"item_number": 16}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'f',
                        allow_conflicts: true
                    },

                    build_item_17: {
                        title: ['!LOC:build item __item_number__', {"item_number": 17}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'g',
                        allow_conflicts: true
                    },

                    build_item_18: {
                        title: ['!LOC:build item __item_number__', {"item_number": 18}],
                        type: 'keybind',
                        set: 'build',
                        display_group: '!LOC:build',
                        display_sub_group: '!LOC:build items',
                        default: 'h',
                        allow_conflicts: true
                    },


                /* CAMERA ----------------*/
                    /* CAMERA MODES ----------------*/
                    set_default_camera: {
                        title: '!LOC:set default camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: ''
                    },
                    set_free_camera: {
                        title: '!LOC:set free camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: 'ctrl+alt+m'
                    },
                    set_debug_camera: {
                        title: '!LOC:set debug camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: ''
                    },
                    set_planet_camera: {
                        title: '!LOC:set planet camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: ''
                    },
                    toggle_free_camera: {
                        title: '!LOC:toggle free camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: ''
                    },
                    toggle_debug_camera: {
                        title: '!LOC:toggle debug camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:modes',
                        default: 'ctrl+m'
                    },

                    /* CAMERA DIRECTION ----------------*/
                    camera_move_left: {
                        title: '!LOC:move left',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:direction',
                        default: 'left'
                    },
                    camera_move_right: {
                        title: '!LOC:move right',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:direction',
                        default: 'right'
                    },
                    camera_move_up: {
                        title: '!LOC:move up',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:direction',
                        default: 'up'
                    },
                    camera_move_down: {
                        title: '!LOC:move down',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:direction',
                        default: 'down'
                    },
                    camera_zoom_in: {
                        title: '!LOC:zoom in',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:FOV',
                        default: ''
                    },
                    camera_zoom_out: {
                        title: '!LOC:zoom out',
                        type: 'keybind',
                        set: 'camera controls',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:FOV',
                        default: ''
                    },

                    /* CAMERA ZOOM ----------------*/
                    zoom_to_surface: {
                        title: '!LOC:zoom to surface',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:zoom',
                        default: ''
                    },
                    zoom_to_air: {
                        title: '!LOC:zoom to air',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:zoom',
                        default: ''
                    },
                    zoom_to_orbital: {
                        title: '!LOC:zoom to orbital',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:zoom',
                        default: ''
                    },
                    zoom_to_celestial: {
                        title: '!LOC:zoom to celestial',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:zoom',
                        default: ''
                    },

                    /* PLANET JUMP ----------------*/
                    previous_planet: {
                        title: '!LOC:jump to previous planet',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:planet jump',
                        default: 'shift+,'
                    },
                    next_planet: {
                        title: '!LOC:jump to next planet',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:planet jump',
                        default: ','
                    },

                    /* TRACKING AND ALIGNMENT ----------------*/
                    track_selection_with_camera: {
                        title: '!LOC:track selection with camera',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tracking & alignment',
                        default: 't'
                    },
                    align_to_pole: {
                        title: '!LOC:align to pole',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tracking & alignment',
                        default: 'n'
                    },

                    /* FREE MOVEMENT ----------------*/
                    free_move_left: {
                        title: '!LOC:free move left',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'a',
                        allow_conflicts: true
                    },
                    free_move_right: {
                        title: '!LOC:free move right',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'd',
                        allow_conflicts: true
                    },
                    free_move_up: {
                        title: '!LOC:free move up',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'r',
                        allow_conflicts: true
                    },
                    free_move_down: {
                        title: '!LOC:free move down',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'f',
                        allow_conflicts: true
                    },
                    free_move_forward: {
                        title: '!LOC:free move forward',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'w',
                        allow_conflicts: true
                    },
                    free_move_backward: {
                        title: '!LOC:free move backward',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 's',
                        allow_conflicts: true
                    },
                    free_roll_left: {
                        title: '!LOC:free roll left',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'u',
                        allow_conflicts: true
                    },
                    free_roll_right: {
                        title: '!LOC:free roll right',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'o',
                        allow_conflicts: true
                    },
                    free_pitch_forward: {
                        title: '!LOC:free pitch forward',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'i',
                        allow_conflicts: true
                    },
                    free_pitch_backward: {
                        title: '!LOC:free pitch backward',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'k',
                        allow_conflicts: true
                    },
                    free_yaw_left: {
                        title: '!LOC:free yaw left',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'j',
                        allow_conflicts: true
                    },
                    free_yaw_right: {
                        title: '!LOC:free yaw right',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'l',
                        allow_conflicts: true
                    },
                    free_zoom_in: {
                        title: '!LOC:free zoom in',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'q',
                        allow_conflicts: true
                    },
                    free_zoom_out: {
                        title: '!LOC:free zoom out',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:free movement',
                        default: 'e',
                        allow_conflicts: true
                    },

                    /* CAPTURE ----------------*/
                    capture_anchor_1: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 1 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+1'
                    },
                    capture_anchor_2: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 2 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+2'
                    },
                    capture_anchor_3: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 3 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+3'
                    },
                    capture_anchor_4: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 4 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+4'
                    },
                    capture_anchor_5: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 5 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+5'
                    },
                    capture_anchor_6: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 6 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+6'
                    },
                    capture_anchor_7: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 7 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+7'
                    },
                    capture_anchor_8: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 8 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+8'
                    },
                    capture_anchor_9: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 9 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+9'
                    },
                    capture_anchor_0: {
                        title: ['!LOC:capture anchor __anchor_number__', { "anchor_number": 10 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:capture anchor',
                        default: 'shift+0'
                    },

                    /* RECALL ----------------*/
                    recall_anchor_1: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 1 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+1'
                    },
                    recall_anchor_2: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 2 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+2'
                    },
                    recall_anchor_3: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 3 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+3'
                    },
                    recall_anchor_4: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 4 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+4'
                    },
                    recall_anchor_5: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 5 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+5'
                    },
                    recall_anchor_6: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 6 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+6'
                    },
                    recall_anchor_7: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 7 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+7'
                    },
                    recall_anchor_8: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 8 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+8'
                    },
                    recall_anchor_9: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 9 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+9'
                    },
                    recall_anchor_0: {
                        title: ['!LOC:recall anchor __anchor_number__', { "anchor_number": 0 }],
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'alt+0'
                    },
                    history_back: {
                        title: '!LOC:Back',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'backspace'
                    },
                    history_forward: {
                        title: '!LOC:Forward',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:recall anchor',
                        default: 'shift+backspace'
                    },

                    /* TUNING ----------------*/
                    increase_camera_pan_speed: {
                        title: '!LOC:increase camera pan speed',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tuning',
                        default: ''
                    },
                    decrease_camera_pan_speed: {
                        title: '!LOC:decrease camera pan speed',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tuning',
                        default: ''
                    },
                    smooth_zoom_out: {
                        title: '!LOC:smooth zoom out',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tuning',
                        default: ''
                    },
                    smooth_zoom_in: {
                        title: '!LOC:smooth zoom in',
                        type: 'keybind',
                        set: 'camera',
                        display_group: '!LOC:camera',
                        display_sub_group: '!LOC:tuning',
                        default: ''
                    },
                    //relax_constraints: {
                    //    title: 'relax constraints',
                    //    type: 'keybind',
                    //    set: 'camera',
                    //    display_group: '!LOC:camera',
                    //    display_sub_group: '!LOC:tuning',
                    //    default: ''
                    //},
                    //restore_constraints: {
                    //    title: 'restore constraints',
                    //    type: 'keybind',
                    //    set: 'camera',
                    //    display_group: '!LOC:camera',
                    //    display_sub_group: '!LOC:tuning',
                    //    default: ''
                    //},

                /* DEV MODE ----------------*/

                    abort: {
                        title: '!LOC:abort',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    crash: {
                        title: '!LOC:crash',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    reload_view: {
                        title: '!LOC:reload view',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'f5'
                    },
                    toggle_audio_logging: {
                        title: '!LOC:toggle audio logging',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    quick_profile: {
                        title: '!LOC:quick profile',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+f11'
                    },
                    bug_report: {
                        title: '!LOC:bug report',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+f10'
                    },
                    toggle_nav_debug: {
                        title: '!LOC:toggle nav debug',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+alt+f11'
                    },
                    toggle_console: {
                        title: '!LOC:toggle console',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    set_army_from_hover: {
                        title: '!LOC:set army from hover',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+b'
                    },
                    copy_unit: {
                        title: '!LOC:copy unit',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+c'
                    },
                    paste_unit: {
                        title: '!LOC:paste unit',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+v'
                    },
                    toggle_fow: {
                        title: '!LOC:toggle FOW',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+j'
                    },
                    build_avatar: {
                        title: '!LOC:build avatar',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'alt+f1'
                    },
                    build_avatar_factory: {
                        title: '!LOC:build avatar factory',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'alt+f2'
                    },
                    enable_navigation_debug_info: {
                        title: '!LOC:enable navigation debug info',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    disable_navigation_debug_info: {
                        title: '!LOC:disable navigation debug info',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: ''
                    },
                    publish_server_mods: {
                        title: '!LOC:publish server mods',
                        type: 'keybind',
                        set: 'dev mode',
                        display_group: '!LOC:dev mode',
                        display_sub_group: '',
                        default: 'ctrl+alt+p'
                    },
                    toggle_edit_terrain_mode: {
                        title: '!LOC:toggle edit terrain mode',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:mode',
                        default: '',
                        allow_conflicts: false
                    },
                    delete_selected: {
                        title: '!LOC:delete selected',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:add/remove',
                        default: 'del',
                        allow_conflicts: true
                    },
                    copy_selected: {
                        title: '!LOC:copy selected',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:add/remove',
                        default: 'ctrl+c',
                        allow_conflicts: true
                    },
                    disconnect_csg_twin: {
                    	title: '!LOC:disconnect twin',
                    	type: 'keybind',
                    	set: 'terrain editor',
                    	display_group: '!LOC:terrain editor',
                    	display_sub_group: '!LOC:manipulate',
                    	default: 'ctrl+\\',
                    	allow_conflicts: true
                    },
                    paste: {
                        title: '!LOC:paste',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:add/remove',
                        default: 'ctrl+v',
                        allow_conflicts: true
                    },
                    rotate_csg_cw: {
                        title: '!LOC:rotate csg cw',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'q',
                        allow_conflicts: true
                    },
                    rotate_csg_ccw: {
                        title: '!LOC:rotate csg ccw',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'e',
                        allow_conflicts: true
                    },
                    scale_csg_up: {
                        title: '!LOC:scale csg up',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'a',
                        allow_conflicts: true
                    },
                    scale_csg_down: {
                        title: '!LOC:scale csg down',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'd',
                        allow_conflicts: true
                    },

                    scale_csg_vertically_up: {
                        title: '!LOC:scale csg vertically up',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: '',
                        allow_conflicts: true
                    },
                    scale_csg_vertically_down: {
                        title: '!LOC:scale csg vertically down',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: '',
                        allow_conflicts: true
                    },

                    scale_csg_horizontally_up: {
                        title: '!LOC:scale csg horizontally up',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: '',
                        allow_conflicts: true
                    },
                    scale_csg_horizontally_down: {
                        title: '!LOC:scale csg horizontally down',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: '',
                        allow_conflicts: true
                    },

                    move_csg_up: {
                        title: '!LOC:move csg up',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'w',
                        allow_conflicts: true
                    },
                    move_csg_down: {
                        title: '!LOC:move csg down',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 's',
                        allow_conflicts: true
                    },
                    grab_csg: {
                        title: '!LOC:grab csg',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'ctrl+g',
                        allow_conflicts: true
                    },
                    set_pathable_csg: {
                        title: '!LOC:set pathable csg',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'p',
                        allow_conflicts: true
                    },
                    toggle_edit_metal_spot: {
                        title: '!LOC:toggle edit metal spots',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:mode',
                        default: '',
                        allow_conflicts: false
                    },
                    add_metal_spot: {
                        title: '!LOC:add metal spot',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'm',
                        allow_conflicts: true
                    },
                    delete_metal_spot: {
                        title: '!LOC:remove metal spot',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'b',
                        allow_conflicts: true
                    },
                    add_landing_zone: {
                        title: '!LOC:add landing zone',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'g',
                        allow_conflicts: true
                    },
                    delete_landing_zone: {
                        title: '!LOC:remove landing zone',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'j',
                        allow_conflicts: true
                    },

                    toggle_show_water: {
                        title: '!LOC:toggle show water',
                        type: 'keybind',
                        set: 'terrain editor',
                        display_group: '!LOC:terrain editor',
                        display_sub_group: '!LOC:manipulate',
                        default: 'ctrl+w',
                        allow_conflicts: true
                    },
                }
            }
        }
    }

    var activeExpansion = api.settings.definitions.ui.settings.active_expansion;
    var bestIndex = _.indexOf(activeExpansion.options, 'BEST');
    if (api.content.ownsTitans())
        activeExpansion.optionsText[bestIndex] = api.content.getInfo('PAExpansion1').description;

    var language = api.settings.definitions.ui.settings.language;

    if (DEV_MODE)
    {
        language.options.push('xx');
        language.optionsText.push('[DEV LOCALE]');
        language.options.push('xx-pad');
        language.optionsText.push('[WIDE DEV LOCALE]');
    }

    // Patch up the default language if it happens to not be in our list
    if (!language.default || !_.contains(language.options, language.default))
        language.default = 'en-US';
}
init_settings(window.api);
api.settings.load(true, true);

ko.extenders.setting = function (target, option) {
    var group = option.group,
        key = option.key;

    target.subscribe(function (value) { /* changes are not saved when 'set'.  you have to call api.settings.save */
        api.settings.get(group, key).then(function (data) {
            if (data !== value)
                api.settings.set(group, key, value);
        });
    });

    api.settings.get(group, key).then(function (data) {
        target(data);
    });

    return target;
};

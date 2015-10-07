/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, InputValidator, CookieJar, $, localStorage, parseLayerString, getUTCTimestamp */
"use strict";
var UserSettings = Class.extend(
    /** @lends UserSettings.prototype */
    {
    /**
     * Class to manage user preferences.<br><br>
     *
     * Creates a class which handles the storing the retrieving of custom user settings. This includes things
     * like the requested observation time, image zoom level, and the layers currently loaded. The UserSettings
     * class has the ability to use both HTML5 local storage and cookies for saving information.
     *
     * TODO 2010/04/09: Generalize the validation step by passing in an array of validation criteria instead
     * of passing in parameters individually.
     *
     * @constructs
     *
     * @see <a href="https://developer.mozilla.org/en/DOM/Storage">https://developer.mozilla.org/en/DOM/Storage</a>
     */
    init: function (defaults, urlSettings, constraints) {
        this._defaults    = defaults;
        this._constraints = constraints;

        // Input validator
        this._validator = new InputValidator();

        // Initialize storage
        this._initStorage();

        // Process URL parameters
        this._processURLSettings(urlSettings);
    },

    /**
     * Gets a specified setting
     *
     * @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    get: function (key) {
        // Nesting depth is limited to three levels
        try {
            return this._get(key);
        } catch (ex) {
            // If an error is encountered, then settings are likely outdated;
            // use the default value
            var value = this._getDefault(key);
            this.set(key, value)
            return value;
        }
    },

    /**
     * Gets a specified setting
     *
       @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    _get: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this.settings[key];
        }
        else if (lookup.length === 2) {
            return this.settings[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Returns the default value associated with the specified key
     */
    _getDefault: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this._defaults[key];
        }
        else if (lookup.length === 2) {
            return this._defaults[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Saves a specified setting
     *
     * @param {String} key   The setting to update
     * @param {Object} value The new value for the setting
     */
    set: function (key, value) {
        try {
            this._validate(key, value);
        } catch (e) {
            return;
        }

        // Update settings
        var lookup = key.split(".");

        if (lookup.length === 1) {
            this.settings[key] = value;
        }
        else if (lookup.length === 2) {
            this.settings[lookup[0]][lookup[1]] = value;
        }
        else if (lookup.length === 3) {
            this.settings[lookup[0]][lookup[1]][lookup[2]] = value;
        }
        else if (lookup.length === 4) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = value;
        }
        else if (lookup.length === 5) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = value;
        }
        else if (lookup.length === 6) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] = value;
        }
        else {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]] = value;
        }

        this._save();
    },

    /**
     * Saves the user settings after changes have been made
     */
    _save: function () {
        // localStorage
        if ($.support.localStorage) {
            localStorage.setItem("settings", $.toJSON(this.settings));
        }
        // cookies
        else {
            this.cookies.set("settings", this.settings);
        }
    },

    /**
     * Removes all existing settings
     */
    _empty: function () {
        if ($.support.localStorage) {
            localStorage.removeItem("settings");
        } else {
            $.cookieJar("empty");
        }
    },

    /**
     * Checks to see if there are any existing stored user settings
     *
     * @returns {Boolean} Returns true if stored Helioviewer.org settings are detected
     */
    _exists: function () {
        return ($.support.localStorage ? (localStorage.getItem("settings") !== null)
                : (this.cookies.toString().length > 2));
    },

    /**
     * Decides on best storage format to use, and initializes it
     */
    _initStorage: function () {
        // Initialize CookieJar if localStorage isn't supported
        if (!$.support.localStorage) {
            this.cookies = $.cookieJar("settings");
        }

        // If no stored user settings exist, load defaults
        if (!this._exists()) {
            this._loadDefaults();
        }
        else {
            this._loadSavedSettings();
        }

        // If version is out of date, load defaults
        if (this.get('version') < this._defaults.version) {
            this._updateSettings(this.get('version'));
        }
    },

    /**
     * Attempts to update user settings to reflect recent changes
     */
    _updateSettings: function (version) {
        var statuses, self = this;

        // 2.2.1 and under - Load defaults
        if (version < 567) {
            this._loadDefaults();
        } else if (version < 700) {
            // 2.3.0 - Movie statuses changed to ints
            statuses = {
                "QUEUED": 0,
                "PROCESSING": 1,
                "FINISHED": 2,
                "ERROR": 3
            };

            // Convert string status to integer status
            $.each(this.settings.history.movies, function (i, movie) {
                self.settings.history.movies[i].status = statuses[movie.status];
            });

            // 2.3.0 - "defaults" section renamed "options"
            this.settings.options = this.settings.defaults;
            delete this.settings.defaults;

            // Updated version number and save
            this.set('version', this._defaults.version);
        }
    },

    /**
     * Loads defaults user settings
     */
    _loadDefaults: function () {
        this._empty();

        if ($.support.localStorage) {
            localStorage.setItem("settings", $.toJSON(this._defaults));
        }
        else {
            this.cookies.set("settings", this._defaults);
        }

        this.settings = this._defaults;
    },

    /**
     * Retrieves the saved user settings and saved them locally
     */
    _loadSavedSettings: function () {
        if ($.support.localStorage) {
            this.settings = $.evalJSON(localStorage.getItem("settings"));
        }
        // Otherwise, check type and return
        else {
            this.settings = this.cookies.get("settings");
        }
    },

    /**
     * Processes and validates any URL parameters that have been set
     *
     * Note that date is handled separately in TimeControls
     */
    _processURLSettings: function (urlSettings) {
        if (urlSettings.imageScale) {
            this.set("state.imageScale", parseFloat(urlSettings.imageScale));
        }

        if (urlSettings.centerX) {
            this.set("state.centerX", parseFloat(urlSettings.centerX));
        }

        if (urlSettings.centerY) {
            this.set("state.centerY", parseFloat(urlSettings.centerY));
        }

        if (urlSettings.imageLayers) {
            this.set("state.tileLayers",
                     this._parseURLStringLayers(urlSettings.imageLayers));
        }

        if (typeof urlSettings.eventLayers != 'undefined' && urlSettings.eventLayers != '') {
            this.set("state.eventLayers",
                     this._parseURLStringEvents(urlSettings.eventLayers));
        }

        // Event labels are ON by default
        if ( urlSettings.eventLabels == true ) {
            this.set("state.eventLabels", true);
        }
        // Override event label default with value from URL
        else if ( typeof urlSettings.eventLabels != 'undefined'
            && urlSettings.eventLabels == false) {

            this.set("state.eventLabels", false);
        }
    },

    /**
     * Processes a string containing one or more layers and converts them into
     * JavaScript objects
     */
    _parseURLStringLayers: function (urlLayers) {
        var layers = [], self = this;

        $.each(urlLayers, function (i, layerString) {
            layers.push(parseLayerString(layerString));
        });

        return layers;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseLayersURLString: function (layerArray) {
        var layerString = '';

        if ( typeof layerArray == "undefined" ) {
            layerArray = this.get("state.tileLayers");
        }

        $.each(layerArray, function (i, layerObj) {
            layerString += "[";

            $.each(layerObj.uiLabels, function (i, labelObj) {
                layerString += labelObj.name + ",";
            });
            layerString += parseInt(layerObj.layeringOrder) + ",";
            layerString += parseInt(layerObj.opacity);

            layerString += "],";
        });
        return layerString.slice(0, -1);
    },

    /**
     * Processes a string containing one or more event types and FRMs and
     * converts them into JavaScript objects
     */
    _parseURLStringEvents: function (urlEventLayers) {
        var events = [], self = this;

        $.each(urlEventLayers, function (i, eventLayerString) {
            events.push(parseEventString(eventLayerString));
        });
        return events;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseEventsURLString: function (eventLayerArray) {
        var eventLayerString = '';

        if ( typeof eventLayerArray == "undefined" ) {
            eventLayerArray = this.get("state.eventLayers");
        }

        $.each(eventLayerArray, function (i, eventLayerObj) {
            eventLayerString += "[" + eventLayerObj.event_type     + ","
                                    + eventLayerObj.frms.join(';') + ","
                                    + eventLayerObj.open           + "],";
        });
        return eventLayerString.slice(0, -1);
    },

    /**
     * Validates a setting (Currently checks observation date and image scale)
     *
     * @param {String} setting The setting to be validated
     * @param {String} value   The value of the setting to check
     *
     * @returns {Boolean} Returns true if the setting is valid
     */
    _validate: function (setting, value) {
        var self = this;

        switch (setting) {
        case "state.date":
            this._validator.checkTimestamp(value);
            break;
        case "state.imageScale":
            this._validator.checkFloat(value, {
                "min": this._constraints.minImageScale,
                "max": this._constraints.maxImageScale
            });
            break;
        case "history.movies":
            $.each(value, function (i, movie) {
                self._validator.checkDateString(movie["dateRequested"]);
            });
            break;
        case "history.screenshots":
            $.each(value, function (i, screenshot) {
                self._validator.checkDateString(screenshot["dateRequested"]);
            });
            break;
        case "options.movies.duration":
            this._validator.checkInt(value, {
                "min": this._constraints.minMovieLength,
                "max": this._constraints.maxMovieLength
            });
            break;
        default:
            break;
        }
    }
});

/**
 * @fileOverview Contains the class definition for an UserSettings class.
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
        
        this._setupEventHandlers();
    },
    
    /**
     * Gets a specified setting
     * 
     * @param {String} key The setting to retrieve
     * 
     * @returns {Object} The value of the desired setting
     */
    get: function (key) {
        return this.settings[key];
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
        this.settings[key] = value;

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
     * Checks all stored settings to make sure that they are compatible with version of Helioviewer loaded
     */
    _checkSettings: function () {
        var self = this;

        // Check each of the expected settings
        $.each(this._defaults, function (key, value) {
            
            // If no value is set, use default
            if (typeof self.settings[key] === "undefined") {
                self.set(key, value);
            } else {
                // Otherwise make sure existing value is compatible
                try {
                    self._validate(key, self.settings[key]);
                } catch (e) {
                    // Use default values for any settings that don't have the proper structure
                    self.set(key, value);
                }                
            }
        });
        
        // Update version number
        this.set("version", this._defaults['version']);
    },
    
    /**
     * Checks to see if there are any existing stored user settings
     * 
     * @returns {Boolean} Returns true if stored Helioviewer.org settings are detected
     */
    _exists: function () {
        //return ($.support.localStorage ? (localStorage.getItem("settings") !== null) 
        // : (this.cookies.getKeys().length > 0));
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
            
        // If version is out of date, reset settings
        // TODO 09/02/2010:
        // Instead of reseting user settings whenever the version is different, do a check on each
        // item to make sure its valid, reset those items which are invalid, and then update the 
        // stored version number.
        if (this.get('version') < this._defaults.version) {
            //this._loadDefaults();
            this._checkSettings();
        }
    },
    
    /**
     * Loads defaults user settings
     */
    _loadDefaults: function () {
        if ($.support.localStorage) {
            localStorage.clear();
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
     */
    _processURLSettings: function (urlSettings) {
        if (urlSettings.date) {
            this.set("date", getUTCTimestamp(urlSettings.date));
        }

        if (urlSettings.imageScale) {
            this.set("imageScale", parseFloat(urlSettings.imageScale));
        }
        
        if (urlSettings.imageLayers) {
            this.set("tileLayers", this._parseURLStringLayers(urlSettings.imageLayers));
        }
    },
    
    /**
     * Processes a string containing one or more layers and converts them into JavaScript objects
     */
    _parseURLStringLayers: function (urlLayers) {
        var layers = [], self = this;
        
        $.each(urlLayers, function (i, layerString) {
            layers.push(parseLayerString(layerString));
        });

        return layers;
    },
    
    /**
     * Sets up event-handlers
     */
    _setupEventHandlers: function () {
        var self = this;
        
        $(document).bind("save-setting", function (event, key, value) {
            self.set(key, value);
        });
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
        case "date":
            this._validator.checkTimestamp(value);
            break;
        case "imageScale":
            this._validator.checkFloat(value, {
                "min": this._constraints.minImageScale,
                "max": this._constraints.maxImageScale
            });
            break;
        case "movie-history":
            $.each(value, function (i, movie) {
                self._validator.checkTimestamp(movie["dateRequested"]);
            });
            break;
        case "movieLength":
            this._validator.checkInt(value, {
                "min": this._constraints.minMovieLength,
                "max": this._constraints.maxMovieLength
            });
            break;
        case "screenshot-history":
            $.each(value, function (i, screenshot) {
                self._validator.checkTimestamp(screenshot["dateRequested"]);
            });
            break;
        default:
            break;        
        }
    }
});

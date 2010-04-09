/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, CookieJar, $, localStorage, getUTCTimestamp */
"use strict";
var UserSettings = Class.extend(
    /** @lends UserSettings.prototype */
    {
    /**
     * Class to manage user preferences.<br><br>
     * 
     * Creates a class which handles the storing the retrieving of custom user settings. This includes things
     * like the requested observation time, image zoom level, and the layers currently loaded. The UserSettings
     * class has the ability to use both HTML5 local storage and cookies for saving information. In addition, 
     * when supported, objects are stored as JSON objects rather than strings.<br><br>
     *    
     * TODO 2010/04/09: Generalize the validation step by passing in an array of validation criteria instead
     * of passing in parameters individually.
     *    
     * @constructs
     * 
     * @see <a href="https://developer.mozilla.org/en/DOM/Storage">https://developer.mozilla.org/en/DOM/Storage</a>
     */
    init: function (defaults, minImageScale, maxImageScale) {
        this._defaults      = defaults;
        this._minImageScale = minImageScale;
        this._maxImageScale = maxImageScale;        
                
        // Initialize storage
        this._initStorage();
    },

    /**
     * Saves a specified setting
     * 
     * @param {String} key   The setting to update
     * @param {Object} value The new value for the setting
     */
    set: function (key, value) {
        if (this._validate(key, value)) {
            // Update settings
            this.settings[key] = value;
            
            // localStorage + native JSON
            if ($.support.localStorage && $.support.nativeJSON) {
                localStorage.setObject("settings", this.settings);
            }
            
            // localStorage only
            else if ($.support.localStorage) {
                localStorage.setItem("settings", $.toJSON(this.settings));
            }
            
            // cookies
            else {         
                this.cookies.set("settings", this.settings);
            }
        }
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
        if (this.get('version') !== this._defaults.version) {
            this._loadDefaults();
        }
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
        switch (setting) {
        case "date":
            if (isNaN(value)) {
                return false;
            }
            break;
        case "imageScale":
            if ((isNaN(value)) || (value < this._minImageScale) || (value > this._maxImageScale)) {
                return false;
            }
            break;
        default:
            break;        
        }
        return true;
    },
    
    /**
     * Loads defaults user settings
     */
    _loadDefaults: function () {
        if ($.support.localStorage) {
            localStorage.clear();
            
            if ($.support.nativeJSON) {
                localStorage.setObject("settings", this._defaults);
            }
            else { 
                localStorage.setItem("settings", $.toJSON(this._defaults));
            }
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
        // If native JSON is supported, return value directly
        if ($.support.localStorage && $.support.nativeJSON) {
            this.settings = localStorage.getObject("settings");
        }

        else if ($.support.localStorage) {
            this.settings = $.parseJSON(localStorage.getItem("settings"));
        }
            
        // Otherwise, check type and return
        else {
            this.settings = this.cookies.get("settings");
        }
    }
});

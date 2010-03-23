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
     * <div style="color: gray;">
     *    Keith 2009/07/01: 
     *    
     *    There is currently a bug in the Prototype 1.6 series which prevents
     *    Firefox 3.5's native JSON functionality from working properly.
     *    The issue should be fixed in the upcoming 1.7 series.
     *    See: https://prototype.lighthouseapp.com/projects/8886/tickets/730
     * </div>
     *    
     * @constructs
     * @param {Object} controller A reference to the Helioviewer application class
     * @see <a href="https://developer.mozilla.org/en/DOM/Storage">https://developer.mozilla.org/en/DOM/Storage</a>
     */
    init: function (controller) {
        this.controller = controller;
                
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
     * Builds a URL for the current view
     *
     * @TODO: Add support for viewport offset, event layers, opacity
     * @TODO: Make into a static method for use by Jetpack, etc? http://www.ruby-forum.com/topic/154386
     * 
     * @returns {String} A URL representing the current state of Helioviewer.org.
     */
    toURL: function () {
        var url, date, imageScale, imageLayers;
        
        // Base URL
        //url = "http://www.helioviewer.org/?";
        url = this.controller.rootURL + "/?";
        
        // Add timestamp
        date = this.controller.date.toISOString();
    
        // Add image scale
        imageScale = this.controller.getImageScale();
        
        // Image layers
        imageLayers = this.controller.tileLayers.toString();
        
        // Build URL
        url += "date=" + date + "&imageScale=" + imageScale + "&imageLayers=" + imageLayers;

        return url;
    },

    /**
     * Breaks up a given layer identifier (e.g. SOHO,LASCO,C2,white light) into its component parts and returns 
     * a javascript representation.
     * 
     * @param {String} The layer identifier as an underscore-concatenated string
     * @see TileLayer.toString
     * 
     * @returns {Object} A simple javascript object representing the layer params
     */
    parseLayerString: function (str) {
        var params = str.split(",");
        return {
            observatory: params[0],
            instrument : params[1],
            detector   : params[2],
            measurement: params[3],
            visible    : Boolean(parseInt(params[4], 10)),
            opacity    : parseInt(params[5], 10),
            server     : parseInt(params[6], 10) || 0
        };
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
        if (this.get('version') !== this.controller.version) {
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
            if ((isNaN(value)) || (value < this.controller.minImageScale) || (value > this.controller.maxImageScale)) {
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
        var defaults = this._getDefaults();
        
        if ($.support.localStorage) {
            localStorage.clear();
            
            if ($.support.nativeJSON) {
                localStorage.setObject("settings", defaults);
            }
            else { 
                localStorage.setItem("settings", $.toJSON(defaults));
            }
        }
        else {
            this.cookies.set("settings", defaults);
        }
            
        this.settings = defaults;
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
    },
    
    /**
     * Creates a hash containing the default settings to use
     * 
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaults: function () {
        return {
            date            : getUTCTimestamp(this.controller.defaultObsTime),
            imageScale      : this.controller.defaultImageScale,
            version         : this.controller.version,
            warnMouseCoords : true,
            showWelcomeMsg  : true,
            tileLayers : [{
                server     : 0,
                observatory: 'SOHO',
                instrument : 'EIT',
                detector   : 'EIT',
                measurement: '304',
                visible    : true,
                opacity    : 100
            }],
            eventIcons      : {
                'VSOService::noaa'         : 'small-blue-circle',
                'GOESXRayService::GOESXRay': 'small-green-diamond',
                'VSOService::cmelist'      : 'small-yellow-square'
            }
        };
    } 
});

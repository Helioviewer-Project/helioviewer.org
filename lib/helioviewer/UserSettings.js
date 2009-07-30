/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * Syntax: Prototype ()
 * 
 * Keith 2009/07/01:
 *     There is currently a bug in the Prototype 1.6 series which prevents
 *     Firefox 3.5's native JSON functionality from working properly.
 *     The issue should be fixed in the upcoming 1.7 series.
 *     See: https://prototype.lighthouseapp.com/projects/8886/tickets/730
 */
/*global Class, CookieJar, $H */
var UserSettings = Class.create(
	/** @lends UserSettings.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new UserSettings instance.
	 * @param {Object} controller A reference to the Helioviewer application class
	 */
	initialize: function (controller) {
		this.controller = controller;
				
        // Initialize storage
        this._initStorage();
	},

	/**
	 * @description Saves a specified setting
	 * @param {String} key The setting to update
	 * @param {JSON} value The new value for the setting
	 */
	set: function (key, value) {
        if (this._validate(key, value)) {
            // Update settings
            this.settings[key] = value;
            
            // localStorage + native JSON
            if (jQuery.support.localStorage && jQuery.support.nativeJSON)
                localStorage.setObject("settings", this.settings);
            
            // localStorage only
            else if (jQuery.support.localStorage)
                localStorage.setItem("settings", Object.toJSON(this.settings));
            
            // cookies
            else            
                this.cookies.put("settings", this.settings);
        }
	},
	
	/**
	 * @description Gets a specified setting
	 * @param {String} key The setting to retrieve
	 * @returns {JSON} The value of the desired setting
	 */
	get: function (key) {
        return this.settings[key];
	},
	
    /**
     * @description Builds a URL for the current view
     * @param {Object} level
     * @TODO: Add support for viewport offset, event layers, opacity
     * @TODO: Make into a static method for use by Jetpack, etc? http://www.ruby-forum.com/topic/154386
     */
    toURL: function () {
        var url, date, zoom, imageLayers;
        
        // Base URL
        url = "http://www.helioviewer.org/?";
        
        // Add timestamp
        date = this.controller.date.toISOString();
	
        // Add zoomlevel
        zoom = this.controller.getImageScale();
        
        // Image layers
        imageLayers = this.controller.tileLayers.toString();
        
        // Build URL
        url += "date=" + date + "&imageScale=" + zoom + "&imageLayers=" + imageLayers;

        return url;
    },

    /**
     * @description Breaks up a given layer identifier (e.g. SOH_LAS_0C2_0WL) into
     *              its component parts and returns a javascript representation.
	 * @param {String} The layer identifier as an underscore-concatenated string
	 * @returns {Object} a simple javascript object representing the layer params
	 * @see TileLayer.toString
     */
    parseLayerString: function (str) {
        var params = str.split(",");
        return {
            observatory: params[0],
            instrument : params[1],
            detector   : params[2],
            measurement: params[3],
            visible    : Boolean(parseInt(params[4])),
            opacity    : parseInt(params[5]),
            server     : params[6] || null
        };
    },

	/**
	 * @description Checks to see if there are any existing stored user settings
	 */
	_exists: function () {
        return (jQuery.support.localStorage ? (localStorage.getItem("settings") !== null) : (this.cookies.getKeys().length > 0));
	},
    	
    /**
     * @description Decides on best storage format to use, and initializes it
     */
    _initStorage: function() {
        // Initialize CookieJar if localStorage isn't supported
        if (!jQuery.support.localStorage) {
            this.cookies = new CookieJar({
                expires: 31536000, //1 year
                path: '/'
            });
        }
        
        // If no stored user settings exist, load defaults
		if (!this._exists())
			this._loadDefaults();
        else
            this._loadSavedSettings();
            
        // If version is out of date, reset settings
        if (this.get('version') != this.controller.version)
            this._loadDefaults();
    },
    
	/**
	 * @description Validates a setting (Currently checks observation date and zoomLevel)
	 * @param {String} setting The setting to be validated
	 * @param {String} value The value of the setting to check
	 */
	_validate: function (setting, value) {
		switch (setting) {
		case "date":
			if (isNaN(value)) {
				return false;
			}
			break;
		case "zoomLevel":
			if ((isNaN(value)) || (value < this.controller.minZoomLevel) || (value > this.controller.maxZoomLevel)) {
				return false;
			}
			break;
		default:
			break;		
		}
		return true;
	},
	
	/**
	 * @description Loads defaults user settings
	 */
	_loadDefaults: function () {
        var defaults = this._getDefaults();
        
        if (jQuery.support.localStorage) {
            localStorage.clear();
            
            if (jQuery.support.nativeJSON)
                localStorage.setObject("settings", defaults);
            else 
                localStorage.setItem("settings", Object.toJSON(defaults));
        }
        else 
            this.cookies.put("settings", defaults);
            
        this.settings = defaults;
    },
    
	/**
     * Retrieves the saved user settings and saved them locally
     */
    _loadSavedSettings: function () {
        // If native JSON is supported, return value directly
        if (jQuery.support.localStorage && jQuery.support.nativeJSON)
            this.settings = localStorage.getObject("settings");

        else if (jQuery.support.localStorage)
            this.settings = localStorage.getItem("settings").evalJSON();
            
        // Otherwise, check type and return
        else
            this.settings = this.cookies.get("settings");
    },
    
    /**
     * @description Creates a hash containing the default settings to use
     */
    _getDefaults: function () {
		return {
			date			: getUTCTimestamp(this.controller.defaultObsTime),
			zoomLevel		: this.controller.defaultZoomLevel,
            version         : this.controller.version,
			warnZoomLevel	: false,
			warnMouseCoords : false,
           	tileLayers		: [{
                server     : "api/index.php",
                observatory: 'SOH',
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

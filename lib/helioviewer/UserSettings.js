/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * Syntax: Prototype
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * Keith 2009/07/01:
 *     There is currently a bug in the Prototype 1.6 series which prevents
 *     Firefox 3.5's native JSON functionality from working properly.
 *     The issue should be fixed in the upcoming 1.7 series. See:
 *       https://prototype.lighthouseapp.com/projects/8886/tickets/730
 *       
 * TODO 2009/07/02:
 *     It may be more efficient to store/retrieve the entire object as JSON
 *     each time something is updated: this way there is no need to track the
 *     
 */
/*global Class, CookieJar, $H */
var UserSettings = Class.create(
	/** @lends UserSettings.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new UserSettings instance. Because all cookie data is stored as strings, numeric types
	 *              must be specified (e.g. in _INTEGER_PARAMS) so that the application knows to parse them as such.
	 * @param {Object} controller A reference to the Helioviewer application class
	 */
	initialize: function (controller) {
		this.controller = controller;
		
        // Default values
        this._createDefaults();
		
        // Expected types
		this._INTEGER_PARAMS = $A(['date','zoom-level']);
		this._FLOAT_PARAMS   = $A([]);
		this._BOOLEAN_PARAMS = $A(['warn-zoom-level', 'warn-mouse-coords']);

        // Initialize storage
        this._initStorage();
		
        // If not user settings exist, or version is out of date, load defaults
		if ((!this._exists()) || (this.get('version') != this.controller.version)) {
			this._loadDefaults();
		}
	},
    
    /**
     * @description Creates a hash containing the default settings to use
     * 
     * NOTE: Must include quotation marks around keys in JSON objects when they exist inside arrays!
     */
    _createDefaults: function () {
		this._DEFAULTS = $H({
			'date'			    : getUTCTimestamp(this.controller.defaultObsTime),
			'zoom-level'		: this.controller.defaultZoomLevel,
            'version'           : this.controller.version,
			'warn-zoom-level'	: false,
			'warn-mouse-coords'	: false,
           	'tile-layers'		: [{
                tileAPI    : "api/index.php",
                server     : 1,
                observatory: 'SOH',
                instrument : 'EIT',
                detector   : 'EIT',
                measurement: '304' 
             }],
			'event-icons'  : {
				'VSOService::noaa'         : 'small-blue-circle',
				'GOESXRayService::GOESXRay': 'small-green-diamond',
				'VSOService::cmelist'      : 'small-yellow-square'
			}
		});
    },    
    
    /**
     * @description Decides on best storage format to use, and initializes it
     */
    _initStorage: function() {
        // Only need to initialize something if using cookies
        if (!this.controller.support.localStorage) {
            this.cookies = new CookieJar({
                expires: 31536000, //1 year
                path: '/'
            });
        }
    },
    
	/**
	 * @description Saves a specified setting
	 * @param {String} key The setting to update
	 * @param {JSON} value The new value for the setting
	 */
	set: function (key, value) {
        if (this._validate(key, value)) {
            // localStorage + native JSON
            if (this.controller.support.localStorage && this.controller.support.nativeJSON)
                localStorage.setObject(key, value);
            
            // localStorage only
            else if (this.controller.support.localStorage)
                localStorage.setItem(key, Object.toJSON(value));
            
            // cookies
            else            
                this.cookies.put(key, value);
        }
	},
	
	/**
	 * @description Gets a specified setting
	 * @param {String} key The setting to retrieve
	 * @returns {JSON} The value of the desired setting
	 */
	get: function (key) {
        // If native JSON is supported, return value directly
        if (this.controller.support.localStorage && this.controller.support.nativeJSON)
            return localStorage.getObject(key);

        else if (this.controller.support.localStorage)
            return this._fetch(key).evalJSON();
            
        // Otherwise, check type and return
        else {
            if (this._INTEGER_PARAMS.include(key))
                return parseInt(this._fetch(key), 10);
            else if (this._FLOAT_PARAMS.include(key)) 
                return parseFloat(this._fetch(key));
                
            else if (this._BOOLEAN_PARAMS.include(key)) 
                return this._fetch(key) === "true" ? true : false;
            else 
                return this._fetch(key);
        }
	},
    
    /**
     * @description Convenience function to normalize behavior between localStorage and cookies
     */
    _fetch: function (key) {
        return (this.controller.support.localStorage ? localStorage.getItem(key) : this.cookies.get(key));
    },
	
	/**
	 * @description Checks to see if there are any existing stored user settings
	 */
	_exists: function () {
        return (this.controller.support.localStorage ? (localStorage.length > 0) : (this.cookies.getKeys().length > 0));
	},
	
	/**
	 * @description Validates a setting (Currently checks observation date and zoom-level)
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
		case "zoom-level":
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
	 * @description Resets a single setting to it's default value
	 * @param {String} setting The setting for which the default value should be loaded
	 */
	_resetSetting: function (setting) {
		this.set(setting, this._getDefault(setting));		
	},
	
	/**
	 * @description Gets the default value for a given setting
	 * @param {Object} setting
	 */
	_getDefault: function (setting) {
		return this._DEFAULTS.get(setting);
	},
	
	/**
	 * @description Loads defaults user settings
	 */
	_loadDefaults: function () {
		var self = this;
		this._DEFAULTS.each(function (setting) {
			self.set(setting.key, setting.value);
		});
	}
});

/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * Syntax: Prototype, jQuery
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 */
var UserSettings = Class.create(
	/** @lends UserSettings.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new UserSettings instance
	 * @param {Object} controller A reference to the Helioviewer application class
	 */
	initialize: function (controller) {
		this.controller = controller;
		
		/**
		 * @description Default user settings
		 */
		this._DEFAULTS = $H({
			'obs-date'			: 1065312000000,
			'zoom-level'		: this.controller.defaultZoomLevel,
			'tile-layers'		: [{ tileAPI: "api/index.php", observatory: 'SOH', instrument: 'EIT', detector: 'EIT', measurement: '195' }],
			'warn-zoom-level'	: false,
			'warn-mouse-coords'	: false,
			'event-icons'		: {
				'VSOService::noaa':				'small-blue-circle',
				'GOESXRayService::GOESXRay':	'small-green-diamond',
				'VSOService::cmelist':			'small-yellow-square'
			}
		});

		this.cookies = new CookieJar({
			expires: 31536000, //1 year
			path: '/'
		});
		
		if (!this._exists()) {
			this._loadDefaults();
		}
	},
	
	/**
	 * @description Saves a specified setting
	 * @param {String} key The setting to update
	 * @param {JSON} value The new value for the setting
	 */
	set: function (key, value) {
		if (this._validate(key, value)) {
			this.cookies.put(key, value);
		} else {
			console.log("Ignoring invalid user-setting...");
		}
	},
	
	/**
	 * @description Gets a specified setting
	 * @param {String} key The setting to retrieve
	 * @returns {JSON} The value of the desired setting
	 */
	get: function (key) {
		return this.cookies.get(key);
	},
	
	/**
	 * @description Checks to see if user-settings cookies have been set.
	 */
	_exists: function () {
		return (this.cookies.getKeys().length > 0);
	},
	
	/**
	 * @description Validates a setting (Currently checks observation date and zoom-level)
	 * @param {String} setting The setting to be validated
	 * @param {String} value The value of the setting to check
	 */
	_validate: function (setting, value) {
		switch(setting) {
			case "obs-date":
				if (isNaN(value))
					return false;
				break;
			case "zoom-level":
				if ((isNaN(value)) || (value < this.controller.minZoomLevel) || (value > this.controller.maxZoomLevel))
					return false;
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
	 * @description Loads defaults if cookies have not been set prior.
	 */
	_loadDefaults: function () {
		var self = this;
		this._DEFAULTS.each(function(setting) {
			self.set(setting.key, setting.value);
		});
	}
});

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
		this.cookies.put(key, value);
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
	 * @description Loads defaults if cookies have not been set prior.
	 */
	_loadDefaults: function () {
		// Date
		this.set('obs-date', 1065312000000); // Unix Timestamp in milliseconds for Oct 05, 2003, UTC
		
		// Zoom-level 
		this.set('zoom-level', this.controller.defaultZoomLevel);
		
		// Overlays
		this.set('tile-layers', [
			{ tileAPI: "api/index.php", observatory: 'SOH', instrument: 'EIT', detector: 'EIT', measurement: '195' }
		]);
		
		// { tileAPI: "api/index.php", observatory: 'SOH', instrument: 'LAS', detector: '0C2', measurement: '0WL' }
		// { tileAPI: "api/index.php", observatory: 'SOH', instrument: 'MDI', detector: 'MDI', measurement: 'mag' };
		
		// Warnings
		this.set('warn-mouse-coords', false);
		this.set('warn-zoom-level',   false);
		
		// Event Icons
		this.set('event-icons', {
			'VSOService::noaa':				'small-blue-circle',
			'GOESXRayService::GOESXRay':	'small-green-diamond',
			'VSOService::cmelist':			'small-yellow-square'
		});
	}
});

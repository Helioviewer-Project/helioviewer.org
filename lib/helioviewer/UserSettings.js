/**
 * @fileoverview Descript of the UserSettings class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class UserSettings
 * 
 * syntax: Prototype, jQuery
 *
 */
var UserSettings = Class.create({
	/**
	 * @constructor
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
	 * @function
	 * @param {String} key
	 * @param {JSON} value
	 */
	set: function (key, value) {
		this.cookies.put(key, value);
	},
	
	/**
	 * @function
	 * @param {String} key
	 */
	get: function (key) {
		return this.cookies.get(key);
	},
	
	/**
	 * @function
	 * @description Checks to see if user-settings cookies have been set.
	 */
	_exists: function () {
		return (this.cookies.getKeys().length > 0);
	},
	
	/**
	 * @function
	 * @description Loads defaults if cookies have not been set prior.
	 */
	_loadDefaults: function () {
		Debug.output("Loading defaults...");
		
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

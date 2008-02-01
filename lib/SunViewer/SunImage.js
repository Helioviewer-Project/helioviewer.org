/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription This class represents an image of the sun at a
 * specific date and its characteristics.
 */
var SunImage = new Class.create();

SunImage.prototype = {
// Default options
	defaultOptions: $H({
		dateStr: '',
		tileDir: null,
		tileSize: 256,
		spacecraft: 'SMEX',
		instrument: 'TRACE',
		wavelength: null,
		resolution: 0,
		maxZoomLevel: 5,
		// The radius of the sun relative to the complete image
		sunRadius: 0.233,
		zoomLevelOffset: 0
	}),
	
	/**
	 * @constructor
	 * @param {Hash} options	Available options: tileDir, tileSize, spacecraft, instrument, wavelength, resolution, maxZoomLevel, sunRadius, sunCenter, zoomLevelOffset, date
	 */
	initialize: function(options) {
		this.sunCenter = { x: 0.5, y: 0.5 };
		this.date = new SunImgDate();
		
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
	}
};

/**
 * @classDescription Represents a date an image of the sun has been taken on.
 */
SunImgDate = Class.create();

SunImgDate.prototype = {
	defaultOptions: $H({
		year: 0,
		month: 0,
		day: 0,
		hour: 0,
		min: 0,
		sec: 0
	}),

	/**
	 * @constructor
	 * @param {Hash} options	Available options: year, month, day, hour, min, sec
	 */
	initialize: function(options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
	},
	
	/**
	 * @method secsSinceMidnight	Returns the number of seconds since 0:00.
	 * @return {Number}				The number of seconds since 0:00.
	 */
	secsSinceMidnight: function() {
		Debug.output("secssincemidnight si");
		return String.parseInt(this.hour) * 3600 + String.parseInt(this.min) * 60 + String.parseInt(this.sec);
	},
	
	/**
	 * @method timeStr				Returns the time of the image in a H:M:S format.
	 * @return {String}				The time as a string.
	 */
	timeStr: function() {
		return this.hour + ':' + this.min + ':' + this.sec;
	},
	
	/**
	 * TODO: Change name to be more correct (e.g. getAngle or so).
	 * @method getObliquity			Returns the angle of the earth towards the solar plane at this date.
	 * @return {Number}				The angle at this date.
	 */
	getObliquity: function() {
		Debug.output("getob si");
		var OBLIQUITY_DEGREES = (7.25).toRad();
		var MILLISECONDS_PER_YEAR = 31536000000;
		// Day the earth is at 0 degree to the sun (June 7th). Let's forget about leap years and higher-than-24-hours-precision for now.
		var d0UnixTime = Date.UTC(this.year, 6, 7);
		var dUnixTime = Date.UTC(this.year, this.month, this.day);
		return OBLIQUITY_DEGREES * Math.sin( (dUnixTime - d0UnixTime) / MILLISECONDS_PER_YEAR * 2 * Math.PI );
	},
	
	/**
	 * @method getRotationDeltaLongitude	Returns the longitudal delta to the 0:00 value of a location
	 * 										on the surface of the sun due to rotation, which depends on the
	 * 										latitude value.
	 * @param {Number} latitude				The latitude of the location on the sun.
	 * @return {Number}						The longitudal delta.
	 */
	getRotationDeltaLongitude: function(latitude) {
		Debug.output("getrotationdelta");
		return ((this.secsSinceMidnight() / 86400) * (14.44 - 3 * Math.pow(Math.sin(latitude), 2))).toRad();
	}
}

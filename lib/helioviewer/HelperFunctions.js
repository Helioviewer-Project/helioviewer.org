/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global Event, Element, navigator */
/**
 * @description Pads a string to the left.
 * @param {String} padding Character to use for padding, e.g. " "
 * @param {Int} minLength Length to pad up to
 * @returns {String} The resulting string.
 */
String.prototype.padLeft = function (padding, minLength) {
	var str = this,
		pad = '' + padding;
	while (str.length < minLength) {
		str = pad + str;
	}
	return str;
};
/**
 * @description Trims a string from the left.
 * @param {String} padding Character to trim.
 * @returns {String} The resulting string.
 */
String.prototype.trimLeft = function (padding) {
	var str = this,
		pad = '' + padding;
	while (str[0] === pad) {
	    str = str.substr(1);
	}
	return str;
};

/**
 * @description Outputs a UTC Date string of the format "YYYY/MM/dd"
 * @returns {String} Datestring.
 */
Date.prototype.toYmdUTCString = function () {
	var year = this.getUTCFullYear() + '',
		month = (this.getUTCMonth() + 1) + '',
		day = this.getUTCDate() + '';
	return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

/**
 * @description Outputs a UTC Date string of the format "HH:mm:ss"
 * @returns {String} Datestring.
 */
Date.prototype.toHmUTCString = function () {
	var hour = this.getUTCHours() + '',
		min = this.getUTCMinutes() + '',
		sec = this.getUTCSeconds() + '';
	return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};

/**
 * @description Takes a localized javascript date and returns a date set to the UTC time.
 */
Date.prototype.toUTCDate = function () {
	var utcOffset = this.getUTCOffset(),
		sign = utcOffset[0],
		hours = parseInt(utcOffset.substr(1, 2), 10),
		mins = parseInt(utcOffset.substr(3, 4), 10),
	
		numSecs = (3600 * hours) + (60 * mins);
	
	if (sign === "+") {
		numSecs = - numSecs;
	}
	
	this.addSeconds(numSecs);
};

Element.addMethods({
	/**
	 * @name Event.observeOnce
	 * @description Prototype observeOnce function, Courtesy of Kangax
	 */
	observeOnce: (Event.observeOnce = function (element, eventName, handler) {
		return Event.observe(element, eventName, function (e) {
			Event.stopObserving(element, eventName, arguments.callee);
			handler.call(element, e);
		});
	})
});

/**
 * @description Determine what operating system the user is likely to be on: For use when chosing movie codecs, etc.
 * @returns {String} Abbreviation of the user's OS
 */
var getOS = function () {
	var os = "other";
	
	if (navigator.appVersion.indexOf("Win") !== -1) {
		os = "win";
	}
	if (navigator.appVersion.indexOf("Mac") !== -1) {
		os = "mac";
	}
	if (navigator.appVersion.indexOf("X11") !== -1) {
		os = "linux";
	}
	if (navigator.appVersion.indexOf("Linux") !== -1) {
		os = "linux";
	}
	
	return os;
};

/**
 * @description Convert from cartesian to polar coordinates
 * @param {Int} x X coordinate
 * @param {Int} y Y coordinate
 * @returns {Object} Polar coordinates (r, theta) resulting from conversion 
 */
Math.toPolarCoords = function (x, y) {
	var radians = Math.atan(y / x);
	
	if  ((x > 0) && (y < 0)) {
		radians += (2 * Math.PI);
	}
	else if (x < 0) {
		radians += Math.PI;
	}
	else if ((x === 0) && (y > 0)) {
		radians = Math.PI / 2;
	}
	else if ((x === 0) && (y < 0)) {
		radians = (3 * Math.PI) / 2;
	}
		
	return {
		r     : Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
		theta : (180 / Math.PI) * radians
	};
};

/**
 * @description Return base-2 logarithm of the given number (Note: log_b(x) = log_c(x) / log_c(b))
 * @param {Number} x Number
 * @returns {Number} The base-2 logarithm of the input value
 */
Math.lg = function (x) {
	return (Math.log(x) / Math.log(2));
};

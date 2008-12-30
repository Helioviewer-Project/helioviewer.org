/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt	 keith.hughitt@gmail.com
 */
String.prototype.padLeft = function (padding, minLength) {
	var str = this;
	var strPad = '' + padding;
	while (str.length < minLength) {
		str = strPad + str;
	}
	return str;
};

String.prototype.trimLeft = function (padding) {
	var str = this;
	var strPad = '' + padding;
	while (str[0] === strPad) {
	    str = str.substr(1);
	}
	return str;
};

Date.prototype.toYmdUTCString = function () {
	var year = this.getUTCFullYear() + '';
	var month = (this.getUTCMonth() + 1) + '';
	var day = this.getUTCDate() + '';
	return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

Date.prototype.toHmUTCString = function () {
	var hour = this.getUTCHours() + '';
	var min = this.getUTCMinutes() + '';
	var sec = this.getUTCSeconds() + '';
	return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};

/**
 * Takes a localized javascript date and returns a date set to the UTC time.
 */
Date.prototype.toUTCDate = function () {
	var utcOffset = this.getUTCOffset();
	var sign = utcOffset[0];
	var hours = parseInt(utcOffset.substr(1,2));
	var mins = parseInt(utcOffset.substr(3,4));
	
	var numSecs = (3600 * hours) + (60 * mins);
	
	if (sign === "+") {
		numSecs = - numSecs;
	}
	
	this.addSeconds(numSecs);
};

/**
 * Prototype observeOnce function
 * Courtesy of Kangax
 */
Element.addMethods({
	observeOnce: (Event.observeOnce = function(element, eventName, handler) {
		return Event.observe(element, eventName, function(e) {
			Event.stopObserving(element, eventName, arguments.callee);
			handler.call(element, e);
		});
	})
});

/**
 * getOS
 */
var getOS = function () {
	var os = "other";
	
	if (navigator.appVersion.indexOf("Win")!=-1) {
		os = "win"
	}
	if (navigator.appVersion.indexOf("Mac")!=-1) {
		os = "mac";
	}
	if (navigator.appVersion.indexOf("X11")!=-1) {
		os = "linux";
	}
	if (navigator.appVersion.indexOf("Linux")!=-1) {
		os = "linux";
	}
	
	return os;
};

/**
 * Convert from cartesian to polar coordinates
 * @param {Object} x
 * @param {Object} y
 */
Math.toPolarCoords = function (x,y) {
	var radians = Math.atan(y/x);
	
	if  ((x > 0) && (y < 0)) {
		radians += (2 * Math.PI);
	}
	else if (x < 0) {
		radians += Math.PI;
	}
	else if ((x == 0) && (y > 0)) {
		radians = Math.PI / 2;
	}
	else if ((x == 0) && (y < 0)) {
		radians = (3 * Math.PI) / 2;
	}
		
	return {
		r     : Math.sqrt(Math.pow(x,2) + Math.pow(y,2)),
		theta : (180/Math.PI) * radians
	};
}

/**
 * Log base-2
 * log_b(x) = log_c(x) / log_c(b)
 */
Math.lg = function(x) {
	return (Math.log(x)/ Math.log(2));
}

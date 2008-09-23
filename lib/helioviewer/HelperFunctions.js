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

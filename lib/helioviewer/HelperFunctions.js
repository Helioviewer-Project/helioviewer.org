/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
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
/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 *
 * TODO: Move helper functions to a separate namespcae? (e.g. $hv)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: false, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true, console: true */
/*global window, console, $, navigator, Storage */
"use strict";

/**
 * Takes a number of seconds and returns a human-readable representation of
 * the interval
 */
var humanReadableNumSeconds = function (seconds) {
    if (seconds <= 60) {
        return Math.ceil(seconds) + " seconds";
    } else if (seconds <= 119) {
        // Since it's flooring values, any number under 2 minutes (120 seconds)
        // should come up as "1 minute ago" rather than "1 minutes ago"
        return "1 minute";
    } else if (seconds <= 3600) {
        return Math.floor(seconds / 60) + " minutes";
    } else if (seconds <= 7199) {
        // Same as above, any number under 2 hours (7200 seconds)
        // should come up as "1 hour ago" rather than "1 hours ago"
        return "1 hour";
    } else if (seconds <= 86400) {
        return Math.floor(seconds / 3600) + " hours";
    } else if (seconds <= 172799) {
        // Same as above, any number under 2 days (172800 seconds)
        // should come up as "1 day ago" rather than "1 days ago"
        return "1 day";
    } else {
        return Math.floor(seconds / 86400) + " days";
    }
};

/**
 * @description Outputs a UTC Date string of the format "YYYY/MM/dd"
 * @returns {String} Datestring.
 */
Date.prototype.toUTCDateString = function () {
    var year  = this.getUTCFullYear()    + '',
        month = (this.getUTCMonth() + 1) + '',
        day   = this.getUTCDate()        + '';
    return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

/**
 * @description Outputs a UTC Date string of the format "HH:mm:ss"
 * @returns {String} Datestring.
 */
Date.prototype.toUTCTimeString = function () {
    var hour = this.getUTCHours()  + '',
        min = this.getUTCMinutes() + '',
        sec = this.getUTCSeconds() + '';
    return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};


/**
 * @description Outputs a Date string of the format "YYYY/MM/dd"
 * @returns {String} Datestring.
 */
Date.prototype.toDateString = function () {
    var year  = this.getFullYear()    + '',
        month = (this.getMonth() + 1) + '',
        day   = this.getDate()        + '';
    return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

/**
 * @description Outputs a Date string of the format "HH:mm:ss"
 * @returns {String} Datestring.
 */
Date.prototype.toTimeString = function () {
    var hour = this.getHours()  + '',
        min = this.getMinutes() + '',
        sec = this.getSeconds() + '';
    return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};

/**
 * Takes a localized javascript date and returns a date set to the UTC time.
 *
 */
Date.prototype.toUTCDate = function () {
    return new Date(Date.UTC(
        this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds()
    ));
};

/**
 * Takes in a time difference in seconds and converts it to elapsed time,
 * e.g. "5 minutes ago" or "3 days ago"
 */
Date.prototype.getElapsedTime = function () {
    // Elapsed time in seconds
    var diff = (new Date().getTime() - this.getTime()) / 1000;
    return humanReadableNumSeconds(diff);
};

/**
 * Parses dates and returns a UTC JavaScript date object.
 *
 * @param  {String} s A UTC date string of the form 2011-03-14 17:41:39,
 *                    2011-03-14T17:41:39, or 2011-03-14T17:41:39.000Z
 *
 * @return {Date} UTC JavaScript Date object
 */
Date.parseUTCDate = function (s) {
    try {
        return new Date(Date.UTC(
            s.substring(0, 4), parseInt(s.substring(5, 7), 10) - 1, s.substring(8, 10),
            s.substring(11, 13), s.substring(14, 16), s.substring(17, 19)
        ));
    } catch (e) {
        throw "Invalid UTC date string: "+s;
    }
};

/**
 * Normalizes behavior for Date.toISOString
 *
 * Fixes two issues:
 *   1. Browsers with native support for toISOString return a quoted date string,
 *      whereas other browsers return unquoted date string.
 *   2. IE8 doesn't include milliseconds
 *
 * @see http://code.google.com/p/datejs/issues/detail?id=54
 *
 */
var toISOString = Date.prototype.toISOString;
Date.prototype.toISOString = function () {
    var date = toISOString.call(this).replace(/"/g, '');

    if (date.length === 20) {
        date = date.substring(0, 19) + ".000Z";
    }

    return date;
};

/**
 * @description Converts a ISO 8601 UTC formatted date string into a (UTC) Unix timestamp
 *  e.g. "2003-10-05T00:00:00Z" => 1065312000000
 */
var getUTCTimestamp = function (date) {
    var year, month, day, hours, minutes, seconds, ms;

    year    = parseInt(date.substr(0, 4), 10);
    month   = parseInt(date.substr(5, 2), 10) - 1;
    day     = parseInt(date.substr(8, 2), 10);
    hours   = parseInt(date.substr(11, 2), 10);
    minutes = parseInt(date.substr(14, 2), 10);
    seconds = parseInt(date.substr(17, 2), 10);
    ms = 0;

    return Date.UTC(year, month, day, hours, minutes, seconds, ms);
};

/**
 * @description Converts a ISO 8601 UTC formatted date string into a Date object
 *  e.g. "2003-10-05T00:00:00Z" => 1065312000000
 */
var getDateFromUTCString = function (date) {
    var year, month, day, hours, minutes, seconds, ms;

    year    = parseInt(date.substr(0, 4), 10);
    month   = parseInt(date.substr(5, 2), 10) - 1;
    day     = parseInt(date.substr(8, 2), 10);
    hours   = parseInt(date.substr(11, 2), 10);
    minutes = parseInt(date.substr(14, 2), 10);
    seconds = parseInt(date.substr(17, 2), 10);
    ms = 0;

    return new Date(year, month, day, hours, minutes, seconds, ms);
};

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
 * @description Dynamically loads a CSS file
 */
var loadCSS = function (filename) {
    $("head").append("<link rel='stylesheet' type='text/css' href='" + filename + "' />");
};

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
    var radians = Math.atan(-x / y);

    if (y < 0) {
        radians += (Math.PI);
    } else if ((x >= 0) && (y >= 0)) {
        radians += (2 * Math.PI);
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

if (typeof(console) === "undefined") {
    window.console = {};

    console.log = function (msg) {
        return false;
    };

    console.dir = function (obj) {
        return false;
    };
}

/**
 * @description Checks to see if a given variable is a numeric type
 * Source: Prototype's isNumber method
 */
$.isNumber = function (x) {
    return Object.prototype.toString.call(x) === "[object Number]";
};

/**
 * @description Converts coordinates from solar radii to helioprojective (arc-seconds as seen from earth).
 *
 * @input {Float} rx    Solar radii from the center of the sun in the x-direction.
 * @input {Float} ry    Solar radii from the center of the sun in the y-direction.
 * @input {Float} scale The physical scale covered by a single pixel at the current resolution.
 * @input {Float} rsun  The radius of the sun in pixels at the current resolution
 *
 * @return {Object} Returns an object literal containing the converted x and y coordinates.
 */
var solarRadiiToHelioprojective = function (rx, ry, scale, rsun) {
    var rsunInArcSeconds = rsun * scale;

    return {
        x: rx * rsunInArcSeconds,
        y: ry * rsunInArcSeconds
    };
};

/**
 * @description Converts coordinates from helioprojective (arc-seconds as seen from earth) to solar radii.
 *
 * @input {Float} hx    Helioprojective x-coordinate.
 * @input {Float} hy    Helioprojective y-coordinate.
 * @input {Float} scale The physical scale covered by a single pixel at the current resolution.
 * @input {Float} rsun  The radius of the sun in pixels at the current resolution
 *
 * @return {Object} Returns an object literal containing the converted x and y coordinates.
 *
 * @see Viewport.getRSun
 */
var helioprojectiveToSolarRadii = function (hx, hy, scale, rsun) {
    var rsunInArcSeconds = rsun * scale;

    return {
        x: hx / rsunInArcSeconds,
        y: hy / rsunInArcSeconds
    };
};

/**
 * Takes in pixel coordinates and converts them to arcseconds.
 * Pixel coordinates must be relative to the center of the sun.
 *
 * @input {Object} coordinates -- contains values for x1, x2, y1, and y2
 * @input {Float}  scale       -- the scale of the image in arcsec/pixel
 *
 * @return object
 */
var pixelsToArcseconds = function (coordinates, scale) {
    return {
        x1 : coordinates.x1 * scale,
        x2 : coordinates.x2 * scale,
        y1 : coordinates.y1 * scale,
        y2 : coordinates.y2 * scale
    };
};

/**
 * Takes in a string of layers and formats it into an array, removing square
 * brackets
 */
var layerStringToLayerArray = function (layers) {
    var layerArray = [], rawArray = layers.split("],");

    $.each(rawArray, function () {
        layerArray.push(this.replace(/[\[\]]/g, ""));
    });
    return layerArray;
};

/**
 * Takes a single-layer string and returns an array of the layer's name
 * by chopping off the "visible" and "opacity" numbers at the end.
 */
var extractLayerName = function (layer) {
    return layer.split(",").slice(0, -2);
};

/**
 * Breaks up a given layer identifier (e.g. SOHO,LASCO,C2,white-light) into its
 * component parts and returns a JavaScript representation.
 *
 * @param {String} The layer identifier as an comma-concatenated string
 *
 * @returns {Object} A simple JavaScript object representing the layer parameters
 */
var parseLayerString = function (str) {
    var params = str.split(","),
        uiLabels=Array();
	
	var lastName = '';
	var count = 0;
	
	var dateDiff = new Date(+new Date() - 60*60*1000);
	var defaultDiffTime = dateDiff.toDateString()+' '+dateDiff.toTimeString();
	var baseDiffTime	= defaultDiffTime;//default 1 hour difference
	var diffTime 		= 1;
	var diffCount 		= 60;
	var difference 		= 0;
	var opacity 		= 100;
	var visible 		= 1;
	
	if (params.length >= 8) {
        baseDiffTime    = params.pop();
		diffTime 		= params.pop();
		diffCount 		= params.pop();
		difference 		= params.pop();
		opacity 		= params.pop();
		visible 		= params.pop();
    }else{
        opacity       	= params.pop();
		visible 		= params.pop();
    }

    for (var i=0; i<params.length; i++) {
        if(params[i] != lastName){
	        uiLabels[count] = { 'label' : '', 'name'  : params[i] };
	        count++;
        }
        lastName = params[i];
    }

    return {
        uiLabels    : uiLabels,
        visible     : visible,
        opacity     : opacity,
        difference  : difference, 
        diffCount   : diffCount, 
        diffTime    : diffTime, 
        baseDiffTime: baseDiffTime
    };
};

/**
 * Breaks up a given event layer identifier (e.g. <type>,<frm>,<open>) into its
 * component parts and returns a JavaScript representation.
 *
 * @param {String} The event layer identifier as an comma-concatenated string
 *
 * @returns {Object} A simple JavaScript object representing the levent ayer parameters
 */
var parseEventString = function (str) {
    var frms = [], params = str.split(",");

    $.each(params[1].split(";"), function (i, frm_name) {
        frms.push(frm_name);
    });

    return {
        event_type : params[0],
        frms       : frms,
        open       : Boolean(parseInt(params[2], 10))
    };
};


/**
 * Maps iPhone/Android touch events to normal mouse events so that dragging, etc can be done.
 *
 * @see http://ross.posterous.com/2008/08/19/iphone-touch-events-in-javascript/
 */
var htmltwofingersdown=0;

function touchHandler(event)
{
	
	if(event.targetTouches.length == 1 && event.changedTouches.length == 1 && htmltwofingersdown<2) { 

		var touches, first, type, simulatedEvent;

		touches = event.changedTouches;
		first   = touches[0];
		type    = "";

		switch (event.type) {
		case "touchstart":
		type = "mousedown";
		break;
		case "touchmove":
		type = "mousemove";
		break;
		case "touchend":
		type = "mouseup";
		break;
		case "touchcancel":
		type = "mouseup";
		break;		
		default:
		return;
		}

		simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY,
					  first.clientX, first.clientY, false, false, false, false, 0, null);

		first.target.dispatchEvent(simulatedEvent);
		event.preventDefault();

	}
	
}



/**
 * Maps the touch handler events to mouse events for a given element using the touchHandler event listener above
 *
 * @param element HTML element to assign events to
 *
 * @return void
 */


function assignTouchHandlers(element) {
    return;
	if(htmltwofingersdown<2) {
	
		if (typeof element == 'undefined' || !element.addEventListener) {
		return; // IE 8 and under
		}
		element.addEventListener("touchstart", touchHandler, true);
		element.addEventListener("touchmove", touchHandler, true);
		element.addEventListener("touchend", touchHandler, true);
		element.addEventListener("touchcancel", touchHandler, true);
		
	}

}


/**
 * @description Convert Date object to Julian Day.
 * @returns {Float} Julian Day.
 */
Date.prototype.Date2Julian = function() {
	return ((this / 86400000) - (this.getTimezoneOffset() / 1440000) + 2440587.5);
};

/**
 * @description Convert Julian Date to Date Object.
 * @returns {Date} Date Object.
 */
Number.prototype.Julian2Date = function() {

	var X = parseFloat(this)+0.5;
	var Z = Math.floor(X); //Get day without time
	var F = X - Z; //Get time
	var Y = Math.floor((Z-1867216.25)/36524.25);
	var A = Z+1+Y-Math.floor(Y/4);
	var B = A+1524;
	var C = Math.floor((B-122.1)/365.25);
	var D = Math.floor(365.25*C);
	var G = Math.floor((B-D)/30.6001);
	//must get number less than or equal to 12)
	var month = (G<13.5) ? (G-1) : (G-13);
	//if Month is January or February, or the rest of year
	var year = (month<2.5) ? (C-4715) : (C-4716);
	month -= 1; //Handle JavaScript month format
	var UT = B-D-Math.floor(30.6001*G)+F;
	var day = Math.floor(UT);
	//Determine time
	UT -= Math.floor(UT);
	UT *= 24;
	var hour = Math.floor(UT);
	UT -= Math.floor(UT);
	UT *= 60;
	var minute = Math.floor(UT);
	UT -= Math.floor(UT);
	UT *= 60;
	var second = Math.round(UT);
	
	return new Date(Date.UTC(year, month, day, hour, minute, second));
};


//Calculate Carrington Number
/*
	PURPOSE: 
		Conver given UNIX timestamp to Carrington Rotation number
	INPUT:
		timestamp = Unix timestamp
	OUTPUT:
		carr = float
	NOTES:
		Ref: Astronomical Algorithms, Chapter 28, page 179, 1st edition [Meeus, 1991]
		http://flux.aos.wisc.edu/data/code/util/jhulib/sun.pro	
		http://flux.aos.wisc.edu/data/code/util/jhulib/dt_tm_tocr.pro
	TODO:
		Review Formulas for carrington rotation number in SolarSoft IDL:
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrlong.pro
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrdate2.pro
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrdate.pro
		http://sohowww.nascom.nasa.gov/solarsoft/gen/idl/solar/carr2ex.pro
		http://sohowww.nascom.nasa.gov/solarsoft/yohkoh/ucon/idl/sxt_co/carr2date.pro
		http://sohowww.nascom.nasa.gov/solarsoft/yohkoh/ucon/idl/hara/carr2btime.pro
*/

function timestamp_to_carrington(timestamp){
	
	var jd = new Date(timestamp).Date2Julian();
	
	var carr = (jd-2398140.227)/27.2752316;
	
	//Correction
	var dt = carrington_to_timestamp(carr);
	var jdt = dt.Date2Julian();
	var err = (jd-jdt)/27.2752316;
	carr = carr + err;
	
	return carr;
}

/*
	PURPOSE: 
		Conver given Carrington Rotation number Date object
	INPUT:
		carr = Carrington Rotation number
	OUTPUT:
		date = Date Object
	NOTES:
		Ref: Astronomical Algorithms, Chapter 28, page 179, 1st edition [Meeus, 1991]
		http://flux.aos.wisc.edu/data/code/util/jhulib/sun.pro	
		http://flux.aos.wisc.edu/data/code/util/jhulib/dt_tm_fromcr.pro
	TODO:
		Review Formulas for carrington rotation number in SolarSoft IDL:
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrlong.pro
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrdate2.pro
		http://sohowww.nascom.nasa.gov/solarsoft/soho/lasco/idl/synoptic/carrdate.pro
		http://sohowww.nascom.nasa.gov/solarsoft/gen/idl/solar/carr2ex.pro
		http://sohowww.nascom.nasa.gov/solarsoft/yohkoh/ucon/idl/sxt_co/carr2date.pro
		http://sohowww.nascom.nasa.gov/solarsoft/yohkoh/ucon/idl/hara/carr2btime.pro
*/		
function carrington_to_timestamp(carr){
	//------  Find JD from CR ---------
	var julian = 2398140.227 + 27.2752316 * carr;//27.27522957
	
	var radeg = 180./ Math.PI;
	
	var m = (281.96 + 26.882476 * carr) / radeg;
	var corr = 0.1454 * Math.sin(m) - 0.0085 * Math.sin(2 * m) - 0.0141 * Math.cos(2 * m);
	
	var res = (julian + corr);

	//Convert Julian Day to current DateTime
	var date = res.Julian2Date();
	
	return date;
}

/*function timestamp_to_carrington( timestamp ){
	
	timestamp = timestamp / 1000;
	
	var j_fabio = timestamp / 86400 + 2440587.5;

	var carrington = (1. / 27.2753) * (j_fabio - 2398167.0) + 1.0;
	
	return carrington;
}


function carrington_to_timestamp( carrington ){
	
	var j_fabio = carrington;
	j_fabio = 27.2753 * j_fabio;
	j_fabio = j_fabio + 2398167;

	var timestamp = Math.round( (j_fabio - 2440587.5) * 86400 );

	return timestamp * 1000;
}*/


function get_carringtons_between_timestamps( start, end ){
	var carringtons = [];
	
	var startCarrington = timestamp_to_carrington( start );
	var endCarrington = timestamp_to_carrington( end );

	for(var i = Math.floor( startCarrington ); i <= Math.ceil( endCarrington ); i++){
		if(i >= startCarrington && i <= endCarrington){
			carringtons.push( i );
		}
	}
	
	return carringtons;
}


function carringtons_to_timestamps(carringtons){
	var timestamps = [];
	
	if(carringtons.length > 0){
		carringtons.forEach(function( c ){
			var dt = carrington_to_timestamp(c);
			timestamps.push( dt.getTime() );
		});
	}
	
	return timestamps;
}



// Formatting of timestamps to remove excessive .000z
function formatLyrDateString(tmpLayerDateStr) {

   let frmtTmpDateStr= tmpLayerDateStr.replace(' ', 'T').replace(/\//g, '-').replace(/.000Z/g, '') + '.000Z';

   return frmtTmpDateStr;

}

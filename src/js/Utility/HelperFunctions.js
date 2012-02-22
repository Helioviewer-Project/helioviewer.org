/**
 * @fileOverview Various helper functions used throughout Helioviewer.
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
        throw "Invalid UTC date string";
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
 * @param {String} The layer identifier as an underscore-concatenated string
 * 
 * @returns {Object} A simple JavaScript object representing the layer parameters
 */
var parseLayerString = function (str) {
    var params = str.split(",");
    return {
        observatory : params[0],
        instrument  : params[1],
        detector    : params[2],
        measurement : params[3],
        visible     : Boolean(parseInt(params[4], 10)),
        opacity     : parseInt(params[5], 10),
        server      : parseInt(params[6], 10) || 0
    };
};


/**
 * Maps iPhone/Android touch events to normal mouse events so that dragging, etc can be done.
 * 
 * @see http://ross.posterous.com/2008/08/19/iphone-touch-events-in-javascript/
 */
function touchHandler(event)
{
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
    default:
        return;
    }
    
    simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY,
                                  first.clientX, first.clientY, false, false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

/**
 * Maps the touch handler events to mouse events for a given element using the touchHandler event listener above
 * 
 * @param element HTML element to assign events to
 * 
 * @return void
 */
function assignTouchHandlers(element) {
    if (!element.addEventListener) {
        return; // IE 8 and under
    }
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);    
}

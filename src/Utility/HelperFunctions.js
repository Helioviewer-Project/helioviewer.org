/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO: Move helper functions to a separate namespcae? (e.g. $hv)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global console, $, navigator, Storage,  */
"use strict";
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

/**
 * @description Log to jGrowl if Firebug console is not available
 */
//if (typeof(console) === "undefined") {
//    //console = new Object();
//    console = {};
//    
//    // console.log
//    console.log = function (msg) {
//        $.jGrowl(msg, { header: '[DEBUG] ' });
//    };
//    
//    // console.dir
//    console.dir = function (obj) {
//        var i, str = "";
//        
//        for (i in obj) {
//            // appease JSLint
//            if (true) {
//                str += "<b>" + typeof(i) + "</b>( " + i.toString() + ") " + i + "<br>";
//            }
//        }
//            
//        $.jGrowl(str, { header: '[DEBUG] ' });
//    };
//}

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
 * 
 * @see Viewport.getRSun
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
 * Takes in a time difference in seconds and converts it to 'fuzzy' time, namely 
 * "5 minutes ago" or "3 days ago"
 * 
 * @input {int} timeDiff -- Difference in time between two values in seconds
 */
var toFuzzyTime = function (timeDiff) {
    // Since it's flooring values, any number under 2 minutes (120 seconds) 
    // should come up as "1 minute ago" rather than "1 minutes ago"
    if (timeDiff <= 119) {
        return "1 minute ago";
    
    } else if (timeDiff <= 3600) {
        return Math.floor(timeDiff / 60) + " minutes ago";
    
    } else if (timeDiff <= 7199) {
        // Same as above, any number under 2 hours (7200 seconds)
        // should come up as "1 hour ago" rather than "1 hours ago"
        return "1 hour ago";
    
    } else if (timeDiff <= 86400) {
        return Math.floor(timeDiff / 3600) + " hours ago";
    
    } else if (timeDiff <= 172799) {
        // Same as above, any number under 2 days (172800 seconds)
        // should come up as "1 day ago" rather than "1 days ago"
        return "1 day ago";
    
    } else {
        return Math.floor(timeDiff / 86400) + " days ago";
    }    
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
 * Takes in a container and adds an event listener so that when the
 * container is hovered over, its icon will highlight too, and when 
 * done hovering, the icon goes back to normal. Necessary for some of
 * the movie/screenshot dialog box icons, which do not seem to highlight
 * correctly otherwise.
 * 
 * @input {Object} container -- jQuery-selected html element that contains 
 *                              the icon.
 *                              
 * @return void
 */
var addIconHoverEventListener = function (container) {
    if (container) {
        container.hover(
            function () {
                var icon = container.find(".ui-icon");
                icon.addClass("ui-icon-hover");
            },
            function () {
                var icon = container.find(".ui-icon");
                icon.removeClass("ui-icon-hover");
            }
        );
    }
};


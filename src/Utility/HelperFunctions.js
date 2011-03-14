/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO: Move helper functions to a separate namespcae? (e.g. $hv)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: false, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true, console: true */
/*global window, console, $, navigator, Storage, hideZoomControls, showZoomControls */
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
 * Takes in a time difference in seconds and converts it to elapsed time, e.g. "5 minutes ago" or "3 days ago"
 */
Date.prototype.getElapsedTime = function () {
    // Elapsed time in seconds
    var diff = (new Date().getTime() - this.getTime()) / 1000;
    
    if (diff <= 60) {
        return Math.ceil(diff) + " seconds";
    } else if (diff <= 119) {
        // Since it's flooring values, any number under 2 minutes (120 seconds) 
        // should come up as "1 minute ago" rather than "1 minutes ago"
        return "1 minute";
    } else if (diff <= 3600) {
        return Math.floor(diff / 60) + " minutes";
    } else if (diff <= 7199) {
        // Same as above, any number under 2 hours (7200 seconds)
        // should come up as "1 hour ago" rather than "1 hours ago"
        return "1 hour";
    } else if (diff <= 86400) {
        return Math.floor(diff / 3600) + " hours";
    } else if (diff <= 172799) {
        // Same as above, any number under 2 days (172800 seconds)
        // should come up as "1 day ago" rather than "1 days ago"
        return "1 day";
    } else {
        return Math.floor(diff / 86400) + " days";
    }    
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
    return new Date(Date.UTC(
        s.substring(0, 4), parseInt(s.substring(5, 7), 10) - 1, s.substring(8, 10),
        s.substring(11, 13), s.substring(14, 16), s.substring(17, 19) 
    ));
};

/**
 * Normalizes behavior for Date.toISOString
 * 
 * Browsers with native support for toISOString return a quoted date string, whereas other browsers
 * return unquoted date string.
 * 
 * @see http://code.google.com/p/datejs/issues/detail?id=54
 * 
 */
var toISOString = Date.prototype.toISOString;
Date.prototype.toISOString = function () {
    return toISOString.call(this).replace(/"/g, '');
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

/**
 * @description Log to jGrowl if Firebug console is not available
 */
//if (typeof(console) === "undefined") {
//    //console = new Object();
//    console = {};
//    
//    // console.log
//    console.log = function (msg) {
//        $("#message-console").jGrowl(msg, { header: '[DEBUG] ' });
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
//        $("#message-console").jGrowl(str, { header: '[DEBUG] ' });
//    };
//}
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
 * Converts tile coordinates into arcseconds. Finds relative tile size (if you enlarged or shrunk the tile
 * so that the image in the tile is at the same resolution as the jp2 image) and uses that to calculate
 * pixels, then arcseconds. 
 * 
 * Since x and y are with respect to the center of the image and we want arcseconds 
 * to be the same, we do not need to do any adjusting. 
 * 
 * A tile at (0,0) has its top left corner in the exact center of the jp2 image, so its heliocentric 
 * pixel coordinates would be 0*relativeTileSize, or 0,0 as well. A tile at (-1,-1) is one tile up and to
 * the left of the (0,0) tile, so its heliocentric pixel coordinates would be calculated as
 * -1*relativeTileSize, and so on.
 * 
 * Pixels are adjusted by the solar center offset to make sure that multiple layers are aligned correctly.
 * Finally, pixel coordinates are multiplied by the scale of the jp2 image (arcseconds per pixel) to get the
 * measurement in arcseconds. 
 * 
 * @input {int}   x        tile x-coordinate
 * @input {int}   y        tile y-coordinate
 * @input {float} scale    scale of the image in the viewport
 * @input {float} jp2Scale scale of the jp2 image on disk
 * @input {int}   tileSize desired size of the tile (usually 512px)
 * @input {float} offsetX  x-offset of the sun's center from the center of the jp2 image
 * @input {float} offsetY  y-offset of the sun's center from the center of the jp2 image
 */
var tileCoordinatesToArcseconds = function (x, y, scale, jp2Scale, tileSize, offsetX, offsetY) {
    var relativeTileSize, top, left, bottom, right;
    relativeTileSize = tileSize * scale / jp2Scale;

    top  = y * relativeTileSize - offsetY;
    left = x * relativeTileSize - offsetX;
    bottom = top  + relativeTileSize;
    right  = left + relativeTileSize;

    return {
        y1 : top  * jp2Scale,
        x1 : left * jp2Scale,
        y2 : bottom * jp2Scale,
        x2 : right  * jp2Scale
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

/**
 * Helper function to hide all buttons that exist in the viewport.
 * hideZoomControls is in ZoomControls.js
 */
var hideButtonsInViewport = function () {
    hideZoomControls();
    $("#social-buttons").hide("fast");
    $("#center-button").hide("fast");
    $("#fullscreen-btn").hide("fast");
};

/**
 * Helper function to show all buttons that exist inside the viewport.
 * showZoomControls is in ZoomControls.js
 */
var showButtonsInViewport = function () {
    showZoomControls();
    $("#social-buttons").show("fast");
    $("#center-button").show("fast");
    $("#fullscreen-btn").show("fast");
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
 * RFC 4122, section 4.4 UUID Generation
 * @see http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * 
 * @return A unique identifier
 */
function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var uuid, i, s = [],
        hexDigits = "0123456789ABCDEF";
    
    for (i = 0; i < 32; i += 1) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    uuid = s.join("");
    return uuid;
}

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

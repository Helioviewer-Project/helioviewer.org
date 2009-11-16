/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global navigator */


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
 * @description Takes a localized javascript date and returns a date set to the UTC time.
 * 
 * NOTE (11/03/2009) Sign for numsecs below should be reversed?
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
 * @description Allows JSON objects to be stored in Storage for browsers that have support for native JSON
 * http://hacks.mozilla.org/2009/06/localstorage/
 */
var extendLocalStorage = function () {
    Storage.prototype.setObject = function(key, value) {
        this.setItem(key, JSON.stringify(value));
    }
     
    Storage.prototype.getObject = function(key) {
        return JSON.parse(this.getItem(key));
    }    
};


/**
 * @description Converts a ISO 8601 UTC formatted date string into a (UTC) Unix timestamp
 *  e.g. "2003-10-05T00:00:00Z" => 1065312000000
 */
var getUTCTimestamp = function(date) {
    var year, month, day, hours, minutes, seconds, ms;
    
    year    = parseInt(date.substr(0,4), 10);
    month   = parseInt(date.substr(5,2), 10) - 1;
    day     = parseInt(date.substr(8,2), 10);
    hours   = parseInt(date.substr(11,2), 10);
    minutes = parseInt(date.substr(14,2), 10);
    seconds = parseInt(date.substr(17,2), 10);
    ms = 0;

    return Date.UTC(year,month,day,hours,minutes,seconds,ms);
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

/**
 * @description Log to jGrowl if Firebug console is not available
 */
if (typeof(console) === "undefined") {
    console = new Object();
    
    // console.log
    console.log = function (msg) {
        $.jGrowl(msg, { header: '[DEBUG] ' });
    };
    
    // console.dir
    console.dir = function (obj) {
        var str = "";
        
        for (i in obj)
            str += "<b>" + typeof(i) + "</b>( " + i.toString() + ") " + i + "<br>";
            
        $.jGrowl(str, { header: '[DEBUG] ' });
    };
}

/**
 * @description Checks to see if a given variable is a numeric type
 * Source: Prototype's isNumber method
 */
$.isNumber = function (x) {
    return Object.prototype.toString.call(x) == "[object Number]";
};

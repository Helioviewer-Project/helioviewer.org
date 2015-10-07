/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview This class handles the creation and validation of basic configuration parameters
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var Config = Class.extend(
    /** @lends Config.prototype */
    {
    /**
     * @description Creates a new Config.
     * @constructs
     */
    init: function (params) {
        this.params = params;

        this.bools  = ["disable_cache"];
        this.ints   = ["build_num", "default_timestep", "prefetch_size", "max_movie_frames",
                       "max_tile_layers"];
        this.floats = ["default_image_scale", "min_image_scale", "max_image_scale"];

        this.fixTypes();
    },

    /**
     * @description Fix types of configuration parameters
     */
    fixTypes: function () {
        var param, self = this;

        // Booleans
        $.each(this.bools, function () {
            param = self.params[this].toLowerCase();

            if ((param === "true") || (param === "1")) {
                self.params[this] = true;
            }
            else {
                self.params[this] = false;
            }
        });

        // Integers
        $.each(this.ints, function () {
            self.params[this] = parseInt(self.params[this], 10);
        });

        // Floats
        $.each(this.floats, function () {
            self.params[this] = parseFloat(self.params[this]);
        });
    },

    /**
     * @description Returns the configuration parameters as an associative array
     */
    toArray: function () {
        return {
            'version'             : this.params["build_num"],
            'defaultImageScale'   : this.params["default_image_scale"],
            'minImageScale'       : this.params["min_image_scale"],
            'maxImageScale'       : this.params["max_image_scale"],
            'maxTileLayers'       : this.params["max_tile_layers"],
            'prefetchSize'        : this.params["prefetch_size"],
            'timeIncrementSecs'   : this.params["default_timestep"],
            'backEnd'             : this.params["back_end"],
            'newsURL'             : this.params["news_url"],
            'rootURL'             : this.params["web_root_url"],
            'videoFeed'           : this.params["user_video_feed"],
            'contactEmail'        : this.params["contact_email"],
            'staticAssetUrl'      : this.params["static_asset_url"],
            'apiURL'              : this.params["back_end"]
        };
    }
});
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

    for (var i=0; i<params.length-2; i++) {
        uiLabels[i] = { 'label' : '',
                        'name'  : params[i] };
    }

    return {
        uiLabels    : uiLabels,
        visible     : params[params.length-2],
        opacity     : params[params.length-1]
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
/**
 * @fileOverview "Abstract" Layer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class */
"use strict";
var Layer = Class.extend(
    /** @lends Layer.prototype */
    {
    visible: true,

    /**
     * @constructs
     * @description Creates a new Layer
     * @param {Object} viewport Viewport to place the layer in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *        <b>visible</b> - The default layer visibility<br>
     * </div>
     */
    init: function () {
        this.dimensions = {
            "left"  : 0,
            "top"   : 0,
            "bottom": 0,
            "right" : 0
        };
    },

    /**
     * @description Sets the Layer's visibility
     * @param {Boolean} visible Hide/Show layer
     * @returns {Boolean} Returns new setting
     */
    setVisibility: function (visible) {
        this.visible = visible;
        if (visible) {
            this.domNode.show();
        }
        else {
            this.domNode.hide();
        }

        $(document).trigger('update-external-datasource-integration');
        return this.visible;
    },

    /**
     * @description Toggle layer visibility
     */
    toggleVisibility: function () {
        return this.setVisibility(!this.visible);
    }
});
/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp */
"use strict";
var TileLoader = Class.extend( 
    /** @lends TileLayer.prototype */
    {    
    /**
     * @constructs
     * @description Creates a new TileLoader
     */
    init: function (domNode, tileSize, tileVisibilityRange) {
        this.domNode       = domNode;
        this.tileSize      = tileSize;
        this.loadedTiles   = {};
        this.width         = 0;
        this.height        = 0;
        this.tileVisibilityRange  = tileVisibilityRange;
    },

    /**
     * 
     */
    updateTileVisibilityRange: function (range, tilesLoaded) {
        this.tileVisibilityRange = range;

        if (tilesLoaded) {
            return this._checkTiles();
        }
    },
    
    setTileVisibilityRange: function (range) {
        this.tileVisibilityRange = range;
    },
    
    updateDimensions: function (width, height) {
        this.width  = width;
        this.height = height;
    },
    
    /**
     * @description Determines the boundaries for the valid tile range
     * @return {Array} An array containing the tile boundaries
     */
    getValidTileRange: function () {
        var numTilesX, numTilesY, boundaries, ts = this.tileSize;

        // Number of tiles for the entire image
        numTilesX = Math.max(2, Math.ceil(this.width  / ts));
        numTilesY = Math.max(2, Math.ceil(this.height  / ts));
        
        // Tile placement architecture expects an even number of tiles along each dimension
        if ((numTilesX % 2) !== 0) {
            numTilesX += 1;
        }

        if ((numTilesY % 2) !== 0) {
            numTilesY += 1;
        }

        // boundaries for tile range
        boundaries = {
            xStart: - (numTilesX / 2),
            xEnd  :   (numTilesX / 2) - 1,
            yStart: - (numTilesY / 2),
            yEnd  :   (numTilesY / 2) - 1
        };

        return boundaries;
    },
    
    /**
     * 
     */
    _checkTiles: function () {
        var i, j;

        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (!this.loadedTiles[i]) {
                    this.loadedTiles[i] = {};
                }
                if (!this.validTiles) {
                    this.validTiles = {};
                }
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }
                if (!this.loadedTiles[i][j] && this.validTiles[i][j]) {
                    this.loadedTiles[i][j] = true;
                    $(this.domNode).trigger('get-tile', [i, j]);
                }
            }
        }
    },
    
    /**
     * @description Creates an array of tile dom-nodes
     * @return {Array} An array containing pointers to all of the tiles currently loaded
     */
    getTileArray: function () {
        var tiles = [];
        
        this.domNode.children().each(function () {
            tiles.push(this);
        });
        
        return tiles;
    },
    
    /**
     * @description reloads displayed tiles
     * @param {Boolean} removeOldTilesFirst Whether old tiles should be removed before or after new ones are loaded.
     */
    reloadTiles: function (removeOldTilesFirst) {
        var i, j, numTiles = 0, numTilesLoaded = 0, tile, onLoadComplete, self = this;

        this.removeOldTilesFirst = removeOldTilesFirst;
        this.numTilesLoaded      = 0;
        this.loadedTiles         = {};
        this.computeValidTiles();
        
        this.oldTiles = this.getTileArray();

        // When zooming, remove old tiles right away to avoid visual glitches
        if (removeOldTilesFirst) {
            this.removeTileDomNodes(this.oldTiles);
        }
        this.numTiles = 0;
        
        // Load tiles that lie within the current viewport
        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (this.validTiles[i] && this.validTiles[i][j]) {
                    this.numTiles += 1;
                    $(this.domNode).trigger('get-tile', [i, j, $.proxy(this.onTileLoadComplete, this)]);
                                        
                    if (!this.loadedTiles[i]) {
                        this.loadedTiles[i] = {};
                    }
    
                    this.loadedTiles[i][j] = true;
                }
            }
        }        
    },
    
    onTileLoadComplete: function () {
        this.numTilesLoaded += 1;

        // After all tiles have loaded, stop indicator (and remove old-tiles if haven't already)
        if (this.numTilesLoaded === this.numTiles) {
            if (!this.removeOldTilesFirst) {
                this.removeTileDomNodes(this.oldTiles);
            }
        }
    },
    
    /**
     * @description remove tile dom-nodes
     */
    removeTileDomNodes: function (tileArray) {
        $.each(tileArray, function () {
            if (this.parentNode) {
                $(this).remove();
            }
        });
    },
    
    /**
     * @description Creates a 2d array representing the range of valid (potentially data-containing) tiles
     */
    computeValidTiles: function () {
        var i, j, indices;
        
        indices = this.getValidTileRange();
     
        // Reset array
        this.validTiles = {};
        
        // Update validTiles array
        for (i = indices.xStart; i <= indices.xEnd; i += 1) {
            for (j = indices.yStart; j <= indices.yEnd; j += 1) {
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }
                this.validTiles[i][j] = true;
            }
        }        
    }
});
/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 * TODO 2011/01/09: Add check for zero-dimension tile requests
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLoader */
"use strict";
var TileLayer = Layer.extend(
    /** @lends TileLayer.prototype */
    {
    /**
     * @description Default TileLayer options
     */
    defaultOptions: {
        type        : 'TileLayer',
        opacity     : 100,
        sharpen     : false
    },

    /**
     * @constructs
     * @description Creates a new TileLayer
     */
    init: function (index, date, tileSize, viewportScale, tileVisibilityRange, name, visible, opacity) {
        $.extend(this, this.defaultOptions);
        this._super();

        this.loaded = false;

        this._requestDate = date;
        this.domNode = $('<div class="tile-layer-container" />').appendTo("#moving-container");

        this.viewportScale = viewportScale;

        this.tileSize      = tileSize;
        this.visible       = visible;
        this.opacity       = opacity;
        this.name          = name;
    },

    updateTileVisibilityRange: function (range) {
        this.tileLoader.updateTileVisibilityRange(range, this.loaded);
    },

    /**
     *
     */
    updateImageScale: function (scale, tileVisibilityRange) {
        this.viewportScale = scale;
        this._updateDimensions();

        this.tileLoader.setTileVisibilityRange(tileVisibilityRange);

        if (this.visible) {
            this.tileLoader.reloadTiles(true);
        }
    },

    /**
     * Handles time changes
     */
    updateRequestTime: function (date) {
        this.image.updateTime(date);
    },

    /**
     * @description Returns a stringified version of the tile layer for use in URLs, etc
     * @return string String representation of the tile layer
     */
    serialize: function () {
        return this.image.getLayerName() + "," + (this.visible ? this.layeringOrder : "0") + "," + this.opacity;
    },

    toggleVisibility: function (event, id) {
        if (this.id === id) {
            this._super();
            $(document).trigger("save-tile-layers");
        }
    },

    /**
     * Computes layer parameters relative to the current viewport image scale
     *
     * Center offset:
     *   The values for offsetX and offsetY reflect the x and y coordinates with the origin
     *   at the bottom-left corner of the image, not the top-left corner.
     */
    _updateDimensions: function () {
        var scaleFactor, offsetX, offsetY;

        // Ratio of original JP2 image scale to the viewport/desired image scale
        scaleFactor = this.image.scale / this.viewportScale;

        this.width  = this.image.width  * scaleFactor;
        this.height = this.image.height * scaleFactor;

        // Use Math.floor to avoid unnecessary tile requests when the computed
        // dimensions are something like 2048.32
        this.tileLoader.updateDimensions(Math.floor(this.width),
                                         Math.floor(this.height));

        // Offset image
        offsetX = parseFloat((this.image.offsetX * scaleFactor).toPrecision(8));
        offsetY = parseFloat((this.image.offsetY * scaleFactor).toPrecision(8));

        // Update layer dimensions
        this.dimensions = {
            "left"   : Math.max(this.width  / 2, (this.width  / 2) - offsetX),
            "top"    : Math.max(this.height / 2, (this.height / 2) - offsetY),
            "bottom" : Math.max(this.height / 2, (this.height / 2) + offsetY),
            "right"  : Math.max(this.width  / 2, (this.width  / 2) + offsetX)
        };

        // Center of the tile layer
        this.domNode.css({
            "left": - offsetX,
            "top" : - offsetY
        });
    },

    /**
     *
     */
    onLoadImage: function () {
        this.loaded = true;
        this._updateDimensions();

        this.tileLoader.reloadTiles(false);

        // Update viewport sandbox if necessary
        $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
    },

    /**
     * @description Returns an array container the values of the positions for each edge of the TileLayer.
     */
    getDimensions: function () {
        return this.dimensions;
    },

    /**
     * @description Update the tile layer's opacity
     * @param {int} Percent opacity to use
     */
    setOpacity: function (opacity) {
        this.opacity = opacity;

        // IE
        if (!$.support.opacity) {
            $(this.domNode).find(".tile").each(function () {
                $(this).css("opacity", opacity / 100);
            });
        }
        // Everyone else
        else {
            $(this.domNode).css("opacity", opacity / 100);
        }
    },

    /**
     * Reloads tiles if visibility is being set to true.
     * This method is almost identical to onLoadImage, except that reloadTiles
     * needs to be called with true instead of false.
     */
    setVisibility: function (visible) {
        this._super(visible);
        if (visible) {
            this._updateDimensions();
            this.tileLoader.reloadTiles(true);

            // Update viewport sandbox if necessary
            $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
        }
    },

    /**
     * @description Sets up image properties that are not dependent on the specific image,
     * but only on the type (source) of the image.
     *
     * IE7: Want z-indices < 1 to ensure event icon visibility
     */
    _loadStaticProperties: function () {
        this.domNode.css("z-index", parseInt(this.layeringOrder, 10) - 10);

        // opacity
        if (this.opacity !== 100) {
            this.setOpacity(this.opacity);
        }

        // visibility
        if (!this.visible) {
            this.setVisibility(false);
        }
    },

    /**
     * @description Toggle image sharpening
     */
    toggleSharpening: function () {
        if (this.sharpen === true) {

        } else {
            //$(this.domNode.childElements());
            //$("img.tile[src!=resources/images/transparent_512.gif]").pixastic("sharpen", {amount: 0.35});
        }
        this.sharpen = !this.sharpen;
    },

    /**
     * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
     * @param {Int} x Tile X-coordinate
     * @param {Int} y Tile Y-coordinate
     * @param {Function} onTileLoadComplete -- callback function to this.tileLoader.onTileLoadComplete
     * @returns {String} URL to retrieve the requested tile
     *
     * IE: CSS opacities do not behave properly with absolutely positioned elements. Opacity is therefor
     * set at tile-level.
     */
    getTile: function (event, x, y, onTileLoadComplete) {
        var top, left, ts, img, rf, emptyTile;

        left = x * this.tileSize;
        top  = y * this.tileSize;
        ts   = this.tileSize;

        emptyTile = 'resources/images/transparent_' + ts + '.gif';

        //img = $('<img class="tile" style="left:' + left + 'px; top:' + top + 'px;"></img>');
        img = this.setImageProperties();

        img = $(img).addClass("tile").css({"left": left, "top": top}).attr("alt", "");

        // IE (can only adjust opacity at the image level)
        if (!$.support.opacity) {
            img.css("opacity", this.opacity / 100);
        }

        // Load tile
        img.error(function (e) {
            img.unbind("error");
            $(this).attr("src", emptyTile);
        }).load(function () {
            $(this).width(512).height(512); // Wait until image is done loading specify dimensions in order to prevent
                                            // Firefox from displaying place-holders
        }).attr("src", this.getTileURL(x, y));

        //      Makes sure all of the images have finished downloading before swapping them in
        img.appendTo(this.domNode);
        if (onTileLoadComplete) {
            img.load(onTileLoadComplete);
        }
    },

    /**
     * Sets event handlers and properties of the image
     */
    setImageProperties: function () {
        var img, rf;

        rf = function () {
            return false;
        };

        img = new Image();

        img.unselectable = 'on';

        img.onmousedown   = rf;
        img.ondrag        = rf;
        img.onmouseover   = rf;
        img.oncontextmenu = rf;
        img.onselectstart = rf;
        img.galleryimg    = 'no';

        return img;
    }
});
/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLayer,
    TileLoader, tileCoordinatesToArcseconds, Helioviewer */
"use strict";
var HelioviewerTileLayer = TileLayer.extend(
    /** @lends HelioviewerTileLayer.prototype */
    {
    /**
     * @constructs
     * @description Creates a new TileLayer
     * @param {Object} viewport Viewport to place the tiles in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *      <b>type</b>        - The type of the layer (used by layer manager to differentiate event vs.
     *                           tile layers)<br>
     *      <b>tileSize</b>    - Tilesize to use<br>
     *      <b>source</b>      - Tile source ["database" | "filesystem"]<br>
     *      <b>opacity</b>     - Default opacity<br>
     * </div>
     */
    init: function (index, date, tileSize, viewportScale, tileVisibilityRange,
        hierarchy, sourceId, name, visible, opacity) {

        this._super(index, date, tileSize, viewportScale, tileVisibilityRange,
            name, visible, opacity);

        // Create a random id which can be used to link tile layer with its corresponding tile layer accordion entry
        this.id = "tile-layer-" + new Date().getTime();

        this._setupEventHandlers();

        $(document).trigger("create-tile-layer-accordion-entry",
            [index, this.id, name, sourceId, hierarchy, date, true, opacity, visible,
             $.proxy(this.setOpacity, this)
            ]
        );

        this.tileLoader = new TileLoader(this.domNode, tileSize, tileVisibilityRange);

        this.image = new JP2Image(hierarchy, sourceId, date,
            $.proxy(this.onLoadImage, this));
    },

    /**
     * onLoadImage
     */
    onLoadImage: function () {
        this.loaded = true;
        this.layeringOrder = this.image.layeringOrder;

        this._loadStaticProperties();
        this._updateDimensions();

        if (this.visible) {
            this.tileLoader.reloadTiles(false);

            // Update viewport sandbox if necessary
            $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
        }

        $(document).trigger("update-tile-layer-accordion-entry",
                            [this.id, this.name, this.image.getSourceId(),
                             this.opacity,
                             new Date(getUTCTimestamp(this.image.date)),
                             this.image.id, this.image.hierarchy]);
    },

    /**
     * Returns a formatted string representing a query for a single tile
     */
    getTileURL: function (x, y) {
        var params = {
            "action"      : "getTile",
            "id"          : this.image.id,
            "imageScale"  : this.viewportScale,
            "x"           : x,
            "y"           : y
        };

        return Helioviewer.api + "?" + $.param(params);
    },

    /**
     * @description Returns a JSON representation of the tile layer for use by the UserSettings manager
     * @return JSON A JSON representation of the tile layer
     */
    toJSON: function () {
        var return_array = {};

        return_array['uiLabels'] = Array();
        $.each( this.image.hierarchy, function(uiOrder, obj) {
            return_array['uiLabels'][uiOrder] = { 'label': obj['label'],
                                                  'name' : obj['name'] };
            return_array[obj['label']] = obj['name'];
        });

        return_array['visible']  = this.visible;
        return_array['opacity']  = this.opacity;

        return return_array;
    },

    /**
     * @description Sets up event-handlers to deal with viewport motion
     */
    _setupEventHandlers: function () {
        $(this.domNode).bind('get-tile', $.proxy(this.getTile, this));
        $(document).bind('toggle-layer-visibility', $.proxy(this.toggleVisibility, this));
    }
});
/**
 * @fileOverview
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class */
"use strict";
var KeyboardManager = Class.extend(
/** @lends KeyboardManager.prototype */
{
    /**
     * @constructs
     */
    init: function () {
        this._initEventHandlers();
        $(document).bind('re-enable-keyboard-shortcuts', $.proxy(this._initEventHandlers, this));
    },


    /**
     * @description Initialize keyboard-related event handlers.
     *
     * TODO: use events or public method instead of zoomControl's (private) method.
     *
     * TODO (2009/07/29): Webkit doesn't support keypress events for non alphanumeric
     * keys (http://ejohn.org/blog/keypress-in-safari-31/).
     *
     * Instead of using keypress, it may be better to use keydown and a boolean to decide
     * when vp is moving and when it should be stationary.
     *
     * Simple implementation:
     *     vp.movingUp (Boolean), vp.movingDown (Boolean), vp.movingLeft (Boolean), vp.movingRight (Boolean)
     *
     * From there it is also simple to add support for diagonal movement, etc.
     */
    _initEventHandlers: function () {
        var key, self = this;

        // Event-handlers
        $(document).keypress(function (e) {
            if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                key = self._getKeyCode(e);
                self.onKeyPress(key);
            }
        });

        // Webkit responds to arrow keys on keydown event
        if ($.browser.webkit) {
            $(document).keydown(function (e) {
                if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                    key = self._getKeyCode(e);

                    if (key === 37 || key === 38 || key === 39 || key === 40) {
                        self.onKeyPress(key);
                    }
                }
            });
        }

        // IE responds to arrow keys on keyup event
        if ($.browser.msie) {
            $(document).keyup(function (e) {
                if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                    key = self._getKeyCode(e);

                    if (key === 37 || key === 38 || key === 39 || key === 40) {
                        self.onKeyPress(key);
                    }
                }
            });
        }
    },

    /**
     * Returns a normalized keycode for the given keypress/keydown event
     */
    _getKeyCode: function (e) {
        var key;

        // Letters use Event.which, while arrows, etc. use Event.keyCode
        if (e.keyCode) {
            key = e.keyCode;
        }
        else if (e.which) {
            key = e.which;
        }

        return key;
    },

    /**
     * @description Sets up keyboard shortcuts
     *
     * Because browsers assign different characters to the arrow keys,
     * the key code is used directly. In all other cases it is more reliable
     * to use the character code.
     *
     * @TODO 01/04/2010: Use something like js-hotkeys (http://code.google.com/p/js-hotkeys/)
     *                   to allow for more advanced keyboard navigation such as "cntl + z" to undo, etc
     */
    onKeyPress: function (key) {
        // Get character pressed (letters, etc)
        var character, keyMapping, charMapping, doc = $(document);

        // Arrow keys
        keyMapping = {
            '37': [-8, 0], // Right-arrow
            '38': [0, -8], // Up-arrow
            '39': [8, 0],  // Left-arrow
            '40': [0, 8]   // Down-arrow
        };

        if (typeof(keyMapping[key]) !== "undefined") {
            doc.trigger('move-viewport', keyMapping[key]);
            return false;
        }

        // All other keys
        charMapping = {
            'c': 'center-viewport',
            'd': 'toggle-event-labels',
            'm': 'toggle-mouse-coords',
            '-': 'zoom-out',
            '_': 'zoom-out',
            '=': 'zoom-in',
            '+': 'zoom-in',
            'f': 'toggle-fullscreen',
            ',': 'timestep-backward',
            '<': 'timestep-backward',
            '.': 'timestep-forward',
            '>': 'timestep-forward'
        }

        character = String.fromCharCode(key);

        if (typeof(charMapping[character]) !== "undefined") {
            doc.trigger(charMapping[character]);
        }
    }
});
/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var LayerManager = Class.extend(
    /** @lends LayerManager.prototype */
    {
    /**
     * @constructs
     * @description Creates a new LayerManager
     */
    init: function () {
        this._layers    = [];
        this._maxLayerDimensions = {width: 0, height: 0};
    },

    /**
     * @description Add a new layer
     */
    addLayer: function (layer) {
        this._layers.push(layer);
    },
   
    /**
     * @description Gets the number of layers currently loaded 
     * @return {Integer} Number of layers present.
     */
    size: function () {
        return this._layers.length;
    },
    
    /**
     * Returns the index of the given layer if it exists, and -1 otherwise
     */
    indexOf: function (id) {
        var index = -1;
        
        $.each(this._layers, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });
        
        return index;
    },
    
    /**
     * Updates the stored maximum dimensions. If the specified dimensions for updated are {0,0}, e.g. after
     * a layer is removed, then all layers will be checked
     */
    updateMaxDimensions: function (event) {
        var type = event.type.split("-")[0];
        this.refreshMaxDimensions(type);
        
        $(document).trigger("viewport-max-dimensions-updated");
    },
    
    /**
     * Rechecks maximum dimensions after a layer is removed
     */
    refreshMaxDimensions: function (type) {
        var maxLeft   = 0,
	        maxTop    = 0,
	        maxBottom = 0,
	        maxRight  = 0,
	        old       = this._maxLayerDimensions;

        $.each(this._layers, function () {
            var d = this.getDimensions();

            maxLeft   = Math.max(maxLeft, d.left);
            maxTop    = Math.max(maxTop, d.top);
            maxBottom = Math.max(maxBottom, d.bottom);
            maxRight  = Math.max(maxRight, d.right);

        });
        
        this._maxLayerDimensions = {width: maxLeft + maxRight, height: maxTop + maxBottom};

        if ((this._maxLayerDimensions.width !== old.width) || (this._maxLayerDimensions.height !== old.height)) {
            $(document).trigger("layer-max-dimensions-changed", [type, this._maxLayerDimensions]);
        }
    },
    
    /**
     * @description Returns the largest width and height of any layers (does not have to be from same layer)
     * @return {Object} The width and height of the largest layer
     * 
     */
    getMaxDimensions: function () {
        return this._maxLayerDimensions;
    },

    /**
     * @description Removes a layer
     * @param {string} The id of the layer to remove
     */
    removeLayer: function (id) {
        var type  = id.split("-")[0],
            index = this.indexOf(id), 
            layer = this._layers[index];
        
        layer.domNode.remove();
        this._layers = $.grep(this._layers, function (e, i) {
            return (e.id !== layer.id);
        });
        layer = null;
        
        this.refreshMaxDimensions(type);
    },
    
    /**
     * @description Iterates through layers
     */
    each: function (fn) {
        $.each(this._layers, fn);
    },
    
    /**
     * @description Returns a JSON representation of the layers currently being displayed
     */
    toJSON: function () {
        var layers = [];
        
        $.each(this._layers, function () {
            layers.push(this.toJSON());
        });
        
        return layers;       
    }
});
/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 *
 * TODO (12/3/2009): Provide support for cases where solar center isn't the best
 * sandbox-center, e.g. sub-field images.
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, LayerManager, TileLayer, Layer, $ */
"use strict";
var TileLayerManager = LayerManager.extend(
/** @lends TileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (observationDate, dataSources, tileSize, viewportScale,
        maxTileLayers, savedLayers, urlLayers) {

        this._super();

        this.dataSources   = dataSources;
        this.tileSize      = tileSize;
        this.viewportScale = viewportScale;
        this.maxTileLayers = maxTileLayers;

        this.tileVisibilityRange  = {xStart: 0, xEnd: 0, yStart: 0, yEnd: 0};

        this._observationDate = observationDate;

        $(document).bind("tile-layer-finished-loading",
                        $.proxy(this.updateMaxDimensions, this))
                   .bind("save-tile-layers",
                        $.proxy(this.save, this))
                   .bind("add-new-tile-layer",
                        $.proxy(this.addNewLayer, this))
                   .bind("remove-tile-layer",
                        $.proxy(this._onLayerRemove, this))
                   .bind("observation-time-changed",
                        $.proxy(this.updateRequestTime, this));
    },

    /**
     * @description Updates the list of loaded tile layers stored in
     *              cookies
     */
    save: function () {
        Helioviewer.userSettings.set("state.tileLayers", this.toJSON());
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     *
     */
    updateTileVisibilityRange: function (vpCoords) {
        var old, ts, self, vp;
        old = this.tileVisibilityRange;
        // Expand to fit tile increment
        ts = this.tileSize;
        vp = {
            top:    vpCoords.top    - ts - (vpCoords.top    % ts),
            left:   vpCoords.left   - ts - (vpCoords.left   % ts),
            bottom: vpCoords.bottom + ts - (vpCoords.bottom % ts),
            right:  vpCoords.right  + ts - (vpCoords.right  % ts)
        };

        // Indices to display (one subtracted from ends to account for "0th" tiles).
        this.tileVisibilityRange = {
            xStart : vp.left / ts,
            yStart : vp.top  / ts,
            xEnd   : (vp.right  / ts) - 1,
            yEnd   : (vp.bottom / ts) - 1
        };

        self = this;
        if (this.tileVisibilityRange !== old) {
            $.each(this._layers, function () {
                this.updateTileVisibilityRange(self.tileVisibilityRange);
            });
        }
    },

    /**
     *
     */
    adjustImageScale: function (scale) {
        if (this.viewportScale === scale) {
            return;
        }

        this.viewportScale = scale;
        var self = this;

        $.each(this._layers, function () {
            this.updateImageScale(scale, self.tileVisibilityRange);
        });
    },

    /**
     * Determines initial opacity to use for a new layer based on which
     * layers are currently loaded
     */
    /**
     * Sets the opacity for the layer, taking into account layers which overlap
     * one another.
     *
     * @param layeringOrder int  The layer's stacking order
     * @param layerExists   bool Whether or not the layer already exists
     */
    _computeLayerStartingOpacity: function (layeringOrder, layerExists) {
        var counter;

        // If the layer has not been added yet, start counter at 1 instead of 0
        if (layerExists) {
            counter = 0;
        } else {
            counter = 1;
        }


        $.each(this._layers, function () {
            if (this.layeringOrder === layeringOrder) {
                counter += 1;
            }
        });

        return 100 / counter;
    },

    /**
     * Returns a list of the layers which overlap the current viewport ROI
     */
    _getVisibleLayers: function () {

    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, self = this;

        $.each(layers, function (index, params) {
            layer = new TileLayer(index, self._observationDate, self.tileSize, self.viewportScale,
                                  self.tileVisibilityRange, params.nickname, params.visible,
                                  params.opacity, true);

            self.addLayer(layer);
        });
    },

    /**
     * Remove a specified layer
     */
    _onLayerRemove: function (event, id) {
        this.removeLayer(id);
    },

    /**
     * Handles observation time changes
     */
    updateRequestTime: function (event, date) {
        this._observationDate = date;
        $.each(this._layers, function (i, layer) {
            this.updateRequestTime(date);
        });
        $(document).trigger('update-external-datasource-integration');
    },

    getRequestDateAsISOString: function () {
        return this._observationDate.toISOString();
    },

    /**
     * Returns a string representation of the tile layers
     */
    serialize: function () {
        return this._stringify(this._layers);
    },

    /**
     * Creates a string representation of an array of layers
     */
    _stringify: function (layers) {
        var layerString = "";

        // Get a string representation of each layer that overlaps the ROI
        $.each(layers, function () {
            layerString += "[" + this.serialize() + "],";
        });

        // Remove trailing comma and return
        return layerString.slice(0, -1);
    },

    /**
     * Tests all four corners of the visible image area to see if they are
     * within the transparent circle region of LASCO/COR coronagraph images.
     *
     * Uses the distance formula:
     *
     *     d = sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
     *
     * ...to find the distance from the center to each corner, and if that
     * distance is less than the radius, it is inside the circle region.
     *
     * @param {Object} radius -- The radius of the circle region in the image
     * @param {Object} top -- Top coordinate of the selected region
     * @param {Object} left -- Left coordinate of the selected region
     * @param {Object} width -- width of the selected region
     * @param {Object} height -- height of the selected region
     *
     * @return false as soon as it finds a distance outside the radius, or
     * true if it doesn't.
     */
    _insideCircle: function (radius, top, left, bottom, right) {
        var corners, corner, dx2, dy2;

        // Corners of region of interest
        corners = {
            topLeft     : {x: left,  y: top},
            topRight    : {x: right, y: top},
            bottomLeft  : {x: left,  y: bottom},
            bottomRight : {x: right, y: bottom}
        };

        // Check each corner to see if it lies within the circle
        for (corner in corners) {
            // dx^2, dy^2
            dx2 = Math.pow(corners[corner].x, 2);
            dy2 = Math.pow(corners[corner].y, 2);

            // dist = sqrt(dx^2 + dy^2)
            if (Math.sqrt(dx2 + dy2) > radius) {
                return false;
            }
        }

        return true;
    },

    /**
     * Returns a list of layers which are currently visible and overlap the
     * specified region of interest by at least 10px
     *
     * @param array roi Region of interest in pixels
     */
    getVisibleLayers: function(roi) {
        var rsunAS, rsun, radii, layers = [], threshold = 10, self = this;

        // Coronagraph inner circle radii in arc-seconds
        // TODO 2012/04/11: Compute using header info? are hv-tags
        // (rocc_inner, etc) hard-coded or dynamic? Since COR images vary
        // a lot over time, conservative estimate used for now.
        radii = {
            "LASCO C2": 2.415,
            "LASCO C3": 4.62,
            "COR1-A": 1.45,
            "COR2-A": 2.6,
            "COR1-B": 1.45,
            "COR2-B": 2.6
        };

        // Solar radius at 1au (TODO: compute for layer)
        rsunAS = 959.705;

        $.each(this._layers, function (i, layer) {
            // Check visibility
            if (!layer.visible || layer.opacity <= 5) {
                return;
            }
            // Check overlap
            if ((roi.right <= -layer.dimensions.left + threshold) ||
                (roi.bottom <= -layer.dimensions.top + threshold) ||
                (roi.left >= layer.dimensions.right - threshold) ||
                (roi.top >= layer.dimensions.bottom - threshold)) {
                return;
            }

            // Check coronagraph overlap
            if (layer.name in radii) {
                // radius of outer edge of occulting disk in pixels
                rsun = rsunAS * radii[layer.name] / layer.viewportScale;

                if (self._insideCircle(rsun, roi.top, roi.left, roi.bottom, roi.right)) {
                    return;
                }
            }
            layers.push(layer);
        });

        return this._stringify(layers);
    }
});
/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires TileLayerManager
 *
 * TODO (12/3/2009): Provide support for cases where solar center isn't the best
 * sandbox-center, e.g. sub-field images.
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, HelioviewerTileLayer, TileLayerManager, parseLayerString, $ */
"use strict";
var HelioviewerTileLayerManager = TileLayerManager.extend(
/** @lends HelioviewerTileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (observationDate, dataSources, tileSize, viewportScale,
      maxTileLayers, startingLayers, urlLayers) {

        this._super(observationDate, dataSources, tileSize, viewportScale, maxTileLayers, startingLayers, urlLayers);

        // The order in which new layers are added
        this._queue = [ "SDO,AIA,304",
                        "SOHO,LASCO,C2,white-light",
                        "SOHO,LASCO,C3,white-light",
                        "SOHO,MDI,magnetogram",
                        "SOHO,MDI,continuum" ];

        // Handle STEREO separately
        this._stereoAQueue = [ "STEREO_A,SECCHI,EUVI,304",
                               "STEREO_A,SECCHI,COR1,white-light",
                               "STEREO_A,SECCHI,COR2,white-light",
                               "STEREO_A,SECCHI,EUVI,171",
                               "STEREO_A,SECCHI,EUVI,195" ];

        this._stereoBQueue = [ "STEREO_B,SECCHI,EUVI,304",
                               "STEREO_B,SECCHI,COR1,white-light",
                               "STEREO_B,SECCHI,COR2,white-light",
                               "STEREO_B,SECCHI,EUVI,171",
                               "STEREO_B,SECCHI,EUVI,195" ];

        this._loadStartingLayers(startingLayers);

        this._layersLoaded = 0;
        this._finishedLoading = false;

        $(document).bind("viewport-max-dimensions-updated",
                        $.proxy(this._onViewportUpdated, this))
                   .bind("tile-layer-data-source-changed",
                        $.proxy(this._updateDataSource, this));
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, params, opacity, queue, ds,
            queueChoiceIsValid=false, i=0, defaultLayer="SDO,AIA,171",
            self=this;

        // If new layer exceeds the maximum number of layers allowed,
        // display a message to the user
        if (this.size() >= this.maxTileLayers) {
            $(document).trigger(
                "message-console-warn",
                [ "Maximum number of layers reached. Please remove an existing layer before adding a new one." ]
            );
            return;
        }

        // current layers in above form
        currentLayers = new Array();

        $.each(this._layers, function (i,layer) {
            currentLayers.push(layer.image.getLayerName());
        });

        // Remove existing layers from queue
        if (!!currentLayers.length) {
            // STEREO A
            if (currentLayers[0].substr(0, 8) === "STEREO_A") {
                queue = $.grep(this._stereoAQueue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            } else if (currentLayers[0].substr(0, 8) === "STEREO_B") {
                // STEREO B
                queue = $.grep(this._stereoBQueue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            } else {
                // SOHO, SDO, etc
                queue = $.grep(this._queue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            }
        } else {
            queue = this._queue.slice(); // make a copy
        }

        // Pull off the next layer on the queue
        while (!queueChoiceIsValid) {
            next = queue[i] || defaultLayer;
            params = parseLayerString(next + ",1,100");

            if (this.checkDataSource(params.uiLabels)) {
                queueChoiceIsValid = true;
            }
            i += 1;
        }

        ds = this.dataSources;

        $.each( params.uiLabels, function (uiOrder, obj) {
            ds = ds[obj['name']];
        });

        $.extend(params, ds);

        opacity = this._computeLayerStartingOpacity(
                    params.layeringOrder, false);

        // Add the layer
        this.addLayer(
            new HelioviewerTileLayer(this._layers.length,
                    this._observationDate, this.tileSize, this.viewportScale,
                    this.tileVisibilityRange, params.uiLabels,
                    params.sourceId, params.nickname, params.visible,
                    opacity, params.layeringOrder)
        );

        this.save();
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings,
     * or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, basicParams, self = this;

        $.each(layers, function (index, params) {

            basicParams = self.dataSources;
            $.each(params.uiLabels, function (uiOrder, obj) {
                basicParams = basicParams[obj['name']];
            });
            $.extend(params, basicParams);

            layer = new HelioviewerTileLayer(index, self._observationDate,
                self.tileSize, self.viewportScale, self.tileVisibilityRange,
                params.uiLabels, params.sourceId, params.nickname,
                params.visible, params.opacity, params.layeringOrder);

            self.addLayer(layer);
        });
    },

    /**
     * Checks to see if all of the layers have finished loading for the first
     * time, and if so, loads centering information from previous session
     */
    _onViewportUpdated: function () {
        var numLayers = Helioviewer.userSettings.get("state.tileLayers").length;
        this._layersLoaded += 1;

        if (!this._finishedLoading && this._layersLoaded === numLayers) {
            $(document).trigger("load-saved-roi-position");
        }
    },

    /**
     * Updates the data source for a tile layer after the user changes one
     * of its properties
     */
    /**
     * Changes data source and fetches image for new source
     */
    _updateDataSource: function (event, id, hierarchySelected, sourceId, name,
        layeringOrder) {

        var opacity, layer;

        // Find layer that is being acted on
        $.each(this._layers, function () {
            if (this.id === id) {
                layer = this;
            }
        });

        // Update name
        layer.name = name;

        // Update layering order and z-index
        layer.layeringOrder = layeringOrder;
        layer.domNode.css("z-index", parseInt(layer.layeringOrder, 10) - 10);

        // Update associated JPEG 2000 image
        layer.image.updateDataSource(hierarchySelected, sourceId );

        // Update opacity (also triggers save-tile-layers event)
        opacity = this._computeLayerStartingOpacity(layer.layeringOrder, true);
        $("#opacity-slider-track-" + id).slider("value", opacity);
    },

    /**
     * Checks to make sure requested data source exists
     *
     * Note: Once defaults provided by getDataSource are used,
     * this function will no longer be necessary.
     */
    checkDataSource: function (hierarchy) {
        var r = this.dataSources;

        $.each( hierarchy, function (uiOrder, obj) {
            if ( r[obj['name']] == undefined ) {
                return false;
            }
            r = r[obj['name']];
        });

        return true;
    },

    /**
     * @description Generate a string of URIs for use by JHelioviewer
     */
    toURIString: function () {
        var str = "";

        $.each(this._layers, function () {
            str += this.uri + ",";
        });

        // Remove trailing comma
        str = str.slice(0, -1);

        return str;
    }
});
/**
 * @fileOverview JP2 Image class
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var JP2Image = Class.extend(
    /** @lends JP2Image.prototype */
    {

    /**
     * @constructs
     */
    init: function (hierarchy, sourceId, date, onChange) {
        this.hierarchy   = hierarchy;
        this.sourceId    = sourceId;
        this.requestDate = date;
        this._onChange   = onChange;

        this._requestImage();
    },

    /**
     * Loads the closest image in time to that requested
     */
    _requestImage: function () {
        var params, dataType;

        params = {
            action:   'getClosestImage',
            sourceId: this.sourceId,
            date:     this.requestDate.toISOString()
        };
        $.get(Helioviewer.api, params, $.proxy(this._onImageLoad, this), Helioviewer.dataType);
    },

    /**
     * Changes image data source
     */
    updateDataSource: function (hierarchy, sourceId) {
        this.hierarchy = hierarchy;
        this.sourceId  = sourceId;

        this._requestImage();
    },

    /**
     * Updates time and loads closest match
     */
    updateTime: function (requestDate) {
        this.requestDate = requestDate;
        this._requestImage();
    },

    /**
     * Checks to see if image has been changed and calls event-handler passed in during initialization
     * if a new image should be displayed.
     *
     * The values for offsetX and offsetY reflect the x and y coordinates with the origin
     * at the bottom-left corner of the image, not the top-left corner.
     */
    _onImageLoad: function (result) {
        // Only load image if it is different form what is currently displayed
        if (this.id === result.id) {
            return;
        }
        $.extend(this, result);

        // Reference pixel offset at the original JP2 image scale (with respect to top-left origin)
        this.offsetX =   parseFloat((this.refPixelX - (this.width  / 2)).toPrecision(8));
        this.offsetY = - parseFloat((this.refPixelY - (this.height / 2)).toPrecision(8));

        this._onChange();
    },

    getLayerName: function () {
        var layerName = '';
        $.each( this.hierarchy, function (uiOrder, obj) {
            layerName += obj['name'] + ',';
        });
        return layerName.substring(0, layerName.length-1);
    },

    getSourceId: function () {
        return this.sourceId;
    }
});
/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Helioviewer, Class */
"use strict";
var MouseCoordinates = Class.extend(
    /** @lends MouseCoordinates.prototype */
    {
    enabled : true,
    visible : false,

    /**
     * @constructs
     */
    init: function (imageScale, showMouseCoordsWarning) {
        this.imageScale      = imageScale;
        this.warnMouseCoords = showMouseCoordsWarning;

        this.viewportContainer = $('#helioviewer-viewport').parent();
        this.movingContainer   = $("#moving-container");
        this.container         = $('#mouse-coords');
        this.sandbox           = $("#sandbox");

        this.mouseCoords  = "disabled";
        this.mouseCoordsX = $('#mouse-coords-x');
        this.mouseCoordsY = $('#mouse-coords-y');

        this._initEventHandlers();
    },

    _initEventHandlers: function () {
        // $(document).bind('toggle-mouse-coords', $.proxy(this.toggleMouseCoords, this));
    },

    enable: function () {
        this.enabled = true;
    },

    disable: function () {
        this.enabled = false;
    },

    updateImageScale: function (imageScale) {
        this.imageScale = imageScale;
    },

    /**
     * @description Get the mouse-coords relative to top-left of the viewport frame
     * @param {Int} screenx X-dimensions of the user's screen
     * @param {Int} screeny Y-dimensions of the user's screen
     */
    getRelativeCoords: function (screenx, screeny) {
        var offset = this.viewportContainer.offset();

        return {
            x: screenx - offset.left - 1,
            y: screeny - offset.top - 1
        };
    },

    /**
     * Determines which event handler should be used, if any, to display mouse coordinates to the user
     */
    _reassignEventHandlers: function () {
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            $(document).bind('mousemove', $.proxy(this.updateMouseCoords, this));
            //this.movingContainer.bind('mousemove', $.proxy(this.updateMouseCoords, this));

            // TODO: Execute handler once immediately if mouse is over viewport to show new coords
            // Use trigger to fire mouse move event and then check to make sure mouse is within viewport?
        } else {
            $(document).unbind('mousemove', this.updateMouseCoords);
            //this.movingContainer.unbind('mousemove', this.updateMouseCoords);
        }
    },

    /**
     * Checks to see whether a warning message should be displayed to the user
     */
    _checkWarning: function () {
        // Warn once
        if (this.warnMouseCoords === true) {
            var warning = "<b>Note:</b> Mouse coordinates should not be used " +
                          "for operations.";
            $(document).trigger("message-console-log", [warning, {"sticky": false, "life": 1000}]);
            Helioviewer.userSettings.set("notifications.coordinates", false);
            this.warnMouseCoords = false;
        }
    },

    /**
     * updateMouseCoords. Displays cartesian coordinates by default.
     */
    updateMouseCoords: function (event) {
        var cartesian;

        if (!this.enabled) {
            return;
        }

        // Compute coordinates relative to top-left corner of the viewport
        cartesian = this.computeMouseCoords(event.pageX, event.pageY);
        this.mouseCoordsX.html("x: " + cartesian.x + " &prime;&prime;");
        this.mouseCoordsY.html("y: " + cartesian.y + " &prime;&prime;");
    },

    /**
     * @description Computes the scaled mouse coordinates relative to the size and center of the Sun.
     *
     *  Explanation:
     *
     *    X = location of mouse-pointer
     *    V = viewport top-left corner
     *    S = sandbox top-left corner
     *    M = moving container top-let corner
     *
     *  Each of the two-letter abbreviations represents the vector <x,y> going from one
     *  location to the other. See wiki documentation below for more details.
     *
     * @see http://helioviewer.org/wiki/Co-ordinate_System_I
     */
    computeMouseCoords: function (screenX, screenY) {
        var VX, negSV, SV, SM, MX, scale, x, y;

        // Coordinates realtive to viewport top-left corner
        VX = this.getRelativeCoords(screenX, screenY);
        negSV = this.sandbox.position();
        SV = {
            x: -negSV.left,
            y: -negSV.top
        };
        SM = this.movingContainer.position();
        MX = {
            x: VX.x + (SV.x - SM.left),
            y: VX.y + (SV.y - SM.top)
        };

        //scale
        scale = this.imageScale;
        x = Math.round((scale * MX.x));
        y = - Math.round((scale * MX.y));

        // Return scaled coords
        return {
            x: x,
            y: y
        };
    }
});
/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, MouseCoordinates */
"use strict";
var HelioviewerMouseCoordinates = MouseCoordinates.extend(
    /** @lends HelioviewerMouseCoordinates.prototype */
    {
    /**
     * @constructs
     */
    init: function (imageScale, rsun, showMouseCoordsWarning) {
        this.rsun = rsun;
        this._super(imageScale, showMouseCoordsWarning);

        this.buttonPolar     = $('#mouse-polar');
        this.buttonCartesian = $('#mouse-cartesian');

        this._initEventHandlers();
    },

    _initEventHandlers: function () {
        $(document).bind('toggle-mouse-coords', $.proxy(this.toggleMouseCoords, this));
        $(document).bind('polar-mouse-coords', $.proxy(this.polarMouseCoords, this));
        $(document).bind('cartesian-mouse-coords', $.proxy(this.cartesianMouseCoords, this));
    },

    updateImageScale: function (imageScale) {
        this.imageScale = imageScale;
        if ( this.mouseCoords == "arcseconds" ) {
            this.cartesianMouseCoords();
        }
        else if ( this.mouseCoords == "polar" ) {
            this.polarMouseCoords();
        }
    },

    /**
     * @description Toggles mouse-coords visibility
     *
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        // Case 1: Disabled -> Arcseconds
        if (this.mouseCoords === "disabled") {
            this.cartesianMouseCoords();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.polarMouseCoords();
        }

        // Case 3: Polar Coords -> Disabled
        else if (this.mouseCoords === "polar") {
            this.container.hide();
            this.mouseCoords = "disabled";
            this.buttonPolar.removeClass("active");
            this.buttonCartesian.removeClass("active");
        }

        this._checkWarning();
        this._reassignEventHandlers();
    },

    /**
     * @description
     */
    cartesianMouseCoords: function () {

        this.mouseCoords = "arcseconds";
        this.container.show();
        this.buttonCartesian.addClass("active");
        this.buttonPolar.removeClass("active");

        this._checkWarning();
        this._reassignEventHandlers();
    },

    /**
     * @description
     */
    polarMouseCoords: function () {
        this.mouseCoords = "polar";
        this.container.show();
        this.buttonPolar.addClass("active");
        this.buttonCartesian.removeClass("active");

        this._checkWarning();
        this._reassignEventHandlers();
    },

    /**
     * Determines which event handler should be used, if any, to display mouse coordinates to the user
     */
    _reassignEventHandlers: function () {
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.mouseCoords === "polar") {
                this.movingContainer.unbind('mousemove', this.updateMouseCoords);
            }

            this.movingContainer.bind('mousemove', $.proxy(this.updateMouseCoords, this));

            // Execute handler to display mouse coordinates placeholder
            this.movingContainer.trigger("mousemove");
        } else {
            this.movingContainer.unbind('mousemove', this.updateMouseCoords);
        }
    },

    /**
     * updateMouseCoords
     */
    updateMouseCoords: function (event) {
        var cartesian, polar, r, theta;

        if (!this.enabled) {
            return;
        }

        // When mouse-coordinates are first turned on just shows dashes
        if ( typeof(event.pageX) == "undefined") {
            if (this.mouseCoords === "arcseconds") {
                this.showCartesianCoordinates("--", "--");
            } else {
                this.showPolarCoordinates("--", "--");
            }
            return;
        }

        // Compute coordinates relative to top-left corner of the viewport
        cartesian = this.computeMouseCoords(event.pageX, event.pageY);

        // Arc-seconds
        if (this.mouseCoords === "arcseconds") {
            this.showCartesianCoordinates(cartesian.x, cartesian.y);
        } else {
            // Polar coords
            polar = Math.toPolarCoords(cartesian.x, cartesian.y);
            r     = ((polar.r / this.rsun) + "").substring(0, 5);
            theta = Math.round(polar.theta);

            this.showPolarCoordinates(r, theta);
        }
    },

    /**
     * Displays cartesian coordinates in arc-seconds
     */
    showCartesianCoordinates: function(x, y) {
        this.mouseCoordsX.html("x: " + x + " &prime;&prime;");
        this.mouseCoordsY.html("y: " + y + " &prime;&prime;");
    },

    /**
     * Displays cartesian coordinates in arc-seconds
     */
    showPolarCoordinates: function(r, theta) {
            this.mouseCoordsX.html(r + " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
            this.mouseCoordsY.html(theta + " &#176;");
    }
});
/**
 * @fileOverview Contains the class definition for the Sandbox class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window */
"use strict";
var SandboxHelper = Class.extend(
    /** @lends Sandbox.prototype */
    {
    init: function (x, y) {
        this.domNode = $("#sandbox");
        this.movingContainer = $("#moving-container");
        this.domNode.css({"left": x, "top": y});
    },

    /**
     * Find the center of the sandbox and put the movingContainer there
     */
    center: function () {
        var top, left;
        left = 0.5 * this.domNode.width();
        top  = 0.5 * this.domNode.height();

        this.moveContainerTo(left, top);
    },
        
    /**
     * Find the center of the sandbox
     */
    getCenter: function () {
        return {
            x: 0.5 * this.domNode.width(), 
            y: 0.5 * this.domNode.height()
        };
    },
        
    /**
     * Called when the viewport has moved or resized. Calculates the difference 
     * between current sandbox's size and position and desired sandbox size,
     * and updates the css accordingly. Also repositions the movingContainer.
     */
    updateSandbox: function (viewportCenter, desiredSandboxSize) {
        var change, oldCenter, newCenter, newHCLeft, newHCTop, containerPos;

        oldCenter = this.getCenter();
        
        // Update sandbox dimensions
        this.domNode.css({
            width  : desiredSandboxSize.width  + 'px',
            height : desiredSandboxSize.height + 'px',
            left   : viewportCenter.x - (0.5 * desiredSandboxSize.width) + 'px',
            top    : viewportCenter.y - (0.5 * desiredSandboxSize.height) + 'px'            
        });

        newCenter = this.getCenter();

        // Difference
        change = {
            x: newCenter.x - oldCenter.x,
            y: newCenter.y - oldCenter.y
        };

        if (Math.abs(change.x) < 0.01 && Math.abs(change.y) < 0.01) {
            return;
        }
        containerPos = this.movingContainer.position();

        // Update moving container position
        newHCLeft = Math.max(0, Math.min(desiredSandboxSize.width,  containerPos.left + change.x));
        newHCTop  = Math.max(0, Math.min(desiredSandboxSize.height, containerPos.top  + change.y));
 
        this.moveContainerTo(newHCLeft, newHCTop);
    },
        
    moveContainerTo: function (x, y) {
        this.movingContainer.css({left: x, top: y});
    }
});
/**
 * @fileOverview Contains helper functions for the Viewport class. Controls the sandbox and moving container.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, MouseCoordinates, SandboxHelper */
"use strict";
var ViewportMovementHelper = Class.extend(
    /** @lends ViewportMovementHelper.prototype */
    {
    isMoving                : false,
    maxLayerDimensions      : { width: 0, height: 0 },
    mouseStartingPosition   : { x: 0, y: 0 },
    moveCounter             : 0,
    imageUpdateThrottle     : 3,
    tileUpdateThrottle      : 9,

    /**
     * @constructs
     * Creates a new ViewportMovementHelper
     *
     * @param centerX Horizontal offset from center in pixels
     * @param centerY Vertical offset from center in pixels
     */
    init: function (domNode, mouseCoords, offsetX, offsetY) {
        this.domNode         = $(domNode);
        this.sandbox         = $("#sandbox");
        this.movingContainer = $("#moving-container");
        this.mouseCoords     = mouseCoords;

        // Initialize sandbox
        var center = this._getCenter();
        this.sandboxHelper = new SandboxHelper(center.x, center.y);

        // Load previous offset
        //this.movingContainer.css({"left": offsetX, "top": offsetY});

        // Determine URL to grabbing cursor
        if ($.browser.msie) {
            this._cursorCSS = "url('resources/cursors/grabbing.cur'), move";
        } else {
            this._cursorCSS = 'move';
        }
    },

    /**
     * @description Centers the viewport.
     */
    centerViewport: function () {
        this.sandboxHelper.center();
    },

    /**
     * @description Fired when a mouse is pressed
     * @param {Event} event an Event object
     */
    mouseDown: function (event) {
        this.domNode.css("cursor", this._cursorCSS);

        // Don't do anything if entire image is already visible
        if ((this.sandbox.width() === 0) && (this.sandbox.height() === 0)) {
            return;
        }

        this.mouseStartingPosition = {
            x: event.pageX,
            y: event.pageY
        };

        this._startMoving();
    },

    /**
     * @description Fired when a mouse button is released
     * @param {Event} event Event object
     */
    mouseUp: function (event) {
        this.domNode.css("cursor", "");
        if (this.isMoving) {
            this._endMoving();
        }
    },

    /**
     * @description Handle drag events
     * @param {Object} an Event object
     */
    mouseMove: function (event) {
        if (!this.isMoving) {
            return;
        }

        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
            return;
        }

        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

        this._moveBy(this.mouseStartingPosition.x - event.pageX,
            this.mouseStartingPosition.y - event.pageY);
    },

    /**
     * Centers the viewport on the point that was double clicked and then triggers
     * zoom in/out events.
     */
    doubleClick: function (event) {
        var pos, center, diff;
        // Click coordinates relative to viewport top-left
        pos = this.mouseCoords.getRelativeCoords(event.pageX, event.pageY);

        // Coordinates of the center of the viewport
        center = this._getCenter();

        // Distance between point of mouse-click and the center of the viewport
        diff = {
            x: (pos.x - center.x),
            y: (pos.y - center.y)
        };

        this._startMoving();
        this._moveBy(diff.x, diff.y);
        this._endMoving();
    },

    updateMaxLayerDimensions: function (maxDimensions) {
        this.maxLayerDimensions = maxDimensions;
        this.update();
    },

    /**
     * Uses current viewport coordinates and maxLayerDimensions to determine the max coordinates of
     * the image in the viewport.
     */
    getMaxImageCoordinates: function (coordinates) {
        var halfWidth, halfHeight, maxCoordinates;
        halfWidth  = this.maxLayerDimensions.width  / 2;
        halfHeight = this.maxLayerDimensions.height / 2;

        maxCoordinates = {
            left   : Math.max(coordinates.left, -halfWidth),
            top    : Math.max(coordinates.top, -halfHeight),
            right  : Math.min(coordinates.right, halfWidth),
            bottom : Math.min(coordinates.bottom, halfHeight)
        };

        return maxCoordinates;
    },

    /**
     * @description Update the size and location of the movement-constraining box.
     */
    update: function () {
        var center, newSize;
        center  = this._getCenter();
        newSize = this._getDesiredSandboxDimensions();

        this.sandboxHelper.updateSandbox(center, newSize);
    },

    /**
     * @description Returns the coordinates of the upper-left and bottom-right corners of the viewport
     *              with respect to the center
     * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
     */
    getViewportCoords: function () {
        var sb, mc, left, top, vpWidth, vpHeight;

        sb = this.sandbox.position();
        mc = this.movingContainer.position();

        left = -(sb.left + mc.left);
        top  = -(sb.top + mc.top);

        // If dimension is an odd value, add one to ensure that (0, 0) is in center
        vpWidth  = this.domNode.width();
        vpHeight = this.domNode.height();

        if (vpWidth % 2 === 1) {
            vpWidth += 1;
        }
        if (vpHeight % 2 === 1) {
            vpHeight += 1;
        }

        return {
            left:  left,
            top :  top,
            right:  vpWidth  + left,
            bottom: vpHeight + top
        };
    },

    /**
     * Event triggered by using the arrow keys, moves the viewport by (x, y)
     */
    moveViewport: function (x, y) {
        this._startMoving();
        this.moveCounter += 1; // Threshold
        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

        this._moveBy(x, y);
        this._endMoving();
    },

    /**
     * @description Zooms To a specified image scale.
     * @param {Float} imageScale The desired image scale
     */
    zoomTo: function (imageScale) {
        var vpCoords, center, newScale, newCenter, newCoords;

        newScale = this.mouseCoords.imageScale / imageScale;
        this._scaleLayerDimensions(newScale);

        vpCoords = this.getViewportCoords();
        center = {
            x: (vpCoords.right + vpCoords.left) / 2,
            y: (vpCoords.bottom + vpCoords.top) / 2
        };

        newCenter = {
            x: center.x * newScale,
            y: center.y * newScale
        };

        // update sandbox
        this.update();

        newCoords = this._viewportCoordsToMovingContainerCoords(newCenter);

        this._moveTo(newCoords.x, newCoords.y);
        this.mouseCoords.updateImageScale(imageScale);
    },

    /**
     * Uses the center of the visible area in the viewport to calculate what the
     * moving container's coordinates should be.
     */
    _viewportCoordsToMovingContainerCoords: function (newCenter) {
        var sbCenter, mcCoords;
        sbCenter = this.sandboxHelper.getCenter();
        mcCoords = {
            x: Math.max(Math.min(sbCenter.x - newCenter.x, this.sandbox.width()), 0),
            y: Math.max(Math.min(sbCenter.y - newCenter.y, this.sandbox.height()), 0)
        };

        return mcCoords;
    },

    /**
     * Uses the maximum tile and event layer dimensions to determine how far a user needs to drag the viewport
     * contents around in order to see all layers
     */
    _getDesiredSandboxDimensions: function () {
        var width, height;
        width  = this.domNode.width();
        height = this.domNode.height();

        return {
            width : Math.max(0, this.maxLayerDimensions.width  - width),
            height: Math.max(0, this.maxLayerDimensions.height - height)
        };
    },

    /**
     * @description Get the current coordinates of the moving container (relative to the sandbox)
     * @returns {Object} The X & Y coordinates of the viewport's top-left corner
     */
    _getContainerPos: function () {
        var position = this.movingContainer.position();

        return {
            x: position.left,
            y: position.top
        };
    },

    /**
     * @description Adjusts the viewport's focus by x and y
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */
    _moveBy: function (x, y) {
        // Compare against sandbox dimensions
        var pos = {
            x: Math.min(Math.max(this.startMovingPosition.x - x, 0), this.sandbox.width()),
            y: Math.min(Math.max(this.startMovingPosition.y - y, 0), this.sandbox.height())
        };

        this.sandboxHelper.moveContainerTo(pos.x, pos.y);
    },

    /**
     * Move the viewport focus to a new location.
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */
    _moveTo: function (x, y) {
        this.sandboxHelper.moveContainerTo(x, y);

        // Check throttle
        if (this.moveCounter === 0) {
            $(document).trigger("update-viewport", [true]);
        }
    },

    /**
     * @description Event-handler for a mouse-drag start.
     */
    _startMoving: function () {
        this.isMoving = true;
        this.mouseCoords.disable();
        this.startMovingPosition = this._getContainerPos();
    },

    /**
     * @description Event handler triggered after dragging
     */
    _endMoving: function () {
        this.isMoving = false;
        this.mouseCoords.enable();
        $(document).trigger("update-viewport", [true]);
    },

    /**
     * @description Get the coordinates of the viewport center
     * @returns {Object} The X & Y coordinates of the viewport's center
     *
     * * TODO 06/07/2010: _getCenter should probably be with respect to the Sandbox, and not the viewport
     *   since that is more meaningful in terms of positioning and movement.
     */
    _getCenter: function () {
        return {
            x: this.domNode.width()  / 2,
            y: this.domNode.height() / 2
        };
    },

    _scaleLayerDimensions: function (scaleFactor) {
        this.maxLayerDimensions.width  *= scaleFactor;
        this.maxLayerDimensions.height *= scaleFactor;
    }
});
/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, HelioviewerTileLayerManager, HelioviewerMouseCoordinates,
  Viewport, TileLayerAccordion */
"use strict";
var HelioviewerViewport = Class.extend(
    /** @lends HelioviewerViewport.prototype */
    {
    defaultOptions: {
        imageScale : 1,
        tileSize   : 512,
        minHeight  : 450,
        prefetch   : 0
    },
    dimensions              : { width: 0, height: 0 },
    maxLayerDimensions      : { width: 0, height: 0 },
    maxTileLayers           : 6,

    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     */
    init: function (options) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);

        this._rsunInArcseconds = 959.705; // Solar radius in arcseconds,
                                          // source: Djafer, Thuillier
                                          // and Sofia (2008)

        this.domNode   = $(this.id);
        this.outerNode = $(this.container);

        this.mouseCoords = new HelioviewerMouseCoordinates(this.imageScale,
            this._rsunInArcseconds, this.warnMouseCoords);

        // Viewport must be resized before movement helper and sandbox are initialized.
        this.resize();

        // Compute center offset in pixels
        var centerX = this.centerX / this.imageScale,
            centerY = this.centerY / this.imageScale;

        this.movementHelper = new ViewportMovementHelper(this.domNode, this.mouseCoords, centerX, centerY);

        this.loadDataSources();
        this.loadEventTypes();

        this._initEventHandlers();
    },

    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager,
     * and resizes when done.
     */
    loadDataSources: function () {
        var callback, dataType, tileLayerAccordion, self = this;

        callback = function (dataSources) {
            self.dataSources = dataSources;
            $(document).trigger("datasources-initialized", [dataSources]);

            // Initialize tile layers
            self._tileLayerManager = new HelioviewerTileLayerManager(
                self.requestDate, self.dataSources, self.tileSize,
                self.imageScale, self.maxTileLayers, self.tileLayers);

            $(document).trigger("update-viewport");
        };
        $.get(Helioviewer.api, {action: "getDataSources"}, callback, Helioviewer.dataType);
    },

    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager,
     * and resizes when done.
     */
    loadEventTypes: function () {

        $(document).trigger("event-types-initialized", [this.eventTypes, this.requestDate]);

        // Initialize event layers

        this._eventLayerManager = new HelioviewerEventLayerManager(this.requestDate, this.eventTypes,
                                  this.imageScale, this.rsun, this.savedEventLayers,
                                  this.urlEventLayers);

        //$(document).trigger("update-viewport");
    },

    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision(8));
    },

    /**
     * Gets the window height and resizes the viewport to fit within it
     */
    resize: function () {
        var oldDimensions, width, height;

        // Get dimensions
        oldDimensions = this.dimensions;

        // Ensure minimum height
        height = Math.max(this.minHeight, $(window).height() - this._getPadHeight());

        //Update viewport height
        this.outerNode.height(height);

        // Update viewport dimensions
        this.dimensions = {
            width : this.domNode.width() + this.prefetch,
            height: this.domNode.height() + this.prefetch
        };

        // For initial resize do not attempt to update layers
        if (oldDimensions.width === 0 &&  oldDimensions.height === 0) {
            return;
        }

        // Otherwise if dimensions have changed update layers
        if (!this._hasSameDimensions(this.dimensions, oldDimensions)) {
            $(document).trigger("updateHeightsInsideViewportContainer");
            this.updateViewport();
        }
    },

    /**
     * Saves the new image scale
     */
    setImageScale: function (imageScale) {
        this.imageScale = imageScale;
    },

    updateViewportRanges: function (coordinates) {
        this._updateTileVisibilityRange(coordinates);

        if (typeof this._tileLayerManager !== "undefined") {
            this._tileLayerManager.adjustImageScale(this.imageScale);
        }
    },

    serialize: function () {
        // return this._tileLayerManager.serialize();
        return Helioviewer.userSettings.parseLayersURLString();
    },

    serializeEvents: function () {
        return Helioviewer.userSettings.parseEventsURLString();
    },

    /**
     * Returns a string representation of the layers which are visible and
     * overlap the specified region of interest
     */
    getVisibleLayers: function (roi) {
        return this._tileLayerManager.getVisibleLayers(roi);
    },

    /**
     * Makes room for header and footer if not in fullscreen mode
     */
    _getPadHeight: function () {
        if (this.domNode.hasClass("fullscreen-mode")) {
            return 0;
        }
        return this.marginTop + this.marginBottom;
    },

    /**
     * @description Returns the range of indices for the tiles to be displayed.
     * @returns {Object} The range of tiles which should be displayed
     */
    _updateTileVisibilityRange: function (coordinates) {
        if (typeof this._tileLayerManager !== "undefined") {
            this._tileLayerManager.updateTileVisibilityRange(coordinates);
        }
    },

    /**
     * Checks to see if two dimension arrays are the same
     */
    _hasSameDimensions: function (newDimensions, old) {
        return (newDimensions.width === old.width) && (newDimensions.height === old.height);
    },

    /**
     * Event listeners for interacting with the viewport
     */
    _initEventHandlers: function () {
        $(document).bind("image-scale-changed",
                         $.proxy(this.zoomViewport, this))
                   .bind("update-viewport",
                         $.proxy(this.onUpdateViewport, this))
                   .bind("load-saved-roi-position",
                         $.proxy(this.loadROIPosition, this))
                   .bind("move-viewport mousemove mouseup",
                         $.proxy(this.onMouseMove, this))
                   .bind("layer-max-dimensions-changed",
                         $.proxy(this.updateMaxLayerDimensions, this))
                   .bind("center-viewport",
                         $.proxy(this.centerViewport, this));

        $(this.domNode).bind("mousedown", $.proxy(this.onMouseMove, this));
        this.domNode.dblclick($.proxy(this.doubleClick, this));

        $('#center-button').click($.proxy(this.centerViewport, this));
        $(window).resize($.proxy(this.resize, this));

    },


    /**
     * Moves the viewport and triggers update function calls
     */
    onMouseMove: function (event, x, y) {
        switch (event.type) {
        case "mouseup":
            this.movementHelper.mouseUp(event);
            break;
        case "mousedown":
            this.movementHelper.mouseDown(event);
            break;
        case "mousemove":
            this.movementHelper.mouseMove(event);
            break;
        default:
            this.movementHelper.moveViewport(x, y);
            break;
        }
    },

    /**
     * Zooms in or out and saves the setting once it is done
     */
    zoomViewport: function (event, imageScale) {
        this.setImageScale(imageScale);

        // Moves the viewport to the correct position after zooming
        this.movementHelper.zoomTo(imageScale);

        this.updateViewport();

        // store new value
        Helioviewer.userSettings.set("state.imageScale", imageScale);
    },

    /**
     * Event handler for viewport update requests
     */
    onUpdateViewport: function (event, storeCoordinates) {
        if (typeof storeCoordinates === "undefined") {
            storeCoordinates = false;
        }

        this.updateViewport(storeCoordinates);
    },

    /**
     * Sets up initial viewport properties and loads previous settings
     *
     * Load previous centering settings by shifting moving container which
     * represents the solar center. In the simplest case, the Sun is centered,
     * and the moving container should be in the middle of the viewport sandbox
     */
    loadROIPosition: function (event) {
        var sandbox, sbWidth, sbHeight, centerX, centerY;

        sandbox = $("#sandbox");
        sbWidth  = sandbox.width();
        sbHeight = sandbox.height();

        centerX = Helioviewer.userSettings.get("state.centerX") / this.getImageScale();
        centerY = Helioviewer.userSettings.get("state.centerY") / this.getImageScale();

        $("#moving-container").css({
            "left": sbWidth  - Math.max(0, Math.min(sbWidth,  Math.round(sbWidth  / 2 + centerX))),
            "top" : sbHeight - Math.max(0, Math.min(sbHeight, Math.round(sbHeight / 2 + centerY)))
        });

        this.updateViewport();
    },

    /**
     * Tells the viewport to update itself and its tile layers
     */
    updateViewport: function (storeCoordinates) {
        var coordinates, imageScale, offsetX, offsetY;

        if (typeof storeCoordinates === "undefined") {
            storeCoordinates = false;
        }

        this.movementHelper.update();

        // Pixel coordinates for the ROI edges
        coordinates = this.movementHelper.getViewportCoords();

        imageScale = this.getImageScale();

        // ROI Offset from solar center (in arc-seconds)
        offsetX = imageScale * ((coordinates.left + coordinates.right) / 2);
        offsetY = imageScale * ((coordinates.top + coordinates.bottom) / 2);

        // Updated saved settings
        if (storeCoordinates) {
            Helioviewer.userSettings.set("state.centerX", offsetX);
            Helioviewer.userSettings.set("state.centerY", offsetY);
        }

        this.updateViewportRanges(coordinates);
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * Returns the coordinates for the top-left and bottom-right corners of the current
     * region of interest displayed in the viewport
     */
    getRegionOfInterest: function () {
        return this.movementHelper.getViewportCoords();
    },

    /**
     * Moves the image back to the center of the viewport.
     */
    centerViewport: function () {
        this.movementHelper.centerViewport();
        this.updateViewport();
        Helioviewer.userSettings.set("state.centerX", 0);
        Helioviewer.userSettings.set("state.centerY", 0);
    },

    /**
     * Centers the viewport about a point
     *
     * @param int x
     * @param int y
     */
    setViewportCenter: function (x, y) {
        this.movementHelper.moveViewport(x, y);
    },

    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (event) {
        this.movementHelper.doubleClick(event);

        if (event.shiftKey) {
            $("#zoom-out-button").click();
        } else {
            $("#zoom-in-button").click();
        }
    },

    /**
     * Updates the stored values for the maximum layer dimensions. This is used in computing the optimal
     * sandbox size in movementHelper. Assumes there is only one kind of layer (aka tileLayers). To
     * account for multiple layer types, like eventLayers, add some comparisons between dimensions.
     */
    updateMaxLayerDimensions: function (event, type, dimensions) {
        this.movementHelper.updateMaxLayerDimensions(dimensions);
    },

    /**
     * Gets information about the viewport including date, layers, and scale
     * and returns them as an array.
     */
    getViewportInformation: function () {
        return {
            coordinates : this.movementHelper.getViewportCoords(),
            imageScale  : this.imageScale,
            layers      : this.serialize(),
            events      : this.serializeEvents(),
            time        : this._tileLayerManager.getRequestDateAsISOString()
        };
    },

    /**
     * Returns the image scale in Kilometers per pixel
     */
    getImageScaleInKilometersPerPixel: function () {
        //return parseFloat(this.imageScale.toPrecision(8) *
        //(helioviewer.constants.rsun / (1000 * this._rsunInArcseconds)));
    },

    /**
     * Returns the middle time of all of the layers currently loaded
     */
    getEarliestLayerDate: function () {
        var startDate, endDate, difference, dates = [];

        // Get the observation dates associated with each later
        $.each(this._tileLayerManager._layers, function (i, layer) {
            if ( layer.image.date === undefined ) {
                return false;
            }
            dates.push(layer.image.date);
        });

        // If there are no image layers loaded then use the requestDate
        if (dates.length === 0) {
            return Date.parseUTCDate(this.requestDate.toISOString());
        }
        // If there is only one layer loaded then use its date
        else if (dates.length === 1) {
            return Date.parseUTCDate(dates[0]);
        }

        dates.sort();
        startDate = Date.parseUTCDate(dates[0]);

        return startDate;
    },

    /**
     * Returns the middle time of all of the layers currently loaded
     */
    getLatestLayerDate: function () {
        var startDate, endDate, difference, dates = [];

        // Get the observation dates associated with each later
        $.each(this._tileLayerManager._layers, function (i, layer) {
            if ( layer.image.date === undefined ) {
                return false;
            }
            dates.push(layer.image.date);
        });

        // If there are no image layers loaded then use the requestDate
        if (dates.length === 0) {
            return Date.parseUTCDate(this.requestDate.toISOString());
        }
        // If there is only one layer loaded then use its date
        else if (dates.length === 1) {
            return Date.parseUTCDate(dates[0]);
        }

        dates.sort();
        endDate   = Date.parseUTCDate(dates[dates.length - 1]);

        return endDate;
    }

});
/**
 * @fileOverview Contains base Helioviewer client JavaScript
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, Class, TooltipHelper, HelioviewerViewport,
  KeyboardManager, SettingsLoader, ZoomControls, assignTouchHandlers
 */
"use strict";

var Helioviewer = {}; // Helioviewer global namespace

var HelioviewerClient = Class.extend(
    /** @lends HelioviewerClient.prototype */
    {
    /**
     * Base Helioviewer client class
     * @constructs
     *
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (urlSettings, serverSettings, zoomLevels) {
        this._checkBrowser(); // Determines browser support

        this.serverSettings = serverSettings;

        Helioviewer.api          = serverSettings['backEnd'];
        Helioviewer.dataType     = "json";
        Helioviewer.userSettings = SettingsLoader.loadSettings(urlSettings, serverSettings);

        Helioviewer.root = serverSettings['rootURL'];
    },

    /**
     * @description Checks browser support for various features used in Helioviewer
     */
    _checkBrowser: function () {
        // Base support
        $.extend($.support, {
            "localStorage" : ('localStorage' in window) && window['localStorage'] !== null,
            "nativeJSON"   : typeof (JSON) !== "undefined",
            "video"        : !!document.createElement('video').canPlayType,
            "h264"         : false,
            "vp8"          : false
        });

        // HTML5 Video Support
        if ($.support.video) {
            var v = document.createElement("video");

            // VP8/WebM
            if (v.canPlayType('video/webm; codecs="vp8"')) {
                // 2011/11/07: Disabling vp8 support until encoding time
                // can be greatly reduced. WebM/VP8 movies will still be
                // generated on the back-end when resources are available,
                // but Flash/H.264 will be used in the mean-time to decrease
                // response time and queue waits.

                //$.support.vp8 = true;
                $.support.vp8 = false;
            }

            // H.264
            if (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
                // 2011/11/07: Also disabling H.264 in-browser video for now:
                // some versions of Chrome report support when it does not
                // actually work.

                //$.support.h264 = true;
                $.support.h264 = false;
            }
        }
    },

    /**
     * Initializes Helioviewer's viewport
     */
    _initViewport: function (container, date, marginTop, marginBottom) {
        this.viewport = new HelioviewerViewport({
            id             : '#helioviewer-viewport',
            container      : container,
            requestDate    : date,
            maxTileLayers  : this.serverSettings.maxTileLayers,
            minImageScale  : this.serverSettings.minImageScale,
            maxImageScale  : this.serverSettings.maxImageScale,
            prefetch       : this.serverSettings.prefetchSize,
            tileLayers     : Helioviewer.userSettings.get('state.tileLayers'),
            eventLayers    : Helioviewer.userSettings.get('state.eventLayers'),
            eventLabels    : Helioviewer.userSettings.get('state.eventLabels'),
            imageScale     : Helioviewer.userSettings.get('state.imageScale'),
            centerX        : Helioviewer.userSettings.get('state.centerX'),
            centerY        : Helioviewer.userSettings.get('state.centerY'),
            marginTop      : marginTop,
            marginBottom   : marginBottom,
            warnMouseCoords: Helioviewer.userSettings.get(
                                'notifications.coordinates')
        });
    },

    /**
     * Chooses an acceptible image scale to use based on the default or
     * requested imageScale the list of allowed increments
     */
    _chooseInitialImageScale: function (imageScale, increments) {
        // For exact match, use image scale as-is
        if ($.inArray(imageScale, increments) !== -1) {
            return imageScale;
        }
        // Otherwise choose closest acceptible image scale
        var diff, closestScale, bestMatch = Infinity;

        $.each(increments, function (i, scale) {
            diff = Math.abs(scale - imageScale);

            if (diff < bestMatch) {
                bestMatch = diff;
                closestScale = scale;
            }
        });

        // Store closest matched image scale
        Helioviewer.userSettings.set('state.imageScale', closestScale);

        return closestScale;
    }
});
/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var ZoomControls = Class.extend(
    /** @lends ZoomControls.prototype */
    {
    /**
     * @constructs
     *
     * Creates a new ZoomControl
     */
    init: function (id, imageScale, increments, minImageScale, maxImageScale) {
        this.id            = id;
        this.imageScale    = imageScale;
        this.increments    = increments;
        this.minImageScale = minImageScale;
        this.maxImageScale = maxImageScale;

        this.zoomInBtn  = $('#zoom-in-button');
        this.zoomSlider = $('#zoomControlSlider');
        this.zoomOutBtn = $('#zoom-out-button');

        this._initSlider();
        this._initEventHandlers();
    },

    /**
     * Adjusts the zoom-control slider
     *
     * @param {Integer} v The new zoom value.
     */
    _onSlide: function (v) {
        this._setImageScale(v);
    },

    /**
     * Translates from jQuery slider values to zoom-levels, and updates the
     * zoom-level.
     *
     * @param {Object} v jQuery slider value
     */
    _setImageScale: function (v) {
        $(document).trigger('image-scale-changed', [this.increments[v]]);
        $(document).trigger('replot-event-markers');
        $(document).trigger('earth-scale');
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Initializes zoom level slider
     */
    _initSlider: function () {
        var description, self = this;

        // Reverse orientation so that moving slider up zooms in
        this.increments.reverse();

        // Initialize slider
        this.zoomSlider.slider({
            slide: function (event, slider) {
                self._onSlide(slider.value);
            },
            min: 0,
            max: this.increments.length - 1,
            orientation: 'vertical',
            value: $.inArray(this.imageScale, this.increments)
        });

        // Add tooltip
        description = "Drag this handle up and down to zoom in and out of " +
                      "the displayed image.";
        $("#zoomControlSlider > .ui-slider-handle").attr('title', description)
                                                   .qtip();
    },

    /**
     * @description Responds to zoom in button click
     */
    _onZoomInBtnClick: function () {
        var index = this.zoomSlider.slider("value") + 1;

        if (this.increments[index] >= this.minImageScale) {
            this.zoomSlider.slider("value", index);
            this._setImageScale(index);
        }
    },

    /**
     * @description Responds to zoom out button click
     */
    _onZoomOutBtnClick: function () {
        var index = this.zoomSlider.slider("value") - 1;

        if (this.increments[index] <= this.maxImageScale) {
            this.zoomSlider.slider("value", index);
            this._setImageScale(index);
        }
    },

    /**
     * Handles mouse-wheel movements
     *
     * @param {Event} event Event class
     */
    _onMouseWheelMove: function (e, delta) {
        if (delta > 0) {
            this.zoomInBtn.click();
        } else {
            this.zoomOutBtn.click();
        }
        return false;
    },

    /**
     * @description Initializes zoom control-related event-handlers
     */
    _initEventHandlers: function () {
        this.zoomInBtn.click($.proxy(this._onZoomInBtnClick, this));
        this.zoomOutBtn.click($.proxy(this._onZoomOutBtnClick, this));

        $("#helioviewer-viewport").mousewheel(
            $.proxy(this._onMouseWheelMove, this));

        $(document).bind("zoom-in",  $.proxy(this._onZoomInBtnClick, this))
                   .bind("zoom-out", $.proxy(this._onZoomOutBtnClick, this));

    }
});
/**
 * @fileOverview Contains the class definition for an ImageScale class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var ImageScale = Class.extend(
    /** @lends ImageScale.prototype */
    {
    /**
     * @constructs
     *
     * Creates a new ImageScale
     */
    init: function () {

        // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this._rsunInArcseconds       = 959.705;

        this._earthSunRadiusFraction = 6367.5 / 695500.;  // km

        this._initScale();
    },


    _initScale: function() {
        var earthURL = 'resources/images/earth.png';

        if ( $('#earth-container').length > 0 ) {
           $('#earth-container').remove();
        }

        this._earthDiameterInPixels();

        this.scale_container = $('<div id="earth-container"></div>').appendTo("#helioviewer-viewport");
        this.scale_container.draggable();
        this.scale_container.css({
            'position'    : 'absolute',
            'z-index'     : '999',
            'width'       : '73px',
            'height'      : '56px',
            'background-color':'rgba(17,17,17,0.5)',
            'border'      : '1px solid #888',
            'box-shadow'  : '0px 0px 5px black',
            'cursor'      : 'move'
        });
        this.scale_container.attr('title','Click and drag to re-position scale indicator.');

        $('<div style="position:relative; height:12px;"><div id="earthLabel" style="color: white; background-color: #333; text-align: center; font-size: 10px; padding: 2px 0 2px 2px;">Earth Scale</div></div>').appendTo("#earth-container");
        $('<div style="position:relative; width:72px; height:45px;"><img id="earthScale" src="resources/images/earth.png" style="width: '+this.earthDiameterInPixels+'px; height: '+this.earthDiameterInPixels+'px; position: absolute; left: '+(36-(this.earthDiameterInPixels/2))+'px; top: '+(23-(this.earthDiameterInPixels/2))+'px;" /></div>').appendTo("#earth-container");

        this.scale_button    = $(document).find('#earth-button');
        this.scale_image     = this.scale_container.find('#earthScale');
        this.scale_label     = this.scale_container.find('#earthLabel');

        $(document).bind("earth-scale",   $.proxy(this.earthRescale, this));

        this.scale_container.bind("mousedown", function () { return false; });
        this.scale_container.bind('dblclick',  function () { return false; });
        this.scale_container.bind('click',     function () { return false; });

        this.scale_container.bind('dragstop', $.proxy(this.scaleContainerDragStop, this));

        this.scale_button.bind('click', $.proxy(this.earthMinimize, this));

        this.display();
    },

    earthRescale: function() {
        // Grab new imageScale and recompute Earth scale pixel size
        this._earthDiameterInPixels();

        this.scale_image.css({
            'width' : this.earthDiameterInPixels+'px',
            'height': this.earthDiameterInPixels+'px',
            'position' : 'absolute',
            'left': (36-(this.earthDiameterInPixels/2))+'px',
            'top' : (23-(this.earthDiameterInPixels/2))+'px'
        });

        // Update X,Y position of scale container (in arcseconds)
        this.scaleContainerDragStop();
    },

    earthMinimize: function(event) {
        Helioviewer.userSettings.set("state.scale", false);
        Helioviewer.userSettings.set("state.scaleType", 'earth');
        this.scale_button.attr('title','Show Earth-Scale Indicator');
        this.scale_container.hide();
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMaximize,  this));
        this.scale_button.toggleClass('active', false);
        this._getScaleSettings();
    },

    earthMaximize: function() {
        var scaleXY;

        scaleXY = this.resetIfOutsideViewportBounds();

        Helioviewer.userSettings.set("state.scale", true);
        Helioviewer.userSettings.set("state.scaleType", 'earth');
        Helioviewer.userSettings.set("state.scaleX", scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY", scaleXY.y);
        this.scale_button.attr('title','Hide Earth-Scale Indicator');
        this.scale_container.show();
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMinimize,  this));
        this.scale_button.toggleClass('active', true);
        this._getScaleSettings();
    },

    scaleContainerDragTo: function(containerX, containerY) {
        this.scale_container.css({
            'position' : 'absolute',
            'top'      : containerY+'px',
            'left'     : containerX+'px'
        });
        this.scaleContainerDragStop();
    },

    scaleContainerDragStop: function(event) {
        var scaleXY;

        scaleXY = this.resetIfOutsideViewportBounds();

        Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);
        Helioviewer.userSettings.set("state.containerX",this.scale_container.position().left);
        Helioviewer.userSettings.set("state.containerY",this.scale_container.position().top);
        this._getScaleSettings();
    },

    resetIfOutsideViewportBounds: function(event) {
        var scaleXY, coords;

        coords = new HelioviewerMouseCoordinates(Helioviewer.userSettings.get("state.imageScale"), 959.705, false);

        // Snap back to default position if dragged outside of Viewport bounds
        if ( Helioviewer.userSettings.get("state.containerX") <= 0 ||
             Helioviewer.userSettings.get("state.containerX") >= this.scale_container.parent().width()-this.scale_container.width() ||
             Helioviewer.userSettings.get("state.containerY") <= $('#hv-header').height() ||
             Helioviewer.userSettings.get("state.containerY") >= this.scale_container.parent().height()-this.scale_container.height()
            ) {

            this.containerX = $('#earth-button').position().left + $('#scale').position().left - this.scale_container.width()/2;
            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.scale_container.height();

            this.scale_container.css({
                'position' : 'absolute',
                'top'      : this.containerY+'px',
                'left'     : this.containerX+'px'
            });
        }

        scaleXY = coords.computeMouseCoords(
            Helioviewer.userSettings.get("state.containerX"),
            Helioviewer.userSettings.get("state.containerY")
        );

        Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);

        this._getScaleSettings();

        return scaleXY;
    },


    _earthDiameterInPixels: function() {
        this.imageScale  = Helioviewer.userSettings.get("state.imageScale");
        this.earthDiameterInPixels = Math.round(2 * this._earthSunRadiusFraction * (this._rsunInArcseconds / this.imageScale));
    },

    _getScaleSettings: function() {
        this.scale      = Helioviewer.userSettings.get("state.scale");
        this.scaleType  = Helioviewer.userSettings.get("state.scaleType");
        this.scaleX     = Helioviewer.userSettings.get("state.scaleX");
        this.scaleY     = Helioviewer.userSettings.get("state.scaleY");
        this.containerX = Helioviewer.userSettings.get("state.containerX");
        this.containerY = Helioviewer.userSettings.get("state.containerY");
    },

    display: function() {
        this._getScaleSettings();

        if ( parseInt(Helioviewer.userSettings.get("state.scaleX")) == 0 ||
             parseInt(Helioviewer.userSettings.get("state.scaleY")) == 0 ) {

            this.containerX = $('#earth-button').position().left + $('#scale').position().left - this.scale_container.width()/2;
            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.scale_container.height();
            this.scale = false;
        }

        this.scaleContainerDragTo(this.containerX, this.containerY);

        if ( this.scale === false ) {
            this.earthMinimize();
        }
        else {
            this.earthMaximize();
        }
    }
});
/**
 * @description Valides settings before saving them
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName */
"use strict";
var InputValidator = Class.extend(
    /** @lends InputValidator.prototype */
    {
    /**
     * @constructs
     */
    init: function () {        
    },
    
    /**
     * Checks to make sure that the string is a valid UTC date string of
     * 2011-03-14 17:41:39, 2011-03-14T17:41:39, or 2011-03-14T17:41:39.000Z
     */
    checkDateString: function (value, opts) {
        var t = Date.parseUTCDate(value);
        t = null;
    },

    /**
     * Checks value to make sure it is a valid integer and that it falls within specified constraints
     */
    checkInt: function (value, opts) {
        var options = {
            "min": -Infinity,
            "max": Infinity
        };
        $.extend(options, opts || {});
        
        if (isNaN(value) || value < options.min || value > options.max || 
           (typeof value === "string" && parseInt(value, 10) !== value.toString())) {
            throw "Unacceptable integer value specified.";
        }
    },
    
    /**
     * Checks value to make sure it is a valid float and that it falls within specified constraints
     */
    checkFloat: function (value, opts) {
        var options = {
            "min": -Infinity,
            "max": Infinity
        };
        $.extend(options, opts || {});
        
        if (isNaN(value) || value < options.min || value > options.max) {
            throw "Unacceptable float value specified.";
        }
    },
    
    /**
     * Checks a timestamp to make sure it is reasonable
     */
    checkTimestamp: function (value, opts) {
        var options = {
            "min": 0,
            "max": Math.round(new Date().getTime() / 1000) + (24 * 60 * 60) // Now + 24 hours
        };
        $.extend(options, opts || {});
        
        // convert from milliseconds
        if (value.toString().length > 10) {
            value = value / 1000;
        }
        
        if (isNaN(value) || value < options.min || value > options.max) {
            throw "Unacceptable timestamp value specified.";
        }
    }
});
/**
 * @fileOverview Contains the class definition for a SettingsLoader class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, getUTCTimestamp, parseFloat, UserSettings */
"use strict";
var SettingsLoader = (
    /** @lends SettingsLoader.prototype */
    {
    /**
     * Loads default settings and URL settings.
     *
     * @returns {Object} A UserSettings object
     */
    loadSettings: function (urlSettings, serverSettings) {
        var defaults    = this._getDefaultSettings(serverSettings),
            constraints = {
                "minImageScale" : serverSettings.minImageScale,
                "maxImageScale" : serverSettings.maxImageScale,
                "minMovieLength": 300,
                "maxMovieLength": 16934400
            };

        return new UserSettings(defaults, urlSettings, constraints);
    },

    /**
     * Creates a hash containing the default settings to use. Change default settings here.
     *
     * TODO 10/01/2010: Add check when adding default layer to make sure it is available.
     *
     * @param {Object} Helioviewer.org server-specified defaults
     *
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaultSettings: function (serverSettings) {
        // Use current date (UTC) for default observation time
        var date = new Date(+new Date());

        return {
            // Default settings
            options: {
                date: "latest", // "previous" | "latest"
                movies: {
                    cadence: "auto", // "auto" | number of seconds
                    duration: 86400,
                    format: "mp4"
                },
                autorefresh: false
            },
            // Saved movie and screenshots
            history: {
                movies: [],
                screenshots: []
            },
            // Single-time notifications and warning messages
            notifications: {
                coordinates: true,
                welcome: true
            },
            // Application state
            state: {
                "centerX"    : 0,
                "centerY"    : 0,
                "date"       : date.getTime(),
                "drawers": {
                    "#hv-drawer-left": {
                        "open": true,
                        "accordions": {
                            "#accordion-date": {
                                "open": true
                            },
                            "#accordion-images": {
                                "open": true
                            },
                            "#accordion-events": {
                                "open": false
                            }
                        }
                    },
                    "#hv-drawer-news": {
                        "open": false,
                        "accordions": {
                            "#accordion-news": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-youtube": {
                        "open": true,
                        "accordions": {
                            "#accordion-youtube": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-movies": {
                        "open": false,
                        "accordions": {
                            "#accordion-movies": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-screenshots": {
                        "open": false,
                        "accordions": {
                            "#accordion-screenshots": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-data": {
                        "open": false,
                        "accordions": {
                            "#accordion-vso": {
                                "open": true
                            },
                            "#accordion-sdo": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-share": {
                        "open": false,
                        "accordions": {
                            "#accordion-link": {
                                "open": true
                            },
                            "#accordion-social": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-help": {
                        "open": false,
                        "accordions": {
                            "#accordion-help-links": {
                                "open": true
                            }
                        }
                    }
                },
                "eventLayers": [],
                "eventLabels": true,
                "imageScale" : serverSettings.defaultImageScale,
                "scale"      : true,
                "scaleType"  :'earth',
                "scaleX"     : 0,
                "scaleY"     : 0,
                "tileLayers" : [{
                    "visible"    : true,
                    "opacity"    : 100,
                    "uiLabels"   : [ {'label':'Observatory',
                                    'name' :'SDO'},
                                   {'label':'Instrument',
                                    'name' :'AIA'},
                                   {'label':'Measurement',
                                    'name' :'304'} ]
                }],
                "timeStep"   : 86400
            },
            version: serverSettings.version
        };
    }
});
/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, InputValidator, CookieJar, $, localStorage, parseLayerString, getUTCTimestamp */
"use strict";
var UserSettings = Class.extend(
    /** @lends UserSettings.prototype */
    {
    /**
     * Class to manage user preferences.<br><br>
     *
     * Creates a class which handles the storing the retrieving of custom user settings. This includes things
     * like the requested observation time, image zoom level, and the layers currently loaded. The UserSettings
     * class has the ability to use both HTML5 local storage and cookies for saving information.
     *
     * TODO 2010/04/09: Generalize the validation step by passing in an array of validation criteria instead
     * of passing in parameters individually.
     *
     * @constructs
     *
     * @see <a href="https://developer.mozilla.org/en/DOM/Storage">https://developer.mozilla.org/en/DOM/Storage</a>
     */
    init: function (defaults, urlSettings, constraints) {
        this._defaults    = defaults;
        this._constraints = constraints;

        // Input validator
        this._validator = new InputValidator();

        // Initialize storage
        this._initStorage();

        // Process URL parameters
        this._processURLSettings(urlSettings);
    },

    /**
     * Gets a specified setting
     *
     * @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    get: function (key) {
        // Nesting depth is limited to three levels
        try {
            return this._get(key);
        } catch (ex) {
            // If an error is encountered, then settings are likely outdated;
            // use the default value
            var value = this._getDefault(key);
            this.set(key, value)
            return value;
        }
    },

    /**
     * Gets a specified setting
     *
       @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    _get: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this.settings[key];
        }
        else if (lookup.length === 2) {
            return this.settings[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Returns the default value associated with the specified key
     */
    _getDefault: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this._defaults[key];
        }
        else if (lookup.length === 2) {
            return this._defaults[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Saves a specified setting
     *
     * @param {String} key   The setting to update
     * @param {Object} value The new value for the setting
     */
    set: function (key, value) {
        try {
            this._validate(key, value);
        } catch (e) {
            return;
        }

        // Update settings
        var lookup = key.split(".");

        if (lookup.length === 1) {
            this.settings[key] = value;
        }
        else if (lookup.length === 2) {
            this.settings[lookup[0]][lookup[1]] = value;
        }
        else if (lookup.length === 3) {
            this.settings[lookup[0]][lookup[1]][lookup[2]] = value;
        }
        else if (lookup.length === 4) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = value;
        }
        else if (lookup.length === 5) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = value;
        }
        else if (lookup.length === 6) {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] = value;
        }
        else {
            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]] = value;
        }

        this._save();
    },

    /**
     * Saves the user settings after changes have been made
     */
    _save: function () {
        // localStorage
        if ($.support.localStorage) {
            localStorage.setItem("settings", $.toJSON(this.settings));
        }
        // cookies
        else {
            this.cookies.set("settings", this.settings);
        }
    },

    /**
     * Removes all existing settings
     */
    _empty: function () {
        if ($.support.localStorage) {
            localStorage.removeItem("settings");
        } else {
            $.cookieJar("empty");
        }
    },

    /**
     * Checks to see if there are any existing stored user settings
     *
     * @returns {Boolean} Returns true if stored Helioviewer.org settings are detected
     */
    _exists: function () {
        return ($.support.localStorage ? (localStorage.getItem("settings") !== null)
                : (this.cookies.toString().length > 2));
    },

    /**
     * Decides on best storage format to use, and initializes it
     */
    _initStorage: function () {
        // Initialize CookieJar if localStorage isn't supported
        if (!$.support.localStorage) {
            this.cookies = $.cookieJar("settings");
        }

        // If no stored user settings exist, load defaults
        if (!this._exists()) {
            this._loadDefaults();
        }
        else {
            this._loadSavedSettings();
        }

        // If version is out of date, load defaults
        if (this.get('version') < this._defaults.version) {
            this._updateSettings(this.get('version'));
        }
    },

    /**
     * Attempts to update user settings to reflect recent changes
     */
    _updateSettings: function (version) {
        var statuses, self = this;

        // 2.2.1 and under - Load defaults
        if (version < 567) {
            this._loadDefaults();
        } else if (version < 700) {
            // 2.3.0 - Movie statuses changed to ints
            statuses = {
                "QUEUED": 0,
                "PROCESSING": 1,
                "FINISHED": 2,
                "ERROR": 3
            };

            // Convert string status to integer status
            $.each(this.settings.history.movies, function (i, movie) {
                self.settings.history.movies[i].status = statuses[movie.status];
            });

            // 2.3.0 - "defaults" section renamed "options"
            this.settings.options = this.settings.defaults;
            delete this.settings.defaults;

            // Updated version number and save
            this.set('version', this._defaults.version);
        }
    },

    /**
     * Loads defaults user settings
     */
    _loadDefaults: function () {
        this._empty();

        if ($.support.localStorage) {
            localStorage.setItem("settings", $.toJSON(this._defaults));
        }
        else {
            this.cookies.set("settings", this._defaults);
        }

        this.settings = this._defaults;
    },

    /**
     * Retrieves the saved user settings and saved them locally
     */
    _loadSavedSettings: function () {
        if ($.support.localStorage) {
            this.settings = $.evalJSON(localStorage.getItem("settings"));
        }
        // Otherwise, check type and return
        else {
            this.settings = this.cookies.get("settings");
        }
    },

    /**
     * Processes and validates any URL parameters that have been set
     *
     * Note that date is handled separately in TimeControls
     */
    _processURLSettings: function (urlSettings) {
        if (urlSettings.imageScale) {
            this.set("state.imageScale", parseFloat(urlSettings.imageScale));
        }

        if (urlSettings.centerX) {
            this.set("state.centerX", parseFloat(urlSettings.centerX));
        }

        if (urlSettings.centerY) {
            this.set("state.centerY", parseFloat(urlSettings.centerY));
        }

        if (urlSettings.imageLayers) {
            this.set("state.tileLayers",
                     this._parseURLStringLayers(urlSettings.imageLayers));
        }

        if (typeof urlSettings.eventLayers != 'undefined' && urlSettings.eventLayers != '') {
            this.set("state.eventLayers",
                     this._parseURLStringEvents(urlSettings.eventLayers));
        }

        // Event labels are ON by default
        if ( urlSettings.eventLabels == true ) {
            this.set("state.eventLabels", true);
        }
        // Override event label default with value from URL
        else if ( typeof urlSettings.eventLabels != 'undefined'
            && urlSettings.eventLabels == false) {

            this.set("state.eventLabels", false);
        }
    },

    /**
     * Processes a string containing one or more layers and converts them into
     * JavaScript objects
     */
    _parseURLStringLayers: function (urlLayers) {
        var layers = [], self = this;

        $.each(urlLayers, function (i, layerString) {
            layers.push(parseLayerString(layerString));
        });

        return layers;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseLayersURLString: function (layerArray) {
        var layerString = '';

        if ( typeof layerArray == "undefined" ) {
            layerArray = this.get("state.tileLayers");
        }

        $.each(layerArray, function (i, layerObj) {
            layerString += "[";

            $.each(layerObj.uiLabels, function (i, labelObj) {
                layerString += labelObj.name + ",";
            });
            layerString += parseInt(layerObj.layeringOrder) + ",";
            layerString += parseInt(layerObj.opacity);

            layerString += "],";
        });
        return layerString.slice(0, -1);
    },

    /**
     * Processes a string containing one or more event types and FRMs and
     * converts them into JavaScript objects
     */
    _parseURLStringEvents: function (urlEventLayers) {
        var events = [], self = this;

        $.each(urlEventLayers, function (i, eventLayerString) {
            events.push(parseEventString(eventLayerString));
        });
        return events;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseEventsURLString: function (eventLayerArray) {
        var eventLayerString = '';

        if ( typeof eventLayerArray == "undefined" ) {
            eventLayerArray = this.get("state.eventLayers");
        }

        $.each(eventLayerArray, function (i, eventLayerObj) {
            eventLayerString += "[" + eventLayerObj.event_type     + ","
                                    + eventLayerObj.frms.join(';') + ","
                                    + eventLayerObj.open           + "],";
        });
        return eventLayerString.slice(0, -1);
    },

    /**
     * Validates a setting (Currently checks observation date and image scale)
     *
     * @param {String} setting The setting to be validated
     * @param {String} value   The value of the setting to check
     *
     * @returns {Boolean} Returns true if the setting is valid
     */
    _validate: function (setting, value) {
        var self = this;

        switch (setting) {
        case "state.date":
            this._validator.checkTimestamp(value);
            break;
        case "state.imageScale":
            this._validator.checkFloat(value, {
                "min": this._constraints.minImageScale,
                "max": this._constraints.maxImageScale
            });
            break;
        case "history.movies":
            $.each(value, function (i, movie) {
                self._validator.checkDateString(movie["dateRequested"]);
            });
            break;
        case "history.screenshots":
            $.each(value, function (i, screenshot) {
                self._validator.checkDateString(screenshot["dateRequested"]);
            });
            break;
        case "options.movies.duration":
            this._validator.checkInt(value, {
                "min": this._constraints.minMovieLength,
                "max": this._constraints.maxMovieLength
            });
            break;
        default:
            break;
        }
    }
});
/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var LayerManager = Class.extend(
    /** @lends LayerManager.prototype */
    {
    /**
     * @constructs
     * @description Creates a new LayerManager
     */
    init: function () {
        this._layers    = [];
        this._maxLayerDimensions = {width: 0, height: 0};
    },

    /**
     * @description Add a new layer
     */
    addLayer: function (layer) {
        this._layers.push(layer);
    },
   
    /**
     * @description Gets the number of layers currently loaded 
     * @return {Integer} Number of layers present.
     */
    size: function () {
        return this._layers.length;
    },
    
    /**
     * Returns the index of the given layer if it exists, and -1 otherwise
     */
    indexOf: function (id) {
        var index = -1;
        
        $.each(this._layers, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });
        
        return index;
    },
    
    /**
     * Updates the stored maximum dimensions. If the specified dimensions for updated are {0,0}, e.g. after
     * a layer is removed, then all layers will be checked
     */
    updateMaxDimensions: function (event) {
        var type = event.type.split("-")[0];
        this.refreshMaxDimensions(type);
        
        $(document).trigger("viewport-max-dimensions-updated");
    },
    
    /**
     * Rechecks maximum dimensions after a layer is removed
     */
    refreshMaxDimensions: function (type) {
        var maxLeft   = 0,
	        maxTop    = 0,
	        maxBottom = 0,
	        maxRight  = 0,
	        old       = this._maxLayerDimensions;

        $.each(this._layers, function () {
            var d = this.getDimensions();

            maxLeft   = Math.max(maxLeft, d.left);
            maxTop    = Math.max(maxTop, d.top);
            maxBottom = Math.max(maxBottom, d.bottom);
            maxRight  = Math.max(maxRight, d.right);

        });
        
        this._maxLayerDimensions = {width: maxLeft + maxRight, height: maxTop + maxBottom};

        if ((this._maxLayerDimensions.width !== old.width) || (this._maxLayerDimensions.height !== old.height)) {
            $(document).trigger("layer-max-dimensions-changed", [type, this._maxLayerDimensions]);
        }
    },
    
    /**
     * @description Returns the largest width and height of any layers (does not have to be from same layer)
     * @return {Object} The width and height of the largest layer
     * 
     */
    getMaxDimensions: function () {
        return this._maxLayerDimensions;
    },

    /**
     * @description Removes a layer
     * @param {string} The id of the layer to remove
     */
    removeLayer: function (id) {
        var type  = id.split("-")[0],
            index = this.indexOf(id), 
            layer = this._layers[index];
        
        layer.domNode.remove();
        this._layers = $.grep(this._layers, function (e, i) {
            return (e.id !== layer.id);
        });
        layer = null;
        
        this.refreshMaxDimensions(type);
    },
    
    /**
     * @description Iterates through layers
     */
    each: function (fn) {
        $.each(this._layers, fn);
    },
    
    /**
     * @description Returns a JSON representation of the layers currently being displayed
     */
    toJSON: function () {
        var layers = [];
        
        $.each(this._layers, function () {
            layers.push(this.toJSON());
        });
        
        return layers;       
    }
});
/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 * @fileOverview Handles event queries, data formatting, and storage
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, window, LayerManager, EventType, EventFeatureRecognitionMethod, Event,
  EventTimeline, EventTree, getUTCTimestamp */

"use strict";

var EventManager = Class.extend({
    /**
     * Class to manage event queries and data storage.<br><br>
     *
     * Creates a class which queries the HEK API for event data as the
     * application date and time step changes.  This data is stored in
     * the EventType, EventFeatureRecognitionMethod, and Event classes.
     * Queries are optimized to minimize first the number of queries and
     * second the time window/filesize.<br><br>
     *
     * @constructs
     */
    init: function (eventGlossary, date) {
        var visState, scale;

        this._eventLayers    = [];
        this._events         = [];
        this._eventMarkers   = [];
        this._eventTypes     = {};
        this._treeContainer  = $("#eventJSTree");
        this._jsTreeData     = [];
        this._date           = date;
        this._eventLabelsVis = Helioviewer.userSettings.get("state.eventLabels");
        this._eventGlossary  = eventGlossary;

        scale = new ImageScale();

        $('<div id="event-container"></div>').appendTo("#moving-container");

        visState = Helioviewer.userSettings.get("state.eventLayerVisible");
        if ( typeof visState == 'undefined') {
            Helioviewer.userSettings.set("state.eventLayerVisible", true);
            visState = true;
        }

        if ( visState === false && $("#event-container").css('display') != 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }
        else if ( visState === true && $("#event-container").css('display') == 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }

        // Populate event_type/frm_name checkbox hierarchy with placeholder data
        // (important in case the JSON event cache is missing and would take
        //  a while to re-generate.)
        this._queryDefaultEventTypes();

        // Populate event_type/frm_name checkbox hierarchy with actual data
        this._queryEventFRMs();

        // Set up javascript event handlers
        $(document).bind("fetch-eventFRMs", $.proxy(this._queryEventFRMs, this));
        $(document).bind("toggle-events", $.proxy(this._toggleEvents, this));
        $(document).bind('toggle-event-labels',  $.proxy(this.toggleEventLabels, this));
    },

    reinit: function(date) {
        var visState;

        $("#event-container").remove();
        $('<div id="event-container"></div>').appendTo("#moving-container");

        visState = Helioviewer.userSettings.get("state.eventLayerVisible");
        if ( typeof visState == 'undefined') {
            Helioviewer.userSettings.set("state.eventLayerVisible", true);
            visState = true;
        }

        if ( visState === false && $("#event-container").css('display') != 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }
        else if ( visState === true && $("#event-container").css('display') == 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }


        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._eventTypes    = {};
        this._jsTreeData    = [];
        this._date          = date;

        this._queryEventFRMs();
    },

    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    _queryDefaultEventTypes: function () {
        var params = {
            "action"     : "getDefaultEventTypes"
        };
        $.get(Helioviewer.api, params, $.proxy(this._parseEventFRMs, this), "json");
    },

    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    _queryEventFRMs: function () {
        if (this._events.length == 0 ) {
            var params = {
                "action"     : "getEventFRMs",
                "startTime"  : new Date(this._date.getTime()).toISOString(),
                "ar_filter"  : true
            };
            $.get(Helioviewer.api, params, $.proxy(this._parseEventFRMs, this), "json");
        }
    },

    /**
     * Handles data returned from _queryEventFRMs, parsing the HEK search and
     * creating the EventTypes and EventFeatureRecognitionMethods from the JSON
     * data and then calling generateTreeData to build the jsTree.
     */
    _parseEventFRMs: function (result) {
        var self = this, domNode, eventAbbr, settings;

        $("#event-container").empty();

        self._eventTypes = {};
        $.each(result, function (eventType, eventFRMs) {
            eventAbbr = eventType.split('/');
            eventAbbr = eventAbbr[1];

            // Create and store an EventType
            self._eventTypes[eventAbbr] = new EventType(eventAbbr);

            // Process event FRMs
            $.each(eventFRMs, function (frmName, eventFRM) {
                self._eventTypes[eventAbbr]._eventFRMs[frmName]
                    = new EventFeatureRecognitionMethod(frmName, self.eventGlossary);

                domNode = '<div class="event-layer" id="'
                        + eventAbbr + '__' + frmName.replace(/ /g,'_')
                        + '" style="position: absolute;">';

                self._eventTypes[eventAbbr]._eventFRMs[frmName].setDomNode(
                    $(domNode).appendTo("#event-container") );
            });
        });

        this._generateTreeData(result);

        // Fetch events for any selected event_type/frm_name pairs
        this._queryEvents();
    },

    /**
     * Queries event data from API
     *
     */
    _queryEvents: function () {
        var params;

        params = {
            "action"     : "getEvents",
            "startTime"  : new Date(this._date.getTime()).toISOString(),
            "eventType"  : '**'
        };
        $.get(Helioviewer.api, params, $.proxy(this._parseEvents, this), "json");
    },

    /**
     * Save data returned from _queryEvents
     */
    _parseEvents: function (result) {
        var eventMarker, self=this, parentDomNode, eventGlossary;

        eventGlossary = this._eventGlossary;

        $.each( this._eventMarkers, function(i, eventMarker) {
            eventMarker.remove();
        });
        this._eventMarkers = [];
        this._events = result;

        $.each( this._events, function(i, event) {
            if ( typeof self._eventTypes[event['event_type']] != 'undefined' ) {
                self._eventMarkers.push(
                    new EventMarker(eventGlossary,
                        self._eventTypes[event['event_type']]._eventFRMs[event['frm_name']],
                        event, i+1)
                );
            }
        });

        this._toggleEvents();
    },

    /**
     * Generates jsTree structure from HEK search data and then constructs
     * a new tree if one does not exist, or reloads the existing one if
     * it does.
     *
     */
    _generateTreeData: function (data) {

        var self = this, obj, index=0, event_type_arr, type_count=0, count_str;

        // Re-initialize _jsTreeData in case it contains old values
        self._jsTreeData = [];

        $.each(data, function (event_type, event_type_obj) {

            // Split event_type into a text label and an abbreviation
            event_type_arr = event_type.split('/');

            // Remove trailing space from "concept" property, if necessary
            if (event_type_arr[0].charAt(event_type_arr[0].length-1) == " ") {
                event_type_arr[0] = event_type_arr[0].slice(0,-1);
            }

            // Pluralize event type text label
            // TODO move this to a generic helper function
            switch (event_type_arr[0].charAt(event_type_arr[0].length-1)) {
                case 'x':
                    event_type_arr[0] += 'es';
                    break;
                case 'y':
                    event_type_arr[0] = event_type_arr[0].slice(0,-1) + 'ies';
                    break;
                default:
                    event_type_arr[0] += 's';
            }

            obj = Object();
            obj['data']     = event_type_arr[0];
            obj['attr']     = { 'id' : event_type_arr[1] };
            obj['state']    = 'open';
            obj['children'] = [];

            self._jsTreeData.push(obj);

            type_count = 0;
            $.each(event_type_obj, function(frm_name, frm_obj) {
                type_count += frm_obj['count'];

                count_str = '';
                if ( frm_obj['count'] > 0 ) {
                    count_str = " ("+frm_obj['count']+")";
                }
                self._jsTreeData[index].children.push(
                    {
                        'data': frm_name+count_str,
                        'attr':
                            {
                                'id': event_type_arr[1]
                                    + '--'
                                    + self._escapeInvalidCssChars(frm_name)
                            }
                    }
                );
            });

            count_str = '';
            if ( type_count > 0 ) {
                count_str = " ("+type_count+")";
            }
            obj['data'] = obj['data']+count_str;

            index++;
        });


        // Create a new EventTree object only if one hasn't already been created
        if (!self._eventTree) {
            self._eventTree = new EventTree(this._jsTreeData, this._treeContainer);
        }

        self._eventTree.reload(this._jsTreeData);
    },

    _escapeInvalidCssChars: function (selector) {
        selector = selector.replace(/ /g, "_");
        selector = selector.replace(/([\+\.\(\)])/g, '\\$1');

        return selector;
    },

    /**
     * Queries for new tree structure data and events.
     *
     */
    updateRequestTime: function () {
        var managerStartDate, managerEndDate, eventStartDate, eventEndDate, self = this;

        this.reinit(new Date($("#date").val().replace(/\//g,"-") +"T"+ $("#time").val()+"Z"));
    },


    /**
     * @description Add a new event layer
     */
    addEventLayer: function (eventLayer) {
        this._eventLayers.push(eventLayer);
    },

    /**
     * @description Gets the number of event layers currently loaded
     * @return {Integer} Number of event layers present.
     */
    size: function () {
        return this._eventLayers.length;
    },

    /**
     * Returns the index of the given layer if it exists, and -1 otherwise
     */
    indexOf: function (id) {
        var index = -1;

        $.each(this._eventLayers, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });

        return index;
    },

    /**
     * @description Iterates through event layers
     */
    each: function (fn) {
        $.each(this._eventLayers, fn);
    },

    /**
     * @description Returns a JSON representation of the event layers currently being displayed
     */
    toJSON: function () {
        var eventLayers = [];

        $.each(this._eventLayers, function () {
            eventLayers.push(this.toJSON());
        });

        return eventLayers;
    },

    _toggleEvents: function (event) {
        var newState, checkedEventTypes = [], checkedFRMs = {}, self = this;

        newState = Helioviewer.userSettings.get("state.eventLayers");

        // Populate checkedEventTypes and checkedFRMs to make it easier to
        // compare the state of the checkbox hierarchy with the all stored
        // event type / frm DOM nodes.
        $.each( newState, function(i, checkedTypeObj) {
            checkedEventTypes.push(checkedTypeObj['event_type']);

            checkedFRMs[checkedTypeObj['event_type']] = [];
            $.each ( checkedTypeObj['frms'], function(j, frmName) {
                checkedFRMs[checkedTypeObj['event_type']].push(frmName);
            });
        });

        $.each( this._eventTypes, function(eventTypeName, eventTypeObj) {
            $.each( eventTypeObj._eventFRMs, function(frmName, frmObj) {

                // eventTypeName not found in newState, so this FRMs can't be checked
                // so .hide() this FRM's event layer
                if ( $.inArray(eventTypeName, checkedEventTypes) == -1 ) {
                    self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.hide();
                }
                else {
                    // eventTypeName/frmName pair is checked
                    // so .show() this FRM's event layer
                    if ( checkedFRMs[eventTypeName][0] == 'all' ||
                          $.inArray(frmName.replace(/ /g,'_'), checkedFRMs[eventTypeName]) != -1 ) {

                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.show();
                    }
                    // eventTypeName/frmName pair is NOT checked
                    // so .hide() this FRM's event layer
                    else {
                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.hide();
                    }
                }
            });
        });

        this.eventLabels();
    },

    toggleEventLabels: function (event, labelsBtn) {

        if (typeof labelsBtn == 'undefined') {
            labelsBtn = $('span[id^="labelsBtn-event-layer-"]');
        }

        if ( this._eventLabelsVis ) {
            $(document).trigger('toggle-event-label-off');
            labelsBtn.addClass('hidden');
        }
        else {
            $(document).trigger('toggle-event-label-on');
            labelsBtn.removeClass('hidden');
        }

        this._eventLabelsVis = !this._eventLabelsVis;
        return true;
    },

    eventLabels: function (event) {
        this._eventLabelsVis = Helioviewer.userSettings.get("state.eventLabels");

        if ( this._eventLabelsVis ) {
            $(document).trigger('toggle-event-label-on');
        }
        else {
            $(document).trigger('toggle-event-label-off');
        }

        return true;
    }

});
/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventType = Class.extend({

    init: function (name) {
        this._name = name;
        this._eventFRMs = {};
        this._queried = false;
    },

    getEventFRMs: function () {
        return this._eventFRMs;
    },

    getName: function () {
        return this._name;
    },

    addFRM: function (frm) {
        this._eventFRMs[frm._name] = frm;
    },

    isQueried: function (startTime, endTime) {
        var typeIsQueried = true;
        $.each(this._eventFRMs, function (frmName, FRM) {
            if (!FRM.isQueried(startTime, endTime)) {
                typeIsQueried = false;
                return false;
            }
        });
        return typeIsQueried;
    }
});
/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Jonathan Harper
 * @fileOverview TO BE ADDED
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventTree = Class.extend({

    init: function (data, container) {
        this._container = container;
        this._build(data);

        $(document).bind("toggle-checkboxes", $.proxy(this.toggle_checkboxes, this));
        $(document).bind("toggle-checkboxes-to-state", $.proxy(this.toggle_checkboxes_state, this));
    },

    destroy: function (data) {
        this._container.empty();
    },

    reload: function (newData) {
        this.destroy();
        this._build(newData);
    },

    close_all: function () {
        this._container.jstree("close_all",null,true);
    },

    open_all: function () {
        this._container.jstree("open_all",null,true);
    },

    toggle_checkboxes: function () {
        var numChecked;
        numChecked = Helioviewer.userSettings.get("state.eventLayers").length;
        if ( numChecked > 0 ) {
            this._container.jstree("uncheck_all",null,true);
        }
        else {
            this._container.jstree("check_all",null,true);
            // Unbind event handler that normally triggers when checkboxes are checked/unchecked
            // because we're about to do that a lot
            this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

            $(document).trigger("fetch-eventFRMs");

            // Bind event handler that triggers whenever checkboxes are checked/unchecked
            this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
        }

    },

    toggle_checkboxes_state: function (e, toState) {
        if (toState == 'off') {
            this._container.jstree("uncheck_all",null,true);
        }
        else if (toState == 'on') {
            this._container.jstree("check_all",null,true);
        }
        else {
            this.toggle_checkboxes();
            return;
        }

        // Unbind event handler that normally triggers when checkboxes are checked/unchecked
        // because we're about to do that a lot
        this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

        $(document).trigger("fetch-eventFRMs");

        // Bind event handler that triggers whenever checkboxes are checked/unchecked
        this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
    },

    jstreeFunc: function (name, args) {
        this._container.jstree(name, args);
    },

    _build: function (jsTreeData) {
        var self = this, saved, node;

        this._container.jstree({
            "json_data" : { "data": jsTreeData },
            "themes"    : { "theme":"default", "dots":true, "icons":false },
            "plugins"   : [ "json_data", "themes", "ui", "checkbox" ],
        });

        // Bind an event handler to each row that will trigger on hover
        $.each(jsTreeData, function(index, event_type) {

            $('#'+event_type['attr'].id+' a').hover($.proxy(self.hoverOn,this), $.proxy(self.hoverOff,this));

            // Dim rows that don't have associated features/events
            if ( event_type.children.length == 0 ) {
                $('#'+event_type['attr'].id).css({'opacity':'0.5'});
            }

            $.each(event_type['children'], function(j, frm) {
                $('#'+self._escapeInvalidJQueryChars(frm['attr'].id)+' a').hover($.proxy(self.hoverOnFRM,this), $.proxy(self.hoverOffFRM,this));
            });
        });


        // Unbind event handler that normally triggers when checkboxes are checked/unchecked
        // because we're about to do that a lot
        this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

        // Loop over saved eventLayer state, checking the appropriate checkboxes to match.
        saved = Helioviewer.userSettings.get("state.eventLayers");
        $.each(saved, function(i,eventLayer) {
            if (eventLayer.frms[0] == 'all') {
                node = "#"+eventLayer.event_type;
                if ( $(node).length != 0 ) {
                    self.jstreeFunc("check_node", node);
                }
            }
            else {
                $.each(eventLayer.frms, function(j,frm) {
                    node = "#"+eventLayer.event_type+"--"+frm;
                    if ( $(node).length != 0 ) {
                        self.jstreeFunc("check_node", node);
                    }
                });
            }
        });

        // Re-bind event handler that triggers whenever checkboxes are checked/unchecked
        this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
        $(document).trigger("change_state.jstree", this);
    },

    _escapeInvalidJQueryChars: function (selector) {
        // Plus Sign '+', Period/Dot '.', Parentheses '(', ')'
        selector = selector.replace(/(\+)/g, '\\\\$1');
        selector = selector.replace(/(\.)/g, '\\\\$1');
        selector = selector.replace(/(\()/g, '\\\\$1');
        selector = selector.replace(/(\))/g, '\\\\$1');

        return selector;
    },


    _treeChangedState: function (event, data) {
        var checked = [], event_types = [], index;

        this._container.jstree("get_checked",null,false).each(
            function () {
                var eventLayer, event_type, frm;
                event_type = this.id.split("--");
                if (event_type.length > 1) {
                    frm = event_type[1];
                }
                else {
                    frm = 'all';
                }
                event_type = event_type[0];

                // Determine if an entry for this event type already exists
                index = $.inArray(event_type, event_types)

                // New event type to add to array
                if ( index == -1 ) {
                    eventLayer = { 'event_type' : event_type,
                                         'frms' : [frm],
                                         'open' : 1};
                    checked.push(eventLayer);
                    event_types.push(event_type);
                }
                // Append FRM to existing event type in array
                else {
                    checked[index].frms.push(frm);
                }
            }
        );

        // Save eventLayers state to localStorage
        Helioviewer.userSettings.set("state.eventLayers", checked);

        // Show/Hide events to match new state of the checkboxes
        $(document).trigger("toggle-events");
    },

    hoverOn: function (event) {
        var emphasisNodes, eventLayerNodes, found;
        emphasisNodes  = $("[id^="+this['attr'].id+"__]");
        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {
            found = false;
            $.each( emphasisNodes, function(j, emphObj) {
                if ( $(obj)[0].id == $(emphObj)[0].id ) {
                    found = true;
                }
            });

            if ( found === false && emphasisNodes.length > 0 ) {
                $(obj).css({'opacity':'0.20'});
            }
            else {
                $(obj).css({'opacity':'1.00'});
            }
        });
    },

    hoverOff: function (event) {
        $("#event-container > div.event-layer").css({'opacity':'1.0'});
    },

    hoverOnFRM: function (event) {
        var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found;
        eventTypeAbbr = this['attr'].id.split("--")[0];

        emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
        deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {

            if ( $(obj)[0].id == $(emphasisNode)[0].id ) {
                $(obj).css({'opacity':'1.00'});
            }
            else {
                found = false;
                $.each( deEmphasisNodes, function(j, deEmphObj) {
                    if ( $(obj)[0].id == $(deEmphObj)[0].id ) {
                        found = true;
                    }
                });
                if ( found === true ) {
                    //$(obj).css({'opacity':'0.50'});
                    $(obj).css({'opacity':'0.20'});
                }
                else {
                    $(obj).css({'opacity':'0.20'});
                }
            }
        });

    },

    hoverOffFRM: function (event) {
        var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found;
        eventTypeAbbr = this['attr'].id.split("--")[0];

        emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
        deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {

            if ( $(obj)[0].id == $(emphasisNode)[0].id ) {
                $(obj).css({'opacity':'1.0'});
            }
            else {
                found = false;
                $.each( deEmphasisNodes, function(j, deEmphObj) {
                    if ( $(obj)[0].id == $(deEmphObj)[0].id ) {
                        found = true;
                    }
                });
                if ( found === true ) {
                    //$(obj).css({'opacity':'0.50'});
                    $(obj).css({'opacity':'1.0'});
                }
                else {
                    $(obj).css({'opacity':'1.0'});
                }
            }
        });

    }
});
/**
 * EventFeatureRecognitionMethod Class Definition
 *
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, EventMarker */

"use strict";

var EventFeatureRecognitionMethod = Class.extend({

    init: function (name, eventGlossary) {
        this._events  = [];
        this._name    = name;
        this._visible = false;
        this.eventGlossary = eventGlossary;
    },

    getName: function () {
        return this._name;
    },

    setDomNode: function (domNode) {
        this.domNode = domNode;
    }
});
/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see EventManager
 * @requires EventManager
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, LayerManager, TileLayer, Layer, $ */
"use strict";
var EventLayerManager = EventManager.extend(
/** @lends EventLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new EventLayerManager instance
     */
    init: function (requestDate, defaultEventTypes, viewportScale, rsun,
                    savedEventLayers, urlEventLayers) {

        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._treeContainer = $("#eventJSTree");
        this._eventTypes    = {};
        this._jsTreeData    = [];

        if ( typeof date == 'undefined' ) {
            var date = requestDate;
        }
        this._date = date;

        this._requestDate      = requestDate;
        this.defaultEventTypes = defaultEventTypes;
        this.viewportScale     = viewportScale;


        $(document).bind("event-layer-finished-loading", $.proxy(this.updateMaxDimensions, this))
                   .bind("save-event-layers",            $.proxy(this.save, this))
                   .bind("add-new-event-layer",          $.proxy(this.addNewLayer, this))
                   .bind("remove-event-layer",           $.proxy(this._onLayerRemove, this));
    },

    /**
     * @description Updates the list of loaded event layers stored in
     *              localStorage and cookies
     */
    save: function () {
        var eventLayers = this.toJSON();
        Helioviewer.userSettings.set("state.eventLayers", eventLayers);
    },

    /**
     * Remove a specified layer
     */
    _onLayerRemove: function (event, id) {
        this.removeLayer(id);
    },

    getRequestDateAsISOString: function () {
        return this._requestDate.toISOString();
    }
});
/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, getUTCTimestamp */
"use strict";
var EventMarker = Class.extend(
    /** @lends EventMarker.prototype */
    {
    /**
     * @constructs
     * @description Creates an EventMarker
     * @param {Object} eventLayer EventLayer associated with the EventMarker
     * @param {JSON} event Event details
     */
    init: function (eventGlossary, parentFRM, event, zIndex) {
        $.extend(this, event);
        this.event = event;
        this.behindSun = false;
        this.parentFRM  = parentFRM;
        this._labelVisible = false;
        this._popupVisible = false;
        this._zIndex = zIndex;
        this._eventGlossary = eventGlossary;

        // Format LabelText (for mouse-over and "d")
        this.formatLabels();

        // Create DOM nodes for Event Regions and Event Markers
        this.createRegion(0);
        this.createMarker(zIndex);

        $(document).bind("replot-event-markers",   $.proxy(this.refresh, this));
        $(document).bind('toggle-event-label-on',  $.proxy(this.toggleEventLabel, this));
        $(document).bind('toggle-event-label-off', $.proxy(this.toggleEventLabel, this));
    },


    /**
     * @description Creates the marker and adds it to the viewport
     */
    createMarker: function (zIndex) {
        var markerURL;

        // Create event marker DOM node
        this.eventMarkerDomNode = $('<div/>');
        this.eventMarkerDomNode.attr({
            'class' : "event-marker"
        });
        this.pos = {
            x: ( this.hv_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale) -12,
            y: (-this.hv_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale) -38
        };
        markerURL = serverSettings['apiURL']+'/resources/images/eventMarkers/'+this.event_type.toUpperCase()+'@2x'+'.png';
        this.eventMarkerDomNode.css({
                         'left' :  this.pos.x + 'px',
                          'top' :  this.pos.y + 'px',
                      'z-index' :  zIndex,
             'background-image' : "url('"+markerURL+"')"
            // Additional styles found in events.css
        });

        if ( typeof this.parentFRM != 'undefined' ) {
            //if ( this.parentFRM._visible == false ) {
                //this.eventMarkerDomNode.hide();
            //}
            this.parentFRM.domNode.append(this.eventMarkerDomNode);
        }
        else {
            //console.warn('this.parentFRM does not exist!');
            //console.warn([this.event_type, this.frm_name]);
            return;
        }

        this.eventMarkerDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
        this.eventMarkerDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
        this.eventMarkerDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
    },


    /**
     * @description Creates the marker and adds it to the viewport
     */
    createRegion: function (zIndex) {
        if ( this.hpc_boundcc != '' ) {
            var regionURL;

            // Create event region DOM node
            this.eventRegionDomNode = $('<div/>');
            this.eventRegionDomNode.attr({
                'class' : "event-region"
            });
            this.region_scaled = {
                width:  this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale ),
                height: this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )
            }
            this.region_pos = {
                x: ( this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale),
                y: ( this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale)
            }
            this.eventRegionDomNode.css({
                             'left' :  this.region_pos.x + 'px',
                              'top' :  this.region_pos.y + 'px',
                          'z-index' :  zIndex,
                 'background-image' : "url('"+serverSettings['apiURL']
                                          + "/" + this.hv_poly_url + "')",
                  'background-size' :  this.region_scaled.width  + 'px ' + this.region_scaled.height + 'px',
                            'width' :  this.region_scaled.width  + 'px',
                           'height' :  this.region_scaled.height + 'px'
                // Additional styles found in events.css
            });
            if ( typeof this.parentFRM != 'undefined' ) {
                this.parentFRM.domNode.append(this.eventRegionDomNode);
            }

            this.eventRegionDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
            this.eventRegionDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
            this.eventRegionDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
        }
    },


    /**
     * @description Choses the text to display in the details label based on the type of event
     * @param {String} eventType The type of event for which a label is being created
     */
    formatLabels: function () {
        var self = this;

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            this.labelText = "";
            $.each( this.hv_labels_formatted, function (key,value) {
                self.labelText += value + "<br/>\n";
            });
        }
        else {
            this.labelText = this.concept;
        }
    },


    /**
     * @description Removes the Event Marker (and Event Region)
     */
    remove: function () {
        this.eventMarkerDomNode.qtip("destroy");
        this.eventMarkerDomNode.unbind();
        this.eventMarkerDomNode.remove();

        if ( this.hpc_boundcc != '' ) {
            this.eventRegionDomNode.qtip("destroy");
            this.eventRegionDomNode.unbind();
            this.eventRegionDomNode.remove();
        }
    },

     /**
      * @description Re-positions event markers/regions, re-scales event regions
      */
    refresh: function () {

        // Re-position Event Marker pin
        this.pos = {
            x: ( this.hv_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale) -12,
            y: (-this.hv_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale) -38
        };
        this.eventMarkerDomNode.css({
            'left': this.pos.x + 'px',
            'top' : this.pos.y + 'px'
        });

        // Re-position and re-scale Event Region polygon
        if ( this.hpc_boundcc != '' ) {
            this.region_scaled = {
                width: this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale /   Helioviewer.userSettings.settings.state.imageScale ),
                height: this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale /   Helioviewer.userSettings.settings.state.imageScale )
            }
            this.region_pos = {
                x: ( this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale),
                y: ( this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale)
            }
            this.eventRegionDomNode.css({
                'left': this.region_pos.x + 'px',
                'top' : this.region_pos.y + 'px'
            });
            this.eventRegionDomNode.css({
                          'width' : this.region_scaled.width,
                         'height' : this.region_scaled.height,
                'background-size' : this.region_scaled.width + 'px ' + this.region_scaled.height + 'px'
                // Additional styles found in events.css
            });
        }

        // Re-position Event Popup
        if ( this._popupVisible ) {
            this.popup_pos = {
                x: ( this.hv_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale) +12,
                y: (-this.hv_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale) -38
            };
            if ( this.hv_hpc_x_final > 400 ) {
                this.popup_pos.x -= this.eventPopupDomNode.width() + 38;
            }
            this.eventPopupDomNode.css({
                'left': this.popup_pos.x + 'px',
                'top' : this.popup_pos.y + 'px'
            });
        }
    },

    setVisibility: function (visible) {
        if (visible) {
            this.eventRegionDomNode.show();
            this.eventMarkerDomNode.show();
        }
        else {
            this.eventRegionDomNode.hide();
            this.eventMarkerDomNode.hide();
        }
    },

    toggleEventLabel: function (event) {

        if ( !this.label ) {
            this.label = $('<div/>');
            this.label.hide();
            this.label.attr({
                'class' : "event-label"
                // Styles found in events.css
            });
            this.label.html(this.labelText);
            this.label.click(function(event){
                event.stopImmediatePropagation();
            });
            this.label.mousedown(function(event){
                event.stopImmediatePropagation();
            });
            this.label.dblclick(function(event){
                event.stopImmediatePropagation();
            });
            this.label.enableSelection();

            this.eventMarkerDomNode.append(this.label);
        }

        if ( event.type == 'toggle-event-label-on' ) {
            this.eventMarkerDomNode.css('zIndex', '997');
            this._labelVisible = true;
            document.getSelection().removeAllRanges();
            this.label.show();
            Helioviewer.userSettings.set("state.eventLabels", true);
        }
        else if ( event.type == 'toggle-event-label-off' ) {
            this._labelVisible = false;
            this.label.hide();
            this.eventMarkerDomNode.css('zIndex', this._zIndex);
            document.getSelection().removeAllRanges();
            Helioviewer.userSettings.set("state.eventLabels", false);
        }
        else if ( event.type == 'mouseenter' ) {
            this.eventMarkerDomNode.css('zIndex', '997');
            this.label.addClass("event-label-hover");
            this.label.show();
        }
        else if ( event.type == 'mouseleave' ) {
            if ( !this._labelVisible) {
                this.label.hide();
            }
            this.label.removeClass("event-label-hover");
            this.eventMarkerDomNode.css('zIndex', this._zIndex);
        }

        return true;
    },

    toggleEventPopUp: function () {
        if ( !this.eventPopupDomNode ) {
            this._populatePopup();
        }

        if ( this._popupVisible ) {
            this.eventPopupDomNode.hide();
            this.eventMarkerDomNode.css('z-index', this._zIndex);
        }
        else {
            this.popup_pos = {
                x: ( this.hv_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale) +12,
                y: (-this.hv_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale) -38
            };
            if ( this.hv_hpc_x_final > 400 ) {
                this.popup_pos.x -= this.eventPopupDomNode.width() + 38;
            }
            this.eventPopupDomNode.css({
                   'left' :  this.popup_pos.x + 'px',
                    'top' :  this.popup_pos.y + 'px',
                'z-index' : '1000'
                // Additional styles found in events.css
            });
            this.eventMarkerDomNode.css('z-index', '998');
            this.eventPopupDomNode.show();
        }

        this._popupVisible = !this._popupVisible;
        return true;
    },


    /**
     * @description Displays the Image meta information and properties associated with a given image
     *
     */
    _showEventInfoDialog: function () {
        var params, dtype, split, self = this, dialog = $("#event-info-dialog");

        this._buildEventInfoDialog();

        // Format numbers for human readability
        $('.event-header-value.integer').number(true);
        $('.event-header-value.float').each( function (i, num) {
            split = num.innerHTML.split('.')
            if ( typeof split[1] != 'undefined' ) {
                num.innerHTML = $.number(num.innerHTML, split[1].length);
            }
            else {
                num.innerHTML = $.number(num.innerHTML);
            }

        });
    },


    /**
     * @description
     *
     */
    _buildEventInfoDialog: function () {
        var dialog, sortBtn, tabs, html='', tag, json, headingText, self=this;


        // Format results
        dialog =  $("<div id='event-info-dialog' class='event-info-dialog' />");

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            headingText = this.event_type+': ' + this.hv_labels_formatted[Object.keys(this.hv_labels_formatted)[0]];
        }
        else {
            headingText = this.concept;
        }

        // Header Tabs
        html += '<div class="event-info-dialog-menu">'
             +     '<a class="show-tags-btn event-type selected">'+this.concept+'</a>'
             +     '<a class="show-tags-btn obs">Observation</a>'
             +     '<a class="show-tags-btn frm">Recognition Method</a>'
             +     '<a class="show-tags-btn ref">References</a>'
             +     '<a class="show-tags-btn all right">All</a>'
             + '</div>';

        // Tab contents
        html += '<div class="event-header event-type" style="height: 400px; overflow: auto;">'
             +   this._generateEventKeywordsSection(this.event_type) + '</div>'
             +  '<div class="event-header obs" style="display: none; height: 400px; overflow: auto;">'
             +   this._generateEventKeywordsSection("obs") + '</div>'
             +  '<div class="event-header frm" style="display: none; height: 400px; overflow: auto;">'
             +   this._generateEventKeywordsSection("frm") + '</div>'
             +  '<div class="event-header ref" style="display: none; height: 400px; overflow: auto;">'
             +   this._generateEventKeywordsSection("ref") + '</div>'
             +  '<div class="event-header all" style="display: none; height: 400px; overflow: auto;">'
             +   this._generateEventKeywordsSection("all") + '</div>';

        dialog.append(html).appendTo("body").dialog({
            autoOpen : true,
            title    : headingText,
            minWidth : 746,
            width    : 746,
            maxWidth : 746,
            height   : 550,
            draggable: true,
            resizable: false,
            buttons  : [ {  text  : 'Hide Empty Rows',
                          'class' : 'toggle_empty',
                           click  : function () {

                        var text = $(this).parent().find('.toggle_empty span.ui-button-text');

                        $.each( $(this).find("div.empty"), function (index,node) {
                            if ( $(node).css('display') == 'none' ) {
                                $(node).css('display', 'block');
                            }
                            else {
                                $(node).css('display', 'none');
                            }
                        });

                        if ( text.html() == 'Hide Empty Rows' ) {
                            text.html('Show Empty Rows');
                        }
                        else {
                            text.html('Hide Empty Rows');
                        }
                }} ],
            create   : function (event, ui) {

                dialog.css('overflow', 'hidden');

                var eventTypeTab  = dialog.find(".show-tags-btn.event-type"),
                    obsTab        = dialog.find(".show-tags-btn.obs"),
                    frmTab        = dialog.find(".show-tags-btn.frm"),
                    refTab        = dialog.find(".show-tags-btn.ref"),
                    allTab        = dialog.find(".show-tags-btn.all");


                eventTypeTab.click( function() {
                    eventTypeTab.addClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").show();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                obsTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.addClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").show();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                frmTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.addClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").show();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                refTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.addClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").show();
                    dialog.find(".event-header.all").hide();
                });

                allTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.addClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").show();
                });
            }
        });
    },


    _generateEventKeywordsSection: function (tab) {
        var formatted, tag, tags = [], lookup, attr, domClass, icon, list= {}, self=this;

        if ( tab == 'obs' ) {
            $.each( this.event, function (key, value) {
                if ( key.substring(0, 4) == 'obs_' ) {

                    lookup = self._eventGlossary[key];
                    if ( typeof lookup != 'undefined' ) {
                        list[key] = lookup;
                        list[key]["value"] = value;
                    }
                    else {
                        list[key] = { "value" : value };
                    }
                }
            });
        }
        else if ( tab == 'frm' ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 4) == 'frm_' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else if ( tab == 'ref' ) {
                $.each( this.event['refs'], function (index, obj) {
                    lookup = self._eventGlossary[obj['ref_name']];
                    if ( typeof lookup != 'undefined' ) {
                        list[obj['ref_name']] = lookup;
                        list[obj['ref_name']]["value"] = obj['ref_url'];
                    }
                    else {
                        list[obj['ref_name']] = { "value" : obj['ref_url'] };
                    }
                });
        }
        else if ( tab == 'all' ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 3) != 'hv_' && key != 'refs' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else if ( tab.length == 2 ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 3) == tab.toLowerCase()+'_'
                      || key.substring(0, 5) == 'event'
                      || key == 'concept'
                      || key.substring(0,3) == 'kb_' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else {
            console.warn('No logic for unexpected tab "'+tab+'".');
        }

        // Format the output
        formatted = '<div>';
        $.each(list, function (key, obj) {
            attr = '';
            domClass = '';
            icon = '';

            if ( tab != 'all' && typeof obj['hv_label'] != 'undefined' && obj['hv_label'] !== null ) {
                key = obj['hv_label'];
            }

            if ( typeof obj['hek_desc'] != 'undefined' && obj['hek_desc'] !== null  ) {
                attr += ' title="' + obj['hek_desc'] + '"';
            }


            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined'
                && (obj['hv_type'] == 'url' || obj['hv_type'] == 'image_url') ) {

                if ( obj.value.indexOf('://') == -1) {
                    obj.value = 'http://'+obj.value;
                }
                obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
            }


            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'email_or_url' ) {

                if ( obj.value.indexOf('://') == -1 && obj.value.indexOf('/')    !== -1
                    && obj.value.indexOf('@') == -1 && obj.value.indexOf(' at ')  == -1 ) {

                    obj.value = 'http://'+obj.value;
                    obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
                }
                else if ( obj.value.indexOf('://') !== -1 ) {
                    obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
                }
                else if ( obj.value.indexOf('@') > -1 && obj.value.indexOf(' ') == -1 ) {
                    obj.value = '<a href="mailto:'+obj.value+'">'+obj.value+'</a>';
                }
            }

            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined'
                && obj['hv_type'] == 'thumbnail_url' ) {

                if ( obj.value.indexOf('://') == -1 ) {
                    obj.value = 'http://'+obj.value;
                }
                obj.value = '<img src="'+obj.value+'"/>';
            }

            if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'date' ) {
                domClass += ' date';
            }

            if ( typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'float' ) {
                domClass += ' float';
            }

            if ( typeof obj['hek_type'] != 'undefined'
                && (obj['hek_type'] == 'integer' || obj['hek_type'] == 'long') ) {

                domClass += ' integer';
            }

            if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'boolean' ) {
                domClass += ' boolean';
                if ( obj.value.toUpperCase() == "T" || obj.value == 1
                    || obj.value.toLowerCase() == 'true' ) {

                    domClass += ' true';
                }
                if ( obj.value.toUpperCase() == "F" || obj.value == 0
                    || obj.value.toLowerCase() == 'false') {

                    domClass += ' false';
                }
            }

            if (  typeof obj['hv_type']  != 'undefined' && obj['hv_type'] != 'date'
               && typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'string' ) {

                domClass += ' string';
            }


            if (  typeof obj.value === 'undefined' || obj.value === null
               || obj.value === 'null' || obj.value === '' ) {

                tag = '<div class="empty"><span class="event-header-tag empty"'+attr+'>' + key + ': </span>' +
                      '<span class="event-header-value empty">' + obj.value + '</span></div>';
            }
            else {
                tag = '<div><span class="event-header-tag"'+attr+'>' + key + ': </span>' +
                      '<span class="event-header-value'+domClass+'">' + obj.value + '</span></div>';
            }
            tags.push(tag);
            formatted += tag;
        });
        formatted += '</div>';

        return formatted;
    },


    _populatePopup: function () {
        var content = '', headingText = '', self = this;

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            headingText = this.event_type+': ' + this.hv_labels_formatted[Object.keys(this.hv_labels_formatted)[0]];
        }
        else {
            headingText = this.concept;
        }

        content     += '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>'+"\n"
                    +  '<h1>'+headingText+'</h1>'+"\n";

        if ( this.event_peaktime != null && this.event_peaktime != '') {
            content += '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label">Peak Time:</div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value">'+this.event_peaktime.replace('T',' ')+'</div><div class="ui-icon ui-icon-arrowstop-1-n" title="Jump to Event Peak Time"></div></div>'+"\n"
                    +  '</div>'+"\n";
        }
        content     += '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label">Start Time: </div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value">'+this.event_starttime.replace('T',' ')+'</div><div class="ui-icon ui-icon-arrowstop-1-w" title="Jump to Event Start Time"></div></div>'+"\n"
                    +  '</div>'+"\n"
                    +  '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label">End Time: </div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value">'+this.event_endtime.replace('T',' ')+'</div><div class="ui-icon ui-icon-arrowstop-1-e" title="Jump to Event End Time"></div>'+"\n"
                    +  '</div>'+"\n";

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            $.each( this.hv_labels_formatted, function (param, value) {
                content += '<div class="container">'+"\n"
                        +      "\t"+'<div class="param-container"><div class="param-label">'+param+': </div></div>'+"\n"
                        +      "\t"+'<div class="value-container"><div class="param-value">'+value+'</div></div>'+"\n"
                        +  '</div>'+"\n";
            });
        }

        content     += '<div class="btn-container text-btn">'+"\n"
                    +       "\t"+'<div class="ui-icon ui-icon-info btn event-info"></div><div class="btn-label btn event-info">View HEK data</div>'+"\n"
//                    +       "\t"+'<div class="ui-icon ui-icon-video btn event-movie"></div><div class="btn-label btn event-movie">Generate Movie</div>'+"\n"
                    +  '</div>'+"\n";


        this.eventPopupDomNode = $('<div/>');
        this.eventPopupDomNode.hide();
        this.eventPopupDomNode.attr({
            'class' : "event-popup"
        });

        this.eventPopupDomNode.html(content);

        // Event bindings
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-w").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.event_starttime+".000Z") );
        });
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-n").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.event_peaktime+".000Z") );
        });
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-e").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.event_endtime+".000Z") );
        });
        this.eventPopupDomNode.find(".event-movie").bind('click', function() {
            alert('Event-based movie generation not yet implemented.')
        });
        this.eventPopupDomNode.find(".btn.event-info").bind('click', $.proxy(this._showEventInfoDialog, this));
        this.eventPopupDomNode.find('.close-button').bind('click', $.proxy(this.toggleEventPopUp, this));
        this.eventPopupDomNode.bind("mousedown", function () { return false; });
        this.eventPopupDomNode.bind('dblclick', function () { return false; });
        this.eventPopupDomNode.draggable();

        // Allow text selection (prevent drag where text exists)
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value").enableSelection();

        this.parentFRM.domNode.append(this.eventPopupDomNode);
    }

});
/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see EventManager
 * @requires EventManager
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, LayerManager, TileLayer, Layer, $ */
"use strict";
var EventLayerManager = EventManager.extend(
/** @lends EventLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new EventLayerManager instance
     */
    init: function (requestDate, defaultEventTypes, viewportScale, rsun,
                    savedEventLayers, urlEventLayers) {

        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._treeContainer = $("#eventJSTree");
        this._eventTypes    = {};
        this._jsTreeData    = [];

        if ( typeof date == 'undefined' ) {
            var date = requestDate;
        }
        this._date = date;

        this._requestDate      = requestDate;
        this.defaultEventTypes = defaultEventTypes;
        this.viewportScale     = viewportScale;


        $(document).bind("event-layer-finished-loading", $.proxy(this.updateMaxDimensions, this))
                   .bind("save-event-layers",            $.proxy(this.save, this))
                   .bind("add-new-event-layer",          $.proxy(this.addNewLayer, this))
                   .bind("remove-event-layer",           $.proxy(this._onLayerRemove, this));
    },

    /**
     * @description Updates the list of loaded event layers stored in
     *              localStorage and cookies
     */
    save: function () {
        var eventLayers = this.toJSON();
        Helioviewer.userSettings.set("state.eventLayers", eventLayers);
    },

    /**
     * Remove a specified layer
     */
    _onLayerRemove: function (event, id) {
        this.removeLayer(id);
    },

    getRequestDateAsISOString: function () {
        return this._requestDate.toISOString();
    }
});
/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLayer,
    TileLoader, tileCoordinatesToArcseconds, Helioviewer */
"use strict";
var HelioviewerEventLayer = Class.extend(
    /** @lends HelioviewerEventLayer.prototype */
    {
    /**
     * @constructs
     * @description
     * @param {Object} viewport Viewport to place the events in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *      <b>type</b>        - The type of the layer (used by layer manager to differentiate event vs.
     *                           tile layers)<br>
     *      <b>tileSize</b>    - Tilesize to use<br>
     *      <b>source</b>      - Tile source ["database" | "filesystem"]<br>
     *      <b>opacity</b>     - Default opacity<br>
     * </div>
     */
    init: function (index, date, viewportScale, name, markersVisible, labelsVisible) {

        // Create a random id which can be used to link event layer with its corresponding event layer accordion entry
        this.id = "event-layer-" + new Date().getTime();

        $(document).trigger("create-event-layer-accordion-entry",
            [index, this.id, name, date, true, markersVisible, labelsVisible]
        );
    }
});
/**
 * @fileOverview Contains the class definition for a HelioviewerEventLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @see EventLayerManager, EventManager
 * @requires EventLayerManager
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, HelioviewerEventLayer, EventLayerManager, parseLayerString, $ */
"use strict";
var HelioviewerEventLayerManager = EventLayerManager.extend(
/** @lends HelioviewerEventLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (requestDate, defaultEventTypes, viewportScale, rsun,
                    savedEventLayers, urlEventLayers) {

        this._super(requestDate, defaultEventTypes, viewportScale, rsun,
                    savedEventLayers, urlEventLayers);

        this._loadStartingLayers(defaultEventTypes);
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {

        // Add the event layer
        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', true, true)
        );

        // Don't save the event layer here.  We're just adding the accordion stuff,
        // not checking checkboxes.  Differs from how tile layers are managed.
        /// this.save();
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var eventLayer, basicParams, self = this;

        // Add the event layer
        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', true, Helioviewer.userSettings.get("state.eventLabels"))
        );
    },

    /**
     * @description Generate a string of URIs for use by JHelioviewer
     */
    toURIString: function () {
        var str = "";

        $.each(this._eventLayers, function () {
            str += this.uri + ",";
        });

        // Remove trailing comma
        str = str.slice(0, -1);
        return str;
    }
});
/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Contains the definition for a Hierarchical or "Tree Select" class which links
 * several select form elements together based off a given tree structure such changes at any level automatically
 * determine valid options for select items at lower levels.
 */
/*jslint browser: true, evil: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, forin: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var TreeSelect = Class.extend(
    /** @lends TreeSelect.prototype */
    {
    /**
     * @description
     * @param {Object} 
     * @constructs 
     */ 
    init: function (selectIds, tree, initialChoices, callback) {
        this.selectIds     = selectIds;
        this.tree          = tree;
        this.callback      = callback;
        this.selected      = initialChoices;

        this._initSelectMenus();
        
        this._setupEventHandlers();
    },
    
    /**
     * @description Populates SELECT menus and selects initial choices
     */
    _initSelectMenus: function () {
        var self = this;
        
        // Load initial options into select menus
        this._updateSelectMenus(0);
        
        // Set initial choices in select menus
        $.each(this.selectIds, function (depth, id) {
            $(id + " > option").each(function (index, option) {
                if (option.value === self.selected[depth]) {
                    $(id).attr("selectedIndex", index);
                }
            });
        });
    },

    /**
     * @description Update the list of selected options
     * @param {Object} depth
     * @param {Object} newChoice
     */
    _updateSelected: function (depth, newChoice) {
        var nav, selectField, i;

        this.selected[depth] = newChoice;

        // Function to determine which field should be selected
        selectField = function (original, arr, depth) {
            if (original == null) {
                for (var item in arr) {
                    if (item == 'sourceId') {
                        item = null;
                    }
                    return item;
                }
            }
            else if (typeof arr == 'undefined' ||
                     typeof arr == 'number') {

                return null;
            }
            else if (original in arr) {
                return original;
            }
            for (var item in arr) {
                return item;
            }
        };

        // For each item below the selected parameter, preserve the value if
        // possible, otherwise use first available value
        nav = "this.tree";

        for (i = 0; i < this.selectIds.length; i += 1) {
            if (i > depth) {
                this.selected[i] = selectField(this.selected[i], eval(nav),
                                               depth);
            }
            if ( typeof this.selected[i] != 'undefined' ) {
                nav += '["' + this.selected[i] + '"]';
            }
        }

        this._updateSelectMenus(depth + 1);
    },

    /**
     * @description Updates the <SELECT> menus to show valid choices at
     *              each level based on chosen values from above levels.
     * @param {Object} startDepth
     */
    _updateSelectMenus: function (startDepth) {
        var select, name, label, uiLabels, maxIndex, i, nav, opt, self = this;

        maxIndex = this.selectIds.length;

        $.each(this.selectIds, function (depth, id) {

            if (depth >= startDepth) {
                select = $(id);

                // remove old choices
                select.empty();

                // navigate to current depth
                nav = "self.tree";
                for (i = 0; i < depth; i += 1) {
                    if ( self.selected[i] === null ) {
                        break;
                    }
                    nav += '["' + self.selected[i] + '"]';
                }

                label = $(id.replace('-select-','-label-'));

                if ( depth > maxIndex ) {
                    select.hide();
                    select.removeAttr('selectedIndex');
                    label.hide();
                    label.empty();
                }
                else if ( 'sourceId' in eval(nav) ) {
                    // Reached the end of the hierarchy
                    // Clear extra popup-menus
                    select.hide();
                    select.removeAttr('selectedIndex');
                    label.hide();
                    label.empty();

                    // Refresh non-hidden labels
                    uiLabels = eval(nav+"['uiLabels']");
                    $.each( uiLabels, function (i, obj) {
                        label = $(self.selectIds[i]
                                      .replace('-select-','-label-'));
                        label.html(obj['label']+':');
                    });

                    maxIndex = depth;
                }
                else {
                    // get choices
                    for (var choice in eval(nav)) {
                        opt = $("<option value='" + choice + "'>" +
                              choice.replace(/_/, "-") + "</option>");
                        select.append(opt);

                    }

                    // set selected value
                    name  = self.selected[depth];
                    if ( name !== null ) {
                        // escape any periods ('.') before using in a
                        // JQuery selector
                        name = name.replace('.','\\.');
                        select.find("option[value="+name+"]")
                              .attr("selected", true);
                    }
                    else {
                        select.find('option:first-child')
                              .attr("selected", true);
                        select.attr('selectedIndex',0);
                    }

                    label.show();
                    select.show();
                }
            }
        });
    },

    /**
     * @description Returns the value associated with the currently
     * selected leaf-node
     */
    _value: function () {
        var nav = "this.tree";

        $.each(this.selected, function (i, choice) {
            if ( choice === null || choice == 'sourceId' ) {
                return false;  // break out of $.each loop early
            }
            nav += '["' + choice + '"]';
        });
        return eval(nav);
    },

    /**
     * @description Sets up event-handlers for each form field
     */
    _setupEventHandlers: function () {
        var self = this;

        $.each(this.selectIds, function (i, id) {
            $(id).change(function (e) {
                if ( $(this).attr('value') != '' ) {
                    self._updateSelected(i, $(this).attr('value'));
                    self.callback(self._value());
                }
            });
        });
    }

});
/**
 * @author Jaclyn Beck
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 *
 * @fileoverview A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag
 *                 to select a subregion of the image in the viewport.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, helioviewer */
"use strict";
var ImageSelectTool = Class.extend(
    /** @lends ImageSelectTool.prototype */
    {
    /**
     * @constructs
     * Sets up an event handler for the select region button and finds the divs where
     * the fake transparent image will be inserted
     *
     */
    init: function () {
        this.active = false;
        this.vpDomNode    = $("#helioviewer-viewport");
        this.buttons      = $("#image-area-select-buttons");
        this.container    = $("#image-area-select-container");
        this.doneButton   = $("#done-selecting-image");
        this.cancelButton = $("#cancel-selecting-image");
        this.helpButton   = $("#help-selecting-image");

        this.vpButtons = $("#zoomControls, #center-button, #social-buttons, #mouse-coords");

        this._setupHelpDialog();

        this.x1 = null;
        this.x2 = null;
        this.y1 = null;
        this.y2 = null;

        // Handle image area select requests
        $(document).bind("enable-select-tool", $.proxy(this.enableAreaSelect, this));
    },

    /**
     * Activates the plugin or disables it if it is already active
     */
    enableAreaSelect: function (event, callbackSuccess, callbackCleanup) {
        var imgContainer, body = $("body");

        // If the user has already pushed the button but not done anything, this will turn the feature off.
        if (this.active) {
            this.cleanup(null, callbackCleanup);
        }

        // Otherwise, turn it on.
        else {

            // Disable keyboard shortcuts for fullscreen mode
            this.active = true;

            // Get viewport dimensions to make the transparent image with.
            this.width  = this.vpDomNode.width();
            this.height = this.vpDomNode.height();

            $('#hv-drawer-tab-left').hide();
            $('#message-console').hide();

            /*
            * Displays a temporary transparent image that spans the height and width of the viewport.
            * Necessary because the viewport image is done in tiles and imgAreaSelect cannot cross
            * over tile boundaries. Add the transparent image to the viewport, on top of the other tiles.
            *
            * vpDomNode corresponds to the div "#helioviewer-viewport", so add the tile directly
            * inside this div. It is necessary to specify a z-index because otherwise it gets added underneath
            * the rest of the tiles and the plugin will not work.
            */
            this.container.show();

            /* Make a temporary container for imgAreaSelect to put all of its divs into.
            * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
            * do not span the whole image for some reason. All of the divs are put in "#outside-box"
            */
            imgContainer = body.append('<div id="imgContainer"></div>');

            this.selectArea(callbackSuccess, callbackCleanup);
        }
    },

    /**
     * Loads the imgAreaSelect plugin and uses it on the transparent image that
     * covers the viewport.
     *
     * The function imgAreaSelect() returns two variables, "img", which is the
     * original transparent image, and "selection", which is an array describing
     * the selected area. Available data for "selection" is x1, y1, x2, y2,
     * width, and height.
     *
     * See: http://odyniec.net/projects/imgareaselect/
     */
    selectArea: function (callbackSuccess, callbackCleanup) {
        var area, self = this;

        // If select tool has already been used this session, compute defaults
        if (this.x1 === null) {
            this.x1 = this.width / 4;
            this.x2 = this.width * 3 / 4;
            this.y1 = this.height / 4;
            this.y2 = this.height * 3 / 4;
        }

        // Use imgAreaSelect on the transparent region to get the
        // top, left, bottom, and right coordinates of the selected region.
        area = this.container.imgAreaSelect({
            instance: true,
            handles : true,
            parent  : "#imgContainer",
            x1      : self.x1,
            x2      : self.x2,
            y1      : self.y1,
            y2      : self.y2,
            onInit  : function () {
                self.vpButtons.hide('fast');
                self.buttons.show();
            }
        });

        $(window).resize(function () {
            if (self.active) {
                self.cancelButton.click();
                self.enableAreaSelect(0, callbackSuccess, callbackCleanup);
            }
        });

        this.doneButton.click(function () {
            self.submitSelectedArea(area, callbackSuccess, callbackCleanup);
        });

        $(document).keypress(function (e) {
            // Enter key
            if (e.which === 13) {
                self.submitSelectedArea(area, callbackSuccess, callbackCleanup);
            }
            if (e.which === 27) {
                self.cancelButton.click();
            }
        });

        this.cancelButton.click( function () {
            self.cleanup(null, callbackCleanup);
        });
    },

    /**
     * Once an area has been selected, this method calculates the coordinates of the
     * selected area, cleans up divs created by the plugin, and uses the callback
     * function to complete movie/screenshot building.
     */
    submitSelectedArea: function (area, callbackSuccess, callbackCleanup) {
        var selection, visibleCoords, roi;

        if (area) {
            // Get the coordinates of the selected image, and adjust them to be
            // heliocentric like the viewport coords.
            selection = area.getSelection();

            // Store selection
            this.x1 = selection.x1;
            this.x2 = selection.x2;
            this.y1 = selection.y1;
            this.y2 = selection.y2;

            visibleCoords = helioviewer.getViewportRegionOfInterest();

            roi = {
                top     : visibleCoords.top  + selection.y1,
                left    : visibleCoords.left + selection.x1,
                bottom  : visibleCoords.top  + selection.y2,
                right   : visibleCoords.left + selection.x2
            };

            this.cleanup(null, callbackCleanup);
            callbackSuccess(roi);
        }
        else {
            console.error('no area');
            this.cleanup(null, callbackCleanup);
        }
    },


    /**
     * Sets up a help tooltip that pops up when the help button is moused over
     */
    _setupHelpDialog: function () {
        this.helpButton.qtip({
            position: {
                my: 'top right',
                at: 'bottom left'
            },
            content: {
                title: {
                    text: "Help"
                },
                text: "Resize by dragging the edges of the selection.<br /> Move the selection by clicking inside " +
                        "and dragging it.<br /> Click and drag outside the selected area to start " +
                        "a new selection.<br /> Click \"OK\" when you have finished to submit."
            }
        });
    },

    /**
     * Removes all divs created by imgAreaSelect. Also shows all divs that were hidden during selection.
     * @param imgContainer -- has all imgAreaSelect divs inside
     * @param transImg -- temporary transparent image that imgAreaSelect is used on.
     * @TODO: add error checking if the divs are already gone for whatever reason.
     */
    cleanup: function (event, callbackCleanup) {
        this.buttons.hide();
        this.container.imgAreaSelect({remove: true});

        this.vpButtons.show('fast');

        this.container.hide();
        $('#imgContainer').remove();
        this.doneButton.unbind('click');
        this.cancelButton.unbind('click');
        this.helpButton.qtip("hide");
        this.active = false;
        $('#message-console').show();
        $('#hv-drawer-tab-left').show();

        if ( typeof callbackCleanup === 'function' ) {
            callbackCleanup();
        }

        $(document).unbind('keypress').trigger('re-enable-keyboard-shortcuts');
    }
});
/**
 * MediaManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global Class, $, pixelsToArcseconds */
"use strict";
var MediaManagerUI = Class.extend(
    /** @lends MediaManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     *
     * @param {ScreenshotManager} model ScreenshotManager instance
     */
    init: function (type) {
        this._type = type;

        this._btn              = $("#" + type + "-button");
        this._container        = $("#" + type + "-manager-container");
        this._buildBtns        = $("#" + type + "-manager-build-btns");
        this._fullViewportBtn  = $("#" + type + "-manager-full-viewport");
        this._selectAreaBtn    = $("#" + type + "-manager-select-area");
        this._historyTitle     = $("#" + type + "-history-title");
        this._historyBody      = $("#" + type + "-history");
        this._clearBtn         = $("#" + type + "-clear-history-button");
        this._tooltips         = $("#social-buttons div");
        this._cleanupFunctions = [];

        this._loadSavedItems();
    },

    /**
     * Checks for media item in history
     */
    has: function (id) {
        return this._manager.has(id);
    },

    /**
     * Hides the media manager
     */
    hide: function () {
        this._container.hide();
        this._btn.removeClass("active");
        this._tooltips.qtip("enable");
        $(".qtip").qtip("hide");
    },

    /**
     * Shows the media manager
     */
    show: function () {
        //this._allContainers.hide();
        //this._allButtons.removeClass("active");
        this._btn.addClass("active");
        $(".jGrowl-notification").trigger("jGrowl.close");
        this._refresh();
        this._container.show();
        this._tooltips.qtip("hide").qtip("disable", true);
    },

    /**
     * Toggles the visibility of the media manager
     */
    toggle: function () {
        if (this._container.is(":visible")) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Adds a movie or screenshot to the history
     *
     * @param {Object} The movie or screenshot to be added
     */
    _addItem: function (item) {
        var htmlId, html, last, url, name = item.name;

        // HTML for a single row in the history dialog
        htmlId = this._type + "-" + item.id;

        // Link
        if (this._type === "movie") {
            url = "?movieId=" + item.id;
        }
        else {
            url = Helioviewer.api + "?action=downloadScreenshot&id=" + item.id;
        }

        html = $("<div id='" + htmlId + "' class='history-entry'>" +
               "<div class='label'><a class='text-btn' style='float: left' href='" + url +
               "'>" + name + "</a></div>" +
               "<div class='status'></div>" +
               "</div>");

        // Store id with dom-node for easy access
        html.data("id", item.id);

        this._historyBody.prepend(html);

        // Create a preview tooltip
        this._buildPreviewTooltip(item);

        // Remove any entries beyond limit
        if (this._historyBody.find(".history-entry").length >
            this._manager._historyLimit) {
            last = this._historyBody.find(".history-entry").last().data('id');
            this._removeItem(last);
        }

        // Show the history section title if it is not already visible
        this._historyTitle.show();
    },

    /**
     * Creates a simple preview tooltip which pops up when the user moves
     * the mouse over the specified history entry.
     */
    _buildPreviewTooltip: function (item) {
        var self = this;

        $("#" + this._type + "-" + item.id).qtip({
            content: {
                title: {
                    text: item.name
                },
                text: self._buildPreviewTooltipHTML(item)
            },
            position: {
                adjust: {
                    x: -10,
                    y: -1
                },
                my: "right top",
                at: "left center"
            },
            show: {
                delay: 140
            }
        });
    },

    /**
     * Removes a movie or screenshot from the history
     *
     * @param {Int} Identifier of the screenshot to be removed
     */
    _removeItem: function (id) {
        $("#" + this._type + "-" + id).qtip("destroy").unbind().remove();

        // Hide the history section if the last entry was removed
        if (this._historyBody.find(".history-entry").length === 0) {
            this._historyTitle.hide();
        }
    },

    /**
     * Create history entries for items from previous sessions
     */
    _loadSavedItems: function () {
        var self = this;

        $.each(this._manager.toArray().reverse(), function (i, item) {
            self._addItem(item);
        });
    },

    /**
     * Refreshes status information for screenshots or movies in the history
     * and preview tooltip positions
     */
    _refresh: function () {
        var type = this._type;

        // Update preview tooltip positioning
        this._historyBody.find(".qtip").qtip('reposition');

        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            var status, elapsed;

            status = $("#" + type + "-" + item.id).find(".status");
            elapsed = Date.parseUTCDate(item.dateRequested).getElapsedTime();
            status.html(elapsed+' ago');
        });
    },

    /**
     * Translates viewport coordinates into arcseconds
     */
    _toArcsecCoords: function (pixels, scale) {
        var coordinates = {
            x1: pixels.left,
            x2: pixels.right,
            y1: pixels.top,
            y2: pixels.bottom
        };

        return pixelsToArcseconds(coordinates, scale);
    },

    /**
     * Initializes event handlers
     */
    _initEvents: function () {
        var self = this;

        this._btn.click(function () {
            if (!self.working) {
                self.toggle();
            }
        });

        // Clear buttons removes all saved items
        this._clearBtn.click(function () {
            $.each(self._manager.toArray(), function (i, item) {
                self._removeItem(item.id);
            });
            self._manager.empty();
        });
    },

    /**
     * Validates the screenshot or movie request and displays an error message
     * if there is a problem
     *
     * @return {Boolean} Returns true if the request is valid
     */
    _validateRequest: function (roi, layers) {
        var message;

        // Selected area too small
        if (roi.bottom - roi.top < 50 || roi.right - roi.left < 50) {
            message = "The area you have selected is too small to create a " +
                      this._type + ". Please try again.";
            $(document).trigger("message-console-warn", [message]);

            return false;

        // No visible layers
        } else if (layers.length === 0) {
            message = "You must have at least one layer in your " + this._type +
                      ". Please try again.";
            $(document).trigger("message-console-warn", [message]);

            return false;
        }
        return true;
    }
});
/**
 * MediaManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var MediaManager = Class.extend(
    /** @lends MediaManager.prototype */
    {
    /**
     * @constructs
     * @param {Array} history Items saved in the user's history
     */
    init: function (savedItems) {
        this._history = savedItems;

        if ($.support.localStorage) {
            this._historyLimit = 25;
        } else {
            this._historyLimit = 10;
        }

    },

    /**
     * Creates the name that will be displayed in the history.
     * Groups layers together by detector, e.g. "EIT 171/304, LASCO C2/C3"
     * Will crop names that are too long and append ellipses.
     */
    _getName: function (layerString) {
        var layer, layerArray, currentGroup, name = "";

        layerArray = layerStringToLayerArray(layerString).sort();

        $.each(layerArray, function (i, layer) {
            layer = extractLayerName(this);

            // Add instrument or detector if its not already present, otherwise
            // add a backslash and move onto the right-hand side
            if (currentGroup === layer[1] || currentGroup === layer[2]) {
                name += "/";
            } else {
                // For STEREO use detector for the Left-hand side
                if (layer[1] === "SECCHI") {
                    currentGroup = layer[2];
                    // Add "A" or "B" to differentiate spacecraft
                    name += ", " + layer[2] + "-" +
                            layer[0].substr(-1) + " ";
                } else {
                    // Otherwise use the instrument name
                    currentGroup = layer[1];
                    name += ", " + layer[1] + " ";
                }
            }

            // For LASCO, use the detector for the right-hand side
            if (layer[1] === "LASCO") {
                name += layer[2];
            } else if (layer[2].substr(0, 3) === "COR") {
                // For COR1 & 2 images

            } else {
                // For AIA
                name += layer[2];
            }
        });

        return name.slice(2); // Get rid of the extra ", " at the front
    },

    /**
     * Adds an item
     */
    add: function (item) {
        if (this._history.unshift(item) > this._historyLimit) {
            this._history = this._history.slice(0, this._historyLimit);
        }

        this._save();
    },

    /**
     * Returns the item with the specified id if it exists
     */
    get: function (id) {
        var index = null;

        // Find the index in the history array
        $.each(this._history, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });

        return this._history[index];
    },

    /**
     * Removes all items
     */
    empty: function () {
        var self = this;

        $.each(this._history, function (i, item) {
            self._history[i] = null;
        });

        self._history = [];
        self._save();
    },

    /**
     * Check to see if an entry exists
     */
    has: function (id) {
        var exists = false;

        $.each(this._history, function (i, item) {
            if (item.id === id) {
                exists = true;
            }
        });

        return exists;
    },

    /**
     * Removes a item
     *
     * @param {String} id Item to be removed
     */
    remove: function (id) {
        var self = this;

        $.each(this._history, function (i, item) {
            if (item.id === id) {
                self._history[i] = null;
                self._history.splice(i, 1);
                self._save();
                return;
            }
        });
    },

    /**
     * Returns an array containing objects for the items currently being tracked
     */
    toArray: function () {
        return $.extend([], this._history);
    }
});
/**
 * MovieManager class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 *
 * TODO 2011/03/14: Choose a reasonable limit for the number of entries based on whether or not
 * localStorage is supported: if supported limit can be large (e.g. 100), otherwise should be
 * closer to 3 entries.
 *
 * Movie Status:
 *  0 QUEUED
 *  1 PROCESSING
 *  2 COMPLETED
 *  3 ERROR
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, MediaManager, $, setTimeout */
"use strict";
var MovieManager = MediaManager.extend(
    /** @lends MovieManager.prototype */
    {
    /**
     * @constructs
     * Creates a new MovieManager instance
     */
    init: function (movies) {
        this._super(movies);
        this.format   = $.support.vp8 ? "webm" : "mp4";

        // Check status of any previously unfinished movie requests
        var self = this;
        $.each(movies, function (i, movie) {
            if (movie.status < 2) {
                self._monitorQueuedMovie(movie.id, Date.parseUTCDate(movie.dateRequested), 0);
            }
        });
    },

    /**
     * Adds a new movie
     *
     * @param {Int}     id            Movie id
     * @param {Float}   duration      Movie duration in seconds
     * @param {Float}   imageScale    Image scale for the movie
     * @param {String}  layers        Layers in the movie serialized as a string
     * @param {String}  dateRequested Date string for when the movie was requested
     * @param {String}  startDate     Observation date associated with the first movie frame
     * @param {String}  endDate       Observation date associated with the last movie frame
     * @param {Float}   frameRate     Movie frame-rate in frames/sec
     * @param {Int}     numFrames     Total number of frames in the movie
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     * @param {Int}     width         Movie width
     * @param {Int}     height        Movie height
     *
     * @return {Movie} A Movie object
     */
    add: function (
            id, duration, imageScale, layers, events, eventsLabels, scale,
            scaleType, scaleX, scaleY, dateRequested, startDate, endDate,
            frameRate, numFrames, x1, x2, y1, y2, width, height, thumbnail, url
    ) {
        var movie = {
            "id"            : id,
            "duration"      : duration,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "events"        : events,
            "eventsLabels"  : eventsLabels,
            "scale"         : scale,
            "scaleType"     : scaleType,
            "scaleX"        : scaleX,
            "scaleY"        : scaleY,
            "dateRequested" : dateRequested,
            "startDate"     : startDate,
            "endDate"       : endDate,
            "frameRate"     : frameRate,
            "numFrames"     : numFrames,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "width"         : width,
            "height"        : height,
            "ready"         : true,
            "name"          : this._getName(layers),
            "status"        : 2,
            "thumbnail"     : thumbnail,
            "url"           : url
        };
        this._super(movie);

        return movie;
    },

    /**
     * Adds a movie that is currently being processed
     *
     * @param {Int}     id            Movie id
     * @param {Int}     eta           Estimated time in seconds before movie is ready
     * @param {String}  token         Resque token for tracking status in queue
     * @param {Float}   imageScale    Image scale for the movie
     * @param {String}  layers        Layers in the movie serialized as a string
     * @param {String}  dateRequested Date string for when the movie was requested
     * @param {String}  startDate     Observation date associated with the first movie frame
     * @param {String}  endDate       Observation date associated with the last movie frame
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     *
     * @return {Movie} A Movie object
     */
    queue: function (id, eta, token, imageScale, layers, events, eventsLabels,
                scale, scaleType, scaleX, scaleY, dateRequested, startDate,
                endDate, x1, x2, y1, y2) {

        var movie = {
            "id"            : id,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "events"        : events,
            "eventsLabels"  : eventsLabels,
            "scale"         : scale,
            "scaleType"     : scaleType,
            "scaleX"        : scaleX,
            "scaleY"        : scaleY,
            "dateRequested" : dateRequested,
            "startDate"     : startDate,
            "endDate"       : endDate,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "status"        : 0,
            "token"         : token,
            "name"          : this._getName(layers)
        };

        if (this._history.unshift(movie) > this._historyLimit) {
            this._history = this._history.slice(0, this._historyLimit);
        }

        this._monitorQueuedMovie(id, Date.parseUTCDate(dateRequested), token, eta);

        this._save();
        return movie;
    },

    /**
     * Updates stored information for a given movie and notify user that movie is available
     *
     * @param {Int}     id            Movie id
     * @param {Float}   frameRate     Movie frame-rate in frames/sec
     * @param {Int}     numFrames     Total number of frames in the movie
     * @param {String}  startDate     The actual movie start date
     * @param {String}  endDate       The actual movie end date
     * @param {Int}     width         Movie width
     * @param {Int}     height        Movie height
     */
    update: function (id, frameRate, numFrames, startDate, endDate, width,
        height, thumbnails, url) {

        var movie = this.get(id);

        // Add the new values
        $.extend(movie, {
            "frameRate" : frameRate,
            "numFrames" : numFrames,
            "startDate" : startDate,
            "endDate"   : endDate,
            "width"     : width,
            "height"    : height,
            "status"    : 2,
            "thumbnail" : thumbnails.small,
            "url"       : url
        });

        // Delete resque token
        delete movie.token;

        this._save();

        // Update preview tooltip
        $(document).trigger("movie-ready", [movie]);

        // Notify user
        this._displayDownloadNotification(movie);
    },

    /**
     * Displays a jGrowl notification to the user informing them that their
     * download has completed
     */
    _displayDownloadNotification: function (movie) {
        var jGrowlOpts, message, self = this;

        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Just now",
            open:    function (msg) {
                msg.find(".message-console-movie-ready").data("movie", movie);
            }
        };
        message = "<span class='message-console-movie-ready'>" +
                  "Your " + movie.name + " movie is ready! " +
                  "Click here to watch or download it.</span>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-log",
                            [message, jGrowlOpts, true, true]);
    },

    /**
     * Monitors a queued movie and notifies the user when it becomes available
     */
    _monitorQueuedMovie: function (id, dateRequested, token, eta)
    {
        var queryMovieStatus, self = this;

        queryMovieStatus = function () {
            var params, callback;

            callback = function (response) {
                // If the user has removed the movie from history, stop monitoring
                if (!self.has(id)) {
                    return;
                }

                // Check status
                if (response.status < 2) {
                    // If more than 24 hours has elapsed, set status to ERROR
                    if ((Date.now() - dateRequested) / 1000 > (24 * 60 * 60)) {
                        self._abort(id);
                    }
                    // Otherwise continue to monitor
                    self._monitorQueuedMovie(id, dateRequested, token, 60);
                } else if (response.error) {
                    self._abort(id);
                }  else {
                    self.update(id, response.frameRate, response.numFrames,
                                response.startDate, response.endDate,
                                response.width, response.height,
                                response.thumbnails, response.url);
                }
            };

            params = {
                "action" : "getMovieStatus",
                "id"     : id,
                "token"  : token,
                "format" : self.format
            };
            $.get(Helioviewer.api, params, callback, Helioviewer.dataType);
        };
        setTimeout(queryMovieStatus, Math.max(eta, 5) * 1000);
    },

    /**
     * Aborts a failed movie request
     */
    _abort: function (id) {
        var error, movie = this.get(id);

        // Mark as failed
        movie["status"] = 3;
        this._save();

        // Notify user
        error = "Sorry, we were unable to create the movie you requested. " +
                "This usually means that there are not enough images for the " +
                "time range requested. Please try adjusting the observation " +
                "date or movie duration and try creating a new movie.";

        $(document).trigger("message-console-error", [error, {"sticky": true}]);
    },

    /**
     * Saves the current list of movies
     */
    _save: function () {
        Helioviewer.userSettings.set("history.movies", this._history);
    }
});
/**
 * MovieManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, MovieManager, MediaManagerUI, Helioviewer, helioviewer,
  layerStringToLayerArray, humanReadableNumSeconds
 */
"use strict";
var MovieManagerUI = MediaManagerUI.extend(
    /** @lends MovieManagerUI */
    {
    /**
     * @constructs
     * Creates a new MovieManagerUI instance
     *
     * @param {MovieManager} model MovieManager instance
     */
    init: function (movieManager) {
        var movies = Helioviewer.userSettings.get('history.movies');
        this._manager = new MovieManager(movies);
        this._super("movie");
        this._settingsDialog   = $("#movie-settings-container");
        this._advancedSettings = $("#movie-settings-advanced");
        this._settingsHelp     = $("#movie-settings-help");
        this._settingsForm     = $("#movie-settings-form-container");
        this._settingsConsole  = $("#movie-settings-validation-console");
        this._movieScale = null;
        this._movieROI = null;
        this._movieLayers = null;
        this._movieEvents = null;
        this._movieEventsLabels = null;
        this._initEvents();
        this._initSettings();

        this.show();
    },

    /**
     * Plays the movie with the specified id if it is ready
     */
    playMovie: function (id) {
        var movie = this._manager.get(id);

        // If the movie is ready, open movie player
        if (movie.status === 2) {
            this._createMoviePlayerDialog(movie);
        } else {
            return;
        }
    },

    /**
     * Uses the layers passed in to send an Ajax request to api.php, to have it
     * build a movie. Upon completion, it displays a notification that lets the
     * user click to view it in a popup.
     */
    _buildMovieRequest: function (serializedFormParams) {
        var formParams, baseParams, params, frameRate;

        // Convert to an associative array for easier processing
        formParams = {};

        $.each(serializedFormParams, function (i, field) {
            formParams[field.name] = field.value;
        });

        this.building = true;

        if ( Helioviewer.userSettings.get("state.eventLayerVisible") === false ) {
            this._movieEvents = '';
            this._movieEventsLabels = false;
        }

        // Movie request parameters
        baseParams = {
            action       : "queueMovie",
            imageScale   : this._movieScale,
            layers       : this._movieLayers,
            events       : this._movieEvents,
            eventsLabels : this._movieEventsLabels,
            scale        : Helioviewer.userSettings.get("state.scale"),
            scaleType    : Helioviewer.userSettings.get("state.scaleType"),
            scaleX       : Helioviewer.userSettings.get("state.scaleX"),
            scaleY       : Helioviewer.userSettings.get("state.scaleY"),
            format       : this._manager.format
        };

        // Add ROI and start and end dates
        params = $.extend(baseParams, this._movieROI,
                          this._getMovieTimeWindow());

        // (Optional) Frame-rate or movie-length
        if (formParams['speed-method'] === "framerate") {
            frameRate = parseInt(formParams['framerate'], 10);
            if (frameRate < 1 || frameRate > 30) {
                throw "Frame-rate must be between 1 and 30.";
            }
            baseParams['frameRate'] = formParams['framerate'];
        }
        else {
            if (formParams['movie-length'] < 5 ||
                formParams['movie-length'] > 100) {
                throw "Movie length must be between 5 and 100 seconds.";
            }
            baseParams['movieLength'] = formParams['movie-length'];
        }

        // Submit request
        this._queueMovie(params);

        this._advancedSettings.hide();
        this._settingsDialog.hide();

        this.show();

        this.building = false;
    },

    /**
     * Determines the start and end dates to use when requesting a movie
     */
    _getMovieTimeWindow: function () {
        var movieLength, currentTime, endTime, startTimeStr, endTimeStr,
            now, diff;

        movieLength = Helioviewer.userSettings.get("options.movies.duration");

        // Webkit doesn't like new Date("2010-07-27T12:00:00.000Z")
        currentTime = helioviewer.getDate();

        // We want shift start and end time if needed to ensure that entire
        // duration will be used. For now, we will assume that the most
        // recent data available is close to now() to make things simple
        endTime = helioviewer.getDate().addSeconds(movieLength / 2);

        now = new Date();
        diff = endTime.getTime() - now.getTime();
        currentTime.addSeconds(Math.min(0, -diff / 1000));

        // Start and end datetime strings
        return {
            "startTime": currentTime.addSeconds(-movieLength / 2).toISOString(),
            "endTime"  : currentTime.addSeconds(movieLength).toISOString()
        };
    },

    /**
     * Displays movie settings dialog
     */
    _showMovieSettings: function (roi) {
        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        var layers = helioviewer.getVisibleLayers(roi);
        var events = helioviewer.getEvents();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        // Store chosen ROI and layers
        this._movieScale  = helioviewer.getImageScale();
        this._movieROI    = this._toArcsecCoords(roi, this._movieScale);
        this._movieLayers = layers;
        this._movieEvents = events;
        this._movieEventsLabels = helioviewer.getEventsLabels();

        this.hide();
        this._settingsConsole.hide();
        this._settingsDialog.show();
        this._advancedSettings.show();
    },

    /**
     * Queues a movie request
     */
    _queueMovie: function (params) {
        var callback, self = this;

        // AJAX Responder
        callback = function (response) {
            var msg, movie, waitTime;

            if ((response === null) || response.error) {
                // Queue full
                if (response.errno === 40) {
                    msg = response.error;
                } else {
                    // Other error
                    msg = "We are unable to create a movie for the time you " +
                        "requested. Please select a different time range " +
                        "and try again.";
                }
                $(document).trigger("message-console-info", msg);
                return;
            } else if (response.warning) {
                $(document).trigger("message-console-info", response.warning);
                return;
            }

            movie = self._manager.queue(
                response.id, response.eta, response.token,
                params.imageScale, params.layers, params.events,
                params.eventsLabels, params.scale, params.scaleType,
                params.scaleX, params.scaleY, new Date().toISOString(),
                params.startTime, params.endTime, params.x1, params.x2,
                params.y1, params.y2
            );
            self._addItem(movie);

            waitTime = humanReadableNumSeconds(response.eta);
            msg = "Your video is processing and will be available in " +
                  "approximately " + waitTime + ". You may view it at any " +
                  "time after it is ready by clicking the 'Movie' button";
            $(document).trigger("message-console-info", msg);
        };

        // Make request
        $.get(Helioviewer.api, params, callback, Helioviewer.dataType);
    },


    /**
     * Initializes MovieManager-related event handlers
     */
    _initEvents: function () {
        var timer, self = this;

        this._super();

        // ROI selection buttons
        this._fullViewportBtn.click(function () {
            self._showMovieSettings();
        });

        this._selectAreaBtn.click(function () {
            self._cleanupFunctions = [];

            if ( helioviewer.drawerLeftOpened ) {
                self._cleanupFunctions.push('helioviewer.drawerLeftClick()');
                helioviewer.drawerLeftClick();
            }
            self._cleanupFunctions.push('helioviewer.drawerMoviesClick()');
            helioviewer.drawerMoviesClick();

            $(document).trigger("enable-select-tool",
                                [$.proxy(self._showMovieSettings, self),
                                 $.proxy(self._cleanup, self)]);
        });

        // Setup hover and click handlers for movie history items
        $("#movie-history .history-entry")
           .live('click', $.proxy(this._onMovieClick, this))
           .live('mouseover mouseout', $.proxy(this._onMovieHover, this));


        // Download completion notification link
        $(".message-console-movie-ready").live('click', function (event) {
            var movie = $(event.currentTarget).data('movie');
            self._createMoviePlayerDialog(movie);
        });

        // Update tooltip when movie is finished downloading
        $(document).bind("movie-ready", function (event, movie) {
            $("#" + self._type + "-" + movie.id).qtip("destroy");
            self._buildPreviewTooltip(movie);
        });

        // Upload form submission
        $("#youtube-video-info").submit(function () {
            self.submitVideoUploadForm();
            return false;
        });

        // Toggle advanced settings display
        $("#movie-settings-toggle-advanced").click(function () {
            // If help is visible, simply hide
            if (self._settingsHelp.is(":visible")) {
                self._settingsHelp.hide();
                self._settingsForm.show();
                return;
            }

            // Otherwise, toggle advanced settings visibility
            if (self._advancedSettings.is(":visible")) {
                self._advancedSettings.animate({"height": 0}, function () {
                    self._advancedSettings.hide();
                });
            } else {
                self._advancedSettings.css('height', 0).show();
                self._advancedSettings.animate({"height": 85}, function () {
                });
            }
        });

        // Toggle help display
        $("#movie-settings-toggle-help").click(function () {
            self._settingsForm.toggle();
            self._settingsHelp.toggle();
        });
    },

    /**
     * Initializes movie settings events
     */
    _initSettings: function () {
        var length, lengthInput, duration, durationSelect,
            frameRateInput, settingsForm, self = this;

        // Advanced movie settings
        frameRateInput = $("#frame-rate");
        lengthInput    = $("#movie-length");
        durationSelect = $("#movie-duration");

        // Speed method enable/disable
        $("#speed-method-f").change(function () {
            lengthInput.attr("disabled", true);
            frameRateInput.attr("disabled", false);
        }).attr("checked", "checked").change();

        $("#speed-method-l").change(function () {
            frameRateInput.attr("disabled", true);
            lengthInput.attr("disabled", false);
        });

        // Cancel button
        $("#movie-settings-cancel-btn").button().click(function (e) {
            self._advancedSettings.hide();
            self._settingsDialog.hide();
            self.show();
        });

        // Submit button
        settingsForm = $("#movie-settings-form");

        $("#movie-settings-submit-btn").button().click(function (e) {
            // Validate and submit movie request
            try {
                self._buildMovieRequest(settingsForm.serializeArray());
            } catch (ex) {
                // Display an error message if invalid values are specified
                // for movie settings
                self._settingsConsole.text(ex).fadeIn(1000, function () {
                    setTimeout(function () {
                        self._settingsConsole.text(ex).fadeOut(1000);
                    }, 10000);
                });
            }
            return false;
        });

        // Movie duration
        duration = Helioviewer.userSettings.get("options.movies.duration"),

        // Duration event listener
        durationSelect.bind('change', function (e) {
            Helioviewer.userSettings.set("options.movies.duration",
            parseInt(this.value, 10));
        });

        // Reset to default values
        frameRateInput.val(15);
        lengthInput.val(20);
        durationSelect.find("[value=" + duration + "]").attr("selected", "selected");
    },

    /**
     * If the movie is ready, play the movie in a popup dialog. Otherwise do
     * nothing.
     */
    _onMovieClick: function (event) {
        var id, movie, dialog, action;

        id    = $(event.currentTarget).data('id');
        movie = this._manager.get(id);

        // If the movie is ready, open movie player
        if (movie.status === 2) {
            dialog = $("movie-player-" + id);

            // If the dialog has already been created, toggle display
            if (dialog.length > 0) {
                action = dialog.dialog('isOpen') ? "close" : "open";
                dialog.dialog(action);

            // Otherwise create and display the movie player dialog
            } else {
                this._createMoviePlayerDialog(movie);
            }
        }
        return false;
    },

   /**
    * Shows movie details and preview.
    */
    _onMovieHover: function (event) {
        if (event.type === 'mouseover') {
            //console.log('hover on');
        } else {
            //console.log('hover off');
        }
    },

    /**
     * Creates HTML for a preview tooltip with a preview thumbnail,
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (movie) {
        var width, height, thumbnail, html = "";

        if (movie.status === 2) {
            thumbnail = movie.thumbnail;

            html += "<div style='text-align: center;'>" +
                "<img src='" + thumbnail +
                "' width='95%' alt='preview thumbnail' /></div>";

            width  = movie.width;
            height = movie.height;
        } else {
            width  = Math.round(movie.x2 - movie.x1);
            height = Math.round(movie.y2 - movie.y1);
        }

        html += "<table class='preview-tooltip'>" +
            "<tr><td><b>Start:</b></td><td>" + movie.startDate + "</td></tr>" +
            "<tr><td><b>End:</b></td><td>"   + movie.endDate   + "</td></tr>" +
            "<tr><td><b>Scale:</b></td><td>" + movie.imageScale.toFixed(2) +
            " arcsec/px</td></tr>" +
            "<tr><td><b>Dimensions:</b></td><td>" + width +
            "x" + height +
            " px</td></tr>" +
            "</table>";

        return html;
    },

    /**
     * @description Opens a pop-up with the movie player in it.
     */
    _createMoviePlayerDialog: function (movie) {
        var dimensions, title, uploadURL, flvURL, swfURL, html, dialog,
            screenshot, callback, self = this;

        // Make sure dialog fits nicely inside the browser window
        dimensions = this.getVideoPlayerDimensions(movie.width, movie.height);

        // Movie player HTML
        html = self.getVideoPlayerHTML(movie, dimensions.width,
                                       dimensions.height);

        // Movie player dialog
        dialog = $(
            "<div id='movie-player-" + movie.id + "' " +
            "class='movie-player-dialog'></div>"
        ).append(html);

        dialog.find(".video-download-icon").click(function () {
            // Google analytics event
            if (typeof(_gaq) != "undefined") {
                _gaq.push(['_trackEvent', 'Movies', 'Download']);
            }
        });

        // Movie dialog title
        title = movie.name + " (" + movie.startDate + " - " +
                movie.endDate + " UTC)";

        // Have to append the video player here, otherwise adding it to the div
        // beforehand results in the browser attempting to download it.
        dialog.dialog({
            title     : "Movie Player: " + title,
            width     : ((dimensions.width < 575)?600:dimensions.width+25),
            height    : dimensions.height + 80,
            resizable : $.support.h264 || $.support.vp8,
            close     : function () {
                            $(this).empty();
                        },
            zIndex    : 9999,
            show      : 'fade'
        });

        // TODO 2011/01/04: Disable keyboard shortcuts when in text fields!
        // (already done for input fields...)

        // Initialize YouTube upload button
        $('#youtube-upload-' + movie.id).click(function () {
            self.showYouTubeUploadDialog(movie);
            return false;
        });

        // Initialize video link button
        $('#video-link-' + movie.id).click(function () {
            // Hide flash movies to prevent blocking
            if (!($.support.h264 || $.support.vp8)) {
                $(".movie-player-dialog").dialog("close");
            }
            helioviewer.displayMovieURL(movie.id);
            return false;
        });

        // Flash video URL
        flvURL = Helioviewer.api +
                "/?action=downloadMovie&format=flv&id=" + movie.id;

        // SWF URL (The flowplayer SWF directly provides best Facebook support)
        swfURL = Helioviewer.root +
                 "/lib/flowplayer/flowplayer-3.2.8.swf?config=" +
                 encodeURIComponent("{'clip':{'url': '../../" + flvURL + "'}}");

        screenshot = movie.thumbnail.substr(0, movie.thumbnail.length - 9) +
                     "full.png";
    },

    /**
     * Opens YouTube uploader either in a separate tab or in a dialog
     */
    showYouTubeUploadDialog: function (movie) {
        var title, tags, url1, url2, description;

        // Suggested movie title
        title = movie.name + " (" + movie.startDate + " - " +
                movie.endDate + " UTC)";

        // Suggested YouTube tags
        tags = [];

        $.each(movie.layers.split("],["), function (i, layerStr) {
console.error('MovieManagerUI.showYouTubeUploadDialog() assumes 4-level hierarchy in layerStr');
            var parts = layerStr.replace(']', "").replace('[', "")
                        .split(",").slice(0, 4);

            // Add observatories, instruments, detectors and measurements
            $.each(parts, function (i, item) {
                if ($.inArray(item, tags) === -1) {
                    tags.push(item);
                }
            });
        });

        // URLs
        url1 = Helioviewer.api + "/?action=playMovie&id=" + movie.id +
               "&format=mp4&hq=true";
        url2 = Helioviewer.api + "/?action=downloadMovie&id=" + movie.id +
               "&format=mp4&hq=true";

        // Suggested Description
        description = "This movie was produced by Helioviewer.org. See the " +
                      "original at " + url1 + " or download a high-quality " +
                      "version from " + url2;

        // Update form defaults
        $("#youtube-title").val(title);
        $("#youtube-tags").val(tags);
        $("#youtube-desc").val(description);
        $("#youtube-movie-id").val(movie.id);

        // Hide movie dialogs (Flash player blocks upload form)
        $(".movie-player-dialog").dialog("close");

        // Open upload dialog
        $("#upload-dialog").dialog({
            "title" : "Upload video to YouTube",
            "width" : 550,
            "height": 440
        });
    },

    /**
     * Processes form and submits video upload request to YouTube
     */
    submitVideoUploadForm: function (event) {
        var params, successMsg, uploadDialog, url, form, loader, callback,
            self = this;

        // Validate and submit form
        try {
            this._validateVideoUploadForm();
        } catch (ex) {
            this._displayValidationErrorMsg(ex);
            return false;
        }

        // Clear any remaining error messages before continuing
        $("#upload-error-console").hide();

        form = $("#upload-form").hide();
        loader = $("#youtube-auth-loading-indicator").show();

        // Callback function
        callback = function (auth) {
            loader.hide();
            form.show();

            // Base URL
            url = Helioviewer.api + "?" + $("#youtube-video-info").serialize();

            // If the user has already authorized Helioviewer, upload the movie
            if (auth) {
                $.get(url, {"action": "uploadMovieToYouTube"},
                    function (response) {
                        if (response.error) {
                            self.hide();
                            $(document).trigger("message-console-warn",
                                                [response.error]);
                        }
                }, "json");
            } else {
                // Otherwise open an authorization page in a new tab/window
                window.open(url + "&action=getYouTubeAuth", "_blank");
            }

            // Close the dialog
            $("#upload-dialog").dialog("close");
            return false;
        }

        // Check YouTube authorization
        $.ajax({
            url : Helioviewer.api + "?action=checkYouTubeAuth",
            dataType: Helioviewer.dataType,
            success: callback
        });
    },

    /**
     * Displays an error message in the YouTube upload dialog
     *
     * @param string Error message
     */
    _displayValidationErrorMsg: function (ex) {
        var errorConsole = $("#upload-error-console");

        errorConsole.html("<b>Error:</b> " + ex).fadeIn(function () {
            window.setTimeout(function () {
                errorConsole.fadeOut();
            }, 15000);
        });
    },

    /**
     * Validates title, description and keyword fields for YouTube upload.
     *
     * @see http://code.google.com/apis/youtube/2.0/reference.html
     *      #Media_RSS_elements_reference
     */
    _validateVideoUploadForm: function () {
        var keywords         = $("#youtube-tags").val(),
            keywordMinLength = 2,
            keywordMaxLength = 30;

        // Make sure the title field is not empty
        if ($("#youtube-title").val().length === 0) {
            throw "Please specify a title for the movie.";
        }

        // User must specify at least one keyword
        if (keywords.length === 0) {
            throw "You must specifiy at least one tag for your video.";
        }

        // Make sure each keywords are between 2 and 30 characters each
        $.each(keywords.split(","), function (i, keyword) {
            var len = $.trim(keyword).length;

            if (len > keywordMaxLength) {
                throw "YouTube tags must not be longer than " +
                      keywordMaxLength + " characters each.";
            } else if (len < keywordMinLength) {
                throw "YouTube tags must be at least " + keywordMinLength +
                      " characters each.";
            }
            return;
        });

        // < and > are not allowed in title, description or keywords
        $.each($("#youtube-video-info input[type='text'], " +
                 "#youtube-video-info textarea"), function (i, input) {
            if ($(input).val().match(/[<>]/)) {
                throw "< and > characters are not allowed";
            }
            return;
        });
    },

    /**
     * Adds a movie to the history using it's id
     */
    addMovieUsingId: function (id) {
        var callback, params, movie, self = this;

        callback = function (response) {
            if (response.status === 2) {
                movie = self._manager.add(
                    id,
                    response.duration,
                    response.imageScale,
                    response.layers,
                    response.events,
                    response.eventsLabels,
                    response.scale,
                    response.scaleType,
                    response.scaleX,
                    response.scaleY,
                    response.timestamp.replace(" ", "T") + ".000Z",
                    response.startDate,
                    response.endDate,
                    response.frameRate,
                    response.numFrames,
                    response.x1,
                    response.x2,
                    response.y1,
                    response.y2,
                    response.width,
                    response.height,
                    response.thumbnails.small,
                    response.url
                );

                self._addItem(movie);
                self._createMoviePlayerDialog(movie);
            }
        };

        params = {
            "action" : "getMovieStatus",
            "id"     : id,
            "format" : self._manager.format,
            "verbose": true
        };
        $.get(Helioviewer.api, params, callback, Helioviewer.dataType);
    },

    /**
     * Determines dimensions for which movie should be displayed
     */
    getVideoPlayerDimensions: function (width, height) {
        var maxWidth    = $(window).width() * 0.80,
            maxHeight   = $(window).height() * 0.80,
            scaleFactor = Math.max(1, width / maxWidth, height / maxHeight);

        return {
            "width"  : Math.floor(width  / scaleFactor),
            "height" : Math.floor(height / scaleFactor)
        };
    },

    /**
     * Decides how to display video and returns HTML corresponding to that
     * method
     */
    getVideoPlayerHTML: function (movie, width, height) {
        var downloadURL, downloadLink, youtubeBtn,
            linkBtn, linkURL, tweetBtn, facebookBtn;

        // Download
        downloadURL = Helioviewer.api + "?action=downloadMovie&id=" + movie.id +
                      "&format=mp4&hq=true";

        downloadLink = "<div style='float:left;'><a target='_parent' href='" + downloadURL +
            "' title='Download high-quality video'>" +
            "<img style='width:93px; height:32px;' class='video-download-icon' " +
            "src='resources/images/download_93x32.png' /></a></div>";

        // Upload to YouTube
        youtubeBtn = '<div style="float:left;"><a id="youtube-upload-' + movie.id + '" href="#" ' +
            'target="_blank"><img class="youtube-icon" ' +
            'title="Upload video to YouTube" style="width:79px;height:32px;" ' +
            'src="resources/images/youtube_79x32.png" /></a></div>';

        // Link
        linkURL = helioviewer.serverSettings.rootURL + "/?movieId=" + movie.id;

        linkBtn = "<div style='float:left;'><a id='video-link-" + movie.id + "' href='" + linkURL +
            "' title='Get a link to the movie' " +
            "target='_blank'><img class='video-link-icon' " +
            "style='width:79px; height:32px;' " +
            "src='resources/images/link_79x32.png' /></a></div>";

        // Tweet Movie Button
        tweetBtn = '<div style="float:right;"><a href="https://twitter.com/share" class="twitter-share-button" data-related="helioviewer" data-lang="en" data-size="medium" data-count="horizontal" data-url="http://'+document.domain+'/?movieId='+movie.id+'" data-text="Movie of the Sun created on Helioviewer.org:" data-hashtags="helioviewer" data-related="helioviewer">Tweet</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script></div>';

        // Like Movie on Facebook Button
        facebookBtn = '<div style="float:right;"><iframe src="//www.facebook.com/plugins/like.php?href='+encodeURIComponent('http://'+document.domain+'/?movieId='+movie.id)+'&amp;width=90&amp;height=21&amp;colorscheme=dark&amp;layout=button_count&amp;action=like&amp;show_faces=false&amp;send=false&amp;appId=6899099925" scrolling="no" frameborder="0" style="border:none; overflow:hidden; height:21px; width:90px;" allowTransparency="false"></iframe></div>';

        // HTML5 Video (H.264 or WebM)
        if ($.support.vp8 || $.support.h264) {
            // Work-around: use relative paths to simplify debugging
            url = movie.url.substr(movie.url.search("cache"));

            // IE9 only supports relative dimensions specified using CSS
            return '<div><video id="movie-player-' + movie.id + '" src="' + url +
                   '" controls preload autoplay' +
                   ' style="width:100%; height: 90%;"></video></div>' +
                   '<div style="width:100%"><div style="float:left;" class="video-links">' +
                   youtubeBtn + linkBtn + downloadLink +
                   '</div> <div style="float:right;">' + facebookBtn +
                   tweetBtn + '</div></div>';
        }

        // Fallback (flash player)
        else {
            var url = Helioviewer.api + '?action=playMovie&id=' + movie.id +
                  '&width=' + width + "&height=" + height +
                  '&format=flv';

            return '<div id="movie-player-' + movie.id + '">' +
                       '<iframe id="movie-player-iframe" src="' + url + '" width="' + width +
                       '" height="' + height + '" marginheight="0" marginwidth="0" ' +
                       'scrolling="no" frameborder="0" />' +
                   '</div>' +
                   '<div style="width:100%;">' +
                       '<div style="float:left;" class="video-links">' +
                        youtubeBtn + linkBtn + downloadLink +
                   '</div>' +
                   '<div style="float:right;">' + facebookBtn + tweetBtn +
                   '</div>';
        }
    },

    /**
     * Refreshes status information for movies in the history
     */
    _refresh: function () {
        var status, elapsedTime;

        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            status = $("#movie-" + item.id).find(".status");

            // For completed entries, display elapsed time
            if (item.status === 2) {
                elapsedTime = Date.parseUTCDate(item.dateRequested)
                                  .getElapsedTime();
                status.html(elapsedTime);
            // For failed movie requests, display an error
            } else if (item.status === 3) {
                status.html("<span style='color:LightCoral;'>Error</span>");
            // Otherwise show the item as processing
            } else {
                status.html("<span class='processing'>Processing</span>");
            }
        });
    },

    /**
     * Validates the request and returns false if any of the requirements are
     * not met
     */
    _validateRequest: function (roi, layerString) {
        var layers, visibleLayers, message;

        layers = layerStringToLayerArray(layerString);
        visibleLayers = $.grep(layers, function (layer, i) {
            var parts = layer.split(",");
            return (parts[4] === "1" && parts[5] !== "0");
        });

        if (visibleLayers.length > 3) {
            message = "Movies cannot have more than three layers. " +
                      "Please hide/remove layers until there are no more " +
                      "than three layers visible.";

            $(document).trigger("message-console-warn", [message]);

            return false;
        }
        return this._super(roi, layerString);
    },

    _cleanup: function () {
        $.each(this._cleanupFunctions, function(i, func) {
            eval(func);
        });
    }
});
/**
 * ScreenshotManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO 2011/03/14: Choose a reasonable limit for the number of entries based on whether or not
 * localStorage is supported: if supported limit can be large (e.g. 100), otherwise should be
 * closer to 3 entries.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Helioviewer, MediaManager */
"use strict";
var ScreenshotManager = MediaManager.extend(
    /** @lends ScreenshotManager.prototype */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManager instance 
     */    
    init: function (screenshots) {
        this._super(screenshots);
    },
    
    /**
     * Adds a new screenshot
     * 
     * @param {Int}     id            Screenshot id
     * @param {Float}   imageScale    Image scale for the screenshot
     * @param {String}  layers        Layers in the screenshot serialized as a string
     * @param {String}  dateRequested Date string for when the screenshot was requested
     * @param {String}  date          The observation date for which the screenshot was generated
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     * 
     * @return {Screenshot} A Screenshot object
     */
    add: function (id, imageScale, layers, dateRequested, date, x1, x2, y1, y2) {
        var screenshot = {
            "id"            : id,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "dateRequested" : dateRequested,
            "date"          : date,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "name"          : this._getName(layers)
        };
        this._super(screenshot);

        return screenshot;
    },
    
    /**
     * Saves the current list of screenshots
     */
    _save: function () {
        Helioviewer.userSettings.set("history.screenshots", this._history);
    }
});
/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Helioviewer, helioviewer, MediaManagerUI, ScreenshotManager
*/
"use strict";
var ScreenshotManagerUI = MediaManagerUI.extend(
    /** @lends ScreenshotManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     *
     * @param {ScreenshotManager} model ScreenshotManager instance
     */
    init: function () {
        var screenshots = Helioviewer.userSettings.get('history.screenshots');
        this._manager = new ScreenshotManager(screenshots);

        this._super("screenshot");

        this._initEvents();
        this.show();
    },

    /**
     * Returns a URL to generate a screenshot of the current viewport
     *
     * Used to generate thumbnails for the current page
     */
    getScreenshotURL: function () {
        var roi, imageScale, layers, params;

        imageScale = helioviewer.getImageScale();
        roi        = helioviewer.getViewportRegionOfInterest();

        // Remove any layers which do not lie in the reguested region
        layers = this._checkLayers(helioviewer.getLayers());

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        params = $.extend({
            action        : "takeScreenshot",
            imageScale    : imageScale,
            layers        : layers,
            date          : helioviewer.getDate().toISOString(),
            display       : true
        }, this._toArcsecCoords(roi, imageScale));

        return Helioviewer.api + "?" + $.param(params);
    },

    /**
     * Displays a jGrowl notification to the user informing them that their
     * download has completed
     */
    _displayDownloadNotification: function (screenshot) {
        var jGrowlOpts, body, self = this;

        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Just now"
        };

        // Download link
        body = "<a href='" + Helioviewer.api +
               "?action=downloadScreenshot&id=" +
               screenshot.id + "'>Your " + screenshot.name +
               " screenshot is ready! Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-log",
                            [body, jGrowlOpts, true, true]);
    },

    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;

        this._super();

        // Screenshot ROI selection buttons
        this._fullViewportBtn.click(function () {
            self._takeScreenshot();
        });

        this._selectAreaBtn.click(function () {
            self._cleanupFunctions = [];

            if ( helioviewer.drawerLeftOpened ) {
                self._cleanupFunctions.push('helioviewer.drawerLeftClick()');
                helioviewer.drawerLeftClick();
            }
            self._cleanupFunctions.push('helioviewer.drawerScreenshotsClick()');
            helioviewer.drawerScreenshotsClick();

            $(document).trigger("enable-select-tool",
                                [$.proxy(self._takeScreenshot, self),
                                 $.proxy(self._cleanup, self)]);
        });

        // Setup click handler for history items
        $("#screenshot-history .history-entry")
           .live('click', $.proxy(this._onScreenshotClick, this));
    },

    /**
     * Creates HTML for a preview tooltip with a preview thumbnail,
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (screenshot) {
        var width, height, date, html;

        width  = Math.round((screenshot.x2 - screenshot.x1) /
                    screenshot.imageScale);
        height = Math.round((screenshot.y2 - screenshot.y1) /
                    screenshot.imageScale);

        date = screenshot.date.substr(0, 19).replace(/T/, " ");

        html = "<div style='text-align: center;'>" +
            "<img src='" + Helioviewer.api + "?action=downloadScreenshot&id=" + screenshot.id +
            "' alt='preview thumbnail' class='screenshot-preview' /></div>" +
            "<table class='preview-tooltip'>" +
            "<tr><td><b>Date:</b></td><td>" + date + "</td></tr>" +
            "<tr><td><b>Scale:</b></td><td>" +
            screenshot.imageScale.toFixed(2) +
            " arcsec/px</td></tr>" +
            "<tr><td><b>Dimensions:</b></td><td>" + width +
            "x" + height + " px</td></tr>" +
            "</table>";

        return html;
    },

    /**
     * When a screenshot history entry is clicked, and the screenshot has
     * finished processing, download the screenshot. Otherwise do nothing.
     */
    _onScreenshotClick: function (event) {
        var id = $(event.currentTarget).data('id'),
            url = Helioviewer.api + "?action=downloadScreenshot&id=" + id;
        window.open(url, '_parent');

        return false;
    },

    /**
     * Gathers all necessary information to generate a screenshot, and then
     * displays the image when it is ready.
     *
     * @param {Object} roi Region of interest to use in place of the current \
     * viewport roi
     */
    _takeScreenshot: function (roi) {
        var params, dataType, imageScale, layers, events, eventLabels, scale, scaleType, scaleX, scaleY, screenshot, self = this;

        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        imageScale  = helioviewer.getImageScale();
        layers      = helioviewer.getVisibleLayers(roi);
        events      = helioviewer.getEvents();

        if ( Helioviewer.userSettings.get("state.eventLayerVisible") === false ) {
            events = '';
            eventLabels = false;
        }

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        params = $.extend({
            action        : "takeScreenshot",
            imageScale    : imageScale,
            layers        : layers,
            events        : events,
            eventLabels   : Helioviewer.userSettings.get("state.eventLabels"),
            scale         : Helioviewer.userSettings.get("state.scale"),
            scaleType     : Helioviewer.userSettings.get("state.scaleType"),
            scaleX        : Helioviewer.userSettings.get("state.scaleX"),
            scaleY        : Helioviewer.userSettings.get("state.scaleY"),
            date          : helioviewer.getDate().toISOString(),
            display       : false
        }, this._toArcsecCoords(roi, imageScale));

        // AJAX Responder
        $.get(Helioviewer.api, params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info",
                    "Unable to create screenshot. Please try again later.");
                return;
            }

            screenshot = self._manager.add(
                response.id, params.imageScale, params.layers,
                new Date().toISOString(), params.date,
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(screenshot);
            self._displayDownloadNotification(screenshot);
        }, Helioviewer.dataType);
    },

    _cleanup: function () {
        $.each(this._cleanupFunctions, function(i, func) {
            eval(func);
        });
    }

});
/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 *
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields?
 * (can pass in a single tree during init)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Layer, TreeSelect, TileLayer, getUTCTimestamp, assignTouchHandlers */
"use strict";
var TileLayerAccordion = Layer.extend(
    /** @lends TileLayerAccordion.prototype */
    {
    /**
     * Creates a new Tile Layer accordion user interface component
     *
     * @param {Object} tileLayers Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer
     *                 manager user interface should be constructed
     */
    init: function (containerId, dataSources, observationDate) {
        this.container        = $(containerId);
        this._dataSources     = dataSources;
        this._observationDate = observationDate;
        this._maximumTimeDiff = 12 * 60 * 60 * 1000; // 12 hours (milliseconds)

        this.options = {};

        // Setup menu UI components
        this._setupUI();

        // Initialize accordion
        this.domNode = $('#TileLayerAccordion-Container');
        this.domNode.dynaccordion({startClosed: false});


        // Event-handlers
        $(document).bind("create-tile-layer-accordion-entry",
                        $.proxy(this.addLayer, this))
                   .bind("update-tile-layer-accordion-entry",
                        $.proxy(this._updateAccordionEntry, this))
                   .bind("observation-time-changed",
                        $.proxy(this._onObservationTimeChange, this));

        // Tooltips
        this.container.delegate("span[title]", 'mouseover', function (event) {
            $(this).qtip({
                overwrite: false,
                show: {
                    event: event.type,
                    ready: true
                }
            }, event);
        })
        .each(function (i) {
            $.attr(this, 'oldtitle', $.attr(this, 'title'));
            this.removeAttribute('title');
        });
    },

    /**
     * Adds a new entry to the tile layer accordion
     *
     * @param {Object} layer The new layer to add
     */
    addLayer: function (event, index, id, name, sourceId, hierarchy, date, startOpened,
        opacity, visible, onOpacityChange) {

        if (typeof(index) === "undefined") {
            index = 1000;
        }

        this._createAccordionEntry(index, id, name, sourceId, visible, startOpened);

        this._initTreeSelect(id, hierarchy);
        this._initOpacitySlider(id, opacity, onOpacityChange);
        this._setupEventHandlers(id);
        this._updateTimeStamp(id, date);
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, sourceId, visible, startOpened) {
        var visibilityBtn, removeBtn, hidden, head, body;

        // initial visibility
        hidden = (visible ? "fa fa-eye fa-fw layerManagerBtn visible" : "fa fa-eye-slash fa-fw layerManagerBtn visible hidden");

        visibilityBtn = '<span class="'
                      + hidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle Image Layer Visibility" '
                      + '></span>';

        removeBtn = '<span class="fa fa-times-circle fa-fw removeBtn" '
                  + 'id="removeBtn-' + id + '" '
                  + 'title="Remove Image Layer" '
                  + '></span>';

        head = '<div class="layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">'
             +     '<div class="tile-accordion-header-left" '
             +           'title="' + name + '" data-sourceid="'+sourceId+'">'
             +         name
             +     '</div>'
             +     '<div class="right">'
             +         '<span class="timestamp user-selectable"></span>'
             +         visibilityBtn
             +         removeBtn
             +     '</div>'
             + '</div>';

        // Create accordion entry body
        body = this._buildEntryBody(id);

        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });
    },

    /**
     *
     */
    _initTreeSelect: function (id, hierarchy) {
        var ids      = new Array(),
            selected = new Array(),
            letters  = ['a','b','c','d','e'],
            self     = this;

        $.each( letters, function (i, letter) {
            ids.push('#'+letter+'-select-'+id);
            if (typeof hierarchy[i] != 'undefined') {
                selected[i] = hierarchy[i]['name'];
            }
            else {
                selected[i] = null;
            }
        });

        this.selectMenus = new TreeSelect(ids, this._dataSources, selected,
            function (leaf) {
                var hierarchySelected = Array();
                $.each(leaf['uiLabels'], function (i, obj) {
                    hierarchySelected[i] = {
                        'label': obj['label'],
                        'name' : obj['name'] };
                });

                $(document).trigger("tile-layer-data-source-changed",
                    [id, hierarchySelected, leaf.sourceId, leaf.nickname,
                     leaf.layeringOrder]);
            }
        );
    },

    /**
     *
     */
    _initOpacitySlider: function (id, opacity, onOpacityChange) {
        $("#opacity-slider-track-" + id).slider({
            value: opacity,
            min  : 0,
            max  : 100,
            slide: function (e, ui) {
                if ((ui.value % 2) === 0) {
                    onOpacityChange(ui.value);
                }
            },
            change: function (e, ui) {
                onOpacityChange(ui.value);
                $(document).trigger("save-tile-layers");
            }
        });
    },

    /**
     * @description Builds the body section of a single TileLayerAccordion entry. NOTE: width and height
     * must be hardcoded for slider to function properly.
     * @param {Object} layer The new layer to add
     * @see <a href="http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f">
     * This discussion thread</a> for explanation.
     */
    _buildEntryBody: function (id) {
        var hierarchy, display, info, jp2, label, letters, opacitySlide,
            popups='', body;

        // Opacity slider placeholder
        opacitySlide  = '<div class="layer-select-label">Opacity: </div>'
                      + '<div class="opacity-slider-track" '
                      +      'id="opacity-slider-track-' + id + '">'
                      + '</div>';

        // Default labels
        letters = ['a','b','c','d','e'];
        hierarchy = Helioviewer.userSettings._defaults.state.tileLayers[0]['uiLabels'];
        $.each(letters, function (i, letter) {
            if ( typeof hierarchy[i]          != 'undefined' &&
                 typeof hierarchy[i]['label'] != 'undefined' ) {

                display = '';
                label = hierarchy[i]['label']+': ';
            }
            else {
                display = 'display: none;';
                label = '';
            }
            popups += '<div style="' + display + '" '
                   +       'class="layer-select-label" '
                   +       'id="' + letter + '-label-' + id +'">'
                   +     label
                   +  '</div> '
                   +  '<select style="' + display + '" '
                   +          'name="' + letter + '" '
                   +          'class="layer-select" '
                   +          'id="' + letter + '-select-' + id + '">'
                   +  '</select>';
        });

        jp2 = '<div id="image-' + id + '-download-btn" '
            +       'class="image-download-btn fa fa-file-image-o fa-fw" '
            +       'title="Download full JPEG 2000 image (grayscale)."'
            +       'style="position: absolute; top: 1.8em; right: 0;">'
            + '</div>';

        info = '<div id="image-' + id + '-info-btn" '
             +       'class="image-info-dialog-btn fa fa-h-square fa-fw" '
             +       'title="Display FITS image header."'
             +       'style="position: absolute; top: 0.2em; right: 0;">'
             + '</div>';

        body = '<div style="position: relative; margin-bottom: 1em;">'
             + jp2
             + info
             + opacitySlide
             + popups
             + '</div>';

        return (body);
    },

    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        // Event-handlers
        $('#add-new-tile-layer-btn').click(function () {
            var accordionClosed;

            $(document).trigger("add-new-tile-layer");

            accordionClosed = $('#accordion-images .disclosure-triangle').hasClass('closed');
            if ( accordionClosed ) {
                $('#accordion-images .disclosure-triangle').click();
            }
        });
    },

    /**
     * @description Sets up event-handlers for a TileLayerAccordion entry
     * @param {Object} layer The layer being added
     */
    _setupEventHandlers: function (id) {
        var toggleVisibility, opacityHandle, removeLayer, self = this,
            visibilityBtn = $("#visibilityBtn-" + id),
            removeBtn     = $("#removeBtn-" + id),
            timestamps    = $("#accordion-images .timestamp");

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            $(document).trigger("toggle-layer-visibility", [id]);
            $("#visibilityBtn-" + id).toggleClass('hidden');
            $("#visibilityBtn-" + id).toggleClass('fa-eye');
            $("#visibilityBtn-" + id).toggleClass('fa-eye-slash');
            $(document).trigger("save-tile-layers");
            e.stopPropagation();
        };

        // Function for handling layer remove button
        removeLayer = function (e) {
            $(document).trigger("remove-tile-layer", [id]);
            self._removeTooltips(id);
            self.domNode.dynaccordion('removeSection', {id: id});
            $(document).trigger("save-tile-layers");
            e.stopPropagation();
        };

        // Fix drag and drop for mobile browsers\
        opacityHandle = $("#" + id + " .ui-slider-handle")[0];
        assignTouchHandlers(opacityHandle);

        visibilityBtn.bind('click', this, toggleVisibility);
        removeBtn.bind('click', removeLayer);
        timestamps.bind('click', function(e) {
            e.stopPropagation();
        });
    },

    /**
     * @description Displays the Image meta information and properties associated with a given image
     * @param {Object} layer
     */
    _showImageInfoDialog: function (id, name, imageId) {
        var params, dtype, self = this, dialog = $("#image-info-dialog-" + id);

        // Check to see if a dialog already exists
        if (dialog.length !== 0) {
            if (!dialog.dialog("isOpen")) {
                dialog.dialog("open");
            }
            else {
                dialog.dialog("close");
            }
            return;
        }

        // Request parameters
        params = {
            action : "getJP2Header",
            id     : imageId
        };

        // For remote queries, retrieve XML using JSONP
        if (Helioviewer.dataType === "jsonp") {
            dtype = "jsonp text xml";
        } else {
            dtype = "xml";
        }

        $.get(Helioviewer.api, params, function (response) {
            self._buildImageInfoDialog(name, id, response);
        }, dtype);
    },

    /**
     * Creates a dialog to display image properties and header tags
     */
    _buildImageInfoDialog: function (name, id, response) {
        var dialog, sortBtn, tabs, html, tag, json;

        // Convert from XML to JSON
        json = $.xml2json(response);

        // Format results
        dialog =  $("<div id='image-info-dialog-" + id +  "' class='image-info-dialog' />");

        // Header section
        html = "<div class='image-info-dialog-menu'>" +
               "<a class='show-fits-tags-btn selected'>[FITS]</a>" +
               "<a class='show-helioviewer-tags-btn'>Helioviewer</a>" +
               "<span class='image-info-sort-btn'>Abc</span>" +
               "</div>";

        // Separate out Helioviewer-specific tags if not already done
        //(older data may have HV_ tags mixed in with FITS tags)
        if (!json.helioviewer) {
            json.helioviewer = {};

            $.each(json.fits, function (key, value) {
                if (key.substring(0, 3) === "HV_") {
                    json.helioviewer[key.slice(3)] = value;
                    delete json.fits[key];
                }
            });
        }

        // Add FITS and Helioviewer header tag blocks
        html += "<div class='image-header-fits'>"        + this._generateImageKeywordsSection(json.fits) + "</div>" +
                "<div class='image-header-helioviewer' style='display:none;'>" +
                this._generateImageKeywordsSection(json.helioviewer) + "</div>";

        dialog.append(html).appendTo("body").dialog({
            autoOpen : true,
            title    : "Image Information: " + name,
            minWidth : 546,
            width    : 546,
            height   : 350,
            draggable: true,
            create   : function (event, ui) {
                var fitsBtn = dialog.find(".show-fits-tags-btn"),
                    hvBtn   = dialog.find(".show-helioviewer-tags-btn"),
                    sortBtn = dialog.find(".image-info-sort-btn");

                fitsBtn.click(function () {
                    fitsBtn.html("[FITS]");
                    hvBtn.html("Helioviewer");
                    dialog.find(".image-header-fits").show();
                    dialog.find(".image-header-helioviewer").hide();
                });

                hvBtn.click(function () {
                    fitsBtn.html("FITS");
                    hvBtn.html("[Helioviewer]");
                    dialog.find(".image-header-fits").hide();
                    dialog.find(".image-header-helioviewer").show();
                });

                // Button to toggle sorting
                sortBtn.click(function () {
                    var sorted = !$(this).hasClass("italic");
                    $(this).toggleClass("italic");

                    if (sorted) {
                        dialog.find(".unsorted").css('display', 'none');
                        dialog.find(".sorted").css('display', 'block');
                    } else {
                        dialog.find(".sorted").css('display', 'none');
                        dialog.find(".unsorted").css('display', 'block');
                    }
                });

            }
        });
    },

    /**
     * Takes a JSON list of image header tags and returns sorted/unsorted HTML
     */
    _generateImageKeywordsSection: function (list) {
        var unsorted, sortFunction, sorted, tag, tags = [];

        // Unsorted list
        unsorted = "<div class='unsorted'>";
        $.each(list, function (key, value) {
            tag = "<span class='image-header-tag'>" + key + ": </span>" +
                  "<span class='image-header-value'>" + value + "</span>";
            tags.push(tag);
            unsorted += tag + "<br>";
        });
        unsorted += "</div>";

        // Sort function
        sortFunction = function (a, b) {
            // <span> portion is 31 characters long
            if (a.slice(31) < b.slice(31)) {
                return -1;
            } else if (a.slice(31) > b.slice(31)) {
                return 1;
            }
            return 0;
        };

        // Sorted list
        sorted = "<div class='sorted' style='display: none;'>";
        $.each(tags.sort(sortFunction), function () {
            sorted += this + "<br>";
        });
        sorted += "</div>";

        return unsorted + sorted;
    },

    /**
     * @description Unbinds event-handlers relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        $("#" + id + " *[oldtitle]").qtip("destroy");
    },

    /**
     * Keeps track of requested date to use when styling timestamps
     */
    _onObservationTimeChange: function (event, requestDate) {
        var actualDate, weight, domNode, self = this;

        this._observationDate = requestDate;

        // Update timestamp colors
        $("#TileLayerAccordion-Container .timestamp").each(function (i, item) {
            domNode    = $(this);
            actualDate = new Date(getUTCTimestamp(domNode.text()));
            weight = self._getScaledTimeDifference(actualDate, requestDate);
            domNode.css("color", self._chooseTimeStampColor(weight, 0, 0, 0));
        });
    },

    /**
     *
     */
    _updateAccordionEntry: function (event, id, name, sourceId, opacity, date, imageId,
        hierarchy) {

        var entry=$("#"+id), self=this, letters=['a','b','c','d','e'],
            label, select;

        this._updateTimeStamp(id, date);

        entry.find(".tile-accordion-header-left").html(name);
        entry.find(".tile-accordion-header-left").attr('title', name);
        entry.find(".tile-accordion-header-left").attr('data-sourceid', sourceId);

        $.each( letters, function(i, letter) {
            label  = entry.find("#"+letters[i]+"-label-"+id);
            select = entry.find("#"+letters[i]+"-select-"+id);
            if ( typeof hierarchy[i] != 'undefined' ) {
                label.html(hierarchy[i]['label']+':').show();
                select.show();
            }
            else {
                label.empty().hide();
                select.empty().hide();
            }
        });

        // Refresh Image header event listeners
        $("#image-info-dialog-" + id).remove();

        entry.find("#image-" + id + "-info-btn").unbind().bind('click',
            function () {
                self._showImageInfoDialog(id, name, imageId);
            });

        // JPEG 2000 download button
        $("#image-" + id + "-download-btn").unbind().bind('click', function () {
            window.open(Helioviewer.api + "?action=getJP2Image&id=" + imageId);
            return false;
        });

        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    _updateTimeStamp: function (id, date) {
        var weight = this._getScaledTimeDifference(date, this._observationDate);

        $("#" + id).find('.timestamp').html(date.toUTCDateString() + " " + date.toUTCTimeString())
                   .css("color", this._chooseTimeStampColor(weight, 0, 0, 0));
    },

    /**
     * Returns a value from 0 to 1 representing the amount of deviation from the requested time
     */
    _getScaledTimeDifference: function (t1, t2) {
        return Math.min(1, Math.abs(t1.getTime() - t2.getTime()) / this._maximumTimeDiff);
    },

    /**
     * Returns a CSS RGB triplet ranging from green (close to requested time) to yellow (some deviation from requested
     * time) to red (requested time differs strongly from actual time).
     *
     * @param float weight  Numeric ranging from 0.0 (green) to 1.0 (red)
     * @param int   rOffset Offset to add to red value
     * @param int   gOffset Offset to add to green value
     * @param int   bOffset Offset to add to blue value
     */
    _chooseTimeStampColor: function (w, rOffset, gOffset, bOffset) {
        var r = Math.min(255, rOffset + parseInt(2 * w * 255, 10)),
            g = Math.min(255, gOffset + parseInt(2 * 255 * (1 - w), 10)),
            b = bOffset + 0;

        return "rgb(" + r + "," + g + "," + b + ")";
    }
});

/**
 * @fileOverview Contains the class definition for an EventLayerAccordion class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 *
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields?
 * (can pass in a single tree during init)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Layer, TreeSelect, TileLayer, getUTCTimestamp, assignTouchHandlers */
"use strict";
var EventLayerAccordion = Layer.extend(
    /** @lends EventLayerAccordion.prototype */
    {
    /**
     * Creates a new Tile Layer accordion user interface component
     *
     * @param {Object} Events Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer
     *                 manager user interface should be constructed
     */
    init: function (containerId, eventTypes, date) {

        this.container        = $(containerId);
        this._eventTypes      = eventTypes;
        this._date            = date;
        this._maximumTimeDiff = 12 * 60 * 60 * 1000; // 12 hours in miliseconds

        this.options = {};

        // Setup menu UI components
        this._setupUI();

        // Initialize accordion
        this.domNode = $('#EventLayerAccordion-Container');
        this.domNode.dynaccordion({startClosed: true});

        // Event-handlers
        $(document).bind("create-event-layer-accordion-entry", $.proxy(this.addLayer, this))
                   .bind("update-event-layer-accordion-entry", $.proxy(this._updateAccordionEntry, this))
                   .bind("observation-time-changed",           $.proxy(this._onObservationTimeChange, this));


        // Tooltips
        this.container.delegate("span[title]", 'mouseover', function (event) {
            $(this).qtip({
                overwrite: false,
                show: {
                    event: event.type,
                    ready: true
                }
            }, event);
        })
        .each(function (i) {
            $.attr(this, 'oldtitle', $.attr(this, 'title'));
            this.removeAttribute('title');
        });
    },

    /**
     * Adds a new entry to the event accordion
     *
     * @param {Object} layer The new layer to add
     */
    addLayer: function (event, index, id, name, date, startOpened, markersVisible, labelsVisible) {
        this._createAccordionEntry(index, id, name, markersVisible, labelsVisible, startOpened);
        this._setupEventHandlers(id);
        this._updateTimeStamp(id, date);
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, markersVisible, labelsVisible, startOpened) {

        var visibilityBtn, labelsBtn/*, removeBtn*/, markersHidden, labelsHidden, head, body, self=this;

        // initial visibility
        markersHidden = (markersVisible ? "" : " hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");

        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                      + markersHidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle visibility of event marker pins" '
                      + '></span>';

        labelsBtn = '<span class="fa fa-tags fa-fw labelsBtn'
                  + labelsHidden + '" '
                  + 'id="labelsBtn-' + id + '" '
                  + 'title="Toggle Visibility of Feature and Event Text Labels" '
                  + '></span>';

        head = '<div class="layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">'
             +     '<div class="left">'
             +        name
             +     '</div>'
             +     '<div class="right">'
             +        '<span class="timestamp user-selectable"></span>'
             +        visibilityBtn
             +        labelsBtn
             +     '</div>'
             + '</div>';

        // Create accordion entry body
        body  = '<div class="row" style="text-align: left;"><div class="buttons"><div id="checkboxBtn-On-'+id+'" title="Toggle All Event Checkboxes On" class="text-button inline-block"><div class="fa fa-check-square fa-fw"></div>check all</div>';
        body += '<div id="checkboxBtn-Off-'+id+'" title="Toggle All Event Checkboxes Off" class="text-button inline-block"><div class="fa fa-square fa-fw"></div>check none</div></div>';
        body += '<div id="eventJSTree" style="margin-bottom: 5px;"></div></div>';


        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });

        this.getEventGlossary();

        this.domNode.find("#checkboxBtn-"+id).click( function() {
            $(document).trigger("toggle-checkboxes");
        });

        this.domNode.find("#checkboxBtn-On-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", ['on']);
        });

        this.domNode.find("#checkboxBtn-Off-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", ['off']);
        });

        this.domNode.find("#labelsBtn-"+id).click( function(e) {
            $(document).trigger("toggle-event-labels", [$("#labelsBtn-"+id)]);
            e.stopPropagation();
        });

        this.domNode.find(".timestamp").click( function(e) {
            e.stopPropagation();
        });

    },


    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    getEventGlossary: function () {
        var params = {
            "action": "getEventGlossary"
        };
        $.get(Helioviewer.api, params, $.proxy(this._setEventGlossary, this), "json");
    },


    _setEventGlossary: function(response) {
        this._eventManager = new EventManager(response, this._date);
    },


    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        return;
    },

    /**
     * @description Sets up event-handlers for a EventLayerAccordion entry
     * @param {String} id
     */
    _setupEventHandlers: function (id) {
        var toggleVisibility, opacityHandle, removeLayer, visState, self = this,
            visibilityBtn = $("#visibilityBtn-" + id)/*,
            removeBtn     = $("#removeBtn-" + id)*/;

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            var domNode;

            domNode = $(document).find("#event-container");
            if ( domNode.css('display') == 'none') {
                domNode.show();
                Helioviewer.userSettings.set("state.eventLayerVisible", true);
                $("#visibilityBtn-" + id).removeClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye-slash');
                $("#visibilityBtn-" + id).addClass('fa-eye');
            }
            else {
                domNode.hide();
                Helioviewer.userSettings.set("state.eventLayerVisible", false);
                $("#visibilityBtn-" + id).addClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye');
                $("#visibilityBtn-" + id).addClass('fa-eye-slash');
            }

            e.stopPropagation();
        };

        visibilityBtn.bind('click', this, toggleVisibility);
    },


    /**
     * @description Unbinds event-handlers relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        $("#" + id + " *[oldtitle]").qtip("destroy");
    },


    /**
     * Keeps track of requested date to use when styling timestamps and
     * requests a reload of the event type checkbox hierarchy for the new timestamp
     */
    _onObservationTimeChange: function (event, requestDate) {
        var actualDate, weight, domNode, self = this;
        this._date = requestDate;

        // Refresh Event/FRM checkbox hierarchy and EventMarkers
        this._eventManager.updateRequestTime();

        // Update value/color of timestamp(s)
        // For HEK events, we can _always_ use the exact same date as the requestDate
        $("#EventLayerAccordion-Container .timestamp").each(function (i, item) {
            domNode = $(this);
            domNode.html(self._date.toUTCDateString() + " " + self._date.toUTCTimeString())
                   .css("color", self._chooseTimeStampColor(0, 0, 0, 0));
        });
    },


    /**
     *
     */
    _updateAccordionEntry: function (event, id, name, opacity, date, imageId) {
        var entry = $("#" + id), self = this;

        // Update value/color of .timeStamp in accordion header
        this._updateTimeStamp(id, date);

        // Update 'name' in accordion header
        entry.find(".tile-accordion-header-left").html(name);
    },

    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    _updateTimeStamp: function (id, date) {

        var weight = this._getScaledTimeDifference(date, this._date);

        $("#" + id).find('.timestamp').html(date.toUTCDateString() + " " + date.toUTCTimeString())
                   .css("color", this._chooseTimeStampColor(weight, 0, 0, 0));
    },

    /**
     * Returns a value from 0 to 1 representing the amount of deviation from the requested time
     */
    _getScaledTimeDifference: function (t1, t2) {
        return Math.min(1, Math.abs(t1.getTime() - t2.getTime()) / this._maximumTimeDiff);
    },

    /**
     * Returns a CSS RGB triplet ranging from green (close to requested time) to yellow (some deviation from requested
     * time) to red (requested time differs strongly from actual time).
     *
     * @param float weight  Numeric ranging from 0.0 (green) to 1.0 (red)
     * @param int   rOffset Offset to add to red value
     * @param int   gOffset Offset to add to green value
     * @param int   bOffset Offset to add to blue value
     */
    _chooseTimeStampColor: function (w, rOffset, gOffset, bOffset) {
        var r = Math.min(255, rOffset + parseInt(2 * w * 255, 10)),
            g = Math.min(255, gOffset + parseInt(2 * 255 * (1 - w), 10)),
            b = bOffset + 0;

        return "rgb(" + r + "," + g + "," + b + ")";
    }
});

/**
 * @fileOverview Contains the "MessageConsole" class definition.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class, window */
"use strict";
var MessageConsole = Class.extend(
    /** @lends MessageConsole.prototype */
    {
    /**
     * @constructs
     * @description Creates a new MessageConsole.<br><br>
     * MessageConsole Provides a mechanism for displayed useful information to the user.
     * For ease of use, the class provides methods comparable to Firebug's for outputting
     * messages of different natures: "log" for generic unstyled messages, or for debbuging
     * use, "info" to inform the user of some interesting change or event, and "warning" and
     * "error" for getting the user's attention.
     */
    init: function () {
        this._setupEventHandlers();
        this._defaults = {
            "life": 15000
        }
    },

    /**
     * @description Logs a message to the message-console
     * @param {String} msg Message to display
     */
    log: function (msg, options) {
        options = $.extend(this._defaults, options);
        $("#message-console").jGrowl(msg, options);
    },

    /**
     * @description Makes a jGrowl notification and allows options to modify the notification
     * @param {Object} msg
     * @param {Object} options
     */
    info: function (msg, options) {
        options = $.extend(this._defaults, options);
        $("#message-console").jGrowl(msg, options);
    },

    /**
     * @description Displays a warning message in the message console
     * @param {String} msg Message to display
     */
    warn: function (msg, options) {
        options = $.extend(this._defaults, options);
        $("#message-console").jGrowl(msg, options);
    },

    /**
     * @description Displays an error message in the message console
     * @param {String} msg Message to display
     */
    error: function (msg, options) {
        options = $.extend(this._defaults, options);
        $("#message-console").jGrowl(msg, options);
    },

    /**
     * Sets up event-handlers
     */
    _setupEventHandlers: function () {
        var events, self = this;

        events = "message-console-log message-console-info message-console-warn message-console-error";

        $(document).bind(events, function (event, msg, options, showElapsedTime, easyClose) {
            // Default options
            if (typeof options === "undefined") {
                options = {};
            }
            if (typeof showElapsedTime === "undefined") {
                showElapsedTime = false;
            }
            if (typeof easyClose === "undefined") {
                easyClose = false;
            }

            // Show time elapsed since message was opened?
            if (showElapsedTime) {
                var id, header, headerText, i = 1;

                options = $.extend(options, {
                    beforeOpen: function (elem, message, opts) {
                        header = elem.find(".jGrowl-header");

                        id = window.setInterval(function () {
                            if (i === 1) {
                                headerText = "1 minute ago";
                            } else if (i < 60) {
                                headerText = i + " minutes ago";
                            } else if (i < 1440) {
                                headerText = parseInt(i / 60, 10) + " hours ago";
                            } else {
                                headerText = "A long time ago...";
                            }

                            header.text(headerText);
                            i += 1;
                        }, 60000);

                        // keep track of timer id so it can be disabled later
                        elem.data("timerId", id);
                    },
                    close: function (elem, message) {
                        window.clearInterval(elem.data("timerId"));
                    }
                });
            }

            // Click anywhere in the message to close?
            if (easyClose) {
                options = $.extend(options, {
                    afterOpen: function (msg) {
                        msg.click(function (e) {
                            msg.trigger("jGrowl.close");
                        });
                    }
                });
            }

            if (event.type === "message-console-log") {
                self.log(msg, options);
            } else if (event.type === "message-console-info") {
                self.info(msg, options);
            } else if (event.type === "message-console-warn") {
                self.warn(msg, options);
            } else if (event.type === "message-console-error") {
                self.error(msg, options);
            }
        });
    }
});
/**
 * @fileOverview Contains the class definition for an TimeControls class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see Time
 *
 * TODO: Use highlight or similar effect on date and time input fields themselves when
 * invalid data is specified.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Helioviewer, window, Class */
"use strict";
var TimeControls = Class.extend(
    /** @lends TimeControls.prototype */
    {
    /**
     * Creates a new TimeControl component
     *
     * @constructs
     * @param {String} dateId          The id of the date form field associated with the Time.
     * @param {String} timeId          The id of the time form field associated with the Time.
     * @param {String} incrementSelect The id of the HTML element for selecting the time increment
     * @param {String} backBtn         The id of the time "Back" button
     * @param {String} forwardBtn      The id of the time "Forward" button
     */
    init : function (dateInput, timeInput, incrementSelect, backBtn, forwardBtn, urlDate) {
        if (typeof urlDate === "undefined") {
            urlDate = false;
        }
        this._setInitialDate(urlDate);
        this._timeIncrement = Helioviewer.userSettings.get("state.timeStep");
        this._timer;

        this._dateInput       = $(dateInput);
        this._timeInput       = $(timeInput);
        this._backBtn         = $(backBtn);
        this._forwardBtn      = $(forwardBtn);
        this._incrementSelect = $(incrementSelect);

        this._addTimeIncrements();
        this._updateInputFields();
        this._initDatePicker();
        this._initEventHandlers();
    },

    /**
     * Returns the current observation date as a JavaScript Date object
     *
     * @returns int Unix timestamp representing the current observation date in UTC
     */
    getDate: function () {
        return new Date(this._date.getTime()); // return by value
    },

    /**
     * @description Returns a unix timestamp for the current observation time
     */
    getTimestamp: function () {
        return this._date.getTime();
    },

    /**
     * @description returns the contents of the date input field
     */
    getDateField: function () {
        return this._dateInput.val();
    },

    /**
     * Returns the contents of the time input field
     */
    getTimeField: function () {
        return this._timeInput.val();
    },

    /**
     * Returns the time increment currently displayed in Helioviewer.
     * @return {int} this._timeIncrement -- time increment in secons
     */
    getTimeIncrement: function () {
        return this._timeIncrement;
    },

    /**
     * Sets the observation date to that of the most recent available image for
     * the currently loaded layers
     *
     * @return void
     */
    goToPresent: function () {
        var dataType, callback, layers, date, mostRecent = new Date(0, 0, 0),
            self = this, letters=Array('a','b','c','d','e'),
            layerHierarchy = [];

        callback = function (dataSources) {

            // Get hierarchy of label:name for each layer accordion
            $.each( $("#TileLayerAccordion-Container .dynaccordion-section"),
                function (i, accordion) {
                    var idBase = $(accordion).attr('id'), label, name;

                    layerHierarchy[i] = [];
                    $.each( letters, function (j, letter) {
                        if ( $('#'+letters[j]+'-select-'+idBase).css('display') != 'none' ) {
                            label = $('#'+letters[j]+'-label-'+idBase).html()
                                    .slice(0,-1);
                            name  = $('#'+letters[j]+'-select-'+idBase
                                         +' option:selected').val();

                            layerHierarchy[i][j] = { 'label':label,
                                                     'name' :name }
                        }
                    });
                }
            );

            // For each data tile-layer accordion, get the data source "end"
            // date (which is the date/time of the most current piece of data
            // for that source).  Keep the overall most current "end" date.
            $.each( layerHierarchy, function (i, hierarchy) {
                var leaf = dataSources;
                $.each( hierarchy, function (j, property) {
                    leaf = leaf[property['name']];
                });

                date = Date.parseUTCDate(leaf['end']);
                if (date > mostRecent) {
                    mostRecent = date;
                }
            });

            // Set the date/time of the Viewport
            self.setDate(mostRecent);
        };
        $.get(Helioviewer.api, {action: "getDataSources"}, callback, Helioviewer.dataType);
    },

    /**
     * Sets the desired viewing date and time.
     *
     * @param {Date} date A JavaScript Date object with the new time to use
     */
    setDate: function (date) {
        this._date = date;
        this._onDateChange();
    },

    /**
     * Enables automatic updating of observation time every five minutes
     */
    enableAutoRefresh: function () {
        this._timer = setInterval($.proxy(this.goToPresent, this), 300000);
    },

    /**
     * Enables automatic updating of observation time every five minutes
     */
    disableAutoRefresh: function () {
        clearInterval(this._timer);
    },

    /**
     * Chooses the date to use when Helioviewer.org is first loaded
     */
    _setInitialDate: function (urlDate) {
        if (urlDate) {
            this._date = urlDate;
        } else if (Helioviewer.userSettings.get("options.date") === "latest") {
            this._date = new Date(+new Date());
        } else {
            this._date = new Date(Helioviewer.userSettings.get("state.date"));
        }

        // Update stored date
        Helioviewer.userSettings.set("state.date", this._date.getTime());
    },

   /**
    * Moves back one time incremement
    */
    timePrevious: function () {
        this._addSeconds(-this._timeIncrement);
    },

    /**
     * Moves forward one time increment
     */
    timeNext: function () {
        this._addSeconds(this._timeIncrement);
    },

    /**
     * Gets an ISO 8601 string representation of the current observation time
     */
    toISOString: function () {
        return this._date.toISOString();
    },

    /**
     * @descriptional Initialize date and Time-related events
     */
    _initEventHandlers: function () {
        this._backBtn.bind('click', $.proxy(this.timePrevious, this));
        this._forwardBtn.bind('click', $.proxy(this.timeNext, this));
        this._timeInput.bind('change', $.proxy(this._onTextFieldChange, this));
        this._dateInput.bind('change', $.proxy(this._onTextFieldChange, this));
        $("#timeNowBtn").click($.proxy(this.goToPresent, this));

        $(document).bind('timestep-backward', $.proxy(this.timePrevious, this))
                   .bind('timestep-forward',  $.proxy(this.timeNext, this));
    },

    /**
     * Adds or subtracts a number of seconds to the current date
     * @param {int} seconds The number of seconds to adjust the date by
     */
    _addSeconds: function (seconds) {
        this._date.addSeconds(seconds);
        this._onDateChange();
    },

    /**
     * @description Populates the time increment select item
     */
    _addTimeIncrements: function () {
        var timeSteps, select, opt;

        timeSteps = [
            {numSecs: 1,        txt: "1&nbsp;Sec"},
            {numSecs: 60,       txt: "1&nbsp;Min"},
            {numSecs: 300,      txt: "5&nbsp;Mins"},
            {numSecs: 900,      txt: "15&nbsp;Mins"},
            {numSecs: 3600,     txt: "1&nbsp;Hour"},
            {numSecs: 21600,    txt: "6&nbsp;Hours"},
            {numSecs: 43200,    txt: "12&nbsp;Hours"},
            {numSecs: 86400,    txt: "1&nbsp;Day"},
            {numSecs: 604800,   txt: "1&nbsp;Week"},
            {numSecs: 2419200,  txt: "28&nbsp;Days"},
            {numSecs: 31556926, txt: "1&nbsp;Year"}
        ];

        // Add time-steps to the select menu
        select = this._incrementSelect;

        $(timeSteps).each(function (i, timestep) {
            opt = $("<option value='" + timestep.numSecs + "'>" + timestep.txt + "</option>");
            select.append(opt);
        });

        // Select default timestep and bind event listener
        select.bind('change', $.proxy(this._onTimeIncrementChange, this))
              .find("[value = " + this._timeIncrement + "]").attr("selected", "selected");
    },

    /**
     * Initializes the observation time datepicker
     */
    _initDatePicker: function () {
        var btnId, btn, self = this;

        // Initialize datepicker
        this.cal = this._dateInput.datepicker({
            buttonImage    : 'resources/images/blackGlass/calendar_small.png',
            buttonImageOnly: true,
            buttonText     : "Select a date.",
            changeYear     : true,
            dateFormat     : 'yy/mm/dd',
            mandatory      : true,
            showOn         : 'button',
            yearRange      : '1990:'+String((new Date).getFullYear()),
            onSelect       : function (dateStr) {
                window.setTimeout(function () {
                    self._onTextFieldChange();
                }, 500);
            }
        });

        // Datepicker icon
        btnId = '#observation-controls .ui-datepicker-trigger';
        btn   = $(btnId);

        btn.hover(
            function () {
                this.src = "resources/images/blackGlass/calendar_small-hover.png";
            },
            function () {
                this.src = "resources/images/blackGlass/calendar_small.png";
            }
        ).attr("title", "Select an observation date.")
         .click(function () {
                btn.qtip("hide");
            });

        // Tooltips
        btn.qtip();
    },

    /**
     * Updates form fields and lets other interested objects know about new time
     */
    _onDateChange: function () {
        this._updateInputFields();
        Helioviewer.userSettings.set("state.date", this._date.getTime());
        $(document).trigger("observation-time-changed", [this._date]);
    },

    /**
     * Handles changes to date and time text fields
     */
    _onTextFieldChange: function () {
        if (this._validateDate() && this._validateTime()) {
            this.setDate(this._timeFieldsToDateObj());
        }
        // IE8: Prevent default button click from being triggered
        return false;
    },

   /**
    * @description Time-increment change event handler
    * @param {Event} e Prototype Event Object
    */
    _onTimeIncrementChange: function (e) {
        this._timeIncrement = parseInt(e.target.value, 10);
        Helioviewer.userSettings.set("state.timeStep", this._timeIncrement);
    },

    /**
     * Returns a JavaScript Date object with the user's local timezone offset factored out
     */
    _timeFieldsToDateObj: function () {
        return Date.parseUTCDate(this.getDateField() + " " + this.getTimeField());
    },

    /**
     * @description Updates the HTML form fields associated with the time manager.
     */
    _updateInputFields: function () {
        this._dateInput.val(this._date.toUTCDateString());
        this._timeInput.val(this._date.toUTCTimeString());
    },

    /**
     * Returns true if the date input field is a valid date and displays a warning message to
     * the user otherwise
     */
    _validateDate: function () {
        var dateString = this.getDateField();

        if (dateString.match(/^\d{4}\/\d{2}\/\d{2}?/) && (dateString.length === 10)) {
            return true;
        } else {
            $(document).trigger("message-console-warn", ["Invalid date. Please enter a date of the form YYYY/MM/DD."]);
            return false;
        }
    },

    /**
     * Returns true if the time input field is a valid date and displays a warning message to
     * the user otherwise
     */
    _validateTime: function () {
        var timeString = this.getTimeField();

        if (timeString.match(/^\d{2}:\d{2}:\d{2}?/) && (timeString.length === 8)) {
            return true;
        } else {
            $(document).trigger("message-console-warn", ["Invalid time. Please enter a time of the form HH:MM:SS."]);
            return false;
        }
    }
});
/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview Handles the creation of a button which allows toggling between normal and fullscreen mode.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var FullscreenControl = Class.extend(
    /** @lends FullscreenControl.prototype */
    {
    /**
     * @description Creates a new FullscreenControl.
     * @constructs
     */
    init: function (btnId, speed) {

        // Create icon and apply title attribute
        this.btn      = $(btnId);
        this.btn.append('<span class="ui-icon ui-icon-arrow-4-diag"></span>');
        this.btn.attr('title', 'Enable fullscreen mode.');
        this.icon     = $(btnId).find('span.ui-icon');

        // Sections to be resized or hidden
        this.body     = $('body');
        this.colmid   = $('#colmid');
        this.colright = $('#colright');
        this.col1pad  = $('#col1pad');
        this.col2     = $('#col2');
        this.viewport = $('#helioviewer-viewport-container-outer');
        this.sandbox  = $('#sandbox');
        this.header   = $('#header');
        this.footer   = $('#footer');
        this.meta     = $('#footer-container-outer');
        this.panels   = $('#col2, #col3, #header, #footer');

        // Layout assumptions
        this.sidebarWidth = 280;  // px
        this.marginSize   = 4;    // px

        // Positions when Morescreen mode is DISABLED
        //   (both sidebars on)
        this.disabled_col1padMarginLeft   =  2*(this.sidebarWidth + this.marginSize);
        this.disabled_col1padMarginRight  =  0;
        this.disabled_col1padMarginTop    =  0;
        this.disabled_colRightMarginLeft  = -2*(this.sidebarWidth + this.marginSize);
        this.disabled_col2Left   = this.sidebarWidth + this.marginSize + 2;
        this.disabled_colMidLeft = this.sidebarWidth + this.marginSize;

        // Positions when Morescreen mode is ENABLED
        //   (left sidebar on, right sidebar off)
        this.enabled_colMidLeft  = 0;
        this.enabled_colMidRight = 0;
        this.enabled_col2Left = -(this.sidebarWidth + this.marginSize + 2) - this.sidebarWidth;
        this.enabled_colrightMarginLeft = 0;

        // Static positions (used to override any Fullscreen mode settings)
        this.static_headerHeight = this.header.height();
        this.static_footerHeight = this.footer.height();

        this._overrideAnimate();

        this._setupEventHandlers();
    },

    /**
     * Returns true if Helioviewer is currently in fullscreen mode
     */
    isEnabled: function () {
        if ( $('#morescreen-btn > span.ui-icon').hasClass('ui-icon-arrowstop-1-w') ) {
            this._fullscreenMode = false;
        }
        return this._fullscreenMode;
    },

    /**
     * Enable fullscreen mode
     */
    enableFullscreenMode: function (animated) {
        // hide overflow and reduce min-width
        this.body.css({
            'overflow' :'hidden',
            'min-width': 450
        });

        this.meta.hide();

        // Expand viewport
        if (animated) {
            this._expandAnimated();
        } else {
            this._expand();
        }
    },

    /**
     * Expand viewport and hide other UI componenets using an animated
     * transition
     */
    _expandAnimated: function () {
        var self = this,
            moreScreenBtn;

        this.colmid.animate({
            left : this.enabled_colMidLeft  + 'px',
            right: this.enabled_colMidRight + 'px'
        }, this.speed,
        function () {
            $(document).trigger('update-viewport');
            self.panels.hide();
            self.body.removeClass('disable-fullscreen-mode');
        });

        this.colright.animate({
            'margin-left': this.enabled_colrightMarginLeft + 'px'
        }, this.speed);

        this.col1pad.animate({
            'margin-left' : this.marginSize,
            'margin-right': this.marginSize,
            'margin-top'  : this.marginSize
        }, this.speed);

        this.col2.animate({
            'left': this.enabled_col2Left + 'px'
        }, this.speed);

        this.header.animate({
            'height': 0
        }, this.speed);

        this.viewport.animate({
            'height': $(window).height() - (3 * this.marginSize)
        }, this.speed);

        // Keep sandbox up to date
        this.sandbox.animate({
            'right': 0.1 // Trash
        }, this.speed);

        this.btn.attr('title', 'Disable fullscreen mode.');

        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Show left sidebar.');
        }

    },

    /**
     * Expand viewport and hide other UI components using an animated
     * transition
     */
    _expand: function () {
        var moreScreenBtn;

        this.colmid.css({
            'left' : this.enabled_colMidLeft  + 'px',
            'right': this.enabled_colMidRight + 'px'
        });

        this.col1pad.css({
            'margin-left' : this.marginSize,
            'margin-right': this.marginSize,
            'margin-top'  : this.marginSize
        });

        this.col2.css({
            'left': this.enabled_col2Left + 'px'
        });

        this.header.height(0);
        this.viewport.css({
            'height': $(window).height() - (3 * this.marginSize)
        });

        this.sandbox.css({
            'right': 0.1 // Trash
        });

        $(document).trigger('update-viewport');
        this.panels.hide();
        this.body.removeClass('disable-fullscreen-mode');

        this.btn.attr('title', 'Disable fullscreen mode.');

        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Show left sidebar.');
        }
    },

    /**
     * Disable fullscreen mode
     */
    disableFullscreenMode: function () {
        var offset,
            self = this,
            viewportHeight = $(window).height() - this.static_headerHeight - this.static_footerHeight - 2,
            moreScreenBtn;

        this.panels.show();

        this.colmid.animate({
            'left': this.disabled_colMidLeft + 'px'
        }, this.speed,
        function () {
            self.meta.show();
            self.body.css({
                'overflow': 'visible',
            }).removeClass('disable-fullscreen-mode');
        });

        this.colright.animate({
            'margin-left': this.disabled_colRightMarginLeft + 'px'
        }, this.speed);

        this.col1pad.animate({
            'margin-left' : this.disabled_col1padMarginLeft  + 'px',
            'margin-right': this.disabled_col1padMarginRight + 'px',
            'margin-top'  : this.disabled_col1padMarginTop   + 'px'
        }, this.speed);

        this.col2.animate({
            'left': this.disabled_col2Left + 'px'
        }, this.speed);

        this.header.animate({
            'height': this.static_headerHeight + 'px'
        }, this.speed);

        this.viewport.animate({
            'height': viewportHeight + 'px'
        }, this.speed);
        this.sandbox.animate({
            'right': 0
        }, this.speed, function () {
            offset = self.viewport.offset();
        });

        this.body.animate({
            'min-width': '972px'
        }, this.speed);

        this.btn.attr('title', 'Enable fullscreen mode.');

        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Hide right sidebar.');
        }
    },

    /**
     * Sets up event handlers related to fullscreen control
     */
    _setupEventHandlers: function () {
        this.btn.click($.proxy(this._toggle, this));

        // Used by KeyboardManager:
        $(document).bind('toggle-fullscreen', $.proxy(this._toggle, this));
    },

    /**
     * Toggles fullscreen mode on or off
     */
    _toggle: function (animated) {

        if (this.body.hasClass('disable-fullscreen-mode')) {
            return;
        }

        if ( typeof(animated) == 'undefined' ) {
            animated = true;
        }

        // make sure action finishes before starting a new one
        this.body.addClass('disable-fullscreen-mode');

        if ( this.isEnabled() ) {
            this.disableFullscreenMode();
            this.viewport.removeClass('fullscreen-mode');
        }
        else {
            this.enableFullscreenMode(animated);
            this.viewport.addClass('fullscreen-mode');
        }

        // toggle fullscreen class
        this._fullscreenMode = !this._fullscreenMode;
    },

    /**
     * Overides jQuery's animation method
     *
     * http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
     */
    _overrideAnimate: function () {
        var doc               = $(document),
            $_fx_step_default = $.fx.step._default;

        $.fx.step._default = function (fx) {
            if ( fx.elem.id !== 'sandbox' ) {
                return $_fx_step_default(fx);
            }
            doc.trigger('update-viewport');
            fx.elem.updated = true;
        };
    }
});
/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, HelioviewerClient, ImageSelectTool, MovieBuilder,
  TooltipHelper, HelioviewerViewport, ScreenshotBuilder, ScreenshotHistory,
  MovieHistory, UserVideoGallery, MessageConsole, Helioviewer,
  KeyboardManager, SettingsLoader, TimeControls,
  ZoomControls, ScreenshotManagerUI, MovieManagerUI, assignTouchHandlers,
  TileLayerAccordion, VisualGlossary, _gaq */
"use strict";
var HelioviewerWebClient = HelioviewerClient.extend(
    /** @lends HelioviewerWebClient.prototype */
    {
    /**
     * Creates a new Helioviewer.org instance.
     * @constructs
     *
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (urlSettings, serverSettings, zoomLevels) {
        var urlDate, imageScale, paddingHeight, accordionsToOpen, self=this;

        this.header                    = $('#hv-header');
        this.viewport                  = $('#helioviewer-viewport');
        this.drawerSpeed               = 0;
        this.drawerLeft                = $('#hv-drawer-left');
        this.drawerLeftOpened          = false;
        this.drawerLeftOpenedWidth     = 25;    /* em */
        this.drawerLeftTab             = $('#hv-drawer-tab-left');
        this.drawerLeftTabLeft         = -2.6; /* em */
        this.drawerLeftTabBorderRight  = "2pt solid rgba(0,0,0,1)";
        this.drawerLeftTabBorderBottom = "2pt solid rgba(0,0,0,1)";
        this.drawerNews                = $('#hv-drawer-news');
        this.drawerNewsOpened          = false;
        this.drawerNewsOpenedHeight    = 'auto';
        this.drawerNewsOpenedWidth     = '25em';
        this.drawerMovies              = $('#hv-drawer-movies');
        this.drawerMoviesOpened        = false;
        this.drawerMoviesOpenedHeight  = 'auto';
        this.drawerMoviesOpenedWidth   = '25em';
        this.drawerScreenshots             = $('#hv-drawer-screenshots');
        this.drawerScreenshotsOpened       = false;
        this.drawerScreenshotsOpenedHeight = 'auto';
        this.drawerScreenshotsOpenedWidth  = '25em';
        this.drawerYoutube             = $('#hv-drawer-youtube');
        this.drawerYoutubeOpened       = false;
        this.drawerYoutubeOpenedHeight = 'auto';
        this.drawerYoutubeOpenedWidth  = '25em';
        this.drawerData                = $('#hv-drawer-data');
        this.drawerDataOpened          = false;
        this.drawerDataOpenedHeight    = 'auto';
        this.drawerDataOpenedWidth     = '25em';
        this.drawerShare               = $('#hv-drawer-share');
        this.drawerShareOpened         = false;
        this.drawerShareOpenedHeight   = 'auto';
        this.drawerShareOpenedWidth    = '25em';
        this.drawerHelp                = $('#hv-drawer-help');
        this.drawerHelpOpened          = false;
        this.drawerHelpOpenedHeight    = 'auto';
        this.drawerHelpOpenedWidth     = '25em';

        this.tabbedDrawers = ['#hv-drawer-news', '#hv-drawer-movies',
                              '#hv-drawer-screenshots', '#hv-drawer-youtube',
                              '#hv-drawer-data', '#hv-drawer-share',
                              '#hv-drawer-help'];
        this.tabbedDrawerButtons = {
            '#hv-drawer-news'        : '#news-button',
            '#hv-drawer-youtube'     : '#youtube-button',
            '#hv-drawer-movies'      : '#movies-button',
            '#hv-drawer-screenshots' : '#screenshots-button',
            '#hv-drawer-data'        : '#data-button',
            '#hv-drawer-share'       : '#share-button',
            '#hv-drawer-help'        : '#help-button'};

        this._super(urlSettings, serverSettings, zoomLevels);

        // Debugging helpers
        if (urlSettings.debug) {
            this._showDebugHelpers();
        }

        this._initLoadingIndicator();
        this._initTooltips();

        // Determine image scale to use
        imageScale = this._chooseInitialImageScale(Helioviewer.userSettings.get('state.imageScale'), zoomLevels);

        // Use URL date if specified
        urlDate = urlSettings.date ? Date.parseUTCDate(urlSettings.date) : false;

        this.timeControls = new TimeControls('#date', '#time',
            '#timestep-select', '#timeBackBtn', '#timeForwardBtn', urlDate);

        // Get available data sources and initialize viewport
        this._initViewport(this.timeControls.getDate(), 0, 0);

        this.messageConsole = new MessageConsole();
        this.keyboard       = new KeyboardManager();

        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', imageScale,
            zoomLevels, this.serverSettings.minImageScale,
            this.serverSettings.maxImageScale);

        this.earthScale = new ImageScale();

        this.displayBlogFeed(8, false);

        this._userVideos = new UserVideoGallery(this.serverSettings.videoFeed);

        this.imageSelectTool = new ImageSelectTool();

        this._screenshotManagerUI = new ScreenshotManagerUI();
        this._movieManagerUI      = new MovieManagerUI();

        this._glossary = new VisualGlossary(this._setupDialog);

        this._setupDialogs();
        this._initEventHandlers();
        this._setupSettingsUI();

        this._displayGreeting();

        $('#mouse-cartesian').click();

        this.drawerUserSettings = Helioviewer.userSettings.get("state.drawers");
        $.each(this.drawerUserSettings, function(drawerSelector, drawerObj) {
            switch(drawerSelector) {
            case "#hv-drawer-left":
                if ( drawerObj.open ) {
                    self.drawerLeftClick(true);
                }
                break;
            case "#hv-drawer-news":
                if ( drawerObj.open ) {
                    self.drawerNewsClick(true);
                }
                break;
            case "#hv-drawer-youtube":
                if ( drawerObj.open ) {
                    self.drawerYoutubeClick(true);
                }
                break;
            case "#hv-drawer-movies":
                if ( drawerObj.open ) {
                    self.drawerMoviesClick(true);
                }
                break;
            case "#hv-drawer-screenshots":
                if ( drawerObj.open ) {
                    self.drawerScreenshotsClick(true);
                }
                break;
            case "#hv-drawer-data":
                if ( drawerObj.open ) {
                    self.drawerDataClick(true);
                }
                break;
            case "#hv-drawer-share":
                if ( drawerObj.open ) {
                    self.drawerShareClick(true);
                }
                break;
            case "#hv-drawer-help":
                if ( drawerObj.open ) {
                    self.drawerHelpClick(true);
                }
                break;
            default:
                console.info(['no drawer: ', drawerSelector, obj]);
            }
        });
    },

    /**
     * @description Sets up a simple AJAX-request loading indicator
     */
    _initLoadingIndicator: function () {
        $(document).ajaxStart(function () {
            $('#loading').show();
        })
        .ajaxStop(function () {
            $('#loading').hide();
        });
    },

    /**
     * Add tooltips to static HTML buttons and elements
     */
    _initTooltips: function () {
        // Overide qTip defaults
        $.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
            show: {
                delay: 1000
            },
            style: {
                classes:'ui-tooltip-light ui-tooltip-shadow ui-tooltip-rounded'
            }
        });

        // Bottom-right tooltips
        $("*[title]:not(.qtip-left)").qtip();

        // Bottom-left tooltips
        $(".qtip-left").qtip({
            position: {
                my: "top right",
                at: "bottom middle"
            }
        });

        // Top-left tooltips
        $(".qtip-topleft").qtip({
            position: {
                my: "bottom right",
                at: "top middle"
            }
        });
    },

    /**
     * Initializes the viewport
     */
    _initViewport: function (date, marginTop, marginBottom) {
        var self = this;

        $(document).bind("datasources-initialized", function (e, dataSources) {
            var tileLayerAccordion = new TileLayerAccordion(
                    '#tileLayerAccordion', dataSources, date);
        });

        $(document).bind("event-types-initialized",
            function (e, eventTypes, date) {
                var eventLayerAccordion = new EventLayerAccordion(
                        '#eventLayerAccordion', eventTypes, date);
        });

        this._super("#helioviewer-viewport-container-outer", date,
            marginTop, marginBottom);
    },

    /**
     * Adds a movie to the user's history and displays the movie
     *
     * @param string movieId Identifier of the movie to be shown
     */
    loadMovie: function (movieId) {
        if ( !this._movieManagerUI.has(movieId) ) {
            this._movieManagerUI.addMovieUsingId(movieId);
        }
        else {
            this._movieManagerUI.playMovie(movieId);
        }
    },

    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        var self = this;

        // About dialog
        this._setupDialog("#helioviewer-about", "#about-dialog", {
            "title"  : "Helioviewer - About",
            "height" : 400
        });

        // Keyboard shortcuts dialog
        this._setupDialog("#helioviewer-usage", "#usage-dialog", {
            "title": "Helioviewer - Usage Tips"
        });

        // Settings dialog
        this._setupDialog("#settings-button", "#settings-dialog", {
            "buttons": {
                "Ok": function () {
                    $(this).dialog("close");
                }
            },
            "title": "Helioviewer - Settings",
            "width": 400,
            "height": 'auto',
            "resizable": false,
            "create": function (e) {

            }
        });
    },

    /**
     * Sets up event handlers for a single dialog
     */
    _setupDialog: function (btn, dialog, options, onLoad) {
        // Default options
        var defaults = {
            title     : "Helioviewer.org",
            autoOpen  : true,
            draggable : true,
            width     : 480,
            height    : 400
        };

        // Button click handler
        $(btn).click(function () {
            var d   = $(dialog),
                btn = $(this);

            if (btn.hasClass("dialog-loaded")) {
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                d.load(this.href, onLoad).dialog($.extend(defaults, options));
                btn.addClass("dialog-loaded");
            }
            return false;
        });
    },

    /**
     * Enables some debugging helpers that display extra information to help
     * during development
     */
    _showDebugHelpers: function () {
        var dimensions, win = $(window);

        dimensions = $("<div id='debug-dimensions'></div>").appendTo("body");

        win.resize(function (e) {
            dimensions.html(win.width() + "x" + win.height());
        });
    },

    /**
     * Configures the user settings form to match the stored values and
     * initializes event-handlers
     */
    _setupSettingsUI: function () {
        var form, dateLatest, datePrevious, autorefresh, self = this;

        form         = $("#helioviewer-settings");
        dateLatest   = $("#settings-date-latest");
        datePrevious = $("#settings-date-previous");
        autorefresh  = $("#settings-latest-image");

        // Starting date
        if (Helioviewer.userSettings.get("options.date") === "latest") {
            dateLatest.attr("checked", "checked");
        } else {
            datePrevious.attr("checked", "checked");
        }

        // Auto-refresh
        if (Helioviewer.userSettings.get("options.autorefresh")) {
            autorefresh.attr("checked", "checked");
            this.timeControls.enableAutoRefresh();
        } else {
            autorefresh.removeAttr("checked");
            this.timeControls.disableAutoRefresh();
        }

        // Event-handlers
        dateLatest.change(function (e) {
            Helioviewer.userSettings.set("options.date", "latest");
        });
        datePrevious.change(function (e) {
            Helioviewer.userSettings.set("options.date", "previous");
        });
        autorefresh.change(function (e) {
            Helioviewer.userSettings.set(
                "options.autorefresh", e.target.checked);
            if (e.target.checked) {
                self.timeControls.enableAutoRefresh();
            }
            else {
                self.timeControls.disableAutoRefresh();
            }
        });

    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEventHandlers: function () {
        var self = this,
            msg  = "Link directly to the current state of Helioviewer:",
            btns;


        $(document).on('update-external-datasource-integration', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('#accordion-vso input[type=text]').bind('change', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('#sdo-start-date, #sdo-start-time, #sdo-end-date, #sdo-end-time').bind('change', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('#sdo-center-x, #sdo-center-y, #sdo-width, #sdo-height').bind('change', function () {

            if ( $('#sdo-full-viewport').hasClass('selected') ) {
                $('#sdo-full-viewport').removeClass('selected');
                $('#sdo-select-area').addClass('selected');
            }
            self.updateExternalDataSourceIntegration();
        });


        $(this.drawerLeftTab).bind('click', $.proxy(this.drawerLeftClick, this));
        this.drawerLeft.bind('mouseover', function (event) { event.stopPropagation(); });

        $('#news-button').bind('click', $.proxy(this.drawerNewsClick, this));
        $('#youtube-button').bind('click', $.proxy(this.drawerYoutubeClick, this));
        $('#movies-button').bind('click', $.proxy(this.drawerMoviesClick, this));
        $('#screenshots-button').bind('click', $.proxy(this.drawerScreenshotsClick, this));
        $('#data-button').bind('click', $.proxy(this.drawerDataClick, this));
        $('#share-button').bind('click', $.proxy(this.drawerShareClick, this));
        $('#help-button').bind('click', $.proxy(this.drawerHelpClick, this));

        $('.drawer-contents .header').bind('click', $.proxy(this.accordionHeaderClick, this));
        $('.contextual-help').bind('click', $.proxy(this.contextualHelpClick, this));


        $('#link-button').click(function (e) {
            // Google analytics event
            if (typeof(_gaq) !== "undefined") {
                _gaq.push(['_trackEvent', 'Shares', 'Homepage - URL']);
            }
            self.displayURL(self.toURL(), msg);
        });


        // Highlight both text and icons for text buttons

        btns = $("#social-buttons .text-btn, " +
                 "#movie-manager-container .text-btn, " +
                 "#image-area-select-buttons > .text-btn, " +
                 "#screenshot-manager-container .text-btn, " +
                 "#event-container .text-btn");
        btns.live("mouseover",
            function () {
                $(this).find(".ui-icon").addClass("ui-icon-hover");
            });
        btns.live("mouseout",
            function () {
                $(this).find(".ui-icon").removeClass("ui-icon-hover");
            });

        // Fix drag and drop for mobile browsers
        $("#helioviewer-viewport, .ui-slider-handle").each(function () {
            assignTouchHandlers(this);
        });

        $("#helioviewer-url-shorten").click(function (e) {
            var url;

            if (e.target.checked) {
                url = $("#helioviewer-short-url").attr("value");
            }
            else {
                url = $("#helioviewer-long-url").attr("value");
            }

            $("#helioviewer-url-input-box").attr('value', url).select();
        });

        $('#facebook-button').bind('click', $.proxy(this.facebook, this));
        $('#pinterest-button').bind('click', $.proxy(this.pinterest, this));

        $('#mouse-cartesian').click( function (event) {
            var buttonPolar     = $('#mouse-polar');
            var buttonCartesian = $('#mouse-cartesian');

            if ( buttonCartesian.hasClass("active") ) {
                $('#mouse-coords').hide();
                buttonCartesian.removeClass("active");
                buttonPolar.removeClass("active");
            }
            else {
                $(document).trigger('cartesian-mouse-coords');
                buttonCartesian.addClass("active");
                buttonPolar.removeClass("active");
            }
        });
        $('#mouse-polar').click(function () {
            var buttonPolar     = $('#mouse-polar');
            var buttonCartesian = $('#mouse-cartesian');

            if ( buttonPolar.hasClass("active") ) {
                $('#mouse-coords').hide();
                buttonPolar.removeClass("active");
                buttonCartesian.removeClass("active");
            }
            else {
                $(document).trigger('polar-mouse-coords');
                buttonPolar.addClass("active");
                buttonCartesian.removeClass("active");
            }
        });

        $('#sdo-full-viewport').click(function () {
            $('#sdo-select-area').removeClass('selected');
            $('#sdo-full-viewport').addClass('selected');
            $(document).trigger('update-external-datasource-integration');
        });

        $('#sdo-select-area').click(function () {
            self._cleanupFunctions = [];

            $('#sdo-full-viewport').removeClass('selected');
            $('#sdo-select-area').addClass('selected');

            if ( helioviewer.drawerLeftOpened ) {
                self._cleanupFunctions.push('helioviewer.drawerLeftClick()');
                helioviewer.drawerLeftClick();
            }
            if ( $('#earth-button').hasClass('active') ) {
                self._cleanupFunctions.push("$('#earth-button').click()");
                $('#earth-button').click();
            }

            self._cleanupFunctions.push('helioviewer.drawerDataClick()');
            helioviewer.drawerDataClick();

            $(document).trigger("enable-select-tool",
                                [$.proxy(self._updateSDOroi, self),
                                 $.proxy(self._cleanup, self)]);
        });
    },


    /**
     * Units of 'roi' parameter is Viewport pixels wrt solar center.
     */
    _updateSDOroi: function (roi) {
        var x0=0, y0=0, width=0, height=0, vport, imageScale;

        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        // Make sure selection region and number of layers are acceptible
        if ( !this._validateRequest(roi) ) {
            return false;
        }

        vport = this.viewport.getViewportInformation();

        // Arc seconds per pixel
        imageScale = vport['imageScale'];


        x0 = imageScale * (roi.left + roi.right) / 2;
        y0 = imageScale * (roi.bottom + roi.top) / 2;
        width  = ( roi.right - roi.left ) * imageScale;
        height = ( roi.bottom - roi.top ) * imageScale;

        $('#sdo-center-x').val(   x0.toFixed(2) );
        $('#sdo-center-y').val(   y0.toFixed(2) );
        $('#sdo-width').val(   width.toFixed(2) );
        $('#sdo-height').val( height.toFixed(2) );

    },


    /**
     *
     */
    updateSDOaccordion: function (sdoPreviews, sdoButtons, imageAccordions, imageScale) {

        var vport, imageScale,
            sDate = $('#sdo-start-date').val(),
            sTime = $('#sdo-start-time').val(),
            eDate = $('#sdo-end-date').val(),
            eTime = $('#sdo-end-time').val();

        // Wipe the slate clean
        this._clearSDOaccordion(sdoPreviews, sdoButtons);

        this._setSDOtimes(sDate, sTime, eDate, eTime);

        if ( $('#sdo-full-viewport').hasClass('selected') ) {
            vport = this.viewport.getViewportInformation();

            this._updateSDOroi({
                  'left': vport['coordinates']['left'],
                 'right': vport['coordinates']['right'],
                   'top': vport['coordinates']['top'],
                'bottom': vport['coordinates']['bottom']
            });
        }

        this.setSDOthumbnails(sdoPreviews, imageAccordions, imageScale);
        this.setSDOscriptDownloadButtons(imageAccordions, imageScale);
    },

    _clearSDOaccordion: function (sdoPreviews, sdoButtons) {
        sdoPreviews.html('');
        $.each( sdoButtons.children(), function (i, button) {
            button = $(button);
            button.removeAttr('href');
            button.unbind('click');
            button.addClass('inactive');
        });

        $('#sdo-full-viewport').addClass('inactive');
        $('#sdo-select-area').addClass('inactive');

        $.each($('#accordion-sdo').find('.label, .suffix'), function (i,text) {
            $(text).addClass('inactive');
        });
        $.each($('#accordion-sdo').find('input'), function (i,node) {
            $(node).attr('disabled', true);
        });
    },

    _clearVSOaccordion: function (vsoLinks, vsoPreviews, vsoButtons) {
        vsoLinks.html('');
        vsoPreviews.html('');
        $.each( vsoButtons.children(), function (i, button) {
            button = $(button);
            button.removeAttr('href');
            button.unbind('click');
            button.addClass('inactive');
        });

        $.each($('#accordion-vso').find('.label, .suffix'), function (i,text) {
            $(text).addClass('inactive');
        });
        $.each($('#accordion-vso').find('input'), function (i,node) {
            $(node).attr('disabled', true);
        });
    },



    /**
     * Validates the request and returns false if any of the requirements are
     * not met.
     */
    _validateRequest: function (roi) {
        var layers, sourceIDsVisible = Array(), message;

        layers = Helioviewer.userSettings.get("state.tileLayers");
        $.each( layers, function(i, layer) {
            if ( layer.visible && layer.opacity >= 5 ) {
                sourceIDsVisible.push(layer.sourceId);
            }
        });

        // Verify that 1 to [maxTileLayers] layers are visible
        if (sourceIDsVisible.length > this.viewport.maxTileLayers) {
            message = "Please hide/remove layers until there are no more "
                    + "than " + this.viewport.maxTileLayers
                    + " layers visible.";
            $(document).trigger("message-console-warn", [message,
                { "sticky": false, "header": 'Just now', "life": 5000 },
                true, true]);
            return false;
        }
        // else if ( sourceIDsVisible.length == 0) {
        //     message = "You must have at least one visible image layer. "
        //             + "Please try again.";
        //     $(document).trigger("message-console-warn", [message,
        //         { "sticky": false, "header": 'Just now', "life": 2000 },
        //         true, true]);
        //     return false;
        // }

        // Verify that the selected area is not too small
        if ( roi.bottom - roi.top < 20 || roi.right - roi.left < 20 ) {
            message = "The area you have selected is too small. "
                    + "Please try again.";
            $(document).trigger("message-console-warn", [message,
                { "sticky": false, "header": 'Just now', "life": 5000 },
                true, true]);
            return false;
        }

        return true;
    },


    _vsoLink: function (startDate, endDate, nickname) {
        var url, html;

        url  = 'http://virtualsolar.org/cgi-bin/vsoui.pl'
             + '?startyear='   + startDate.split('/')[0]
             + '&startmonth='  + startDate.split('/')[1]
             + '&startday='    + startDate.split('/')[2].split('T')[0]
             + '&starthour='   + startDate.split('T')[1].split(':')[0]
             + '&startminute=' + startDate.split('T')[1].split(':')[1]
             + '&endyear='     + endDate.split('/')[0]
             + '&endmonth='    + endDate.split('/')[1]
             + '&endday='      + endDate.split('/')[2].split('T')[0]
             + '&endhour='     + endDate.split('T')[1].split(':')[0]
             + '&endminute='   + endDate.split('T')[1].split(':')[1]
             + '&instrument='  + nickname.split(' ')[0];
        if ( parseInt(nickname.split(' ')[1], 10) ) {
            url += '&wave='     + 'other'
                +  '&wavemin='  + nickname.split(' ')[1]
                +  '&wavemax='  + nickname.split(' ')[1]
                +  '&waveunit=' + 'Angstrom';
        }

        html = '<a href="' + url + '" target="_blank">'
             + nickname + ' ' + date
             + ' UTC <i class="fa fa-external-link-square fa-fw"></i></a>';

        return html;
    },


    _vsoThumbnail: function (startDate, endDate, nickname, sourceId) {
        var hardcodedScale = '10', html;

        if ( nickname.toUpperCase() == 'LASCO C2' ) {
            hardcodedScale = '50';
        }
        else if ( nickname.toUpperCase() == 'LASCO C3' ) {
            hardcodedScale = '250';
        }
        else if ( nickname.toUpperCase() == 'COR1-A' ) {
            hardcodedScale = '35';
        }
        else if ( nickname.toUpperCase() == 'COR1-B' ) {
            hardcodedScale = '35';
        }
        else if ( nickname.toUpperCase() == 'COR2-A' ) {
            hardcodedScale = '130';
        }
        else if ( nickname.toUpperCase() == 'COR2-B' ) {
            hardcodedScale = '130';
        }

        html = '<div class="header">'
             +     nickname
             + '</div>'
             + '<div class="previews">'
             +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
             + 'imageScale=' + hardcodedScale
             + '&layers=['   + sourceId + ',1,100]'
             + '&events=&eventLabels=false'
             + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
             + '&date='      + startDate
             + '&x0=0&y0=0&width=256&height=256&display=true&watermark=false" class="preview start" /> '
             +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
             + 'imageScale=' + hardcodedScale
             + '&layers=['   + sourceId + ',1,100]'
             + '&events=&eventLabels=false'
             + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
             + '&date='      + endDate
             + '&x0=0&y0=0&width=256&height=256&display=true&watermark=false" class="preview end" /> '
             + '</div>';

        return html;
    },


    updateVSOaccordion: function (vsoLinks, vsoPreviews, vsoButtons, imageAccordions, imageScale) {

        var nickname, startDate, endDate, sourceId,
            sourceIDs = Array(), instruments = Array(), waves = Array(),
            sDate = $('#vso-start-date').val(),
            sTime = $('#vso-start-time').val(),
            eDate = $('#vso-end-date').val(),
            eTime = $('#vso-end-time').val(),
            self = this;

        // Wipe the slate clean
        this._clearVSOaccordion(vsoLinks, vsoPreviews, vsoButtons);

        this._setVSOtimes(sDate, sTime, eDate, eTime);

        $.each( imageAccordions, function(i, accordion) {

            if ( !$(accordion).find('.visible').hasClass('hidden') ) {
                nickname = $(accordion).find('.tile-accordion-header-left').html();
                sourceId = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');
                date     = $(accordion).find('.timestamp').html();

                startDate = $('#vso-start-date').val() + 'T'
                          + $('#vso-start-time').val() + 'Z';
                endDate   = $('#vso-end-date').val()   + 'T'
                          + $('#vso-end-time').val()   + 'Z';

                sourceIDs.push(sourceId);
                instruments.push(nickname.split(' ')[0]);
                if ( parseInt(nickname.split(' ')[1], 10) ) {
                    waves.push(parseInt(nickname.split(' ')[1], 10));
                }

                vsoLinks.append(
                    self._vsoLink(startDate, endDate, nickname)
                );
                vsoPreviews.append(
                    self._vsoThumbnail(startDate, endDate, nickname, sourceId)
                );
            }
        });

        if ( sourceIDs.length > 0 ) {
            this._updateVSObuttons(startDate, endDate, sourceIDs, instruments, waves);
        }
    },


    _updateVSObuttons: function (startDate, endDate, sourceIDs, instruments, waves) {

        var x1=0, y1=0, x2=0, y2=0, url, body, imageScale,
            vport = this.viewport.getViewportInformation();

        imageScale = vport['imageScale'];  // arcseconds per pixel

        // Arc seconds
        x1 = vport['coordinates']['left']   * imageScale;
        x2 = vport['coordinates']['right']  * imageScale;
        y1 = vport['coordinates']['top']    * imageScale;
        y2 = vport['coordinates']['bottom'] * imageScale;

        // VSO SunPy Script Button
        $('#vso-sunpy').removeClass('inactive');
        $('#vso-sunpy').bind('click', function (e) {
            url  = Helioviewer.api + '/'
                 + '?action=getSciDataScript'
                 + '&imageScale=' + imageScale
                 + '&sourceIds=[' + sourceIDs.join(',')+']'
                 + '&startDate='  + startDate.replace(/\//g, '-')
                 + '&endDate='    +   endDate.replace(/\//g, '-')
                 + '&lang=sunpy'
                 + '&provider=vso';
            body = '<a href="' + url + '">'
                 +     'Your Python/SunPy script for requesting science data '
                 +     'from the VSO is ready.<br /><br />'
                 +     '<b>Click here to download.</b>'
                 + '</a>';
            $(document).trigger("message-console-log", [body,
                { sticky: true, header: 'Just now' }, true, true]);
        });


        // VSO SolarSoft Script Button
        $('#vso-ssw').removeClass('inactive');
        $('#vso-ssw').bind('click', function (e) {
            url  = Helioviewer.api + '/'
                 + '?action=getSciDataScript'
                 + '&imageScale=' + imageScale
                 + '&sourceIds=[' + sourceIDs.join(',')+']'
                 + '&startDate='  + startDate.replace(/\//g, '-')
                 + '&endDate='    +   endDate.replace(/\//g, '-')
                 + '&lang=sswidl'
                 + '&provider=vso'
                 + '&x1=' + x1
                 + '&y1=' + y1
                 + '&x2=' + x2
                 + '&y2=' + y2;
            body = '<a href="' + url + '">'
                 +     'Your IDL/SolarSoft script for requesting science data '
                 +     'from the VSO is ready.<br /><br />'
                 +     '<b>Click here to download.</b>'
                 + '</a>';
            $(document).trigger("message-console-log", [body,
                { sticky: true, header: 'Just now' }, true, true]);
        });

        // VSO Website Button
        $('#vso-www').attr('href', 'http://virtualsolar.org/cgi-bin/vsoui.pl'
            + '?startyear='   +   startDate.split('/')[0]
            + '&startmonth='  +   startDate.split('/')[1]
            + '&startday='    +   startDate.split('/')[2].split('T')[0]
            + '&starthour='   +   startDate.split('T')[1].split(':')[0]
            + '&startminute=' +   startDate.split('T')[1].split(':')[1]
            + '&endyear='     +     endDate.split('/')[0]
            + '&endmonth='    +     endDate.split('/')[1]
            + '&endday='      +     endDate.split('/')[2].split('T')[0]
            + '&endhour='     +     endDate.split('T')[1].split(':')[0]
            + '&endminute='   +     endDate.split('T')[1].split(':')[1]
            + '&instrument='  + instruments.join('&instrument=')
            + '&wave='        +            'other'
            + '&wavemin='     +    Math.min.apply(Math,waves)
            + '&wavemax='     +    Math.max.apply(Math,waves)
            + '&waveunit='    +            'Angstrom'
        );
        $('#vso-www').removeClass('inactive');


        $.each($('#accordion-vso').find('.label, .suffix'), function (i,text) {
            $(text).removeClass('inactive');
        });
        $.each($('#accordion-vso').find('input[disabled]'), function (i,node) {
            $(node).attr('disabled', false);
        });
    },


    setSDOthumbnails: function (sdoPreviews, imageAccordions, imageScale) {
        var html, nickname, startDate, endDate, sourceId, imageLayer,
            x1, x2, y1, y2, thumbImageScale;

        sdoPreviews.html('');

        $.each( imageAccordions, function(i, accordion) {

            nickname = $(accordion).find('.tile-accordion-header-left').html();

            if ( !$(accordion).find('.visible').hasClass('hidden') &&
                 ( nickname.search('AIA ') != -1 ||
                   nickname.search('HMI ') != -1 ) ) {

                sourceId = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');
                imageLayer = '['+sourceId+',1,100]';

                startDate = $('#sdo-start-date').val() + 'T'
                          + $('#sdo-start-time').val() + 'Z';
                endDate   = $('#sdo-end-date').val()   + 'T'
                          + $('#sdo-end-time').val()   + 'Z';

                if ( startDate == 'TZ' || endDate == 'TZ' ) {
                    return false;
                }

                x1 = Math.round(parseFloat($('#sdo-center-x').val()) - parseFloat($('#sdo-width').val()) / 2);
                x2 = Math.round(parseFloat($('#sdo-center-x').val()) + parseFloat($('#sdo-width').val()) / 2);

                y1 = Math.round(parseFloat($('#sdo-center-y').val()) - parseFloat($('#sdo-height').val()) / 2);
                y2 = Math.round(parseFloat($('#sdo-center-y').val()) + parseFloat($('#sdo-height').val()) / 2);

                thumbImageScale = parseFloat($('#sdo-width').val()) / 256;


                html = '';
                html = '<div class="header">'
                     +     nickname
                     + '</div>'
                     + '<div class="previews">'
                     +     '<img src="http://api.helioviewer.org/v2/'
                     +     'takeScreenshot/?'
                     +     'imageScale=' + thumbImageScale
                     +     '&layers='    + imageLayer
                     +     '&events=&eventLabels=false'
                     +     '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                     +     '&date='      + startDate
                     +     '&x1=' + x1
                     +     '&x2=' + x2
                     +     '&y1=' + y1
                     +     '&y2=' + y2
                     +     '&display=true&watermark=false" '
                     +     'class="preview start" '
                     +     'style="width:'+128+'; '
                     +     'height:'
                     +          Math.round( 128 / ( $('#sdo-width').val() /
                                                    $('#sdo-height').val()
                                                  )
                                          ) + ';"'
                     +     ' />'
                     +     '<img src="http://api.helioviewer.org/v2/'
                     +     'takeScreenshot/?'
                     +     'imageScale=' + thumbImageScale
                     +     '&layers='    + imageLayer
                     +     '&events=&eventLabels=false'
                     +     '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                     +     '&date='      + endDate
                     +     '&x1=' + x1
                     +     '&x2=' + x2
                     +     '&y1=' + y1
                     +     '&y2=' + y2
                     +     '&display=true&watermark=false" '
                     +     'class="preview end" '
                     +     'style="width:' + 128 + '; '
                     +     'height:'
                     +          Math.round( 128 / ( $('#sdo-width').val() /
                                                    $('#sdo-height').val()
                                                  )
                                          ) + ';"'
                     +     ' />'
                     + '</div>';

                sdoPreviews.append(html);
            }
        });
    },


    setSDOscriptDownloadButtons: function (imageAccordions, imageScale) {
        var sourceIDs = Array(), waves = Array(), sourceId, url, body,
            nickname, startDate, endDate, x1, x2, y1, y2;

        $.each( imageAccordions, function (i, accordion) {
            nickname = $(accordion).find('.tile-accordion-header-left').html();

            if ( !$(accordion).find('.visible').hasClass('hidden') &&
                ( nickname.search('AIA ') != -1 ||
                  nickname.search('HMI ') != -1 ) ) {

                nickname = $(accordion).find('.tile-accordion-header-left').html();
                sourceId = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');

                sourceIDs.push(sourceId);
                waves.push(nickname.split(' ')[1].padLeft('0',3));
            }
        });

        if ( sourceIDs.length == 0 || waves.length == 0 ) {
            $('#sdo-full-viewport').addClass('inactive');
            $('#sdo-select-area').addClass('inactive');
            $('#sdo-ssw').addClass('inactive');
            $('#sdo-www').addClass('inactive');
            return;
        }

        startDate = $('#sdo-start-date').val() + 'T'
                  + $('#sdo-start-time').val() + 'Z';
        endDate   = $('#sdo-end-date').val()   + 'T'
                  + $('#sdo-end-time').val()   + 'Z';

        if ( startDate == 'TZ' || endDate == 'TZ' ) {
            return false;
        }

        x1 = Math.round(parseFloat($('#sdo-center-x').val()) - parseFloat($('#sdo-width').val()) / 2);
        x2 = Math.round(parseFloat($('#sdo-center-x').val()) + parseFloat($('#sdo-width').val()) / 2);

        y1 = Math.round(parseFloat($('#sdo-center-y').val()) - parseFloat($('#sdo-height').val()) / 2);
        y2 = Math.round(parseFloat($('#sdo-center-y').val()) + parseFloat($('#sdo-height').val()) / 2);

        // SDO SolarSoft Script Button
        $('#sdo-ssw').removeClass('inactive');
        $('#sdo-ssw').bind('click', function (e) {
            url = Helioviewer.api + '/'
                + '?action=getSciDataScript'
                + '&imageScale=' + imageScale
                + '&sourceIds=[' + sourceIDs.join(',') + ']'
                + '&startDate=' + startDate
                + '&endDate=' + endDate
                + '&lang=sswidl'
                + '&provider=sdo'
                + '&x1=' + x1
                + '&y1=' + y1
                + '&x2=' + x2
                + '&y2=' + y2;

            body = '<a href="' + url + '">'
                 +     'Your IDL/SolarSoft script for requesting science '
                 +     'data from the AIA/HMI Cut-out Serivce is ready.'
                 +     '<br /><br />'
                 +     '<b>Click here to download.</b>'
                 + '</a>';

            $(document).trigger("message-console-log",
                [body, {sticky: true, header: 'Just now'}, true, true]
            );
        });

        // SDO Website Button
        $('#sdo-www').attr('href', 'http://www.lmsal.com/get_aia_data/'
            + '?width='  + $('#sdo-width').val()
            + '&height=' + $('#sdo-height').val()
            + '&xCen='   +  $('#sdo-center-x').val()
            + '&yCen='   + ($('#sdo-center-y').val()*-1)
            + '&wavelengths=' + waves.join(',')
            + '&startDate=' + $('#vso-start-date').val().replace(/\//g,'-')
            + '&startTime=' + $('#vso-start-time').val().slice(0,-3)
            + '&stopDate='  + $('#vso-end-date').val().replace(/\//g,'-')
            + '&stopTime='  + $('#vso-end-time').val().slice(0,-3)
            + '&cadence=12'
        );


        $('#sdo-full-viewport').removeClass('inactive');
        $('#sdo-select-area').removeClass('inactive');

        $.each($('#accordion-sdo').find('.label, .suffix'), function (i,text) {
            $(text).removeClass('inactive');
        });
        $.each($('#accordion-sdo').find('input[disabled]'), function (i,node) {
            $(node).attr('disabled', false);
        });
        $('#sdo-www').removeClass('inactive');

    },


    /**
     * Clean up UI upon exiting data export image area select mode
     */
    _cleanup: function () {
        $.each(this._cleanupFunctions, function(i, func) {
            eval(func);
        });
    },


    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function (url, msg) {
        // Get short URL before displaying
        var callback = function (response) {
            $("#helioviewer-long-url").attr("value", url);
            $("#helioviewer-short-url").attr("value", response.data.url);

            // Display URL
            $("#helioviewer-url-box-msg").text(msg);
            $("#url-dialog").dialog({
                dialogClass: 'helioviewer-modal-dialog',
                height    : 125,
                maxHeight : 125,
                width     : $('html').width() * 0.5,
                minWidth  : 350,
                modal     : true,
                resizable : true,
                title     : "Helioviewer - Direct Link",
                open      : function (e) {
                    $("#helioviewer-url-shorten").removeAttr("checked");
                    $('.ui-widget-overlay').hide().fadeIn();
                    $("#helioviewer-url-input-box").attr('value', url).select();
                }
            });
        };

        // Get short version of URL and open dialog
        $.ajax({
            url: Helioviewer.api,
            dataType: Helioviewer.dataType,
            data: {
                "action": "shortenURL",
                "queryString": url.substr(this.serverSettings.rootURL.length + 2)
            },
            success: callback
        });
    },


    /**
     * Displays a URL to a Helioviewer.org movie
     *
     * @param string Id of the movie to be linked to
     */
    displayMovieURL: function (movieId) {
        var msg = "Use the following link to refer to this movie:",
            url = this.serverSettings.rootURL + "/?movieId=" + movieId;

        // Google analytics event
        if (typeof(_gaq) !== "undefined") {
            _gaq.push(['_trackEvent', 'Shares', 'Movie - URL']);
        }
        this.displayURL(url, msg);
    },

    /**
     * Displays recent news from the Helioviewer Project blog
     */
    displayBlogFeed: function (n, showDescription, descriptionWordLength) {
        var url, dtype, html = "";

        url = this.serverSettings.newsURL;

        // For remote queries, retrieve XML using JSONP
        if (Helioviewer.dataType === "jsonp") {
            dtype = "jsonp text xml";
        } else {
            dtype = "xml";
        }

        $.getFeed({
            url: Helioviewer.api,
            data: {"action": "getNewsFeed"},
            dataType: dtype,
            success: function (feed) {
                var link, date, more, description;

                // Display message if there was an error retrieving the feed
                if (!feed.items) {
                    $("#social-panel").append("Unable to retrieve news feed...");
                    return;
                }

                // Grab the n most recent articles
                $.each(feed.items.slice(0, n), function (i, a) {
                    link = "<a href='" + a.link + "' alt='" + a.title + "' target='_blank'>" + a.title + "</a><br />";
                    date = "<div class='article-date'>" + a.updated.slice(0, 26) + "UTC</div>";
                    html += "<div class='blog-entry'>" + link + date;

                    // Include description?
                    if (showDescription) {
                        description = a.description;

                        // Shorten if requested
                        if (typeof descriptionWordLength === "number") {
                            description = description.split(" ").slice(0, descriptionWordLength).join(" ") + " [...]";
                        }
                        html += "<div class='article-desc'>" + description + "</div>";
                    }

                    html += "</div>";
                });

                more = "<div id='more-articles'><a href='" + url +
                       "' title='The Helioviewer Project Blog'>Visit Blog...</a></div>";

                $("#social-panel").append(html + more);
            }
        });
    },

    /**
     * Launches an instance of JHelioviewer
     *
     * Helioviewer attempts to choose a 24-hour window around the current observation time. If the user is
     * currently browsing near the end of the available data then the window for which the movie is created
     * is shifted backward to maintain it's size.
     */
    launchJHelioviewer: function () {
        var endDate, params;

        // If currently near the end of available data, shift window back
        endDate = new Date(Math.min(this.timeControls.getDate().addHours(12), new Date()));

        params = {
            "action"    : "launchJHelioviewer",
            "endTime"   : endDate.toISOString(),
            "startTime" : endDate.addHours(-24).toISOString(),
            "imageScale": this.viewport.getImageScaleInKilometersPerPixel(),
            "layers"    : this.viewport.serialize()
        };
        window.open(Helioviewer.api + "?" + $.param(params), "_blank");
    },

    /**
     * Displays welcome message on user's first visit
     */
    _displayGreeting: function () {
        if (!Helioviewer.userSettings.get("notifications.welcome")) {
            return;
        }

        $(document).trigger("message-console-info",
            ["<b>Welcome to Helioviewer.org</b>, a solar data browser. First time here? Be sure to check out our " +
             "<a href=\"http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_2.4.0\" " +
             "class=\"message-console-link\" target=\"_blank\"> User Guide</a>.</br>", {"sticky": false, "life": 10000}]
        );

        Helioviewer.userSettings.set("notifications.welcome", false);
    },

    /**
     * Returns the current observation date
     *
     * @return {Date} observation date
     */
    getDate: function () {
        return this.timeControls.getDate();
    },

    /**
     * Returns the currently loaded layers
     *
     * @return {String} Serialized layer string
     */
    getLayers: function () {
        return this.viewport.serialize();
    },

    /**
     * Returns the currently selected event layers
     *
     * @return {String} Serialized event layer string
     */
    getEvents: function () {
        return this.viewport.serializeEvents();
    },

    /**
     * Returns the currently selected event layers
     *
     * @return {String} Serialized event layer string
     */
    getEventsLabels: function () {
        return Helioviewer.userSettings.get("state.eventLabels");
    },

    /**
     * Returns a string representation of the layers which are visible and
     * overlap the specified region of interest
     */
    getVisibleLayers: function (roi) {
        return this.viewport.getVisibleLayers(roi);
    },

    /**
     * Returns the currently displayed image scale
     *
     * @return {Float} image scale in arc-seconds/pixel
     */
    getImageScale: function () {
        return this.viewport.getImageScale();
    },

    /**
     * Returns the top-left and bottom-right coordinates for the viewport region of interest
     *
     * @return {Object} Current ROI
     */
    getViewportRegionOfInterest: function () {
        return this.viewport.getRegionOfInterest();
    },

    /**
     * Builds a URL for the current view
     *
     * @TODO: Add support for viewport offset, event layers, opacity
     *
     * @returns {String} A URL representing the current state of Helioviewer.org.
     */
    toURL: function (shorten) {
        // URL parameters
        var params = {
            "date"        : this.viewport._tileLayerManager.getRequestDateAsISOString(),
            "imageScale"  : this.viewport.getImageScale(),
            "centerX"     : Helioviewer.userSettings.get("state.centerX"),
            "centerY"     : Helioviewer.userSettings.get("state.centerY"),
            "imageLayers" : encodeURI(this.viewport.serialize()),
            "eventLayers" : encodeURI(this.viewport.serializeEvents()),
            "eventLabels" : Helioviewer.userSettings.get("state.eventLabels")
        };

        return this.serverSettings.rootURL + "/?" + decodeURIComponent($.param(params));
    },


    drawerLeftClick: function(openNow) {
        if ( this.drawerLeftOpened || openNow === false ) {
            $('.drawer-contents', this.drawerLeft).hide();
            $(this.drawerLeft).hide();
            this.drawerLeft.css('width', 0);
            this.drawerLeft.css('height', 0);
            this.drawerLeft.css('padding', 0);
            this.drawerLeft.css('border', 'none');
            this.drawerLeftTab.css('left', '-2.7em');
            this.drawerLeftOpened = false;
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-left.open", false);
        }
        else if ( !this.drawerLeftOpened || openNow === true ) {
            this.drawerLeft.css('width', this.drawerLeftOpenedWidth+'em');
            this.drawerLeft.css('height', 'auto');
            this.drawerLeft.css('border-right', this.drawerLeftTabBorderRight);
            this.drawerLeft.css('border-bottom', this.drawerLeftTabBorderBottom);
            this.drawerLeftTab.css('left', (this.drawerLeftOpenedWidth+this.drawerLeftTabLeft)+'em');
            $(this.drawerLeft.parent()).css('left', this.drawerLeftOpenedWidth+'em');
            this.drawerLeft.show();
            $('.drawer-contents', this.drawerLeft).show();

            this.drawerLeftOpened = true;
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-left.open", true);
            this.reopenAccordions(this.drawerLeft);
        }
        return;
    },

    drawerNewsClick: function(openNow) {
        var self = this, buttonId = "#news-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerNews.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerNews.css('transition', '');
            $('.drawer-contents', this.drawerNews).fadeOut(10);
            this.drawerNews.css('width', 0);
            this.drawerNews.css('height', 0);
            this.drawerNews.css('padding', 0);
            this.drawerNews.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-news.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerNews.css('transition', 'height 500ms');
            this.drawerNews.css('width', this.drawerNewsOpenedWidth);
            this.drawerNews.css('height', this.drawerNewsOpenedHeight);
            setTimeout(function () {
                self.drawerNews.show();
                $('.drawer-contents', this.drawerNews).fadeIn(500);
                self.drawerNews.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-news.open", true);
            this.reopenAccordions(this.drawerNews);
        }

        return;
    },

    drawerYoutubeClick: function(openNow) {
        var self = this, buttonId = "#youtube-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerYoutube.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerYoutube.css('transition', '');
            $('.drawer-contents', this.drawerYoutube).fadeOut(10);
            this.drawerYoutube.css('width', 0);
            this.drawerYoutube.css('height', 0);
            this.drawerYoutube.css('padding', 0);
            this.drawerYoutube.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-youtube.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerYoutube.css('transition', 'height 500ms');
            this.drawerYoutube.css('width', this.drawerYoutubeOpenedWidth);
            this.drawerYoutube.css('height', this.drawerYoutubeOpenedHeight);
            setTimeout(function () {
                self.drawerYoutube.show();
                $('.drawer-contents', this.drawerYoutube).fadeIn(500);
                self.drawerYoutube.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-youtube.open", true);
            this.reopenAccordions(this.drawerYoutube);
        }

        return;
    },

    drawerMoviesClick: function(openNow) {
        var self = this, buttonId = "#movies-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerMovies.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerMovies.css('transition', '');
            $('.drawer-contents', this.drawerMovies).fadeOut(10);
            this.drawerMovies.css('width', 0);
            this.drawerMovies.css('height', 0);
            this.drawerMovies.css('padding', 0);
            this.drawerMovies.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-movies.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerMovies.css('transition', 'height 500ms');
            this.drawerMovies.css('width', this.drawerMoviesOpenedWidth);
            this.drawerMovies.css('height', this.drawerMoviesOpenedHeight);
            setTimeout(function () {
                self.drawerMovies.show();
                $('.drawer-contents', this.drawerMovies).fadeIn(500);
                self.drawerMovies.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-movies.open", true);
            this.reopenAccordions(this.drawerMovies);
        }

        return;
    },

    drawerScreenshotsClick: function(openNow) {
        var self = this, buttonId = "#screenshots-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerScreenshots.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerScreenshots.css('transition', '');
            $('.drawer-contents', this.drawerScreenshots).fadeOut(10);
            this.drawerScreenshots.css('width', 0);
            this.drawerScreenshots.css('height', 0);
            this.drawerScreenshots.css('padding', 0);
            this.drawerScreenshots.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-screenshots.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerScreenshots.css('transition', 'height 500ms');
            this.drawerScreenshots.css('width', this.drawerScreenshotsOpenedWidth);
            this.drawerScreenshots.css('height', this.drawerScreenshotsOpenedHeight);
            setTimeout(function () {
                self.drawerScreenshots.show();
                $('.drawer-contents', this.drawerScreenshots).fadeIn(500);
                self.drawerScreenshots.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-screenshots.open", true);
            this.reopenAccordions(this.drawerScreenshots);
        }

        return;
    },

    drawerDataClick: function(openNow) {
        var self = this, buttonId = "#data-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerData.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerData.css('transition', '');
            $('.drawer-contents', this.drawerData).fadeOut(10);
            this.drawerData.css('width', 0);
            this.drawerData.css('height', 0);
            this.drawerData.css('padding', 0);
            this.drawerData.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-data.open", false);

        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerData.css('transition', 'height 500ms');
            this.drawerData.css('width', this.drawerDataOpenedWidth);
            this.drawerData.css('height', this.drawerDataOpenedHeight);
            setTimeout(function () {
                self.drawerData.show();
                $('.drawer-contents', this.drawerData).fadeIn(500);
                self.drawerData.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-data.open", true);
            this.reopenAccordions(this.drawerData);

            setTimeout(function () {
                $(document).trigger('update-external-datasource-integration');
            }, 50);
        }

        return;
    },

    drawerShareClick: function(openNow) {
        var self = this, buttonId = "#share-button";

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerShare.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerShare.css('transition', '');
            $('.drawer-contents', this.drawerShare).fadeOut(10);
            this.drawerShare.css('width', 0);
            this.drawerShare.css('height', 0);
            this.drawerShare.css('padding', 0);
            this.drawerShare.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-share.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerShare.css('transition', 'height 500ms');
            this.drawerShare.css('width', this.drawerShareOpenedWidth);
            this.drawerShare.css('height', this.drawerShareOpenedHeight);
            setTimeout(function () {
                self.drawerShare.show();
                $('.drawer-contents', this.drawerShare).fadeIn(500);
                self.drawerShare.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-share.open", true);
            this.reopenAccordions(this.drawerShare);
        }

        return;
    },

    drawerHelpClick: function(openNow) {
        var self = this,
            buttonId = '#help-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerHelp.attr('id'));

        if ( $(buttonId).hasClass('opened') || openNow === false ) {
            self.drawerHelp.css('transition', '');
            $('.drawer-contents', this.drawerHelp).fadeOut(10);
            this.drawerHelp.css('width', 0);
            this.drawerHelp.css('height', 0);
            this.drawerHelp.css('padding', 0);
            this.drawerHelp.css({'display':'none'});
            $(buttonId).removeClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-help.open", false);
        }
        else if ( !$(buttonId).hasClass('opened') || openNow === true ) {
            self.drawerHelp.css('transition', 'height 500ms');
            this.drawerHelp.css('width', this.drawerHelpOpenedWidth);
            this.drawerHelp.css('height', this.drawerHelpOpenedHeight);
            setTimeout(function () {
                self.drawerHelp.show();
                $('.drawer-contents', this.drawerHelp).fadeIn(500);
                self.drawerHelp.css('transition', '');
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
            Helioviewer.userSettings.set("state.drawers.#hv-drawer-help.open", true);
            this.reopenAccordions(this.drawerHelp);
        }

        return;
    },

    drawerSettingsClick: function() {

        if ( $(buttonId).hasClass('opened') ) {
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            $(buttonId).addClass('opened');
        }

        return;
    },

    accordionHeaderClick: function(event, openNow) {
        var obj = $(event.target).parent().find('.disclosure-triangle'),
            drawerId    = obj.parent().parent().parent().parent().attr('id'),
            accordionId = obj.parent().parent().attr('id');

        if ( typeof obj.attr('class') == 'undefined' ) {
            return false;
        }

        if ( obj.attr('class').indexOf('closed') != -1 || openNow === true) {
            obj.html('▼');
            obj.addClass('opened');
            obj.removeClass('closed');
            $('.content', obj.parent().parent()).show();
            $('.contextual-help', obj.parent().parent()).show();
            Helioviewer.userSettings.set("state.drawers.#"+drawerId+".accordions.#"+accordionId+".open", true);
        }
        else {
            obj.html('►');
            obj.addClass('closed');
            obj.removeClass('opened');
            $('.content', obj.parent().parent()).hide();
            $('.contextual-help', obj.parent().parent()).hide();
            Helioviewer.userSettings.set("state.drawers.#"+drawerId+".accordions.#"+accordionId+".open", false);
        }

        if ( accordionId == 'accordion-vso' ||
             accordionId == 'accordion-sdo' ) {

            $(document).trigger('update-external-datasource-integration');
        }

        event.stopPropagation();
    },

    reopenAccordions: function(drawer) {
        var self = this,
            accordions = drawer.find('.accordion'),
            accordionUserSettings = Helioviewer.userSettings.get("state.drawers.#"+drawer.attr('id')+".accordions"),
            trigger = false;

        if ( Object.keys(accordionUserSettings).length > 0 ) {
            $.each(accordionUserSettings, function(selector, accordionObj) {
                if ( accordionObj.open ) {
                    $(selector).find('.header').trigger("click", [true]);
                    if ( selector == '#accordion-vso' ||
                         selector == '#accordion-sdo' ) {

                        trigger = true;
                    }
                }
            });
        }

        if ( trigger ) {
            $(document).trigger('update-external-datasource-integration');
        }

        return;
    },

    closeTabDrawersExcept: function (buttonId, drawerId) {
        self = this;

        $.each( this.tabbedDrawers, function (i, drawer) {
            if ( drawer != drawerId ) {
                $('.drawer-contents', drawer).fadeOut(100);
                $(drawer).css('height', 0);
                $(drawer).css('width', 0);
                $(drawer).css('padding', 0);
                $(self.tabbedDrawerButtons[drawer]).removeClass('opened');
                Helioviewer.userSettings.set("state.drawers."+drawer+".open", false);
            }
        });

    },

    contextualHelpClick: function (event) {
        var alertText = $(event.target).attr('title');
        alertText = alertText.replace(/<\/?[^>]+(>|$)/g, "");
        alert( alertText );
        event.stopPropagation();
    },

    twitter: function() {
        self = this;
        $(this).prop('data-url', encodeURIComponent(self.toURL()) );
        $('#twitter-button').bind('click', $.proxy(this.twitter, this));
        return;
    },

    facebook: function(e) {

        var href   = $(e.target).attr('href')
                   + '&u='
                   + encodeURIComponent(this.toURL()),
            target = $(e.target).attr('target');
        e.stopPropagation();

        window.open(href, target);
        return false;
    },

    pinterest: function() {
        self = this;
        $('#pinterest-button').unbind('click');

        var url = encodeURIComponent(self.toURL());
        var media = encodeURIComponent('http://api.helioviewer.org/v2/downloadScreenshot/?id=3240748');
        var desc = $(this).attr('data-desc')+' '+encodeURIComponent(self.toURL());
        window.open("//www.pinterest.com/pin/create/button/"+
        "?url="+url+
        "&media="+media+
        "&description="+desc, "hv_pinterest");

        $('#pinterest-button').bind('click', $.proxy(this.pinterest, this));
        return;
    },

    updateExternalDataSourceIntegration: function (event) {
        var imageAccordions = $('#accordion-images .dynaccordion-section'),
            vsoLinks        = $('#vso-links'),
            vsoPreviews     = $('#vso-previews'),
            vsoButtons      = $('#vso-buttons'),
            sdoPreviews     = $('#sdo-previews'),
            sdoButtons      = $('#sdo-buttons'),
            vport, imageScale;

        if ( typeof this.viewport._tileLayerManager == 'undefined' ) {
            return false;
        }

        vport = this.viewport.getViewportInformation();
        imageScale = vport['imageScale'];  // Arcseconds per pixel

        if ( $('#accordion-vso .content').is(':visible') ) {
            this.updateVSOaccordion(vsoLinks, vsoPreviews, vsoButtons,
                imageAccordions, imageScale);
        }

        if ( $('#accordion-sdo .content').is(':visible') ) {
            this.updateSDOaccordion(sdoPreviews, sdoButtons, imageAccordions,
                imageScale);
        }
    },


    _setVSOtimes: function (startDate, startTime, endDate, endTime) {

        if ( startDate=='' || startTime=='' || endDate=='' || endTime=='' ) {

            startDate = this.viewport.getEarliestLayerDate().toUTCDateString();
            startTime = this.viewport.getEarliestLayerDate().toUTCTimeString();

            endDate   = this.viewport.getLatestLayerDate().toUTCDateString();
            endTime   = this.viewport.getLatestLayerDate().toUTCTimeString();
        }

        $('#vso-start-date').val( startDate );
        $('#vso-start-time').val( startTime );

        $('#vso-end-date').val( endDate );
        $('#vso-end-time').val( endTime );
    },

    /**
     * TODO: Ignore non-AIA/HMI layers
     */
    _setSDOtimes: function (startDate, startTime, endDate, endTime) {

        if ( startDate=='' || startTime=='' || endDate=='' || endTime=='' ) {

            startDate = this.viewport.getEarliestLayerDate().toUTCDateString();
            startTime = this.viewport.getEarliestLayerDate().toUTCTimeString();

            endDate   = this.viewport.getLatestLayerDate().toUTCDateString();
            endTime   = this.viewport.getLatestLayerDate().toUTCTimeString();
        }

        $('#sdo-start-date').val( startDate );
        $('#sdo-start-time').val( startTime );

        $('#sdo-end-date').val( endDate );
        $('#sdo-end-time').val( endTime );
    },


    /**
     * Sun-related Constants
     */
    constants: {
        au: 149597870700, // 1 au in meters (http://maia.usno.navy.mil/NSFA/IAU2009_consts.html)
        rsun: 695700000  // radius of the sun in meters (JHelioviewer)
    }
});
/**
 * @fileOverview Contains the class definition for an UserVideoGallery class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Class */
"use strict";
var UserVideoGallery = Class.extend(
    /** @lends UserVideoGallery.prototype */
    {
    /**
     * @constructs
     * @description Creates a new UserVideoGallery component
     */
    init : function (url) {
        this._container   = $("#user-video-gallery-main");
        this._loader      = $("#user-video-gallery-spinner");

        this._working     = false;

        // Feed URL
        this.url = url || Helioviewer.api;

        // Remote (may differ from local due to deleted videos, etc)
        this._numVideos = 20;

        this._videos = [];

        this._fetchVideos();

        // Auto-refresh every couple minutes
        var self = this;

        window.setInterval(function () {
            self._checkForNewMovies();
        }, 120000);
    },

    /**
     * Updates video gallery to show new entries
     */
    _updateGallery: function () {
        this._buildHTML(this._videos);
    },

    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchVideos: function () {
        // Query parameters
        var params = {
            "action": "getUserVideos",
            "num"   : this._numVideos
        };

        // Show loading indicator
        this._container.find("a").empty();
        this._loader.show();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this),
              Helioviewer.dataType);
    },

    /**
     * Checks to see if any new movies have been uploaded over the past couple
     * minutes.
     */
    _checkForNewMovies: function () {
        // Query parameters
        var params = {
            "action": "getUserVideos",
            "num"   : this._numVideos
        };

        // Use publish date for last video retrieved
        if (this._videos.length > 0) {
            params.since = this._videos[0].published.replace(" ", "T") +
                           ".000Z";
        }

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this),
              Helioviewer.dataType);
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponse: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key " +
                    "in Config.ini?";
            $("#user-video-gallery-main").html(error);
            return;
        }

        // Yahoo Pipes output
        if (response.count) {
            videos = response.value.items;
        } else {
            // Local feed
            videos = response;
        }

        this._videos = videos.concat(this._videos);
        this._updateGallery();
    },

    /**
     * Builds video gallery HTML
     */
    _buildHTML: function (videos) {
        var html = "";

        // Remove old thumbmails
        this._container.find("a, br").remove();

        $.each(videos, function (i, vid) {
            var when = new Date.parseUTCDate(vid.published)
                               .getElapsedTime() + " ago",
                img = vid.thumbnails['small'];

            html += "<a target='_blank' href='" + vid.url + "' " +
                    "alt='video thumbnail'>" +
                    "<div id='user-video-thumbnail-container'>" +
                    "<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />" +
                    "<div style='text-align: center;'>" +
                    when + "</div>" +
                    "</div></a><br />";
        });

        // Drop tailing line break
        html = html.slice(0, -6);

        this._loader.hide();
        this._container.append(html);

        this._working = false;
    },

    /**
     * Hover event handler
     */
    _onVideoHover: function (event) {
        if (event.type === 'mouseover') {
            $(this).find("img").addClass("video-glow");
        } else {
            $(this).find("img").removeClass("video-glow");
        }
    }

});
/**
 * Helioviewer.org Visual Glossary
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, Class, helioviewer*/
"use strict"; 
var VisualGlossary = Class.extend(
    /** @lends VisualGlossary.prototype */
    {
    /**
     * Visual glossary constructor 
     * @constructs 
     */ 
    init: function (setupDialog) {
        // Settings dialog
        setupDialog("#helioviewer-glossary", "#glossary-dialog", {
            "title": "Helioviewer - Glossary",
            "width": 800,
            "height": $(document).height() * 0.8
        }, $.proxy(this._onLoad, this));
    },
    
    /**
     * Setup event handlers
     */
    _onLoad: function (evt) {
        var self = this;
        
        // Category buttons
        this.btns = $('#glossary-menu .text-btn');
        
        // Glossary entries
        this.entries = $("#glossary-contents tr");
        
        // Highlight both text and icons for text buttons
        $("#glossary-menu .text-btn").hover(
            function () {
                $(this).find(".ui-icon").addClass("ui-icon-hover");
            },
            function () {
                $(this).find(".ui-icon").removeClass("ui-icon-hover");
            }
        );
        
        // On select
        this.btns.click(function (e) {
            self.btns.removeClass("selected");
            self.btns.find('.ui-icon').removeClass('ui-icon-bullet').addClass('ui-icon-radio-on');
            $(this).addClass("selected").find('.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-bullet');

            self._showCategory(this.id.split("-").pop());
        });

        // Show basic entries
        this._showCategory("basic");
    },
    
    /**
     * On category select
     */
    _showCategory: function (category) {
        this.entries.hide();

        if (category === "all") {
            this.entries.show();
        } else {
            this.entries.filter(".g-" + category).show();    
        }
    }
});
 /**
 * @class
 * @description jQuery Dynamic "Accordion" Plugin
 * @author Michael Lynch
 * @author Keith Hughitt
 *
 * Depends:
 * ui.core.js
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global jQuery */
"use strict";
(function ($) {
    $.widget("ui.dynaccordion", {
        options: {
            displayArrows: true,
            startClosed: true
        },
        
        init: function () {
            return this.element;
        },
        
        updateHeader: function (o) {
            $(this.element).find('#' + o.id + ' > .dynaccordion-tab').text(o.content);
        },
        updateCell: function (o) {
            $(this.element).find('#' + o.id + ' > .dynaccordion-cell').text(o.content);
        },
        removeSection: function (o) {
            $(this.element).find('#' + o.id).remove();
        },
        addSection: function (o) {
            var index, id, arrow, header, body, domNode, container, sections, self = this; 
            
            id        = o.id;
            container = $(this.element);
            sections  = container.find(".dynaccordion-section");
    
            // Open/closed arrow
            if (this.options.displayArrows) {
                if (o.open) {
                    arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-s'></div>";
                }
                else {
                    arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-e'></div>";
                }
            } else {
                arrow = "";
            }
            
            // Build HTML
            header  = $('<div class="dynaccordion-tab">' + arrow + o.header + '</div>');
            body    = $('<div class="dynaccordion-cell ui-accordion-content ui-helper-reset ui-widget-content ' + 
                        'ui-corner-bottom ui-corner-top shadow">' + o.cell + '</div>');
            domNode = $('<div class="dynaccordion-section" id="' + id + '"></div>').append(header).append(body);
               
            // Add new section to appropriate location
            if ((o.index !== "undefined") && (o.index < sections.length)) {
                $(container.find(".dynaccordion-section")[o.index]).before(domNode);
            } else {
                container.append(domNode);
            }
            
            // Mouse-over effects
            header.find(".layer-Head").hover(
                function () {
                    $(this).addClass("ui-state-hover-bgonly");
                }, 
                function () {
                    $(this).removeClass("ui-state-hover-bgonly");
                }
            );
    
            // Open/Close animation
            $('#' + id + ' > div.dynaccordion-tab').unbind().click(function () {
                if (self.options.displayArrows) {
                    var arrowIcon = $(this).find('.accordion-arrow')[0]; 
                    $(arrowIcon).toggleClass('ui-icon-triangle-1-s');
                    $(arrowIcon).toggleClass('ui-icon-triangle-1-e');
                }
                $(this).next().slideToggle('fast');
            });
            
            // Chose initial view
            if (this.options.startClosed && (!o.open)) {
                $('#' + id + ' > div.dynaccordion-cell').hide();
            }
        }
    });
}(jQuery));

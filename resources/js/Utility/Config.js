/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:daniel.garciabriseno@nasa.gov">Daniel Garcia Briseno</a>
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
     * Default parameters
     */
     params: {
        'back_end'                  : "https://api.helioviewer.org/",
        'web_root_url'              : "https://helioviewer.org",
        'build_num'                 : 700,
        'default_image_scale'       : 4.8408817,
        'ref_image_scale'           : 0.60511022,
        'min_image_scale'           : 0.30255511,
        'max_image_scale'           : 154.90822,
        'max_tile_layers'           : 5,
        'prefetch_size'             : 0,
        'news_url'                  : "https://helioviewer-project.github.io/",
        'user_video_feed'           : "https://api.helioviewer.org/",
        'contact_email'             : "HelioViewerDevelopment@nasa.onmicrosoft.com",
        'regenerate_movie_threshold': 90,
        'enable_helios_backlinks'   : false,
        'jhelioviewer_host'         : 'GSFC', // Mirrors should set this to their server code.
        'coordinator_url'           : 'https://api.helioviewer.org/coordinate',
        /**
         * The maximum time difference in seconds between an image and
         * the chosen observation time. If the time delta exceeds this
         * amount, then a warning is created.
         * default: 6 hours
         */
        'obstime_alert_dt'          : 21600
     },

    /**
     * @description Creates a new Config.
     * @constructs
     */
    init: function (params) {
        var self = this;

        $.each(params, function (k,v) {
            self.params[k] = v;
        });

        this.bools  = [];
        this.ints   = ["build_num", "prefetch_size", "max_movie_frames", "max_tile_layers"];
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
            param = self.params[this].toString().toLowerCase();

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
            'version'                 : this.params["build_num"],
            'defaultImageScale'       : this.params["default_image_scale"],
            'refImageScale'           : this.params["ref_image_scale"],
            'minImageScale'           : this.params["min_image_scale"],
            'maxImageScale'           : this.params["max_image_scale"],
            'maxTileLayers'           : this.params["max_tile_layers"],
            'prefetchSize'            : this.params["prefetch_size"],
            'backEnd'                 : this.params["back_end"],
            'newsURL'                 : this.params["news_url"],
            'rootURL'                 : this.params["web_root_url"],
            'videoFeed'               : this.params["user_video_feed"],
            'contactEmail'            : this.params["contact_email"],
            'apiURL'                  : this.params["back_end"],
            'regenerateMovieThreshold': this.params["regenerate_movie_threshold"],
            'enableHelios'            : this.params["enable_helios_backlinks"],
            'jhelioviewerHost'        : this.params["jhelioviewer_host"],
            'obstime_alert_dt'        : this.params["obstime_alert_dt"]
        };
    }
});

// Put Config in the window to support legacy code.
window.Config = Config
// Use more modern export so we're not using the global space in modules.
// This way we can see where config is coming from via the import statement.
export { Config }

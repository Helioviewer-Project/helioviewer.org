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
     * Default parameters
     */
     params: {
        'back_end'             	: "http://helioviewer.org/api.php",
        'web_root_url'         	: "http://helioviewer.org",
        'static_asset_url'     	: "http://helioviewer.org",
	    'build_num'             : 700,
        'default_image_scale'   : 4.8408817,
        'min_image_scale'       : 0.60511022,
        'max_image_scale'       : 154.90822,
        'max_tile_layers'       : 5,
        'prefetch_size'        	: 0,
        'default_timestep'   	: 86400,
        'news_url'             	: "http://blog.helioviewer.org/",
        'user_video_feed'       : "http://helioviewer.org/api.php",
        'contact_email'        	: "contact@helioviewer.org",
        'disable_cache'        	: false,
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

        this.bools  = ["disable_cache"];
        this.ints   = ["build_num", "default_timestep", "prefetch_size", "max_movie_frames", "max_tile_layers"];
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

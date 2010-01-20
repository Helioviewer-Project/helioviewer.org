/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class handles the creation and validation of basic configuration parameters
 */
"use strict";
/*global Class, $, window */
var Config = Class.extend(
    /** @lends Config.prototype */
    {
    /**
     * @description Creates a new Config. 
     * @constructs 
     */ 
    init: function (params) {
        this.params = params;
        
        this.bools  = ["distributed_tiling_enabled", "backup_enabled", "enable_cache"];
        this.ints   = ["build_num", "default_zoom_level", "default_timestep", "min_zoom_level",  
                       "max_zoom_level", "prefetch_size", "png_compression_quality", "jpeg_compression_quality",    
                       "bit_depth", "num_colors", "tile_pad_width", "max_movie_frames", "base_zoom_level"];
        this.floats = ["base_image_scale"];
        
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
             
            if ((param === "true") || (param === "1"))
                self.params[this] = true;
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
     * @description Returns the API base URL
     */
    getAPIBaseURL: function () {
        return this.params['api_base_url'];
    },
    
    /**
     * @description Returns the configuration parameters as an associative array
     */
    toArray: function () {
        return {
            'version'           : this.params["build_num"],
            'defaultZoomLevel'  : this.params["default_zoom_level"],
            'defaultObsTime'    : this.params["default_obs_time"],
            'minZoomLevel'      : this.params["min_zoom_level"],
            'maxZoomLevel'      : this.params["max_zoom_level"],
            'baseZoom'          : this.params["base_zoom_level"],
            'baseScale'         : this.params["base_image_scale"],
            'prefetchSize'      : this.params["prefetch_size"],
            'timeIncrementSecs' : this.params["default_timestep"],
            'tileServer1'       : this.params["tile_server_1"],
            'tileServer2'       : this.params["tile_server_2"],
            'backupServer'      : this.params["backup_server"],
            'backupEnabled'     : this.params["backup_enabled"],
            'distributed'       : this.params["distributed_tiling_enabled"],
            'rootURL'           : this.params["web_root_url"],
        };
    }
});

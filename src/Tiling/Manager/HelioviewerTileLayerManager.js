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
/*global HelioviewerTileLayer, TileLayerManager $ */
"use strict";
var HelioviewerTileLayerManager = TileLayerManager.extend(
/** @lends HelioviewerTileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (api, observationDate, dataSources, tileSize, viewportScale, maxTileLayers, 
                    tileServers, savedLayers, urlLayers) {

        this._super(api, observationDate, dataSources, tileSize, viewportScale, maxTileLayers,
		tileServers, savedLayers, urlLayers);

        this._queue = [ "SOHO,EIT,EIT,304", "SOHO,LASCO,C2,white-light", "SOHO,LASCO,C3,white-light", 
                        "SOHO,LASCO,C2,white-light", "SOHO,MDI,MDI,magnetogram", "SOHO,MDI,MDI,continuum",
                        "SOHO,EIT,EIT,171", "SOHO,EIT,EIT,284", "SOHO,EIT,EIT,195" ];
        
        var startingLayers = this._parseURLStringLayers(urlLayers) || savedLayers;
        this._loadStartingLayers(startingLayers);
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, params, opacity, queue, ds, server, defaultLayer = "SOHO,EIT,EIT,171";

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
        currentLayers = [];
        $.each(this._layers, function () {
            currentLayers.push(this.image.getLayerName());
        });

        // remove existing layers from queue
        queue = $.grep(this._queue, function (item, i) {
            return ($.inArray(item, currentLayers) === -1);
        });

        // Pull off the next layer on the queue
        next = queue[0] || defaultLayer;

        params = this.parseLayerString(next + ",1,100");

        server = this._selectTilingServer();

        ds = this.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
        $.extend(params, ds);

        opacity = this._computeLayerStartingOpacity(params.layeringOrder);

        // Add the layer
        this.addLayer(
            new HelioviewerTileLayer(this._layers.length, this._observationDate, this.tileSize, this.viewportScale, 
                          this.tileVisibilityRange, this.api, this.tileServers[params.server], params.observatory, 
                          params.instrument, params.detector, params.measurement, params.sourceId, params.name, 
                          params.visible, opacity, params.layeringOrder, server)
        );
        this.save();
    },
    
    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, basicParams, self = this;

        $.each(layers, function (index, params) {
            basicParams = self.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
            $.extend(params, basicParams);

            layer = new HelioviewerTileLayer(index, self._observationDate, self.tileSize, self.viewportScale, 
                                  self.tileVisibilityRange, self.api, self.tileServers[params.server], 
                                  params.observatory, params.instrument, params.detector, params.measurement, 
                                  params.sourceId, params.name, params.visible, params.opacity, params.layeringOrder, 
                                  params.server);

            self.addLayer(layer);
        });
    },
    
    /**
     * Selects a server to handle all tiling and image requests for a given layer
     */
    _selectTilingServer: function () {
        return Math.floor(Math.random() * (this.tileServers.length));                    
    },

    /**
     * Breaks up a given layer identifier (e.g. SOHO,LASCO,C2,white-light) into its
     * component parts and returns a JavaScript representation.
     *
     * @param {String} The layer identifier as an underscore-concatenated string
     * 
     * @returns {Object} A simple JavaScript object representing the layer parameters
     */
    parseLayerString: function (str) {
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
    },
    
    /**
     * The toJSON and toString methods are not what is needed for screenshots/movies, so 
     * this returns a differently-formatted string
     */
    toScreenshotQueryString: function () {
        var json, str, parsedLayers = [];
        $.each(this._layers, function () {
            json = this.toJSON();
            str = json.observatory + "," + json.instrument + "," + json.detector + 
                    "," + json.measurement + "," + json.opacity;
            if (json.visible === 1) {
                parsedLayers.push(str);
            }
        });
        return parsedLayers;
    }
});
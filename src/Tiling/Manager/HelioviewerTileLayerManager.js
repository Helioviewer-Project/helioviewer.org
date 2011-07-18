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
/*global HelioviewerTileLayer, TileLayerManager, parseLayerString, $ */
"use strict";
var HelioviewerTileLayerManager = TileLayerManager.extend(
/** @lends HelioviewerTileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (api, observationDate, dataSources, tileSize, viewportScale, maxTileLayers, 
                    servers, startingLayers, urlLayers) {
        this._super(api, observationDate, dataSources, tileSize, viewportScale, maxTileLayers,
		            servers, startingLayers, urlLayers);

        this._queue = [ "SDO,AIA,AIA,304", "SOHO,LASCO,C2,white-light", "SOHO,LASCO,C3,white-light", 
                        "SOHO,MDI,MDI,magnetogram", "SOHO,MDI,MDI,continuum", "SDO,AIA,AIA,171",
                        "SOHO,EIT,EIT,171", "SOHO,EIT,EIT,284", "SOHO,EIT,EIT,195" ];

        this._loadStartingLayers(startingLayers);
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, params, opacity, queue, ds, server, baseURL, 
            queueChoiceIsValid = false, i = 0, defaultLayer = "SDO,AIA,AIA,171";

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
        
        server = this._selectTilingServer();

        // Pull off the next layer on the queue
        while (!queueChoiceIsValid) {
            next = queue[i] || defaultLayer;
            params = parseLayerString(next + ",1,100");
            
            if (this.checkDataSource(params.observatory, params.instrument, params.detector, params.measurement)) {
                queueChoiceIsValid = true;
            }
            i += 1;
        }
        
        baseURL = this.servers[server] || "api/index.php";

        ds = this.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
        $.extend(params, ds);

        opacity = this._computeLayerStartingOpacity(params.layeringOrder);

        // Add the layer
        this.addLayer(
            new HelioviewerTileLayer(this._layers.length, this._observationDate, this.tileSize, this.viewportScale, 
                          this.tileVisibilityRange, this.api, baseURL, params.observatory, 
                          params.instrument, params.detector, params.measurement, params.sourceId, params.nickname, 
                          params.visible, opacity, params.layeringOrder, server)
        );
        this.save();
    },
    
    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, basicParams, baseURL, numLayers, i, self = this;
        
        numLayers = layers.length;
        i = 0;

        $.each(layers, function (index, params) {
            basicParams = self.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
            $.extend(params, basicParams);
            
            baseURL = self.servers[params.server] || "api/index.php";

            layer = new HelioviewerTileLayer(index, self._observationDate, self.tileSize, self.viewportScale, 
                                  self.tileVisibilityRange, self.api, baseURL, 
                                  params.observatory, params.instrument, params.detector, params.measurement, 
                                  params.sourceId, params.nickname, params.visible, params.opacity,
                                  params.layeringOrder, params.server);

            self.addLayer(layer);

            i += 1;
            
            // Once the final layer has been loaded, load positioning from previous session
            if (i == numLayers) {
                $(document).trigger("load-saved-roi-position");
            }
        });
    },
    
    /**
     * Selects a server to handle all tiling and image requests for a given layer
     */
    _selectTilingServer: function () {
        return Math.floor(Math.random() * (this.servers.length));
    },

    /**
     * Checks to make sure requested data source exists
     * 
     * Note: Once defaults provided by getDataSource are used, this function will
     * no longer be necessary.
     */
    checkDataSource: function (obs, inst, det, meas) {
        if (this.dataSources[obs] !== undefined) {
            if (this.dataSources[obs][inst] !== undefined) {
                if (this.dataSources[obs][inst][det] !== undefined) {
                    if (this.dataSources[obs][inst][det][meas] !== undefined) {
                        return true;
                    }
                }
            }
        }
        
        return false;
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
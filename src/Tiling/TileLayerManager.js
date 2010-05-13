/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 * 
 * TODO (12/3/2009): Provide support for cases where solar center isn't the best sandbox-center, e.g. sub-field images.
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global LayerManager, TileLayer, Layer, $ */
"use strict";
var TileLayerManager = LayerManager.extend(
    /** @lends TileLayerManager.prototype */
    {
   
   /**
    * @constructs
    * @description Creates a new TileLayerManager instance
    */
    init: function (controller) {
        var self = this;
        
        this._super();
        this.controller = controller;
        this._layers = [];
        this._queue  = [
            "SOHO,EIT,EIT,304",
            "SOHO,LASCO,C2,white-light",
            "SOHO,LASCO,C3,white-light",
            "SOHO,LASCO,C2,white-light",
            "SOHO,MDI,MDI,magnetogram",
            "SOHO,MDI,MDI,continuum",
            "SOHO,EIT,EIT,171",
            "SOHO,EIT,EIT,284",
            "SOHO,EIT,EIT,195"
        ];
        
        $(document).bind("tile-layer-finished-loading", $.proxy(this.updateMaxDimensions, this))
                   .bind("save-tile-layers", $.proxy(this.save, this))
                   .bind("add-new-tile-layer", $.proxy(this.addNewLayer, this))
                   .bind("remove-tile-layer", function (event, id) {
                        self.removeLayer(id);
                    });
    },
   
    /**
     * @description Updates the list of loaded tile layers stored in cookies
     */
    save: function () {
        var layers = this.toJSON();        
        $(document).trigger("save-setting", ["tileLayers", layers]);        
    },
    
    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, rand, params, opacity, queue, ds, server, defaultLayer = "SOHO,EIT,EIT,171";
        
        // If new layer exceeds the maximum number of layers allowed, display a message to the user
        if (this.size() >= this.controller.maxTileLayers) {
            $(document).trigger("message-console-warn",
                    ["Maximum number of layers reached. Please remove an existing layer before adding a new one."]);
            return;
        }
        
        // current layers in above form
        currentLayers = [];
        $.each(this._layers, function () {
            currentLayers.push(this.image.observatory + "," + this.image.instrument + "," + 
                               this.image.detector + "," + this.image.measurement);
        });
        
        // remove existing layers from queue
        queue = $.grep(this._queue, function (item, i) {
            return ($.inArray(item, currentLayers) === -1);
        });
        
        // Pull off the next layer on the queue
        next = queue[0] || defaultLayer;

        params = TileLayerManager.parseLayerString(next + ",1,100");
        
        server = this.controller.selectTilingServer();
        
        
        ds = this.controller.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
        $.extend(params, ds);
        
        opacity = this._computeLayerStartingOpacity(params.layeringOrder);
        
        // Add the layer
        this.addLayer(
            new TileLayer(this.controller, this._layers.length, this.controller.getDate(), 
                          this.controller.viewport.tileSize, 
                          this.controller.api, this.controller.tileServers[params.server],
                          params.observatory, params.instrument, params.detector, params.measurement, 
                          params.sourceId, params.name, params.visible, opacity, params.layeringOrder, server)
        );
        this.save();
    },
    
    /**
     * Determines initial opacity to use for a new layer based on which layers are currently loaded
     */
    /**
     * @description Sets the opacity for the layer, taking into account layers which overlap one another.
     */
    _computeLayerStartingOpacity: function (layeringOrder) {
        var counter = 1;

        $.each(this._layers, function () {
            if (this.layeringOrder === layeringOrder) {
                counter += 1;
            }
        });

        return 100 / counter;
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
 * Breaks up a given layer identifier (e.g. SOHO,LASCO,C2,white-light) into its component parts and returns 
 * a javascript representation.
 * 
 * @static
 * @param {String} The layer identifier as an underscore-concatenated string
 * @see TileLayer.toString
 * 
 * @returns {Object} A simple javascript object representing the layer params
 */
TileLayerManager.parseLayerString = function (str) {
    var params = str.split(",");
    return {
        observatory: params[0],
        instrument : params[1],
        detector   : params[2],
        measurement: params[3],
        visible    : Boolean(parseInt(params[4], 10)),
        opacity    : parseInt(params[5], 10),
        server     : parseInt(params[6], 10) || 0
    };
};
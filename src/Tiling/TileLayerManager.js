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
        
		$(document).bind("tile-layer-finished-loading", $.proxy(this.updateMaxDimensions, this));
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
        var currentLayers, next, rand, meta, queue, defaultLayer = "SOHO,EIT,EIT,171";
        
        // If new layer exceeds the maximum number of layers allowed, display a message to the user
        if (this.size() >= this.controller.maxTileLayers) {
            $(document).trigger("message-console-warn", ["Maximum number of layers reached. " +
                                                "Please remove an existing layer before adding a new one."]);
            return;
        }
        
        queue = this._queue;
        
        // current layers in above form
        currentLayers = [];
        $.each(this._layers, function () {
            currentLayers.push(this.meta.observatory + "," + this.meta.instrument + "," + this.meta.detector + "," + this.meta.measurement);
        });
        
        // remove existing layers from queue
        queue = $.grep(queue, function (item, i) {
            return ($.inArray(item, currentLayers) === -1);
        });
        
        //$.each(currentLayers, function() {
        //    queue = queue.without(this);
        //});
        
        // Pull off the next layer on the queue
        next = queue[0] || defaultLayer;

        meta = TileLayerManager.parseLayerString(next + ",1,100");
       
        meta.server = this.controller.selectTilingServer();

        $.extend(meta, this.controller.dataSources[meta.observatory][meta.instrument][meta.detector][meta.measurement]);
        
        // Add the layer
        this.addLayer(new TileLayer(this.controller, this.controller.getDate(), meta));
        this.save();
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
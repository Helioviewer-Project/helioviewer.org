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
        this._super(controller);
        this._layers = [];
        this._queue  = [
            "SOHO,EIT,EIT,304",
            "SOHO,LASCO,C2,white light",
            "SOHO,LASCO,C3,white light",
            "SOHO,LASCO,C2,white light",
            "SOHO,MDI,MDI,magnetogram",
            "SOHO,MDI,MDI,continuum",
            "SOHO,EIT,EIT,171",
            "SOHO,EIT,EIT,284",
            "SOHO,EIT,EIT,195"
        ];
    },
   
    /**
     * @description Updates the list of loaded tile layers stored in cookies
     */
    save: function () {
        var layers = this.toJSON();        
        this.controller.userSettings.set('tileLayers', layers);
    },
    
    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, rand, layerSettings, queue, defaultLayer = "SOHO,EIT,EIT,171";
        
        // If new layer exceeds the maximum number of layers allowed, display a message to the user
        if (this.size() >= this.controller.maxTileLayers) {
            this.controller.messageConsole.warn("Maximum number of layers reached. " +
            		                            "Please remove an existing layer before adding a new one.");
            return;
        }
        
        queue = this._queue;
        
        // current layers in above form
        currentLayers = [];
        $.each(this._layers, function () {
            currentLayers.push(this.observatory + "," + this.instrument + "," + this.detector + "," + this.measurement);
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
        layerSettings = this.controller.userSettings.parseLayerString(next + ",1,100");
        
        // Select tiling server if distributed tiling is enabling
        layerSettings.server = this.controller.selectTilingServer();

        // Open menu by default
        layerSettings.startOpened = true;
        
        // Add the layer
        this.addLayer(new TileLayer(this.controller, layerSettings));
        this.save();
    },
     
    /**
     * @description Returns the largest width and height of any layers (does not have to be from same layer)
     * @return {Object} The width and height of the largest layer
     */
    getMaxDimensions: function () {
        var maxLeft   = 0,
            maxTop    = 0,
            maxBottom = 0,
            maxRight  = 0;
        
        $.each(this._layers, function () {
            // Ignore if the relative dimensions haven't been retrieved yet
            if ($.isNumber(this.relWidth)) {
                var d = this.getDimensions();
                
                maxLeft   = Math.max(maxLeft, d.left);
                maxTop    = Math.max(maxTop, d.top);
                maxBottom = Math.max(maxBottom, d.bottom);
                maxRight  = Math.max(maxRight, d.right);
            }
        });
        
        return {width: maxLeft + maxRight, height: maxTop + maxBottom};
    },

    /**
     * @description Gets the maximum relative width and height of all visible layers, according to jp2 image sizes,
     *              not tilelayer sizes. Used when generating movies and screenshots, because tilelayer size is 
     *              slightly smaller than jp2 image size and images will not align properly with tilelayer sizes.
     * @return {Array} dimensions -- maximum width and height found.
     * 
     * NOTE 02/01/2010: This may longer necessary since the actual JP2 dimensions are now
     * returned during each getClosestImage request?
     */
    getMaxJP2Dimensions: function (left, top, width, height) {
        var dimensions, insideCircleC2, insideCircleC3, sizeOffset, relWidth, relHeight,
            maxWidth = 0, maxHeight = 0;
        
        $.each(this._layers, function () {
            if (this.visible) {
                insideCircleC2 = this.insideCircle(216, this.width / 2, left, top, width, height);
                insideCircleC3 = this.insideCircle(104, this.width / 2, left, top, width, height);
                
                if (this.detector.toString === "C2" && insideCircleC2) {
                    // Do nothing
                }
                if (this.detector.toString === "C3" && insideCircleC3) {
                    // Do nothing
                }
                
                else {
                    sizeOffset = this.width / this.relWidth;
                    
                    relWidth  = this.width  / sizeOffset;
                    relHeight = this.height / sizeOffset;
                    
                    maxWidth = Math.max(maxWidth, relWidth);
                    maxHeight = Math.max(maxHeight, relHeight);
                }
            }
        });

        dimensions = {
            width  : maxWidth,
            height : maxHeight
        };

        return dimensions;
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
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
     * @param {Object} A Rseference to the main application controller
     */
    init: function (controller) {
        this.controller = controller;
        this._layers    = [];
        $(document).bind("observation-time-changed", $.proxy(this.reloadLayers, this));
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
     * @description Returns the largest width and height of any layers (does not have to be from same layer)
     * @return {Object} The width and height of the largest layer
     * 
     * In order to allow Helioviewer to fully display all layers, a simple solution is to determine the
     * "maximum dimensions" for all layers. That is, if you were to flatten all layers into a single one,
     * what would it's dimensions be? If the viewport is able to view this entire layer, then all of it's component
     * layers will be fully-navigable. 
     */
    getMaxDimensions: function () {
        var maxLeft   = 0,
            maxTop    = 0,
            maxBottom = 0,
            maxRight  = 0;
        
        $.each(this._layers, function () {
            var d = this.getDimensions();
            
            maxLeft   = Math.max(maxLeft, d.left);
            maxTop    = Math.max(maxTop, d.top);
            maxBottom = Math.max(maxBottom, d.bottom);
            maxRight  = Math.max(maxRight, d.right);
        });
        
        return {width: maxLeft + maxRight, height: maxTop + maxBottom};
    },

    /**
     * @description Removes a layer
     * @param {Object} The layer to remove
     */
    removeLayer: function (layer) {
        layer.domNode.remove();
        this._layers = $.grep(this._layers, function (e, i) {
            return (e.id !== layer.id);
        });
        layer = null;
        this.controller.viewport.updateSandbox();
    },
    
    refreshLayers: function () {
        $.each(this._layers, function () {
            this.refresh();
        });
    },
    
    /**
     * @description Reload layers (For tile layers, finds closest image)
     * 
     * @TODO 06/14/2010: Rename/refactor to something like "onTimeChange?"
     */
    reloadLayers: function () {
        $.each(this._layers, function () {
            this.reload();
        });
    },

    /**
     * @description Resets each of the layers
     */
    onZoomLevelChange: function () {
        $.each(this._layers, function () {
            this.onZoomLevelChange();
        });
    },
    
    /**
     * @description Iterates through layers
     */
    each: function (fn) {
        $.each(this._layers, fn);
    },
    
    /**
     * @description Returns a string representation of the layers currently being displayed
     */
    serialize: function () {
        var layers = "";

        $.each(this._layers, function () {
            layers += "[" + this.serialize() + "],";
        });
        
        // Remove trailing comma
        layers = layers.slice(0, -1);
        
        return layers;
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

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
        
        if(typeof layer != 'undefined'){
	        layer.domNode.remove();
	        this._layers = $.grep(this._layers, function (e, i) {
	            return (e.id !== layer.id);
	        });
	        layer = null;
	        
	        this.refreshMaxDimensions(type);
        }
        
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

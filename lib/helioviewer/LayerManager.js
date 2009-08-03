/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * syntax: jQuery (x)
 */
/*global LayerManager, Class, $A */
var LayerManager = Class.create(
	/** @lends LayerManager.prototype */
	{
    /**
     * @constructs
     * @description Creates a new LayerManager
     * @param {Object} A Rseference to the main application controller
     */
    initialize: function (controller) {
        this.controller = controller;
        this._layers    = [];
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
	 * @description Removes a layer
	 * @param {Object} The layer to remove
	 * TODO: update sandbox dimensions
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
		this._layers = jQuery.grep(this._layers, function (e, i) {
            return (e.id !== layer.id);
        });
	},
	
	/**
	 * @description Reload layers (For tile layers, finds closest image)
	 */
	reloadLayers: function () {
		jQuery.each(this._layers, function () {
			this.reload();
		});
	},

	/**
	 * @description Resets each of the layers
	 */
	resetLayers: function () {
		jQuery.each(this._layers, function () {
			this.reset(true);
		});
	},
    
    /**
     * @description Iterates through layers
     */
    each: function (fn) {
        jQuery.each(this._layers, fn);
    },
    
    /**
     * @description Returns a string representation of the layers currently being displayed
     */
    toString: function () {
        var layers="";

        jQuery.each(this._layers, function() {
            layers += "[" + this.toString() + "],";
        });
        
        // Remove trailing comma
        layers = layers.slice(0,-1);
        
        return layers;
    },
    
    /**
     * @description Returns a JSON representation of the layers currently being displayed
     */
    toJSON: function () {
    	var layers = [];
    	
    	jQuery.each(this._layers, function () {
    		layers.push(this.toJSON());
    	});
        
        return layers;       
    }
});

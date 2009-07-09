/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
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
        this.controller  = controller;
        this._layers      = $A([]);       
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
		this._layers = this._layers.without(layer);
	},
	
	/**
	 * @description Reload layers (For tile layers, finds closest image)
	 */
	reloadLayers: function () {
		this._layers.each(function (layer) {
			layer.reload();
		});
	},

	/**
	 * @description Resets each of the layers
	 */
	resetLayers: function () {
		this._layers.each(function (layer) {
			layer.reset(true);
		});
	},
    
    /**
     * @description Iterates through layers
     */
    each: function (fn) {
        this._layers.each(fn);
    },
    
    /**
     * @description Returns a string representation of the layers currently being displayed
     */
    toString: function () {
        var layers="";

        this._layers.each(function(l) {
            layers += "[" + l.toString() + "],";
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
    	
    	this._layers.each(function (l) {
    		layers.push(l.toJSON());
    	});
        
        return layers;       
    }
});

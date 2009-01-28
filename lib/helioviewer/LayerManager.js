/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 */
/**
 * @class LayerManager A simple layer manager.
 */
var LayerManager = Class.create(UIElement, {
    /**
     * @constructor
     * @param {Helioviewer} Controller.
     */
    initialize: function (controller) {
        this.controller = controller;
        this.layers = $A([]);
    },
    
    hasId: function (id) {
		//return (this.layers.grep(id).length > 0 ? true : false);
	},

	/**
	 * @function addLayer
	 * @description Add a new layer
	 */
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	/**
	 * @function
	 * @return {Integer} Number of tile layers present.
	 */
	numTileLayers: function () {
		var n = 0;
		this.layers.each(function(l){
			if (l.type == "TileLayer") {
				n++;
			}
		});
		
		return n;
	},
	
	/**
	 * getMaxDimensions - Returns the largest width and height of any layers (does not have to be from same layer).
	 * @param {Object} catalog
	 */
	getMaxDimensions: function () {
		var maxWidth  = 0;
		var maxHeight = 0;
		
		this.layers.each(function(l){
			if (l.type == "TileLayer") {
				// Ignore if the relative dimensions haven't been retrieved yet
				if (Object.isNumber(l.relWidth)) {
					maxWidth  = Math.max(maxWidth,  l.relWidth);
					maxHeight = Math.max(maxHeight, l.relHeight); 
				}
			}
		});
		
		//console.log("Max dimensions: " + maxWidth + ", " + maxHeight);
		
		return {width: maxWidth, height: maxHeight};
	},
	
	/**
	 * @function
	 * @param {String} catalog id
	 */
	hasEventCatalog: function (catalog) {
		return (this.eventLayers().find(function(l) {return l.catalog == catalog}) ? true : false);
	},
	
	/**
	 * @function
	 * @description Returns only event-layers.
	 */
	eventLayers: function () {
		return this.layers.findAll(function(l) { return l.type == "EventLayer" });
	},
	
	/**
	 * @function
	 */
	tileLayers: function () {
		return this.layers.findAll(function(l) { return l.type == "TileLayer" });
	},
	
	/**
	 * @function
	 * @return {Integer} Number of event layers present.
	 */
	numEventLayers: function () {
		var n = 0;
		this.layers.each(function(l){
			if (l.type == "EventLayer") {
				n++;
			}
		});
		
		return n;
	},
	
	/**
	 * @function removeLayer
	 * @description Removes a layer
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	/**
	 * @function reloadLayers
	 * @description Reload layers
	 */
	reloadLayers: function () {
		this.layers.each(function (layer) {
			layer.reload();
		});
	},

	/**
	 * @function reset
	 * @description Reloads each of the tile layers
	 */
	resetLayers: function (visible) {
		this.layers.each(function (layer) {
			layer.reset(visible);
		});
	},
	
	/**
	 * @function refreshSavedTileLayers
	 * @description Updates the list of loaded tile layers stored in cookies
	 */
	refreshSavedTileLayers: function () {
		//console.log("refreshSavedTileLayers");
		var tilelayers = [];
		
		this.tileLayers().each(function(layer) {
			var settings = {
				tileAPI     : layer.tileAPI,
				observatory : layer.observatory,
				instrument  : layer.instrument, 
				detector    : layer.detector,
				measurement : layer.measurement
			};
			
			tilelayers.push(settings);
		});
		
		this.controller.userSettings.set('tile-layers', tilelayers);
	}
});

  

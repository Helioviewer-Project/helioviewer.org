/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
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
		return this.layers.findAll(function(l) { return l.type="EventLayer" });
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
	}
   
});

  

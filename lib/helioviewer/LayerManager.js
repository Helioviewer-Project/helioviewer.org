/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global LayerManager, Class, UIElement, $A */
var LayerManager = Class.create(UIElement,
	/** @lends LayerManager.prototype */
	{
    /**
     * @constructs
     * @description Creates a new LayerManager
     * @param {Object} A Rseference to the main application controller
     */
    initialize: function (controller) {
        this.controller  = controller;
        this.layers      = $A([]);
        this.labels      = false;
    },
    
    //hasId: function (id) {
		//return (this.layers.grep(id).length > 0 ? true : false);
	//},

	/**
	 * @description Add a new layer
	 */
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	/**
	 * @description Adds a layer that is not already displayed
	 */
	addNewLayer: function () {
		var priorityQueue, currentLayers, p, server, layerSettings, defaultLayer = "SOH,EIT,EIT,171";
		priorityQueue = $A([
			"SOH,EIT,EIT,304",
            "SOH,LAS,0C2,0WL",
            "SOH,LAS,0C3,0WL",
            "SOH,LAS,0C2,0WL",
            "SOH,MDI,MDI,mag",
            "SOH,MDI,MDI,int",
            "SOH,EIT,EIT,171",
            "SOH,EIT,EIT,284",
            "SOH,EIT,EIT,195"
		]);
		
		// current layers in above form
		currentLayers = $A([]);
		this.tileLayers().each(function (l) {
			currentLayers.push(l.observatory + "," + l.instrument + "," + l.detector + "," + l.measurement);
		});
		
		// remove existing layers from queue
		currentLayers.each(function(id) {
			priorityQueue = priorityQueue.without(id);
		});
		
        // Pull off the next layer on the queue
		p = priorityQueue.first() || defaultLayer;
        layerSettings = this.controller.userSettings.parseLayerString(p + ",1,100");
        
        // Selected tiling server if distributed tiling is enabling
        if ((this.controller.distributed === true) && ((this.numTileLayers() % 2) == 0))
            layerSettings.server = this.controller.tileServer2;
        else
            layerSettings.server = this.controller.tileServer1;

        // Open menu by default
        layerSettings.startOpened = true;
		
        // Add the layer
		this.addLayer(new TileLayer(this.controller.viewport, layerSettings));
		this.refreshSavedTileLayers();
	},
	
	/**
	 * @description Gets the number of TileLayers currently loaded
	 * @return {Integer} Number of tile layers present.
	 */
	numTileLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "TileLayer")
				n += 1;
		});
		
		return n;
	},
    
	/**
	 * @description Returns the largest width and height of any layers (does not have to be from same layer)
	 * @returns {Object} The width and height of the largest layer
	 */
	getMaxDimensions: function () {
		var maxWidth  = 0,
			maxHeight = 0;
		
		this.layers.each(function (l) {
			if (l.type === "TileLayer") {
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
	 * @description Checks for presence of a specific event catalog
	 * @param {String} catalog Catalog ID
	 */
	hasEventCatalog: function (catalog) {
		return (this.eventLayers().find(function (l) {
			return l.catalog === catalog;
		}) ? true : false);
	},
	
	/**
	 * @description Returns only event-layers.
	 * @returns {Array} An array containing each of the currently displayed EVENT layers
	 */
	eventLayers: function () {
		return this.layers.findAll(function (l) { 
			return l.type === "EventLayer";
		});
	},
	
	/**
	 * @description Returns only tile-layers.
	 * @returns {Array} An array containing each of the currently displayed TILE layers
	 */
	tileLayers: function () {
		return this.layers.findAll(function (l) {
			return l.type === "TileLayer";
		});
	},
    
    /**
     * @description Returns a string representation of the tile layers currently being displayed
     */
    tileLayersString: function () {
        var layers="";

        $A(this.tileLayers()).each(function(l) {
            layers += "[" + l.toString() + "],";
        });
        
        // Remove trailing comma
        layers = layers.slice(0,-1);
        
        return layers;
    },
    
	/**
	 * @description Gets the number of event layers currently loaded
	 * @return {Integer} Number of event layers present.
	 */
	numEventLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "EventLayer")
				n += 1;
		});
				
		return n;
	},
	
	/**
	 * @description Removes a layer
	 * @param {Object} The layer to remove
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
        //this.controller.viewport.sandbox.getDimensions();
        //this.controller.viewport.updateSandbox();
		this.layers = this.layers.without(layer);
	},
	
	/**
	 * @description Reload layers (For tile layers, finds closest image)
	 */
	reloadLayers: function () {
		this.layers.each(function (layer) {
			layer.reload();
		});
	},

	/**
	 * @description Resets each of the layers
	 */
	resetLayers: function () {
		this.layers.each(function (layer) {
			layer.reset(true);
		});
	},
    
    /**
     * @description Returns the current label visibility
     */
    getLabelVisibility: function () {
        return (this.labels == true) ? "inline" : "none";
    },
    
    /**
     * @description Toggle event label visibility
     */
    toggleLabels: function () {
        this.labels = !this.labels;
        jQuery('.event-label').toggle();
    },
    
	/**
	 * @description Updates the list of loaded tile layers stored in cookies
	 */
	refreshSavedTileLayers: function () {
		var tilelayers = [];
		
		this.tileLayers().each(function (layer) {
			tilelayers.push(layer.toJSON());
		});
		
		this.controller.userSettings.set('tileLayers', tilelayers);
	}
});

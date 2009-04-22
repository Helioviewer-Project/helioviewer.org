/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
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
        this.distributed = true;
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
		var priorityQueue, currentLayers, p, api, serverNum, defaultChoice = "SOHEITEIT171";
		priorityQueue = $A([
			"SOHEITEIT304", "SOHLAS0C20WL", "SOHLAS0C30WL", "SOHLAS0C20WL", "SOHMDIMDImag", "SOHMDIMDIint", "SOHEITEIT171", "SOHEITEIT284", "SOHEITEIT195"
		]);
		
		// current layers in above form
		currentLayers = $A([]);
		this.tileLayers().each(function (l) {
			currentLayers.push(l.observatory + l.instrument + l.detector + l.measurement);
		});
		
		// remove existing layers from queue
		currentLayers.each(function(id) {
			priorityQueue = priorityQueue.without(id);
		});
		
		p = priorityQueue.first() || defaultLayer;
        
        // Selected tiling server if distributed tiling is enabling
        if ((this.distributed === true) && ((this.numTileLayers() % 2) == 0)) {
            serverNum = 2;
            api = this.controller.tileServer2;
        } else {
            serverNum = 1;
            api = this.controller.tileServer1;
        }
		
		this.addLayer(new TileLayer(this.controller.viewport, {
            tileAPI: api,
            server:  serverNum,
            observatory: p.substr(0,3),
            instrument:  p.substr(3,3),
            detector:    p.substr(6,3),
            measurement: p.substr(9,3),
            startOpened: true
        }));
		this.refreshSavedTileLayers();
	},
	
	/**
	 * @description Gets the number of TileLayers currently loaded
	 * @return {Integer} Number of tile layers present.
	 */
	numTileLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "TileLayer") {
				n += 1;
			}
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
	 * @description Gets the number of event layers currently loaded
	 * @return {Integer} Number of event layers present.
	 */
	numEventLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "EventLayer") {
				n += 1;
			}
		});
				
		return n;
	},
	
	/**
	 * @description Removes a layer
	 * @param {Object} The layer to remove
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
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
        if (this.labels === true) {
            return "inline";
        }
        else {
            return "none";
        }
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
		//console.log("refreshSavedTileLayers");
		var tilelayers = [];
		
		this.tileLayers().each(function (layer) {
			var settings = {
				tileAPI     : layer.tileAPI,
                server      : layer.server,
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

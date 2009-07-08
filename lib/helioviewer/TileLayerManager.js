/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 * Syntax: Prototype
 * 
 */
/*global TileLayerManager, LayerManager, Class, Layer, Ajax, Event, $, Element, Image */
var TileLayerManager = Class.create(LayerManager,
    /** @lends TileLayerManager.prototype */
   {
   
   /**
    * @constructs
    * @description Creates a new TileLayerManager instance
    */
   initialize: function($super, controller) {
        $super(controller);
        this._layers = $A([]);
        this._queue  = $A([
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
		var currentLayers, next, layerSettings, queue, defaultLayer = "SOH_EIT_EIT_171";
		
        queue = this._queue;
        
		// current layers in above form
		currentLayers = $A([]);
		this._layers.each(function (l) {
			currentLayers.push(l.observatory + "," + l.instrument + "," + l.detector + "," + l.measurement);
		});
		
		// remove existing layers from queue
		currentLayers.each(function(id) {
			queue = queue.without(id);
		});
		
        // Pull off the next layer on the queue
		next = queue.first() || defaultLayer;
        layerSettings = this.controller.userSettings.parseLayerString(next + ",1,100");
        
        // Selected tiling server if distributed tiling is enabling
        if ((this.controller.distributed === true) && (this.size() === 0))
            layerSettings.server = this.controller.tileServer2;
        else
            layerSettings.server = this.controller.tileServer1;

        // Open menu by default
        layerSettings.startOpened = true;
		
        // Add the layer
		this.addLayer(new TileLayer(this.controller.viewport, layerSettings));
		this.save();
	},
    
    
	/**
	 * @description Returns the largest width and height of any layers (does not have to be from same layer)
	 * @returns {Object} The width and height of the largest layer
	 */
	getMaxDimensions: function () {
		var maxWidth  = 0,
			maxHeight = 0;
		
		this._layers.each(function (l) {
			if (l.type === "TileLayer") {
				// Ignore if the relative dimensions haven't been retrieved yet
				if (Object.isNumber(l.relWidth)) {
					maxWidth  = Math.max(maxWidth,  l.relWidth);
					maxHeight = Math.max(maxHeight, l.relHeight); 
				}
			}
		});
		
		return {width: maxWidth, height: maxHeight};
	}
});
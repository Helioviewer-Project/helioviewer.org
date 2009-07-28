/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 * 
 * Syntax: jQuery (x)
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
        this._layers = [];
        this._queue  = [
			"SOH,EIT,EIT,304",
            "SOH,LAS,0C2,0WL",
            "SOH,LAS,0C3,0WL",
            "SOH,LAS,0C2,0WL",
            "SOH,MDI,MDI,mag",
            "SOH,MDI,MDI,int",
            "SOH,EIT,EIT,171",
            "SOH,EIT,EIT,284",
            "SOH,EIT,EIT,195"
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
		var currentLayers, next, layerSettings, queue, defaultLayer = "SOH_EIT_EIT_171";
		
        queue = this._queue;
        
		// current layers in above form
		currentLayers = [];
		jQuery.each(this._layers, function () {
			currentLayers.push(this.observatory + "," + this.instrument + "," + this.detector + "," + this.measurement);
		});
		
		// remove existing layers from queue
        queue = jQuery.grep(queue, function (item, i) {
            return (jQuery.inArray(item, currentLayers) === -1);
        });
        
		//jQuery.each(currentLayers, function() {
		//	queue = queue.without(this);
		//});
		
        // Pull off the next layer on the queue
		next = queue[0] || defaultLayer;
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
		
		jQuery.each(this._layers, function () {
			if (this.type === "TileLayer") {
				// Ignore if the relative dimensions haven't been retrieved yet
				if (Object.isNumber(this.relWidth)) {
					maxWidth  = Math.max(maxWidth,  this.relWidth);
					maxHeight = Math.max(maxHeight, this.relHeight); 
				}
			}
		});
		
		return {width: maxWidth, height: maxHeight};
	},

	/**
	 * Gets the maximum relative width and height according to jp2 image sizes, not tilelayer sizes.
	 * Used when generating movies and screenshots
	 */
	getMaxJP2Dimensions: function () {
		var maxWidth = 0, maxHeight = 0, dimensions;
		jQuery.each(this._layers, function () {
			sizeOffset 	= this.width / this.relWidth;

			relWidth 	= this.jp2Width  / sizeOffset;
			relHeight 	= this.jp2Height / sizeOffset;
			
			maxWidth 	= Math.max(maxWidth, relWidth);
			maxHeight	= Math.max(maxHeight, relHeight);
		});
		
		dimensions = {
			width	: maxWidth,
			height	: maxHeight
		};
		return dimensions;
	},
	
    /**
     * @description Generate a string of URIs for use by JHelioviewer
     */
    toURIString: function () {
        var str = "";
        
        jQuery.each(this._layers, function () {
           str += this.uri + ",";
        });
        
        // Remove trailing comma
        str = str.slice(0,-1);
        
        return str;
    }    
});
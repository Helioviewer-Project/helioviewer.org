/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 * 
 */
/*global TileLayerManager, LayerManager, Class, Layer, $, Image */
var TileLayerManager = LayerManager.extend(
    /** @lends TileLayerManager.prototype */
   {
   
   /**
    * @constructs
    * @description Creates a new TileLayerManager instance
    */
   init: function(controller) {
        this._super(controller);
        this._layers = [];
        this._queue  = [
			"SOHO,EIT,EIT,304",
            "SOHO,LASCO,C2,white light",
            "SOHO,LASCO,C3,white light",
            "SOHO,LASCO,C2,white light",
            "SOHO,MDI,MDI,magnetogram",
            "SOHO,MDI,MDI,continuum",
            "SOHO,EIT,EIT,171",
            "SOHO,EIT,EIT,284",
            "SOHO,EIT,EIT,195"
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
		var currentLayers, next, layerSettings, queue, defaultLayer = "SOHO,EIT,EIT,171";
		
        queue = this._queue;
        
		// current layers in above form
		currentLayers = [];
		$.each(this._layers, function () {
			currentLayers.push(this.observatory + "," + this.instrument + "," + this.detector + "," + this.measurement);
		});
		
		// remove existing layers from queue
        queue = $.grep(queue, function (item, i) {
            return ($.inArray(item, currentLayers) === -1);
        });
        
		//$.each(currentLayers, function() {
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
		this.addLayer(new TileLayer(this.controller, layerSettings));
		this.save();
	},
     
	/**
	 * @description Returns the largest width and height of any layers (does not have to be from same layer)
	 * @return {Object} The width and height of the largest layer
	 */
	getMaxDimensions: function () {
		var maxWidth  = 0,
			maxHeight = 0;
		
		$.each(this._layers, function () {
			if (this.type === "TileLayer") {
				// Ignore if the relative dimensions haven't been retrieved yet
				if ($.isNumber(this.relWidth)) {
					maxWidth  = Math.max(maxWidth,  this.relWidth);
					maxHeight = Math.max(maxHeight, this.relHeight); 
				}
			}
		});
		
		return {width: maxWidth, height: maxHeight};
	},

	/**
	 * @description Gets the maximum relative width and height of all visible layers, according to jp2 image sizes, not tilelayer sizes.
	 * 				Used when generating movies and screenshots, because tilelayer size is slightly smaller than jp2 image size and 
	 * 				images will not align properly with tilelayer sizes.
	 * @return {Array} dimensions -- maximum width and height found.
	 */
	getMaxJP2Dimensions: function (left, top, width, height) {
		var maxWidth = 0, maxHeight = 0, dimensions;
		$.each(this._layers, function () {
			if (this.visible) {
				if (this.detector.toString === "C2" && this.insideCircle(216, this.width / 2, left, top, width, height)) {
					; // Do nothing
				}
				if (this.detector.toString === "C3" && this.insideCircle(104, this.width / 2, left, top, width, height)) {
					; // Do nothing
				}
				
				else {
					sizeOffset = this.width / this.relWidth;
					
					relWidth  = this.width  / sizeOffset;
					relHeight = this.height / sizeOffset;
					
					maxWidth = Math.max(maxWidth, relWidth);
					maxHeight = Math.max(maxHeight, relHeight);
				}
			}
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
        
        $.each(this._layers, function () {
           str += this.uri + ",";
        });
        
        // Remove trailing comma
        str = str.slice(0,-1);
        
        return str;
    }    
});
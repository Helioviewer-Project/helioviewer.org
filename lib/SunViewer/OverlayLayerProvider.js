/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */
 
/**
 * @class OverlayLayerProvider This class enables to show any HTML elements as overlays on the
 * image. The position is given in world-coordinates and a pixel offset.
 * @see Overlay
 * @see OverlayCollection
 */
var OverlayLayerProvider = Class.create();

OverlayLayerProvider.prototype = Object.extend(new TileLayerProvider(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, opacity (0<=x<=1)
	 */
	initialize: function(tileContainer, options) {

		if (tileContainer) {
			Object.extend(this, this.defaultOptions.toObject());
			Object.extend(this, options);

            this.className = "OverlayLayerProvider";
			this.type = 'OverlayLayerProvider';
			this.tileContainer = tileContainer;
			//this.zIndex = 1000 + tileContainer.numOverlayLayerProviders++;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;

			this.observe(tileContainer, 'AddTileLayer');
			this.tileContainer.tileLayerProviders.add(this);

			this.layerCache = new DomNodeCache();
			
			this.overlays = new OverlayCollection();
			this.observe(this.overlays, 'NewOverlay');
		}
	},
	
	/**
	 * @method createTileLayer		Create the layer for the given tile.
	 * @param {Tile} tile			The tile for which to create the layer.
	 * @return {DIV HTML Element}	The resulting layer.
	 */
	createTileLayer: function(tile) {
	    /* Old way...
		var zoomOffset = GLOBAL_zoomOffset;
		var zoomLevel  = GLOBAL_zoomLevel;
		var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, zoomLevel + zoomOffset - 1);
		var xIndex = tile.xIndex - Math.floor(tileIndexOffset);
		var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
		var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
		var tileOffset = this.tileContainer.tileSize * decimals;
		*/
		//Debug.output("=== createTileLayer ===");
		
		//Same as TileLayerProvider.create(); .. eventually want to use that function to reduce redundancy.
		if (this.sunImage.instrument == "EIT")
			{
				// Anything this zoom level or "higher" is only one square thus no offset is needed.
				if (GLOBAL_zoomLevel >= 12)
				{
					var tileIndexOffset = 0;
				}
				else if (GLOBAL_zoomLevel == 11)
				{
					var tileIndexOffset = -0.5;
				}
				else if (GLOBAL_zoomLevel < 11)
				{
					var tileIndexOffset = 0.5;
					for (Counter = 11; Counter >= 0; Counter--)
					{
						tileIndexOffset = tileIndexOffset - 1;
						if (Counter == GLOBAL_zoomLevel)
						{
							break;
						}
					}
					
				}
		}
		if (this.sunImage.instrument == "LAS")
		{
			// Anything this zoom level or "higher" is only one square thus no offset is needed.
			if (GLOBAL_zoomLevel >= 15)
				{
					var tileIndexOffset = 0;
				}
				else if (GLOBAL_zoomLevel == 14)
				{
					var tileIndexOffset = -0.5;
				}
				else if (GLOBAL_zoomLevel < 14)
				{
					var tileIndexOffset = 0.5;
					for (Counter = 13; Counter >= 0; Counter--)
					{
						tileIndexOffset = tileIndexOffset - 2;
						if (Counter == GLOBAL_zoomLevel)
						{
							break;
						}
					}
					
				}
		}
        var xIndex = tile.xIndex - Math.floor(tileIndexOffset); 	
        var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
        var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
		var tileOffset = this.tileContainer.tileSize * decimals;
		
		// Create the overlay layer for the tile (HOLDS MARKERS)
		var tileLayer = new Element('div').setStyle({
			position: 'absolute',
			left: '0px',
			top: '0px',
			width: '100%',
			height: '100%',
			color: '#FFFFFF',
			visibility: 'hidden',
			//'font-size': Math.round(16 * (zoomLevel - zoomOffset < 0 ? Math.pow(2, zoomLevel + zoomOffset) : 1)) + 'px',
			zIndex: this.zIndex
		});

		// Get the overlays on this tile
		var tileOverlays = this.overlays.getOverlays(xIndex, yIndex, (12 - GLOBAL_zoomLevel));
		
		//Debug.output("overlays.getOverlays(xIndex= " + xIndex + ", yIndex= " + yIndex + ", zoomLevel= " + (12 - GLOBAL_zoomLevel) +");");

		// Closure
		var self = this;

		// Append each overlay
		tileOverlays.each(function(overlay) {
			// Calculate pixel position on the tile
			// 03/27/08 ... Changed from 2^zoomLevel to 2 ^ (12-zoomLevel).... instead of 12 though, want to use the STARTING ZOOM LEVEL and based all calculations off the offset relative to it..
			var x = (Math.pow(2, (12 - GLOBAL_zoomLevel)) * overlay.position.x - xIndex) * self.tileContainer.tileSize + tileOffset;
			var y = (Math.pow(2, (12 - GLOBAL_zoomLevel)) * overlay.position.y - yIndex) * self.tileContainer.tileSize + tileOffset;
			
			// Append the overlay
			overlay.appendTo(tileLayer, x, y);

			// Register the listener for the show info event (remove old one first)
			overlay.removeListeners('ShowInfo');
			self.observe(overlay, 'ShowInfo');
		});

		return tileLayer;
	},

	/**
	 * Event handler: This handler is called by (asynchronous) methods that create new 
	 * overlays when the page has already loaded.
	 * @param {Overlay} overlay The new overlay.
	 * @see OverlayCollection.createOverlay()
	 */
	 //CALLED TO ADD NEW MARKERS TO THE SCREEN
	onNewOverlay: function(overlay) {
		if (!overlay.sunImage.date || overlay.sunImage == this.sunImage) {
		    var zoomLevel  = GLOBAL_zoomLevel;
		    
		    var tileIndexOffset = (Math.pow(2, -zoomLevel) - 1) * Math.pow(2, zoomLevel - 1);
		    var xIndex = Math.floor(overlay.position.x) - Math.floor(tileIndexOffset);
		    var yIndex = Math.floor(overlay.position.y) - Math.floor(tileIndexOffset);
		    
			var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
			var tileOffset = this.tileContainer.tileSize * decimals;

            //Debug.output("onNewOverlay()... zoomLevel: " + zoomLevel + ", xIndex: " + xIndex + ", yIndex: " + yIndex);

			if (this.layerCache.contains(zoomLevel, xIndex, yIndex)) {
				var x = ((1 << (12-zoomLevel)) * overlay.position.x - 0.5) * this.tileContainer.tileSize + tileOffset;
				var y = ((1 << (12-zoomLevel)) * overlay.position.y - 0.5) * this.tileContainer.tileSize + tileOffset;
				
				var layer = this.layerCache.get(zoomLevel, xIndex, yIndex);
				
			     //Debug.output("onNewOverlay()... add new overlay to layer.. x= " + x + ", y= " + y);
	
				 // Add new overlay to layer
				overlay.appendTo(layer, x, y);
				overlay.removeListeners('ShowInfo');
				this.observe(overlay, 'ShowInfo');
			}
		}
	},
	
	/**
	 * Event handler: Show info associated with an overlay.
	 * @param {Hash} properties		Hash containing: html, layer, position (x,y)
	 */
	onShowInfo: function(properties) {
		this.notifyListeners('ShowInfo', properties);
	},
	
	/**
	 * Event handler: image change
	 * @param {SunImage} sunImage
	 */
	//onImageChange: function(type, args) {
	onImageChange: function (sunImage) {
		//only fire event if it is related to a Layer Provider
        Debug.output("OLP:onImageChange();");
		if (this.id) {
    		//sunImage = args[0];
    		this.overlays.clear();
    		this.setSunImage(sunImage);
    		this.layerCache.clear();
    		this.tileContainer.reloadTileLayer(this);
    		this.notifyListeners('ImageChange', sunImage);
    	}
	}
});
 
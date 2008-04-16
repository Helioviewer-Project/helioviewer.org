/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class TileLayerProvider Base tile layer provider class. Important methods are
 * addTileLayerCached(), the get/set methods and removeFromTileContainer().
 * Currently used for image tiles.
 * Extend this class and override createTileLayer and, if needed, other methods
 * for other tile layer providers.
 */
 /*global document, Class, $, $A, $H, Element, Event, Effect, Debug, TileLayerProvider, SunViewerWidget, DomNodeCache, OverlayCollection, GLOBAL_zoomLevel, GLOBAL_zoomOffset, numberOfTileLayers, numberOfMarkerLayers, AjaxRequestWrapper, Option */
var TileLayerProvider = Class.create();

TileLayerProvider.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
		prefix: '',
		extension: 'jpg',
		loadingTileImage: 'images/icons/progress.gif',
		//noImageAvailableMessage: 'No image available for this zoom level',
		noImageAvailableMessage: '',
		zoomOffset: 16, //not used anymore..
		opacity: 1
	}),
	
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, zoomOffset, opacity (0<=x<=1)
	 */
	initialize: function (tileContainer, options) {
		// If this is a real instance, it has parameters.
		// If used for inheritance, it doesn't have them. In this case the reference
		// properties MUST NOT be set, as they will be added to the prototype 
		// of the inheriting object, which means all instances thereof will share the 
		// same instance of this property!
		// This is somewhat crude. Better inheritance schemes would be helpful.
		
		// Use a cache to store the layers for each tiles and zoom level		
		
		if (tileContainer) {
		    Object.extend(this, this.defaultOptions.toObject());
		    Object.extend(this, options);
		    
			this.type = 'TileLayerProvider';
			this.tileContainer = tileContainer;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;
			this.observe(tileContainer, 'AddTileLayer');
		    document.sunImageChange.subscribe(this.onImageChange, this, true);
		    document.zoomLevelChange.subscribe(this.onZoomLevelChange, this, true);
		    this.layerCache = new DomNodeCache();
			this.tileContainer.tileLayerProviders.add(this);
		}
    },

	/**
	 * @function assembleFileName	Create a file name from the parameters. This should be replaced by a database query.
	 * @param {Number} xIndex		The x index of the tile.
	 * @param {Number} yIndex		The y index of the tile.
	 * @param {Number} zoomLevel	The zoom level.
	 * @return {String}				The file name of the tile.
	 */
	assembleFileName: function (xIndex, yIndex, zoomLevel) {
		var StringX = xIndex.toString();
		if (StringX.length === 1) {
			StringX = "0" + StringX;
		}
	    var StringY = yIndex.toString();
		if (StringY.length === 1) {
			StringY = "0" + StringY;
		}
		var StringZoomLevel = GLOBAL_zoomLevel.toString();
		if (StringZoomLevel.length === 1) {
			StringZoomLevel = "0" + StringZoomLevel;
		}
		if (xIndex === 0 && yIndex === 0)	{
            var OffsetString;
			if (this.sunImage.instrument === "EIT") {
                if (GLOBAL_zoomLevel === 10 || GLOBAL_zoomLevel === 11 || GLOBAL_zoomLevel === 12) {
				    OffsetString = "n001.404-p001.404";
				}
				else if (GLOBAL_zoomLevel === 13) {
				    OffsetString = "n002.807-p002.807";
				}
				else if (GLOBAL_zoomLevel === 14) {
					OffsetString = "n005.615-p005.615";
				}
				else if (GLOBAL_zoomLevel === 15) {
					OffsetString = "n011.229-p011.229";
				}
				else if (GLOBAL_zoomLevel === 16) {
					OffsetString = "n022.459-p022.459";
				}
				else if (GLOBAL_zoomLevel === 17) {
					OffsetString = "n044.918-p044.918";
				}
				else if (GLOBAL_zoomLevel === 18) {
					OffsetString = "n089.835-p089.835";
				}
				else if (GLOBAL_zoomLevel === 19) {
					OffsetString = "n179.670-p179.670";
				}
				else if (GLOBAL_zoomLevel === 20) {
					OffsetString = "n359.341-p359.341";
				}
			}
			else if (this.sunImage.instrument === "LAS") {
				if (GLOBAL_zoomLevel === 12 || GLOBAL_zoomLevel === 13 || GLOBAL_zoomLevel === 14 || GLOBAL_zoomLevel === 15) {
					OffsetString = "n011.229-p011.229";
				}
				else if (GLOBAL_zoomLevel === 16) {
					OffsetString = "n022.459-p022.459";
				}
				else if (GLOBAL_zoomLevel === 17) {
					OffsetString = "n044.918-p044.918";
				}
				else if (GLOBAL_zoomLevel === 18) {
					OffsetString = "n089.835-p089.835";
				}
				else if (GLOBAL_zoomLevel === 19) {
					OffsetString = "n179.670-p179.670";
				}
				else if (GLOBAL_zoomLevel === 20) {
					OffsetString = "n359.341-p359.341";
				}
			}
			return (this.sunImage.tileDir
    			+ "/" + this.sunImage.date.year
    			+ "/" + this.sunImage.date.month
    			+ "/" + this.sunImage.date.day
    			+ "/" + this.sunImage.date.hour
    			+ "/" + this.sunImage.observatory
    			+ "/" + this.sunImage.instrument
    			+ "/" + this.sunImage.detector
    			+ "/" + this.sunImage.measurement
    			+ "/" + this.sunImage.date.year
    			+ "_" + this.sunImage.date.month
    			+ "_" + this.sunImage.date.day
    			+ "_" + this.sunImage.date.hour + this.sunImage.date.min + this.sunImage.date.sec
    			+ "_" + this.sunImage.observatory
    			+ "_" + this.sunImage.instrument
    			+ "_" + this.sunImage.detector
    			+ "_" + this.sunImage.measurement
    			+ '-' + StringZoomLevel
    			+ '-' + StringX
    			+ '-' + StringY
    			//+ "-C-n011.229-p011.229"
    			+ '-C-' + OffsetString
    			+ '.' + this.extension);
		}
		else {
		    return this.sunImage.tileDir
			+ "/" + this.sunImage.date.year
			+ "/" + this.sunImage.date.month
			+ "/" + this.sunImage.date.day
			+ "/" + this.sunImage.date.hour
			+ "/" + this.sunImage.observatory
			+ "/" + this.sunImage.instrument
			+ "/" + this.sunImage.detector
			+ "/" + this.sunImage.measurement
			+ "/" + this.sunImage.date.year
			+ "_" + this.sunImage.date.month
			+ "_" + this.sunImage.date.day
			+ "_" + this.sunImage.date.hour + this.sunImage.date.min + this.sunImage.date.sec
			+ "_" + this.sunImage.observatory
			+ "_" + this.sunImage.instrument
			+ "_" + this.sunImage.detector
			+ "_" + this.sunImage.measurement
			+ '-' + StringZoomLevel
			+ '-' + StringX
			+ '-' + StringY
			+ '-C'
			+ '.' + this.extension;
		}
	},

	/**
	 * @method createTileLayer		Create the layer for the given tile.
	 * @param {Tile} tile			The tile for which to create the layer.
	 * @return {DIV HTML Element}	The resulting layer.
	 */
	createTileLayer: function (tile) {
		//Debug.output("Create tile layer");
		var zoomOffset =      GLOBAL_zoomOffset;
		var Counter =         null;
		var tileIndexOffset = null;
		
		// The zoom level taking into account the zoom offset
		var zoomLevel = GLOBAL_zoomLevel + GLOBAL_zoomOffset;
		
		// The x and y index taking into account the zoom offset
		//var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, zoomLevel - 1);
		//var xIndex = tile.xIndex; //- Math.floor(tileIndexOffset);
		//var yIndex = tile.yIndex; //- Math.floor(tileIndexOffset);

        if (this.sunImage.instrument === "EIT")	{
			// Anything this zoom level or "higher" is only one square thus no offset is needed.
			if (GLOBAL_zoomLevel >= 12) {
				tileIndexOffset = 0;
			}
			else if (GLOBAL_zoomLevel === 11) {
				tileIndexOffset = -0.5;
			}
			else if (GLOBAL_zoomLevel < 11) {
				tileIndexOffset = 0.5;
				for (Counter = 11; Counter >= 0; Counter--)	{
					tileIndexOffset = tileIndexOffset - 1;
					if (Counter === GLOBAL_zoomLevel) {
						break;
					}
				}
				
			}
		}
		if (this.sunImage.instrument === "LAS") {
			// Anything this zoom level or "higher" is only one square thus no offset is needed.
			if (GLOBAL_zoomLevel >= 15)	{
				tileIndexOffset = 0;
			}
			else if (GLOBAL_zoomLevel === 14) {
				tileIndexOffset = -0.5;
			}
			else if (GLOBAL_zoomLevel < 14) {
				tileIndexOffset = 0.5;
				for (Counter = 13; Counter >= 0; Counter--) {
					tileIndexOffset = tileIndexOffset - 2;
					if (Counter === GLOBAL_zoomLevel) {
						break;
					}
				}
			}
		}
        var xIndex = tile.xIndex - Math.floor(tileIndexOffset); 	
        var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
		var nxnTiles;
		
		// The number of tiles along one row/col
		if (this.sunImage.instrument === "EIT") {
			if (GLOBAL_zoomLevel >= 12) {
				nxnTiles = 1;
			}
			nxnTiles = Math.pow(2, 12 - GLOBAL_zoomLevel);
		}
		if (this.sunImage.instrument === "LAS" && this.sunImage.detector === "0C2") {
			if (GLOBAL_zoomLevel >= 15) {
				nxnTiles = 1;
			}
			nxnTiles = Math.pow(2, 15 - GLOBAL_zoomLevel);
		}
		if (this.sunImage.instrument === "LAS" && this.sunImage.detector === "0C3") {
			if (GLOBAL_zoomLevel >= 17) {
				nxnTiles = 1;
			}
			nxnTiles = Math.pow(2, 17 - GLOBAL_zoomLevel);
		}

		// Create the layer HTML element
		var layer = new Element('div', {'class': 'tile'});
		layer.setStyle({ 'zIndex': this.zIndex });

		// Check if tile is in bounds
		if (xIndex >= 0
		 && xIndex < nxnTiles
		 && yIndex >= 0
		 && yIndex < nxnTiles) {
			if (this.opacity < 1) {
				layer.setStyle({
					opacity: this.opacity,
					'-moz-opacity': this.opacity,
					'filter': 'alpha(Opacity=' + Math.round(this.opacity * 100) + ')'
				});	
			}
			
			// Create a loading image to be replaced by the real image when that has loaded
			// var loading = new Element('img', {'class': 'tile', 'src': this.loadingTileImage});
			// loading.setStyle({ 'zIndex': this.zIndex });
			// layer.appendChild(loading);
			
			// Create a "protection layer" to prevent selection on the layer (selection
			// highlighting while dragging looks strange)
			// TODO: See if this behaviour can be avoided with Event.stop()
			var protectionLayer = new Element('div', {'class': 'tile'});
			protectionLayer.setStyle({ width: '100%', height: '100%' });
			layer.appendChild(protectionLayer);
	
			// Create the real image
			var image = new Element('img');
			var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
			var tileOffset = this.tileContainer.tileSize * decimals;
			var tileSize = this.tileContainer.tileSize * (GLOBAL_zoomLevel < 0 ? Math.pow(2, GLOBAL_zoomLevel) : 1);
			
			// Initialize offsets
			var TopOffset =  null;
			var LeftOffset = null;
			if (this.sunImage.instrument === "LAS" && this.sunImage.detector === "0C2") {
				if (GLOBAL_zoomLevel === 12) {
					//Debug.output(12);
					TopOffset = 9;
					LeftOffset = -2;
				}
				if (GLOBAL_zoomLevel === 13)	{
					//Debug.output(13);
					TopOffset = 5;
					LeftOffset = -1;
				}
				if (GLOBAL_zoomLevel === 14)	{
					//Debug.output(14);
					TopOffset = 3;
					LeftOffset = 0;
				}
			}
			else {
				TopOffset = 0;
				LeftOffset = 0;
			}
			image.setStyle({
				zIndex: this.zIndex,
				position: 'absolute',
				top: tileOffset + TopOffset + 'px',
				left: tileOffset + LeftOffset + 'px'
			});

			image.width = tileSize;
			image.height = tileSize;
			
			// Closures
			var self = this;

            Debug.loadingIndicator.loadingStarted(image.src);
            
    		// Image event handlers
			// The image loaded correctly
			var onload = function () {
                Debug.loadingIndicator.loadingFinished(image.src);
				
				// Replace the loading image with the real image
				// loading.parentNode.replaceChild(image, loading);
				layer.appendChild(image);
				image.onload = function () {};
				image.onmousedown = function () {
				    return false;
				};
				image = null;
				loading = null;
			};

			// The image file is not available
			var onerror = function () {
                Debug.loadingIndicator.loadingFinished(image.src);
				var div = new Element('div', {'class': 'noImageAvailable'}).update(self.noImageAvailableMessage);
				
				// Replace the loading image with an error message
				loading.parentNode.replaceChild(div, loading);
				image.onerror = function () { };	
				image = null;
				loading = null;
			};
			
			// The loading was aborted
			var onabort = function () {
                Debug.loadingIndicator.loadingFinished(image.src);
				image = null;
				loading = null;
			};

			image.observe('load', onload);
			image.observe('error', onerror);
			image.observe('abort', onabort);
			
			//Image source must be set AFTER event handlers have been defined to avoid
            //running into caching issues in Opera and IE
			image.src = this.assembleFileName(xIndex, yIndex, Math.max(0, GLOBAL_zoomLevel));
			//Debug.output("image.src: " + image.src);
		}
		return layer;
	},
	
	/**
	 * @method addTileLayerCached	Adds the layer to the given tile.
	 * @param {Tile} tile			The tile.
	 */
	addTileLayerCached: function (tile) {
		var zoomOffset = GLOBAL_zoomOffset;
		var zoomLevel = tile.tileContainer.viewport.zoomLevel;
		var tileIndexOffset = (Math.pow(2, -GLOBAL_zoomLevel) - 1) * Math.pow(2, GLOBAL_zoomOffset + GLOBAL_zoomLevel - 1);
		var xIndex = tile.xIndex - Math.floor(tileIndexOffset);
		var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
		var layer;

		// if layer is already in cache
	    if (this.layerCache.contains(GLOBAL_zoomLevel, xIndex, yIndex)) {
            //Debug.output("TLP:addTileLayerCached... zoom: " + GLOBAL_zoomLevel + ", xIndex: " + xIndex + ", yIndex: " + yIndex + "(CACHED)");
			// use cached version
			layer = this.layerCache.get(GLOBAL_zoomLevel, xIndex, yIndex);
        }
        else {
			// create new layer
            //Debug.output("TLP:addTileLayerCached... zoom: " + GLOBAL_zoomLevel + ", xIndex: " + xIndex + ", yIndex: " + yIndex + "(NOT cached)");
			layer = this.createTileLayer(tile);
			// add it to the cache
			this.layerCache.add(layer, GLOBAL_zoomLevel, xIndex, yIndex);
		}

		// if this tile has a dom node for this layer
		if (tile.layers[this.id] && tile.layers[this.id].parentNode) {
			// replace it
			var existingNode = tile.layers[this.id];
			existingNode.parentNode.replaceChild(layer, existingNode);
			tile.layers[this.id] = layer;
		} else {
			// append the layer
			tile.layers[this.id] = tile.domNode.appendChild(layer);
		}
			
		return this;
	},
	
	/**
	 * @method getFullSize	Returns the full size of the image at the current zoom level with the zoom offset for this layer provider.
	 * @return {Number}		The size.
	 */
	getFullSize: function () {
		return this.tileContainer.tileSize * Math.pow(2, GLOBAL_zoomLevel + GLOBAL_zoomOffset);
	},

	/**
	 * @method setSunImage			Sets the SunImage of this layer provider.
	 * @param {SunImage} sunImage	The SunImage.
	 */		
	setSunImage: function (sunImage) {
	    //Debug.output("[TLP:setSunImage(" + sunImage + ");]");
		this.sunImage = sunImage;
	},
	
	/**
	 * @method setOpacity			Sets the opacity for all layers in the cache (also the visible ones!)
	 * @param {Number} opacity		The new opacity (0<=x<=1).
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;

		// For max browser compatibility
		this.layerCache.setStyle({
			opacity: opacity,
			'-moz-opacity': opacity,
			'filter': 'alpha(Opacity=' + Math.round(opacity * 100) + ')'
		});
	},
	onZoomLevelChange: function (type, args, oObj) {
	    var newZoomLevel = args[0];	   
	    this.setZoomOffset(newZoomLevel);
	},
	
	/**
	 * @function  setZoomOffset		Sets the zoom offset for this layer provider. Will be added to the current zoom level.
	 * @param {Number} zoomOffset	The zoom offset.
	 */
	setZoomOffset: function (zoomOffset) {
		//Debug.output("TileLayerProvider:427 -> setzoomoffset layers. zoomOffset = " + zoomOffset);
		if (!isFinite(zoomOffset)) {
		    return;
		}
		this.zoomOffset = zoomOffset; //Probably not necessary with a global offset...
		this.layerCache.clear();
		if (numberOfTileLayers > 0)	{
			this.tileContainer.reloadTileLayer(this);
		} // NOTE TO SELF: COME BACK TO THIS
	},
	
	/**
	 * @function removeFromTileContainer	Removes all elements of this layer from the tile container
	 * 									    and stops adding new ones.
	 */
	removeFromTileContainer: function () {
		this.layerCache.removeAndClear();
		//this.layerCache = null;
		
		// This had to be added because of certain cases when a layer would be removed but it would still appear after zooming.
		document.zoomLevelChange.unsubscribe(this.onZoomLevelChange, this);
		
		this.stopObserving(this.tileContainer, 'AddTileLayer');
		// TODO: remove this image from the viewport's active images
		//this.tileContainer.viewport.activeImages.remove(this.sunImage);
		this.tileContainer.tileLayerProviders.remove(this);
	},

	/**
	 * @method toggleVisible	Shows or hides this layer.
	 * @param {Boolean} visible	Whether this layer is visible.
	 */
	toggleVisible: function (visible) {
	    this.layerCache.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
	},
	
	/**
	 * @method setStyle		Sets CSS style properties on all elements of this layer.
	 * @param {Hash} style	A Hash containing the css property/value pairs.
	 */
	setStyle: function (style) {
		this.layerCache.setStyle(style);
	},
	
	/**
	 * @method isTop		Returns true if this layer is the top layer.
	 * @return {Boolean}	Whether this layer is the top layer.
	 */
	isTop: function () {
		return this.zIndex === this.tileContainer.tileLayerProviders.topZindex();
	},
	
	/**
	 * @method isBottom		Returns true if this layer is the bottom layer.
	 * @return {Boolean}	Whether this layer is the bottom layer.
	 */
	isBottom: function () {
		return this.zIndex === this.tileContainer.tileLayerProviders.bottomZindex();
	},

	next: function () {
		return this.tileContainer.tileLayerProviders.next(this);
	},
	
	previous: function () {
		return this.tileContainer.tileLayerProviders.previous(this);
	},

	moveUp: function () {
		if (this.isTop()) {
		    return this;
		}
		var nextLayer = this.next();
		this.tileContainer.tileLayerProviders.exchange(this, nextLayer);
		document.layerExchange.fire([this, nextLayer]);
		return this;
	},
	
	moveDown: function () {
		if (this.isBottom()) {
		    return this;
		}
		var previousLayer = this.previous();
		this.tileContainer.tileLayerProviders.exchange(this, previousLayer);
		document.layerExchange.fire([this, previousLayer]);
		return this;	
	},
	
	/**
	 * Event handler: Add a tile layer to this tile (not really an "event" but works the same way)
	 * @param {Tile} tile	The tile to add the layer to.
	 */
	onAddTileLayer: function (tile) {
	    //Debug.output("TLP:onAddTileLayer();");
		this.addTileLayerCached(tile);
	},

	/**
	 * Event handler: Image change.
	 * The cache needs to be cleared, and all visible layer elements reloaded.
	 * @param {SunImage} sunImage	The new sunImage.
	 */	
	onImageChange: function (type, args) {
	//onImageChange: function(sunImage) {
/*
		TODO: change the registered image in this.tileContainer.viewport.activeImages
		if (this.sunImage) {
			this.tileContainer.viewport.activeImages.replace(this.sunImage, sunImage);
		} else {
			this.tileContainer.viewport.activeImages.add(sunImage);
		}
*/
        //Debug.output("TLP:onImageChange()");
        var sunImage = args[0];
		this.setSunImage(sunImage);
		this.layerCache.clear();
		this.tileContainer.reloadTileLayer(this);
	},
	
	/**
	 * Event handler: Zoom offset change.
	 * @param {Number} zoomOffset	The new zoom offset.
	 */
	onZoomOffsetChange: function (type, args) {
		//Debug.output("layers.js:403 -> onzoomoffsetchange layers");
		var zoomOffset = args[0];
		this.setZoomOffset(parseInt(zoomOffset, 10));
	}
});

/*
TODO: It probably would be better if there was a subclass of TileLayerProvider for the
image tiles.

var ImageLayerProvider = Class.create();

ImageLayerProvider.prototype = Object.extend(new TileLayerProvider(), {
	addTileLayerCached: function(tile) {

	}
});
*/

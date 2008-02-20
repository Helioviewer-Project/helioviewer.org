/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Base tile layer provider class. Important methods are
 * addTileLayerCached(), the get/set methods and removeFromTileContainer().
 * Currently used for image tiles.
 * Extend this class and override createTileLayer and, if needed, other methods
 * for other tile layer providers.
 */
var TileLayerProvider = Class.create();

TileLayerProvider.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
		prefix: '',
		extension: 'gif',
		loadingTileImage: 'images/icons/progress.gif',
		noImageAvailableMessage: 'No image available for this zoom level',
		zoomOffset: 0,
		opacity: 1
	}),
	
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, zoomOffset, opacity (0<=x<=1)
	 */
	initialize: function(tileContainer, options) {
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);

		// If this is a real instance, it has parameters.
		// If used for inheritance, it doesn't have them. In this case the reference
		// properties MUST NOT be set, as they will be added to the prototype 
		// of the inheriting object, which means all instances thereof will share the 
		// same instance of this property!
		// This is somewhat crude. Better inheritance schemes would be helpful.
		if (tileContainer) {
			this.type = 'TileLayerProvider';
			this.tileContainer = tileContainer;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;
			this.observe(tileContainer, 'AddTileLayer');
			this.tileContainer.tileLayerProviders.add(this);
		}
		
		// Use a cache to store the layers for each tiles and zoom level		
		this.layerCache = new DomNodeCache();
	},

	/**
	 * @method assembleFileName		Create a file name from the parameters. This should be replaced
	 * 								by a database query.
	 * @param {Number} xIndex		The x index of the tile.
	 * @param {Number} yIndex		The y index of the tile.
	 * @param {Number} zoomLevel	The zoom level.
	 * @return {String}				The file name of the tile.
	 */
	assembleFileName: function(xIndex, yIndex, zoomLevel) {
		StringX = xIndex.toString();
			if (StringX.length == 1)
			{
				StringX = "0" + StringX;
			}
	    StringY = yIndex.toString();
			if (StringY.length == 1)
			{
				StringY = "0" + StringY;
			}
		StringZoomLevel = zoomLevel.toString();
			if (StringZoomLevel.length == 1)
			{
				StringZoomLevel = "0" + StringZoomLevel;
			}
		return this.sunImage.tileDir + '-' + this.prefix + StringZoomLevel + '-' + StringX + '-' + StringY + '.' + this.extension;
	},

	/**
	 * @method createTileLayer		Create the layer for the given tile.
	 * @param {Tile} tile			The tile for which to create the layer.
	 * @return {DIV HTML Element}	The resulting layer.
	 */
	createTileLayer: function(tile) {
		//Debug.output("Create tile layer");
		var zoomOffset = this.zoomOffset;
		
		// The zoom level taking into account the zoom offset
		var zoomLevel = tile.tileContainer.viewport.zoomLevel + zoomOffset;
		
		// The x and y index taking into account the zoom offset
		var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, zoomLevel - 1);
		var xIndex = tile.xIndex; //- Math.floor(tileIndexOffset);
		var yIndex = tile.yIndex; //- Math.floor(tileIndexOffset);
		
		
		// The number of tiles along one row/col
		var nxnTiles = Math.pow(2, zoomLevel);

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
			var loading = new Element('img', {'class': 'tile', 'src':this.loadingTileImage});
			loading.setStyle({ 'zIndex': this.zIndex });
			layer.appendChild(loading);
			
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
			var tileSize = this.tileContainer.tileSize * (zoomLevel < 0 ? Math.pow(2, zoomLevel) : 1);
			image.setStyle({
				zIndex: this.zIndex,
				position: 'absolute',
				top: tileOffset + 'px',
				left: tileOffset + 'px'
			});

			image.width = tileSize;
			image.height = tileSize;
			
			// Closures
			var self = this;

            Debug.loadingIndicator.loadingStarted(image.src);

			// Image event handlers
			// The image loaded correctly
			var onload = function() {
            Debug.loadingIndicator.loadingFinished(image.src);
				
				// Replace the loading image with the real image
				loading.parentNode.replaceChild(image, loading);
				image.onload = function() { };
				image.onmousedown = function() { return false; };
				image = null;
				loading = null;
			}

			// The image file is not available
			var onerror = function() {
            //Debug.loadingIndicator.loadingFinished(image.src);
				var div = new Element('div', {'class': 'noImageAvailable'}).update(self.noImageAvailableMessage);
				
				// Replace the loading image with an error message
				loading.parentNode.replaceChild(div, loading);
				image.onerror = function() { };	
				image = null;
				loading = null;
			}
			
			// The loading was aborted
			var onabort = function() {
            //Debug.loadingIndicator.loadingFinished(image.src);
				image = null;
				loading = null;
			}

            //Image source must be set AFTER event handlers have been defined to avoid
            //running into caching issues in Opera and IE
			image.src = this.assembleFileName(xIndex, yIndex, Math.max(0, zoomLevel));

			//Event.observe(image, 'load', onload);
			//Event.observe(image, 'error', onerror);
			//Event.observe(image, 'abort', onabort);
			image.observe ('load', onload);
			image.observe ('error', onerror);
			image.observe ('abort', onabort);
		}
		return layer;
	},
	
	/**
	 * @method addTileLayerCached	Adds the layer to the given tile.
	 * @param {Tile} tile			The tile.
	 */
	addTileLayerCached: function(tile) {
		//Debug.output("layers.js: 200 -> addTileLayer layers");
		var zoomOffset = this.zoomOffset;
		var zoomLevel = tile.tileContainer.viewport.zoomLevel;
		var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, tile.tileContainer.viewport.zoomLevel + zoomOffset - 1);
		var xIndex = tile.xIndex - Math.floor(tileIndexOffset);
		var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
		var layer;

		// if layer is already in cache
		if (this.layerCache.contains(zoomLevel, xIndex, yIndex)) {
			// use cached version
			layer = this.layerCache.get(zoomLevel, xIndex, yIndex);
		} else {
			// create new layer
			layer = this.createTileLayer(tile);
			// add it to the cache
			this.layerCache.add(layer, zoomLevel, xIndex, yIndex);
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
	getFullSize: function() {
		//Debug.output("layers.js:238 -> getFullSize layers");
		return this.tileContainer.tileSize * Math.pow(2, this.tileContainer.viewport.zoomLevel + this.zoomOffset);
	},

	/**
	 * @method setSunImage			Sets the SunImage of this layer provider.
	 * @param {SunImage} sunImage	The SunImage.
	 */		
	setSunImage: function(sunImage) {
		//Debug.output("layers.js:247 -> setSunImage layers");
		this.sunImage = sunImage;
	},
	
	/**
	 * @method setOpacity			Sets the opacity for all layers in the cache (also the visible ones!)
	 * @param {Number} opacity		The new opacity (0<=x<=1).
	 */
	setOpacity: function(opacity) {
		//Debug.output("layers.js:256 ->setopac layers");
		this.opacity = opacity;

		// For max browser compatibility
		this.layerCache.setStyle({
			opacity: opacity,
			'-moz-opacity': opacity,
			'filter': 'alpha(Opacity=' + Math.round(opacity * 100) + ')'
		});
	},
	
	/**
	 * @method setZoomOffset		Sets the zoom offset for this layer provider. Will be added to the current zoom level.
	 * @param {Number} zoomOffset	The zoom offset.
	 */
	setZoomOffset: function(zoomOffset) {
		//Debug.output("layers.js:272 -> setzoomoffset layers");
		if (!isFinite(zoomOffset)) return;
		this.zoomOffset = zoomOffset;
		this.layerCache.clear();
		this.tileContainer.reloadTileLayer(this);
		this.notifyListeners('ZoomOffsetChange', zoomOffset);
	},
	
	/**
	 * @method removeFromTileContainer	Removes all elements of this layer from the tile container
	 * 									and stops adding new ones.
	 */
	removeFromTileContainer: function() {
		//Debug.output("layers.js:285 -> removefromtilecontainer layers");
		this.layerCache.removeAndClear();
		//this.layerCache = null;
		this.stopObserving(this.tileContainer, 'AddTileLayer');
		// TODO: remove this image from the viewport's active images
		//this.tileContainer.viewport.activeImages.remove(this.sunImage);
		this.tileContainer.tileLayerProviders.remove(this);
	},

	/**
	 * @method toggleVisible	Shows or hides this layer.
	 * @param {Boolean} visible	Whether this layer is visible.
	 */
	toggleVisible: function(visible) {
		//Debug.output("layers.js:299 -> togglevisible layers");
		this.layerCache.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
	},
	
	/**
	 * @method setStyle		Sets CSS style properties on all elements of this layer.
	 * @param {Hash} style	A Hash containing the css property/value pairs.
	 */
	setStyle: function(style) {
		//Debug.output("layers.js:308 -> setstyle layers");
		this.layerCache.setStyle(style);
	},
	
	/**
	 * @method isTop		Returns true if this layer is the top layer.
	 * @return {Boolean}	Whether this layer is the top layer.
	 */
	isTop: function() {
		//Debug.output("layers.js:317 -> istop layers");
		return this.zIndex == this.tileContainer.tileLayerProviders.topZindex();
	},
	
	/**
	 * @method isBottom		Returns true if this layer is the bottom layer.
	 * @return {Boolean}	Whether this layer is the bottom layer.
	 */
	isBottom: function() {
		//Debug.output("layers.js:326 -> isbottom layers");
		return this.zIndex == this.tileContainer.tileLayerProviders.bottomZindex();
	},

	next: function() {
		//Debug.output("layers.js:331 -> next layers");
		return this.tileContainer.tileLayerProviders.next(this);
	},
	
	previous: function() {
		//Debug.output("layers.js:336 -> previous layers");
		return this.tileContainer.tileLayerProviders.previous(this);
	},

	moveUp: function() {
		//Debug.output(layers.js:341 -> "moveup layers");
		if (this.isTop()) return this;
		var nextLayer = this.next();
		this.tileContainer.tileLayerProviders.exchange(this, nextLayer);
		this.notifyListeners('Exchange', [this, nextLayer]);
		return this;
	},
	
	moveDown: function() {
		//Debug.output("layers.js:350 -> movedown layers");
		if (this.isBottom()) return this;
		var previousLayer = this.previous();
		this.tileContainer.tileLayerProviders.exchange(this, previousLayer);
		this.notifyListeners('Exchange', [this, previousLayer]);
		return this;	
	},
	
	/**
	 * Event handler: Add a tile layer to this tile (not really an "event" but works the same way)
	 * @param {Tile} tile	The tile to add the layer to.
	 */
	onAddTileLayer: function(tile) {
		//Debug.output("layers.js:363 -> onaddtilelayer layers");
		this.addTileLayerCached(tile);
	},

	/**
	 * Event handler: Image change.
	 * The cache needs to be cleared, and all visible layer elements reloaded.
	 * @param {SunImage} sunImage	The new sunImage.
	 */	
	onImageChange: function(sunImage) {
		//Debug.output("layers.js:373 -> onimagechange layers");
/*
		TODO: change the registered image in this.tileContainer.viewport.activeImages
		if (this.sunImage) {
			this.tileContainer.viewport.activeImages.replace(this.sunImage, sunImage);
		} else {
			this.tileContainer.viewport.activeImages.add(sunImage);
		}
*/
		this.setSunImage(sunImage);
		this.layerCache.clear();
		this.tileContainer.reloadTileLayer(this);
		this.notifyListeners('ImageChange', sunImage);
	},
	
	/**
	 * Event handler: Zoom offset change.
	 * @param {Number} zoomOffset	The new zoom offset.
	 */
	onZoomOffsetChange: function(zoomOffset) {
		//Debug.output("layers.js:393 -> onzoomoffsetchange layers");
		this.setZoomOffset(zoomOffset);
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

/**
 * @classDescription This class enables to show any HTML elements as overlays on the
 * image. The position is given in world-coordinates and a pixel offset.
 * @see Overlay
 * @see OverlayCollection
 */
var OverlayLayerProvider = Class.create();

OverlayLayerProvider.prototype = Object.extend(new TileLayerProvider(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, zoomOffset, opacity (0<=x<=1)
	 */
	initialize: function(tileContainer, options) {
		if (tileContainer) {
			Object.extend(this, this.defaultOptions.toObject());
			Object.extend(this, options);

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
		//Debug.output("layers.js:452 -> createtilelayer layers");
		var zoomOffset = this.zoomOffset;
		var zoomLevel = tile.tileContainer.viewport.zoomLevel;
		var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, zoomLevel + zoomOffset - 1);
		var xIndex = tile.xIndex - Math.floor(tileIndexOffset);
		var yIndex = tile.yIndex - Math.floor(tileIndexOffset);
		var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
		var tileOffset = this.tileContainer.tileSize * decimals;
		
		// Create the overlay layer for the tile
		var tileLayer = new Element('div').setStyle({
			position: 'absolute',
			left: '0px',
			top: '0px',
			width: '100%',
			height: '100%',
			color: '#FFFFFF',
			//'font-size': Math.round(16 * (zoomLevel - zoomOffset < 0 ? Math.pow(2, zoomLevel + zoomOffset) : 1)) + 'px',
			zIndex: this.zIndex
		});

		// Get the overlays on this tile
		var tileOverlays = this.overlays.getOverlays(xIndex, yIndex, zoomLevel + zoomOffset);

		// Closure
		var self = this;

		// Append each overlay
		tileOverlays.each(function(overlay) {
			// Calculate pixel position on the tile
			var x = (Math.pow(2, zoomLevel + zoomOffset) * overlay.position.x - xIndex) * self.tileContainer.tileSize + tileOffset;
			var y = (Math.pow(2, zoomLevel + zoomOffset) * overlay.position.y - yIndex) * self.tileContainer.tileSize + tileOffset;
			
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
	onNewOverlay: function(overlay) {
		//Debug.output("layers.js:503 -> onnewoverlay layers");
		if (!overlay.sunImage.date || overlay.sunImage == this.sunImage) {
			var zoomOffset = this.zoomOffset;
			var zoomLevel = this.tileContainer.viewport.zoomLevel + zoomOffset;
			var tileIndexOffset = (Math.pow(2, -zoomOffset) - 1) * Math.pow(2, zoomLevel - 1);
			var xIndex = Math.floor(overlay.position.x * (1 << zoomLevel)) - Math.floor(tileIndexOffset);;
			var yIndex = Math.floor(overlay.position.y * (1 << zoomLevel)) - Math.floor(tileIndexOffset);;
			var decimals = tileIndexOffset - Math.floor(tileIndexOffset);
			var tileOffset = this.tileContainer.tileSize * decimals;
            //Debug.output(zoomLevel, tileIndexOffset, xIndex, yIndex, decimals, tileOffset);

			if (this.layerCache.contains(zoomLevel, xIndex, yIndex)) {
	 			var x = ((1 << zoomLevel) * overlay.position.x - xIndex) * this.tileContainer.tileSize + tileOffset;
				var y = ((1 << zoomLevel) * overlay.position.y - yIndex) * this.tileContainer.tileSize + tileOffset;
				var layer = this.layerCache.get(zoomLevel, xIndex, yIndex);
	
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
		//Debug.output("layers.js:532 -> onshowinfo layers");
		this.notifyListeners('ShowInfo', properties);
	},
	
	/**
	 * Event handler: image change
	 * @param {SunImage} sunImage
	 */
	onImageChange: function(sunImage) {
		//Debug.output("layers.js:542 -> onImageChange()");
		this.overlays.clear();
		this.setSunImage(sunImage);
		this.layerCache.clear();
		this.tileContainer.reloadTileLayer(this);
		this.notifyListeners('ImageChange', sunImage);
	}
});

/**
 * @classDescription Provides the marker layer HTML elements.
 * @see OverlayLayerProvider
 * @see Marker
 * @see MarkerCollection
 */
var MarkerLayerProvider = Class.create();

MarkerLayerProvider.prototype = Object.extend(new OverlayLayerProvider(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, zoomOffset, opacity (0<=x<=1)
	 */
	initialize: function(tileContainer, options) {
		//Debug.output("layers.js:565 -> init markerlayerprovider layers");
		if (tileContainer) {
			Object.extend(this, this.defaultOptions.toObject());
			Object.extend(this, options);
			
			this.type = 'MarkerLayerProvider';
			this.tileContainer = tileContainer;
			//this.zIndex = 1000 + tileContainer.numOverlayLayerProviders++;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;

			this.tileContainer.tileLayerProviders.add(this);

			this.overlays = new OverlayCollection();

			this.layerCache = new DomNodeCache();
			this.overlays = new OverlayCollection();
			this.markers = new MarkerCollection(this.overlays);
			
			// Create Info Bubble
			this.infoBubble = new InfoBubble(this.tileContainer);

			this.observe(this.overlays, 'NewOverlay');
			this.observe(tileContainer, 'AddTileLayer');
			this.observe(tileContainer, 'Zoom');
	
		}
	},
	
	/**
	 * @method setSunImage			Sets the SunImage of this layer provider.
	 * @param {SunImage} sunImage	The SunImage.
	 */		
	setSunImage: function(sunImage) {
		//Debug.output("layers.js:599 -> setsunimage layers");
		this.sunImage = sunImage;

		// call marker collection load method
		this.markers.loadMarkers(sunImage);
	},
	
	/**
	 * Event handler: Show info associated with an overlay.
	 * @param {Hash} properties		Hash containing: html, layer, position (x,y)
	 * @see InfoBubble.show()
	 * @see OverlayCollection.onShowInfo()
	 */
	onShowInfo: function(properties) {
		//Debug.output("layers.js:613 -> onshowinfo layers");
		var fullSize = this.tileContainer.getFullSize();
		var totalPos = {
			x: this.tileContainer.viewport.position.x + Math.round(fullSize * (properties.position.x - 0.5)),
			y: this.tileContainer.viewport.position.y + Math.round(fullSize * (properties.position.y - 0.5))
		};
		this.infoBubble.show(properties.html, properties.layer, totalPos);
	},

	/**
	 * Event handler: zoom.
	 * @param {Number} level			The zoom level.
	 * @param {SunViewerWidget} source	The zooming widget.
	 */
	onZoom: function(level, source) {
		//Debug.output("layers.js:628 -> MarkerLayerProvider::onZoom (level = " + level + ")");
		this.infoBubble.hide();
	}
});

/**
 * @classDescription Debug layer class.
 * Draws tile outlines and coordinates.
 */
var TileDebugLayerProvider = Class.create();

TileDebugLayerProvider.prototype = Object.extend(new TileLayerProvider(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, zoomOffset, opacity (0<=x<=1)
	 */
	initialize: function(tileContainer, options) {
		//Debug.output("layers.js:646 -> init tiledbuguglayerprovider layers");
		this.color = '#FFFFFF';

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		if (tileContainer) {
			this.tileContainer = tileContainer;
			this.zIndex = 1000 + tileContainer.numOverlayLayerProviders++;
			this.id = this.type + this.zIndex;
			this.observe(tileContainer, 'AddTileLayer');
		}
		
		this.layerCache = new DomNodeCache();

		if (tileContainer) {
			tileContainer.reloadTileLayer(this);
		}
	},
	
	/**
	 * @method createTileLayer		Create the layer for the given tile.
	 * @param {Tile} tile			The tile for which to create the layer.
	 * @return {DIV HTML Element}	The resulting layer.
	 */
	createTileLayer: function(tile) {
		//Debug.output("layers.js:672 -> createtilelayer layers");
		var xIndex = tile.xIndex;
		var yIndex = tile.yIndex;
		var zoomLevel = tile.tileContainer.viewport.zoomLevel;
		var layer = new Element('div', {'class':'tile'});
		layer.setStyle({ 
			height: '100%',
			width: '100%',
			zIndex: this.zIndex
		});
		var tileDebugDiv = new Element('div', {'class':'tileDebug'});
		tileDebugDiv.setStyle({
			position: 'absolute',
			left: '0px',
			top: '0px',
			borderTop: '1px solid ' + this.color,
			borderLeft: '1px solid ' + this.color,
			height: '100%',
			width: '100%',
			color: this.color,
			fontSize: '20px',
			whiteSpace: 'nowrap'
		});
		tileDebugDiv.innerHTML = xIndex + ',' + yIndex + ',' + this.tileContainer.zIndex + ',' + this.zIndex + ' #' + tile.qx + ',' + tile.qy + '<br>@' + tile.posx + ',' + tile.posy;
		layer.appendChild(tileDebugDiv);
		var protectionLayer = new Element('div', {'class':'tile'});
		protectionLayer.setStyle({ width: '100%', height: '100%' });
		layer.appendChild(protectionLayer);
		return layer;
	},
	
	/**
	 * @method setStyle		Sets CSS style properties on all elements of this layer.
	 * @param {Hash} style	A Hash containing the css property/value pairs.
	 */
	setStyle: function(style) {
		//Debug.output("layers.js:711 -> setstyle layers");
		this.layerCache.setStyle(style);
	}
});

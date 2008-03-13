/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

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
			document.zoomLevelChange.subscribe(this.onZoom, this, true);
		}
	},
	
	/**
	 * @method setSunImage		Sets the SunImage of this layer provider.
	 * @param {SunImage} sunImage	The SunImage.
	 */		
	setSunImage: function(sunImage) {
		this.sunImage = sunImage;

		// load event information
		this.markers.loadMarkers(sunImage);
	},
	
	/**
	 * Event handler: Show info associated with an overlay.
	 * @param {Hash} properties		Hash containing: html, layer, position (x,y)
	 * @see InfoBubble.show()
	 * @see OverlayCollection.onShowInfo()
	 */
	onShowInfo: function(properties) {
		var fullSize = this.tileContainer.getFullSize();
		var totalPos = {
			x: this.tileContainer.viewport.position.x + Math.round(fullSize * (properties.position.x - 0.5)),
			y: this.tileContainer.viewport.position.y + Math.round(fullSize * (properties.position.y - 0.5))
		};
		this.infoBubble.show(properties.html, properties.layer, totalPos);
	},

	/**
	 * Event handler: zoom.
	 */
	onZoom: function() {
		Debug.output("layers.js:628 -> MarkerLayerProvider::onZoom");
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
		this.layerCache.setStyle(style);
	}
});

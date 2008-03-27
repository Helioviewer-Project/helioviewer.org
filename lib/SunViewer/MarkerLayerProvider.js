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
			
			this.className = 'MarkerLayerProvider';
			this.type = 'MarkerLayerProvider';
			this.tileContainer = tileContainer;
			//this.zIndex = 1000 + tileContainer.numOverlayLayerProviders++;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;

			this.tileContainer.tileLayerProviders.add(this);

			this.layerCache = new DomNodeCache();
			this.overlays = new OverlayCollection();
			this.markers = new MarkerCollection(this.overlays);
			
			// Create Info Bubble
			this.infoBubble = new InfoBubble(this.tileContainer);

            // Event Handlers
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
		//Debug.output("MarkerLayerProvider:onZoom()");
		this.infoBubble.hide();
	}
});

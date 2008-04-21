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
 /*global Class, $$, document, OverlayLayerProvider, MarkerCollection, OverlayCollection, DomNodeCache, InfoBubble */
var MarkerLayerProvider = Class.create();

MarkerLayerProvider.prototype = Object.extend(new OverlayLayerProvider(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The TileContainer object using this layer provider.
	 * @param {Hash} options				Available options: prefix, extension, loadingTileImage, noImageAvailableMessage, opacity (0<=x<=1)
	 */
	initialize: function (tileContainer, options) {
	    //Debug.output("MLP:init()");
		if (tileContainer) {
			Object.extend(this, this.defaultOptions.toObject());
			Object.extend(this, options);
			
			this.className = 'MarkerLayerProvider';
			this.type = 'MarkerLayerProvider';
			this.tileContainer = tileContainer;
			//this.zIndex = 1000 + tileContainer.numOverlayLayerProviders++;
			this.zIndex = tileContainer.tileLayerProviders.topZindex() + 1;
			this.id = this.type + this.zIndex;
			this.layerCache = new DomNodeCache();

            // Event Handlers
            document.tileLayerAdded.subscribe(this.onAddTileLayer, this, true);
            document.newOverlay.subscribe(this.onNewOverlay, this, true);
            document.zoomLevelChange.subscribe(this.onZoom, this, true);
			document.sunImageChange.subscribe(this.onImageChange, this, true);
			
			this.overlays = new OverlayCollection();
			this.markers =  new MarkerCollection(this.overlays);
			this.tileContainer.tileLayerProviders.add(this);

			// Create Info Bubble
			this.infoBubble = new InfoBubble(this.tileContainer);
		}
	},
	
	/**
	 * @method setSunImage		Sets the SunImage of this layer provider.
	 * @param {SunImage} sunImage	The SunImage.
	 */		
	setSunImage: function (sunImage) {
	    Debug.output('MLP: setSunImage();')
		this.sunImage = sunImage;

		// load event information
		this.markers.loadMarkers(sunImage);
	},
	
    /**
	 * @method toggleVisible	Shows or hides this layer.
	 * @param {Boolean} visible	Whether this layer is visible.
	 */
	toggleVisible: function (visible) {
	    //Note: This is necessary only when the tile layers holding labels is set to hidden
	    $$(".label").each(function (e) {
	        e.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
	    });
	},
	
	/**
	 * Event handler: Show info associated with an overlay.
	 * @param {Hash} properties		Hash containing: id, html, layer, position (x,y)
	 * @see InfoBubble.show()
	 * @see OverlayCollection.onShowInfo()
	 */
	onShowInfo: function (type, args) {
	    //Debug.output("MLP: onShowInfo()");
	    var properties = args[0];
		var fullSize = this.tileContainer.getFullSize();
		var totalPos = {
			x: this.tileContainer.viewport.position.x + Math.round(fullSize * (properties.position.x - 0.5)),
			y: this.tileContainer.viewport.position.y + Math.round(fullSize * (properties.position.y - 0.5))
		};
		this.infoBubble.show(properties.id, properties.html, properties.layer, totalPos);
	},

	/**
	 * Event handler: zoom.
	 */
	onZoom: function (types, args) {
		//Debug.output("MarkerLayerProvider:onZoom()");
		this.zoomLevel = args[0];
		this.infoBubble.hide();
	}
});

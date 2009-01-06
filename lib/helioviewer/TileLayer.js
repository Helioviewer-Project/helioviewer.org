/**
 * @fileoverview Contains the class definition for an TileLayer class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @class TileLayer
 *
 * syntax: jQuery, Prototype
 *
 * @see TileLayerAccordion, Layer
 * @requires Layer.js
 * 
 * Required Parameters:
 *		type		- The type of the layer (used by layer manager to differentiate event vs. tile layers).
 *		tileSize	- Tilesize to use.
 *		source		- Tile source ("database" or "filesystem").
 *		rootDir		- The root directory where the tiles are stored (when using filesystem as the tile source).
 *		opacity		- Default opacity (adjusted automatically when layer is added).
 *      autoOpaicty - Whether or not the opacity should be automatically determined when the image properties are loaded. 
 *		startOpened - Whether or not the layer menu entry should initially be open or closed.
 */
var TileLayer = Class.create(Layer, {
	defaultOptions: {
		type:		  'TileLayer',
		rootDir:	  'tiles/',
		cacheEnabled: true,
		opacity:	  100,
		autoOpacity:  true,
		startOpened:  false
	},

	/**
	 * @constructor
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;
		
		this.tileSize = viewport.tileSize; 
		
		this.layerManager = viewport.controller.layerManager;
		this.id = 'tilelayer' + new Date().getTime();

		// Create an HTML container to hold the layer tiles
		this.domNode = new Element('div', {className: 'tile-layer-container', style: 'position: absolute;'});
		viewport.movingContainer.appendChild(this.domNode);

		this.viewport.addObserver('move', this.viewportMove.bind(this));

		this.tiles = [];
		this.loadClosestImage();
	},

	/**
	 * @function
	 */
	reload: function() {
		this.loadClosestImage();
	},

	/**
	 * @function removeTiles
	 */
	removeTiles: function () {
		this.tiles = [];
	},

	/**
	 * @function reset
	 * @description Reload the tile layer.
	 */
	reset: function (visible) {
		var i, j;
		
		// Start loading indicator
		this.viewport.controller.loadingIndicator.loadingStarted();
		
		// Update relevant dimensions
		var zoomOffset = this.lowestRegularZoom - this.viewport.zoomLevel;
		this.relWidth  = this.width  * Math.pow(2, zoomOffset);
		this.relHeight = this.height * Math.pow(2, zoomOffset);

		// Let user know if the requested zoom-level is lower than the lowest level natively supported
		if ((this.viewport.zoomLevel < this.minZoom) && (this.viewport.controller.userSettings.get('warn-zoom-level') == "false")) {
			this.viewport.controller.messageConsole.log("Note: " + this.name + " is not available at this resolution. Images will be artificially enlarged.");
			this.viewport.controller.userSettings.set('warn-zoom-level', true);
		}

		// Remove tiles in cache
		this.removeTiles();

		this.refreshUTCDate();

		// Reference old tile nodes to remove after new ones are done loading
		var old = [];
		this.domNode.childElements().each(function (tile) {
			old.push(tile);
		});

		//TODO: Determine range to check
		var numTiles = 0;
		var numTilesLoaded = 0;

		var indices = this.viewport.visibleRange;
		
		for (i = indices.xStart; i <= indices.xEnd; i++) {
			for (j = indices.yStart; j <= indices.yEnd; j++) {
				if (visible[i][j]) {
					var tile = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));

					if (!this.tiles[i]) {
						this.tiles[i] = [];
					}

					this.tiles[i][j] = {};
					this.tiles[i][j].img = tile;

					numTiles++;

				   // Makes sure all of the images have finished downloading before swapping them in
				   var self = this;
					Event.observe(this.tiles[i][j].img, 'load', function(e) {
						numTilesLoaded++;
						if (numTilesLoaded == numTiles) {
							//Debug.output("Finished loading ALL images! (" + numTiles + ") total.");
							old.each(function (tile) {
								tile.parentNode && tile.remove();
							});
							self.viewport.controller.loadingIndicator.loadingFinished();
						}
					});
				}
			}
		}
	},

	/**
	 * @function
	 */
	refreshUTCDate: function () {
		var date = new Date(this.timestamp * 1000);
		date.toUTCDate();
		this.utcDate = date;
	},

	setImageProperties: function (imageProperties) {
		//Only load image if it is different form what is currently displayed
		if (imageProperties.imageId === this.imageId) {
			this.fire('obs_time_change', this);
			return;
		}
		
		Object.extend(this, imageProperties);

		this.fire('obs_time_change', this);

		//IE7: Want z-indices < 1 to ensure event icon visibility
		this.setZIndex(parseInt(this.opacityGroupId) - 10);

		//handle opacities for any overlapping images
		if (this.autoOpacity) {
			this.setInitialOpacity();
			this.autoOpacity = false;
		}

		// Let others know layer has been added
		this.fire('change', this);

		this.viewport.checkTiles(true);

		this.reset(this.viewport.visible);
	 },

	setImage: function (imageId) {
		if (imageId === this.imageId) {
			return;
		}
		this.imageId = imageId;
		this.loadImageProperties();
		this.reset(this.viewport.visible);
	},

	/**
	 * @function setInitialOpacity
	 * @description Sets the opacity for the layer, taking into account layers
	 *			  which overlap one another.
	 */
	setInitialOpacity: function () {
		var self = this;
		var opacity = 1;
		var counter = 0;

		//Note: No longer adjust other layer's opacities... only the new layer's (don't want to overide user settings).
		this.layerManager.layers.each (function (layer) {
			if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
			   counter++;
			}
		});
		
		//Do no need to adjust opacity if there is only one image
		if (counter > 1) {
			opacity = opacity / counter;
			this.domNode.setOpacity(opacity);
			this.opacity = opacity * 100;
		}

		/**
		this.layerManager.layers.each (function (layer) {
			if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
			   counter++;

				//Do no need to adjust opacity of the first image
				if (counter > 1) {
					opacity = opacity / counter;
					layer.domNode.setOpacity(opacity);
					layer.opacity = opacity * 100;
					//layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize});
				}
			}
		});*/
	},

	/**
	 * @function setOpacity
	 * 
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;
		opacity = opacity / 100;
		this.domNode.setOpacity(opacity);
		//this.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')'});
	},

	/**
	 * @function loadClosestImage
	 * @description Loads the closest image in time to that requested
	 */
	loadClosestImage: function () {
		var date = this.viewport.controller.date;

		// Ajax responder
		var processResponse = function (transport) {
			this.setImageProperties(transport.responseJSON);
			
			var hv = this.viewport.controller;
			
			// update viewport sandbox if necessary
			this.viewport.updateSandbox();

			// Add to tileLayer Accordion if it's not already there
			if (!hv.tileLayerAccordion.hasId(this.id)) {
				hv.tileLayerAccordion.addLayer(this);
			}
			// Otherwise update the accordion entry information
			else {
				hv.tileLayerAccordion.updateTimeStamp(this);
				hv.tileLayerAccordion.updateLayerDesc(this.id, this.name);
				hv.tileLayerAccordion.updateOpacitySlider(this.id, this.opacity);
			}
		};
		
		// Ajax request
		var xhr = new Ajax.Request(this.viewport.controller.imageAPI, {
			method: 'get',
			parameters: {
				action: 'getClosestImage',
				observatory: this.observatory,
				instrument:  this.instrument,
				detector:    this.detector,
				measurement: this.measurement,
				timestamp:   date.getTime() / 1000,
				debug: false				
			},
			onSuccess: processResponse.bind(this)
		});
	},

	/**
	 * @function viewportMove
	 * @description Check to see if all visible tiles have been loaded
	 *
	 */
	viewportMove: function (position) {
		var visible = this.viewport.visible;
		var indices = this.viewport.visibleRange;

		//Debug.output("Checking tiles from " + indices.xStart + " to " + indices.xEnd);

		for (var i = indices.xStart; i <= indices.xEnd; i++) {
			for (var j = indices.yStart; j <= indices.yEnd; j++) {
				if (!this.tiles[i]) {
					this.tiles[i] = [];
				}
				if(visible[i][j] && (!this.tiles[i][j])) {
					//Debug.output("Loading new tile");
					this.tiles[i][j] = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
				}
			}
		}
	},

	getTile: function (x, y) {
		var left = x * this.tileSize;
		var top  = y * this.tileSize;
		var zoom  = this.viewport.zoomLevel;
		var ts = this.tileSize;

		var img = $(new Image());
		img.addClassName('tile');
		img.setStyle({
			left: left + 'px',
			top: top + 'px'
		});
		img.unselectable = 'on';
		var rf = function() {
			return false;
		};
		img.onmousedown   = rf;
		img.ondrag        = rf;
		img.onmouseover   = rf;
		img.oncontextmenu = rf;
		img.galleryimg    = 'no';
		img.alt           = "";

		
		// If tile doesn't exist, load the transparent tile in it's place

		Event.observe(img, 'error', function () {
			this.src = 'images/transparent_' + ts + '.gif'; 
		})

		// Load tile
		img.src = this.tileAPI + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + this.imageId + '&ts=' + ts;
		
		return img;
	}
});


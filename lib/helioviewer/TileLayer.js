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
 *		startOpened - Whether or not the layer menu entry should initially be open or closed.
 */
var TileLayer = Class.create(Layer, {
	defaultOptions: {
		type:		 'TileLayer',
		tileSize:	 512,
		source:		 'database',
		rootDir:	 'tiles/',
		opacity:	 100,
		startOpened: false
	},

	/**
	 * @constructor
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;
		
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

		// Let user know if the requested zoom-level is unavailable
		if ((this.viewport.zoomLevel < this.minZoom) && (!this.warned)) {
			this.viewport.controller.messageConsole.log("Warning: " + this.name + " is not available at this zoom level. Try a lower zoom-level.");
			this.warned = true;
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
					Event.observe(this.tiles[i][j].img, 'load', function(e) {
						numTilesLoaded++;
						if (numTilesLoaded == numTiles) {
							//Debug.output("Finished loading ALL images! (" + numTiles + ") total.");
							old.each(function (tile) {
								tile.parentNode && tile.remove();
							});
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

		this.setZIndex(parseInt(this.opacityGroupId));

		//handle opacities for any overlapping images
		this.setInitialOpacity();

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

		this.layerManager.layers.each (function (layer) {
			if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
			   counter++;

				//Do no need to adjust opacity of the first image
				if (counter > 1) {
					opacity = opacity / counter;
					layer.domNode.setOpacity(opacity);
					layer.opacity = opacity * 100;
					layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize})
				}
			}
		});
	},

	/**
	 * @function setOpacity
	 * 
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;
		opacity = opacity / 100;
		this.domNode.setOpacity(opacity);
		this.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')'})
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
				action: 'getClosest',
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

	getFullSize: function () {
		return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
	},


	getTile: function (x, y) {
		var left = x * this.tileSize;
		var top = y * this.tileSize;

		var img = $(new Image());
		img.toggleClassName('tile');
		img.setStyle({
			left: left + 'px',
			top: top + 'px'
		});
		img.unselectable = 'on';
		var rf = function() {
			return false;
		};
		img.onmousedown = rf;
		img.ondrag = rf;
		img.onmouseover = rf;
		img.oncontextmenu = rf;
		img.galleryimg = 'no';

		//default image
		Event.observe(img, 'error', function () {
			this.src = 'images/transparent.gif';
		})

		img.src = this.getTileUrl(x, y, this.detector, this.viewport.zoomLevel, this.imageId);
		return img;
	},

	/**
	 * @function
	 * @description Returns the URI for the specified tile.
	 */
	getTileUrl: function (x, y, detector, zoom, imageId) {
		if (this.source === "database") {
			if (imageId === undefined) {
				imageId = '';
			}
			return this.tileAPI + '?x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + imageId;
		}
		else if (this.source === "filesystem") {
			var filepath = this.getFilePath(x,y);
			//Debug.output("[" + x + ", " + y + "] " + filepath);
			return filepath;
		}
	},

	/**
	 * @function getFilePath
	 * @description Builds a filepath for a given tile
	 */
	getFilePath: function (x, y) {
		var offset = this.getTileOffset();

		var year =  this.utcDate.getFullYear();
		var month = (this.utcDate.getMonth() + 1).toString().padLeft('0', 2);
		var day =   this.utcDate.getDate().toString().padLeft('0', 2);
		var hour =  this.utcDate.getHours().toString().padLeft('0', 2);
		var min =   this.utcDate.getMinutes().toString().padLeft('0', 2);
		var sec =   this.utcDate.getSeconds().toString().padLeft('0', 2);
		var obs =   this.observatory.toLowerCase();
		var inst =  this.instrument;
		var det =   this.detector;
		var meas =  this.measurement;
		var zoom =  this.viewport.zoomLevel;
		
		// Convert coordinates to strings
		var xStr = "+" + x.toString().padLeft('0',2);
		if (x.toString().substring(0,1) == "-") {
			xStr = "-" + x.toString().substring(1).padLeft('0', 2);
		}

		var yStr = "+" + y.toString().padLeft('0',2);
		if (y.toString().substring(0,1) == "-") {
			yStr = "-" + y.toString().substring(1).padLeft('0', 2);
		}

		var path = this.rootDir + year + "/" + month + "/" + day + "/" + hour + "/" + obs + "/" + inst + "/" + det + "/" + meas + "/";
		var file = year + "_" + month + "_" + day + "_" + hour + min + sec + "_" + obs + "_" + inst + "_" + det + "_" + meas + "_" + zoom + "_" + xStr + "_" + yStr + "." + this.filetype;

		return (path + file);
	},

	/**
	 * @function getTileOffset
	 * @description Determines offset for converting from HelioCentric coordinates to TOP-LEFT
	 *              coordinates.
	 */
	getTileOffset: function () {
		//var numTiles = this.getNumTiles();
		//return Math.max(1, parseInt(Math.sqrt(numTiles)/2));
		return 0;
	},

	/**
	 * @function getNumTiles
	 * @description Returns the (maximum) number of tiles required to display images for the TileLayer's associated
	 *              detector, given the specified zoom-level. Varies from detector to detector.
	 */
	getNumTiles: function () {
		var zoom = this.viewport.zoomLevel;
		var diff = parseInt(this.lowestRegularZoom) - zoom;

		//Debug.output("TL Diff: " + diff);

		return Math.max(4, Math.pow(4, 1 + diff));
	}
});


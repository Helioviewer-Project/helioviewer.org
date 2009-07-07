/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 * Syntax: jQuery, Prototype
 * 
 */
/*global TileLayer, Class, Layer, Ajax, Event, $, Element, Image */
var TileLayer = Class.create(Layer, 
    /** @lends TileLayer.prototype */
	{	
	/**
	 * @description Default TileLayer options
	 */
	defaultOptions: {
		type        :'TileLayer',
  		opacity     : 100,
        cacheEnabled: true,
		autoOpacity : true,
		startOpened : false,
		sharpen     : false
	},

	/**
	 * @constructs
	 * @description Creates a new TileLayer
	 * @param {Object} viewport Viewport to place the tiles in
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>type</b>	       - The type of the layer (used by layer manager to differentiate event vs. tile layers)<br>
	 *      <b>tileSize</b>	   - Tilesize to use<br>
	 *		<b>source</b>      - Tile source ["database" | "filesystem"]<br>
	 *      <b>opacity</b>	   - Default opacity (adjusted automatically when layer is added)<br>
	 *		<b>autoOpaicty</b> - Whether or not the opacity should be automatically determined when the image properties are loaded<br>
	 *		<b>startOpened</b> - Whether or not the layer menu entry should initially be open or closed<br>
	 * </div>
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;
		
		this.tileSize = viewport.tileSize; 
		
		this.tileLayers = viewport.controller.tileLayers;
        
        //TODO: use encodable layer id instead (e.g. SOHO,EIT,EIT,171) and verify uniqueness before adding
		this.id = 'tilelayer' + new Date().getTime();

		// Create an HTML container to hold the layer tiles
		this.domNode = new Element('div', {className: 'tile-layer-container', style: 'position: absolute;'});
		viewport.movingContainer.appendChild(this.domNode);

		this.viewport.addObserver('viewport-move', this.viewportMove.bind(this));

		this.tiles = [];
		this.loadClosestImage();
	},

	/**
	 * @description Refreshes the TileLayer
	 */
	reload: function () {
		this.loadClosestImage();
	},

	/**
	 * @function Remove TileLayer tiles
	 */
	removeTiles: function () {
		this.tiles = [];
	},

    /**
     * @description Reload the tile layer
     * @param {Boolean} zoomLevelChanged Whether or not the zoom level has been changed
     */
    reset: function (zoomLevelChanged) {
        var currentScale, scaleOffset, visible;
        
        // Start loading indicator
        this.viewport.controller.loadingIndicator.loadingStarted();
        
        // Update relevant dimensions
        //zoomOffset = this.lowestRegularZoom - this.viewport.zoomLevel;
        currentScale = this.viewport.controller.baseScale * Math.pow(2, this.viewport.zoomLevel - this.viewport.controller.baseZoom);
        scaleOffset  = this.naturalImageScale / currentScale;
		//console.log("zoomLevel & baseZoom: " + this.viewport.zoomLevel + ", " + this.viewport.controller.baseZoom);
		//console.log("currentScale & scaleOffset: " + currentScale + ", " + scaleOffset);
        this.relWidth  = this.width  * scaleOffset;
        this.relHeight = this.height * scaleOffset;
		
    	//console.log("relative Width & Height: " + this.relWidth + " , " + this.relHeight + "\nWidth & Height: " + this.width + ", " + this.height);
    
    	// Let user know if the requested zoom-level is lower than the lowest level natively supported
    	if ((this.viewport.zoomLevel < this.minZoom) && (this.viewport.controller.userSettings.get('warnZoomLevel') === "false")) {
    		this.viewport.controller.messageConsole.log("Note: " + this.name + " is not available at this resolution. Images will be artificially enlarged.");
    		this.viewport.controller.userSettings.set('warnZoomLevel', true);
    	}
    
    	this.refreshUTCDate();

        this.refreshTiles(zoomLevelChanged);
    },
    
    /**
     * @description Refresh displayed tiles
     * @param {Boolean} zoomLevelChanged Whether or not the zoom level has been changed
     */
    refreshTiles: function (zoomLevelChanged) {
        var i, j, old, numTiles, numTilesLoaded, indices, tile, onLoadComplete, visible, self = this;
        
        visible = this.viewport.visible;

        // Determine valid tilespace
        this.computeValidTiles();

    	// Remove tiles in cache
    	this.removeTiles();
    
    	// Reference old tile nodes to remove after new ones are done loading
    	old = this.getTileArray();

        // When zooming, remove old tiles right away to avoid visual glitches
        if (zoomLevelChanged) {
            this.removeTileDomNodes(old);
        }
        
    	numTiles = 0;
    	numTilesLoaded = 0;
    
    	indices = this.viewport.visibleRange;
    	
        // When stepping forward or back in time remove old times only after all new ones have been added
    	onLoadComplete = function () {
    		numTilesLoaded += 1;

            // After all tiles have loaded, stop indicator (and remove old-tiles if haven't already)
    		if (numTilesLoaded === numTiles) {
                if (!zoomLevelChanged) {
                    self.removeTileDomNodes(old);
                }
    			self.viewport.controller.loadingIndicator.loadingFinished();
    		}
    	};
    	
        // Load tiles that lie within the current viewport
    	for (i = indices.xStart; i <= indices.xEnd; i += 1) {
    		for (j = indices.yStart; j <= indices.yEnd; j += 1) {
                if (!this.validTiles[i])
                    this.validTiles[i] = [];
    			if (visible[i][j] && this.validTiles[i][j]) {
    				tile = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
    
    				if (!this.tiles[i]) {
    					this.tiles[i] = [];
    				}
    
    				this.tiles[i][j] = {};
    				this.tiles[i][j].img = tile;
    
    				numTiles += 1;
    
    			   // Makes sure all of the images have finished downloading before swapping them in
    				Event.observe(this.tiles[i][j].img, 'load', onLoadComplete);
    			}
    		}
    	}        
    },
    
    /**
     * @description remove tile dom-nodes
     */
    removeTileDomNodes: function (tileArray) {
    	tileArray.each(function (tile) {
    		if (tile.parentNode) {
    			tile.remove();
    		}
    	});
    },
    
    /**
     * @description Creates an array of tile dom-nodes
     * @return {Array} An array containing pointers to all of the tiles currently loaded
     */
    getTileArray: function () {
        var tiles = [];
        
    	this.domNode.childElements().each(function (tile) {
    		tiles.push(tile);
    	});
        
        return tiles;
    },

	/**
	 * @description Update TileLayer date
	 */
	refreshUTCDate: function () {
		var date = new Date(this.timestamp * 1000);
		date.toUTCDate();
		this.utcDate = date;
	},

	/**
	 * @description Store retrieved image properties
	 * @param {Object} imageProperties Properties of the image associated with the TileLayer  
	 */
	setImageProperties: function (imageProperties) {
		//Only load image if it is different form what is currently displayed
		if (imageProperties.uri === this.uri) {
			this.fire('obs_time_change', this);
			return;
		}
		
		Object.extend(this, imageProperties);

		this.fire('obs_time_change', this);

		//IE7: Want z-indices < 1 to ensure event icon visibility
		this.setZIndex(parseInt(this.opacityGroupId, 10) - 10);

        //TODO: move opacity & vis check to init avoid recomputing many times (need opacity grp)
		// opacity
        if (this.opacity != 100)
            this.setOpacity(this.opacity);

		else if (this.autoOpacity) {
			this.setInitialOpacity();
			this.autoOpacity = false;
		}
        
        // visibility
        if (!this.visible)
            this.setVisibility(false);

		// Let others know layer has been added
		this.fire('change', this);

		this.viewport.checkTiles(true);
		this.reset(false);
	},
    
    /**
     * @description Creates a 2d array representing the range of valid (potentially data-containing) tiles
     */
    computeValidTiles: function () {
   		var i, j, indices;
        
   		indices = this.getValidTileRange();
        
        // Reset array
        this.validTiles = [];
        
        // Update validTiles array
		for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (!this.validTiles[i]) {
					this.validTiles[i] = [];
				}
				this.validTiles[i][j] = true;
			}
		}        
    },
    
    /**
     * @description Determines the boundaries for the valid tile range
     * @return {Array} An array containing the tile boundaries
     */
	getValidTileRange: function () {
		var numTilesX, numTilesY, boundaries, ts = this.tileSize;
		
        // Number of tiles for the entire image
		numTilesX = Math.max(2, Math.ceil(this.relWidth  / ts));
   		numTilesY = Math.max(2, Math.ceil(this.relHeight  / ts));
		
		// Tile placement architecture expects an even number of tiles along each dimension
		if ((numTilesX % 2) != 0)
            numTilesX += 1;

		if ((numTilesY % 2) != 0)
			numTilesY += 1;

	    // boundaries for tile range
        boundaries = {
            xStart: - (numTilesX / 2),
            xEnd  :   (numTilesX / 2) - 1,
            yStart: - (numTilesY / 2),
            yEnd  :   (numTilesY / 2) - 1
        };
        
        return boundaries;
    },

	/**
	 * @description Associates an image with the TileLayer and fetches some meta information relating to that image
	 * @param {String} uri The URI of the image to be tiled 
	 */
	setImage: function (uri) {
		if (uri === this.uri) {
			return;
		}
		this.uri = uri;
		this.loadImageProperties();
		this.reset(this.viewport.visible);
	},

	/**
	 * @description Sets the opacity for the layer, taking into account layers which overlap one another.
	 */
	setInitialOpacity: function () {
		var self = this,
			opacity = 1,
			counter = 0;

		//Note: No longer adjust other layer's opacities... only the new layer's (don't want to overide user settings).
		this.tileLayers.each(function (layer) {
			if (parseInt(layer.opacityGroupId, 10) === parseInt(self.opacityGroupId, 10)) {
				counter += 1;
			}
		});
		
		//Do no need to adjust opacity if there is only one image
		if (counter > 1) {
			opacity = opacity / counter;
            this.setOpacity(opacity * 100);
		}
	},

	/**
	 * @description Update the tile layer's opacity
	 * @param {int} Percent opacity to use
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;
		jQuery(this.domNode).css("opacity", opacity / 100);
	},

	/**
	 * @description Loads the closest image in time to that requested
	 */
	loadClosestImage: function () {
		var date = this.viewport.controller.date,
			processResponse, xhr;

		// Ajax responder
		processResponse = function (transport) {
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
		xhr = new Ajax.Request(this.viewport.controller.api, {
			method: 'POST',
			parameters: {
				action: 'getClosestImage',
                server:      this.server,
				observatory: this.observatory,
				instrument:  this.instrument,
				detector:    this.detector,
				measurement: this.measurement,
				timestamp:   date.getTime() / 1000
			},
			onSuccess: processResponse.bind(this)
		});
	},
	
	/**
	 * @description Toggle image sharpening
	 */
	toggleSharpening: function () {
		if (this.sharpen === true) {
			
		} else {
			//jQuery(this.domNode.childElements());
			//jQuery("img.tile[src!=images/transparent_512.gif]").pixastic("sharpen", {amount: 0.35});
		}
		this.sharpen = !this.sharpen;
	},

	/**
	 * @description Check to see if all visible tiles have been loaded
	 */
	viewportMove: function () {
		var visible, indices, i, j;
        
        this.viewport.checkTiles();
        
      	visible = this.viewport.visible;
	    indices = this.viewport.visibleRange;	

		//console.log("Checking tiles from " + indices.xStart + " to " + indices.xEnd);
    	for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (!this.tiles[i]) {
					this.tiles[i] = [];
				}
                if (!this.validTiles[i]) {
                    this.validTiles[i] = [];
                }
				if (visible[i][j] && (!this.tiles[i][j]) && this.validTiles[i][j]) {
					//console.log("Loading new tile");
					this.tiles[i][j] = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
				}
			}
		}
	},

	/**
	 * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
	 * @param {Int} x Tile X-coordinate
	 * @param {Int} y Tile Y-coordinate
	 * @returns {String} URL to retrieve the requested tile
	 */
	getTile: function (x, y) {
        var top, left, zoom, ts, img, rf, self, xhr, processResponse, emptyTile;

	    left  = x * this.tileSize;
		top   = y * this.tileSize;
		zoom  = this.viewport.zoomLevel;
		ts    = this.tileSize;
        self  = this;
		
        rf = function () {
			return false;
		};
        
        emptyTile = 'images/transparent_' + ts + '.gif';
			
		img = $(new Image());
		img.addClassName('tile');
		img.setStyle({
			left: left + 'px',
			top : top + 'px'
		});
		img.unselectable = 'on';

		img.onmousedown   = rf;
		img.ondrag        = rf;
		img.onmouseover   = rf;
		img.oncontextmenu = rf;
		img.galleryimg    = 'no';
		img.alt           = "";

		
		// If loading fails...
		Event.observe(img, 'error', function(e) {
            Event.stopObserving(img, 'error');
            
            // Use backup server if enabled
            if (self.viewport.controller.backupEnabled) {

                // If it still doesn't work, load the transparent tile
                Event.observe(this, 'error', function() {
                    this.src = emptyTile;
                });
                
                this.src = self.viewport.controller.backupServer + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&uri=' + self.uri + '&ts=' + ts;
                
            } else {
                this.src = emptyTile;
            }

        });

		// Load tile
		img.src = this.server + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&uri=' + this.uri + '&ts=' + ts;
		
		return img;
	},
    
    /**
     * @description Returns a stringified version of the tile layer for use in URLs, etc
     * @return string String representation of the tile layer
     */
    toString: function () {
        return this.observatory + "," + this.instrument + "," + this.detector + "," + this.measurement + "," + (this.visible ? "1" : "0") + "," + this.opacity;
    },
    
    /**
     * @description Returns a JSON representation of the tile layer for use by the UserSettings manager
     * @return JSON A JSON representation of the tile layer     
     */
    toJSON: function () {
        return {
            "server"     : this.server,
            "observatory": this.observatory,
            "instrument" : this.instrument,
            "detector"   : this.detector,
            "measurement": this.measurement,
            "visible"    : this.visible,
            "opacity"    : this.opacity
        };
    }
});

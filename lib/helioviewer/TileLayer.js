/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 * 
 */
/*global Class, Layer, $, Image */
var TileLayer = Layer.extend( 
    /** @lends TileLayer.prototype */
	{	
	/**
	 * @description Default TileLayer options
	 */
	defaultOptions: {
		type        : 'TileLayer',
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
	init: function (controller, params) {
        this.controller  = controller;
		this.viewport    = controller.viewport;
        this.dataSources = controller.dataSources;
		this.tileLayers  = controller.tileLayers;
		this.tileSize    = controller.viewport.tileSize; 		
                
		$.extend(this, this.defaultOptions);
		$.extend(this, params);
        $.extend(this, this.dataSources[this.observatory][this.instrument][this.detector][this.measurement]);
		
        this.htmlId = "tile-layer-" + this.sourceId;

        this.domNode = $('<div class="tile-layer-container" style="position: absolute;"></div>').appendTo(this.viewport.movingContainer);
        
        this._setupEventHandlers();

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
        //$('#loading').show();
        
        // Update relevant dimensions
        currentScale = this.controller.baseScale * Math.pow(2, this.viewport.zoomLevel - this.controller.baseZoom);
        scaleOffset  = this.naturalImageScale / currentScale;
		//console.log("zoomLevel & baseZoom: " + this.viewport.zoomLevel + ", " + this.viewport.controller.baseZoom);
		//console.log("currentScale & scaleOffset: " + currentScale + ", " + scaleOffset);
        this.relWidth  = this.width  * scaleOffset;
        this.relHeight = this.height * scaleOffset;
		
        //    	console.log("relative Width & Height: " + this.relWidth + " , " + this.relHeight + "\nWidth & Height: " + this.width + ", " + this.height);
    
    	// Let user know if the requested zoom-level is lower than the lowest level natively supported
    	if ((this.viewport.zoomLevel < this.minZoom) && (this.controller.userSettings.get('warnZoomLevel') === false)) {
    		this.controller.messageConsole.info("<b>Note:<b> " + this.name + " is not available at this resolution. Images will be artificially enlarged.");
    		this.controller.userSettings.set('warnZoomLevel', true);
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
        if (zoomLevelChanged)
            this.removeTileDomNodes(old);
        
    	numTiles = 0;
    	numTilesLoaded = 0;
    
    	indices = this.viewport.visibleRange;
    	
        // When stepping forward or back in time remove old times only after all new ones have been added
    	onLoadComplete = function () {
    		numTilesLoaded += 1;

            // After all tiles have loaded, stop indicator (and remove old-tiles if haven't already)
    		if (numTilesLoaded === numTiles) {
                if (!zoomLevelChanged)
                    self.removeTileDomNodes(old);
                    //$('#loading').hide();
    		}
    	};
    	
        // Load tiles that lie within the current viewport
    	for (i = indices.xStart; i <= indices.xEnd; i += 1) {
    		for (j = indices.yStart; j <= indices.yEnd; j += 1) {
                if (!this.validTiles[i])
					this.validTiles[i] = [];

    			if (visible[i][j] && this.validTiles[i][j]) {
                    tile = this.getTile(i, j, this.viewport.zoomLevel);
                    this.domNode.append(tile);
    
    				if (!this.tiles[i])
    					this.tiles[i] = [];
    
    				this.tiles[i][j] = {};
    				this.tiles[i][j].img = tile;
    
    				numTiles += 1;
    
    			    // Makes sure all of the images have finished downloading before swapping them in
                    this.tiles[i][j].img.load(onLoadComplete);
    			}
    		}
    	}        
    },
    
    /**
     * @description remove tile dom-nodes
     */
    removeTileDomNodes: function (tileArray) {
    	$.each(tileArray, function () {
    		if (this.parentNode)
    			$(this).remove();
    	});
    },
    
    /**
     * @description Creates an array of tile dom-nodes
     * @return {Array} An array containing pointers to all of the tiles currently loaded
     */
    getTileArray: function () {
        var tiles = [];
        
        //this.domNode.childElements().each(function (tile) {
    	//	tiles.push(tile);
    	//});
       	this.domNode.children().each(function () {
            tiles.push(this);
        })
        
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
	 * 
	 * IE Opacity image problem is related to position: absolute! e.g. remove from tile.
	 */
	setImageProperties: function (imageProperties) {
		//Only load image if it is different form what is currently displayed
		if (imageProperties.uri === this.uri)
			return;
            
		$.extend(this, imageProperties);

		//IE7: Want z-indices < 1 to ensure event icon visibility
		this.setZIndex(parseInt(this.layeringOrder, 10) - 10);

        //TODO: move opacity & vis check to init avoid recomputing many times (need opacity grp)
		// opacity
        if (this.opacity != 100) {
            this.setOpacity(this.opacity);
		}

		else if (this.autoOpacity) {
			this.setInitialOpacity();
			this.autoOpacity = false;
		}
        
        // visibility
        if (!this.visible)
			this.setVisibility(false);

		this.viewport.checkTiles(true);
		this.reset(false);

		this.loadJP2Dimensions();
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
				if (!this.validTiles[i])
					this.validTiles[i] = [];
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
		if (uri === this.uri)
			return;
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
		this.tileLayers.each(function () {
			if (parseInt(this.layeringOrder, 10) === parseInt(self.layeringOrder, 10))
				counter += 1;
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
        
        // IE
        if (!$.support.opacity) {
			$(this.domNode).find(".tile").each(function () {
				$(this).css("opacity", opacity / 100);
			});
		}
		// Everyone else
		else {
			$(this.domNode).css("opacity", opacity / 100);
		}
	},

	/**
	 * @description Loads the closest image in time to that requested
	 */
	loadClosestImage: function () {
		var callback, params, datasource, self = this;
        
       
        // OLD-Style Return params:
        // {"imageId":"53078","width":"1158","height":"1158","naturalImageScale":"10.52","measurement":"0WL","measurementType":"other","unit":null,
        //  "name":"LASCO C2 WL","minZoom":"12","detector":"0C2","opacityGroupId":"2","opacityGroupDescription":"Coronagraph Image, in the range of LASCO C2",
        // "instrument":"LAS","observatory":"SOH","timestamp":"1065311645","timediff":"355","timediffAbs":"355"}
        params = {
        	action:   'getClosestImage',
            server:   this.server,
            sourceId: this.sourceId,
        	date:     this.controller.date.toISOString()
        };
        
		// Ajax responder
		callback = function (data) {
			self.setImageProperties(data);
			
			var hv = self.controller;
			           
			// update viewport sandbox if necessary
			self.viewport.updateSandbox();

			// Add to tileLayer Accordion if it's not already there
			if (!hv.tileLayerAccordion.hasId(self.sourceId))
				hv.tileLayerAccordion.addLayer(self);
                			
			// Otherwise update the accordion entry information
			else {
				hv.tileLayerAccordion.updateTimeStamp(self);
				hv.tileLayerAccordion.updateLayerDesc("#" + self.htmlId, self.name);
				hv.tileLayerAccordion.updateOpacitySlider(self.sourceId, self.opacity);
			}
		};
		
		// Ajax request
        $.post(this.controller.api, params, callback, "json");
	},
	
	/**
	 * @description Toggle image sharpening
	 */
	toggleSharpening: function () {
		if (this.sharpen === true) {
			
		} else {
			//$(this.domNode.childElements());
			//$("img.tile[src!=images/transparent_512.gif]").pixastic("sharpen", {amount: 0.35});
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
                    this.tiles[i][j] = this.getTile(i, j, this.viewport.zoomLevel).appendTo(this.domNode);
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
        var top, left, zoom, ts, img, rf, emptyTile, self  = this;

	    left  = x * this.tileSize;
		top   = y * this.tileSize;
		zoom  = this.viewport.zoomLevel;
		ts    = this.tileSize;
		
        rf = function () {
			return false;
		};
        
        emptyTile = 'images/transparent_' + ts + '.gif';
			
        //img = $('<img class="tile" style="left:' + left + 'px; top:' + top + 'px;"></img>');
        img = new Image();

		img.unselectable = 'on';

		img.onmousedown   = rf;
		img.ondrag        = rf;
		img.onmouseover   = rf;
		img.oncontextmenu = rf;
		img.galleryimg    = 'no';

        
        img = $(img).addClass("tile").css({"left": left, "top": top}).attr("alt", "");

        // IE
        if (!$.support.opacity)
			img.css("opacity", this.opacity / 100);

        // If loading fails...
        img.error(function (e) {
            img.unbind("error");
            
            if (self.controller.backupEnabled) {
            
                // If it still doesn't work, load the transparent tile
                $(this).error(function () {
                    $(this).attr("src", emptyTile);
                });
                
                $(this).attr("src", self.controller.backupServer + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&uri=' + self.uri + '&ts=' + ts);
                
            } else {
            	$(this).attr("src", emptyTile);
            }
        });

		// Load tile
		img.attr("src", this.server + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&uri=' + this.uri + '&ts=' + ts);
		
		return img;
	},

	/**
	 * @description 7-28-2009 -- Jaclyn Beck added this so that the layer knows about its jp2 image dimensions.
	 * 				Sends a request to query the database to find the jp2 dimensions for this layer. It makes the
	 * 				assumption that all images of the same layer kind (e.g. all EIT 304 images) have the same dimensions.
	 */
	loadJP2Dimensions: function () {
		var dimensions, callback, params, self = this;

        // request params
        params = {
            action		: 'getJP2Dimensions',
            observatory	: this.observatory,
            instrument	: this.instrument,
            detector	: this.detector,
            measurement	: this.measurement
        };

        // callback
		callback = function (data) {
			dimensions = data.split("x");

			self.jp2Width 	= dimensions[0];
			self.jp2Height 	= dimensions[1];
		};
		
		$.post(this.controller.api, params, callback, "json");
	},
		
	/**
	 * @description Gets this layer's jp2width and jp2height and returns them in an array.
	 * @return {Array} dimensions -- array of width and height
	 */
	getJP2Dimensions: function () {
		var dimensions = {
			width: 	this.jp2Width,
			height: this.jp2Height
		};

		return dimensions;
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
    },
	
	/**
	 * @description Tests all four corners of the visible image area to see if they are within the transparent circle region of LASCO C2
	 * 				and LASCO C3 images. It uses the distance formula: d = sqrt( (x2 - x1)^2 + (y2 - y1)^2 ) to find the distance from 
	 * 				the center to each corner, and if that distance is less than the radius, it is inside the circle region. 
	 * @param {Object} radius -- The radius of the circle region in the jp2 image
	 * @param {Object} center -- The center coordinate of the jp2 image (jp2Width / 2). 
	 * @param {Object} left -- Left coordinate of the selected region
	 * @param {Object} top -- Top coordinate of the selected region
	 * @param {Object} width -- width of the selected region
	 * @param {Object} height -- height of the selected region
	 * @return false as soon as it finds a distance outside the radius, or true if it doesn't.
	 */
	insideCircle: function (radius, center, left, top, width, height) {
		var right = left + width, bottom = top + height, distance, distX, distY, corners, c;
		corners = {
			topLeft		: {x: left,  y: top},
			topRight	: {x: right, y: top},
			bottomLeft	: {x: left,  y: bottom},
			bottomRight	: {x: right, y: bottom}
		};

		for (c in corners) {
			distX = Math.pow(center - corners[c].x, 2);
			distY = Math.pow(center - corners[c].y, 2);
			distance = Math.sqrt(distX + distY);
			if (distance > radius)
				return false;
		}

		return true;
	},
    
    /**
     * @description Sets up event-handlers to deal with viewport motion
     */
    _setupEventHandlers: function () {
        var self = this;
        this.viewport.domNode.bind('viewport-move', function (e) {
            self.viewportMove();
        });
    }
});

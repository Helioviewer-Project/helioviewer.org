/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var TileLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'TileLayer',
        tileSize: 512,
        source: 'database',
        rootDir: 'tiles/',
        opacity: 1
    },

    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'tilelayer' + Math.floor(Math.random() * 100000 + 1);
        this.tiles = [];

        // Create an HTML container to hold the layer tiles
        this.domNode = new Element('div', {className: 'tile-layer-container', style: 'position: absolute;'});
        
        viewport.movingContainer.appendChild(this.domNode);

		//TEST 09/08/2008 ... can it be handled by viewport alone?
        //this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.tiles = [];

        if (this.imageId) {
        	Debug.output("imageId assigned!");
            this.loadImageProperties();

        } else {
            this.loadClosestImage();
        }
    },

	/**
	 * @function
	 */
    reload: function() {
        this.loadClosestImage();
    },

	/**
	 * @function
	 */
    removeTiles: function () {
        var ix, iy;

        if (this.startIndex) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
                    if (this.tiles[ix][iy]) {
                        //this.tiles[ix][iy].remove();
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }
    },

	/**
	 * @function
	 */
    reset: function () {
        var i, j;

		// Remove tiles in cache
        this.removeTiles();

		// Number of tiles that fit within the viewport
        this.numTiles = {
            x: Math.ceil(this.viewport.dimensions.width / this.tileSize),
            y: Math.ceil(this.viewport.dimensions.height / this.tileSize)
        };
        
        //Create a UTC date object to use for determining tilenames
		var date = new Date(this.timestamp * 1000);
		date.toUTCDate();
		this.utcDate = date;
        
        // Reference old tile nodes to remove after new ones are done loading
        var old = [];
        this.domNode.childElements().each(function (tile) {
            old.push(tile);
        });
        
        var numTilesLoaded = 0;

        //TODO: Determine starting indice to check
        var numTiles = 0;
        for (i = -3; i <= 3; i++) {
			for (j = -3; j <= 3; j++) {
				if (this.intersectsViewport(i, j)) {
					var tile = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
					if (!this.tiles[i]) {
	                    this.tiles[i] = [];
	                }
	                if (this.tiles[i][j]) {
	                    //this.viewport.output(this.tiles[i][j]);
	                }
	                this.tiles[i][j] = tile;
	                numTiles++;
	                
	               // Makes sure all of the images have finished downloading before swapping them in
                	Event.observe(this.tiles[i][j], 'load', function(e) {
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

    setImageProperties: function (imageProperties) {
        //Only load image if it is different form what is currently displayed
        if (imageProperties.imageId === this.imageId) {
        	this.fire('obs_time_change', this);
        	return;
        }

        Object.extend(this, imageProperties);

		this.fire('obs_time_change', this);

        //handle opacities for any overlapping images
        this.setInitialOpacity();

        // Let others know layer has been added
        this.fire('change', this);
        this.reset();
     },

    loadImageProperties: function () {
    	Debug.output("LOAD IMAGE PROPERTIES CALLED!");
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        var url = urlPrefix + '?action=getProperties&imageId=' + this.imageId;

        var processResponse = function (transport) {
            this.setImageProperties(transport.responseJSON);
        };
        var trash = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },

    setImage: function (imageId) {
        if (imageId === this.imageId) {
        	return;
        }
        this.imageId = imageId;
        this.loadImageProperties();
        this.reset();
    },

    /**
     * @function setInitialOpacity
     * @description Sets the opacity for the layer, taking into account layers
     *              which overlap one another.
     */
    setInitialOpacity: function () {
    	this.setZIndex(parseInt(this.opacityGroupId));
        var self = this;
        var opacity = 1;
        var counter = 0;

        this.viewport.layers.each (function (layer) {
            if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
                counter++;

                //Do no need to adjust opacity of the first image
                if (counter > 1) {
                    opacity = opacity / counter;
                    layer.domNode.setOpacity(opacity);
                    layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize})
                }
            }
        });
    },

    loadClosestImage: function () {
        var date = this.viewport.controller.date;
        var urlPrefix = this.viewport.controller.imageUrlPrefix;

        var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
        var processResponse = function (transport) {
            this.setImageProperties(transport.responseJSON);
        };
        var xhr = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },

    viewportMove: function (position) {
        var oldStartIndex = this.startIndex;
        var m, newTile; //m = direction to add/remove tiles
        var ix, iy;

        //Keep track of left-most column x tile-index & top-most y tile-index to be displayed
        this.startIndex = this.getStartIndex();

        // has the index of the left / top image changed?
        if (this.startIndex.x !== oldStartIndex.x) {
            var startIx, endIx;
            if (this.startIndex.x > oldStartIndex.x) {
                // case 1: remove left, add right
                startIx = oldStartIndex.x; //startIndexX
                endIx = this.startIndex.x;
                m = 1;
            } else if (this.startIndex.x < oldStartIndex.x) {
                // case 2: remove right, add left
                startIx = this.startIndex.x + this.numTiles.x;
                endIx = oldStartIndex.x + this.numTiles.x;
                m = -1;
            }

            //Iterate over columns from left -> right
            for (ix = startIx; ix < endIx; ix++) {
                //For a single column, from top-> bottom ...
                for (iy = oldStartIndex.y; iy < oldStartIndex.y + this.numTiles.y; iy++) {
                    // removes element from dom-node (if parent DNE.. dom-node does not exist)
                    if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) {
                        $(this.tiles[ix][iy]).remove();
                    }
                    var newIx = ix + m * this.numTiles.x;
                    if (!this.tiles[newIx]) {
                        this.tiles[newIx] = [];
                    }
                    // get the tile HTML element
                    newTile = this.getTile(newIx, iy, this.viewport.zoomLevel);

                    // plug it into the DOM tree
                    this.tiles[newIx][iy] = $(this.domNode.appendChild(newTile));
                    if (this.tiles[ix] && this.tiles[ix][iy]) {
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }

        if (this.startIndex.y !== oldStartIndex.y) {
            var startIy, endIy;
            if (this.startIndex.y > oldStartIndex.y) {
                // remove top, add bottom
                startIy = oldStartIndex.y;
                endIy = this.startIndex.y;
                m = 1;
            } else if (this.startIndex.y < oldStartIndex.y) {
                // remove bottom, add top
                startIy = this.startIndex.y + this.numTiles.y;
                endIy = oldStartIndex.y + this.numTiles.y;
                m = -1;
            }
            for (iy = startIy; iy < endIy; iy++) {
                for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                    if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) {
                        $(this.tiles[ix][iy]).remove();
                    }
                    var newIy = iy + m * this.numTiles.y;
                    newTile = this.getTile(ix, newIy, this.viewport.zoomLevel);
                    this.tiles[ix][newIy] = $(this.domNode.appendChild(newTile));
                    if (this.tiles[ix] && this.tiles[ix][iy]) {
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }
    },
    
    /**
     * @function intersectsViewport
     * @description Determines whether a given tile intersects with the viewport
     * Based off of:
     * http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
     */
     intersectsViewport: function (tileX, tileY) {
     	var ts = this.tileSize;
     	
     	// Tile upper-left and bottom-right coords
    	var tile = this.getTilePixelCoords(tileX, tileY);
    	
    	// Viewport upper-left and bottom-right coords
    	var vp = {
    		top: - this.viewport.prefetch,
    		left: - this.viewport.prefetch,
    		bottom: this.viewport.domNode.getDimensions().height + this.viewport.prefetch,
    		right: this.viewport.domNode.getDimensions().width + this.viewport.prefetch
    	};
    	
    	// Check for intersection
    	return ! ( tile.left   > vp.right
				|| tile.right  < vp.left
				|| tile.top    > vp.bottom
				|| tile.bottom < vp.top
        );
     },
     
    /**
     * @function getTilePixelCoords
     * @description Takes from tile coordinates (e.g. -1,-1) and returns the pixel coordinates of
     *              the tiles upper-left corner.
     */
    getTilePixelCoords: function (x, y) {
    	var offset = this.viewport.getContainerPos();
    	
    	return {
    		top: offset.y + (y * this.tilesize),
    		left: offset.x + (x * this.tilesize),
	   		bottom: offset.y + ((y+1) * this.tilesize),
    		right: offset.x + ((x+1) * this.tilesize)
    	}
    },

    getTileUrl: function (x, y, detector, zoom, imageId) {
        if (imageId === undefined) {
        	imageId = '';
        }
        //Debug.output("x: " + x + ", y: " +y);
		return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&detector=' + detector + '&zoom=' + zoom + '&imageId=' + imageId;
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

   		//if (this.source === "database") {
	        img.src = this.getTileUrl(x, y, this.detector, this.viewport.zoomLevel, this.imageId);
   		//}

   		//else if (this.source === "filesystem") {
		//	img.src = this.getFilePath(x,y);
   		//}
    return img;
  },

  	/**
  	 * @function
  	 * @description Builds a filepath for a given tile
  	 */
	getFilePath: function (x, y) {
		var year =  this.utcDate.getFullYear();
		var month = this.utcDate.getMonth() + 1;
		var day =   this.utcDate.getDate().toString().padLeft('0', 2);
		var hour =  this.utcDate.getHours().toString().padLeft('0', 2);
		var min =   this.utcDate.getMinutes().toString().padLeft('0', 2);
		var sec =   this.utcDate.getSeconds().toString().padLeft('0', 2);
		var obs =   this.observatory;
		var inst =  this.instrument;
		var det =   this.detector;
		var meas =  this.measurement;
		var zoom =  this.viewport.zoomLevel;
		x = x.toString().substr(1).padLeft('0', 2);
		y = x.toString().substr(1).padLeft('0', 2);

		var path = this.rootDir + year + "/" + month + "/" + day + "/" + hour + "/" + obs + "/" + inst + "/" + det + "/" + meas + "/";
		var file = year + "_" + month + "_" + day + "_" + hour + min + sec + "_" + obs + "_" + inst + "_" + det + "_" + meas + "-" + zoom + "-" + x + "-" + y + "." + this.filetype;

		return (path + file);
	}

});

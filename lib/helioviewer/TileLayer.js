/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var TileLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'TileLayer',
        tileSize: 512,
        opacity: 1
    },
    
    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'tilelayer' + Math.floor(Math.random() * 100000 + 1);
        this.tiles = [];

        // create html container to hold layer
        this.domNode = new Element('div', {style: 'position: absolute;'})
        viewport.movingContainer.appendChild(this.domNode);

        this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.tiles = [];

        if (this.imageId) {
            this.loadImageProperties();
        } else {
            this.loadClosestImage();
        }
    },
    
    reload: function() {
        this.loadClosestImage();
    },

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

    reset: function () {
        //Debug.output("TileLayer.reset();");
        
        var ix, iy;
        
        this.removeTiles();
            
        this.numTiles = {
            x: Math.ceil(this.viewport.dimensions.width / this.tileSize) + 1,
            y: Math.ceil(this.viewport.dimensions.height / this.tileSize) + 1
        };
        
        this.startIndex = this.getStartIndex();

        var numTiles = 0;
        
        // Fetch tiles
        for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                var tile = this.getTile(ix, iy, this.viewport.zoomLevel);
                if (!this.tiles[ix]) {
                    this.tiles[ix] = [];
                }
                if (this.tiles[ix][iy]) {
                    //this.viewport.output(this.tiles[ix][iy]);
                }
                this.tiles[ix][iy] = tile;
                numTiles++;
            }
        }

        // Reference old tile nodes to remove after new ones are done loading
        var old = [];
        this.domNode.childElements().each(function (tile) {
            old.push(tile);
        });
        
        var numTilesLoaded = 0;
        
		//jQuery preload
		//jQuery('img.tile').preload({
		//	placeholder:'images/transparent.gif',
		//	notFound:'images/transparent.gif'
		//});

        // Display new tiles
        for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                this.tiles[ix][iy] = $(this.domNode.appendChild(this.tiles[ix][iy]));
                
                //makes sure all of the images have finished downloading before swapping them in
                Event.observe(this.tiles[ix][iy], 'load', function(e){
                    numTilesLoaded++;
                    
                    if (numTilesLoaded == numTiles) {
                        //Debug.output("Finished loading ALL images! (" + numTiles + ") total.");
                        old.each(function (tile) {
                            //TODO: Add timer and check again if tile is removable
                            tile.parentNode && tile.remove();
                        });
                    }
                });
            }
        }
        

    },
    
    setImageProperties: function (imageProperties) {
        //Only load image if it is different form what is currently displayed
        if (imageProperties.imageId === this.imageId) {
        	return;
        }
        Object.extend(this, imageProperties);
        
        //handle opacities for any overlapping images
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
                    //Debug.output("opacity: " + opacity);
                }
            }
        });
        
        // Let others know layer has been added
        this.fire('change', this);
        this.reset();
     },
     
    loadImageProperties: function () {
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
    
    loadClosestImage: function () {
        var date = this.viewport.controller.date;
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        
        // Calculate UTC-offseted time in seconds
        //var utcTime = date.getTime() + (date.getTimezoneOffset() * 60);
        var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
        var processResponse = function (transport) {
        	//alert(transport.responseJSON.imageId);
            this.setImageProperties(transport.responseJSON);
        };
        var trash = new Ajax.Request(url, {
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
    
    getStartIndex: function () {
        var ts = this.tileSize;
        var v = {
            x: this.viewport.currentPosition.x - this.viewport.dimensions.width / 2,
            y: this.viewport.currentPosition.y - this.viewport.dimensions.height / 2,
            w: this.viewport.dimensions.width,
            h: this.viewport.dimensions.height
        };

        var borderIndex = {
            left: Math.floor(v.x / ts),
            right: Math.floor((v.x + v.w) / ts),
            top: Math.floor(v.y / ts),
            bottom: Math.floor((v.y + v.h) / ts)
        };
        
        if (borderIndex.right - borderIndex.left < this.numTiles.x - 1) {
            if ((v.x % ts) < (ts - (v.x + v.w) % ts)) {
                borderIndex.left -= 1;
            }
            else {
                borderIndex.right += 1;
            }
        }
        if (borderIndex.bottom - borderIndex.top < this.numTiles.y - 1) {
            if ((v.y % ts) < (ts - (v.y + v.h) % ts)) {
                borderIndex.top -= 1;
            }
            else {
                borderIndex.bottom += 1;
            }
        }

        return { x: borderIndex.left, y: borderIndex.top };
    },
    
    getTileUrl: function (x, y, zoom, imageId) {
        if (imageId === undefined) {
        	imageId = '';
        }

        return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + imageId;
    },
    
    getFullSize: function () {
        return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
    },
    
    getTile: function (x, y) {
        var tilePos = this.viewport.getContainerRelativeCoordinates(x * this.tileSize, y * this.tileSize);
        var left = tilePos.x;
        var top = tilePos.y;
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
    
        img.src = this.getTileUrl(x, y, this.viewport.zoomLevel, this.imageId);
    return img;
  }

});
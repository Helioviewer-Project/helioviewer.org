/*global Class, $, UIElement, document, Counter,  */
var Layer = Class.create(UIElement, {
    tileSize: 256,
    maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
    minZoomLevel: 10,
    visible: true,

    initialize: function (viewport) {
        this.viewport = viewport;
        var div = document.createElement('div');
        this.domNode = $(viewport.movingContainer.appendChild(div));
        this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.tiles = [];
        this.id = 'layer' + Counter.getNext.layer;
    },
    
    setZIndex: function (v) {
        this.domNode.setStyle({ zIndex: v });
    },
    
    getStartIdx: function () {
        var ts = this.tileSize;
        var v = {
            x: this.viewport.currentPosition.x - this.viewport.dimensions.width / 2,
            y: this.viewport.currentPosition.y - this.viewport.dimensions.height / 2,
            w: this.viewport.dimensions.width,
            h: this.viewport.dimensions.height
        };

        var borderIdx = {
            left: Math.floor(v.x / ts),
            right: Math.floor((v.x + v.w) / ts),
            top: Math.floor(v.y / ts),
            bottom: Math.floor((v.y + v.h) / ts)
        };
        
        if (borderIdx.right - borderIdx.left < this.numTiles.x - 1) {
            if ((v.x % ts) < (ts - (v.x + v.w) % ts)) {
                borderIdx.left -= 1;
            }
            else {
                borderIdx.right += 1;
            }
        }
        if (borderIdx.bottom - borderIdx.top < this.numTiles.y - 1) {
            if ((v.y % ts) < (ts - (v.y + v.h) % ts)) {
                borderIdx.top -= 1;
            }
            else {
                borderIdx.bottom += 1;
            }
        }

        return { x: borderIdx.left, y: borderIdx.top };
    },
        
    viewportMove: function (position) {
        var oldStartIdx = this.startIdx;
        var m, newTile;
        var ix, iy;
        
        this.startIdx = this.getStartIdx();
		//if (this.startIdx.x != oldStartIdx.x || this.startIdx.y != oldStartIdx.y)
		//    this.viewport.output(Math.random() + 'tiles: move ' + position.x + ',' + position.y);
        
        // has the index of the left / top image changed?
        if (this.startIdx.x !== oldStartIdx.x) {
            var startIx, endIx;
            if (this.startIdx.x > oldStartIdx.x) {
                // remove left, add right
				//this.viewport.output('remove left, add right: ' + oldStartIdx.x + ' -> ' + this.startIdx.x);
                startIx = oldStartIdx.x; // Max(this.startIdx.x - this.numTiles.x , oldStartIdx.x) ?
                endIx = this.startIdx.x;    
                m = 1;
            } else if (this.startIdx.x < oldStartIdx.x) {
                // remove right, add left
				//this.viewport.output('remove right, add left: ' + this.startIdx.x + ',' + this.startIdx.y);
                startIx = this.startIdx.x + this.numTiles.x;
                endIx = oldStartIdx.x + this.numTiles.x;
                m = -1;
            }

            for (ix = startIx; ix < endIx; ix++) {
                for (iy = oldStartIdx.y; iy < oldStartIdx.y + this.numTiles.y; iy++) {
                    if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) {
                    	$(this.tiles[ix][iy]).remove();
                    }
                    var newIx = ix + m * this.numTiles.x;
                    if (!this.tiles[newIx]) {
                    	this.tiles[newIx] = [];
                    }
                    newTile = this.getTile(newIx, iy, this.viewport.zoomLevel);
                    this.tiles[newIx][iy] = $(this.domNode.appendChild(newTile)); 
                    if (this.tiles[ix] && this.tiles[ix][iy]) {
                    	delete this.tiles[ix][iy];
                    }
                }
            }
        }

        if (this.startIdx.y !== oldStartIdx.y) {
            var startIy, endIy;
            if (this.startIdx.y > oldStartIdx.y) {
                // remove top, add bottom
                startIy = oldStartIdx.y;
                endIy = this.startIdx.y;
                m = 1;
            } else if (this.startIdx.y < oldStartIdx.y) {
                // remove bottom, add top
                startIy = this.startIdx.y + this.numTiles.y;
                endIy = oldStartIdx.y + this.numTiles.y;
                m = -1;
            }
            for (iy = startIy; iy < endIy; iy++) {
                for (ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
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

    removeTiles: function () {
    	var ix, iy;
    	
        // remove old Tiles (only when loading complete?)
        this.domNode.childElements().each(function (tile) {
        	tile.remove();
        });
        if (this.startIdx) {
            for (ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
                for (iy = this.startIdx.y; iy < this.startIdx.y + this.numTiles.y; iy++) {
                    if (this.tiles[ix][iy]) {
                        //this.tiles[ix][iy].remove();
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }    
    },

    reload: function () {
        this.resetTiles();
    },

    resetTiles: function () {
    	var ix, iy;
    	
		//this.viewport.output(Math.random() + 'resetting tiles');
        this.removeTiles();
            
        this.numTiles = {
            x: Math.ceil(this.viewport.dimensions.width / this.tileSize) + 1,
            y: Math.ceil(this.viewport.dimensions.height / this.tileSize) + 1
        };
        
        this.startIdx = this.getStartIdx();
    
	    // Add tiles
	    for (iy = this.startIdx.y; iy < this.startIdx.y + this.numTiles.y; iy++) {
	    	for (ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
	        	var tile = this.getTile(ix, iy, this.viewport.zoomLevel);
		        if (!this.tiles[ix]) {
		        	this.tiles[ix] = [];
		        }
		        if (this.tiles[ix][iy]) {
		        	this.viewport.output(this.tiles[ix][iy]);
		        }
		        this.tiles[ix][iy] = $(this.domNode.appendChild(tile));
	        }
	    }
    },
  
    setVisible: function (visible) {
	    this.visible = visible;
	    this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
	    return this.visible;
    },
  
    toggleVisible: function () {
	    return this.setVisible(!this.visible);
    }
});
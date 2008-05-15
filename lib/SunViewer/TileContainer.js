/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class The TileContainer class manages the placing of the image tiles.
 */
/*global document, Class, $, $A, $H, Element, Event, Effect, Debug, Tile, Draggable, TileLayerProvider, DomNodeCache, OverlayCollection, numberOfTileLayers, numberOfMarkerLayers, AjaxRequestWrapper, Option */
var TileContainer = Class.create();

TileContainer.prototype = Object.extend({
	// Default options
	defaultOptions: $H({
		tileSize: 256,
		cols: 0,
		rows: 0,
		index: 0,
		numOverlayLayerProviders: 0,
		debug: false,
		oneTileSunZoomLevel: 12 //smallest zoomLevel where sun fits on a single tile
		
	}),

	/**
	 * @constructor
	 * @param {ViewPort} viewport	The viewport containing the TileContainer.
	 * @param {Hash} options		Available options: tileSize: Number, debug: Boolean
	 */
	initialize: function (viewport, options) {
		this.viewport = viewport;
		this.zIndex = viewport.tileContainers.topZindex() + 1;
		
		//Create Closure
		var container = this;
		
		// TODO: Make this a collection class
		this.tileLayerProviders = Object.extend($A([]), {
			add: function (tileLayer) {
				tileLayer.index = this.length;
				this.push(tileLayer);
				document.layerAdded.fire(tileLayer);
				document.layerPrepared.fire(tileLayer); 
			},
			
			remove: function (tileLayer) {
				//Debug.output("remove tiles");
				// TODO: Maybe rearrange tile layers zIndexes...
				this[tileLayer.index] = null;
                document.layerRemoved.fire(tileLayer);				
			},
			
			topZindex: function () {
				var compact = this.compact();
				return compact.length > 0 ? compact.last().zIndex : 0;
			},
			
			bottomZindex: function () {
				//Debug.output("bottom z index tiles");
				var compact = this.compact();
				return compact.length > 0 ? compact.first().zIndex : 0;
			},
			
			exchange: function (tileLayer1, tileLayer2) {
				//Debug.output("exchange tiles");
				var temp = tileLayer1.index;
				tileLayer1.index = tileLayer2.index;
				tileLayer2.index = temp;
				this[tileLayer1.index] = tileLayer1;
				this[tileLayer2.index] = tileLayer2;
			
				//Debug.output(tileLayer1.type, tileLayer1.zIndex);
				//Debug.output(tileLayer2.type, tileLayer2.zIndex);
				
				temp = tileLayer1.zIndex;
				tileLayer1.zIndex = tileLayer2.zIndex;
				tileLayer2.zIndex = temp;
				tileLayer1.setStyle({ zIndex: tileLayer1.zIndex });
				tileLayer2.setStyle({ zIndex: tileLayer2.zIndex });
				
				//Debug.output(tileLayer1.type, tileLayer1.zIndex);
				//Debug.output(tileLayer2.type, tileLayer2.zIndex);
			},
						
			moveDown: function (index) {
				//Debug.output("movedown tiles");
				var index2 = this.previousIndex(index);
				if (index2 >= 0) {
					this.exchange(this[index], this[index2]);
				}
			},
			
			moveUp: function (index) {
				//Debug.output("moveup tiles");
				var index2 = this.nextIndex(index);
				if (index2 >= 0) {
					this.exchange(this[index], this[index2]);
				}
			},
			
			previous: function (tileLayerProvider) {
				//Debug.output("previos tiles");
				return this[this.previousIndex(tileLayerProvider.index)];
			},			
			
			next: function (tileLayerProvider) {
				//Debug.output("next tiles");
				return this[this.nextIndex(tileLayerProvider.index)];
			},
			
			previousIndex: function (index) {
				//Debug.output("previous index");
				if (index <= 0) {
				    return -1;
				}
				for (var i = index - 1; i >= 0 && this[i] === null; i--) {}
				return i;
			},
			
			nextIndex: function (index) {
				//Debug.output("next index");
				if (index >= this.length) {
				    return -1;
				}
				for (var i = index + 1; i < this.length && this[i] === null; i++) {}
				return (i >= this.length ? -1 : i);			
			}
		});
		
		document.updateTiles.subscribe(this.onUpdateTiles, this, true);
		document.observe('viewport:move', this.onMove.bindAsEventListener(this));

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);

		// TODO: Create well DOM node at run-time
		var div = new Element('div', {'class': 'tileContainer'});
		div.setStyle({zIndex: this.zIndex });
		this.domNode = viewport.domNode.down('.well').appendChild(div);

		// TODO: Create Tile Collection class
		this.tiles = Object.extend($A([]), {
			refresh: function () {
				this.each(function (col) {
				    col.invoke('assignLayers');
				});
				return this;
            },
			
			// remove all tiles from the container
			/** NOT USED...
			removeElements: function () {
				Debug.output("remove elemenets tiles");
				for (var c = 0; c < this.length; c++) {
					for (var r = 0; r < this[c].length; r++) {
						for (var child = tile.firstChild; child;) {
							var nextChild = child.nextSibling;
							this[c][r].removeChild(child);
							child = nextChild;
						}
					}
				}
			},
			*/
			
			// hide all tiles
			hide: function () {
				//Debug.output("hide tiles");
				this.each(function (col) {
				    col.each(function (tile) {
				        $(tile.domNode).hide();
				    });
				});
				return this;
			},
			
			// show all tiles
			show: function () {
				//Debug.output("show tiles");
				this.each(function (col) {
				    col.each(function (tile) {
				        $(tile.domNode).show();
				    });
				});
				return this;
			}

		});

		// Not using cache (see assignTile())			
		//this.tileCache = new TileCache();
		
		this.prepareTiles().positionTiles(null, true);
		this.viewport.tileContainers.add(this);
	},
	
	/**
	 * @method assignTile	Assigns all layers to the given tile.
	 * @param {Tile} tile	The tile to assign.	
	 */
	assignTile: function (tile) {
		//Debug.output("assign tiles");
		// NOTE: Using a cache on the Tile level seems like a good idea, but it
		// poses some problems. Whenever a single layer changes its image, all 
		// the cached tiles become invalid. It is not easy to just replace this
		// layer in the cached tiles and it doesn't make much sense too. Thus, 
		// caching is done on the layer level.
		var useCache = false;
		if (useCache && this.tileCache.contains(this.viewport.zoomLevel, tile.xIndex, tile.yIndex)) {
			var tileDiv = this.tileCache.get(this.viewport.zoomLevel, tile.xIndex, tile.yIndex);
			var tileSize = this.tileSize;
			if (tileDiv.style && (tileDiv.style.width !== this.tileSize || tileDiv.style.height !== this.tileSize)) {
				tileDiv.setStyle({
					width: tileSize + 'px',
					height: tileSize + 'px'
				});

				$A($(tileDiv.getElementsByTagName('img'))).each(function (img) {
					img.width = tileSize;
					img.height = tileSize;
				});
			}
			tile.position(tileDiv);
			tile.domNode.parentNode.replaceChild(tileDiv, tile.domNode);
			tile.domNode = tileDiv;
		} else {
			document.tileLayerAdded.fire(tile);
			if (useCache) {
			    this.tileCache.add(tile.domNode, this.viewport.zoomLevel, tile.xIndex, tile.yIndex);
			}
		}
		return this;
	},
	
	/**
	 * @function getOptimalZoomLevel	Returns the highest possible zoom level at which the complete image still fits in the viewport.
	 * @return {Number}				    The zoom level.
	 */
	getOptimalZoomLevel: function () {
		//Debug.output("getoptimalzoomlevel tiles");
		// calculate the zoom level based on what fits best in window
		var zoomLevel = -1;
		var fullSize = this.tileSize / 2;
		do {
			zoomLevel += 1;
			fullSize *= 2;
		} while (fullSize < Math.max(this.viewport.dimensions.width, this.viewport.dimensions.height));

		return zoomLevel - 1;
	},
		
	/**
	 * @function getFullSize	Returns the full size of the tiled image.
	 * @return {Number}		    The size.
	 */
	getFullSize: function () {
		//Debug.output("getfullsize tiles");
		var offset = this.oneTileSunZoomLevel - this.viewport.zoomLevel;
		var power = (offset >= 0 ? offset : 0);
		//Debug.output("getFullsize tiles: " + this.tileSize * Math.pow(2, power));
		return this.tileSize * Math.pow(2, power);
	},

	// NOTE: Maybe move the next functions to the tiles array
	// or create a tile collection class that replaces it

	/**
	 * TODO: move to tiles
	 * @function reloadTileLayer  Reloads one specific layer of each tile.
	 * @param {TileLayerProvider} tileLayerProvider	The layer to reload.
	 */
	reloadTileLayer: function (tileLayerProvider) {
		//Debug.output("reloadtilelayer tiles");
		this.tiles.flatten().each(function (tile) {
			tile.assignLayer(tileLayerProvider);
		});
	},
	
	/**
	 * TODO: move to tiles
	 * @method prepareTiles		Creates and sets up the tiles.
	 */
	prepareTiles: function () {
		//Debug.output("prepare tiles");
		this.tiles.clear();

		this.rows = Math.ceil(this.viewport.dimensions.height / this.tileSize) + 1;
		this.cols = Math.ceil(this.viewport.dimensions.width / this.tileSize) + 1;

		for (var c = 0; c < this.cols; c++) {
			var tileCol = $A([]);

			for (var r = 0; r < this.rows; r++) {
				/**
				 * element is the DOM element associated with this tile
				 * posx/posy are the pixel offsets of the tile
				 * xIndex/yIndex are the index numbers of the tile segment
				 * qx/qy represents the quadrant location of the tile
				 */
				var tile = new Tile(this, {
					posx: 0,
					posy: 0,
					xIndex: c,
					yIndex: r,
					qx: c,
					qy: r
				});

				tileCol.push(tile);
			}
		
			this.tiles.push(tileCol);
		}
		return this;
	},

	/**
	 * TODO: move to tiles (and/or Tile)
	 * @method positionTiles			Positions the tiles.
	 * @param {Hash} motion				The amount of movement relative to the viewport position.
	 * @param {Boolean} positionOnly	Only position tiles and don't reload them if they "go over the edge".
	 */
	 //ALSO RESPONSIBLE FOR CENTERING!
	positionTiles : function (motion, positionOnly) {
		//Debug.output("position tiles");
		// default to no motion, just setup tiles
		if (!motion) {
			motion = { x: 0, y: 0 };
		}

		var tilesSumWidth = this.tiles.length * this.tileSize;
		//var tilesSumHeight = this.tiles[0].length * this.tileSize;
	    var tilesSumHeight = this.tiles.length * this.tileSize;
	    
		var fullSize = this.getFullSize();

		for (var c = 0; c < this.tiles.length; c++) {
			for (var r = 0; r < this.tiles[c].length; r++) {
				var tile = this.tiles[c][r];
				tile.posx = (tile.xIndex * this.tileSize) + this.viewport.position.x + motion.x - fullSize / 2;
				tile.posy = (tile.yIndex * this.tileSize) + this.viewport.position.y + motion.y - fullSize / 2;
				//Debug.output ("tile.posx: " + tile.posx + "tile.posy: " + tile.posy);

				var redraw = false;
				
				// Tile has moved out to the left => move it to the right edge
				while (-tile.posx - this.tileSize > tile.posx + tilesSumWidth - this.viewport.dimensions.width) {
					tile.xIndex += this.tiles.length;
					tile.posx += tilesSumWidth;
					redraw = true;
				}
				// Tile has moved out to the right => move it to the left edge
				while (tile.posx - this.viewport.dimensions.width > -(tile.posx - tilesSumWidth) - this.tileSize) {
					tile.xIndex -= this.tiles.length;
					tile.posx -= tilesSumWidth;
					redraw = true;					
				}
				// Tile has moved out to the top => move it to the bottom edge
				while (-tile.posy - this.tileSize > tile.posy + tilesSumHeight - this.viewport.dimensions.height) {
					tile.yIndex += this.tiles[c].length;
					tile.posy += tilesSumHeight;
					redraw = true;
				}
				// Tile has moved out to the bottom => move it to the top edge
				while (tile.posy - this.viewport.dimensions.height > -(tile.posy - tilesSumHeight) - this.tileSize) {
					tile.yIndex -= this.tiles[c].length;
					tile.posy -= tilesSumHeight;
					redraw = true;					
				}

				if (redraw && !positionOnly) {
					tile.assignLayers();
				} else {
					tile.position();
				}
			}
		}
		
		return this;
	},
	
    /**
     * @method onUpdateTiles
     */
    onUpdateTiles: function (type, args) {
        //Debug.output('TC:onUpdateTiles()');
        //this.positionTiles(null, true); //05-01-2008: TEMP FIX...CENTERING PROBLEM
        this.tiles.refresh();    
    },
	
	/**
	 * Move event handler.
	 * @param {Hash} motion				The amount of movement relative to the viewport position.
	 */
	onMove: function (motion) {
		motion = motion.memo;
		//Debug.output("TileContainer.onMove()   motion.x: " + motion.x + ", motion.y: " + motion.y);
		this.positionTiles(motion);
	},

	/**
	 * Image change event handler. (LEGACY)
	 * @param {SunImage} sunImage				The new SunImage object.
	 */
	onImageChange: function (sunImage) {
		//Debug.output("onimagechange tiles");
		this.tiles.removeElements();
		this.tileCache.clear();
	}
});

/*
TODO: Create a TileContainer collection class to replace the ViewPort.tileContainers Array. 

var TileContainerCollection = Class.create();

TileContainerCollection.prototype = Object.extend(
  Object.extend($A([])), {
	initialize: function(viewport, tileContainers) {
		this.viewport = viewport;
		var self = this;
		$(tileContainers).each(function(tileContainer) { self.push(tileContainer); });
	}
  }
)

TODO: Create a Tile collection class to replace the TileContainer.tiles Array.
*/

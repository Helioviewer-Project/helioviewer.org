/*global Class, Object, $, UIElement, ViewportHandlers, Builder */
var Viewport = Class.create(UIElement, {
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		tileSize: 512,
		debug: true,
		prefetch: 512  //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	dimensions: { width: 0, height: 0 },

	/**
	 * @constructor
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.domNode =   $(this.id);
		this.outerNode = $(this.id + '-container-outer');
		this.controller = controller;
		this.layers = $A([]);
		this.ViewportHandlers = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

		// Determine center of viewport
		var center = this.getCenter();

		//create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.domNode.appendChild(Builder.node('div', {className: 'movingContainer'})));
		this.movingContainer.setStyle({'left': center.x + 'px', 'top': center.y + 'px'});

		//For Debugging purposes only
		if (this.debug) {
			this.movingContainer.setStyle({'border': '1px solid red'});
			
			var centerBox = new Element('div', {style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
			centerBox.setStyle({'left': (center.x -25) + 'px', 'top': (center.y -25) + 'px'});
			this.domNode.insert(centerBox);
		}

		//resize to fit screen
		this.resize();
	},
	
	/**
	 * @function center Center the viewport.
	 */
	center: function () {
		var center = this.getCenter();
		this.moveTo(center.x, center.y);
	},

	/**
	 * @function moveTo Move the viewport focus to a new location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */
	moveTo: function (x, y) {
		Debug.output("moveTo");
		
		this.movingContainer.setStyle({
			left: x + 'px',
			top:  y + 'px'    
		});
		
		this.checkTiles(false);
		this.fire('move', { x: x, y: y });
	},

	/**
	 * @function moveBy Shift in the viewport location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */   
	moveBy: function (x, y) {
		Debug.output("moveBy: " + x + ", " + y);
		
		var pos = {
			x: this.startMovingPosition.x - x,
			y: this.startMovingPosition.y - y
		};
		
		Debug.output("pos: " + pos.x + ", " + pos.y);
		
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
		this.checkTiles(false);
		this.fire('move', { x: pos.x, y: pos.y });
	},
	
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @function getCenter
	 * @description Get the coordinates of the viewport center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth() / 2),
			y: Math.round(this.domNode.getHeight() / 2)
		}
	},
	
	/**
	 * @function getContainerPos
	 * @description Get the current coordinates of the moving container
	 */
	getContainerPos: function () {
		return {
			x: parseInt(this.movingContainer.getStyle('left')),
			y: parseInt(this.movingContainer.getStyle('top'))
		}
	},
	
	/**
	 * @function currentPosition
	 * @description Alias for getContainerPos function
	 */
	currentPosition: function () {
		return this.getContainerPos();
	},

	/**
	 * @function endMoving
	 * @description Event handler fired after dragging
	 */
	endMoving: function () {
	},

	/**
	 * @function checkTiles
	 * @description Determine which tiles lie in the viewport, and thus should be loaded.
	 *              Each individual tile layer can then check to see if any new tiles
	 *              need to be loaded.
	 */
	checkTiles: function (checkAll) {
		var i, j;

		// When rescaning entire tileset, first clear the array
		if (checkAll) {
			this.visible = [];
		}

		var vp = this.getViewportPixelCoords();
		
		var max = Math.sqrt(this.getMaxTiles()) / 2;
		
		// Limit to 64 tiles for now for scalability
		max = Math.min(4, max);
		
		Debug.output("VP Max: " + max);

		for (i = -max; i <= max -1; i++) {
			for (j = -max; j <= max -1; j++) {
				if (!this.visible[i]) {
					this.visible[i] = [];
				}
				
				// To save time during partial checks, only check tiles who haven't yet been loaded
				if (!this.visible[i][j]) {
					if (this.intersectsViewport(vp, i, j)) {
						this.visible[i][j] = true;
					}
					else {
						this.visible[i][j] = false;
					}
				}
			}
		}
	},
	
	/**
	 * @function getMaxTiles
	 * @description Similar to the TileLayer function "getNumTiles," except that each
	 *              tile layer is checked, and the number of tiles for the largest
	 *              layer is returned.
	 * @see TileLayer.getNumTiles
	 */
	getMaxTiles: function () {
		var highestNaturalZoom = 0; //The zoom-level at which for all levels lower, more than four tiles are required
		
		this.layers.each(function (tl) {
			var naturalZoom = parseInt(tl.lowestRegularZoom);
			if (naturalZoom > highestNaturalZoom) {
				highestNaturalZoom = naturalZoom;
			}
		});
		
		var diff = highestNaturalZoom - this.zoomLevel;
		
		if (highestNaturalZoom == 0) {
			Debug.output("Error: No layers! See Viewport.getMaxTiles.");
		}
		
		return Math.max(4, Math.pow(4, 1 + diff));
	},
	
	/**
	 * @function intersectsViewport
	 * @description Determines whether a given tile intersects with the viewport
	 * Based off of:
	 * http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
	 */
	intersectsViewport: function (vp, tileX, tileY) {
		var ts = this.tileSize;

		// Tile upper-left and bottom-right coords
		var tile = this.getTilePixelCoords(tileX, tileY);

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
		var offset = this.getContainerPos();

		return {
			top: offset.y + (y * this.tilesize),
			left: offset.x + (x * this.tilesize),
			bottom: offset.y + ((y+1) * this.tilesize),
			right: offset.x + ((x+1) * this.tilesize)
		}
	},

	/**
	 * @function getViewportPixelCoords
	 * @description Returns the coordinates of the upper-left and bottom-right corners of the viewport.
	 */
	getViewportPixelCoords: function () {
		var dimensions = this.domNode.getDimensions();

		return {
			top:  - this.prefetch,
			left: - this.prefetch,
			bottom: dimensions.height + this.prefetch,
			right:  dimensions.width + this.prefetch
		}
	},

	zoomTo: function (zoomLevel) {
		Debug.output("zoomTo: " + zoomLevel);
		this.zoomLevel = zoomLevel;

		// reset the layers
		this.resetLayers();
	},

	resize: function () {
		// get dimensions
		var oldDimensions = this.dimensions;

		//Update viewport height
		var viewportOuter =  this.outerNode;
		viewportOuter.setStyle ({height: document.viewport.getHeight() - this.headerAndFooterHeight + 'px'});

			this.dimensions = this.domNode.getDimensions();
			
			this.dimensions.width += this.prefetch;
			this.dimensions.height += this.prefetch;
			
			if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
				if (this.layers.length > 0) {
					this.resetLayers();
				}
			}
	},
	
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	reload: function () {
		this.layers.each(function (layer) {
			layer.reload();
		});
	},

	/**
	 * @function reset
	 * @description Reloads each of the tile layers
	 */
	resetLayers: function () {
		var self = this;
		this.checkTiles(true);
				
		this.layers.each(function (layer) {
			layer.reset(self.visible);
		});
	}
});

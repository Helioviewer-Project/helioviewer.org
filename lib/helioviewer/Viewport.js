/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @class Viewport
 * 
 *	Required Parameters:
 * 		zoomLevel	- The default zoomlevel to display (should be passed in from Helioviewer).
 * 		headerId	- Helioviewer header section id.
 *		footerId	- Helioviewer footer section id.
 *		tileSize	- Size of tiles.
 *		debug		- Display additional information for debugging purposes.
 *		prefetch	- The radius outside of the visible viewport to prefetch.
 */
var Viewport = Class.create(UIElement, {
	/**
		This is a Viewport class.
		@name Viewport
		@class Viewport
		@scope Viewport.prototype
	*/ 
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		tileSize:  512,
		minHeight: 450,
		debug:     false,
		prefetch:  0  //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	dimensions: { width: 0, height: 0 },

	/**
	 * @constructor
	 * @memberOf Viewport
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.domNode            = $(this.id);
		this.innerNode          = $(this.id + '-container-inner');
		this.outerNode          = $(this.id + '-container-outer');
		this.controller         = controller;
		this.mouseCoords        = "disabled";
		this.ViewportHandlers   = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

		// Resize to fit screen
		this.resize();
		
		// Determine center of viewport
		var center = this.getCenter();
		
		// Create a container to limit how far the layers can be moved
		this.sandbox = $(this.domNode.appendChild(Builder.node('div', {className: 'sandbox'})));
		this.sandbox.setStyle({'position': 'absolute', 'width': '0px', 'height': '0px', 'left': center.x + 'px', 'top': center.y + 'px'});
		
		// Create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.sandbox.appendChild(Builder.node('div', {className: 'movingContainer'})));
		this.movingContainer.setStyle({'left': 0, 'top': 0});

		// For Debugging purposes only
		if (this.debug) {
			this.movingContainer.setStyle({'border': '1px solid red'});
			
			var centerBox = new Element('div', {id: 'vp-debug-center', style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
			centerBox.setStyle({'left': (center.x -25) + 'px', 'top': (center.y -25) + 'px'});
			this.domNode.insert(centerBox);
		}
	},
	
	/**
	 * @memberOf Viewport
	 * @function
	 * @name center
	 * @description Centers the viewport.
	 */
	center: function () {
		//var center = this.getCenter();
		var sb = this.sandbox.getDimensions();
		
		this.moveTo(0.5 * sb.width, 0.5 * sb.height);
	},

	/**
	 * @memberOf Viewport
	 * @function moveTo Move the viewport focus to a new location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */
	moveTo: function (x, y) {
		this.movingContainer.setStyle({
			left: x + 'px',
			top:  y + 'px'    
		});
		
		this.checkTiles();
		this.fire('move', { x: x, y: y });
	},

	/**
	 * @function moveBy Shift in the viewport location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */   
	moveBy: function (x, y) {
		// Sandbox dimensions
		var sandbox = this.sandbox.getDimensions();
		
		var pos = {
			x: Math.min(Math.max(this.startMovingPosition.x - x, 0), sandbox.width),
			y: Math.min(Math.max(this.startMovingPosition.y - y, 0), sandbox.height)
		};
		
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
		this.checkTiles();
		this.fire('move', { x: pos.x, y: pos.y });
	},
	
	/**
	 * @function startMoving
	 * @description Event-handler for a mouse-drag start.
	 */
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @function getCenter
	 * @description Get the coordinates of the viewport center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth()  / 2),
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
	 * @function helioCenter
	 * @description Another alias for getContainerPos. Returns the pixel coorindates
	 *              of the HelioCenter relative to the viewport top-left corner.
	 */
	helioCenter: function () {
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
	 * @description Algorithm for determining which tiles should be displayed at
	 *              a given time. Uses the Heliocentric coordinates of the viewport's
	 *              TOP-LEFT and BOTTOM-RIGHT corners to determine range to display.
	 */
	checkTiles: function() {
		this.visible = [];
		
		var indices = this.displayRange();
		
		// Update visible array
		for (i = indices.xStart; i <= indices.xEnd; i++) {
			for (j = indices.yStart; j <= indices.yEnd; j++) {
				if (!this.visible[i]) {
					this.visible[i] = [];
				}
				this.visible[i][j] = true;
			}
		}
	},
	
	/**
	 * updateSandbox - Update the size and location of the movement-constraining box.
	 */
	updateSandbox: function () {
		this.dimensions   = this.domNode.getDimensions();
		var maxDimensions = this.controller.layerManager.getMaxDimensions();
		var old           = this.sandbox.getDimensions();
		var center        = this.getCenter();
		
		// New sandbox dimensions
		var newSize = {
			width : Math.max(0, maxDimensions.width  - this.dimensions.width),
			height: Math.max(0, maxDimensions.height - this.dimensions.height)
		};
		
		if (this.debug) {
			$('vp-debug-center').setStyle({'left': center.x - 25 + 'px', 'top': center.y - 25 + 'px'});
		}
	
		// Difference
		var change = {
			x: newSize.width  - old.width,
			y: newSize.height - old.height
		};
		
		// Initial moving container position
		var movingContainerOldPos = this.movingContainer.positionedOffset();	
		
		// Update sandbox dimensions
		this.sandbox.setStyle({
			width  : newSize.width  + 'px',
			height : newSize.height + 'px',
			left   : center.x - (0.5 * newSize.width) + 'px',
			top    : center.y - (0.5 * newSize.height)  + 'px'			
		});
		
		// Update moving container position
		var newHCLeft = Math.max(0, Math.min(newSize.width,  movingContainerOldPos[0] + (0.5 * change.x)));
		var newHCtop  = Math.max(0, Math.min(newSize.height, movingContainerOldPos[1] + (0.5 * change.y)));
		
		this.movingContainer.setStyle({
			left: newHCLeft + 'px',
			top : newHCtop  + 'px'
		});
	},
	
	/**
	 * @function displayRange
	 * @description Returns the range of indices for the tiles to be displayed.
	 */
	displayRange: function () {
		// Get heliocentric viewport coordinates
		var vp = this.getHCViewportPixelCoords();
		
		// Expand to fit tile increment
		var ts = this.tileSize;
		vp = {
			top:    vp.top    - ts - (vp.top % ts),
			left:   vp.left   - ts - (vp.left % ts),
			bottom: vp.bottom + ts - (vp.bottom % ts),
			right:  vp.right  + ts - (vp.right %ts)
		}
		
		// Indices to display (one subtracted from ends to account for "0th" tiles).
		this.visibleRange = {
			xStart: vp.left   / ts,
			xEnd:   (vp.right  / ts) -1,
			yStart: vp.top    / ts,
			yEnd:   (vp.bottom / ts) -1
		}
		
		return this.visibleRange;
	},

	/**
	 * @function getHCViewportPixelCoords
	 * @description Returns the heliocentric coordinates of the upper-left and bottom-right
	 *              corners of the viewport.
	 */
	getHCViewportPixelCoords: function () {
		var sb = this.sandbox.positionedOffset();
		var mc = this.movingContainer.positionedOffset();
		var vpDimensions = this.domNode.getDimensions();
		
		return {
			left:  -(sb[0] + mc[0]),
			top :  -(sb[1] + mc[1]),
			right:  vpDimensions.width  - (sb[0] + mc[0]),
			bottom: vpDimensions.height - (sb[1] + mc[1])
		};
	},

	/**
	 * @function zoomTo
	 * @description Zooms To a specified zoom-level.
	 */
	zoomTo: function (zoomLevel) {
		this.zoomLevel = zoomLevel;
		
		// reset the layers
		this.checkTiles();
		this.controller.layerManager.resetLayers(this.visible);
	
		// update sandbox
		this.updateSandbox();
		
		// store new value
		this.controller.userSettings.set('zoom-level', zoomLevel);
	},

	/**
	 * @function resize
	 * @description Adjust viewport dimensions when window is resized.
	 */
	resize: function () {
		// Get dimensions
		var oldDimensions = this.dimensions;
		
		// Ensure minimum height
		var h = Math.max(this.minHeight, document.viewport.getHeight() - this.headerAndFooterHeight);

		//Update viewport height
		var viewportOuter =  this.outerNode;
		viewportOuter.setStyle ({height: h + 'px'});

			this.dimensions = this.domNode.getDimensions();
			
			this.dimensions.width  += this.prefetch;
			this.dimensions.height += this.prefetch;
			
			if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
				if (this.controller.layerManager.layers.length > 0) {
					this.updateSandbox();
					this.checkTiles();
					this.controller.layerManager.resetLayers(this.visible);
				}
			}
	}
});

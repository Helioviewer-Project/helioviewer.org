/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see ViewportHandlers
 */
/*global Class, UIElement, $, Builder, Element, ViewportHandlers, document */
var Viewport = Class.create(UIElement, 
	/** @lends Viewport.prototype */
	{
	/**
	 * @description Default Viewport settings
	 * 
	 * @param {Int} prefetch Prefetch any tiles that fall within this many pixels outside the physical viewport
	 */ 
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		tileSize:  512,
		minHeight: 450,
		debug:     false,
		prefetch:  0
	},
	isMoving: false,
	dimensions: { width: 0, height: 0 },

	/**
	 * @constructs
	 * @description Creates a new Viewport
	 * @param {Object} controller A Reference to the Helioviewer application class
	 * @param {Object} options Custom Viewport settings
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>zoomLevel</b> - The default zoomlevel to display (should be passed in from Helioviewer).<br>
	 *		<b>headerId</b>  - Helioviewer header section id.<br>
	 *		<b>footerId</b>	 - Helioviewer footer section id.<br>
	 *		<b>tileSize</b>	 - Size of tiles.<br> 
	 *		<b>debug</b>     - Display additional information for debugging purposes.<br>
	 *		<b>prefetch</b>	 - The radius outside of the visible viewport to prefetch.<br>
	 * </div>
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		
		var center, centerBox;

		this.domNode            = $(this.id);
		this.innerNode          = $(this.id + '-container-inner');
		this.outerNode          = $(this.id + '-container-outer');
		this.controller         = controller;
		this.mouseCoords        = "disabled";
		this.viewportHandlers   = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4 + 30;

		// Resize to fit screen
		this.resize();
		
		// Determine center of viewport
		center = this.getCenter();
		
		// Create a container to limit how far the layers can be moved
		this.sandbox = $(this.domNode.appendChild(Builder.node('div', {id: 'sandbox'})));
		this.sandbox.setStyle({'position': 'absolute', 'width': '0px', 'height': '0px', 'left': center.x + 'px', 'top': center.y + 'px'});
		
		// Create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.sandbox.appendChild(Builder.node('div', {id: 'moving-container'})));
		this.movingContainer.setStyle({'left': 0, 'top': 0});

		// For Debugging purposes only
		if (this.debug) {
			this.movingContainer.setStyle({'border': '1px solid red'});
			
			centerBox = new Element('div', {id: 'vp-debug-center', style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
			centerBox.setStyle({'left': (center.x - 25) + 'px', 'top': (center.y - 25) + 'px'});
			this.domNode.insert(centerBox);
		}
	},
	
	/**
	 * @description Centers the viewport.
	 */
	center: function () {
		//var center = this.getCenter();
		var sb = this.sandbox.getDimensions();
		
		this.moveTo(0.5 * sb.width, 0.5 * sb.height);
	},

	/**
	 * @description Move the viewport focus to a new location.
	 * @param {Int} x X-value
	 * @param {Int} y Y-value
	 */
	moveTo: function (x, y) {
		this.movingContainer.setStyle({
			left: x + 'px',
			top:  y + 'px'    
		});
        // Check throttle
        if (this.viewportHandlers.moveCounter === 0)
    		this.fire('viewport-move');
            
	},

	/**
	 * @description Moves the viewport's focus
	 * @param {Int} x X-value
	 * @param {Int} y Y-value
	 */   
	moveBy: function (x, y) {
		// Sandbox dimensions
		var sandbox = this.sandbox.getDimensions(),
		
		pos = {
			x: Math.min(Math.max(this.startMovingPosition.x - x, 0), sandbox.width),
			y: Math.min(Math.max(this.startMovingPosition.y - y, 0), sandbox.height)
		};
		
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
        // Check throttle
        if (this.viewportHandlers.moveCounter === 0)
    		this.fire('viewport-move');
	},
	
	/**
	 * @description Event-handler for a mouse-drag start.
	 */
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @description Get the coordinates of the viewport center
	 * @returns {Object} The X & Y coordinates of the viewport's center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth()  / 2),
			y: Math.round(this.domNode.getHeight() / 2)
		};
	},
	
	/**
	 * @description Get the current coordinates of the moving container
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	getContainerPos: function () {
		return {
			x: parseInt(this.movingContainer.getStyle('left'), 10),
			y: parseInt(this.movingContainer.getStyle('top'), 10)
		};
	},
	
	/**
	 * @description Alias for getContainerPos function
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	currentPosition: function () {
		return this.getContainerPos();
	},
	
	/**
	 * @description Another alias for getContainerPos: returns the pixel coorindates of the HelioCenter relative to the viewport top-left corner.
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	helioCenter: function () {
		return this.getContainerPos();
	},

	/**
	 * @description Event handler fired after dragging
	 */
	endMoving: function () {
    	this.fire('viewport-move');
	},
	
	/**
	 * @description Algorithm for determining which tiles should be displayed at
	 *              a given time. Uses the Heliocentric coordinates of the viewport's
	 *              TOP-LEFT and BOTTOM-RIGHT corners to determine range to display.
	 */
	checkTiles: function () {
		var i, j, indices;
		
		this.visible = [];
		
		indices = this.displayRange();
		
		// Update visible array
		for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (!this.visible[i]) {
					this.visible[i] = [];
				}
				this.visible[i][j] = true;
			}
		}
	},
	
	/**
	 * @description Update the size and location of the movement-constraining box.
	 */
	updateSandbox: function () {
		var maxDimensions, old, center, newSize, change, movingContainerOldPos, newHCLeft, newHCTop, padHeight, shiftTop;
		
		this.dimensions = this.domNode.getDimensions();
		maxDimensions   = this.controller.layerManager.getMaxDimensions();
		old             = this.sandbox.getDimensions();
		center          = this.getCenter();
		
		// New sandbox dimensions
		newSize = {
			width : Math.max(0, maxDimensions.width  - this.dimensions.width),
			height: Math.max(0, maxDimensions.height - this.dimensions.height)
		};
		
		if (this.debug) {
			$('vp-debug-center').setStyle({'left': center.x - 25 + 'px', 'top': center.y - 25 + 'px'});
		}
	
		// Difference
		change = {
			x: newSize.width  - old.width,
			y: newSize.height - old.height
		};
		
		// Initial moving container position
		movingContainerOldPos = this.movingContainer.positionedOffset();	
		
		// Update sandbox dimensions
		this.sandbox.setStyle({
			width  : newSize.width  + 'px',
			height : newSize.height + 'px',
			left   : center.x - (0.5 * newSize.width) + 'px',
			top    : center.y - (0.5 * newSize.height) + 'px'			
		});
		
		// Update moving container position
		newHCLeft = Math.max(0, Math.min(newSize.width,  movingContainerOldPos[0] + (0.5 * change.x)));
		newHCTop  = Math.max(0, Math.min(newSize.height, movingContainerOldPos[1] + (0.5 * change.y)));
		
		this.movingContainer.setStyle({
			left: newHCLeft + 'px',
			top : newHCTop  + 'px'
		});
	},
	
	/**
	 * @description Returns the range of indices for the tiles to be displayed.
	 * @returns {Object} The range of tiles which should be displayed
	 */
	displayRange: function () {
		var vp, ts;
		
		// Get heliocentric viewport coordinates
		vp = this.getHCViewportPixelCoords();
		
		// Expand to fit tile increment
		ts = this.tileSize;
		vp = {
			top:    vp.top    - ts - (vp.top  % ts),
			left:   vp.left   - ts - (vp.left % ts),
			bottom: vp.bottom + ts - (vp.bottom % ts),
			right:  vp.right  + ts - (vp.right % ts)
		};
		
		// Indices to display (one subtracted from ends to account for "0th" tiles).
		this.visibleRange = {
			xStart: vp.left   / ts,
			xEnd:   (vp.right  / ts) - 1,
			yStart: vp.top    / ts,
			yEnd:   (vp.bottom / ts) - 1
		};
		
		return this.visibleRange;
	},

	/**
	 * @description Returns the heliocentric coordinates of the upper-left and bottom-right corners of the viewport
	 * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
	 */
	getHCViewportPixelCoords: function () {
		var sb, mc, vpDimensions;
		
		sb = this.sandbox.positionedOffset();
		mc = this.movingContainer.positionedOffset();
		vpDimensions = this.domNode.getDimensions();
		
		return {
			left:  -(sb[0] + mc[0]),
			top :  -(sb[1] + mc[1]),
			right:  vpDimensions.width  - (sb[0] + mc[0]),
			bottom: vpDimensions.height - (sb[1] + mc[1])
		};
	},

	/**
	 * @description Zooms To a specified zoom-level.
	 * @param {Int} zoomLevel The desired zoomLevel
	 */
	zoomTo: function (zoomLevel) {
		this.zoomLevel = zoomLevel;
		
		// reset the layers
		this.checkTiles();
		this.controller.layerManager.resetLayers();
	
		// update sandbox
		this.updateSandbox();
		
		// store new value
		this.controller.userSettings.set('zoom-level', zoomLevel);
	},

	/**
	 * @description Adjust viewport dimensions when window is resized.
	 */
	resize: function () {
		var oldDimensions, h, viewportOuter, padHeight;
		
		// Get dimensions
		oldDimensions = this.dimensions;
        
        // Make room for footer and header if not in fullscreen mode
        if (!jQuery('#outsideBox').hasClass('fullscreen-mode')) {
            padHeight = this.headerAndFooterHeight;
        } else {
            padHeight = 0;
        }
		
		// Ensure minimum height
		h = Math.max(this.minHeight, document.viewport.getHeight() - padHeight);

		//Update viewport height
		viewportOuter =  this.outerNode;
		viewportOuter.setStyle({height: h + 'px'});

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

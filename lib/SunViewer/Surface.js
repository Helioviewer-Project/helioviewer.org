/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class Surface Enables the "panning/dragging" user interface capability.
 */
var Surface = Class.create();

Surface.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
		moveThrottle: 2,	// performance tuning
		moving: false,
		moveCount: 0
	}),
	
	/**
	 * @constructor
	 * @param {ViewPort} viewport	The associated viewport.
	 * @param {Hash} options		Available options: moveThrottle, 
	 */
	initialize: function(viewport, options) {
		this.mark = { x: 0, y: 0 },
		this.viewport = viewport;
		this.domNode = viewport.domNode.down('.surface');
		this.domNode.style.cursor = viewport.grabbingMouseCursor;

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);

		// Determine position on page for calculating mouse click offset
		var pos = Element.cumulativeOffset(this.viewport.domNode);
		this.position = { left: pos[0], top: pos[1] };

		// Register event listeners
		Event.observe(this.domNode, 'mousedown', this.mousePressedHandler.bindAsEventListener(this));
		Event.observe(document.body, 'mousemove', this.mouseMovedHandler.bindAsEventListener(this));
		Event.observe(document.body, 'mouseup', this.mouseReleasedHandler.bindAsEventListener(this));
	},
	
	/**
	 * @method resolveCoordinates	Resolve MouseEvent into coordinates relative to top left corner.
	 * @param {Object} e 			MouseEvent object.
	 * @return {Hash}				A Hash containing the x and y value.
	 */
	resolveCoordinates : function(e) {
		return {
			x: Event.pointerX(e) - this.position.left,
			y: Event.pointerY(e) - this.position.top
		}
	},

	/**
	 * @method press			Start the panning.
	 * @param {Object} coords	The coordinates ({ x, y }) of the mouse cursor.
	 */
	press : function(coords) {
		this.moving = true;
		this.mark = coords;
		this.viewport.domNode.setStyle({ cursor: this.viewport.grabbingMouseCursor });

		// Move the surface HTML element to the top and set its cursor to grabbing	
		this.domNode.setStyle({
			cursor: this.viewport.grabbingMouseCursor,
			//cursor: (moving ? this.viewport.grabbingMouseCurser : this.viewport.grabMouseCurser),
			zIndex: 2000000
		});
		
		// Get the surface HTML element and the page dimensions
		this.dimensions = this.domNode.getDimensions();
		this.boundaries = document.body.getDimensions();
	},

	/**
	 * @method release			Stop the panning.
	 * @param {Object} coords	The coordinates ({ x, y }) of the mouse cursor.
	 */
	release : function(coords) {
		this.moving = false;
		//Debug.output('surface released');
		this.viewport.domNode.setStyle({ cursor: this.viewport.grabMouseCursor });
		this.domNode.setStyle({
			left: '0px',
			top: '0px',
			cursor: this.viewport.grabMouseCursor,
			zIndex: 0
		});

		var motion = {
			x: (coords.x - this.mark.x),
			y: (coords.y - this.mark.y),
			stop: true
		};
		
		Debug.output("Surface:release()... motion.x: " + motion.x + ", motion.y: " + motion.y);

		//this.forceInBoundaries(motion);
		this.viewport.move(motion);
		this.mark = { x: 0, y: 0 };
		//if (this.domNode.releaseCapture) this.domNode.releaseCapture();
	},

	/**
	 * @method move				Pan the viewport.
	 * @param {Object} coords	The coordinates ({ x, y }) of the mouse cursor.
	 */
	move: function(coords) {
		// Move the surface HTML element, but not over the document edges to prevent
		// scrollbars being displayed
		this.domNode.setStyle({
			left: Math.min(this.boundaries.width - this.dimensions.width - this.position.left - 1, Math.max(-this.position.left, coords.x - this.mark.x)) + 'px',
			top: Math.min(this.boundaries.height - this.dimensions.height - this.position.top - 1, Math.max(-this.position.top, coords.y - this.mark.y)) + 'px'
		});
			

        // The distance dragged
		var motion = {
			x: (coords.x - this.mark.x),
			y: (coords.y - this.mark.y)
		};
		
		// Move the viewport
		this.viewport.move(motion);
	},

	/**
	 * Mouse Pressed Handler.
	 * @param {Object} e	The DOM MouseEvent.
	 */
	mousePressedHandler: function(e) {
		// only grab on left-click
		if (e.button < 2) {
			var coords = this.resolveCoordinates(e);
			Event.stop(e);
			this.press(coords);
		}
	
		return false;
	},
	
	/**
	 * Mouse Released Handler.
	 * @param {Object} e	The DOM MouseEvent.
	 */
	mouseReleasedHandler: function(e) {
		if (this.moving) {
			this.release(this.resolveCoordinates(e));
		}
	},
	
	/**
	 * Mouse Moved Handler.
	 * @param {Object} e	The DOM MouseEvent.
	 */
	mouseMovedHandler: function(e) {
	    //When throttle is set to 2, moveCount will switch back and forth
	    //between 0 and 1.
		this.moveCount = (this.moveCount + 1) % this.moveThrottle;
		if (this.moving) {
			Event.stop(e);
			var coords = this.resolveCoordinates(e);
			
			//Debug.output("Surface:mouseMovedHandler() ...x: " + coords.x + ", y: " + coords.y);
			if (this.moveCount == 0) this.move(coords);
		}
	}
});

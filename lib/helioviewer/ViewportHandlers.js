/**
 * @fileOverview Contains the class definition for an ViewportHandlers class.
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Class, Object, document, window, Event, $ */
var ViewportHandlers = Class.create(
	/** @lends ViewportHandlers.prototype */
	{
	startingPosition:      { x: 0, y: 0 },
	mouseStartingPosition: { x: 0, y: 0 },
	mouseCurrentPosition:  { x: 0, y: 0 },
	mouseCoords  :         { x: 0, y: 0 },
	moveCounter  : 0,
	moveThrottle : 2,
	naturalZoomLevel  : 10,
	naturalResolution : 2.63,
	rSunArcSeconds    : 975,

	/**
	 * @constructs
	 * @description Contains a collection of event-handlers for dealing with Viewport-related events
	 * @see Viewport
	 * @param {Object} viewport A Reference to the Helioviewer application class
	 */
	initialize: function (viewport) {
		this.viewport = viewport;

		//Mouse-related event-handlers
		//Event.observe(window,   'mousemove', this.mouseMove.bindAsEventListener(this));
		Event.observe(document, 'mousemove', this.mouseMove.bindAsEventListener(this));
		//Event.observe(window,   'mouseup', this.mouseUp.bindAsEventListener(this));
		Event.observe(document, 'mouseup', this.mouseUp.bindAsEventListener(this));
		Event.observe(viewport.domNode, 'mousedown', this.mouseDown.bindAsEventListener(this));

		// Double-clicks
		Event.observe(this.viewport.domNode, 'dblclick', this.doubleClick.bindAsEventListener(this));

		// Mouse-wheel
		Event.observe(this.viewport.domNode, "mousewheel", this.mouseWheel.bindAsEventListener(this), false);
		Event.observe(this.viewport.domNode, "DOMMouseScroll", this.mouseWheel.bindAsEventListener(this), false); // Firefox

		//Keyboard-related event-handlers
		Event.observe(document, 'keypress', this.keyPress.bindAsEventListener(this));
		Event.observe(window, 'keypress', this.keyPress.bindAsEventListener(this));
	},

	/**
	 * @description Fired when a mouse is pressed
	 * @param {Event} event Prototype Event class
	 */
	mouseDown: function (event) {
		//this.viewport.output('down');n
		this.viewport.isMoving = true;
		this.startingPosition = this.viewport.currentPosition();
		this.mouseStartingPosition = {
			x: Event.pointerX(event), 
			y: Event.pointerY(event)
		};
		this.viewport.domNode.setStyle({ cursor: 'all-scroll' });
		if (this.viewport.domNode.setCapture) {
			this.viewport.domNode.setCapture();
		}
		this.viewport.startMoving();
	},

	/**
	 * @description Handles double-clicks
	 * @param {Event} e Prototype Event class
	 */
	doubleClick: function (e) {
		var viewport = this.viewport;
		
		//check to make sure that you are not already at the minimum/maximum zoom-level
		if ((e.shiftKey || (viewport.zoomLevel > viewport.controller.minZoomLevel)) && (viewport.zoomLevel < viewport.controller.maxZoomLevel)) {
			if (e.isLeftClick()) {
				
				var pos = this.getRelativeCoords(e.pointerX(), e.pointerY());
				
				//var test = 'position: absolute; background-color: yellow; border: 1px solid blue; width:5px; height: 5px; left:' + pos.x + 'px; top: ' + pos.y + 'px;';
				//viewport.domNode.insert(new Element('div', {style: test}));
				
				viewport.center();				
				this.viewport.startMoving();

				//adjust for zoom
				if (e.shiftKey) {
					viewport.moveBy(0.5 * pos.x, 0.5 * pos.y);
					viewport.controller.zoomControl.zoomButtonClicked(1);
				}
				else {
					viewport.moveBy(2 * pos.x, 2 * pos.y);
					viewport.controller.zoomControl.zoomButtonClicked(-1);
				}
			}
		} else {
			console.log("Out of bounds double-click request! See Viewport.js:57");
		}
	},
	
	/**
	 * @description Handles mouse-wheel movements
	 * @param {Event} event Prototype Event class
	 */
	mouseWheel: function (e) {
		this.viewport.controller.zoomControl.zoomButtonClicked(-Event.wheel(e));
	},
	
	/**
	 * @description Get the mouse-coords relative to top-left of the viewport frame
	 * @param {Int} screenx X-dimensions of the user's screen
	 * @param {Int} screeny Y-dimensions of the user's screen
	 */
	getRelativeCoords: function (screenx, screeny) {
		var vp = this.viewport;
		
		//Compute offset from top-left of browser viewport
		//var xOffset = $('left-col').getDimensions().width   + Math.round(0.03 * vp.outerNode.getDimensions().width) + 2;
		//var yOffset = $(vp.headerId).getDimensions().height + Math.round(0.03 * vp.outerNode.getDimensions().height) + 3;
		var offset = $('helioviewer-viewport-container-inner').positionedOffset();

		// Mouse-coordinates relative to the top-left of the viewport
		//var mouseCoords = {
		//	x: screenx - xOffset,
		//	y: screeny - yOffset
		//}
		var mouseCoords = {
			x: screenx - offset[0] -1,
			y: screeny - offset[1] -1
		}		
		return mouseCoords;
	},

	/**
	 * @description Keyboard-related event-handlers
	 */
	keyPress: function (e) {
		var key = e.keyCode;

		//Ignore event if user is type in an input form field
		if (e.target.tagName !== "INPUT") {

			//Arrow keys (move viewport)
			if (key == 37 || key == 38 || key == 39 || key == 40) {
				this.startingPosition = this.viewport.currentPosition();
				this.viewport.startMoving();
				this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
				if (this.moveCounter !== 0) {
					return;
				}

				//Right-arrow
				if (key == 37) {
					this.viewport.moveBy(8, 0);
				}

				//Up-arrow
				else if (e.keyCode == 38) {
					this.viewport.moveBy(0, 8);
				}
				//Left-arrow
				else if (e.keyCode == 39) {
					this.viewport.moveBy(-8, 0);
				}

				//Down-arrow
				else if (e.keyCode == 40) {
					this.viewport.moveBy(0, -8);
				}
			}
		}
	},

	/**
	 * @description Fired when a mouse button is released
	 * @param {Event} event Prototype Event object
	 */
	mouseUp: function (event) {
		//this.viewport.output('up');
		this.viewport.isMoving = false;
		this.viewport.domNode.setStyle({ cursor: 'pointer' });
		if (this.viewport.domNode.releaseCapture) {
			this.viewport.domNode.releaseCapture();
		}
		this.viewport.endMoving();
	},

	/**
	 * @description Fired when a keyboard key is released
	 * @param {Object} event Prototype Event object
	 */
	keyRelease: function (event) {
		this.viewport.isMoving = false;
		this.viewport.endMoving();
	},

	/**
	 * @description Handle drag events
	 * @param {Object} event Prototype Event object
	 */
	mouseMove: function (event) {
		if (!this.viewport.isMoving) {
			return;
		}
		
		var sb = this.viewport.sandbox.getDimensions();
		if ((sb.width == 0) && (sb.height == 0)) {
			return;
		}

		this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
		if (this.moveCounter !== 0) {
			return;
		}

		this.mouseCurrentPosition = {
			x: Event.pointerX(event), 
			y: Event.pointerY(event)
		};

		this.viewport.moveBy(
			this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
			this.mouseStartingPosition.y - this.mouseCurrentPosition.y
		);
	},
	
	/**
	 * @description Toggles mouse-coords visibility
	 */
	toggleMouseCoords: function () {
	
		// Case 1: Disabled -> Arcseconds 
		if (this.viewport.mouseCoords == "disabled") {
			this.viewport.mouseCoords = "arcseconds";
			$('mouse-coords').toggle();
		}
		// Case 2: Arcseconds -> Polar Coords
		else if (this.viewport.mouseCoords == "arcseconds") {
			this.viewport.mouseCoords = "polar";
		}
		// Case 3: Polar Coords -> Disabled
		else {
			$('mouse-coords').toggle();
			this.viewport.mouseCoords = "disabled";
			//console.log("Polar Coords -> Disabled");
		}
		
		// Warn once
		if (this.viewport.controller.userSettings.get('warn-mouse-coords') == "false") {
			this.viewport.controller.messageConsole.log("Note: Mouse-coordinates should not be used for science operations!");
			this.viewport.controller.userSettings.set('warn-mouse-coords', true)
		}
		
		// Cartesian & Polar coords
		if (this.viewport.mouseCoords != "disabled") {
			var self = this;
			
			var mouseCoordsX = $('mouse-coords-x');
			var mouseCoordsY = $('mouse-coords-y');
			
			// Clear old values
			mouseCoordsX.update("");
			mouseCoordsY.update("");
			
			// Remove existing event handler if switching from cartesian -> polar
			if (this.viewport.mouseCoords == "polar") {
				Event.stopObserving(this.viewport.movingContainer, "mousemove");
			}
			
			// Event-handler
			var updateMouseCoords = function(e) {				
				// Store current mouse-coordinates
				self.mouseCoords = {x: e.pageX, y: e.pageY};
				
				// Threshold
				self.moveCounter = (self.moveCounter + 1) % self.moveThrottle;
				if (self.moveCounter !== 0) {
					return;
				}
				
				// Coordinates realtive to viewport top-left corner
				var VX = self.getRelativeCoords(e.pageX, e.pageY);
				var negSV = self.viewport.sandbox.positionedOffset();
				var SV = {
					x: -negSV[0],
					y: -negSV[1]
				}
				var SM = $$('.movingContainer')[0].positionedOffset();				
				var MX = {
					x: VX.x + (SV.x - SM[0]),
					y: VX.y + (SV.y - SM[1])
				};
				
				//scale
				var scale = self.naturalResolution * Math.pow(2, self.viewport.zoomLevel - self.naturalZoomLevel);
				var x = Math.round((scale * MX.x));
				var y = - Math.round((scale * MX.y));
				
				// Arc-seconds
				if (self.viewport.mouseCoords == "arcseconds") {
					mouseCoordsX.update("x: " + x + " &prime;&prime;");
					mouseCoordsY.update("y: " + y + " &prime;&prime;");
					
				// Polar coords
				} else {
					var polar = Math.toPolarCoords(x, -y);	
				
					mouseCoordsX.update(((polar.r/self.rSunArcSeconds) + "").substring(0,5) + " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
					mouseCoordsY.update(Math.round(polar.theta) + " &#176;");
				}
			};	
			Event.observe(this.viewport.movingContainer, "mousemove", updateMouseCoords);
			
			// Execute handler once immediately to show new coords
			updateMouseCoords({pageX: this.mouseCoords.x, pageY: this.mouseCoords.y});
			
		} else {
			Event.stopObserving(this.viewport.movingContainer, "mousemove");
		}
	}
});

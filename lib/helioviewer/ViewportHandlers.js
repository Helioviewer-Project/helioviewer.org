/**
 * @fileOverview Contains the class definition for an ViewportHandlers class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * 
 * Mouse-dragging:
 * 
 * Two throttles are maintained: one to control how frequently the image is updated on the screen,
 * and the other to decide when to update the visible tiles. Since the later is more computationally
 * expensive, it should occur less frequently. Whenever the user stops dragging, both should be forced
 * to update.
 */
/*global Class, document, window, Event, $, $$ */
var ViewportHandlers = Class.create(
	/** @lends ViewportHandlers.prototype */
	{
	startingPosition:      { x: 0, y: 0 },
	mouseStartingPosition: { x: 0, y: 0 },
	mouseCurrentPosition:  { x: 0, y: 0 },
	mouseCoords  :         { x: 0, y: 0 },
	moveCounter  : 0,
	imageUpdateThrottle : 3,
    tileUpdateThrottle  : 9,
	rSunArcSeconds      : 975,
    animatedTextShadow  : true,

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
   		this.viewport.domNode.setStyle({ cursor: 'all-scroll' });
        
        // Don't do anything if entire image is already visible
        var sb = this.viewport.sandbox.getDimensions();
		if ((sb.width === 0) && (sb.height === 0)) {
			return;
		}
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
		var pos,
			viewport = this.viewport;
		
		//check to make sure that you are not already at the minimum/maximum zoom-level
		if ((e.shiftKey || (viewport.zoomLevel > viewport.controller.minZoomLevel)) && (viewport.zoomLevel < viewport.controller.maxZoomLevel)) {
			if (e.isLeftClick()) {
				
				pos = this.getRelativeCoords(e.pointerX(), e.pointerY());
				
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
			//console.log("Out of bounds double-click request! See Viewport.js:57");
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
		var vp, offset, mouseCoords;
		
		vp = this.viewport;

		offset = $('helioviewer-viewport-container-inner').positionedOffset();

		mouseCoords = {
			x: screenx - offset[0] - 1,
			y: screeny - offset[1] - 1
		};

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
			if (key === 37 || key === 38 || key === 39 || key === 40) {
				this.startingPosition = this.viewport.currentPosition();
				this.viewport.startMoving();
                
                // Threshold
                this.moveCounter = this.moveCounter + 1;
                if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
					return;
				}
				this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

				//Right-arrow
				if (key === 37) {
					this.viewport.moveBy(8, 0);
				}

				//Up-arrow
				else if (e.keyCode === 38) {
					this.viewport.moveBy(0, 8);
				}
				//Left-arrow
				else if (e.keyCode === 39) {
					this.viewport.moveBy(-8, 0);
				}

				//Down-arrow
				else if (e.keyCode === 40) {
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
        if (this.viewport.isMoving)
            this.viewport.endMoving();
		this.viewport.isMoving = false;
		this.viewport.domNode.setStyle({ cursor: 'pointer' });
		if (this.viewport.domNode.releaseCapture) {
			this.viewport.domNode.releaseCapture();
		}
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
		
        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
			return;
		}
		this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

		this.mouseCurrentPosition = {
			x: Event.pointerX(event), 
			y: Event.pointerY(event)
		};

        // Update text-shadows
        this.updateShadows();

		this.viewport.moveBy(this.mouseStartingPosition.x - this.mouseCurrentPosition.x, this.mouseStartingPosition.y - this.mouseCurrentPosition.y);
	},
	
    /**
     * @description Adds an animated text shadow based on the position and size of the Sun (Firefox 3.5+)
     * Added 2009/06/26
     * TODO: Apply to other text based on it's position on screen? Adjust blue based on zoom-level?
     *       Use viewport size to determine appropriate scales for X & Y offsets (normalize)
     *       Re-use computeCoordinates?
     */
    updateShadows: function () {
        // Not supported in older versions of Firefox, or in IE
        if (!this.viewport.controller.support.textShadow) {
            return;
        }
        
        var viewportOffset, sunCenterOffset, coords, viewportCenter, offsetX, offsetY;
        
        viewportOffset  = $("helioviewer-viewport").cumulativeOffset();
        sunCenterOffset = $("moving-container").cumulativeOffset();

        // Compute coordinates of heliocenter relative to top-left corner of the viewport
        coords = {
            x: sunCenterOffset[0] - viewportOffset[0],
            y: sunCenterOffset[1] - viewportOffset[1]
        };
        
        // Coordinates of heliocenter relative to the viewport center
        viewportCenter = this.viewport.getCenter();
        coords.x = coords.x - viewportCenter.x;
        coords.y = coords.y - viewportCenter.y;
        
        // Shadow offset
        offsetX = ((500 - coords.x) / 100) + "px";
        offsetY = ((500 - coords.y) / 150) + "px";

        //console.log("x: " + coords.x + ", y: " + coords.y);
        jQuery("#footer-links > .light").css("text-shadow", offsetX + " " + offsetY + " 3px #000");
    },
    
	/**
	 * @description Toggles mouse-coords visibility
	 */
	toggleMouseCoords: function () {
		var vp, mouseCoordsX, mouseCoordsY, updateMouseCoords, self = this;
        
		// Case 1: Disabled -> Arcseconds 
		if (this.viewport.mouseCoords === "disabled") {
			this.viewport.mouseCoords = "arcseconds";
			$('mouse-coords').toggle();
		}

		// Case 2: Arcseconds -> Polar Coords
		else if (this.viewport.mouseCoords === "arcseconds") {
			this.viewport.mouseCoords = "polar";
		}

		// Case 3: Polar Coords -> Disabled
		else {
			$('mouse-coords').toggle();
			this.viewport.mouseCoords = "disabled";
		}
		
		// Warn once
		if (this.viewport.controller.userSettings.get('warnMouseCoords') === "false") {
			this.viewport.controller.messageConsole.log("Note: Mouse-coordinates should not be used for science operations!");
			this.viewport.controller.userSettings.set('warnMouseCoords', true);
		}
		
		// Cartesian & Polar coords
		if (this.viewport.mouseCoords !== "disabled") {
			mouseCoordsX = $('mouse-coords-x');
			mouseCoordsY = $('mouse-coords-y');
			
			// Clear old values
			mouseCoordsX.update("");
			mouseCoordsY.update("");
			
			// Remove existing event handler if switching from cartesian -> polar
			if (this.viewport.mouseCoords === "polar") {
				Event.stopObserving(this.viewport.movingContainer, "mousemove");
			}
			
			// Event-handler
			updateMouseCoords = function (e) {
				var cartesian, polar;
								
				// Store current mouse-coordinates
				self.mouseCoords = {x: e.pageX, y: e.pageY};
                
				// Threshold
                self.moveCounter = self.moveCounter + 1;
                if ((self.moveCounter % self.imageUpdateThrottle) !== 0) {
					return;
				}
				self.moveCounter = self.moveCounter % self.tileUpdateThrottle;
				
                // Compute coordinates relative to top-left corner of the viewport
                cartesian = self.computeMouseCoords(e.pageX, e.pageY);
                				
				// Arc-seconds
				if (self.viewport.mouseCoords === "arcseconds") {
					mouseCoordsX.update("x: " + cartesian.x + " &prime;&prime;");
					mouseCoordsY.update("y: " + cartesian.y + " &prime;&prime;");
					
				// Polar coords
				} else {
					polar = Math.toPolarCoords(cartesian.x, -cartesian.y);	
				
					mouseCoordsX.update(((polar.r / self.rSunArcSeconds) + "").substring(0, 5) + " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
					mouseCoordsY.update(Math.round(polar.theta) + " &#176;");
				}
			};	
			Event.observe(this.viewport.movingContainer, "mousemove", updateMouseCoords);
			
			// Execute handler once immediately to show new coords
			updateMouseCoords({pageX: this.mouseCoords.x, pageY: this.mouseCoords.y});
			
		} else {
			Event.stopObserving(this.viewport.movingContainer, "mousemove");
		}
	},
    
    /**
     * @description Computes the scaled mouse coordinates relative to the size and center of the Sun.
     */
    computeMouseCoords: function(screenX, screenY) {
        var VX, negSV, SV, SM, MX, scale, x, y;
        
		// Coordinates realtive to viewport top-left corner
		VX = this.getRelativeCoords(screenX, screenY);
		negSV = this.viewport.sandbox.positionedOffset();
		SV = {
			x: -negSV[0],
			y: -negSV[1]
		};
		SM = $('moving-container').positionedOffset();				
		MX = {
			x: VX.x + (SV.x - SM[0]),
			y: VX.y + (SV.y - SM[1])
		};
		
		//scale
		scale = this.viewport.controller.baseScale * Math.pow(2, this.viewport.zoomLevel - this.viewport.controller.baseZoom);
		x = Math.round((scale * MX.x));
		y = - Math.round((scale * MX.y));
        
        // Return scaled coords
        return {
            x: x,
            y: y
        };
    }
});

/*global Class, Object, document, window, Event, $ */
var ViewportHandlers = Class.create({
    startingPosition: { x: 0, y: 0 },
    mouseStartingPosition: { x: 0, y: 0 },
    mouseCurrentPosition: { x: 0, y: 0 },
    moveCounter: 0,
    moveThrottle: 2,

    initialize: function (viewport) {
        this.viewport = viewport;
        
        //Mouse-related event-handlers
        this.bMouseMove = this.mouseMove.bindAsEventListener(this);
        this.bMouseDown = this.mouseDown.bindAsEventListener(this);
        this.bMouseUp = this.mouseUp.bindAsEventListener(this);

        Event.observe(window, 'mousemove', this.bMouseMove);
        Event.observe(document, 'mousemove', this.bMouseMove);
        Event.observe(this.viewport.domNode, 'mousedown', this.bMouseDown);
        Event.observe(window, 'mouseup', this.bMouseUp);
        Event.observe(document, 'mouseup', this.bMouseUp);
        
        Event.observe(this.viewport.domNode, 'dblclick', this.doubleClick.bindAsEventListener(this));
        
        //Keyboard-related event-handlers
        Event.observe(document, 'keypress', this.keyPress.bindAsEventListener(this));
        Event.observe(window, 'keypress', this.keyPress.bindAsEventListener(this));
    },

    mouseDown: function (event) {
        //this.viewport.output('down');n
        this.viewport.isMoving = true;
        this.startingPosition = this.viewport.currentPosition;
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
    
    doubleClick: function (e) {
    	var viewport = this.viewport;
    	
        //check to make sure that you are not already at the minimum/maximum zoom-level
        if ((e.shiftKey || (viewport.zoomLevel > viewport.controller.minZoomLevel)) && (viewport.zoomLevel < viewport.controller.maxZoomLevel)) {
            if (e.isLeftClick()) {
                //Compute offset from top-left of browser viewport
                var xOffset = $('left-col').getDimensions().width + Math.round(0.03 * viewport.outerNode.getDimensions().width) + 2;
                var yOffset = $(viewport.headerId).getDimensions().height + Math.round(0.03 * viewport.outerNode.getDimensions().height) + 3;
                
                //Determine the location of 0,0 in the viewport
                var origin = {
                    x: Math.round(viewport.domNode.getDimensions().width / 2),
                    y: Math.round(viewport.domNode.getDimensions().height / 2)
                }
                
                //New location to center about before zooming
                var x = (e.pointerX() - xOffset) - origin.x;
                var y = (e.pointerY() - yOffset) - origin.y;
                
                viewport.moveTo(-x,-y);
                
                //Initiate zoom
                e.shiftKey ? viewport.controller.zoomControl.zoomButtonClicked(1) : viewport.controller.zoomControl.zoomButtonClicked(-1);
            }         
        } else {
            Debug.output("Out of bounds double-click request! See Viewport.js:57");                
        }
    },
    
    keyPress: function (e) {
        var key = e.keyCode;
        
        //Ignore event if user is type in an input form field
        if (e.target.tagName !== "INPUT") {
       
            //Arrow keys (move viewport)
            if (key == 37 || key == 38 || key == 39 || key == 40) {
                this.startingPosition = this.viewport.currentPosition;
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

    mouseUp: function (event) {
        //this.viewport.output('up');
        this.viewport.isMoving = false;
        this.viewport.domNode.setStyle({ cursor: 'pointer' });
        if (this.viewport.domNode.releaseCapture) {
            this.viewport.domNode.releaseCapture();
        }
        this.viewport.endMoving();
    },
     
    keyRelease: function (event) {
        this.viewport.isMoving = false;
        this.viewport.endMoving();
    },
     
    mouseMove: function (event) {
        //this.viewport.output('move');
        if (!this.viewport.isMoving) {
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
	}
});

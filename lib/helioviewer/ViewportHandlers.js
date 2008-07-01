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
    
    keyPress: function (e) {
        var key = e.keyCode;
        
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
    /*
    this.viewport.moveTo(
      this.startingPosition.x + this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
      this.startingPosition.y + this.mouseStartingPosition.y - this.mouseCurrentPosition.y
    );
    */
	}
});

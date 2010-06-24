/**
 * @fileOverview Contains helper functions for the Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, TileLayerManager, MouseCoordinates, SandboxHelper */
"use strict";
var ViewportMovementHelper = Class.extend(
    /** @lends ViewportMovementHelper.prototype */
    {
    isMoving                : false,
    maxLayerDimensions      : { width: 0, height: 0 },
    mouseStartingPosition   : { x: 0, y: 0 },
    moveCounter             : 0,
    imageUpdateThrottle     : 3,
    tileUpdateThrottle      : 9,
    
    /**
     * @constructs
     * @description Creates a new ViewportMovementHelper
     */
    init: function (domNode, mouseCoords) {
        this.domNode         = domNode;
        this.sandbox         = $("#sandbox");
        this.movingContainer = $("#moving-container");
        this.mouseCoords     = mouseCoords;
    
        var center = this.getCenter();
        this.sandboxHelper = new SandboxHelper(center.x, center.y);
        this._initEventHandlers();
    },

    _initEventHandlers: function () {
        $(document).mousemove($.proxy(this.mouseMove, this))
                   .mouseup($.proxy(this.mouseUp, this))
                   .bind("update-viewport-sandbox", $.proxy(this.updateSandbox, this))
                   .bind("move-viewport", $.proxy(this.moveViewport, this));
    
        $('#center-button').click($.proxy(this.center, this));
        this.domNode.mousedown($.proxy(this.mouseDown, this));
    },
    
    /**
     * @description Centers the viewport.
     */
    center: function () {
        this.sandboxHelper.center();    
        $(document).trigger("recompute-tile-visibility");
    },
    
    /**
     * @description Fired when a mouse is pressed
     * @param {Event} event an Event object
     */
    mouseDown: function (event) {
        this.domNode.css("cursor", "all-scroll");
    
        // Don't do anything if entire image is already visible
        if ((this.sandbox.width() === 0) && (this.sandbox.height() === 0)) {
            return;
        }
    
        this.mouseStartingPosition = {
            x: event.pageX, 
            y: event.pageY
        };
    
        this.startMoving();
    },
    
    /**
     * @description Fired when a mouse button is released
     * @param {Event} event Event object
     */    
    mouseUp: function () {
        this.domNode.css("cursor", "pointer");
        if (this.isMoving) {
            this.endMoving();
        }
    },
    
    /**
     * @description Handle drag events
     * @param {Object} an Event object
     */    
    mouseMove: function (event) {
        if (!this.isMoving) {
            return;
        }
  
        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
            return;
        }

        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

        this.moveBy(this.mouseStartingPosition.x - event.pageX,
            this.mouseStartingPosition.y - event.pageY);
    },
    
    doubleClick: function (event) {
        var pos, center, scaleFactor, diff;
    
        // Click coordinates relative to viewport top-left
        pos = this.mouseCoords.getRelativeCoords(event.pageX, event.pageY);
    
        // Coordinates of viewport center relative to top-left
        center = this.getCenter();
    
        //adjust for zoom
        if (event.shiftKey) {
            scaleFactor = 0.5;
            $("#zoomControlZoomOut").click(); 
        }
        else {
            scaleFactor = 2;
            $("#zoomControlZoomIn").click();
        }
    
        // Distance between point of mouse-click and the center of the viewport
        diff = {
            x: (pos.x - center.x) * scaleFactor,
            y: (pos.y - center.y) * scaleFactor
        };
    
        this.startMoving();
        this.moveBy(diff.x, diff.y);
        this.endMoving();
    },
    
    /**
     * @description Moves the viewport's focus
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */   
    moveBy: function (x, y) {
        // Compare against sandbox dimensions
        var pos = {
            x: Math.min(Math.max(this.startMovingPosition.x - x, 0), this.sandbox.width()),
            y: Math.min(Math.max(this.startMovingPosition.y - y, 0), this.sandbox.height())
        };
        
        this.sandboxHelper.moveContainerTo(pos.x, pos.y);
        $(document).trigger("recompute-tile-visibility");
    },
    
    /**
     * Move the viewport focus to a new location.
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */
    moveTo: function (x, y) {
        this.sandboxHelper.moveContainerTo(x, y);

        // Check throttle
        if (this.moveCounter === 0) {
            $(document).trigger("recompute-tile-visibility");
        }
    },
    
    /**
     * @description Event-handler for a mouse-drag start.
     */
    startMoving: function () {
        this.isMoving = true;
        this.mouseCoords.disable();
        this.startMovingPosition = this.getContainerPos();
    },
    
    /**
     * @description Event handler triggered after dragging
     */
    endMoving: function () {
        this.isMoving = false;
        this.mouseCoords.enable();
        $(document).trigger("recompute-tile-visibility");
    },
    
    /**
     * @description Get the coordinates of the viewport center
     * @returns {Object} The X & Y coordinates of the viewport's center
     * 
     * * TODO 06/07/2010: getCenter should probably be with respect to the Sandbox, and not the viewport
     *   since that is more meaningful in terms of positioning and movement.
     */
    getCenter: function () {
        return {
            x: Math.round(this.domNode.width()  / 2),
            y: Math.round(this.domNode.height() / 2)
        };
    },
    
    /**
     * TODO Re-work this, getCenter, etc to simplify viewport movement and coordinates
     * ALSO- be careful to differentiate between pixel coordinates and other units of measurement
     * 
     * NEXT- look at moveTo() and find difference between the current position and center.
     * Double/halve this 
     * 
     * Returns an array of {x:, y:}
     */
    getSandboxCenter: function () {
        return this.sandboxHelper.getCenter();
    },
    
    /**
     * Uses the maximum tile and event layer dimensions to determine how far a user needs to drag the viewport
     * contents around in order to see all layers
     */
    getDesiredSandboxDimensions: function () {
        var width, height;
        width  = this.domNode.width();
        height = this.domNode.height();
    
        return {
            width : Math.max(0, this.maxLayerDimensions.width  - width),
            height: Math.max(0, this.maxLayerDimensions.height - height)
        };
    },    
    
    /**
     * @description Get the current coordinates of the moving container (relative to the sandbox)
     * @returns {Object} The X & Y coordinates of the viewport's top-left corner
     */
    getContainerPos: function () {
        var position = this.movingContainer.position();
        
        return {
            x: position.left,
            y: position.top
        };
    },
    
    updateMaxLayerDimensions: function (maxDimensions) {
        this.maxLayerDimensions = maxDimensions;
        this.updateSandbox();
    },
    
    /**
     * @description Update the size and location of the movement-constraining box.
     */
    updateSandbox: function () {
        var center, newSize;
        center  = this.getCenter();
        newSize = this.getDesiredSandboxDimensions(); 
        this.sandboxHelper.updateSandbox(center, newSize);
    },
    
    /**
     * @description Adjust viewport dimensions when window is resized.
     */
    resize: function () {
        this.updateSandbox();
    },
    
    /**
     * @description Returns the coordinates of the upper-left and bottom-right corners of the viewport 
     *              with respect to the center
     * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
     */
    getViewportCoords: function () {
        var sb, mc;
        
        sb = this.sandbox.position();
        mc = this.movingContainer.position();

        return {
            left:  -(sb.left + mc.left),
            top :  -(sb.top + mc.top),
            right:  this.domNode.width()  - (sb.left + mc.left),
            bottom: this.domNode.height() - (sb.top + mc.top)
        };
    },
    
    /**
     * Event triggered by using the arrow keys, moves the viewport by (x, y)
     */
    moveViewport: function (event, x, y) {
        this.startMoving();
        this.moveCounter += 1; // Threshold
        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;
        
        this.moveBy(x, y);
        this.endMoving();
    },
    
    /**
     * @description Zooms To a specified image scale.
     * @param {Float} imageScale The desired image scale
     */
    zoomTo: function (imageScale) {
        var imageCenter, originalSandboxWidth, originalSandboxHeight,  
        sandboxWidthScaleFactor, sandboxHeightScaleFactor;
        
        // get offset and sandbox dimensions
        imageCenter           = this.getContainerPos();
        originalSandboxWidth  = this.sandbox.width(); 
        originalSandboxHeight = this.sandbox.height();
        
        // update sandbox
        this.updateSandbox();
        
        sandboxWidthScaleFactor  = this.sandbox.width()  / originalSandboxWidth;
        sandboxHeightScaleFactor = this.sandbox.height() / originalSandboxHeight;
        
        this.moveTo(imageCenter.x * sandboxWidthScaleFactor, imageCenter.y * sandboxHeightScaleFactor);
        
        this.mouseCoords.updateImageScale(imageScale);
    }
});

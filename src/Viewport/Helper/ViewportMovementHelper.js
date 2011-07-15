/**
 * @fileOverview Contains helper functions for the Viewport class. Controls the sandbox and moving container.
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
     * Creates a new ViewportMovementHelper
     * 
     * @param centerX Horizontal offset from center in pixels
     * @param centerY Vertical offset from center in pixels
     */
    init: function (domNode, mouseCoords, offsetX, offsetY) {
        this.domNode         = $(domNode);
        this.sandbox         = $("#sandbox");
        this.movingContainer = $("#moving-container");
        this.mouseCoords     = mouseCoords;

        // Initialize sandbox
        var center = this._getCenter();
        this.sandboxHelper = new SandboxHelper(center.x, center.y);
        
        // Load previous offset
        //this.movingContainer.css({"left": offsetX, "top": offsetY});
        
        // Determine URL to grabbing cursor
        if ($.browser.msie) {
            this._cursorCSS = "url('resources/cursors/grabbing.cur'), move";
        } else {
            this._cursorCSS = 'move';
        }
    },
    
    /**
     * @description Centers the viewport.
     */
    centerViewport: function () {
        this.sandboxHelper.center();
    },
    
    /**
     * @description Fired when a mouse is pressed
     * @param {Event} event an Event object
     */
    mouseDown: function (event) {
        this.domNode.css("cursor", this._cursorCSS);
    
        // Don't do anything if entire image is already visible
        if ((this.sandbox.width() === 0) && (this.sandbox.height() === 0)) {
            return;
        }
    
        this.mouseStartingPosition = {
            x: event.pageX, 
            y: event.pageY
        };
    
        this._startMoving();
    },
    
    /**
     * @description Fired when a mouse button is released
     * @param {Event} event Event object
     */    
    mouseUp: function (event) {
        this.domNode.css("cursor", "");
        if (this.isMoving) {
            this._endMoving();
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

        this._moveBy(this.mouseStartingPosition.x - event.pageX,
            this.mouseStartingPosition.y - event.pageY);
    },
    
    /**
     * Centers the viewport on the point that was double clicked and then triggers
     * zoom in/out events.
     */
    doubleClick: function (event) {
        var pos, center, diff;
        // Click coordinates relative to viewport top-left
        pos = this.mouseCoords.getRelativeCoords(event.pageX, event.pageY);

        // Coordinates of the center of the viewport
        center = this._getCenter();
        
        // Distance between point of mouse-click and the center of the viewport
        diff = {
            x: (pos.x - center.x),
            y: (pos.y - center.y)
        };
        
        this._startMoving();
        this._moveBy(diff.x, diff.y);
        this._endMoving();
    },
    
    updateMaxLayerDimensions: function (maxDimensions) {
        this.maxLayerDimensions = maxDimensions;
        this.update();
    },
    
    /**
     * Uses current viewport coordinates and maxLayerDimensions to determine the max coordinates of
     * the image in the viewport.
     */
    getMaxImageCoordinates: function (coordinates) {
        var halfWidth, halfHeight, maxCoordinates;
        halfWidth  = this.maxLayerDimensions.width  / 2;
        halfHeight = this.maxLayerDimensions.height / 2;
        
        maxCoordinates = {
            left   : Math.max(coordinates.left, -halfWidth),
            top    : Math.max(coordinates.top, -halfHeight),
            right  : Math.min(coordinates.right, halfWidth),
            bottom : Math.min(coordinates.bottom, halfHeight)
        };
        
        return maxCoordinates;
    },
    
    /**
     * @description Update the size and location of the movement-constraining box.
     */
    update: function () {
        var center, newSize;
        center  = this._getCenter();
        newSize = this._getDesiredSandboxDimensions(); 

        this.sandboxHelper.updateSandbox(center, newSize);
    },
    
    /**
     * @description Returns the coordinates of the upper-left and bottom-right corners of the viewport 
     *              with respect to the center
     * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
     */
    getViewportCoords: function () {
        var sb, mc, left, top;
        
        sb = this.sandbox.position();
        mc = this.movingContainer.position();
        
        left = parseInt(-(sb.left + mc.left), 10);
        top  = parseInt(-(sb.top + mc.top), 10);

        return {
            left:  left,
            top :  top,
            right:  this.domNode.width()  + left,
            bottom: this.domNode.height() + top
        };
    },
    
    /**
     * Event triggered by using the arrow keys, moves the viewport by (x, y)
     */
    moveViewport: function (x, y) {
        this._startMoving();
        this.moveCounter += 1; // Threshold
        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;
        
        this._moveBy(x, y);
        this._endMoving();
    },
    
    /**
     * @description Zooms To a specified image scale.
     * @param {Float} imageScale The desired image scale
     */
    zoomTo: function (imageScale) {
        var vpCoords, center, newScale, newCenter, newCoords;

        newScale = this.mouseCoords.imageScale / imageScale;
        this._scaleLayerDimensions(newScale);

        vpCoords = this.getViewportCoords();
        center = {
            x: (vpCoords.right + vpCoords.left) / 2,
            y: (vpCoords.bottom + vpCoords.top) / 2
        };

        newCenter = {
            x: center.x * newScale,
            y: center.y * newScale
        };

        // update sandbox
        this.update();

        newCoords = this._viewportCoordsToMovingContainerCoords(newCenter);

        this._moveTo(newCoords.x, newCoords.y);
        this.mouseCoords.updateImageScale(imageScale);
    },
    
    /**
     * Uses the center of the visible area in the viewport to calculate what the
     * moving container's coordinates should be. 
     */
    _viewportCoordsToMovingContainerCoords: function (newCenter) {
        var sbCenter, mcCoords;
        sbCenter = this.sandboxHelper.getCenter();
        mcCoords = {
            x: Math.max(Math.min(sbCenter.x - newCenter.x, this.sandbox.width()), 0),
            y: Math.max(Math.min(sbCenter.y - newCenter.y, this.sandbox.height()), 0)
        };
        
        return mcCoords;
    },
    
    /**
     * Uses the maximum tile and event layer dimensions to determine how far a user needs to drag the viewport
     * contents around in order to see all layers
     */
    _getDesiredSandboxDimensions: function () {
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
    _getContainerPos: function () {
        var position = this.movingContainer.position();
        
        return {
            x: position.left,
            y: position.top
        };
    },

    /**
     * @description Adjusts the viewport's focus by x and y
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */   
    _moveBy: function (x, y) {
        // Compare against sandbox dimensions
        var pos = {
            x: Math.min(Math.max(this.startMovingPosition.x - x, 0), this.sandbox.width()),
            y: Math.min(Math.max(this.startMovingPosition.y - y, 0), this.sandbox.height())
        };

        this.sandboxHelper.moveContainerTo(pos.x, pos.y);
    },
    
    /**
     * Move the viewport focus to a new location.
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */
    _moveTo: function (x, y) {
        this.sandboxHelper.moveContainerTo(x, y);

        // Check throttle
        if (this.moveCounter === 0) {
            $(document).trigger("update-viewport", [true]);
        }
    },
    
    /**
     * @description Event-handler for a mouse-drag start.
     */
    _startMoving: function () {
        this.isMoving = true;
        this.mouseCoords.disable();
        this.startMovingPosition = this._getContainerPos();
    },
    
    /**
     * @description Event handler triggered after dragging
     */
    _endMoving: function () {
        this.isMoving = false;
        this.mouseCoords.enable();
        $(document).trigger("update-viewport", [true]);
    },
    
    /**
     * @description Get the coordinates of the viewport center
     * @returns {Object} The X & Y coordinates of the viewport's center
     * 
     * * TODO 06/07/2010: _getCenter should probably be with respect to the Sandbox, and not the viewport
     *   since that is more meaningful in terms of positioning and movement.
     */
    _getCenter: function () {
        return {
            x: Math.round(this.domNode.width()  / 2),
            y: Math.round(this.domNode.height() / 2)
        };
    },
    
    _scaleLayerDimensions: function (scaleFactor) {
        this.maxLayerDimensions.width  *= scaleFactor;
        this.maxLayerDimensions.height *= scaleFactor;
    }
});

/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window */
"use strict";
var Viewport = Class.extend(
    /** @lends Viewport.prototype */
    {
    /**
     * @description Default Viewport settings
     * 
     * @param {Int} prefetch Prefetch any tiles that fall within this many pixels outside the physical viewport
     */ 
    defaultOptions: {
        imageScale : 0,
        headerId   : '#header',
        footerId   : '#footer',
        tileSize   : 512,
        minHeight  : 450,
        prefetch   : 0
    },
    isMoving                : false,
    dimensions              : { width: 0, height: 0 },
    maxLayerDimensions      : { width: 0, height: 0 },
    maxTileLayerDimensions  : { width: 0, height: 0 },
    maxEventLayerDimensions : { width: 0, height: 0 },
    mouseStartingPosition   : { x: 0, y: 0 },
    moveCounter             : 0,
    imageUpdateThrottle     : 3,
    tileUpdateThrottle      : 9,

    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} controller A Reference to the Helioviewer application class
     * @param {Object} options Custom Viewport settings
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *       <b>imageScale</b> - The default image scale to display tiles at (should be passed in from Helioviewer).<br>
     *       <b>headerId</b>   - Helioviewer header section id.<br>
     *       <b>footerId</b>   - Helioviewer footer section id.<br>
     *       <b>tileSize</b>   - Size of tiles.<br> 
     *       <b>prefetch</b>   - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (controller, options) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);
        this.controller = controller;
                        
        this.domNode   = $(this.id);
        this.innerNode = $(this.id + '-container-inner');
        this.outerNode = $(this.id + '-container-outer');
        
        this.sandbox         = $("#sandbox");
        this.movingContainer = $("#moving-container");

        this.mouseCoords  = "disabled";
        this.mouseCoordsX = $('#mouse-coords-x');
        this.mouseCoordsY = $('#mouse-coords-y');
        
        // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this.rsun = 959.705;

        // Combined height of the header and footer in pixels (used for resizing viewport vertically)
        this.headerAndFooterHeight = $(this.headerId).height() + $(this.footerId).height() + 2;
        
        this.resize();
        this._initEventHandlers();
    },
    
    /**
     * @description Centers the viewport.
     */
    center: function () {
        this.movingContainer.css({
            left: 0.5 * this.sandbox.width()  + 'px',
            top:  0.5 * this.sandbox.height() + 'px'    
        });

        // Check throttle
        if (this.moveCounter === 0) {
            $(document).trigger('viewport-move');
        }
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
        
        this.movingContainer.css({
            left: pos.x + 'px',
            top:  pos.y + 'px'    
        });
        
        // Check throttle
        if (this.moveCounter === 0) {
            $(document).trigger('viewport-move');
        }
    },
    
    /**
     * @description Event-handler for a mouse-drag start.
     */
    startMoving: function () {
        this.isMoving = true;
        this.startMovingPosition = this.getContainerPos();
    },
    
    /**
     * @description Event handler triggered after dragging
     */
    endMoving: function () {
        this.isMoving = false;
        $(document).trigger('viewport-move');
    },
    
    /**
     * @description Get the coordinates of the viewport center
     * @returns {Object} The X & Y coordinates of the viewport's center
     */
    getCenter: function () {
        return {
            x: Math.round(this.domNode.width()  / 2),
            y: Math.round(this.domNode.height() / 2)
        };
    },
    
    /**
     * @description Get the current coordinates of the moving container (relative to the sandbox)
     * @returns {Object} The X & Y coordinates of the viewport's top-left corner
     */
    getContainerPos: function () {
        return {
            x: parseInt(this.movingContainer.css('left'), 10),
            y: parseInt(this.movingContainer.css('top'), 10)
        };
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
     * Determines the 
     */
    getSandboxDimensions: function () {
        //this._updateDimensions();
        
        // New sandbox dimensions
        return {
            width : Math.max(0, this.maxLayerDimensions.width  - this.dimensions.width),
            height: Math.max(0, this.maxLayerDimensions.height - this.dimensions.height)
        };
    },
    
    /**
     * @description Updates the viewport dimensions
     */
    _updateDimensions: function () {
        this.dimensions = {
            width : this.domNode.width(),
            height: this.domNode.height()
        };
    },
    
    /**
     * @description Update the size and location of the movement-constraining box.
     */
    updateSandbox: function () {
        var old, center, newSize, change, movingContainerOldPos, newHCLeft, newHCTop, padHeight, shiftTop;
        
        old = {
            width : this.sandbox.width(),
            height: this.sandbox.height()
        };
        
        center = this.getCenter();
        
        newSize = this.getSandboxDimensions();
  
        // Difference
        change = {
            x: newSize.width  - old.width,
            y: newSize.height - old.height
        };
        
        // Initial moving container position
        movingContainerOldPos = this.movingContainer.position();    
        
        // Update sandbox dimensions
        this.sandbox.css({
            width  : newSize.width  + 'px',
            height : newSize.height + 'px',
            left   : center.x - (0.5 * newSize.width) + 'px',
            top    : center.y - (0.5 * newSize.height) + 'px'            
        });
        
        // Update moving container position
        newHCLeft = Math.max(0, Math.min(newSize.width,  movingContainerOldPos.left + (0.5 * change.x)));
        newHCTop  = Math.max(0, Math.min(newSize.height, movingContainerOldPos.top + (0.5 * change.y)));
        
        this.movingContainer.css({
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
            yEnd:     (vp.bottom / ts) - 1
        };
    
        return this.visibleRange;
    },

    /**
     * @description Returns the heliocentric coordinates of the upper-left and bottom-right corners of the viewport
     * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
     */
    getHCViewportPixelCoords: function () {
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
     * @description Zooms To a specified image scale.
     * @param {Float} imageScale The desired image scale
     */
    zoomTo: function (imageScale) {
        var oldScale = this.imageScale;
        
        this.imageScale = imageScale;
        
        // reset the layers
        this.checkTiles();
        this.controller.tileLayers.refreshLayers();

        // scale layer dimensions
        this.scaleLayerDimensions(oldScale / imageScale);
        
        // update sandbox
        this.updateSandbox();
        
        // store new value
        $(document).trigger("save-setting", ["imageScale", imageScale]);
    },
    
    /**
     * Adjust saved layer dimensions by a specified scale factor
     */
    scaleLayerDimensions: function (sf) {
        this.maxLayerDimensions.width       = this.maxLayerDimensions.width * sf;
        this.maxLayerDimensions.height      = this.maxLayerDimensions.height * sf;
        this.maxTileLayerDimensions.width   = this.maxEventLayerDimensions.width * sf;
        this.maxTileLayerDimensions.height  = this.maxEventLayerDimensions.height * sf;
        this.maxEventLayerDimensions.width  = this.maxEventLayerDimensions.width * sf;
        this.maxEventLayerDimensions.height = this.maxEventLayerDimensions.height * sf;
    },
    
    /**
     * @description Adjust viewport dimensions when window is resized.
     */
    resize: function () {
        var oldDimensions, h, padHeight;
        
        // Get dimensions
        oldDimensions = this.dimensions;
        
        // Make room for footer and header if not in fullscreen mode
        if (this.controller.fullScreenMode && this.controller.fullScreenMode.isEnabled()) {
            padHeight = 0;
        }
        else {
            padHeight = this.headerAndFooterHeight;
        }
        
        // Ensure minimum height
        h = Math.max(this.minHeight, $(window).height() - padHeight);

        //Update viewport height
        this.outerNode.height(h);

        // Update viewport dimensions
        this._updateDimensions();
        
        this.dimensions.width  += this.prefetch;
        this.dimensions.height += this.prefetch;
        
        if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
            if (this.controller.tileLayers.size() > 0) {
                this.updateSandbox();
                this.checkTiles();
                this.controller.tileLayers.refreshLayers();
            }
        }
    },
    
    /**
     * @description Returns the current solar radius in pixels.
     */
    getRSun: function () {
        return this.rsun / this.imageScale;
    },
    
    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision(8));
    },
    
    getDimensions: function () {
        return this.dimensions;
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
    
     /**
      * @description Fired when a mouse button is released
      * @param {Event} event Event object
      */
    mouseUp: function (event) {
        $("#helioviewer-viewport").css("cursor", "pointer");

        if (this.isMoving) {
            this.endMoving();
        }
    },


    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (e) {
        var pos, center, diff;
        
        //check to make sure that you are not already at the minimum/maximum image scale
        if (!(e.shiftKey || (this.imageScale > this.controller.minImageScale)) ||
             (this.imageScale >= this.controller.maxImageScale)) {
            return;
        }
        
        // Click coordinates relative to viewport top-left
        pos = this.getRelativeCoords(e.pageX, e.pageY);
        
        // Coordinates of viewport center relative to top-left
        center = this.getCenter();
        
        // Distance between point of mouse-click and the center of the viewport
        diff = {
            x: pos.x - center.x,
            y: pos.y - center.y
        };

        this.startMoving();
        this.moveBy(diff.x, diff.y);
        this.endMoving();

        //adjust for zoom
        if (e.shiftKey) {
            //$("#zoomControlZoomOut").click();
        }
        else {
            //$("#zoomControlZoomIn").click();
        }
    },
     
    /**
     * @description Handles mouse-wheel movements
     * 
     * TODO 02/22/2010: Prevent browser window from scrolling on smaller screens when 
     * wheel is used in viewport
     * 
     * @param {Event} event Event class
     */
    mouseWheel: function (e, delta) {
        if (delta > 0) {
            $("#zoomControlZoomIn").click();
        } else {
            $("#zoomControlZoomOut").click();
        }
        return false;
    },
     
    /**
     * @description Get the mouse-coords relative to top-left of the viewport frame
     * @param {Int} screenx X-dimensions of the user's screen
     * @param {Int} screeny Y-dimensions of the user's screen
     */
    getRelativeCoords: function (screenx, screeny) {
        var offset, mouseCoords;
         
        offset = $('#helioviewer-viewport-container-inner').position();

        mouseCoords = {
            x: screenx - offset.left - 1,
            y: screeny - offset.top - 1
        };

        return mouseCoords;
    },
     
    /**
     * @description Toggles mouse-coords visibility
     * 
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        var warning, container = $('#mouse-coords');
        
        // Case 1: Disabled -> Arcseconds 
        if (this.mouseCoords === "disabled") {
            this.mouseCoords = "arcseconds";
            container.toggle();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.mouseCoords = "polar";
        }

        // Case 3: Polar Coords -> Disabled
        else {
            container.toggle();
            this.mouseCoords = "disabled";
        }
          
        // Warn once
        if (this.warnMouseCoords === true) {
            warning = "<b>Note:</b> Mouse-coordinates should not be used for science operations!";
            $(document).trigger("message-console-log", [warning])
                       .trigger("save-setting", ["warnMouseCoords", false]);
            this.warnMouseCoords = false;
        }
          
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.mouseCoords === "polar") {
                this.movingContainer.unbind('mousemove', this.updateMouseCoords);
            }
               
            this.movingContainer.bind('mousemove', $.proxy(this.updateMouseCoords, this));     
               
            // TODO: Execute handler once immediately if mouse is over viewport to show new coords     
            // Use trigger to fire mouse move event and then check to make sure mouse is within viewport?         
        } else {
            this.movingContainer.unbind('mousemove', this.updateMouseCoords);
        }
    },
    
    /**
     * updateMouseCoords
     */
    updateMouseCoords: function (event) {
        var cartesian, polar;
        
        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
            return;
        }

        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;
            
        // Compute coordinates relative to top-left corner of the viewport
        cartesian = this.computeMouseCoords(event.pageX, event.pageY);
                            
        // Arc-seconds
        if (this.mouseCoords === "arcseconds") {
            this.mouseCoordsX.html("x: " + cartesian.x + " &prime;&prime;");
            this.mouseCoordsY.html("y: " + cartesian.y + " &prime;&prime;");
                 
        // Polar coords
        } else {
            polar = Math.toPolarCoords(cartesian.x, -cartesian.y);     
            
            this.mouseCoordsX.html(((polar.r / this.rsun) + "").substring(0, 5) +
                 " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
            this.mouseCoordsY.html(Math.round(polar.theta) + " &#176;");
        }
    },
    
    /**
     * @description Computes the scaled mouse coordinates relative to the size and center of the Sun.
     * 
     *  Explanation:
     * 
     *    X = location of mouse-pointer
     *    V = viewport top-left corner
     *    S = sandbox top-left corner
     *    M = moving container top-let corner
     *    
     *  Each of the two-letter abbreviations represents the vector <x,y> going from one
     *  location to the other. See wiki documentation below for more details.
     * 
     * @see http://helioviewer.org/wiki/index.php?title=Co-ordinate_System_I
     */
    computeMouseCoords: function (screenX, screenY) {
        var VX, negSV, SV, SM, MX, scale, x, y;
        
        // Coordinates realtive to viewport top-left corner
        VX = this.getRelativeCoords(screenX, screenY);
        negSV = this.sandbox.position();
        SV = {
            x: -negSV.left,
            y: -negSV.top
        };
        SM = this.movingContainer.position();                    
        MX = {
            x: VX.x + (SV.x - SM.left),
            y: VX.y + (SV.y - SM.top)
        };
          
        //scale
        scale = this.imageScale;
        x = Math.round((scale * MX.x));
        y = - Math.round((scale * MX.y));
        
        // Return scaled coords
        return {
            x: x,
            y: y
        };
    },
    
    /**
     * Updates the stored values for the maximum tile and event layer dimensions. This is used in computing the optimal
     * sandbox size.
     */
    updateMaxLayerDimensions: function (event, type, dimensions) {
        if (type === "tile") {
            this.maxTileLayerDimensions  = dimensions;
        } else {
            this.maxEventLayerDimensions = dimensions;
        }
        
        var old = this.maxLayerDimensions;
        
        this.maxLayerDimensions = {
            width : Math.max(this.maxTileLayerDimensions.width,  this.maxEventLayerDimensions.width),
            height: Math.max(this.maxTileLayerDimensions.height, this.maxEventLayerDimensions.height)
        };
        
        if ((this.maxLayerDimensions.width !== old.width) || (this.maxLayerDimensions.height !== old.height)) {
            this.updateSandbox();
        }
    },
    
    /**
     * @description
     */
    _initEventHandlers: function () {
        $(window).resize($.proxy(this.resize, this));
        $(document).mousemove($.proxy(this.mouseMove, this))
                   .mouseup($.proxy(this.mouseUp, this))
                   .bind("layer-max-dimensions-changed", $.proxy(this.updateMaxLayerDimensions, this));
        
        this.domNode.mousedown($.proxy(this.mouseDown, this))
                    .dblclick($.proxy(this.doubleClick, this))
                    .mousewheel(this.mouseWheel);
        
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});

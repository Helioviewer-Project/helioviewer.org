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
    isMoving: false,
    dimensions: { width: 0, height: 0 },
    mouseStartingPosition: { x: 0, y: 0 },
    mouseCurrentPosition : { x: 0, y: 0 },
    moveCounter         : 0,
    imageUpdateThrottle : 3,
    tileUpdateThrottle  : 9,

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
        this.controller         = controller;
                        
        this.domNode      = $(this.id);
        this.innerNode    = $(this.id + '-container-inner');
        this.outerNode    = $(this.id + '-container-outer');

        this.mouseCoords  = "disabled";
        this.mouseCoordsX = $('#mouse-coords-x');
        this.mouseCoordsY = $('#mouse-coords-y');
        
        // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this.rsun = 959.705;

        // Combined height of the header and footer in pixels (used for resizing viewport vertically)
        this.headerAndFooterHeight = $(this.headerId).height() + $(this.footerId).height() + 2;
        
        // Resize to fit screen
        this.resize();
        
        // Determine center of viewport
        var center = this.getCenter();
        
        // Create a container to limit how far the layers can be moved
        this.sandbox = $('<div id="sandbox" style="position: absolute; width: 0; height: 0; left: ' +
                         center.x + 'px; top: ' + center.y + 'px;"></div>');
        
        // Create a master container to make it easy to manipulate all layers at once
        this.movingContainer = $('<div id="moving-container" style="left: 0; top: 0"></div>').appendTo(this.sandbox);
        
        this.domNode.append(this.sandbox);
        
        this._initEvents();
    },
    
    /**
     * @description Centers the viewport.
     */
    center: function () {
        this.moveTo(0.5 * this.sandbox.width(), 0.5 * this.sandbox.height());
    },

    /**
     * @description Move the viewport focus to a new location.
     * @param {Int} x X-value
     * @param {Int} y Y-value
     */
    moveTo: function (x, y) {
        this.movingContainer.css({
            left: x + 'px',
            top:  y + 'px'    
        });

        // Check throttle
        if (this.moveCounter === 0) {
            this.domNode.trigger('viewport-move');
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
            this.domNode.trigger('viewport-move');
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
        this.domNode.trigger('viewport-move');
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
     * @description Update the size and location of the movement-constraining box.
     */
    updateSandbox: function () {
        var maxDimensions, old, center, newSize, change, movingContainerOldPos, 
            newHCLeft, newHCTop, padHeight, shiftTop;
        
        this._updateDimensions();
        
        maxDimensions = this.controller.tileLayers.getMaxDimensions();
        
        old = {
            width : this.sandbox.width(),
            height: this.sandbox.height()
        };
        center = this.getCenter();
        
        // New sandbox dimensions
        newSize = {
            width : Math.max(0, maxDimensions.width  - this.dimensions.width),
            height: Math.max(0, maxDimensions.height - this.dimensions.height)
        };
        
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
        this.imageScale = imageScale;
        
        // reset the layers
        this.checkTiles();
        this.controller.tileLayers.resetLayers();
        this.controller.eventLayers.resetLayers();
    
        // update sandbox
        this.updateSandbox();
        
        // store new value
        $(document).trigger("save-setting", ["imageScale", imageScale]);
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
                this.controller.tileLayers.resetLayers();
            }
        }
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
        var vp, sb;
        
        vp = $("#helioviewer-viewport");
        sb = $("#sandbox");
        
        vp.css("cursor", "all-scroll");

        // Don't do anything if entire image is already visible
        if ((sb.width() === 0) && (sb.height() === 0)) {
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

        this.mouseCurrentPosition = {
            x: event.pageX, 
            y: event.pageY
        };

        // Update text-shadows
        //this.controller.updateShadows();

        this.moveBy(this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
                    this.mouseStartingPosition.y - this.mouseCurrentPosition.y);
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
        var pos;
          
        //check to make sure that you are not already at the minimum/maximum image scale
        if ((e.shiftKey || (this.imageScale > this.controller.minImageScale)) && 
            (this.imageScale < this.controller.maxImageScale)) {
            pos = this.getRelativeCoords(e.pageX, e.pageY);
               
            this.center();                    
            this.startMoving();

            //adjust for zoom
            if (e.shiftKey) {
                this.moveBy(0.5 * pos.x, 0.5 * pos.y);
                //this.controller.zoomControls.zoomButtonClicked(-1);
                $("#zoomControlZoomOut").click();
            }
            else {
                this.moveBy(2 * pos.x, 2 * pos.y);
                //this.controller.zoomControls.zoomButtonClicked(1);
                $("#zoomControlZoomIn").click();
            }
            
            this.endMoving();
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
        var dir = delta > 0 ? $("#zoomControlZoomIn").click() : $("#zoomControlZoomOut").click();
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
        var vp, mouseCoordsX, mouseCoordsY, updateMouseCoords, warning;
        
        // Case 1: Disabled -> Arcseconds 
        if (this.mouseCoords === "disabled") {
            this.mouseCoords = "arcseconds";
            $('#mouse-coords').toggle();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.mouseCoords = "polar";
        }

        // Case 3: Polar Coords -> Disabled
        else {
            $('#mouse-coords').toggle();
            this.mouseCoords = "disabled";
        }
          
        // Warn once
        if (this.controller.userSettings.get('warnMouseCoords') === true) {
            warning = "<b>Note:</b> Mouse-coordinates should not be used for science operations!";
            $(document).trigger("message-console-log", [warning])
                       .trigger("save-setting", ["warnMouseCoords", false]);
        }
          
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.mouseCoords === "polar") {
                $('#moving-container').unbind('mousemove', this.updateMouseCoords);
            }
               
            $('#moving-container').bind('mousemove', $.proxy(this.updateMouseCoords, this));     
               
            // TODO: Execute handler once immediately if mouse is over viewport to show new coords     
            // Use trigger to fire mouse move event and then check to make sure mouse is within viewport?         
        } else {
            $('#moving-container').unbind('mousemove', this.updateMouseCoords);
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
        negSV = $("#sandbox").position();
        SV = {
            x: -negSV.left,
            y: -negSV.top
        };
        SM = $('#moving-container').position();                    
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
     * @description
     */
    _initEvents: function () {
        var doc, vp, self = this;
        
        // Dynamically resize the viewport when the browser window is resized.
        $(window).resize($.proxy(this.resize, this));

        doc = $(document);
        vp  = $("#helioviewer-viewport");
        
        //Mouse-related event-handlers
        doc.mousemove(function (e) {
            self.mouseMove(e);
        });
        doc.mouseup(function (e) {
            self.mouseUp(e);
        });
        vp.mousedown(function (e) {
            self.mouseDown(e);
        });

          // Double-clicks
        vp.dblclick(function (e) {
            self.doubleClick(e);
        });

          // Mouse-wheel
        vp.mousewheel(function (e, delta) {
            self.mouseWheel(e, delta);
            return false;
        });
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});

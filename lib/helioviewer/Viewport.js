/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see ViewportHandlers
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, ViewportHandlers, document, window */
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
        zoomLevel: 0,
        headerId : '#middle-col-header',
        footerId : '#footer',
        tileSize : 512,
        minHeight: 450,
        prefetch : 0
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
     *         <b>zoomLevel</b> - The default zoomlevel to display (should be passed in from Helioviewer).<br>
     *        <b>headerId</b>  - Helioviewer header section id.<br>
     *        <b>footerId</b>     - Helioviewer footer section id.<br>
     *        <b>tileSize</b>     - Size of tiles.<br> 
     *        <b>prefetch</b>     - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (controller, options) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);
        
        var center, centerBox, self = this;

        this.domNode            = $(this.id);
        this.innerNode          = $(this.id + '-container-inner');
        this.outerNode          = $(this.id + '-container-outer');
        this.controller         = controller;
        this.mouseCoords        = "disabled";
        this.viewportHandlers   = new ViewportHandlers(this);
        
        // Solar radius at zoom-level 0
        this.rsun0 = 94 * (Math.pow(2, 12)); // 94  * (1 << 12),

        // Combined height of the header and footer in pixels (used for resizing viewport vertically)
        this.headerAndFooterHeight = $(this.headerId).height() + $(this.footerId).height() + 9;

        // Resize to fit screen
        this.resize();
        
        // Determine center of viewport
        center = this.getCenter();
        
        // Create a container to limit how far the layers can be moved
        this.sandbox = $('<div id="sandbox" style="position: absolute; width: 0; height: 0; left: ' +
                         center.x + 'px; top: ' + center.y + 'px;"></div>');
        this.domNode.append(this.sandbox);
        
        // Create a master container to make it easy to manipulate all layers at once
        this.movingContainer = $('<div id="moving-container" style="left: 0; top: 0"></div>').appendTo(this.sandbox);
        
           // Dynamically resize the viewport when the browser window is resized.
        $(window).resize(function (e) {
            self.resize();
        });
        
        // Set initial text-shadowing
        this.viewportHandlers.updateShadows();
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
        if (this.viewportHandlers.moveCounter === 0) {
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
        if (this.viewportHandlers.moveCounter === 0) {
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
     * @description Alias for getContainerPos function
     * @returns {Object} The X & Y coordinates of the viewport's top-left corner
     */
    currentPosition: function () {
        return this.getContainerPos();
    },
    
    /**
     * @description Another alias for getContainerPos: returns the pixel coorindates of the 
     *              HelioCenter relative to the viewport top-left corner.
     * @returns {Object} The X & Y coordinates of the viewport's top-left corner
     */
    helioCenter: function () {
        return this.getContainerPos();
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
     * @description Zooms To a specified zoom-level.
     * @param {Int} zoomLevel The desired zoomLevel
     */
    zoomTo: function (zoomLevel) {
        this.zoomLevel = zoomLevel;
        
        // reset the layers
        this.checkTiles();
        this.controller.tileLayers.resetLayers();
        this.controller.eventLayers.resetLayers();
    
        // update sandbox
        this.updateSandbox();
        
        // store new value
        this.controller.userSettings.set('zoomLevel', zoomLevel);
    },

    /**
     * @description Adjust viewport dimensions when window is resized.
     */
    resize: function () {
        var oldDimensions, h, padHeight;

        // Get dimensions
        oldDimensions = this.dimensions;
        
        // Make room for footer and header if not in fullscreen mode
        if (!$('#outsideBox').hasClass('fullscreen-mode')) {
            padHeight = this.headerAndFooterHeight;
        }
        else {
            padHeight = 0;
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
        return (this.rsun0 / Math.pow(2, this.zoomLevel)); //this.rsun0 >> this.viewport.zoomLevel;
    },
    
    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     * TODO (12/3/2009): Compute once and store when zoom-level is changed.
     */
    getImageScale: function () {
        return (this.controller.baseScale * Math.pow(2, this.zoomLevel - this.controller.baseZoom));
    },
    
    getDimensions: function () {
        return this.dimensions;
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});

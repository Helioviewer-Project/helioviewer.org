/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, TileLayerManager */
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
        imageScale : 1,
        tileSize   : 512,
        minHeight  : 450,
        prefetch   : 0
    },
    dimensions              : { width: 0, height: 0 },
    maxLayerDimensions      : { width: 0, height: 0 },

    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *       <b>imageScale</b> - The default image scale to display tiles at (should be passed in from Helioviewer).<br>
     *       <b>tileSize</b>   - Size of tiles.<br> 
     *       <b>prefetch</b>   - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (options) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);
                        
        this.domNode   = $(this.id);
        this.innerNode = $(this.id + '-container-inner');
        this.outerNode = $(this.id + '-container-outer');
        
        // Combined height of the header and footer in pixels (used for resizing viewport vertically)
        this.headerAndFooterHeight = $("#header").height() + $("#footer").height() + 2;    
    },
    
    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision(8));
    },
    
    /**
     * Gets the window height and resizes the viewport to fit within it
     */
    resize: function () {
        var oldDimensions, height;
    
        // Get dimensions
        oldDimensions = this.dimensions;
        // Ensure minimum height
        height = Math.max(this.minHeight, $(window).height() - this._getPadHeight());

        //Update viewport height
        this.outerNode.height(height);

        // Update viewport dimensions
        this._updateDimensions();
    
        this.dimensions.width  += this.prefetch;
        this.dimensions.height += this.prefetch;

        if (!this._hasSameDimensions(this.dimensions, oldDimensions)) {
            return true;
        }
        return false;
    },
    
    /**
     * Saves the new image scale and scales maxLayerDimensions accordingly.
     */
    setImageScale: function (imageScale) {
        this.imageScale = imageScale;
    },
    
    updateViewportRanges: function (coordinates) {
        this._updateTileVisibilityRange(coordinates);
        this._tileLayerManager.adjustImageScale(this.imageScale);
    },
    
    serialize: function () {
        return this._tileLayerManager.serialize();
    },
    
    /**
     * Makes room for header and footer if not in fullscreen mode
     */
    _getPadHeight: function () {
        if (this.domNode.hasClass("fullscreen-mode")) {
            return 0;
        }
        return this.headerAndFooterHeight;
    },
    
    /**
     * @description Returns the range of indices for the tiles to be displayed.
     * @returns {Object} The range of tiles which should be displayed
     */
    _updateTileVisibilityRange: function (coordinates) {
        this._tileLayerManager.updateTileVisibilityRange(coordinates);
    },
    
    /**
     * Checks to see if two dimension arrays are the same
     */
    _hasSameDimensions: function (newDimensions, old) {
        return (newDimensions.width === old.width) && (newDimensions.height === old.height);
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
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    
    toJSON: function () {
    }
});

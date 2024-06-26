/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 * TODO 2011/01/09: Add check for zero-dimension tile requests
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLoader */
"use strict";
var TileLayer = Layer.extend(
    /** @lends TileLayer.prototype */
    {
    /**
     * @description Default TileLayer options
     */
    defaultOptions: {
        type        : 'TileLayer',
        opacity     : 100,
        sharpen     : false,
        difference  : 0,
        diffCount   : 60,
        diffTime    : 1,
        baseDiffTime : null
    },

    /**
     * @constructs
     * @description Creates a new TileLayer
     */
    init: function (index, date, tileSize, viewportScale, tileVisibilityRange, name, visible, opacity, difference, diffCount, diffTime, baseDiffTime, id) {
        $.extend(this, this.defaultOptions);
        this._super();

        this.loaded = false;

        this._requestDate = date;
        this.domNode = $('<div class="tile-layer-container" rel="'+id+'"/>').appendTo("#moving-container");

        this.viewportScale = viewportScale;

        this.tileSize      = tileSize;
        this.visible       = visible;
        this.opacity       = opacity;
        this.difference    = (typeof difference == 'undefined' ? 0 : parseInt(difference));
        this.diffCount     = (typeof diffCount == 'undefined' ? 60 : parseInt(diffCount));
        this.diffTime      = (typeof diffTime == 'undefined' ? 1 : parseInt(diffTime));
        this.baseDiffTime  = (typeof baseDiffTime == 'undefined' ? $('#date').val()+' '+$('#time').val() : baseDiffTime);
        this.name          = name;
        this.tileVisibilityRange = {xStart: 0, xEnd: 0, yStart: 0, yEnd: 0};
        // Mapping of x, y coordinates to HTML img tags
        this._tiles = {}
    },

    updateTileVisibilityRange: function (vpCoords) {
        // Get the apparent tile size according to zoom scale.
        // tile size may be x, but if zoomed in or out, it will appear to be x * zoom.
        let scale = (Helioviewer.userSettings.get('mobileZoomScale') || 1);
        let ts = this.tileSize * scale;
        // Get the coordinate of this image relative to the origin
        // image.offset is this coordinate of the origin relative to the image center.
        // By changing the sign, it becomes the coordinate of the image center
        // relative to the origin.
        // The origin is the center of the sun / moving container.
        let offset = this.getCurrentOffset();
        // Computes the coordinates of the nearest tile multiples in each direction.
        // These coordinates are measured relative to the center of the image (offsetX, offsetY).
        // vpCoords are measured relative to sun center, the origin of the moving container.
        // To change the origin to be relative to the image, we have to do the operation vpCoord - (offsetX, offsetY).
        let vpWidth = (vpCoords.right - vpCoords.left) * scale;
        let vpHeight = (vpCoords.bottom - vpCoords.top) * scale;
        let shiftedVp = {
            top: vpCoords.top + offset.y,
            left: vpCoords.left + offset.x,
            right: vpCoords.left + offset.x + vpWidth,
            bottom: vpCoords.top + offset.y + vpHeight
        };
        let vp = {
            top:    shiftedVp.top    - ts - (shiftedVp.top    % ts),
            left:   shiftedVp.left   - ts - (shiftedVp.left   % ts),
            bottom: shiftedVp.bottom + ts - (shiftedVp.bottom % ts),
            right:  shiftedVp.right  + ts - (shiftedVp.right  % ts)
        };

        // Indices to display (one subtracted from ends to account for "0th" tiles).
        let tileVisibilityRange = {
            xStart : Math.round(vp.left / ts),
            yStart : Math.round(vp.top  / ts),
            xEnd   : Math.round((vp.right  / ts) - 1),
            yEnd   : Math.round((vp.bottom / ts) - 1)
        };

        // Only load new tiles if anything has changed
        if ((this.tileVisibilityRange.xStart != tileVisibilityRange.xStart)
         || (this.tileVisibilityRange.xEnd   != tileVisibilityRange.xEnd)
         || (this.tileVisibilityRange.yStart != tileVisibilityRange.yStart)
         || (this.tileVisibilityRange.yEnd   != tileVisibilityRange.yEnd)) {
            this.tileLoader.updateTileVisibilityRange(tileVisibilityRange, this.loaded);
            this.tileVisibilityRange = tileVisibilityRange;
        }
    },

    /**
     *
     */
    updateImageScale: function (scale, tileVisibilityRange) {
        this.viewportScale = scale;

        // The general visibility range doesn't account for any x/y offsets.
        // Update the start/end values based on the known offset.
        let offset = this._getOffset(scale);
        let xTileOffset = this._computeTileOffset(offset.x, this.tileSize);
        let yTileOffset = this._computeTileOffset(offset.y, this.tileSize);
        // Don't modify range directly since the object is shared across layers.
        // Instead, create a new object with the updated fields
        // With pinch scaling, these can end up being non-whole numbers from rounding
        // errors. Instead of -1, we get -0.9999999 which results in the whole
        // range being wrong.
        // Round everything to whole numbers to make sure this always works.
        let offsetVisibilityRange = {
            xStart: Math.round(tileVisibilityRange.xStart) + xTileOffset,
            xEnd: Math.round(tileVisibilityRange.xEnd) + xTileOffset,
            yStart: Math.round(tileVisibilityRange.yStart) + yTileOffset,
            yEnd: Math.round(tileVisibilityRange.yEnd) + yTileOffset
        }

        this._updateDimensions();

        this.tileLoader.setTileVisibilityRange(offsetVisibilityRange);

        if (this.visible) {
            this.tileLoader.reloadTiles(true);
        }
    },

    /**
     * Computes the tile index offset that is required based on the given position offset
     * @param {number} posOffset
     * @param {number} tileSize
     */
    _computeTileOffset: function(posOffset, tileSize) {
        // The tile offset is determined by how many tiles over the tilesize the position is shifted.
        // For example, the top left tile is usually (-1, -1). The viewport may be shifted to the right so that only tile (0, -1) should be visible.
        // However, if the positional offset for this image is also shifted to the right, then it may be appropriate to still show tile (-1, -1).
        // This calculation determines this tile value offset based on the images position in the viewport.
        let tileOffset = Math.floor(Math.abs(posOffset / tileSize));
        if (posOffset >= 0) {
            return tileOffset;
        } else {
            return -tileOffset;
        }
    },

    /**
     * Handles time changes
     */
    updateRequestTime: function (date) {
        this.image.updateTime(date);
    },

    /**
     * @description Returns a stringified version of the tile layer for use in URLs, etc
     * @return string String representation of the tile layer
     */
    serialize: function () {
	    var layerDateStr = this.baseDiffTime;
	    if(typeof layerDateStr == 'number' || layerDateStr == null){
			layerDateStr = $('#date').val()+' '+$('#time').val();
		}

		layerDateStr = formatLyrDateString(layerDateStr);
        return this.image.getLayerName() + "," + (this.visible ? this.layeringOrder : "0") + "," + this.opacity + "," + this.difference + "," + this.diffCount + "," + this.diffTime + "," + layerDateStr;
    },

    toggleVisibility: function (event, id) {
        if (this.id === id) {
            this._super();
            $(document).trigger("save-tile-layers");
        }
    },

    _getOffset: function (viewportScale) {
        var scaleFactor, offsetX, offsetY;

        // Ratio of original JP2 image scale to the viewport/desired image scale
        scaleFactor = this.image.scale / viewportScale;

        this.width  = this.image.width  * scaleFactor;
        this.height = this.image.height * scaleFactor;

        // Use Math.floor to avoid unnecessary tile requests when the computed
        // dimensions are something like 2048.32
        this.tileLoader.updateDimensions(Math.floor(this.width),
                                         Math.floor(this.height));

        // Offset image
        offsetX = parseFloat((this.image.offsetX * scaleFactor).toPrecision(8));
        offsetY = parseFloat((this.image.offsetY * scaleFactor).toPrecision(8));
        return {
            x: offsetX,
            y: offsetY
        }
    },

    /**
     * Computes layer parameters relative to the current viewport image scale
     *
     * The values for offsetX and offsetY reflect the x and y coordinates
     * of the reference pixel with an origin at the center of the image.
     */
    _updateDimensions: function () {
        let offset = this._getOffset(this.viewportScale);

        // Update layer dimensions
        let left = (-this.width  / 2) - offset.x;
        let top = (-this.height / 2) - offset.y;
        this.dimensions = {
            "left"   : left,
            "top"    : top,
            "bottom" : top + this.height,
            "right"  : left + this.width
        };

        // Center of the tile layer i.e. center of the overall image.
        this.domNode.css({
            "left": - offset.x,
            "top" : - offset.y
        });
    },

    /**
     *
     */
    onLoadImage: function () {
        this.loaded = true;
        this._updateDimensions();

        this.tileLoader.reloadTiles(false);

        // Update viewport sandbox if necessary
        $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
    },

    /**
     * @description Returns an array container the values of the positions for each edge of the TileLayer.
     */
    getDimensions: function () {
        return this.dimensions;
    },

    /**
     * @description Update the tile layer's opacity
     * @param {int} Percent opacity to use
     */
    setOpacity: function (opacity) {
        this.opacity = opacity;

        // IE
        if (!$.support.opacity) {
            $(this.domNode).find(".tile").each(function () {
                $(this).css("opacity", opacity / 100);
            });
        }
        // Everyone else
        else {
            $(this.domNode).css("opacity", opacity / 100);
        }
    },

    /**
     * @description Update the tile difference type
     * @param {int} Percent opacity to use
     */
    setDifference: function (difference) {
        this.difference = parseInt(difference);
        //this.tileLoader.reloadTiles(true);
    },

    /**
     * @description Update the tile difference time step count
     * @param {int} Percent opacity to use
     */
    setDiffCount: function (diffCount) {
        this.diffCount = parseInt(diffCount);
        //this.tileLoader.reloadTiles(true);
    },

    /**
     * @description Update the tile difference time step
     * @param {int} Percent opacity to use
     */
    setDiffTime: function (diffTime) {
        this.diffTime = parseInt(diffTime);
        //this.tileLoader.reloadTiles(true);
    },

    /**
     * @description Update the tile base difference type
     * @param {int} Percent opacity to use
     */
    setDiffDate: function (baseDiffTime) {
	    if(typeof baseDiffTime == 'number' || baseDiffTime == null){
			baseDiffTime = $('#date').val()+' '+$('#time').val();
		}
        this.baseDiffTime = baseDiffTime;
        //this.tileLoader.reloadTiles(true);
    },

    /**
     * Reloads tiles if visibility is being set to true.
     * This method is almost identical to onLoadImage, except that reloadTiles
     * needs to be called with true instead of false.
     */
    setVisibility: function (visible) {
        this._super(visible);
        if (visible) {
            this._updateDimensions();
            this.tileLoader.reloadTiles(true);

            // Update viewport sandbox if necessary
            $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
        }
    },

    /**
     * @description Sets up image properties that are not dependent on the specific image,
     * but only on the type (source) of the image.
     *
     * IE7: Want z-indices < 1 to ensure event icon visibility
     */
    _loadStaticProperties: function () {
        this.domNode.css("z-index", -10 - parseInt(this.order, 10));//this.domNode.css("z-index", parseInt(this.layeringOrder, 10) - 10);

        // opacity
        if (this.opacity !== 100) {
            this.setOpacity(this.opacity);
        }

        // visibility
        if (!this.visible) {
            this.setVisibility(false);
        }
    },

    /**
     * @description Toggle image sharpening
     */
    toggleSharpening: function () {
        if (this.sharpen === true) {

        } else {
            //$(this.domNode.childElements());
            //$("img.tile[src!=resources/images/transparent_512.gif]").pixastic("sharpen", {amount: 0.35});
        }
        this.sharpen = !this.sharpen;
    },

    /**
     * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
     * @param {Int} x Tile X-coordinate
     * @param {Int} y Tile Y-coordinate
     * @param {Function} onTileLoadComplete -- callback function to this.tileLoader.onTileLoadComplete
     * @returns {String} URL to retrieve the requested tile
     *
     * IE: CSS opacities do not behave properly with absolutely positioned elements. Opacity is therefor
     * set at tile-level.
     */
    getTile: function (event, x, y, onTileLoadComplete) {
        var top, left, ts, img, rf, emptyTile;

        left = x * this.tileSize;
        top  = y * this.tileSize;
        ts   = this.tileSize;

        emptyTile = 'resources/images/transparent_' + ts + '.gif';

        //img = $('<img class="tile" style="left:' + left + 'px; top:' + top + 'px;"></img>');
        img = this.setImageProperties();

        img = $(img).addClass("tile").css({"left": left, "top": top}).attr("alt", "");

        // IE (can only adjust opacity at the image level)
        if (!$.support.opacity) {
            img.css("opacity", this.opacity / 100);
        }

        // Load tile
        let layer = this;
        img.on('error', function (e) {
            layer._replaceTile(x, y, this);
            img.unbind("error");
            $(this).attr("src", emptyTile);
        }).on('load', function () {
            layer._replaceTile(x, y, this);
            $(this).width(512).height(512); // Wait until image is done loading specify dimensions in order to prevent
                                            // Firefox from displaying place-holders
        }).attr("src", this.getTileURL(x, y));
        $(img).width(0).height(0);

        //      Makes sure all of the images have finished downloading before swapping them in
        img.appendTo(this.domNode);
        if (onTileLoadComplete) {
            img.on('load', onTileLoadComplete);
        }
    },

    /**
     * Replaces the image tile at position x, y with the new image tile
     * @param {number} x
     * @param {number} y
     * @param {HTMLImageElement} img
     */
    _replaceTile(x, y, img) {
        this._removeTile(x, y);
        this._assignTileIndex(x, y, img);
    },

    /**
     * Stores a reference to the given image element at coordinate x, y
     * @param {number} x
     * @param {number} y
     * @param {HTMLImageElement} img
     */
    _assignTileIndex(x, y, img) {
        if (!this._tiles.hasOwnProperty(x)) {
            this._tiles[x] = {};
        }
        this._tiles[x][y] = img;
    },

    /**
     * Removes the tile/img tag at coordinate x, y
     * @param {number} x
     * @param {number} y
     */
    _removeTile(x, y) {
        if (this._tiles.hasOwnProperty(x) && this._tiles[x].hasOwnProperty(y)) {
            console.log("Removing tile");
            this._tiles[x][y].remove();
        }
    },

    /**
     * Sets event handlers and properties of the image
     */
    setImageProperties: function () {
        var img, rf;

        rf = function () {
            return false;
        };

        img = new Image();

        img.unselectable = 'on';

        img.onmousedown   = rf;
        img.ondrag        = rf;
        img.onmouseover   = rf;
        img.oncontextmenu = rf;
        img.onselectstart = rf;
        img.galleryimg    = 'no';
        return img;
    },

    getArea: function () {
        return this.width * this.height;
    },

    /**
     * Returns the current positional offset
     * @note Internal usage in this class should use _getOffset instead.
     */
    getCurrentOffset: function () {
        return this._getOffset(this.viewportScale);
    }
});

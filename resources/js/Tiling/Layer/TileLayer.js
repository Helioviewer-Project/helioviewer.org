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
        var dateDiff 	   = new Date(+new Date() - 60*60*1000);
        this.baseDiffTime  = (typeof baseDiffTime == 'undefined' ? $('#date').val()+' '+$('#time').val() : baseDiffTime);
        this.name          = name;
    },

    updateTileVisibilityRange: function (range) {
        // The general visibility range doesn't account for any x/y offsets.
        // Update the start/end values based on the known offset.
        let offset = this._getOffset();
        let xTileOffset = Math.round(offset.x / this.tileSize);
        range.xStart += xTileOffset;
        range.xEnd += xTileOffset;

        let yTileOffset = Math.round(offset.y / this.tileSize);
        range.yStart += yTileOffset;
        range.yEnd += yTileOffset;
        this.tileLoader.updateTileVisibilityRange(range, this.loaded);
    },

    /**
     *
     */
    updateImageScale: function (scale, tileVisibilityRange) {
        // With pinch scaling, these can end up being non-whole numbers from rounding
        // errors. Instead of -1, we get -0.9999999 which results in the whole
        // range being wrong.
        // Round everything to whole numbers to make sure this always works.
        tileVisibilityRange.xStart = Math.round(tileVisibilityRange.xStart);
        tileVisibilityRange.yStart = Math.round(tileVisibilityRange.yStart);
        tileVisibilityRange.xEnd = Math.round(tileVisibilityRange.xEnd);
        tileVisibilityRange.yEnd = Math.round(tileVisibilityRange.yEnd);
        this.viewportScale = scale;
        this._updateDimensions();

        this.tileLoader.setTileVisibilityRange(tileVisibilityRange);

        if (this.visible) {
            this.tileLoader.reloadTiles(true);
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

    _getOffset: function () {
        var scaleFactor, offsetX, offsetY;

        // Ratio of original JP2 image scale to the viewport/desired image scale
        scaleFactor = this.image.scale / this.viewportScale;

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
     * Center offset:
     *   The values for offsetX and offsetY reflect the x and y coordinates with the origin
     *   at the bottom-left corner of the image, not the top-left corner.
     */
    _updateDimensions: function () {
        let offset = this._getOffset();

        // Update layer dimensions
        this.dimensions = {
            "left"   : Math.max(this.width  / 2, (this.width  / 2) - offset.x),
            "top"    : Math.max(this.height / 2, (this.height / 2) - offset.y),
            "bottom" : Math.max(this.height / 2, (this.height / 2) + offset.y),
            "right"  : Math.max(this.width  / 2, (this.width  / 2) + offset.x)
        };

        // Center of the tile layer
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
        this.domNode.css("z-index", -11 - parseInt(this.order, 10));//this.domNode.css("z-index", parseInt(this.layeringOrder, 10) - 10);

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
        img.on('error', function (e) {
            img.unbind("error");
            $(this).attr("src", emptyTile);
        }).on('load', function () {
            $(this).width(512).height(512); // Wait until image is done loading specify dimensions in order to prevent
                                            // Firefox from displaying place-holders
        }).attr("src", this.getTileURL(x, y));

        //      Makes sure all of the images have finished downloading before swapping them in
        img.appendTo(this.domNode);
        if (onTileLoadComplete) {
            img.on('load', onTileLoadComplete);
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
    }
});

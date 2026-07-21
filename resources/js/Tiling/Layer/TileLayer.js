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
        this.tileset = 0;
        // Mapping of x, y coordinates to HTML img tags
        this._tiles = {}
    },
    /**
     * Returns the affine transformation from the canonical tile coordinate
     * system to browser coordinates.
     *
     * The backend CD matrix maps FITS pixel deltas to solar-world deltas.
     * Browser Y increases downwards, so the off-diagonal Y terms must be
     * converted accordingly.
     *
     * CSS matrix layout:
     *
     * x' = a*x + c*y
     * y' = b*x + d*y
     */
    _getWCSTransform: function () {
        let identity = {
            a: 1,
            b: 0,
            c: 0,
            d: 1
        };

        if (
            !this.image ||
            !this.image.wcs ||
            !Array.isArray(this.image.wcs.cd) ||
            !Array.isArray(this.image.wcs.cd[0]) ||
            !Array.isArray(this.image.wcs.cd[1])
        ) {
            return identity;
        }

        let canonicalScale = parseFloat(this.image.scale);
        let cd = this.image.wcs.cd;

        if (
            !Number.isFinite(canonicalScale) ||
            Math.abs(canonicalScale) < 1.0e-15
        ) {
            return identity;
        }

        let matrix = {
            a: parseFloat(cd[0][0]) / canonicalScale,
            b: -parseFloat(cd[1][0]) / canonicalScale,
            c: -parseFloat(cd[0][1]) / canonicalScale,
            d: parseFloat(cd[1][1]) / canonicalScale
        };

        let determinant =
            (matrix.a * matrix.d) -
            (matrix.b * matrix.c);

        if (
            !Number.isFinite(matrix.a) ||
            !Number.isFinite(matrix.b) ||
            !Number.isFinite(matrix.c) ||
            !Number.isFinite(matrix.d) ||
            !Number.isFinite(determinant) ||
            Math.abs(determinant) < 1.0e-15
        ) {
            return identity;
        }

        return matrix;
    },

    /**
     * Applies the native WCS transform to one point.
     */
    _transformWCSPoint: function (point) {
        let matrix = this._getWCSTransform();

        return {
            x:
                (matrix.a * point.x) +
                (matrix.c * point.y),

            y:
                (matrix.b * point.x) +
                (matrix.d * point.y)
        };
    },

    /**
     * Applies the inverse native WCS transform to one viewport point.
     */
    _inverseTransformWCSPoint: function (point) {
        let matrix = this._getWCSTransform();

        let determinant =
            (matrix.a * matrix.d) -
            (matrix.b * matrix.c);

        return {
            x:
                (
                    (matrix.d * point.x) -
                    (matrix.c * point.y)
                ) / determinant,

            y:
                (
                    (-matrix.b * point.x) +
                    (matrix.a * point.y)
                ) / determinant
        };
    },

    /**
     * Converts an axis-aligned viewport rectangle into an axis-aligned
     * bounding box in the untransformed tile coordinate system.
     */
    _inverseTransformViewportBounds: function (vpCoords) {
        let corners = [
            {
                x: vpCoords.left,
                y: vpCoords.top
            },
            {
                x: vpCoords.right,
                y: vpCoords.top
            },
            {
                x: vpCoords.right,
                y: vpCoords.bottom
            },
            {
                x: vpCoords.left,
                y: vpCoords.bottom
            }
        ];

        let transformed = corners.map(
            point => this._inverseTransformWCSPoint(point)
        );

        let xValues = transformed.map(point => point.x);
        let yValues = transformed.map(point => point.y);

        return {
            left: Math.min.apply(null, xValues),
            right: Math.max.apply(null, xValues),
            top: Math.min.apply(null, yValues),
            bottom: Math.max.apply(null, yValues)
        };
    },

    /**
     * Transforms an axis-aligned rectangle and returns the bounding box of
     * its four transformed corners.
     */
    _transformRectangleBounds: function (rectangle) {
        let corners = [
            {
                x: rectangle.left,
                y: rectangle.top
            },
            {
                x: rectangle.right,
                y: rectangle.top
            },
            {
                x: rectangle.right,
                y: rectangle.bottom
            },
            {
                x: rectangle.left,
                y: rectangle.bottom
            }
        ];

        let transformed = corners.map(
            point => this._transformWCSPoint(point)
        );

        let xValues = transformed.map(point => point.x);
        let yValues = transformed.map(point => point.y);

        return {
            left: Math.min.apply(null, xValues),
            right: Math.max.apply(null, xValues),
            top: Math.min.apply(null, yValues),
            bottom: Math.max.apply(null, yValues)
        };
    },
    /**
     * Updates the tile range required by the visible viewport.
     *
     * For transformed images the viewport is first mapped through the inverse
     * WCS matrix. This ensures that tiles in the rotated corners are loaded.
     */
    updateTileVisibilityRange: function (vpCoords) {
        this._lastViewportCoords = {
            left: vpCoords.left,
            right: vpCoords.right,
            top: vpCoords.top,
            bottom: vpCoords.bottom
        };

        let layerViewport =
            this._inverseTransformViewportBounds(vpCoords);

        let mobileScale =
            Helioviewer.userSettings.get(
                "mobileZoomScale"
            ) || 1;

        let tileSize =
            this.tileSize * mobileScale;

        let offset = this.getCurrentOffset();

        /*
         * Convert solar-centered layer coordinates into coordinates relative
         * to the image center.
         */
        let shiftedViewport = {
            left: layerViewport.left + offset.x,
            right: layerViewport.right + offset.x,
            top: layerViewport.top + offset.y,
            bottom: layerViewport.bottom + offset.y
        };

        /*
         * Include one extra tile around every edge. This avoids gaps during
         * rotation, interpolation and interactive movement.
         */
        let tileVisibilityRange = {
            xStart:
                Math.floor(
                    shiftedViewport.left / tileSize
                ) - 1,

            xEnd:
                Math.ceil(
                    shiftedViewport.right / tileSize
                ),

            yStart:
                Math.floor(
                    shiftedViewport.top / tileSize
                ) - 1,

            yEnd:
                Math.ceil(
                    shiftedViewport.bottom / tileSize
                )
        };

        if (
            this.tileVisibilityRange.xStart !==
                tileVisibilityRange.xStart ||

            this.tileVisibilityRange.xEnd !==
                tileVisibilityRange.xEnd ||

            this.tileVisibilityRange.yStart !==
                tileVisibilityRange.yStart ||

            this.tileVisibilityRange.yEnd !==
                tileVisibilityRange.yEnd
        ) {
            this.tileLoader.updateTileVisibilityRange(
                tileVisibilityRange,
                this.loaded
            );

            this.tileVisibilityRange =
                tileVisibilityRange;
        }
    },

    /**
     *
     */
    /**
     * Updates the viewport scale and recomputes WCS-aware tile visibility.
     */
    updateImageScale: function (scale) {
        this.viewportScale = scale;

        this._updateDimensions();

        if (this._lastViewportCoords) {
            /*
             * Force range recomputation even when the numerical tile indexes
             * happen to remain unchanged across two zoom levels.
             */
            this.tileVisibilityRange = {
                xStart: null,
                xEnd: null,
                yStart: null,
                yEnd: null
            };

            this.updateTileVisibilityRange(
                this._lastViewportCoords
            );
        }

        /*
         * A zoom changes the imageScale parameter used by getTile. Existing
         * tile coordinates may remain numerically identical, but their URLs
         * and rendered contents are no longer valid for the new scale.
         */
        if (this.visible && this.loaded) {
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

    /**
     * Returns the solar-reference-pixel offset in the canonical tile grid.
     *
     * The tile server still uses CDELT1 as its canonical extraction scale.
     * The WCS matrix subsequently transforms that grid into the physical
     * X/Y geometry.
     */
    _getOffset: function (viewportScale) {
        let scaleFactor =
            this.image.scale / viewportScale;

        this.width =
            this.image.width * scaleFactor;

        this.height =
            this.image.height * scaleFactor;

        this.tileLoader.updateDimensions(
            Math.floor(this.width),
            Math.floor(this.height)
        );

        let offsetX = parseFloat(
            (
                this.image.offsetX *
                scaleFactor
            ).toPrecision(8)
        );

        let offsetY = parseFloat(
            (
                this.image.offsetY *
                scaleFactor
            ).toPrecision(8)
        );

        return {
            x: offsetX,
            y: offsetY
        };
    },

    /**
     * Computes the transformed layer dimensions and positions its solar
     * origin correctly in the moving container.
     */
    _updateDimensions: function () {
        let offset =
            this._getOffset(this.viewportScale);

        let untransformedBounds = {
            left:
                (-this.width / 2) -
                offset.x,

            right:
                (this.width / 2) -
                offset.x,

            top:
                (-this.height / 2) -
                offset.y,

            bottom:
                (this.height / 2) -
                offset.y
        };

        this.dimensions =
            this._transformRectangleBounds(
                untransformedBounds
            );

        let transformedOffset =
            this._transformWCSPoint(offset);

        let matrix =
            this._getWCSTransform();

        /*
         * Tiles are positioned around the image center. Position that center
         * relative to the solar origin, then transform all tile coordinates.
         */
        this.domNode.css({
            left: -transformedOffset.x,
            top: -transformedOffset.y,

            "transform-origin": "0 0",

            transform:
                "matrix(" +
                matrix.a + "," +
                matrix.b + "," +
                matrix.c + "," +
                matrix.d + "," +
                "0,0)"
        });
    },

    /**
     *
     */
    onLoadImage: function () {
        this.loaded = true;
        this._updateDimensions();
        this._applyLayerCompositing();

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
    /**
     * Returns true for layers that must use the same additive composition
     * as the Helioviewer 3D renderer.
     */
    _usesAdditiveBlending: function () {
        let imageName =
            this.image && this.image.name
                ? String(this.image.name).toUpperCase()
                : "";

        let labels =
            this.image && Array.isArray(this.image.uiLabels)
                ? this.image.uiLabels
                : [];

        let instrumentIsSpice = labels.some(label => {
            return label &&
                String(label.name).toUpperCase() === "SPICE";
        });

        return imageName.includes("SPICE") ||
            instrumentIsSpice;
    },

    /**
     * Applies the closest CSS equivalent of Three.js AdditiveBlending.
     *
     * Three.js:
     *     destination + opacity * source
     *
     * CSS:
     *     mix-blend-mode: plus-lighter
     *
     * "screen" is used only as a fallback for browsers that do not support
     * plus-lighter.
     */
    _applyLayerCompositing: function () {
        let opacity = parseFloat(this.opacity);

        if (!Number.isFinite(opacity)) {
            opacity = 100;
        }

        opacity = Math.max(
            0,
            Math.min(100, opacity)
        );

        let blendMode = "normal";

        if (this._usesAdditiveBlending()) {
            let supportsPlusLighter =
                window.CSS &&
                typeof window.CSS.supports === "function" &&
                window.CSS.supports(
                    "mix-blend-mode",
                    "plus-lighter"
                );

            blendMode = supportsPlusLighter
                ? "plus-lighter"
                : "screen";
        }

        $(this.domNode).css({
            "opacity": opacity / 100,
            "filter": "none",
            "mix-blend-mode": blendMode
        });
    },

    /**
     * Updates layer opacity and reapplies its composition mode.
     */
    setOpacity: function (opacity) {
        opacity = parseFloat(opacity);

        if (!Number.isFinite(opacity)) {
            return;
        }

        this.opacity = Math.max(
            0,
            Math.min(100, opacity)
        );

        this._applyLayerCompositing();
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
        this.baseDiffTime = formatLyrDateString(baseDiffTime);
    },

    /**
     * Reloads tiles if visibility is being set to true.
     * This method is almost identical to onLoadImage, except that reloadTiles
     * needs to be called with true instead of false.
     * @param {Boolean} visible, if true show if false hide
     * @return {void}
     */
    setVisibility: function (visible) {
        this._super(visible);
        if (visible) {
            this._updateDimensions();
            this._applyLayerCompositing();
            this.tileLoader.reloadTiles(true);

            // Update viewport sandbox if necessary
            $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
        }
    },

    /**
     * Block this layer and restrict it from showing images,
     * Used in situations where there is no image coming from backend;
     * We are using this function to maskover if there is any left over image inside the layer .
     * @return {void}
     */
    blockLayer: function() {
        this.domNode.addClass("blocked-layer");
    },

    /**
     * Unblock this layer and let it show images,
     * Used in situations where there is no image coming from backend;
     * @see blockLayer function
     * @return {void}
     */
    unblockLayer: function() {
        this.domNode.removeClass("blocked-layer");
    },

    /**
     * @description Sets up image properties that are not dependent on the specific image,
     * but only on the type (source) of the image.
     *
     * IE7: Want z-indices < 1 to ensure event icon visibility
     */
    _loadStaticProperties: function () {
        this.domNode.css("z-index", -10 - parseInt(this.order, 10));//this.domNode.css("z-index", parseInt(this.layeringOrder, 10) - 10);

        // Apply opacity and the instrument-specific composition mode even
        // when opacity is 100%. SPICE still needs additive blending at 100%.
        this._applyLayerCompositing();

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

    _updateTileset: function (tileset) {
        if (tileset > this.tileset) {
            this.tileset = tileset;
        }
    },

    /**
     * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
     * @param {Int} x Tile X-coordinate
     * @param {Int} y Tile Y-coordinate
     * @param {Int} tileset Number representing the current set of tiles
     * @param {Function} onTileLoadComplete -- callback function to this.tileLoader.onTileLoadComplete
     * @returns {String} URL to retrieve the requested tile
     *
     * IE: CSS opacities do not behave properly with absolutely positioned elements. Opacity is therefor
     * set at tile-level.
     */
    getTile: function (event, x, y, tileset, onTileLoadComplete) {
        var top, left, ts, img, rf, emptyTile;
        // Track the latest tileset
        this._updateTileset(tileset);

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

        const renderTile = () => {
            if (tileset >= this.tileset) {
                this._replaceTile(x, y, img);
                if (onTileLoadComplete) {
                    onTileLoadComplete();
                }
            } else {
                // remove stale tile.
                $(img).remove();
            }
        }

        // Load tile
        img.on('error', function (e) {
            renderTile();
            img.unbind("error");
            $(this).attr("src", emptyTile);
        }).on('load', function () {
            renderTile();
            $(this).width(512).height(512); // Wait until image is done loading specify dimensions in order to prevent
                                            // Firefox from displaying place-holders
        }).attr("src", this.getTileURL(x, y));
        $(img).width(0).height(0);

        //      Makes sure all of the images have finished downloading before swapping them in
        img.appendTo(this.domNode);
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
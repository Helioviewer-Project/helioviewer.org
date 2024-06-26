/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp */
"use strict";
var TileLoader = Class.extend(
    /** @lends TileLayer.prototype */
    {
    /**
     * @constructs
     * @description Creates a new TileLoader
     */
    init: function (domNode, tileSize, tileVisibilityRange) {
        this.domNode       = domNode;
        this.tileSize      = tileSize;
        this.loadedTiles   = {};
        this.width         = 0;
        this.height        = 0;
        this.tileVisibilityRange  = tileVisibilityRange;
    },

    /**
     *
     */
    updateTileVisibilityRange: function (range, tilesLoaded) {
        this.tileVisibilityRange = range;

        if (tilesLoaded) {
            return this._checkTiles();
        }
    },

    setTileVisibilityRange: function (range) {
        this.tileVisibilityRange = range;
    },

    updateDimensions: function (width, height) {
        this.width  = width;
        this.height = height;
    },

    /**
     * @description Determines the boundaries for the valid tile range
     * @param {number} width Image width
     * @param {number} height Image height
     * @return {Array} An array containing the tile boundaries
     */
    _getValidTileRangeForDimensions: function (width, height) {
        var numTilesX, numTilesY, boundaries, ts = this.tileSize;

        // Number of tiles for the entire image
        numTilesX = Math.max(2, Math.ceil(width  / ts));
        numTilesY = Math.max(2, Math.ceil(height  / ts));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ((numTilesX % 2) !== 0) {
            numTilesX += 1;
        }

        if ((numTilesY % 2) !== 0) {
            numTilesY += 1;
        }

        // boundaries for tile range
        boundaries = {
            xStart: - (numTilesX / 2),
            xEnd  :   (numTilesX / 2) - 1,
            yStart: - (numTilesY / 2),
            yEnd  :   (numTilesY / 2) - 1
        };

        return boundaries;
    },

    /**
     * Gets the valid tile range for the current width/height
     * @return {Array} An array containing the tile boundaries
     */
    getValidTileRange: function () {
        return this._getValidTileRangeForDimensions(this.width, this.height);
    },

    /**
     *
     */
    _checkTiles: function () {
        var i, j;

        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (!this.loadedTiles[i]) {
                    this.loadedTiles[i] = {};
                }
                if (!this.validTiles) {
                    this.validTiles = {};
                }
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }
                if (!this.loadedTiles[i][j] && this.validTiles[i][j]) {
                    this.loadedTiles[i][j] = true;
                    $(this.domNode).trigger('get-tile', [i, j]);
                }
            }
        }
    },

    /**
     * @description Creates an array of tile dom-nodes
     * @return {Array} An array containing pointers to all of the tiles currently loaded
     */
    getTileArray: function () {
        var tiles = [];

        this.domNode.children().each(function () {
            tiles.push(this);
        });

        return tiles;
    },

    /**
     * Executes a function over the given visibility range
     * @param {Object} visibilityRange the x/yStart and x/yEnd fields
     * @param {function} fn function to execute for each tile. input parameters must be (x, y)
     */
    _iterateVisibilityRange: function (visibilityRange, fn) {
        for (let i = visibilityRange.xStart; i <= visibilityRange.xEnd; i += 1) {
            for (let j = visibilityRange.yStart; j <= visibilityRange.yEnd; j += 1) {
                fn(i, j);
            }
        }
    },

    /**
     * @description reloads displayed tiles
     * @param {Boolean} removeOldTilesFirst Whether old tiles should be removed before or after new ones are loaded.
     */
    reloadTiles: function (removeOldTilesFirst) {
        this.removeOldTilesFirst = removeOldTilesFirst;
        this.numTilesLoaded      = 0;
        this.loadedTiles         = {};
        this.computeValidTiles();

        this.oldTiles = this.getTileArray();

        // When zooming, remove old tiles right away to avoid visual glitches
        if (removeOldTilesFirst) {
            this.removeTileDomNodes(this.oldTiles);
        }
        this.numTiles = 0;

        // Load tiles that lie within the current viewport
        this._iterateVisibilityRange(this.tileVisibilityRange, (i, j) => {
            if (this.validTiles[i] && this.validTiles[i][j]) {
                this.numTiles += 1;
                $(this.domNode).trigger('get-tile', [i, j, $.proxy(this.onTileLoadComplete, this)]);

                if (!this.loadedTiles[i]) {
                    this.loadedTiles[i] = {};
                }

                this.loadedTiles[i][j] = true;
            }
        });

        // Enable eager loading
        this._preloadNextScale(true);
        this._preloadNextScale(false);
    },

    _preloadNextScale: function (zoomIn) {
        // If zooming in, then the next width/height is * 2
        // If zooming out, then the next width/height is * 0.5
        let multiplier = zoomIn ? 2 : 0.5;
        let nextWidth = this.width * multiplier;
        let nextHeight = this.height * multiplier;
        // Maximum scale is 4k, so if the next zoom level is highter, then don't
        // Minimum scale is 15 pixels. So less than that should also be ignored
        if (nextWidth >= 15 && nextWidth <= 4000) {
            let visibilityRange = this._getValidTileRangeForDimensions(nextWidth, nextHeight);
            this._iterateVisibilityRange(visibilityRange, (i, j) => {
                $(this.domNode).trigger('preload-tile', [zoomIn, i, j]);
            });
        }
    },

    onTileLoadComplete: function () {
        this.numTilesLoaded += 1;

        // After all tiles have loaded, stop indicator (and remove old-tiles if haven't already)
        if (this.numTilesLoaded === this.numTiles) {
            if (!this.removeOldTilesFirst) {
                this.removeTileDomNodes(this.oldTiles);
            }
        }
    },

    /**
     * @description remove tile dom-nodes
     */
    removeTileDomNodes: function (tileArray) {
        $.each(tileArray, function () {
            if (this.parentNode) {
                $(this).remove();
            }
        });
    },

    /**
     * @description Creates a 2d array representing the range of valid (potentially data-containing) tiles
     */
    computeValidTiles: function () {
        var i, j, indices;

        indices = this.getValidTileRange();

        // Reset array
        this.validTiles = {};

        // Update validTiles array
        for (i = indices.xStart; i <= indices.xEnd; i += 1) {
            for (j = indices.yStart; j <= indices.yEnd; j += 1) {
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }
                this.validTiles[i][j] = true;
            }
        }
    }
});

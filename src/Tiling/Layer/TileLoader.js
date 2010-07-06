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
     * @return {Array} An array containing the tile boundaries
     */
    getValidTileRange: function () {
        var numTilesX, numTilesY, boundaries, ts = this.tileSize;

        // Number of tiles for the entire image
        numTilesX = Math.max(2, Math.ceil(this.width  / ts));
        numTilesY = Math.max(2, Math.ceil(this.height  / ts));
        
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
     * 
     */
    _checkTiles: function () {
        var i, j;
        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (!this.loadedTiles[i]) {
                    this.loadedTiles[i] = {};
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
     * @return {Array} An array containing pointgetDimensions: ers to all of the tiles currently loaded
     */
    getTileArray: function () {
        var tiles = [];
        
        this.domNode.children().each(function () {
            tiles.push(this);
        });
        
        return tiles;
    },
    
    /**
     * @description reloads displayed tiles
     * @param {Boolean} removeOldTilesFirst Whether old tiles should be removed before or after new ones are loaded.
     */
    reloadTiles: function (removeOldTilesFirst) {
        var i, j, numTiles = 0, numTilesLoaded = 0, tile, onLoadComplete, self = this;

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
        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (this.validTiles[i] && this.validTiles[i][j]) {
                    this.numTiles += 1;
                    $(this.domNode).trigger('get-tile', [i, j, $.proxy(this.onTileLoadComplete, this)]);
                                        
                    if (!this.loadedTiles[i]) {
                        this.loadedTiles[i] = {};
                    }
    
                    this.loadedTiles[i][j] = true;
                }
            }
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

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
var TileLayer = Layer.extend( 
    /** @lends TileLayer.prototype */
    {    
    /**
     * @description Default TileLayer options
     */
    defaultOptions: {
        type        : 'TileLayer',
        opacity     : 100,
        sharpen     : false
    },

    /**
     * @constructs
     * @description Creates a new TileLayer
     * @param {Object} viewport Viewport to place the tiles in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *      <b>type</b>        - The type of the layer (used by layer manager to differentiate event vs.
     *                           tile layers)<br>
     *      <b>tileSize</b>    - Tilesize to use<br>
     *      <b>source</b>      - Tile source ["database" | "filesystem"]<br>
     *      <b>opacity</b>     - Default opacity<br>
     * </div>
     */
    init: function (index, date, tileSize, viewportScale, tileVisibilityRange, api, name, visible, opacity, server, loadDefaults) {
        $.extend(this, this.defaultOptions);
        this._super();
        
        this.loaded = false;
        
        this._requestDate = date;
        this.domNode = $('<div class="tile-layer-container" />').appendTo("#moving-container");
        
        this.tileSize      = tileSize;
        this.viewportScale = viewportScale;

        this.visible       = visible;
        this.opacity       = opacity;
        this.name          = name;

        this.tileVisibilityRange  = tileVisibilityRange;

        this.tiles = {};
        if (loadDefaults) {
	    this._loadStaticProperties();
	    this.image = new BlankImage(date, api, server, $.proxy(this.onLoadImage, this));
        }
    },

    /**
     * Computes layer parameters relative to the current viewport image scale
     * 
     * Notes:
     * 
     * 1. Rotation:
     *   Currently, EIT and MDI images are prerotated, and their corresponding meta-information
     *   is guaranteed to be accurate. LASCO images on the other hand are rotated during FITS -> JP2
     *   conversion. The meta-information from the FITS header is not modified, however, and reflects
     *   the original unrotated image. Therefore, when rotated = true, the coordinates should be flipped
     *   to reflect the rotation that was already done to the image itself.
     *   
     * 2. Center offset:
     *   The values for origSunCenterOffsetX and origSunCenterOffsetY reflect the x and y coordinates with the origin
     *   at the bottom-left corner of the image, not the top-left corner.
     */
    _computeRelativeParameters: function () {
        // Ratio of original JP2 image scale to the viewport/desired image scale
        this.scaleFactor = this.image.scale / this.viewportScale;
        
        this.width  = this.image.width  * this.scaleFactor;
        this.height = this.image.height * this.scaleFactor;
        
        // Offset image
        this.offsetX = parseFloat((this.image.offsetX * this.scaleFactor).toPrecision(8));
        this.offsetY = parseFloat((this.image.offsetY * this.scaleFactor).toPrecision(8));

        // Update layer dimensions
	this.dimensions = {
		"left"   : Math.max(this.width  / 2, (this.width  / 2) - this.offsetX),
		"top"    : Math.max(this.height / 2, (this.height / 2) - this.offsetY),
		"bottom" : Math.max(this.height / 2, (this.height / 2) + this.offsetY),
		"right"  : Math.max(this.width  / 2, (this.width  / 2) + this.offsetX)
	};

        // Center of the tile layer
        this.domNode.css({
            "left": - this.offsetX,
            "top" : - this.offsetY
        });
    },
    
    /**
     * 
     */
    updateTileVisibilityRange: function (range) {
        this.tileVisibilityRange = range;
        
        if (this.loaded) {
            this._checkTiles();
        }
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
                if (!this.tiles[i]) {
                    this.tiles[i] = {};
                }
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }
                if (!this.tiles[i][j] && this.validTiles[i][j]) {
                    this.tiles[i][j] = this.getTile(i, j).appendTo(this.domNode);
                }
            }
        }
    },
    
    /**
     * 
     */
    updateImageScale: function (scale, tileVisibilityRange) {
        this.viewportScale       = scale;
        this.tileVisibilityRange = tileVisibilityRange;
        this._computeRelativeParameters();
        this.reloadTiles(true);
    },
    
    /**
     * Handles time changes
     */
    updateRequestTime: function (date) {
        this.image.updateTime(date);
    },
    
    /**
     * 
     */
    onLoadImage: function () {
        this.loaded = true;
        
        this._computeRelativeParameters();
        this.reloadTiles(false);
        
        // Update viewport sandbox if necessary
        $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
    },
    
    /**
     * @description reloads displayed tiles
     * @param {Boolean} removeOldTilesFirst Whether old tiles should be removed before or after new ones are loaded.
     */
    reloadTiles: function (removeOldTilesFirst) {
        var i, j, old, numTiles = 0, numTilesLoaded = 0, tile, onLoadComplete, self = this;
        
        this.computeValidTiles();
        this.tiles = {};
        
        old = this.getTileArray();

        // When zooming, remove old tiles right away to avoid visual glitches
        if (removeOldTilesFirst) {
            this.removeTileDomNodes(old);
        }
        
        // When stepping forward or back in time remove old times only after all new ones have been added
        onLoadComplete = function () {
            numTilesLoaded += 1;

            // After all tiles have loaded, stop indicator (and remove old-tiles if haven't already)
            if (numTilesLoaded === numTiles) {
                if (!removeOldTilesFirst) {
                    self.removeTileDomNodes(old);
                }
            }
        };
        
        // Load tiles that lie within the current viewport
        for (i = this.tileVisibilityRange.xStart; i <= this.tileVisibilityRange.xEnd; i += 1) {
            for (j = this.tileVisibilityRange.yStart; j <= this.tileVisibilityRange.yEnd; j += 1) {
                if (!this.validTiles[i]) {
                    this.validTiles[i] = {};
                }

                if (this.validTiles[i][j]) {
                    tile = this.getTile(i, j).appendTo(this.domNode);
                                        
                    if (!this.tiles[i]) {
                        this.tiles[i] = {};
                    }
    
                    this.tiles[i][j] = {};
                    this.tiles[i][j].img = tile;
    
                    numTiles += 1;
    
                    // Makes sure all of the images have finished downloading before swapping them in
                    this.tiles[i][j].img.load(onLoadComplete);
                }
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
     * @description Returns an array container the values of the positions for each edge of the TileLayer.
     */
    getDimensions: function () {
	return this.dimensions;
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
     * @description Sets up image properties that are not dependent on the specific image,
     * but only on the type (source) of the image.
     * 
     * IE7: Want z-indices < 1 to ensure event icon visibility
     */
    _loadStaticProperties: function () {
        this.domNode.css("z-index", parseInt(this.layeringOrder, 10) - 10);
        
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
     * @description Returns a stringified version of the tile layer for use in URLs, etc
     * @return string String representation of the tile layer
     */
    serialize: function () {
        return this.image.getLayerName() + "," + (this.visible ? "1" : "0") + "," + this.opacity;
    },

    /**
     * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
     * @param {Int} x Tile X-coordinate
     * @param {Int} y Tile Y-coordinate
     * @returns {String} URL to retrieve the requested tile
     * 
     * IE: CSS opacities do not behave properly with absolutely positioned elements. Opacity is therefor 
     * set at tile-level.
     */
    getTile: function (x, y) {
        var top, left, ts, img, rf, emptyTile, uri;

        left       = x * this.tileSize;
        top        = y * this.tileSize;
        ts         = this.tileSize;
        
        rf = function () {
            return false;
        };
        
        emptyTile = 'resources/images/transparent_' + ts + '.gif';
            
        //img = $('<img class="tile" style="left:' + left + 'px; top:' + top + 'px;"></img>');
        img = new Image();

        img.unselectable = 'on';

        img.onmousedown   = rf;
        img.ondrag        = rf;
        img.onmouseover   = rf;
        img.oncontextmenu = rf;
        img.onselectstart = rf;
        img.galleryimg    = 'no';

        img = $(img).addClass("tile").css({"left": left, "top": top}).attr("alt", "");

        // IE (can only adjust opacity at the image level)
        if (!$.support.opacity) {
            img.css("opacity", this.opacity / 100);
        }

        // Load tile
        img.error(function (e) {
            img.unbind("error");
            $(this).attr("src", emptyTile);
        }).load(function () {
            $(this).width(512).height(512); // Wait until image is done loading specify dimensions in order to prevent 
                                            // Firefox from displaying place-holders
        }).attr("src", this.getTileURL(this.image.server, x, y));//this.getTileURL(this.image.server, x, y));

        return img;
    }
});

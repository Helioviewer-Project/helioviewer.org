/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLayer,
    TileLoader, tileCoordinatesToArcseconds, Helioviewer */
"use strict";
var HelioviewerTileLayer = TileLayer.extend(
    /** @lends HelioviewerTileLayer.prototype */
    {
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
    init: function (index, date, tileSize, viewportScale, tileVisibilityRange,
        hierarchy, sourceId, name, visible, opacity, difference, diffCount, diffTime, baseDiffTime, layeringOrder, order) {

		// Create a random id which can be used to link tile layer with its corresponding tile layer accordion entry
        var id = "tile-layer-" + new Date().getTime();

        this._super(index, date, tileSize, viewportScale, tileVisibilityRange,
            name, visible, opacity, difference, diffCount, diffTime, baseDiffTime, id);

        this.id = id;
        this.order = order;

        this._setupEventHandlers();

        $(document).trigger("create-tile-layer-accordion-entry",
            [index, this.id, name, sourceId, hierarchy, date, true, opacity, visible,
             $.proxy(this.setOpacity, this),
             this.difference, this.diffCount, this.diffTime, this.baseDiffTime,
             $.proxy(this.setDifference, this), $.proxy(this.setDiffCount, this), $.proxy(this.setDiffTime, this), $.proxy(this.setDiffDate, this)
            ]
        );

        this.tileLoader = new TileLoader(this.domNode, tileSize, tileVisibilityRange);

        this.image = new JP2Image(hierarchy, sourceId, date, difference, $.proxy(this.onLoadImage, this));
    },

    /**
     * onLoadImage
     */
    onLoadImage: function () {
        this.loaded = true;
        this.layeringOrder = this.image.layeringOrder;

        this._loadStaticProperties();
        this._updateDimensions();

        if (this.visible) {
            this.tileLoader.reloadTiles(false);

            // Update viewport sandbox if necessary
            $(document).trigger("tile-layer-finished-loading", [this.getDimensions()]);
        }

        $(document).trigger("update-tile-layer-accordion-entry",
                            [this.id, this.name, this.image.getSourceId(),
                             this.opacity,
                             new Date(getUTCTimestamp(this.image.date)),
                             this.image.id, this.image.hierarchy, this.image.name,
                             this.difference, this.diffCount, this.diffTime, this.baseDiffTime]);
    },

    /**
     * Preloads a tile for the next zoom level
     * @param {Event} event The event that was dispatched to execute this function
     * @param {bool} zoom If true, then uses the next zoom image scale, if false uses the next zoom-out image scale
     * @param {number} x X tile
     * @param {number} y Y tile
     */
    preloadTile: function (event, zoom, x, y) {
        let scale = zoom ? this.viewportScale / 2 : this.viewportScale * 2;
        let url = this.getTileURL(x, y, scale);
        // Only preload if the image isn't already cached/preloaded
        let preloaded = document.querySelectorAll("[href='"+url+"']");
        if (preloaded.length == 0) {
            // Create preload <link> element to tell the browser to cache the image
            let preloader = document.createElement("link");
            preloader.rel = "preload";
            preloader.as = "image";
            preloader.href = url;
            document.body.appendChild(preloader);
        }
    },

    /**
     * Returns a formatted string representing a query for a single tile
     */
    getTileURL: function (x, y, scale) {
        var baseDiffTimeStr = this.baseDiffTime;
        if(typeof baseDiffTimeStr == 'number' || baseDiffTimeStr == null){
			baseDiffTimeStr = $('#date').val()+' '+$('#time').val();
		}

        baseDiffTimeStr = formatLyrDateString(baseDiffTimeStr);

		// If scale is given via input, then let it override the global viewport scale
        let imageScale = (scale == undefined) ? this.viewportScale : scale;
        // Limit the scale to 6 decimal places so that the excess precision digits don't break caching
        imageScale = imageScale.toFixed(6);

        var params = {
            "action"      : "getTile",
            "id"          : this.image.id,
            "imageScale"  : imageScale,
            "x"           : x,
            "y"           : y,
            "difference"  : this.difference,
            "diffCount"   : this.diffCount,
            "diffTime"    : this.diffTime,
            "baseDiffTime": baseDiffTimeStr
        };

        return Helioviewer.api + "?" + $.param(params);
    },

    /**
     * @description Returns a JSON representation of the tile layer for use by the UserSettings manager
     * @return JSON A JSON representation of the tile layer
     */
    toJSON: function () {
        var return_array = {};

        return_array['uiLabels'] = Array();
        $.each( this.image.hierarchy, function(uiOrder, obj) {
            return_array['uiLabels'][uiOrder] = { 'label': obj['label'],
                                                  'name' : obj['name'] };
            return_array[obj['label']] = obj['name'];
        });

		if(typeof this.baseDiffTime == 'number' || this.baseDiffTime == null){
			this.baseDiffTime = $('#date').val()+' '+$('#time').val();
		}

        return_array['visible']  = this.visible;
        return_array['opacity']  = this.opacity;
        return_array['difference'] = this.difference;
        return_array['diffCount'] = this.diffCount;
        return_array['diffTime']  = this.diffTime;
        return_array['baseDiffTime']  = this.baseDiffTime;

        return return_array;
    },

    /**
     * @description Sets up event-handlers to deal with viewport motion
     */
    _setupEventHandlers: function () {
        $(this.domNode).bind('get-tile', $.proxy(this.getTile, this));
        $(this.domNode).bind('preload-tile', $.proxy(this.preloadTile, this));
        $(document).bind('toggle-layer-visibility', $.proxy(this.toggleVisibility, this));
    }
});

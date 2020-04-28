/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, HelioviewerTileLayerManager, HelioviewerMouseCoordinates,
  Viewport, TileLayerAccordion */
"use strict";
var HelioviewerViewport = Class.extend(
    /** @lends HelioviewerViewport.prototype */
    {
    defaultOptions: {
        imageScale : 1,
        tileSize   : 512,
        minHeight  : 450,
        prefetch   : 0
    },
    dimensions              : { width: 0, height: 0 },
    maxLayerDimensions      : { width: 0, height: 0 },
    maxTileLayers           : 6,

    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     */
    init: function (options) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);

        this._rsunInArcseconds = 959.705; // Solar radius in arcseconds,
                                          // source: Djafer, Thuillier
                                          // and Sofia (2008)

        this.domNode   = $(this.id);
        this.outerNode = $(this.container);

        this.mouseCoords = new HelioviewerMouseCoordinates(this.imageScale,
            this._rsunInArcseconds, this.warnMouseCoords);

        // Viewport must be resized before movement helper and sandbox are initialized.
        this.resize();

        // Compute center offset in pixels
        var centerX = this.centerX / this.imageScale,
            centerY = this.centerY / this.imageScale;

        this.movementHelper = new ViewportMovementHelper(this.domNode, this.mouseCoords, centerX, centerY);

        this.loadDataSources();
        this.loadEventTypes();

        this._initEventHandlers();
    },

    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager,
     * and resizes when done.
     */
    loadDataSources: function () {
        var callback, dataType, tileLayerAccordion, self = this;

        callback = function (dataSources) {
            self.dataSources = dataSources;
            $(document).trigger("datasources-initialized", [dataSources]);

            // Initialize tile layers
            self._tileLayerManager = new HelioviewerTileLayerManager(self.requestDate, self.dataSources, self.tileSize, self.imageScale, self.maxTileLayers, self.tileLayers);

            $(document).trigger("update-viewport");
            // Vanilla JS Helioviewer Ready event trigger
            readyEvent = new CustomEvent("tile-layers-ready", { bubbles:true, cancelable:true });
            window.dispatchEvent(readyEvent);
        };
        $.get(Helioviewer.api, {action: "getDataSources"}, callback, Helioviewer.dataType);
    },

    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager,
     * and resizes when done.
     */
    loadEventTypes: function () {

        $(document).trigger("event-types-initialized", [this.eventTypes, this.requestDate]);

        // Initialize event layers

        this._eventLayerManager = new HelioviewerEventLayerManager(this.requestDate, this.eventTypes,
                                  this.imageScale, this.rsun, this.savedEventLayers,
                                  this.urlEventLayers);

        //$(document).trigger("update-viewport");
    },

    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision());
    },

    /**
     * Gets the window height and resizes the viewport to fit within it
     */
    resize: function () {
        var oldDimensions, width, height;

        // Get dimensions
        oldDimensions = this.dimensions;

        // Ensure minimum height
        height = Math.max(this.minHeight, $(window).height() - this._getPadHeight());

        //Update viewport height
        this.outerNode.height(height);

        // Update viewport dimensions
        this.dimensions = {
            width : this.domNode.width() + this.prefetch,
            height: this.domNode.height() + this.prefetch
        };

        // For initial resize do not attempt to update layers
        if (oldDimensions.width === 0 &&  oldDimensions.height === 0) {
            return;
        }

        // Otherwise if dimensions have changed update layers
        if (!this._hasSameDimensions(this.dimensions, oldDimensions)) {
            $(document).trigger("updateHeightsInsideViewportContainer");
            this.updateViewport();
        }
    },

    /**
     * Saves the new image scale
     */
    setImageScale: function (imageScale) {
        this.imageScale = imageScale;
    },

    updateViewportRanges: function (coordinates) {
        this._updateTileVisibilityRange(coordinates);

        if (typeof this._tileLayerManager !== "undefined") {
            this._tileLayerManager.adjustImageScale(this.imageScale);
        }
    },

    serialize: function () {
        // return this._tileLayerManager.serialize();
        return Helioviewer.userSettings.parseLayersURLString();
    },

    serializeEvents: function () {
        return Helioviewer.userSettings.parseEventsURLString();
    },

    /**
     * Returns a string representation of the layers which are visible and
     * overlap the specified region of interest
     */
    getVisibleLayers: function (roi) {
        return this._tileLayerManager.getVisibleLayers(roi);
    },

    /**
     * Makes room for header and footer if not in fullscreen mode
     */
    _getPadHeight: function () {
        if (this.domNode.hasClass("fullscreen-mode")) {
            return 0;
        }
        return this.marginTop + this.marginBottom;
    },

    /**
     * @description Returns the range of indices for the tiles to be displayed.
     * @returns {Object} The range of tiles which should be displayed
     */
    _updateTileVisibilityRange: function (coordinates) {
        if (typeof this._tileLayerManager !== "undefined") {
            this._tileLayerManager.updateTileVisibilityRange(coordinates);
        }
    },

    /**
     * Checks to see if two dimension arrays are the same
     */
    _hasSameDimensions: function (newDimensions, old) {
        return (newDimensions.width === old.width) && (newDimensions.height === old.height);
    },

    /**
     * Event listeners for interacting with the viewport
     */
    _initEventHandlers: function () {
        $(document).bind("image-scale-changed",
                         $.proxy(this.zoomViewport, this))
                   .bind("update-viewport",
                         $.proxy(this.onUpdateViewport, this))
                   .bind("load-saved-roi-position",
                         $.proxy(this.loadROIPosition, this))
                   .bind("move-viewport mousemove mouseup",
                         $.proxy(this.onMouseMove, this))
                   .bind("layer-max-dimensions-changed",
                         $.proxy(this.updateMaxLayerDimensions, this))
                   .bind("center-viewport",
                         $.proxy(this.centerViewport, this));

        $(this.domNode).bind("mousedown", $.proxy(this.onMouseMove, this));
        this.domNode.dblclick($.proxy(this.doubleClick, this));

        $('#center-button').click($.proxy(this.centerViewport, this));
        $(window).resize($.proxy(this.resize, this));

    },


    /**
     * Moves the viewport and triggers update function calls
     */
    onMouseMove: function (event, x, y) {
        switch (event.type) {
        case "mouseup":
            this.movementHelper.mouseUp(event);
            break;
        case "mousedown":
            this.movementHelper.mouseDown(event);
            break;
        case "mousemove":
            this.movementHelper.mouseMove(event);
            break;
        default:
            this.movementHelper.moveViewport(x, y);
            break;
        }
    },

    /**
     * Zooms in or out and saves the setting once it is done
     */
    zoomViewport: function (event, imageScale) {
        this.setImageScale(imageScale);

        // Moves the viewport to the correct position after zooming
        this.movementHelper.zoomTo(imageScale);

        this.updateViewport();

        // store new value
        Helioviewer.userSettings.set("state.imageScale", imageScale);
    },

    /**
     * Event handler for viewport update requests
     */
    onUpdateViewport: function (event, storeCoordinates) {
        if (typeof storeCoordinates === "undefined") {
            storeCoordinates = false;
        }

        this.updateViewport(storeCoordinates);
    },

    /**
     * Sets up initial viewport properties and loads previous settings
     *
     * Load previous centering settings by shifting moving container which
     * represents the solar center. In the simplest case, the Sun is centered,
     * and the moving container should be in the middle of the viewport sandbox
     */
    loadROIPosition: function (event) {
        var sandbox, sbWidth, sbHeight, centerX, centerY;

        sandbox = $("#sandbox");
        sbWidth  = sandbox.width();
        sbHeight = sandbox.height();

        centerX = Helioviewer.userSettings.get("state.centerX") / this.getImageScale();
        centerY = Helioviewer.userSettings.get("state.centerY") / this.getImageScale();

        $("#moving-container").css({
            "left": sbWidth  - Math.max(0, Math.min(sbWidth,  Math.round(sbWidth  / 2 + centerX))),
            "top" : sbHeight - Math.max(0, Math.min(sbHeight, Math.round(sbHeight / 2 + centerY)))
        });

        this.updateViewport();
    },

    /**
     * Tells the viewport to update itself and its tile layers
     */
    updateViewport: function (storeCoordinates) {
        var coordinates, imageScale, offsetX, offsetY;

        if (typeof storeCoordinates === "undefined") {
            storeCoordinates = false;
        }

        this.movementHelper.update();

        // Pixel coordinates for the ROI edges
        coordinates = this.movementHelper.getViewportCoords();

        imageScale = this.getImageScale();

        // ROI Offset from solar center (in arc-seconds)
        offsetX = imageScale * ((coordinates.left + coordinates.right) / 2);
        offsetY = imageScale * ((coordinates.top + coordinates.bottom) / 2);

        // Updated saved settings
        if (storeCoordinates) {
            Helioviewer.userSettings.set("state.centerX", offsetX);
            Helioviewer.userSettings.set("state.centerY", offsetY);
        }

        this.updateViewportRanges(coordinates);
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * Returns the coordinates for the top-left and bottom-right corners of the current
     * region of interest displayed in the viewport
     */
    getRegionOfInterest: function () {
        return this.movementHelper.getViewportCoords();
    },

    /**
     * Moves the image back to the center of the viewport.
     */
    centerViewport: function () {
        this.movementHelper.centerViewport();
        this.updateViewport();
        Helioviewer.userSettings.set("state.centerX", 0);
        Helioviewer.userSettings.set("state.centerY", 0);
    },

    /**
     * Centers the viewport about a point
     *
     * @param int x
     * @param int y
     */
    setViewportCenter: function (x, y) {
        this.movementHelper.moveViewport(x, y);
    },

    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (event) {
        this.movementHelper.doubleClick(event);

        if (event.shiftKey) {
            $("#zoom-out-button").click();
        } else {
            $("#zoom-in-button").click();
        }
    },

    /**
     * Updates the stored values for the maximum layer dimensions. This is used in computing the optimal
     * sandbox size in movementHelper. Assumes there is only one kind of layer (aka tileLayers). To
     * account for multiple layer types, like eventLayers, add some comparisons between dimensions.
     */
    updateMaxLayerDimensions: function (event, type, dimensions) {
        this.movementHelper.updateMaxLayerDimensions(dimensions);
    },

    /**
     * Gets information about the viewport including date, layers, and scale
     * and returns them as an array.
     */
    getViewportInformation: function () {
        return {
            coordinates : this.movementHelper.getViewportCoords(),
            imageScale  : this.imageScale,
            layers      : this.serialize(),
            events      : this.serializeEvents(),
            time        : this._tileLayerManager.getRequestDateAsISOString()
        };
    },

    /**
     * Returns the image scale in Kilometers per pixel
     */
    getImageScaleInKilometersPerPixel: function () {
        //return parseFloat(this.imageScale.toPrecision(8) *
        //(helioviewer.constants.rsun / (1000 * this._rsunInArcseconds)));
    },

    /**
     * Returns the middle time of all of the layers currently loaded
     */
    getEarliestLayerDate: function () {
        var startDate, endDate, difference, dates = [];

        // Get the observation dates associated with each later
        $.each(this._tileLayerManager._layers, function (i, layer) {
            if ( layer.image.date === undefined ) {
                return false;
            }
            dates.push(layer.image.date);
        });

        // If there are no image layers loaded then use the requestDate
        if (dates.length === 0) {
            return Date.parseUTCDate(this.requestDate.toISOString());
        }
        // If there is only one layer loaded then use its date
        else if (dates.length === 1) {
            return Date.parseUTCDate(dates[0]);
        }

        dates.sort();
        startDate = Date.parseUTCDate(dates[0]);

        return startDate;
    },

    /**
     * Returns the middle time of all of the layers currently loaded
     */
    getLatestLayerDate: function () {
        var startDate, endDate, difference, dates = [];

        // Get the observation dates associated with each later
        $.each(this._tileLayerManager._layers, function (i, layer) {
            if ( layer.image.date === undefined ) {
                return false;
            }
            dates.push(layer.image.date);
        });

        // If there are no image layers loaded then use the requestDate
        if (dates.length === 0) {
            return Date.parseUTCDate(this.requestDate.toISOString());
        }
        // If there is only one layer loaded then use its date
        else if (dates.length === 1) {
            return Date.parseUTCDate(dates[0]);
        }

        dates.sort();
        endDate   = Date.parseUTCDate(dates[dates.length - 1]);

        return endDate;
    }

});

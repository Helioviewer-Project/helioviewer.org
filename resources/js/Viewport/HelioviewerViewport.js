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

        this.movementHelper = new ViewportMovementHelper(this.domNode, this.mouseCoords);

        this.pinchDetector = new PinchDetector();
        this.helioZoom = new HelioviewerZoomer(this.pinchDetector, this.zoomLevels);
        this.touchMover = new TouchMover(document.getElementById('toptouchlayer'), this.pinchDetector, $.proxy(this.movementHelper.moveViewport, this.movementHelper));
// toptouchlayer
        this.loadDataSources();

        this._initEventHandlers();
    },

    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager,
     * and resizes when done.
     */
    loadDataSources: function () {
        var callback, self = this;

        this.dataSources = new Promise((resolve) => {
            callback = function (dataSources) {
                // CCOR1 is only available on JHelioviewer at this time.
                try { delete dataSources["GOES"]["CCOR-1"]; } catch (e) {}

                resolve(dataSources);
                $(document).trigger("datasources-initialized", [dataSources]);

                // Initialize tile layers
                // For minimal view, tile layers are initialized by ImagePresets.js
                if (outputType!='minimal') {
                    self._tileLayerManager = new HelioviewerTileLayerManager(self.requestDate, dataSources, self.tileSize, self.imageScale, self.maxTileLayers, self.tileLayers);
                    $(document).trigger("update-viewport");
                }
            };
            $.get(Helioviewer.api, {action: "getDataSources"}, callback, Helioviewer.dataType);
        });
    },

    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision());
    },

    /**
     * @description Returns the current image scale (in arc-seconds/px) accounting for mobile zoom.
     */
    getZoomedImageScale: function () {
        let zoom = (Helioviewer.userSettings.get('mobileZoomScale') || 1);
        return this.getImageScale() / zoom;
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
     * Returns layer metadata for layers which are visible and
     * overlap the specified region of interest
     */
    getVisibleLayerInstances: function (roi) {
        return this._tileLayerManager.getVisibleLayerInstances(roi);
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
                         $.proxy(this.centerViewportOnBiggestLayer, this));

        $(this.domNode).bind("mousedown", $.proxy(this.onMouseMove, this));
        this.domNode.dblclick($.proxy(this.doubleClick, this));

        $('#center-button').click(() => {$(document).trigger('center-viewport');});
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

        centerX = Helioviewer.userSettings.get("state.centerX") / this.getZoomedImageScale();
        centerY = Helioviewer.userSettings.get("state.centerY") / this.getZoomedImageScale();

        $("#moving-container").css({
            "left": sbWidth  - Math.round(sbWidth  / 2 + centerX),
            "top" : sbHeight - Math.round(sbHeight / 2 + centerY)
        });

        $(document).trigger("update-viewport");
    },

    /**
     * Tells the viewport to update itself and its tile layers
     */
    updateViewport: function (storeCoordinates) {
        if (typeof storeCoordinates === "undefined") {
            storeCoordinates = false;
        }

        this.movementHelper.update();

        // Pixel coordinates for the ROI edges
        let coordinates = this.movementHelper.getViewportCoords();

        // Updated saved settings
        if (storeCoordinates) {
            let imageScale = this.getZoomedImageScale();
            // ROI Center (in arc-seconds)
            let offsetX = imageScale * ((coordinates.left + coordinates.right) / 2);
            let offsetY = imageScale * ((coordinates.top + coordinates.bottom) / 2);
            Helioviewer.userSettings.set("state.centerX", offsetX);
            Helioviewer.userSettings.set("state.centerY", offsetY);
        }

        this.updateViewportRanges(coordinates);
        $(document).trigger('update-external-datasource-integration');
        $(document).trigger('earth-scale');
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
     * Moves the image back to the center of the viewport.
     */
    centerViewportOnBiggestLayer: function () {
        let biggestLayer = this._getBiggestLayer();
        // Centering the viewport works by centering the reference pixel of the biggest layer.
        // For C3, the reference doesn't seem to be the center of the sun, so in this case default to
        // centering the whole viewport.
        // p.s. Centering on the reference pixel is important for sub-disk images like IRIS and XRT.
        //      In this case, centering to (0, 0) may move a sub-disk image way off the viewport.
        if (biggestLayer.name.indexOf("LASCO C3") != -1) {
            return this.centerViewport();
        }
        let offset = biggestLayer.getCurrentOffset();
        let scale = Helioviewer.userSettings.get("mobileZoomScale");
        this.movementHelper.centerViewportWithOffset(offset.x * scale, offset.y * scale);
        this.updateViewport(true);
    },

    /**
     * Returns the largest layer (by dimensions) that is currently displayed.
     */
    _getBiggestLayer: function () {
        return this._tileLayerManager.getBiggestLayer();
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
        let anchor = {
            left: event.pageX,
            top: event.pageY
        };
        this.helioZoom.setAnchorForCenter(anchor);
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
        var startDate, dates = [];

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

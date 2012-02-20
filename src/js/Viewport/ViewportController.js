/**
 * @fileOverview Contains the class definition for an Viewport Controller class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, TileLayerManager, Helioviewer
HelioviewerMouseCoordinates, ViewportMovementHelper, HelioviewerViewport */
"use strict";
var ViewportController = Class.extend(
    /** @lends ViewportController.prototype */
    {
    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     */
    init: function (options) {
        this.domNode        = $("#helioviewer-viewport");
        this._rsunInArcseconds = 959.705; // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        
        this.mouseCoords = new HelioviewerMouseCoordinates(options.imageScale, this._rsunInArcseconds, 
                                                           options.warnMouseCoords);
        this.viewport = new HelioviewerViewport(options);
        
        // Store a reference to the sandbox
        this._sandbox = $("#sandbox");
        
        // Viewport must be resized before movement helper and sandbox are initialized.
        this.viewport.resize();
        
        // Display viewport shadow
        this.viewport.shadow.show();
        
        // Compute center offset in pixels
        var centerX = options.centerX / options.imageScale,
            centerY = options.centerY / options.imageScale;

        this.movementHelper = new ViewportMovementHelper(this.domNode, this.mouseCoords, centerX, centerY);
        
        this.viewport.loadDataSources();
       
        this._initEventHandlers();
    },

    /**
     * Event listeners for interacting with the viewport
     */
    _initEventHandlers: function () {
        $(document).bind("image-scale-changed",             $.proxy(this.zoomViewport, this))
                   .bind("update-viewport",                 $.proxy(this.onUpdateViewport, this))
                   .bind("load-saved-roi-position",         $.proxy(this.loadROIPosition, this))
                   .bind("move-viewport mousemove mouseup", $.proxy(this.onMouseMove, this))
                   .bind("resize-viewport",                 $.proxy(this.resizeViewport, this))
                   .bind("layer-max-dimensions-changed",    $.proxy(this.updateMaxLayerDimensions, this));
        
        $(this.domNode).bind("mousedown", $.proxy(this.onMouseMove, this));
        this.domNode.dblclick($.proxy(this.doubleClick, this));
        
        $('#center-button').click($.proxy(this.centerViewport, this));
        $(window).resize($.proxy(this.resizeViewport, this));
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
        this.viewport.setImageScale(imageScale);
        
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
        
        //console.log("sandbox: " + $("#sandbox").width() + ", " + $("#sandbox").height());

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
        
        this.viewport.updateViewportRanges(coordinates);
    },
    
    /**
     * Returns the middle time of all of the layers currently loaded
     */
    getMiddleObservationTime: function () {
        var startDate, endDate, difference, dates = [];

        // Get the observation dates associated with each later
        $.each(this.viewport._tileLayerManager._layers, function (i, layer) {
            dates.push(layer.image.date);
        });
        
        // If there is only one layer loaded then use its date
        if (dates.length === 1) {
            return Date.parseUTCDate(dates[0]);
        }
        
        // Otherwise, sort the list
        dates.sort();
        
        // Add half the difference in seconds to the start date and return it
        startDate = Date.parseUTCDate(dates[0]);
        endDate   = Date.parseUTCDate(dates[dates.length - 1]);
        
        difference = (endDate.getTime() - startDate.getTime()) / 1000 / 2;
        
        startDate.addSeconds(difference);
        
        return startDate;
    },
    
    /**
     * Returns the coordinates for the top-left and bottom-right corners of the current
     * region of interest displayed in the viewport
     */
    getRegionOfInterest: function () {
        return this.movementHelper.getViewportCoords();
    },
    
    /**
     * Gets information about the viewport including date, layers, viewport coordinates, and scale
     * and returns them as an array or calls the callback function if it's provided.
     */    
    getViewportInformation: function () {
        return $.extend(this.viewport.getViewportInformation(), {
            "coordinates": this.movementHelper.getViewportCoords()
        });
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
     * Resizes the viewport when the window is resized.
     */
    resizeViewport: function () {
        if (this.viewport.resize()) {
            this.updateViewport();
        }
    },

    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (event) {
        this.movementHelper.doubleClick(event);

        if (event.shiftKey) {
            $("#zoomControlZoomOut").click(); 
        } else {
            $("#zoomControlZoomIn").click();
        }
    },
    
    /**
     * Get imagescale in arcseconds per pixel from viewport
     */
    getImageScale: function () {
        return this.viewport.getImageScale();
    },
    
    /**
     * Get image scale in kilometers per pixel
     */
    getImageScaleInKilometersPerPixel: function () {
        return this.viewport.getImageScaleInKilometersPerPixel();
    },
    
    /**
     * Updates the stored values for the maximum layer dimensions. This is used in computing the optimal
     * sandbox size in movementHelper. Assumes there is only one kind of layer (aka tileLayers). To
     * account for multiple layer types, like eventLayers, add some comparisons between dimensions.
     */
    updateMaxLayerDimensions: function (event, type, dimensions) {
        this.movementHelper.updateMaxLayerDimensions(dimensions);
    },
    
    serialize: function () {
        return this.viewport.serialize();
    }
});

/**
 * @fileOverview Contains the class definition for an Viewport Controller class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, TileLayerManager, MouseCoordinates, ViewportMovementHelper */
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
        var mouseCoords     = new HelioviewerMouseCoordinates(options.imageScale, this._rsunInArcseconds, 
                                                              options.warnMouseCoords);
        this.viewport       = new HelioviewerViewport(options);
        // Viewport must be resized before movement helper and sandbox are initialized.
        this.viewport.resize();
        this.movementHelper = new ViewportMovementHelper(this.domNode, mouseCoords);
        
        this._initEventHandlers();
    },

    /**
     * Event listeners for interacting with the viewport
     */
    _initEventHandlers: function () {
        $(document).bind("image-scale-changed",             $.proxy(this.zoomViewport, this))
                   .bind("update-viewport",                 $.proxy(this.updateViewportRanges, this))
                   .bind("get-viewport-information",        $.proxy(this.getViewportInformation, this))
                   .bind("move-viewport mousemove mouseup", $.proxy(this.moveViewport, this))
                   .bind("resize-viewport",                 $.proxy(this.resizeViewport, this))
                   .bind("layer-max-dimensions-changed",    $.proxy(this.updateMaxLayerDimensions, this));
        
        $(this.domNode).bind("mousedown", $.proxy(this.moveViewport, this));
        this.domNode.dblclick($.proxy(this.doubleClick, this));
        
        $('#center-button').click($.proxy(this.centerViewport, this));
        $(window).resize($.proxy(this.resizeViewport, this));
    },
    
    /**
     * Moves the viewport and triggers update function calls
     */
    moveViewport: function (event, x, y) {
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
        };
    },
    
    /**
     * Zooms in or out and saves the setting once it is done
     */
    zoomViewport: function (event, imageScale) {
        this.viewport.setImageScale(imageScale);
        
        // Moves the viewport to the correct position after zooming
        this.movementHelper.zoomTo(imageScale);
        this.updateViewportRanges();

        // store new value
        $(document).trigger("save-setting", ["imageScale", imageScale]);
    },
    
    /**
     * Tells the viewport to update itself and its tile layers
     */
    updateViewportRanges: function () {
        this.movementHelper.update();
        var coordinates = this.movementHelper.getViewportCoords();
        this.viewport.updateViewportRanges(coordinates);
    },
    
    /**
     * Gets information about the viewport including date, layers, viewport coordinates, and scale
     * and returns them as an array or calls the callback function if it's provided.
     */    
    getViewportInformation: function (event, callback) {
        var info                 = this.viewport.getViewportInformation();
        info.coordinates         = this.movementHelper.getViewportCoords();
        info.maxImageCoordinates = this.movementHelper.getMaxImageCoordinates(info.coordinates);
        
        if (callback) {
            callback(info);
        } else {
            return info;
        }
    },
    
    /**
     * Moves the image back to the center of the viewport.
     */
    centerViewport: function () {
        this.movementHelper.centerViewport();
        this.updateViewportRanges();
    },
    
    /**
     * Resizes the viewport when the window is resized.
     */
    resizeViewport: function () {
        if (this.viewport.resize()) {
            this.updateViewportRanges();
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

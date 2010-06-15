/**
 * @fileOverview Contains the controller/event handlers for the viewport.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window */
"use strict";
var ViewportController = Class.extend(
    /** @lends ViewportController.prototype */
    {
    /**
     * @constructs
     * @description Creates a new ViewportComtroller
     * @param {Object} options Custom Viewport settings that will be passed to the Viewport
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *       <b>imageScale</b> - The default image scale to display tiles at (should be passed in from Helioviewer).<br>
     *       <b>tileSize</b>   - Size of tiles.<br> 
     *       <b>prefetch</b>   - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (options) {
    	this._viewport = new Viewport(options);
        this._initEventHandlers();
    },
    
    /**
     * @description
     */
    _initEventHandlers: function () {
        var self = this;
        
        $(window).resize($.proxy(this._viewport.resize, this));
        $(document).mousemove($.proxy(this._viewport.mouseMove, this))
                   .mouseup($.proxy(this._viewport.mouseUp, this))
                   .bind("layer-max-dimensions-changed", $.proxy(this._viewport.updateMaxLayerDimensions, this))
                   .bind("set-image-scale", $.proxy(this._viewport.zoomTo, this))
                   .bind("update-viewport-sandbox", $.proxy(this._viewport.updateSandbox, this))
                   .bind("observation-time-changed", $.proxy(this._viewport._onObservationTimeChange, this))
                   .bind("recompute-tile-visibility", $.proxy(this._viewport.checkTileVisibility, this));
        
        $('#center-button').click($.proxy(this._viewport.center, this));
        
        this.domNode.mousedown($.proxy(this._viewport.mouseDown, this))
                    .dblclick($.proxy(this._viewport.doubleClick, this));
        
    },
    
    resize : function () {
    	this._viewport.resize();
    },
    
    /**
     * @description Fired when a mouse is pressed
     * @param {Event} event an Event object
     */
   mouseDown: function (event) {
       this.domNode.css("cursor", "all-scroll");

       // Don't do anything if entire image is already visible
       if ((this.sandbox.width() === 0) && (this.sandbox.height() === 0)) {
           return;
       }
       
       this.mouseStartingPosition = {
           x: event.pageX, 
           y: event.pageY
       };
       
       this.startMoving();
   },
   
    /**
     * @description Handle drag events
     * @param {Object} an Event object
     */
   mouseMove: function (event) {
       if (!this.isMoving) {
           return;
       }
         
       // Threshold
       this.moveCounter = this.moveCounter + 1;
       if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
           return;
       }

       this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

       this.moveBy(this.mouseStartingPosition.x - event.pageX,
                   this.mouseStartingPosition.y - event.pageY);
   },
   
    /**
     * @description Fired when a mouse button is released
     * @param {Event} event Event object
     */
   mouseUp: function (event) {
       $("#helioviewer-viewport").css("cursor", "pointer");

       if (this.isMoving) {
           this.endMoving();
       }
   },


   /**
    * @description Handles double-clicks
    * @param {Event} e Event class
    */
   doubleClick: function (e) {
       var pos, center, diff, scaleFactor;
       
       //check to make sure that you are not already at the minimum/maximum image scale
       if (!(e.shiftKey || (this.imageScale > this.minImageScale)) ||
            (this.imageScale >= this.maxImageScale)) {
           return;
       }
       
       // Click coordinates relative to viewport top-left
       pos = this.mouseCoords.getRelativeCoords(e.pageX, e.pageY);
       
       // Coordinates of viewport center relative to top-left
       center = this.getCenter();
       
       //adjust for zoom
       if (e.shiftKey) {
       	scaleFactor = 0.5;
           $("#zoomControlZoomOut").click(); 
       }
       else {
       	scaleFactor = 2;
           $("#zoomControlZoomIn").click();
       }
       
       // Distance between point of mouse-click and the center of the viewport
       diff = {
           x: (pos.x - center.x) * scaleFactor,
           y: (pos.y - center.y) * scaleFactor
       };
       
       this.startMoving();
       this.moveBy(diff.x, diff.y);
       this.endMoving();
   },
    
   /**
    * Updates the stored values for the maximum tile and event layer dimensions. This is used in computing the optimal
    * sandbox size.
    */
   updateMaxLayerDimensions: function (event, type, dimensions) {
       if (type === "tile") {
           this.maxTileLayerDimensions  = dimensions;
       } else {
           this.maxEventLayerDimensions = dimensions;
       }
       
       var old = this.maxLayerDimensions;
       
       this.maxLayerDimensions = {
           width : Math.max(this.maxTileLayerDimensions.width,  this.maxEventLayerDimensions.width),
           height: Math.max(this.maxTileLayerDimensions.height, this.maxEventLayerDimensions.height)
       };
       
       if ((this.maxLayerDimensions.width !== old.width) || (this.maxLayerDimensions.height !== old.height)) {
           this.updateSandbox();
       }
   },
   
   /**
    * _onObservationTimeChange
    */
   _onObservationTimeChange: function (event, date) {
       this._tileLayerManager.updateRequestTime(date);
   },    
});
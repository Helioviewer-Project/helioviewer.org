/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, HelioviewerTileLayerManager, HelioviewerMouseCoordinates, 
  Viewport, ViewportMovementHelper, EventManager */
"use strict";
var HelioviewerViewport = Viewport.extend(
    /** @lends HelioviewerViewport.prototype */
    {
    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *       <b>imageScale</b> - The default image scale to display tiles at (should be passed in from Helioviewer).<br>
     *       <b>tileSize</b>   - Size of tiles.<br> 
     *       <b>prefetch</b>   - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (options) {
        this._super(options);
    
        // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this._rsun = 959.705;

        // Initialize tile layers
        this._tileLayerManager = new HelioviewerTileLayerManager(this.api, this.requestDate, this.dataSources, 
                                  this.tileSize, this.imageScale, this.maxTileLayers,
                                  this.tileServers, this.tileLayers, this.urlStringLayers);
        
        // Initialize even layers
        this._eventLayerManager = new EventManager(this.requestDate, 86400, this.getRSun());
        
        var mouseCoords	    = new HelioviewerMouseCoordinates(this.imageScale, this._rsun, this.warnMouseCoords);
        this.movementHelper = new ViewportMovementHelper(this.domNode, mouseCoords);
        this.resize();
        this._initEventHandlers();
    },

    /**	
     * Updates the stored values for the maximum tile and event layer dimensions. 
     * This is used in computing the optimal sandbox size.	
     */		
    updateMaxLayerDimensions: function (event, type, dimensions) {
        var old, tileLayerDimensions, eventLayerDimensions;
        
        old = this.maxLayerDimensions;
        tileLayerDimensions  = this._tileLayerManager.getMaxDimensions();
        eventLayerDimensions = tileLayerDimensions; // Hack until eventLayers are put back in;
        //eventLayerDimensions = this._eventLayerManager.getMaxDimensions();
	
        this.maxLayerDimensions = {
            width : Math.max(tileLayerDimensions.width,  eventLayerDimensions.width),	
            height: Math.max(tileLayerDimensions.height, eventLayerDimensions.height)
        };

        if ((this.maxLayerDimensions.width !== old.width) || (this.maxLayerDimensions.height !== old.height)) {
            this.movementHelper.updateMaxLayerDimensions(this.maxLayerDimensions);	
        }	
    },
    
    /**
     * Returns the solar radius in arc-seconds for an EIT image at native resolution 
     */
    getRSun: function () {
        return this._rsun;
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});

/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, HelioviewerTileLayerManager, HelioviewerMouseCoordinates, 
  Viewport, EventManager, TileLayerAccordion */
"use strict";
var HelioviewerViewport = Viewport.extend(
    /** @lends HelioviewerViewport.prototype */
    {
    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     */
    init: function (options) {
        this._super(options);
 
        this._rsunInArcseconds = 959.705; // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this._rsunInKilometers = 695700;
        this._getDataSources();
    },
    
    /**
     * Gets datasources and initializes the tileLayerAccordion and the tileLayerManager/eventLayerManager, 
     * and resizes when done.
     */
    _getDataSources: function () {
        var callback, tileLayerAccordion, self = this;
        
        callback = function (dataSources) {
            self.dataSources = dataSources;

            tileLayerAccordion = new TileLayerAccordion('#tileLayerAccordion', dataSources, self.requestDate);

            // Initialize tile layers
            self._tileLayerManager = new HelioviewerTileLayerManager(self.api, self.requestDate, self.dataSources, 
                                  self.tileSize, self.imageScale, self.maxTileLayers,
                                  self.servers, self.tileLayers);
        
            // Initialize event layers
            self._eventLayerManager = new EventManager(self.requestDate, 86400, self.getRSun());
        
            $(document).trigger("update-viewport");
        };
        
        $.get(this.api, {action: "getDataSources"}, callback, "json"); 
    },
    
    /**
     * Gets information about the viewport including date, layers, and scale
     * and returns them as an array.
     */
    getViewportInformation: function () {
        return {
            time        : this._tileLayerManager.getRequestDateAsISOString(),
            layers      : this.serialize(),
            imageScale  : this.imageScale
        };
    },
    
    /**
     * Returns the solar radius in arc-seconds for an EIT image at native resolution 
     */
    getRSun: function () {
        return this._rsunInArcseconds;
    },
    
    /**
     * Returns the image scale in Kilometers per pixel
     */
    getImageScaleInKilometersPerPixel: function () {
        return parseFloat(this.imageScale.toPrecision(8) * (this._rsunInKilometers / this._rsunInArcseconds));
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});

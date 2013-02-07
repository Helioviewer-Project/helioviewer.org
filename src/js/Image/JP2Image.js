/**
 * @fileOverview JP2 Image class
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var JP2Image = Class.extend(
    /** @lends JP2Image.prototype */
    {

    /**
     * @constructs
     */
    init: function (observatory, instrument, detector, measurement, sourceId, date, onChange) {
        this.observatory = observatory;
        this.instrument  = instrument;
        this.detector    = detector;
        this.measurement = measurement;
        this.sourceId    = sourceId;
        this.requestDate = date;
        this._onChange   = onChange;
        
        this._requestImage();
    },
    
    /**
     * Loads the closest image in time to that requested
     */
    _requestImage: function () {
        var params, dataType;
        
        params = {
            action:   'getClosestImage',
            sourceId: this.sourceId,
            date:     this.requestDate.toISOString()
        };
        $.get(Helioviewer.api, params, $.proxy(this._onImageLoad, this), Helioviewer.dataType);
    },
    
    /**
     * Changes image data source
     */
    updateDataSource: function (observatory, instrument, detector, measurement, sourceId) {
        this.observatory = observatory;
        this.instrument  = instrument;
        this.detector    = detector;
        this.measurement = measurement;
        this.sourceId    = sourceId;
        
        this._requestImage();
    },        
    
    /**
     * Updates time and loads closest match
     */
    updateTime: function (requestDate) {
        this.requestDate = requestDate;
        this._requestImage();
    },
    
    /**
     * Checks to see if image has been changed and calls event-handler passed in during initialization
     * if a new image should be displayed.
     * 
     * The values for offsetX and offsetY reflect the x and y coordinates with the origin
     * at the bottom-left corner of the image, not the top-left corner.
     */
    _onImageLoad: function (result) {
        // Only load image if it is different form what is currently displayed
        if (this.id === result.id) {
            return;
        }
        $.extend(this, result);

        // Reference pixel offset at the original JP2 image scale (with respect to top-left origin)
        this.offsetX =   parseFloat((this.refPixelX - (this.width  / 2)).toPrecision(8));
        this.offsetY = - parseFloat((this.refPixelY - (this.height / 2)).toPrecision(8));        
        
        this._onChange();
    },
    
    getLayerName: function () {
        return this.observatory + "," + this.instrument + "," +  
               this.detector + "," + this.measurement;
    },
    
    getSourceId: function () {
        return this.sourceId;
    }
});
/**
 * @fileOverview JP2 Image class
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var BlankImage = Class.extend(
    /** @lends Image.prototype */
    {

    /**
     * @constructs
     */
    init: function (date, api, server, onChange) {
    	this.requestDate = date;
        this.api         = api;
        this.sourceId	 = 0;
        this.server	 = server;
        this._onChange 	 = onChange;
        this._requestImage();
    },
    
    /**
     * Loads the closest image in time to that requested
     */
    _requestImage: function () {
        var params = {
            action:   'getClosestImage',
            server:   this.server,
            sourceId: this.sourceId,
            date:     this.requestDate.toISOString().replace(/"/g, '')
        };

        $.post(this.api, params, $.proxy(this._onImageLoad, this), "json");
    },
    
    /**
     * Checks to see if image has been changed and calls event-handler passed in during initialization
     * if a new image should be displayed.
     * 
     * Note:
     * 
     * The values for offsetX and offsetY reflect the x and y coordinates with the origin
     * at the bottom-left corner of the image, not the top-left corner.
     */
    _onImageLoad: function (result) {
        //Only load image if it is different form what is currently displayed
        if (this.id === result.id) {
            return;
        }
        
        $.extend(this, result);

        // Sun center offset at the original JP2 image scale (with respect to top-left origin)
        this.offsetX = 0;
        this.offsetY = 0;

        //TEMP (06/11/2010): Temporarily simplifying in order to debug centering during zoom
		//      this.offsetX = 0;
		//      this.offsetY = 0;
        
        this._onChange();        
    },
    
    /**
     * Updates time and loads closest match
     */
    updateTime: function (requestDate) {
        this.requestDate = requestDate;
    },
    
    getLayerName: function () {
    	return "blank";
    },
});
/**
 * @description Object representing a screenshot. Handles tooltip creation for its entry in the history bar
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var Screenshot = Class.extend(
    /** @lends Screenshot.prototype */
    {
    /**
     * @constructs
     * Creates a new Screenshot instance
     * 
     * @param {Int}     id            Screenshot id
     * @param {Float}   imageScale    Image scale for the screenshot
     * @param {String}  layers        Layers in the screenshot serialized as a string
     * @param {String}  dateRequested Date string for when the screenshot was requested
     * @param {String}  date          The observation date for which the screenshot was generated
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     */    
    init: function (id, imageScale, layers, dateRequested, date, x1, x2, y1, y2) {
        this.id            = id;
        this.imageScale    = imageScale;
        this.layers        = layers;
        this.dateRequested = Date.parseUTCDate(dateRequested);
        this.date          = Date.parseUTCDate(date);
        this.x1            = x1;
        this.x2            = x2;
        this.y1            = y1;
        this.y2            = y2;
        
        this.width  = Math.floor((this.x2 - this.x1) / this.imageScale);
        this.height = Math.floor((this.y2 - this.y1) / this.imageScale);

        this.name   = this.computeName();
    },
    
    /**
     * Opens the download dialog
     */
    download: function () {
        window.open('api/index.php?action=downloadScreenshot&id=' + this.id, '_parent');
    },
    
    /**
     * Puts information about the screenshot into an array for storage in UserSettings.
     */    
    serialize: function () {
        return {
            id            : this.id,
            imageScale    : this.imageScale,
            layers        : this.layers,
            dateRequested : this.dateRequested.toISOString(),
            date          : this.date.toISOString(),
            x1            : this.x1,
            x2            : this.x2,
            y1            : this.y1,
            y2            : this.y2
        };
    }
});

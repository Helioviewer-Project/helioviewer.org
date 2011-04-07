/**
 * ScreenshotManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO 2011/03/14: Choose a reasonable limit for the number of entries based on whether or not
 * localStorage is supported: if supported limit can be large (e.g. 100), otherwise should be
 * closer to 3 entries.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var ScreenshotManager = MediaManager.extend(
    /** @lends ScreenshotManager.prototype */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManager instance 
     */    
    init: function (screenshots) {
        this._history = screenshots;
    },
    
    /**
     * Adds a new screenshot
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
     * 
     * @return {Screenshot} A Screenshot object
     */
    add: function (id, imageScale, layers, dateRequested, date, x1, x2, y1, y2) {
        var screenshot = {
            "id"            : id,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "dateRequested" : dateRequested,
            "date"          : date,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "name"          : this._getName(layers)
        }; 

        if (this._history.unshift(screenshot) > 12) {
            this._history = this._history.slice(0, 12);            
        };

        this._save();
        return screenshot;
    },
    
    /**
     * Saves the current list of screenshots
     */
    _save: function () {
        Helioviewer.userSettings.set("screenshots", this._history);
    }
});

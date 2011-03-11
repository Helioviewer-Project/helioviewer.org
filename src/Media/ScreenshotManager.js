/**
 * ScreenshotManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
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
        this.history = [];

        if (screenshots) {
            this._loadSavedScreenshots(screenshots);
        }
    },
    
    /**
     * Returns an array containing Screenshot objects for the screenshots currently being tracked
     */
    toArray: function () {
        return this.history;
    },
    
    /**
     * Takes in an array of history gotten from UserSettings and creates Screenshot objects from it.
     * Slices the array down to 12 objects.
     * 
     * @input {Array} history An array of saved screenshot histories
     */
    _loadSavedScreenshots: function (screenshots) {
        var self = this;
        
        $.each(screenshots, function () {
            self.history.push(new Screenshot(this));
        });
        
        this.history = this.history.reverse().slice(0, 12).reverse();
    }
});

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
        this._history = [];

        if (screenshots) {
            this._loadSavedScreenshots(screenshots);
        }
    },
    
    /**
     * Adds a new screenshot
     */
    add: function (params, url) {
        var screenshot = new Screenshot(params, url);

        if (this._history.unshift(screenshot) > 12) {
            this._history = this._history.slice(0, 12);            
        };

        this._save();
        return screenshot;
    },
    
    /**
     * Removes all screenshots
     */
    empty: function () {
        var self = this;

        $.each(this._history, function (i, screenshot) {
            self._history[i] = null;
        });
        
        self._history = [];
        self._save();
    },
    
    /**
     * Removes a screenshot
     * 
     * @param {String} id Screenshot to be removed
     */
    remove: function (id) {
        var self = this;

        $.each(this._history, function (i, screenshot) {
            if (screenshot.getId() === id) {
                self._history[i] = null;
                self._history.splice(i, 1);
                self._save();
                return;
            }
        });
    },
    
    /**
     * Returns an array containing Screenshot objects for the screenshots currently being tracked
     */
    toArray: function () {
        return this._history;
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
            self._history.push(new Screenshot(this));
        });
    },
    
    /**
     * Saves the current list of screenshots
     */
    _save: function () {
        Helioviewer.userSettings.set("screenshot-history", this._history);
    }
});

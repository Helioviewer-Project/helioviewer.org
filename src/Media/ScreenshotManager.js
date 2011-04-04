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
        var screenshot = new Screenshot(id, imageScale, layers, dateRequested, date, x1, x2, y1, y2);

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
            if (screenshot.id === id) {
                self._history[i] = null;
                self._history.splice(i, 1);
                self._save();
                return;
            }
        });
    },
    
    /**
     * Iterates through its history and gets a serialized array of each object's
     * information that needs to be saved. Adds it to serialHistory and returns
     * that for saving in UserSettings.
     */
    serialize: function () {
        return $.map(this._history, function (item, i) {
            return item.serialize();
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
        
        $.each(screenshots, function (i, screenshot) {
            self._history.push(new Screenshot(
                screenshot.id, screenshot.imageScale, screenshot.layers, screenshot.dateRequested, 
                screenshot.date, screenshot.x1, screenshot.x2, screenshot.y1, screenshot.y2
            ));
        });
    },
    
    /**
     * Saves the current list of screenshots
     */
    _save: function () {
        Helioviewer.userSettings.set("screenshots", this.serialize());
    }
});

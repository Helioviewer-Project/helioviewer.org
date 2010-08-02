/**
 * @description Keeps track of screenshot history and can load saved history and add new items to its history.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, Screenshot, History, MediaHistoryBar */
"use strict";
var ScreenshotHistory = History.extend(
    /** @lends ScreenshotHistory.prototype */
    {
    /**
     * @constructs
     * @param history -- an array of saved history from UserSettings. May be null.
     */    
    init: function (history) {
        this.id = "screenshot";
        this._super(history);
    },
    
    /**
     * Adds the item to history, then saves the setting in UserSettings.
     * 
     * @input {Object} item A Screenshot object
     */
    addToHistory: function (item) {
        this._super(item);
        $(document).trigger("save-setting", ["screenshot-history", this._serialize()]);
    },

    /**
     * Completely empties history and saves an empty array to UserSettings.
     */
    clear: function () {
        this._super();
        $(document).trigger("save-setting", ["screenshot-history", this.history]);
    },
    
    /**
     * Takes in an array of history gotten from UserSettings and creates Screenshot objects from it.
     * Slices the array down to 12 objects.
     * 
     * @input {Array} history An array of saved screenshot histories
     */
    _loadSavedHistory: function (history) {
        var self = this, screenshot;
        $.each(history, function () {
            screenshot = new Screenshot(this, this.dateRequested)
            if (screenshot.isValidEntry()) {
                self.history.push(screenshot);
            }
        });
        this.history = this.history.reverse().slice(0, 12).reverse();
        $(document).trigger("save-setting", ["screenshot-history", this._serialize()]);
    }
});

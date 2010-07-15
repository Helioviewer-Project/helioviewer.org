/**
 * @description Keeps track of movie history and can load saved history and add new items to its history.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var MovieHistory = History.extend(
    /** @lends MovieHistory.prototype */
    {
    /**
     * @constructs
     * @param history -- an array of saved history from UserSettings. May be null or empty.
     */    
    init: function (history) {
        this._super(history);
    },

    /**
     * Adds the item to history, then saves the setting in UserSettings.
     * 
     * @input {Object} item A Movie object
     */
    addToHistory: function (item) {
        this._super(item);
        $(document).trigger("save-setting", ["movie-history", this._serialize()]);
    },
    
    /**
     * Completely empties history and saves an empty array to UserSettings.
     */
    clear: function () {
        this._super();
        $(document).trigger("save-setting", ["movie-history", this.history]);
    },
    
    /**
     * Adds an item to the content string and also adds an emtpy div where the watch
     * dialog will be created.
     * 
     * @param {Object} item A Movie object
     */
    _addToContentString: function (item) {
        return  this._super(item) + 
                "<div id='watch-dialog-" + item.id + "' style='display:none'>" +
                "</div>";
    },
    
    /**
     * Takes in an array of history gotten from UserSettings and creates Movie objects from it.
     * Slices the array down to 12 objects.
     * 
     * @input {Array} history An array of saved movie histories
     */
    _loadSavedHistory: function (history) {
        var self = this;
        $.each(history, function () {
            self.history.push(new Movie(this, new Date(this.dateRequested)));
        });

        this.history = this.history.slice(0,12);
    }
});

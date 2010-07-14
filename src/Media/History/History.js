/**
 * @description Abstract class that keeps track of media history and can add new history to itself.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var History = Class.extend(
    /** @lends History.prototype */
    {
    /**
     * @constructs
     * @param history -- an array of saved history from UserSettings. May be null.
     */    
    init: function (history) {
        this.history = [];

        if (history) {
            this._loadSavedHistory(history);
        }
    },
    
    /**
     * Adds an item to the history array and slices the array down to 12 items. Oldest items are chopped off
     * in favor of new items.
     * 
     * @input {Object} item -- Either a Screenshot or Movie object.
     */
    addToHistory: function (item) {
        this.history.push(item);
        this.history = this.history.reverse().slice(0,12).reverse();
    },

    /**
     * Adds divs for all history items including a text link and time ago.
     * Adds the items in reverse chronological order. 
     */
    createContentString: function () {
        var self=this, content = "";
    
        if (this.history.length > 0) {
            $.each(this.history, function () {
                content = self._addToContentString(this) + content;
            });
        }
    
        return content;
    },
    
    /**
     * Iterates through its history and tells each object to remove its
     * information tooltip in preparation to make a new one. 
     */
    removeTooltips: function () {
        $.each(this.history, function () {
            this.removeTooltip();
        });
    },
    
    /**
     * Iterates through its history and tells each object to create its
     * information tooltip.
     */
    setupTooltips: function () {
        $.each(this.history, function () {
            this.setupTooltip();
        });
    },
    
    /**
     * Empties history.
     */
    clear: function () {
        this.history = [];
    },
    
    /**
     * Adds an item to the content string being generated for the history list
     * 
     * @input {Object} item A Movie or Screenshot object
     */
    _addToContentString: function (item) {
        return  "<div id='" + item.id + "' class='text-btn' style='float:left;'>" + 
                    item.name + 
                "</div>" +
                "<div style='float:right; font-size: 8pt;'>" + 
                    "<i>" + item.getTimeDiff() + "</i>" + 
                "</div><br /><br />";
    },
    
    /**
     * Iterates through its history and gets a serialized array of each object's
     * information that needs to be saved. Adds it to serialHistory and returns
     * that for saving in UserSettings.
     */
    _serialize: function () {
        var serialHistory = [];
        $.each(this.history, function () {
            serialHistory.push(this.serialize());
        });
        return serialHistory;
    }
});

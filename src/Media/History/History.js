/**
 * @description Abstract class that keeps track of media history and can add new history to itself.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, MediaHistoryBar */
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
    
    setup: function () {
        var content = this._createContentString();
        this.historyBar = new MediaHistoryBar(this.id, content);
        
        $(document).bind('setup-' + this.id + '-history-tooltips', $.proxy(this.setupTooltips, this));
        $(document).bind('clear-' + this.id + '-history', $.proxy(this.clear, this));
    },
    
    /**
     * Adds an item to the history array and slices the array down to 12 items. Oldest items are chopped off
     * in favor of new items.
     * 
     * @input {Object} item -- Either a Screenshot or Movie object.
     */
    addToHistory: function (item) {
        //this.removeTooltips();
        this.history.push(item);
        this.history = this.history.reverse().slice(0, 12).reverse();
        
        this.updateTooltips();
    },
    
    /**
     * Removes an item from history.
     */
    remove: function (item) {
        this.removeTooltips();
        
        this.history = $.grep(this.history, function (h) {
            return h.id !== item.id;
        });

        if ((this.history.length === 0) && this.historyBar) {
            this.historyBar.clearHistory();
        } else {
            this.updateTooltips();
        }
        this.save();
    },
    
    /**
     * Update tooltips
     */
    updateTooltips: function () {
        this.removeTooltips();
        if (this.historyBar) {
            var content = this._createContentString();
            this.historyBar.addToHistory(content);
        }
    },
    
    /**
     * Adds divs for all history items including a text link and time ago.
     * Adds the items in reverse chronological order. 
     */
    _createContentString: function () {
        var self = this, content = "";
    
        if (this.history.length > 0) {
            $.each(this.history, function () {
                content = self._addToContentString(this) + content;
            });
        }
        
        //      Slice off the last "<br />" at the end.
        return content;//.slice(0, -6);
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
        this.removeTooltips();
        this.history = [];
    },
    
    hide: function () {
        if (this.historyBar) {
            this.historyBar.hide();
        }
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

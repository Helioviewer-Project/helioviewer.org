/**
 * MediaManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var MediaManager = Class.extend(
    /** @lends MediaManager.prototype */
    {
    /**
     * @constructs
     * @param {Array} history Items saved in the user's history
     */    
    init: function (history) {

    },
    
    /**
     * Adds an item to the history array and slices the array down to 12 items. Oldest items are chopped off
     * in favor of new items.
     * 
     * @input {Object} item Either a Screenshot or Movie object.
     */
    addToHistory: function (item) {
        this.history.push(item);
        this.history = this.history.reverse().slice(0, 12).reverse();
        
        //this.updateTooltips();
    },

    /**
     * Empties history.
     */
    clear: function () {
        //this.removeTooltips();
        this.history = [];
    },
    
    /**
     * Removes an item from history.
     */
    remove: function (item) {
        //this.removeTooltips();
        this.history = $.grep(this.history, function (h) {
            return h.id !== item.id;
        });

//            if ((this.history.length === 0) && this.historyBar) {
//                this.historyBar.clearHistory();
//            } else {
//                this.updateTooltips();
//            }
//            this.save();
    },    
    
    /**
     * Iterates through its history and tells each object to remove its
     * information tooltip in preparation to make a new one. 
     */
//        removeTooltips: function () {
//            $.each(this.history, function () {
//                this.removeTooltip();
//            });
//        },
    
    /**
     * 
     */
    setup: function () {
        var content = this._createContentString();
        this.historyBar = new MediaHistoryBar(this.id, content);
        
        $(document).bind('setup-' + this.id + '-history-tooltips', $.proxy(this.setupTooltips, this));
        $(document).bind('clear-' + this.id + '-history', $.proxy(this.clear, this));
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

        return content;
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

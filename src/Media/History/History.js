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
    
    removeTooltips: function () {
        $.each(this.history, function () {
            this.removeTooltip();
        });
    },
    
    setupTooltips: function () {
        $.each(this.history, function () {
            this.setupTooltip();
        });
    },
    
    _addToContentString: function (item) {
        return  "<div id='" + item.id + "' class='text-btn' float: left'>" + 
                    item.name + 
                "</div>" +
                "<div style='float:right; font-size: 8pt;'>" + 
                    "<i>" + item.getTimeDiff() + "</i>" + 
                "</div><br /><br />";
    }
});

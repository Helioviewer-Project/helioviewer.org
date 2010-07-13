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
     * @param history -- an array of saved history from UserSettings. May be null.
     */    
    init: function (history) {
        this._super(history);
    },

    addToHistory: function (item) {
        this._super(item);
        $(document).trigger("save-setting", ["movie-history", this._serialize()]);
    },

    createContentString: function () {
        return /*"Movies: <br />" + */this._super();
    },
    
    clear: function () {
        this._super();
        $(document).trigger("save-setting", ["movie-history", this.history]);
    },
    
    _addToContentString: function (item) {
        return  this._super(item) + 
                "<div id='watch-dialog-" + item.id + "' style='display:none'>" +
                "</div>";
    },

    _loadSavedHistory: function (history) {
        var self = this;
        $.each(history, function () {
            self.history.push(new Movie(this, new Date(this.dateRequested)));
        });

        this.history = this.history.slice(0,12);
    }
});

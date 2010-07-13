/**
 * @description Keeps track of screenshot history and can load saved history and add new items to its history.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var ScreenshotHistory = History.extend(
    /** @lends ScreenshotHistory.prototype */
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
        $(document).trigger("save-setting", ["screenshot-history", this._serialize()]);
    },
    
    createContentString: function () {
        return /*"Screenshots: <br />" + */this._super();
    },

    clear: function () {
        this._super();
        $(document).trigger("save-setting", ["screenshot-history", this.history]);
    },
    
    _loadSavedHistory: function (history) {
        var self = this;
        $.each(history, function () {
            self.history.push(new Screenshot(this, new Date(this.dateRequested)));
        });
        this.history = this.history.slice(0,12);
    }
});

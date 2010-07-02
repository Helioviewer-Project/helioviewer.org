/**
 * @description Class that keeps track of previous movies made and controls the display bar and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, MediaHistoryBar */
"use strict";
var MovieHistoryBar = MediaHistoryBar.extend(
    /** @lends MovieHistoryBar.prototype */
    {
    /**
     * @constructs
     * @description Loads in some divs that will be used later in event listeners.
     * 
     * @param id a unique id that identifies which container it belongs to.
     */    
    init: function (id) {
        this._super(id);
        this.container = $("#qtip-" + this.id);
        this.button    = $("#movie-button");
    },
    
    /**
     * Adds divs for the new item including a text link and an empty, hidden div where the dialog
     * for playing the movie will be created. Adds the item to the front of the list so that the list
     * is in reverse chronological order.
     * 
     * @param item A Movie or Screenshot object
     */
    createContentString: function (item) {
        this.content = "<div id='" + item.name + "' class='text-btn' style='padding-right:10px'>" + 
                       item.name + "</div>" +
                       "<div id='watch-dialog-" + item.name + "' style='display:none'></div><br /><br />" + 
                       this.content;
    }
});

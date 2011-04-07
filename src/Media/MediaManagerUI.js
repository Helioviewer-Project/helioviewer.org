/**
 * MediaManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, addIconHoverEventListener */
"use strict";
var MediaManagerUI = Class.extend(
    /** @lends MediaManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     * 
     * @param {ScreenshotManager} model ScreenshotManager instance
     */    
    init: function (type) {
        this._btn             = $("#" + type + "-button");
        this._container       = $("#" + type + "-manager-container");
        this._buildBtns       = $("#" + type + "-manager-build-btns");
        this._fullViewportBtn = $("#" + type + "-manager-full-viewport");
        this._selectAreaBtn   = $("#" + type + "-manager-select-area");
        this._historyTitle    = $("#" + type + "-history-title");
        this._historyBody     = $("#" + type + "-history");
        this._clearBtn        = $("#" + type + "-clear-history-button");
        
        this._loadSavedItems();
    },
    
    /**
     * Hides the media manager
     */
    hide: function () {
        this._container.hide();
    },
    
    /**
     * Shows the media manager
     */
    show: function () {
        this._refresh();
        this._container.show();
    },
    
    /**
     * Toggles the visibility of the media manager
     */
    toggle: function () {
        if (this._container.is(":visible")) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Adds a movie or screenshot to the history
     * 
     * @param {Object} The movie or screenshot to be added 
     */
    _addItem: function (item) {
        var id, html, name = item.name;

        if (name.length > 16) {
            name = name.slice(0, 16) + "...";
        }
        
        html = "<div id='" + item.id + "' class='history-entry'>" +
               "<div class='text-btn' style='float:left'>" + name + 
               "</div>" +
               "<div class='time-elapsed' style='float:right; font-size: 8pt; font-style:italic;'></div><br /><br />" +
               "</div>";
        
        this._historyBody.prepend(html);

        if (this._historyBody.find(".history-entry").length > 12) {
            id = this._historyBody.find(".history-entry").last().attr('id');
            this._removeScreenshot(id);
            this._manager.remove(id);
        }
        
        this._historyTitle.show();
    },
    
    /**
     * Removes a movie or screenshot from the history
     * 
     * @param {Int} Identifier of the screenshot to be removed
     */
    _removeItem: function (id) {
        $("#" + id).unbind().remove();
        
        if (this._historyBody.find(".history-entry").length === 0) {
            this._historyTitle.hide();
        }
    },
    
    /**
     * Create history entries for items from previous sessions
     */
    _loadSavedItems: function () {
        var self = this;

        $.each(this._manager.toArray(), function (i, screenshot) {
            self._addItem(screenshot);
        });
    },
    
    /**
     * Refreshes status information for screenshots or movies in the history
     */
    _refresh: function () {
        $.each(this._manager.toArray(), function (i, item) {
            var elapsedTime = Date.parseUTCDate(item.dateRequested).getElapsedTime()
            $("#" + item.id).find(".time-elapsed").html(elapsedTime);
        });
    },
    
    /**
     * Translates viewport coordinates into arcseconds
     */
    _toArcsecCoords: function (pixels, scale) {
        var coordinates = {
            x1: pixels.left,
            x2: pixels.right,
            y1: pixels.top,
            y2: pixels.bottom
        };
        
        return pixelsToArcseconds(coordinates, scale);
    },
    
    /**
     * Initializes event handlers
     */
    _initEvents: function () {
        var self = this;

        addIconHoverEventListener(this._fullViewportBtn);
        addIconHoverEventListener(this._selectAreaBtn);
        addIconHoverEventListener(this._clearBtn);

        this._btn.click(function () {
           self.toggle();
           $(".jGrowl-notification .close").click();
        });
        
        this._clearBtn.click(function () {
            $.each(self._manager.toArray(), function (i, item) {
                self._removeItem(item.id);
            })
            self._manager.empty();
        });
    }
});
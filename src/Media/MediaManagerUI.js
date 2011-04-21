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
        this._type = type;
        
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

        // Shorten names to fit inside the history dialog        
        if (name.length > 16) {
            name = name.slice(0, 16) + "...";
        }
        
        // HTML for a single row in the history dialog
        html = "<div id='" + item.id + "' class='history-entry'>" +
               "<div class='text-btn' style='float:left'>" + name + 
               "</div>" +
               "<div class='time-elapsed' style='float:right; font-size: 8pt; font-style:italic;'></div><br /><br />" +
               "</div>";
        
        this._historyBody.prepend(html);

        // Make sure the list contains no more than twelve items
        if (this._historyBody.find(".history-entry").length > 12) {
            id = this._historyBody.find(".history-entry").last().attr('id');
            this._removeItem(id);
            this._manager.remove(id);
        }
        
        // Show the history section title if it is not already visible
        this._historyTitle.show();
    },
    
    /**
     * Removes a movie or screenshot from the history
     * 
     * @param {Int} Identifier of the screenshot to be removed
     */
    _removeItem: function (id) {
        $("#" + id).unbind().remove();
        
        // Hide the history section if the last entry was removed
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
        // Update the elapsed time information for each row in the history
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

        // Add icon hover effects
        addIconHoverEventListener(this._fullViewportBtn);
        addIconHoverEventListener(this._selectAreaBtn);
        addIconHoverEventListener(this._clearBtn);

        // Hide all jGrow notifications when opening the media manager
        this._btn.click(function () {
            if (!self.working) {
                self.toggle();
                $(".jGrowl-notification .close").click();
            }
        });
        
        // Clear buttons removes all saved items
        this._clearBtn.click(function () {
            $.each(self._manager.toArray(), function (i, item) {
                self._removeItem(item.id);
            })
            self._manager.empty();
        });
    },
    
    /**
     * Validates the screenshot or movie request and displays an error message if there is a problem
     * 
     * @return {Boolean} Returns true if the request is valid
     */
    _validateRequest: function (roi, layers) {
        if (roi.bottom - roi.top < 50 || roi.right - roi.left < 50) {
            $(document).trigger("message-console-warn", ["The area you have selected is too small to create a " +
                this._type + ". Please try again."]);
            return false;
        } else if (layers.length === 0) {
            $(document).trigger("message-console-warn", ["You must have at least one layer in your " + this._type +
                ". Please try again."]);
            return false;
        }
        return true;
    }
});
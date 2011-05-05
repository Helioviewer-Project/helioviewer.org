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
        $(".media-manager-container").hide();
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
        var htmlId, html, last, name = item.name;

        // Shorten names to fit inside the history dialog        
        if (name.length > 16) {
            name = name.slice(0, 16) + "...";
        }
        
        // HTML for a single row in the history dialog
        htmlId = this._type + "-" + item.id;

        html = "<div id='" + htmlId + "' class='history-entry'>" +
               "<div class='text-btn' style='float:left'>" + name + "</div>" +
               "<div class='status'></div>" + 
               "</div>";
        
        this._historyBody.prepend(html);

        // Make sure the list contains no more than twelve items
        if (this._historyBody.find(".history-entry").length > 12) {
            last = this._historyBody.find(".history-entry").last().attr('id');
            this._removeItem(last);
            this._manager.remove(last);
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

        $.each(this._manager.toArray(), function (i, item) {
            self._addItem(item);
        });
    },
    
    /**
     * Refreshes status information for screenshots or movies in the history
     */
    _refresh: function () {
        var type = this._type;

        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            var status, elapsedTime;
            
            status = $("#" + type + "-" + item.id).find(".status");
            elapsedTime = Date.parseUTCDate(item.dateRequested).getElapsedTime();
            status.html(elapsedTime);                
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
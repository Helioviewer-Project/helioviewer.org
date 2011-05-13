/**
 * MediaManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, 
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global Class, $, pixelsToArcseconds, addIconHoverEventListener */
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
        this._tooltips        = $("#social-buttons div");
        this._allContainers   = $(".media-manager-container");
        
        this._loadSavedItems();
    },

    /**
     * Hides the media manager
     */
    hide: function () {
        this._container.hide();
        this._tooltips.qtip("enable");
    },
    
    /**
     * Shows the media manager
     */
    show: function () {
        this._allContainers.hide();
        this._tooltips.qtip("disable");
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

        html = $("<div id='" + htmlId + "' class='history-entry'>" +
               "<div class='text-btn' style='float:left'>" + name + "</div>" +
               "<div class='status'></div>" + 
               "</div>");
               
        // Store id with dom-node for easy access
        html.data("id", item.id);
        
        this._historyBody.prepend(html);

        // Make sure the list contains no more than twelve items
        if (this._historyBody.find(".history-entry").length > 12) {
            last = this._historyBody.find(".history-entry").last().attr('id');
            this._removeItem(last);
            this._manager.remove(last);
        }
        
        // Setup hover and click event-handlers
        // 2011/05/06: Let's first try using live()
        //this._setupEventHandlers(item);
        
        // Show the history section title if it is not already visible
        this._historyTitle.show();
    },
    
    /**
     * Removes a movie or screenshot from the history
     * 
     * @param {Int} Identifier of the screenshot to be removed
     */
    _removeItem: function (id) {
        $("#" + this._type + "-" + id).unbind().remove();
        
        // Hide the history section if the last entry was removed
        if (this._historyBody.find(".history-entry").length === 0) {
            this._historyTitle.hide();
        }
    },
    
    /**
     * Create history entries for items from previous sessions
     */
    _loadSavedItems: function () {
        var sorted, self = this;
        
        sorted = this._manager.toArray().sort(function (a, b) {
            return a.id - b.id; 
        });

        $.each(sorted, function (i, item) {
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
            var status, elapsed;
            
            status = $("#" + type + "-" + item.id).find(".status");
            elapsed = Date.parseUTCDate(item.dateRequested).getElapsedTime();
            status.html(elapsed);                
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
            });
            self._manager.empty();
        });
    },
    
    /**
     * Validates the screenshot or movie request and displays an error message 
     * if there is a problem
     * 
     * @return {Boolean} Returns true if the request is valid
     */
    _validateRequest: function (roi, layers) {
        var message;

        // Selected area too small
        if (roi.bottom - roi.top < 50 || roi.right - roi.left < 50) {
            message = "The area you have selected is too small to create a " +
                      this._type + ". Please try again.";
            $(document).trigger("message-console-warn", [message]);

            return false;

        // No visible layers
        } else if (layers.length === 0) {
            message = "You must have at least one layer in your " + this._type +
                      ". Please try again.";
            $(document).trigger("message-console-warn", [message]);

            return false;
        }
        return true;
    }
});
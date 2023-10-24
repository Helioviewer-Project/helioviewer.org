/**
 * MediaManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global Class, $, pixelsToArcseconds */
"use strict";
var MediaManagerUI = Class.extend(
    /** @lends MediaManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     *
     * @param {ScreenshotManager} model ScreenshotManager instance
     * @param {bool} enable_helios Determines whether or not to render helios links on movies
     */
    init: function (type, enable_helios = false) {
        this._type = type;

        this._btn              = $("#" + type + "-button");
        this._container        = $("#" + type + "-manager-container");
        this._buildBtns        = $("#" + type + "-manager-build-btns");
        this._fullViewportBtn  = $("#" + type + "-manager-full-viewport");
        this._selectAreaBtn    = $("#" + type + "-manager-select-area");
        this._historyTitle     = $("#" + type + "-history-title");
        this._historyBody      = $("#" + type + "-history");
        this._clearBtn         = $("#" + type + "-clear-history-button");
        this._tooltips         = $("#social-buttons div");
        this._cleanupFunctions = [];
        this._enable_helios = enable_helios;

        this._loadSavedItems();
    },

    /**
     * Checks for media item in history
     */
    has: function (id) {
        return this._manager.has(id);
    },

    /**
     * Hides the media manager
     */
    hide: function () {
        this._container.hide();
        this._btn.removeClass("active");
        this._tooltips.qtip("enable");
        $(".qtip").qtip("hide");
    },

    /**
     * Shows the media manager
     */
    show: function () {
        //this._allContainers.hide();
        //this._allButtons.removeClass("active");
        this._btn.addClass("active");
        $(".jGrowl-notification").trigger("jGrowl.close");
        this._refresh();
        this._container.show();
        this._tooltips.qtip("hide").qtip("disable", true);
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
        var htmlId, html, last, url, name = item.name, helios_link = "";

        // HTML for a single row in the history dialog
        htmlId = this._type + "-" + item.id;

        // Link
        if (this._type === "movie") {
            url = "?movieId=" + item.id;
            if (this._enable_helios) {
                helios_link = "&nbsp;&nbsp;&nbsp;<a class='text-btn helios-link' href='https://gl.helioviewer.org/?movie=" + item.id + "'>View on Helios</a>";
            }
        }
        else {
            url = Helioviewer.api + "?action=downloadScreenshot&id=" + item.id;
        }

        html = $("<div id='" + htmlId + "' class='history-entry'>" +
               "<div class='label' data-id='" + item.id + "'><p style='float: left'><a class='text-btn' href='" + url +
               "'>" + name + "</a>"+ helios_link +"</p></div>" +
               "<div class='status'></div>" +
               "</div>");

        // Store id with dom-node for easy access
        html.data("id", item.id);

        this._historyBody.prepend(html);

        // Create a preview tooltip
        this._buildPreviewTooltip(item);

        // Remove any entries beyond limit
        if (this._historyBody.find(".history-entry").length >
            this._manager._historyLimit) {
            last = this._historyBody.find(".history-entry").last().data('id');
            this._removeItem(last);
        }

        // Show the history section title if it is not already visible
        this._historyTitle.show();
    },

    /**
     * Creates a simple preview tooltip which pops up when the user moves
     * the mouse over the specified history entry.
     */
    _buildPreviewTooltip: function (item) {
        var self = this;

        $("#" + this._type + "-" + item.id).qtip({
            content: {
                title: {
                    text: item.name
                },
                text: self._buildPreviewTooltipHTML(item)
            },
            position: {
                adjust: {
                    x: -10,
                    y: -1
                },
                my: "right top",
                at: "left center"
            },
            show: {
                delay: 140
            }
        });
    },

    /**
     * Removes a movie or screenshot from the history
     *
     * @param {Int} Identifier of the screenshot to be removed
     */
    _removeItem: function (id) {
        $("#" + this._type + "-" + id).qtip("destroy").unbind().remove();

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

        $.each(this._manager.toArray().reverse(), function (i, item) {
            self._addItem(item);
        });
    },

    /**
     * Refreshes status information for screenshots or movies in the history
     * and preview tooltip positions
     */
    _refresh: function () {
        var type = this._type;

        // Update preview tooltip positioning
        this._historyBody.find(".qtip").qtip('reposition');

        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            var status, elapsed;

            status = $("#" + type + "-" + item.id).find(".status");
            elapsed = Date.parseUTCDate(item.dateRequested).getElapsedTime();
            status.html(elapsed+' ago');
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

        this._btn.click(function () {
            if (!self.working) {
                self.toggle();
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

export { MediaManagerUI }
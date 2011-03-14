/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, addIconHoverEventListener */
"use strict";
var ScreenshotManagerUI = Class.extend(
    /** @lends ScreenshotManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     * 
     * @param {ScreenshotManager} model ScreenshotManager instance
     */    
    init: function (model) {
        this._screenshots = model;
        
        this._btn = $("#screenshot-button");
        
        this._container       = null;
        this._history         = null;
        this._buildBtns       = null;
        this._fullViewportBtn = null;
        this._selectAreaBtn   = null;
        this._historyTitle    = null;
        this._clearBtn        = null;

        this._initUI();
        this._initEvents();
        
        this._loadScreenshots();
    },
    
    /**
     * Hides the screenshot manager
     */
    hide: function () {
        this._container.hide();
    },
    
    /**
     * Shows the screenshot manager
     */
    show: function () {
        this._refresh();
        this._container.show();
    },
    
    /**
     * Toggles the visibility of the screenshot manager
     */
    toggle: function () {
        if (this._container.is(":visible")) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    /**
     * Adds a single screenshot entry to the history
     */
    _addScreenshot: function (screenshot) {
        var id, html;
        
        html = "<div id='" + screenshot.id + "' class='history-entry'>" +
               "<div class='text-btn' style='float:left'>" + screenshot.name + 
               "</div>" +
               "<div class='time-elapsed' style='float:right; font-size: 8pt; font-style:italic;'></div><br /><br />" +
               "</div>";
        
        this._history.prepend(html);

        if (this._history.find(".history-entry").length > 12) {
            id = this._history.find(".history-entry").last().attr('id');
            this._removeScreenshot(id);
            this._screenshots.remove(id);
        }
        
        this._historyTitle.show();
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their download has completed
     */
    _displayDownloadNotification: function (screenshot) {
        var jGrowlOpts, id, link, self = this;
        
        id = screenshot.id;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Your screenshot is ready!",
            open:    function () {
                self.hide();

                // open callback now called before dom-nodes are added to screen so $.live used
                $("#screenshot-" + id).live('click', function () {
                    $(".jGrowl-notification .close").click();
                    screenshot.download();
                });
            }
        };
        
        // Download link
        link = "<div id='screenshot-" + id + "' style='cursor: pointer'>Click here to download. </div>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-info", [link, jGrowlOpts]);
    },
    
    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;
        
        addIconHoverEventListener(this._fullViewportBtn);
        addIconHoverEventListener(this._selectAreaBtn);
        addIconHoverEventListener(this._clearBtn);

        this._btn.click(function () {
           self.toggle();
           $(".jGrowl-notification .close").click(); // Close any open jGrowl notifications
        });
        
        this._fullViewportBtn.click(function () {
            self.hide();
            self._takeScreenshot();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            $(document).trigger("enable-select-tool", $.proxy(self._takeScreenshot, self));
        });
        
        this._clearBtn.click(function () {
            $.each(self._screenshots.toArray(), function (i, screenshot) {
                self._removeScreenshot(screenshot.id);
            })
            self._screenshots.empty();
        });
    },
    
    /**
     * Initializes the ScreenshotManager user interface
     */
    _initUI: function () {
        var html = "<div id='screenshot-manager-container' style='position: absolute; top: 25px; right: 20px; width: 190px; background: #2A2A2A; font-size: 11px; padding: 10px; -moz-border-radius:5px; color: white; display: none;'>" +
                   "<div id='screenshot-manager-build-btns' style='height: 18px;'>" +
                   "<div id='screenshot-manager-full-viewport' class='text-btn'>" +
                       "<span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>" +
                       "<span style='line-height: 1.6em'>Full Viewport</span>" +
                   "</div>" +
                   "<div id='screenshot-manager-select-area' class='text-btn' style='float:right;'>" +
                       "<span class='ui-icon ui-icon-scissors' style='float:left;'></span>" +
                       "<span style='line-height: 1.6em'>Select Area</span>" + 
                   "</div></div>" +
                   "<div id='screenshot-history-title' style='line-height:1.6em; font-weight: bold; padding: 9px 0px; border-top: 1px solid; display: none; margin-top: 7px;'>" +
                       "Screenshot History" + 
                       "<div id='screenshot-clear-history-button' class='text-btn' style='float:right;'>" +
                           "<span class='ui-icon ui-icon-trash' style='float:left;' />" +
                           "<span style='font-weight:normal'><i>Clear</i></span>" +
                       "</div>" + 
                   "</div>" +
                   "<div id='screenshot-history'></div>"
                   "</div>";
        
        this._container = $(html).appendTo("#helioviewer-viewport-container-inner");
        this._history   = $("#screenshot-history");

        this._buildBtns       = $("#screenshot-manager-build-btns");
        this._fullViewportBtn = $("#screenshot-manager-full-viewport");
        this._selectAreaBtn   = $("#screenshot-manager-select-area");
        this._historyTitle    = $("#screenshot-history-title");
        this._clearBtn        = $("#screenshot-clear-history-button");
    },
    
    /**
     * Creates HTML for screenshot history entries
     */
    _loadScreenshots: function () {
        var self = this;

        $.each(this._screenshots.toArray(), function (i, screenshot) {
            self._addScreenshot(screenshot);
        });
    },
    
    /**
     * Refreshes status information for screenshots in the history
     */
    _refresh: function () {
        $.each(this._screenshots.toArray(), function (i, screenshot) {
            $("#" + screenshot.id).find(".time-elapsed").html(screenshot.dateRequested.getElapsedTime());
        });
    },
    
    /**
     * Removes a single screenshot from the history.
     * 
     * @param {String} Identifier of the screenshot to be removed
     */
    _removeScreenshot: function (id) {
        $("#" + id).unbind().remove();
        
        if (this._history.find(".history-entry").length === 0) {
            this._historyTitle.hide();
        }
    },
    
    /**
     * @description Gathers all necessary information to generate a screenshot, and then displays the
     *              image when it is ready.
     * @param {Object} roi Region of interest to use in place of the current viewport roi
     */
    _takeScreenshot: function (roi) {
        var params, imageScale, date, layers, servers, server, screenshot, self = this; 
        
        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        date       = helioviewer.getDate().toISOString();
        imageScale = helioviewer.getImageScale();
        layers     = helioviewer.getLayers();
        servers    = helioviewer.getServers();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        };

        params = $.extend({
            action        : "takeScreenshot",
            dateRequested : new Date().toISOString(),
            imageScale    : imageScale,
            layers        : layers,
            obsDate       : date,
            display       : false
        }, this._toArcsecCoords(roi, imageScale));
        
        // Choose server to send request to
        server = Math.floor(Math.random() * (servers.length));
        if (server > 0) {
            params.server = server;
        }

        // AJAX Responder
        $.getJSON("api/index.php", params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info", "Unable to create screenshot. Please try again later.");
                return;
            }
            
            screenshot = self._screenshots.add(
                    response.id, params.imageScale, params.layers, params.dateRequested, params.obsDate, 
                    params.x1, params.x2, params.y1, params.y2
            );
            self._addScreenshot(screenshot);
            self._displayDownloadNotification(screenshot);
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
     * Validates the screenshot request and displays an error message if there is a problem
     * 
     * @return {Boolean} Returns true if the request is valid
     */
    _validateRequest: function (roi, layers) {
        if (roi.bottom - roi.top < 50 || roi.right - roi.left < 50) {
            $(document).trigger("message-console-warn", ["The area you have selected is too small to " +
                    "create a screenshot. Please try again."]);
            return false;
        } else if (layers.length === 0) {
            $(document).trigger("message-console-warn", ["You must have at least one layer in your " +
                    "screenshot. Please try again."]);
            return false;
        }
        return true;
    }
});

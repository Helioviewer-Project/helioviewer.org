/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, 
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Helioviewer, helioviewer, MediaManagerUI, ScreenshotManager
*/
"use strict";
var ScreenshotManagerUI = MediaManagerUI.extend(
    /** @lends ScreenshotManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     * 
     * @param {ScreenshotManager} model ScreenshotManager instance
     */    
    init: function () {
        var screenshots = Helioviewer.userSettings.get('history.screenshots');
        this._manager = new ScreenshotManager(screenshots);

        this._super("screenshot");

        this._initEvents();
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their 
     * download has completed
     */
    _displayDownloadNotification: function (id) {
        var jGrowlOpts, link, self = this;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Your screenshot is ready!",
            open:    function (msg) {
                msg.click(function (e) {
                   msg.trigger("jGrowl.close");
                });
            }
        };
        
        // Download link
        link = "<a href='api/index.php?action=downloadScreenshot&id=" + id +
               "'>Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-info", [link, jGrowlOpts]);
    },
    
    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;
       
        this._super();
        
        // Screenshot ROI selection buttons
        this._fullViewportBtn.click(function () {
            self.hide();
            self._takeScreenshot();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            $(document).trigger("enable-select-tool", 
                                $.proxy(self._takeScreenshot, self));
        });
        
        // Setup click handler for history items
        $("#screenshot-history .history-entry")
           .live('click', $.proxy(this._onScreenshotClick, this));
    },
    
    /**
     * Creates HTML for a preview tooltip with a preview thumbnail, 
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (screenshot) {
        var width, height, date, html;
        
        width  = Math.round((screenshot.x2 - screenshot.x1) / 
                    screenshot.imageScale);
        height = Math.round((screenshot.y2 - screenshot.y1) / 
                    screenshot.imageScale);
        
        date = screenshot.date.substr(0, 19).replace(/T/, " "); 
        
        html = "<div style='text-align: center;'>" + 
            "<img src='api/?action=downloadScreenshot&id=" + screenshot.id +
            "' alt='preview thumbnail' class='screenshot-preview' /></div>" + 
            "<table class='preview-tooltip'>" +
            "<tr><td><b>Date:</b></td><td>" + date + "</td></tr>" +
            "<tr><td><b>Scale:</b></td><td>" + 
            screenshot.imageScale.toFixed(2) + 
            " arcsec/px</td></tr>" +
            "<tr><td><b>Dimensions:</b></td><td>" + width + 
            "x" + height + " px</td></tr>" +
            "</table>";
            
        return html;
    },
    
    /**
     * When a screenshot history entry is clicked, and the screenshot has
     * finished processing, download the screenshot. Otherwise do nothing.
     */
    _onScreenshotClick: function (event) {
        var id = $(event.currentTarget).data('id'),
            url = "api/index.php?action=downloadScreenshot&id=" + id;
        window.open(url, '_parent');
    },

    /**
     * Gathers all necessary information to generate a screenshot, and then 
     * displays the image when it is ready.
     * 
     * @param {Object} roi Region of interest to use in place of the current \
     * viewport roi
     */
    _takeScreenshot: function (roi) {
        var params, imageScale, layers, server, screenshot, self = this; 
        
        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        imageScale = helioviewer.getImageScale();
        layers     = helioviewer.getLayers();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        params = $.extend({
            action        : "takeScreenshot",
            imageScale    : imageScale,
            layers        : layers,
            date          : helioviewer.getDate().toISOString(),
            display       : false
        }, this._toArcsecCoords(roi, imageScale));
        
        // Choose server to send request to
        server = Math.floor(Math.random() * (helioviewer.getServers().length));
        if (server > 0) {
            params.server = server;
        }

        // AJAX Responder
        $.getJSON("api/index.php", params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info", 
                    "Unable to create screenshot. Please try again later.");
                return;
            }
            
            screenshot = self._manager.add(
                response.id, params.imageScale, params.layers, 
                new Date().toISOString(), params.date, 
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(screenshot);
            self._displayDownloadNotification(screenshot.id);
        });
    }
});

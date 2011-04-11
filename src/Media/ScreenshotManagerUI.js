/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global MediaManagerUI, ScreenshotManager, Helioviewer, $ */
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
        this._manager = new ScreenshotManager(Helioviewer.userSettings.get('screenshots'));
        this._super("screenshot");

        this._initEvents();
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their download has completed
     */
    _displayDownloadNotification: function (id) {
        var jGrowlOpts, link, self = this;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Your screenshot is ready!",
            open:    function () {
                self.hide();
            }
        };
        
        // Download link
        link = "<a href='api/index.php?action=downloadScreenshot&id=" + id 
             + "' target='_parent' style=''>Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-info", [link, jGrowlOpts]);
    },
    
    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;
       
        this._super();
        
        this._fullViewportBtn.click(function () {
            self.hide();
            self._takeScreenshot();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            $(document).trigger("enable-select-tool", $.proxy(self._takeScreenshot, self));
        });
    },

    /**
     * @description Gathers all necessary information to generate a screenshot, and then displays the
     *              image when it is ready.
     * @param {Object} roi Region of interest to use in place of the current viewport roi
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
        };

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
                $(document).trigger("message-console-info", "Unable to create screenshot. Please try again later.");
                return;
            }
            
            screenshot = self._manager.add(
                response.id, params.imageScale, params.layers, new Date().toISOString(), params.date, 
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(screenshot);
            self._displayDownloadNotification(screenshot.id);
        });
    }
});

/**
 * @author Jaclyn Beck
 * @fileoverview Contains the code for the Screenshot Builder class. Handles event listeners for the screenshot button and
 *                  screenshot creation.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class, window, MediaBuilder */
"use strict";
var ScreenshotBuilder = MediaBuilder.extend(
    /** @lends ScreenshotBuilder.prototype */
    {
    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the screenshot button
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport, mediaHistoryBar) {
        this._super(viewport, mediaHistoryBar);
        this.button = $("#screenshot-button");
        this.id     = "screenshot";
        this._setupDialogAndEventHandlers();
    },

    /**
     * Called after _setupDialogAndEventHandlers is finished initializing the dialog. 
     * Creates event listeners for the "Full Viewport" and "Select Area" buttons in the
     * dialog. "Full Viewport" takes a screenshot immediately, "Select Area" triggers 
     * the ImageSelectTool and provides it with a callback function to takeScreenshot().
     * 
     * Finally, it also initializes the history bar, which floats beneath the dialog and
     * has a list of all movies made in this session. History bar has to be initialized here
     * because it depends on divs created in the dialog.
     */
    _setupEventListeners: function () {
        var self = this, viewportInfo;
        this.fullVPButton     = $("#" + this.id + "-full-viewport");
        this.selectAreaButton = $("#" + this.id + "-select-area");
        
        this.fullVPButton.click(function () {
            self.hideDialogs();
            viewportInfo = self.viewport.getViewportInformation();
            self.takeScreenshot(viewportInfo);
        });
        
        this.selectAreaButton.click(function () {
            self.hideDialogs();
            $(document).trigger("enable-select-tool", $.proxy(self.takeScreenshot, self));
        });
        
        this.historyBar.setup();
    },
    
    /**
     * @description Gathers all necessary information to generate a screenshot, and then displays the
     *              image when it is ready.
     * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right 
     *                 coordinates of the visible region 
     */
    takeScreenshot: function (viewportInformation) {
        var self, callback, params, url, arcsecCoords, id, download, screenshot;        
        arcsecCoords  = this.toArcsecCoords(viewportInformation.coordinates, viewportInformation.imageScale);
        self = this;

        params = {
            action     : "takeScreenshot",
            layers     : viewportInformation.layers,
            obsDate    : viewportInformation.time,
            imageScale : viewportInformation.imageScale,
            x1         : arcsecCoords.x1,
            x2         : arcsecCoords.x2,
            y1         : arcsecCoords.y1,
            y2         : arcsecCoords.y2
        };

        screenshot = new Screenshot(params, new Date());

        callback = function (url) {
            id = (url).slice(-14,-4);

            if (url !== null) {       
                // Options for the jGrowl notification. Clicking on the notification will 
                // let the user download the file.                        
                options = {
                    sticky: true,
                    header: "Your screenshot is ready!",
                    open:    function (e, m) {
                        screenshot.setURL(url, id);
                        self.historyBar.addScreenshotToHistory(screenshot);
                        
                        download = $("#screenshot-" + id);
                        
                        download.click(function () {
                            screenshot.download();
                        });
                    }
                };

                // Create the jGrowl notification.
                $(document).trigger("message-console-info", ["<div id='screenshot-" + id +
                "' style='cursor: pointer'>Click here to download. </div>", options]); 
            }
        };

        $.post(this.url, params, callback, 'json');
    }
});
/**
 * @author Jaclyn Beck
 * @fileoverview Contains the code for the Screenshot Builder class. Handles event listeners for the screenshot button and
 *                  screenshot creation.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class, window */
"use strict";
var ScreenshotBuilder = MediaBuilder.extend(
    /** @lends ScreenshotBuilder.prototype */
    {

    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the screenshot button
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport) {
        this._super(viewport);
        this.button = $("#screenshot-button");
        this.id     = "screenshot";
        this._setupDialog();
    },

    _setupEventListeners: function () {
        var self = this, visibleCoords;
        this.fullVPButton     = $("#" + this.id + "-full-viewport");
        this.selectAreaButton = $("#" + this.id + "-select-area");
        
        this.fullVPButton.click(function () {
            self.button.qtip("hide");
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your screenshot will be available shortly."]);
            }
            else {
                viewportInfo = self.viewport.getViewportInformation();
                self.takeScreenshot(viewportInfo);
            }
        });
        
        this.selectAreaButton.click(function () {
            self.button.qtip("hide");
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your screenshot will be available shortly."]);
            }
            else {
                $(document).trigger("enable-select-tool", $.proxy(self.takeScreenshot, self));
            }
        });
    },
    
    /**
     * @description Gathers all necessary information to generate a screenshot, and then displays the
     *              image when it is ready.
     * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right 
     *                 coordinates of the visible region 
     */
    takeScreenshot: function (viewportInformation) {
        var self, callback, params, imgWidth, imgHeight, url, mediaSettings, download, options, filename;        

        this.building = true;
        arcsecCoords  = this.toArcsecCoords(viewportInformation);
        self = this;
        console.log(viewportInformation.layers);
        params = {
            action     : "takeScreenshot",
            layers     : viewportInformation.layers,
            obsDate    : viewportInformation.time,
            imageScale : scale,
            x1         : arcsecCoords.x1,
            x2         : arcsecCoords.x2,
            y1         : arcsecCoords.y1,
            y2         : arcsecCoords.y2
        };

        callback = function (url) {
            self.building = false;

            // If the response is an error message instead of a url, show the message
            if (url === null) {
                //$(document).trigger("message-console-error", ["The selected region was not valid."]);
            }
            
            else {        
                // Options for the jGrowl notification. Clicking on the notification will 
                // let the user download the file.                        
                options = {
                    sticky: true,
                    header: "Your screenshot is ready!",
                    open:    function (e, m) {
                        download = $('#screenshot-' + filename);
                        
                        download.click(function () {
                            window.open('api/index.php?action=downloadFile&url=' + url, '_parent');
                        });
                    }
                };

                // Create the jGrowl notification.
                $(document).trigger("message-console-info", ["<div id='screenshot-" + filename +
                "' style='cursor: pointer'>Click here to download. </div>", options]); 
            }
        };

        $.post(this.url, params, callback, 'json');
    }
});
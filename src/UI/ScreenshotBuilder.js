/**
 * @author Jaclyn Beck
 * @fileoverview Contains the code for the Screenshot Builder class. Handles event listeners for the screenshot button and
 *                  screenshot creation.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class, window */
"use strict";
var ScreenshotBuilder = Class.extend(
    /** @lends ScreenshotBuilder.prototype */
    {

    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the screenshot button
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport) {
        this.button   = $("#screenshot-button");
        this.building = false;
        this.viewport = viewport;
        this._setupDialog();
    },

    _setupDialog: function () {
        this.button.qtip({
            position: {
                corner: {
                    target: 'bottomMiddle',
                    tooltip: 'topMiddle',
                },
                adjust: {
                    x : 0,
                    y : 15
                }
            },
            show: {
                when: { event: 'click'},
                effect: "slide"
            },
            hide: {
                when: { event: 'click'},
                effect: "slide"
            },                      
            content: {
                text : "<div id='full-viewport' class='text-btn'>" +
                            "<span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>" +
                            "<span style='line-height: 1.6em'>Full Viewport</span>" +
                       "</div>" +
                       "<div id='select-area' class='text-btn'>" +
                            "<span class='ui-icon ui-icon-scissors' style='float:left;'></span>" +
                            "<span style='line-height: 1.6em'>Select Area</span>" + 
                       "</div>"
            }, 
            style: {
                textAlign: 'justify',
                width: 200,
                color: '#fff',
                background: '#2A2A2A',
                border: { 
                    width: 1,
                    radius: 6, 
                    color: '#2A2A2A'
                },
            },
            api: { onRender: $.proxy(this._setupEventListeners, this) }
        });
    },
    
    _setupEventListeners: function () {
        var self = this, visibleCoords;
        this.fullVPButton     = $("#full-viewport");
        this.selectAreaButton = $("#select-area");
        
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
        self = this;
        
        vpCoords     = viewportInformation.coordinates;
        scale        = viewportInformation.imageScale;
        arcsecCoords = {
            x1 : vpCoords.left   * scale,
            x2 : vpCoords.right  * scale,
            y1 : vpCoords.top    * scale,
            y2 : vpCoords.bottom * scale
        };
        
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
                //mediaSettings.shadowboxWarn(transport.responseText);
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

        $.post('api/index.php', params, callback, 'json');
    }
});
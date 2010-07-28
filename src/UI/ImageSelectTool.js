/**
 * @author Jaclyn Beck
 * @fileoverview A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 *                 to select a subregion of the image in the viewport. 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, showButtonsInViewport, 
    hideButtonsInViewport, addIconHoverEventListener */
"use strict";
var ImageSelectTool = Class.extend(
    /** @lends ImageSelectTool.prototype */
    {
    /**
     * @constructs
     * @description Sets up an event handler for the select region button and finds the divs where
     *                 the fake transparent image will be inserted
     * @param {Object} controller -- the helioviewer class
     */
    init: function (viewport) {
        this.active     = false;
        this.viewport   = viewport;
        this.vpDomNode  = $("#helioviewer-viewport");

        this._setupFinishedButton();
        
        $(document).bind("enable-select-tool", $.proxy(this.enableAreaSelect, this));
    },

    /**
     * Activates the plugin or disables it if it is already active
     */
    enableAreaSelect: function (event, callback) {
        var imgContainer, transImg;
    
        // If the user has already pushed the button but not done anything, this will turn the feature off.
        if (this.active) {
            this.cleanup();
        }

        // Otherwise, turn it on.
        else {
            // Disable keyboard shortcuts for fullscreen mode
            $("body").addClass('disable-fullscreen-mode');
            this.active = true;

            // Get viewport dimensions to make the transparent image with. 
            this.width  = this.vpDomNode.width();
            this.height = this.vpDomNode.height();
        
            /* 
            * Create a temporary transparent image that spans the height and width of the viewport.
            * Necessary because the viewport image is done in tiles and imgAreaSelect cannot cross 
            * over tile boundaries. Add the transparent image to the viewport, on top of the other tiles.
            * 
            * vpDomNode corresponds to the div "#helioviewer-viewport", so add the tile directly
            * inside this div. It is necessary to specify a z-index because otherwise it gets added underneath
            * the rest of the tiles and the plugin will not work.
            */
            transImg = $('<img id="transparent-image" src="resources/images/transparent_512.png" alt="" width="' +
                   this.width + '" height="' + this.height + '" />');
            transImg.css({'position': 'relative', 'cursor': 'crosshair', 'z-index': 5});
            transImg.appendTo(this.vpDomNode);
            
            /* Make a temporary container for imgAreaSelect to put all of its divs into.
            * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
            * do not span the whole image for some reason. All of the divs are put in "#outside-box"
            */
            imgContainer = $('body').append('<div id="imgContainer"></div>');

            this.selectArea(callback);
        }
    },
    
    /**
     * @description Loads the imgAreaSelect plugin and uses it on the transparent image that covers the viewport.
     *                 The function imgAreaSelect() returns two variables, "img", which is the original transparent
     *                 image, and "selection", which is an array describing the selected area. Available data for 
     *                 "selection" is x1, y1, x2, y2, width, and height.
     *                 See http://odyniec.net/projects/imgareaselect/  for usage examples and documentation. 
     */
    selectArea: function (callback) {
        var area, self = this;
        
        // Use imgAreaSelect on the transparent region to get the top, left, bottom, and right 
        // coordinates of the selected region. 
        area = $("#transparent-image").imgAreaSelect({ 
            instance: true,
            handles : true,
            parent  : "#imgContainer",
            x1      : this.width / 4,
            x2      : this.width * 3 / 4,
            y1      : this.height / 4,
            y2      : this.height * 3 / 4,
            onInit  : function () {
                self.vpDomNode.qtip("show");
                hideButtonsInViewport();
            }
        });
        
        $(window).resize(function () {
            if (self.active) {
                self.cancelButton.click();
                self.enableAreaSelect(0, callback);
            }
        });

        this.doneButton.click(function () {
            self.submitSelectedArea(area, callback);
        });

        /* Key presses don't register while imgAreaSelect is active for some reason.
        $(document).bind("enter-key-pushed", function () {
            console.log("pushed");
            
        });
        */
        
        $(document).keypress(function (e) {
            // Enter key
            if (e.which === 13) {
                self.submitSelectedArea(area, callback);
            }
        });
        
        this.cancelButton.click(function () {
            self.cleanup();
        });
        
        this._setupEventListeners();
    },
    
    /**
     * Once an area has been selected, this method calculates the coordinates of the 
     * selected area, cleans up divs created by the plugin, and uses the callback 
     * function to complete movie/screenshot building.
     */
    submitSelectedArea: function (area, callback) {
        var selection, viewportInfo, visibleCoords, coords;
        if (area) {
            // Get the coordinates of the selected image, and adjust them to be 
            // heliocentric like the viewport coords.
            selection = area.getSelection();
    
            viewportInfo  = this.viewport.getViewportInformation();
            visibleCoords = viewportInfo.coordinates;
            maxCoords     = viewportInfo.maxImageCoordinates;

            coords = {
                top     : Math.max(visibleCoords.top  + selection.y1, maxCoords.top),
                left    : Math.max(visibleCoords.left + selection.x1, maxCoords.left),
                bottom  : Math.min(visibleCoords.top  + selection.y2, maxCoords.bottom),
                right   : Math.min(visibleCoords.left + selection.x2, maxCoords.right)
            };

            viewportInfo.coordinates = coords;
            viewportInfo.maxImageCoordinates = coords;

            this.cleanup();
            callback(viewportInfo);
        }
    },
    
    /**
     * Adds a bar in the upper-right corner of the viewport with buttons for "Done", 
     * "Cancel", and "Help"
     */
    _setupFinishedButton: function () {
        var self = this;
        this.vpDomNode.qtip({
            position: {
                corner: {
                    target: 'topRight',
                    tooltip: 'topRight'
                }
            },      
            content: {
                text : "<div id='done-selecting-image' class='text-btn'>" +
                            "<span class='ui-icon ui-icon-circle-check' style='float: left;'></span>" +
                            "<span>Done</span>" +
                        "</div>" + 
                        "<div id='cancel-selecting-image' class='text-btn'>" + 
                            "<span class='ui-icon ui-icon-circle-close' style='float:left;' />" + 
                            "<span>Cancel</span>" + 
                        "</div>" +
                        "<div id='help-selecting-image' class='text-btn' style='float: right;'>" + 
                            "<span class='ui-icon ui-icon-info'></span>" +
                        "</div>"
            },
            show: false,
            hide: false,
            style: {
                name: "mediaDark",
                "font-size": "10pt",
                width: 'auto'
            },
            api: { 
                onRender: function () {
                    self.doneButton   = $("#done-selecting-image");
                    self.cancelButton = $("#cancel-selecting-image");
                    self.helpButton   = $("#help-selecting-image");
                    self._setupHelpDialog();
                }
            }
        });
    },
    
    /**
     * Adds hover event listeners for the icons next to the text in the dialog.
     */
    _setupEventListeners: function () {
        addIconHoverEventListener(this.doneButton);
        addIconHoverEventListener(this.cancelButton);
        addIconHoverEventListener(this.helpButton);
    },
    
    /**
     * Sets up a help tooltip that pops up when the help button is moused over
     */
    _setupHelpDialog: function () {
        var api, qtip;
        api  = this.vpDomNode.qtip("api");
        qtip = api.elements.tooltip;
        
        this.helpButton.qtip({
            position: {
                corner: {
                    target: 'bottomLeft',
                    tooltip: 'topRight'
                }
            },
            content: {
                title: "Help",
                text: "Resize by dragging the edges of the selection.<br />" +
                        "Move the selection by clicking inside and dragging it.<br />" + 
                        "Click and drag outside the selected area to start" +
                        " a new selection.<br />" +
                        "Click 'Done' when you have finished to submit."
            },
            adjust: { y: 100 },
            show: 'mouseover',
            hide: 'mouseout',
            style: {
                tip: 'topRight',
                name: 'simple',
                width: 'auto',
                "text-align": 'left',
                title: {
                    background: '#FFF'
                }
            }
        });
    },

    /**
     * Removes all divs created by imgAreaSelect. Also shows all divs that were hidden during selection.
     * @param imgContainer -- has all imgAreaSelect divs inside
     * @param transImg -- temporary transparent image that imgAreaSelect is used on.
     * @TODO: add error checking if the divs are already gone for whatever reason.
     */    
    cleanup: function () {
        this.vpDomNode.qtip("hide");
        $("#transparent-image").imgAreaSelect({remove: true});
        showButtonsInViewport();
        
        $('#imgContainer, #transparent-image').remove();
        this.doneButton.unbind('click');
        this.cancelButton.unbind('click');
        this.helpButton.qtip("hide");
        this.active = false;
        
        $("body").removeClass('disable-fullscreen-mode');
        $(document).unbind('keypress');
        $(document).trigger('re-enable-keyboard-shortcuts');
    }
});

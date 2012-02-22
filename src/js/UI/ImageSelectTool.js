/**
 * @author Jaclyn Beck
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * 
 * @fileoverview A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 *                 to select a subregion of the image in the viewport. 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, helioviewer */
"use strict";
var ImageSelectTool = Class.extend(
    /** @lends ImageSelectTool.prototype */
    {
    /**
     * @constructs
     * Sets up an event handler for the select region button and finds the divs where
     * the fake transparent image will be inserted
     *                 
     */
    init: function () {
        this.active = false;

        this.vpDomNode    = $("#helioviewer-viewport");
        this.buttons      = $("#image-area-select-buttons");
        this.container    = $("#image-area-select-container");
        this.doneButton   = $("#done-selecting-image");
        this.cancelButton = $("#cancel-selecting-image");
        this.helpButton   = $("#help-selecting-image");
        
        this.vpButtons = $("#zoomControls, #center-button, #social-buttons, #fullscreen-btn, #mouse-coords");

        this._setupHelpDialog();
        
        // Handle image area select requests
        $(document).bind("enable-select-tool", $.proxy(this.enableAreaSelect, this));
    },

    /**
     * Activates the plugin or disables it if it is already active
     */
    enableAreaSelect: function (event, callback) {
        var imgContainer, body = $("body");
    
        // If the user has already pushed the button but not done anything, this will turn the feature off.
        if (this.active) {
            this.cleanup();
        }

        // Otherwise, turn it on.
        else {
            // Disable keyboard shortcuts for fullscreen mode
            body.addClass('disable-fullscreen-mode');
            this.active = true;

            // Get viewport dimensions to make the transparent image with. 
            this.width  = this.vpDomNode.width();
            this.height = this.vpDomNode.height();
        
            /* 
            * Displays a temporary transparent image that spans the height and width of the viewport.
            * Necessary because the viewport image is done in tiles and imgAreaSelect cannot cross 
            * over tile boundaries. Add the transparent image to the viewport, on top of the other tiles.
            * 
            * vpDomNode corresponds to the div "#helioviewer-viewport", so add the tile directly
            * inside this div. It is necessary to specify a z-index because otherwise it gets added underneath
            * the rest of the tiles and the plugin will not work.
            */
            this.container.show();
            
            /* Make a temporary container for imgAreaSelect to put all of its divs into.
            * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
            * do not span the whole image for some reason. All of the divs are put in "#outside-box"
            */
            imgContainer = body.append('<div id="imgContainer"></div>');

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
        
        // Use imgAreaSelect on the transparent region to get the 
        // top, left, bottom, and right coordinates of the selected region. 
        area = this.container.imgAreaSelect({
            instance: true,
            handles : true,
            parent  : "#imgContainer",
            x1      : this.width / 4,
            x2      : this.width * 3 / 4,
            y1      : this.height / 4,
            y2      : this.height * 3 / 4,
            onInit  : function () {
                self.vpButtons.hide('fast');
                self.buttons.show();
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
        
        $(document).keypress(function (e) {
            // Enter key
            if (e.which === 13) {
                self.submitSelectedArea(area, callback);
            }
        });
        
        this.cancelButton.click(function () {
            self.cleanup();
        });
    },
    
    /**
     * Once an area has been selected, this method calculates the coordinates of the 
     * selected area, cleans up divs created by the plugin, and uses the callback 
     * function to complete movie/screenshot building.
     */
    submitSelectedArea: function (area, callback) {
        var selection, visibleCoords, roi;

        if (area) {
            // Get the coordinates of the selected image, and adjust them to be 
            // heliocentric like the viewport coords.
            selection = area.getSelection();

            visibleCoords = helioviewer.getViewportRegionOfInterest();

            roi = {
                top     : visibleCoords.top  + selection.y1,
                left    : visibleCoords.left + selection.x1,
                bottom  : visibleCoords.top  + selection.y2,
                right   : visibleCoords.left + selection.x2
            };

            this.cleanup();
            callback(roi);
        }
    },

    
    /**
     * Sets up a help tooltip that pops up when the help button is moused over
     */
    _setupHelpDialog: function () {
        this.helpButton.qtip({
            position: {
                my: 'top right',
                at: 'bottom left'
            },
            content: {
                title: {
                    text: "Help"
                },
                text: "Resize by dragging the edges of the selection.<br /> Move the selection by clicking inside " +
                        "and dragging it.<br /> Click and drag outside the selected area to start " +
                        "a new selection.<br /> Click \"Done\" when you have finished to submit."
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
        this.buttons.hide();
        this.container.imgAreaSelect({remove: true});

        this.vpButtons.show('fast');

        this.container.hide();
        $('#imgContainer').remove();
        this.doneButton.unbind('click');
        this.cancelButton.unbind('click');
        this.helpButton.qtip("hide");
        this.active = false;
        
        $("body").removeClass('disable-fullscreen-mode');
        $(document).unbind('keypress').trigger('re-enable-keyboard-shortcuts');
    }
});

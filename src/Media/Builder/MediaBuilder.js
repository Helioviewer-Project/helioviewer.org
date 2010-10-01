/**
 * @description Abstract class that has functionality common to MovieBuilder and ScreenshotBuilder
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Jaclyn Beck
 * 
 * @TODO: If the user's end time is past what the database has, warn the user that their movie will be incomplete.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, pixelsToArcseconds, addIconHoverEventListener */
"use strict";
var MediaBuilder = Class.extend(
    /** @lends MediaBuilder.prototype */
    {

    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
     */    
    init: function (viewport, history) {
        this.url      = "api/index.php";
        this.viewport = viewport;   
        this.building = false;
        this.history  = history;
    },
    
    /**
     * Creates a qtip dialog that floats beneath one of the social buttons
     * on the page (Movie or Screenshot). It is aligned so that it is centered
     * on the button. Once the qtip is done initializing, it calls _setupEventListeners,
     * which is set up in both MovieBuilder and ScreenshotBuilder to handle clicks 
     * in the dialog. _setupEventListeners can only be called after the dialog is ready
     * because that function depends on divs that are inside the dialog. 
     */
    _setupDialogAndEventHandlers: function () {
        var self, divContent;
        divContent = this.getDialogDivContent();
        self       = this;
        
        this.button.qtip({
            position  : {
                corner: {
                    target : 'bottomMiddle',
                    tooltip: 'topMiddle'
                },
                adjust: { y : 15 }
            },
            show: 'click',
            hide: 'click',                      
            content: divContent,
            style  : "mediaDark",
            api    : {
                onRender: $.proxy(this._setupEventListeners, this),
                beforeShow : function (e) {
                    if (self.button.hasClass("working")) {
                        return false;
                    }
                }
            }
        });
        
        // Hide the dialog if any other button in the social buttons bar is clicked.
        $("#social-buttons").click(function (e) {
            var button = $(e.target);

            if (button !== self.button && button.context && button.context.parentNode !== self.button[0]) {
                self.button.qtip("hide");
            } 

        });
    },
    
    /**
     * Subclassed in MovieBuilder and ScreenshotBuilder. Both classes call this._super() to call
     * this function as well. 
     * 
     * It also initializes the history bar, which floats beneath the dialog and
     * has a list of all movies made in this session. History bar has to be initialized here
     * because it depends on divs created in the dialog.
     */
    _setupEventListeners: function () {
        addIconHoverEventListener(this.fullVPButton);
        addIconHoverEventListener(this.selectAreaButton);
        
        // Close any open jGrowl notifications if the button is clicked.
        this.button.click(function () {
            $(".jGrowl-notification .close").click();
        });
        
        var self = this;
        $("#fullscreen-btn").click(function () {
            self.hideDialogs();
        });

        this.history.setup();

        $(document).bind("message-console-log", $.proxy(this.hideDialogs, this))
                   .bind("message-console-error", $.proxy(this.hideDialogs, this))
                   .bind("message-console-warn", $.proxy(this.hideDialogs, this));
    },

    /**
     * Creates the html that will go inside the dialog. Will output something similar to:
     * <icon>Full Viewport   <icon>Select Area
     * 
     * The divs are named after this.id, which will be either "screenshot" or "movie" to 
     * identify which button they belong to
     * 
     * @return string
     */
    getDialogDivContent: function () {
        return "<div id='qtip-" + this.id + "'>" +
                    "<div id='" + this.id + "-full-viewport' class='text-btn'>" +
                        "<span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>" +
                        "<span style='line-height: 1.6em'>Full Viewport</span>" +
                    "</div>" +
                    "<div id='" + this.id + "-select-area' class='text-btn' style='float:right;'>" +
                        "<span class='ui-icon ui-icon-scissors' style='float:left;'></span>" +
                        "<span style='line-height: 1.6em'>Select Area</span>" + 
                    "</div>" +
                "</div>";
    },
    
    /**
     * Hides both its dialog and the history bar underneath that.
     * 
     * NOTE 09/07/2010:
     * 
     * Bug #619944 may be caused by a conflict created when two qtip elements (media builder buttons
     * and history panel) are bound to the same element. In future, consider either binding tooltips
     * to different elements, or not using qtip plugin.
     */
    hideDialogs: function () {
        this.button.qtip("hide");
        this.history.hide();
    },
    
    /**
     * Translates viewport coordinates into arcseconds
     */
    toArcsecCoords: function (vpCoords, scale) {
        var coordinates = {
            x1: vpCoords.left,
            x2: vpCoords.right,
            y1: vpCoords.top,
            y2: vpCoords.bottom
        };
        
        return pixelsToArcseconds(coordinates, scale);
    },
    
    /**
     * Checks to make sure there is actually something in the selected area.
     * 
     * @input {Array} viewportInfo -- Information with viewport coordinates and layers
     */
    ensureValidArea: function (viewportInfo) {
        var coordinates = viewportInfo.coordinates;
        if (coordinates.bottom - coordinates.top > 50 && coordinates.right - coordinates.left > 50) {
            return true;
        }
        return false;
    },
    
    /**
     * Checks to make sure there is at least one layer in the selected area.
     * 
     * @input {Array} viewportInfo -- Information with viewport coordinates and layers
     * @TODO add more sophisticated checks to make sure that the selected region contains
     * a layer.
     */
    ensureValidLayers: function (viewportInfo) {
        if (viewportInfo.layers.length > 0) {
            return true;
        }
        return false;
    }
});

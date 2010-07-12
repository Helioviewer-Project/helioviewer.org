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
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var MediaBuilder = Class.extend(
    /** @lends MediaBuilder.prototype */
    {

    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
     * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport, mediaHistoryBar) {
        this.url        = "api/index.php";
        this.viewport   = viewport;   
        this.building   = false;
        this.historyBar = mediaHistoryBar;
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
            api    : { onRender: $.proxy(this._setupEventListeners, this) }
        });
        
        // Hide the dialog if any other button in the social buttons bar is clicked.
        $("#social-buttons").click(function (e) {
            var button = $(e.target);

            if (button != self.button && button.context.parentNode != self.button[0]) {
                self.button.qtip("hide");
            } 

        });
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
     */
    hideDialogs: function () {
        this.button.qtip("hide");
        this.historyBar.hide();
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
    }
});

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
    init: function (viewport) {
        this.url      = "api/index.php";
        this.viewport = viewport;   
        
        this.building = false;
    },
    
    _setupDialog: function () {
        divContent = "<div id='" + this.id + "-full-viewport' class='text-btn'>" +
                        "<span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>" +
                        "<span style='line-height: 1.6em'>Full Viewport</span>" +
                     "</div>" +
                     "<div id='" + this.id + "-select-area' class='text-btn'>" +
                        "<span class='ui-icon ui-icon-scissors' style='float:left;'></span>" +
                        "<span style='line-height: 1.6em'>Select Area</span>" + 
                     "</div>";
        
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
                when: 'click',
                effect: "slide"
            },
            hide: {
                when: 'click',
                effect: "slide"
            },                      
            content: divContent,
            style: "mediaDark",
            api: { onRender: $.proxy(this._setupEventListeners, this) }
        });
    },
    
    toArcsecCoords: function (viewportInfo) {
        vpCoords     = viewportInfo.coordinates;
        scale        = viewportInfo.imageScale;
        return {
            x1 : vpCoords.left   * scale,
            x2 : vpCoords.right  * scale,
            y1 : vpCoords.top    * scale,
            y2 : vpCoords.bottom * scale
        };
    }
});

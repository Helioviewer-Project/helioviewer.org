/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, MouseCoordinates */
"use strict";
var HelioviewerMouseCoordinates = MouseCoordinates.extend(
    /** @lends HelioviewerMouseCoordinates.prototype */
    {
    /**
     * @constructs
     */
    init: function (imageScale, rsun, showMouseCoordsWarning) {
        this.rsun = rsun;
        this._super(imageScale, showMouseCoordsWarning);
    },
     
    /**
     * @description Toggles mouse-coords visibility
     * 
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        // Case 1: Disabled -> Arcseconds 
        if (this.mouseCoords === "disabled") {
            this.mouseCoords = "arcseconds";
            this.container.toggle();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.mouseCoords = "polar";
        }

        // Case 3: Polar Coords -> Disabled
        else {
            this.container.toggle();
            this.mouseCoords = "disabled";
        }
        
        this._checkWarning();
        this._reassignEventHandlers();
    },
    
    /**
     * Determines which event handler should be used, if any, to display mouse coordinates to the user
     */
    _reassignEventHandlers: function () {
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.mouseCoords === "polar") {
                this.movingContainer.unbind('mousemove', this.updateMouseCoords);
            }
               
            this.movingContainer.bind('mousemove', $.proxy(this.updateMouseCoords, this));     
               
            // Execute handler to display mouse coordinates placeholder
            this.movingContainer.trigger("mousemove");
        } else {
            this.movingContainer.unbind('mousemove', this.updateMouseCoords);
        }
    },
    
    /**
     * updateMouseCoords
     */
    updateMouseCoords: function (event) {
        var cartesian, polar, r, theta;
        
        if (!this.enabled) {
            return;
        }

        // When mouse-coordinates are first turned on just shows dashes
        if (typeof(event.pageX) == "undefined") {
            if (this.mouseCoords === "arcseconds") {
                this.showCartesianCoordinates("--", "--");
            } else {
                this.showPolarCoordinates("--", "--");
            }
            return;
        }
            
        // Compute coordinates relative to top-left corner of the viewport
        cartesian = this.computeMouseCoords(event.pageX, event.pageY);
                            
        // Arc-seconds
        if (this.mouseCoords === "arcseconds") {
            this.showCartesianCoordinates(cartesian.x, cartesian.y);
        } else {
            // Polar coords
            polar = Math.toPolarCoords(cartesian.x, cartesian.y);
            r     = ((polar.r / this.rsun) + "").substring(0, 5);
            theta = Math.round(polar.theta);
            
            this.showPolarCoordinates(r, theta); 
        }
    },
    
    /**
     * Displays cartesian coordinates in arc-seconds
     */
    showCartesianCoordinates: function(x, y) {
        this.mouseCoordsX.html("x: " + x + " &prime;&prime;");
        this.mouseCoordsY.html("y: " + y + " &prime;&prime;");
    },
    
    /**
     * Displays cartesian coordinates in arc-seconds
     */
    showPolarCoordinates: function(r, theta) {
            this.mouseCoordsX.html(r + " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
            this.mouseCoordsY.html(theta + " &#176;");
    }
});
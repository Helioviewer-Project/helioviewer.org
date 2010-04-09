/**
 * @fileOverview Contains the class definition for an ViewportController class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * 
 * Mouse-dragging:
 * 
 * Two throttles are maintained: one to control how frequently the image is updated on the screen,
 * and the other to decide when to update the visible tiles. Since the later is more computationally
 * expensive, it should occur less frequently. Whenever the user stops dragging, both should be forced
 * to update.
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, document, $ */
"use strict";
var ViewportController = Class.extend(
    /** @lends ViewportController.prototype */
    {
    mouseStartingPosition: { x: 0, y: 0 },
    mouseCurrentPosition : { x: 0, y: 0 },
    moveCounter         : 0,
    imageUpdateThrottle : 3,
    tileUpdateThrottle  : 9,
    animatedTextShadow  : true,

    /**
     * @constructs
     * @description Contains a collection of event-handlers for dealing with Viewport-related events
     * @see Viewport
     * @param {Object} viewport A Reference to the Helioviewer application class
     */
    init: function (viewport) {
        this.viewport = viewport;
        this.mouseCoords  = "disabled";
        this.mouseCoordsX = $('#mouse-coords-x');
        this.mouseCoordsY = $('#mouse-coords-y');
        this._initEvents();
    },

     /**
      * @description Fired when a mouse is pressed
      * @param {Event} event Prototype Event class
      */
    mouseDown: function (event) {
        var vp, sb;
        
        vp = $("#helioviewer-viewport");
        sb = $("#sandbox");
        
        vp.css("cursor", "all-scroll");

        // Don't do anything if entire image is already visible
        if ((sb.width() === 0) && (sb.height() === 0)) {
            return;
        }
        
        this.mouseStartingPosition = {
            x: event.pageX, 
            y: event.pageY
        };
        
        this.viewport.startMoving();
    },
    
     /**
      * @description Handle drag events
      * @param {Object} an Event object
      */
    mouseMove: function (event) {
        if (!this.viewport.isMoving) {
            return;
        }
          
        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
            return;
        }

        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;

        this.mouseCurrentPosition = {
            x: event.pageX, 
            y: event.pageY
        };

        // Update text-shadows
        //this.viewport.controller.updateShadows();

        this.viewport.moveBy(this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
                             this.mouseStartingPosition.y - this.mouseCurrentPosition.y);
    },
    
     /**
      * @description Fired when a mouse button is released
      * @param {Event} event Event object
      */
    mouseUp: function (event) {
        $("#helioviewer-viewport").css("cursor", "pointer");

        if (this.viewport.isMoving) {
            this.viewport.endMoving();
        }
    },


    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (e) {
        var pos, viewport = this.viewport;
          
        //check to make sure that you are not already at the minimum/maximum image scale
        if ((e.shiftKey || (viewport.imageScale > viewport.controller.minImageScale)) && 
            (viewport.imageScale < viewport.controller.maxImageScale)) {
            pos = this.getRelativeCoords(e.pageX, e.pageY);
               
            viewport.center();                    
            this.viewport.startMoving();

            //adjust for zoom
            if (e.shiftKey) {
                viewport.moveBy(0.5 * pos.x, 0.5 * pos.y);
                //viewport.controller.zoomControls.zoomButtonClicked(-1);
                $("#zoomControlZoomOut").click();
            }
            else {
                viewport.moveBy(2 * pos.x, 2 * pos.y);
                //viewport.controller.zoomControls.zoomButtonClicked(1);
                $("#zoomControlZoomIn").click();
            }
            
            this.viewport.endMoving();
        }
    },
     
    /**
     * @description Handles mouse-wheel movements
     * 
     * TODO 02/22/2010: Prevent browser window from scrolling on smaller screens when 
     * wheel is used in viewport
     * 
     * @param {Event} event Event class
     */
    mouseWheel: function (e, delta) {
        var dir = delta > 0 ? $("#zoomControlZoomIn").click() : $("#zoomControlZoomOut").click();
    },
     
    /**
     * @description Get the mouse-coords relative to top-left of the viewport frame
     * @param {Int} screenx X-dimensions of the user's screen
     * @param {Int} screeny Y-dimensions of the user's screen
     */
    getRelativeCoords: function (screenx, screeny) {
        var offset, mouseCoords;
         
        offset = $('#helioviewer-viewport-container-inner').position();

        mouseCoords = {
            x: screenx - offset.left - 1,
            y: screeny - offset.top - 1
        };

        return mouseCoords;
    },
     
    /**
     * @description Toggles mouse-coords visibility
     * 
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        var vp, mouseCoordsX, mouseCoordsY, updateMouseCoords, warning;
        
        // Case 1: Disabled -> Arcseconds 
        if (this.mouseCoords === "disabled") {
            this.mouseCoords = "arcseconds";
            $('#mouse-coords').toggle();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.mouseCoords = "polar";
        }

        // Case 3: Polar Coords -> Disabled
        else {
            $('#mouse-coords').toggle();
            this.mouseCoords = "disabled";
        }
          
        // Warn once
        if (this.viewport.controller.userSettings.get('warnMouseCoords') === true) {
            warning = "<b>Note:</b> Mouse-coordinates should not be used for science operations!";
            $(document).trigger("message-console-log", [warning])
                       .trigger("save-setting", ["warnMouseCoords", false]);
        }
          
        // Cartesian & Polar coords
        if (this.mouseCoords !== "disabled") {

            // Clear old values
            this.mouseCoordsX.empty();
            this.mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.mouseCoords === "polar") {
                $('#moving-container').unbind('mousemove', this.updateMouseCoords);
            }
               
            $('#moving-container').bind('mousemove', $.proxy(this.updateMouseCoords, this));     
               
            // TODO: Execute handler once immediately if mouse is over viewport to show new coords     
            // Use trigger to fire mouse move event and then check to make sure mouse is within viewport?         
        } else {
            $('#moving-container').unbind('mousemove', this.updateMouseCoords);
        }
    },
    
    /**
     * updateMouseCoords
     */
    updateMouseCoords: function (event) {
        var cartesian, polar;
        
        // Threshold
        this.moveCounter = this.moveCounter + 1;
        if ((this.moveCounter % this.imageUpdateThrottle) !== 0) {
            return;
        }

        this.moveCounter = this.moveCounter % this.tileUpdateThrottle;
            
        // Compute coordinates relative to top-left corner of the viewport
        cartesian = this.computeMouseCoords(event.pageX, event.pageY);
                            
        // Arc-seconds
        if (this.mouseCoords === "arcseconds") {
            this.mouseCoordsX.html("x: " + cartesian.x + " &prime;&prime;");
            this.mouseCoordsY.html("y: " + cartesian.y + " &prime;&prime;");
                 
        // Polar coords
        } else {
            polar = Math.toPolarCoords(cartesian.x, -cartesian.y);     
            
             this.mouseCoordsX.html(((polar.r / this.viewport.rsun) + "").substring(0, 5) +
                " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
             this.mouseCoordsY.html(Math.round(polar.theta) + " &#176;");
        }
    },
    
    /**
     * @description Computes the scaled mouse coordinates relative to the size and center of the Sun.
     * 
     *  Explanation:
     * 
     *    X = location of mouse-pointer
     *    V = viewport top-left corner
     *    S = sandbox top-left corner
     *    M = moving container top-let corner
     *    
     *  Each of the two-letter abbreviations represents the vector <x,y> going from one
     *  location to the other. See wiki documentation below for more details.
     * 
     * @see http://helioviewer.org/wiki/index.php?title=Co-ordinate_System_I
     */
    computeMouseCoords: function (screenX, screenY) {
        var VX, negSV, SV, SM, MX, scale, x, y;
        
        // Coordinates realtive to viewport top-left corner
        VX = this.getRelativeCoords(screenX, screenY);
        negSV = $("#sandbox").position();
        SV = {
            x: -negSV.left,
            y: -negSV.top
        };
        SM = $('#moving-container').position();                    
        MX = {
            x: VX.x + (SV.x - SM.left),
            y: VX.y + (SV.y - SM.top)
        };
          
        //scale
        scale = this.viewport.imageScale;
        x = Math.round((scale * MX.x));
        y = - Math.round((scale * MX.y));
        
        // Return scaled coords
        return {
            x: x,
            y: y
        };
    },
    
    /**
     * @description
     */
    _initEvents: function () {
        var doc, vp, self = this;

        doc = $(document);
        vp  = $("#helioviewer-viewport");
        
        //Mouse-related event-handlers
        doc.mousemove(function (e) {
            self.mouseMove(e);
        });
        doc.mouseup(function (e) {
            self.mouseUp(e);
        });
        vp.mousedown(function (e) {
            self.mouseDown(e);
        });

          // Double-clicks
        vp.dblclick(function (e) {
            self.doubleClick(e);
        });

          // Mouse-wheel
        vp.mousewheel(function (e, delta) {
            self.mouseWheel(e, delta);
            return false;
        });
    }
});

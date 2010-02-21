/**
 * @fileOverview Contains the class definition for an ViewportHandlers class.
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
var ViewportHandlers = Class.extend(
    /** @lends ViewportHandlers.prototype */
    {
    mouseStartingPosition: { x: 0, y: 0 },
    mouseCurrentPosition : { x: 0, y: 0 },
    mouseCoords          : { x: 0, y: 0 },
    moveCounter         : 0,
    imageUpdateThrottle : 3,
    tileUpdateThrottle  : 9,
    //rSunArcSeconds      : 975,
    animatedTextShadow  : true,

    /**
     * @constructs
     * @description Contains a collection of event-handlers for dealing with Viewport-related events
     * @see Viewport
     * @param {Object} viewport A Reference to the Helioviewer application class
     */
    init: function (viewport) {
        this.viewport = viewport;
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
        //this.updateShadows();

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
                viewport.controller.zoomControls.zoomButtonClicked(-1);
            }
            else {
                viewport.moveBy(2 * pos.x, 2 * pos.y);
                viewport.controller.zoomControls.zoomButtonClicked(1);
            }
            
            this.viewport.endMoving();
        }
    },
     
    /**
     * @description Handles mouse-wheel movements
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
     * @description Adds an animated text shadow based on the position and size of the Sun (Firefox 3.5+)
     * Added 2009/06/26
     * TODO: Apply to other text based on it's position on screen? Adjust blue based on zoom-level?
     *       Use viewport size to determine appropriate scales for X & Y offsets (normalize)
     *       Re-use computeCoordinates?
     */
    updateShadows: function () {
        // Not supported in older versions of Firefox, or in IE
        if (!$.support.textShadow) {
            return;
        }
        
        var viewportOffset, sunCenterOffset, coords, viewportCenter, offsetX, offsetY;
        
        viewportOffset  = $("#helioviewer-viewport").offset();
        sunCenterOffset = $("#moving-container").offset();

        // Compute coordinates of heliocenter relative to top-left corner of the viewport
        coords = {
            x: sunCenterOffset.left - viewportOffset.left,
            y: sunCenterOffset.top - viewportOffset.top
        };
        
        // Coordinates of heliocenter relative to the viewport center
        viewportCenter = this.viewport.getCenter();
        coords.x = coords.x - viewportCenter.x;
        coords.y = coords.y - viewportCenter.y;
        
        // Shadow offset
        offsetX = ((500 - coords.x) / 100) + "px";
        offsetY = ((500 - coords.y) / 150) + "px";

        //console.log("x: " + coords.x + ", y: " + coords.y);
        $("#footer-links > .light").css("text-shadow", offsetX + " " + offsetY + " 3px #000");
    },
    
    /**
     * @description Toggles mouse-coords visibility
     * 
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        var vp, mouseCoordsX, mouseCoordsY, updateMouseCoords, warning, self = this;
        
        // Case 1: Disabled -> Arcseconds 
        if (this.viewport.mouseCoords === "disabled") {
            this.viewport.mouseCoords = "arcseconds";
            $('#mouse-coords').toggle();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.viewport.mouseCoords === "arcseconds") {
            this.viewport.mouseCoords = "polar";
        }

        // Case 3: Polar Coords -> Disabled
        else {
            $('#mouse-coords').toggle();
            this.viewport.mouseCoords = "disabled";
        }
          
        // Warn once
        if (this.viewport.controller.userSettings.get('warnMouseCoords') === false) {
            warning = "<b>Note:</b> Mouse-coordinates should not be used for science operations!";
            this.viewport.controller.messageConsole.log(warning);
            this.viewport.controller.userSettings.set('warnMouseCoords', true);
        }
          
        // Cartesian & Polar coords
        if (this.viewport.mouseCoords !== "disabled") {
            mouseCoordsX = $('#mouse-coords-x');
            mouseCoordsY = $('#mouse-coords-y');
               
            // Clear old values
            mouseCoordsX.empty();
            mouseCoordsY.empty();

            // Remove existing event handler if switching from cartesian -> polar
            if (this.viewport.mouseCoords === "polar") {
                $('#moving-container').unbind('mousemove', updateMouseCoords);
            }
               
            /**
             * @description Event-handler for displaying mouse-coords
             * @param {Event} e
             */
            updateMouseCoords = function (e) {
                var cartesian, polar;
                                        
                // Store current mouse-coordinates
                self.mouseCoords = {x: e.pageX, y: e.pageY};
                
                // Threshold
                self.moveCounter = self.moveCounter + 1;
                if ((self.moveCounter % self.imageUpdateThrottle) !== 0) {
                    return;
                }

                self.moveCounter = self.moveCounter % self.tileUpdateThrottle;
                    
                // Compute coordinates relative to top-left corner of the viewport
                cartesian = self.computeMouseCoords(e.pageX, e.pageY);
                                    
                // Arc-seconds
                if (self.viewport.mouseCoords === "arcseconds") {
                    mouseCoordsX.html("x: " + cartesian.x + " &prime;&prime;");
                    mouseCoordsY.html("y: " + cartesian.y + " &prime;&prime;");
                         
                // Polar coords
                } else {
                    polar = Math.toPolarCoords(cartesian.x, -cartesian.y);     
                    
                    mouseCoordsX.html(((polar.r / self.controller.rsun) + "").substring(0, 5) +
                        " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
                    mouseCoordsY.html(Math.round(polar.theta) + " &#176;");
                }
            };
            $('#moving-container').bind('mousemove', updateMouseCoords);     
               
            // Execute handler once immediately to show new coords
            updateMouseCoords({pageX: this.mouseCoords.x, pageY: this.mouseCoords.y});
               
        } else {
            $('#moving-container').unbind('mousemove', updateMouseCoords);
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
        });
    }
});

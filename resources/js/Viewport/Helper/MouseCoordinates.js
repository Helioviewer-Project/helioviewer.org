/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Helioviewer, Class */
"use strict";
var MouseCoordinates = Class.extend(
    /** @lends MouseCoordinates.prototype */
    {
    enabled : true,
    visible : false,

    /**
     * @constructs
     */
    init: function (imageScale, showMouseCoordsWarning) {
        this.imageScale      = imageScale;
        this.warnMouseCoords = showMouseCoordsWarning;
        this._ready = false;

        this.viewportContainer = $('#helioviewer-viewport').parent();
        this.movingContainer   = $("#moving-container");
        this.container         = $('#mouse-coords');
        this.sandbox           = $("#sandbox");

        this.mouseCoords  = "disabled";
        this.mouseCoordsX = $('#mouse-coords-x');
        this.mouseCoordsY = $('#mouse-coords-y');
        $(document).bind("helioviewer-ready", () => this._ready = true);
    },

    enable: function () {
        this.enabled = true;
    },

    disable: function () {
        this.enabled = false;
    },

    updateImageScale: function (imageScale) {
        this.imageScale = imageScale;
    },

    /**
     * @description Get the mouse-coords relative to top-left of the viewport frame
     * @param {Int} screenx X-dimensions of the user's screen
     * @param {Int} screeny Y-dimensions of the user's screen
     */
    getRelativeCoords: function (screenx, screeny) {
        var offset = this.viewportContainer.offset();

        return {
            x: screenx - offset.left,
            y: screeny - offset.top
        };
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

            $(document).bind('mousemove', $.proxy(this.updateMouseCoords, this));
            //this.movingContainer.bind('mousemove', $.proxy(this.updateMouseCoords, this));

            // TODO: Execute handler once immediately if mouse is over viewport to show new coords
            // Use trigger to fire mouse move event and then check to make sure mouse is within viewport?
        } else {
            $(document).unbind('mousemove', this.updateMouseCoords);
            //this.movingContainer.unbind('mousemove', this.updateMouseCoords);
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
     * @see http://helioviewer.org/wiki/Co-ordinate_System_I
     */
    computeMouseCoords: function (clientX, clientY) {
        let container = this.movingContainer[0].getBoundingClientRect();
        let mouse_pos = {
            x: clientX - container.left,
            y: clientY - container.top
        };

        //scale
        let zoom = (Helioviewer.userSettings.get('mobileZoomScale') || 1);
        scale = this.imageScale / zoom;
        // TODO: Apply scaling fix depending on the current layer
        x = scale * mouse_pos.x;
        y = scale * mouse_pos.y;
        console.log(mouse_pos, {scaleX: x, scaleY: y});
        let correctedCoord = this.correctCoordinate(scale, mouse_pos.x, -mouse_pos.y)

        // Return scaled coords
        return {
            x: Math.round(correctedCoord.x),
            y: Math.round(correctedCoord.y)
        };
    },

    /**
     * Returns the metadata for the image layer that the mouse is currently hovering over.
     *
     * This metadata can be used to compute the correct projective coordinate from the pixel coordinate.
     * @returns {Object|null} The image layer or null if the mouse is not over an image.
     */
    getImageLayer: function (x, y) {
        // The helioviewer instance needs to be set on the page before it can be used.
        // An event is sent when the instance is ready and that is when _ready will be true.
        if (this._ready) {
            let layers = helioviewer.viewport.getVisibleLayerInstances({
                left: x,
                right: x,
                top: y,
                bottom: y
            });
            // Choose the top layer under the mouse and apply the scale correction for it.
            let keys = Object.keys(layers);
            if (keys.length > 0) {
                return layers[keys[0]];
            }
        }
        return null;
    },

    correctCoordinate: function (scale, x, y) {
        // Get the layer that the mouse is hovering over.
        let layer = this.getImageLayer(x, y);
        let coord = this.correctScale(layer, scale, x, y);
        return this.correctRotation(layer, coord.x, coord.y)
    },

    /**
     * Helioviewer's scaling method assumes a constant sun-earth distance, which leads to an incorrect calculation for coordinates.
     * This function corrects for this assumption based on the current layer the mouse is hovering over.
     * @param {Object} layer Layer metadata
     * @param {number} scale Desired image scale
     * @param {number} x x position (pixels)
     * @param {number} y y position (pixels)
     * @returns {Coordinate} coordinates in arcseconds
     *
     * @typedef {Object} Coordinate
     * @property {number} x X coordinate
     * @property {number} y Y Coordinate
     */
    correctScale: function (layer, scale, x, y) {
        let correction = layer ? layer.image.scaleCorrection : 1;
        // image.scaleCorrection is a property returned by the getClosestImage API.
        scale *= correction;
        return {
            x: scale * x,
            y: scale * y
        };
    },

    correctRotation: function (layer, x, y) {
        let angle = layer ? layer.image.rotation : 0;
        let theta_rad = angle * Math.PI / 180;
        // Assumption here is that the image scale is the same for the x and y axes.
        // This equation is pulled from Thompson (2006) section 8. The older FITS coordinate system
        let cos = Math.cos(theta_rad);
        let sin = Math.sin(theta_rad);
        let rotated_x = cos * x - sin * y;
        let rotated_y = sin * x + cos * y;

        return {
            x: rotated_x,
            y: rotated_y
        }
    }
});

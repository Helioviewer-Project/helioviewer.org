/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, MouseCoordinates */
"use strict";
let hv_mouse_coord_ref_count = 0;
var HelioviewerMouseCoordinates = MouseCoordinates.extend(
    /** @lends HelioviewerMouseCoordinates.prototype */
    {
    /**
     * @constructs
     */
    init: function (imageScale, rsun, showMouseCoordsWarning) {
        hv_mouse_coord_ref_count += 1;
        if (hv_mouse_coord_ref_count > 1) {
            // This class binds event listeners when an instance is created.
            // Either this needs to be refactored so that multiple instances of this class can be made, or you should be using the base MouseCoordinates class.
            alert("Error, there should only be one instance of HelioviewerMouseCoordinates. See HelioviewerMouseCoordinates.js for details");
        }
        this.rsun = rsun;
        this._super(imageScale, showMouseCoordsWarning);

        this.buttonPolar     = $('#mouse-polar');
        this.buttonCartesian = $('#mouse-cartesian');
        this._unit_one_span = $('#js-unit-1');
        this._unit_two_span = $('#js-unit-2');
        this._label_one_span = $('#js-label-1');
        this._label_two_span = $('#js-label-2');

        this._initEventHandlers();
    },

    _initEventHandlers: function () {
        $(document).bind('toggle-mouse-coords', $.proxy(this.toggleMouseCoords, this));
        $(document).bind('polar-mouse-coords', $.proxy(this.polarMouseCoords, this));
        $(document).bind('cartesian-mouse-coords', $.proxy(this.cartesianMouseCoords, this));
    },

    updateImageScale: function (imageScale) {
        this.imageScale = imageScale;
        if ( this.mouseCoords == "arcseconds" ) {
            this.cartesianMouseCoords();
        }
        else if ( this.mouseCoords == "polar" ) {
            this.polarMouseCoords();
        }
    },

    /**
     * @description Toggles mouse-coords visibility
     *
     * TODO (2009/07/27) Disable mouse-coords display during drag & drop
     */
    toggleMouseCoords: function () {
        // Case 1: Disabled -> Arcseconds
        if (this.mouseCoords === "disabled") {
            this.cartesianMouseCoords();
        }

        // Case 2: Arcseconds -> Polar Coords
        else if (this.mouseCoords === "arcseconds") {
            this.polarMouseCoords();
        }

        // Case 3: Polar Coords -> Disabled
        else if (this.mouseCoords === "polar") {
            this.container.hide();
            this.mouseCoords = "disabled";
            this.buttonPolar.removeClass("active");
            this.buttonCartesian.removeClass("active");
        }

        this._checkWarning();
        this._reassignEventHandlers();
    },

    /**
     * @description
     */
    cartesianMouseCoords: function () {

        this.mouseCoords = "arcseconds";
        this.container.show();
        this.buttonCartesian.addClass("active");
        this.buttonPolar.removeClass("active");

        this._checkWarning();
        this._reassignEventHandlers();
    },

    /**
     * @description
     */
    polarMouseCoords: function () {
        this.mouseCoords = "polar";
        this.container.show();
        this.buttonPolar.addClass("active");
        this.buttonCartesian.removeClass("active");

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
        if ( typeof(event.pageX) == "undefined") {
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
        this._unit_one_span.html("&prime;&prime;");
        this._unit_two_span.html("&prime;&prime;");
        this._label_one_span.html("θ<span style='vertical-align: sub; font-size:10px;'>x</span>:");
        this._label_two_span.html("θ<span style='vertical-align: sub; font-size:10px;'>y</span>:");
        this.mouseCoordsX.html(x);
        this.mouseCoordsY.html(y);
    },

    /**
     * Displays cartesian coordinates in arc-seconds
     */
    showPolarCoordinates: function(r, theta) {
            this._unit_one_span.html("R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
            this._unit_two_span.html("&#176;");
            this._label_one_span.text("ρ:");
            this._label_two_span.text("ψ:");
            this.mouseCoordsX.text(r);
            this.mouseCoordsY.text(theta);
    }
});
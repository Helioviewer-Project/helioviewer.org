/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var ZoomControls = Class.extend(
    /** @lends ZoomControls.prototype */
    {
    /**
     * @constructs
     *
     * Creates a new ZoomControl
     */
    init: function (id, imageScale, increments, minImageScale, maxImageScale) {
        this.id            = id;
        this.imageScale    = imageScale;
        this.increments    = increments;
        this.minImageScale = minImageScale;
        this.maxImageScale = maxImageScale;
        this.scrollLock    = false;

        this.zoomInBtn  = $('#zoom-in-button');
        this.zoomSlider = $('#zoomControlSlider');
        this.zoomOutBtn = $('#zoom-out-button');

        this._initSlider();
        this._initEventHandlers();
        this._enablePinchZoom();
    },

    /**
     * Adjusts the zoom-control slider
     *
     * @param {Integer} v The new zoom value.
     */
    _onSlide: function (v) {
        this._setImageScale(v);
    },

    /**
     * Translates from jQuery slider values to zoom-levels, and updates the
     * zoom-level.
     *
     * @param {Object} v jQuery slider value
     */
    _setImageScale: function (v) {
        $(document).trigger('image-scale-changed', [this.increments[v]]);
        $(document).trigger('replot-celestial-objects');
        $(document).trigger('replot-event-markers');
        $(document).trigger('earth-scale');
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Initializes zoom level slider
     */
    _initSlider: function () {
        var description, self = this;

        // Reverse orientation so that moving slider up zooms in
        this.increments.reverse();

        // Initialize slider
        this.zoomSlider.slider({
            slide: function (event, slider) {
                self._onSlide(slider.value);
                //slider.handle = slider.value;
            },
            min: 0,
            max: this.increments.length - 1,
            step: 1,
            orientation: 'vertical',
            value: $.inArray(this.imageScale, this.increments)
        });

        // Add tooltip
        description = "Drag this handle up and down to zoom in and out of " +
                      "the displayed image.";
        $("#zoomControlSlider > .ui-slider-handle").attr('title', description)
                                                   .qtip();
    },

    /**
     * @description Responds to zoom in button click
     */
    _onZoomInBtnClick: function () {
        var index = this.zoomSlider.slider("value") + 1;

        if (this.increments[index] >= this.minImageScale) {
            this.zoomSlider.slider("value", index);
            this._setImageScale(index);
        }
    },

    /**
     * @description Responds to zoom out button click
     */
    _onZoomOutBtnClick: function () {
        var index = this.zoomSlider.slider("value") - 1;

        if (this.increments[index] <= this.maxImageScale) {
            this.zoomSlider.slider("value", index);
            this._setImageScale(index);
        }
    },

    /**
     * Handles mouse-wheel movements
     *
     * @param {Event} event Event class
     */
    _onMouseWheelMove: function (e, delta) {
        if(this.scrollLock){
	        return false;
        }
        
        //Lock the scroll
        this.scrollLock = true;
        window.setTimeout(function(){
            this.scrollLock = false;
        },500);
        
        if (delta > 0) {
            this.zoomInBtn.click();
        } else {
            this.zoomOutBtn.click();
        }
        
        return false;
    },

    /**
     * @description Initializes zoom control-related event-handlers
     */
    _initEventHandlers: function () {
        this.zoomInBtn.click($.proxy(this._onZoomInBtnClick, this));
        this.zoomOutBtn.click($.proxy(this._onZoomOutBtnClick, this));

        $("#helioviewer-viewport").mousewheel(
            $.proxy(this._onMouseWheelMove, this));

        $(document).bind("zoom-in",  $.proxy(this._onZoomInBtnClick, this))
                   .bind("zoom-out", $.proxy(this._onZoomOutBtnClick, this));

    },


    /**
     * Enables pinch zoom handling
     * @author Daniel Garcia-Briseno
     */
    _enablePinchZoom: function () {
        this.zoomer = new PinchDetector("helioviewer-viewport");
        let viewport = document.getElementById("helioviewer-viewport");
        let instance = this;

        // Current scale is the actual CSS scale applied to the viewport
        let current_scale = 1;

        // Reference scale is used when the user starts pinching, we'll use this to figure out what
        // the scale should be as they're pinching/stretching
        let reference_scale = 1;

        // Get the screen size which we'll use to figure out how much the user has pinched
        // as a percentage of the screen size.
        let screen_size = Math.hypot(screen.width, screen.height);
        
        this.zoomer.addPinchStartListener(() => {
            // Set scroll lock to ignore the mousewheel events generated by pinching
            instance.scrollLock = true;
            // When pinch starts, set the reference scale to whatever it the current scale is
            reference_scale = current_scale;
        });

        this.zoomer.addPinchUpdateListener((pinch_size) => {
            // When the user pinches, get the pinch size as a proportion of the screen size.
            let pinch_power = Math.abs(pinch_size) / screen_size;
            // This factor translates to how much we should scale. If the user's pinch size is half the screen (0.5)
            // then this results in scaling the image by 2x. That 2x is either up or down all depending on if it's a
            // pinch or a stretch
            let scale_factor = 1 + (pinch_power * 2);
            
            // Forward declaration for the scale we're about to calculate
            let css_scale = 1;
            // If the pinch size is below 0, it's a pinch. Otherwise it's a stretch
            if (pinch_size < 0) {
                // Pinches shrink the scale
                css_scale = reference_scale / scale_factor;
            } else {
                // Stretches enlarge the scale
                css_scale = refrence_scale * scale_factor;
            }

            // Apply the new css scale
            viewport.style.transform = "scale(" + css_scale + ")";
        });

        this.zoomer.addPinchEndListener(() => {
            // Release scroll lock to ignore the mousewheel events generated by pinching
            instance.scrollLock = false;
        });
    }
});

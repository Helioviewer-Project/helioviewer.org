/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:daniel.garciabriseno@nasa.gov">Daniel Garcia Briseno</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";

class ZoomControls {
    /**
     * @constructs
     *
     * Creates a new ZoomControl
     * @param {number} maxImageScale Maximum image scale.
     * @param {number} nLevels Number of zoom levels
     * @param {() => void} slideStart
     * @param {(percentage: number) => void} setZoomLevel
     */
    constructor(maxImageScale, nLevels, slideStart, setZoomLevel) {
        this._maxImageScale = maxImageScale;
        this.nLevels = nLevels
        this.slideStart = slideStart;
        this.setZoomLevel = setZoomLevel;

        this.zoomSlider = $('#zoomControlSlider');
        $(document).bind("helioviewer-ready", this._initSlider.bind(this));
        $(document).bind("update-viewport", this._updateSliderValue.bind(this));
    }

    get _currentLevel() {
        return Math.log(helioviewerWebClient.getZoomedImageScale() / this._maxImageScale) / Math.log(0.5);
    }

    /**
     * Update the slider value
     */
    _updateSliderValue() {
        let currentValue = this.zoomSlider.slider("value");
        // Only change the value if it is significantly different.
        // Otherwise the slider value is changed, which triggers a zoom update
        // which triggers a slider update, and we have an infinite loop.
        let dt = Math.abs(currentValue - this._currentLevel);
        if (dt > 0.01) {
            this.zoomSlider.slider("value", this._currentLevel);
        }
    }

    /**
     * @description Initializes zoom level slider
     */
    _initSlider() {
        // Initialize slider
        this.zoomSlider.slider({
            start: this.slideStart,
            slide: this.onslide.bind(this),
            min: 0,
            max: this.nLevels,
            step: 1,
            orientation: 'vertical',
            value: this._currentLevel
        });

        // Add tooltip
        let description = "Drag this handle up and down to zoom in and out of " +
                      "the displayed image.";
        $("#zoomControlSlider > .ui-slider-handle").attr('title', description)
                                                   .qtip();
    }

    onslide(event, slider) {
        this.setZoomLevel(slider.value);
    }
}

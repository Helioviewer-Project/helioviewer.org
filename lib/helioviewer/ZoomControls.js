/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var ZoomControls = Class.extend(
    /** @lends ZoomControls.prototype */
    {
    /**
     * @constructs
     * @description Creates a new ZoomControl
     * @param {Object} controller A Reference to the Helioviewer application class
     * @param {Object} options Custom ZoomControl settings
     */
    init: function (controller, options) {
        $.extend(this, options);
        this.controller = controller;
        this.domNode = $(this.id);
        this.offset  = this.minZoomLevel + this.maxZoomLevel;
       
        var self = this;
        
        this._buildUI();
       
        // Initialize slider
        this.zoomSlider.slider({
            slide: function (event, slider) {
                self._onSlide(slider.value);
            },
            min: this.minZoomLevel,
            max: this.maxZoomLevel,
            orientation: 'vertical',
            value: this.offset - this.zoomLevel
        });

        this._setupTooltips();
        this._initEvents();
    },

    /**
     * @description Increases or decreases zoom level in response to pressing the plus/minus buttons.
     * @param {Integer} dir The amount to adjust the zoom level by (+1 or -1).              
     */
    zoomButtonClicked: function (dir) {
        var v = this.zoomSlider.slider("value") + dir;
        this.zoomSlider.slider("value", v);
        this._setZoomLevel(v);
    },
    
    /**
     * @description Sets up tooltips for zoom controls
     */
    _setupTooltips: function () {
        var description, targets;
        
        description = "Drag this handle up and down to zoom in and out of the displayed image.";
        $("#zoomControlSlider > .ui-slider-handle").attr("title", description);
        
        targets = "#zoomControlZoomOut, #zoomControlZoomIn, #zoomControlHandle, #zoomControlSlider > .ui-slider-handle";
        this.controller.tooltips.createTooltip($(targets));
    },
  
    /**
     * @description Adjusts the zoom-control slider
     * @param {Integer} v The new zoom value.
     */
    _onSlide: function (v) {
        this._setZoomLevel(v);
    },
    
    /**
     * @description Translates from jQuery slider values to zoom-levels, and updates the zoom-level.
     * @param {Object} v jQuery slider value
     */
    _setZoomLevel: function (v) {
        this.controller.viewport.zoomTo(this.offset - v);      
    },
    
    /**
     * @description sets up zoom control UI element
     */
    _buildUI: function () {
        this.zoomInBtn  = $('<div id="zoomControlZoomIn" title="Zoom in.">+</div>');
        this.zoomSlider = $('<div id="zoomControlSlider"></div>');
        this.zoomOutBtn = $('<div id="zoomControlZoomOut" title="Zoom out.">-</div>');

        var sliderContainer = $('<div id="zoomSliderContainer"></div>').append(this.zoomSlider);

        this.domNode.append(this.zoomInBtn).append(sliderContainer).append(this.zoomOutBtn);
    },
    
    /**
     * @description Initializes zoom control-related event-handlers
     */
    _initEvents: function () {
        // Zoom-in button
        this.zoomInBtn.bind("click", {zoomControl: this}, function (e) {
            var val = e.data.zoomControl.zoomSlider.slider("value");
            if (val < e.data.zoomControl.maxZoomLevel) {
                e.data.zoomControl.zoomButtonClicked(1);
            }
        });
        
        // Zoom-out button
        this.zoomOutBtn.bind("click", {zoomControl: this}, function (e) {
            var val = e.data.zoomControl.zoomSlider.slider("value");
            if (val > e.data.zoomControl.minZoomLevel) {
                e.data.zoomControl.zoomButtonClicked(-1);
            }
        });
    }
});
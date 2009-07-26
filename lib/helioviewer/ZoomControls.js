/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
 *       
 * TODO (2009/07/26): Move Dom-building code inside so that references to buttons, etc can be managed
 * interally without having to pass them in, or know before-hand what they are called.
 * 
 * TODO (2009/07/26): Handle tooltips, add title=" - Drag handle to zoom in and out." to handle., rename
 * "sliderTrack" etc to avoid ambiguity.
 * 
 * 
 * Syntax: jQuery
 */
/*global Class, Control, Event, $R, $ */
var ZoomControls = Class.create(
	/** @lends ZoomControls.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new ZoomControl
	 * @param {Object} controller A Reference to the Helioviewer application class
	 * @param {Object} options Custom ZoomControl settings
	 */
    initialize: function (controller, options) {
        Object.extend(this, options);
        this.controller = controller;
        this.domNode = jQuery(this.id);
       
        var self = this;
        
        this._buildUI();
       
        // Initialize slider
        this.zoomSlider.slider({
        	slide: function(event, slider) {
                self.onSlide(slider.value);
        	},
        	min: this.minZoomLevel,
        	max: this.maxZoomLevel,
            orientation: 'vertical',
        	value: this.zoomLevel
        });

        this._initEvents();
    },

	/**
	 * @description Increases or decreases zoom level in response to pressing the plus/minus buttons.
	 * @param {Integer} dir The amount to adjust the zoom level by (+1 or -1).              
	 */
    zoomButtonClicked: function (dir) {
        //this.slider.setValue(this.slider.value + dir);
        this.zoomSlider.slider("value", this.zoomSlider.slider("value") + dir);
    },
  
	/**
	 * @description Adjusts the zoom-control slider
	 * @param {Integer} v The new zoom value.
	 */
    onSlide: function (v) {
        this.controller.viewport.zoomTo(v);
    },
    
    /**
     * @description sets up zoom control UI element
     */
    _buildUI: function () {
        this.zoomInBtn  = jQuery('<div id="zoomControlZoomIn" class="sliderPlus" title=" - Zoom in.">+</div>');
        this.zoomSlider = jQuery('<div id="zoomControlSlider" class="sliderTrack">');
        this.zoomOutBtn = jQuery('<div id="zoomControlZoomOut" class="sliderMinus" title=" - Zoom out.">-</div>');

        this.domNode.append(this.zoomInBtn).append(this.zoomSlider).append(this.zoomOutBtn);
    },
    
    /**
     * @description Initializes zoom control-related event-handlers
     */
    _initEvents: function () {
        var self = this;
        
        // Zoom-in button
        this.zoomInBtn.bind("click", {zoomControl: this}, function (e) {
            e.data.zoomControl.zoomButtonClicked(-1);
        });
        
        // Zoom-out button
        this.zoomInBtn.bind("click", {zoomControl: this}, function (e) {
            e.data.zoomControl.zoomButtonClicked(1);
        });
        
        /**
        Event.observe($(this.id + 'ZoomIn'), 'click', this.zoomButtonClicked.bind(this, -1));
		Event.observe($(this.id + 'ZoomIn'), 'mousedown', function (e) {
			Event.stop(e);
		});
        Event.observe($(this.id + 'ZoomOut'), 'mouseup', this.zoomButtonClicked.bind(this, 1));
        Event.observe($(this.id + 'ZoomOut'), 'mousedown', function (e) {
        	Event.stop(e);
        });**/
    }
});
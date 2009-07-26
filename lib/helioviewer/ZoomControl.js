/**
 * @fileOverview Contains the class definition for an ZoomControl class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
 */
/*global Class, Control, Event, $R, $ */
var ZoomControl = Class.create(
	/** @lends ZoomControl.prototype */
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
        this.domNode = $(this.id);
        this.handle =  $(this.id + 'Handle');

        var range = $R(this.minZoomLevel, this.maxZoomLevel);
        this.slider = new Control.Slider(this.handle, this.id + 'Track', {
            axis: 'vertical',
            values: range,
            sliderValue: this.zoomLevel,
            range: range,
            onChange: this.changed.bind(this)
        });
        //this.handle.innerHTML = this.zoomLevel;
        Event.observe($(this.id + 'ZoomIn'), 'click', this.zoomButtonClicked.bind(this, -1));
		Event.observe($(this.id + 'ZoomIn'), 'mousedown', function (e) {
			Event.stop(e);
		});
        Event.observe($(this.id + 'ZoomOut'), 'mouseup', this.zoomButtonClicked.bind(this, 1));
        Event.observe($(this.id + 'ZoomOut'), 'mousedown', function (e) {
        	Event.stop(e);
        });
    },

	/**
	 * @description Increases or decreases zoom level in response to pressing the plus/minus buttons.
	 * @param {Integer} dir The amount to adjust the zoom level by (+1 or -1).              
	 */
    zoomButtonClicked: function (dir) {
        this.slider.setValue(this.slider.value + dir);
    },
  
	/**
	 * @description Adjusts the zoom-control slider
	 * @param {Integer} v The new zoom value.
	 */
    changed: function (v) {
        this.controller.viewport.zoomTo(v);
    }
});
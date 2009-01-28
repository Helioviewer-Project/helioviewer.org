/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/**
 * @class ZoomControl A slider for controlling the zoom level.
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
*/
/*global UIElement, Class, Object Control, Event, $R, $ */
var ZoomControl = Class.create(UIElement, {
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
     * @function zoomButtonClicked Increases or decreases zoom level in response to pressing the plus/minus buttons.
     * @param {Event} event The actual event fired.
     * @param {Integer}  change The amount to adjust the zoom level by (+1 or -1).              
     */
    zoomButtonClicked: function (dir) {
        this.slider.setValue(this.slider.value + dir);
    },
  
   /**
    * @function changed Called when the slider value is changed.
    * @param {Integer} The new value.
    */
    changed: function (v) {
    	this.fire('change', v);
    }
});
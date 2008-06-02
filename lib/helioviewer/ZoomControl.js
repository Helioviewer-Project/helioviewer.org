/*global UIElement, Class, Object Control, Event, $R, $ */
var ZoomControl = Class.create(UIElement, {
    initialize: function (controller, options) {
        Object.extend(this, options);
        this.domNode = $(this.id);
        this.handle = $(this.id + 'Handle');
        this.controller = controller;
        var range = $R(this.minZoomLevel, this.maxZoomLevel);
        this.slider = new Control.Slider(this.handle, this.id + 'Track', {
            axis: 'vertical',
            values: range,
            sliderValue: this.zoomLevel,
            range: range,
            onSlide: this.updateHandle.bind(this),
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
        //this.addObserver('changed', viewport.zoomTo.bind(viewport));
    },
    
    zoomButtonClicked: function (dir) {
        this.slider.setValue(this.slider.value + dir);
        //this.changed(this.slider.value);
    },
    
    updateHandle: function (v) {
        //this.handle.innerHTML = v;
    },
  
    changed: function (v) {
    	this.updateHandle(v);
    	this.fire('change', v);
    }
});
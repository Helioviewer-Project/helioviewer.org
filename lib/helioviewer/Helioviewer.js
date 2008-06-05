/*global Class, Event, $A, Calendar, DataNavigator, TimeStepSlider, TileLayer, Viewport, ZoomControl, window */
var Helioviewer = Class.create({
	defaultOptions: {
    	defaultZoomLevel: 12,
    	defaultPrefetchSize: 256,
		minZoomLevel: 10,
	    maxZoomLevel: 20,
    	tileUrlPrefix:  'getTile.php',
	    imageUrlPrefix: 'getImage.php'
	},
	date: new Date(Date.UTC(2003, 9, 2)), 
	sources: {
		events: {
			noaa: { enabled: true },
			goes: { enabled: true },
			rhessi: { enabled: true }
    	}
	},

	initialize: function (options) {
	    Object.extend(this, this.defaultOptions);
	    Object.extend(this, options);
    
	    this.initUI();
	    this.initEvents();
	},
      
	initUI: function () {
    	this.initViewports();
    	// UI Components
    	this.calendar = new Calendar(this, 'cal', 'date', 'time', 'show');
    	//this.zoomLevelSlider = new ZoomLevelSlider(this, 'sunViewer.viewport.sliderHandle','sunViewer.viewport.sliderTrack', 'sunViewer.viewport.sliderPlus', 'sunViewer.viewport.sliderMinus', 10, 20, 12);
    	this.zoomControl = new ZoomControl(this, {
    		id: 'zoomControl',
	    	zoomLevel: this.defaultZoomLevel,
	        minZoomLevel: this.minZoomLevel,
	        maxZoomLevel: this.maxZoomLevel
	    });
    	this.timeStepSlider = new TimeStepSlider(this, 'timestepHandle', 'timestepTrack', 8);
	    this.dataNavigator = new DataNavigator(this, 86400, 'timeBackBtn', 'timeForwardBtn');
	    
      	this.layerManager = new LayerManager(this.viewports[0], 'layerManager');
      	this.layerManager.render();
    },
  
    initViewports: function () {
    	this.viewports = $A([
		    new Viewport(this, { id: this.viewportId, zoomLevel: this.defaultZoomLevel, prefetch: this.defaultPrefetchSize })
	    ]);
    
    	var tileUrlPrefix = this.tileUrlPrefix;
      
	    this.viewports.each(function (viewport) {
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'EIT', detector: 'EIT', measurement: '195' }));
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C3', measurement: '0WL' }));
	        Event.observe(window, 'resize', viewport.resize.bind(viewport));
	    });
	},
  
    initEvents: function () {
	    this.observe(this.zoomControl, 'change', this.handlers.zoom);
	    this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
	    this.observe(this.timeStepSlider, 'timeIncrementChange', this.handlers.timeIncrementChange);
	    this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
    },
  
    addViewport: function (viewport) {
	    this.viewports.push(viewport);
	    return this;
    },
  
    observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
    },
  
    setDate: function (date) {
	    this.date = date;
		this.viewports.each(function (viewport) {
			viewport.reload(); 
		});
	    this.calendar.updateFields();
    },
  
    handlers: {
	    zoom: function (level) {
	        this.viewports.each(function (viewport) {
	        	viewport.zoomTo(level);
	        });
	    },
	      
	    observationDateChange: function (date) {
	        this.setDate(date);
	    },
	    
	    timeIncrementChange: function (timeIncrement) {
	        this.dataNavigator.setTimeIncrement(timeIncrement);
	    },
	    
	    /**
	     * @method newLayer Initializes new layer upon user request
	     * @param {Object} instrument Contains necessary information for creating a new layer
	     * @param {LayerManagerMenuEntry} menuEntry Reference to the menu entry to allow layer to be tied to the entry
	     */
	    newLayer: function (data) {
	        var inst = data.instrument;
	        var ui =   data.menuEntry;
	        var viewport = this.viewports[0];
	        
	        // Inialize layer and add it to the viewport
	        var layer = new TileLayer(viewport, { tileUrlPrefix: this.tileUrlPrefix, observatory: inst.observatory, instrument: inst.instrument, detector: inst.detector, measurement: inst.measurement });
	        viewport.addLayer(layer);
	        
	        //Update menu entry display
	        ui.layer = layer;
            ui.displayTileLayerOptions();
	        //ui.header.update(ui.createMenuRowHeader(layer));
	        //ui.content.update(ui.createMenuRowContent(layer));
	        //ui.setupEventHandlers();
	    }
    }
});

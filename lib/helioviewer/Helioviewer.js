/*global Class, Event, $A, Calendar, DataNavigator, TimeStepSlider, TileLayer, Viewport, ZoomControl, window */
var Helioviewer = Class.create({
	defaultOptions: {
    	defaultZoomLevel: 12,
    	defaultPrefetchSize: 256,
    	timeIncrementSecs: 86400,
		minZoomLevel: 10,
	    maxZoomLevel: 20,
    	tileUrlPrefix:  'getTile.php',
	    imageUrlPrefix: 'getImage.php'
	},
	date: new Date(Date.UTC(2003, 9, 5)), 
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
        
        //Calendar
        this.calendar = new Calendar('date');    	
    	
    	//Zoom-control
    	this.zoomControl = new ZoomControl(this, {
    		id: 'zoomControl',
	    	zoomLevel: this.defaultZoomLevel,
	        minZoomLevel: this.minZoomLevel,
	        maxZoomLevel: this.maxZoomLevel
	    });
	    
	    //Time-navigation controls
  	    this.dataNavigator =  new DataNavigator(this, this.timeIncrementSecs, 'timeBackBtn', 'timeForwardBtn');
    	this.timeStepSlider = new TimeStepSlider(this, 'timestepHandle', 'timestepTrack', 8);
    	
    	//Message console
        this.messageConsole = new MessageConsole(this, 'message-console', 'helioviewer-viewport-container-outer');
	    
	    //Layer Manager
      	this.layerManager = new LayerManager(this.viewports[0], 'layerManager');
      	this.layerManager.render();
      	
      	//Tooltips
      	this.initToolTips();
    },
  
    initViewports: function () {
    	this.viewports = $A([
		    new Viewport(this, { id: this.viewportId, zoomLevel: this.defaultZoomLevel, prefetch: this.defaultPrefetchSize })
	    ]);
    
    	var tileUrlPrefix = this.tileUrlPrefix;
      
	    this.viewports.each(function (viewport) {
	        //Add default tile layers
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'EIT', detector: 'EIT', measurement: '195' }));
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));
	        viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C3', measurement: '0WL' }));
	        //viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'MDI', detector: 'MDI', measurement: 'mag' }));
	        
	        //Add default event layer
	        viewport.addLayer(new EventLayer(viewport));

	        Event.observe(window, 'resize', viewport.resize.bind(viewport));
	    });
	},
  
    initEvents: function () {
	    this.observe(this.zoomControl, 'change', this.handlers.zoom);
	    this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
	    this.observe(this.timeStepSlider, 'timeIncrementChange', this.handlers.timeIncrementChange);
	    this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
    },
    
    
    initToolTips: function () {
        /*
        var items = $A([
        
            {id: this.zoomControl.id + 'ZoomIn',  txt: "Zoom in."},
            {id: this.zoomControl.id + 'ZoomOut', txt: "Zoom out."},
            {id: 'timestepHandle',                txt: "Drag handle to move back and forward in time."},
            {id: 'timeBackBtn',                   txt: "Move back in time."},
            {id: 'timeForwardBtn',                txt: "Move forward in time."}
        ]);*/
        
        var items = $A([
            '#zoomControlZoomIn',
            '#zoomControlZoomOut',
            '#zoomControlHandle',
            '#timestepHandle',
            '#timeBackBtn',
            '#timeForwardBtn'
        ]);
        
        var self = this;
        items.each (function (item) {
            self.addToolTip (item);
        });
        
    },
    
    /**
     * @method addToolTip
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
     */
    addToolTip: function (id, params) {
        var options = params || [];
        
        jQuery(id).tooltip({
            delay: (options.delay ? options.delay : 1000),
            track: (options.track ? options.track : false), 
            showURL: false, 
            opacity: 1, 
            fixPNG: true, 
            showBody: " - ", 
            extraClass: (options.tooltipSize ? "tooltip-" + options.tooltipSize : "tooltip-medium"), 
            top: (options.yOffset ? options.yOffset : -125),
            left: 12
        }); 
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
	    //this.calendar.updateFields();
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
	    },
	    
	    /**
	     * @method addToolTip Adds a tool-tip to a given HTML element in real-time.
	     * @param {String} CSS selector of th element to add ToolTip to.
	     */
	    newToolTip: function (tooltip) {

	       //this.addToolTip(tooltip.id, toolip.pos);
	    }
    }
});

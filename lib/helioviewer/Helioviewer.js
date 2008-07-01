/*global Class, Event, $A, Calendar, DataNavigator, TimeStepSlider, TileLayer, Viewport, ZoomControl, window, LayerManager, MessageConsole, jQuery */
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
	
	//Sources (not used yet. for future incorporation)
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
    
        this.dataNavigator = new DataNavigator(this);

	    this.initUI();
	    this.initEvents();
	    this.initKeyBoardListeners();
	},
      
	initUI: function () {
    	this.initViewports();
        
        //Calendar
        this.calendar = new Calendar(this, 'date', 'time');    	
    	
    	//Zoom-control
    	this.zoomControl = new ZoomControl(this, {
    		id: 'zoomControl',
	    	zoomLevel: this.defaultZoomLevel,
	        minZoomLevel: this.minZoomLevel,
	        maxZoomLevel: this.maxZoomLevel
	    });
	    
        //Time-navigation controls
    	this.timeStepSlider = new TimeStepSlider(this, 'timestepHandle', 'timestepTrack', 'timeBackBtn', 'timeForwardBtn', this.timeIncrementSecs, 8);
    	
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
	        //viewport.addLayer(new EventLayer(viewport));

	        Event.observe(window, 'resize', viewport.resize.bind(viewport));
	    });
	},
  
    initEvents: function () {
	    this.observe(this.zoomControl, 'change', this.handlers.zoom);
	    this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
	    this.observe(this.timeStepSlider, 'timeIncrementChange', this.handlers.timeIncrementChange);
	    this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
	    Event.observe(this.calendar.timeField, 'change', this.handlers.observationTimeChange.bindAsEventListener(this));
    },
    
    //Courtesy of PPK (http://www.quirksmode.org/js/events_properties.html#key)
    initKeyBoardListeners: function () {
        var self = this;
        Event.observe(document, 'keypress', function (e) {
            var code;
            if (!e) var e = window.event;
            if (e.keyCode) code = e.keyCode;
            else if (e.which) code = e.which;
            var character = String.fromCharCode(code);
            Debug.output('Character was ' + character);
            //Debug.output('keyCode: ' + e.keyCode);
                        
            //TODO: use events or public method instead of zoomControl's (private) method.
            if (character === "-" || character === "_") {
                self.zoomControl.zoomButtonClicked(+1);                
            }
            else if (character === "=" || character === "+") {
                self.zoomControl.zoomButtonClicked(-1);       
            }
            if (character === "c") {
                self.viewports.each(function (viewport){
                    //Debug.output('moving to 0,0!');
                    viewport.center(); 
                });
            }
            
        });
        
        //Event.observe (document, 'keyup', function (e) {
            //e.keyCode = 40;
        //});
    },    
    
    initToolTips: function () {
        var items = $A([
            '#zoomControlZoomIn',
            '#zoomControlZoomOut',
            '#zoomControlHandle',
            '#timestepHandle',
            '#timeBackBtn',
            '#timeForwardBtn'
        ]);
        
        var self = this;
        items.each(function (item) {
            self.addToolTip(item, {yOffset: -125});
        });
        
    },
    
    /**
     * @method addToolTip
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
     */
    addToolTip: function (id, params) {
        var options = params || [];
        var classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");
       
        jQuery(id).tooltip({
            delay: (options.delay ? options.delay : 1000),
            track: (options.track ? options.track : false), 
            showURL: false, 
            opacity: 1, 
            fixPNG: true, 
            showBody: " - ", 
            extraClass: classname, 
            top: (options.yOffset ? options.yOffset : 0),
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
    },
  
    handlers: {
	    zoom: function (level) {
	        this.viewports.each(function (viewport) {
	        	viewport.zoomTo(level);
	        });
	    },
	      
	    observationDateChange: function (date) {
	        this.setDate(date);
	        this.calendar.updateFields();
	    },
	    
	    observationTimeChange: function (e) {
            var time = e.target.value;
	        
	        //make sure time entered in correct format
	        var regex = /^\d{2}:\d{2}:\d{2}?/;
	        
	        //Check to see if the input is a valid time
	        if (time.match(regex)) {
                //Get the difference in times and add to this.date
                var newTime = time.split(':');
	            var hours = parseInt(newTime[0]) - this.date.getUTCHours();
	            var mins  = parseInt(newTime[1]) - this.date.getUTCMinutes();
	            var secs  = parseInt(newTime[2]) - this.date.getUTCSeconds();
	            
                this.date.addHours(hours);
                this.date.addMinutes(mins);
                this.date.setSeconds(secs);
                
	            this.setDate(this.date);
                
                //Update colors of timestamps
                this.layerManager.updateTimeStamps();
	            
	        } else {
	           this.messageConsole.warn('Invalid time. Please enter a time in of form HH:MM:SS'); 
	        }
        },
	    
	    timeIncrementChange: function (timeIncrement) {
	        this.timeStepSlider.setTimeIncrement(timeIncrement);
	    },

        newToolTip: function (tooltip) {
            this.addToolTip(tooltip.id, tooltip.params);
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
    }
});

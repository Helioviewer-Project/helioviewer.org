/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription  ...
 */
 /*global Class, Ajax, $*/
var LoadingIndicator = Class.create();

LoadingIndicator.prototype = {
	initialize: function () {
		this.loadingItems = [];
		
		Ajax.Responders.register({
            onCreate: this.loadingStarted.bind(this, 'Ajax'),
		    onComplete: this.loadingFinished.bind(this, 'Ajax')
		});
	},

	show: function () {
		$('loading').show();
	},
	
	hide: function () {
		$('loading').hide();
	},
	
	reset: function () {
		this.loadingItems.length = 0;
		this.hide();
	},
	
	loadingStarted: function (item) {
		this.show();
		this.loadingItems.push({});
		//Debug.output('Loading started: ' + item + ' (' + this.loadingItems.length + ')');
	},
	
	loadingFinished: function (item) {
		this.loadingItems.pop();
		if (this.loadingItems.length === 0) {
		    this.hide();
		}
		//Debug.output('Loading finished: ' + item + ' (' + this.loadingItems.length + ')');
	}
};/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription The UIElement class enables inheriting 
 * classes to use the "event/notification" system.
 */
 /*global Class */
var UIElement = Class.create({
	addObserver: function(eventName, callback) {
	    if (!this.observers) {
	    	this.observers = [];
	    }
	    if (!this.observers[eventName]) {
		    this.observers[eventName] = $A([]);
	    }
	    this.observers[eventName].push(callback);
	    return this;
	},

	fire: function(eventName, eventParameters) {
		//$('output').innerHTML = eventName + ': ' + eventParameters;
	    if (!this.observers || !this.observers[eventName] || this.observers[eventName].length === 0) {
			return this;
	    }
	    this.observers[eventName].each(function(callback) {
	    	callback(eventParameters);
	    });
	    return this;
	}
});/*global Class, $, UIElement, document, Element, Counter,  */
var Layer = Class.create(UIElement, {
	maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
	minZoomLevel: 10,
	visible: true,

	initialize: function (viewport) {
		this.viewport = viewport;
		this.domNode = $(viewport.movingContainer.appendChild(new Element('div')));
		this.viewport.addObserver('move', this.viewportMove.bind(this));
		this.id = 'layer' + Math.floor(Math.random() * 100000 + 1);
	},

	setZIndex: function (v) {
		this.domNode.setStyle({ zIndex: v });
	},

	setVisible: function (visible) {
		this.visible = visible;
		this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
		return this.visible;
	},

	toggleVisible: function () {
		return this.setVisible(!this.visible);
	}
});/**
 * @fileoverview Contains the class definition for an extended jQuery datepicker component.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class Calendar
 * 
 */
/*global Class, UIElement, jQuery, window */
var Calendar = Class.create(UIElement, {
    initialize: function (controller, dateFieldId, timeFieldId) {
        this.controller = controller;
        this.dateField = $(dateFieldId);
        this.timeField = $(timeFieldId);
        
        var self = this;
        this.cal = jQuery("#" + dateFieldId).datepicker({
            buttonImage: 'images/blackGlass/glass_button_calendar.png',
            buttonImageOnly: true,
            dateFormat: 'yy/mm/dd',
            mandatory: true,
            showOn: 'both',
            yearRange:  '1998:2008',
            onSelect: function (dateStr) {
                window.setTimeout(function () {
                    var time = self.timeField.value;
                    var date = Date.parse(dateStr);
                    
                    //Factor in time portion of timestamp
                    var hours =   parseInt(time.substring(0,2));
                    var minutes = parseInt(time.substring(3,5));
                    var seconds = parseInt(time.substring(6,8));
                    
                    //Convert to UTC
                    var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds));
                    
                    self.fire('observationDateChange', utcDate);
                }, 500);
                
            }
        });
    },
    
    updateFields: function () {
        // Set text-field to the new date
        this.dateField.value = this.controller.date.toYmdUTCString();
        this.timeField.value = this.controller.date.toHmUTCString();
    }
});
/**
 * @fileoverview Contains the class definition for a class which handles navigating through the different dimensions
 *               of the available data sources.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class DataNavigator
 * 
 */
 /*global document, window, Event, UIElement, Class, Hash, $, $A, Effect */
var DataNavigator = Class.create(UIElement, {
    /**
     * DataNavigator Constructor
     * @constructor
     * 
     * @param {Helioviewer} A reference to the controller
     * @param {Hash} The initial time increment in seconds
     * @param {String} The id of the time navigation back button
     * @param {String} The id of the time navigation forward button
     */
    initialize: function (controller) {
        // Set-up initial date
        this.controller = controller;
        
        // Cache all data queried in an hash
        this.data = new Hash();
    },
    
    /**
     * @method query
     * queries and caches information about available data
     */
    query: function (type) {
        var url = 'get' + type + '.php';
        var self = this;
        var xhr = new Ajax.Request(url, {
            parameters: {
                type: 'json'
            },
            method: 'get',
            onComplete: function (transport) {
                self.data.set(type, transport.responseJSON);
            }
        });
    }     

});/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription This class provides basic debugging functionality
 */
 /*global Class, window, LoadingIndicator, $*/
var Debug = Class.create();

Debug.outputBuffer = '';
Debug.outputTimeout = null;
Debug.loadingItemCount = 0;

Debug.loadingIndicator = new LoadingIndicator();

Debug.test = function (xIndex, yIndex, level) {
	xIndex = 9;
	level = 3;
	for (var l = 0; l <= level; l++) {
		var x = (xIndex >> (level - l + 1)) / (1 << l);
		var x2 = 1 / (1 << l + 1);
		Debug.output(x, (1 << l), (xIndex >> (level - l)), x2);
	}
};

Debug.output = function () {
	var txt = '';
	
	for (var i = 0; i < arguments.length; i++) {
		txt += arguments[i];
		if (i < arguments.length - 1) {
		    txt += ', ';
		}
	}
	
	if (window.console) {
		window.console.log(txt);
	} else {
		if (Debug.outputTimeout) {
		    clearTimeout(Debug.outputTimeout);
		}
		Debug.outputBuffer = txt + '\n' + Debug.outputBuffer;
		Debug.outputTimeout = setTimeout(Debug.flush, 100);
	}
};

Debug.plotArray = function (a) {
	Debug.output('----\n' + Debug.strArray(a, '', 0));
};

Debug.strArray = function (a, indent, index) {
	//Debug.output(typeof(a), a instanceof Array);
	if (a instanceof Array) {
		if (a.length === 0) {
		    return indent + index + ': []\n';
		}
		var txt = indent + index + ': [\n';
		var c = 0;
		a.each(function (m) {
			txt += Debug.strArray(m, indent + '  ', c);
			++c;
		});
		return txt + indent + ']\n';
	} else {
		return indent + index + ': ' + a + '\n';
	}
};

Debug.flush = function () {
    if ($('debugOutput')) {
        $('debugOutput').innerHTML = '----\n' + Debug.outputBuffer + $('debugOutput').innerHTML;
        Debug.outputBuffer = '';
    }
};

Debug.ajaxFailure = function (transport, url) {
	Debug.output('Error getting file "' + url + '": ' + transport.status + ' ' + transport.statusText);
};/**
 * @fileoverview Contains the class definition for an EventLayer class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class EventLayer
 *
 * "sunRadius0" refers to the Sun's radius at zoom-level 0, in pixels = 94 * 2^12.
 * "windowSize" refers to the size of the window (in seconds) from which events
 *              should be displayed.
 *
 * @see Layer, TileLayer
 */
/*global Class, $, Ajax, Debug, Element, Hash, Layer */
var EventLayer = Class.create(Layer, {
	defaultOptions: {
		type: 'EventLayer',
		sunRadius0: 94 * (1 << 12),
		opacityGroupId: -1,
		displayLabels: false,
		windowSize: 43200,
		eventMarkerOffset: {
			top: 10,
			left: 0
		}
	},

	/**
	 * @constructor
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;

		//this.id = 'eventlayer' + Date.now();
		this.id = 'eventlayer' + new Date().getTime();

		this.events = $A([]);

		this.domNode = new Element('div', {className: 'event-layer'});
		this.viewport.movingContainer.appendChild(this.domNode);
	
		//Add to eventLayer Accordion (if is not already there).
		this.eventAccordion.addLayer(this);
		
		this.queryEvents();
	},

	queryEvents: function () {
		var processResponse = function (transport) {
			this.clear();
			if (transport.responseJSON) {
				this.displayEvents(transport.responseJSON);
			}			
		};

		var xhr = new Ajax.Request('getEvents.php', {
			method: 'get',
			onSuccess: processResponse.bind(this),
			parameters: {
				task: 'getPoi',
				date: this.viewport.controller.date.toISOString().slice(1, -1),
				windowSize: this.windowSize,
				catalogs: this.catalog
			}
		});
	},

	viewportMove: function () {

	},
	
	/**
	 * @function clear
	 * @description Removes all events from the screen and clears event container
	 */
	clear: function () {
		this.events.each(function (e) {
			e.remove();
		});
		this.events.clear();
	},

	/**
	 * @function displayEvents
	 * @description Draws events to screen
	 */
	displayEvents: function (jsonEvents) {
		var self = this;
		var date = this.viewport.controller.date;
		var UTCOffset = - parseInt(date.getTimezoneOffset()) * 60;
		var sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;
		
		//stylize each event marker based on it's the event type
		jsonEvents.each(function (event) {
			self.events.push(new EventMarker(self, event, date, UTCOffset, sunRadius, {offset: self.eventMarkerOffset}));
		});
	},

	/**
	 * @function toggleLabelVisibility
	 * @description toggle event label visibility
	 */
	toggleLabelVisibility: function () {
		this.displayLabels = !this.displayLabels;
		this.events.each(function(e) {
        	e.toggleLabel();
		});
	},

	reload: function () {
		this.queryEvents();
	},

	reset: function () {
		var sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;

		this.events.each(function (e) {
			e.refresh(sunRadius);
		});
	}
});
/**
 * @fileoverview Contains the class definition for an EventLayerAccordion class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class EventLayerAccordion
 *
 * syntax: jQuery, Prototype
 *
 * @see EventLayer, LayerManager, TileLayerAccordion
 * @requires ui.dynaccordion.js
 */
var EventLayerAccordion = Class.create(Layer, {
	initialize: function (viewport, containerId) {
		this.viewport = viewport;
		this.container = jQuery('#' + containerId);

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#EventLayerAccordion-Container');
		this.domNode.dynaccordion();

		// Get Event Catalogs
		this.getEventCatalogs();
	},

	/**
	 * @function
	 * @description Adds a new entry to the event layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var catalog = this.eventCatalogs.get(layer.catalog);
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">' + catalog.description + '</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Work-around: adjust the height of the accordion section header to handle overflow
		//var h = $(layer.id).select('.event-accordion-header-left').first().getHeight();
		//$(layer.id).select('.layer-Head').first().setStyle({'height': h + 'px'});

		// Event-handlers
		this._setupEventHandlers(layer);
	},


	//@TODO: Move this to the new layer manager.
	getEventCatalogs: function () {
		var self = this;
		var url = "getEvents.php";

		jQuery.getJSON(url, function(catalogs) {
			var lm = self.viewport.controller.layerManager;
			
			self.eventCatalogs = new Hash();
			catalogs.each(function (catalog) {
				self.eventCatalogs.set(catalog.id, catalog);

				//Ignore EIT Activity reports for the time being
				if (catalog.id !== "EITPlanningService::EITActivity") {
					if (catalog.id == "VSOService::noaa")
						lm.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self, windowSize: 86400}));
					else
						lm.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self}));
				}
			});



			//Initial catalogs to load
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::cmelist", eventAccordion: self}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::type2cme",  eventAccordion: self}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::noaa",  eventAccordion: self, windowSize: 86400}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "CACTusService::CACTus",  eventAccordion: self}));

		});
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span>Events</span>').css({'float': 'left', 'color': 'black', 'font-weight': 'bold'});
		//var addLayerBtn = jQuery('<a href=#>[Add Events]</a>').css({'margin-right': '14px', 'color': '#9A9A9A', 'text-decoration': 'none', 'font-style': 'italic', 'cursor': 'default'});
		//this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append('<br>'));

		var innerContainer = jQuery('<ul id=EventLayerAccordion></ul>');
		var outerContainer = jQuery('<div id="EventLayerAccordion-Container"></div>').append(innerContainer);
		this.container.append(outerContainer);
	},

	/**
	 * @function
	 * @description
	 */
	_setupEventHandlers: function (layer) {
		visibilityBtn = jQuery("#visibilityBtn-" + layer.id);
		removeBtn = jQuery("#removeBtn-" + layer.id);

		// Function for toggling layer visibility
		var toggleVisibility = function (e) {
			var visible = layer.toggleVisible();
			var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')' );
			e.stopPropagation();
		};

		// Function for handling layer remove button
		var removeLayer = function (e) {
			var self = e.data;
			self.viewport.controller.layerManager.removeLayer(layer);
			self.domNode.dynaccordion('removeSection', {id: layer.id});
			e.stopPropagation();
		};

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	}
});

/**
 * @fileoverview Contains the class definition for an EventMarker class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class EventMarker
 *
 * syntax: Prototype
 *
 * @see EventLayer
 */
var EventMarker = Class.create({
	/**
	 * @constructor
	 */    
    initialize: function (eventLayer, event, date, utcOffset, sunRadius, options) {
    	Object.extend(this, event);
		Object.extend(this, options);
		
		this.eventLayer = eventLayer;
		this.appDate = date;
		this.utcOffset = utcOffset;
		this.sunRadius = sunRadius;
		
		//Determine event type and catalog
		var catalogs = eventLayer.eventAccordion.eventCatalogs;
		this.catalogName = catalogs.get(this.catalogId).name;
		this.type = catalogs.get(this.catalogId).eventType;
		
		//Create container
		this.pos = {
			x: this.sunX * sunRadius,
			y: this.sunY * sunRadius
		}
		
		this.container = this.eventLayer.domNode.appendChild(
			new Element('div', {className: 'event', style: 'left: ' + (this.pos.x) + 'px; top: ' + (this.pos.y) + 'px;'})
		);
				
		//Create dom-nodes for event marker, details label, and details popup
		this.createMarker();
		this.createLabel();
		this.createPopup();
	},
	
	/**
	 * @function createMarker
	 */
	createMarker: function () {
		//make catalog id CSS-friendly
		var cssId = this.catalogId.gsub('::', "_");
		
		//create html dom-node
		var marker = new Element('div', {className: cssId + ' ' +  this.type.gsub(' ', '_') + ' event-marker'});
		
		var self = this;
		marker.observe('click', function(event) {
			self.togglePopup();
		});
		
		this.marker = marker;
		
		this.container.appendChild(marker);
	},
	
	/**
	 * @function createLabel
	 */
	createLabel: function () {
		var display = (this.eventLayer.displayLabels ? "inline" : "none");
		var labelText = null;
		
		//Determine what to use for label text
		switch (this.type) {
			case "Active Region":
				labelText = this.eventId;
				break;
			case "CME":
				labelText = this.startTime;
				break;
			case "Type II Radio Burst":
				labelText = this.startTime;
				break;
			default:
				labelText = this.startTime;
				break;
		}
		
		//Determine time difference between desired time and event time
		var eventDate = Date.parse(this.startTime.substr(0,19)).addSeconds(this.utcOffset);
		var timeDiff = eventDate.getTime() - this.appDate.getTime();
		
		//Create a hidden node with the events ID to be displayed upon user request
		var label = new Element('div', {className: 'event-label'}).setStyle({'display': display}).insert(labelText);
		
		//Adjust style to reflect time difference
        if (timeDiff < 0) {
        	label.addClassName("timeBehind");
        }
        else if (timeDiff > 0) {
        	label.addClassName("timeAhead");
        }
        
        this.label = label;
        
        this.container.appendChild(label);
		
	},
	
	/**
	 * @function createPopup
	 */
	createPopup: function () {
		//popup
		var popup = new Element('div', {className: 'event-popup tooltip-topleft-large', style: 'display: none;'});
		var content = "<div class='event-popup-container'>" + 
					"<strong>" + this.type + " " + this.eventId + "</strong><br>" +
					"<p>" + this.catalogName + "</p><br>" +
					"<strong>start:</strong> " + this.startTime + "<br>" +
					"<strong>end:</strong> " + this.endTime + "<br><br>" +
					"<strong>Position Angle:</strong> " + this.polarCpa + "&deg; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
					"<strong>Width:</strong> " + this.polarWidth + "&deg;<br>" +
					"<strong>Source:</strong> <a href='" + this.sourceUrl + "' class='event-url'>" + this.sourceUrl + "</a><br>" +
					"</div>";
		popup.update(content);
		
		//close button
		var closeBtn = new Element('a', {className: 'event-popup-close-btn'}).insert("x");
		closeBtn.observe('click', this.togglePopup.bind(this));
		popup.insert(closeBtn);
		
		this.popup = popup;
		this.container.appendChild(popup);			
	},
	
	/**
	 * @function remove
	 */
	 remove: function () {
	 	this.container.remove();
	 },
	 
	 /**
	  * @function refresh
	  * @description redraw event
	  */
	refresh: function (sunRadius) {
		this.sunRadius = sunRadius;
		this.pos = {
			x: this.sunX * sunRadius,
			y: this.sunY * sunRadius
		};
		this.container.setStyle({
			left: (this.pos.x - 2) + 'px',
			top:  (this.pos.y - 2) + 'px'
		});
	},

	/**
	 * @function toggleLabel
	 * @description toggle event label visibility
	 */	
	toggleLabel: function () {
		this.label.toggle();
	},
	
	/**
	 * @function togglePopup
	 * @description toggle event popup visibility
	 */	
	togglePopup: function () {
		this.popup.toggle();
	}
});
/**
 * @fileoverview Container's the main application class and controller for HelioViewer.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @class Helioviewer
 *
 */
/*global Class, Event, $A, Calendar, DataNavigator, TimeStepSlider, TileLayer, Viewport, ZoomControl, window, LayerManager, MessageConsole, jQuery */
var Helioviewer = Class.create({
	defaultOptions: {
		defaultZoomLevel: 12,
		defaultPrefetchSize: 0,
		timeIncrementSecs: 86400,
		minZoomLevel: 9,
		maxZoomLevel: 20,
		tileUrlPrefix:  'getTile.php',
		imageUrlPrefix: 'getImage.php',
		eventUrlPrefix: 'getEvents.php'
	},

	//starting date
	date: new Date(Date.UTC(2003, 9, 5)),

	//Sources (not used yet. for future incorporation)
	sources: {
		events: {
			noaa: { enabled: true },
			goes: { enabled: true },
			rhessi: { enabled: true }
		}
	},

	/**
	 * @constructor
	 */
	initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.dataNavigator = new DataNavigator(this);
		this.layerManager =  new LayerManager(this);
		this.initViewports();
		this.initUI();
		this.initEvents();
		this.initKeyBoardListeners();
		
		//Add initial layers
		this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileUrlPrefix: this.tileUrlPrefix, observatory: 'soho', instrument: 'EIT', detector: 'EIT', measurement: '304' }));
		this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileUrlPrefix: this.tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));
		//this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileUrlPrefix: this.tileUrlPrefix, observatory: 'soho', instrument: 'MDI', detector: 'MDI', measurement: 'mag' }));
		
		//Shadow-box
		//Shadowbox.init({skipSetup: true});

	},

	/**
	 * @method initUI Initialized HelioViewer's user interface (UI) components
	 */
	initUI: function () {
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

		//Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
		this.tileLayerAccordion = new TileLayerAccordion(this.layerManager, 'layerManager');
		this.eventLayerAccordion = new EventLayerAccordion(this.viewports[0], 'eventAccordion');

		//Tooltips
		this.initToolTips();
		
		//Center button
		var centerBtn =  Builder.node('div', {className: 'center-button'}, Builder.node('span', {}, "center"));
		Event.observe(centerBtn, 'click', this.viewports[0].center.bindAsEventListener(this.viewports[0]));
		this.viewports[0].innerNode.insert(centerBtn);
		
		//Movie builder
		//this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});
	},

	initViewports: function () {
		this.viewports = $A([
			new Viewport(this, { id: this.viewportId, zoomLevel: this.defaultZoomLevel, prefetch: this.defaultPrefetchSize, debug: false })
		]);

		var tileUrlPrefix = this.tileUrlPrefix;

		this.viewports.each(function (viewport) {
			//Add default tile layers
			//viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'EIT', detector: 'EIT', measurement: '304' }));
			//viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));
			//viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C3', measurement: '0WL' }));
			//viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'trac', instrument: 'TRA', detector: 'TRA', measurement: '171' }));
			//viewport.addLayer(new TileLayer(viewport, { tileUrlPrefix: tileUrlPrefix, observatory: 'soho', instrument: 'MDI', detector: 'MDI', measurement: 'mag' }));

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

			//Ignore event if user is type in an input form field
			if (e.target.tagName !== "INPUT") {
				var code;
				if (!e) var e = window.event;
				if (e.keyCode) code = e.keyCode;
				else if (e.which) code = e.which;
				var character = String.fromCharCode(code);

				//TODO: use events or public method instead of zoomControl's (private) method.
				if (character === "-" || character === "_") {
					self.zoomControl.zoomButtonClicked(+1);
				}
				else if (character === "=" || character === "+") {
					self.zoomControl.zoomButtonClicked(-1);
				}
				else if (character === "c") {
					self.viewports.each(function (viewport){
						viewport.center();
					});
				}
				//event label visibility toggle
				else if (character === "d") {
					self.layerManager.layers.each(function (layer){
						if (layer.type === "EventLayer") {
								layer.toggleLabelVisibility();
						}
					});
				}
			}
		});
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
		
		//Handle some special cases separately
		this.addToolTip('#movieBuilder', {position: 'topleft'});

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
		this.layerManager.reloadLayers();
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
				var hours = parseInt(newTime[0], 10) - this.date.getUTCHours();
				var mins  = parseInt(newTime[1], 10) - this.date.getUTCMinutes();
				var secs  = parseInt(newTime[2], 10) - this.date.getUTCSeconds();

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
		}
	}
});

/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt	 keith.hughitt@gmail.com
 */
String.prototype.padLeft = function (padding, minLength) {
	var str = this;
	var strPad = '' + padding;
	while (str.length < minLength) {
		str = strPad + str;
	}
	return str;
};

String.prototype.trimLeft = function (padding) {
	var str = this;
	var strPad = '' + padding;
	while (str[0] === strPad) {
	    str = str.substr(1);
	}
	return str;
};

Date.prototype.toYmdUTCString = function () {
	var year = this.getUTCFullYear() + '';
	var month = (this.getUTCMonth() + 1) + '';
	var day = this.getUTCDate() + '';
	return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

Date.prototype.toHmUTCString = function () {
	var hour = this.getUTCHours() + '';
	var min = this.getUTCMinutes() + '';
	var sec = this.getUTCSeconds() + '';
	return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};

/**
 * Takes a localized javascript date and returns a date set to the UTC time.
 */
Date.prototype.toUTCDate = function () {
	var utcOffset = this.getUTCOffset();
	var sign = utcOffset[0];
	var hours = parseInt(utcOffset.substr(1,2));
	var mins = parseInt(utcOffset.substr(3,4));
	
	var numSecs = (3600 * hours) + (60 * mins);
	
	if (sign === "+") {
		numSecs = - numSecs;
	}
	
	this.addSeconds(numSecs);
};

/**
 * getOS
 */
var getOS = function () {
	var os = "other";
	
	if (navigator.appVersion.indexOf("Win")!=-1) {
		os = "win"
	}
	if (navigator.appVersion.indexOf("Mac")!=-1) {
		os = "mac";
	}
	if (navigator.appVersion.indexOf("X11")!=-1) {
		os = "linux";
	}
	if (navigator.appVersion.indexOf("Linux")!=-1) {
		os = "linux";
	}
	
	return os;
};
/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class LayerManager A simple layer manager.
 */
var LayerManager = Class.create(UIElement, {
    /**
     * @constructor
     * @param {Helioviewer} Controller.
     */
    initialize: function (controller) {
        this.controller = controller;
        this.layers = $A([]);
    },
    
    hasId: function (id) {
		//return (this.layers.grep(id).length > 0 ? true : false);
	},

	/**
	 * @function addLayer
	 * @description Add a new layer
	 */
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	/**
	 * @function
	 * @return {Integer} Number of tile layers present.
	 */
	numTileLayers: function () {
		var n = 0;
		this.layers.each(function(l){
			if (l.type == "TileLayer") {
				n++;
			}
		});
		
		return n;
	},
	
	/**
	 * @function
	 * @return {Integer} Number of event layers present.
	 */
	numEventLayers: function () {
		var n = 0;
		this.layers.each(function(l){
			if (l.type == "EventLayer") {
				n++;
			}
		});
		
		return n;
	},
	
	/**
	 * @function removeLayer
	 * @description Removes a layer
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	/**
	 * @function reloadLayers
	 * @description Reload layers
	 */
	reloadLayers: function () {
		this.layers.each(function (layer) {
			layer.reload();
		});
	},

	/**
	 * @function reset
	 * @description Reloads each of the tile layers
	 */
	resetLayers: function (visible) {
		this.layers.each(function (layer) {
			layer.reset(visible);
		});
	}
   
});

  
/**
 * @fileoverview Contains the "MessageConsole" class definition. This class allows
 * information relevent to the user to be displayed in a specified location on-screen.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class MessageConsole Provides a mechanism for displayed useful information to the user.
 *        For ease of use, the class provides methods comparable to Firebug's for outputting
 *        messages of different natures: "log" for generic unstyled messages, or for debbuging
 *        use, "info" to inform the user of some interesting change or event, and "warning" and
 *        "error" for getting the user's attention.
 */
 /*global document, UIElement, Effect, $, Class */
var MessageConsole = Class.create(UIElement , {
    /**
     * MessageClass Constructor
     * @constructor
     * @param {Controller} controller A reference to the Helioviewer (controller).
     * @param {String} container The id of the container for messages to be displayed in.
     * @param {String} viewport  The id of the viewport container.
     * sending and receiving events related to the message console.
     */
    initialize: function (controller, container, viewport) {
        this.controller = controller;
        this.console =  $(container);
        this.viewportId = viewport;
        
        //Event Listeners
        this.observe(this.controller.viewports[0], 'info', this.log);
    },
    
    log: function (msg) {
        this.console.update(new Element('p', {style: 'color: #6495ED; font-weight: bold;'}).insert(msg));
        var trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
    info: function (msg) {
    },
    
    warn: function (msg) {
        this.console.update(new Element('p', {style: 'color: yellow; font-weight: bolder;'}).insert(msg));
        var trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);        
    },
    
    error: function (msg) {
        this.console.update(new Element('p', {style: 'color: red'}).insert(msg));
        var trash = new Effect.Shake(this.viewportId, {distance: 15, duration: 0.1});
        trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
           var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
    /*
     * @function
     * @name link
     */
    link: function (msg, linkText) {
    	// Generate a temporary id
    	var linkId = 'link-' + this.controller.date.getTime()/1000;
    	
    	// Html
    	var wrapper = new Element('span');
    	var link = new Element('a', {href: '#', id: linkId, 'class': 'message-console-link'}).update(linkText);
    	wrapper.insert(msg);
    	wrapper.insert(link)
    	
    	this.console.update(new Element('p', {style: 'color: #6495ED;'}).insert(wrapper));
        var trash = new Effect.Appear(this.console, { duration: 2.0 });
    
        //For downloads, leave the message up until the user clicks on the link provided.
        //Note: another possibility is to add a "close" option.
        var self = this;
        Event.observe(linkId, 'click', function() {
			self.console.hide();        	
        });
        
        return linkId;
    },
    
    observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
    }
});/**
 * @fileoverview Contains the class definition for a class for generating and displaying movies.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class MovieBuilder
 *
 */
 /*global document, window */

//TODO: pass in bit-rate depending upon codec chosen! Xvid?

var MovieBuilder = Class.create(UIElement, {
	defaultOptions: {
		active: false,
		url: "api/getImageSeries.php",
		minZoomLevel: 13, //can relax for single layer movies...
		numFrames: 40,
		frameRate: 8,
		sharpen: false,
		edgeEnhance: false,
		format: {win: "asf", mac: "mov", linux: "mp4"}
	},

	/**
     * MovieBuilder Constructor
     * @constructor
     *
     */
    initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

        var self = this;

        //Quick Movie Event Handler
		Event.observe(this.id, 'click', function() {
			if (!self.active) {
				var hv = self.controller;
	
				self.active = true;
				
				// Chose an optimal codec based on User's OS
				var hqFormat = self.format[getOS()];
				
				// Get range of tiles to use
				var displayRange = hv.viewports[0].displayRange();
	
				//Ajax Request
				var xhr = new Ajax.Request(self.url, {
					parameters: {
						action:    "quickMovie",
	                	layers:    "EITEIT304,LAS0C20WL",
	                	startDate: hv.date.getTime() / 1000,
	                	zoomLevel: Math.max(hv.viewports[0].zoomLevel, self.minZoomLevel),
	                	numFrames: self.numFrames,
	                	frameRate: self.frameRate,
	                	edges:     self.edgeEnhance,
	                	sharpen:   self.sharpen,
	                	format:    hqFormat,
	                	xRange:    displayRange.xStart + ", " + displayRange.xEnd,
						yRange:    displayRange.yStart + ", " + displayRange.yEnd
					},
					method: 'get',
					onComplete: function (transport) {
						// Let user know that video is read
						var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
						
						self.active = false;
	
						Event.observe(linkId, 'click', function () {
								Shadowbox.open({
						        player:  'iframe',
						        title:   'Helioviewer Movie Player',
					        	height:   650,
					        	width:    550,
					        	content: self.url + '?action=play&format=' + hqFormat + '&url=' + transport.responseJSON
							});
						});
					}
				});
			}
		});
    },

    /**
     * @method query
     * queries and caches information about available data
     */
    query: function (type) {
        var url = 'get' + type + '.php';
        var self = this;
        var xhr = new Ajax.Request(url, {
            parameters: {
                type: 'json'
            },
            method: 'get',
            onComplete: function (transport) {
                self.data.set(type, transport.responseJSON);
            }
        });
    }
});
/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var TileLayer = Class.create(Layer, {
	defaultOptions: {
		type: 'TileLayer',
		tileSize: 512,
		source: 'database',
		rootDir: 'tiles/',
		opacity: 100,
		startOpened: false
	},

	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;
		
		this.layerManager = viewport.controller.layerManager;
		this.id = 'tilelayer' + new Date().getTime();

		// Create an HTML container to hold the layer tiles
		this.domNode = new Element('div', {className: 'tile-layer-container', style: 'position: absolute;'});
		viewport.movingContainer.appendChild(this.domNode);

		this.viewport.addObserver('move', this.viewportMove.bind(this));

		this.tiles = [];
		this.loadClosestImage();
	},

	/**
	 * @function
	 */
	reload: function() {
		this.loadClosestImage();
	},

	/**
	 * @function removeTiles
	 */
	removeTiles: function () {
		this.tiles = [];
	},

	/**
	 * @function reset
	 * @description Reload the tile layer.
	 */
	reset: function (visible) {
		var i, j;

		// Let user know if the requested zoom-level is unavailable
		if ((this.viewport.zoomLevel < this.minZoom) && (!this.warned)) {
			this.viewport.controller.messageConsole.log("Warning: " + this.name + " is not available at this zoom level. Try a lower zoom-level.");
			this.warned = true;
		}

		// Remove tiles in cache
		this.removeTiles();

		this.refreshUTCDate();

		// Reference old tile nodes to remove after new ones are done loading
		var old = [];
		this.domNode.childElements().each(function (tile) {
			old.push(tile);
		});

		//TODO: Determine range to check
		var numTiles = 0;
		var numTilesLoaded = 0;

		var indices = this.viewport.visibleRange;
		
		for (i = indices.xStart; i <= indices.xEnd; i++) {
			for (j = indices.yStart; j <= indices.yEnd; j++) {
				if (visible[i][j]) {
					var tile = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));

					if (!this.tiles[i]) {
						this.tiles[i] = [];
					}

					this.tiles[i][j] = {};
					this.tiles[i][j].img = tile;

					numTiles++;

				   // Makes sure all of the images have finished downloading before swapping them in
					Event.observe(this.tiles[i][j].img, 'load', function(e) {
						numTilesLoaded++;
						if (numTilesLoaded == numTiles) {
							//Debug.output("Finished loading ALL images! (" + numTiles + ") total.");
							old.each(function (tile) {
								tile.parentNode && tile.remove();
							});
						}
					});
				}
			}
		}
	},

	/**
	 * @function
	 */
	refreshUTCDate: function () {
		var date = new Date(this.timestamp * 1000);
		date.toUTCDate();
		this.utcDate = date;
	},

	setImageProperties: function (imageProperties) {
		//Only load image if it is different form what is currently displayed
		if (imageProperties.imageId === this.imageId) {
			this.fire('obs_time_change', this);
			return;
		}

		Object.extend(this, imageProperties);

		this.fire('obs_time_change', this);

		this.setZIndex(parseInt(this.opacityGroupId));

		//handle opacities for any overlapping images
		this.setInitialOpacity();

		// Let others know layer has been added
		this.fire('change', this);

		this.viewport.checkTiles(true);

		this.reset(this.viewport.visible);
	 },

	setImage: function (imageId) {
		if (imageId === this.imageId) {
			return;
		}
		this.imageId = imageId;
		this.loadImageProperties();
		this.reset(this.viewport.visible);
	},

	/**
	 * @function setInitialOpacity
	 * @description Sets the opacity for the layer, taking into account layers
	 *			  which overlap one another.
	 */
	setInitialOpacity: function () {
		var self = this;
		var opacity = 1;
		var counter = 0;

		this.layerManager.layers.each (function (layer) {
			if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
			   counter++;

				//Do no need to adjust opacity of the first image
				if (counter > 1) {
					opacity = opacity / counter;
					layer.domNode.setOpacity(opacity);
					layer.opacity = opacity * 100;
					layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize})
				}
			}
		});
	},

	/**
	 * @function setOpacity
	 * 
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;
		opacity = opacity / 100;
		this.domNode.setOpacity(opacity);
		this.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')'})
	},

	/**
	 * @function loadClosestImage
	 * @description Loads the closest image in time to that requested
	 */
	loadClosestImage: function () {
		var date = this.viewport.controller.date;
		var urlPrefix = this.viewport.controller.imageUrlPrefix;

		var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
		var processResponse = function (transport) {
			this.setImageProperties(transport.responseJSON);
			
			var hv = this.viewport.controller;

			// Add to tileLayer Accordion if it's not already there
			if (!hv.tileLayerAccordion.hasId(this.id)) {
				hv.tileLayerAccordion.addLayer(this);
			}
			// Otherwise update the accordion entry information
			else {
				hv.tileLayerAccordion.updateTimeStamp(this);
				hv.tileLayerAccordion.updateLayerDesc(this.id, this.name);
			}
		};
		var xhr = new Ajax.Request(url, {
			method: 'get',
			onSuccess: processResponse.bind(this)
		});
	},

	/**
	 * @function viewportMove
	 * @description Check to see if all visible tiles have been loaded
	 *
	 */
	viewportMove: function (position) {
		var visible = this.viewport.visible;
		var indices = this.viewport.visibleRange;

		//Debug.output("Checking tiles from " + indices.xStart + " to " + indices.xEnd);

		for (var i = indices.xStart; i <= indices.xEnd; i++) {
			for (var j = indices.yStart; j <= indices.yEnd; j++) {
				if (!this.tiles[i]) {
					this.tiles[i] = [];
				}
				if(visible[i][j] && (!this.tiles[i][j])) {
					//Debug.output("Loading new tile");
					this.tiles[i][j] = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
				}
			}
		}
	},

	getFullSize: function () {
		return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
	},


	getTile: function (x, y) {
		var left = x * this.tileSize;
		var top = y * this.tileSize;

		var img = $(new Image());
		img.toggleClassName('tile');
		img.setStyle({
			left: left + 'px',
			top: top + 'px'
		});
		img.unselectable = 'on';
		var rf = function() {
			return false;
		};
		img.onmousedown = rf;
		img.ondrag = rf;
		img.onmouseover = rf;
		img.oncontextmenu = rf;
		img.galleryimg = 'no';

		//default image
		Event.observe(img, 'error', function () {
			this.src = 'images/transparent.gif';
		})

		img.src = this.getTileUrl(x, y, this.detector, this.viewport.zoomLevel, this.imageId);
		return img;
	},

	/**
	 * @function
	 * @description Returns the URI for the specified tile.
	 */
	getTileUrl: function (x, y, detector, zoom, imageId) {
		if (this.source === "database") {
			if (imageId === undefined) {
				imageId = '';
			}
			return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + imageId;
		}
		else if (this.source === "filesystem") {
			var filepath = this.getFilePath(x,y);
			//Debug.output("[" + x + ", " + y + "] " + filepath);
			return filepath;
		}
	},

	/**
	 * @function getFilePath
	 * @description Builds a filepath for a given tile
	 */
	getFilePath: function (x, y) {
		var offset = this.getTileOffset();

		var year =  this.utcDate.getFullYear();
		var month = (this.utcDate.getMonth() + 1).toString().padLeft('0', 2);
		var day =   this.utcDate.getDate().toString().padLeft('0', 2);
		var hour =  this.utcDate.getHours().toString().padLeft('0', 2);
		var min =   this.utcDate.getMinutes().toString().padLeft('0', 2);
		var sec =   this.utcDate.getSeconds().toString().padLeft('0', 2);
		var obs =   this.observatory.toLowerCase();
		var inst =  this.instrument;
		var det =   this.detector;
		var meas =  this.measurement;
		var zoom =  this.viewport.zoomLevel;
		
		// Convert coordinates to strings
		var xStr = "+" + x.toString().padLeft('0',2);
		if (x.toString().substring(0,1) == "-") {
			xStr = "-" + x.toString().substring(1).padLeft('0', 2);
		}

		var yStr = "+" + y.toString().padLeft('0',2);
		if (y.toString().substring(0,1) == "-") {
			yStr = "-" + y.toString().substring(1).padLeft('0', 2);
		}

		var path = this.rootDir + year + "/" + month + "/" + day + "/" + hour + "/" + obs + "/" + inst + "/" + det + "/" + meas + "/";
		var file = year + "_" + month + "_" + day + "_" + hour + min + sec + "_" + obs + "_" + inst + "_" + det + "_" + meas + "_" + zoom + "_" + xStr + "_" + yStr + "." + this.filetype;

		return (path + file);
	},

	/**
	 * @function getTileOffset
	 * @description Determines offset for converting from HelioCentric coordinates to TOP-LEFT
	 *              coordinates.
	 */
	getTileOffset: function () {
		//var numTiles = this.getNumTiles();
		//return Math.max(1, parseInt(Math.sqrt(numTiles)/2));
		return 0;
	},

	/**
	 * @function getNumTiles
	 * @description Returns the (maximum) number of tiles required to display images for the TileLayer's associated
	 *              detector, given the specified zoom-level. Varies from detector to detector.
	 */
	getNumTiles: function () {
		var zoom = this.viewport.zoomLevel;
		var diff = parseInt(this.lowestRegularZoom) - zoom;

		//Debug.output("TL Diff: " + diff);

		return Math.max(4, Math.pow(4, 1 + diff));
	}
});

/**
 * @fileoverview Contains the class definition for an TileLayerAccordion class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class TileLayerAccordion
 *
 * syntax: jQuery, Prototype
 *
 * @see LayerManager
 * @requires ui.dynaccordion.js
 */
var TileLayerAccordion = Class.create(Layer, {
	/**
	 * @constructor
	 * @param {LayerManager} Reference to the layerManager.
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
	 */
	initialize: function (layerManager, containerId) {
		this.layerManager = layerManager;
		this.container =    jQuery('#' + containerId);
		this.queryURL =     "getLayerAvailability.php";

		this.options = {};

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#TileLayerAccordion-Container');
		this.domNode.dynaccordion({startClosed: true});
		
		//Individual layer menus
		this.layerSettings = new Hash();
	},

	/**
	 * @function
	 * @description Adds a new entry to the tile layer accordion
	 */
	addLayer: function (layer) {
		// Determine what measurements to display
		var processResponse = function(transport){
			// Create accordion entry header
			//var collapseIcon = "<img class='collapse' id='collapse-" + layer.id + "' src='images/blackGlass/accordion_menu_closed.png'></button>";
			
			var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
			var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
			var head = "<div class=layer-Head><span class=tile-accordion-header-left>" + layer.name + "</span><span class=tile-accordion-header-right><span class=timestamp></span> |" + visibilityBtn + removeBtn + "</span></div>";

			// Update allowable choices
			this.options.observatories = transport.responseJSON.observatories;
			this.options.instruments =   transport.responseJSON.instruments;
			this.options.detectors =     transport.responseJSON.detectors;
			this.options.measurements =  transport.responseJSON.measurements;			
			
			// Create accordion entry body
			var body = this._buildEntryBody(layer);

			//var startOpened = (this.layerManager.numTileLayers() > 1);

			//Add to accordion
			this.domNode.dynaccordion("addSection", {
				id:     layer.id,
				header: head,
				cell:   body,
				open:   layer.startOpened
			});
			
			
			new Control.Slider("opacity-slider-handle-" + layer.id, "opacity-slider-track-" + layer.id, {
				sliderValue: layer.opacity,
				range:       $R(1, 100),
				values:      $R(1, 100),
				onSlide:     function(v) {
					layer.setOpacity(v);	
				}
			});
			
			/* NOTE: Bug in jQuery slider currently prevents it from working properly when
			 * initialized hidden. See http://groups.google.com/group/jquery-ui/browse_thread/thread/5febf768db177780. 
			jQuery("#opacity-slider-track-" + layer.id).slider({
				startValue: layer.opacity,
				change: function(e, ui) {
					var val = ui.value;
					layer.setOpacity(val);					
				}
			});*/
			
			// Keep a reference to the dom-node
			//this.menuEntries.push({id: layer.id, header: head, cell: body});
			this.layerSettings.set(layer.id, {
				header: head,
				body: body
			});
			
			// Event-handlers
			this._setupEventHandlers(layer);
			
			// Update timestamp
			this.updateTimeStamp(layer);
		};
		
		//Ajax Request
		var xhr = new Ajax.Request(this.queryURL, {
			method: 'get',
			onSuccess: processResponse.bind(this),
			parameters: {
				observatory: layer.observatory,
				instrument:  layer.instrument,
				detector:    layer.detector,
				measurement: layer.measurement,
				format:      "json"
			}
		});
	},

	/**
	 * @function
	 * @description Checks to see if the given layer is listed in the accordion 
	 */
	hasId: function (id) {
		return (this.layerSettings.keys().grep(id).length > 0 ? true : false);
	},
	
	/**
	 * @function
	 * e.g. http://localhost/hv/getLayerAvailability.php?observatory=none&instrument=EIT&detector=EIT&measurement=none&format=json
	 * 
	 * Note: width and height must be hardcoded for slider to function properly. 
	 * See http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f for explanation.
	 */
	_buildEntryBody: function (layer) {
		var id = layer.id;
		var options = this.options;
		
		// Opacity slider placeholder
		var opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
		opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id + "' style='width:120px; height:10px;'>";
		opacitySlide += "<div class='opacity-slider-handle' id='opacity-slider-handle-" + id + "' style='10px; 19px;'></div>"
		opacitySlide += "</div>";
				
		// Populate list of available observatories
		var obs = "<div class=layer-select-label>Observatory: </div> ";
		obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'>";
		jQuery.each(options.observatories, function (i, o) {
			obs += "<option value='" + o.abbreviation + "'";
			if (layer.observatory == o.abbreviation) {
				obs += " selected='selected'";
			}				 
			obs += ">" + o.name + "</option>";			
		});
		obs += "</select><br>";
		
		// Populate list of available instruments
		var inst = "<div class=layer-select-label>Instrument: </div> ";
		inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'>";
		jQuery.each(options.instruments, function (i, o) {
			inst += "<option value='" + o.abbreviation + "'";
			if (layer.instrument == o.abbreviation) {
				inst += " selected='selected'";
			}
			inst += ">" + o.name + "</option>";			
		});
		inst += "</select><br>";
		
		// Populate list of available Detectors
		var det = "<div class=layer-select-label>Detector: </div> ";
		det += "<select name=detector class=layer-select id='detector-select-" + id + "'>";
		jQuery.each(options.detectors, function (i, o) {
			det += "<option value='" + o.abbreviation + "'";
			if (layer.detector == o.abbreviation) {
				det += " selected='selected'";
			}
			det += ">" + (o.name === "" ? o.abbreviation : o.name) + "</option>";		
		});
		det += "</select><br>";
		
		// Populate list of available Detectors
		var meas = "<div class=layer-select-label>Measurement: </div> ";
		meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'>";
		jQuery.each(options.measurements, function (i, o) {
			meas += "<option value='" + o.abbreviation + "'";
			if (layer.measurement == o.abbreviation) {
				meas += " selected='selected'";
			}
			meas += ">" + o.name + "</option>";		
		});
		meas += "</select><br>";
		
		return (opacitySlide + obs + inst + det + meas);
	},
	
	_addOpacitySlider: function (layer) {
		
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty tile layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span>Layers</span>').css({'float': 'left', 'color': 'black', 'font-weight': 'bold'});
		var addLayerBtn = jQuery('<a href=# class=gray>[Add Layer]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));

		var innerContainer = jQuery('<ul id=TileLayerAccordion></ul>');
		var outerContainer = jQuery('<div id="TileLayerAccordion-Container"></div>').append(innerContainer);
		this.container.append(outerContainer);
		
        // Event-handlers
		var self = this;
		var hv = this.layerManager.controller;
        addLayerBtn.click(function() {
			self.layerManager.addLayer(new TileLayer(hv.viewports[0], { tileUrlPrefix: hv.tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL', startOpened: true }));        	
        });
	},

	/**
	 * @function
	 * @description
	 */
	_setupEventHandlers: function (layer) {
		visibilityBtn = jQuery("#visibilityBtn-" + layer.id);
		removeBtn = jQuery("#removeBtn-" + layer.id);

		// Function for toggling layer visibility
		var toggleVisibility = function (e) {
			var visible = layer.toggleVisible();
			var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')' );
			e.stopPropagation();
		};

		// Function for handling layer remove button
		var removeLayer = function (e) {
			var accordion = e.data;
			accordion.layerManager.removeLayer(layer);
			accordion.domNode.dynaccordion('removeSection', {id: layer.id});
			accordion.layerSettings.unset(layer.id);

			//accordion.layers = accordion.layers.without(layer.id);

			e.stopPropagation();
		};
		
		// Event handlers for select items
		var self = this;
		
		jQuery.each(jQuery('#' + layer.id + ' > div > select'), function (i, item) {
			jQuery(item).change(function(e){
				//alert(this.name + "= " + this.value);
				if (this.name === "observatory") {
					layer.observatory = this.value;
				}
				else if (this.name === "instrument") {
					layer.instrument = this.value;
				}
				else if (this.name === "detector") {
					layer.detector = this.value;
				}
				else if (this.name === "measurement") {
					layer.measurement = this.value;
				}
				
				// Validate new settings and reload layer
				self._onLayerSelectChange(layer, this.name, this.value);
			})
		});

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	},
	
	/**
	 * @function
	 * @param {TileLayer} layer 
	 * @param {String} changed
	 * @description Check to make sure the new layer settings are valid. If the new combination of
	 * choices are not compatable, change values to right of most-recently changed parameter to valid
	 * settings. Once the combination is acceptable, reload the tile layer.
	 */
	_onLayerSelectChange: function (layer, changed, value) {
		// Ajax callback function
		var processResponse = function (transport) {
			// Update options
			this.options = transport.responseJSON;

			// Case 1: Observatory changed
			if (changed === "observatory") {
				this._updateOptions(layer.id, "instrument", this.options.instruments);
				
				//Make sure the instrument choice is still valid.
				if ($A(this.options.instruments).grep(layer.instrument).length == 0) {
					layer.instrument = this.options.instruments[0];
				}
			}
			
			// Case 2: Instrument changed
			if ( (changed === "observatory") || (changed === "instrument") ) {
				this._updateOptions(layer.id, "detector", this.options.detectors);
				
				//Make sure the detector choice is still valid.
				if (!$A(this.options.detectors).find(function(det) {
    				return det.abbreviation == layer.detector;
				})) {
					layer.detector = this.options.detectors[0].abbreviation;
				}
			}
			
			// Case 3: Detector changed
			if ( (changed === "observatory") || (changed === "instrument") || (changed === "detector") ) {
				this._updateOptions(layer.id, "measurement", this.options.measurements);	
				
				//Make sure the measurement choice is still valid.
				if (!$A(this.options.measurements).find(function(meas) {
    				return meas.abbreviation == layer.measurement;
				})) {
					layer.measurement = this.options.measurements[0].abbreviation;
				}
				
				
				//if ($A(this.options.measurements).grep(layer.measurement).length == 0) {
				//	layer.measurement = this.options.measurements[0];
				//}
				/*
				var instVal = $F('instrument-select-' + layer.id);
				if ($A(this.options.instruments).grep(instVal).length == 0) {
					layer.instrument = this.options.instruments[0];
					
					//update selectedIndex
					var self = this;
					$$('#instrument-select-' + layer.id + ' > option').each(function(opt, i) {
						if (opt.value === self.options.instruments[0]) {
							$('instrument-select-' + layer.id).selectedIndex = i;
						}
					});
				}*/
			}
			
			//reload layer settings
			layer.reload();
		};
		
		// Do not need to update options if the measurement is changed
		if (changed !== "measurement") {
			// Update SELECT options
			var obs = (changed === "observatory" ? value : layer.observatory);
			var inst = (changed === "instrument" ? value : layer.instrument);
			var det = (changed === "detector" ? value : layer.detector);
			var meas = (changed === "measurement" ? value : layer.measurement);
			
			// Ajax Request
			var xhr = new Ajax.Request(this.queryURL, {
				method: 'get',
				onSuccess: processResponse.bind(this),
				parameters: {
					observatory: obs,
					instrument: inst,
					detector: det,
					measurement: meas,
					format: "json",
					changed: changed,
					value: value
				}
			});
		}
		else {
			//reload layer settings
			layer.reload();
		}
	},
	
	/**
	 * @function
	 * @description Updates options for a single SELECT element.
	 * @param {String} id
	 * @param {String} field
	 * @param {Array} newOptions
	 */
	_updateOptions: function (id, field, newOptions) {
		//Remove old options
		$$('#' + field + '-select-' + id + ' > option').each(function(o) {
			o.remove();
		});
		
		//Add new options
		var select = $(field + '-select-' + id);
		$A(newOptions).each(function(o) {
			var opt = new Element('option', {value: o.abbreviation}).insert(
				o.name === "" ? o.abbreviation : o.name
			);
			select.insert(opt);
		});
		
	},
    
    /**
     * @method updateTimeStamp
     * @param {SunImage}
     * @param {Int}
     */
    updateTimeStamp: function (layer) {
    	//Grab timestamp dom-node
    	var domNode = $(layer.id).select('.timestamp').first();
    	
        //remove any pre-existing styling
        domNode.removeClassName("timeBehind");
        domNode.removeClassName("timeAhead");
        domNode.removeClassName("timeSignificantlyOff");
                
        // Update the timestamp
        var date = new Date(layer.timestamp * 1000);
        var dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();

        // Calc the time difference
        var timeDiff = layer.timestamp - this.layerManager.controller.date.getTime() / 1000;

        //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
        domNode.update(dateString);
        
        //get timestep (TODO: create a better accessor)
        var ts = this.layerManager.controller.timeStepSlider.timestep.numSecs;
        
        // Check to see if observation times match the actual time
        if (timeDiff < 0) {
        	if (Math.abs(timeDiff) > (4 * ts)) {
        		domNode.addClassName("timeSignificantlyOff");
        	}
        	else {
        		domNode.addClassName("timeBehind");
        	}
        }
        else if (timeDiff > 0) {
        	if (timeDiff > (4 * ts)) {
        		domNode.addClassName("timeSignificantlyOff");
        	}
        	else {
        		domNode.addClassName("timeAhead");
        	}
        }
    },
	
	/**
	 * 
	 * @param {String} id Layer id
	 * @param {String} desc New description to use 
	 */
	updateLayerDesc: function (id, desc) {
		$(id).select("span.tile-accordion-header-left").first().update(desc);
	}
    
});

/**
 * @author Keith Hughitt      keith.hughitt@gmail.com
 * @author Patrick Schmiedel  patrick.schmiedel@gmx.net
 */
/**
 * @class TimeStepSlider A slider for controlling the timestep. For convenience the slider uses indices 
 *                       rather than the actual values, the number of seconds. This is due to the fact 
 *                       that the Scriptaculous Slider is only able to display values linearly but the
 *                       timesteps are spaced at pseudo-logarithmic intervals.
 */
/*global Class, Control, UIElement, document, $, $R */
 
var TimeStepSlider = Class.create(UIElement, {
    /**
     * @constructor
     */
    initialize : function (controller, sliderHandleId, sliderTrackId, backBtn, forwardBtn, timeIncrement, initialIndex) {
        this.controller = controller;
        this.slider = new Control.Slider(sliderHandleId, sliderTrackId,
            {
                axis:        'horizontal',
                range:       $R(1, 10),
                values:      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                sliderValue: initialIndex,
                onChange:    this.onChange.bindAsEventListener(this),
                onSlide:     this.onSlide.bindAsEventListener(this)
            });
        
        //Private member variables
        this.className = "TimeStepSlider";
        this.lastIndex = initialIndex;
        this.timestep =  this.indexToTimeStep(initialIndex);
        
        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Event-handlers
        Event.observe(backBtn, 'click', this.timePrevious.bind(this));
        Event.observe(forwardBtn, 'click', this.timeNext.bind(this));
    },
    
    /**
     * @method indexToTimeStep Maps from the slider index value, a small whole number, to
     *                         a pair representing the number of seconds and a label associated
     *                         with the desired timestep. NOTE: Indices start with one and not zero
     * 						   to avoid an issue relating to scriptaculous's slider implementation.
     * @param   {Int} index The slider index for the current timestep.
     * @returns {Hash} A hash containing he number of seconds and a label for the desired timestep.
     */
    indexToTimeStep: function (index) {
        var timeSteps = [
            {numSecs: 1,      txt: "1&nbsp;Sec"},
            {numSecs: 1,      txt: "1&nbsp;Sec"},
            {numSecs: 60,     txt: "1&nbsp;Min"},
            {numSecs: 300,    txt: "5&nbsp;Mins"},
            {numSecs: 900,    txt: "15&nbsp;Mins"},
            {numSecs: 3600,   txt: "1&nbsp;Hour"},
            {numSecs: 21600,  txt: "6&nbsp;Hours"},
            {numSecs: 43200,  txt: "12&nbsp;Hours"},
            {numSecs: 86400,  txt: "1&nbsp;Day"},
            {numSecs: 604800, txt: "1&nbsp;Week"},
            {numSecs: 2419200, txt: "28&nbsp;Days"}
        ];
        
        return timeSteps[index];
    },
    
   /**
    * @function onChange Called when the slider value is changed.
    * @param {Integer} index  The new slider index value.
    */
    onChange: function (index) {
        if (index !== null) {
            this.timestep = this.indexToTimeStep(index);
            this.fire('timeIncrementChange', this.timestep.numSecs);
        }
    },
    
    /**
     * @method onSlide
     * @param {Integer} index The current slider index.
     */
    onSlide: function (index) {
    	if ((index !== null) && (index !== this.lastIndex)) {
        	this.lastIndex = index;
            $('timestepValueDisplay').update(this.indexToTimeStep(index).txt);
        }
    },
    
    setTimeIncrement: function (timeIncrement) {
        //Debug.output("setTimeInc");
        this.timeIncrement = timeIncrement;
    },   
      
    /**
     * @function timeNext
     */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    },
    
    /**
     * @function timePrevious
     */
    timeNext: function () {
        var newDate = this.controller.date.addSeconds(this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    } 
});
/*global Class, Object, $, UIElement, ViewportHandlers, Builder */
var Viewport = Class.create(UIElement, {
	/**
		This is a Viewport class.
		@name Viewport
		@class Viewport
		@scope Viewport.prototype
	*/ 
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		tileSize: 512,
		debug: false,
		prefetch: 0  //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	dimensions: { width: 0, height: 0 },

	/**
	 * @constructor
	 * @memberOf Viewport
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.domNode =   $(this.id);
		this.innerNode = $(this.id + '-container-inner');
		this.outerNode = $(this.id + '-container-outer');
		this.controller = controller;
		this.ViewportHandlers = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

		//resize to fit screen
		this.resize();

		// Determine center of viewport
		var center = this.getCenter();
		
		//create a aster container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.domNode.appendChild(Builder.node('div', {className: 'movingContainer'})));
		this.movingContainer.setStyle({'left': center.x + 'px', 'top': center.y + 'px'});

		//For Debugging purposes only
		if (this.debug) {
			this.movingContainer.setStyle({'border': '1px solid red'});
			
			var centerBox = new Element('div', {style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
			centerBox.setStyle({'left': (center.x -25) + 'px', 'top': (center.y -25) + 'px'});
			this.domNode.insert(centerBox);
		}
	},
	
	/**
	 * @memberOf Viewport
	 * @function
	 * @name center
	 * @description Centers the viewport.
	 */
	center: function () {
		var center = this.getCenter();
		this.moveTo(center.x, center.y);
	},

	/**
	 * @memberOf Viewport
	 * @function moveTo Move the viewport focus to a new location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */
	moveTo: function (x, y) {
		this.movingContainer.setStyle({
			left: x + 'px',
			top:  y + 'px'    
		});
		
		this.checkTiles();
		this.fire('move', { x: x, y: y });
	},

	/**
	 * @function moveBy Shift in the viewport location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */   
	moveBy: function (x, y) {
		//Debug.output("moveBy: " + x + ", " + y);
		
		var pos = {
			x: this.startMovingPosition.x - x,
			y: this.startMovingPosition.y - y
		};
		
		//Debug.output("pos: " + pos.x + ", " + pos.y);
		
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
		this.checkTiles();
		this.fire('move', { x: pos.x, y: pos.y });
	},
	
	/**
	 * @function startMoving
	 * @description Event-handler for a mouse-drag start.
	 */
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @function getCenter
	 * @description Get the coordinates of the viewport center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth() / 2),
			y: Math.round(this.domNode.getHeight() / 2)
		}
	},
	
	/**
	 * @function getContainerPos
	 * @description Get the current coordinates of the moving container
	 */
	getContainerPos: function () {
		return {
			x: parseInt(this.movingContainer.getStyle('left')),
			y: parseInt(this.movingContainer.getStyle('top'))
		}
	},
	
	/**
	 * @function currentPosition
	 * @description Alias for getContainerPos function
	 */
	currentPosition: function () {
		return this.getContainerPos();
	},
	
	/**
	 * @function helioCenter
	 * @description Another alias for getContainerPos. Returns the pixel coorindates
	 *              of the HelioCenter relative to the viewport top-left corner.
	 */
	helioCenter: function () {
		return this.getContainerPos();
	},

	/**
	 * @function endMoving
	 * @description Event handler fired after dragging
	 */
	endMoving: function () {
	},
	
	/**
	 * @function checkTiles
	 * @description Algorithm for determining which tiles should be displayed at
	 *              a given time. Uses the Heliocentric coordinates of the viewport's
	 *              TOP-LEFT and BOTTOM-RIGHT corners to determine range to display.
	 */
	checkTiles: function() {
		this.visible = [];
		
		var indices = this.displayRange();
		
		// Update visible array
		for (i = indices.xStart; i <= indices.xEnd; i++) {
			for (j = indices.yStart; j <= indices.yEnd; j++) {
				if (!this.visible[i]) {
					this.visible[i] = [];
				}
				this.visible[i][j] = true;
			}
		}
	},
	
	/**
	 * @function displayRange
	 * @description Returns the range of indices for the tiles to be displayed.
	 */
	displayRange: function () {
		// Get heliocentric viewport coordinates
		var vp = this.getHCViewportPixelCoords();
		
		// Expand to fit tile increment
		var ts = this.tileSize;
		vp = {
			top:    vp.top - ts - (vp.top % ts),
			left:   vp.left - ts - (vp.left % ts),
			bottom: vp.bottom + ts - (vp.bottom % ts),
			right:  vp.right + ts - (vp.right %ts)
		}
		
		// Indices to display
		this.visibleRange = {
			xStart: vp.left / ts,
			xEnd:   vp.right / ts,
			yStart: vp.top / ts,
			yEnd:   vp.bottom / ts
		}
		
		return this.visibleRange;
	},


	
	/**
	 * @function getMaxTiles
	 * @description Similar to the TileLayer function "getNumTiles," except that each
	 *              tile layer is checked, and the number of tiles for the largest
	 *              layer is returned.
	 * @see TileLayer.getNumTiles
	 */
	 /**
	getMaxTiles: function () {
		var highestNaturalZoom = 0; //The zoom-level at which for all levels lower, more than four tiles are required
		
		this.layers.each(function (tl) {
			var naturalZoom = parseInt(tl.lowestRegularZoom);
			if (naturalZoom > highestNaturalZoom) {
				highestNaturalZoom = naturalZoom;
			}
		});
		
		var diff = highestNaturalZoom - this.zoomLevel;
		
		if (highestNaturalZoom == 0) {
			Debug.output("Error: No layers! See Viewport.getMaxTiles.");
		}
		
		return Math.max(4, Math.pow(4, 1 + diff));
	},**/
	
	/**
	 * @function intersectsViewport
	 * @description Determines whether a given tile intersects with the viewport
	 * Based off of:
	 * http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
	 */
	 /**
	intersectsViewport: function (vp, tileX, tileY) {
		var ts = this.tileSize;

		// Tile upper-left and bottom-right coords
		var tile = this.getTilePixelCoords(tileX, tileY);

		// Check for intersection
		return ! ( tile.left   > vp.right
				|| tile.right  < vp.left
				|| tile.top    > vp.bottom
				|| tile.bottom < vp.top
		);
	},**/

	/**
	 * @function getTilePixelCoords
	 * @description Takes from tile coordinates (e.g. -1,-1) and returns the pixel coordinates of
	 *              the tiles upper-left corner.
	 */
	 /**
	getTilePixelCoords: function (x, y) {
		var offset = this.getContainerPos();

		return {
			top: offset.y + (y * this.tilesize),
			left: offset.x + (x * this.tilesize),
			bottom: offset.y + ((y+1) * this.tilesize),
			right: offset.x + ((x+1) * this.tilesize)
		}
	},**/

	/**
	 * @function getViewportPixelCoords
	 * @description Returns the coordinates of the upper-left and bottom-right corners of the viewport.
	 */
	getViewportPixelCoords: function () {
		var dimensions = this.domNode.getDimensions();

		return {
			top:  - this.prefetch,
			left: - this.prefetch,
			bottom: dimensions.height + this.prefetch,
			right:  dimensions.width + this.prefetch
		}
	},
	
	/**
	 * @function getHCViewportPixelCoords
	 * @description Returns the heliocentric coordinates of the upper-left and bottom-right
	 *              corners of the viewport.
	 */
	getHCViewportPixelCoords: function () {
		var vp = this.getViewportPixelCoords();
		var hc = this.helioCenter();
		
		vp.top    -= hc.y;
		vp.left   -= hc.x;
		vp.bottom -= hc.y;
		vp.right  -= hc.x;
		
		return vp;
	},

	/**
	 * @function zoomTo
	 * @description Zooms To a specified zoom-level.
	 */
	zoomTo: function (zoomLevel) {
		this.zoomLevel = zoomLevel;

		// reset the layers
		this.checkTiles();
		this.controller.layerManager.resetLayers(this.visible);
	},

	/**
	 * @function resize
	 * @description Adjust viewport dimensions when window is resized.
	 */
	resize: function () {
		// get dimensions
		var oldDimensions = this.dimensions;

		//Update viewport height
		var viewportOuter =  this.outerNode;
		viewportOuter.setStyle ({height: document.viewport.getHeight() - this.headerAndFooterHeight + 'px'});

			this.dimensions = this.domNode.getDimensions();
			
			this.dimensions.width += this.prefetch;
			this.dimensions.height += this.prefetch;
			
			if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
				if (this.controller.layerManager.layers.length > 0) {
					this.checkTiles();
					this.controller.layerManager.resetLayers(this.visible);
				}
			}
	}
});
/*global Class, Object, document, window, Event, $ */
var ViewportHandlers = Class.create({
	startingPosition: { x: 0, y: 0 },
	mouseStartingPosition: { x: 0, y: 0 },
	mouseCurrentPosition: { x: 0, y: 0 },
	moveCounter: 0,
	moveThrottle: 2,

	initialize: function (viewport) {
		this.viewport = viewport;

		//Mouse-related event-handlers
		this.bMouseMove = this.mouseMove.bindAsEventListener(this);
		this.bMouseDown = this.mouseDown.bindAsEventListener(this);
		this.bMouseUp = this.mouseUp.bindAsEventListener(this);

		Event.observe(window, 'mousemove', this.bMouseMove);
		Event.observe(document, 'mousemove', this.bMouseMove);
		Event.observe(this.viewport.domNode, 'mousedown', this.bMouseDown);
		Event.observe(window, 'mouseup', this.bMouseUp);
		Event.observe(document, 'mouseup', this.bMouseUp);

		Event.observe(this.viewport.domNode, 'dblclick', this.doubleClick.bindAsEventListener(this));

		//Keyboard-related event-handlers
		Event.observe(document, 'keypress', this.keyPress.bindAsEventListener(this));
		Event.observe(window, 'keypress', this.keyPress.bindAsEventListener(this));
	},

	mouseDown: function (event) {
		//this.viewport.output('down');n
		this.viewport.isMoving = true;
		this.startingPosition = this.viewport.currentPosition();
		this.mouseStartingPosition = {
			x: Event.pointerX(event), 
			y: Event.pointerY(event)
		};
		this.viewport.domNode.setStyle({ cursor: 'all-scroll' });
		if (this.viewport.domNode.setCapture) {
			this.viewport.domNode.setCapture();
		}
		this.viewport.startMoving();
	},

	doubleClick: function (e) {
		var viewport = this.viewport;
		
		//check to make sure that you are not already at the minimum/maximum zoom-level
		if ((e.shiftKey || (viewport.zoomLevel > viewport.controller.minZoomLevel)) && (viewport.zoomLevel < viewport.controller.maxZoomLevel)) {
			if (e.isLeftClick()) {
				//Compute offset from top-left of browser viewport
				var xOffset = $('left-col').getDimensions().width + Math.round(0.03 * viewport.outerNode.getDimensions().width) + 2;
				var yOffset = $(viewport.headerId).getDimensions().height + Math.round(0.03 * viewport.outerNode.getDimensions().height) + 3;

				// Mouse-coordinates relative to the top-left of the viewport
				var mouseCoords = {
					x: e.pointerX() - xOffset,
					y: e.pointerY() - yOffset
				}

				// Mouse-coordinates relative to the Heliocentric origin
				var containerPos = viewport.getContainerPos();
				var x = mouseCoords.x - containerPos.x;
				var y = mouseCoords.y - containerPos.y;

				viewport.center();				
				this.viewport.startMoving();

				//adjust for zoom
				if (e.shiftKey) {
					viewport.moveBy(0.5 * x, 0.5 * y);
					viewport.controller.zoomControl.zoomButtonClicked(1);
				}
				else {
					viewport.moveBy(2 * x, 2 * y);
					viewport.controller.zoomControl.zoomButtonClicked(-1);
				}
			}
		} else {
			Debug.output("Out of bounds double-click request! See Viewport.js:57");				
		}
	},

	/**
	 * @function keyPress
	 * @description Keyboard-related event-handlers
	 */
	keyPress: function (e) {
		var key = e.keyCode;

		//Ignore event if user is type in an input form field
		if (e.target.tagName !== "INPUT") {

			//Arrow keys (move viewport)
			if (key == 37 || key == 38 || key == 39 || key == 40) {
				this.startingPosition = this.viewport.currentPosition();
				this.viewport.startMoving();
				this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
				if (this.moveCounter !== 0) {
					return;
				}

				//Right-arrow
				if (key == 37) {
					this.viewport.moveBy(8, 0);
				}

				//Up-arrow
				else if (e.keyCode == 38) {
					this.viewport.moveBy(0, 8);
				}
				//Left-arrow
				else if (e.keyCode == 39) {
					this.viewport.moveBy(-8, 0);
				}

				//Down-arrow
				else if (e.keyCode == 40) {
					this.viewport.moveBy(0, -8);
				}
			}
		}
	},

	mouseUp: function (event) {
		//this.viewport.output('up');
		this.viewport.isMoving = false;
		this.viewport.domNode.setStyle({ cursor: 'pointer' });
		if (this.viewport.domNode.releaseCapture) {
			this.viewport.domNode.releaseCapture();
		}
		this.viewport.endMoving();
	},

	keyRelease: function (event) {
		this.viewport.isMoving = false;
		this.viewport.endMoving();
	},

	/**
	 * @function
	 * @description Handle drag events
	 */
	mouseMove: function (event) {
		if (!this.viewport.isMoving) {
			return;
		}

		this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
		if (this.moveCounter !== 0) {
			return;
		}

		this.mouseCurrentPosition = {
			x: Event.pointerX(event), 
			y: Event.pointerY(event)
		};

		this.viewport.moveBy(
			this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
			this.mouseStartingPosition.y - this.mouseCurrentPosition.y
		);
	}
});
/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
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
});//static data used by HelioViewer

__INSTRUMENTS__ = {
    'EIT': {
        'dataAvailability': {
            'startDate': new Date(Date.UTC(2003, 9, 5)),
            'endDate':   new Date(Date.UTC(2003, 9, 6)),
            'minZoom': 12,
            'maxZoom': 20
        },
        
        'measurements': {
            'type': 'wavelength'
        }
    }
};

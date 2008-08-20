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
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Static class. Keeps a cache of retrieved urls.
 */
 
/*global Class, Control, document, $, $A, Ajax, Debug */
var AjaxRequestWrapper = Class.create();

AjaxRequestWrapper.cache = {};

/**
 * @classDescription Wraps a GET url request to contain state
 * information like the url, and simplifies the use by setting some
 * standard behaviour.
 * TODO: Create a non-cached version for retrieving data that is
 * updated frequently.
 */
AjaxRequestWrapper.getCached = Class.create();

AjaxRequestWrapper.getCached.prototype = {
	/**
	 * @constructor 				Creates a new instance and processes the request.
	 * @param {String} url			The url to retrieve.
	 * @param {Function} callback	The function that handles the retrieved data.
	 */
	initialize: function (url, callback) {

		// Closures
		this.url = url;
		this.callback = callback;
		
		// Get any additional arguments for XHR. The first two items of the array are
		// the url and callback function for the XHR. In many cases this.arguments will
		// simply eval to [].
		this.args = $A(arguments).slice(2);

		var self = this;
		
		if (AjaxRequestWrapper.cache[url]) {
			callback.apply(null, $A([AjaxRequestWrapper.cache[self.url]]).concat(self.args));
		} else {
			var onSuccess = function (transport) {
				AjaxRequestWrapper.cache[self.url] = transport.responseText;
				callback.apply(null, $A([AjaxRequestWrapper.cache[self.url]]).concat(self.args));
			};
			
			var onFailure = function (transport) {
				Debug.ajaxFailure(transport, self.url);
			};
			
			var trash = new Ajax.Request(
				url,
				{
					method: 'get',
					onSuccess: onSuccess,
					onFailure: onFailure
				}
			);
		}
	}
};
/**
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
/*global Class*/
var Coordinates = Class.create({});
Coordinates.getOffset = function (fullSize, tileSize) {
//  return (fullSize < tileSize ? Math.round((tileSize - fullSize) / 2) : 0);
	return 0;
};

Coordinates.worldAbs2rel = function (coords, fullSize, tileSize) {
	var offset = Coordinates.getOffset(fullSize, tileSize);
	return {
		x: (coords.x - offset) / fullSize,
    	y: (coords.y - offset) / fullSize
	};
};
  
Coordinates.worldRel2abs = function (coords, fullSize, tileSize) {
	var offset = Coordinates.getOffset(fullSize, tileSize);
	return {
		x: Math.round(coords.x * fullSize) + offset,
		y: Math.round(coords.y * fullSize) + offset
	};
};/**
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
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class DomNodeCache This class manages a cache of DOM nodes to improve loading times.
 */
  /*global Class, $, $A*/
var DomNodeCache = Class.create();

DomNodeCache.prototype = {
	/**
	 * @constructor
	 */
	initialize: function () {
		this.cache = $A([]);
	},
	list: function ()
	{
		return this.cache;
	},

	/**
	 * @function add				Adds a new DOM Node to the cache.
	 * @param {DOM Node} element	The DOM Node to add.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 */
	add: function (element, zoomLevel, xIndex, yIndex) {
		if (!this.cache[zoomLevel]) {
		    this.cache[zoomLevel] = [];
		}
		if (!this.cache[zoomLevel][xIndex]) {
		    this.cache[zoomLevel][xIndex] = [];
		}
		this.cache[zoomLevel][xIndex][yIndex] = element;
	},

	/**
	 * @method				Returns a DOM Node in the cache.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 * @return (DOM Node}		The DOM Node in the cache.
	 */
	get: function (zoomLevel, xIndex, yIndex) {
		if (this.cache[zoomLevel] && this.cache[zoomLevel][xIndex] && this.cache[zoomLevel][xIndex][yIndex]) {
		    return this.cache[zoomLevel][xIndex][yIndex];
		}
		return null;
	},

	/**
	 * @method contains			Returns whether the cache contains an element at the given position.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 * @return {Boolean}			Whether the cache contains an element at the given position.
	 */
	contains: function (zoomLevel, xIndex, yIndex) {
		return (this.cache[zoomLevel]
			 && this.cache[zoomLevel][xIndex]
			 && this.cache[zoomLevel][xIndex][yIndex] ? true : false);
	},
	
	/**
	 * @method zoomLevels	Returns the number of zoom levels in the cache.
	 * @return {Number}		The number of zoom levels.
	 */
	zoomLevels: function () {
		return this.cache.length;
	},
	
	/**
	 * @method clear	Clears the cache.
	 */
	clear: function () {
		this.cache = $A([]);
		return this;
	},
	
	/**
	 * @method remove	Removes all elements from the DOM.
	 */
	remove: function () {
		this.cache.flatten().each(function (element) {
		    if (element && element.parentNode) {
		        element.remove();
		    }
		});
		return this;
	},
	
	/**
	 * @method removeAndClear	Removes all elements from the DOM and clears the cache.
	 */
	removeAndClear: function () {
		this.remove().clear();
	},
	
	/**
	 * @method setStyle		Sets CSS style properties on all elements in the cache.
	 * @param {Hash} style	A Hash of CSS property/value pairs.
	 */
	setStyle: function (style) {
    //Debug.output('setting style', this.cache.flatten().pluck('style').pluck('zIndex'), $H(style).inspect());
		this.cache.flatten().each(function (domNode) {
		    if (domNode && domNode.style) {
		        $(domNode).setStyle(style);
		    }
		});
    //Debug.output('style set', this.cache.flatten().pluck('style').pluck('zIndex'), $H(style).inspect());
	}
};

/*
var TileCache = Class.create();

TileCache.prototype = Object.extend(new DomNodeCache(), {
	initialize: function() {
		this.cache = new Array();
	},
	
	remove: function() {
		this.cache.flatten().each(function(element) { if (element && element.domNode) element.domNode.remove(); });
		return this;
	}
});
*/
/**
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
		detailsEnabled: false,
		windowSize: 86400
	},

	/**
	 * @constructor
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;

		this.id = 'eventlayer' + Math.floor(Math.random() * 100000 + 1);

		this.events = [];

		this.domNode = new Element('div', {style: 'position: absolute; z-index: 1000'});
		viewport.movingContainer.appendChild(this.domNode);

		this.queryEvents();
	},

	queryEvents: function () {
		var processResponse = function (transport) {
			//Remove any existing events
			this.events.each(function (e) {
				e.node.remove();
			});

			this.events = transport.responseJSON;
			this.displayEvents();

			//Use custom tooltips (need to create large tooltip dialog)
			var cssId = this.catalog.sub('::', "_");
			this.viewport.controller.addToolTip(".event." + cssId, {tooltipSize: "large", position: 'topleft', delay: 200, track: true});

			//Add to eventLayer Accordion (if is not already there).
			if (!this.eventAccordion.hasId(this.id)) {
				this.eventAccordion.addLayer(this);
			}
		};

		var xhr = new Ajax.Request('getEvents.php', {
			method: 'get',
			onSuccess: processResponse.bind(this),
			parameters: {
				task: 'getPoi',
				date: this.viewport.controller.date.toISOString().slice(1, -1),
				windowSize: (this.windowSize / 2),
				catalogs: this.catalog
			}
		});
	},

	viewportMove: function () {

	},

	displayEvents: function () {
		var self = this;

		//stylize each event marker based on it's the event type
		this.events.each(function (e) {
			//positioning
			var sunRadius = self.sunRadius0 >> self.viewport.zoomLevel;
			var pos = self.viewport.getContainerRelativeCoordinates(e.sunX * sunRadius, e.sunY * sunRadius);

			//meta info
			var catalogs = self.eventAccordion.eventCatalogs;
			var type = catalogs.get(e.catalogId).eventType;
			var catalogName = catalogs.get(e.catalogId).name;

			//tooltip text (color #003399)
			var content = "<strong>" + type + " " + e.eventId + "</strong><br>" +
						"<p>" + catalogName + "</p><br>" +
						"<strong>start:</strong> " + e.startTime + "<br>" +
						"<strong>end:</strong> " + e.endTime + "<br><br>" +
						"<strong>Position Angle:</strong> " + e.polarCpa + "&deg; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
						"<strong>Width:</strong> " + e.polarWidth + "&deg;";

			//make catalog id CSS-friendly
			var cssId = e.catalogId.sub('::', "_");

			//create html dom-node
			var div = new Element('div', {className: cssId + ' event', style: 'position: absolute; left: ' + (pos.x - 2) + 'px; top: ' + (pos.y - 2) + 'px; z-index: 10', title: " - " + content });

			var details = null;

			//Type-specific handling
			switch (type) {
				case "Active Region":
					div.setStyle({'background': 'url(images/events/activeregion.png)', 'height': '15px', 'width': '15px', 'border': 'none'});
					details = e.eventId;
					break;
				case "CME":
					div.setStyle({'background': 'url(images/events/cme.png)', 'height': '15px', 'width': '15px', 'border': 'none'});
					details = e.startTime;
					break;
				default:
					details = e.startTime;
					break;
			}

			var display = (self.detailsEnabled ? "inline" : "none");

			//Create a hidden node with the events ID to be displayed upon user request
			var detailsNode = new Element('div', {className: 'eventId'}).setStyle({'background': '#4a4a4a', 'color': 'white', 'position': 'absolute', 'top': '15px', 'display': display}).insert(details);
			div.insert(detailsNode);

			e.node = self.domNode.appendChild(div);
		});
	},

	/**
	 * @function toggleDetails
	 * @description show Event Id's on screen
	 */
	toggleDetails: function () {
		this.detailsEnabled = !this.detailsEnabled;
		this.events.each(function(e) {
        	e.node.select('.eventId').first().toggle();
		});
	},

	reload: function () {
		this.queryEvents();
	},

	reset: function () {
		var self = this;
		var sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;

		this.events.each(function (e) {
			var pos = self.viewport.getContainerRelativeCoordinates(e.sunX * sunRadius, e.sunY * sunRadius);
			e.node.setStyle({left: (pos.x - 2) + 'px', top: (pos.y - 2) + 'px' });
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

		//Keep track of layer ID's (eventually will be layermanager's job)
		this.layers = $A([]);
	},

	/**
	 * @function
	 * @description Adds a new entry to the event layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var title = this.eventCatalogs.get(layer.catalog).name;
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=event-accordion-header-left>" + title + "</span><span class=event-accordion-header-right>" + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">CME and AR event data from VSO and CACTus.</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Work-around: adjust the height of the accordion section header to handle overflow
		//var h = $(layer.id).select('.event-accordion-header-left').first().getHeight();
		//$(layer.id).select('.layer-Head').first().setStyle({'height': h + 'px'});

		// Event-handlers
		this._setupEventHandlers(layer);

		//Add layer ID
		this.layers.push(layer.id);
	},


	//@TODO: Move this to the new layer manager.
	getEventCatalogs: function () {
		var self = this;
		var url = "static_data/eventCatalogs.json";

		jQuery.getJSON(url, function(catalogs){
			self.eventCatalogs = new Hash();
			catalogs.each(function (catalog) {
				self.eventCatalogs.set(catalog.id, catalog);

				//Ignore EIT Activity reports for the time being
				if (catalog.id !== "EITPlanningService::EITActivity") {
					self.viewport.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self}));
				}
			});

			//Initial catalogs to load
			//self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::cmelist", eventAccordion: self}));
			//self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::type2cme",  eventAccordion: self}));
			//self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::noaa",  eventAccordion: self}));
			//self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "CACTusService::CACTus",  eventAccordion: self}));

		});
	},

	hasId: function (id) {
		return (this.layers.grep(id).length > 0 ? true : false);
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span>Events</span>').css({'float': 'left', 'color': 'black', 'font-weight': 'bold'});
		var addLayerBtn = jQuery('<a href=#>[Add Events]</a>').css({'margin-right': '14px', 'color': '#9A9A9A', 'text-decoration': 'none', 'font-style': 'italic', 'cursor': 'default'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));

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
			self.viewport.controller.layerManager.remove(self, layer);
			self.domNode.dynaccordion('removeSection', {id: layer.id});

			self.layers = self.layers.without(layer.id);

			e.stopPropagation();
		};

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
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
		defaultPrefetchSize: 512,
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

		this.initViewports();
		this.initUI();
		this.initEvents();
		this.initKeyBoardListeners();
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

		//Event Layer Manager (accordion must come before LayerManager instance...)
		this.eventLayerAccordion = new EventLayerAccordion(this.viewports[0], 'eventAccordion');

		//Tile Layer Managers
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
				//briefly display event id's when user presses d ("details")
				else if (character === "d") {
					self.viewports[0].layers.each(function (layer){
						if (layer.type === "EventLayer") {
								layer.toggleDetails();
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
		}
	}
});
/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
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
};/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class LayerManager A simple layer manager.
 * 
 * @see   LayerManager
 */
/*global Class, UIElement jQuery, LayerManagerMenuEntry, document, $, $A, Option, Debug, Event, Element, Builder,  */
var LayerManager = Class.create(UIElement, {
    /**
     * @constructor
     * @param {viewport} Viewport to associate layer manager with
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
     */
    initialize: function (viewport, htmlContainer) {
        this.className =  "LayerManager";
        this.controller =  viewport.controller;
        this.viewport =    viewport;
        this.container =   $(htmlContainer);
        this.menuEntries = $A([]);
        
        // Call methods to construct initial layer manager menu and setup event-handlers
        this.createMenu();
        this.initEvents();
        
        // Add tooltips for new menu elements
        this.controller.observe(this, 'newToolTip', this.controller.handlers.newToolTip);

        // Add any existing layers to menu
        this.viewport.layers.collect(this.addMenuEntry.bind(this));
    },
    
    /**
     * @method createMenu
     * This method handles setting up an empty layer manager menu, including an "add new layer" button. 
     * Individual layer entries are added via calls to "addMenuEntry."
     */ 
    createMenu: function () {
        // Create menu header and "add layer" button
        this.header =      Builder.node('span', {style: 'float: left; color: black; font-weight: bold; '}, 'Layers');
        this.addLayerBtn = Builder.node('a', {href: '#', style: 'margin-right:14px;', className: 'gray'}, '[Add Layer]');

		// Add the buttons to a div which lies on top of the accordion container (innerContainer)
        var div = Builder.node('div', {style: 'text-align: right'}, [this.header, this.addLayerBtn]);
        this.container.appendChild(div);
        
        // Accordion list (the accordion itself is initialized with a call to "render")
        this.accordionList = Builder.node('ul', {id: 'layerManagerList'});
        
        // Accordion container
        var innerContainer = Builder.node('div', {id: 'layerManager-Container'});
        innerContainer.appendChild(this.accordionList);  
        
        this.container.appendChild(innerContainer);
        
        // Enable dragging of menu items
    	//jQuery('#layerManagerList').sortable({
    	//	axis: "y",
    	//	containment: "parent"
    	//});
    },
    
    /**
     * @method initEvents
     * This method handles setting up event-handlers for functionality related to the menu as a whole,
     * and not for particular layers. This includes adding and removing layers, and handling changes
     * to the layer properties.
     */
    initEvents: function () {
        // Buttons
        Event.observe(this.addLayerBtn, 'click', this.onAddLayerClick.bind(this));
    },
    
    /**
     * @method render Loads/reloads accordion using element inside innerContainer.
     */
    render: function () {
    	if (this.accordionDom) {
    		this.accordionDom.accordion("destroy");
    	}
    	
    	this.accordionDom = jQuery('#layerManager-Container').accordion({
    		active: false,
    		alwaysOpen: false,
    		header:   'div.layer-Head'
    		//animated: 'bounceslide'
    	});
    	
    	//Refresh sortables
    	//jQuery('#layerManagerList').sortable("refresh");
    },

   /**
     * @method addMenuEntry
     * @param {layer} layer (OPTIONAL)
     * This method creates a single entry in the layer manager menu corresponding to the layer associated
     * with "layer." The options to display vary based on the type of layer. Once constructed, the DOM
     * element (a single accordion element) is stored in an array for future referencing, using the same id as that
     * used by the DataNavigator and LayerManager classes.
     */
    addMenuEntry: function (layer) {
    	//NOTE 08-08-2008: Ideally, before this point different functions should be called depending on whether the
    	// layer is an event layer or tile layer. The notion of "menu entries" can be removed entirely. For now however
    	// a simple check will decide how to handle the two. -Keith  
    	if (layer.type === "TileLayer") {
        	this.menuEntries.push(new LayerManagerMenuEntry(this, layer));
    	}
    },
    
    //RENAME ME
    remove: function (layerEntry, layer) {
    	this.menuEntries = this.menuEntries.without(layerEntry);
    	this.viewport.removeLayer(layer);
    },

   /**
    * @method onAddLayerClick Adds an empty layer to the layer manager.
    * 		  When "Add Layer" is clicked, initially only a new menu entry called "New Layer" is created,
    *         with an option to chose an instrument. Once the user chose's an instrument, a new TileLayer
    *         associated with the menu entry is created, and the relevent form fields are displayed.
    */
    onAddLayerClick: function () {
        this.accordionDom.activate(-1); //close all menu entries
        this.addMenuEntry({type: 'NewLayer'});
        this.render();
        this.accordionDom.activate(this.menuEntries.length - 1);
    },
   
    /**
     * @method onLayerAdded
     */
    onLayerAdded: function (type, args) {
        var layer = args[0];
        this.addMenuEntry(layer);
        this.render();
    },
     
    /**
     * @method onLayerRemoved
     */
    onLayerRemoved: function (type, args) {
          
    },
    
    updateTimeStamps: function () {
        this.menuEntries.each(function (menuEntry) {
            menuEntry.updateTimeStamp();
        });
    }
});

  
/*global Class, $, Option, document, $A, Event, Ajax, Element, Builder, Debug, UIElement */
var LayerManagerMenuEntry = Class.create(UIElement, {
    /**
     * @constructor
     */
    initialize: function (layermanager, layer) {
        this.className = "layerManagerMenuEntry";
        this.layermanager = layermanager;
        this.layer = layer;
        this.domNode = Builder.node('li', {className: 'accordionItem'});
        
        // If layer is not set, create an empty "template" layer
        if (layer.type === "NewLayer") {
            this.displayNewLayerOptions();
        }
        else if (layer.type === "TileLayer") {
            this.displayTileLayerOptions();
        }

        this.layermanager.accordionList.appendChild(this.domNode); //Cannot use prototype's insert() method to insert on top. Does not work in IE.
        
        //Add tooltips (has to occur after dom-node has been appended)
        if (layer.type === "TileLayer") {
            this.layermanager.fire('newToolTip', {id: "#" + this.removeBtn.id, params: {position: 'topleft'}});
            this.layermanager.fire('newToolTip', {id: "#" + this.visibilityBtn.id, params: {position: 'topleft'}});
        }

    },
    
    /**
     * @method displayTileLayerOptions
     */
    displayTileLayerOptions: function () {
        if (!this.header) {
            this.header =  this.domNode.appendChild(this.createMenuRowHeader(this.layer));
            this.content = this.domNode.appendChild(this.createMenuRowContent(this.layer));
        }
        else {
            this.header.replace(this.createMenuRowHeader(this.layer));
	        this.content.replace(this.createMenuRowContent(this.layer));
        }
    	this.setupEventHandlers();

        // Check to see if observation time matches the desired time
        this.updateTimeStamp(this.layer);
    },
    
   /**
    * @method displayNewLayerOptions
    */
    displayNewLayerOptions: function () {
        this.header =  Builder.node('div', {className: 'layer-Head'}, "New Layer");
        this.content = Builder.node('div');
        this.domNode.appendChild(this.header);
        this.domNode.appendChild(this.content); 
        
        var xhr  = null;
        var self = this;
        var dn = self.layermanager.controller.dataNavigator;
        
        // query list of available instruments if it is not already available
        if (!dn.data.get('Instruments')) {
            dn.query('Instruments');
        }
        
        
        // create select form-field for instrument choices
        xhr = new Ajax.Updater(this.content, 'getInstruments.php', {
            parameters: {
                type: 'html'
            },
            method: 'get',
            insertion: 'bottom',
            onComplete: function () {
                var selectField = self.content.select('.instrument-select').first();
                
                var onInstChange = function (e) {
                    //Debug.output(e.target.value + " chosen!");
                    // Get info for chosen instrument
                    var chosenInstrument = null;
                    for (var i = 0; i < dn.data.get('Instruments').length; i++) {
                        if (dn.data.get('Instruments')[i].instrument === e.target.value) {
                            chosenInstrument = dn.data.get('Instruments')[i];
                        }
                    }
                    self.layermanager.fire('newLayer', {menuEntry: self, instrument: chosenInstrument});
                };
                Event.observe(selectField, 'change', onInstChange.bind(self));
            }
        });
    },
    
    setupEventHandlers: function () {
        // Function for toggling layer visibility
    	var toggleVisibility = function (e) {
            var visible = this.layer.toggleVisible();
            var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
            this.visibilityBtn.setStyle({ background: 'url(images/blackGlass/' + icon + ')' });
            Event.stop(e);
        };
              
        // Function for handling layer remove button
        var removeLayer = function (e) {
            this.layermanager.remove(this, this.layer);
            Element.remove(this.domNode);
            Event.stop(e);
            this.layermanager.render();
        };
  
        // Event-handlers
        Event.observe(this.visibilityBtn, 'click', toggleVisibility.bindAsEventListener(this));          
        Event.observe(this.removeBtn, 'click', removeLayer.bindAsEventListener(this));          
        this.layer.addObserver('change', this.onLayerChange.bind(this));        
    },
    
   /**
    * @method createMenuRowHeader Creates the header for a header/content pair to be used
    * within a jQuery accordion. The header describes the layer's associated instrument, the
    * timestamp of the current image displayed, and icons for removing the layer and toggling
    * it's visibility.
    * 
    * @param  {Layer}  layer  The tile layer
    * @return {Dom-node} Returns a <div> element with all of the necessary components.
    */
    createMenuRowHeader: function (layer) {
        var header =     Builder.node('div',  {className: 'layer-Head'});
        var instrument = Builder.node('span', {id: 'layer-header-' + layer.id, style: 'float: left; width: 33%;'}, layer.instrument + (layer.instrument === layer.detector ? "" : "/" + layer.detector.trimLeft('0')) + " " + layer.measurement.trimLeft('0'));
      
        //header.appendChild(instrument);

        // Timestampdev/ie_floats/
        var timestamp = Builder.node('span', {className: 'timestamp'});

        // Visibility Toggle
        this.visibilityBtn = Builder.node('button', {
            id: 'visibility-button-' + layer.id,
            className: 'layerManagerBtn visible',
            value: true,
            type: 'button',
            title: ' - Toggle ' + layer.instrument + ' layer visibility.'
        });

        // Layer Removal Button
        this.removeBtn = Builder.node('button', {
            id: 'remove-button-' + layer.id,
            className: 'layerManagerBtn remove', 
            value: true, 
            type: 'button',
            title: ' - Remove layer.'
        });

        // Container for right-aligned elements
        var rightSide = Builder.node('div', {style: 'text-align: right; float: left; width:67%;'}, [timestamp, " |", this.visibilityBtn, this.removeBtn]);
      
  	    // combine left and right containers
  	    var both = Builder.node('div', {style: 'overflow: hidden;' }, [instrument, rightSide]);
  	    header.appendChild(both);
	    
        // header.appendChild(rightSide);
        return header;   
    },
     
    /*
     * @method createMenuRowContent
     * @param {Layer} layer The tile layer.
     * @return {Dom-node} The layer row content
     */
    createMenuRowContent: function (layer) {
    	//Wrapper
    	var body = Builder.node('div', {style: 'color: white;'});
    	
    	//Instrument
    	var instLeft =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Instrument: ');
    	var instRight = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createInstrumentControl(layer));
    	body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'instrument-row-' + layer.id}, [instLeft, instRight]));
    	
    	//Measurement
    	/*
    	if (layer.measurements.length > 1) {
			var left =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Measurement: ');
    		//var right = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createWavelengthControl(layer));
    		//body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'measurement-row-' + layer.id}, [left, right]));
    	}*/
    	
    	//get available measurements for chosen instrument
    	
        //var callBack = this.listMeasurements.bind(this);
        //var xhr = new Ajax.Request('getMeasurements.php', {
        //    onSuccess: callBack,
        //    parameters: {
        //        detector: layer.detector
        //    }
        //});
        /*this.measurementSelect = body.appendChild(Builder.node('div', {style: 'float: left;  width: 100%;'}, " "));*/
    	
    	//Opacity
    	//var opacityLeft = Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Opacity: ');
    	//var opacityRight = Builder.node('div', {style: 'float: right; width: 60%;'},  [this.createOpacityControl(layer.id), "%"]);
        //body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'opacity-row-' + layer.id}, [opacityLeft, opacityRight]));
    	
    	return body;
    },
    
    listMeasurements: function (transport) {
        var response = transport.responseJSON;
        this.layer.measurementType = response[0].type;
        
        this.layer.measurements = $A(response).collect(function (row) {
            return parseInt(row.measurement, 10);
        });
        
        /*this.measurementSelect.update(this.layer.measurementType + ":");*/
        
    },
    
    /**
     * @method createInstrumentControl
     */
    createInstrumentControl: function (layer) {
        var inst = new Element('select', {id: 'instrument-select-' + layer.id, style: 'display: none'});
        inst.length = 0;

        //Available Instruments
        //ToDo: Read availables from maps table, joined on instruments table for names
        var instruments = $A(["EIT", "LASCO"]);
                
        // Populate list of available instruments
        for (var i = 0; i < instruments.length; i++) {
            var opt = new Option(instruments[i]);
            opt.value = instruments[i];
            inst.options[inst.options.length] = opt;
        }
        
        // Set-up event handler to deal with an instrument change
        Event.observe(inst, 'change', this.onInstrumentChange.curry(layer.id));
        
        // Show only text until user clicks on the form item
        //var instText = Builder.node('span', {id: 'instrument-text-' + layer.id}, inst.value);
        var instText = Builder.node('span', {id: 'instrument-text-' + layer.id}, layer.instrument);
        
        /*
        Event.observe(instText, 'click', function (e) {
        	$(e.target).hide();
        	inst.show();
        });
        
        Event.observe(inst, 'blur', function (e) {
        	$(e.target).hide();
        	instText.show();
        }); */
        
        //return [inst, instText];
        return instText;
    },
    
    /**
     * @method onInstrumentChange
     * @param {Int} id
     */
    onInstrumentChange: function (id) {
        //Dom-nodes for layer components
        var header =         $('layer-header-' + id);
        var measurement =    $('wavelength-select-' + id);
        var measurementRow = $('measurement-row-' + id);
        var instText =       $('instrument-text-' + id);
        
        //Non-pretty solution... TODO: Create a function to handle parameter changes..
        if (this.value === "LASCO") {
            measurementRow.hide();
            header.update("LASCO");
        }
        else {
        	header.update(this.value + " " + measurement.value);
        	measurementRow.show();	
        }

        //Update text to be displayed while not active
        instText.update(this.value);
        
        document.instrumentChange.fire(id, this.value);
    },
    
    onLayerChange: function (layer) {
        // ToDo: update the other fields
        this.updateTimeStamp(layer);
    },
    
    /**
     * @method createWavelengthControl
     * @param  {Int} The layer's id.
     * @return {[Dom-node, Dom-node]} Returns a set of two dom-nodes to be inserted into the layer manager.
     */
    createWavelengthControl: function (layer) {
        var id = layer.id;
        var wl = new Element('select', {id: 'wavelength-select-' + id, style: 'display: none'});
        wl.length = 0;

		//Available wavelength choices for EIT
        var wavelengths = $A([171, 195, 284]);
                
        // Populate list of available wavelengths
        for (var i = 0; i < wavelengths.length; i++) {
            var opt = new Option(wavelengths[i]);
            opt.value = wavelengths[i];
            wl.options[wl.options.length] = opt;
        }
        
        // Set-up event handler to deal with an wavelength change
        Event.observe(wl, 'change', this.onWavelengthChange.curry(id));
        
        // Show only text until user clicks on the form item
        //var wlText = Builder.node('span', {id: 'wavelength-text-' + id}, wl.value);
        var wlText = Builder.node('span', {id: 'wavelength-text-' + id}, layer.measurement);
        Event.observe(wlText, 'click', function (e) {
        	$(e.target).hide();
        	wl.show();
        });
        
        // Revert to text display after form field loses focus
        Event.observe(wl, 'blur', function (e) {
        	$(e.target).hide();
        	wlText.show();
        });
        
        return [wl, wlText];
    },
    
    /**
     * Event handler: wavelength change
     */ 
    onWavelengthChange: function (id) {
    	//Update header text
    	var inst =   $('instrument-select-' + id);
    	var header = $('layer-header-' + id);
    	header.update(inst.value + " " + this.value);
    	
        //Update text to be displayed while not active
        $('wavelength-text-' + id).update(this.value);
        
        document.wavelengthChange.fire(id, this.value);
    },
    
    /**
     * @method createOpacityControl Creates the opacity control cell.
     * @param  {layer}      The layer provider associated with the opacity control.
     * @return {HTML Element}       The opacity control cell.
     */
    createOpacityControl: function (id) {
        var opacity = 100;
        var opacityInput = new Element('input', {size: '3', value: opacity});

        Event.observe(opacityInput, 'change', function () {
            document.opacityChange.fire(id, parseInt(this.value, 10) / 100);
        });
		
        return opacityInput;
    },
    
    /**
     * @method createEnabledBox Creates the enabled/disabled cell.
     * @return {HTML Element}   The enabled/disabled cell.
     * @param  {Integer}        The layer's id
     */
    createEnabledBox: function (id) {
        var enabledTd = new Element('td', {style: "padding-left:15px;"});
        var enabled =   new Element('input', {type: 'checkbox', checked: 'true', name: 'enabled'});
        enabledTd.appendChild(enabled);
        
        Event.observe(enabled, 'click', this.onEnabledBoxClick.bind(this, id));
        return enabledTd;
    },
    
    /**
     * @method updateTimeStamp
     * @param {SunImage}
     * @param {Int}
     */
    updateTimeStamp: function () {
        //var id = this.layer.id; 
        if (this.layer.timestamp === undefined) {
        	return;
        }
        
        // Update the timestamp
        var date = new Date(this.layer.timestamp * 1000);
        var dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();
        //this.timeField.value = this.controller.date.toString("HH:mm:ss");

        // Calc the time difference
        var timeDiff = this.layer.timestamp - this.layermanager.controller.date.getTime() / 1000;
        var timeDiffAbs = Math.abs(timeDiff);
        var tdHours = Math.floor(timeDiffAbs / 3600);
        var tdMins = Math.floor((timeDiffAbs - tdHours * 3600) / 60);
        var tdSecs = (timeDiffAbs - tdHours * 3600) - tdMins * 60;
        var sign = (timeDiff === 0 ? '&plusmn;' : (timeDiff > 0 ? '+' : '&minus;'));
        var timeDiffStr = sign + String(tdHours) + ':' + String(tdMins).padLeft(0, 2) + ':' + String(tdSecs).padLeft(0, 2);

        //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
        $(this.domNode).select(".timestamp").first().update(dateString);
        
        // Check to see if observation times match the actual time
        var col = (timeDiff === 0 ? '#FFFFFF' : '#FFFF66');
        $(this.domNode).select(".timestamp").first().setStyle({color: col});
    }
});/**
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
        this.console.update(new Element('p', {style: 'color: #6495ED'}).insert(msg));
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
    observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
    }
});/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var TileLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'TileLayer',
        tileSize: 512,
        opacity: 1
    },
    
    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'tilelayer' + Math.floor(Math.random() * 100000 + 1);
        this.tiles = [];

        // create html container to hold layer
        this.domNode = new Element('div', {style: 'position: absolute;'})
        viewport.movingContainer.appendChild(this.domNode);

        this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.tiles = [];

        if (this.imageId) {
            this.loadImageProperties();
        } else {
            this.loadClosestImage();
        }
    },
    
    reload: function() {
        this.loadClosestImage();
    },

    removeTiles: function () {
        var ix, iy;
        
        if (this.startIndex) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
                    if (this.tiles[ix][iy]) {
                        //this.tiles[ix][iy].remove();
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }    
    },

    reset: function () {
        var ix, iy;
        
        this.removeTiles();
            
        this.numTiles = {
            x: Math.ceil(this.viewport.dimensions.width / this.tileSize) + 1,
            y: Math.ceil(this.viewport.dimensions.height / this.tileSize) + 1
        };
        
        this.startIndex = this.getStartIndex();

        var numTiles = 0;
        
        // Fetch tiles
        for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                var tile = this.getTile(ix, iy, this.viewport.zoomLevel);
                if (!this.tiles[ix]) {
                    this.tiles[ix] = [];
                }
                if (this.tiles[ix][iy]) {
                    //this.viewport.output(this.tiles[ix][iy]);
                }
                this.tiles[ix][iy] = tile;
                numTiles++;
            }
        }

        // Reference old tile nodes to remove after new ones are done loading
        var old = [];
        this.domNode.childElements().each(function (tile) {
            old.push(tile);
        });
        
        var numTilesLoaded = 0;
        
		//jQuery preload
		//jQuery('img.tile').preload({
		//	placeholder:'images/transparent.gif',
		//	notFound:'images/transparent.gif'
		//});

        // Display new tiles
        for (iy = this.startIndex.y; iy < this.startIndex.y + this.numTiles.y; iy++) {
            for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                this.tiles[ix][iy] = $(this.domNode.appendChild(this.tiles[ix][iy]));
                
                //makes sure all of the images have finished downloading before swapping them in
                Event.observe(this.tiles[ix][iy], 'load', function(e){
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
        

    },
    
    setImageProperties: function (imageProperties) {
        //Only load image if it is different form what is currently displayed
        if (imageProperties.imageId === this.imageId) {
        	return;
        }
        Object.extend(this, imageProperties);
        
        //handle opacities for any overlapping images
        this.setInitialOpacity();
        
        // Let others know layer has been added
        this.fire('change', this);
        this.reset();
     },
     
    loadImageProperties: function () {
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        var url = urlPrefix + '?action=getProperties&imageId=' + this.imageId;
        
        var processResponse = function (transport) {
            this.setImageProperties(transport.responseJSON);
        };
        var trash = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },
    
    setImage: function (imageId) {
        if (imageId === this.imageId) {
        	return;
        }
        this.imageId = imageId;
        this.loadImageProperties();
        this.reset();
    },
    
    /**
     * @function setInitialOpacity
     * @description Sets the opacity for the layer, taking into account layers
     *              which overlap one another.
     */
    setInitialOpacity: function () {
    	this.setZIndex(parseInt(this.opacityGroupId));
        var self = this;
        var opacity = 1;
        var counter = 0;
                
        this.viewport.layers.each (function (layer) {
            if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
                counter++;
              
                //Do no need to adjust opacity of the first image
                if (counter > 1) {
                    opacity = opacity / counter;
                    layer.domNode.setOpacity(opacity);
                    layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize})
                }
            }
        });
    },
    
    loadClosestImage: function () {
        var date = this.viewport.controller.date;
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        
        var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
        var processResponse = function (transport) {
            this.setImageProperties(transport.responseJSON);
        };
        var xhr = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },
    
    viewportMove: function (position) {
        var oldStartIndex = this.startIndex;
        var m, newTile; //m = direction to add/remove tiles
        var ix, iy;
        
        //Keep track of left-most column x tile-index & top-most y tile-index to be displayed
        this.startIndex = this.getStartIndex();
        
        // has the index of the left / top image changed?
        if (this.startIndex.x !== oldStartIndex.x) {
            var startIx, endIx;
            if (this.startIndex.x > oldStartIndex.x) {
                // case 1: remove left, add right
                startIx = oldStartIndex.x; //startIndexX
                endIx = this.startIndex.x;    
                m = 1;
            } else if (this.startIndex.x < oldStartIndex.x) {
                // case 2: remove right, add left
                startIx = this.startIndex.x + this.numTiles.x;
                endIx = oldStartIndex.x + this.numTiles.x;
                m = -1;
            }

            //Iterate over columns from left -> right
            for (ix = startIx; ix < endIx; ix++) {
                //For a single column, from top-> bottom ...
                for (iy = oldStartIndex.y; iy < oldStartIndex.y + this.numTiles.y; iy++) {
                    // removes element from dom-node (if parent DNE.. dom-node does not exist)
                    if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) {
                        $(this.tiles[ix][iy]).remove();
                    }
                    var newIx = ix + m * this.numTiles.x;
                    if (!this.tiles[newIx]) {
                        this.tiles[newIx] = [];
                    }
                    // get the tile HTML element
                    newTile = this.getTile(newIx, iy, this.viewport.zoomLevel);

                    // plug it into the DOM tree
                    this.tiles[newIx][iy] = $(this.domNode.appendChild(newTile)); 
                    if (this.tiles[ix] && this.tiles[ix][iy]) {
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }

        if (this.startIndex.y !== oldStartIndex.y) {
            var startIy, endIy;
            if (this.startIndex.y > oldStartIndex.y) {
                // remove top, add bottom
                startIy = oldStartIndex.y;
                endIy = this.startIndex.y;
                m = 1;
            } else if (this.startIndex.y < oldStartIndex.y) {
                // remove bottom, add top
                startIy = this.startIndex.y + this.numTiles.y;
                endIy = oldStartIndex.y + this.numTiles.y;
                m = -1;
            }
            for (iy = startIy; iy < endIy; iy++) {
                for (ix = this.startIndex.x; ix < this.startIndex.x + this.numTiles.x; ix++) {
                    if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) {
                        $(this.tiles[ix][iy]).remove();
                    }
                    var newIy = iy + m * this.numTiles.y;
                    newTile = this.getTile(ix, newIy, this.viewport.zoomLevel);
                    this.tiles[ix][newIy] = $(this.domNode.appendChild(newTile)); 
                    if (this.tiles[ix] && this.tiles[ix][iy]) {
                        delete this.tiles[ix][iy];
                    }
                }
            }
        }
    },
    
    getStartIndex: function () {
        var ts = this.tileSize;
        var v = {
            x: this.viewport.currentPosition.x - this.viewport.dimensions.width / 2,
            y: this.viewport.currentPosition.y - this.viewport.dimensions.height / 2,
            w: this.viewport.dimensions.width,
            h: this.viewport.dimensions.height
        };

        var borderIndex = {
            left: Math.floor(v.x / ts),
            right: Math.floor((v.x + v.w) / ts),
            top: Math.floor(v.y / ts),
            bottom: Math.floor((v.y + v.h) / ts)
        };
        
        if (borderIndex.right - borderIndex.left < this.numTiles.x - 1) {
            if ((v.x % ts) < (ts - (v.x + v.w) % ts)) {
                borderIndex.left -= 1;
            }
            else {
                borderIndex.right += 1;
            }
        }
        if (borderIndex.bottom - borderIndex.top < this.numTiles.y - 1) {
            if ((v.y % ts) < (ts - (v.y + v.h) % ts)) {
                borderIndex.top -= 1;
            }
            else {
                borderIndex.bottom += 1;
            }
        }

        return { x: borderIndex.left, y: borderIndex.top };
    },
    
    getTileUrl: function (x, y, detector, zoom, imageId) {
        if (imageId === undefined) {
        	imageId = '';
        }

        return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&detector=' + detector + '&zoom=' + zoom + '&imageId=' + imageId;
    },
    
    getFullSize: function () {
        return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
    },
    
    getTile: function (x, y) {
        var tilePos = this.viewport.getContainerRelativeCoordinates(x * this.tileSize, y * this.tileSize);
        var left = tilePos.x;
        var top = tilePos.y;
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
    
        img.src = this.getTileUrl(x, y, this.detector, this.viewport.zoomLevel, this.imageId);
    return img;
  }

});/**
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
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		prefetch: 512 //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	currentPosition: { x: 0, y: 0 },
	containerPosition: { x: 0, y: 0 },
	dimensions: { width: 0, height: 0 },

	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.domNode =   $(this.id);
		this.outerNode = $(this.id + '-container-outer');
		this.controller = controller;
		this.layers = $A([]);
		this.ViewportHandlers = new ViewportHandlers(this);

		//combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

		//create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.domNode.appendChild(Builder.node('div', {className: 'movingContainer'})));

		//resize to fit screen
		this.resize();
	},
	
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	/**
	 * @function center Center the viewport.
	 */
	center: function () {
		if (this.layers.length === 0 || !this.layers[0].getFullSize) {
			return this;
		}
		
		this.moveTo(0, 0);
		return this;
	},

	/**
	 * @function moveTo Move the viewport focus to a new location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */
	moveTo: function (x, y) {
		this.currentPosition = {
			x: x,
			y: y
		};
		
		this.moveContainerTo(-x, -y);
		this.fire('move', { x: x, y: y });
	},

	/**
	 * @function moveBy Shift in the viewport location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */   
	moveBy: function (x, y) {
		this.currentPosition = {
			x: this.startMovingPosition.x + x,
			y: this.startMovingPosition.y + y
		};
	
		this.moveContainerBy(-x, -y);
		this.fire('move', { x: this.currentPosition.x, y: this.currentPosition.y });
	},
	
	startMoving: function () {
		this.startMovingPosition = this.currentPosition;
		this.containerStartMovingPosition = this.containerPosition;
	},
	
	endMoving: function () {

	},
	
	// "virtual" container position necessary so we don't have to move it when zooming, which would cause a strange "tile jumping" effect    
	getContainerOffset: function () {
		return {
			x: Math.round(this.dimensions.width / 2 - this.currentPosition.x) - this.containerPosition.x - Math.round(this.prefetch / 2),
			y: Math.round(this.dimensions.height / 2 - this.currentPosition.y) - this.containerPosition.y - Math.round(this.prefetch / 2)
		};
	},
	
	getContainerRelativeCoordinates: function (x, y) {
		var offset = this.getContainerOffset();
		return {
			x: x + offset.x,
			y: y + offset.y
		};
	},
	
	moveContainerBy: function (x, y) {
		this.containerPosition = {
			x: this.containerStartMovingPosition.x + x,
			y: this.containerStartMovingPosition.y + y
		};
		this.movingContainer.setStyle({
			left: this.containerPosition.x + 'px',
			top:  this.containerPosition.y + 'px'    
		});
	},
	
	moveContainerTo: function (x, y) {
		this.containerPosition = {
			x: x,
			y: y
		};
		this.movingContainer.setStyle({
			left: this.containerPosition.x + 'px',
			top:  this.containerPosition.y + 'px'    
		});
	},
	
	zoomToAt: function (zoomLevel, zoomPointCoordinates) {
		//Debug.output("zoomToAt( " + zoomLevel + ", {x: " + zoomPointCoordinates.x + ", y: " + zoomPointCoordinates.y + "});");
		
		// multiplier
		var m = Math.pow(2, -zoomLevel + this.zoomLevel);
		
		// zoom
		this.zoomLevel = zoomLevel;
		
		// move the viewport so that its center is on the same point as before
		var newZoomPointCoordinates = {
			x: m * zoomPointCoordinates.x,
			y: m * zoomPointCoordinates.y
		};
		
		// reset the layers
		this.resetLayers();
	},
	
	zoomInAt: function (zoomPointCoordinates) {
		this.zoomToAt(this.zoomLevel - 1, zoomPointCoordinates);
	},
	
	zoomOutAt: function (zoomPointCoordinates) {
		this.zoomToAt(this.zoomLevel + 1, zoomPointCoordinates);
	},
	
	zoomTo: function (zoomLevel) {
		//temporarily hard-coded for testing purposes (06-10-08)...
		var LASCO_MIN_ZOOMLEVEL = 12;
		
		//Debug.output("zoomLevel: " + zoomLevel);
		if (zoomLevel == LASCO_MIN_ZOOMLEVEL - 1) {
			//this.fire('info', "There is no more LASCO C2s data available at this zoom-level.");
		}
		this.zoomToAt(zoomLevel, this.currentPosition);
	},
	
	zoomIn: function () {
		this.zoomTo(this.zoomLevel - 1);
	},

	zoomOut: function () {
		this.zoomTo(this.zoomLevel + 1);
	},

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
				this.resetLayers();
			}
	},

	reload: function () {
	    this.layers.each(function (layer) {
	    	layer.reload();
	    });
	},

	resetLayers: function () {
		this.layers.each(function (layer) {
			layer.reset();
		});
	},

	getMaxZoomLevel: function () {
		if (this.layers[0].maxZoomLevel) {
			return this.layers[0].maxZoomLevel;
		}
		return 0;
	},

	getMinZoomLevel: function () {
		if (this.layers[0].minZoomLevel) {
			return this.layers[0].minZoomLevel;
		}
		return 0;
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
        this.startingPosition = this.viewport.currentPosition;
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
                
                //Determine the location of 0,0 in the viewport
                var origin = {
                    x: Math.round(viewport.domNode.getDimensions().width / 2),
                    y: Math.round(viewport.domNode.getDimensions().height / 2)
                }
                
                //New location to center about before zooming
                var x = (e.pointerX() - xOffset) - origin.x;
                var y = (e.pointerY() - yOffset) - origin.y;
                
                viewport.moveTo(-x,-y);
                
                //Initiate zoom
                e.shiftKey ? viewport.controller.zoomControl.zoomButtonClicked(1) : viewport.controller.zoomControl.zoomButtonClicked(-1);
            }         
        } else {
            Debug.output("Out of bounds double-click request! See Viewport.js:57");                
        }
    },
    
    keyPress: function (e) {
        var key = e.keyCode;
        
        //Ignore event if user is type in an input form field
        if (e.target.tagName !== "INPUT") {
       
            //Arrow keys (move viewport)
            if (key == 37 || key == 38 || key == 39 || key == 40) {
                this.startingPosition = this.viewport.currentPosition;
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
     
    mouseMove: function (event) {
        //this.viewport.output('move');
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

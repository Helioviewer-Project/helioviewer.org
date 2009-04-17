/**
 * @fileOverview Definition of a simple AJAX Request Loading Indicator UI component
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
 /*global Class, Ajax, $*/
var LoadingIndicator = Class.create(
	/** @lends LoadingIndicator.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new LoadingIndicator
	 */
	initialize: function () {
		this.loadingItems = [];
		
		Ajax.Responders.register({
            onCreate:   this.loadingStarted.bind(this, 'Ajax'),
		    onComplete: this.loadingFinished.bind(this, 'Ajax')
		});
	},

	/**
	 * @description Display the loading indicator
	 */
	show: function () {
		//Effect.Appear($('loading'), { duration: 1 });
		$('loading').show();
	},
	
	/**
	 * @description Hide the loading indicator
	 */
	hide: function () {
		//Effect.Fade($('loading'), { duration: 1 });
		$('loading').hide();
	},
	
	/**
	 * @description Reset the loading indicator
	 */
	reset: function () {
		this.loadingItems.length = 0;
		this.hide();
	},
	
	/**
	 * @description Add an AJAX request to the loading stack
	 * @param {Object} e Event
	 */
	loadingStarted: function (e) {
		this.show();
		this.loadingItems.push({});
	},
	
	/**
	 * @description Remove an AJAX request from the loading stack
	 * @param {Object} i Item to remove
	 */
	loadingFinished: function (i) {
		this.loadingItems.pop();
		if (this.loadingItems.length === 0) {
		    this.hide();
		}
	}
});/**
 * @fileOverview Contains the class definition for an UIElement class.
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
 /*global Class, $A */
var UIElement = Class.create(
	/** @lends UIElement.prototype */
	{
	/**
 	 * @description Enables inheriting classes to use the "event/notification" system
 	 * @constructs
 	 */
	initialize: function () {},
	
	/**
	 * @description Adds an event observer
	 * @param {String} eventName The name of the event to look for 
	 * @param {Function} callback The function to execute when the event occurs
	 */
	addObserver: function (eventName, callback) {
	    if (!this.observers) {
	    	this.observers = [];
	    }
	    if (!this.observers[eventName]) {
		    this.observers[eventName] = $A([]);
	    }
	    this.observers[eventName].push(callback);
	    return this;
	},

	/**
	 * @describe Fires a specific event
	 * @param {String} eventName The name of the event to trigger
	 * @param {Object} eventParameters The parameters to pass along with the event
	 */
	fire: function (eventName, eventParameters) {
		//$('output').innerHTML = eventName + ': ' + eventParameters;
	    if (!this.observers || !this.observers[eventName] || this.observers[eventName].length === 0) {
			return this;
	    }
	    this.observers[eventName].each(function (callback) {
	    	callback(eventParameters);
	    });
	    return this;
	}
});/**
 * @fileOverview "Abstract" Layer class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Layer, Class, UIElement, Element, $ */
var Layer = Class.create(UIElement, 
	/** @lends Layer.prototype */
	{
	maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
	minZoomLevel: 10,
	visible: true,

	/**
	 * @constructs
	 * @description Creates a new Layer
	 * @param {Object} viewport Viewport to place the layer in
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>maxZoomLevel</b>	-  Maximum zoom level supported by the layer<br>
	 *      <b>minZoomLevel</b>	- Minimum zoom level supported by the layer<br>
	 *		<b>visible</b> - The default layer visibility<br>
	 * </div>
	 */
	initialize: function (viewport) {
		this.viewport = viewport;
		this.domNode = $(viewport.movingContainer.appendChild(new Element('div')));
		this.viewport.addObserver('move', this.viewportMove.bind(this));
		this.id = 'layer' + Math.floor(Math.random() * 100000 + 1);
	},

	/**
	 * @description Adjust the Layer's z-index 
	 * @param {Object} val Z-index to use
	 */
	setZIndex: function (val) {
		this.domNode.setStyle({ zIndex: val });
	},

	/**
	 * @description Sets the Layer's visibility
	 * @param {Boolean} visible Hide/Show layer 
	 * @returns {Boolean} Returns new setting
	 */
	setVisible: function (visible) {
		this.visible = visible;
		this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
		return this.visible;
	},

	/**
	 * @description Toggle layer visibility
	 */
	toggleVisible: function () {
		return this.setVisible(!this.visible);
	}
});/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class extends the base jQuery UI datepicker to provide some basic data-binding and enable the class to work more efficiently with Helioviewer.
 * @see ui.datepicker.js
 * 
 * Syntax: jQuery, Prototype
 */
/*global Class, Calendar, $, UIElement, jQuery, window */
var Calendar = Class.create(UIElement,
	/** @lends Calendar.prototype */
	{
	/**
	 * @description Creates a new Calendar. 
	 * @param {Object} controller Reference to the controller class (Helioviewer).
	 * @param {String} dateFieldId The ID of the date form field associated with the Calendar.
	 * @param {String} timeFieldId The ID of the time form field associated with the Calendar.
	 * @constructs 
	 */ 
    initialize: function (controller, dateFieldId, timeFieldId) {
        this.controller = controller;
        this.dateField = $(dateFieldId);
        this.timeField = $(timeFieldId);
        
        var self = this;
        this.cal = jQuery("#" + dateFieldId).datepicker({
            buttonImage: 'images/blackGlass/calendar_small.png',
            buttonImageOnly: true,
			buttonText: "Select a date.",
            changeYear: true,
            dateFormat: 'yy/mm/dd',
            mandatory: true,
            showOn: 'both',
            yearRange:  '1998:2009',
            onSelect: function (dateStr) {
                window.setTimeout(function () {
                    var time = self.timeField.value,
                    	date = Date.parse(dateStr),
                    	
						//Factor in time portion of timestamp
						hours =   parseInt(time.substring(0, 2), 10),
                    	minutes = parseInt(time.substring(3, 5), 10),
                    	seconds = parseInt(time.substring(6, 8), 10),
                    
                    	//Convert to UTC
                    	utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds));
                    
                    self.fire('observationDateChange', utcDate);
                }, 500);
                
            }
        });
        
        // Mouse-over effect
        jQuery('.ui-datepicker-trigger').hover(
            function() {
                jQuery(this).attr("src", "images/blackGlass/calendar_small-hover.png");
            },
            function () {
                jQuery(this).attr("src", "images/blackGlass/calendar_small.png");                
            }
        );
    },
    
	/**
	 * @description Updates the HTML form fields associated with the calendar.
	 */
    updateFields: function () {
        // Set text-field to the new date
        this.dateField.value = this.controller.date.toYmdUTCString();
        this.timeField.value = this.controller.date.toHmUTCString();
    }
});
/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview Contains the class definition for an EventLayer class.
 * @see Layer, TileLayer
 *
 * Syntax: jQuery, Prototype
 */
/*global Class, Layer, EventLayer, $, jQuery, $A, Ajax, Element, EventMarker, navigator */
var EventLayer = Class.create(Layer,
	/** @lends EventLayer.prototype */
	{
	/**
	 * @description Default EventLayer options<br><br>
	 * <strong>Notes:</strong><br><br>
	 * "sunRadius0" refers to the Sun's radius at zoom-level 0, in pixels = 94 * 2^12.<br>
	 * "windowSize" refers to the size of the window (in seconds) from which events should be displayed.<br>
	 */
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
	 * @constructs
	 * @description Creates a new EventLayer.
	 * @param {Object} viewport A reference to Helioviewer's viewport.
	 * @param {Object} options The event layer settings.
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;

		this.id = 'eventlayer' + new Date().getTime();

		this.events = $A([]);

		this.domNode = new Element('div', {className: 'event-layer'});
		this.viewport.movingContainer.appendChild(this.domNode);
	
		// Add to eventLayer Accordion (if is not already there).
		this.eventAccordion.addLayer(this);
		
		this.queryEvents();
	},

	/**
	 * @description Sends an AJAX request to get a list of events.
	 */
	queryEvents: function () {
		// Ajax responder
		var processResponse = function (transport) {
			this.clear();
			if (transport.responseJSON) {
				this.displayEvents(transport.responseJSON);
			}			
		},
			xhr, queryDate = null;
		
		// Work-around: In Firefox 3.1, Date.toISOString() Returns single-quoted strings
		// http://code.google.com/p/datejs/issues/detail?id=54
		if (navigator.userAgent.search(/3\.5/) !== -1) {
			queryDate = this.viewport.controller.date.toISOString();
		}
		else {
			queryDate = this.viewport.controller.date.toISOString().slice(1, -1);
		}

		// Ajax request
		xhr = new Ajax.Request(this.viewport.controller.api, {
			method: 'POST',
			onSuccess: processResponse.bind(this),
			parameters: {
				action: 'getEvents',
				date: queryDate,
				windowSize: this.windowSize,
				catalogs: this.catalog
			}
		});
	},

	/**
	 * @description Place-holder for an event-handler which will handle viewportMove events.
	 */
	viewportMove: function () {

	},
	
	/**
	 * @description Removes all events from the screen and clears event container
	 */
	clear: function () {
		this.events.each(function (e) {
			e.remove();
		});
		this.events.clear();
	},

	/**
	 * @description Draws events to screen
	 * @param {JSON} jsonEvents An JSON array of event meta-information
	 */
	displayEvents: function (jsonEvents) {
		var self = this,
			date = this.viewport.controller.date,
			UTCOffset = - parseInt(date.getTimezoneOffset(), 10) * 60,
			sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;
		
		// Stylize each event marker based on it's the event type
		$A(jsonEvents).each(function (event) {
			self.events.push(new EventMarker(self, event, date, UTCOffset, sunRadius, {offset: self.eventMarkerOffset}));
		});
	},
	
	/**
	 * @description Updates the icon associated with the EventLayer.
	 * @param {String} newIcon New icon to use.
	 */
	updateIcon: function (newIcon) {
		this.icon = "small-" + newIcon;
		var type = this.eventAccordion.eventCatalogs.get(this.catalog).eventType.gsub(' ', "_"),
			url = 'url(images/events/small-' + newIcon + '-' + type + '.png)';
		
		// Update event markers
		this.events.each(function (event) {
			event.marker.setStyle({
				'background': url
			});
		});
		
		// Update event accordion icon
		jQuery('#event-icon-' + this.id).css('background', url);
		
		// Update user's stored settings
		this.eventAccordion.eventIcons[this.catalog] = "small-" + newIcon;
		this.viewport.controller.userSettings.set('event-icons', this.eventAccordion.eventIcons);
	},

	/**
	 * @description Toggle event label visibility
	 */
	toggleLabelVisibility: function () {
		this.displayLabels = !this.displayLabels;
		this.events.each(function (e) {
        	e.toggleLabel();
		});
	},

	/**
	 * @description Reload event-layer
	 */
	reload: function () {
		this.queryEvents();
	},

	/**
	 * @description Reset event-layer
	 */
	reset: function () {
		var sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;

		this.events.each(function (e) {
			e.refresh(sunRadius);
		});
	}
});
/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview Contains the class definition for an EventLayerAccordion class.
 * @see EventLayer, LayerManager, TileLayerAccordion
 * @requires ui.dynaccordion.js
 * 
 * Syntax: jQuery, Prototype
 */
/*global Class, EventLayerAccordion, $, jQuery, Ajax, Event, EventLayer, Hash, IconPicker, Layer */
var EventLayerAccordion = Class.create(Layer,
	/** @lends EventLayerAccordion.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new EventLayerAccordion
	 * @param {Object} viewport A reference to Helioviewer's viewport.
	 * @param {String} containerId The ID of the container where the EventLayerAccordion should be placed.
	 */
	initialize: function (viewport, containerId) {
		this.viewport = viewport;
		this.container = jQuery('#' + containerId);
		
		// Default icons
		this.eventIcons = this.viewport.controller.userSettings.get('event-icons');

		// Setup menu UI components
		this._setupUI();
		
		// Setup icon-picker
		this.iconPicker = new IconPicker('event-icon-menu');

		// Initialize accordion
		this.domNode = jQuery('#EventLayerAccordion-Container');
		this.domNode.dynaccordion();

		// Get Event Catalogs
		this.getEventCatalogs();
	},

	/**
	 * @description Adds a new entry to the event layer accordion
	 * @param {Object} layer EventLayer to add to the accordion.
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var catalog = this.eventCatalogs.get(layer.catalog),		
			etype = catalog.eventType.gsub(' ', '_'),
			icon, visibilityBtn, removeBtn, head, body;
		
		layer.icon = this.eventIcons[catalog.id] || 'small-blue-circle';
		
		icon = "<span class=accordion-header-divider>|</span><button class='event-accordion-icon' id='event-icon-" + layer.id + "' style='background: url(images/events/" + layer.icon + "-" + etype + ".png);'></button>";
		visibilityBtn = "<span class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' title='toggle layer visibility'></span>";
		removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + layer.id + "' type=button title='remove layer'></span>";
		head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + icon + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		body = '<div style="color: white; position: relative;">' + catalog.description + '</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Event-handlers
		this._setupEventHandlers(layer);
	},

	/**
	 * @description Get a list of the available event catalogs.
	 */
	getEventCatalogs: function () {
		//@TODO: Move this to the new layer manager.
		
		// Ajax responder
		var processResponse = function (transport) {
			var lm = this.viewport.controller.layerManager,
				catalogs = transport.responseJSON,
				self = this
			
			if (typeof(catalogs) !== "undefined") {
				this.eventCatalogs = new Hash();
				
				catalogs.each(function (catalog) {
					//Ignore EIT Activity reports for the time being
					if (catalog.id !== "EITPlanningService::EITActivity") {
						self.eventCatalogs.set(catalog.id, catalog);
					}
				});
				
				//Initial catalogs to load
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "VSOService::cmelist",
					eventAccordion: this
				}));
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "GOESXRayService::GOESXRay",
					eventAccordion: this
				}));
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "VSOService::noaa",
					eventAccordion: this,
					windowSize: 86400
				}));
			} else {
				this._catalogsUnavailable();
			}
		},

		xhr = new Ajax.Request(this.viewport.controller.api, {
			method: "POST",
			parameters: { action: "getEventCatalogs" }, 
			onSuccess: processResponse.bind(this)
		});
	},

	/**
	 * @description Setup empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span class="section-header">Features/Events</span>').css({'float': 'left'}),
			addLayerBtn = jQuery('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'}),
			self = this;
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="EventLayerAccordion-Container"></div>'));
		
		// Event-handlers
		addLayerBtn.click(function () {
			if (typeof(self.eventCatalogs) !== "undefined") {
				//Populate select-box
				var select = self._buildCatalogSelect(),
				
					okayBtn = "<button>Ok</button>",
				
					//Add to accordion
					tmpId = 'tmp' + new Date().getTime();
				self.domNode.dynaccordion("addSection", {
					id: tmpId,
					header: '<div class="layer-Head">Select catalog to use:</div>',
					cell: select + okayBtn,
					open: true
				});
				
				// Swap out for feature/event catalog when user changes
				Event.observe($(tmpId).select('button').first(), 'click', function (e) {
					var select = $(tmpId).select('select').first();
					self.domNode.dynaccordion('removeSection', {
						id: tmpId
					});
					self.viewport.controller.layerManager.addLayer(new EventLayer(self.viewport, {
						catalog: select.value,
						eventAccordion: self
					}));
				});
			} else {
				//Do nothing
			}
		});
	},
	
	/**
	 * @description Builds a SELECT menu with all the catalogs not already displayed.
	 */
	_buildCatalogSelect: function () {
		var self = this,
			select = "<select class='event-layer-select' style='margin:5px;'>";

		this.eventCatalogs.each(function (catalog) {
			if (!self.viewport.controller.layerManager.hasEventCatalog(catalog.key)) {
				select += "<option value=" + catalog.key + ">" + catalog.value.name + "</option>";
			}
		});
		select += "</select>";
		
		return select;
	},
	
	/**
	 * @description Display error message to let user know service is down.
	 */
	_catalogsUnavailable: function () {
		// Handle button
		$('eventAccordion').select('a.gray')[0].update("");
		
		// Error message
		var head = "<div class='layer-Head'>Currently Unavailable</div>",
			body = "<span style='color: #FFF;'>Helioviewer's Feature/Event catalog system is currently unavailable. Please try again later.</span>";
		this.domNode.dynaccordion("addSection", {id: 404, header: head, cell: body});
	},

	/**
	 * @description Sets up UI-related event handlers
	 * @param {Object} layer EventLayer being added to the accordion.
	 */
	_setupEventHandlers: function (layer) {
		var visibilityBtn = jQuery("#visibilityBtn-" + layer.id),
			removeBtn = jQuery("#removeBtn-" + layer.id),
			eventIcon = jQuery("#event-icon-" + layer.id),
			self = this,

		/**
		 * @inner
		 * @description Toggles layer visibility
		 * @param {Object} e jQuery Event Object.
		 */
		toggleVisibility = function (e) {
			var visible = layer.toggleVisible(),
				icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')');
			e.stopPropagation();
		},

		/**
		 * @inner
		 * @description Layer remove button event-handler
		 * @param {Object} e jQuery Event Object.
		 */
		removeLayer = function (e) {
			var self = e.data;
			self.viewport.controller.layerManager.removeLayer(layer);
			self.domNode.dynaccordion('removeSection', {id: layer.id});
			e.stopPropagation();
		},
		
		/**
		 * @inner
		 * @description Icon selection menu event-handler
		 * @param {Object} e jQuery Event Object.
		 */
		showIconMenu = function (e) {
			layer = e.data;
			self.iconPicker.toggle(layer, jQuery(this).position());
			e.stopPropagation();
		};

		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
		eventIcon.bind('click', layer, showIconMenu);
	}
});

/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 * 
 * Syntax: Prototype
 */
/*global EventMarker, Class, $, $$, $H, Element, Event, Tip */
var EventMarker = Class.create(
	/** @lends EventMarker.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new EventMarker
	 * @param {Object} eventLayer EventLayer associated with the EventMarker
	 * @param {JSON} event Event details
	 * @param {Date} date The date when the given event occured
	 * @param {Int} utcOffset The UTC offset for the system's local time 
	 * @param {Int} sunRadius The radius of the sun in pixels
	 * @param {Object} options Extra EventMarker settings to use
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
		};
		
		this.container = this.eventLayer.domNode.appendChild(
			new Element('div', {className: 'event', style: 'left: ' + (this.pos.x) + 'px; top: ' + (this.pos.y) + 'px;'})
		);
				
		//Create dom-nodes for event marker, details label, and details popup
		this.createMarker();
		this.createLabel();
		this.createPopup();
	},
	
	/**
	 * @description Creates the marker and adds it to the viewport
	 */
	createMarker: function () {
		//make event-type CSS-friendly
		var cssType = this.type.gsub(' ', "_"),
		
		//create html dom-node
		marker = new Element('div', {className: 'event-marker'});
		
		marker.setStyle({
			'background': 'url(images/events/' + this.eventLayer.icon + "-" + cssType + '.png)'
		});
		
		//var self = this;
		//marker.observe('click', function(event) {
		//	self.togglePopup();
		//});
		
		this.marker = marker;
		
		this.container.appendChild(marker);
	},
	
	/**
	 * @description Creates a small block of text which is displayed when the user pressed the "d" key ("details").
	 */
	createLabel: function () {
		var display = this.eventLayer.viewport.controller.layerManager.getLabelVisibility(),
			labelText = this.getLabelText(this.type),
		
			//Determine time difference between desired time and event time
			eventDate = Date.parse(this.time.startTime.substr(0, 19)).addSeconds(this.utcOffset),
			timeDiff = eventDate.getTime() - this.appDate.getTime(),
		
			//Create a hidden node with the events ID to be displayed upon user request
			label = new Element('div', {className: 'event-label'}).setStyle({'display': display}).insert(labelText);
		
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
	 * @description Choses the text to display in the details label based on the type of event
	 * @param {String} eventType The type of event for which a label is being created
	 */
	getLabelText: function (eventType) {
		var labelText = null;
		
		switch (eventType) {

		case "Active Region":
			labelText = this.eventId;
			break;
		case "CME":
			labelText = this.time.startTime;
			break;
		case "Type II Radio Burst":
			labelText = this.time.startTime;
			break;
		default:
			labelText = this.time.startTime;
			break;
		}
		
		return labelText;
	},
	
	/*
	createPopup: function () {
		var properties = $H(this.properties);

		var size = (properties.size() > 2 ? 'larger' : 'large');

		//popup
		var popup = new Element('div', {className: 'event-popup tooltip-topleft-' + size, style: 'display: none;'});
		var content = "<div class='event-popup-container'>" + 
					"<strong>" + this.type + " " + this.eventId + "</strong><br>" +
					"<p>" + this.catalogName + "</p><br>" +
					"<strong>start:</strong> " + this.time.startTime + "<br>" +
					"<strong>end:</strong> " + this.time.endTime + "<br><br>" +
					"<strong>Position Angle:</strong> " + this.polarCpa + "&deg; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
					"<strong>Width:</strong> " + this.polarWidth + "&deg;<br>";
		properties.keys().each(function(key){
			content += "<strong>" + key + ":</strong> " + properties.get(key) + "<br>";
		});		
		content += "<strong>Source:</strong> <a href='" + this.sourceUrl + "' class='event-url' target='_blank'>" + this.sourceUrl + "</a><br></div>";
		
		popup.update(content);
		
		//close button
		var closeBtn = new Element('a', {className: 'event-popup-close-btn'}).insert("x");
		closeBtn.observe('click', this.togglePopup.bind(this));
		popup.insert(closeBtn);
		
		this.popup = popup;
		this.container.appendChild(popup);			
	},*/
	
	/**
	 * @description Creates a popup which is displayed when the event marker is clicked
	 */
	createPopup: function () {
		var properties = $H(this.properties), t,
			content = "<div class='event-popup-container'>" + 
					"<strong>" + this.type + " " + this.eventId + "</strong><br>" +
					"<p>" + this.catalogName + "</p><br>" +
					"<strong>start:</strong> " + this.time.startTime + "<br>" +
					"<strong>end:</strong> " + this.time.endTime + "<br><br>";
					
					//"<strong>Position Angle:</strong> " + this.polarCpa + "&deg; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
					//"<strong>Width:</strong> " + this.polarWidth + "&deg;<br>";
					
		properties.keys().each(function (key) {
			content += "<strong>" + key + ":</strong> " + properties.get(key);
			if (key.search(/angle/i) !== -1) {
				content += "&deg;";
			} 
			content += "<br>";
		});
		content += "<strong>Source:</strong> <a href='" + this.sourceUrl + "' class='event-url' target='_blank'>" + this.sourceUrl + "</a><br></div>";
		
		t = new Tip(this.container, content, {
			title: 'Details:',
			style: 'protogrey',
			stem: 'topLeft',
			closeButton: true,
			showOn: 'click',
			hideOn: 'click',
			hook: { target: 'bottomRight', tip: 'topLeft' },
			offset: { x: 14, y: 14 }
		});

		//Work-around: Move the tooltip dom-node into the event-marker node so that is follows when dragging.
		this.container.observeOnce('click', function (e) {
			var tip = $$('body > .prototip');
			//IE7: above selector doesn't always return hit 
			if (tip.length > 0) {
				this.insert(tip.first().remove().setStyle({'top': '12px', 'left': '8px'}));
				Event.observe(this, 'click', function (e) {
					$(this.select('.prototip')).first().setStyle({'top': '12px', 'left': '8px'});
				});
			}
		});

		/*
		// jQuery implementation
		jQuery(this.container).one('click', function(e) {
			this.insert($$('body > .prototip').first().remove().setStyle({'top': '12px', 'left': '8px'}));
			Event.observe(this, 'click', function (e) {
				this.select('.prototip').first().setStyle({'top': '12px', 'left': '8px'});
			});
		});*/
		
		/*	
		// Alternative Prototype implementation:	
		Event.observe(this.container, 'click', function(e) {
			if ($$('body > .prototip').length > 0) {
				e.target.insert($$('body > .prototip').first().remove());
			}
			e.target.select('.prototip').first().setStyle({
					'top': '15px',
					'left': '15px'
			});
		});*/
	},
	
	/**
	 * @description Removes the EventMarker
	 */
	remove: function () {
		this.container.remove();
	},

	 /**
	  * @description Redraws event
	  * @param {Int} sunRadius The updated solar radius, in pixels.
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
	 * @description Toggle event popup visibility
	 */	
	togglePopup: function () {
		this.popup.toggle();
	}
});
/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class extends the base Simile Timeline
 * @see http://code.google.com/p/simile-widgets/
 * 
 * Syntax: Prototype
 */
/*global Class, $, EventTimeline, Timeline, UIElement, window */
var EventTimeline = Class.create(UIElement,
	/** @lends EventTimeline.prototype */
	{
	/**
	 * @description Creates a new EventTimeline. 
	 * @param {Object} controller Reference to the controller class (Helioviewer).
	 * @param {String} container The ID for the timeline's container.
	 * @constructs 
	 */ 
    initialize: function (controller, container) {
		this.controller = controller;
		this.container  = container;
		this.resizeTimerID = null;
		
		this.eventSource = new Timeline.DefaultEventSource();
		var bandInfos = [
			Timeline.createBandInfo({
				eventSource:    this.eventSource,
				width:          "70%", 
				intervalUnit:   Timeline.DateTime.MONTH, 
				intervalPixels: 100
			}),
			Timeline.createBandInfo({
				eventSource:    this.eventSource,
				width:          "30%", 
				intervalUnit:   Timeline.DateTime.YEAR, 
				intervalPixels: 200
			})
		],
		self = this;
		
		bandInfos[1].syncWith = 0;
		bandInfos[1].highlight = true;
		this.timeline = Timeline.create($(this.container), bandInfos);
		this.timeline.loadJSON("http://localhost/dev/test.json", function (json, url) {
			self.eventSource.loadJSON(json, url);
		});
	},

	/**
	 * @description Event-hanlder for window resize
	 */
	resize: function () {
		if (this.resizeTimerID === null) {
			this.resizeTimerID = window.setTimeout(function () {
				this.resizeTimerID = null;
				this.timeline.layout();
			}, 500);
		}
	}	
});/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Helioviewer, Class, $, $A, Builder, Calendar, Event, EventLayerAccordion, EventTimeline, LayerManager, MessageConsole,TileLayer, TileLayerAccordion, TimeControls, UserSettings, ZoomControl, jQuery, LoadingIndicator, Viewport, document, window */
var Helioviewer = Class.create(
	/** @lends Helioviewer.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new Helioviewer instance.
	 * @param {Object} options Custom application settings.
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>defaultZoomLevel</b>	- The initial zoom-level to display.<br>
	 *		<b>defaultPrefetchSize</b> - The radius outside of the visible viewport to prefetch.<br>
	 *		<b>timeIncrementSecs</b>	- The default amount of time to move when the time navigation arrows are pressed.<br>
	 *		<b>minZoomLevel</b>		- Minimum zoom level allowed.<br>
	 *		<b>maxZoomLevel</b>		- Maximum zoom level allowed.<br>
	 *		<b>imageAPI</b>			- URL to the API for retrieving image meta information.<br>
	 *		<b>tileAPI</b>				- URL to the API for retrieving tiles.<br>
	 *		<b>eventAPI</b>			- URL to the API for retrieving events and event-catalogs.<br>
	 * </div>
	 * @see Helioviewer#defaultOptions for a list of the available parameters.
	 */
	initialize: function (viewportId, api, view, defaults) {
       	Object.extend(this, defaults);
        this.load       = view;
        this.api        = api;
        this.viewportId = viewportId;

		// Loading indication
		this.loadingIndicator = new LoadingIndicator();

		// Load user-settings
		this.loadUserSettings();

		// Starting date
		this.date = new Date(this.userSettings.get('obs-date'));
		$('date').writeAttribute('value', this.date.toYmdUTCString());
		$('time').writeAttribute('value', this.date.toHmUTCString());

		this.layerManager =  new LayerManager(this);
		this._initViewport();
		this._initUI();
		this._initEvents();
		this._initKeyBoardListeners();

		// Add initial layers
		this.userSettings.get('tile-layers').each((function (settings) {
			this.layerManager.addLayer(new TileLayer(this.viewport, settings));
		}).bind(this));

		//Shadow-box
		//Shadowbox.init({skipSetup: true});

	},

	/**
	 * @description Initialize Helioviewer's user interface (UI) components
	 */
	_initUI: function () {
		var centerBtn, outsideBox, mouseCoords;

		//Calendar
		this.calendar = new Calendar(this, 'date', 'time');

		//Zoom-control
		this.zoomControl = new ZoomControl(this, {
			id: 'zoomControl',
			zoomLevel:    this.userSettings.get('zoom-level'),
			minZoomLevel: this.minZoomLevel,
			maxZoomLevel: this.maxZoomLevel
		});

		//Time-navigation controls
		this.timeControls = new TimeControls(this, 'timestep-select', 'timeBackBtn', 'timeForwardBtn', this.timeIncrementSecs);

		//Message console
		this.messageConsole = new MessageConsole(this, 'message-console', 'helioviewer-viewport-container-outer');

		//Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
		this.tileLayerAccordion = new TileLayerAccordion(this.layerManager, 'tileLayerAccordion');
		this.eventLayerAccordion = new EventLayerAccordion(this.viewport, 'eventAccordion');

		//Tooltips
		this._initToolTips();

        //Fullscreen button
        this._createFullscreenBtn();
        
		//Mouse coordinates
		mouseCoords =  Builder.node('div', {id: 'mouse-coords', style: 'display: none'});

		// IE will choke here if we don't manually extend mouseCoords... see last paragraph at http://prototypejs.org/learn/extensions
		Element.extend(mouseCoords);

		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-x', style: 'width:50%; float: left'}));
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-y', style: 'width:50%; float: left'}));
		this.viewport.innerNode.insert(mouseCoords);

        // Setup dialog event listeners
        this._setupDialogs();
        
		//Movie builder
		//this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});

		// Timeline
		//this.timeline = new EventTimeline(this, "timeline");
	},
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        jQuery("#helioviewer-about").click(function() {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#about-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#about-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - About",
        			width: 480,
        			height: 300,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });

		//Keyboard shortcuts dialog
        jQuery("#helioviewer-usage").click(function() {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#usage-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#usage-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - Usage Tips",
        			width: 480,
        			height: 480,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },

	/**
	 * @description Loads user settings from cookies or defaults if no settings have been stored.
	 */
	loadUserSettings: function () {
		this.userSettings = new UserSettings(this);

		// Load any view parameters specified via API
		if (this.load["obs-date"]) {
			this.userSettings.set('obs-date', parseInt(this.load["obs-date"], 10) * 1000);
		}

		if (this.load["img-scale"]) {
			this.userSettings.set('zoom-level', this.scaleToZoomLevel(parseInt(this.load["img-scale"], 10)));
		}

		if (this.load.layers) {
			var layers =  [];
			$A(this.load.layers).each(function (layer) {
				layers.push({ tileAPI: "api/index.php", observatory: layer.substr(0, 3), instrument: layer.substr(3, 3), detector: layer.substr(6, 3), measurement: layer.substr(9, 3) });
			});

			this.userSettings.set('tile-layers', layers);
		}

	},
    
    /**
     * @description Creates an HTML button for toggling between regular and fullscreen display
     * Syntax: jQuery
     */
    _createFullscreenBtn: function () {
        var btn, footer, vp, sb, speed, marginSize, origOutsideMarginLeft, 
            origOutsideMarginRight, origHeaderHeight, origViewportHeight, $_fx_step_default, self;
        
        // create dom-node
        btn = jQuery("#fullscreen-btn");
        
        // CSS Selectors
        outsideBox = jQuery('#outsideBox');
        vp         = jQuery('#helioviewer-viewport-container-outer');
        sb         = jQuery('#sandbox');
        footer     = jQuery('#footer-links-container-outer');
        header     = jQuery('#middle-col-header');
        panels     = jQuery("#left-col, #right-col, #footer-links-container-outer");
       
        // animation speed
        speed = 500;
        
        // margin-size
        marginSize = 5;

        // Overide jQuery's animation method
        // http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
        self  = this;
        var $_fx_step_default = jQuery.fx.step._default;
        jQuery.fx.step._default = function (fx) {
            if (!(fx.elem.id === "sandbox")) {
                return $_fx_step_default(fx);
            }
            self.viewport.updateSandbox();
            fx.elem.updated = true;
        };
        
        // setup event-handler
        btn.click(function() {
            // toggle class
            outsideBox.toggleClass('fullscreen-mode');
            
            // fullscreen mode
            if (outsideBox.hasClass('fullscreen-mode')) {

                // keep track of original dimensions
                origOutsideMarginLeft  = outsideBox.css("margin-left");
                origOutsideMarginRight = outsideBox.css("margin-right");
                origHeaderHeight       = header.height();
                origViewportHeight     = vp.height();
            
                outsideBox.animate({ 
                    marginLeft:  marginSize,
                    marginRight: marginSize
                    }, speed,
                function () {
                    self.viewport.checkTiles();
                    self.layerManager.resetLayers(self.viewport.visible);
                    panels.hide();
                });
                   
                header.animate({
                    height: marginSize
                }, speed);

                vp.animate({
                    height: jQuery(window).height() - (marginSize * 3)
                }, speed);
 
                sb.animate({
                    right: 1 // Trash
                }, speed);                
           
            // regular mode      
            } else {
                panels.show();

                outsideBox.animate({ 
                    marginLeft:  origOutsideMarginLeft,
                    marginRight: origOutsideMarginRight
                    }, speed);

                vp.animate({
                    height: origViewportHeight
                }, speed);
                header.animate({
                    height: origHeaderHeight
                }, speed);
                sb.animate({
                    right: 0
                }, speed);
            }
        })
    },
    
	/**
	 * @description Initialize Helioviewer's viewport(s).
	 */
	_initViewport: function () {
		this.viewport =	new Viewport(this, {
            id: this.viewportId,
            zoomLevel: this.userSettings.get('zoom-level'),
            prefetch: this.prefetchSize,
            debug: false
        });

		// Dynamically resize the viewport when the browser window is resized.
		Event.observe(window, 'resize', this.viewport.resize.bind(this.viewport));
	},

	/**
	 * @description Initialize event-handlers for UI components controlled by the Helioviewer class
	 */
	_initEvents: function () {
        var self = this;
        
		this.observe(this.zoomControl, 'change', this.handlers.zoom);
		this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
		this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
		Event.observe(this.calendar.timeField, 'change', this.handlers.observationTimeChange.bindAsEventListener(this));
        jQuery('#center-button').click(function(){
            self.viewport.center.call(self.viewport)
        });
	},

	/**
	 * @description Initialize keyboard-related event handlers.
	 * @see Based off method by <a href="http://www.quirksmode.org/js/events_properties.html#key">PPK</a>
	 */
	_initKeyBoardListeners: function () {
		var self = this;
		Event.observe(document, 'keypress', function (e) {

			//Ignore event if user is type in an input form field
			if (e.target.tagName !== "INPUT") {
				var code, character;
				if (!e) {
					e = window.event;
				}
				if (e.keyCode) {
					code = e.keyCode;
				}
				else if (e.which) {
					code = e.which;
				}

				character = String.fromCharCode(code);

				//TODO: use events or public method instead of zoomControl's (private) method.
				if (character === "-" || character === "_") {
					self.zoomControl.zoomButtonClicked(+1);
				}
				else if (character === "=" || character === "+") {
					self.zoomControl.zoomButtonClicked(-1);
				}
				else if (character === "c") {
                    self.viewport.center();
				}
				// event label visibility toggle
				else if (character === "d") {
                    self.layerManager.toggleLabels();
				}
                
				// toggle mouse-coords display
				else if (character === "m") {
    				self.viewport.ViewportHandlers.toggleMouseCoords();
				}
                
                // toggle full-screen display
                else if (character === "f") {
                    jQuery("#fullscreen-btn").click();
                }
                
                // step back in time
                else if (character === ",") {
                    self.timeControls.timePrevious();
                }
                
                // step forward in time
                else if (character === ".") {
                    self.timeControls.timeNext();
                }                          
			}
		});
	},

	/**
	 * @description Adds tooltips to all elements that are loaded everytime (buttons, etc) using default tooltip options.
	 */
	_initToolTips: function () {
		var items = $A([
			'#zoomControlZoomIn',
			'#zoomControlZoomOut',
			'#zoomControlHandle',
			'#timeBackBtn',
			'#timeForwardBtn'
		]),

		self = this;
		items.each(function (item) {
			self.addToolTip(item, {yOffset: -125});
		});

		//Handle some special cases separately
		this.addToolTip('#movieBuilder', {position: 'topleft'});

	},

	/**
	 * @description Adds a tooltip with specified settings to a given component.
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
	 */
	addToolTip: function (id, params) {
		var options = params || [],
			classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");

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

	/**
	 * @description Add an event-handler to a given component.
	 * @param {Object} uielement The UI component to attach the event to
	 * @param {String} eventName The name of the event to monitor for
	 * @param {Function} eventHandler A reference to the event-handler
	 * @see UIElement
	 */
	observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
	},

	/**
	 * @description Sets the desired viewing date and time.
	 * @param {Date} date A JavaScript Date object with the new time to use
	 */
	setDate: function (date) {
		this.date = date;
		var ts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		this.userSettings.set('obs-date', parseInt(ts, 10));
		this.layerManager.reloadLayers();
	},

	/**
	 * @description Finds the closest support zoom-level to a given pixel scale (arcseconds per pixel)
	 * @param {Float} imgScale The image scale in arcseconds per pixel
	 */
	scaleToZoomLevel: function (imgScale) {
		var zoomOffset = Math.round(Math.lg((imgScale / this.baseScale)));
		return this.baseZoom + zoomOffset;
	},

	/**
	 * @namespace
	 * @description Helioviewer application-level event handlers
	 */
	handlers: {
		/**
		 * @description Changes the zoom-level to a new value
		 * @param {Int} level The new zoom-level to use
		 */
		zoom: function (level) {
			this.viewport.zoomTo(level);
		},

		observationDateChange: function (date) {
			this.setDate(date);
			this.calendar.updateFields();
		},

		observationTimeChange: function (e) {
			var time = e.target.value,
				regex, newTime, hours, mins, secs;

			//make sure time entered in correct format
			regex = /^\d{2}:\d{2}:\d{2}?/;

			//Check to see if the input is a valid time
			if (time.match(regex)) {
				//Get the difference in times and add to this.date
				newTime = time.split(':');
				hours = parseInt(newTime[0], 10) - this.date.getUTCHours();
				mins  = parseInt(newTime[1], 10) - this.date.getUTCMinutes();
				secs  = parseInt(newTime[2], 10) - this.date.getUTCSeconds();

				this.date.addHours(hours);
				this.date.addMinutes(mins);
				this.date.setSeconds(secs);

				this.setDate(this.date);

			} else {
				this.messageConsole.warn('Invalid time. Please enter a time in of form HH:MM:SS');
			}
		},

		newToolTip: function (tooltip) {
			this.addToolTip(tooltip.id, tooltip.params);
		},

		/**
		 * @description newLayer Initializes new layer upon user request
		 * @param {Object} instrument Contains necessary information for creating a new layer
		 * @param {LayerManagerMenuEntry} menuEntry Reference to the menu entry to allow layer to be tied to the entry
		 */
		newLayer: function (data) {
			var inst = data.instrument,
				ui =   data.menuEntry,
				layer;

			// Inialize layer and add it to the viewport
			layer = new TileLayer(this.viewport, {
                tileAPI: this.api,
                observatory: inst.observatory,
                instrument: inst.instrument,
                detector: inst.detector,
                measurement: inst.measurement
            });
			this.viewport.addLayer(layer);

			//Update menu entry display
			ui.layer = layer;
			ui.displayTileLayerOptions();
		}
	}
});

/**
 * @fileOverview Various helper functions used throughout Helioviewer.
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global Event, Element, navigator */
/**
 * @description Pads a string to the left.
 * @param {String} padding Character to use for padding, e.g. " "
 * @param {Int} minLength Length to pad up to
 * @returns {String} The resulting string.
 */
String.prototype.padLeft = function (padding, minLength) {
	var str = this,
		pad = '' + padding;
	while (str.length < minLength) {
		str = pad + str;
	}
	return str;
};
/**
 * @description Trims a string from the left.
 * @param {String} padding Character to trim.
 * @returns {String} The resulting string.
 */
String.prototype.trimLeft = function (padding) {
	var str = this,
		pad = '' + padding;
	while (str[0] === pad) {
	    str = str.substr(1);
	}
	return str;
};

/**
 * @description Outputs a UTC Date string of the format "YYYY/MM/dd"
 * @returns {String} Datestring.
 */
Date.prototype.toYmdUTCString = function () {
	var year = this.getUTCFullYear() + '',
		month = (this.getUTCMonth() + 1) + '',
		day = this.getUTCDate() + '';
	return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
};

/**
 * @description Outputs a UTC Date string of the format "HH:mm:ss"
 * @returns {String} Datestring.
 */
Date.prototype.toHmUTCString = function () {
	var hour = this.getUTCHours() + '',
		min = this.getUTCMinutes() + '',
		sec = this.getUTCSeconds() + '';
	return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
};

/**
 * @description Takes a localized javascript date and returns a date set to the UTC time.
 */
Date.prototype.toUTCDate = function () {
	var utcOffset = this.getUTCOffset(),
		sign = utcOffset[0],
		hours = parseInt(utcOffset.substr(1, 2), 10),
		mins = parseInt(utcOffset.substr(3, 4), 10),
	
		numSecs = (3600 * hours) + (60 * mins);
	
	if (sign === "+") {
		numSecs = - numSecs;
	}
	
	this.addSeconds(numSecs);
};

Element.addMethods({
	/**
	 * @name Event.observeOnce
	 * @description Prototype observeOnce function, Courtesy of Kangax
	 */
	observeOnce: (Event.observeOnce = function (element, eventName, handler) {
		return Event.observe(element, eventName, function (e) {
			Event.stopObserving(element, eventName, arguments.callee);
			handler.call(element, e);
		});
	})
});

/**
 * @description Determine what operating system the user is likely to be on: For use when chosing movie codecs, etc.
 * @returns {String} Abbreviation of the user's OS
 */
var getOS = function () {
	var os = "other";
	
	if (navigator.appVersion.indexOf("Win") !== -1) {
		os = "win";
	}
	if (navigator.appVersion.indexOf("Mac") !== -1) {
		os = "mac";
	}
	if (navigator.appVersion.indexOf("X11") !== -1) {
		os = "linux";
	}
	if (navigator.appVersion.indexOf("Linux") !== -1) {
		os = "linux";
	}
	
	return os;
};

/**
 * @description Convert from cartesian to polar coordinates
 * @param {Int} x X coordinate
 * @param {Int} y Y coordinate
 * @returns {Object} Polar coordinates (r, theta) resulting from conversion 
 */
Math.toPolarCoords = function (x, y) {
	var radians = Math.atan(y / x);
	
	if  ((x > 0) && (y < 0)) {
		radians += (2 * Math.PI);
	}
	else if (x < 0) {
		radians += Math.PI;
	}
	else if ((x === 0) && (y > 0)) {
		radians = Math.PI / 2;
	}
	else if ((x === 0) && (y < 0)) {
		radians = (3 * Math.PI) / 2;
	}
		
	return {
		r     : Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
		theta : (180 / Math.PI) * radians
	};
};

/**
 * @description Return base-2 logarithm of the given number (Note: log_b(x) = log_c(x) / log_c(b))
 * @param {Number} x Number
 * @returns {Number} The base-2 logarithm of the input value
 */
Math.lg = function (x) {
	return (Math.log(x) / Math.log(2));
};
/**
 * @fileOverview Contains the IconPicker class definition.
 * Syntax: Prototype, jQuery 
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global IconPicker, Class, $, $A, jQuery*/
var IconPicker = Class.create(
	/** @lends IconPicker.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new IconPicker
	 * @param {String} id The identifier to use for the icon-picker dom-node
	 */
	initialize: function (id) {
		this.id = id;
		
		// Available Icon options
		this.AVAILABLE_ICON_SHAPES = $A(["circle", "square", "diamond"]);
		this.AVAILABLE_ICON_COLORS = $A(["red", "orange", "green", "yellow", "blue", "lightblue"]);
		
		// Keep track of which event-layer is being targeted.
		this.focus = null;
        
        // Don't build until requested
        this.loaded = false;
		
		// Build icon-list
		//this._buildIconList();
	},
	
	
	/**
	 * @description Sets up the list of available icons to chose from
	 */
	_buildIconList: function () {
		var i, closeBtn, menu, self = this;
		menu = jQuery("<div id='" + this.id + "' class='ui-widget ui-widget-content ui-corner-all' style='display: none;'></div>");				
		//menu.append(jQuery('<div id=event-icon-menu-title><span style="vertical-align: middle">Chose an icon:</span></div><div id="event-icon-menu-body">'));
        menu.append(jQuery('<div id=event-icon-menu-title><span style="vertical-align: middle">Chose an icon:</span></div><div id="event-icon-menu-body">'));

		i = 1;
		this.AVAILABLE_ICON_COLORS.each(function (color) {
			self.AVAILABLE_ICON_SHAPES.each(function (shape) {
				var icon = jQuery('<img class="event-icon-menu-icon" src="images/events/small-' + color + "-" + shape + '.png" alt="' + color + '-' + shape + '">');
				icon.click(function () {
					self.focus.updateIcon(this.alt);
					jQuery('#event-icon-menu').fadeOut();
				});
				menu.append(icon);
				if (i % 3 === 0) {
					menu.append(jQuery("<br>"));
				}
				i += 1;
			});			
		});
		
		closeBtn = jQuery('<br><div style="text-align: right"><a class="light" href="#" style="margin-right: 2px;">[Close]</a></div>').click(function () {
			jQuery('#event-icon-menu').fadeOut();
		});
		menu.append(closeBtn);
		menu.append("</div>");
		
		jQuery('body').append(menu);
	},
	
	/**
	 * @description Toggle IconPicker visibility
	 * @param {Object} layer The EventLayer icon picker is associated with.
	 * @param {Object} pos The mouse-click position
	 */
	toggle: function (layer, pos) {
        if (!this.loaded) {
            this._buildIconList();            
            this.loaded = true;
        }
   		this.focus = layer;
		jQuery('#' + this.id).css({'left': pos.left + 16, 'top': pos.top + 16}).slideToggle();

	}
});
/**
 * @fileOverview Contains class definition for a simple layer manager
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global LayerManager, Class, UIElement, $A */
var LayerManager = Class.create(UIElement,
	/** @lends LayerManager.prototype */
	{
    /**
     * @constructs
     * @description Creates a new LayerManager
     * @param {Object} A Rseference to the main application controller
     */
    initialize: function (controller) {
        this.controller = controller;
        this.layers     = $A([]);
        this.labels     = false;
    },
    
    //hasId: function (id) {
		//return (this.layers.grep(id).length > 0 ? true : false);
	//},

	/**
	 * @description Add a new layer
	 */
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	/**
	 * @description Adds a layer that is not already displayed
	 */
	addNewLayer: function () {
		var priorityQueue, currentLayers, p, defaultChoice = "SOHEITEIT171";
		priorityQueue = $A([
			"SOHEITEIT304", "SOHLAS0C20WL", "SOHLAS0C30WL", "SOHLAS0C20WL", "SOHMDIMDImag", "SOHMDIMDIint", "SOHEITEIT171", "SOHEITEIT284", "SOHEITEIT195"
		]);
		
		// current layers in above form
		currentLayers = $A([]);
		this.tileLayers().each(function (l) {
			currentLayers.push(l.observatory + l.instrument + l.detector + l.measurement);
		});
		
		// remove existing layers from queue
		currentLayers.each(function(id) {
			priorityQueue = priorityQueue.without(id);
		});
		
		p = priorityQueue.first() || defaultLayer;
		
		this.addLayer(new TileLayer(this.controller.viewport, {
            tileAPI: this.controller.api,
            observatory: p.substr(0,3),
            instrument:  p.substr(3,3),
            detector:    p.substr(6,3),
            measurement: p.substr(9,3),
            startOpened: true
        }));
		this.refreshSavedTileLayers();
	},
	
	/**
	 * @description Gets the number of TileLayers currently loaded
	 * @return {Integer} Number of tile layers present.
	 */
	numTileLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "TileLayer") {
				n += 1;
			}
		});
		
		return n;
	},
	
	/**
	 * @description Returns the largest width and height of any layers (does not have to be from same layer)
	 * @returns {Object} The width and height of the largest layer
	 */
	getMaxDimensions: function () {
		var maxWidth  = 0,
			maxHeight = 0;
		
		this.layers.each(function (l) {
			if (l.type === "TileLayer") {
				// Ignore if the relative dimensions haven't been retrieved yet
				if (Object.isNumber(l.relWidth)) {
					maxWidth  = Math.max(maxWidth,  l.relWidth);
					maxHeight = Math.max(maxHeight, l.relHeight); 
				}
			}
		});
		
		//console.log("Max dimensions: " + maxWidth + ", " + maxHeight);
		
		return {width: maxWidth, height: maxHeight};
	},
	
	/**
	 * @description Checks for presence of a specific event catalog
	 * @param {String} catalog Catalog ID
	 */
	hasEventCatalog: function (catalog) {
		return (this.eventLayers().find(function (l) {
			return l.catalog === catalog;
		}) ? true : false);
	},
	
	/**
	 * @description Returns only event-layers.
	 * @returns {Array} An array containing each of the currently displayed EVENT layers
	 */
	eventLayers: function () {
		return this.layers.findAll(function (l) { 
			return l.type === "EventLayer";
		});
	},
	
	/**
	 * @description Returns only tile-layers.
	 * @returns {Array} An array containing each of the currently displayed TILE layers
	 */
	tileLayers: function () {
		return this.layers.findAll(function (l) {
			return l.type === "TileLayer";
		});
	},
	
	/**
	 * @description Gets the number of event layers currently loaded
	 * @return {Integer} Number of event layers present.
	 */
	numEventLayers: function () {
		var n = 0;
		this.layers.each(function (l) {
			if (l.type === "EventLayer") {
				n += 1;
			}
		});
				
		return n;
	},
	
	/**
	 * @description Removes a layer
	 * @param {Object} The layer to remove
	 */
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	/**
	 * @description Reload layers
	 */
	reloadLayers: function () {
		this.layers.each(function (layer) {
			layer.reload();
		});
	},
    
    /**
     * @description Returns the current label visibility
     */
    getLabelVisibility: function () {
        if (this.labels === true) {
            return "inline";
        }
        else {
            return "none";
        }
    },
    
    /**
     * @description Toggle event label visibility
     */
    toggleLabels: function () {
        this.labels = !this.labels;
        jQuery('.event-label').toggle();
    },

	/**
	 * @description Reloads each of the tile layers
	 */
	resetLayers: function (visible) {
		this.layers.each(function (layer) {
			layer.reset(visible);
		});
	},
	
	/**
	 * @description Updates the list of loaded tile layers stored in cookies
	 */
	refreshSavedTileLayers: function () {
		//console.log("refreshSavedTileLayers");
		var tilelayers = [];
		
		this.tileLayers().each(function (layer) {
			var settings = {
				tileAPI     : layer.tileAPI,
				observatory : layer.observatory,
				instrument  : layer.instrument, 
				detector    : layer.detector,
				measurement : layer.measurement
			};
			
			tilelayers.push(settings);
		});
		
		this.controller.userSettings.set('tile-layers', tilelayers);
	}
});
/**
 * @fileOverview Contains the "MessageConsole" class definition.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
 /*global document, UIElement, Effect, $, Class, Element, Event, window */
var MessageConsole = Class.create(UIElement ,
	/** @lends MessageConsole.prototype */
	{
    /**
     * @constructs
     * @description Creates a new MessageConsole.<br><br>
     * MessageConsole Provides a mechanism for displayed useful information to the user.
	 * For ease of use, the class provides methods comparable to Firebug's for outputting
	 * messages of different natures: "log" for generic unstyled messages, or for debbuging
	 * use, "info" to inform the user of some interesting change or event, and "warning" and
	 * "error" for getting the user's attention.
     * @param {Object} controller A reference to the Helioviewer (controller)
     * @param {String} container The id of the container for messages to be displayed in
     * @param {String} viewport  The id of the viewport container
     */
    initialize: function (controller, container, viewport) {
        this.controller = controller;
        this.console =  $(container);
        this.viewportId = viewport;
    },
    
	/**
	 * @description Logs a message to the message-console
	 * @param {String} msg Message to display
	 */
    log: function (msg) {
        this.console.update(new Element('p', {style: 'color: #6495ED; font-weight: bold;'}).insert(msg));
		var self = this,
        	trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
    //info: function (msg) {
    //},
    
	/**
	 * @description Displays a warning message in the message console
	 * @param {String} msg Message to display
	 */
    warn: function (msg) {
        this.console.update(new Element('p', {style: 'color: yellow; font-weight: bolder;'}).insert(msg));
		var self = this,
        	trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);        
    },
    
	/**
	 * @description Displays an error message in the message console
	 * @param {String} msg Message to display
	 */
    error: function (msg) {
        this.console.update(new Element('p', {style: 'color: red'}).insert(msg));
        var self = this,
        	trash = new Effect.Shake(this.viewportId, {distance: 15, duration: 0.1});
        trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        window.setTimeout(function () {
			var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
	/**
	 * @description Displays message along with a hyperlink in the message console
	 * @param {String} msg Message to display
	 * @param {String} Hyperlink text (Note: Event-handler should be used to handle hyperlink clicks. The link address thus is set to "#")
	 */
    link: function (msg, linkText) {
		var self = this,
			linkId, wrapper, link, trash;
			
    	// Generate a temporary id
    	linkId = 'link-' + this.controller.date.getTime() / 1000;
    	
    	// Html
    	wrapper = new Element('span');
    	link = new Element('a', {href: '#', id: linkId, 'class': 'message-console-link'}).update(linkText);
    	wrapper.insert(msg);
    	wrapper.insert(link);
    	
    	this.console.update(new Element('p', {style: 'color: #6495ED;'}).insert(wrapper));
        trash = new Effect.Appear(this.console, { duration: 2.0 });
    
        //For downloads, leave the message up until the user clicks on the link provided.
        //Note: another possibility is to add a "close" option.
        Event.observe(linkId, 'click', function () {
			self.console.hide();        	
        });
        
        return linkId;
    }
});/**
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 *
 */
/*global MoviesBuilder, Class, UIElement, Event, document, window, Shadowbox, getOS, Ajax */
//TODO: pass in bit-rate depending upon codec chosen! Xvid?

var MovieBuilder = Class.create(UIElement, 
	/** @lends MovieBuilder.prototype */
	{
	/**
	 * @description Default MovieBuilder options
	 */
	defaultOptions: {
		active      : false,
		url         : "api/index.php",
		minZoomLevel: 13, //can relax for single layer movies...
		numFrames   : 40,
		frameRate   : 8,
		sharpen     : false,
		edgeEnhance : false,
		format      : {win: "asf", mac: "mov", linux: "mp4"}
	},

	/**
     * @constructs
     * @description Creates a new MovieBuilder
     * @param {Object} options Custom MovieBuilder options
     */
    initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

        var self = this;

        //Quick Movie Event Handler
		Event.observe(this.id, 'click', function () {
			if (!self.active) {
				var hv = self.controller,
					hqFormat, displayRange, xhr;
	
				self.active = true;
				
				// Chose an optimal codec based on User's OS
				hqFormat = self.format[getOS()];
				
				// Get range of tiles to use
				displayRange = hv.viewport.displayRange();
	
				//Ajax Request
				xhr = new Ajax.Request(self.url, {
					method: 'POST',
					parameters: {
						action:    "buildQuickMovie",
	                	layers:    "SOHEITEIT304,SOHLAS0C20WL",
	                	startDate: hv.date.getTime() / 1000,
	                	zoomLevel: hv.viewport.zoomLevel, //Math.max(hv.viewport.zoomLevel, self.minZoomLevel),
	                	numFrames: self.numFrames,
	                	frameRate: self.frameRate,
	                	edges:     self.edgeEnhance,
	                	sharpen:   self.sharpen,
	                	format:    hqFormat,
	                	xRange:    displayRange.xStart + ", " + displayRange.xEnd,
						yRange:    displayRange.yStart + ", " + displayRange.yEnd
					},
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
					        	content: self.url + '?action=playMovie&format=' + hqFormat + '&url=' + transport.responseJSON
							});
						});
					}
				});
			}
		});
    }
});
/**
 * @fileOverview Contains the class definition for an TileLayer class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 * Syntax: jQuery, Prototype
 */
/*global TileLayer, Class, Layer, Ajax, Event, $, Element, Image */
var TileLayer = Class.create(Layer, 
	/** @lends TileLayer.prototype */
	{	
	/**
	 * @description Default TileLayer options
	 */
	defaultOptions: {
		type:		  'TileLayer',
		rootDir:	  'tiles/',
		cacheEnabled: true,
		opacity:	  100,
		autoOpacity:  true,
		startOpened:  false,
		sharpen:      false
	},

	/**
	 * @constructs
	 * @description Creates a new TileLayer
	 * @param {Object} viewport Viewport to place the tiles in
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>type</b>	       - The type of the layer (used by layer manager to differentiate event vs. tile layers)<br>
	 *      <b>tileSize</b>	   - Tilesize to use<br>
	 *		<b>source</b>      - Tile source ["database" | "filesystem"]<br>
	 * 		<b>rootDir</b>	   - The root directory where the tiles are stored (when using filesystem as the tile source)<br>
	 *      <b>opacity</b>	   - Default opacity (adjusted automatically when layer is added)<br>
	 *		<b>autoOpaicty</b> - Whether or not the opacity should be automatically determined when the image properties are loaded<br>
	 *		<b>startOpened</b> - Whether or not the layer menu entry should initially be open or closed<br>
	 * </div>
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;
		
		this.tileSize = viewport.tileSize; 
		
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
	 * @description Refreshes the TileLayer
	 */
	reload: function () {
		this.loadClosestImage();
	},

	/**
	 * @function Remove TileLayer tiles
	 */
	removeTiles: function () {
		this.tiles = [];
	},

	/**
	 * @description Reload the tile layer
	 * @param {Object} A 2-d binary array indicating which tiles have been (should be) loaded 
	 */
	reset: function (visible) {
		var i, j, currentScale, scaleOffset, old, numTiles, numTilesLoaded, indices, tile, onLoadComplete, self = this;
		
		// Start loading indicator
		this.viewport.controller.loadingIndicator.loadingStarted();
		
		// Update relevant dimensions
		//zoomOffset = this.lowestRegularZoom - this.viewport.zoomLevel;
		currentScale = this.viewport.controller.baseScale * Math.pow(2, this.viewport.zoomLevel - this.viewport.controller.baseZoom);
		scaleOffset  = this.naturalImageScale / currentScale;
		
		this.relWidth  = this.width  * scaleOffset;
		this.relHeight = this.height * scaleOffset;
		
		//console.log("relative Width & Height: " + this.relWidth + " , " + this.relHeight);

		// Let user know if the requested zoom-level is lower than the lowest level natively supported
		if ((this.viewport.zoomLevel < this.minZoom) && (this.viewport.controller.userSettings.get('warn-zoom-level') === "false")) {
			this.viewport.controller.messageConsole.log("Note: " + this.name + " is not available at this resolution. Images will be artificially enlarged.");
			this.viewport.controller.userSettings.set('warn-zoom-level', true);
		}

		// Remove tiles in cache
		this.removeTiles();

		this.refreshUTCDate();

		// Reference old tile nodes to remove after new ones are done loading
		old = [];
		this.domNode.childElements().each(function (tile) {
			old.push(tile);
		});

		//TODO: Determine range to check
		numTiles = 0;
		numTilesLoaded = 0;

		indices = this.viewport.visibleRange;
		
		onLoadComplete = function (e) {
			numTilesLoaded += 1;
			if (numTilesLoaded === numTiles) {
				//console.log("Finished loading ALL images! (" + numTiles + ") total.");
				old.each(function (tile) {
					//tile.parentNode && tile.remove();
					if (tile.parentNode) {
						tile.remove();
					}
				});
				self.viewport.controller.loadingIndicator.loadingFinished();
			}
		};
		
		for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (visible[i][j]) {
					tile = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));

					if (!this.tiles[i]) {
						this.tiles[i] = [];
					}

					this.tiles[i][j] = {};
					this.tiles[i][j].img = tile;

					numTiles += 1;

				   // Makes sure all of the images have finished downloading before swapping them in
					Event.observe(this.tiles[i][j].img, 'load', onLoadComplete);
				}
			}
		}
	},

	/**
	 * @description Update TileLayer date
	 */
	refreshUTCDate: function () {
		var date = new Date(this.timestamp * 1000);
		date.toUTCDate();
		this.utcDate = date;
	},

	/**
	 * @description Store retrieved image properties
	 * @param {Object} imageProperties Properties of the image associated with the TileLayer  
	 */
	setImageProperties: function (imageProperties) {
		//Only load image if it is different form what is currently displayed
		if (imageProperties.imageId === this.imageId) {
			this.fire('obs_time_change', this);
			return;
		}
		
		Object.extend(this, imageProperties);

		this.fire('obs_time_change', this);

		//IE7: Want z-indices < 1 to ensure event icon visibility
		this.setZIndex(parseInt(this.opacityGroupId, 10) - 10);

		//handle opacities for any overlapping images
		if (this.autoOpacity) {
			this.setInitialOpacity();
			this.autoOpacity = false;
		}

		// Let others know layer has been added
		this.fire('change', this);

		this.viewport.checkTiles(true);

		this.reset(this.viewport.visible);
	},

	/**
	 * @description Associates an image with the TileLayer and fetches some meta information relating to that image
	 * @param {String} imageId The identifier of the image to be tiled 
	 */
	setImage: function (imageId) {
		if (imageId === this.imageId) {
			return;
		}
		this.imageId = imageId;
		this.loadImageProperties();
		this.reset(this.viewport.visible);
	},

	/**
	 * @description Sets the opacity for the layer, taking into account layers which overlap one another.
	 */
	setInitialOpacity: function () {
		var self = this,
			opacity = 1,
			counter = 0;

		//Note: No longer adjust other layer's opacities... only the new layer's (don't want to overide user settings).
		this.layerManager.layers.each(function (layer) {
			if (parseInt(layer.opacityGroupId, 10) === parseInt(self.opacityGroupId, 10)) {
				counter += 1;
			}
		});
		
		//Do no need to adjust opacity if there is only one image
		if (counter > 1) {
			opacity = opacity / counter;
			this.domNode.setOpacity(opacity);
			this.opacity = opacity * 100;
		}

		/**
		this.layerManager.layers.each (function (layer) {
			if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
			   counter++;

				//Do no need to adjust opacity of the first image
				if (counter > 1) {
					opacity = opacity / counter;
					layer.domNode.setOpacity(opacity);
					layer.opacity = opacity * 100;
					//layer.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')', width: self.tileSize});
				}
			}
		});*/
	},

	/**
	 * @description Update the tile layer's opacity
	 * @param {int} Percent opacity to use
	 */
	setOpacity: function (opacity) {
		this.opacity = opacity;
		opacity = opacity / 100;
		this.domNode.setOpacity(opacity);
		//this.domNode.setStyle({'filter': 'alpha(opacity=' + (opacity * 100) + ')'});
	},

	/**
	 * @description Loads the closest image in time to that requested
	 */
	loadClosestImage: function () {
		var date = this.viewport.controller.date,
			processResponse, xhr;

		// Ajax responder
		processResponse = function (transport) {
			this.setImageProperties(transport.responseJSON);
			
			var hv = this.viewport.controller;
			
			// update viewport sandbox if necessary
			this.viewport.updateSandbox();

			// Add to tileLayer Accordion if it's not already there
			if (!hv.tileLayerAccordion.hasId(this.id)) {
				hv.tileLayerAccordion.addLayer(this);
			}
			// Otherwise update the accordion entry information
			else {
				hv.tileLayerAccordion.updateTimeStamp(this);
				hv.tileLayerAccordion.updateLayerDesc(this.id, this.name);
				hv.tileLayerAccordion.updateOpacitySlider(this.id, this.opacity);
			}
		};
		
		// Ajax request
		xhr = new Ajax.Request(this.viewport.controller.api, {
			method: 'POST',
			parameters: {
				action: 'getClosestImage',
				observatory: this.observatory,
				instrument:  this.instrument,
				detector:    this.detector,
				measurement: this.measurement,
				timestamp:   date.getTime() / 1000,
				debug: false				
			},
			onSuccess: processResponse.bind(this)
		});
	},
	
	/**
	 * @description Toggle image sharpening
	 */
	toggleSharpening: function () {
		if (this.sharpen === true) {
			
		} else {
			//jQuery(this.domNode.childElements());
			//jQuery("img.tile[src!=images/transparent_512.gif]").pixastic("sharpen", {amount: 0.35});
		}
		this.sharpen = !this.sharpen;
	},

	/**
	 * @description Check to see if all visible tiles have been loaded
	 * @param {Object} position Position
	 */
	viewportMove: function (position) {
		var visible = this.viewport.visible,
			indices = this.viewport.visibleRange,
			i, j;

		//console.log("Checking tiles from " + indices.xStart + " to " + indices.xEnd);

		for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (!this.tiles[i]) {
					this.tiles[i] = [];
				}
				if (visible[i][j] && (!this.tiles[i][j])) {
					//console.log("Loading new tile");
					this.tiles[i][j] = $(this.domNode.appendChild(this.getTile(i, j, this.viewport.zoomLevel)));
				}
			}
		}
	},

	/**
	 * @description Generates URL to retrieve a single Tile and displays the transparent tile if request fails
	 * @param {Int} x Tile X-coordinate
	 * @param {Int} y Tile Y-coordinate
	 * @returns {String} URL to retrieve the requested tile
	 */
	getTile: function (x, y) {
		var left = x * this.tileSize,
			top  = y * this.tileSize,
			zoom  = this.viewport.zoomLevel,
			ts = this.tileSize,
			rf = function () {
				return false;
			}, img;
			
		img = $(new Image());
		img.addClassName('tile');
		img.setStyle({
			left: left + 'px',
			top: top + 'px'
		});
		img.unselectable = 'on';

		img.onmousedown   = rf;
		img.ondrag        = rf;
		img.onmouseover   = rf;
		img.oncontextmenu = rf;
		img.galleryimg    = 'no';
		img.alt           = "";

		
		// If tile doesn't exist, load the transparent tile in it's place
		Event.observe(img, 'error', function(){
        //    if (((x == "-1") && (y == "-1")) || ((x=="-1") && (y=="0")) || ((x=="0")&&(y=="-1")) || ((x=="0")&&(y=="0")))
        //        console.log("Error loading [" + x + ", " + y + "]");
        	this.src = 'images/transparent_' + ts + '.gif'; 
        });

		// Load tile
		img.src = this.tileAPI + '?action=getTile&x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + this.imageId + '&ts=' + ts;
		
		return img;
	}
});
/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires ui.dynaccordion.js
 * Syntax: jQuery, Prototype
 */
/*global TileLayerAccordion, Class, jQuery, Ajax, Layer, $, $$, $A, $R, Control, Element, TileLayer, Event, Hash */
var TileLayerAccordion = Class.create(Layer,
	/** @lends TileLayerAccordion.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new TileLayerAccordion
	 * @param {Object} layerManager Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer  manager user interface should be constructed
	 */
	initialize: function (layerManager, containerId) {
		this.layerManager = layerManager;
		this.container =    jQuery('#' + containerId);
		this.queryURL =     "api/index.php";

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
	 * @description Adds a new entry to the tile layer accordion
	 * @param {Object} layer The new layer to add
	 */
	addLayer: function (layer) {
		// Determine what measurements to display
		var processResponse = function (transport) {
			// Create accordion entry header
			var visibilityBtn, removeBtn, head, body, slider;
			
			visibilityBtn = "<span class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' title='toggle layer visibility'></span>";
			removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + layer.id + "' title='remove layer'></span>";
			head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'><span class=tile-accordion-header-left>" + layer.name + "</span><span class=tile-accordion-header-right><span class=timestamp></span><span class=accordion-header-divider>|</span>" + visibilityBtn + removeBtn + "</span></div>";
            

			// Update allowable choices
			this.options.observatories = transport.responseJSON.observatories;
			this.options.instruments =   transport.responseJSON.instruments;
			this.options.detectors =     transport.responseJSON.detectors;
			this.options.measurements =  transport.responseJSON.measurements;			
			
			// Create accordion entry body
			body = this._buildEntryBody(layer);

			//var startOpened = (this.layerManager.numTileLayers() > 1);

			//Add to accordion
			this.domNode.dynaccordion("addSection", {
				id:     layer.id,
				header: head,
				cell:   body,
				open:   layer.startOpened
			});
			
			
			slider = new Control.Slider("opacity-slider-handle-" + layer.id, "opacity-slider-track-" + layer.id, {
				sliderValue: layer.opacity,
				range:       $R(1, 100),
				values:      $R(1, 100),
				onSlide:     function (v) {
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
				body: body,
				opacitySlider: slider
			});
			
			// Event-handlers
			this._setupEventHandlers(layer);
			
			// Update timestamp
			this.updateTimeStamp(layer);
		},
		
		//Ajax Request
		xhr = new Ajax.Request(this.queryURL, {
			method: 'POST',
			onSuccess: processResponse.bind(this),
			parameters: {
				action     : "getLayerAvailability",
				observatory: layer.observatory,
				instrument:  layer.instrument,
				detector:    layer.detector,
				measurement: layer.measurement,
				format:      "json"
			}
		});
	},

	/**
	 * @description Checks to see if the given layer is listed in the accordion
	 * @param {String} id ID of the layer being checked 
	 */
	hasId: function (id) {
		return (this.layerSettings.keys().grep(id).length > 0 ? true : false);
	},
	
	/**
	 * @description Builds the body section of a single TileLayerAccordion entry. NOTE: width and height must be hardcoded for slider to function properly.
	 * @param {Object} layer The new layer to add
	 * @see <a href="http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f">This discussion thread</a> for explanation.
	 */
	_buildEntryBody: function (layer) {
		var id, options, opacitySlide, obs, inst, det, meas, fits;
		
		id = layer.id;
		options = this.options;
		
		// Opacity slider placeholder
		opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
		opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id + "' style='width:120px; height:10px;'>";
		opacitySlide += "<div class='opacity-slider-handle' id='opacity-slider-handle-" + id + "' style='10px; 19px;'></div>";
		opacitySlide += "</div>";
				
		// Populate list of available observatories
		obs = "<div class=layer-select-label>Observatory: </div> ";
		obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'>";
		jQuery.each(options.observatories, function (i, o) {
			obs += "<option value='" + o.abbreviation + "'";
			if (layer.observatory === o.abbreviation) {
				obs += " selected='selected'";
			}				 
			obs += ">" + o.name + "</option>";			
		});
		obs += "</select><br>";
		
		// Populate list of available instruments
		inst = "<div class=layer-select-label>Instrument: </div> ";
		inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'>";
		jQuery.each(options.instruments, function (i, o) {
			inst += "<option value='" + o.abbreviation + "'";
			if (layer.instrument === o.abbreviation) {
				inst += " selected='selected'";
			}
			inst += ">" + o.name + "</option>";			
		});
		inst += "</select><br>";
		
		// Populate list of available Detectors
		det = "<div class=layer-select-label>Detector: </div> ";
		det += "<select name=detector class=layer-select id='detector-select-" + id + "'>";
		jQuery.each(options.detectors, function (i, o) {
			det += "<option value='" + o.abbreviation + "'";
			if (layer.detector === o.abbreviation) {
				det += " selected='selected'";
			}
			det += ">" + (o.name === "" ? o.abbreviation : o.name) + "</option>";		
		});
		det += "</select><br>";
		
		// Populate list of available Detectors
		meas = "<div class=layer-select-label>Measurement: </div> ";
		meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'>";
		jQuery.each(options.measurements, function (i, o) {
			meas += "<option value='" + o.abbreviation + "'";
			if (layer.measurement === o.abbreviation) {
				meas += " selected='selected'";
			}
			meas += ">" + o.name + "</option>";		
		});
		meas += "</select><br><br>";
		
		fits = "<a href='#' id='showFITSBtn-" + id + "' style='margin-left:170px; color: white; text-decoration: none;'>FITS Header</a><br>";
		
		return (opacitySlide + obs + inst + det + meas + fits);
	},
	
	//_addOpacitySlider: function (layer) {
	//	
	//},
	
	/**
	 * @description Makes sure the slider is set to the right value
	 * @param {Object} id ID of the TileLayer whose opacity should be adjusted
	 * @param {Object} opacity The new opacity value
	 */
	updateOpacitySlider: function (id, opacity) {
		this.layerSettings.get(id).opacitySlider.setValue(opacity);
	},

	/**
	 * @description Handles setting up an empty tile layer accordion.
	 */
	_setupUI: function () {
		var title, addLayerBtn, hv, self = this;
		
		// Create a top-level header and an "add layer" button
		title = jQuery('<span class="section-header">Overlays</span>').css({'float': 'left'});
		addLayerBtn = jQuery('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="TileLayerAccordion-Container"></div>'));
		
        // Event-handlers
		hv = this.layerManager.controller;
        addLayerBtn.click(function () {
			self.layerManager.addNewLayer();
        });
	},

	/**
	 * @description Sets up event-handlers for a TileLayerAccordion entry
	 * @param {Object} layer The layer being added
	 */
	_setupEventHandlers: function (layer) {
		var toggleVisibility, removeLayer, showFITS, visible, icon, accordion, self = this,
			visibilityBtn = jQuery("#visibilityBtn-" + layer.id),
			removeBtn     = jQuery("#removeBtn-" + layer.id),
			fitsBtn       = jQuery("#showFITSBtn-" + layer.id);

		// Function for toggling layer visibility
		toggleVisibility = function (e) {
			visible = layer.toggleVisible();
            $("visibilityBtn-" + layer.id).toggleClassName('hidden');
			e.stopPropagation();
		};

		// Function for handling layer remove button
		removeLayer = function (e) {
			accordion = e.data;
			accordion.layerManager.removeLayer(layer);
			accordion.domNode.dynaccordion('removeSection', {id: layer.id});
			accordion.layerSettings.unset(layer.id);
			accordion.layerManager.refreshSavedTileLayers();

			//accordion.layers = accordion.layers.without(layer.id);
			e.stopPropagation();
		};
		
		// Event handlers for select items
		jQuery.each(jQuery('#' + layer.id + ' > div > select'), function (i, item) {
			jQuery(item).change(function (e) {
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
			});
		});

		// Display FITS header
		fitsBtn.bind('click', this, this._showFITS.bindAsEventListener(this, layer));

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	},
    
    /**
     * @description Displays the FITS header information associated with a given image
     * @param {Object} event
     * @param {Object} layer
     */
	_showFITS: function (event, layer) {
        var dialogId, response, sortBtn, formatted, processResponse, xhr;
        
		dialogId = "fits-header-" + layer.id;
		
		// Check to see if a dialog already exists
		if (jQuery("#" + dialogId).length === 0) {
		
			// Ajax Responder
			processResponse = function (transport) {
				response = transport.responseJSON;
					
				// Format results
				formatted =  "<div id='" + dialogId + "' style='overflow: auto; position: relative; padding:0px'>";
                formatted += "<div class='fits-regular'>";
				$A(response).each(function (line) {
					formatted += line + "<br>";
				});
				formatted += "</div>"
                
                // Store a sort version as well
                formatted += "<div class='fits-sorted' style='display: none;'>";
                $A(response.sort()).each(function (line) {
					formatted += line + "<br>";
				});
                
                formatted += "</div></div>";
                
       			jQuery("body").append(formatted);

                // Button to toggle sorting
                sortBtn = "<span class='fits-sort-btn'>Abc</span>";
                jQuery("#" + dialogId).append(sortBtn);    
                jQuery("#" + dialogId + " > span").click(function() {
                    jQuery(this).toggleClass("italic");
        			jQuery("#" + dialogId + " .fits-sorted").toggle();
           			jQuery("#" + dialogId + " .fits-regular").toggle();
                });
                                
				jQuery("#" + dialogId).dialog({
					autoOpen: true,
					title: "FITS Header: " + layer.name,
					width: 400,
					height: 350,
					draggable: true
				});
			};
			
			// Ajax Request
			xhr = new Ajax.Request("api/index.php", {
				method: 'POST',
				onSuccess: processResponse.bind(this),
				parameters: {
					action:  "getJP2Header",
					imageId: layer.imageId
				}
			});
			
		// If it does exist but is closed, open the dialog
		} else {
			if (!jQuery("#" + dialogId).dialog("isOpen")) {
				jQuery("#" + dialogId).dialog("open");
			} else {
				//jQuery("#" + dialogId).dialog("destroy");
				jQuery("#" + dialogId).dialog("close");
			}
		}	
	},
		
	
	/**
 	 * @description Checks to make sure the new layer settings are valid. If the new combination of
	 * choices are not compatable, change values to right of most-recently changed parameter to valid
	 * settings. Once the combination is acceptable, reload the tile layer.
	 * @param {TileLayer} layer The layer to which the changes have been made
	 * @param {String} changed The field altered
	 * @param {String} The new value chosen
	 */
	_onLayerSelectChange: function (layer, changed, value) {
		var obs, inst, det, meas, xhr, processResponse;
		
		// Ajax callback function
		processResponse = function (transport) {
			// Update options
			this.options = transport.responseJSON;

			// Case 1: Observatory changed
			if (changed === "observatory") {
				this._updateOptions(layer.id, "instrument", this.options.instruments);
				
				//Make sure the instrument choice is still valid.
				if ($A(this.options.instruments).grep(layer.instrument).length === 0) {
					layer.instrument = this.options.instruments[0];
				}
			}
			
			// Case 2: Instrument changed
			if ((changed === "observatory") || (changed === "instrument")) {
				this._updateOptions(layer.id, "detector", this.options.detectors);
				
				//Make sure the detector choice is still valid.
				if (!$A(this.options.detectors).find(function (det) {
    				return det.abbreviation === layer.detector;
				})) {
					layer.detector = this.options.detectors[0].abbreviation;
				}
			}
			
			// Case 3: Detector changed
			if ((changed === "observatory") || (changed === "instrument") || (changed === "detector")) {
				this._updateOptions(layer.id, "measurement", this.options.measurements);	
				
				//Make sure the measurement choice is still valid.
				if (!$A(this.options.measurements).find(function (meas) {
    				return meas.abbreviation === layer.measurement;
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
			
			// Update stored user settings
			this.layerManager.refreshSavedTileLayers();
		};
		
		// Do not need to update options if the measurement is changed
		if (changed !== "measurement") {
			// Update SELECT options
			obs  = (changed === "observatory" ? value : layer.observatory);
			inst = (changed === "instrument"  ? value : layer.instrument);
			det  = (changed === "detector"    ? value : layer.detector);
			meas = (changed === "measurement" ? value : layer.measurement);
			
			// Ajax Request
			xhr = new Ajax.Request(this.queryURL, {
				method: 'POST',
				onSuccess: processResponse.bind(this),
				parameters: {
					action: "getLayerAvailability",
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
			
			// Update stored user settings
			this.layerManager.refreshSavedTileLayers();
		}
	},
	
	/**
	 * @description Updates options for a single SELECT element.
	 * @param {String} id The ID of the layer whose parameters were adjusted 
	 * @param {String} field The field to adjust
	 * @param {Array} newOptions updated choices
	 */
	_updateOptions: function (id, field, newOptions) {
		var select, opt;
		
		//Remove old options
		$$('#' + field + '-select-' + id + ' > option').each(function (o) {
			o.remove();
		});
		
		//Add new options
		select = $(field + '-select-' + id);
		$A(newOptions).each(function (o) {
			opt = new Element('option', {value: o.abbreviation}).insert(o.name === "" ? o.abbreviation : o.name);
			select.insert(opt);
		});
		
	},
    
    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    updateTimeStamp: function (layer) {
		var domNode, date, dateString, timeDiff, ts;
		
    	//Grab timestamp dom-node
    	domNode = $(layer.id).select('.timestamp').first();
    	
        //remove any pre-existing styling
        domNode.removeClassName("timeBehind");
        domNode.removeClassName("timeAhead");
        domNode.removeClassName("timeSignificantlyOff");
                
        // Update the timestamp
        date = new Date(layer.timestamp * 1000);
        dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();

        // Calc the time difference
        timeDiff = layer.timestamp - this.layerManager.controller.date.getTime() / 1000;

        //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
        domNode.update(dateString);
        
        //get timestep (TODO: create a better accessor)
        //var ts = this.layerManager.controller.timeStepSlider.timestep.numSecs;
		ts = this.layerManager.controller.timeIncrementSecs;
        
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
	 * @description Updates the description for a given tile layer
	 * @param {String} id Layer id
	 * @param {String} desc New description to use 
	 */
	updateLayerDesc: function (id, desc) {
		$(id).select("span.tile-accordion-header-left").first().update(desc);
	}    
});

/**
 * @fileOverview Contains the class definition for an TimeControls class.
 * Syntax: Prototype
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global TimeControls, Class, UIElement, Event, Element, $, $A */
var TimeControls = Class.create(UIElement,
	/** @lends TimeControls.prototype */
	{
    /**
     * @constructs
     * @description Creates a new TimeControl component
     * @param {Object} controller Reference to the Helioviewer application class/controller
     * @param {String} incrementSelect ID for the HTML element for selecting the time increment
     * @param {String} backBtn ID for the time "Back" button
     * @param {String} forwardBtn ID for the time "Forward" button
     * @param {Int} timeIncrement The amount of time to jump, in seconds, each time the back button or forward button is pressed
     */
    initialize : function (controller, incrementSelect, backBtn, forwardBtn, timeIncrement) {
        this.controller = controller;
        
        //Private member variables
        this.className = "TimeControls";
        
        // Set increment 
        this._timeIncrement = timeIncrement;
		
		// Populate select box
		this._addTimeIncrements(incrementSelect);
        
        // Event-handlers
        Event.observe(backBtn,    'click', this.timePrevious.bind(this));
        Event.observe(forwardBtn, 'click', this.timeNext.bind(this));
    },
    
    /**
     * @description Populates the time increment select item
     * @param {String} selectId The ID for the SELECT form item associated with the desired time increment
     */
    _addTimeIncrements: function (selectId) {
		var timeSteps, select, opt;
		
        timeSteps = [
            {numSecs: 1,       txt: "1&nbsp;Sec"},
            {numSecs: 60,      txt: "1&nbsp;Min"},
            {numSecs: 300,     txt: "5&nbsp;Mins"},
            {numSecs: 900,     txt: "15&nbsp;Mins"},
            {numSecs: 3600,    txt: "1&nbsp;Hour"},
            {numSecs: 21600,   txt: "6&nbsp;Hours"},
            {numSecs: 43200,   txt: "12&nbsp;Hours"},
            {numSecs: 86400,   txt: "1&nbsp;Day"},
            {numSecs: 604800,  txt: "1&nbsp;Week"},
            {numSecs: 2419200, txt: "28&nbsp;Days"},
            {numSecs: 31556926,txt: "1&nbsp;Year"}
        ];
        
		select = $(selectId);
		
		// Add time-steps to the select menu
		$A(timeSteps).each(function (o) {
			opt = new Element('option', {value: o.numSecs}).insert(o.txt);
			select.insert(opt);
		});
		
		// Select default timestep
		select.select('option[value=' + this._timeIncrement + ']')[0].writeAttribute('selected', 'selected');
		
		// Event-handler
		Event.observe(select, 'change', this._onChange.bindAsEventListener(this));
    },
    
   /**
    * @description Time-incremenet change event handler
    * @param {Event} e Prototype Event Object
    */
    _onChange: function (e) {
		this._timeIncrement = parseInt(e.target.value, 10);
		this.fire('timeIncrementChange', this._timeIncrement);
    },
      
   /**
    * @description Move back one time incremement
    */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this._timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    },
    
    /**
     * @function Move forward one time increment
     */
    timeNext: function () {
        var newDate = this.controller.date.addSeconds(this._timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    } 
});
/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * Syntax: Prototype, jQuery
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global Class, CookieJar, $H */
var UserSettings = Class.create(
	/** @lends UserSettings.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new UserSettings instance. Because all cookie data is stored as strings, numeric types
	 *              must be specified (e.g. in _INTGER_PARAMS) so that the application knows to parse them as such.
	 * @param {Object} controller A reference to the Helioviewer application class
	 */
	initialize: function (controller) {
		this.controller = controller;
		
		/**
		 * @description Default user settings
		 */
		this._DEFAULTS = $H({
			'obs-date'			: 1065312000000,
			'zoom-level'		: this.controller.defaultZoomLevel,
			'tile-layers'		: [{ tileAPI: "api/index.php", observatory: 'SOH', instrument: 'EIT', detector: 'EIT', measurement: '304' }],
			'warn-zoom-level'	: false,
			'warn-mouse-coords'	: false,
			'event-icons'		: {
				'VSOService::noaa':				'small-blue-circle',
				'GOESXRayService::GOESXRay':	'small-green-diamond',
				'VSOService::cmelist':			'small-yellow-square'
			}
		});
		
		this._INTEGER_PARAMS = $A(['obs-date', 'zoom-level']);
		this._FLOAT_PARAMS   = $A([]);
		this._BOOLEAN_PARAMS = $A(['warn-zoom-level', 'warn-mouse-coords']);


		this.cookies = new CookieJar({
			expires: 31536000, //1 year
			path: '/'
		});
		
		if (!this._exists()) {
			this._loadDefaults();
		}
	},
	
	/**
	 * @description Saves a specified setting
	 * @param {String} key The setting to update
	 * @param {JSON} value The new value for the setting
	 */
	set: function (key, value) {
		if (this._validate(key, value)) {
			this.cookies.put(key, value);
		} else {
			//console.log("Ignoring invalid user-setting...");
		}
	},
	
	/**
	 * @description Gets a specified setting
	 * @param {String} key The setting to retrieve
	 * @returns {JSON} The value of the desired setting
	 */
	get: function (key) {
		// Parse numeric types
		if (this._INTEGER_PARAMS.include(key)) {
			return parseInt(this.cookies.get(key));
		}
		else if (this._FLOAT_PARAMS.include(key)) {
			return parseFloat(this.cookies.get(key));
		}
		else if (this._BOOLEAN_PARAMS.include(key)) {
			return this.cookies.get(key) == "true" ? true : false;
		}
		return this.cookies.get(key);
	},
	
	/**
	 * @description Checks to see if user-settings cookies have been set.
	 */
	_exists: function () {
		return (this.cookies.getKeys().length > 0);
	},
	
	/**
	 * @description Validates a setting (Currently checks observation date and zoom-level)
	 * @param {String} setting The setting to be validated
	 * @param {String} value The value of the setting to check
	 */
	_validate: function (setting, value) {
		switch (setting) {
		case "obs-date":
			if (isNaN(value)) {
				return false;
			}
			break;
		case "zoom-level":
			if ((isNaN(value)) || (value < this.controller.minZoomLevel) || (value > this.controller.maxZoomLevel)) {
				return false;
			}
			break;
		default:
			break;		
		}
		return true;
	},
	
	/**
	 * @description Resets a single setting to it's default value
	 * @param {String} setting The setting for which the default value should be loaded
	 */
	_resetSetting: function (setting) {
		this.set(setting, this._getDefault(setting));		
	},
	
	/**
	 * @description Gets the default value for a given setting
	 * @param {Object} setting
	 */
	_getDefault: function (setting) {
		return this._DEFAULTS.get(setting);
	},
	
	/**
	 * @description Loads defaults if cookies have not been set prior.
	 */
	_loadDefaults: function () {
		var self = this;
		this._DEFAULTS.each(function (setting) {
			self.set(setting.key, setting.value);
		});
	}
});
/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see ViewportHandlers
 */
/*global Class, UIElement, $, Builder, Element, ViewportHandlers, document */
var Viewport = Class.create(UIElement, 
	/** @lends Viewport.prototype */
	{
	/**
	 * @description Default Viewport settings
	 */ 
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		tileSize:  512,
		minHeight: 450,
		debug:     false,
		prefetch:  0  //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	dimensions: { width: 0, height: 0 },

	/**
	 * @constructs
	 * @description Creates a new Viewport
	 * @param {Object} controller A Reference to the Helioviewer application class
	 * @param {Object} options Custom Viewport settings
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>zoomLevel</b> - The default zoomlevel to display (should be passed in from Helioviewer).<br>
	 *		<b>headerId</b>  - Helioviewer header section id.<br>
	 *		<b>footerId</b>	 - Helioviewer footer section id.<br>
	 *		<b>tileSize</b>	 - Size of tiles.<br> 
	 *		<b>debug</b>     - Display additional information for debugging purposes.<br>
	 *		<b>prefetch</b>	 - The radius outside of the visible viewport to prefetch.<br>
	 * </div>
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		
		var center, centerBox;

		this.domNode            = $(this.id);
		this.innerNode          = $(this.id + '-container-inner');
		this.outerNode          = $(this.id + '-container-outer');
		this.controller         = controller;
		this.mouseCoords        = "disabled";
		this.ViewportHandlers   = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4 + 30;

		// Resize to fit screen
		this.resize();
		
		// Determine center of viewport
		center = this.getCenter();
		
		// Create a container to limit how far the layers can be moved
		this.sandbox = $(this.domNode.appendChild(Builder.node('div', {id: 'sandbox'})));
		this.sandbox.setStyle({'position': 'absolute', 'width': '0px', 'height': '0px', 'left': center.x + 'px', 'top': center.y + 'px'});
		
		// Create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.sandbox.appendChild(Builder.node('div', {id: 'moving-container'})));
		this.movingContainer.setStyle({'left': 0, 'top': 0});

		// For Debugging purposes only
		if (this.debug) {
			this.movingContainer.setStyle({'border': '1px solid red'});
			
			centerBox = new Element('div', {id: 'vp-debug-center', style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
			centerBox.setStyle({'left': (center.x - 25) + 'px', 'top': (center.y - 25) + 'px'});
			this.domNode.insert(centerBox);
		}
	},
	
	/**
	 * @description Centers the viewport.
	 */
	center: function () {
		//var center = this.getCenter();
		var sb = this.sandbox.getDimensions();
		
		this.moveTo(0.5 * sb.width, 0.5 * sb.height);
	},

	/**
	 * @description Move the viewport focus to a new location.
	 * @param {Int} x X-value
	 * @param {Int} y Y-value
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
	 * @description Moves the viewport's focus
	 * @param {Int} x X-value
	 * @param {Int} y Y-value
	 */   
	moveBy: function (x, y) {
		// Sandbox dimensions
		var sandbox = this.sandbox.getDimensions(),
		
		pos = {
			x: Math.min(Math.max(this.startMovingPosition.x - x, 0), sandbox.width),
			y: Math.min(Math.max(this.startMovingPosition.y - y, 0), sandbox.height)
		};
		
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
		this.checkTiles();
		this.fire('move', { x: pos.x, y: pos.y });
	},
	
	/**
	 * @description Event-handler for a mouse-drag start.
	 */
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @description Get the coordinates of the viewport center
	 * @returns {Object} The X & Y coordinates of the viewport's center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth()  / 2),
			y: Math.round(this.domNode.getHeight() / 2)
		};
	},
	
	/**
	 * @description Get the current coordinates of the moving container
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	getContainerPos: function () {
		return {
			x: parseInt(this.movingContainer.getStyle('left'), 10),
			y: parseInt(this.movingContainer.getStyle('top'), 10)
		};
	},
	
	/**
	 * @description Alias for getContainerPos function
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	currentPosition: function () {
		return this.getContainerPos();
	},
	
	/**
	 * @description Another alias for getContainerPos: returns the pixel coorindates of the HelioCenter relative to the viewport top-left corner.
	 * @returns {Object} The X & Y coordinates of the viewport's top-left corner
	 */
	helioCenter: function () {
		return this.getContainerPos();
	},

	/**
	 * @description Event handler fired after dragging
	 */
	endMoving: function () {
	},
	
	/**
	 * @description Algorithm for determining which tiles should be displayed at
	 *              a given time. Uses the Heliocentric coordinates of the viewport's
	 *              TOP-LEFT and BOTTOM-RIGHT corners to determine range to display.
	 */
	checkTiles: function () {
		var i, j, indices;
		
		this.visible = [];
		
		indices = this.displayRange();
		
		// Update visible array
		for (i = indices.xStart; i <= indices.xEnd; i += 1) {
			for (j = indices.yStart; j <= indices.yEnd; j += 1) {
				if (!this.visible[i]) {
					this.visible[i] = [];
				}
				this.visible[i][j] = true;
			}
		}
	},
	
	/**
	 * @description Update the size and location of the movement-constraining box.
	 */
	updateSandbox: function () {
		var maxDimensions, old, center, newSize, change, movingContainerOldPos, newHCLeft, newHCTop, padHeight, shiftTop;
		
		this.dimensions = this.domNode.getDimensions();
		maxDimensions   = this.controller.layerManager.getMaxDimensions();
		old             = this.sandbox.getDimensions();
		center          = this.getCenter();
		
		// New sandbox dimensions
		newSize = {
			width : Math.max(0, maxDimensions.width  - this.dimensions.width),
			height: Math.max(0, maxDimensions.height - this.dimensions.height)
		};
		
		if (this.debug) {
			$('vp-debug-center').setStyle({'left': center.x - 25 + 'px', 'top': center.y - 25 + 'px'});
		}
	
		// Difference
		change = {
			x: newSize.width  - old.width,
			y: newSize.height - old.height
		};
		
		// Initial moving container position
		movingContainerOldPos = this.movingContainer.positionedOffset();	
		
		// Update sandbox dimensions
		this.sandbox.setStyle({
			width  : newSize.width  + 'px',
			height : newSize.height + 'px',
			left   : center.x - (0.5 * newSize.width) + 'px',
			top    : center.y - (0.5 * newSize.height) + 'px'			
		});
		
		// Update moving container position
		newHCLeft = Math.max(0, Math.min(newSize.width,  movingContainerOldPos[0] + (0.5 * change.x)));
		newHCTop  = Math.max(0, Math.min(newSize.height, movingContainerOldPos[1] + (0.5 * change.y)));
		
		this.movingContainer.setStyle({
			left: newHCLeft + 'px',
			top : newHCTop  + 'px'
		});
	},
	
	/**
	 * @description Returns the range of indices for the tiles to be displayed.
	 * @returns {Object} The range of tiles which should be displayed
	 */
	displayRange: function () {
		var vp, ts;
		
		// Get heliocentric viewport coordinates
		vp = this.getHCViewportPixelCoords();
		
		// Expand to fit tile increment
		ts = this.tileSize;
		vp = {
			top:    vp.top    - ts - (vp.top % ts),
			left:   vp.left   - ts - (vp.left % ts),
			bottom: vp.bottom + ts - (vp.bottom % ts),
			right:  vp.right  + ts - (vp.right % ts)
		};
		
		// Indices to display (one subtracted from ends to account for "0th" tiles).
		this.visibleRange = {
			xStart: vp.left   / ts,
			xEnd:   (vp.right  / ts) - 1,
			yStart: vp.top    / ts,
			yEnd:   (vp.bottom / ts) - 1
		};
		
		return this.visibleRange;
	},

	/**
	 * @description Returns the heliocentric coordinates of the upper-left and bottom-right corners of the viewport
	 * @returns {Object} The coordinates for the top-left and bottom-right corners of the viewport
	 */
	getHCViewportPixelCoords: function () {
		var sb, mc, vpDimensions;
		
		sb = this.sandbox.positionedOffset();
		mc = this.movingContainer.positionedOffset();
		vpDimensions = this.domNode.getDimensions();
		
		return {
			left:  -(sb[0] + mc[0]),
			top :  -(sb[1] + mc[1]),
			right:  vpDimensions.width  - (sb[0] + mc[0]),
			bottom: vpDimensions.height - (sb[1] + mc[1])
		};
	},

	/**
	 * @description Zooms To a specified zoom-level.
	 * @param {Int} zoomLevel The desired zoomLevel
	 */
	zoomTo: function (zoomLevel) {
		this.zoomLevel = zoomLevel;
		
		// reset the layers
		this.checkTiles();
		this.controller.layerManager.resetLayers(this.visible);
	
		// update sandbox
		this.updateSandbox();
		
		// store new value
		this.controller.userSettings.set('zoom-level', zoomLevel);
	},

	/**
	 * @description Adjust viewport dimensions when window is resized.
	 */
	resize: function () {
		var oldDimensions, h, viewportOuter, padHeight;
		
		// Get dimensions
		oldDimensions = this.dimensions;
        
        // Make room for footer and header if not in fullscreen mode
        if (!jQuery('#outsideBox').hasClass('fullscreen-mode')) {
            padHeight = this.headerAndFooterHeight;
        } else {
            padHeight = 0;
        }
		
		// Ensure minimum height
		h = Math.max(this.minHeight, document.viewport.getHeight() - padHeight);

		//Update viewport height
		viewportOuter =  this.outerNode;
		viewportOuter.setStyle({height: h + 'px'});

		this.dimensions = this.domNode.getDimensions();
		
		this.dimensions.width  += this.prefetch;
		this.dimensions.height += this.prefetch;
		
		if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
			if (this.controller.layerManager.layers.length > 0) {
				this.updateSandbox();
				this.checkTiles();
				this.controller.layerManager.resetLayers(this.visible);
			}
		}
	}
});
/**
 * @fileOverview Contains the class definition for an ViewportHandlers class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Class, document, window, Event, $, $$ */
var ViewportHandlers = Class.create(
	/** @lends ViewportHandlers.prototype */
	{
	startingPosition:      { x: 0, y: 0 },
	mouseStartingPosition: { x: 0, y: 0 },
	mouseCurrentPosition:  { x: 0, y: 0 },
	mouseCoords  :         { x: 0, y: 0 },
	moveCounter  : 0,
	moveThrottle : 2,
	naturalZoomLevel  : 10,
	naturalResolution : 2.63,
	rSunArcSeconds    : 975,

	/**
	 * @constructs
	 * @description Contains a collection of event-handlers for dealing with Viewport-related events
	 * @see Viewport
	 * @param {Object} viewport A Reference to the Helioviewer application class
	 */
	initialize: function (viewport) {
		this.viewport = viewport;

		//Mouse-related event-handlers
		//Event.observe(window,   'mousemove', this.mouseMove.bindAsEventListener(this));
		Event.observe(document, 'mousemove', this.mouseMove.bindAsEventListener(this));
		//Event.observe(window,   'mouseup', this.mouseUp.bindAsEventListener(this));
		Event.observe(document, 'mouseup', this.mouseUp.bindAsEventListener(this));
		Event.observe(viewport.domNode, 'mousedown', this.mouseDown.bindAsEventListener(this));

		// Double-clicks
		Event.observe(this.viewport.domNode, 'dblclick', this.doubleClick.bindAsEventListener(this));

		// Mouse-wheel
		Event.observe(this.viewport.domNode, "mousewheel", this.mouseWheel.bindAsEventListener(this), false);
		Event.observe(this.viewport.domNode, "DOMMouseScroll", this.mouseWheel.bindAsEventListener(this), false); // Firefox

		//Keyboard-related event-handlers
		Event.observe(document, 'keypress', this.keyPress.bindAsEventListener(this));
		Event.observe(window, 'keypress', this.keyPress.bindAsEventListener(this));
	},

	/**
	 * @description Fired when a mouse is pressed
	 * @param {Event} event Prototype Event class
	 */
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

	/**
	 * @description Handles double-clicks
	 * @param {Event} e Prototype Event class
	 */
	doubleClick: function (e) {
		var pos,
			viewport = this.viewport;
		
		//check to make sure that you are not already at the minimum/maximum zoom-level
		if ((e.shiftKey || (viewport.zoomLevel > viewport.controller.minZoomLevel)) && (viewport.zoomLevel < viewport.controller.maxZoomLevel)) {
			if (e.isLeftClick()) {
				
				pos = this.getRelativeCoords(e.pointerX(), e.pointerY());
				
				//var test = 'position: absolute; background-color: yellow; border: 1px solid blue; width:5px; height: 5px; left:' + pos.x + 'px; top: ' + pos.y + 'px;';
				//viewport.domNode.insert(new Element('div', {style: test}));
				
				viewport.center();				
				this.viewport.startMoving();

				//adjust for zoom
				if (e.shiftKey) {
					viewport.moveBy(0.5 * pos.x, 0.5 * pos.y);
					viewport.controller.zoomControl.zoomButtonClicked(1);
				}
				else {
					viewport.moveBy(2 * pos.x, 2 * pos.y);
					viewport.controller.zoomControl.zoomButtonClicked(-1);
				}
			}
		} else {
			//console.log("Out of bounds double-click request! See Viewport.js:57");
		}
	},
	
	/**
	 * @description Handles mouse-wheel movements
	 * @param {Event} event Prototype Event class
	 */
	mouseWheel: function (e) {
		this.viewport.controller.zoomControl.zoomButtonClicked(-Event.wheel(e));
	},
	
	/**
	 * @description Get the mouse-coords relative to top-left of the viewport frame
	 * @param {Int} screenx X-dimensions of the user's screen
	 * @param {Int} screeny Y-dimensions of the user's screen
	 */
	getRelativeCoords: function (screenx, screeny) {
		var vp, offset, mouseCoords;
		
		vp = this.viewport;
		
		//Compute offset from top-left of browser viewport
		//var xOffset = $('left-col').getDimensions().width   + Math.round(0.03 * vp.outerNode.getDimensions().width) + 2;
		//var yOffset = $(vp.headerId).getDimensions().height + Math.round(0.03 * vp.outerNode.getDimensions().height) + 3;
		offset = $('helioviewer-viewport-container-inner').positionedOffset();

		// Mouse-coordinates relative to the top-left of the viewport
		//var mouseCoords = {
		//	x: screenx - xOffset,
		//	y: screeny - yOffset
		//}
		mouseCoords = {
			x: screenx - offset[0] - 1,
			y: screeny - offset[1] - 1
		};
		return mouseCoords;
	},

	/**
	 * @description Keyboard-related event-handlers
	 */
	keyPress: function (e) {
		var key = e.keyCode;

		//Ignore event if user is type in an input form field
		if (e.target.tagName !== "INPUT") {

			//Arrow keys (move viewport)
			if (key === 37 || key === 38 || key === 39 || key === 40) {
				this.startingPosition = this.viewport.currentPosition();
				this.viewport.startMoving();
				this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
				if (this.moveCounter !== 0) {
					return;
				}

				//Right-arrow
				if (key === 37) {
					this.viewport.moveBy(8, 0);
				}

				//Up-arrow
				else if (e.keyCode === 38) {
					this.viewport.moveBy(0, 8);
				}
				//Left-arrow
				else if (e.keyCode === 39) {
					this.viewport.moveBy(-8, 0);
				}

				//Down-arrow
				else if (e.keyCode === 40) {
					this.viewport.moveBy(0, -8);
				}
			}
		}
	},

	/**
	 * @description Fired when a mouse button is released
	 * @param {Event} event Prototype Event object
	 */
	mouseUp: function (event) {
		//this.viewport.output('up');
		this.viewport.isMoving = false;
		this.viewport.domNode.setStyle({ cursor: 'pointer' });
		if (this.viewport.domNode.releaseCapture) {
			this.viewport.domNode.releaseCapture();
		}
		this.viewport.endMoving();
	},

	/**
	 * @description Fired when a keyboard key is released
	 * @param {Object} event Prototype Event object
	 */
	keyRelease: function (event) {
		this.viewport.isMoving = false;
		this.viewport.endMoving();
	},

	/**
	 * @description Handle drag events
	 * @param {Object} event Prototype Event object
	 */
	mouseMove: function (event) {
		if (!this.viewport.isMoving) {
			return;
		}
		
		var sb = this.viewport.sandbox.getDimensions();
		if ((sb.width === 0) && (sb.height === 0)) {
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

		this.viewport.moveBy(this.mouseStartingPosition.x - this.mouseCurrentPosition.x, this.mouseStartingPosition.y - this.mouseCurrentPosition.y);
	},
	
	/**
	 * @description Toggles mouse-coords visibility
	 */
	toggleMouseCoords: function () {
		var vp, mouseCoordsX, mouseCoordsY, updateMouseCoords, self = this;
		// Case 1: Disabled -> Arcseconds 
		if (this.viewport.mouseCoords === "disabled") {
			this.viewport.mouseCoords = "arcseconds";
			$('mouse-coords').toggle();
		}
		// Case 2: Arcseconds -> Polar Coords
		else if (this.viewport.mouseCoords === "arcseconds") {
			this.viewport.mouseCoords = "polar";
		}
		// Case 3: Polar Coords -> Disabled
		else {
			$('mouse-coords').toggle();
			this.viewport.mouseCoords = "disabled";
			//console.log("Polar Coords -> Disabled");
		}
		
		// Warn once
		if (this.viewport.controller.userSettings.get('warn-mouse-coords') === "false") {
			this.viewport.controller.messageConsole.log("Note: Mouse-coordinates should not be used for science operations!");
			this.viewport.controller.userSettings.set('warn-mouse-coords', true);
		}
		
		// Cartesian & Polar coords
		if (this.viewport.mouseCoords !== "disabled") {
			mouseCoordsX = $('mouse-coords-x');
			mouseCoordsY = $('mouse-coords-y');
			
			// Clear old values
			mouseCoordsX.update("");
			mouseCoordsY.update("");
			
			// Remove existing event handler if switching from cartesian -> polar
			if (this.viewport.mouseCoords === "polar") {
				Event.stopObserving(this.viewport.movingContainer, "mousemove");
			}
			
			// Event-handler
			updateMouseCoords = function (e) {
				var VX, negSV, SV, SM, MX, scale, x, y, polar;
								
				// Store current mouse-coordinates
				self.mouseCoords = {x: e.pageX, y: e.pageY};
				
				// Threshold
				self.moveCounter = (self.moveCounter + 1) % self.moveThrottle;
				if (self.moveCounter !== 0) {
					return;
				}
				
				// Coordinates realtive to viewport top-left corner
				VX = self.getRelativeCoords(e.pageX, e.pageY);
				negSV = self.viewport.sandbox.positionedOffset();
				SV = {
					x: -negSV[0],
					y: -negSV[1]
				};
				SM = $('moving-container').positionedOffset();				
				MX = {
					x: VX.x + (SV.x - SM[0]),
					y: VX.y + (SV.y - SM[1])
				};
				
				//scale
				scale = self.naturalResolution * Math.pow(2, self.viewport.zoomLevel - self.naturalZoomLevel);
				x = Math.round((scale * MX.x));
				y = - Math.round((scale * MX.y));
				
				// Arc-seconds
				if (self.viewport.mouseCoords === "arcseconds") {
					mouseCoordsX.update("x: " + x + " &prime;&prime;");
					mouseCoordsY.update("y: " + y + " &prime;&prime;");
					
				// Polar coords
				} else {
					polar = Math.toPolarCoords(x, -y);	
				
					mouseCoordsX.update(((polar.r / self.rSunArcSeconds) + "").substring(0, 5) + " R<span style='vertical-align: sub; font-size:10px;'>&#9737;</span>");
					mouseCoordsY.update(Math.round(polar.theta) + " &#176;");
				}
			};	
			Event.observe(this.viewport.movingContainer, "mousemove", updateMouseCoords);
			
			// Execute handler once immediately to show new coords
			updateMouseCoords({pageX: this.mouseCoords.x, pageY: this.mouseCoords.y});
			
		} else {
			Event.stopObserving(this.viewport.movingContainer, "mousemove");
		}
	}
});
/**
 * @fileOverview Contains the class definition for an ZoomControl class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
 */
/*global UIElement, Class, Control, Event, $R, $ */
var ZoomControl = Class.create(UIElement,
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
    	this.fire('change', v);
    }
});
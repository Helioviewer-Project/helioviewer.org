/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview Contains the class definition for an EventLayer class.
 * @see Layer, TileLayer
 *
 * Syntax: jQuery, Prototype ()
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
		
    	queryDate = this.viewport.controller.date.toISOString();

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
			date = this.viewport.controller.getDate(),
			sunRadius = this.sunRadius0 >> this.viewport.zoomLevel;
		
		// Stylize each event marker based on it's the event type
		$A(jsonEvents).each(function (event) {
			self.events.push(new EventMarker(self, event, date, sunRadius, {offset: self.eventMarkerOffset}));
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
			event.marker.css('background', url);
		});
		
		// Update event accordion icon
		jQuery('#event-icon-' + this.id).css('background', url);
		
		// Update user's stored settings
		this.eventAccordion.eventIcons[this.catalog] = "small-" + newIcon;
		this.viewport.controller.userSettings.set('eventIcons', this.eventAccordion.eventIcons);
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
	},
    
    // 2009/07/06 TODO
    toString: function () {
    },    
    toJSON: function () {
    }
});

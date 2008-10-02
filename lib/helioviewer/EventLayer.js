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
		displayLabels: false,
		windowSize: 43200
	},

	/**
	 * @constructor
	 */
	initialize: function (viewport, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		this.viewport = viewport;

		this.id = 'eventlayer' + Math.floor(Math.random() * 100000 + 1);

		this.events = $A([]);

		this.domNode = new Element('div', {className: 'event-layer'});
		this.viewport.movingContainer.appendChild(this.domNode);
		
		this.queryEvents();
	},

	queryEvents: function () {
		var processResponse = function (transport) {
			this.clear();
			if (transport.responseJSON) {
				this.displayEvents(transport.responseJSON);
			}
			
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
			self.events.push(new EventMarker(self, event, date, UTCOffset, sunRadius));
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

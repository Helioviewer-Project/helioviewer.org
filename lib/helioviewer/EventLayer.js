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

		this.id = 'eventlayer' + new Date().getTime();

		this.events = $A([]);

		this.domNode = new Element('div', {className: 'event-layer'});
		this.viewport.movingContainer.appendChild(this.domNode);
	
		// Add to eventLayer Accordion (if is not already there).
		this.eventAccordion.addLayer(this);
		
		this.queryEvents();
	},

	queryEvents: function () {
		// Ajax responder
		var processResponse = function (transport) {
			this.clear();
			if (transport.responseJSON) {
				this.displayEvents(transport.responseJSON);
			}			
		};

		// Ajax request
		var xhr = new Ajax.Request(this.viewport.controller.eventAPI, {
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
		
		// Stylize each event marker based on it's the event type
		$A(jsonEvents).each(function (event) {
			self.events.push(new EventMarker(self, event, date, UTCOffset, sunRadius, {offset: self.eventMarkerOffset}));
		});
	},
	
	updateIcon: function (newIcon) {
		this.icon = "small-" + newIcon;
		var type = this.eventAccordion.eventCatalogs.get(this.catalog).eventType.gsub(' ', "_");
		var url = 'url(images/events/small-' + newIcon + '-' + type + '.png)';
		
		// Update event markers
		this.events.each(function(event) {
			event.marker.setStyle({
				'background': url
			})
		});
		
		// Update event accordion icon
		jQuery('#event-icon-' + this.id).css('background', url);
		
		// Update user's stored settings
		this.eventAccordion.eventIcons[this.catalog] = "small-" + newIcon;
		this.viewport.controller.userSettings.set('event-icons', this.eventAccordion.eventIcons);
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

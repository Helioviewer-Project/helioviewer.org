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
			
			//Add to eventLayer Accordion
			this.eventAccordion.addLayer(this);
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

			//tooltip text
			var content = "<strong>" + type + " " + e.eventId + "</strong><br>" +
						"<p>" + catalogName + "</p><br>" +
						"<strong>Details:</strong><span style='color: #003399'> " + e.detail + "</span>";
						
			//make catalog id CSS-friendly
			var cssId = e.catalogId.sub('::', "_");     

			//create html dom-node
			var div = new Element('div', {className: cssId + ' event', style: 'position: absolute; left: ' + (pos.x - 2) + 'px; top: ' + (pos.y - 2) + 'px; z-index: 10', title: " - " + content });

			switch (type) {
				case "Active Region":
					div.setStyle({'background': 'url(images/events/activeregion.png)', 'height': '15px', 'width': '15px', 'border': 'none'});
					break;
				case "CME":
					div.setStyle({'background': 'url(images/events/cme.png)', 'height': '15px', 'width': '15px', 'border': 'none'});
					break;
			}
			
			//Create a hidden node with the events ID to be displayed upon user request
			var id = new Element('div', {className: 'eventId'}).setStyle({'background': '#4a4a4a', 'color': 'white', 'position': 'absolute', 'top': '15px', 'display': 'none'}).insert(e.eventId);
			div.insert(id);

			e.node = self.domNode.appendChild(div);
		});
	},
	
	/**
	 * @function flashEventIds
	 * @description Flash Event Id's on screen temporarily
	 */
	flashEventIds: function () {
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

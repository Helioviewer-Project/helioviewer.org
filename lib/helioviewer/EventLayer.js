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
				windowSize: this.windowSize,
				catalogs: this.catalog
			}
		});
	},

	viewportMove: function () {

	},

	displayEvents: function () {
		var self = this;
		var date = this.viewport.controller.date;
		var UTCOffset = - parseInt(date.getTimezoneOffset()) * 60;
		
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
				case "Type II Radio Burst":
					div.setStyle({'background': 'url(images/events/typeII_radioburst.png)', 'height': '15px', 'width': '15px', 'border': 'none'});
					details = e.startTime;
					break;
				default:
					details = e.startTime;
					break;
			}

			var display = (self.detailsEnabled ? "inline" : "none");
			
			//Determine time difference between desired time and event time
			var eventDate = Date.parse(e.startTime.substr(0,19)).addSeconds(UTCOffset);
			var timeDiff = eventDate.getTime() - date.getTime();
			
			//Create a hidden node with the events ID to be displayed upon user request
			var detailsNode = new Element('div', {className: 'eventId'}).setStyle({'background': '#4a4a4a', 'position': 'absolute', 'top': '15px', 'display': display}).insert(details);
			
			//Adjust style to reflect time difference
	        if (timeDiff < 0) {
	        	detailsNode.addClassName("timeBehind");
	        }
	        else if (timeDiff > 0) {
	        	detailsNode.addClassName("timeAhead");
	        }
			
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

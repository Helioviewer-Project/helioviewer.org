/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
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
		var display = (this.eventLayer.displayLabels ? "inline" : "none"),
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
	 * @description Toggles event label visibility
	 */	
	toggleLabel: function () {
		this.label.toggle();
	},
	
	/**
	 * @description Toggle event popup visibility
	 */	
	togglePopup: function () {
		this.popup.toggle();
	}
});

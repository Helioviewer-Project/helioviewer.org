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
		this.pos = eventLayer.viewport.getContainerRelativeCoordinates(this.sunX * sunRadius, this.sunY * sunRadius);
		this.container = this.eventLayer.domNode.appendChild(
			new Element('div', {className: 'event', style: 'left: ' + (this.pos.x - 2) + 'px; top: ' + (this.pos.y - 2) + 'px;'})
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
		var cssId = this.catalogId.sub('::', "_");
		
		//create html dom-node
		var marker = new Element('div', {className: cssId + ' ' +  this.type.sub(' ', '_') + ' event-marker'});
		
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
		//tooltip text (color #003399)
		var popup = new Element('div', {className: 'event-popup tooltip-topleft-large', style: 'display: none;'});
		var content = "<strong>" + this.type + " " + this.eventId + "</strong><br>" +
					"<p>" + this.catalogName + "</p><br>" +
					"<strong>start:</strong> " + this.startTime + "<br>" +
					"<strong>end:</strong> " + this.endTime + "<br><br>" +
					"<strong>Position Angle:</strong> " + this.polarCpa + "&deg; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
					"<strong>Width:</strong> " + this.polarWidth + "&deg;";
		popup.update(content);
		
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
		this.pos = this.eventLayer.viewport.getContainerRelativeCoordinates(this.sunX * sunRadius, this.sunY * sunRadius);
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

/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*global EventMarker, Class, $ */
var EventMarker = Class.extend(
	/** @lends EventMarker.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new EventMarker
	 * @param {Object} eventLayer EventLayer associated with the EventMarker
	 * @param {JSON} event Event details
	 * @param {Date} date The date when the given event occured
	 * @param {Int} sunRadius The radius of the sun in pixels
	 * @param {Object} options Extra EventMarker settings to use
	 */    
    init: function (eventLayer, event, date, sunRadius, options) {
    	$.extend(this, event);
		$.extend(this, options);
		
		this.eventLayer = eventLayer;
		this.appDate    = date;
		this.sunRadius  = sunRadius;
		
		//Determine event type and catalog
		var catalogs = eventLayer.eventAccordion.eventCatalogs;
		this.catalogName = catalogs[this.catalogId].name;
		this.type = catalogs[this.catalogId].eventType;
		
        // Work-around (2009/07/27): need id to use for Prototip: cannot wrap jQuery object with prototype $()
        this.htmlId = 'eventMarker' + new Date().getTime(); // can remove once prototip is dropped...
        
		//Create dom-nodes for event marker, details label, and details popup
		this.createMarker();
		this.createLabel();
		this.createPopup();
	},
	
	/**
	 * @description Creates the marker and adds it to the viewport
	 */
	createMarker: function () {
		//Create container
		this.pos = {
			x: this.sunX * this.sunRadius,
			y: this.sunY * this.sunRadius
		};
		
        this.container = $('<div id="' + this.htmlId + '" class="event" style="left: ' + this.pos.x + 'px; top: ' + this.pos.y + 'px;"></div>');
        
        // TODO: Remove jQuery wrapper once Layer & EventLayer are updated to use jQuery
        $(this.eventLayer.domNode).append(this.container);

		//make event-type CSS-friendly
        var cssType = this.type.replace(/ /g, "_");

        this.marker = $('<div class="event-marker"></div>');
        this.marker.css('background', 'url(images/events/' + this.eventLayer.icon + "-" + cssType + '.png)');
        
		this.container.append(this.marker);
	},
	
	/**
	 * @description Creates a small block of text which is displayed when the user pressed the "d" key ("details").
	 */
	createLabel: function () {
        var labelText, eventDate, timeDiff, display;

        display = this.eventLayer.viewport.controller.eventLayers.getLabelVisibility();

        labelText = this.getLabelText(this.type);

        //Determine time difference between desired time and event time
        eventDate = getUTCTimestamp(this.time.startTime);
        timeDiff  = eventDate - this.appDate.getTime();
        
        //Create a hidden node with the events ID to be displayed upon user request
        this.label = $('<div class="event-label" style="display: ' + display + ';">' + labelText + '</div>');
		
		//Adjust style to reflect time difference
        if (timeDiff < 0)
        	this.label.addClass("timeBehind");
        else if (timeDiff > 0)
        	this.label.addClass("timeAhead");
        
        this.container.append(this.label);
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
	
	/**
	 * @description Creates a popup which is displayed when the event marker is clicked
	 */
	createPopup: function () {
	    var content, t;

        // Add required parameters
        content = "<div class='event-popup-container'><strong>" + this.type + " " + this.eventId + "</strong><br>" +
                  "<p>" + this.catalogName + "</p><br><strong>start:</strong> " + this.time.startTime + "<br>" +
                  "<strong>end:</strong> " + this.time.endTime + "<br><br>";
        
        // Add custom parameters
        $.each(this.properties, function (key, value) {
            content += "<strong>" + key + ":</strong> " + value;
            if (key.search(/angle/i) !== -1) 
                content += "&deg;";
            
            content += "<br>";
        });
        
        content += "<strong>Source:</strong> <a href='" + this.sourceUrl + "' class='event-url' target='_blank'>" + this.sourceUrl + "</a><br></div>";
		
		$("#" + this.htmlId).qtip({
			
			position: {
				//target: this.container,
                container: this.container,
				type: 'static'
			},
            show: { when: { event: 'click' } },
            hide: { when: { event: 'click' } },			            
            content: {
				title: {
					text: "Details:",
					button: "x"
				},
				text : content
			},
			style: {
				textAlign: 'left',
				width: 250,
                padding: 8,
				button: {
					"color": "#FFF"
				},
				title: {
					"background-color": "#909A99"
				},
				tip: 'topLeft',
				border: {
                    width: 1,
                    radius: 6,
                    color: '#6e6e6e'
                }
			}
        });

        // Make sure details popup displays above other markers		
		this.container.one('click', function () {
			$(this).children(".qtip").css({
                "position" : "relative",
                "z-index"  : 6000,
				"left": 8,
				"top": 12	      
            });
		});
	},
	
	/**
	 * @description attempts to select an optimal orientation for the event marker popup
	 * (Not yet fully implemented...)
	 */
	chooseOrientation: function () {
		var dir, vpCoords, vpWidth, vpHeight, markerCoords, rel, EST_HEIGHT, EST_WIDTH;
		
		vpCoords     = $("#helioviewer-viewport").offset();
		markerCoords = $("#" + this.htmlId).offset();
		
		rel = {
			top : vpCoords.top  - markerCoords.top,
			left: vpCoords.left - markerCoords.left
		}
		
		// Estimated marker size
		EST_WIDTH  = 250;
		EST_HEIGHT = 250;
		
		vpWidth  = $("#helioviewer-viewport").width();
		vpHeight = $("#helioviewer-viewport").height();
		
		if ((vpHeight - rel.top) < EST_HEIGHT) {
			if ((vpWidth - rel.left) < EST_WIDTH)
                dir = "bottomRight";
			else
                dir = "bottomLeft";
		}
		else {
			if ((vpWidth - rel.left) < EST_WIDTH)
                dir = "topRight";
			else
                dir = "topLeft";
		}
		
		return dir;
	},
	
	/**
	 * @description Removes the EventMarker
	 */
	remove: function () {
        this.container.unbind();
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
		this.container.css({
			'left': (this.pos.x - 2) + 'px',
			'top' : (this.pos.y - 2) + 'px'
		});
	}
});

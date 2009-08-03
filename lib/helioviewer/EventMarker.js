/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 * 
 * Syntax: jQuery (x) (except for Prototip portion)
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
	 * @param {Int} sunRadius The radius of the sun in pixels
	 * @param {Object} options Extra EventMarker settings to use
	 */    
    initialize: function (eventLayer, event, date, sunRadius, options) {
    	Object.extend(this, event);
		Object.extend(this, options);
		
		this.eventLayer = eventLayer;
		this.appDate    = date;
		this.sunRadius  = sunRadius;
		
		//Determine event type and catalog
		var catalogs = eventLayer.eventAccordion.eventCatalogs;
		this.catalogName = catalogs.get(this.catalogId).name;
		this.type = catalogs.get(this.catalogId).eventType;
		
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
		
        this.container = jQuery('<div id="' + this.htmlId + '" class="event" style="left: ' + this.pos.x + 'px; top: ' + this.pos.y + 'px;"></div>');
        
        // TODO: Remove jQuery wrapper once Layer & EventLayer are updated to use jQuery
        jQuery(this.eventLayer.domNode).append(this.container);

		//make event-type CSS-friendly
        var cssType = this.type.replace(/ /g, "_");

        this.marker = jQuery('<div class="event-marker"></div>');
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
        this.label = jQuery('<div class="event-label" style="display: ' + display + ';">' + labelText + '</div>');
		
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
        content = "<div class='event-popup-container'>" +
        "<strong>" +
        this.type +
        " " +
        this.eventId +
        "</strong><br>" +
        "<p>" +
        this.catalogName +
        "</p><br>" +
        "<strong>start:</strong> " +
        this.time.startTime +
        "<br>" +
        "<strong>end:</strong> " +
        this.time.endTime +
        "<br><br>";
        
        // Add custom parameters
        jQuery.each(this.properties, function (key, value) {
            content += "<strong>" + key + ":</strong> " + value;
            if (key.search(/angle/i) !== -1) 
                content += "&deg;";
            
            content += "<br>";
        });
        
        content += "<strong>Source:</strong> <a href='" + this.sourceUrl + "' class='event-url' target='_blank'>" + this.sourceUrl + "</a><br></div>";
            
        t = new Tip($(this.htmlId), content, {
            title: 'Details:',
            style: 'protogrey',
            stem: 'topLeft',
            closeButton: true,
            showOn: 'click',
            hideOn: 'click',
            hook: {
                target: 'bottomRight',
                tip: 'topLeft'
            },
            offset: {
                x: 14,
                y: 14
            }
        });

        //Work-around: Move the tooltip dom-node into the event-marker node so that is follows when dragging.
        this.container.one('click', function(e) {
            var t = $$('body > .prototip');
            
            if (t.length > 0) {
                $(this).insert($$('body > .prototip').first().remove().setStyle({
                    'top': '12px',
                    'left': '8px'
                }));
                Event.observe(this, 'click', function(e){
                    this.select('.prototip').first().setStyle({
                        'top': '12px',
                        'left': '8px'
                    });
                });
            }
        });

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

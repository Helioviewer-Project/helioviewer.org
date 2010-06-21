/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, getUTCTimestamp */
"use strict";
var EventMarker = Class.extend(
    /** @lends EventMarker.prototype */
    {
    /**
     * @constructs
     * @description Creates a new EventMarker
     * @param {Object} eventLayer EventLayer associated with the EventMarker
     * @param {JSON} event Event details
     * @param {Date} date The date when the given event occured
     * @param {Int} rsun The radius of the sun in pixels
     * @param {Object} options Extra EventMarker settings to use
     */    
    init: function (parentFRM, event, date, rsun, options) {
        $.extend(this, event);
        $.extend(this, options);
        this.behindSun = false;
        this.event = event;
        this.parentFRM  = parentFRM;
        this.appDate    = date;
        this.rsun = rsun;
        
        this.setupPositionData();
        
        //Determine event type and catalog
        //var catalogs = eventLayer.eventAccordion.eventCatalogs;
        //this.catalogName = catalogs[this.catalogId].name;
        //this.type = catalogs[this.catalogId].eventType;
        
        //Create dom-nodes for event marker, details label, and details popup
        this.createMarker();
        this.createPopup();
        //this.createLabel();
    },
    
    setupPositionData: function () {
        deg2rad = (2 * Math.PI) / 360;
        if (this.event_coordsys === "UTC-HRC-TOPO") {
            
            var radians  = (this.event_coord1 + 90) * deg2rad,
                rsun     = this.event_coord2;
            
            this.sunX = -1 * rsun * Math.sin(radians);
            this.sunY = rsun * Math.cos(radians);               
        }
        else if (this.event_coordsys === "UTC-HGS-TOPO") {
            //Heliographic Stonyhurst
            var theta    = this.event_coord2 * deg2rad,
                phi      = this.event_coord1 * deg2rad,
                r        = 1,
                b_zero   = 0,
                phi_zero = 0;
            
            this.sunX = r * Math.cos(theta) * Math.sin(phi - phi_zero);
            this.sunY = (-1) * r * ( (Math.sin(theta) * Math.cos(b_zero)) - (Math.cos(theta) * Math.cos(phi - phi_zero) * Math.sin(b_zero)) );
        }
        else if (this.event_coordsys === "UTC-HGC-TOPO") {
            var phi_c   = this.event_coord1,
                theta   = this.event_coord2 * deg2rad,
                phi     = 0,
                l_zero  = 0,
                y       = 0,
                x       = 0,
                old     = 0,
                a       = 1.91787,
                b       = -0.13067,
                c       = -0.0825278,
                d       = -0.17505,
                e       = 365.27116,
                f       = 0.26318,
                g       = -26379.45,
                h       = -0.00520448,
                i       = -0.00556336,
                j       = -0.0122842,
                day = 1000 * 60 * 60 * 24,
                r        = 1,
                b_zero   = 7 * deg2rad,
                phi_zero = 0;
            
           x = (new Date(this.event_starttime).getTime() - new Date(1995, 0, 1).getTime())/day;
           console.log("days/x: " + x);
           if ( (x > 364) && (x < 731) ) {
               y = f + (x/g) + a * Math.sin(2 * Math.PI * (x/e)) + b * Math.sin(4 * Math.PI * (x/e)) + h * Math.sin(6 * Math.PI * (x/e)) +
                   c * Math.cos(2 * Math.PI * (x/e)) + d * Math.cos(4 * Math.PI * (x/e)) + i * Math.cos(6 * Math.PI * (x/e)) - j;
           }
           else {
               y = f + (x/g) + a * Math.sin(2 * Math.PI * (x/e)) + b * Math.sin(4 * Math.PI * (x/e)) + h * Math.sin(6 * Math.PI * (x/e)) +
                   c * Math.cos(2 * Math.PI * (x/e)) + d * Math.cos(4 * Math.PI * (x/e)) + i * Math.cos(6 * Math.PI * (x/e));
           }
                
                
           old = (349.03 - ((360.0 * x)/27.2753)).mod(360);
           l_zero = old + y;
           //console.log("old: " + old);
           //console.log("y  : " + y);
           phi = (phi_c - l_zero);
           console.log(phi);
           if( (phi < -90) || (phi > 90)) {
               this.behindSun = true;
           }
           //Stonyhurst Conversion
           phi = phi * deg2rad;
           
           
           this.sunX = r * Math.cos(theta) * Math.sin(phi - phi_zero);
           this.sunY = (-1) * r * ( (Math.sin(theta) * Math.cos(b_zero)) - (Math.cos(theta) * Math.cos(phi - phi_zero) * Math.sin(b_zero)) );
        }    
    },
    
    
    /**
     * @description Creates the marker and adds it to the viewport
     */
    createMarker: function () {
        //Create container
        this.pos = {
            x: this.rsun * this.sunX,
            y: this.rsun * this.sunY
        };
        
        this.container = $('<div class="event" style="left: ' + this.pos.x + 'px; top: ' + this.pos.y + 'px;"></div>');
        
        this.parentFRM.domNode.append(this.container);
        this.marker = $('<div class="event-marker"></div>');
        this.marker.css('background', 'url(resources/images/events/small-yellow-square-CME.png)');
        this.container.append(this.marker);
        if(this.behindSun) {
            this.marker.hide();
        }
        //make event-type CSS-friendly
        //var cssType = this.type.replace(/ /g, "_");
        //
        //this.marker = $('<div class="event-marker"></div>');
        //this.marker.css('background', 'url(resources/images/events/' + this.eventLayer.icon + "-" + cssType + '.png)');
        //
        //this.container.append(this.marker);
    },
    
    /**
     * @description Creates a small block of text which is displayed when the user pressed the "d" key ("details").
     */
/*    createLabel: function () {
        var labelText, eventDate, timeDiff, display;

        display = this.eventLayer.viewport.controller.eventLayers.getLabelVisibility();

        labelText = this.getLabelText(this.type);

        //Determine time difference between desired time and event time
        eventDate = getUTCTimestamp(this.time.startTime);
        timeDiff  = eventDate - this.appDate.getTime();
        
        //Create a hidden node with the events ID to be displayed upon user request
        this.label = $('<div class="event-label" style="display: ' + display + ';">' + labelText + '</div>');
        
        //Adjust style to reflect time difference
        if (timeDiff < 0) {
            this.label.addClass("timeBehind");
        }
        else if (timeDiff > 0) {
            this.label.addClass("timeAhead");
        }
        
        this.container.append(this.label);
    },
*/    
    /**
     * @description Choses the text to display in the details label based on the type of event
     * @param {String} eventType The type of event for which a label is being created
     */
/*    getLabelText: function (eventType) {
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
*/    
    /**
     * @description Creates a popup which is displayed when the event marker is clicked
     */
    createPopup: function () {
        var content, tooltips = this.parentFRM.eventManager.controller.tooltips;

        // Add required parameters
        content = "<div class='event-popup-container'><strong>" + this.eventId + "</strong><br>" +
                  "<p>" + this.frm_name + "</p><br><strong>start:</strong> " + this.event_starttime + "<br>" +
                  "<strong>end:</strong> " + this.event_endtime + "<br><br>";
        
        
        content += "<strong>event_coord1</strong> " + this.event_coord1 + "<br />";
        content += "<strong>event_coord2</strong> " + this.event_coord2 + "<br />";
        // Add custom parameters
        /*
        $.each(this.event, function (key, value) {
            content += "<strong>" + key + ":</strong> " + value;
            if (key.search(/angle/i) !== -1) {
                content += "&deg;";
            }
            
            content += "<br>";
        });
        */
        // Create popup dialog        
        tooltips.createDialog(this.container, this.type, content);
    },
 
    /**
     * @description attempts to select an optimal orientation for the event marker popup
     * (Not yet fully implemented...)
     */
    chooseOrientation: function () {
        var dir, vpCoords, vpWidth, vpHeight, markerCoords, rel, EST_HEIGHT, EST_WIDTH;
        
        vpCoords     = $("#helioviewer-viewport").offset();
        markerCoords = this.container.offset();
        
        rel = {
            top : vpCoords.top  - markerCoords.top,
            left: vpCoords.left - markerCoords.left
        };
        
        // Estimated marker size
        EST_WIDTH  = 250;
        EST_HEIGHT = 250;
        
        vpWidth  = $("#helioviewer-viewport").width();
        vpHeight = $("#helioviewer-viewport").height();
        
        if ((vpHeight - rel.top) < EST_HEIGHT) {
            if ((vpWidth - rel.left) < EST_WIDTH) {
                dir = "bottomRight";
            }
            else { 
                dir = "bottomLeft";
            }
        }
        else {
            if ((vpWidth - rel.left) < EST_WIDTH) {
                dir = "topRight";
            }
            else {
                dir = "topLeft";
            }
        }
        
        return dir;
    },
    
    /**
     * @description Removes the EventMarker
     */
    remove: function () {
        this.container.qtip("destroy");
        this.container.unbind();
        this.container.remove();
    },

     /**
      * @description Redraws event
      * @param {Int} rsun The updated solar radius, in pixels.
      */
    refresh: function (rsun) {
        this.rsun = rsun;
        this.pos = {
            x: this.sunX * rsun,
            y: this.sunY * rsun
        };
        this.container.css({
            'left': (this.pos.x - 2) + 'px',
            'top' : (this.pos.y - 2) + 'px'
        });
    },
    
    setVisibility: function (visible) {
        if (visible) {
            this.marker.show();
        }
        else {
            this.marker.hide();
        }
    }
    
});

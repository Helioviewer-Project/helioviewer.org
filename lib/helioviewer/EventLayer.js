/**
 * @fileoverview Contains the class definition for an EventLayer class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class EventLayer 
 * 
 * @see Layer, TileLayer
 */
/*global Class, $, Ajax, Counter, Debug, Element, Layer */
var EventLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'EventLayer',
        eventCatalogs: 'getEvents.php',
        opacity: 1,
        sunRadius0: 94 * (1 << 12), //Sun radius at zoom-level 0, in pixels = 94 * 2^12
        defaultZoomLevel: 12,
        opacityGroupId: -1
    },
    
    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'eventlayer' + Math.floor(Math.random() * 100000 + 1);
        
        this.events = [];
        
        this.domNode = new Element('div', {style: 'position: absolute; z-index: 1000'});
        viewport.movingContainer.appendChild(this.domNode);

        this.queryEventCatalogs();
        
        //this.viewport.addObserver('move', this.viewportMove.bind(this));

    },
    
    queryEventCatalogs: function () {
        var processResponse = function (transport) {
            this.events = transport.responseJSON;
            this.displayEvents();
        };
        
        var xhr = new Ajax.Request(this.eventCatalogs, {
            method: 'get',
            onSuccess: processResponse.bind(this),
            parameters: {
                task: 'getPoi',
                date: this.viewport.controller.date.toISOString().slice(1, -1),
                windowSize: 43200 //12 hours in seconds
            }            
        });
    },
    
    viewportMove: function () {
        
    },
    
    displayEvents: function () {
    var self = this;
        
        this.events.each(function (e) {
            var sunRadius = self.sunRadius0 >> self.viewport.zoomLevel;
            var pos = self.viewport.getContainerRelativeCoordinates(e.sunX * sunRadius, e.sunY * sunRadius);
            var div = new Element('div', {className: 'event', style: 'position: absolute; left: ' + (pos.x - 2) + 'px; top: ' + (pos.y - 2) + 'px; width: 5px; height: 5px; background-color: #000; border: 1px solid #FFF; font-size: 3px; padding: 0; z-index: 10', title: " - " + e.detail });
            e.node = self.domNode.appendChild(div);
        });
        
        //Use custom tooltips (need to create large tooltip dialog)
        this.viewport.controller.addToolTip(".event", {tooltipSize: "large", position: 'topleft', delay: 200, track: true});            
    },
    
    reload: function () {
        
        var removeEvent = function(e) {
            if (e.node.parentNode) {
                //Debug.output("e.node.parentNode exists! " + e.eventId);
                e.node.remove();
            }
            else {
                //Debug.output("e.node.parentNode DOES NOT EXIST! " + e.eventId);
                //window.setTimeout(function() {
                //    removeEvent(e);
                //}, 1000);
                Event.observe(e.node, 'load', function(e) {
                    alert('loaded!'); 
                });
            }
        };
                      
        //Remove any existing events
        this.events.each(removeEvent);
        
        this.queryEventCatalogs();
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
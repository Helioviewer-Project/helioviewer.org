/**
 * @fileoverview Contains the class definition for a class which handles navigating through the different dimensions
 *               of the available data sources.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class DataNavigator This class is in charge of locating and traversing through the available data sources. It
 * manages a colletion of "Filters." The Filters contain an array of a specified number of filenames for images that meet
 * the specified criteria, incremented according to DataNavigator's "increment" property. In addition to a collection
 * of filters and a time increment, the DataNavigator also manages the current viewing (observation) time. Each time
 * this is changed by the user, it is updated in the class and the nearest image to the specified time is found for each
 * filter collection and loaded on to the screen.
 * 
 * NOTE: This is essentially a layer manager of sorts, and is meant to replace the SelectByDateMenu for handling traversal
 * across time, wavelength, and other dimensions.
 * 
 * @see Filter
 */
 /*global document, window, Event, UIElement, Class, Hash, $, $A, Effect */
var DataNavigator = Class.create(UIElement, {
    /**
     * DataNavigator Constructor
     * @constructor
     * 
     * @param {int} year                The starting year.
     * @param {int} month               The starting month.
     * @param {int} day                 The starting day.
     * @param {int} hour                The starting hour.
     * @param {int} minute              The starting minute.
     * @param {int} second              The starting second.
     * @param {Hash} timeIncrement      The initial time increment in seconds
     */
    initialize: function (controller, timeIncrement, backBtn, forwardBtn) {
        // Set-up initial date
        this.controller = controller;

        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Event-handlers
        Event.observe(backBtn, 'click', this.timePrevious.bind(this));
        Event.observe(forwardBtn, 'click', this.timeNext.bind(this));

    },
    
    query: function (type) {
        var url = 'get' + type + '.php';
        var self = this;
        var xhr = new Ajax.Request(url, {
            parameters: {
                type: 'json'
            },
            method: 'get',
            onComplete: function (transport) {
                //TODO: use an array/hash to make this more dynamic, e.g. this.data.push({'instruments', data ...})
                self.instruments = transport.responseJSON;
            }
        });
    },
     
    setTimeIncrement: function (timeIncrement) {
                Debug.output("setTimeInc");
        this.timeIncrement = timeIncrement;
    },   
      
    /**
     * @function timeNext
     */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this.timeIncrement);
        this.controller.setDate(newDate);
        /*
      
        // Check to make sure request is within range of available data
        if (this.controller.date <= Date.parse(DATE_START_EIT)) {
            $('message-console').update("There is no more data before this date!");
            var trash = new Effect.Shake('helioviewer-viewport-container-outer', {distance: 15, duration: 0.1});
            trash = new Effect.Appear('message-console', { duration: 3.0 });
        
            //Hide the message after several seconds have passed
            window.setTimeout(function () {
                var trash = new Effect.Fade('message-console', { duration: 3.0 });
            }, 6500);

            return;
        }
        
        // Update Time
        this.controller.date.addSeconds(-this.controller.dateIncrement);
        
        // Update Observation date (should probably handle with events instead)
        $('date').value = this.controller.date.toString("yyyy/M/d");
        $('time').value = this.controller.date.toString("HH:mm:ss");
        
        // Closure
        var self = this;
	    this.filters.each(function (filter, id) {
	        if ((filter !== "MarkerLayer") && filter.previous(self.time)) {
	            document.sunImageChange.fire(filter.currentSunImage(), id);
	        }
	    });
	    document.timeChange.fire(this.time);  
        */
	},
	
	/**
	 * @function timePrevious
	 */
	timeNext: function () {
        var newDate = this.controller.date.addSeconds(this.timeIncrement);
        this.controller.setDate(newDate);
        /*
	    // Check to make sure request is within range of available data
	    // Note: This functionality should be extended to check each different layer
	    //       and be moved to a separate function.
	    if (this.controller.date >= Date.parse(DATE_END_EIT)) {
	        $('message-console').update("End of data-set reached!");
	        var trash = new Effect.Shake('helioviewer-viewport-container-outer', {distance: 15, duration: 0.1});
	        trash = new Effect.Appear('message-console', { duration: 3.0 });
        
	        //Hide the message after several seconds have passed
	        window.setTimeout(function () {
	            var trash = new Effect.Fade('message-console', { duration: 3.0 });
	        }, 6500);

	        return;
	    }
	    
	    // Update Time
	    this.controller.date.addSeconds(this.timeIncrement);
	    $('date').value = this.controller.date.toString("yyyy/M/d");
	    $('time').value = this.controller.date.toString("HH:mm:ss");
	    
	    // Closure
        var self = this;
	            
	    this.filters.each(function (filter, id) {
	        if ((filter !== "MarkerLayer") && filter.next(self.time)) {
	            document.sunImageChange.fire(filter.currentSunImage(), id);
	            //ADD ID INTO EVENT CALL HERE!
	        }
	    });
	    document.timeChange.fire(this.time);  
        */
	}
});
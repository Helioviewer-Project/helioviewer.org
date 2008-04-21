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
 /*global document, window, Class, Hash, $, $H, Effect, Filter, DATE_END_EIT, DATE_START_EIT */
var DataNavigator = Class.create();

DataNavigator.prototype = {
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
    initialize: function (year, month, day, hour, minute, second, timeIncrement) {
        // Set-up initial date
        this.time = new Date();
        this.time.setFullYear(year, month - 1, day);
        this.time.setHours(hour);
        this.time.setMinutes(minute);
        this.time.setSeconds(second);
        
        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Create an array to store the filters.
        this.filters = new Hash();
        
        // Set initial observation date and times (should also store in DN for later use...)
        $('date').value = this.time.toString("yyyy/M/d");
	    $('time').value = this.time.toString("HH:mm:ss");
	    
        // NOTE: At some point, either in this array, or in the Filters themselves, it
        // would be helpful keep track of what type of Filter (e.g. EIT vs. LASCO) you are
        // seeing so that when the user wants to change "wavelength," only the relevents filters
        // are adjusted.
        
        // Event-handlers
        document.layerAdded.subscribe(this.onNewLayer, this, true);
        document.instrumentChange.subscribe(this.onInstrumentChange, this, true);
        document.timePrevious.subscribe(this.timePrevious, this, true);
		document.timeNext.subscribe(this.timeNext, this, true);
        document.observationDateChange.subscribe(this.onObservationDateChange, this, true);
        document.observationTimeChange.subscribe(this.onObservationTimeChange,  this, true);
        document.timeIncrementChange.subscribe(this.onTimeIncrementChange, this, true);
        document.wavelengthChange.subscribe(this.onWavelengthChange, this, true);
    },
    
    /**
     * @function addFilter
     * @param {String} instrument The instrument associated with the new filter
     */
    addFilter: function (id, instrument, wavelength) {
        this.filters.set(id, new Filter(instrument, this.timeIncrement, wavelength));
        this.filters.get(id).clear();
        this.filters.get(id).retreive(null, null, null, this.time, "forward");
        document.sunImageChange.fire(this.filters.get(id).currentSunImage());
    },
    
    /**
     * @function onNewLayer
     * @param type {String} The type of event fired.
     * @param args {Array}  An array of arguments passed to the event.
     */
    onNewLayer: function (type, args) {
        //Keeping track of the filter's associated tileLayerProviderId makes it possible to have specific filters to respond to global events.
        var layerProvider   = args[0];
        
        if (layerProvider.type === "TileLayerProvider") {
            this.addFilter(layerProvider.id, "EIT", 171); //Default  Instrument type. Should be set dynamically!
        }
        else {
            document.sunImageChange.fire(this.filters.get("TileLayerProvider1").currentSunImage());  //TEMP WORK-AROUND... need to fire again so that marker layers know who to follow (ie. can call setSunImage)
        }
    },
    
    /**
     * @function onObservationDateChange
     */
    onObservationDateChange: function (type, args) {
        var date = args[0].split("/");
        this.setTime(parseInt(date[0], 10), parseInt(date[1], 10), parseInt(date[2], 10), null, null, null);
    },
    
    /**
     * @function onObservationTimeChange
     */
    onObservationTimeChange: function (type, args) {
        var time = args[0].split(":");
        this.setTime(null, null, null, parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10));
    },
    
    /**
     * @function onInstrumentChange
     * @param {String} id   The tileLayerProviderId associated with the layer whose instrument is being changed.
     * @param {String} inst The name of the new instrument to switch to.
     */
    onInstrumentChange: function (type, args) {
        var id =   args[0];
        var inst = args[1];
        
        this.filters.get(id).clear();
        this.filters.get(id).setInstrument(inst);
        this.filters.get(id).retreive(null, null, null, this.time, "forward"); //Filters could also keep track of time and call this within SetInstrument()...
        document.sunImageChange.fire(this.filters.get(id).currentSunImage());
    },
    
    /**
     * @method onWavelengthChange
     * @param {Int} The new wavelength to display
     */
    onWavelengthChange: function (type, args) {
        var id = args[0];
        var wl = args[1];
        
        this.filters.get(id).clear();
        this.filters.get(id).setWavelength(wl);
        this.filters.get(id).retreive(null, null, null, this.time, "forward");
        document.sunImageChange.fire(this.filters.get(id).currentSunImage());
    },
    
    /**
     * @function onTimeIncrementChange
     */
    onTimeIncrementChange: function (type, args) {
        var numSecs = args[0];
        this.timeIncrement = numSecs;
            
        //update filters
        var time = this.time;
        
        this.filters.each(function (filter) { 
            filter.value.clear();
            filter.value.setTimeIncrement(numSecs);
            filter.value.retreive(null, null, null, time, "forward");
            //document.sunImageChange.fire(filter.value.currentSunImage());
        });     
    },
    
    /**
     * @function setTime
     * @param {int} year  The new year value.
     * @param {int} month The new month value.
     * @param {int} day   The new day value.
     * 
     * TODO: extend to include hours, minutes, seconds
     */
    setTime: function (year, month, day, hour, minute, second) {
        // Set new date
        if ((year !== null) && (month !== null) && (day !== null)) {
            this.time.setFullYear(year, month - 1, day);
        }
        
        // Set new time (Add validation check (ideally before this function)! can use date.js validation...)
        if ((hour !== null) && (minute !== null) && (second !== null)) {
            this.time.setHours(hour);
            this.time.setMinutes(minute);
            this.time.setSeconds(second);            
        }
         
         // Update filters
        var time = this.time;
        this.filters.each(function (filter) { 
            filter.value.clear();
            filter.value.retreive(null, null, null, time, "forward");
            document.sunImageChange.fire(filter.value.currentSunImage()); //TODO: Check to see if image differs from current!
        });      
    },
     
    /**
     * @function timeNext
     */
    timePrevious: function () {
        // Check to make sure request is within range of available data
        if (this.time <= Date.parse(DATE_START_EIT)) {
            $('message-console').update("There is no more data before this date!");
            var trash = new Effect.Shake('viewport-outer', {distance: 15, duration: 0.1});
            trash = new Effect.Appear('message-console', { duration: 3.0 });
        
            //Hide the message after several seconds have passed
            window.setTimeout(function () {
                var trash = new Effect.Fade('message-console', { duration: 3.0 });
            }, 6500);

            return;
        }
        
        // Update Time
        this.time.addSeconds(-this.timeIncrement);
        
        // Update Observation date (should probably handle with events instead)
        $('date').value = this.time.toString("yyyy/M/d");
        $('time').value = this.time.toString("HH:mm:ss");
        
        // Closure
        var self = this;
	    this.filters.each(function (filter) {
	        if (filter.value.previous(self.time)) {
	            document.sunImageChange.fire(filter.value.currentSunImage());
	        }
	    });
	},
	
	/**
	 * @function timePrevious
	 */
	timeNext: function () {
	    // Check to make sure request is within range of available data
	    // Note: This functionality should be extended to check each different layer
	    //       and be moved to a separate function.
	    if (this.time >= Date.parse(DATE_END_EIT)) {
	        $('message-console').update("End of data-set reached!");
	        var trash = new Effect.Shake('viewport-outer', {distance: 15, duration: 0.1});
	        trash = new Effect.Appear('message-console', { duration: 3.0 });
        
	        //Hide the message after several seconds have passed
	        window.setTimeout(function () {
	            var trash = new Effect.Fade('message-console', { duration: 3.0 });
	        }, 6500);

	        return;
	    }
	    
	    // Update Time
	    this.time.addSeconds(this.timeIncrement);
	    $('date').value = this.time.toString("yyyy/M/d");
	    $('time').value = this.time.toString("HH:mm:ss");
	    
	    // Closure
        var self = this;
	            
	    this.filters.each(function (filter) {
	        if (filter.value.next(self.time)) {
	            document.sunImageChange.fire(filter.value.currentSunImage());
	        }
	    });
	},
	
	makeNegative: function (obj) {
	    var newObj = [];
        $H(obj).each(function (h) {
            newObj[h.key.toString()] = -h.value;
        });
        return newObj;    
	}
    

    /**
     * Functions to include:
     *      Next
     *      Previous
     *      SetTime
     *      SetTimeIncrement
     *      AddFilter
     *      RemoveFilter
     * 
     * Events to listen to:
     *      Date/Time Changed
     *      Time Increment changed
     *      Measurement changed (?)
     */    
};
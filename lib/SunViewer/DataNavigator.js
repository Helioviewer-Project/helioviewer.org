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
     * @param {Hash} timeIncrement     The initial time increment in the form {amount, unit}
     */
    initialize: function(year, month, day, hour, minute, second, timeIncrement) {
        // Set-up initial date
        this.time = new Date();
        this.time.setFullYear(year, month -1, day);
        this.time.setHours(hour);
        this.time.setMinutes(minute);
        this.time.setSeconds(second);
        
        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Create an array to store the filters.
        this.filters = new Hash();
        
        // Set initial observation date and times (should also store in DN for later use...)
        $('date').value = this.time.toString("yyyy/M/d");
	    $('time').value = this.time.toString("HH:mm:ss")
        
        // NOTE: At some point, either in this array, or in the Filters themselves, it
        // would be helpful keep track of what type of Filter (e.g. EIT vs. LASCO) you are
        // seeing so that when the user wants to change "wavelength," only the relevents filters
        // are adjusted.
        
        // Event-handlers
        document.newLayer.subscribe(this.onNewLayer, this, true);
        document.instrumentChange.subscribe(this.onInstrumentChange, this, true);
        document.timePrevious.subscribe(this.timePrevious, this, true);
		document.timeNext.subscribe(this.timeNext, this, true);
        document.observationDateChange.subscribe(this.onObservationDateChange,this, true);
    },
    
    /**
     * @function addFilter
     * @param {String} instrument The instrument associated with the new filter
     */
    addFilter: function (id, instrument) {
        this.filters.set(id, new Filter(instrument, Object.clone(this.timeIncrement) )); //pass timeIncrement by value
        this.filters.get(id).Clear();
        this.filters.get(id).Retreive(null, null, null, this.time);
        document.sunImageChange.fire(this.filters.get(id).CurrentSunImage());
    },
    
    /**
     * @function onNewLayer
     * @param type {String} The type of event fired.
     * @param args {Array}  An array of arguments passed to the event.
     */
    onNewLayer: function (type, args) {
        //Keeping track of the filter's associated tileLayerProviderId makes it possible to have specific filters to respond to global events.
        var layerProviderId   = args[0];
        var layerProviderType = args[1];
        
        if (layerProviderType == "TileLayerProvider")
            this.addFilter (layerProviderId, "EIT"); //Default  Instrument type. Should be set dynamically.
        else {
            document.sunImageChange.fire(this.filters.get("TileLayerProvider1").CurrentSunImage());  //TEST... need to fire again so that marker layers know who to follow (ie. can call setSunImage)
        }
    },
    
    /**
     * @function onObservationDateChange
     */
    onObservationDateChange: function (type, args) {
        var date = args[0];
        Debug.output("new date: " + date);
        //this.setTime(year, month, day);
    },
    
    /**
     * @function onInstrumentChange
     * @param {String} id   The tileLayerProviderId associated with the layer whose instrument is being changed.
     * @param {String} inst The name of the new instrument to switch to.
     */
    onInstrumentChange: function (type, args) {
        var id =   args[0];
        var inst = args[1];
        
        this.filters.get(id).Clear();
        this.filters.get(id).SetInstrument(inst);
        this.filters.get(id).Retreive(null, null, null, this.time); //Filters could also keep track of time and call this within SetInstrument()...
        document.sunImageChange.fire(this.filters.get(id).CurrentSunImage());
    },
    
    /**
     * @function setTime
     * @param {int} year  The new year value.
     * @param {int} month The new month value.
     * @param {int} day   The new day value.
     * 
     * TODO: extend to include hours, minutes, seconds
     */
     setTime: function (year, month, day) {
        //set new time
        this.time.setFullYear(year, month, day);
         
         //update filters
        this.filters.each(function(filter) { 
            filter.value.Clear();
            filter.value.Retreive(null, null, null, this.time);
        });         
     },
     
    /**
     * @function timeNext
     */
    timePrevious: function() {
        //Update Time
        this.time.addHours (-this.timeIncrement.amount);
        
        //Update Observation date (should probably handle with events instead)
        $('date').value = this.time.toString("yyyy/M/d");
        $('time').value = this.time.toString("HH:mm:ss")
        
	    this.filters.each(function(filter) {
	        if (filter.value.Previous())
	           document.sunImageChange.fire(filter.value.CurrentSunImage());
	    });
	},
	
	/**
	 * @function timePrevious
	 */
	timeNext: function() {
	    //Update Time
	    this.time.addHours (this.timeIncrement.amount);
	    $('date').value = this.time.toString("yyyy/M/d");
	    $('time').value = this.time.toString("HH:mm:ss")
	            
	    this.filters.each(function(filter) {
	        if (filter.value.Next()) {
	           document.sunImageChange.fire(filter.value.CurrentSunImage());
	        }
	    });
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
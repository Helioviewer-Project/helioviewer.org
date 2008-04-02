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
     * @param {Array} timeIncrement     The initial time increment in the form [years, days, hours, minutes, seconds]
     */
    initialize: function(year, month, day, hour, minute, second, timeIncrement) {
        // Set-up initial date
        this.time = new Date();
        this.time.setFullYear(year, month, day);
        this.time.setHours(hour);
        this.time.setMinutes(minute);
        this.time.setSeconds(second);
        
        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Create an array to store the filters.
        this.filters = Array();
        this.filters.push(null); //To sync with LayerConfigurators array
        
        // NOTE: At some point, either in this array, or in the Filters themselves, it
        // would be helpful keep track of what type of Filter (e.g. EIT vs. LASCO) you are
        // seeing so that when the user wants to change "wavelength," only the relevents filters
        // are adjusted.
        
        // Event-handlers
        document.newLayer.subscribe(this.onNewLayer, this, true);
        document.timePrevious.subscribe(this.timePrevious, this, true);
		document.timeNext.subscribe(this.timeNext, this, true);
    },
    
    /**
     * @function addFilter
     * @param {String} instrument The instrument associated with the new filter
     */
    addFilter: function (instrument) {
        this.filters.push(new Filter(instrument));
        
        var lastIndex = this.filters.length -1;
        
        this.filters[lastIndex].Clear();
        this.filters[lastIndex].Retreive(null, null, null, this.time);

        //Debug.output("DataNavigator:addFilter();");
        document.sunImageChange.fire(this.filters[lastIndex].CurrentSunImage());
    },
    
    /**
     * @function onNewLayer
     * @param type {String} The type of event fired.
     * @param args {Array}  An array of arguments passed to the event.
     */
    onNewLayer: function (type, args) {
        var layerProviderType = args[0];
        if (layerProviderType == "TileLayerProvider")
            this.addFilter ("EIT"); //Default  Instrument type. Should be set dynamically.
        else {
            this.filters.push(null);
            document.sunImageChange.fire(this.filters[1].CurrentSunImage());  //TEST... need to fire again so that marker layers know who to follow (ie. can call setSunImage)
        }
    },
    
    /**
     * @function onObserveDateChange
     * @param type {String} The type of event fired.
     * @param args {Array}  An array of arguments passed to the event.
     */
    onObserveDateChange: function (type, args) {
        var year =  args[0];
        var month = args[1];
        var day =   args[2];
        this.setTime(year, month, day);
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
         for (var i=0; i < this.filters.length; i++) {
             this.filters[i].Clear();
             
             if (this.filters[i])
                this.filters[i].Retreive(null, null, null, this.time);
         }
         
     },
     
    /**
     * @function timeNext
     */
    timePrevious: function() {
        for (var i=0; i < this.filters.length; i++) {
    	    if (this.filter[i].Previous())
    	    {
                //document.tmpHandleImgChange.fire(i, this.filter[i].CurrentSunImage());
    	    }
        }
	},
	
	/**
	 * @function timePrevious
	 */
	timeNext: function() {
	    for (var i=0; i < this.filters.length; i++) {
    	    if (this.filter[i].Next())
    	    {
    	        //document.tmpHandleImgChange.fire(i, this.filter[i].CurrentSunImage());
    	    }
	    }
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
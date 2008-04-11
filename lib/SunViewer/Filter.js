/**
 * @fileoverview Contains the class definition for a class which handles manages a collection of meta-information about
 *               data for a given instrument.
 * @see    Filter
 * @author Michael Lynch
 * @author Keith Hughitt
 */
/*global SunImage, SunImgDate, $A, Ajax, timestampToDate */

/**
 * @class Filter Represents a range of data available for a specific instrument, limited (filtered) based on certain criteria.
 */
var Filter = Class.create();

Filter.prototype = {
    
    /**
     * @constructor
     * @param {String} inst      The instrument associated with the Filter being created.
     * @param {Array}  increment An array of integers representing the currently selected time increment.
     */
    initialize: function (inst, increment) {
        this.className     = "Filter";
    	this.collection    = $A([]);
    	this.iterator      = 0;
    	this.instrument    = inst;
    	this.timeIncrement = increment;
    },
	
	/**
	 * @method iterateNext Iterates to the next available data point.
	 * @private
	 */
	iterateNext: function (date) {
		// On reaching the end of the array, fetch a new set of data
        if (this.iterator >= this.collection.length -1) {
            // Make a copy of the date
            var currentDate = date.clone();
            var lastDate = currentDate.add(this.timeIncrement);

		    Debug.output("Fetching new dataaset starting from: " + lastDate.toString());
		    Debug.output("Iterator: " + this.iterator + ", collection.length: " + this.collection.length);
		    
		    var trash = this.collection.pop(); //Avoid duplicating last element
            this.retreive(null, null, null, lastDate, "forward");
		}
		
		// Iterate to next available time
	    this.iterator++;
        return true;
	},
	
	/**
     * @method iteratePrevious Iterates to the previous data point if available.
     * @private
     */
	iteratePrevious: function(date) {
        // On reaching the begining of the array, fetch a new set of data
        if (this.iterator == 0) {
            var currentDate = date.clone();
            //var neg =       this.makeNegative(Object.clone(this.timeIncrement));
            //var firstDate = currentDate.add(neg);
            var firstDate = currentDate;
            
            Debug.output("Fetching new dataaset (backwards) starting from: " + firstDate.toString());
            Debug.output("Iterator: " + this.iterator + ", collection.length: " + this.collection.length);
            
            var trash = this.collection.shift();
            this.retreive(null, null, null, firstDate, "backward");
        }
        else {        
            // Iterate to next available time
            this.iterator--;
        }
        return true;
	},
	
    /**
     * @method currentDate Returns a javascript Date object representing the time for the data point
     *                     currently being displayed.
     * @private
     * @return {Date} The time for the current data point.
     */
	currentDate: function() {
		return Date.parse(this.collection[this.iterator]["timestamp"]);
	},
	
	/**
     * @method getInstrument Returns the name of the instrument currently associated with the filter
     * @return {String} The instrument name.
     */
    getInstrument: function() {
        return this.instrument; 
    },
	
	
	/**
	 * @method current Returns the current data point.
	 * @public 
	 */
	current: function () {
		return this.collection[this.iterator];
	},
	
	/**
	 * @method clear Empties the filter.
	 * @public
	 */
	clear: function () {
		this.collection.clear();
		this.iterator = 0;
	},
	
	    /**
     * @method retreive Updates the Filter based on specified critera
     * @public
     * @param {String} observatory
     * @param {String} detector
     * @param {String} measurement
     * @param {Date}   date 
     */
    retreive: function (observatory, detector, measurement, date, direction) {
        var startDate =         date.clone();
        var endDate =           date.clone();
        var incrementMultiple = this.scaleValues(Object.clone(this.timeIncrement), 15);        
        
        // Determine range to query
        var i = null;
        if (direction === "forward") {
            endDate = endDate.add(incrementMultiple);
        }
        else if (direction == "backward") {
            // make the scaled increments values negative
            var neg = this.makeNegative(incrementMultiple);
            startDate = startDate.add(neg);
        }
        
        // Closure
        var closure =  this;
        var trash =    new Ajax.Request('lib/HV_Database/ReturnFilters.php',
        {
            method: 'get',
            asynchronous: false,
            parameters:
            {
                "From":             this.dateToTimeStamp(startDate),
                "To":               this.dateToTimeStamp(endDate),
                "Year":             date.getFullYear(),
                "Month":            date.getMonth() + 1,
                "Day":              date.getDate(),
                "Hour":             date.getHours(),
                "Minute":           date.getMinutes().toString().replace(/^(\d)$/, "0$1"),
                "Second":           date.getSeconds(),
                "Instrument":       this.instrument,
                "IncrementDays":    this.timeIncrement.days,
                "IncrementHours":   this.timeIncrement.hours,
                "IncrementMinutes": this.timeIncrement.minutes,
                "Direction":        direction
            },
            onSuccess: function (transport)
            {
                if (direction === "forward") {
                    closure.collection = closure.collection.concat(transport.responseJSON);
                }
                else {
                    closure.collection = transport.responseJSON.concat(closure.collection);
                }
                closure.setIteratorToNearestDate(date);
            },
            onFailure: function ()
            {
                Debug.output("Filter.js: Ajax Request Failed!");
            }
        });
    },
	
	/**
	 * @method currentSunImage Returns a "SunImage" object associated with the current data point.
	 * @return {SunImage} The image associated with the current data point.
	 */
	currentSunImage: function () {
	    var currentDate =  this.currentDate();
		var obs =          this.collection[this.iterator]["observatory"];
		var inst =         this.collection[this.iterator]["instrument"];
		var det =          this.collection[this.iterator]["detector"];
		var meas =         this.collection[this.iterator]["measurement"];
		
		var stringMonth = (currentDate.getMonth() + 1).toString();
		var stringDay =    currentDate.getDate().toString();
		var stringHour =   currentDate.getHours().toString();
		var	stringMinute = currentDate.getMinutes().toString();
		var stringSecond = currentDate.getSeconds().toString();
		
	    if (stringDay.length === 1) {
			stringDay = "0" + stringDay;
		}
		if (stringHour.length === 1)	{
			stringHour = "0" + stringHour;
		}
		if (stringMinute.length === 1) {
			stringMinute = "0" + stringMinute;
		}
		if (stringSecond.length === 1) {
			stringSecond = "0" + stringSecond;
		}
		
		var sunImg = new SunImage(
			{
				date: new SunImgDate(
				{
					year:  currentDate.getFullYear(),
					month: stringMonth,
					day:   stringDay,
					hour:  stringHour,
					min:   stringMinute,
					sec:   stringSecond
				}),
				observatory: obs,
				instrument:  inst,
				detector:    det,
				measurement: meas,
				wavelength: "",
				resolution: "",
				tileDir: "/hvdb"
			});
        return sunImg;
	},
	
	/**
	 * @method dateToTimeStamp
	 */
	dateToTimeStamp: function (date) {
        return date.toString("yyyy-MM-dd HH:mm:ss");      
    },
    
	/**
	 * @method next Iterates to the next available data point
	 * @public
	 */
	next: function (date) {
		return this.iterateNext(date);
	},
	
	/**
	 * @method previous Iterates to the previous data point if available.
	 * @public
	 */
	previous: function (date) {
		return this.iteratePrevious(date);
	},
	
	/**
	 * @method list Returns the entire range of data.
	 * @public
	 */
	list: function () {
		return this.collection;
	},

    /**
	 * @method setInstrument Changes the filter's associated instrument to a different one.
	 * @public
	 * @param {String}       The name of the new instrument to use.
	 */
	setInstrument: function (inst) {
	    this.instrument = inst;
	},
	
	/**
	 * @method setIterator
	 * @private
	 * @param {Int} The new iterator index to use
	 */
	 setIterator: function (i) {
	     this.iterator = i;  
	 },
	
	/**
	 * @method setTimeIncrement Changes the timeIncrement associated with the filter
	 * @public
	 * @param {Hash} inc        The new time increment to use.
	 */
	setTimeIncrement: function (inc) {
	    this.timeIncrement = inc;
	},
	
	/**
	 * @method setIteratorToNearestDate Sets the iterator to the data point closest to the desired observation time.
	 * @public
	 * @param {Date} The desired date.
	 */
	setIteratorToNearestDate: function (date) {
	    // Set initial values
	    var newIteratorValue = 0;
	    var curDate =          Date.parse(this.collection[0]["timestamp"]);
	    var testCase =         Math.abs(curDate.getTime() - date.getTime());
	    var closestMatch =     testCase;

        // Check each time in collection to see if it is a closer match
	    for (var i = 0; i < this.collection.length; i++) {
	        curDate =  Date.parse(this.collection[i]["timestamp"]);
	        testCase = Math.abs(curDate.getTime() - date.getTime());
	        
	        // If the difference is closer, update newIteratorValue to use that value's index
	        if ( testCase < closestMatch) {
	            newIteratorValue = i;
	            closestMatch = testCase;
	        }
	        //Note: Performance could be improved either by stopping if abs(x-y) = 0, or by saying
	        //      if you get two values in a row where there is no improvement, stop.
	    }
	    
	    // Update the filter's iterator
	    this.setIterator(newIteratorValue);
	},
	
   /**
    * @method makeNegative Converts the values of an numerical hash to their negatives
	* @public
	* @param  {Hash} A numerical hash (literal object)
	* @return {Hash} A new hash whose values are the negatives of the original hash values
	*/
    makeNegative: function (obj) {
        var newObj = [];
        $H(obj).each(function (h) {
            newObj[h.key.toString()] = -h.value;
        });
        return newObj;    
    },
    
    /**
     * @method scaleValues Scales the values of a numerical hash by a given multiple
     * @public
     * @param  {Hash}    A numerical hash (literal object)
     * @param  {Integer} The factor to scale the hash by
     * @return {Hash}    A scaled version of the original hash
     */
    scaleValues: function (obj, multiple) {
        var newObj = [];
        $H(obj).each(function (h) {
            newObj[h.key.toString()] = h.value * multiple;
        });
        return newObj;    
    }    
};

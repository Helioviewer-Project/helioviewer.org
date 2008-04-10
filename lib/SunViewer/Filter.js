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
	iterateNext: function () {
		// On reaching the end of the array, fetch a new set of data
        if (this.iterator >= this.collection.length -1) {
		    var lastDate = this.currentDate();
		    //Debug.output("Fetching new dataaset starting from: " + lastDate.toString());
		    //Debug.output("Iterator: " + this.iterator);
		    
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
	iteratePrevious: function() {
		if (this.iterator !== 0)	{
			this.iterator--;
			return true;
		}
		else {
		    return false;
		}
	},
	
    /**
     * @method currentDate Returns a javascript Date object representing the time for the data point
     *                     currently being displayed.
     * @private
     * @return {Date} The time for the current data point.
     */
	currentDate: function() {
		return timestampToDate(this.collection[this.iterator]["timestamp"]);
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
        var startDate = null;
        var endDate =   null;
        
        // Determine range to query
        var i = null;
        if (direction === "forward") {
            startDate = date;
            endDate = date.clone();
            for (i = 0; i < 10; i++) { //TEMPORARY SOLUTION...
                endDate = endDate.add(this.timeIncrement);
            }
        }
        else if (direction == "backward") {
            startDate = date.clone();
            endDate = date;
            
            // Make a negative-valued copy of the original timeIncrement object
            var neg = this.makeNegative(Object.clone(this.timeIncrement));
            
            for (i = 0; i < 10; i++) {
                startDate = startDate.add(neg);
            }
        }
        
        // Closure
        var closure =  this;
        var trash =    new Ajax.Request('lib/HV_Database/ReturnFilters.php',
        {
            method: 'get',
            asynchronous: false,
            parameters:
            {
                //"Observatory":    Observatory,
                //"Detector":       Detector,
                //"Measurement":    Measurement,
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
                closure.setIterator(date);
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
	next: function () {
		return this.iterateNext();
	},
	
	/**
	 * @method previous Iterates to the previous data point if available.
	 * @public
	 */
	previous: function () {
		return this.iteratePrevious();
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
	 * @method setTimeIncrement Changes the timeIncrement associated with the filter
	 * @public
	 * @param {Hash} inc        The new time increment to use.
	 */
	setTimeIncrement: function (inc) {
	    this.timeIncrement = inc;
	},
	
	/**
	 * @method setIterator Sets the iterator to the data point closest to the desired observation time.
	 * @public
	 * @param {Date} The desired date.
	 */
	setIterator: function (date) {
	    var currentDate = this.currentDate();
	    while (currentDate.getMonth() < date.getMonth()) {
	        this.next();
	        currentDate.addMonths(1);
        }
        while (currentDate.getDate() < date.getDate()) {
            this.next();
            currentDate.addDays(1);
        }
        while (currentDate.getHours() < date.getHours()) {
            this.next();
            currentDate.addHours(1);
        }
        while (currentDate.getMinutes() < date.getMinutes()) {
            this.next();
            currentDate.addMinutes(1);
        }
        while (currentDate.getSeconds() < date.getSeconds()) {
            this.next();
            currentDate.addSeconds(1);
        }
	},
	
    makeNegative: function (obj) {
        var newObj = [];
        $H(obj).each(function (h) {
            newObj[h.key.toString()] = -h.value;
        });
        return newObj;    
    }
};

/**
 * @function timestampToDate
 * @param {String} timestamp
 * @return {Date} A javascript Date object
 * This function parses a mysql datetime string and returns javascript Date object.
 * The input has to be in this format: 2007-06-05 15:26:02.
 * 
 * Originally from http://snippets.dzone.com/posts/show/4132.
 * A minor bug fix has been applied since this function did not account for the differences 
 * in how JavaScript and MySQL numerically represent months.
 */
function timestampToDate(timestamp) {
    var regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
    var parts = timestamp.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');
    return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
}

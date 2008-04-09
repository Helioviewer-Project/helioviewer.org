/**
 * @fileoverview Contains the class definition for a class which handles manages a collection of meta-information about
 *               data for a given instrument.
 * @see    Filter
 * @author Michael Lynch
 * @author Keith Hughitt
 */
/*global SunImage, SunImgDate, $A, Ajax, TimestampToDate */

/**
 * @class Filter Represents a range of data available for a specific instrument, limited (filtered) based on certain criteria.
 * @constructor
 * @param {String} inst      The instrument associated with the Filter being created.
 * @param {Array}  increment An array of integers representing the currently selected time increment.
 */
function Filter(inst, increment)
{
	var Collection    = $A([]);
	var Iterator      = 0;
	var Instrument    = inst;
	var TimeIncrement = increment;
	
	/**
	 * @method IterateNext Iterates to the next available data point.
	 * @private
	 */
	function IterateNext()
	{
		if (Iterator !== Collection.length - 1)
		{
			Iterator++;
			return true;
		}
		else {
		    return false;
		}
	}
	
	/**
     * @method IteratePrevious Iterates to the previous data point if available.
     * @private
     */
	function IteratePrevious()
	{
		if (Iterator !== 0)
		{
			Iterator--;
			return true;
		}
		else {
		    return false;
		}
	}
	
    /**
     * @method CurrentDate Returns a javascript Date object representing the time for the data point
     *                     currently being displayed.
     * @private
     * @return {Date} The time for the current data point.
     */
	function CurrentDate() {
		return new TimestampToDate(Collection[Iterator]["timestamp"]);
	}
	
	/**
	 * @method Current Returns the current data point.
	 * @public 
	 */
	this.Current = function () {
		return Collection[Iterator];
	};
	
	/**
	 * @method Clear Empties the filter.
	 * @public
	 */
	this.Clear = function () {
		Collection.clear();
		Iterator = 0;
	};
	
	/**
	 * @method CurrentSunImage Returns a "SunImage" object associated with the current data point.
	 * @return {SunImage} The image associated with the current data point.
	 */
	this.CurrentSunImage = function () {
	    var currentDate = new CurrentDate();
	    
		var Observatory =  Collection[Iterator]["observatory"];
		var Instrument =   Collection[Iterator]["instrument"];
		var Detector =     Collection[Iterator]["detector"];
		var Measurement =  Collection[Iterator]["measurement"];
		var StringMonth = (currentDate.getMonth() + 1).toString();
		var StringDay =    currentDate.getDate().toString();
		var StringHour =   currentDate.getHours().toString();
		var	StringMinute = currentDate.getMinutes().toString();
		var StringSecond = currentDate.getSeconds().toString();
	    if (StringDay.length === 1) {
			StringDay = "0" + StringDay;
		}
		if (StringHour.length === 1)	{
			StringHour = "0" + StringHour;
		}
		if (StringMinute.length === 1) {
			StringMinute = "0" + StringMinute;
		}
		if (StringSecond.length === 1) {
			StringSecond = "0" + StringSecond;
		}
		var sunImg = new SunImage(
			{
				date: new SunImgDate(
				{
					year: currentDate.getFullYear(),
					month: StringMonth,
					day: StringDay,
					hour: StringHour,
					min: StringMinute,
					sec: StringSecond
				}),
				observatory: Observatory,
				instrument: Instrument,
				detector: Detector,
				measurement: Measurement,
				wavelength: "",
				resolution: "",
				tileDir: "/hvdb"
			});
        return sunImg;
	};
	
	/**
	 * @method Next Iterates to the next available data point
	 * @public
	 */
	this.Next = function () {
		return new IterateNext();
	};
	
	/**
	 * @method Previous Iterates to the previous data point if available.
	 * @public
	 */
	this.Previous = function () {
		return new IteratePrevious();
	};
	
	/**
	 * @method List Returns the entire range of data.
	 * @public
	 */
	this.List = function () {
		return Collection;
	};

    /**
     * @method Retreive Updates the Filter based on specified critera
     * @public
     * @param {String} Observatory
     * @param {String} Detector
     * @param {String} Measurement
     * @param {Date}   date 
     */
	this.Retreive = function (Observatory, Detector, Measurement, date) {
		//var From = Criteria_FromDate(date);
		//var To = Criteria_ToDate(date);
		
		var self =  this;
		var trash = new Ajax.Request('lib/HV_Database/ReturnFilters.php',
		{
			method: 'get',
			asynchronous: false,
			parameters:
			{
				//"Observatory":    Observatory,
				//"Detector":       Detector,
				//"Measurement":    Measurement,
				//"From":           From,
				//"To":             To,
				"Year":             date.getFullYear(),
				"Month":            date.getMonth() + 1,
				"Day":              date.getDate(),
                "Hour":             date.getHours(),
                "Minute":           date.getMinutes().toString().replace(/^(\d)$/, "0$1"),
                "Second":           date.getSeconds(),
				"Instrument":       Instrument,
				"IncrementDays":    TimeIncrement.days,
				"IncrementHours":   TimeIncrement.hours,
				"IncrementMinutes": TimeIncrement.minutes
			},
			onSuccess: function (transport)
			{
				Collection = Collection.concat(transport.responseJSON);
                self.SetIterator(date);
			},
			onFailure: function ()
			{
				Debug.output("Filter.js: Ajax Request Failed!");
			}
		});
	};
	
	/**
	 * @method SetInstrument Changes the filter's associated instrument to a different one.
	 * @public
	 * @param {String}       The name of the new instrument to use.
	 */
	this.SetInstrument = function (inst) {
	    Instrument = inst;
	};
	
	/**
	 * @method SetTimeIncrement Changes the timeIncrement associated with the filter
	 * @public
	 * @param {Hash} inc        The new time increment to use.
	 */
	this.SetTimeIncrement = function (inc) {
	    TimeIncrement = inc;
	};
	
	/**
	 * @method SetIterator Sets the iterator to the data point closest to the desired observation time.
	 * @public
	 * @param {Date} The desired date.
	 */
	this.SetIterator = function (date) {
	    var currentDate = new CurrentDate();
	    while (currentDate.getMonth() < date.getMonth()) {
	        this.Next();
	        currentDate.addMonths(1);
        }
        while (currentDate.getDate() < date.getDate()) {
            this.Next();
            currentDate.addDays(1);
        }
        while (currentDate.getHours() < date.getHours()) {
            this.Next();
            currentDate.addHours(1);
        }
        while (currentDate.getMinutes() < date.getMinutes()) {
            this.Next();
            currentDate.addMinutes(1);
        }
        while (currentDate.getSeconds() < date.getSeconds()) {
            this.Next();
            currentDate.addSeconds(1);
        }
	};
}

/**
 * @function TimestampToDate
 * @param {String} timestamp
 * @return {Date} A javascript Date object
 * This function parses a mysql datetime string and returns javascript Date object.
 * The input has to be in this format: 2007-06-05 15:26:02.
 * 
 * Originally from http://snippets.dzone.com/posts/show/4132.
 * A minor bug fix has been applied since this function did not account for the differences 
 * in how JavaSript and MySQL numerically represent months.
 */
function TimestampToDate(Timestamp) {
    var Regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
    var Parts = Timestamp.replace(Regex, "$1 $2 $3 $4 $5 $6").split(' ');
    return new Date(Parts[0], Parts[1] - 1, Parts[2], Parts[3], Parts[4], Parts[5]);
}

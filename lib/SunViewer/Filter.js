/*global SunImage, SunImgDate, $A, Ajax, TimestampToDate */
// Function parses mysql datetime string and returns javascript Date object
// input has to be in this format: 2007-06-05 15:26:02
// Originally from http://snippets.dzone.com/posts/show/4132
// A minor bug fix has been applied since this function did not account for the differences in how JavaSript and MySQL numerically represent months.
function TimestampToDate(Timestamp) {
	var Regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
	var Parts = Timestamp.replace(Regex, "$1 $2 $3 $4 $5 $6").split(' ');
	return new Date(Parts[0], Parts[1] - 1, Parts[2], Parts[3], Parts[4], Parts[5]);
}

function Filter(inst, increment)
{
	var Collection    = $A([]);
	var Iterator      = 0;
	var Instrument    = inst;
	var TimeIncrement = increment;
	
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
	function Criteria_FromDate(from) {
		return from.getFullYear().toString() + "-" + (from.getMonth() + 1).toString() + "-" + (from.getDate() - 3).toString();
	}
	function Criteria_ToDate(to) {
		return to.getFullYear().toString() + "-" + (to.getMonth() + 1).toString() + "-" + (to.getDate() + 3).toString();
	}
	function CurrentDate() {
		return new TimestampToDate(Collection[Iterator][1]);
	}
	this.Current = function () {
		return Collection[Iterator];
	};
	this.Clear = function () {
		//delete Collection;
		//delete Iterator;
		Collection.clear();
		Iterator = 0;
	};
	this.CurrentSunImage = function () {
	    var currentDate = new CurrentDate();
	    
		var Observatory =  Collection[Iterator][8];
		var Instrument =   Collection[Iterator][9];
		var Detector =     Collection[Iterator][10];
		var Measurement =  Collection[Iterator][11];
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
	this.Next = function () {
		return new IterateNext();
	};
	this.Previous = function () {
		return new IteratePrevious();
	};
	this.List = function () {
		return Collection;
	};
	//this.Retreive = function(Observatory, Instrument, Detector, Measurement, Year, Month, Day)
	//this.Retreive = function(Observatory, Detector, Measurement, date)
	this.Retreive = function (Observatory, Detector, Measurement, date) {
		//var From = Criteria_FromDate(date);
		//var To = Criteria_ToDate(date);
		
		var self =  this;
		var trash = new Ajax.Request('lib/HV_Database/ReturnFilters.php',
		{
			method: 'post',
			asynchronous: false,
			parameters:
			{
				//"Observatory": Observatory,
				//"Detector": Detector,
				//"Measurement": Measurement,
				//"From":             From,
				//"To":               To,
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
				var Response = transport.responseText.evalJSON() || "no response text";
				Collection = Collection.concat(Response);
				
                //Set Iterator to desired date
                //Iterator = Math.ceil(Collection.length /2);
                self.SetIterator(date);
			},
			onFailure: function ()
			{
				//alert('Something went wrong...');
			}
		});
	};
	
	/**
	 * @method SetInstrument
	 *         Changes the filter's associated instrument to a different one.
	 */
	this.SetInstrument = function (inst) {
	    Instrument = inst;
	};
	
	this.SetTimeIncrement = function (inc) {
	    TimeIncrement = inc;
	};
	
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

// Function parses mysql datetime string and returns javascript Date object
// input has to be in this format: 2007-06-05 15:26:02
// Originally from http://snippets.dzone.com/posts/show/4132
// A minor bug fix has been applied since this function did not account for the differences in how JavaSript and MySQL numerically represent months.
function TimestampToDate(Timestamp)
{
	var Regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
	var Parts = Timestamp.replace(Regex, "$1 $2 $3 $4 $5 $6").split(' ');
	return new Date(Parts[0], Parts[1] - 1, Parts[2], Parts[3], Parts[4], Parts[5]);
}

function Filter(inst, increment)
{
	var Collection    = Array();
	var Iterator      = 0;
	var Instrument    = inst;
	var TimeIncrement = increment;
	
	function IterateNext()
	{
		if (Iterator != Collection.length - 1)
		{
			Iterator++;
			return true;
		}
		else return false;
	}
	function IteratePrevious()
	{
		if (Iterator != 0)
		{
			Iterator--;
			return true;
		}
		else return false;
	}
	function Criteria_FromDate(from)
	{
		return from.getFullYear().toString() + "-" + (from.getMonth() + 1).toString() + "-" + (from.getDate()-3).toString();
	}
	function Criteria_ToDate(to)
	{
		return to.getFullYear().toString() + "-" + (to.getMonth() + 1).toString() + "-" + (to.getDate()+3).toString();
	}
	function CurrentDate()
	{
		return TimestampToDate(Collection[Iterator][1]);
	}
	this.Current = function()
	{
		return Collection[Iterator];
	}
	this.Clear = function()
	{
		//delete Collection;
		//delete Iterator;
		Collection = Array();
		Iterator = 0;
		
	}
	this.CurrentSunImage = function()
	{
		Observatory = Collection[Iterator][8];
		Instrument = Collection[Iterator][9];
		Detector = Collection[Iterator][10];
		Measurement = Collection[Iterator][11];
		StringMonth = CurrentDate().getMonth() + 1;
		StringMonth = StringMonth.toString();
		StringDay = CurrentDate().getDate().toString();
			if (StringDay.length == 1)
			{
				StringDay = "0" + StringDay;
			}
			StringHour = CurrentDate().getHours().toString();
			if (StringHour.length == 1)
			{
				StringHour = "0" + StringHour;
			}
			StringMinute = CurrentDate().getMinutes().toString();
			if (StringMinute.length == 1)
			{
				StringMinute = "0" + StringMinute;
			}
			StringSecond = CurrentDate().getSeconds().toString();
			if (StringSecond.length == 1)
			{
				StringSecond = "0" + StringSecond;
			}
		var sunImg = new SunImage(
			{
				date: new SunImgDate(
				{
					year: CurrentDate().getFullYear(),
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
	}
	this.Next = function()
	{
		return IterateNext();
	}
	this.Previous = function()
	{
		return IteratePrevious();
	}
	this.List = function()
	{
		return Collection;
	}
	//this.Retreive = function(Observatory, Instrument, Detector, Measurement, Year, Month, Day)
	//this.Retreive = function(Observatory, Detector, Measurement, date)
	this.Retreive = function(Observatory, Detector, Measurement, date)
	{
		//var From = Criteria_FromDate(date);
		//var To = Criteria_ToDate(date);
		new Ajax.Request('lib/HV_Database/ReturnFilters.php',
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
			onSuccess: function(transport)
			{
				var Response = transport.responseText.evalJSON() || "no response text";
				Collection = Collection.concat(Response);
			},
			onFailure: function()
			{
				//alert('Something went wrong...');
			}
		});
	}
	
	/**
	 * @method SetInstrument
	 *         Changes the filter's associated instrument to a different one.
	 */
	this.SetInstrument = function (inst) {
	    Instrument = inst;
	}
	
	this.SetTimeIncrement = function (inc) {
	    TimeIncrement = inc;
	}
}


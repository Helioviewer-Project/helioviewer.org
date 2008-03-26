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

function Filter()
{
	var Collection = Array();
	var Iterator = 0;
	
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
	function Criteria_FromDate(Year, Month, Day)
	{
		var From = new Date();
		From.setFullYear(Year);
		From.setMonth(Month - 1);
		From.setDate(Day);
		From.setDate(From.getDate() - 3);
		return From.getFullYear().toString() + "-" + (From.getMonth() + 1).toString() + "-" + From.getDate().toString();
	}
	function Criteria_ToDate(Year, Month, Day)
	{
		var To = new Date();
		To.setFullYear(Year);
		To.setMonth(Month - 1);
		To.setDate(Day);
		To.setDate(To.getDate() + 3);
		return To.getFullYear().toString() + "-" + (To.getMonth() + 1).toString() + "-" + To.getDate().toString();
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
	this.Retreive = function(Observatory, Instrument, Detector, Measurement, Year, Month, Day)
	{
		var From = Criteria_FromDate(Year, Month, Day);
		var To = Criteria_ToDate(Year, Month, Day);
		new Ajax.Request('lib/HV_Database/ReturnFilters.php',
		{
			method: 'post',
			asynchronous: false,
			parameters:
			{
				//"Observatory": Observatory,
				"Instrument": Instrument,
				//"Detector": Detector,
				//"Measurement": Measurement,
				"From": From,
				"To": To
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
}


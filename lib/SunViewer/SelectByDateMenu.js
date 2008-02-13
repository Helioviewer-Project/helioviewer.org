/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Builds and manages a menu for selecting the current
 * image through drop-downs for the year, month, day and image.
 * NOTE: This class is to be replaced by a more intuitive way of browsing
 * through the available data.
 */
 
var SelectByDateMenu = Class.create();

SelectByDateMenu.prototype =  Object.extend(new SunViewerWidget(), {
	// Default options
	defaultOptions: $H({
		tileDir: 'images/tiles/',
		Database: 'lib/HV_Database/'
	}),
	
	
	
	/**
	 * @constructor
	 * @param {String} elementId	TheID of the menu HTML element.
	 * @param {Hash} options		Available options: tileDir
	 */
	initialize: function(elementId, options) {
		this.date = { year: 0, month: 0, day: 0, image: '' };
		this.map = { instrument: '-all-' };

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		if (elementId && document.getElementById(elementId)) {
			this.domNode = $(elementId);
			this.instrumentHtmlElement = $(this.domNode.id + '.InstrumentSel');
			this.yearHtmlElement = $(this.domNode.id + '.YearSel');
			this.monthHtmlElement = $(this.domNode.id + '.MonthSel');
			this.dayHtmlElement = $(this.domNode.id + '.DaySel');
			this.imageHtmlElement = $(this.domNode.id + '.ImageSel');
			this.observeElements().populateElements();
		}
	},
	
	/**
	 * @method createHtmlElement	Creates the menu HTML element and its sub-elements.
	 * @return {HTML Element}		The menu HTML element.
	 */
	createHtmlElement: function() {
		var htmlElement = document.createElement('span');
		htmlElement.className = 'selectByDateMenu';
		this.domNode = htmlElement;
		this.createElements().appendElements().observeElements().populateElements();
		return htmlElement;
	},
	
	/**
	 * @method createTableCells	Creates the table cells containing the drop-down menus.
	 * @return {Hash}			A Hash containing an entry for each drop-down cell.
	 */
	createTableCells: function() {
		var htmlElement = document.createElement('span');
		htmlElement.className = 'selectByDateMenu';
		this.domNode = htmlElement;
		this.createElements().observeElements().populateElements();
		return {
			instrument: this.createTableCell(this.instrumentHtmlElement),
			year: this.createTableCell(this.yearHtmlElement),
			month: this.createTableCell(this.monthHtmlElement),
			day: this.createTableCell(this.dayHtmlElement),
			image: this.createTableCell(this.imageHtmlElement)
		};
	},
	
	/**
	 * @method createTableCell				Creates a single table cell containing one drop-down menu.
	 * @param {HTML Element} htmlElement	The drop-down menu HTML element.
	 * @return {HTML Element}				The table cell containing the drop-down menu.
	 */
	createTableCell: function(htmlElement) {
		var td = document.createElement('td');
		td.className = 'layerConfigurator';
		td.appendChild(htmlElement);
		return td;
	},
	
	/**
	 * @method createElements	Creates the drop-down menus.
	 */
	createElements: function() {
		this.instrumentHtmlElement = document.createElement('select');
		this.instrumentHtmlElement.id = this.domNode.id + '.InstrumentSel';
		this.yearHtmlElement = document.createElement('select');
		this.yearHtmlElement.id = this.domNode.id + '.YearSel';
		this.monthHtmlElement = document.createElement('select');
		this.monthHtmlElement.id = this.domNode.id + '.MonthSel';
		this.dayHtmlElement = document.createElement('select');
		this.dayHtmlElement.id = this.domNode.id + '.DaySel';
		this.imageHtmlElement = document.createElement('select');
		this.imageHtmlElement.id = this.domNode.id + '.ImageSel';
		return this;
	},
	
	/**
	 * @method appendElements	Appends the drop-down menus and their labels to the menu HTML element.
	 */
	appendElements: function() {
		this.domNode.appendChild(document.createTextNode('Instrument '));
		this.domNode.appendChild(this.instrumentHtmlElement);
		this.domNode.appendChild(document.createTextNode('Year '));
		this.domNode.appendChild(this.yearHtmlElement);
		this.domNode.appendChild(document.createTextNode(' Month '));
		this.domNode.appendChild(this.monthHtmlElement);
		this.domNode.appendChild(document.createTextNode(' Day '));
		this.domNode.appendChild(this.dayHtmlElement);
		this.domNode.appendChild(document.createTextNode(' Image '));
		this.domNode.appendChild(this.imageHtmlElement);
		return this;
	},

	/**
	 * @method populateElements	Populates the drop-down menus.
	 */
	populateElements: function() {
		var callback = this.populateInstruments.bind(this);
		var url = this.Database + 'ReturnInstruments.php';
		new AjaxRequestWrapper.getCached(url, callback);
		return this;
	},

	/**
	 * @method observeElements	Registers the change event handlers for the drop-down menus.
	 */
	observeElements: function() {
		Event.observe(this.instrumentHtmlElement, 'change', this.handleInstrumentChange.bind(this));
		Event.observe(this.yearHtmlElement, 'change', this.handleYearChange.bind(this));
		Event.observe(this.monthHtmlElement, 'change', this.handleMonthChange.bind(this));
		Event.observe(this.dayHtmlElement, 'change', this.handleDayChange.bind(this));
		Event.observe(this.imageHtmlElement, 'change', this.handleImageChange.bind(this));
		return this;
	},
	
	
	populateInstruments: function(txt) {
		var instruments = eval(txt);
		var options = this.instrumentHtmlElement;
		options.length = 0;
		this.map.instrument = "-all-";
		var option = new Option("-all-", "-all-", false, false);
		options.appendChild(option);
		
		for (var Counter = 0; Counter < instruments.length; Counter++)
		{
			var option = new Option(instruments[Counter], instruments[Counter], false, false);
		}
		
		this.map.instrument = instruments[0];
		
		var callback = this.populateYears.bind(this);
		var url = this.Database + 'ReturnYears.php?Instrument=' + this.map.instrument;
		new AjaxRequestWrapper.getCached(url, callback);
	},
	
	/**
	 * @method populateYears	Populates the years drop-down.
	 * @param {String} txt		The contents of the dirlist.txt file.
	 */
	populateYears: function(txt) {
		var years = eval(txt);
		var options = this.yearHtmlElement;
		options.length = 0;
		this.date.year = 0;
		for (var Counter = 0; Counter < years.length; Counter++)
		{
			var option = new Option(years[Counter], years[Counter], false, false);
			options.appendChild(option);
		}
		
		this.date.year = years[0];
		
		var callback = this.populateMonths.bind(this);
		var url = this.Database + 'ReturnMonths.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year;
		new AjaxRequestWrapper.getCached(url, callback);
	},
	
	/**
	 * @method populateMonths	Populates the months drop-down.
	 * @param {String} txt		The contents of the dirlist.txt file.
	 */
	populateMonths: function(txt) {
		var months = eval(txt);
		var year = this.date.year;
		var options = this.monthHtmlElement;
		options.length = 0;
		this.date.month = 0;
		for (var Counter = 0; Counter < months.length; Counter++)
		{
			var monthProperties = {
				year: year,
				month: months[Counter]
			};
			var option = new Option(months[Counter], months[Counter], false, false);
			option.properties = monthProperties;
			options.appendChild(option);
		}

		this.date.month = months[0];
		
		var callback = this.populateDays.bind(this);
		var url = this.Database + 'ReturnDays.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year + '&Month=' + this.date.month;
		new AjaxRequestWrapper.getCached(url, callback);
	},
	
	populateDays: function(txt) {
		var days = eval(txt);
		var year = this.date.year;
		var month = this.date.month;
		var options = this.dayHtmlElement;
		options.length = 0;
		this.date.Day = 0;
		for (var Counter = 0; Counter < days.length; Counter++)
		{
			var dayProperties = {
				year: year,
				month: month,
				day: days[Counter]
			};
			var option = new Option(days[Counter], days[Counter], false, false);
			option.properties = dayProperties;
			options.appendChild(option);
		}

		this.date.day = days[0];
		
		var callback = this.populateImages.bind(this);
		var url = this.Database + 'ReturnImages.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year + '&Month=' + this.date.month + '&Day=' + this.date.day;
		new AjaxRequestWrapper.getCached(url, callback);

	},
	
	populateImages: function(txt) {
		var images = eval(txt);
		var self = this;
		var year = this.date.year;
		var month = this.date.month;
		var day = this.date.day;
		var options = this.imageHtmlElement;
		options.length = 0;
		
		for (var Counter = 0; Counter < images.length; Counter++)
		{
			hour = images[Counter][4];
			min = images[Counter][5];
			sec = images[Counter][6];
			observatory = images[Counter][7];
			instrument = images[Counter][8];
			detector = images[Counter][9];
			measurement = images[Counter][10];
			
			StringDay = this.date.day.toString();
			if (StringDay.length == 1)
			{
				StringDay = "0" + StringDay;
			}
			StringHour = hour.toString();
			if (StringHour.length == 1)
			{
				StringHour = "0" + StringHour;
			}
			StringMinute = min.toString();
			if (StringMinute.length == 1)
			{
				StringMinute = "0" + StringMinute;
			}
			StringSecond = sec.toString();
			if (StringSecond.length == 1)
			{
				StringSecond = "0" + StringSecond;
			}
			
			//Debug.output("SelectByDateMenu.js:287 -> PopulateImages() ... initializing SunImage.");
			var sunImg = new SunImage(
			{
				date: new SunImgDate(
				{
					year: self.date.year,
					month: self.date.month,
					day: day,
					hour: images[Counter][4],
					min: images[Counter][5],
					sec: images[Counter][6]
				}),
				observatory: observatory,
				instrument: instrument,
				detector: detector,
				measurement: measurement,
				wavelength: "",
				resolution: "",
				tileDir: "http://localhost/hvdb" + "/" + this.date.year + "/" + this.date.month + "/" + StringDay + "/" + StringHour  + "/" + observatory + "/" + instrument + "/" + detector + "/" + measurement + "/" + this.date.year + "_" + this.date.month + "_" + StringDay + "_" + StringHour + StringMinute + StringSecond + "_" + observatory + "_" + instrument + "_" + detector + "_" + measurement
			});
			
			var imgDesc = images[Counter][0];
			
			var option = new Option(imgDesc, imgDesc, false, false);
			option.properties = sunImg;
			options.appendChild(option);
			
		}
		self.handleImageChange();

	},
	
	handleInstrumentChange: function() {
		// refresh month drop-down
		this.map.instrument = this.instrumentHtmlElement.options[this.instrumentHtmlElement.selectedIndex].value;
		var callback = this.populateYears.bind(this); 
		var url = this.Database + 'ReturnYears.php?Instrument=' + this.map.instrument;
		new AjaxRequestWrapper.getCached(url, callback);
	},

	/**
	 * Event handler: year change
	 */
	handleYearChange: function() {
		// refresh month drop-down
		this.date.year = this.yearHtmlElement.options[this.yearHtmlElement.selectedIndex].value;
		var callback = this.populateMonths.bind(this); 
		var url = this.Database + 'ReturnMonths.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year;
		new AjaxRequestWrapper.getCached(url, callback);
	},

	/**
	 * Event handler: month change
	 */
	handleMonthChange: function() {
		// refresh day drop-down
		var monthProperties = this.monthHtmlElement.options[this.monthHtmlElement.selectedIndex].properties;
		this.date.month = monthProperties.month;
		var callback = this.populateImages.bind(this);
		var url = this.Database + 'ReturnDays.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year + '&Month=' + this.date.month;
		new AjaxRequestWrapper.getCached(url, callback);
	},

	/**
	 * Event handler: day change
	 */
	handleDayChange: function() {
		//Debug.output("SelectByDateMenu:354 -> handle day change");
		// refresh image drop-down
		var dayProperties = this.dayHtmlElement.options[this.dayHtmlElement.selectedIndex].properties;
		this.date.day = dayProperties.day;
		var callback = this.populateImages.bind(this);
		var url = this.Database + 'ReturnImages.php?Instrument=' + this.map.instrument + '&Year=' + this.date.year + '&Month=' + this.date.month + '&Day=' + this.date.day;
		new AjaxRequestWrapper.getCached(url, callback, true);
	},

	/**
	 * Event handler: image change
	 */
	/**
	 * Event handler: image change
	 */
	handleImageChange: function() {
		//Debug.output("SelectByDateMenu:370 -> handle image change");
		this.selectedImage = this.imageHtmlElement.options[this.imageHtmlElement.selectedIndex].properties;

		// Dirty hack here
		//if (Debug.loadingIndicator.loadingItemCount != 0) {
		//	Debug.output("dirty hack");
		//	Debug.loadingIndicator.reset();
		//}

		var callback = this.setImageParameters.bind(this);
		var url = this.selectedImage.tileDir + '/parameters.txt';
		new Ajax.Request(url,
			{
				method: 'get',
				onSuccess: function(transport) { callback(transport.responseText); },
				onFailure: function(transport) { callback(''); }
			}
		);
	},
	
	/**
	 * TODO: Check the contents of the parameters.txt file before eval()-ing them.
	 * @method setImageParameters	Sets the image parameters according to the values in the text file.
	 * @param {String} txt			The contents of the parameters.txt file from the tile directory.
	 */
	setImageParameters: function(txt) {
		//Debug.output("SelectByDateMenu:396 -> setimageparamaters");
		var lines = txt.split("\n");
		var lcount = lines.length;
		for (var i=0; i<lcount; i++) {
			var line = lines[i];
			if (line.substr(0,1) == '#') continue;
			var equalsPos = line.indexOf('=');
			if (equalsPos < 0) continue;
			eval('this.selectedImage.' + line.strip() + ';');
		}
		this.notifyNewImage();
	},
	
	/**
	 * @method notifyNewImage	Notifies the listeners that a new image has been selected.
	 */
	notifyNewImage: function() {
		// notify listeners
		//Debug.output("SelectByDateMenu:414 -> notifynewimage");
		this.notifyListeners('ImageChange', this.selectedImage);
	}
});

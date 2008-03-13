/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */

/**
 * @class SelectByDateMenu Builds and manages a menu for selecting the current
 * image through drop-downs for the year, month, day and image.
 * NOTE: This class is to be replaced by a more intuitive way of browsing
 * through the available data.
 */

var FilterCollection = new Filter();
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
		
		if (elementId && $(elementId)) {
			this.domNode = $(elementId);
			this.instrumentHtmlElement = $(this.domNode.id + '.InstrumentSel');
			this.yearHtmlElement = $(this.domNode.id + '.YearSel');
			this.monthHtmlElement = $(this.domNode.id + '.MonthSel');
			this.dayHtmlElement = $(this.domNode.id + '.DaySel');
			this.imageHtmlElement = $(this.domNode.id + '.ImageSel');
			this.timeHtmlElement = $(this.domNode.id + '.TimeSel');
			this.observeElements().populateElements();
		}
	},
	
	/**
	 * @method observeElements	Registers the change event handlers for the drop-down menus.
	 */
	observeElements: function() {
		Event.observe(this.instrumentHtmlElement, 'change', this.handleInstrumentChange.bind(this));
		Event.observe(this.yearHtmlElement, 'change', this.handleYearChange.bind(this));
		Event.observe(this.monthHtmlElement, 'change', this.handleMonthChange.bind(this));
		Event.observe(this.dayHtmlElement, 'change', this.handleDayChange.bind(this));
		Event.observe(document.body, 'change', this.handleImageChange.bind(this));
		Event.observe(this.timePreviousHtmlElement, 'click', this.timePrevious.bind(this));
		Event.observe(this.timeNextHtmlElement, 'click', this.timeNext.bind(this));
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
	 * @method createTableCells	Creates the table cells containing the drop-down menus.
	 * @return {Hash}			A Hash containing an entry for each drop-down cell.
	 */
	createTableCells: function() {
		var htmlElement = new Element('span', {'class': 'selectByDateMenu'});
		this.domNode = htmlElement;
		this.createElements().observeElements().populateElements();
		return {
			instrument: this.createTableCell(this.instrumentHtmlElement),
			year: this.createTableCell(this.yearHtmlElement),
			month: this.createTableCell(this.monthHtmlElement),
			day: this.createTableCell(this.dayHtmlElement),
			image: this.createTableCell(this.imageHtmlElement),
			prev: this.createTableCell(this.timePreviousHtmlElement),
			next: this.createTableCell(this.timeNextHtmlElement)
		};
	},
	
	/**
	 * @method createTableCell				Creates a single table cell containing one drop-down menu.
	 * @param {HTML Element} htmlElement	The drop-down menu HTML element.
	 * @return {HTML Element}				The table cell containing the drop-down menu.
	 */
	createTableCell: function(htmlElement) {
		var td = new Element('td', {'class': 'layerConfigurator'}).update(htmlElement);

		return td;
	},
	
	/**
	 * @method createElements	Creates the drop-down menus.
	 */
	createElements: function() {
		this.instrumentHtmlElement = new Element('select', {id: this.domNode.id + '.InstrumentSel'});
		this.yearHtmlElement = new Element('select', {id: this.domNode.id + '.YearSel'});
		this.monthHtmlElement = new Element('select', {id: this.domNode.id + '.MonthSel'});
		this.dayHtmlElement = new Element('select', {id: this.domNode.id + '.DaySel'});
      	this.timePreviousHtmlElement = new Element('a', {id: this.domNode.id + '.TimePrevious', 'href': '#'}).update('[<]');
      	this.timeNextHtmlElement = new Element('a', {id: this.domNode.id + '.TimeNext', 'href': '#'}).update('[>]');
		
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
	 * @function populateYears	Populates the years drop-down.
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
	 * @function populateMonths	Populates the months drop-down.
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

	/**
	 * @function populateDays	Populates the days drop-down.
	 * @param {String} txt		The contents of the dirlist.txt file.
	 */	
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
	
	/**
	 * @function populateImages	Populates the images drop-down.
	 * @param {String} txt		The contents of the dirlist.txt file.
	 */
	populateImages: function(txt) {
		FilterCollection.Clear();
		FilterCollection.Retreive(null, null, null, null, this.date.year, this.date.month, this.date.day);
		this.handleImageChange();
	},
	
	timePrevious: function() {
	    if (FilterCollection.Previous())
	    {
	    	this.handleImageChange();
	    }
	},
	
	timeNext: function() {
	    if (FilterCollection.Next())
	    {
	    	this.handleImageChange();
	    }
	},
	
	/**
	 * Event handler: instrument change
	 */	
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
	handleImageChange: function() {
		this.selectedImage = FilterCollection.CurrentSunImage();

		// Dirty hack here
		if (Debug.loadingIndicator.loadingItemCount != 0) {
			Debug.loadingIndicator.reset();
		}
		
    	//this.notifyListeners('ImageChange', this.selectedImage);
		document.sunImageChange.fire(this.selectedImage);
	},
	
	/**
	 * @method notifyNewImage	Notifies the listeners that a new image has been selected.
	 */
	notifyNewImage: function() {
		// notify listeners
		//this.notifyListeners('ImageChange', this.selectedImage);
		document.sunImageChange.fire(this.selectedImage);
	},

    /*************************************************************************\
     *     LEGACY CODE BELOW                                                 *
    \*************************************************************************/
	
	/**
	 * @method appendElements	Appends the drop-down menus and their labels to the menu HTML element.
	 */
	appendElements: function() {
		this.domNode.insert('Instrument ').insert(this.instrumentHtmlElement);
		this.domNode.insert('Year ').insert(this.yearHtmlElement);
		this.domNode.insert('Month ').insert(this.monthHtmlElement);
		this.domNode.insert('Day ').insert(this.dayHtmlElement);
		this.domNode.insert('Image ').insert(this.imageHtmlElement);
		return this;
	},
	
    /**
	 * TODO: Check the contents of the parameters.txt file before eval()-ing them.
	 * @method setImageParameters	Sets the image parameters according to the values in the text file.
	 * @param {String} txt			The contents of the parameters.txt file from the tile directory.
	 */
	setImageParameters: function(txt) {
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
	 * @method createHtmlElement	Creates the menu HTML element and its sub-elements.
	 * @return {HTML Element}		The menu HTML element.
	 */
	createHtmlElement: function() {
		var htmlElement = document.createElement('span');
		htmlElement.className = 'selectByDateMenu';
		this.domNode = htmlElement;
		this.createElements().appendElements().observeElements().populateElements();
		return htmlElement;
	}
});

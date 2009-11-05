/**
 * @fileOverview Contains the class definition for an TimeControls class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see Time
 *
 * TODO: Use highlight or similar effect on date and time input fields themselves when
 * invalid data is specified.
 */
/*global $, window, TimeControls, Class */
var TimeControls = Class.extend(
	/** @lends TimeControls.prototype */
	{
    /**
     * @constructs
     * @description Creates a new TimeControl component
     * @param {Object} controller Reference to the Helioviewer application class/controller
     * @param {Int} increment The amount of time to jump, in seconds, each time the back button or forward button is pressed
  	 * @param {String} dateId The ID of the date form field associated with the Time.
	 * @param {String} timeId The ID of the time form field associated with the Time.
     * @param {String} incrementSelect ID for the HTML element for selecting the time increment
     * @param {String} backBtn ID for the time "Back" button
     * @param {String} forwardBtn ID for the time "Forward" button
     */
    init : function (controller, increment, dateInput, timeInput, incrementSelect, backBtn, forwardBtn) {
        this.controller = controller;
        
        // UI components
        this._dateInput  = $(dateInput);
        this._timeInput  = $(timeInput);
        this._backBtn    = $(backBtn);
        this._forwardBtn = $(forwardBtn);
        this._incrementSelect = $(incrementSelect);
        
        // Initial time increment 
        this._timeIncrement = increment;
        
        // Update input fields
        this._updateInputFields();
        
        // Initialize datepicker
        this._initDatePicker();

        // Initialize event listeners
        this._initEvents();
        		
		// Populate select box
		this._addTimeIncrements();
    },

	/**
	 * @description Updates the HTML form fields associated with the time manager.
	 */
    _updateInputFields: function () {
        var date = this.controller.getDate();

        // Set text-field to the new date
        this._dateInput.val(date.toUTCDateString());
        this._timeInput.val(date.toUTCTimeString());
    },
    
    /**
     * @description returns the contents of the date input field
     */
    getDateField: function () {
        return this._dateInput.val();  
    },
    
    /**
     * @description returns the contents of the time input field
     */
    getTimeField: function () {
        return this._timeInput.val();  
    },
      
   /**
    * @description Move back one time incremement
    */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this._timeIncrement);
        this.controller.date.setDate(newDate);
        this._updateInputFields();
    },
    
    /**
     * @function Move forward one time increment
     */
    timeNext: function () {
        var newDate = this.controller.date.addSeconds(this._timeIncrement);
        this.controller.date.setDate(newDate);
        this._updateInputFields();
    },
    
    /**
     * @description Populates the time increment select item
     */
    _addTimeIncrements: function () {
		var timeSteps, select, opt;
		
        timeSteps = [
            {numSecs: 1,        txt: "1&nbsp;Sec"},
            {numSecs: 60,       txt: "1&nbsp;Min"},
            {numSecs: 300,      txt: "5&nbsp;Mins"},
            {numSecs: 900,      txt: "15&nbsp;Mins"},
            {numSecs: 3600,     txt: "1&nbsp;Hour"},
            {numSecs: 21600,    txt: "6&nbsp;Hours"},
            {numSecs: 43200,    txt: "12&nbsp;Hours"},
            {numSecs: 86400,    txt: "1&nbsp;Day"},
            {numSecs: 604800,   txt: "1&nbsp;Week"},
            {numSecs: 2419200,  txt: "28&nbsp;Days"},
            {numSecs: 31556926, txt: "1&nbsp;Year"}
        ];
        
        // Add time-steps to the select menu
        select = this._incrementSelect;

        $(timeSteps).each(function (i, timestep) {
            opt = $("<option value='" + timestep.numSecs + "'>" + timestep.txt + "</option>");
            select.append(opt);
        });
		
		// Select default timestep
        $('#timestep-select').find("[value = " + this._timeIncrement + "]").attr("selected", "selected");

		// Event-handler
        select.bind('change', this, function (e) {
			var self = e.data;
            self._onChange(e);
        });
    },
    
   /**
    * @description Time-incremenet change event handler
    * @param {Event} e Prototype Event Object
    */
    _onChange: function (e) {
		this._timeIncrement = parseInt(e.target.value, 10);
    },

    _initDatePicker: function () {
        var btn, self = this;
        
        // Initialize datepicker
        this.cal = this._dateInput.datepicker({
            buttonImage    : 'images/blackGlass/calendar_small.png',
            buttonImageOnly: true,
			buttonText     : "Select a date.",
            changeYear     : true,
            dateFormat     : 'yy/mm/dd',
            mandatory      : true,
            showOn         : 'button',
            yearRange      : '1993:2009',
            onSelect       : function (dateStr) {
                window.setTimeout(function () {
                    self.controller.date.updateDate(dateStr);
                }, 500);
            }
        });
        
        // Set datepicker icon
        btn = $('.ui-datepicker-trigger');

        // Add tooltip
        btn.attr("title", "Select an observation date.");
        $('.ui-datepicker-trigger').qtip({
			style: {
				name: 'helioviewer'
			}
		});
        
        // Mouse-over effect
        btn.hover(
            function () {
                btn.attr("src", "images/blackGlass/calendar_small-hover.png");
            },
            function () {
                btn.attr("src", "images/blackGlass/calendar_small.png");                
            }
        );  
    },

    /**
     * @descriptional Initialize date and Time-related events
     */
    _initEvents: function () {
        
        // Time backward button
        this._backBtn.bind('click', this, function (e) {
            var self = e.data;
            self.timePrevious();
        });
        
        // Time forward button
        this._forwardBtn.bind('click', this, function (e) {
            var self = e.data;
            self.timeNext();
        });
        
        // Time field change
        this._timeInput.bind('change', this, function (e) {
			var self = e.data;
			self.controller.date.updateTime(e.target.value);
		});
        
        
        //Date field change
        this._dateInput.bind('change', this, function (e) {
            var self = e.data;
            self.controller.date.updateDate(e.target.value); 
        });
    },
	
	/**
	 * @description Returns the time increment currently displayed in the viewport.
	 * @return {int} this._timeIncrement -- time increment in secons
	 */
    getTimeIncrement: function() {
		return this._timeIncrement;
	}
});

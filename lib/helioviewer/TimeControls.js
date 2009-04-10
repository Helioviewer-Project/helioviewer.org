/**
 * @fileOverview Contains the class definition for an TimeControls class.
 * Syntax: Prototype
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global TimeControls, Class, UIElement, Event, Element, $, $A */
var TimeControls = Class.create(UIElement,
	/** @lends TimeControls.prototype */
	{
    /**
     * @constructs
     * @description Creates a new TimeControl component
     * @param {Object} controller Reference to the Helioviewer application class/controller
     * @param {String} incrementSelect ID for the HTML element for selecting the time increment
     * @param {String} backBtn ID for the time "Back" button
     * @param {String} forwardBtn ID for the time "Forward" button
     * @param {Int} timeIncrement The amount of time to jump, in seconds, each time the back button or forward button is pressed
     */
    initialize : function (controller, incrementSelect, backBtn, forwardBtn, timeIncrement) {
        this.controller = controller;
        
        //Private member variables
        this.className = "TimeControls";
        
        // Set increment 
        this.timeIncrement = timeIncrement;
		
		// Populate select box
		this.addTimeIncrements(incrementSelect);
        
        // Event-handlers
        Event.observe(backBtn,    'click', this.timePrevious.bind(this));
        Event.observe(forwardBtn, 'click', this.timeNext.bind(this));
    },
    
    /**
     * @description Populates the time increment select item
     * @param {String} selectId The ID for the SELECT form item associated with the desired time increment
     */
    addTimeIncrements: function (selectId) {
		var timeSteps, select, opt;
		
        timeSteps = [
            {numSecs: 1,       txt: "1&nbsp;Sec"},
            {numSecs: 60,      txt: "1&nbsp;Min"},
            {numSecs: 300,     txt: "5&nbsp;Mins"},
            {numSecs: 900,     txt: "15&nbsp;Mins"},
            {numSecs: 3600,    txt: "1&nbsp;Hour"},
            {numSecs: 21600,   txt: "6&nbsp;Hours"},
            {numSecs: 43200,   txt: "12&nbsp;Hours"},
            {numSecs: 86400,   txt: "1&nbsp;Day"},
            {numSecs: 604800,  txt: "1&nbsp;Week"},
            {numSecs: 2419200, txt: "28&nbsp;Days"}
        ];
        
		select = $(selectId);
		
		// Add time-steps to the select menu
		$A(timeSteps).each(function (o) {
			opt = new Element('option', {value: o.numSecs}).insert(o.txt);
			select.insert(opt);
		});
		
		// Select default timestep
		select.select('option[value=' + this.timeIncrement + ']')[0].writeAttribute('selected', 'selected');
		
		// Event-handler
		Event.observe(select, 'change', this.onChange.bindAsEventListener(this));
    },
    
   /**
    * @description Time-incremenet change event handler
    * @param {Event} e Prototype Event Object
    */
    onChange: function (e) {
		this.timeIncrement = parseInt(e.target.value, 10);
		this.fire('timeIncrementChange', this.timeIncrement);
    },
      
   /**
    * @description Move back one time incremement
    */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    },
    
    /**
     * @function Move forward one time increment
     */
    timeNext: function () {
        var newDate = this.controller.date.addSeconds(this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    } 
});

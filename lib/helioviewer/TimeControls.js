/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 */
/**
 * @class TimeControls
 * syntax: Prototype
 */
var TimeControls = Class.create(UIElement, {
    /**
     * @constructor
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
     * @method addTimeIncrements
     */
    addTimeIncrements: function (selectId) {
        var timeSteps = [
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
        
		var select = $(selectId);
		
		// Add time-steps to the select menu
		$A(timeSteps).each(function(o) {
			var opt = new Element('option', {value: o.numSecs}).insert(o.txt);
			select.insert(opt);
		});
		
		// Select default timestep
		select.select('option[value=' + this.timeIncrement + ']')[0].writeAttribute('selected', 'selected');
		
		// Event-handler
		Event.observe(select, 'change', this.onChange.bindAsEventListener(this));
    },
    
   /**
    * @function onChange
    */
    onChange: function (e) {
		this.timeIncrement = parseInt(e.target.value);
		this.fire('timeIncrementChange', this.timeIncrement);
    },
      
    /**
     * @function timeNext
     */
    timePrevious: function () {
        var newDate = this.controller.date.addSeconds(-this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    },
    
    /**
     * @function timePrevious
     */
    timeNext: function () {
        var newDate = this.controller.date.addSeconds(this.timeIncrement);
        this.controller.setDate(newDate);
        this.controller.calendar.updateFields();
    } 
});

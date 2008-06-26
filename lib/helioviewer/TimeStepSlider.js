/**
 * @author Keith Hughitt      keith.hughitt@gmail.com
 * @author Patrick Schmiedel  patrick.schmiedel@gmx.net
 */
/**
 * @class TimeStepSlider A slider for controlling the timestep. For convenience the slider uses indices 
 *                       rather than the actual values, the number of seconds. This is due to the fact 
 *                       that the Scriptaculous Slider is only able to display values linearly but the
 *                       timesteps are spaced at pseudo-logarithmic intervals.
 */
/*global Class, Control, UIElement, document, $, $R */
 
var TimeStepSlider = Class.create(UIElement, {
    /**
     * @constructor
     */
    initialize : function (controller, sliderHandleId, sliderTrackId, backBtn, forwardBtn, timeIncrement, initialIndex) {
        this.controller = controller;
        this.slider = new Control.Slider(sliderHandleId, sliderTrackId,
            {
                axis:        'horizontal',
                range:       $R(1, 10),
                values:      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                sliderValue: initialIndex,
                onChange:    this.onChange.bindAsEventListener(this),
                onSlide:     this.onSlide.bindAsEventListener(this)
            });
        
        //Private member variables
        this.className = "TimeStepSlider";
        this.lastIndex = initialIndex;
        this.timestep =  this.indexToTimeStep(initialIndex);
        
        // Set increment 
        this.timeIncrement = timeIncrement;
        
        // Event-handlers
        Event.observe(backBtn, 'click', this.timePrevious.bind(this));
        Event.observe(forwardBtn, 'click', this.timeNext.bind(this));
    },
    
    /**
     * @method indexToTimeStep Maps from the slider index value, a small whole number, to
     *                         a pair representing the number of seconds and a label associated
     *                         with the desired timestep. NOTE: Indices start with one and not zero
     * 						   to avoid an issue relating to scriptaculous's slider implementation.
     * @param   {Int} index The slider index for the current timestep.
     * @returns {Hash} A hash containing he number of seconds and a label for the desired timestep.
     */
    indexToTimeStep: function (index) {
        var timeSteps = [
            {numSecs: 1,      txt: "1&nbsp;Sec"},
            {numSecs: 1,      txt: "1&nbsp;Sec"},
            {numSecs: 60,     txt: "1&nbsp;Min"},
            {numSecs: 300,    txt: "5&nbsp;Mins"},
            {numSecs: 900,    txt: "15&nbsp;Mins"},
            {numSecs: 3600,   txt: "1&nbsp;Hour"},
            {numSecs: 21600,  txt: "6&nbsp;Hours"},
            {numSecs: 43200,  txt: "12&nbsp;Hours"},
            {numSecs: 86400,  txt: "1&nbsp;Day"},
            {numSecs: 604800, txt: "1&nbsp;Week"},
            {numSecs: 2419200, txt: "28&nbsp;Days"}
        ];
        
        return timeSteps[index];
    },
    
   /**
    * @function onChange Called when the slider value is changed.
    * @param {Integer} index  The new slider index value.
    */
    onChange: function (index) {
        if (index !== null) {
            this.timestep = this.indexToTimeStep(index);
            this.fire('timeIncrementChange', this.timestep.numSecs);
        }
    },
    
    /**
     * @method onSlide
     * @param {Integer} index The current slider index.
     */
    onSlide: function (index) {
    	if ((index !== null) && (index !== this.lastIndex)) {
        	this.lastIndex = index;
            $('timestepValueDisplay').update(this.indexToTimeStep(index).txt);
        }
    },
    
    setTimeIncrement: function (timeIncrement) {
        Debug.output("setTimeInc");
        this.timeIncrement = timeIncrement;
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

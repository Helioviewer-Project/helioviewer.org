/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class TimeStepSlider A slider for controlling the timestep. For convenience the slider uses indices 
 *                       rather than the actual values, the number of seconds. This is due to the fact 
 *                       that the Scriptaculous Slider is only able to display values linearly but the
 *                       timesteps are spaced at pseudo-logarithmic intervals.
 */
/*global Class, Control, document, $, $R */
 
var TimeStepSlider = Class.create();
 
TimeStepSlider.prototype = {
    /**
     * @constructor
     */
    initialize : function (sliderHandleId, sliderTrackId, initialIndex) {
        this.slider = new Control.Slider(sliderHandleId, sliderTrackId,
            {
                axis:        'horizontal',
                range:       $R(1, 10),
                values:      [1,2,3,4,5,6,7,8,9,10],
                sliderValue: initialIndex,
                onChange:    this.onChange.bindAsEventListener(this),
                onSlide:     this.onSlide.bindAsEventListener(this),
            });
        
        //Private member variables
        this.className = "TimeStepSlider";
        this.lastIndex = initialIndex;
        this.timestep =  this.indexToTimeStep(initialIndex);
    },
    
    /**
     * @method indexToTimeStep Maps from the slider index value, a small whole number, to
     *                         a pair representing the number of seconds and a label associated
     *                         with the desired timestep. NOTE: Indices start with one and not zero
     * 						   to avoid an issue relating to scriptaculous's slider implementation.
     * @param   {Int}  The slider index for the current timestep.
     * @returns {Hash} A hash containing he number of seconds and a label for the desired timestep.
     */
    indexToTimeStep: function (index) {
        var timestep = null;
        switch (index) {
            case 1:
                timestep = {numSecs: 1,      txt: "1&nbsp;Sec"};
                break;
            case 2:
                timestep = {numSecs: 60,     txt: "1&nbsp;Min"};
                break;
            case 3:
                timestep = {numSecs: 300,    txt: "5&nbsp;Mins"};
                break;
            case 4:
                timestep = {numSecs: 900,    txt: "15&nbsp;Mins"};
                break;
            case 5:
                timestep = {numSecs: 3600,   txt: "1&nbsp;Hour"};
                break;
            case 6:
                timestep = {numSecs: 21600,  txt: "6&nbsp;Hours"};
                break;
            case 7:
                timestep = {numSecs: 43200,  txt: "12&nbsp;Hours"};
                break;
            case 8:
                timestep = {numSecs: 86400,  txt: "1&nbsp;Day"};
                break;
            case 9:
                timestep = {numSecs: 604800, txt: "1&nbsp;Week"};
                break;
            case 10:
            	timestep = {numSecs: 2419200, txt: "28 Days"};
            	break; 
        }
        return timestep;
    },
    
   /**
    * @function onChange Called when the slider value is changed.
    * @param {Integer} The new slider index value.
    */
    onChange : function (index) {
        if (index != null) {
            this.timestep = this.indexToTimeStep(index);
            document.timeIncrementChange.fire(this.timestep.numSecs);
        }
    },
    
    /**
     * @method onSlide
     * @param {Integer} The current slider index.
     */
     onSlide: function (index) {
        if ( (index != null) && (index != this.lastIndex)) {
            this.lastIndex = index;
            $('timestepValueDisplay').update(this.indexToTimeStep(index).txt);
        }
     }  
};

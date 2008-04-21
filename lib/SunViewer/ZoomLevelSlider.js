/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class ZoomLevelSlider A slider for controlling the zoom level.
 * @see  The <a href="http://helioviewer.org/mediawiki-1.11.1/index.php?title=Zoom_Levels_and_Observations">HelioViewer Wiki</a>
 *       for more information on zoom levels.
*/
/*global Class, Control, document, $, $R */
 
var ZoomLevelSlider = Class.create();
 
ZoomLevelSlider.prototype = {
    /**
     * @constructor
     */
    initialize : function (sliderHandleId, sliderTrackId, plusButtonId, minusButtonId, minValue, maxValue, initialValue) {
        this.slider = new Control.Slider(sliderHandleId, sliderTrackId,
            {
                axis:       'vertical',
                range:       $R(minValue, maxValue),
                values:      $R(minValue, maxValue),
                sliderValue: initialValue,
                onChange:    this.onChange
            });
        
        //Private member variables
        this.className = "ZoomLevelSlider";
        this.value = initialValue;
        this.maxValue = maxValue;
        this.minValue = minValue;
        this.plusButton = $(plusButtonId);
        this.minusButton = $(minusButtonId);
          
        //Keep track of the current value
        document.zoomLevelChange.subscribe(this.onZoomLevelChange, this, true);
          
        //Set-up event handlers for plus and minus buttons
        this.plusButton.observe('click', this.onButtonClick.bindAsEventListener(this, -1));
        this.minusButton.observe('click', this.onButtonClick.bindAsEventListener(this, +1));
    },
    
   /**
    * @function onChange Called when the slider value is changed.
    * @param {Integer} The new value.
    */
    onChange : function (value) {
        document.zoomLevelChange.fire(value);
        document.updateTiles.fire(); //is below stanza still needed?
    },
     
   /**
    * @function onZoomLevelChange Used to keep track of the current value of the zoom-level slider.
    * @param {String} type The type of event fired.
    * @param {Array}  args The list of arguments passed in. This event listener expects there to 
    *                 be one argument: the new zoom level.                 
    */
    onZoomLevelChange : function (type, args) {
        var newZoomLevel = args[0];
        this.value = newZoomLevel;
    },
     
    /**
     * @function onButtonClick Increases or decreases zoom level in response to pressing the plus/minus buttons.
     * @param {Event} event The actual event fired.
     * @param {Integer}  change The amount to adjust the zoom level by (+1 or -1).              
     */
    onButtonClick : function (event, change) {
        var newZoomLevel = this.value + change;
        if ((newZoomLevel >= this.minValue) && (newZoomLevel <= this.maxValue)) {
            this.slider.setValue(this.value + change);
        }
    }
};

/**
 * NOTE: Mouse-over highlighting for slider handle
 * 
 * The below code, if placed in index.html or another event-handling class, will cause the slider handle
 * to change colors when it is being dragged. To prevent the handle from remaining highlighted when the mouse
 * is released somewhere else on the document, the "mouseup" handler is attached to document instead of the handle
 * itself.
 * $('sunViewer1.viewport1.sliderHandle').observe('mousedown', function() {this.setStyle({backgroundColor:'#708090'})});
 * document.observe('mouseup', function() {$('sunViewer1.viewport1.sliderHandle').setStyle({backgroundColor:'#D3D3D3'})});
 */             

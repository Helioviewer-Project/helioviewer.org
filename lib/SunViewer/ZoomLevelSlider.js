/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */

/**
 * @class ZoomLevelSlider A slider for controlling the zoom level.
 */
 
 var ZoomLevelSlider = Class.create();
 
 ZoomLevelSlider.prototype = {
     /**
      * @constructor
      */
     initialize : function (sliderHandleId, sliderTrackId, onZoomLevelChange) {
         this.slider = new Control.Slider (sliderHandleId, sliderTrackId,
               {
                   axis:'vertical',
                   range: $R(0,10),
                   values: $R(0,10),
                   sliderValue:10,
                   onSlide: this.onSlide
            });
         
          //Keep track of the last value seen for event handler to compare with
          this.lastValue = this.slider.value;
          this.className = ZoomLevelSlider;
    },
    
    /**
     * @function onSlide Event handler that gets fired when slider is dragged to a new value
     * @param {Integer} The new value.
     */
    onSlide: function (value) {
        if (value != this.lastValue) {
            this.lastValue = value;
            Debug.output("slider: " + value);
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
//
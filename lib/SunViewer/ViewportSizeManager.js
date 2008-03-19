/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 */
 
/**
 * @class The ViewportSizeManager class enables toggling between different viewport sizes.
 *        The resolutions here correspond with the outside of the viewport border, and not
 *        the actual viewport (this can be changed later if desired). Since the border images
 *        are currently 20px widge, this means the actual viewing size has a width and height
 *        that is 40px less than the specified resolution.
 * 
 *        Note: This functionality could also be incorporated into the viewport class, however,
 *              for the time being I have chosen to keep it separate since it is a sort of UI
 *              component. Once the ViewPort class has reached a more stable state, this could
 *              be added into it.
 */
 var ViewportSizeManager = Class.create();
 
 ViewportSizeManager.prototype = {
     /**
      * @constructor
      * @param {Array} availableSizes A 2d array containing sets of paramaters relating to
      *                               a given viewport size.
      */
     initialize: function (availableSizes) {
         this.sizes = availableSizes;
         
         //Assign event-handlers (TODO: separate into another function for easier readability..)
         $A(this.sizes).each(
            (function(size) {$(size[0]).observe('click', this.changeSize.curry(size));}).bindAsEventListener(this));
         
         //TODO: make dynamic
         document.viewportSizeChange.subscribe(function(type, args){
             if (args[0] != "viewport-size-small") {$("viewport-size-small").setStyle({'color': '#858585'});}         
         });
         document.viewportSizeChange.subscribe(function(type, args){
             if (args[0] != "viewport-size-med") {$("viewport-size-med").setStyle({'color': '#858585'});}         
         });
         document.viewportSizeChange.subscribe(function(type, args){
             if (args[0] != "viewport-size-large") {$("viewport-size-large").setStyle({'color': '#858585'});}         
         });
      },
     
     /**
      * @function changeSize handles the adjustment of various screen element properties during a resize.
      * @param params a hash containing the various parameters needed to make the desired adjustments.
      *               This includes: the domId for the link to start the change (used in assigning event-handler above),
      *               the new width and heigt of the outter viewport, and the border image to use.
      */
     changeSize: function (params) {
         var domId =     params[0];
         var width =     params[1];
         var height =    params[2];
         var borderImg = params[3];
         
         //Let everyone know
         document.viewportSizeChange.fire(domId);
         
         //Adjust color of link
         $(domId).setStyle({'color':'#E5E5E5'});
                  
         //Note: it may be easier to create a classes for the width and height
         //      and attach them to all relevent items. This would reduce the
         //      number of items that needs to be modified here.
         $("viewport-outer").setStyle({
            background: 'url(' + borderImg + ')',
            width: width + "px",
            height: height + "px"
         });
         
         //Inner Viewport
         $("viewport-inner").setStyle({
             width:  width  - 40 + "px",
             height: height - 40 + "px"
         });
         
         //Everything else
         $$("#header", "#footer").each(function(s) {s.setStyle({width: width - 40 + "px"});});
     }
 };
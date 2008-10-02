/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class LayerManager A simple layer manager.
 */
var LayerManager = Class.create(UIElement, {
    /**
     * @constructor
     * @param {viewport} Viewport to associate layer manager with
     */
    initialize: function (viewport) {
        this.viewport = viewport;
        this.layers = $A([]);
    },
    
    /**
     * @method onLayerAdded
     */
    onLayerAdded: function (type, args) {

    },
     
    /**
     * @method onLayerRemoved
     */
    onLayerRemoved: function (type, args) {
          
    },
   
});

  

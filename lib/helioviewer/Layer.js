/*global Class, $, UIElement, document, Element, Counter,  */
var Layer = Class.create(UIElement, {
    maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
    minZoomLevel: 10,
    visible: true,

    initialize: function (viewport) {
        this.viewport = viewport;
        this.domNode = $(viewport.movingContainer.appendChild(new Element('div')));
        this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.id = 'layer' + Math.floor(Math.random() * 100000 + 1);
    },
    
    setZIndex: function (v) {
        this.domNode.setStyle({ zIndex: v });
    },
    
    setVisible: function (visible) {
	    this.visible = visible;
	    this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
	    return this.visible;
    },
  
    toggleVisible: function () {
	    return this.setVisible(!this.visible);
    }
});
/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class LayerManagerUI A UI Component for managing layers.
 * 		  Dom-nodes for each layer's configuration are stored in LayerManagerUI.layerSettings,
 * 		  and particular sub-nodes can be found using prototype's Element.select function, or by
 *        direct query via id name.
 * 
 * 		  Note: Because of the incorporation of unique id's for each field that
 *        may change for a layer (e.g. "instrument-select-1"), it may be uneccessary to store references
 *        to the dom-nodes at all, and layerSettings could then be removed altogether.
 * 
 * @see   LayerManager
 */
/*global Class, UIElement jQuery, LayerManagerUIMenuEntry, document, $, $A, Option, Debug, Event, Element, Builder,  */
var LayerManagerUI = Class.create(UIElement, {
    /**
     * @constructor
     * @param {viewport} Viewport to associate layer manager with
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
     */
    initialize: function (viewport, htmlContainer) {
        this.controller = viewport.controller;
        this.viewport = viewport;
        this.className = "layerManagerUI";
        this.container = $(htmlContainer);
        this.menuEntries = $A([]);
        
        // Call methods to construct initial layer manager menu and setup event-handlers
        this.createMenu();
        this.initEvents();
        
        this.viewport.layers.collect(this.addMenuEntry.bind(this));
    },
    
    /**
     * @method createMenu
     * This method handles setting up an empty layer manager menu, including an "add new layer" button. 
     * Individual layer entries are added via calls to "addMenuEntry."
     */
    createMenu: function () {
        // Create menu header and "add layer" button
        this.header =      Builder.node('span', {style: 'float: left; color: black; font-weight: bold; '}, 'Layers');
        this.addLayerBtn = Builder.node('a', {href: '#', style: 'margin-right:15px;', className: 'gray'}, '[Add Layer]');

		// Add the buttons to a div which lies on top of the accordion container (innerContainer)
        var div = Builder.node('div', {style: 'text-align: right'}, [this.header, this.addLayerBtn]);
        this.container.appendChild(div);
        
        // Accordion container
        this.innerContainer = Builder.node('div', {id: 'layerManager-Container'});
        this.container.appendChild(this.innerContainer);
        
        // Accordion list (the accordion itself is initialized with a call to "render")
        this.accordionList = Builder.node('ul', {id: 'layerManagerList'});
        this.innerContainer.appendChild(this.accordionList);
        
        // Enable dragging of menu items
    	//jQuery('#layerManagerList').sortable({
    	//	axis: "y",
    	//	containment: "parent"
    	//});
    },
    
    /**
     * @method initEvents
     * This method handles setting up event-handlers for functionality related to the menu as a whole,
     * and not for particular layers. This includes adding and removing layers, and handling changes
     * to the layer properties.
     */
    initEvents: function () {
              
        // Buttons
        Event.observe(this.addLayerBtn, 'click', this.onAddLayerClick.bind(this));
    },
    
    /**
     * @method render Loads/reloads accordion using element inside innerContainer.
     */
    render: function () {
    	if (this.accordionDom) {
    		this.accordionDom.accordion("destroy");
    	}
    	
    	//this.accordionDom = jQuery('#' + this.innerContainer.identify()).accordion({
    	this.accordionDom = jQuery('#layerManager-Container').accordion({
    		
    		active: false,
    		alwaysOpen: false,
    		header:   'div.layer-Head'
    		//animated: 'bounceslide',
    	});
    	
    	//Refresh sortables
    	//jQuery('#layerManagerList').sortable("refresh");
    },
    
   /**
     * @method addMenuEntry
     * @param {layer} layer
     * This method creates a single entry in the layer manager menu corresponding to the layer associated
     * with "layer." The options to display vary based on the type of layer. Once constructed, the DOM
     * element (a single accordion element) is stored in an array for future referencing, using the same id as that
     * used by the DataNavigator and LayerManager classes.
     */
     /*
      * NOTE: Currently, when layers (xxlayers) are initialized, they are only partially setup. layer.sunImage,
      * which contains important information related to the layer is not initialized until later when an 'onImageChange' event
      * is fired, and triggers setSunImage() to execute.
      *    UPDATE 04-24-2008: Fixed... Added a second event, "layerPrepared," to signal that complete layer is ready..
      * 
      * Once the new layer manager is functional, it would be beneficial to go back and change this so that all relevent information
      * for a layer is set at the onset, and thus other parts of the system can execute without having to wait first for a 'sunimage'
      * to be set. (An ideal solution will involve removing the sunImage concept, and a redsign of the layer classes) 
      */
    addMenuEntry: function (layer) {
      this.menuEntries.push(new LayerManagerUIMenuEntry(this, layer));
    },
    

   /**
    * @method onAddLayerClick
    */
    onAddLayerClick: function () {
        document.addLayer.fire();
    },
   
    /**
     * @method onLayerAdded
     */
    onLayerAdded: function (type, args) {
        var layer = args[0];
        this.addMenuEntry(layer);
        this.render();
    },
     
    /**
     * @method onLayerRemoved
     */
    onLayerRemoved: function (type, args) {
          
    },
    
    updateTimeStamp: function () {
      this.menuEntries.each(function(menuEntry) { menuEntry.updateTimeStamp(); });
    }
});

  

/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class LayerManager A simple layer manager.
 * 
 * @see   LayerManager
 */
/*global Class, UIElement jQuery, LayerManagerMenuEntry, document, $, $A, Option, Debug, Event, Element, Builder,  */
var LayerManager = Class.create(UIElement, {
    /**
     * @constructor
     * @param {viewport} Viewport to associate layer manager with
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
     */
    initialize: function (viewport, htmlContainer) {
        this.className =  "layerManager";
        this.controller =  viewport.controller;
        this.viewport =    viewport;
        this.container =   $(htmlContainer);
        this.menuEntries = $A([]);
        
        // Call methods to construct initial layer manager menu and setup event-handlers
        this.createMenu();
        this.initEvents();
        
        // Add any existing layers to menu
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
        this.addLayerBtn = Builder.node('a', {href: '#', style: 'margin-right:14px;', className: 'gray'}, '[Add Layer]');

		// Add the buttons to a div which lies on top of the accordion container (innerContainer)
        var div = Builder.node('div', {style: 'text-align: right'}, [this.header, this.addLayerBtn]);
        this.container.appendChild(div);
        
        // Accordion list (the accordion itself is initialized with a call to "render")
        this.accordionList = Builder.node('ul', {id: 'layerManagerList'});
        
        // Accordion container
        var innerContainer = Builder.node('div', {id: 'layerManager-Container'});
        innerContainer.appendChild(this.accordionList);  
        
        this.container.appendChild(innerContainer);
        
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
    	//if (this.accordionDom) {
    	//	this.accordionDom.accordion("destroy");
    	//}
    	
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
     * @param {layer} layer (OPTIONAL)
     * This method creates a single entry in the layer manager menu corresponding to the layer associated
     * with "layer." The options to display vary based on the type of layer. Once constructed, the DOM
     * element (a single accordion element) is stored in an array for future referencing, using the same id as that
     * used by the DataNavigator and LayerManager classes.
     */
    addMenuEntry: function (layer) {
        this.menuEntries.push(new LayerManagerMenuEntry(this, layer));
    },
    
    //RENAME ME
    remove: function (layerEntry, layer) {
    	this.menuEntries = this.menuEntries.without(layerEntry);
    	this.viewport.removeLayer(layer);
    },

   /**
    * @method onAddLayerClick Adds an empty layer to the layer manager.
    * 		  When "Add Layer" is clicked, initially only a new menu entry called "New Layer" is created,
    *         with an option to chose an instrument. Once the user chose's an instrument, a new TileLayer
    *         associated with the menu entry is created, and the relevent form fields are displayed.
    */
    onAddLayerClick: function () {
        this.addMenuEntry({type: 'NewLayer'});
        this.render();
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
        this.menuEntries.each(function (menuEntry) {
            menuEntry.updateTimeStamp();
        });
    }
});

  

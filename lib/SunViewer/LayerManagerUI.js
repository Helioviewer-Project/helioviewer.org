/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class LayerManagerUI A UI Component for managing layers.
 * @see   LayerManager
/*global Class, document, $ */
var LayerManagerUI = Class.create();

LayerManagerUI.prototype = {
    /**
     * @constructor
     */
    initialize: function (htmlContainer){
        this.className = "layerManagerUI";
        this.container = $(htmlContainer);
        this.layerSettings = new Hash();
        
        // Call methods to construct initial layer manager menu and setup event-handlers
        this.createMenu();
        this.initEvents();
    },
    
    /**
     * @method createMenu
     */
    createMenu: function (){
        //toggleButton
        this.toggleButton = Builder.node('a', {'href': '#', className: 'gray'}, 'Layers');
        this.container.appendChild(this.toggleButton);
        
        //Hidable menu
        this.menuContainer = Builder.node ('div', {style: 'display: none'});
        this.container.appendChild(this.menuContainer);
        
        this.menu  = Builder.node ('div', {id: 'layerManager-Menu', style: 'width:100%; height:95%; background-color:#E5E5E5; border: 1px solid black;'});
        this.menuContainer.appendChild(this.menu);
        
        //Menu table 
        this.menuTable = Builder.node ('table', {id: 'layerManager-Menu-Table', width: '100%',cellpadding: '2',cellspacing: '0',border: '0'});
        
        //Menu table headers
        var thead = Builder.node('thead');
        var tr    = Builder.node('tr', {id: 'layerManagerHeaders'});
        tr.appendChild(Builder.node('th', 'Instrument'));
        tr.appendChild(Builder.node('th', 'Wavelength'));
        tr.appendChild(Builder.node('th', 'Opacity'));
        tr.appendChild(Builder.node('th', 'Enabled'));
        tr.appendChild(Builder.node('th', 'Remove'));
        tr.appendChild(Builder.node('th', 'Move'));
        
        thead.appendChild(tr);
        this.menuTable.appendChild(thead);
        
        //Menu table body
        this.menuTableTbody = Builder.node('tbody');
        this.menuTable.appendChild(this.menuTableTbody);
        
        //Add completed table to the menu container
        this.menu.appendChild(this.menuTable);
    },
    
    /**
     * @method initEvents
     */
    initEvents: function (){
        document.layerAdded.subscribe(this.onLayerAdded, this, true);
        document.layerRemoved.subscribe(this.onLayerRemoved, this, true);
        Event.observe(this.toggleButton, 'click', this.onToggleButtonClick.bindAsEventListener(this));
    },
    
    /**
     * @method addMenuEntry
     */
     /*
      * NOTE: Currently, when layers (xxLayerProviders) are initialized, they are only partially setup. layerProvider.sunImage,
      * which contains important information related to the layer is not initialized until later when an 'onImageChange' event
      * is fired, and triggers setSunImage() to execute.
      * 
      * Once the new layer manager is functional, it would be beneficial to go back and change this so that all relevent information
      * for a layer is set at the onset, and thus other parts of the system can execute withoutt having to wait first for a 'sunimage'
      * to be set. (An ideal solution will involve removing the sunImage concept, and a redsign of the layer classes) 
      */
    addMenuEntry: function (layerProvider) {
        var tr = Builder.node('tr');
        
        // Items to display depends on the type of layer added.
        switch (layerProvider.type) {
            case 'TileLayerProvider':
                tr.appendChild(this.createInstrumentControl(layerProvider));
                //if (this.sunImage.instrument === "EIT") {
                if (tr.down().down().value == "EIT") {
                    tr.appendChild(this.createWavelengthControl(layerProvider.id));
                }
                break;
            case 'MarkerLayerProvider':
                tr.appendChild(Builder.node('td', {'colspan': 3}, 'Events'));
                break;
            default:
                tr.appendChild(Builder.node('td', 'Unknown Layer'));
                break;
        }
        
        // Append row to menu
        this.menuTableTbody.appendChild(tr);
        
        // Add to hash
        this.layerSettings.set(layerProvider.id, tr);
    },
    
    /**
     * @method createInstrumentControl
     */
    createInstrumentControl: function (layerProvider) {
        inst = new Element('select', {className: 'instrumentSelect'});
        inst.length = 0;

        var instruments = $A(["EIT", "LAS"]);
                
        // Populate list of available wavelengths
        for (var i = 0; i < instruments.length; i++) {
            var opt = new Option(instruments[i]);
            opt.value = instruments[i];
            inst.options[inst.options.length] = opt;
        }
        
        // Set-up event handler to deal with an wavelength change
        Event.observe(inst, 'change', this.onInstrumentChange.curry(this, layerProvider));
        
        return new Element('td').update(inst);
    },
    
    /**
     * @method onInstrumentChange
     */
    onInstrumentChange: function (selfRef, layerProvider) {
        //tr dom-node for the current row
        var tr = selfRef.layerSettings.get(layerProvider.id);
        
        //Non-pretty solution... TODO: Create a function to handle parameter changes..
        if (this.value === "LAS") {
            tr.childElements()[1].hide();
        }
        else {
            tr.childElements()[1].show();
        }
        
        var id = layerProvider.id;
        document.instrumentChange.fire(id, this.value);
    },
    
    /**
     * @method createWavelengthControl
     */
    createWavelengthControl: function (layerProviderId) {
        wl = new Element('select', {className: 'wavelengthSelect'});
        wl.length = 0;

        var wavelengths = $A([171, 195, 284]);
                
        // Populate list of available wavelengths
        for (var i = 0; i < wavelengths.length; i++) {
            var opt = new Option(wavelengths[i]);
            opt.value = wavelengths[i];
            wl.options[wl.options.length] = opt;
        }
        
        // Set-up event handler to deal with an wavelength change
        Event.observe(wl, 'change', this.onWavelengthChange.curry(layerProviderId));
        
        return new Element('td').update(wl);
    },
    
    /**
     * Event handler: wavelength change
     */ 
    onWavelengthChange: function (layerProviderId) {
        document.wavelengthChange.fire(layerProviderId, this.value);
    },
   
    /**
     * @method onLayerAdded
     */
    onLayerAdded: function (type, args) {
        var layerProvider = args[0];
        this.addMenuEntry(layerProvider);          
    },
     
    /**
     * @method onLayerRemoved
     */
    onLayerRemoved: function (type, args) {
          
    },
    
    /**
     * @method onToggleButtonClick
     */
    onToggleButtonClick: function () {
        Effect.toggle(this.menuContainer, 'slide', {duration:0.4});
    }
};

/**
 * Functions to include:
 *  - 
 *  - AdLayer
 *  - RemoveLayer
 * 
 */

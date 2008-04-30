/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
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
        //this.layerSettings = new Hash();
        this.layerSettings = $A([]);
        
        // Call methods to construct initial layer manager menu and setup event-handlers
        this.createMenu();
        this.initEvents();
        
        /**
         * @NOTE: Another option to simply storing the layer's associated <tr> would be to store
         * an object which contains each of the relevent sub-DOM nodes in an easily accesible manor, e.g:
         * 
         * layerSettings.get(i).enabled
         * layerSettings.get(i).opacity
         * 
         * At the same time, however, it's important to avoid ambiguity between the LMUI and the LM
         * for these items.. maybe use ".enabledDOM" instead. 
         */
    },
    
    /**
     * @method createMenu
     * This method handles setting up an empty layer manager menu, including column headers and an
     * empty table body. Later on as layers are added via "addMenuEntry," the rows will be placed
     * in the table body created below.
     */
    createMenu: function (){
        //LayerManager menu toggle button & "Add Layers" button
        this.toggleBtn =   Builder.node('a', {href: '#', style: 'float: left; background-color: #E5E5E5; color: black; text-decoration:none; font-weight: bold; '}, 'Layers');
        this.addLayerBtn = Builder.node('a', {href: '#', style: 'margin-right:15px;', className: 'gray'}, '[ + ] Add Layer');

        var div = Builder.node('div', {style: 'text-align: right'}, [this.toggleBtn, this.addLayerBtn]);
        this.container.insert(div);
        
        //Hidable menu
        //this.menuContainer = Builder.node ('div', {style: 'display: none'});
        this.menuContainer = Builder.node ('div', {id: 'layerManager-Container'});
        this.container.appendChild(this.menuContainer);
        
        this.menu  = Builder.node ('div', {id: 'layerManager-Menu'});
        this.menuContainer.appendChild(this.menu);
        
        //Menu table 
        this.menuTable = Builder.node ('table', {id: 'layerManager-Menu-Table', style:'margin:7px;', width: '100%', cellpadding: '5%', cellspacing: '0', border: '0'});
        
        //Menu table headers
        var thead = Builder.node('thead');
        var tr    = Builder.node('tr', {id: 'layerManagerHeaders', style: 'height:25px;'});
        tr.appendChild(Builder.node('th', 'Instrument'));
        tr.appendChild(Builder.node('th', 'Wavelength'));
        tr.appendChild(Builder.node('th', 'Opacity'));
        tr.appendChild(Builder.node('th', 'Remove'));
        tr.appendChild(Builder.node('th', 'Move'));
        tr.appendChild(Builder.node('th', 'Enabled'));
        
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
     * This method handles setting up event-handlers for functionality related to the menu as a whole,
     * and not for particular layers. This includes adding and removing layers, and toggling the visibility
     * of the menu itself.
     */
    initEvents: function (){
        document.layerPrepared.subscribe(this.onLayerAdded, this, true);
        document.layerRemoved.subscribe(this.onLayerRemoved, this, true);
                 
        // Buttons
        Event.observe(this.toggleBtn, 'click', this.onToggleButtonClick.bindAsEventListener(this));
        Event.observe(this.addLayerBtn, 'click', this.onAddLayerClick.bind(this));
    },
    
    /**
     * @method addMenuEntry
     * @param {LayerProvider} layerProvider
     * This method creates a single entry in the layer manager menu corresponding to the layer associated
     * with "layerProvider." The options to display vary based on the type of layer. Once constructed, the DOM
     * element (a single table row) is stored in an array for future referencing, using the same id as that
     * used by the DataNavigator. 
     */
     /*
      * NOTE: Currently, when layers (xxLayerProviders) are initialized, they are only partially setup. layerProvider.sunImage,
      * which contains important information related to the layer is not initialized until later when an 'onImageChange' event
      * is fired, and triggers setSunImage() to execute.
      *    UPDATE 04-24-2008: Fixed... Added a second event, "layerPrepared," to signal that complete layerProvider is ready..
      * 
      * Once the new layer manager is functional, it would be beneficial to go back and change this so that all relevent information
      * for a layer is set at the onset, and thus other parts of the system can execute without having to wait first for a 'sunimage'
      * to be set. (An ideal solution will involve removing the sunImage concept, and a redsign of the layer classes) 
      */
    addMenuEntry: function (layerProvider) {
        var tr = Builder.node('tr', {style: 'height:22px;'});
        var id = this.layerSettings.size();
        
        // Add to array
        this.layerSettings.push(tr);
        
        // Items to display depends on the type of layer added.
        switch (layerProvider.type) {
            case 'TileLayerProvider':
                tr.appendChild(this.createInstrumentControl(layerProvider));
                if (layerProvider.sunImage.instrument === "EIT") {
                    tr.appendChild(this.createWavelengthControl(id));
                }
                tr.appendChild(this.createOpacityControl(layerProvider));
                tr.appendChild(this.createRemoveControl(id));
                
                //Add move controls
                tr.appendChild(this.createMoveControls(false, false, id));
                this.updateMoveControls();
                
                // Append row to menu
                this.menuTableTbody.appendChild(tr);
                
                break;
            case 'MarkerLayerProvider':
                tr.appendChild(Builder.node('td', {'colspan': 4}, 'Events'));
                tr.appendChild(Builder.node('td'));
                
                this.menuTableTbody.insert({top: tr});
                
                break;
            default:
                tr.appendChild(Builder.node('td', 'Unknown Layer'));
                break;
        }
        tr.appendChild(this.createEnabledBox(id));
        Debug.output("layerSettings.length: " + this.layerSettings.length + ", layerProvider.id: " + layerProvider.id);
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
        Event.observe(inst, 'change', this.onInstrumentChange.curry(this, layerProvider.id));
        
        return new Element('td').update(inst);
    },
    
    /**
     * @method onInstrumentChange
     */
    onInstrumentChange: function (selfRef, id) {
        //tr dom-node for the current row
        var tr = selfRef.layerSettings[id];
        
        Debug.output("instrument change, id: " + id);
        
        //Non-pretty solution... TODO: Create a function to handle parameter changes..
        if (this.value === "LAS") {
            tr.select('.wavelengthSelect').first().hide();
        }
        else {
            tr.select('.wavelengthSelect').first().show();
        }

        document.instrumentChange.fire(id, this.value);
    },
    
    /**
     * @method createWavelengthControl
     */
    createWavelengthControl: function (id) {
        var wl = new Element('select', {className: 'wavelengthSelect'});
        wl.length = 0;

        var wavelengths = $A([171, 195, 284]);
                
        // Populate list of available wavelengths
        for (var i = 0; i < wavelengths.length; i++) {
            var opt = new Option(wavelengths[i]);
            opt.value = wavelengths[i];
            wl.options[wl.options.length] = opt;
        }
        
        // Set-up event handler to deal with an wavelength change
        Event.observe(wl, 'change', this.onWavelengthChange.curry(id));
        
        return new Element('td').update(wl);
    },
    
    /**
     * Event handler: wavelength change
     */ 
    onWavelengthChange: function (id) {
        document.wavelengthChange.fire(id, this.value);
    },
    
    /**
     * @method createOpacityControl Creates the opacity control cell.
     * @param  {LayerProvider}      The layer provider associated with the opacity control.
     * @return {HTML Element}       The opacity control cell.
     */
    createOpacityControl: function (layerProvider) {
        var opacity = Math.round(layerProvider.opacity * 100);
        
        var opacityTd =    new Element('td');
        var opacityInput = new Element('input', {size: '3', value: opacity});
        var opacityInputChange = layerProvider.setOpacity.bind(layerProvider);
        Event.observe(opacityInput, 'change', function () {
            opacityInputChange(parseInt(this.value, 10) / 100);
        });
        opacityTd.appendChild(opacityInput);
        opacityTd.insert('%');
        return opacityTd;
    },
    
    /**
     * @method createEnabledBox Creates the enabled/disabled cell.
     * @return {HTML Element}   The enabled/disabled cell.
     * @param  {Integer}        The layer's id
     */
    createEnabledBox: function (id) {
        var enabledTd = new Element('td', {style: "padding-left:15px;"});
        var enabled =   new Element('input', {type: 'checkbox', checked: 'true', name: 'enabled'});
        enabledTd.appendChild(enabled);
        
        Event.observe(enabled, 'click', this.onEnabledBoxClick.bind(this, id));
        return enabledTd;
    },
    
    /**
     * @method onEnabledBoxClick
     * @param {Int} id
     */
    onEnabledBoxClick: function (id) {
        //var tr = this.layerSettings.get(id);
        var tr = this.layerSettings[id];

        //Check to see if box is checked
        var isChecked = tr.select('input[name="enabled"]')[0].checked;
         
        //Enable or disable other form items
        tr.select('input', 'select').each(function(e) {
            isChecked ? e.enable() : e.disable();
        });
        
        //Re-enable "enabled" checkbox itself
        tr.select('input[name="enabled"]')[0].enable();

        //Fire global event
        document.toggleLayerEnabled.fire(id, isChecked);
    },
    
    /**
     * @method createRemoveControl  Creates the remove layer control cell.
     * @return {HTML Element}       The remove layer control cell.
     */
    createRemoveControl: function (id) {
        var removeButton = Builder.node('a', {className: 'control1', href: '#'}, '[ - ]');
        var removeTd = Builder.node ('td', {style: 'padding-left:15px;'}, [removeButton]);
                
        Event.observe(removeButton, 'click', this.onRemoveLayerClick.bind(this, id));
        
        return removeTd;
    },
    
    /**
     * @method onRemoveLayerClick
     * @param {Int} id
     */
    onRemoveLayerClick: function (id) {
        //Remove layer menu items and settings
        Debug.output("Removing layer with id: " + id);
        Element.remove(this.layerSettings[id]);
        this.layerSettings[id] = null;
        this.layerSettings = this.layerSettings.compact();
        
        //Update move controls for each layer
        this.updateMoveControls();
        
        //Fire global event
        document.removeLayer.fire(id);
    },
    
    /**
     * @method createMoveControls   Creates the "move down/up" controls. Up means up in the layer ordering, which means down in the list.
     * @param {Boolean} down        Whether to create the "move down" control.
     * @param {Boolean} up          Whether to create the "move up" control.
     * @param {Int} id              The layer's id.
     * @return {DOM}                The newly created dom-element containing the move controls.
     */
    createMoveControls: function (down, up, id) {
        var moveTd = new Element('td', {className: 'moveControls'});
        if (down) {
            var downControl = new Element('a', {'class': 'control1', 'href': '#'}).update('[&uarr;]');
            Event.observe(downControl, 'click', this.moveClick.bind(this, -1, id));
            moveTd.appendChild(downControl);
        }
        if (up && down) {
            moveTd.insert('\u00a0');
        }
        if (up) {
            var upControl = new Element('a', {'class': 'control1', 'href': '#'}).update('[&darr;]');
            Event.observe(upControl, 'click', this.moveClick.bind(this, +1, id));
            moveTd.appendChild(upControl);
        }
        return moveTd;
    },
    
    /**
     * @method updateMoveControls Updates the buttons for moving layers up and down on the stack
     * after a layer is added or remove. Assumes that id 0 is a marker layer which is ignored.
     */
    updateMoveControls: function () {
        // Update the move controls based on the number of layers currently on the stack.
        if (this.layerSettings.length >= 3) {
            
            //first layer on the stack (can only be moved DOWN)
            var down = this.createMoveControls(false, true, 1);
            this.layerSettings[1].select('.moveControls').first().replace(down);
            Event.observe(down, 'click', this.moveClick.bind(this, -1, 1));
            
            //If there are more than 3 layers (including events layer) then add controls for middle layers (can move in BOTH directions)
            if (this.layerSettings.length > 3) {
                for (var i = 2; i < this.layerSettings.length -1; i++) {
                    this.layerSettings[i].select('.moveControls').first().replace(this.createMoveControls(true, true, i));
                }
            }
         
            //last layer on the stack (can only be moved UP)
            var lastIndex = this.layerSettings.length -1;
            var up   = this.createMoveControls(true, false, lastIndex);
            this.layerSettings[lastIndex].select('.moveControls').first().replace(up);
            Event.observe(up, 'click', this.moveClick.bind(this, +1, lastIndex));
        }
     
    },

    /**
     * @method moveClick
     * @param {Int} dir Direction of movement: "+1" to move the layer down and "-1" to move the layer up.
     * @param {Int} id  Id of the layer where move was initiated.
     */
    moveClick: function (dir, id) {
        //swap dom-nodes of affected layers
        var node1 = this.layerSettings[id];
        var node2 = (dir == 1) ? this.layerSettings[id + 1] : this.layerSettings[id -1];
        this.swap(node1, node2);
        
        Debug.output("swapping layers...");
        
        document.moveLayer.fire(dir, id);
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
        this.addLayerBtn.toggle();
        Effect.toggle(this.menuContainer, 'slide', {duration:0.4});
    },
    /**
     * @method swap Swaps two DOM nodes.
     */
    swap: function (domNode1, domNode2) {
        var tmp  = domNode1.cloneNode(true);
        domNode1 = domNode2;
        domNode2 = tmp;
    }
};

/**
 * Functions to include:
 *  - 
 *  - AdLayer
 *  - RemoveLayer
 * 
 */

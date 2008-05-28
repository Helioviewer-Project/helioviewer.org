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
/*global Class, jQuery, document, $, $A, Option, Debug, Event, Element, Builder,  */
var LayerManagerUI = Class.create(UIElement, {
    /**
     * @constructor
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
     */
    initialize: function (viewport, htmlContainer) {
        this.controller = viewport.controller;
        this.viewport = viewport;
        this.className = "layerManagerUI";
        this.container = $(htmlContainer);
        //this.layerSettings = $A([]);
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
    	jQuery('#layerManagerList').sortable({
    		axis: "y",
    		containment: "parent"
    	});
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
    		//event:  'ONLY_ACTIVATE_PROGRAMATICALLY'
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

  
var LayerManagerUIMenuEntry = Class.create(UIElement, {
    initialize: function(layermanager, layer) {
      this.layermanager = layermanager;
      this.layer = layer;

      var li = Builder.node('li', {className: 'accordionItem'});
      var id = layer.id;

      // Add to array
      //this.layerSettings.push(li);

      // Items to display depends on the type of layer added.
      switch (layer.type)
      {
        case 'Tilelayer':
          li.appendChild(this.createMenuRowHeader(layer));                                
          li.appendChild(this.createMenuRowContent(layer));
          this.domNode = this.layermanager.accordionList.appendChild(li);

          var toggleVisibility = function(e) {
            var visible = this.layer.toggleVisible();
            var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
            this.visibilityBtn.setStyle({ background: 'url(images/blackGlass/' + icon + ')' });
            Event.stop(e);
          };
          
          // Event-handlers
          Event.observe(this.visibilityBtn, 'click', toggleVisibility.bindAsEventListener(this));          
          
          // Check to see if observation time matches the desired time
          this.updateTimeStamp(layer);
          break;

        case 'Markerlayer': //Eventually events will be removed from the layer manager and treated separately...
          li.appendChild(Builder.node('div', {className: 'layer-Head'}, "Event Layer"));
          li.appendChild(Builder.node('div', "event layer details..."));
          this.domNode = this.layermanager.accordionList.appendChild(li); //Cannot use prototype's insert() method to insert on top. Does not work in IE.
          break;
        default:
          Debug.output("Default...");
          break;
      }

      this.layer.addObserver('change', this.onLayerChange.bind(this));
    },
    
   /**
    * @method createMenuRowHeader Creates the header for a header/content pair to be used
    * within a jQuery accordion. The header describes the layer's associated instrument, the
    * timestamp of the current image displayed, and icons for removing the layer and toggling
    * it's visibility.
    * 
    * @param  {Layer}  layer  The tile layer
    * @return {Dom-node} Returns a <div> element with all of the necessary components.
    */
    createMenuRowHeader: function (layer) {
    	var header =     Builder.node('div',  {className: 'layer-Head'});
      var instrument = Builder.node('span', {id: 'layer-header-' + layer.id, style: 'float: left'}, layer.instrument + (layer.instrument == layer.detector ? "" : "/" + layer.detector.trimLeft('0')) + " " + layer.measurement.trimLeft('0'));
      
      header.appendChild(instrument);

      // Timestamp
      var timestamp = Builder.node('span', {className: 'timestamp'});

      // Visibility Toggle
      this.visibilityBtn = Builder.node('button', {
        href: '#', 
        id: 'visibility-button-' + layer.id,
        className: 'layerManagerBtn visible',
        value: true,
        type: 'button',
        style: 'background: url(images/blackGlass/LayerManagerButton_Visibility_Visible.png) transparent; width:24px; height:14px;'
      });

      // Layer Removal Button
      var removeBtn = Builder.node('button', {
        href: '#',
        id: 'remove-button-' + layer.id,
        className: 'layerManagerBtn', 
        value: true, 
        type: 'button', 
        style: 'background: url(images/blackGlass/LayerManagerButton_Remove_Shadow.png) transparent; margin-right:8px;'
      });

      // Container for right-aligned elements
      var rightSide = Builder.node('div', {style: 'text-align: right'}, [timestamp, " |", this.visibilityBtn, removeBtn]);
      header.appendChild(rightSide);

      return header;   
    },
     
    /*
     * @method createMenuRowContent
     * @param {Layer} layer The tile layer.
     * @return {Dom-node} The layer row content
     */
    createMenuRowContent: function (layer) {
    	//Wrapper
    	var content = Builder.node('div', {style: 'color: white;'});
    	
    	//Instrument
    	var instLeft =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Instrument: ');
    	var instRight = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createInstrumentControl(layer));
    	content.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'instrument-row-' + layer.id}, [instLeft, instRight]));
    	
    	//Wavelength (EIT only)
    	if (layer.instrument === "EIT") {
			var wlLeft =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Wavelength: ');
    		var wlRight = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createWavelengthControl(layer));
    		content.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'measurement-row-' + layer.id}, [wlLeft, wlRight]));
    	}
    	
    	//Opacity
    	var opacityLeft = Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Opacity: ');
    	var opacityRight = Builder.node('div', {style: 'float: right; width: 60%;'},  [this.createOpacityControl(layer.id), "%"]);
      content.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'opacity-row-' + layer.id}, [opacityLeft, opacityRight]));
    	
    	return content;
    },
    
    /**
     * @method createInstrumentControl
     */
    createInstrumentControl: function (layer) {
        var inst = new Element('select', {id: 'instrument-select-' + layer.id, style: 'display: none'});
        inst.length = 0;

        //Available Instruments
        //ToDo: Read availables from maps table, joined on instruments table for names
        var instruments = $A(["EIT", "LASCO"]);
                
        // Populate list of available instruments
        for (var i = 0; i < instruments.length; i++) {
            var opt = new Option(instruments[i]);
            opt.value = instruments[i];
            inst.options[inst.options.length] = opt;
        }
        
        // Set-up event handler to deal with an instrument change
        Event.observe(inst, 'change', this.onInstrumentChange.curry(layer.id));
        
        // Show only text until user clicks on the form item
        //var instText = Builder.node('span', {id: 'instrument-text-' + layer.id}, inst.value);
        var instText = Builder.node('span', {id: 'instrument-text-' + layer.id}, layer.instrument);
        Event.observe(instText, 'click', function (e) {
        	$(e.target).hide();
        	inst.show();
        });
        
        Event.observe(inst, 'blur', function (e) {
        	$(e.target).hide();
        	instText.show();
        });
        
        return [inst, instText];
    },
    
    /**
     * @method onInstrumentChange
     * @param {Int} id
     */
    onInstrumentChange: function (id) {
        //Dom-nodes for layer components
        var header =         $('layer-header-' + id);
        var measurement =    $('wavelength-select-' + id);
        var measurementRow = $('measurement-row-' + id);
        var instText =       $('instrument-text-' + id);
        
        //Non-pretty solution... TODO: Create a function to handle parameter changes..
        if (this.value === "LASCO") {
          measurementRow.hide();
          header.update("LASCO");
        }
        else {
        	header.update(this.value + " " + measurement.value);
        	measurementRow.show();	
        }

        //Update text to be displayed while not active
        instText.update(this.value);
        
        document.instrumentChange.fire(id, this.value);
    },
    
    
    onLayerChange: function(layer) {
      // ToDo: update the other fields
      this.updateTimeStamp(layer);
    },
    
    /**
     * @method createWavelengthControl
     * @param  {Int} The layer's id.
     * @return {[Dom-node, Dom-node]} Returns a set of two dom-nodes to be inserted into the layer manager.
     */
    createWavelengthControl: function (layer) {
        var id = layer.id;
        var wl = new Element('select', {id: 'wavelength-select-' + id, style: 'display: none'});
        wl.length = 0;

		//Available wavelength choices for EIT
        var wavelengths = $A([171, 195, 284]);
                
        // Populate list of available wavelengths
        for (var i = 0; i < wavelengths.length; i++) {
            var opt = new Option(wavelengths[i]);
            opt.value = wavelengths[i];
            wl.options[wl.options.length] = opt;
        }
        
        // Set-up event handler to deal with an wavelength change
        Event.observe(wl, 'change', this.onWavelengthChange.curry(id));
        
        // Show only text until user clicks on the form item
        //var wlText = Builder.node('span', {id: 'wavelength-text-' + id}, wl.value);
        var wlText = Builder.node('span', {id: 'wavelength-text-' + id}, layer.measurement);
        Event.observe(wlText, 'click', function (e) {
        	$(e.target).hide();
        	wl.show();
        });
        
        // Revert to text display after form field loses focus
        Event.observe(wl, 'blur', function (e) {
        	$(e.target).hide();
        	wlText.show();
        });
        
        return [wl, wlText];
    },
    
    /**
     * Event handler: wavelength change
     */ 
    onWavelengthChange: function (id) {
    	//Update header text
    	var inst =   $('instrument-select-' + id);
    	var header = $('layer-header-' + id);
    	header.update(inst.value + " " + this.value);
    	
        //Update text to be displayed while not active
        $('wavelength-text-' + id).update(this.value);
        
        document.wavelengthChange.fire(id, this.value);
    },
    
    /**
     * @method createOpacityControl Creates the opacity control cell.
     * @param  {layer}      The layer provider associated with the opacity control.
     * @return {HTML Element}       The opacity control cell.
     */
    createOpacityControl: function (id) {
      var opacity = 100;
      var opacityInput = new Element('input', {size: '3', value: opacity});

      Event.observe(opacityInput, 'change', function () {
        document.opacityChange.fire(id, parseInt(this.value, 10) / 100);
      });
		
      return opacityInput;
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
     * @method updateTimeStamp
     * @param {SunImage}
     * @param {Int}
     */
    updateTimeStamp: function () {
      //var id = this.layer.id; 
      if (this.layer.timestamp == undefined) return;
      
      // Update the timestamp
      var date = new Date(this.layer.timestamp * 1000);
      var dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();

      // Calc the time difference
      var timeDiff = this.layer.timestamp - this.layermanager.controller.date.getTime() / 1000;
      var timeDiffAbs = Math.abs(timeDiff);
      var tdHours = Math.floor(timeDiffAbs / 3600);
      var tdMins = Math.floor((timeDiffAbs - tdHours * 3600) / 60);
      var tdSecs = (timeDiffAbs - tdHours * 3600) - tdMins * 60;
      var sign = (timeDiff == 0 ? '&plusmn;' :
                  (timeDiff > 0 ? '+' : '&minus;'))
      var timeDiffStr = sign + String(tdHours) + ':' + String(tdMins).padLeft(0, 2) + ':' + String(tdSecs).padLeft(0, 2);

      //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
      this.domNode.select(".timestamp").first().update(dateString );
      
      // Check to see if observation times match the actual time
      var col = (timeDiff == 0 ? '#FFFFFF' : '#FFFF66');
      this.domNode.select(".timestamp").first().setStyle({color: col});
    },
    
        /**
     * @method onRemoveLayerClick
     * @param {Int} id
     */
    onRemoveLayerClick: function (id) {
      //Remove layer menu items and settings
      Element.remove(this.layerSettings[id]);
      this.layerSettings[id] = null;
      this.layerSettings = this.layerSettings.compact();

      //Re-render accordion
      this.render();
        
      //Fire global event
      document.removeLayer.fire(id);
    }
});
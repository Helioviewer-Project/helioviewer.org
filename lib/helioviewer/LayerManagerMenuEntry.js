/*global Class, $, Option, document, $A, Event, Ajax, Element, Builder, Debug, UIElement */
var LayerManagerMenuEntry = Class.create(UIElement, {
    /**
     * @constructor
     */
    initialize: function (layermanager, layer) {
        this.className = "layerManagerMenuEntry";
        this.layermanager = layermanager;
        this.layer = layer;
        this.domNode = Builder.node('li', {className: 'accordionItem'});
        
        // If layer is not set, create an empty "template" layer
        if (layer.type === "NewLayer") {
            this.displayNewLayerOptions();
        }
        else if (layer.type === "TileLayer") {
            this.displayTileLayerOptions();
        }

        this.layermanager.accordionList.appendChild(this.domNode); //Cannot use prototype's insert() method to insert on top. Does not work in IE.
        
        //Add tooltips (has to occur after dom-node has been appended)
        if (layer.type === "TileLayer") {
            this.layermanager.fire('newToolTip', {id: "#" + this.removeBtn.id, params: {position: 'topleft'}});
            this.layermanager.fire('newToolTip', {id: "#" + this.visibilityBtn.id, params: {position: 'topleft'}});
        }

    },
    
    /**
     * @method displayTileLayerOptions
     */
    displayTileLayerOptions: function () {
        if (!this.header) {
            this.header =  this.domNode.appendChild(this.createMenuRowHeader(this.layer));
            this.content = this.domNode.appendChild(this.createMenuRowContent(this.layer));
        }
        else {
            this.header.replace(this.createMenuRowHeader(this.layer));
	        this.content.replace(this.createMenuRowContent(this.layer));
        }
    	this.setupEventHandlers();

        // Check to see if observation time matches the desired time
        this.updateTimeStamp(this.layer);
    },
    
   /**
    * @method displayNewLayerOptions
    */
    displayNewLayerOptions: function () {
        this.header =  Builder.node('div', {className: 'layer-Head'}, "New Layer");
        this.content = Builder.node('div');
        this.domNode.appendChild(this.header);
        this.domNode.appendChild(this.content); 
        
        var xhr  = null;
        var self = this;
        var dn = self.layermanager.controller.dataNavigator;
        
        // query list of available instruments if it is not already available
        if (!dn.data.get('Instruments')) {
            dn.query('Instruments');
        }
        
        
        // create select form-field for instrument choices
        xhr = new Ajax.Updater(this.content, 'getInstruments.php', {
            parameters: {
                type: 'html'
            },
            method: 'get',
            insertion: 'bottom',
            onComplete: function () {
                var selectField = self.content.select('.instrument-select').first();
                
                var onInstChange = function (e) {
                    //Debug.output(e.target.value + " chosen!");
                    // Get info for chosen instrument
                    var chosenInstrument = null;
                    for (var i = 0; i < dn.data.get('Instruments').length; i++) {
                        if (dn.data.get('Instruments')[i].instrument === e.target.value) {
                            chosenInstrument = dn.data.get('Instruments')[i];
                        }
                    }
                    self.layermanager.fire('newLayer', {menuEntry: self, instrument: chosenInstrument});
                };
                Event.observe(selectField, 'change', onInstChange.bind(self));
            }
        });
    },
    
    setupEventHandlers: function () {
        // Function for toggling layer visibility
    	var toggleVisibility = function (e) {
            var visible = this.layer.toggleVisible();
            var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
            this.visibilityBtn.setStyle({ background: 'url(images/blackGlass/' + icon + ')' });
            Event.stop(e);
        };
              
        // Function for handling layer remove button
        var removeLayer = function (e) {
            this.layermanager.remove(this, this.layer);
            Element.remove(this.domNode);
            Event.stop(e);
            this.layermanager.render();
        };
  
        // Event-handlers
        Event.observe(this.visibilityBtn, 'click', toggleVisibility.bindAsEventListener(this));          
        Event.observe(this.removeBtn, 'click', removeLayer.bindAsEventListener(this));          
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
        var instrument = Builder.node('span', {id: 'layer-header-' + layer.id, style: 'float: left; width: 33%;'}, layer.instrument + (layer.instrument === layer.detector ? "" : "/" + layer.detector.trimLeft('0')) + " " + layer.measurement.trimLeft('0'));
      
        //header.appendChild(instrument);

        // Timestampdev/ie_floats/
        var timestamp = Builder.node('span', {className: 'timestamp'});

        // Visibility Toggle
        this.visibilityBtn = Builder.node('button', {
            id: 'visibility-button-' + layer.id,
            className: 'layerManagerBtn visible',
            value: true,
            type: 'button',
            title: ' - Toggle ' + layer.instrument + ' layer visibility.'
        });

        // Layer Removal Button
        this.removeBtn = Builder.node('button', {
            id: 'remove-button-' + layer.id,
            className: 'layerManagerBtn remove', 
            value: true, 
            type: 'button',
            title: ' - Remove layer.'
        });

        // Container for right-aligned elements
        var rightSide = Builder.node('div', {style: 'text-align: right; float: left; width:67%;'}, [timestamp, " |", this.visibilityBtn, this.removeBtn]);
      
	    // combine left and right containers
	    var both = Builder.node('div', {style: 'overflow: hidden;' }, [instrument, rightSide]);
	    header.appendChild(both);
	    
        // header.appendChild(rightSide);
        return header;   
    },
     
    /*
     * @method createMenuRowContent
     * @param {Layer} layer The tile layer.
     * @return {Dom-node} The layer row content
     */
    createMenuRowContent: function (layer) {
    	//Wrapper
    	var body = Builder.node('div', {style: 'color: white;'});
    	
    	//Instrument
    	var instLeft =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Instrument: ');
    	var instRight = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createInstrumentControl(layer));
    	body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'instrument-row-' + layer.id}, [instLeft, instRight]));
    	
    	//Measurement
    	/*
    	if (layer.measurements.length > 1) {
			var left =  Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Measurement: ');
    		//var right = Builder.node('div', {style: 'float: right; width: 60%;'},  this.createWavelengthControl(layer));
    		//body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'measurement-row-' + layer.id}, [left, right]));
    	}*/
    	
    	//get available measurements for chosen instrument
    	
        //var callBack = this.listMeasurements.bind(this);
        //var xhr = new Ajax.Request('getMeasurements.php', {
        //    onSuccess: callBack,
        //    parameters: {
        //        detector: layer.detector
        //    }
        //});
        /*this.measurementSelect = body.appendChild(Builder.node('div', {style: 'float: left;  width: 100%;'}, " "));*/
    	
    	//Opacity
    	//var opacityLeft = Builder.node('div', {style: 'float: left;  width: 40%;'}, 'Opacity: ');
    	//var opacityRight = Builder.node('div', {style: 'float: right; width: 60%;'},  [this.createOpacityControl(layer.id), "%"]);
        //body.appendChild(Builder.node('div', {style: 'height: 24px; padding: 4px;', id: 'opacity-row-' + layer.id}, [opacityLeft, opacityRight]));
    	
    	return body;
    },
    
    listMeasurements: function (transport) {
        var response = transport.responseJSON;
        this.layer.measurementType = response[0].type;
        
        this.layer.measurements = $A(response).collect(function (row) {
            return parseInt(row.measurement, 10);
        });
        
        /*this.measurementSelect.update(this.layer.measurementType + ":");*/
        
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
        
        /*
        Event.observe(instText, 'click', function (e) {
        	$(e.target).hide();
        	inst.show();
        });
        
        Event.observe(inst, 'blur', function (e) {
        	$(e.target).hide();
        	instText.show();
        }); */
        
        //return [inst, instText];
        return instText;
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
    
    onLayerChange: function (layer) {
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
        if (this.layer.timestamp === undefined) {
        	return;
        }
        
        // Update the timestamp
        var date = new Date(this.layer.timestamp * 1000);
        var dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();
        //this.timeField.value = this.controller.date.toString("HH:mm:ss");

        // Calc the time difference
        var timeDiff = this.layer.timestamp - this.layermanager.controller.date.getTime() / 1000;
        var timeDiffAbs = Math.abs(timeDiff);
        var tdHours = Math.floor(timeDiffAbs / 3600);
        var tdMins = Math.floor((timeDiffAbs - tdHours * 3600) / 60);
        var tdSecs = (timeDiffAbs - tdHours * 3600) - tdMins * 60;
        var sign = (timeDiff === 0 ? '&plusmn;' : (timeDiff > 0 ? '+' : '&minus;'));
        var timeDiffStr = sign + String(tdHours) + ':' + String(tdMins).padLeft(0, 2) + ':' + String(tdSecs).padLeft(0, 2);

        //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
        $(this.domNode).select(".timestamp").first().update(dateString);
        
        // Check to see if observation times match the actual time
        var col = (timeDiff === 0 ? '#FFFFFF' : '#FFFF66');
        $(this.domNode).select(".timestamp").first().setStyle({color: col});
    }
});
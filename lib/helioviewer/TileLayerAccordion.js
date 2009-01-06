/**
 * @fileoverview Contains the class definition for an TileLayerAccordion class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class TileLayerAccordion
 *
 * syntax: jQuery, Prototype
 *
 * @see LayerManager
 * @requires ui.dynaccordion.js
 */
var TileLayerAccordion = Class.create(Layer, {
	/**
	 * @constructor
	 * @param {LayerManager} Reference to the layerManager.
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
	 */
	initialize: function (layerManager, containerId) {
		this.layerManager = layerManager;
		this.container =    jQuery('#' + containerId);
		this.queryURL =     "api/index.php";

		this.options = {};

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#TileLayerAccordion-Container');
		this.domNode.dynaccordion({startClosed: true});
		
		//Individual layer menus
		this.layerSettings = new Hash();
	},

	/**
	 * @function
	 * @description Adds a new entry to the tile layer accordion
	 */
	addLayer: function (layer) {
		// Determine what measurements to display
		var processResponse = function(transport){
			// Create accordion entry header
			//var collapseIcon = "<img class='collapse' id='collapse-" + layer.id + "' src='images/blackGlass/accordion_menu_closed.png'></button>";
			
			var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
			var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
			var head = "<div class=layer-Head><span class=tile-accordion-header-left>" + layer.name + "</span><span class=tile-accordion-header-right><span class=timestamp></span> |" + visibilityBtn + removeBtn + "</span></div>";

			// Update allowable choices
			this.options.observatories = transport.responseJSON.observatories;
			this.options.instruments =   transport.responseJSON.instruments;
			this.options.detectors =     transport.responseJSON.detectors;
			this.options.measurements =  transport.responseJSON.measurements;			
			
			// Create accordion entry body
			var body = this._buildEntryBody(layer);

			//var startOpened = (this.layerManager.numTileLayers() > 1);

			//Add to accordion
			this.domNode.dynaccordion("addSection", {
				id:     layer.id,
				header: head,
				cell:   body,
				open:   layer.startOpened
			});
			
			
			var slider = new Control.Slider("opacity-slider-handle-" + layer.id, "opacity-slider-track-" + layer.id, {
				sliderValue: layer.opacity,
				range:       $R(1, 100),
				values:      $R(1, 100),
				onSlide:     function(v) {
					layer.setOpacity(v);	
				}
			});
			
			/* NOTE: Bug in jQuery slider currently prevents it from working properly when
			 * initialized hidden. See http://groups.google.com/group/jquery-ui/browse_thread/thread/5febf768db177780. 
			jQuery("#opacity-slider-track-" + layer.id).slider({
				startValue: layer.opacity,
				change: function(e, ui) {
					var val = ui.value;
					layer.setOpacity(val);					
				}
			});*/
			
			// Keep a reference to the dom-node
			//this.menuEntries.push({id: layer.id, header: head, cell: body});
			this.layerSettings.set(layer.id, {
				header: head,
				body: body,
				opacitySlider: slider
			});
			
			// Event-handlers
			this._setupEventHandlers(layer);
			
			// Update timestamp
			this.updateTimeStamp(layer);
		};
		
		//Ajax Request
		var xhr = new Ajax.Request(this.queryURL, {
			method: 'get',
			onSuccess: processResponse.bind(this),
			parameters: {
				action     : "getLayerAvailability",
				observatory: layer.observatory,
				instrument:  layer.instrument,
				detector:    layer.detector,
				measurement: layer.measurement,
				format:      "json"
			}
		});
	},

	/**
	 * @function
	 * @description Checks to see if the given layer is listed in the accordion 
	 */
	hasId: function (id) {
		return (this.layerSettings.keys().grep(id).length > 0 ? true : false);
	},
	
	/**
	 * @function
	 * 
	 * Note: width and height must be hardcoded for slider to function properly. 
	 * See http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f for explanation.
	 */
	_buildEntryBody: function (layer) {
		var id = layer.id;
		var options = this.options;
		
		// Opacity slider placeholder
		var opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
		opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id + "' style='width:120px; height:10px;'>";
		opacitySlide += "<div class='opacity-slider-handle' id='opacity-slider-handle-" + id + "' style='10px; 19px;'></div>"
		opacitySlide += "</div>";
				
		// Populate list of available observatories
		var obs = "<div class=layer-select-label>Observatory: </div> ";
		obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'>";
		jQuery.each(options.observatories, function (i, o) {
			obs += "<option value='" + o.abbreviation + "'";
			if (layer.observatory == o.abbreviation) {
				obs += " selected='selected'";
			}				 
			obs += ">" + o.name + "</option>";			
		});
		obs += "</select><br>";
		
		// Populate list of available instruments
		var inst = "<div class=layer-select-label>Instrument: </div> ";
		inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'>";
		jQuery.each(options.instruments, function (i, o) {
			inst += "<option value='" + o.abbreviation + "'";
			if (layer.instrument == o.abbreviation) {
				inst += " selected='selected'";
			}
			inst += ">" + o.name + "</option>";			
		});
		inst += "</select><br>";
		
		// Populate list of available Detectors
		var det = "<div class=layer-select-label>Detector: </div> ";
		det += "<select name=detector class=layer-select id='detector-select-" + id + "'>";
		jQuery.each(options.detectors, function (i, o) {
			det += "<option value='" + o.abbreviation + "'";
			if (layer.detector == o.abbreviation) {
				det += " selected='selected'";
			}
			det += ">" + (o.name === "" ? o.abbreviation : o.name) + "</option>";		
		});
		det += "</select><br>";
		
		// Populate list of available Detectors
		var meas = "<div class=layer-select-label>Measurement: </div> ";
		meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'>";
		jQuery.each(options.measurements, function (i, o) {
			meas += "<option value='" + o.abbreviation + "'";
			if (layer.measurement == o.abbreviation) {
				meas += " selected='selected'";
			}
			meas += ">" + o.name + "</option>";		
		});
		meas += "</select><br><br>";
		
		var fits = "<a href='#' id='showFITSBtn-" + id + "' style='margin-left:160px; color: white; text-decoration: none;'>FITS Header</a><br>";
		
		return (opacitySlide + obs + inst + det + meas + fits);
	},
	
	_addOpacitySlider: function (layer) {
		
	},
	
	/**
	 * @param {Object} id
	 * @param {Object} opacity
	 * @description Makes sure the slider is set to the right value.
	 */
	updateOpacitySlider: function (id, opacity) {
		this.layerSettings.get(id).opacitySlider.setValue(opacity);
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty tile layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span class="accordion-title">Overlays</span>').css({'float': 'left'});
		var addLayerBtn = jQuery('<a href=# class=gray>[Add]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="TileLayerAccordion-Container"></div>'));
		
        // Event-handlers
		var self = this;
		var hv = this.layerManager.controller;
        addLayerBtn.click(function() {
			self.layerManager.addLayer(new TileLayer(hv.viewports[0], { tileAPI: hv.tileAPI, observatory: 'SOH', instrument: 'LAS', detector: '0C2', measurement: '0WL', startOpened: true }));
			self.layerManager.refreshSavedTileLayers();        	
        });
	},

	/**
	 * @function
	 * @description
	 */
	_setupEventHandlers: function (layer) {
		visibilityBtn = jQuery("#visibilityBtn-" + layer.id);
		removeBtn     = jQuery("#removeBtn-" + layer.id);
		fitsBtn       = jQuery("#showFITSBtn-" + layer.id);

		// Function for toggling layer visibility
		var toggleVisibility = function (e) {
			var visible = layer.toggleVisible();
			var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')' );
			e.stopPropagation();
		};

		// Function for handling layer remove button
		var removeLayer = function (e) {
			var accordion = e.data;
			accordion.layerManager.removeLayer(layer);
			accordion.domNode.dynaccordion('removeSection', {id: layer.id});
			accordion.layerSettings.unset(layer.id);
			accordion.layerManager.refreshSavedTileLayers();

			//accordion.layers = accordion.layers.without(layer.id);
			e.stopPropagation();
		};
		
		// Function for handling requests to display FITS header Info
		var showFITS = function () {
			var dialogId = "fits-header-" + layer.id;
			
			// Check to see if a dialog already exists
			if (jQuery("#" + dialogId).length == 0) {
			
				// Ajax Responder
				var processResponse = function(transport) {
					var response = transport.responseJSON;
						
					// Format results
					var formatted = "<div id='" + dialogId + "' style='overflow: auto; padding:0px'><div style='background: white; color: black; padding:1.5em 1.7em'>";
					$A(response).each(function (line) {
						formatted += line + "<br>";
					});
					formatted += "</div></div>";
	
					jQuery("body").append(formatted);
					jQuery("#" + dialogId).dialog({
						autoOpen: true,
						title: "FITS Header:",
						width: 400,
						height: 350,
						draggable: true
					});
				};
				
				// Ajax Request
				var xhr = new Ajax.Request("api/index.php", {
					method: 'get',
					onSuccess: processResponse.bind(this),
					parameters: {
						action:  "getJP2Header",
						imageId: layer.imageId
					}
				});
				
			// If it does exist but is closed, open the dialog
			} else {
				if (!jQuery("#" + dialogId).dialog("isOpen")) {
					jQuery("#" + dialogId).dialog("open");
				} else {
					//jQuery("#" + dialogId).dialog("destroy");
					jQuery("#" + dialogId).dialog("close");
				}
			}	
		};
		
		// Event handlers for select items
		var self = this;
		
		jQuery.each(jQuery('#' + layer.id + ' > div > select'), function (i, item) {
			jQuery(item).change(function(e){
				//alert(this.name + "= " + this.value);
				if (this.name === "observatory") {
					layer.observatory = this.value;
				}
				else if (this.name === "instrument") {
					layer.instrument = this.value;
				}
				else if (this.name === "detector") {
					layer.detector = this.value;
				}
				else if (this.name === "measurement") {
					layer.measurement = this.value;
				}
				
				// Validate new settings and reload layer
				self._onLayerSelectChange(layer, this.name, this.value);
			})
		});

		// Display FITS header
		fitsBtn.bind('click', this, showFITS);

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	},
	
	/**
	 * @function
	 * @param {TileLayer} layer 
	 * @param {String} changed
	 * @description Check to make sure the new layer settings are valid. If the new combination of
	 * choices are not compatable, change values to right of most-recently changed parameter to valid
	 * settings. Once the combination is acceptable, reload the tile layer.
	 */
	_onLayerSelectChange: function (layer, changed, value) {
		// Ajax callback function
		var processResponse = function (transport) {
			// Update options
			this.options = transport.responseJSON;

			// Case 1: Observatory changed
			if (changed === "observatory") {
				this._updateOptions(layer.id, "instrument", this.options.instruments);
				
				//Make sure the instrument choice is still valid.
				if ($A(this.options.instruments).grep(layer.instrument).length == 0) {
					layer.instrument = this.options.instruments[0];
				}
			}
			
			// Case 2: Instrument changed
			if ( (changed === "observatory") || (changed === "instrument") ) {
				this._updateOptions(layer.id, "detector", this.options.detectors);
				
				//Make sure the detector choice is still valid.
				if (!$A(this.options.detectors).find(function(det) {
    				return det.abbreviation == layer.detector;
				})) {
					layer.detector = this.options.detectors[0].abbreviation;
				}
			}
			
			// Case 3: Detector changed
			if ( (changed === "observatory") || (changed === "instrument") || (changed === "detector") ) {
				this._updateOptions(layer.id, "measurement", this.options.measurements);	
				
				//Make sure the measurement choice is still valid.
				if (!$A(this.options.measurements).find(function(meas) {
    				return meas.abbreviation == layer.measurement;
				})) {
					layer.measurement = this.options.measurements[0].abbreviation;
				}
				
				
				//if ($A(this.options.measurements).grep(layer.measurement).length == 0) {
				//	layer.measurement = this.options.measurements[0];
				//}
				/*
				var instVal = $F('instrument-select-' + layer.id);
				if ($A(this.options.instruments).grep(instVal).length == 0) {
					layer.instrument = this.options.instruments[0];
					
					//update selectedIndex
					var self = this;
					$$('#instrument-select-' + layer.id + ' > option').each(function(opt, i) {
						if (opt.value === self.options.instruments[0]) {
							$('instrument-select-' + layer.id).selectedIndex = i;
						}
					});
				}*/
			}
			
			//reload layer settings
			layer.reload();
			
			// Update stored user settings
			this.layerManager.refreshSavedTileLayers();
		};
		
		// Do not need to update options if the measurement is changed
		if (changed !== "measurement") {
			// Update SELECT options
			var obs  = (changed === "observatory" ? value : layer.observatory);
			var inst = (changed === "instrument"  ? value : layer.instrument);
			var det  = (changed === "detector"    ? value : layer.detector);
			var meas = (changed === "measurement" ? value : layer.measurement);
			
			// Ajax Request
			var xhr = new Ajax.Request(this.queryURL, {
				method: 'get',
				onSuccess: processResponse.bind(this),
				parameters: {
					action: "getLayerAvailability",
					observatory: obs,
					instrument: inst,
					detector: det,
					measurement: meas,
					format: "json",
					changed: changed,
					value: value
				}
			});
		}
		else {
			//reload layer settings
			layer.reload();
			
			// Update stored user settings
			this.layerManager.refreshSavedTileLayers();
		}
	},
	
	/**
	 * @function
	 * @description Updates options for a single SELECT element.
	 * @param {String} id
	 * @param {String} field
	 * @param {Array} newOptions
	 */
	_updateOptions: function (id, field, newOptions) {
		//Remove old options
		$$('#' + field + '-select-' + id + ' > option').each(function(o) {
			o.remove();
		});
		
		//Add new options
		var select = $(field + '-select-' + id);
		$A(newOptions).each(function(o) {
			var opt = new Element('option', {value: o.abbreviation}).insert(
				o.name === "" ? o.abbreviation : o.name
			);
			select.insert(opt);
		});
		
	},
    
    /**
     * @method updateTimeStamp
     * @param {SunImage}
     * @param {Int}
     */
    updateTimeStamp: function (layer) {
    	//Grab timestamp dom-node
    	var domNode = $(layer.id).select('.timestamp').first();
    	
        //remove any pre-existing styling
        domNode.removeClassName("timeBehind");
        domNode.removeClassName("timeAhead");
        domNode.removeClassName("timeSignificantlyOff");
                
        // Update the timestamp
        var date = new Date(layer.timestamp * 1000);
        var dateString = date.toYmdUTCString() + ' ' + date.toHmUTCString();

        // Calc the time difference
        var timeDiff = layer.timestamp - this.layerManager.controller.date.getTime() / 1000;

        //this.domNode.select(".timestamp").first().update(dateString + ' ' + timeDiffStr);
        domNode.update(dateString);
        
        //get timestep (TODO: create a better accessor)
        //var ts = this.layerManager.controller.timeStepSlider.timestep.numSecs;
		var ts = this.layerManager.controller.timeIncrementSecs;
        
        // Check to see if observation times match the actual time
        if (timeDiff < 0) {
        	if (Math.abs(timeDiff) > (4 * ts)) {
        		domNode.addClassName("timeSignificantlyOff");
        	}
        	else {
        		domNode.addClassName("timeBehind");
        	}
        }
        else if (timeDiff > 0) {
        	if (timeDiff > (4 * ts)) {
        		domNode.addClassName("timeSignificantlyOff");
        	}
        	else {
        		domNode.addClassName("timeAhead");
        	}
        }
    },
	
	/**
	 * 
	 * @param {String} id Layer id
	 * @param {String} desc New description to use 
	 */
	updateLayerDesc: function (id, desc) {
		$(id).select("span.tile-accordion-header-left").first().update(desc);
	}
    
});


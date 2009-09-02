/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 * 
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields? (can pass in a single tree during init)
 * 
 * Syntax: jQuery, Prototype ()
 */
/*global TileLayerAccordion, Class, jQuery, Layer, TileLayer */
var TileLayerAccordion = Class.create(Layer,
	/** @lends TileLayerAccordion.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new TileLayerAccordion
	 * @param {Object} tileLayers Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer  manager user interface should be constructed
	 */
	initialize: function (controller, containerId) {
        this.controller = controller;
        this.tileLayers = controller.tileLayers;
		this.container  = jQuery('#' + containerId);
		this.queryURL   = "api/index.php";

		this.options = {};

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#TileLayerAccordion-Container');
		this.domNode.dynaccordion({startClosed: true});
		
		//Individual layer menus
		this.layerSettings = [];
	},

	/**
	 * @description Adds a new entry to the tile layer accordion
	 * @param {Object} layer The new layer to add
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var visibilityBtn, removeBtn, hidden, head, body, slider, self = this;
		
        // initial visibility
        hidden = (layer.visible ? "" : " hidden");
        
		visibilityBtn = "<span class='layerManagerBtn visible" + hidden + "' id='visibilityBtn-" + layer.id + "' title=' - Toggle layer visibility'></span>";
		removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + layer.id + "' title=' - Remove layer'></span>";
		head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'><span class=tile-accordion-header-left>" + layer.name + "</span><span class=tile-accordion-header-right><span class=timestamp></span><span class=accordion-header-divider>|</span>" + visibilityBtn + removeBtn + "</span></div>";
        
        // Update allowable choices
		//self.options.observatories = data.observatories;
		//self.options.instruments =   data.instruments;
		//self.options.detectors =     data.detectors;
		//self.options.measurements =  data.measurements;			
		
		// Create accordion entry body
		body = this._buildEntryBody(layer);

		//Add to accordion
		this.domNode.dynaccordion("addSection", {
			id:     layer.id,
			header: head,
			cell:   body,
			open:   layer.startOpened
		});

		slider = jQuery("#opacity-slider-track-" + layer.id).slider({
			value: layer.opacity,
            min  : 0,
            max  : 100,
			slide: function(e, ui) {
                if ((ui.value % 2) == 0)
					layer.setOpacity(ui.value);
			},
            change: function (e, ui) {
                layer.setOpacity(ui.value);
                self.tileLayers.save();
            }
		});
		
		// Keep a reference to the dom-node
		//this.menuEntries.push({id: layer.id, header: head, cell: body});
		this.layerSettings.push({
            id    : layer.id,
			header: head,
			body  : body,
			opacitySlider: slider
		});
		
		// Event-handlers
		this._setupEventHandlers(layer);
		
		// Update timestamp
		this.updateTimeStamp(layer);
            
        // Setup tooltips
        // Note: disabling until event-handler issues can be worked out
        // See http://dev.jquery.com/ticket/4591
        //this._setupTooltips(layer.id);

        
        // Params
       // params = {
    	//	action     : "getLayerAvailability",
    	//	observatory: layer.observatory,
    	//	instrument : layer.instrument,
    	//	detector   : layer.detector,
    	//	measurement: layer.measurement
		//}
		
		//Ajax Request
		//jQuery.post(this.queryURL, params, callback, "json");
	},

    /**
     * @description Returns the layer settings associated with the given layer id
     * @param {Object} id
     */
    getLayerSettings: function (id) {
        var matched = jQuery.grep(this.layerSettings, function(layer) {
            return layer.id === id;
        });
        if (matched.length > 0)
            return matched.pop();
        else
            return false;
    },

	/**
	 * @description Checks to see if the given layer is listed in the accordion
	 * @param {String} id ID of the layer being checked 
	 */
	hasId: function (id) {
        return (this.getLayerSettings(id) ? true : false)
	},
    
    /**
     * @description Removes layer settings associated with given id
     */
	removeLayerSettings: function (id) {
        this.layerSettings = jQuery.grep(this.layerSettings, function(layer) {
            return layer.id !== id;
        });
    },    
    
	/**
	 * @description Builds the body section of a single TileLayerAccordion entry. NOTE: width and height must be hardcoded for slider to function properly.
	 * @param {Object} layer The new layer to add
	 * @see <a href="http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f">This discussion thread</a> for explanation.
	 */
	_buildEntryBody: function (layer) {
		var id, options, opacitySlide, obs, inst, det, meas, fits;
		
		id = layer.id;
		options = this.options;
		
		// Opacity slider placeholder
		opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
		opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id + "' style='width: 120px; height: 8px;'>";
		opacitySlide += "</div>";
				
		// Populate list of available observatories
		obs = "<div class=layer-select-label>Observatory: </div> ";
		obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'>";
        
        /**
		jQuery.each(options.observatories, function (i, o) {
			obs += "<option value='" + o.abbreviation + "'";
			if (layer.observatory === o.abbreviation) {
				obs += " selected='selected'";
			}				 
			obs += ">" + o.name + "</option>";			
		});
		obs += "</select><br>";
		*/
       
		// Populate list of available instruments
		inst = "<div class=layer-select-label>Instrument: </div> ";
		inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'>";
        
        /**
		jQuery.each(options.instruments, function (i, o) {
			inst += "<option value='" + o.abbreviation + "'";
			if (layer.instrument === o.abbreviation) {
				inst += " selected='selected'";
			}
			inst += ">" + o.name + "</option>";			
		});
		inst += "</select><br>";
		*/
		
		// Populate list of available Detectors
		det = "<div class=layer-select-label>Detector: </div> ";
		det += "<select name=detector class=layer-select id='detector-select-" + id + "'>";
        
        /**
		jQuery.each(options.detectors, function (i, o) {
			det += "<option value='" + o.abbreviation + "'";
			if (layer.detector === o.abbreviation) {
				det += " selected='selected'";
			}
			det += ">" + (o.name === "" ? o.abbreviation : o.name) + "</option>";		
		});
		det += "</select><br>";
		*/
		
		// Populate list of available Detectors
		meas = "<div class=layer-select-label>Measurement: </div> ";
		meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'>";
        
        /**
		jQuery.each(options.measurements, function (i, o) {
			meas += "<option value='" + o.abbreviation + "'";
			if (layer.measurement === o.abbreviation) {
				meas += " selected='selected'";
			}
			meas += ">" + o.name + "</option>";		
		});
		meas += "</select><br><br>";
		*/
		
		fits = "<a href='#' id='showFITSBtn-" + id + "' style='margin-left:170px; color: white; text-decoration: none;'>FITS Header</a><br>";
		
		return (opacitySlide + obs + inst + det + meas + fits);
	},
	
	/**
	 * @description Makes sure the slider is set to the right value
	 * @param {Object} id ID of the TileLayer whose opacity should be adjusted
	 * @param {Object} opacity The new opacity value
	 */
	updateOpacitySlider: function (id, opacity) {
		this.getLayerSettings(id).opacitySlider.slider("value", opacity);
	},

	/**
	 * @description Handles setting up an empty tile layer accordion.
	 */
	_setupUI: function () {
		var title, addLayerBtn, self = this;
		
		// Create a top-level header and an "add layer" button
		title = jQuery('<span class="section-header">Overlays</span>').css({'float': 'left'});
		addLayerBtn = jQuery('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="TileLayerAccordion-Container"></div>'));
		
        // Event-handlers
        addLayerBtn.click(function () {
			self.tileLayers.addNewLayer();
        });
	},

	/**
	 * @description Sets up event-handlers for a TileLayerAccordion entry
	 * @param {Object} layer The layer being added
	 */
	_setupEventHandlers: function (layer) {
		var toggleVisibility, removeLayer, showFITS, visible, icon, accordion, self = this,
			visibilityBtn = jQuery("#visibilityBtn-" + layer.id),
			removeBtn     = jQuery("#removeBtn-" + layer.id),
			fitsBtn       = jQuery("#showFITSBtn-" + layer.id);

		// Function for toggling layer visibility
		toggleVisibility = function (e) {
			visible = layer.toggleVisibility();
            jQuery("#visibilityBtn-" + layer.id).toggleClass('hidden');
            self.tileLayers.save();
			e.stopPropagation();
		};

		// Function for handling layer remove button
		removeLayer = function (e) {
			accordion = e.data;
            self.tileLayers.removeLayer(layer);
            
            accordion._removeTooltips(layer.id);
			
			accordion.domNode.dynaccordion('removeSection', {id: layer.id});
			accordion.removeLayerSettings(layer.id);
            self.tileLayers.save();

			//accordion.layers = accordion.layers.without(layer.id);
			e.stopPropagation();
		};
		
		// Event handlers for select items
		jQuery.each(jQuery('#' + layer.id + ' > div > select'), function (i, item) {
			jQuery(item).change(function (e) {
				//alert(this.name + "= " + this.value);
				if (this.name === "observatory")
					layer.observatory = this.value;
				else if (this.name === "instrument")
					layer.instrument = this.value;
				else if (this.name === "detector")
					layer.detector = this.value;
				else if (this.name === "measurement")
					layer.measurement = this.value;
				
				// Validate new settings and reload layer
                // TODO 2009/09/02: Use TreeSelect
				// self._onLayerSelectChange(layer, this.name, this.value);
			});
		});

		// Display FITS header
		fitsBtn.bind('click', function () {
            self._showFITS(layer);
        });

		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	},
    
    /**
     * @description Displays the FITS header information associated with a given image
     * @param {Object} layer
     */
	_showFITS: function (layer) {
        var dialogId, response, sortBtn, formatted, params, callback, self = this;
        
		dialogId = "fits-header-" + layer.id;
		
		// Check to see if a dialog already exists
		if (jQuery("#" + dialogId).length !== 0) {
            if (!jQuery("#" + dialogId).dialog("isOpen"))
                jQuery("#" + dialogId).dialog("open");
            else
                jQuery("#" + dialogId).dialog("close");
                
            return;
        }
		
		// Ajax Responder
		callback = function (response) {

			// Format results
			formatted =  "<div id='" + dialogId + "' style='overflow: auto; position: relative; padding:0px'>";
            formatted += "<div class='fits-regular'>";
			jQuery.each(response, function () {
				formatted += this + "<br>";
			});
			formatted += "</div>"
            
            // Store a sort version as well
            formatted += "<div class='fits-sorted' style='display: none;'>";
            jQuery.each(response.sort(), function () {
				formatted += this + "<br>";
			});
            
            formatted += "</div></div>";
            
   			jQuery("body").append(formatted);

            // Button to toggle sorting
            sortBtn = "<span class='fits-sort-btn'>Abc</span>";
            jQuery("#" + dialogId).append(sortBtn);    
            jQuery("#" + dialogId + " > span").click(function() {
                jQuery(this).toggleClass("italic");
    			jQuery("#" + dialogId + " .fits-sorted").toggle();
       			jQuery("#" + dialogId + " .fits-regular").toggle();
            });
                            
			jQuery("#" + dialogId).dialog({
				autoOpen: true,
				title: "FITS Header: " + layer.name,
				width: 400,
				height: 350,
				draggable: true
			});
		};
		
        // Request parameters
        params = {
			action:  "getJP2Header",
			uri: layer.uri
        }
        
        jQuery.post("api/index.php", params, callback, "json");
	},
		
	
	/**
 	 * @description Checks to make sure the new layer settings are valid. If the new combination of
	 * choices are not compatable, change values to right of most-recently changed parameter to valid
	 * settings. Once the combination is acceptable, reload the tile layer.
	 * @param {TileLayer} layer The layer to which the changes have been made
	 * @param {String} changed The field altered
	 * @param {String} The new value chosen
	 */
    /**
	_onLayerSelectChange: function (layer, changed, value) {
		var obs, inst, det, meas, xhr, processResponse;
		
		// Ajax callback function
		processResponse = function (transport) {
			// Update options
			this.options = transport.responseJSON;

			// Case 1: Observatory changed
			if (changed === "observatory") {
				this._updateOptions(layer.id, "instrument", this.options.instruments);
				
				//Make sure the instrument choice is still valid.
				if ($A(this.options.instruments).grep(layer.instrument).length === 0) {
					layer.instrument = this.options.instruments[0];
				}
			}
			
			// Case 2: Instrument changed
			if ((changed === "observatory") || (changed === "instrument")) {
				this._updateOptions(layer.id, "detector", this.options.detectors);
				
				//Make sure the detector choice is still valid.
				if (!$A(this.options.detectors).find(function (det) {
    				return det.abbreviation === layer.detector;
				})) {
					layer.detector = this.options.detectors[0].abbreviation;
				}
			}
			
			// Case 3: Detector changed
			if ((changed === "observatory") || (changed === "instrument") || (changed === "detector")) {
				this._updateOptions(layer.id, "measurement", this.options.measurements);	
				
				//Make sure the measurement choice is still valid.
				if (!$A(this.options.measurements).find(function (meas) {
    				return meas.abbreviation === layer.measurement;
				})) {
					layer.measurement = this.options.measurements[0].abbreviation;
				}
			}
			
			//reload layer settings
			layer.reload();
			
			// Update stored user settings
			this.tileLayers.save();
		};
		
		// Do not need to update options if the measurement is changed
		if (changed !== "measurement") {
			// Update SELECT options
			obs  = (changed === "observatory" ? value : layer.observatory);
			inst = (changed === "instrument"  ? value : layer.instrument);
			det  = (changed === "detector"    ? value : layer.detector);
			meas = (changed === "measurement" ? value : layer.measurement);
			
			// Ajax Request
			xhr = new Ajax.Request(this.queryURL, {
				method: 'POST',
				onSuccess: processResponse.bind(this),
				parameters: {
					action: "getLayerAvailability",
					observatory: obs,
					instrument: inst,
					detector: det,
					measurement: meas,
					changed: changed,
					value: value
				}
			});
		}
		else {
			//reload layer settings
			layer.reload();
			
			// Update stored user settings
    		this.tileLayers.save();
		}
	},*/
	
	/**
	 * @description Updates options for a single SELECT element.
	 * @param {String} id The ID of the layer whose parameters were adjusted 
	 * @param {String} field The field to adjust
	 * @param {Array} newOptions updated choices
	 */
    /**
	_updateOptions: function (id, field, newOptions) {
		var select, opt;
		
		//Remove old options
		$$('#' + field + '-select-' + id + ' > option').each(function (o) {
			o.remove();
		});
		
		//Add new options
		select = $(field + '-select-' + id);
		$A(newOptions).each(function (o) {
			opt = new Element('option', {value: o.abbreviation}).insert(o.name === "" ? o.abbreviation : o.name);
			select.insert(opt);
		});
		
	},*/
    
    /**
     * @description Initialize custom tooltips for each icon in the accordion
     */
    _setupTooltips: function (id) {
        var items = [
            "#visibilityBtn-" + id,
            "#removeBtn-"     + id
		],

		hv = this.controller;
		jQuery.each(items, function () {
			hv.addToolTip(this, {yOffset: -125});
		});
    },
    
    /**
     * @description Unbinds event-hanlders relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        var ids = [
            "#visibilityBtn-" + id,
            "#removeBtn-"     + id
		];
        
        jQuery.each(ids, function () {
			jQuery(this).unbind();
		});
    },

    
    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    updateTimeStamp: function (layer) {
		var domNode, date, dateString, timeDiff, ts;
		
    	// Grab timestamp dom-node
    	domNode = jQuery("#" + layer.id).find('.timestamp');
    	
        // Remove any pre-existing styling
        domNode.removeClass("timeAhead timeBehind timeSignificantlyOff");
                
        // Update the timestamp
        date = new Date(layer.timestamp * 1000);
        dateString = date.toUTCDateString() + ' ' + date.toUTCTimeString();

        // Calc the time difference
        timeDiff = layer.timestamp - this.controller.date.getTime() / 1000;

        domNode.html(dateString);
        
        // Get timestep
		ts = this.controller.timeIncrementSecs;
        
        // Check to see if observation times match the actual time
      	if (Math.abs(timeDiff) > (4 * ts))
            domNode.addClass("timeSignificantlyOff");
        else if (timeDiff < 0)
       		domNode.addClass("timeBehind");
        else if (timeDiff > 0)
       		domNode.addClass("timeAhead");
    },
	
	/**
	 * @description Updates the description for a given tile layer
	 * @param {String} id Layer id
	 * @param {String} desc New description to use 
	 */
	updateLayerDesc: function (id, desc) {
		jQuery(id).find(".tile-accordion-header-left").html(desc);
	}    
});


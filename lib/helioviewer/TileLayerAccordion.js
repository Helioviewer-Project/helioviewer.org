/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 * 
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields? (can pass in a single tree during init)
 */
/*global TileLayerAccordion, Class, $, Layer, TileLayer */
var TileLayerAccordion = Layer.extend(
	/** @lends TileLayerAccordion.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new TileLayerAccordion
	 * @param {Object} tileLayers Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer  manager user interface should be constructed
	 */
	init: function (controller, containerId) {
        this.controller = controller;
        this.tileLayers = controller.tileLayers;
		this.container  = $(containerId);
		this.queryURL   = "api/index.php";

		this.options = {};

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = $('#TileLayerAccordion-Container');
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
		var visibilityBtn, removeBtn, hidden, head, body, slider, name, ids, selected, obs, inst, det, meas, self = this;
        
        // initial visibility
        hidden = (layer.visible ? "" : " hidden");
        
		visibilityBtn = "<span class='layerManagerBtn visible" + hidden + "' id='visibilityBtn-" + layer.htmlId + "' title=' - Toggle layer visibility'></span>";
		removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + layer.htmlId + "' title=' - Remove layer'></span>";
		head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'><span class=tile-accordion-header-left>" + layer.name + "</span><span class=tile-accordion-header-right><span class=timestamp></span><span class=accordion-header-divider>|</span>" + visibilityBtn + removeBtn + "</span></div>";
		
		// Create accordion entry body
		body = this._buildEntryBody(layer);
        
		//Add to accordion
		this.domNode.dynaccordion("addSection", {
			id:     layer.htmlId,
			header: head,
			cell:   body,
			open:   layer.startOpened
		});

        // SELECT id's
        obs  = "#observatory-select-" + layer.htmlId;
        inst = "#instrument-select-" + layer.htmlId;
        det  = "#detector-select-" + layer.htmlId;
        meas = "#measurement-select-" + layer.htmlId;
        ids = [obs, inst, det, meas];

        // Initialize TreeSelect
        selected  = [layer.observatory, layer.instrument, layer.detector, layer.measurement];
        this.selectMenus = new TreeSelect(ids, this.controller.dataSources, selected, function (leaf) {
            layer.observatory = $(obs).attr("value");
			layer.instrument  = $(inst).attr("value");
			layer.detector    = $(inst).attr("value");
			layer.measurement = $(inst).attr("value");
			
            layer.reload();
            self.tileLayers.save();
		});

		slider = $("#opacity-slider-track-" + layer.htmlId).slider({
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
            id    : layer.sourceId,
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
	},

    /**
     * @description Returns the layer settings associated with the given layer id
     * @param {Object} id
     */
    getLayerSettings: function (id) {
        var matched = $.grep(this.layerSettings, function(layer) {
            return layer.sourceId === id;
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
        this.layerSettings = $.grep(this.layerSettings, function(layer) {
            return layer.sourceId !== id;
        });
    },    
    
	/**
	 * @description Builds the body section of a single TileLayerAccordion entry. NOTE: width and height must be hardcoded for slider to function properly.
	 * @param {Object} layer The new layer to add
	 * @see <a href="http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f">This discussion thread</a> for explanation.
	 */
	_buildEntryBody: function (layer) {
		var id, options, opacitySlide, obs, inst, det, meas, fits;
		
		id = layer.htmlId;
		options = this.options;
		
		// Opacity slider placeholder
		opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
		opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id + "' style='width: 120px; height: 8px;'>";
		opacitySlide += "</div>";
				
		// Populate list of available observatories
		obs = "<div class=layer-select-label>Observatory: </div> ";
		obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'></select>";
        
        /**
		$.each(options.observatories, function (i, o) {
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
		inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'></select>";
        
        /**
		$.each(options.instruments, function (i, o) {
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
		det += "<select name=detector class=layer-select id='detector-select-" + id + "'></select>";
        
        /**
		$.each(options.detectors, function (i, o) {
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
		meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'></select><br><br>";
        
        /**
		$.each(options.measurements, function (i, o) {
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
		title = $('<span class="section-header">Overlays</span>').css({'float': 'left'});
		addLayerBtn = $('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'});
		this.container.append($('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append($('<div id="TileLayerAccordion-Container"></div>'));
		
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
		var toggleVisibility, removeLayer, showFITS, visible, icon, accordion, ids, self = this,
			visibilityBtn = $("#visibilityBtn-" + layer.htmlId),
			removeBtn     = $("#removeBtn-" + layer.htmlId),
			fitsBtn       = $("#showFITSBtn-" + layer.htmlId);

		// Function for toggling layer visibility
		toggleVisibility = function (e) {
			visible = layer.toggleVisibility();
            $("#visibilityBtn-" + layer.htmlId).toggleClass('hidden');
            self.tileLayers.save();
			e.stopPropagation();
		};

		// Function for handling layer remove button
		removeLayer = function (e) {
			accordion = e.data;
            self.tileLayers.removeLayer(layer);
            
            accordion._removeTooltips(layer.htmlId);
			
			accordion.domNode.dynaccordion('removeSection', {id: layer.htmlId});
			accordion.removeLayerSettings(layer.sourceId);
            self.tileLayers.save();

			//accordion.layers = accordion.layers.without(layer.id);
			e.stopPropagation();
		};
		
		ids = ["#observatory-select-" + layer.htmlId, "#instrument-select-" + layer.htmlId, "#detector-select-" + layer.htmlId, "#measurement-select-" + layer.htmlId];

		// Event handlers for select items
        /**
		$.each($('#' + layer.htmlId + ' > div > select'), function (i, item) {
			$(item).change(function (e) {
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
		});**/

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
        
		dialogId = "fits-header-" + layer.htmlId;
		
		// Check to see if a dialog already exists
		if ($("#" + dialogId).length !== 0) {
            if (!$("#" + dialogId).dialog("isOpen"))
                $("#" + dialogId).dialog("open");
            else
                $("#" + dialogId).dialog("close");
                
            return;
        }
		
		// Ajax Responder
		callback = function (response) {

			// Format results
			formatted =  "<div id='" + dialogId + "' style='overflow: auto; position: relative; padding:0px'>";
            formatted += "<div class='fits-regular'>";
			$.each(response, function () {
				formatted += this + "<br>";
			});
			formatted += "</div>"
            
            // Store a sort version as well
            formatted += "<div class='fits-sorted' style='display: none;'>";
            $.each(response.sort(), function () {
				formatted += this + "<br>";
			});
            
            formatted += "</div></div>";
            
   			$("body").append(formatted);

            // Button to toggle sorting
            sortBtn = "<span class='fits-sort-btn'>Abc</span>";
            $("#" + dialogId).append(sortBtn);    
            $("#" + dialogId + " > span").click(function() {
                $(this).toggleClass("italic");
    			$("#" + dialogId + " .fits-sorted").toggle();
       			$("#" + dialogId + " .fits-regular").toggle();
            });
                            
			$("#" + dialogId).dialog({
				autoOpen: true,
				title: "FITS Header: " + layer.name,
				width: 400,
				height: 350,
				draggable: true
			});
		};
		
        // Request parameters
        params = {
			action: "getJP2Header",
			uri: layer.uri
        }
        
        $.post("api/index.php", params, callback, "json");
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
     * @description Initialize custom tooltips for each icon in the accordion
     */
    _setupTooltips: function (id) {
        var items = [
            "#visibilityBtn-" + id,
            "#removeBtn-"     + id
		],

		hv = this.controller;
		$.each(items, function () {
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
        
        $.each(ids, function () {
			$(this).unbind();
		});
    },

    
    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    updateTimeStamp: function (layer) {
		var domNode, date, timeDiff, timestep;
		
        date     = new Date(getUTCTimestamp(layer.date));
        timeDiff = (date.getTime() - this.controller.date.getTime()) / 1000;
		timestep = this.controller.timeIncrementSecs;
        
    	domNode = $("#" + layer.htmlId).find('.timestamp').html(layer.date.replace(/-/g,"/"));
        domNode.removeClass("timeAhead timeBehind timeSignificantlyOff");
        
      	if (Math.abs(timeDiff) > (4 * timestep))
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
		$(id).find(".tile-accordion-header-left").html(desc);
	}    
});


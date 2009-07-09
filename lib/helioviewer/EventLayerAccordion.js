/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileOverview Contains the class definition for an EventLayerAccordion class.
 * @see EventLayer, LayerManager, TileLayerAccordion
 * @requires ui.dynaccordion.js
 * 
 * Syntax: jQuery, Prototype
 */
/*global Class, EventLayerAccordion, $, jQuery, Ajax, Event, EventLayer, Hash, IconPicker, Layer */
var EventLayerAccordion = Class.create(Layer,
	/** @lends EventLayerAccordion.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new EventLayerAccordion
	 * @param {Object} viewport A reference to Helioviewer's viewport.
	 * @param {String} containerId The ID of the container where the EventLayerAccordion should be placed.
	 */
	initialize: function (viewport, containerId) {
		this.viewport = viewport;
		this.container = jQuery('#' + containerId);
		
		// Default icons
		this.eventIcons = this.viewport.controller.userSettings.get('eventIcons');

		// Setup menu UI components
		this._setupUI();
		
		// Setup icon-picker
		this.iconPicker = new IconPicker('event-icon-menu');

		// Initialize accordion
		this.domNode = jQuery('#EventLayerAccordion-Container');
		this.domNode.dynaccordion();

		// Get Event Catalogs
		this.getEventCatalogs();
	},

	/**
	 * @description Adds a new entry to the event layer accordion
	 * @param {Object} layer EventLayer to add to the accordion.
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var catalog = this.eventCatalogs.get(layer.catalog),		
			etype = catalog.eventType.gsub(' ', '_'),
			icon, visibilityBtn, removeBtn, head, body;
		
		layer.icon = this.eventIcons[catalog.id] || 'small-blue-circle';
		
		icon = "<span class=accordion-header-divider>|</span><button class='event-accordion-icon' id='event-icon-" + layer.id + "' title=' - Select an icon to use for this event' style='background: url(images/events/" + layer.icon + "-" + etype + ".png);'></button>";
		visibilityBtn = "<span class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' title=' - Toggle layer visibility'></span>";
		removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + layer.id + "' type=button title=' - Remove layer'></span>";
		head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + icon + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		body = '<div style="color: white; position: relative;">' + catalog.description + '</div>';

		// Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

        // Add tooltip
        this._setupTooltips(layer.id);

		// Event-handlers
		this._setupEventHandlers(layer);
	},

	/**
	 * @description Get a list of the available event catalogs.
	 */
	getEventCatalogs: function () {
		//@TODO: Move this to the new layer manager.
		
		// Ajax responder
		var processResponse = function (transport) {
			var lm = this.viewport.controller.layerManager,
				catalogs = transport.responseJSON,
				self = this
			
			if (typeof(catalogs) !== "undefined") {
				this.eventCatalogs = new Hash();
				
				catalogs.each(function (catalog) {
					//Ignore EIT Activity reports for the time being
					if (catalog.id !== "EITPlanningService::EITActivity") {
						self.eventCatalogs.set(catalog.id, catalog);
					}
				});
				
				//Initial catalogs to load
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "VSOService::cmelist",
					eventAccordion: this
				}));
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "GOESXRayService::GOESXRay",
					eventAccordion: this
				}));
				lm.addLayer(new EventLayer(this.viewport, {
					catalog: "VSOService::noaa",
					eventAccordion: this,
					windowSize: 86400
				}));
			} else {
				this._catalogsUnavailable();
			}
		},

		xhr = new Ajax.Request(this.viewport.controller.api, {
			method: "POST",
			parameters: { action: "getEventCatalogs" }, 
			onSuccess: processResponse.bind(this)
		});
	},

	/**
	 * @description Setup empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span class="section-header">Features/Events</span>').css({'float': 'left'}),
			addLayerBtn = jQuery('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'}),
			self = this;
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="EventLayerAccordion-Container"></div>'));
		
		// Event-handlers
		addLayerBtn.click(function () {
			if (typeof(self.eventCatalogs) !== "undefined") {
				//Populate select-box
				var select = self._buildCatalogSelect(),
				
					okayBtn = "<button>Ok</button>",
				
					//Add to accordion
					tmpId = 'tmp' + new Date().getTime();
				self.domNode.dynaccordion("addSection", {
					id: tmpId,
					header: '<div class="layer-Head">Select catalog to use:</div>',
					cell: select + okayBtn,
					open: true
				});
				
				// Swap out for feature/event catalog when user changes
				Event.observe($(tmpId).select('button').first(), 'click', function (e) {
					var select = $(tmpId).select('select').first();
					self.domNode.dynaccordion('removeSection', {
						id: tmpId
					});
					self.viewport.controller.layerManager.addLayer(new EventLayer(self.viewport, {
						catalog: select.value,
						eventAccordion: self
					}));
				});
			} else {
				//Do nothing
			}
		});
	},
	
	/**
	 * @description Builds a SELECT menu with all the catalogs not already displayed.
	 */
	_buildCatalogSelect: function () {
		var self = this,
			select = "<select class='event-layer-select' style='margin:5px;'>";

		this.eventCatalogs.each(function (catalog) {
			if (!self.viewport.controller.layerManager.hasEventCatalog(catalog.key)) {
				select += "<option value=" + catalog.key + ">" + catalog.value.name + "</option>";
			}
		});
		select += "</select>";
		
		return select;
	},
	
	/**
	 * @description Display error message to let user know service is down.
	 */
	_catalogsUnavailable: function () {
		// Handle button
		$('eventAccordion').select('a.dark')[0].update("");
		
		// Error message
		var head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'>Currently Unavailable</div>",
			body = "<span style='color: #FFF;'>Helioviewer's Feature/Event catalog system is currently unavailable. Please try again later.</span>";
		this.domNode.dynaccordion("addSection", {
            id: 404,
            header: head,
            cell: body,
            open: true
        });
	},
    
    /**
     * @description Initialize custom tooltips for each icon in the accordion
     */
    _setupTooltips: function (id) {
        var items = $A([
			"#event-icon-"    + id,
            "#visibilityBtn-" + id,
            "#removeBtn-"     + id
		]),

		hv = this.viewport.controller;
		items.each(function (item) {
			hv.addToolTip(item, {yOffset: -125});
		});
    },
    
    /**
     * @description Unbinds event-hanlders relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        var ids = $A([
			"#event-icon-"    + id,
            "#visibilityBtn-" + id,
            "#removeBtn-"     + id
		]);
        
        ids.each(function (id) {
			jQuery(id).unbind();
		});
    },

	/**
	 * @description Sets up UI-related event handlers
	 * @param {Object} layer EventLayer being added to the accordion.
	 */
	_setupEventHandlers: function (layer) {
		var visibilityBtn = jQuery("#visibilityBtn-" + layer.id),
			removeBtn = jQuery("#removeBtn-" + layer.id),
			eventIcon = jQuery("#event-icon-" + layer.id),
			self = this,

		/**
		 * @inner
		 * @description Toggles layer visibility
		 * @param {Object} e jQuery Event Object.
		 */
		toggleVisibility = function (e) {
			var visible = layer.toggleVisibility(),
				icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')');
			e.stopPropagation();
		},

		/**
		 * @inner
		 * @description Layer remove button event-handler
		 * @param {Object} e jQuery Event Object.
		 */
		removeLayer = function (e) {
			var self = e.data;
			self.viewport.controller.layerManager.removeLayer(layer);
            self._removeTooltips(layer.id);
			self.domNode.dynaccordion('removeSection', {id: layer.id});
			e.stopPropagation();
		},
		
		/**
		 * @inner
		 * @description Icon selection menu event-handler
		 * @param {Object} e jQuery Event Object.
		 */
		showIconMenu = function (e) {
			layer = e.data;
			self.iconPicker.toggle(layer, jQuery(this).position());
			e.stopPropagation();
		};

		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
		eventIcon.bind('click', layer, showIconMenu);
	}
});


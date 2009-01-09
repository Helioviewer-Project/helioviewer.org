/**
 * @fileoverview Contains the class definition for an EventLayerAccordion class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class EventLayerAccordion
 *
 * syntax: jQuery, Prototype
 *
 * @see EventLayer, LayerManager, TileLayerAccordion
 * @requires ui.dynaccordion.js
 */
var EventLayerAccordion = Class.create(Layer, {
	initialize: function (viewport, containerId) {
		this.viewport = viewport;
		this.container = jQuery('#' + containerId);
		
		// Default icons
		this.eventIcons = this.viewport.controller.userSettings.get('event-icons');

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
	 * @function
	 * @description Adds a new entry to the event layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var catalog = this.eventCatalogs.get(layer.catalog);
		
		var etype = catalog.eventType.gsub(' ', '_');
		layer.icon = this.eventIcons[catalog.id] || 'small-blue-circle';
		
		var icon = "| <button class='event-accordion-icon' id='event-icon-" + layer.id + "' style='background: url(images/events/" + layer.icon + "-" + etype + ".png);'></button>";
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + icon + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white; position: relative;">' + catalog.description + '</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Event-handlers
		this._setupEventHandlers(layer);
	},

	//@TODO: Move this to the new layer manager.
	getEventCatalogs: function () {

		// Ajax responder
		var processResponse =function(transport) {
			var lm = this.viewport.controller.layerManager;
			catalogs = transport.responseJSON;
			
			if (typeof(catalogs) !== "undefined") {
				this.eventCatalogs = new Hash();
				
				var self = this;
				catalogs.each(function(catalog){
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
		};

		var xhr = new Ajax.Request(this.viewport.controller.eventAPI, {
			method: "POST",
			parameters: { action: "getEventCatalogs" }, 
			onSuccess: processResponse.bind(this)
		});
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span class="accordion-title">Features/Events</span>').css({'float': 'left'});
		var addLayerBtn = jQuery('<a href=# class=gray>[Add]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div id="EventLayerAccordion-Container"></div>'));
		
		// Event-handlers
		var self = this;
		addLayerBtn.click(function() {
			if (typeof(self.eventCatalogs) !== "undefined") {
				//Populate select-box
				var select = self._buildCatalogSelect();
				
				var okayBtn = "<button>Ok</button>";
				
				//Add to accordion
				var tmpId = 'tmp' + new Date().getTime();
				self.domNode.dynaccordion("addSection", {
					id: tmpId,
					header: '<div class="layer-Head">Select catalog to use:</div>',
					cell: select + okayBtn,
					open: true
				});
				
				// Swap out for feature/event catalog when user changes
				Event.observe($(tmpId).select('button').first(), 'click', function(e){
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
	 * @function
	 * @description Builds a SELECT menu with all the catalogs not already displayed.
	 */
	_buildCatalogSelect: function () {
		var self = this;
			
		var select = "<select class='event-layer-select' style='margin:5px;'>";
		this.eventCatalogs.each(function(catalog) {
			if (!self.viewport.controller.layerManager.hasEventCatalog(catalog.key)) {
				select += "<option value=" + catalog.key + ">" + catalog.value.name + "</option>";
			}
		});
		select += "</select>";
		
		return select;
	},
	
	/**
	 * @function
	 * @description Display error message to let user know service is down.
	 */
	_catalogsUnavailable: function () {
		// Handle button
		$('eventAccordion').select('a.gray')[0].update("");
		
		// Error message
		var head = "<div class='layer-Head'>Currently Unavailable</div>";
		var body = "<span style='color: #FFF;'>Helioviewer's Feature/Event catalog system is currently unavailable. Please try again later.</span>";
		this.domNode.dynaccordion("addSection", {id: 404, header: head, cell: body});
	},

	/**
	 * @function
	 * @description
	 */
	_setupEventHandlers: function (layer) {
		visibilityBtn = jQuery("#visibilityBtn-" + layer.id);
		removeBtn = jQuery("#removeBtn-" + layer.id);
		eventIcon = jQuery("#event-icon-" + layer.id);
		
		var self = this;

		// Function for toggling layer visibility
		var toggleVisibility = function (e) {
			var visible = layer.toggleVisible();
			var icon = (visible ? 'LayerManagerButton_Visibility_Visible.png' : 'LayerManagerButton_Visibility_Hidden.png');
			jQuery("#visibilityBtn-" + layer.id).css('background', 'url(images/blackGlass/' + icon + ')' );
			e.stopPropagation();
		};

		// Function for handling layer remove button
		var removeLayer = function (e) {
			var self = e.data;
			self.viewport.controller.layerManager.removeLayer(layer);
			self.domNode.dynaccordion('removeSection', {id: layer.id});
			e.stopPropagation();
		};
		
		// Setup icon selection menu event-handlers
		var showIconMenu = function (e) {
			layer = e.data;
			self.iconPicker.toggle(layer, jQuery(this).position());
			e.stopPropagation();
		}

		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
		eventIcon.bind('click', layer, showIconMenu);
	}
});


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

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
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
		
		var icon = "<button class='event-accordion-icon " + catalog.eventType.gsub(' ', '_') + "'></button>";
		var visibilityBtn = "|<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + icon + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">' + catalog.description + '</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Work-around: adjust the height of the accordion section header to handle overflow
		//var h = $(layer.id).select('.event-accordion-header-left').first().getHeight();
		//$(layer.id).select('.layer-Head').first().setStyle({'height': h + 'px'});

		// Event-handlers
		this._setupEventHandlers(layer);
	},


	//@TODO: Move this to the new layer manager.
	getEventCatalogs: function () {
		var self = this;
		var url = "getEvents.php";

		jQuery.getJSON(url, function(catalogs) {
			var lm = self.viewport.controller.layerManager;
			
			self.eventCatalogs = new Hash();
			catalogs.each(function (catalog) {
				self.eventCatalogs.set(catalog.id, catalog);

				//Ignore EIT Activity reports for the time being
				if (catalog.id !== "EITPlanningService::EITActivity") {
					if (catalog.id == "VSOService::noaa")
						lm.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self, windowSize: 86400}));
					else
						lm.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self}));
				}
			});



			//Initial catalogs to load
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::cmelist", eventAccordion: self}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::type2cme",  eventAccordion: self}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::noaa",  eventAccordion: self, windowSize: 86400}));
			//lm.addLayer(new EventLayer(self.viewport, {catalog: "CACTusService::CACTus",  eventAccordion: self}));

		});
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span class="accordion-title">Features/Events</span>').css({'float': 'left'});
		//var addLayerBtn = jQuery('<a href=#>[Add Events]</a>').css({'margin-right': '14px', 'color': '#9A9A9A', 'text-decoration': 'none', 'font-style': 'italic', 'cursor': 'default'});
		//this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append('<br>'));

		var innerContainer = jQuery('<ul id=EventLayerAccordion></ul>');
		var outerContainer = jQuery('<div id="EventLayerAccordion-Container"></div>').append(innerContainer);
		this.container.append(outerContainer);
	},

	/**
	 * @function
	 * @description
	 */
	_setupEventHandlers: function (layer) {
		visibilityBtn = jQuery("#visibilityBtn-" + layer.id);
		removeBtn = jQuery("#removeBtn-" + layer.id);

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

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	}
});


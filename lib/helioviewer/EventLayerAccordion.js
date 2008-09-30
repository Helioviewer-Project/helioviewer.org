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

		//Keep track of layer ID's (eventually will be layermanager's job)
		this.layers = $A([]);
	},

	/**
	 * @function
	 * @description Adds a new entry to the event layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var catalog = this.eventCatalogs.get(layer.catalog);
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=event-accordion-header-left>" + catalog.name + "</span><span class=event-accordion-header-right>" + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">' + catalog.description + '</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Work-around: adjust the height of the accordion section header to handle overflow
		//var h = $(layer.id).select('.event-accordion-header-left').first().getHeight();
		//$(layer.id).select('.layer-Head').first().setStyle({'height': h + 'px'});

		// Event-handlers
		this._setupEventHandlers(layer);

		//Add layer ID
		this.layers.push(layer.id);
	},


	//@TODO: Move this to the new layer manager.
	getEventCatalogs: function () {
		var self = this;
		var url = "static_data/eventCatalogs.json";

		jQuery.getJSON(url, function(catalogs) {
			self.eventCatalogs = new Hash();
			catalogs.each(function (catalog) {
				self.eventCatalogs.set(catalog.id, catalog);

				//Ignore EIT Activity reports for the time being
				//if (catalog.id !== "EITPlanningService::EITActivity") {
				//	self.viewport.addLayer(new EventLayer(self.viewport, {catalog: catalog.id, eventAccordion: self}));
				//}
			});

			//Initial catalogs to load
			self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::cmelist", eventAccordion: self}));
			self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::type2cme",  eventAccordion: self}));
			self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "VSOService::noaa",  eventAccordion: self, windowSize: 86400}));
			self.viewport.addLayer(new EventLayer(self.viewport, {catalog: "CACTusService::CACTus",  eventAccordion: self}));

		});
	},

	hasId: function (id) {
		return (this.layers.grep(id).length > 0 ? true : false);
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty event layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span>Events</span>').css({'float': 'left', 'color': 'black', 'font-weight': 'bold'});
		var addLayerBtn = jQuery('<a href=#>[Add Events]</a>').css({'margin-right': '14px', 'color': '#9A9A9A', 'text-decoration': 'none', 'font-style': 'italic', 'cursor': 'default'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));

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
			self.viewport.controller.layerManager.remove(self, layer);
			self.domNode.dynaccordion('removeSection', {id: layer.id});

			self.layers = self.layers.without(layer.id);

			e.stopPropagation();
		};

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
	}
});


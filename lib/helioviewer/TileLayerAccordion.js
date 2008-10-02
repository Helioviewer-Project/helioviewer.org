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
	 * @param {Viewport} Reference to the viewport.
     * @param {Dom-node} The outermost continer where the layer  manager user interface should be constructed.
	 */
	initialize: function (viewport, containerId) {
		this.viewport = viewport;
		this.container = jQuery('#' + containerId);

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#TileLayerAccordion-Container');
		this.domNode.dynaccordion();

		//Keep track of layer ID's (eventually will be layermanager's job)
		this.layers = $A([]);
	},

	/**
	 * @function
	 * @description Adds a new entry to the tile layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=tile-accordion-header-left>" + layer.detector + " " + layer.measurement + "</span><span class=tile-accordion-header-right>" + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">Body...</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Work-around: adjust the height of the accordion section header to handle overflow
		//var h = $(layer.id).select('.tile-accordion-header-left').first().getHeight();
		//$(layer.id).select('.layer-Head').first().setStyle({'height': h + 'px'});

		// Event-handlers
		this._setupEventHandlers(layer);

		//Add layer ID
		this.layers.push(layer.id);
	},

	hasId: function (id) {
		return (this.layers.grep(id).length > 0 ? true : false);
	},

	/**
	 * @function _setupUI
	 * This method handles setting up an empty tile layer accordion.
	 */
	_setupUI: function () {
		// Create a top-level header and an "add layer" button
		var title = jQuery('<span>Layers</span>').css({'float': 'left', 'color': 'black', 'font-weight': 'bold'});
		var addLayerBtn = jQuery('<a href=# class=gray>[Add Layer]</a>').css({'margin-right': '14px'});
		this.container.append(jQuery('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));

		var innerContainer = jQuery('<ul id=TileLayerAccordion></ul>');
		var outerContainer = jQuery('<div id="TileLayerAccordion-Container"></div>').append(innerContainer);
		this.container.append(outerContainer);
		
        // Event-handlers
        //Event.observe(this.addLayerBtn, 'click', this.onAddLayerClick.bind(this));
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
	},
	
	/**
	 * @function
	 */
	updateTimeStamps: function () {
        this.menuEntries.each(function (menuEntry) {
            menuEntry.updateTimeStamp();
        });
    }
});


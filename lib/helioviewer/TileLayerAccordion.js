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
		this.container = jQuery('#' + containerId);

		//Setup menu UI components
		this._setupUI();

		//Initialize accordion
		this.domNode = jQuery('#TileLayerAccordion-Container');
		this.domNode.dynaccordion();
		
		//Individual layer menus
		this.menuEntries = new Hash();

	},

	/**
	 * @function
	 * @description Adds a new entry to the tile layer accordion
	 */
	addLayer: function (layer) {
		// Create accordion entry header
		var visibilityBtn = "<button class='layerManagerBtn visible' id='visibilityBtn-" + layer.id + "' value=true type=button title='toggle layer visibility'></button>";
		var removeBtn = "<button class='layerManagerBtn remove' id='removeBtn-" + layer.id + "' type=button title='remove layer'></button>";
		var head = "<div class=layer-Head><span class=tile-accordion-header-left>" + layer.detector + " " + layer.measurement + "</span><span class=tile-accordion-header-right><span class=timestamp></span> |" + visibilityBtn + removeBtn + "</span></div>";

		// Create accordion entry body
		var body = '<div style="color: white;">Body...</div>';

		//Add to accordion
		this.domNode.dynaccordion("addSection", {id: layer.id, header: head, cell: body});

		// Keep a reference to the dom-node
		//this.menuEntries.push({id: layer.id, header: head, cell: body});
		this.menuEntries.set(layer.id, {header: head, body: body});

		// Event-handlers
		this._setupEventHandlers(layer);
		
		// Update timestamp
		this.updateTimeStamp(layer);
	},

	/**
	 * @function
	 * @description Checks to see if the given layer is listed in the accordion 
	 */
	hasId: function (id) {
		return (this.menuEntries.keys().grep(id).length > 0 ? true : false);
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
		var self = this;
		var hv = this.layerManager.controller;
        addLayerBtn.click(function() {
			self.layerManager.addLayer(new TileLayer(hv.viewports[0], { tileUrlPrefix: hv.tileUrlPrefix, observatory: 'soho', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));        	
        });
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
			var accordion = e.data;
			accordion.layerManager.removeLayer(layer);
			accordion.domNode.dynaccordion('removeSection', {id: layer.id});
			accordion.menuEntries.unset(layer.id);

			//accordion.layers = accordion.layers.without(layer.id);

			e.stopPropagation();
		};

		//visibilityBtn.click(toggleVisibility);
		visibilityBtn.bind('click', this, toggleVisibility);
		removeBtn.bind('click', this, removeLayer);
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
        var ts = this.layerManager.controller.timeStepSlider.timestep.numSecs;
        
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
    }
    
});


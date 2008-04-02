/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */

/**
 * @class LayerConfigurator Represents a configuration interface for a single layer provider.
 * TODO: Configure marker layers (which tile layer they are linked to).
 */
var LayerConfigurator = Class.create();

LayerConfigurator.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
	}),
	
	/**
	 * @constructor
	 * @param {TileLayerProvider} layerProvider	The layer provider to configure.
	 * @param {Hash} options					For future use.
	 */
	initialize: function(layerProvider, options) {
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);

        this.className = "LayerConfigurator";
		this.layerProvider = layerProvider;

		//layerProvider.layerConfigurator = this;
		//document.sunImageChange.subscribe(layerProvider.onImageChange, layerProvider, true);

		//if (layerProvider.type == 'TileLayerProvider') {
		//	this.imageSelect = new SelectByDateMenu();
		//	layerProvider.observe(this.imageSelect, 'ImageChange');
    	//}
	},
	
	/**
	 * @method createTableRow	Creates a HTML table row element for this configurator.
	 * @return {HTML Element}	The HTML table row element.
	 */
	createTableRow: function() {
		var row = new Element('tr');
		this.domNode = row;
		this.createElements(row);
		return row;
	},
	
	/**
	 * @method createElements		Creates the user interface HTML elements for the row given.
	 * @param {HTML Element} row	The HTML table row element.
	 */
	createElements: function(row) {
		if (this.layerProvider.type == 'TileLayerProvider') {
			numberOfTileLayers++;
			var menu = this.createTableCells();
			row.appendChild(menu.instrument);
			row.appendChild(menu.year);
			row.appendChild(menu.month);
			row.appendChild(menu.day);
			row.appendChild(this.createOpacityControl());
		} else if (this.layerProvider.type == 'OverlayLayerProvider') {
			var desc = new Element('td', {colSpan:'5'}).update('Overlay Layer');
			row.appendChild(desc);
		} else if (this.layerProvider.type == 'MarkerLayerProvider') {
			numberOfMarkerLayers++;
            var desc = new Element('td', {colSpan:'5'}).update('Marker Layer');
			row.appendChild(desc);
		}

		row.appendChild(this.createEnabledBox());
		row.appendChild(this.createRemoveControl());
		row.appendChild(this.createMoveControls(true, true /* !this.layerProvider.isBottom(), !this.layerProvider.isTop() */));
	},
	
    /**
	 * @method createTableCells	Creates the table cells containing the drop-down menus. (PORTED FROM SBDM)
	 * @return {Hash}			A Hash containing an entry for each drop-down cell.
	 */
	createTableCells: function() {
		var htmlElement = new Element('span', {'class': 'selectByDateMenu'});
		this.domNode = htmlElement;
		this.createMenuElements();
		return {
			instrument: new Element('td', {'class': 'layerConfigurator'}).update(this.instrumentHtmlElement),
			year: new Element('td', {'class': 'layerConfigurator'}).update(this.yearHtmlElement),
			month: new Element('td', {'class': 'layerConfigurator'}).update(this.monthHtmlElement),
			day: new Element('td', {'class': 'layerConfigurator'}).update(this.dayHtmlElement),
			image: new Element('td', {'class': 'layerConfigurator'}).update(this.imageElement)
		};
	},
	
    /**
	 * @method createMenuElements	Creates the drop-down menus. (PORTED FROM SBDM)
	 */
	createMenuElements: function() {
		this.instrumentHtmlElement = new Element('select', {id: this.domNode.id + '.InstrumentSel'});
		this.yearHtmlElement = new Element('select', {id: this.domNode.id + '.YearSel'});
		this.monthHtmlElement = new Element('select', {id: this.domNode.id + '.MonthSel'});
		this.dayHtmlElement = new Element('select', {id: this.domNode.id + '.DaySel'});
		
		return this;
	},
	
	/**
	 * @method createEnabledBox	Creates the enabled/disabled cell.
	 * @return {HTML Element}	The enabled/disabled cell.
	 */
	createEnabledBox: function() {
		var enabledTd = new Element('td').setStyle({ 
		    textAlign: 'center'
		});
		var enabled = new Element('input', {type:'checkbox', checked:'true'});
		var enabledClick = this.toggleLayerEnabled.bind(this);
		Event.observe(enabled, 'click', function() { enabledClick(this.checked); });
		enabledTd.appendChild(enabled);
		this.enabledBox = enabled;
		return enabledTd;
	},
	
	/**
	 * @method createOpacityControl	Creates the opacity control cell.
	 * @return {HTML Element}		The opacity control cell.
	 */
	createOpacityControl: function() {
		var opacityTd = new Element('td').setStyle({
		    textAlign: 'center'
		});
		var opacityInput = new Element('input', {size:'3', value:Math.round(this.layerProvider.opacity * 100)});
		var opacityInputChange = this.layerProvider.setOpacity.bind(this.layerProvider);
		Event.observe(opacityInput, 'change', function() { opacityInputChange(parseInt(this.value) / 100); });
		opacityTd.appendChild(opacityInput);
		opacityTd.insert('%');
		return opacityTd;
	},

	/**
	 * @method createRemoveControl	Creates the remove layer control cell.
	 * @return {HTML Element}		The remove layer control cell.
	 */
	createRemoveControl: function() {
		var removeTd = new Element('td').setStyle({
		    textAlign: 'center'
		});
		var removeLayerControl = new Element('a', {'class':'control1', 'href':'#'}).update('[ - ]');
		var removeLayer = this.removeLayer.bind(this)
		Event.observe(removeLayerControl, 'click', function() {
			removeLayer();
			return false;
		});
		removeTd.appendChild(removeLayerControl);
		return removeTd;
	},
	
	/**
	 * @method createMoveControls	Creates the "move down/up" controls. Up means up in the layer ordering, which means down in the list.
	 * @param {Boolean} down		Whether to create the "move down" control.
	 * @param {Boolean} up			Whether to create the "move up" control.
	 */
	createMoveControls: function(down, up) {
		var moveTd = new Element('td').setStyle({
		    textAlign: 'center'
		});
		if (down) {
			var downControl = new Element('a', {'class':'control1', 'href':'#'}).update('[&uarr;]');
			Event.observe(downControl, 'click', this.move.bind(this, -1));
			moveTd.appendChild(downControl);
		}
		if (up && down) moveTd.insert('\u00a0');
		if (up) {
		    var upControl = new Element('a', {'class':'control1', 'href':'#'}).update('[&darr;]');
			Event.observe(upControl, 'click', this.move.bind(this, +1));
			moveTd.appendChild(upControl);
		}
		return moveTd;
	},

	move: function(dir) {
		if (dir > 0) {
		// Move up
			this.layerProvider.moveUp();
		} else if (dir < 0) {
		// Move down
			this.layerProvider.moveDown();
		}
	},
	
	/**
	 * @function onZoomLevelChange Event handler for zoom level changes.
	 * @param {Integer} newZoomLevel the new zoom level to be used.
	 */
	 onZoomLevelChange: function (newZoomLevel) {
		//this.layerProvider.setZoomOffset(newZoomLevel);
	    document.zoomLevelChange.fire(newZoomLevel, this);
	 },
	
	/**
	 * @method removeLayer	Removes this layer from the tile container.
	 */
	removeLayer: function() {
		if (this.layerProvider.type == 'TileLayerProvider')
		{
			numberOfTileLayers--;
		}
		else if (this.layerProvider.type == 'MarkerLayerProvider')
		{
			numberOfMarkerLayers--;
		}
		this.layerProvider.layerConfigurator = null;
		this.layerProvider.removeFromTileContainer();
		this.layerProvider = null;
	},
	
	/**
	 * @method setLayerStyle	Sets a CSS style property on the layer.
	 * @param {String} style	The CSS style property name.
	 * @param {Object} value	The CSS style property value
	 */
	setLayerStyle: function(style, value) {
		var h = {};
		h[style] = value;
		this.layerProvider.setStyle(h);
	},
	
	/**
	 * @method toggleLayerEnabled	Enables or disables a layer.
	 * @param {Boolean} enabled		Whether to enable or disable the layer.
	 */
	toggleLayerEnabled: function(enabled) {
		this.layerProvider.toggleVisible(enabled);
		var inputs = $A($(this.domNode.getElementsByTagName('input'))).concat($A($(this.domNode.getElementsByTagName('select'))));
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i] != this.enabledBox) {
				inputs[i].disabled = !enabled;
			}
		}
	}
});

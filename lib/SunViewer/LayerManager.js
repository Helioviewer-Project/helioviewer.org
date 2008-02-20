/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Lists the available layers (=layer providers) in the 
 * browser. The user can add and remove them as well as change some of
 * their properties.
 * TODO: Create new marker layers, link them to a tile layer.
 */
var LayerManager = Class.create();

LayerManager.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
	}),

	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The tile container that contains the layers.
	 * @param {String} elementId			The ID of the HTML element.
	 * @param {Hash} options				For future use.
	 */
	initialize: function(tileContainer, elementId, options) {
		this.tileContainer = tileContainer;
		this.layerConfigurators = $A([]);
		this.big = false;
		
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		this.observe(tileContainer, 'LayerAdded');
		this.observe(tileContainer, 'LayerRemoved');
		
		if (elementId && $(elementId)) {
			this.domNode = $(elementId);
			this.createElements();
			this.addEffects();
		}
		// TODO: get already existent layers
	},

	/**
	 * @method addEffects	Adds the maximize/minimize effects.
	 */
	addEffects: function() {
		var smallDimensions = { width: this.domNode.style.width, height: this.domNode.style.height };
		var growingFinished = function() {
			active = false; this.big = true;
			this.toggleButton.innerHTML = '&nbsp;-&nbsp;';
		};
		var shrinkingFinished = function() {
			active = false; this.big = false;
			this.toggleButton.innerHTML = '&nbsp;+&nbsp;';
			this.domNode.parentNode.style.zIndex--;
		};
		var active = false;
		//var big = false;
		var toggleButton = this.toggleButton;
		var mouseClickHandler = function(e) {
			Event.stop(e);
			if (active) return;
			active = true;
			if (this.big) {
				new Effect.Morph(this.domNode, {
					style: {
						width: smallDimensions.width,
						height: smallDimensions.height
					},
					duration: 0.5,
					afterFinish: shrinkingFinished.bind(this)
				});
			} else {
				var dimensions = $(this.div).getDimensions();
				this.domNode.parentNode.style.zIndex++;
				new Effect.Morph(this.domNode, {
					style: {
						width: dimensions.width + 'px',
						height: dimensions.height + 'px'
					},
					duration: 0.5,
					afterFinish: growingFinished.bind(this)
				});
			}
		};

		Event.observe(this.toggleButton, 'click', mouseClickHandler.bindAsEventListener(this));
		Event.observe(this.toggleButton, 'mousedown', Event.stop);
	},

	/**
	 * @method createHtmlElement	Creates the layer manager HTML element.
	 * @return {HTML Element}		The layer manager HTML element.
	 */
	createHtmlElement: function() {
		var htmlElement = new Element('div', {'class': 'layerManager'});
		this.domNode = htmlElement;
		this.createElements();
		return htmlElement;
	},
	
	/**
	 * @method createElements	Creates the elements of the layer manager user interface.
	 */
	createElements: function() {
		var div = new Element('div').setStyle({
			width: '700px',
			position: 'relative'
		});
		this.div = div;
		var header = new Element('table', {width: '100%', cellSpacing: '0', cellPadding: '0' });
		var headerRow = new Element('tr');
		header.appendChild(headerRow);
		var headerL = new Element('td').setStyle({
			verticalAlign: 'middle'
		});
		var headerR = new Element('td').setStyle({
			textAlign: 'right'
		});
		headerRow.appendChild(headerL);
		headerRow.appendChild(headerR);

        //Layer Menu Toggle Button
		this.toggleButton = new Element('div', {'class': 'control2', 'href': '#'}).update('&nbsp;+&nbsp;');
		this.toggleButton.setStyle({
			border: '1px solid black',
			cssFloat: 'left',
			display: 'inline',
			width: '15px',
			textAlign: 'center',
			marginRight: '5px',
			cursor: 'pointer'
		});
		headerL.appendChild(this.toggleButton);
		
		//Toggle Button Label
		var h = new Element('span').update('Layers').setStyle({
			fontSize: '14px',
			verticalAlign: 'middle',
			fontWeight: 'bold'
		});
		
        //Add layers button
		headerL.appendChild(document.createTextNode(' '));
		headerL.appendChild(h);
		var newLayerControl = new Element('a', {'class': 'control1', 'href': '#'}).update('[&nbsp;+&nbsp;]&nbsp;Add&nbsp;layer');
		newLayerControl.setStyle({
			marginLeft: '20px'
		});

		var addNewLayer = this.addNewLayer.bind(this)
		Event.observe(newLayerControl, 'click', function() {
			addNewLayer();
			return false;
		});
		headerR.appendChild(newLayerControl);
		//divR.appendChild(newLayerControl);
		//divH.appendChild(divL);
		//divH.appendChild(divR);
		
		var table = new Element('table', {cellSpacing: '0', width:'600'});
    	var tbody = new Element('tbody');
		var thead = new Element('thead');
		var tr = new Element('tr');
		LayerManager.Columns.each(function(header) {
			var th = new Element('th').update(header[0]).setStyle({
				backgroundColor: '#CCCCCC'
			});
			tr.appendChild(th);
		});
		
		thead.appendChild(tr);
		table.appendChild(thead);
		table.appendChild(tbody);
		this.tbody = tbody;
		//div.appendChild(divH);
		div.appendChild(header);
		div.appendChild(new Element('br'));
	    div.appendChild(new Element('br'));
		div.appendChild(table);
		this.domNode.appendChild(div);
	},
	
	/**
	 * @method addNewLayer	Adds a new layer (provider) to the tile container.
	 */
	addNewLayer: function() {
		// NOTE: Use this to create new layers at half the opacity of the previous layer
		//var opacity = (this.tileContainer.tileLayerProviders.compact().length > 0 ? this.tileContainer.tileLayerProviders.compact().last().opacity/2 : 1);
		var opacity = 1;
		var newLayer = new TileLayerProvider(this.tileContainer, { opacity: opacity });
	},
	
	/**
	 * @method addLayer							Adds a layer (provider) to the list.
	 * @param {TileLayerProvider} layerProvider	The layer provider to be added.
	 */
	addLayer: function(layerProvider) {
		var layerConfigurator = new LayerConfigurator(layerProvider);
		this.layerConfigurators[layerProvider.zIndex] = layerConfigurator;
		//layerProvider.tableRow = this.tbody.appendChild(layerConfigurator.createTableRow());
		this.tbody.appendChild(layerConfigurator.createTableRow());
		this.observe(layerProvider, 'Exchange');
		if (this.big) {
			var dimensions = $(this.div).getDimensions();
			this.domNode.setStyle({
				width: dimensions.width + 'px',
				height: dimensions.height + 'px'
			});	
		}
	},
		
	/**
	 * @method removeLayer						Removes a layer (provider) from the list.
	 * @param {TileLayerProvider} layerProvider	The layer provider to remove.
	 */
	removeLayer: function(layerProvider) {
		//this.layerConfigurators[layerProvider.zIndex].domNode.remove();
        //Debug.output(this.layerConfigurators[layerProvider.zIndex]);
		this.layerConfigurators[layerProvider.zIndex].domNode.remove();
		//layerProvider.tableRow = null;
		if (layerProvider.zIndex == this.layerConfigurators.length-1)
			this.layerConfigurators.length--;
		else
			this.layerConfigurators.layerProvider = null;
		if (this.big) {
			var dimensions = $(this.div).getDimensions();
			Element.setStyle(this.domNode, {
				width: dimensions.width + 'px',
				height: dimensions.height + 'px'
			});	
		}
	},
	
	/**
	 * Event handler: layer added
	 * @param {TileLayerProvider} layerProvider	The added layer provider.
	 */
	onLayerAdded: function(layerProvider) {
		//Debug.output("LAYER ADDED - LayerManager");
		this.addLayer(layerProvider);
	},
	
	/**
	 * Event handler: layer removed
	 * @param {TileLayerProvider} layerProvider	The removed layer provider.
	 */
	onLayerRemoved: function(layerProvider) {
		this.removeLayer(layerProvider);
	},
	
	/**
	 * Event handler: layers exchanged
	 * @param {TileLayerProvider[]} layerProviders The exchanged layer providers.
	 */
	onExchange: function(layerProviders) {
		// Exchange the layer configurators, too
		var temp = this.layerConfigurators[layerProviders[0].zIndex];
		this.layerConfigurators[layerProviders[0].zIndex] = this.layerConfigurators[layerProviders[1].zIndex];
		this.layerConfigurators[layerProviders[1].zIndex] = temp;
		
		var parent = this.layerConfigurators[layerProviders[0].zIndex].domNode.parentNode;
		var oldNodes = [this.layerConfigurators[layerProviders[0].zIndex].domNode, this.layerConfigurators[layerProviders[1].zIndex].domNode];
		var nextSiblings = [oldNodes[0].nextSibling, oldNodes[1].nextSibling];

		// Exchange the table rows
		if (nextSiblings[0] && oldNodes[1] != nextSiblings[0])
			parent.insertBefore(oldNodes[1], nextSiblings[0]);
		else if (oldNodes[1] != nextSiblings[0])
			parent.appendChild(oldNodes[1]);

		if (nextSiblings[1] && oldNodes[0] != nextSiblings[1])
			parent.insertBefore(oldNodes[0], nextSiblings[1]);
		else if (oldNodes[0] != nextSiblings[1])
			parent.appendChild(oldNodes[0]);
		
		this.layerConfigurators[layerProviders[0].zIndex].update('zIndex');
		this.layerConfigurators[layerProviders[1].zIndex].update('zIndex');
	}
});

// The columns shown in the layer manager user interface
LayerManager.Columns = $A([
	['#', 16],
	['Year', 80],
	['Month', 62],
	['Day', 62],
	['Image', 270],
	['Opacity', 30],
	['Zoom+', 25],
	['Enbl.', 20],
	['Rem.', 20],
	['Move', 30]
]);

/**
 * @classDescription Represents a configuration interface for a single layer provider.
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

		this.layerProvider = layerProvider;
		//layerProvider.layerConfigurator = this;

		if (layerProvider.type == 'TileLayerProvider') {
			this.imageSelect = new SelectByDateMenu();
			
			layerProvider.observe(this.imageSelect, 'ImageChange');
		}
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

	update: function(property) {
		var value = this.layerProvider[property];
		if (property == 'zIndex') {
			this.nr.innerHTML = value;
		}
	},
	
	/**
	 * @method createElements		Creates the user interface HTML elements for the row given.
	 * @param {HTML Element} row	The HTML table row element.
	 */
	createElements: function(row) {
		row.appendChild(this.createNr());

		if (this.layerProvider.type == 'TileLayerProvider') {
			var menu = this.imageSelect.createTableCells();
			row.appendChild(menu.year);
			row.appendChild(menu.month);
			row.appendChild(menu.day);
			row.appendChild(menu.image);
			row.appendChild(this.createOpacityControl());
			row.appendChild(this.createZoomOffsetControl());
		} else if (this.layerProvider.type == 'OverlayLayerProvider') {
			var desc = new Element('td', {colSpan:'6'}).update('Overlay Layer');
			row.appendChild(desc);
		} else if (this.layerProvider.type == 'MarkerLayerProvider') {
            var desc = new Element('td', {colSpan:'6'}).update('Marker Layer');
			row.appendChild(desc);
		}

		row.appendChild(this.createEnabledBox());
		row.appendChild(this.createRemoveControl());
		row.appendChild(this.createMoveControls(true, true /* !this.layerProvider.isBottom(), !this.layerProvider.isTop() */));
	},
	
	/**
	 * @method createNr			Creates the Nr. cell.
	 * @return {HTML Element}	The Nr. cell.
	 */
	createNr: function() {
		this.nr = new Element('td', {'class': 'layerConfigurator'}).update(this.layerProvider.zIndex);
		return this.nr;
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
		var percentSign = document.createTextNode('%');
		opacityTd.appendChild(percentSign);
		return opacityTd;
	},
	
	/**
	 * @method createZoomOffsetControl	Creates the zoom offset control cell.
	 * @return {HTML Element}			The zoom offset control cell.
	 */
	createZoomOffsetControl: function() {
		var zoomOffsetTd = new Element('td').setStyle({
		    textAlign: 'center'
		});
		var zoomOffsetInput = new Element('input', {size:'2', value:this.layerProvider.zoomOffset});
		var zoomOffsetInputChange = this.layerProvider.setZoomOffset.bind(this.layerProvider);
		Event.observe(zoomOffsetInput, 'change', function() { zoomOffsetInputChange(parseInt(this.value)); });
		zoomOffsetTd.appendChild(zoomOffsetInput);
		return zoomOffsetTd;
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
		if (up && down) moveTd.appendChild(document.createTextNode('\u00a0'));
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
	 * @method removeLayer	Removes this layer from the tile container.
	 */
	removeLayer: function() {
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

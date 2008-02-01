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
		
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
		
		this.observe(tileContainer, 'LayerAdded');
		this.observe(tileContainer, 'LayerRemoved');
		
		if (elementId && document.getElementById(elementId)) {
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
		var htmlElement = document.createElement('div');
		htmlElement.className = 'layerManager';
		this.domNode = htmlElement;
		this.createElements();
		return htmlElement;
	},
	
	/**
	 * @method createElements	Creates the elements of the layer manager user interface.
	 */
	createElements: function() {
		var div = document.createElement('div');
		this.div = div;
		div.setStyle({
			'width': '680px',
			'position': 'relative'
		});
		var header = document.createElement('table');
		header.width = '100%';
		header.cellSpacing = 0;
		header.cellPadding = 0;
		var headerRow = document.createElement('tr');
		header.appendChild(headerRow);
		var headerL = document.createElement('td');
		headerL.setStyle({
			'vertical-align': 'middle'
		});
		var headerR = document.createElement('td');
		headerR.setStyle({
			'text-align': 'right'
		});
		headerRow.appendChild(headerL);
		headerRow.appendChild(headerR);

		this.toggleButton = document.createElement('div');
		this.toggleButton.className = 'control2';
		this.toggleButton.href = '#';
		this.toggleButton.innerHTML = '&nbsp;+&nbsp;';
		this.toggleButton.setStyle({
			border: '1px solid black',
			'float': 'left',
			display: 'inline',
			width: '15px',
			'text-align': 'center',
			'margin-right': '5px',
			'cursor': 'pointer'
		});
		headerL.appendChild(this.toggleButton);
		var h = document.createElement('span');
		h.setStyle({
			'font-size': '14px',
			'vertical-align': 'middle',
			'font-weight': 'bold'
		});		
		h.innerHTML = 'Layers';
		//headerL.innerHTML = '<b>Layers:</b>';
		headerL.appendChild(document.createTextNode(' '));
		headerL.appendChild(h);
		var newLayerControl = document.createElement('a');
		newLayerControl.setStyle({
			'margin-left': '20px'
		});
		newLayerControl.className = 'control1';
		newLayerControl.href = '#';
		newLayerControl.innerHTML = '[&nbsp;+&nbsp;]&nbsp;Add&nbsp;layer';
		var addNewLayer = this.addNewLayer.bind(this)
		Event.observe(newLayerControl, 'click', function() {
			addNewLayer();
			return false;
		});
		headerR.appendChild(newLayerControl);
		//divR.appendChild(newLayerControl);
		//divH.appendChild(divL);
		//divH.appendChild(divR);
		var table = document.createElement('table');
		table.cellSpacing = '0';
		table.width = 600;
		var tbody = document.createElement('tbody');
		var thead = document.createElement('thead');
		var tr = document.createElement('tr');
		LayerManager.Colums.each(function(header) {
			var th = document.createElement('th');
			th.setStyle({
				'background-color': '#CCCCCC'
			});
			th.innerHTML = header[0];
			tr.appendChild(th);
		});
		
		thead.appendChild(tr);
		table.appendChild(thead);
		table.appendChild(tbody);
		this.tbody = tbody;
		//div.appendChild(divH);
		div.appendChild(header);
		div.appendChild(document.createElement('br'));
		div.appendChild(document.createElement('br'));
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
Debug.output(this.layerConfigurators[layerProvider.zIndex]);
		this.layerConfigurators[layerProvider.zIndex].domNode.remove();
		//layerProvider.tableRow = null;
		if (layerProvider.zIndex == this.layerConfigurators.length-1)
			this.layerConfigurators.length--;
		else
			this.layerConfigurators.layerProvider = null;
		if (this.big) {
			var dimensions = $(this.div).getDimensions();
			this.domNode.setStyle({
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
		Debug.output("LAYER ADDED - LayerManager");
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

// The colums shown in the layer manager user interface
LayerManager.Colums = $A([
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
		Object.extend(this, this.defaultOptions);
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
		var row = document.createElement('tr');
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
			var desc = document.createElement('td');
			desc.colSpan = 6;
			row.appendChild(desc);
			desc.innerHTML = 'Overlay Layer';
		} else if (this.layerProvider.type == 'MarkerLayerProvider') {
			var desc = document.createElement('td');
			desc.colSpan = 6;
			desc.innerHTML = 'Marker Layer';
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
		this.nr = document.createElement('td');
		this.nr.className = 'layerConfigurator';
		this.nr.innerHTML = this.layerProvider.zIndex;
		return this.nr;
	},
	
	/**
	 * @method createEnabledBox	Creates the enabled/disabled cell.
	 * @return {HTML Element}	The enabled/disabled cell.
	 */
	createEnabledBox: function() {
		var enabledTd = document.createElement('td');
		enabledTd.setStyle({ 'text-align': 'center' });
		var enabled = document.createElement('input');
		enabled.type = 'checkbox';
		enabled.checked = true;
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
		var opacityTd = document.createElement('td');
		opacityTd.setStyle({ 'text-align': 'center' });
		var opacityInput = document.createElement('input');
		opacityInput.size = 3;
		opacityInput.value = Math.round(this.layerProvider.opacity * 100);
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
		var zoomOffsetTd = document.createElement('td');
		zoomOffsetTd.setStyle({ 'text-align': 'center' });
		var zoomOffsetInput = document.createElement('input');
		zoomOffsetInput.size = 2;
		zoomOffsetInput.value = this.layerProvider.zoomOffset;
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
		var removeTd = document.createElement('td');
		removeTd.setStyle({ 'text-align': 'center' });
		var removeLayerControl = document.createElement('a');
		removeLayerControl.className = 'control1';
		removeLayerControl.href = '#';
		removeLayerControl.innerHTML = '[ - ]';
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
		var moveTd = document.createElement('td');
		moveTd.setStyle({ 'text-align': 'center' });
		if (down) {
			var downControl = document.createElement('a');
			downControl.className = 'control1';
			downControl.href = '#';
			downControl.innerHTML = '[&uarr;]';
			Event.observe(downControl, 'click', this.move.bind(this, -1));
			moveTd.appendChild(downControl);
		}
		if (up && down) moveTd.appendChild(document.createTextNode('\u00a0'));
		if (up) {
			var upControl = document.createElement('a');
			upControl.className = 'control1';
			upControl.href = '#';
			upControl.innerHTML = '[&darr;]';
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
		var inputs = $A(this.domNode.getElementsByTagName('input')).concat($A(this.domNode.getElementsByTagName('select')));
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i] != this.enabledBox) {
				inputs[i].disabled = !enabled;
			}
		}
	}
});

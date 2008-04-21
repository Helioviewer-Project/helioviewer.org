/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */

/**
 * @class LayerManager Lists the available layers (=layer providers) in the 
 * browser. The user can add and remove them as well as change some of
 * their properties.
 * TODO: Create new marker layers, link them to a tile layer.
 */
 /*global document, Class, $, $A, $H, Element, Event, Effect, Debug, TileLayerProvider, LayerConfigurator */
var LayerManager = Class.create();

LayerManager.prototype = {

	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The tile container that contains the layers.
	 * @param {String} elementId			The ID of the HTML element.
	 * @param {Hash} options				For future use.
	 */
	initialize: function (tileContainer, elementId, options) {
	    this.className = "LayerManager";
		this.tileContainer = tileContainer;

		this.layerConfigurators = $A([]);
		
		//Menu should be hidden by default
		this.expanded = false;

		Object.extend(this, options);
		
		//Setup event handlers for Layer Manager (calls onLayerAdded and onLayerRemoved)
		document.layerAdded.subscribe(this.onLayerAdded, this, true);
		document.layerRemoved.subscribe(this.onLayerRemoved, this, true);

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
	addEffects: function () {
	    var active = false;
		var smallDimensions = { width: this.domNode.style.width, height: this.domNode.style.height };
		var growingFinished = function () {
			active = false;
			this.expanded = true;
			this.toggleButton.innerHTML = '&nbsp;-&nbsp;';
		};
		var shrinkingFinished = function () {
			active = false;
			this.expanded = false;
			this.toggleButton.innerHTML = '&nbsp;+&nbsp;';
			//this.domNode.parentNode.style.zIndex--;
		};
		var toggleButton = this.toggleButton;
		var mouseClickHandler = function (e) {
			Event.stop(e);
			if (active) {
			    return;
			}
			active = true;
			if (this.expanded) {
				var trash = new Effect.Morph(this.domNode, {
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
				var moretrash = new Effect.Morph(this.domNode, {
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
	 * @function createHtmlElement	Creates the layer manager HTML element.
	 * @return {HTML Element}		The layer manager HTML element.
	 */
	createHtmlElement: function () {
		var htmlElement = new Element('div', {'class': 'layerManager'});
		this.domNode = htmlElement;
		this.createElements();
		return htmlElement;
	},
	
	/**
	 * @function createElements	Creates the elements of the layer manager user interface.
	 */
	createElements: function () {
	    
	    //Create html element to hold expanded layer menu
		var div = new Element('div').setStyle({width: '380px', position: 'relative', zIndex: '3'});
		this.div = div;
		
		//Menu header row
		var header = new Element('div').setStyle({width: '100%'});
		var headerL = new Element('span').setStyle({verticalAlign: 'middle', cssFloat: 'left', width: '240px'});
		var headerR = new Element('span').setStyle({textAlign: 'right'});
		header.appendChild(headerL);
		header.appendChild(headerR);

        //Layer Menu Toggle Button
		this.toggleButton = new Element('div', {'class': 'control2', 'href': '#'}).update(' + ');
		this.toggleButton.setStyle({
			border:      '1px solid black',
			cssFloat:    'left',
			display:     'inline',
			width:       '15px',
			textAlign:   'center',
			marginRight: '5px',
			cursor:      'pointer'
		});
		headerL.appendChild(this.toggleButton);
		
		//Toggle Button Label
		var h = new Element('span').update(' Layers').setStyle({fontSize: '14px', verticalAlign: 'middle', fontWeight: 'bold'});
		
        //Toggle Layer Manager Button
		headerL.insert(h);

		var newLayerControl = new Element('a', {'class': 'control1', 'href': '#'}).update('[ + ] Add layer');
		newLayerControl.setStyle({
			marginLeft: '20px'
		});

		var addNewLayer = this.addNewLayer.bind(this);
		Event.observe(newLayerControl, 'click', function () {
			addNewLayer();
			return false;
		});
		headerR.appendChild(newLayerControl);
		
		var table = new Element('table', {cellSpacing: '0', width: '380'});
    	var tbody = new Element('tbody');
		var thead = new Element('thead');
		var tr = new Element('tr');
		LayerManager.Columns.each(function (header) {
			var th = new Element('th').update(header[0]).setStyle({
				backgroundColor: '#CCCCCC'
			});
			tr.appendChild(th);
		});
		
		thead.appendChild(tr);
		table.appendChild(thead);
		table.appendChild(tbody);
		this.tbody = tbody;

		div.appendChild(header);
		div.appendChild(new Element('br'));

		div.appendChild(table);
		this.domNode.appendChild(div);
	},
	
	/**
	 * @function addNewLayer	Adds a new layer (provider) to the tile container.
	 */
	addNewLayer: function () {
	    //Debug.output('LM: addNewLayer();');
		// NOTE: Use this to create new layers at half the opacity of the previous layer
		var opacity = (this.tileContainer.tileLayerProviders.compact().length > 0 ? this.tileContainer.tileLayerProviders.compact().last().opacity / 2 : 1);
		var newLayer = new TileLayerProvider(this.tileContainer, { 'opacity': opacity });
	},
	
	/**
	 * @function addLayer							Adds a layer (provider) to the list.
	 * @param {TileLayerProvider} layerProvider	The layer provider to be added.
	 */
	addLayer: function (layerProvider) {
	    //Debug.output('LM: addLayer();');
		var layerConfigurator = new LayerConfigurator(layerProvider);
		this.layerConfigurators[layerProvider.zIndex] = layerConfigurator;
		
		//layerProvider.tableRow = this.tbody.appendChild(layerConfigurator.createTableRow());
		this.tbody.appendChild(layerConfigurator.createTableRow());
		
		//Call onExchange when layers are moved up or down
		document.layerExchange.subscribe(this.onExchange.curry(layerProvider.id), this, true);

		if (this.expanded) {
			var dimensions = this.div.getDimensions();
			this.domNode.setStyle({
				width: dimensions.width + 'px',
				height: dimensions.height + 'px'
			});	
		}
	},
		
	/**
	 * @function removeLayer						Removes a layer (provider) from the list.
	 * @param {TileLayerProvider} layerProvider	The layer provider to remove.
	 */
	removeLayer: function (layerProvider) {
		this.layerConfigurators[layerProvider.zIndex].domNode.remove();
		if (layerProvider.zIndex === this.layerConfigurators.length - 1) {
		    this.layerConfigurators.length--;
		}
		else {
		    this.layerConfigurators.layerProvider = null;
		}
	
	    //Re-adjust size of layer manager
		if (this.expanded) {
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
	onLayerAdded: function (type, args) {
		//Debug.output("LM: onLayerAdded()");
		var layerProvider = args[0];
		this.addLayer(layerProvider);
	},
	
	/**
	 * Event handler: layer removed
	 * @param {TileLayerProvider} layerProvider	The removed layer provider.
	 */
	onLayerRemoved: function (type, args) {
	    var layerProvider = args[0];
		this.removeLayer(layerProvider);
	},
	
	/**
	 * Event handler: layers exchanged
	 * @param {String} id The id of the layer provider for which the exchange was initiated.
	 * @param {Object} type The type custom event fired, in this case "layerExchange." 
	 * @param {Array} args An array of additional arguments passed in. The only additional argument needed
	 *                     is a two-item hash, TileLayerProvider[], including the two providers to be swapped.
	 */
	onExchange: function (id, type, args) {
      	//YUI custom event arguments are stored in an array
		var layerProviders = args[0];
		
		//Only perform swap for the layer provider clicked on
		if (id === layerProviders[0].id) {
		    
		    // Exchange the layer configurators, too
		    var temp = this.layerConfigurators[layerProviders[0].zIndex];
    		this.layerConfigurators[layerProviders[0].zIndex] = this.layerConfigurators[layerProviders[1].zIndex];
    		this.layerConfigurators[layerProviders[1].zIndex] = temp;
    		
    		var parent = this.layerConfigurators[layerProviders[0].zIndex].domNode.parentNode;
    		var oldNodes = [this.layerConfigurators[layerProviders[0].zIndex].domNode, this.layerConfigurators[layerProviders[1].zIndex].domNode];
    		var nextSiblings = [oldNodes[0].nextSibling, oldNodes[1].nextSibling];
    
    		// Exchange the table rows
    		if (nextSiblings[0] && oldNodes[1] !== nextSiblings[0]) {
    			parent.insertBefore(oldNodes[1], nextSiblings[0]);
    		}
    		else if (oldNodes[1] !== nextSiblings[0]) {
    			parent.appendChild(oldNodes[1]);
    		}
    
    		if (nextSiblings[1] && oldNodes[0] !== nextSiblings[1]) {
    			parent.insertBefore(oldNodes[0], nextSiblings[1]);
    		}
    		else if (oldNodes[0] !== nextSiblings[1]) {
    			parent.appendChild(oldNodes[0]);
    		}
		}
	}
};

// The columns shown in the layer manager user interface
LayerManager.Columns = $A([
	['Instrument', 30],
	['Wavelength', 30],
	['Opacity', 30],
	['Enabled', 20],
	['Remove', 20],
	['Move', 30]
]);

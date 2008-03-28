/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class Overlay General overlay class. Enables to display
 * any HTML element at a position on the image.
 * Coordinate system is normalized to the interval [0,1]
 * (0,0) being the top right and (1,1) the bottom left
 * corner of the complete image.
 * @see OverlayLayerProvider
 * @see OverlayCollection
 */
var Overlay = Class.create();

Overlay.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
		scaleWhenZooming: false,
		scaleFactor: 1,
		className: 'overlay'
	}),

	/**
	 * @constructor
	 * @param {String} html			The HTML code that makes up the overlay.
	 * @param {SunImage} sunImage	The sunImage the overlay belongs to. Set date to null to indicate it belongs to all images.
	 * @param {Hash} options		Available options: position, offset, scaleWhenZooming, scaleFactor, dimensions
	 */
	initialize: function(html, sunImage, options) {
		this.html = html;
		this.sunImage = sunImage;
		this.position = { x: 0.5, y: 0.5 };
		this.offset = { x: 0, y: 0 };
		this.domNode = null;
		this.dimensions = { width: 0, height: 0 };
		//this.visible = false;
		
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		this.dimensions = { width: this.dimensions.width * this.scaleFactor, height: this.dimensions.height * this.scaleFactor };
		if (this.scaleWhenZooming)
			this.offset = { x: this.offset.x * this.scaleFactor, y: this.offset.y * this.scaleFactor };
	},

	/**
	 * @method scaleTo				Scales the overlay.
	 * @param {Number} scaleFactor	The factor by which to scale.
	 */	
	scaleTo : function(scaleFactor) {
		if (!this.dimensions) return;
		// e.g. DIV element
		if (this.domNode && this.domNode.style) {
			this.domNode.style.width = Math.round(this.dimensions.width * scaleFactor) + 'px';
			this.domNode.style.height = Math.round(this.dimensions.height * scaleFactor) + 'px';
		}
		// e.g. IMG element
		if (this.domNode && this.domNode.width && this.domNode.height) {
			this.domNode.width = Math.round(this.dimensions.width * scaleFactor);
			this.domNode.height = Math.round(this.dimensions.height * scaleFactor);
		}
	},
	
	/**
	 * @method getQuadrant	Gets the quadrant number in which the overlay is located.
	 * (left, top)
	 *  \
	 *   +--+--+ -
	 *   | 0| 1|  |
	 *   +--+--+  | size
	 *   | 2| 3|  |
	 *   +--+--+ -
	 * 
	 *   |_____|
	 *    size
	 *  
	 * @param {Number} left The x coordinate of the top left corner.
	 * @param {Number} top  The y coordinate of the top left corner.
	 * @param {Number} size The size of the sides.
	 * @return {Number}		The number of the quadrant.
	 */
	getQuadrant: function(left, top, size) {
		return (this.position.x < left + size/2 ? 0 : 1) + (this.position.y < top + size/2 ? 0 : 2);
	},
	
	/**
	 * @method appendTo				Appends the overlay HTML element(s) to a layer at the given position.
	 * @param {HTML Element} layer	The HTML element on which to append.
	 * @param {Object} x			The x coordinate in the HTML element in pixels.
	 * @param {Object} y			The y coordinate in the HTML element in pixels.
	 */
	appendTo: function(layer, x, y) {
		// The overlay HTML element
		var htmlElement = new Element('div', {'class':this.className}).update(this.html);
		
		// The black background
		bgElement = new Element('div', {'class':'blackBg'});

		htmlElement.appendChild(bgElement);

		// NOTE: This is rather crude, but I haven't found a better way
		// to center the label on the position yet...
		htmlElement.setStyle({
			position: 'absolute',
			cursor: 'pointer',
			left: Math.round(x + this.offset.x) + 'px',
			top: Math.round(y + this.offset.y) + 'px'
		});

		// Append the overlay HTML element
		this.domNode = layer.appendChild(htmlElement);

		// If this overlay has info HTML
		if (this.infoHtml) {
			// Show it when clicked on
			var handler = this.showInfo.bindAsEventListener(this, layer);
			Event.observe(htmlElement, 'mousedown', handler);
			$(htmlElement).setStyle({ cursor: 'pointer' });
		}
	},
	
	/**
	 * @method showInfo					Shows HTML information associated with an overlay.
	 * @param {DOM MouseEvent} e		The DOM MouseEvent.
	 * @param {HTML element} tileLayer	The parent node of the overlay HTML element.
	 */
	showInfo: function(e, tileLayer) {
		Event.stop(e);

		var localPos = {
			x: Math.round(parseFloat(this.domNode.style.left)) - this.offset.x,
			y: Math.round(parseFloat(this.domNode.style.top)) - this.offset.y
		};
		this.notifyListeners('ShowInfo', { id: this.html, html: this.infoHtml, layer: this.domNode.parentNode, position: this.position } );
	}
});


/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Represents a "bubble" mechanism that shows information in the
 * form of HTML content about an object on the sun.
 */
var InfoBubble = Class.create();

InfoBubble.prototype = Object.extend(new SunViewerWidget(), {
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer	The tile container that contains the info bubble.
	 */
	initialize: function(tileContainer) {
		this.position = { x: 0, y: 0 };
		this.tileContainer = tileContainer;
		this.createElements().observeElements();
		//this.observe(tileContainer.viewport, 'Move');
		document.observe('viewport:move', this.onMove.bindAsEventListener(this));
	},
	
	/**
	 * @method createElements	Creates the HTML elements that make up the info bubble.
	 */
	createElements: function() {
		this.bubbleLayer = new Element('div', {'class': 'infoBubble'});
		
		//Close Button
		this.closeX = new Element('a', {'class': 'closeX', href: '#'}).update('&nbsp;X&nbsp;');
		this.closeX.infoBubble = this;
		this.bubbleLayer.appendChild(this.closeX);

		this.infoContent = new Element('div', {'class': 'infoContent'});
		this.bubbleLayer.appendChild(this.infoContent);
		this.bubbleLayer.hide();
		this.tileContainer.domNode.appendChild(this.bubbleLayer);
		return this;
	},
	
	/**
	 * @method observeElements	Registers the event handlers.
	 */
	observeElements: function() {
		Event.observe(this.closeX, 'click', function() { this.infoBubble.hide(); return false; });
		Event.observe(this.bubbleLayer, 'mousedown', function(e) { Event.stop(e); });
		return this;
	},

	/**
	 * @method show					Shows the info bubble.
	 * @param {String} infoHtml	The
	 * TODO: Remove the following parameter
	 * @param {HTML Element} layer	Obsolete
	 * @param {Hash} position		The position of the element that the information is about.
	 */	
	show: function(infoHtml, layer, position) {
		this.position = {
			x: position.x,
			y: position.y + 10
		}
		this.bubbleLayer.setStyle({
			left: this.position.x + 'px',
			top: this.position.y + 'px'
		});
		this.infoContent.innerHTML = infoHtml;

		this.bubbleLayer.show();
	},
	
	/**
	 * @method hide	Hides the info bubble.
	 */
	hide: function() {
		this.bubbleLayer.hide();
	},
	
	/**
	 * Event handler: viewport move.
	 * Moves the info bubble along with the viewport.
	 * @param {Hash} motion	The viewport motion.
	 */
	onMove: function(motion) {
	    motion = motion.memo;
	    
		this.bubbleLayer.setStyle({
			left: (this.position.x + motion.x) + 'px',
			top: (this.position.y + motion.y) + 'px'
		});
		if (motion.stop) {
			this.position.x += motion.x;
			this.position.y += motion.y;
		}
	}
});

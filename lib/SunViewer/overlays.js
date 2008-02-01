/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription General overlay class. Enables to display
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
		
		Object.extend(this, this.defaultOptions);
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
		var htmlElement = document.createElement('div');
		htmlElement.className = this.className;
		htmlElement.innerHTML = this.html;
		
		// The black background
		bgElement = document.createElement('div');
		bgElement.className = 'blackBg';
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
		this.notifyListeners('ShowInfo', { html: this.infoHtml, layer: this.domNode.parentNode, position: this.position } );
	}
});

/**
 * @classDescription Helper class for the quadTree.
 * Specifies a branch. Defaults to a tree leaf (endsHere=true).
 */
var branchEnd = Class.create();

branchEnd.prototype = Object.extend([], {
	initialize: function() { this.endsHere=true; } 
});


/**
 * @classDescription 	Overlay Collection class.
 * @see 				Overlay
 */
var OverlayCollection = Class.create();

OverlayCollection.prototype = Object.extend(
  Object.extend($A([]), new SunViewerWidget()), {
  	
	/**
	 * @constructor
	 */
	initialize: function() {
		this.quadTree = [];
		this.quadTree.endsHere = true;
	},
	
	/**
	 * @method createOverlay		Creates a new Overlay and adds it to the collection.
	 * @param {String} html			The HTML code that makes up the overlay.
	 * @param {SunImage} sunImage	The sunImage the overlay belongs to. Set date to null to indicate it belongs to all images.
	 * @param {Hash} options		Available options: position, offset, scaleWhenZooming, scaleFactor, dimensions
	 * @see Overlay
	 */
	createOverlay: function(html, sunImage, options) {
		var overlay = new Overlay(html, sunImage, options);
		this.addOverlay(overlay);

		// Notify listeners
		this.notifyListeners('NewOverlay', overlay);
	},
	
	/**
	 * @method getOverlays		Returns the overlays for a tile at the given x and y index and zoom level.
	 * 							Utilizes a Quad Tree for storing them in sub-quadrants, so that they can be
	 * 							easily retrieved.
	 * @param {Number} xIndex	The x index of the tile.
	 * @param {Number} yIndex	The y index of the tile.
	 * @param {Number} level	The zoom level.
	 * @return {Overlay[]}		An Array of overlays on this tile.
	 */
	getOverlays: function(xIndex, yIndex, level) {
		if (level < 0			// Do not display overlays for zoom levels < 0
		 || xIndex < 0
		 || (xIndex > 0 && xIndex >= Math.max(0, 1 << level))
		 || yIndex < 0
		 || (yIndex > 0 && yIndex >= Math.max(0, 1 << level)))
			return [];
		
		var branch = this.quadTree;

		for(var l = 0; l < level; l++) {
			if (branch.endsHere) {
				if (branch.length == 0)	return [];
				// Put all the overlays for this quadrant into their corresponding sub-quadrants
				// divide this quadrant into 4 sub-quadrants
				var subQuads = [new branchEnd(),new branchEnd(),new branchEnd(),new branchEnd()];
				// the position and size of the quadrant
				var size = 1 / (1 << l);
				var x = (xIndex >> (level - l)) / (1 << l);
				var y = (yIndex >> (level - l)) / (1 << l);
				// each overlay is put into the corresponding sub-quadrant
				branch.each(function(overlay) {
					var q = overlay.getQuadrant(x,y,size);
					subQuads[q].push(overlay);
				});
				branch.length = 4;
				branch[0] = subQuads[0];
				branch[1] = subQuads[1];
				branch[2] = subQuads[2];
				branch[3] = subQuads[3];
				// now we have sub-quadrants
				branch.endsHere = false;
			}

			// Determine next quadrant
			var quadrant = ((xIndex >> (level - l - 1)) & 1) | ((yIndex >> (level - l - 1) << 1) & 2);

			// Step down the Quad-Tree
			branch = branch[quadrant];
		}

		// Return all the overlays in this quadrant (or its sub-quadrants)
		return branch.flatten();
	},
	
	/**
	 * @method addOverlay		Adds a new overlay to the collection.
	 * 							Also adds it in the correct place in the Quad Tree.
	 * @param {Overlay} overlay	The overlay to add.
	 */
	addOverlay: function(overlay) {
		this.push(overlay);
		var branch = this.quadTree;
		// Until we reach the end
		for(l = 0; !branch.endsHere; l++) {
			// Determine next quadrant
			var quadrant = (overlay.x * (1 << (l + 1)) & 1) | ((overlay.y * (1 << (l + 1)) << 1) & 2);
			// Step down the Quad-Tree
			branch = branch[quadrant];
		}
		// Add the overlay to this branch
		branch.push(overlay);
	},
	
	/**
	 * @method addOverlays			Adds a number of overlays to the collection.
	 * @param {Overlay[]} overlays	The overlays to add.
	 * @see OverlayCollection.addOverlays()
	 */
	addOverlays: function(overlays) {
		overlays.each(this.addOverlay.bind(this));
	},
	
	/**
	 * @method clear	Removes all overlays from the collection.
	 */
	clear: function() {
		this.quadTree = new branchEnd();
	}
});
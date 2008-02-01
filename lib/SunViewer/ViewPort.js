/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */


/**
 * @classDescription The ViewPort class corresponds to the visible rectangular area
 * the images are displayed in.
 * It uses TileContainers to display the images, and a Surface to move them.
 */
var ViewPort = Class.create();

ViewPort.prototype = Object.extend(new SunViewerWidget(), {
	// Default options. WARNING: No complex objects! They are references!
	// Otherwise all instances will share them
	defaultOptions: $H({
		zoomLevel: 0,
		maxZoomLevel: 5,
		minZoomLevel: 0,
		grabMouseCursor: (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'pointer' : (document.attachEvent ? 'url(grab.cur)' : '-moz-grab')),
		grabbingMouseCursor: (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'move' : (document.attachEvent ? 'url(grabbing.cur)' : '-moz-grabbing'))
	}),
	
	/**
	 * @constructor
	 * @param {String} elementId	The ID of the viewport HTML element.
	 * @param {Hash} options		Available options: zoomLevel, maxZoomLevel, minZoomLevel, grabMouseCursor, grabbingMouseCursor.
	 */
	initialize: function(elementId, options) {
		// Viewport HTML element DOM Node
		this.domNode = $(elementId);
		
		// Viewport position
		this.position = { x: 0, y: 0 };
		
		// A collection of TileContainers. The TileContainer objects
		// use this to determine their z-Index.
		this.tileContainers = Object.extend($A([]), {
			add: function(tileContainer) {
				this[tileContainer.zIndex] = tileContainer;
			},
			
			remove: function(tileContainer) {
				// TODO: Maybe rearrange tile layers zIndexes...
				this[tileContainer.zIndex] = null;
			},
			
			topZindex: function() {
				return this.compact().length > 0 ? this.compact().last().zIndex : 0;
			}
		});

/*		
		//If the viewport manages a collection of active images, it is 
		//able to determine the max/min zoom levels of all images
		
		this.activeImages = Object.extend($H([]), {
			add: function(sunImage) {
				//this[sunImage.fileDir] = sunImage;
				this.push(sunImage);
			},
			
			replace: function(oldImage, newImage) {
				this.remove(oldImage.fileDir);
				this.add(newImage);
			},
			
			getZoomLevelBoundariesOr: function() {
				return { min: this.pluck('minZoomLevel').min(), max: this.pluck('maxZoomLevel').max() };
			},
			
			getZoomLevelBoundariesAnd: function() {
				return { min: this.pluck('minZoomLevel').max(), max: this.pluck('maxZoomLevel').min() };
			}

		});
*/
		// Copy the default options as properties of this object
		Object.extend(this, this.defaultOptions);
		
		// Overwrite them with options specified as constructor parameters
		Object.extend(this, options);

		// Get width and height
		this.dimensions = this.domNode.getDimensions();

		// Get offset
		this.offset = Position.positionedOffset(this.domNode);
		
		// Center viewport
		this.position.x = Math.floor(this.dimensions.width / 2);
		this.position.y = Math.floor(this.dimensions.height / 2);
		this.center();

		// Create surface for moving the viewport.
		// It is actually behind the tiles until clicked,
		// so that there can be other clickable elements 
		// on the tiles
		this.surface = new Surface(this);
		var well = this.domNode.getElementsByClassName('well')[0];
		well.setStyle({
			cursor: this.grabMouseCursor
		});

		// When the well (contains the tiles) is clicked,
		// The surface is activated
		Event.observe(well, 'mousedown', this.surface.mousePressedHandler.bindAsEventListener(this.surface));
		
		// Center control
		var controls = this.domNode.getElementsByClassName('centerControl');
		for (var i = 0; i < controls.length; i++) {
			var control = controls[i];
			var clickHandler = this.center.bind(this);
			Event.observe(control, 'click', clickHandler.bind(this) );
		}

		// Register event listeners
		// TODO: React to resize event
		// Adjust number of tiles
		//Event.observe(window, 'resize', this.onResize.bind(this));
	},

	/**
	 * @method center	Centers the viewport.
	 */
	center: function() {
		var MoveX = this.dimensions.width / 2 -this.position.x;
		var MoveY = this.dimensions.height / 2 -this.position.y;
		this.notifyListeners('Move', { x: MoveX, y: MoveY });
		
		return this;
	},

	/**
	 * @method setMaxZoomLevel	Sets the maximum zoom level.
	 * @param {Number} level	The new maximum zoom level.
	 */
	setMaxZoomLevel: function(level) {
		if (this.maxZoomLevel != level) {
			this.maxZoomLevel = level;
			this.notifyListeners('MaxZoomLevelChange', level);
		}
		return this;
	},

	/**
	 * @method setZoomLevel		Sets the current zoom level.
	 * @param {Number} level	The new zoom level.
	 * @param {Object} source	The source that initiated the zooming, which isn't notified.
	 * @param {Boolean} force	Whether to use this zoom level even though it might be out of bounds.
	 */
	setZoomLevel: function(level, source, force) {
		if (!force) level = Math.max(this.minZoomLevel, Math.min(level, this.maxZoomLevel));
		
		if (this.zoomLevel != level) {
			var direction = level - this.zoomLevel;
			this.zoomLevel = level;
			
			var center = { x: Math.floor(this.dimensions.width / 2), y: Math.floor(this.dimensions.height / 2) };

			var before = {
				x: (center.x - this.position.x),
				y: (center.y - this.position.y)
			};
	
			var after = {
				x: Math.floor(before.x * Math.pow(2, direction)),
				y: Math.floor(before.y * Math.pow(2, direction))
			};
	
			this.position.x = center.x - after.x;
			this.position.y = center.y - after.y;
			
			this.notifyListeners('Zoom', level, source);
		}
		return this;
	},
	
	/**
	 * @method move				Moves the viewport.
	 * @param {Hash} motion		The amount of movement. motion = { x, y }
	 * @param {Object} source	The source that initiated the movement, which isn't notified.
	 */
	move: function(motion, source) {
		// fire move event
		Debug.output('Motion for X: '+ motion.x);
		Debug.output('Move - before x: ' + this.position.x);
		Debug.output('Move - before y: ' + this.position.y);
		this.notifyListeners('Move', motion, source);
		if (motion.stop) {
			Debug.output('Motion Stop');
			this.position.x += motion.x;
			this.position.y += motion.y;
		}
		Debug.output('Move - after x: ' + this.position.x);
		Debug.output('Move - after y: ' + this.position.y);
	},
	
	/**
	 * Zoom event handler.
	 * @param {Number} level	The new zoom level.
	 * @param {Object} source	The source that initiated the zooming, which isn't notified.
	 */
	onZoom: function(level, source) {
		this.setZoomLevel(level, source);
	},
	
	/**
	 * Move event handler.
	 * @param {Hash} motion			The amount of movement. motion = { x, y }
	 * @param {Object} firingWidget	The object that fired the move event, which isn't notified.
	 */
	onMove: function(motion, firingWidget) {
		this.move(motion, firingWidget);
	},
	
	/**
	 * Not implemented yet
	 */
	onResize: function() {
		this.dimensions = this.domNode.getDimensions();
		// TODO: adjust tiles, sth. like this
		//this.tileContainer.prepareTiles().positionTiles();
	}
});

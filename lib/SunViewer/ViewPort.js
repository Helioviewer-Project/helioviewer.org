/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */


/**
 * @class The ViewPort class corresponds to the visible rectangular area
 * the images are displayed in.
 * It uses TileContainers to display the images, and a Surface to move them.
 */
/*global document, Class, YAHOO, $, $$, $A, Event, navigator, Element, Surface, SunViewerWidget */
var ViewPort = Class.create();

ViewPort.prototype = Object.extend(new SunViewerWidget(), {
	// Default options. WARNING: No complex objects! They are references!
	// Otherwise all instances will share them
	defaultOptions: {
		zoomLevel: 0,
		maxZoomLevel: 10,
		minZoomLevel: 0,
		grabMouseCursor: (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'pointer' : (document.attachEvent ? 'url(grab.cur)' : '-moz-grab')),
		grabbingMouseCursor: (navigator.userAgent.search(/KHTML|Opera/i) >= 0 ? 'move' : (document.attachEvent ? 'url(grabbing.cur)' : '-moz-grabbing'))
	},
	
	/**
	 * @constructor
	 * @param {String} elementId	The ID of the viewport HTML element.
	 * @param {Hash} options		Available options: zoomLevel, maxZoomLevel, minZoomLevel, grabMouseCursor, grabbingMouseCursor.
	 */
	initialize: function (elementId, options) {
		// Viewport HTML element DOM Node
		this.domNode = $(elementId);
		
		// Viewport position
		this.position = { x: 0, y: 0 };
		
		// A collection of TileContainers. The TileContainer objects use this to determine their z-Index.
		this.tileContainers = Object.extend($A([]), {
			add: function (tileContainer) {
				this[tileContainer.zIndex] = tileContainer;
			},
			
			remove: function (tileContainer) {
				// TODO: Maybe rearrange tile layers zIndexes...
				this[tileContainer.zIndex] = null;
			},
			
			topZindex: function () {
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
		this.offset = Element.positionedOffset(this.domNode);
		
		// Center viewport
		this.position.x = Math.floor(this.dimensions.width / 2);
		this.position.y = Math.floor(this.dimensions.height / 2);
		this.center();

		// Create surface for moving the viewport.
		// It is actually behind the tiles until clicked,
		// so that there can be other clickable elements 
		// on the tiles
		this.surface = new Surface(this);

		var well = $('well1');
		well.setStyle({
		    cursor: this.grabMouseCursor
		});
		
		
		//Debug.output('this.grabMouseCursor: ' + this.grabMouseCursor);

		// When the well (contains the tiles) is clicked,
		// The surface is activated
		Event.observe(well, 'mousedown', this.surface.mousePressedHandler.bindAsEventListener(this.surface));
		
		// Center control
		var controls = $$('.centerControl');
		for (var i = 0; i < controls.length; i++) {
			var control = controls[i];
			var clickHandler = this.center.bind(this);
			Event.observe(control, 'click', clickHandler.bind(this));
		}

		// Register event listeners
		// TODO: React to resize event
		// Adjust number of tiles
		//Event.observe(window, 'resize', this.onResize.bind(this));
	},

	/**
	 * @function center	Centers the viewport.
	 * @return {ViewPort} Returns a reference to the viewport for which center was called.
	 */
	center: function () {
        this.position.x = Math.floor(this.dimensions.width / 2);
        this.position.y = Math.floor(this.dimensions.height / 2);
		document.fire('viewport:move', { x: 0, y: 0 });

		return this;
	},

	/**
	 * @function setMaxZoomLevel       Sets the maximum zoom level.
	 * @param {Number} level           The new maximum zoom level.
	 * @return {ViewPort}              Returns a reference to the viewport for which center was called.
	 */
	setMaxZoomLevel: function (level) {
		if (this.maxZoomLevel !== level) {
			this.maxZoomLevel = level;
			this.notifyListeners('MaxZoomLevelChange', level);
		}
		return this;
	},

	/**
	 * LEGACY
	 * @function setZoomLevel	Sets the current zoom level.
	 * @param {Number} level	The new zoom level.
	 * @param {Object} source	The source that initiated the zooming, which isn't notified.
	 * @param {Boolean} force	Whether to use this zoom level even though it might be out of bounds.
	 * @return {ViewPort}       Returns a reference to the viewport for which center was called.
	 */
	 
	setZoomLevel: function (level, source, force) {
	    //Debug.output("setZoomLevel(level = " + level + ", source=" + source + ")")
		if (!force) {
		    level = Math.max(this.minZoomLevel, Math.min(level, this.maxZoomLevel));
		}
		
		if (this.zoomLevel !== level) {
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
		}
		return this;
	},
	   
	
	/**
	 * @method move				Moves the viewport.
	 * @param {Hash} motion		The amount of movement. motion = { x, y }
	 * @param {Object} source	The source that initiated the movement, which isn't notified.
	 */
	move: function (motion, source) {
		// fire move event
		//Debug.output('Motion for X: '+ motion.x);
		//Debug.output('Move - before x: ' + this.position.x);
		//Debug.output('Move - before y: ' + this.position.y);
		
		document.fire('viewport:move', motion);
		
		// once the user stops dragging...
		if (motion.stop) {
			this.position.x += motion.x;
			this.position.y += motion.y;
			//Debug.output('Viewport::move() ... Stopped moving, position.x: ' + this.position.x + ' position.y: ' + this.position.y);
		}
	},
	
	/**
	 * LEGACY
	 * Zoom event handler.
	 * @param {Number} level	The new zoom level.
	 * @param {Object} source	The source that initiated the zooming, which isn't notified.
	 */
	onZoom: function (type, args) {
	    var level = args[0];
		this.setZoomLevel(level);
		//Debug.output("Viewport.js (213):: onZoom() -> Level: " + level);
	},
	
	/**
	 * Move event handler.
	 * @param {Hash} motion			The amount of movement. motion = { x, y }
	 * @param {Object} firingWidget	The object that fired the move event, which isn't notified.
	 */
	onMove: function (motion, firingWidget) {
	    //Debug.output("ViewPort->onMove()");
		this.move(motion, firingWidget);
	},
	
	/**
	 * Not implemented yet
	 */
	onResize: function () {
		this.dimensions = this.domNode.getDimensions();
		// TODO: adjust tiles, sth. like this
		//this.tileContainer.prepareTiles().positionTiles();
	}
});

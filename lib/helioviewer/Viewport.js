/*global Class, Object, $, UIElement, ViewportHandlers, Builder */
var Viewport = Class.create(UIElement, {
	defaultOptions: {
		zoomLevel: 0,
		headerId: 'middle-col-header',
		footerId: 'footer',
		prefetch: 512 //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
	},
	isMoving: false,
	dimensions:        { width: 0, height: 0 },

	/**
	 * @constructor
	 */
	initialize: function (controller, options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		this.domNode =   $(this.id);
		this.outerNode = $(this.id + '-container-outer');
		this.controller = controller;
		this.layers = $A([]);
		this.ViewportHandlers = new ViewportHandlers(this);

		// Combined height of the header and footer in pixels (used for resizing viewport vertically)
		this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

		// Determine center of viewport
		var center = this.getCenter();

		//create a master container to make it easy to manipulate all layers at once
		this.movingContainer = $(this.domNode.appendChild(Builder.node('div', {className: 'movingContainer'})));
		this.movingContainer.setStyle({'left': center.x + 'px', 'top': center.y + 'px', 'border': '1px solid red'});

		//DEBUG ONLY
		var centerBox = new Element('div', {style: 'position: absolute; width: 50px; height: 50px; border: 1px dashed red; '});
		centerBox.setStyle({'left': (center.x -25) + 'px', 'top': (center.y -25) + 'px'});
		this.domNode.insert(centerBox);

		//resize to fit screen
		this.resize();
	},
	
	/**
	 * @function center Center the viewport.
	 */
	center: function () {
		var center = this.getCenter();
		this.moveTo(center.x, center.y);
	},

	/**
	 * @function moveTo Move the viewport focus to a new location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */
	moveTo: function (x, y) {
		Debug.output("moveTo");
		
		this.movingContainer.setStyle({
			left: x + 'px',
			top:  y + 'px'    
		});
		
		this.fire('move', { x: x, y: y });
	},

	/**
	 * @function moveBy Shift in the viewport location.
	 * @param {int} x-value
	 * @param {int} y-value
	 */   
	moveBy: function (x, y) {
		//Debug.output("moveBy: " + x + ", " + y);
		var pos = {
			x: this.startMovingPosition.x + x,
			y: this.startMovingPosition.y + y
		};
		this.movingContainer.setStyle({
			left: pos.x + 'px',
			top:  pos.y + 'px'    
		});
		
		this.fire('move', { x: pos.x, y: pos.y });
	},
	
	startMoving: function () {
		this.startMovingPosition = this.getContainerPos();
	},
	
	/**
	 * @function getCenter
	 * @description Get the coordinates of the viewport center
	 */
	getCenter: function () {
		return {
			x: Math.round(this.domNode.getWidth() / 2),
			y: Math.round(this.domNode.getHeight() / 2)
		}
	},
	
	/**
	 * @function getContainerPos
	 * @description Get the current coordinates of the moving container
	 */
	getContainerPos: function () {
		return {
			x: parseInt(this.movingContainer.getStyle('left')),
			y: parseInt(this.movingContainer.getStyle('top'))
		}
	},
	
	//TEMP ALIAS
	currentPosition: function () {
		return this.getContainerPos();
	},
		
	endMoving: function () {

	},
	
	/*
	moveContainerBy: function (x, y) {
		this.containerPosition = {
			x: this.containerStartMovingPosition.x + x,
			y: this.containerStartMovingPosition.y + y
		};
		this.movingContainer.setStyle({
			left: this.containerPosition.x + 'px',
			top:  this.containerPosition.y + 'px'    
		});
	},
	
	moveContainerTo: function (x, y) {
		this.containerPosition.x += x;
		this.containerPosition.y += y;

		this.movingContainer.setStyle({
			left: this.containerPosition.x + 'px',
			top:  this.containerPosition.y + 'px'    
		});
	},*/
	
	zoomToAt: function (zoomLevel, zoomPointCoordinates) {
			Debug.output("zoomToAt");
		// multiplier
		var m = Math.pow(2, -zoomLevel + this.zoomLevel);
		
		// zoom
		this.zoomLevel = zoomLevel;
		
		// move the viewport so that its center is on the same point as before
		var newZoomPointCoordinates = {
			x: m * zoomPointCoordinates.x,
			y: m * zoomPointCoordinates.y
		};
		
		// reset the layers
		this.resetLayers();
	},
	
	zoomInAt: function (zoomPointCoordinates) {
		this.zoomToAt(this.zoomLevel - 1, zoomPointCoordinates);
	},
	
	zoomOutAt: function (zoomPointCoordinates) {
				Debug.output("zoomOutAt");
		this.zoomToAt(this.zoomLevel + 1, zoomPointCoordinates);
	},
	
	zoomTo: function (zoomLevel) {
		Debug.output("zoomTo");
		//temporarily hard-coded for testing purposes (06-10-08)...
		var LASCO_MIN_ZOOMLEVEL = 12;
		
		//Debug.output("zoomLevel: " + zoomLevel);
		if (zoomLevel == LASCO_MIN_ZOOMLEVEL - 1) {
			//this.fire('info', "There is no more LASCO C2s data available at this zoom-level.");
		}
		this.zoomToAt(zoomLevel, this.getContainerPos());
	},
	
	zoomIn: function () {
		this.zoomTo(this.zoomLevel - 1);
	},

	zoomOut: function () {
		this.zoomTo(this.zoomLevel + 1);
	},

	resize: function () {
		// get dimensions
		var oldDimensions = this.dimensions;

		//Update viewport height
		var viewportOuter =  this.outerNode;
		viewportOuter.setStyle ({height: document.viewport.getHeight() - this.headerAndFooterHeight + 'px'});

			this.dimensions = this.domNode.getDimensions();
			
			this.dimensions.width += this.prefetch;
			this.dimensions.height += this.prefetch;
			
			if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
				this.resetLayers();
			}
	},
	
	addLayer: function (layer) {
		this.layers.push(layer);
	},
	
	removeLayer: function (layer) {
		layer.domNode.remove();
		this.layers = this.layers.without(layer);
	},
	
	reload: function () {
	    this.layers.each(function (layer) {
	    	layer.reload();
	    });
	},

	resetLayers: function () {
		this.layers.each(function (layer) {
			layer.reset();
		});
	},

	getMaxZoomLevel: function () {
		if (this.layers[0].maxZoomLevel) {
			return this.layers[0].maxZoomLevel;
		}
		return 0;
	},

	getMinZoomLevel: function () {
		if (this.layers[0].minZoomLevel) {
			return this.layers[0].minZoomLevel;
		}
		return 0;
	}
});

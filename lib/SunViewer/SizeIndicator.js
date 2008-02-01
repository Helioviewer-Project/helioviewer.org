/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription A user resizable interface element that shows physical dimensions.
 */
var SizeIndicator = Class.create();
 
SizeIndicator.prototype = Object.extend(new SunViewerWidget(), {
	/**
	 * @constructor		
	 * @param {String} elementId						The ID of the viewport HTML element.
	 * @param {TileLayerProvider} imageLayerProvider	The image tile layer provider that is used as a basis for the calculations.
	 * @param {Hash} options							Available options: imgLsrc, imgMsrc, imgRsrc, imgHeight, width, 
	 */
	initialize: function(elementId, imageLayerProvider, options) {
		// Default options
		this.imgLsrc = 'images/icons/sizeIndicatorL.gif';
		this.imgMsrc = 'images/icons/sizeIndicatorM.gif';
		this.imgRsrc = 'images/icons/sizeIndicatorR.gif';
		this.imgHeight = 10;
		this.width = 100;

		this.pressed = false;
		this.mark = { x: 0, y: 0 };
		this.moves = 0;

		// Constructor parameters
		this.domNode = $(elementId);
		this.imageLayerProvider = imageLayerProvider;
		this.zoomLevel = imageLayerProvider.tileContainer.viewport.zoomLevel;
		this.zoomOffset = imageLayerProvider.zoomOffset;

		var pos = Position.positionedOffset(this.domNode);
		this.position = { left: pos[0], top: pos[1] };

		this.observe(imageLayerProvider, 'ImageChange');
		this.observe(imageLayerProvider, 'ZoomOffsetChange');
		this.observe(imageLayerProvider.tileContainer.viewport, 'Zoom');

		Object.extend(this, options);

		this.img = document.createElement('div');
		this.img.setStyle({
			margin: '0px 0px 0px 0px',
			height: this.imgHeight + 'px',
			cursor: 'default'
		});
		
		this.desc = document.createElement('div');
		this.desc.setStyle({
			margin: '5px 0px 0px 0px',
			cursor: 'default'
		});
		
		this.createElements();
		
		this.domNode.appendChild(this.img);
		this.domNode.appendChild(this.desc);
		
		Event.observe(this.domNode, 'mousedown', this.startMovingHandler.bindAsEventListener(this));
		Event.observe(document.body, 'mousemove', this.mouseMoveHandler.bindAsEventListener(this));
		Event.observe(document.body, 'mouseup', this.mouseUpHandler.bindAsEventListener(this));
		
		this.domNode.setStyle({
			width: (this.width + 300) + 'px',
			'text-align': 'left'
		});
	},
	
	/**
	 * @method createElements	Create the HTML elements that make up the size indicatur user interface element.
	 */
	createElements: function() {
		var divL = document.createElement('div');
		var divM = document.createElement('div');
		var divR = document.createElement('div');
		var imgL = document.createElement('img');
		var imgR = document.createElement('img');
		imgL.src = this.imgLsrc;
		imgL.vspace = 0;
		//imgM.src = this.imgMsrc;
		imgR.src = this.imgRsrc;
		imgL.setStyle({
			cursor: 'w-resize',
			padding: '0px',
			margin: '0px',
			border: 0
		});
		imgR.setStyle({
			cursor: 'e-resize',
			padding: '0px',
			margin: '0px',
			border: 0
		});
		divL.setStyle({
			'float': 'left',
			padding: '0px',
			'line-height': '0px',
			display: 'inline'
		});
		divR.setStyle({
			'float': 'left',
			padding: '0px',
			'line-height': '0px',
			display: 'inline'
		});
		Event.observe(imgL, 'mousedown', this.startResizingHandler.bindAsEventListener(this, 'L'));
		Event.observe(imgR, 'mousedown', this.startResizingHandler.bindAsEventListener(this, 'R'));
		divM.setStyle({
			'background-image': "url('" + this.imgMsrc + "')",
			width: this.width + 'px',
			height: this.imgHeight + 'px',
			'float': 'left',
			display: 'inline'
		});
		this.divM = divM;
		divL.appendChild(imgL);
		divR.appendChild(imgR);
		this.img.appendChild(divL);
		this.img.appendChild(divM);
		this.img.appendChild(divR);
	},
	
	/**
	 * @method displaySize	Update the text that describes the size of the indicator.
	 */
	displaySize: function() {
		var widthKm = (this.width * SizeIndicator.sunRadiusKm) / (this.sunRadius * this.imageLayerProvider.tileContainer.tileSize * Math.pow(2, this.zoomLevel + this.zoomOffset));
		var xRe = widthKm / SizeIndicator.earthRadiusKm;
		var xRs = widthKm / SizeIndicator.sunRadiusKm;
		this.desc.innerHTML = Math.round(widthKm) + ' km = ' + xRe.toFixed(2) + ' R<sub>e</sub>' + ' = ' + xRs.toFixed(2) + ' R<sub>s</sub>';
	},
	
	/**
	 * Event handler: zoom
	 * @param {Number} zoomLevel	The new zoom level.
	 */
	onZoom: function(zoomLevel) {
		this.zoomLevel = zoomLevel;
		if (this.sunRadius) this.displaySize();
	},
	
	/**
	 * Event handler: zoom offset change
	 * @param {Number} zoomOffset	The new zoom Offset.
	 */
	onZoomOffsetChange: function(zoomOffset) {
		this.zoomOffset = zoomOffset;
		if (this.sunRadius) this.displaySize();
	},
	
	/**
	 * Event handler: image change
	 * @param {SunImage} sunImage	The new SunImage.
	 */
	onImageChange: function(sunImage) {
		if (sunImage.sunRadius != this.sunRadius) {
			this.width = sunImage.sunRadius * this.imageLayerProvider.tileContainer.tileSize * 2;
			this.divM.style.width = this.width + 'px';
			this.domNode.setStyle({
				width: (this.width + Math.max(300, this.desc.getDimensions().width) + 50) + 'px'
			});
		}
		this.sunRadius = sunImage.sunRadius;
		this.displaySize();
	},
	
	/**
	 * Event handler: start moving
	 * @param {DOM MouseEvent} e	The DOM MouseEvent object.
	 */
	startMovingHandler: function(e) {
		this.pressed = true;
		this.mark = {
			x: Event.pointerX(e),
			y: Event.pointerY(e)
		}
		Event.stop(e);
		return false;
	},
	
	/**
	 * Event handler: start resizing
	 * @param {DOM MouseEvent} e	The DOM MouseEvent object.
	 * @param {String} dir			The direction in which to resize ('L' = left or 'R' = right);
	 */
	startResizingHandler: function(e, dir) {
		this.resizing = dir;
		this.mark = {
			x: Event.pointerX(e),
			y: Event.pointerY(e)
		}
		this.startWidth = this.width;
		this.startLeft = parseInt(this.domNode.style.left);
		this.domNode.style.cursor = (dir == 'L' ? 'w-resize' : 'e-resize');
		Event.stop(e);
		return false;
	},
	
	/**
	 * Event handler: mouse moved
	 * @param {DOM MouseEvent} e	The DOM MouseEvent object.
	 */
	mouseMoveHandler: function(e) {
		//this.moves = (this.moves + 1) % 2;
		//if (this.moves == 0) return;
		
		if (this.resizing) {
			if (this.resizing == 'R') {
				this.width = Math.max(0, this.startWidth + Event.pointerX(e) - this.mark.x);
				this.domNode.setStyle({
					width: (this.width + this.desc.getDimensions().width + 50) + 'px'
				});
			} else if (this.resizing == 'L') {
				this.width = Math.max(0, this.startWidth - Event.pointerX(e) + this.mark.x);
				this.domNode.setStyle({
					left: (this.startLeft + Event.pointerX(e) - this.mark.x + Math.min(0, this.startWidth - Event.pointerX(e) + this.mark.x)) + 'px',
					width: (this.width + this.desc.getDimensions().width + 50) + 'px'
				});
			}
			this.divM.style.width = this.width + 'px';
			this.displaySize();
			Event.stop(e);
		} else if (this.pressed) {
			this.domNode.setStyle({
				left: (this.position.left + Event.pointerX(e)) - this.mark.x + 'px',
				top: (this.position.top + Event.pointerY(e)) - this.mark.y + 'px'
			});
			Event.stop(e);
		};
		
		return false;
	},
	
	/**
	 * Event handler: mouse up
	 * @param {DOM MouseEvent} e	The DOM MouseEvent object.
	 */
	mouseUpHandler: function(e) {
		if (this.resizing) {
			this.resizing = false;
			this.domNode.style.cursor = 'auto';
			var pos = Position.positionedOffset(this.domNode);
			this.position = { left: pos[0], top: pos[1] };
		} else if (this.pressed) {
			this.pressed = false;
			var pos = Position.positionedOffset(this.domNode);
			this.position = { left: pos[0], top: pos[1] };
		}

		return false;
	}
});

/**
 * Static properties
 */
SizeIndicator.sunRadiusKm = 696260;
SizeIndicator.earthRadiusKm = 12735;
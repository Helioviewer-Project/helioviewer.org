/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */

/**
 * @class SizeIndicator A user resizable interface element that shows physical dimensions.
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
		
		//Debug.output('[SI->init()] this.zoomLevel = '+ this.zoomLevel + ', this.zoomOffset = ' + this.zoomOffset);

		var pos = Element.positionedOffset(this.domNode);
		this.position = { left: pos[0], top: pos[1] };

        // Event-handlers
		document.zoomLevelChange.subscribe(this.onZoomLevelChange, this, true);
		document.zoomOffsetChange.subscribe(this.onZoomOffsetChange, this, true);
		document.sunImageChange.subscribe(this.onImageChange, this, true);
        document.viewportSizeChange.subscribe(this.repositionSizeIndicator, this, true);		

		Object.extend(this, options);

		this.img = new Element('div');
		this.img.setStyle({
			margin: '0px 0px 0px 0px',
			height: this.imgHeight + 'px',
			cursor: 'default'
		});
		
		this.desc = new Element('div');
		this.desc.setStyle({
			margin: '5px 0px 0px 0px',
			cursor: 'default'
		});
		
		this.createElements();
		
		this.domNode.appendChild(this.img);
		this.domNode.appendChild(this.desc);
		
		Event.observe(this.domNode, 'mousedown', this.startMovingHandler.bindAsEventListener(this));
		Event.observe(this.domNode, 'mousemove', this.mouseMoveHandler.bindAsEventListener(this));
		Event.observe(document.body, 'mouseup', this.mouseUpHandler.bindAsEventListener(this));
			
		this.domNode.setStyle({
			width: (this.width + 50) + 'px',
			textAlign: 'left'
		});
	},
	
	/**
	 * @function createElements	Create the HTML elements that make up the size indicatur user interface element.
	 */
	createElements: function() {
		var divL = new Element('div');
		var divM = new Element('div');
		var divR = new Element('div');
		var imgL = new Element('img', {'src':this.imgLsrc, 'vspace':'0'});
		var imgR = new Element('img', {'src':this.imgRsrc});

		imgL.setStyle ({
			cursor: 'w-resize',
			padding: '0px',
			margin: '0px',
			border: 0
		});
		imgR.setStyle ({
			cursor: 'e-resize',
			padding: '0px',
			margin: '0px',
			border: 0
		});
		divL.setStyle ({
			cssFloat: 'left',
			padding: '0px',
			lineHeight: '0px',
			display: 'inline'
		});
		divR.setStyle ({
			cssFloat: 'left',
			padding: '0px',
			lineHeight: '0px',
			display: 'inline'
		});
		divM.setStyle({
			backgroundImage: "url('" + this.imgMsrc + "')",
			width: this.width + 'px',
			height: this.imgHeight + 'px',
			cssFloat: 'left',
			display: 'inline'
		});
		this.divM = divM;
		divL.appendChild(imgL);
		divR.appendChild(imgR);
		this.img.appendChild(divL);
		this.img.appendChild(divM);
		this.img.appendChild(divR);
		
		//Resize if the user clicks either the right or left handle	
		Event.observe(imgL, 'mousedown', this.startResizingHandler.bindAsEventListener(this, 'L'));
		Event.observe(imgR, 'mousedown', this.startResizingHandler.bindAsEventListener(this, 'R'));
		
		//Make draggable
		new Draggable(this.domNode);
	},
	
	/**
	 * @method displaySize	Update the text that describes the size of the indicator.
	 */
	displaySize: function() {
		var convertedZoom = GLOBAL_zoomLevel;

		if (convertedZoom == 22)
		{
			convertedZoom = -10;
		}
		else if (convertedZoom == 21)
		{
			convertedZoom = -9;
		}
		else if (convertedZoom == 20)
		{
			convertedZoom = -8;
		}
		else if (convertedZoom == 19)
		{
			convertedZoom = -7;
		}
		else if (convertedZoom == 18)
		{
			convertedZoom = -6;
		}
		else if (convertedZoom == 17)
		{
			convertedZoom = -5;
		}
		else if (convertedZoom == 16)
		{
			convertedZoom = -4;
		}
		else if (convertedZoom == 15)
		{
			convertedZoom = -3;
		}
		else if (convertedZoom == 14)
		{
			convertedZoom = -2;
		}
		else if (convertedZoom == 13)
		{
			convertedZoom = -1;
		}
		else if (convertedZoom == 12)
		{
			convertedZoom = 0;
		}
		else if (convertedZoom == 11)
		{
			convertedZoom = 1;
		}
		else if (convertedZoom == 10)
		{
			convertedZoom = 2;
		}
		else if (convertedZoom == 9)
		{
			convertedZoom = 3;
		}
		else if (convertedZoom == 8)
		{
			convertedZoom = 4;
		}
		else if (convertedZoom == 7)
		{
			convertedZoom = 5;
		}
		else if (convertedZoom == 6)
		{
			convertedZoom = 6;
		}
		else if (convertedZoom == 5)
		{
			convertedZoom = 7;
		}
		else if (convertedZoom == 4)
		{
			convertedZoom = 8;
		}
		else if (convertedZoom == 3)
		{
			convertedZoom = 9;
		}
		else if (convertedZoom == 2)
		{
			convertedZoom = 10;
		}
		else if (convertedZoom == 1)
		{
			convertedZoom = 11;
		}
		
		var widthKm = (this.width * SizeIndicator.sunRadiusKm) / (this.sunRadius * this.imageLayerProvider.tileContainer.tileSize * Math.pow(2, convertedZoom));
		var xRe = widthKm / SizeIndicator.earthRadiusKm;
		var xRs = widthKm / SizeIndicator.sunRadiusKm;
        //Debug.output("SizeIndicator.displaySize()... widthKm =" + widthKm + ", xRe = " + xRe + ", xRs = " + xRs + ", this.width = " + this.width+ ", this.imageLayerProvider.tileContainer.tileSize = " + this.imageLayerProvider.tileContainer.tileSize);
		this.desc.innerHTML = Math.round(widthKm) + ' km = ' + xRe.toFixed(2) + ' R<sub>e</sub>' + ' = ' + xRs.toFixed(2) + ' R<sub>s</sub>';
	},
	
	/**
	 * Event handler: zoom
	 * 
	 */
	onZoomLevelChange: function(type, args) {
	    var newZoomLevel = args[0];
		this.zoomLevel = newZoomLevel;
		//Debug.output("[SizeIndicator->onZoom], zoomLevel = " + newZoomLevel);
		//Debug.output('[SizeIndicator->onZoom] this.zoomLevel = '+ this.zoomLevel + ', this.zoomOffset = ' + this.zoomOffset);
		
		if (this.sunRadius) this.displaySize();
	},
	
	/**
	 * Event handler: zoom offset change
	 * @param {Number} zoomOffset	The new zoom Offset.
	 */
	onZoomOffsetChange: function(type, args) {
	    var zoomOffset = args[0];
	    //Debug.output($A(arguments).inspect());
		this.zoomOffset = zoomOffset;
		//Debug.output("[SizeIndicator->onZoomOffsetChange()], zoomOffset = " + zoomOffset);
		//Debug.output('[SizeIndicator->onZoomOffsetChange()] this.zoomLevel = '+ this.zoomLevel + ', this.zoomOffset = ' + this.zoomOffset);
		if (this.sunRadius) this.displaySize();
	},
	
	/**
	 * Event handler: image change
	 * @param {SunImage} sunImage	The new SunImage.
	 */
	onImageChange: function(type, args) {
	    //Debug.output("SizeIndicator::onImageChange()");
	    sunImage = args[0];
		if (sunImage.sunRadius != this.sunRadius) {
			this.width = sunImage.sunRadius * this.imageLayerProvider.tileContainer.tileSize * 2;
			//Debug.output("AFTER: "+ this.width);
			//this.divM.style.width = this.width + 'px';
			this.divM.style.width = 184 + 'px';
			this.domNode.setStyle({
				//width: (this.width + Math.max(300, this.desc.getDimensions().width) + 50) + 'px'
				width: (Math.max(100, this.desc.getDimensions().width)+50) + 'px'
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
					width: (Math.max(this.width + 50, 160)) + 'px'
				});
			} else if (this.resizing == 'L') {
				this.width = Math.max(0, this.startWidth - Event.pointerX(e) + this.mark.x);
				this.domNode.setStyle({
					left: (this.startLeft + Event.pointerX(e) - this.mark.x + Math.min(0, this.startWidth - Event.pointerX(e) + this.mark.x)) + 'px',
					width: (Math.max(this.width + 50, 160 )) + 'px'
				});
			}
			this.divM.style.width = this.width + 'px';
			this.displaySize();
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
			var pos = Element.positionedOffset(this.domNode);
			this.position = { left: pos[0], top: pos[1] };
		} else if (this.pressed) {
			this.pressed = false;
			var pos = Element.positionedOffset(this.domNode);
			this.position = { left: pos[0], top: pos[1] };
		}

		return false;
	},
	
	/**
	 * @function repositionSizeIndicator
	 * Reset the position of the size indicator, based off of current zoomLevel
	 */
	 repositionSizeIndicator: function (type, args) {
	     //NOTE: in the future, this should be set dynamically.. also, create a setPosition fxn.
	     var newSize = args[0];
	     
	     if (newSize == "viewport-size-small") {
            this.position.top = 545;
	     } else
	     if (newSize == "viewport-size-med") {
	         this.position.top = 670;
	     } else {
	         this.position.top = 865;
	     }
	     
	     this.domNode.setStyle({top:this.position.top + 'px'});
	 }
});

/**
 * Static properties
 */
SizeIndicator.sunRadiusKm = 696260;
SizeIndicator.earthRadiusKm = 12735;

/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription A user interface element that enables the user to zoom in and out
 * as well as select the zoom level.
 */
var ZoomLevelSlider = Class.create();

ZoomLevelSlider.prototype =  Object.extend(new SunViewerWidget(), {
	// Default options
	defaultOptions: $H({
		topImage: 'images/icons/zoomSlider_top.gif',
		bottomImage: 'images/icons/zoomSlider_bottom.gif',
		middleImage: 'images/icons/zoomSlider_middle.gif',
		hiliteImage: 'images/icons/zoomSlider_hilite.gif',
		zoomLevel: 0,
		maxZoomLevel: 0,
		minZoomLevel: 10
	}),
	
	/**
	 * @constructor
	 * @param {String} elementId	The ID of the ZoomLevelSlider HTML element.
	 * @param {Hash} options		Available options: topImage, bottomImage, middleImage, hiliteImage, zoomLevel, maxZoomLevel, minZoomLevel
	 */
	initialize: function(elementId, options) {
		//Debug.output("INIT ZoomLevelSLider");
		this.domNode = $(elementId);
		this.zoomLevelControls = [];

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);

		// Get the +/- buttons
		//this.zoomInControl = this.domNode.getElementsByClassName('zoomIn')[0];
		this.zoomInControl = this.domNode.down('.zoomIn');
		//this.zoomOutControl = this.domNode.getElementsByClassName('zoomOut')[0];
		this.zoomOutControl = this.domNode.down('.zoomOut');
		//this.zoomLevelContainer = this.domNode.getElementsByClassName('zoomLevelContainer')[0];
		this.zoomLevelContainer = this.domNode.down('.zoomLevelContainer');

		// Observe the click events
		Event.observe(this.zoomInControl, 'click', this.zoomControlClick.bindAsEventListener(this, +1));
		Event.observe(this.zoomOutControl, 'click', this.zoomControlClick.bindAsEventListener(this, -1));
		
		// Add the elements
		// top part
		var zoomLevelTop = new Element('img', {'class': 'zoomLevelControl', 'src': this.topImage});
		this.zoomLevelContainer.appendChild(zoomLevelTop);
		this.zoomLevelContainer.appendChild(new Element('br'));

		// zoom level 0 element		
		var zoomLevel0 = new Element('img',{'class':'zoomLevelControl', 'src': this.hiliteImage});
		var zoomLevel0Element = this.zoomLevelContainer.appendChild(zoomLevel0);
		var clickHandler = this.zoomControlClick.bindAsEventListener(this, 0, true);
		Event.observe(zoomLevel0Element, 'click', clickHandler);
		var br = this.zoomLevelContainer.appendChild(new Element('br'));
		//var br = null;
		this.zoomLevelControls[0] = { control: zoomLevel0Element, br: br };

		// bottom part
		var zoomLevelBottom = new Element('img', {'class': 'zoomLevelControl', 'src': this.bottomImage});
		this.zoomLevelContainer.appendChild(zoomLevelBottom);
		this.zoomLevelContainer.appendChild(new Element('br'));
	},
	
	/**
	 * @method linkToViewports	The slider and viewports listen to each other's zoom events
	 * 							and the slider adapts to the max zoom level.
	 */
	linkToViewports: function() {
		//Debug.output("Linktoviewports Zoomlevelslider");
		var self = this;
		var zoomLevel, maxZoomLevel;
		var src1, src2;

		$A(arguments).flatten().each(function(viewport) {
			viewport.observe(self, 'Zoom');
			if (viewport.maxZoomLevel > 0 && (self.maxZoomLevel == 0 || self.maxZoomLevel > viewport.maxZoomLevel)) {
				//Debug.output("viewport.maxZoomLevel: " + viewport.maxZoomLevel);
				maxZoomLevel = viewport.maxZoomLevel;
				src1 = viewport;
			}
			if (viewport.zoomLevel > 0 && (self.zoomLevel == 0 || self.zoomLevel > viewport.zoomLevel)) {
				zoomLevel = viewport.zoomLevel;
				src2 = viewport;
			}
			self.observe(viewport, 'MaxZoomLevelChange');
			self.observe(viewport, 'Zoom');
		});
		
		
		if (src1) this.setMaxZoomLevel(maxZoomLevel, src1);
		if (src2) this.setZoomLevel(zoomLevel, src2);

	},
	
	/**
	 * Event handler: zoom control click
	 * @param {DOM MouseEvent} e	The DOM MouseEvent.
	 * @param {Number} zoom			The zoom level (absolute) / difference (relative).
	 * @param {Boolean} absolute	Whether to zoom absolute or relative.
	 */
	zoomControlClick: function(e, zoom, absolute) {
		var newZoomLevel = Math.max(this.minZoomLevel, Math.min(this.maxZoomLevel, (absolute ? zoom : this.zoomLevel + zoom)));
		this.setZoomLevel(newZoomLevel);
		//Debug.output("minZoomLevel, maxZoomLevel, zoomLevel: " + this.get('minZoomLevel') + ", " + this.get('maxZoomLevel') + ", " + this.get('zoomLevel'));
		//Debug.output("zoomControlClick zoomlevelslider, zoomLevel = " + this.get('zoomLevel') + ", newZoomLevel = " + newZoomLevel);
	},
	
	/**
	 * @method setZoomLevel				Sets the zoom level.
	 * @param {Number} level			The new zoom level.
	 * @param {SunViewerWidget} source	The widget that initiated the zoom level change.
	 */
	setZoomLevel: function(level, source) {
		//Debug.output("setZoomLevel, level = " + level);
		// TODO: Exception handling (out of range)
		if (this.zoomLevel != level) {
			// Highlight the current zoom level instead of the old
			if (this.zoomLevelControls[this.zoomLevel]) this.zoomLevelControls[this.zoomLevel].control.src = this.middleImage;
			this.zoomLevel = level;
			if (this.zoomLevelControls[this.zoomLevel]) this.zoomLevelControls[this.zoomLevel].control.src = this.hiliteImage;
			this.notifyListeners('Zoom', level, source);
		}
	},
	
	/**
	 * @method setMaxZoomLevel			Sets the maximum zoom level.
	 * @param {Number} level			The new maximum zoom level.
	 * @param {SunViewerWidget} source	The widget that initiated the max zoom level change.
	 */
	setMaxZoomLevel: function(level, source) {
		//Debug.output("setmaxzoomlevel");
		if (this.maxZoomLevel != level) {
			var previousMaxZoomLevel = this.maxZoomLevel;
			this.maxZoomLevel = level   ;
			
			if (this.zoomLevel > this.maxZoomLevel) {
				this.setZoomLevel(this.maxZoomLevel);
			}
						
			// max zoom level lowered
			for (var l = previousMaxZoomLevel; l > this.maxZoomLevel; l--) {
				this.removeZoomLevelControl(l);
			}
			
			// max zoom level raised
			for (var l = previousMaxZoomLevel + 1; l <= this.maxZoomLevel; l++) {
				this.addZoomLevelControl(l);
			}

			this.notifyListeners('MaxZoomLevelChange', level, source);
		}
	},
	
/*	
	setMinZoomLevel: function(level, source) {
		if (this.minZoomLevel != level) {
//Debug.output('new max zoom level: ' + level);

			var previousMinZoomLevel = this.minZoomLevel;
			this.minZoomLevel = level;
			
			if (this.zoomLevel < minZoomLevel) {
				this.setZoomLevel(this.minZoomLevel);
			}
						
			// min zoom level lowered
			for (var l = previousMinZoomLevel - 1; l >= this.minZoomLevel; l--) {
				this.addZoomLevelControl(l);
			}
			
			// min zoom level raised
			for (var l = previousMinZoomLevel; l < this.minZoomLevel; l++) {
				this.removeZoomLevelControl(l);
			}

			this.notifyListeners('MinZoomLevelChange', level, source);
		}
	},
*/
	
	/**
	 * Event handler: max zoom level change
	 * @param {Number} level			The new max zoom level.
	 * @param {SunViewerWidget} source	The widget that initiated the max zoom level change.
	 */
	onMaxZoomLevelChange: function(level, source) {
		//Debug.output("onmaxzoomlevelchange");
		this.setMaxZoomLevel(level, source);
	},
	
/*
	onMinZoomLevelChange: function(level, source) {
		this.setMinZoomLevel(level, source);
	},
*/	
	/**
	 * Event handler: zoom level change
	 * @param {Number} level			The new zoom level.
	 * @param {SunViewerWidget} source	The widget that initiated the zoom level change.
	 */
	onZoom: function(level, source) {
		//Debug.output("ZoomLevelSlider::onZoom (level = " + level + ")");
		this.setZoomLevel(level, source);
	},
	
	/**
	 * @method addZoomLevelControl	Adds a new zoom level control element to the slider.
	 * @param {Number} zoomLevel	The element's zoom level.
	 */
	addZoomLevelControl: function(zoomLevel) {
		//Debug.output("addzoomlevelcontrol");
		if (this.zoomLevelControls[zoomLevel] || !this.zoomLevelControls[zoomLevel - 1]) return;
		
		var zoomLevelControl = new Element('img');
		zoomLevelControl.src = (zoomLevel == this.zoomLevel ? this.hiliteImage : this.middleImage);
		var br = this.zoomLevelContainer.insertBefore(new Element('br'), this.zoomLevelControls[zoomLevel - 1].control);
		var zoomLevelControlElement = this.zoomLevelContainer.insertBefore(zoomLevelControl, br);
		var clickHandler = this.zoomControlClick.bindAsEventListener(this, zoomLevel, true);
		Event.observe(zoomLevelControlElement, 'click', clickHandler);
		this.zoomLevelControls[zoomLevel] = { control: zoomLevelControlElement, br: br };
	},
	
	/**
	 * @method removeZoomLevelControl	Removes a zoom level control element from the slider.
	 * @param {Number} zoomLevel		The element's zoom level.
	 */
	removeZoomLevelControl: function(zoomLevel) {
		//Debug.output("removezoomlevelcontrol");
		if (!this.zoomLevelControls[zoomLevel]) return;
		this.zoomLevelContrainer.removeChild(zoomLevelControls[zoomLevel].control);
		this.zoomLevelContrainer.removeChild(zoomLevelControls[zoomLevel].br);
		this.zoomLevelControls[zoomLevel] = null;
	}
});

 

/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class Marker Represents a marker on the sun. It is characterized by
 * a position in sun coordinates (latitude/longitude), an association with a specific
 * image of the sun, an optional label HTML content (usually just plain text), an 
 * optional "mark" (an image displayed at the marker's position) and an optional info
 * HTML content (displayed when you click on the marker).
 */
var Marker = Class.create();

Marker.prototype = {
	// Default options (primitive)
	defaultOptions: $H({
		markSrc: '',
		labelHtml: ''
		//markSrc: 'images/cross15px.gif'
	}),

	/**
	 * @constructor
	 * @param {SunImage} sunImage			The image of the sun the marker is associated with.
	 * 										NOTE: Should maybe be changed to SunImgDate.
	 * @param {OverlayCollection} overlays	The OverlayCollection that manages the label and mark
	 * 										overlays.
	 * @param {Hash} options				Available options: position, markSrc, labelHtml, infoHtml, markOffset, labelOffset, latlon
	 */
	initialize: function(sunImage, overlays, options) {
		// Default options (non-primitive)
		this.className = "Marker";
		this.sunImage = sunImage;
		this.position = { x: 0, y: 0 };
		this.markOffset = { x: -7, y: -7 };
		this.labelOffset = {x: -20, y: -10};
		
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
				
		// The "mark" (small image at the marker's position)
		if (this.markSrc) {
			var markHtml = '<img src="' + this.markSrc + '" className="mark">';
			this.markOverlay = overlays.createOverlay(markHtml, sunImage, { position: this.position, offset: this.markOffset, infoHtml: this.infoHtml });
		}
	
		// The "label" (short text near the mark that is always visible)
		if (this.labelHtml) {
			this.labelOverlay = overlays.createOverlay(this.labelHtml, sunImage, { position: this.position, offset: this.labelOffset, infoHtml: this.infoHtml, className: 'label' });
		}
	}

};


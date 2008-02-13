/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */


/**
 * @classDescription This class represents a marker on the sun. It is characterized by
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

}

/**
 * @classDescription This class represents a location on the sun given in latitude and longitude coordinates.
 */
var LatLon = Class.create();

LatLon.prototype = {
	/**
	 * @constructor
	 * @param {Number} latitude		The latitude of the location in Rad.
	 * @param {Number} longitude	The longitude of the location in Rad.
	 */
	initialize: function(latitude, longitude) {
		this.latitude = latitude;
		this.longitude = longitude;
	},
	



	/**
	 * @classDescription Rotates the location around the y and z Axises by the given amount.
	 * It first rotates around the z and then around the y Axis.
	 * 
	 *       z-Axis
	 *       __^__
	 *     ,«  |  `.
	 *    /    |    \
	 * ---|----o----|-> y-Axis 
	 *    \  x-Axis /
	 *     `.,_|_,.«
	 *         |
	 *
	 * @param {Number} yAxis	The amount to rotate around the y Axis in Rad.
	 * @param {Number} zAxis	The amount to rotate around the z Axis in Rad.
	 * @return {Boolean}		Returns whether the location is now on "behind" the sun. 
	 */	
	rotate: function(yAxis, zAxis) {
		var temp;
		// this is needed to avoid errors due to floating point precision
		// (e.g. asin(x) where |x|>1)
		var PRECISION_THRESHOLD = 1.000000000000003;
		
		// latitude and longitude along z axis
		var latitudeZ = this.latitude;
	    var longitudeZ = this.longitude; 
		
		// rotation around z axis
		longitudeZ += zAxis;
		
		// transform coordinates for easy rotation around y-Axis
		var y = Math.cos(latitudeZ) * Math.sin(longitudeZ);
		var z = Math.sin(latitudeZ);

		// latitude along y-axis
		var latitudeY = Math.asin(y);
		temp = z / Math.cos(latitudeY);
		if (1 < temp && temp < PRECISION_THRESHOLD) temp = 1;
		else if (-PRECISION_THRESHOLD < temp && temp < -1) temp = -1;
		// longitude around y-axis
		var longitudeY = Math.asin(temp);
		if (longitudeZ < -Math.PI/2) longitudeY = -Math.PI - longitudeY;
		else if (longitudeZ > Math.PI/2) longitudeY = Math.PI + longitudeY;
		
		longitudeY += yAxis;
		
		var x = Math.cos(latitudeY) * Math.cos(longitudeY);
		
		// transform back to standard latitude/longitude
		temp = Math.cos(latitudeY) * Math.sin(longitudeY);
		if (1 < temp && temp < PRECISION_THRESHOLD) temp = 1;
		else if (-PRECISION_THRESHOLD < temp && temp < -1) temp = -1;
		latitudeZ = Math.asin(temp);
		temp = Math.sin(latitudeY) / Math.cos(latitudeZ);
		if (1 < temp && temp < PRECISION_THRESHOLD) temp = 1;
		else if (-PRECISION_THRESHOLD < temp && temp < -1) temp = -1;
		longitudeZ = Math.asin(temp);
		
		this.latitude = latitudeZ;
		this.longitude = longitudeZ;
		return (x >= 0);
	},
	
	/**
	 * @method adjustObliquity	Rotates the location around the y axis depending on the
	 * 							obliquity (angle between the solar and earth planes) on
	 * 							the given date.
	 * @param {SunImgDate} date		The date.
	 */
	adjustObliquity: function(date) {
		this.rotate(date.getObliquity(), 0);
	},
	
	/**
	 * @classDescription toXY		Converts the latitude/longitude position in coordinates
	 * 								relative to the complete image.
	 * @param {Number} sunRadius	The radius of the sun relative to the complete image.
	 * @param {Hash} sunCenter		The x/y position of the center of the sun relative to
	 * 								the complete image.
	 * @return {Hash}				The x/y position of the location.
	 */
	toXY: function(sunRadius, sunCenter) {
		if (!sunCenter) sunCenter = { x: 0.5, y: 0.5 };

		var x = sunCenter.x + Math.sin(this.longitude) * Math.cos(this.latitude) * sunRadius;
		var y = sunCenter.y + Math.sin(this.latitude) * sunRadius;

		return { x: x, y: y };
	}
};

/**
 * TODO: Implement and change references (see SunCoordsDisplay.XYtoRad())
 * @method LatLon.fromXY		Creates a new LatLon object from world coordinates.
 * @param {Number} x			The x coordinate relative to the complete image.
 * @param {Number} y			The x coordinate relative to the complete image.
 * @param {Number} sunRadius	The radius of the sun relative to the complete image.
 * @param {Hash} sunCenter		The x/y position of the center of the sun relative to
 * 								the complete image.
 * @return {LatLon}				The new LatLon object.
 */
LatLon.fromXY = function(x, y, sunRadius, sunCenter) {
	if (!sunCenter) sunCenter = { x: 0.5, y: 0.5 };

	// TODO: Calculate latitude and longitude

	return new LonLat(0,0);	
}

/**
 * @classDescription Marker collection class.
 */ 
var MarkerCollection = Class.create();

MarkerCollection.prototype = Object.extend($A([]), {
	/**
	 * @constructor
	 * @param {OverlayCollection} overlays	The overlay collection that manages the marker's overlays.
	 */
	initialize: function(overlays)  {
		this.overlays = overlays;
	},
	
	/**
	 * @method loadMarkers			Loads the markers for this image.
	 * @param {SunImage} sunImage	The SunImage.
	 */
	loadMarkers: function(sunImage) {
		var fileName = sunImage.date.year + sunImage.date.month + sunImage.date.day + 'SRS.txt';
		var fileUrl = 'SRS/' + sunImage.date.year + '_SRS/' + fileName; 
		
		new AjaxRequestWrapper.getCached(fileUrl, this.createFromSrsTxt.bind(this), fileUrl, sunImage);
	},
	
	/**
	 * TODO: Replace this with a generic method to get the markers from the server.
	 * Implement the specific way to retrieve the data to create them on the server (database...)
	 * @method createFromSrsTxt		Creates the markers from a NOAA SRS active regions text file.
	 * @param {String} data			The text file contents.
	 * @param {String} fileUrl		The url of the text file.
	 * @param {SunImage} sunImage	The SunImage.
	 */
	createFromSrsTxt: function(data, fileUrl, sunImage) {
		var lines = data.split("\n");
	
		// Parse the text data line by line
		for (var lnum = 0; lnum < lines.length; lnum++) {
			// Search for 'I.'. The active regions starts 2 lines further down
			var first2chars = lines[lnum].substr(0,2);
			if (first2chars == 'I.') {
				// Go down 2 lines
				lnum+=2;
				// Split the line into words, ignoring spaces
				var words = lines[lnum].splitTrim(" ");

				// As long as the line starts with a (active region) number
				while(isFinite(words[0])) {
					// Position in degree as string (e.g. N13W62)
					var positionDegStr = words[1];
					var positionDeg = {
						latitude: parseFloat(positionDegStr.substr(1,2)) * (words[1].substr(0,1) == 'S' ? 1 : -1),
						longitude: parseFloat(positionDegStr.substr(4,2)) * (words[1].substr(3,1) == 'W' ? 1 : -1) 
					};

					// The data is from 0:00, the pictures are not. Compute the longitudal
					// delta due to solar rotation since midnight, depending on the latitude
					var rotationDeltaLongitudeRad = sunImage.date.getRotationDeltaLongitude(positionDeg.latitude.toRad()); //rotationDeltaLongitudeDeg.toRad();

					var positionLatLon = new LatLon(positionDeg.latitude.toRad(), positionDeg.longitude.toRad() + rotationDeltaLongitudeRad);

					// Adjust for the angle between the solar and the earth plane
					positionLatLon.adjustObliquity(sunImage.date);

					// The info content
					var info = 	'<b>Region with Sunspots</b><br/>' +
								'Number: ' + words[0] + '<br/>' +
								'Location (at 0:00): ' + words[1] + '<br/>' +
								'Lo: ' + words[2] + '<br/>' +
								'Area: ' + words[3] + '<br/>' +
								'Z: ' + words[4] + '<br/>' +
								'LL: ' + words[5] + '<br/>' +
								'NN: ' + words[6] + '<br/>' +
								'Mag Type: ' + words[7] + '<br/>' + 
								'<br><a href="' + fileUrl + '" target="_new">SRS text file</a>';

					// Create the marker
					var marker = new Marker(sunImage, this.overlays, {
						position: positionLatLon.toXY(sunImage.sunRadius, sunImage.sunCenter),
						labelHtml: words[0],
						infoHtml: info,
						latlon: positionLatLon
					});
					this.push(marker);
					
					// If end of file end parsing
					if (lnum+1 == lines.length) break;
					
					// Split the next line to words
					words = lines[++lnum].splitTrim(" ");
				}
			}
		}
	}
});
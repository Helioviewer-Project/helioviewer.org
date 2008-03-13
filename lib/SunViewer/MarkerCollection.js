/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class MarkerCollection Marker collection class.
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
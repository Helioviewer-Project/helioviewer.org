/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription A user interface element that shows the latitude/longitude value of the location under the mouse cursor.
 */
var SunCoordsDisplay = Class.create();

SunCoordsDisplay.prototype = Object.extend(new SunViewerWidget(), {
	defaultOptions: $H({
		decimals: 0
	}),
	
	/**
	 * @constructor
	 * @param {Sring} elementId					The ID of the SunCoordsDisplay HTML element.
	 * @param {TileLayerProvider} layerProvider	The corresponding TileLayerProvider.
	 * @param {Hash} options					Available options: decimals
	 */
	initialize: function(elementId, layerProvider, options) {
		this.domNode = $(elementId);
		this.layerProvider = layerProvider;
		
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		this.createElements();
		
		Event.observe(this.layerProvider.tileContainer.viewport.domNode, 'mousemove', this.updateCoords.bindAsEventListener(this));
	},
	
	/**
	 * @method createElements	Creates the user interface HTML elements.
	 */
	createElements: function() {
		var table = document.createElement('table');
		table.className = 'sunCoordsDisplay';

		var tr = document.createElement('tr')
		this.latText = document.createElement('td');
		this.latText.width = 15;
		this.latValue = document.createElement('td');
		this.latValue.width = 25;
		this.lonText = document.createElement('td');
		this.lonText.width = 15;
		this.lonValue = document.createElement('td');
		this.lonValue.width = 25;
		tr.appendChild(this.latText);
		tr.appendChild(this.latValue);
		tr.appendChild(this.lonText);
		tr.appendChild(this.lonValue);
		table.appendChild(tr);
		this.domNode.appendChild(table);
	},
	
	/**
	 * TODO: Move to LatLon.fromXY()
	 * @method XYToRad		Converts (x,y) pixel coordinates in the viewport to latitude/longitude sun coordinates.
	 * @param {Number} x	The x coordinate in the viewport in pixels.
	 * @param {Number} y	The y coordinate in the viewport in pixels.
	 * @return {Hash}		The latitude/longitude coordinates or null if out of bounds.
	 */
	XYToRad: function (x, y) {
		if (!this.layerProvider.sunImage) return null;
		var sunRadius = this.layerProvider.sunImage.sunRadius * this.layerProvider.getFullSize();
		var viewerPosition = this.layerProvider.tileContainer.viewport.position;
		var y1 = (y - viewerPosition.y) / sunRadius;
		if (-1 <= y1 && y1 <= 1) {
			var latitudeRad = Math.asin(y1);

			var x1 = (x - viewerPosition.x) / sunRadius;
			var x2 = x1 / Math.cos(latitudeRad);
			if (-1 <= x2 && x2 <= 1) {
				var longitudeRad = Math.asin(x2);

				return { latitude: latitudeRad, longitude: longitudeRad };
			}
		}
		return null;
	},
	
	/**
	 * @method displayCoords		Shows the latitude/longitude values in the user interface element.
	 * @param {Number} latitude		The latitude value.
	 * @param {Number} longitude	The longitude value.
	 */
	displayCoords: function(latitude, longitude) {
		var showCoords = (latitude != null && longitude != null);
		// NOTE: Prototype 1.6 requires use of getters for hashes
		this.latValue.innerHTML = showCoords ? Math.abs(latitude.toFixed(this.decimals)) : '';
		this.latText.innerHTML = showCoords ? (latitude < 0 ? 'N' : 'S') : '';
		this.lonValue.innerHTML = showCoords ? Math.abs(longitude.toFixed(this.decimals)) : '';
		this.lonText.innerHTML = showCoords ? (longitude < 0 ? 'E' : 'W') : '';
	},
	
	/**
	 * @method updateCoords			Calculates the sun coordinates and shows them in the user interface.
	 * @param {DOM MouseEvent} e	The DOM MouseEvent.
	 */
	updateCoords: function(e) {
		if (this.layerProvider.tileContainer.viewport.surface.moving) return;
		var viewportOffset = this.layerProvider.tileContainer.viewport.offset;
		var screenCoords = {
			x: Event.pointerX(e) - viewportOffset[0],
			y: Event.pointerY(e) - viewportOffset[1]
		};
		var screenSunCoords = this.XYToRad(screenCoords.x, screenCoords.y);
		if (screenSunCoords == null) {
			this.displayCoords();
		} else {
			var realSunCoordsDeg = {
				latitude: screenSunCoords.latitude + this.layerProvider.sunImage.date.getObliquity(),
				longitude: screenSunCoords.longitude
			};
			this.displayCoords(realSunCoordsDeg.latitude.toDeg(), realSunCoordsDeg.longitude.toDeg());
		}
	}
});
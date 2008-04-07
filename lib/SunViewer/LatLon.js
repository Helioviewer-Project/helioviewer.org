/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class LatLon Represents a location on the sun given in latitude and longitude coordinates.
 */
/*global Class */

var LatLon = Class.create();

LatLon.prototype = {
	/**
	 * @constructor
	 * @param {Number} latitude		The latitude of the location in Rad.
	 * @param {Number} longitude	The longitude of the location in Rad.
	 */
	initialize: function (latitude, longitude) {
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
	rotate: function (yAxis, zAxis) {
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
		if (1 < temp && temp < PRECISION_THRESHOLD) {
		    temp = 1;
		}
		else if (-PRECISION_THRESHOLD < temp && temp < -1) {
		    temp = -1;
		}
		
		// longitude around y-axis
		var longitudeY = Math.asin(temp);
		
		if (longitudeZ < -Math.PI / 2) {
		    longitudeY = -Math.PI - longitudeY;
		}
		else if (longitudeZ > Math.PI / 2) {
		    longitudeY = Math.PI + longitudeY;
		}
		
		longitudeY += yAxis;
		
		var x = Math.cos(latitudeY) * Math.cos(longitudeY);
		
		// transform back to standard latitude/longitude
		temp = Math.cos(latitudeY) * Math.sin(longitudeY);
		if (1 < temp && temp < PRECISION_THRESHOLD) {
		    temp = 1;
		}
		else if (-PRECISION_THRESHOLD < temp && temp < -1) {
		    temp = -1;
		}
		latitudeZ = Math.asin(temp);
		temp = Math.sin(latitudeY) / Math.cos(latitudeZ);
		
		if (1 < temp && temp < PRECISION_THRESHOLD) {
		    temp = 1;
		}
		else if (-PRECISION_THRESHOLD < temp && temp < -1) {
		    temp = -1;
		}
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
	adjustObliquity: function (date) {
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
	toXY: function (sunRadius, sunCenter) {
		if (!sunCenter) {
		    sunCenter = { x: 0.5, y: 0.5 };
		}

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
LatLon.fromXY = function (x, y, sunRadius, sunCenter) {
	if (!sunCenter) {
	    sunCenter = { x: 0.5, y: 0.5 };
	}

	// TODO: Calculate latitude and longitude

	return new LatLon(0,0);	
};
 
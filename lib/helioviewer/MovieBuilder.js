/**
 * @author Jaclyn Beck
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
 * @TODO Modify css to add "#movie-button", add hover function, add click animation, add real action function
*/	

var MovieBuilder = Class.create(UIElement, {
	/*
	 * @description Default options that user cannot change at the moment.
	 */
	defaultOptions: {
		url         : "api/index.php",
		numFrames   : 20,
		frameRate   : 8,
		sharpen     : false,
		edgeEnhance : false,
		format      : {win: "asf", mac: "mov", linux: "mp4"},
		timeStep	: 86400
	},

	/**
	 * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
	 * @param {Object} controller
	 */	
	initialize: function(controller) {
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#movie-button");
		this.viewport 	= this.controller.viewport;		
		var self = this;
		
		this.button.click(function() {
			var helioviewer = self.controller, xhr, zoomLevel, displayRange, startTime, layers, visibleCoords, tileLayers, hcOffset;
			zoomLevel = helioviewer.viewport.zoomLevel;

			// startTime is in unix timestamp format in seconds
			startTime = helioviewer.date.getTime();
			hqformat = "mov";
			
			// Array to hold the names and layer information for each layer.
			layers = $A();

			// Get the top, left, bottom, and right coordinates of what is currently visible in the viewport			
			visibleCoords = helioviewer.viewport.getHCViewportPixelCoords();
			hcOffset = self.getHCOffset(visibleCoords);
//console.log("hcOffset: " + hcOffset);
//console.log("VisibleCoords: " + visibleCoords["left"] + "," + visibleCoords["top"] + ",  " + visibleCoords["right"] + "," + visibleCoords["bottom"]);					

			// Get all tileLayers
			tileLayers = helioviewer.layerManager.tileLayers();
			
			// Arrays to hold layer data to send to API.php
			var layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A();
			
			// Only add visible tile layers to the array.
			tileLayers.each(function(t) {
				if (t.visible) {
					var left, top, right, bottom, width, height, sizeOffset;
					
					// TODO: find a way to not hard-code these that doesn't take much time.
					var jp2Width = t.width;
					if(t.detector == "0C2")
						jp2Width = 1174;
					else if(t.detector == "0C3")
						jp2Width = 1418;
						
					sizeOffset 	= jp2Width/t.relWidth;

					// Convert viewport heliocentric coordinates into image coordinates
					left 	= visibleCoords["left"] + t.relWidth/2;
					top 	= visibleCoords["top"] 	+ t.relHeight/2;
					right 	= visibleCoords["right"]  + t.relWidth/2;
					bottom 	= visibleCoords["bottom"] + t.relHeight/2;

					/* 
					 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
					 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may be twice as large
					 * as its corresponding jp2 image. The sizeOffset for this image would be (image width)/(2x image width) or 0.5, 
					 * so to get the pixel coordinate relative to the jp2 image, multiply "left" by 0.5, the sizeOffset.
					 * zoomOffset cannot be used here because images like LASCO C2 and C3 have different sizeOffsets than EIT images 
					 * at the same zoomLevel.
					 * If "left" or "top" is less than 0, just use 0.
					 */
					left 	= Math.floor(Math.max(left * sizeOffset, 0));			
					top 	= Math.floor(Math.max(top 	* sizeOffset, 0));
					right 	= Math.floor(right  * sizeOffset);
					bottom 	= Math.floor(bottom * sizeOffset);

					// If the calculated width is greater than the possible width, just use the possible width. 							
					width 	= Math.min((right - left), jp2Width - left);
					height 	= Math.min((bottom - top), jp2Width - top);
					
					// If at least some of the image is currently visible, add that layer
					if (width > 0 && height > 0 && top < t.height && left < t.width) {					
						var xRange = {						
							start:	left,								
							size:	width
						}
						
						var yRange = {
							start:	top,
							size:	height
						}
				
						// Add layer name, opacity, and ranges to the appropriate arrays.
						// Layer names are in the format OBS_INST_DET_MEAS to allow for variable-length names 
						var name = $A([t.observatory, t.instrument, t.detector, t.measurement])
											
						layerNames.push(name.join("_"));
						layerOpacities.push(t.opacity);
						layerXRanges.push(xRange.start + "," + xRange.size);
						layerYRanges.push(yRange.start + "," + yRange.size);
									
//						console.log("Layer " + t.observatory + t.instrument + t.detector + t.measurement + " is visible");
					}
					else
						console.log("Layer " + t.observatory + t.instrument + t.detector + t.measurement + " is not visible.");
				}
			});

			xhr = new Ajax.Request(self.url, {
				method: 'POST',
				parameters: {
					action:    "buildMovie",
                	layers:    layerNames.join(),
                	startDate: startTime,
					timeStep:  43200,
                	zoomLevel: zoomLevel,
                	numFrames: self.numFrames,
                	frameRate: self.frameRate,
                	edges:     self.edgeEnhance,
                	sharpen:   self.sharpen,
                	format:    "mov",
					opacity:   layerOpacities.join(),
					hcOffset:  hcOffset,
					
					// Joining these with the "/" delimiter because the x and yRanges are already separated by commas.
                	xRange:    layerXRanges.join("/"), 
					yRange:    layerYRanges.join("/") 
				},
				
				onComplete: function (transport) {
//console.log(transport.responseJSON);
					// Let user know that video is ready
					var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
					var url = self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON;

					Event.observe(linkId, 'click', function () {
						Shadowbox.open({
							player:  'iframe',
						    title:   'Helioviewer Movie Player',
					      	height:   650,
					        width:    550,
					        content: url // self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON
						}); 
					}); 
				}
			}); 
		});
	}, 

	/*
	 * Figures out where the heliocenter is in terms of viewport coordinates. The viewport can be divided into 
	 * 9 regions, 3 along the x-axis (West, Center, Right), and 3 along the y-axis (North, Center, South).
	 * Returns the region that the heliocenter falls into (or the nearest region, if the heliocenter is outside the viewport). 
	 */	
	getHCOffset: function(visibleCoords) {
		var left, right, top, bottom, leftX, middleX, upperY, middleY, width, height, xDiff, yDiff, hcOffset, xDirection, yDirection;

		left 	= visibleCoords["left"];
		right 	= visibleCoords["right"];
		top 	= visibleCoords["top"];
		bottom 	= visibleCoords["bottom"];
		
		// Find the x and y coordinates that divide the 3 regions.		
		xDiff = (right  - left) / 3;
		yDiff = (bottom - top) / 3;
		
		leftX 	= left + xDiff;
		middleX = leftX + xDiff;
		
		upperY 	= top + yDiff;
		middleY = upperY + yDiff;

		// The offset will be some combination of xDirection and yDirection
		xDirection = "";
		yDirection = "";
				
		/* 
		 * Since the viewport coordinates are in terms of the heliocenter being (0,0), figure out which
		 * region (0,0) is in. You want to pad images in that direction.
		 */		
		if(0 < leftX)
			xDirection = "West";
		else if(0 >= middleX)
			xDirection = "East";
			
		if(0 < upperY)
			yDirection = "North";
		else if(0 >= middleY)
			yDirection = "South";
		
		var offset = yDirection + xDirection;
		if(offset.length == 0)
			offset = "Center";
			
		return offset;
	}
});

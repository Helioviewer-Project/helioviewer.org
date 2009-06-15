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
		numFrames   : 40,
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
			var helioviewer = self.controller, xhr, zoomLevel, displayRange, startTime;
			zoomLevel = helioviewer.viewport.zoomLevel;
			displayRange = helioviewer.viewport.displayRange();
			// startTime is in unix timestamp format in seconds
			startTime = helioviewer.date.getTime();
			hqformat = "mov";
			
			// Array to hold the names and layer information for each layer.
			var layers = $A();
			
			// Get all tileLayers
			var tileLayers = helioviewer.layerManager.tileLayers();

			// Only add visible layers to the array.
			tileLayers.each(function(t) {
				if(t.visible)
					layers.push({
						name: 		t.observatory + t.instrument + t.detector + t.measurement,
						width:	 	t.width,
						height:	 	t.height,
						relWidth: 	t.relWidth,
						relHeight: 	t.relHeight,
						opacity: 	t.opacity,
					});
			});
var coords = helioviewer.viewport.getHCViewportPixelCoords();
layers.each(function (l) {
	console.log("TileLayer: " + l.name + " opacity: " + l.opacity + " width & height: " + l.relWidth + "," + l.relHeight);
	zoomOffset = Math.pow(2, helioviewer.viewport.zoomLevel - helioviewer.baseZoom);
	var xRange = {
		start:  Math.floor(Math.max(coords["left"] + l.relWidth/2, 0)),
		// "end" is actually the width of the image, not the endpoint.
		// Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport
		end:	Math.floor((coords["right"] -coords["left"]) * zoomOffset)
	}
	console.log("xrange: " + xRange["start"] + "," + xRange["end"]);
});

console.log("viewport: " + coords["top"] + "," + coords["left"] + " / " + coords["bottom"] + "," + coords["right"]); //+ displayRange["xStart"] + "," + displayRange["xEnd"]);

/*
			var vp, ts;
			
			// Get heliocentric viewport coordinates
	//		vp = self.viewport.getHCViewportPixelCoords();
			vp = self.viewport.domNode.getDimensions();
			// Expand to fit tile increment
			ts = self.viewport.tileSize;
			vp = {
				top:    vp.top    - ts - (vp.top  % ts),
				left:   vp.left   - ts - (vp.left % ts),
				bottom: vp.bottom + ts - (vp.bottom % ts),
				right:  vp.right  + ts - (vp.right % ts)
			};
	
			mc = self.viewport.movingContainer.positionedOffset();
	//		vpd = {
				left 	= ts - (vp.width/2 + mc[1]),
				top		= ts - (vp.height/2 + mc[0]),
				right	= vp.width + left,
				bottom	= vp.height + top
	//		}
			alert(left + " " + top + " " + right + " " + bottom);
			// Indices to display (one subtracted from ends to account for "0th" tiles).
			pixelDisplayRange = {
				xStart: vp.left   / ts,
				xEnd:   (vp.right  / ts) - 1,
				yStart: vp.top    / ts,
				yEnd: 	(vp.bottom / ts) - 1
			};
			//alert(pixelDisplayRange.xStart + " " + pixelDisplayRange.xEnd + " " + pixelDisplayRange.yStart + " " + pixelDisplayRange.yEnd);	
*/			
/*			xhr = new Ajax.Request(self.url, {
				method: 'POST',
				parameters: {
					action:    "buildMovie",
                	layers:    "SOHEITEIT304",
                	startDate: startTime,
					timeStep:  43200,
                	zoomLevel: zoomLevel,
                	numFrames: self.numFrames,
                	frameRate: self.frameRate,
                	edges:     self.edgeEnhance,
                	sharpen:   self.sharpen,
                	format:    "mov",
                	xRange:    "0,1174", //displayRange.xStart + "," + displayRange.xEnd,
					yRange:    "0,1174" //displayRange.yStart + "," + displayRange.yEnd
					// Either add timeStep here or calculate it later?
				},
				
				onComplete: function (transport) {
					// Let user know that video is ready
//					var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
					var url = self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON;
					alert(url);
//					Event.observe(linkId, 'click', function () {
						Shadowbox.open({
							player:  'iframe',
						    title:   'Helioviewer Movie Player',
					      	height:   650,
					        width:    550,
					        content: url // self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON
//						});
					}); 
				}
			}); */
		});
	}, 
});

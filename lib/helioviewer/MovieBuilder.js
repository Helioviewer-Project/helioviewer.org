/**
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
 * @TODO Modify css to add "#movie-button", add hover function, add click animation, add real action function
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Jaclyn Beck
 */

var MovieBuilder = Class.create(UIElement, {
	/*
	 * @description Default options that user cannot change at the moment.
	 */
	defaultOptions: {
		url         : "api/index.php",
		numFrames   : 10,
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
		this.building	= false;
			
		var self = this;
		
		this.button.click(function() {	
			var helioviewer = self.controller, xhr, zoomLevel, displayRange, startTime, layers, visibleCoords, tileLayers, hcOffset;
			if (self.building) {
				helioviewer.messageConsole.info("Your movie is already being built. The link to view the movie will appear here shortly.");
			}
			
			else {
				var zoomLevel, startTime, hqformat, layers = $A(), layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), xhr;
				self.building = true;
				zoomLevel = helioviewer.viewport.zoomLevel;
				
				// startTime is in unix timestamp format in seconds
				startTime = helioviewer.date.getTime() / 1000;
				hqformat = "mov";

				// Get the layer information
				layers = helioviewer.getViewportInformation();
				layerNames 		= layers.layerNames;
				layerOpacities 	= layers.layerOpacities;
				layerXRanges 	= layers.layerXRanges;
				layerYRanges 	= layers.layerYRanges;
				hcOffset 		= layers.hcOffset;
				
				xhr = new Ajax.Request(self.url, {
					method: 'POST',
					parameters: {
						action: "buildMovie",
						layers: layerNames.join(),
						startDate: startTime,
						timeStep: 43200,
						zoomLevel: zoomLevel,
						numFrames: self.numFrames,
						frameRate: self.frameRate,
						edges: self.edgeEnhance,
						sharpen: self.sharpen,
						format: "mov",
						opacity: layerOpacities.join(),
						hcOffset: hcOffset.x + "," + hcOffset.y,
						
						// Joining these with the "/" delimiter because the x and yRanges are already separated by commas.
						xRange: layerXRanges.join("/"),
						yRange: layerYRanges.join("/")
					},
					
					onComplete: function(transport) {
						// Let user know that video is ready
						var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
						var url = self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON;
						self.building = false;
						
						Event.observe(linkId, 'click', function() {
							Shadowbox.open({
								player: 'iframe',
								title: 'Helioviewer Movie Player',
								height: 650,
								width: 550,
								content: url // self.url + '?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON
							});
						}); 
					}
				}); 
			} 
		});
	}
});

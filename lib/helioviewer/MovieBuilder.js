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
		
		var self = this;
		
		this.button.click(function() {
			// The array that will hold all of the images to be compiled into a movie.
			self.imageSeries = [];

			var helioviewer = self.controller, xhr, zoomLevel, displayRange, startTime;
			zoomLevel = helioviewer.viewport.zoomLevel;
			displayRange = helioviewer.viewport.displayRange();
			// startTime is in unix timestamp format in seconds
			startTime = helioviewer.date.getTime() / 1000;

			xhr = new Ajax.Request(self.url, {
				method: 'POST',
				parameters: {
					action:    "buildMovie",
                	layers:    "SOHEITEIT304",
                	startDate: startTime,
					timeStep:  86400,
                	zoomLevel: zoomLevel,
                	numFrames: self.numFrames,
                	frameRate: self.frameRate,
                	edges:     self.edgeEnhance,
                	sharpen:   self.sharpen,
                	format:    "mov",
                	xRange:    displayRange.xStart + ", " + displayRange.xEnd,
					yRange:    displayRange.yStart + ", " + displayRange.yEnd
					// Either add timeStep here or calculate it later?
				},
				
				onComplete: function (transport) {
					// Let user know that video is read
					var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
	
/*					Event.observe(linkId, 'click', function () {
						Shadowbox.open({
							player:  'iframe',
						    title:   'Helioviewer Movie Player',
					      	height:   650,
					        width:    550,
					        content: self.url + '?action=playMovie&format=' + hqFormat + '&url=' + transport.responseJSON
						});
					}); */
				}
			});
			alert(zoomLevel);
		});
	},
});

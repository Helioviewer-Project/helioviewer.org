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
	initialize: function (controller) {
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#movie-button");
		this.viewport 	= this.controller.viewport;	
		this.building	= false;
		this.percent = 0;
		var self = this;

		this.button.click(function () {			
			var helioviewer = self.controller, visibleCoords;

/*			if (self.building) {
				helioviewer.messageConsole.info("Your movie is already being built. The link to view the movie will appear here shortly.");
			}
*/		
			// visibleCoords is only calculated separately in cases where the selected region is not the whole viewport.
			if(!self.building) {
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords(); 
				self.buildMovie(self, visibleCoords);
			}
		});
	},

	buildMovie: function (self, visibleCoords) {	
		var helioviewer = self.controller, zoomLevel, startTime, hqformat, timeout, layers = $A(), layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), xhr, hcOffset;
		self.building = true;

		zoomLevel = helioviewer.viewport.zoomLevel;
		
		// startTime is in unix timestamp format in seconds
		startTime = helioviewer.date.getTime() / 1000;
		hqformat = "mov";

		// Get the image width and height
		vpWidth  = visibleCoords.right  - visibleCoords.left;
		vpHeight = visibleCoords.bottom - visibleCoords.top;	

		// phpvideotoolkit can only use even numbers for image dimensions		
		if(vpWidth % 2 != 0)
			vpWidth += 1;
		if(vpHeight % 2 != 0)
			vpHeight += 1;
			
		// Get the layer information
		layers = helioviewer.getViewportInformation(visibleCoords);
		layerNames 		= layers.layerNames;
		hcOffset 		= layers.hcOffset;
	
		timeout = (1000 * layerNames.length * this.numFrames) / 100; 
		self.percent  = 0;
		self.updateProgress(timeout);	

		xhr = new Ajax.Request(this.url, {
			method: 'POST',
			parameters: {
				action: 	"buildMovie",
				layers: 	layerNames.join("/"),
				startDate: 	startTime,
				timeStep: 	43200,
				zoomLevel: 	zoomLevel,
				numFrames: 	self.numFrames,
				frameRate: 	self.frameRate,
				edges: 		self.edgeEnhance,
				sharpen: 	self.sharpen,
				format: 	"mov",
				hcOffset: 	hcOffset.x + "," + hcOffset.y,
				imageSize:	vpWidth + "," + vpHeight
			},

			onComplete: function (transport) {
				self.fire('video-done');
				// Let user know that video is ready
				var linkId, url;
				linkId = helioviewer.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
				url = 'api/index.php?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON + '&width=' + vpWidth + '&height=' + vpHeight;
				self.building = false;
		
				Event.observe(linkId, 'click', function () {
					Shadowbox.open({
						player:	'iframe',
						title: 	'Helioviewer Movie Player',
						height: vpHeight + 20,
						width: 	vpWidth  + 20,
						content: url
					});
				}); 
			}
		}); 
	}, 
	
	updateProgress: function (timeout) {
		this.observe(this, 'video-done', function () { this.percent = 101; });
		
		if (this.percent <= 100) {
			this.controller.messageConsole.progress('Movie loading: ' + this.percent + '%');
			this.percent += 1;
			setTimeout(function (thisObj) {
				thisObj.updateProgress(timeout);
			}, timeout, this);
		}	
	},
	
	observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
	}
});

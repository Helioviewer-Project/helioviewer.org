/**
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
 * @TODO Modify css to add "#movie-button", add hover function, add click animation, add real action function
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Jaclyn Beck
 * 
 * Syntax: Prototype, jQuery ()
 */
/*global Class, jQuery, $, $A, Ajax, Builder, Shadowbox, setTimeout, window */
var MovieBuilder = Class.create(
	/** @lends MovieBuilder.prototype */
    {
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
	initialize: function (controller) {
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#movie-button");
		this.viewport 	= this.controller.viewport;	
		
		this.mediaSettings = this.controller.mediaSettings;
		this.building	= false;
		this.percent = 0;
		var self = this;

		this.button.click(function () {			
			var helioviewer = self.controller, visibleCoords;

			if (self.building) {
				self.mediaSettings.shadowboxWarn('Warning: Your movie is already being built. A link to view the movie will appear shortly.');
			}

			if (!self.building) {
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords(); 			
				self.buildMovie(self, visibleCoords);
			}
		});
	},
		
	buildMovie: function (self, visibleCoords) {
		var helioviewer = self.controller, hqFormat, mediaSettings, timeout, imgHeight, imgWidth, options, filename, xhr, dateString;

		self.building = true;	
		mediaSettings = self.mediaSettings;
		mediaSettings.getDefaultInformation(self.mediaSettings, visibleCoords);	

		imgWidth  = mediaSettings.width; 
		imgHeight = mediaSettings.height; 

		hqFormat  	= mediaSettings.hqFormat;
		filename	 = mediaSettings.filename;
		
		dateString = helioviewer.date.toISOString();
	
//		timeout = (1000 * layerNames.length * self.numFrames) / 100; 
//		self.percent  = 0;
//		self.updateProgress(timeout);	

		xhr = new Ajax.Request(self.url, {
			method: 'POST',
			parameters: {
				action: 	"buildMovie",
				layers: 	(mediaSettings.layers).join("/"),
				startDate: 	mediaSettings.startTime,
				timeStep: 	mediaSettings.timeStep,
				zoomLevel: 	mediaSettings.zoomLevel,
				numFrames: 	mediaSettings.numFrames,
				frameRate: 	mediaSettings.frameRate,
				edges: 		mediaSettings.edgeEnhance,
				sharpen: 	mediaSettings.sharpen,
				format: 	hqFormat,
				imageSize:	imgWidth + "," + imgHeight,
				filename:	filename
			},

			onComplete: function (transport) {
                jQuery(this).trigger('video-done');
                
				// Let user know that video is ready
//				linkId = helioviewer.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
				self.building = false;

				// If the response is an error message instead of a url, show the message
				if (transport.responseJSON === null) {
					mediaSettings.shadowboxWarn(transport.responseText);
				}	
				
				else {			
					options = {
						sticky: true,
						open:	function () {
							var hqfile, download, watch;
							hqfile = (transport.responseJSON).slice(0, -3) + hqFormat;
							
							download = jQuery('#download-' + filename);
							watch	 = jQuery('#watch-' + filename);

							// Download the hq file
							download.click(function () {
								window.open('api/index.php?action=downloadFile&url=' + hqfile, '_parent');
							});
							
							// Open shadowbox and display movie
							watch.click(function () {
								self.playMovie(helioviewer, imgWidth, imgHeight, transport);
							});
						}
					};

					helioviewer.messageConsole.info("<div id='watch-" + filename + "' style='cursor: pointer'>Click here to watch '" + filename + "'</div>" +
						"-or-<br />" + 
						"<div id='download-" + filename + "' style='cursor: pointer'>Click here to download a high-quality version.</div>", options);
				} 
			}
		}); 
	}, 

	/**
	 * Calculates what dimensions the image has, whether to scale it or not, and how big Shadowbox should be. 
	 * Opens Shadowbox to play the movie.
	 */
	playMovie: function (helioviewer, imgWidth, imgHeight, transport) {
		var url, vpWidth, vpHeight, vpDimensions, sbHeight, sbWidth;
		vpDimensions = helioviewer.viewport.getDimensions();
		vpWidth  = vpDimensions.width;
		vpHeight = vpDimensions.height;
		
		// Scale to 80% if the movie size is too large to display without scrollbars.
		if (imgWidth >= vpWidth || imgHeight >= vpHeight) {
			imgWidth  = imgWidth * 0.8;
			imgHeight = imgHeight * 0.8;
		}
		
		url = 'api/index.php?action=playMovie&url=' + transport.responseJSON + '&width=' + imgWidth + '&height=' + imgHeight;	
		
		sbWidth = imgWidth + 40;
		sbHeight = imgHeight + 40;
		
		// 7-13-2009 -- Changed the player from 'iframe' to 'html' so that the movie could be surrounded by nice rounded corners and transparent border.
		Shadowbox.open({
			player: 'html',
			title: 'Helioviewer Movie Player',
			height: sbHeight + 45,
			width: 	sbWidth  + 40,
			content: 	'<div class="ui-corner-all ui-corner-clearfix" style="margin: 10px; padding: 10px; background: black">' + 
						'<iframe src=' + url + ' width=' + sbWidth + ' height=' + sbHeight + ' frameborder=0>' + 
						'</div>'
		});									
	},	
	
	updateProgress: function (timeout) {
        var self = this;
        
		jQuery(this).bind('video-done', function () { self.percent = 101; });
        
		
		if (this.percent <= 100) {
			this.controller.messageConsole.progress('Movie loading: ' + this.percent + '%');
			this.percent += 1;
			setTimeout(function (thisObj) {
				thisObj.updateProgress(timeout);
			}, timeout, this);
		}	
	}
});

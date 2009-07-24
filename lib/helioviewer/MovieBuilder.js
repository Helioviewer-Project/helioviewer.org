/**
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
 * @TODO Modify css to add "#movie-button", add hover function, add click animation, add real action function
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Jaclyn Beck
 */
/*global Class, UIElement, jQuery, $, $A, Ajax, Builder, Shadowbox, setTimeout */
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
			var helioviewer = self.controller, visibleCoords, movieSettings = $A();

			if (self.building) {
				self.shadowboxWarn('Warning: Your movie is already being built. A link to view the movie will appear shortly.');
			}

			if (!self.building) {
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords(); 			
				self.buildMovie(self, visibleCoords);
			}
		});
	},
		
	buildMovie: function (self, visibleCoords) {
		var helioviewer = self.controller, zoomLevel, startTime, timeStep, hqformat, timeout, layers = $A(), layerNames = $A(), imgHeight, imgWidth, vpWidth, vpHeight, sbWidth, sbHeight, maxImgSize, hcOffset, url, xhr, dateString, showImgIfGap, emailUser, emailAddress, vpDimensions;

		self.building = true;	
		self.mediaSettings.getDefaultInformation(self.mediaSettings, visibleCoords);	
					
		// startTime is in unix timestamp format in seconds
		zoomLevel = self.mediaSettings.zoomLevel; 
		startTime = self.mediaSettings.startTime;
		timeStep  = self.mediaSettings.timeStep;

		imgWidth  = self.mediaSettings.width; 
		imgHeight = self.mediaSettings.height; 

		// Get all of the layer information
		//layers 	= helioviewer.getViewportInformation(visibleCoords);
		layerNames 	= self.mediaSettings.layers; //layers.layerNames;
		hcOffset 	= self.mediaSettings.hcOffset; //layers.hcOffset;
		hqformat  	= self.mediaSettings.hqFormat;
		hcOffset	= self.mediaSettings.hcOffset;

		showImgIfGap = self.mediaSettings.showImgIfGap;
		emailUser	 = self.mediaSettings.emailUser;
		emailAddress = self.mediaSettings.emailAddress;
		
		dateString = helioviewer.date.toISOString();
	
		timeout = (1000 * layerNames.length * self.numFrames) / 100; 
		self.percent  = 0;
//		self.updateProgress(timeout);	

		xhr = new Ajax.Request(self.url, {
			method: 'POST',
			parameters: {
				action: 	"buildMovie",
				layers: 	layerNames.join("/"),
				startDate: 	startTime,
				timeStep: 	43200,
				zoomLevel: 	zoomLevel,
				numFrames: 	self.mediaSettings.numFrames,
				frameRate: 	self.mediaSettings.frameRate,
				edges: 		self.mediaSettings.edgeEnhance,
				sharpen: 	self.mediaSettings.sharpen,
				format: 	"mov",
				hcOffset: 	hcOffset.x + "," + hcOffset.y,
				imageSize:	imgWidth + "," + imgHeight
			},

			onComplete: function (transport) {
				self.fire('video-done');
				// Let user know that video is ready
//				linkId = helioviewer.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
				self.building = false;
				
				vpDimensions = helioviewer.viewport.getDimensions();
				vpWidth = vpDimensions.width;
				vpHeight = vpDimensions.height;
				
				// Scale to 80% if the movie size is too large to display without scrollbars.
				if (imgWidth >= vpWidth || imgHeight >= vpHeight) {
					imgWidth  = imgWidth * 0.8;
					imgHeight = imgHeight * 0.8;
				}
				
				url = 'api/index.php?action=playMovie&format=' + hqformat + '&url=' + transport.responseJSON + '&width=' + imgWidth + '&height=' + imgHeight;	

				sbWidth = imgWidth + 40;
				sbHeight = imgHeight + 40;
//				Event.observe(linkId, 'click', function () {
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
//				}); 
			}
		}); 
	}, 
	
	shadowboxWarn: function (message) {
		Shadowbox.open({
			options:	{
				onFinish: function () {
					jQuery('#ok-button').click(function () {
						Shadowbox.close();						
					});
				}			
			},
			player:	"html",
			width:	400,
			height:	170,
			content:	'<div id="shadowbox-form" class="ui-widget-content ui-corner-all ui-helper-clearfix" style="margin: 10px; padding: 20px; font-size: 12pt;">' + 
						message + '<br /><br />' + 
						'<div id="buttons" style="text-align: left; float: right;">' +
							'<button id="ok-button" class="ui-state-default ui-corner-all">OK</button>' +
						'</div>' + 
						'</div>'
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

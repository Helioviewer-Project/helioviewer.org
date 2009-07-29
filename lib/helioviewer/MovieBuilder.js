/**
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
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

	/**
	 * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
	 * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
	 * @param {Object} controller -- the helioviewer class 
	 */	
	initialize: function (controller) {
		Object.extend(this);
		this.url 		= "api/index.php";
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
				
				// Check to see if the user wants more than 3 layers in their movie. If they do,
				// they will have to pick 3. 
				// checkMovieLayers will start the building process when it is done checking.	
				self.checkMovieLayers(self, visibleCoords);
			}
		});
	},

	/**
	 * @description Checks to make sure there are 3 or less layers in the movie. If there are more, user is presented with
	 * 				pop-up in Shadowbox asking them to pick 3 layers.
	 * @param {Object} self 
	 * @param {Object} visibleCoords -- An array containing the top, left, bottom, right coordinates of:
	 * 					 1) what is currently visible in the viewport, or
	 * 					 2) a selected region within the viewport.
	 * 					Note that these coordinates are heliocentric, with the center of the sun being (0,0).
	 * 					
	 */
	checkMovieLayers: function (self, visibleCoords) {
		var finalLayers = $A(), layers, table, info, rawName, name, tableValues, checkboxes;
		
		// Refresh settings in case something has changed.
		self.mediaSettings.getSettings(self.mediaSettings, visibleCoords);	
		layers = self.mediaSettings.layers;

		// If there are between 1 and 3 layers, continue building.
		if (layers.length <= 3 && layers.length >= 1) {
			self.buildMovie(self, layers);
		}	
		
		// Otherwise, prompt the user to pick 3 layers.
		else {
			Shadowbox.open({
				player:	"html",
				width: 	450,
				// Adjust height depending on how much space the text takes up (roughly 20 pixels per layer name, and a base height of 150)
				height: 150 + layers.length * 20,

				// Put an empty table into shadowbox. Rows of layers need to be dynamically added through javascript.
				content: '<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix" style="margin: 10px; padding: 20px; font-size: 12pt;" >' +
							'Please select only 3 layers from the choices below for the movie: <br />' +
							'<table id="layers-table">' + 
							'</table>' + 
							'<div id="buttons" style="text-align: left; float: right;">' +
								'<button id="ok-button" class="ui-state-default ui-corner-all">OK</button>' +
							'</div>' +
						'</div>',
						
				options:	{
					onFinish: function () {

						table = $('layers-table');
						tableValues = "";
						
						// Get a user-friendly name for each layer. each layer in "layers" is a string: 
						// "obs,inst,det,meas,visible,opacity'x'XStart,XEnd,YStart,YEnd,offsetX,offsetY"	
						layers.each(function (l) {
							info = l.split('x');
							// Extract the first part of the layer string (obs,inst,det,meas,visible,opacity) and slice off the last two values.
							rawName = (info[0]).split(',').slice(0, -2);
							name = rawName.join(" ");
							tableValues += '<tr>' +
									'<td class="layers-checkbox"><input type=checkbox name="layers" checked=true value="' + l + '"/></td>' +
									'<td class="layers-name">' + name + '</td>' + 
								'</tr>';
						});	
						
						table.innerHTML += tableValues;
						
						// Set up event handler for the button
						jQuery('#ok-button').click(function () {
							checkboxes = jQuery('td.layers-checkbox');
							
							// checkboxes is an array of each <td.layers-checkbox> that exists in the table
							// "this" represents an individual element in the array.
							// So "this" would be one <td.layers-checkbox>, and this.firstChild is its <input type=checkbox>
							checkboxes.each(function () {
								// If the checkbox is selected, add that layer. The value is the full name of the layer as found in the array "layers".
							    if (this.firstChild.checked) {
									finalLayers.push(this.firstChild.value);
								}
							});

							if (finalLayers.length <= 3 && finalLayers.length >= 1) {
								self.buildMovie(self, finalLayers);
								Shadowbox.close();
							}
							
							// If the user still hasn't entered a valid number of layers, keep the prompt open and warn them
							else {
								// clear out finalLayers and try again
								finalLayers = $A();
								self.controller.messageConsole.error("Please select between 1 and 3 layer choices.");
							}
						});
					}
				}
			});
		}
	},		

	/**
	 * @description Uses the layers passed in to send an Ajax request to api.php, to have it build a movie.
	 * 				Upon completion, it displays a notification that lets the user click to view it in Shadowbox
	 * 				or download the high quality version. 
	 * @param {Object} self
	 * @param {Object} layers -- An array of layer strings in the format: "obs,inst,det,meas,visible,opacity'x'XStart,XEnd,YStart,YEnd,offsetX,offsetY"	
	 */
	buildMovie: function (self, layers) {
		var helioviewer = self.controller, hqFormat, mediaSettings, timeout, imgHeight, imgWidth, options, filename, xhr;

		self.building = true;	
		mediaSettings = self.mediaSettings;

		imgWidth  = mediaSettings.width; 
		imgHeight = mediaSettings.height; 

		hqFormat  = mediaSettings.hqFormat;
		filename  = mediaSettings.filename;	

		/*
		 * timeout is calculated to estimate the amount of time a movie will take to build. From benchmarking, I estimated about 1 second 
		 * per layer, per frame, to be the general case. C2 and C3 layers sometimes take longer but this is a good general equation.
		 * It will need to be adjusted when the database scales up to account for the amount of time queries take.
		 * 
		 * A movie with 40 frames and 2 layers would then take 1000 ms * 2 layers * 40 frames = 80000 ms, or 80 seconds. Then we want to 
		 * divide that evenly over 100% so that each 1% gets added at regular intervals. so 80000 ms / 100 = 800 ms, or .8 seconds in between
		 * adding 1% to the progress counter.
		 */
//		timeout = (1000 * layerNames.length * self.numFrames) / 100; 
//		self.percent  = 0;
//		self.updateProgress(timeout);	

		xhr = new Ajax.Request(self.url, {
			method: 'POST',
			parameters: {
				action: 	"buildMovie",
				layers: 	layers.join("/"),
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
     
	 			/* 
	 			 * Not using linkId any more because there are two now options in the same notification, so linkId.click() is no
				 * longer useful.           
				 * // Let user know that video is ready
 				 * linkId = helioviewer.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
 				 */
				
				self.building = false;

				// If the response is an error message instead of a url, show the message
				if (transport.responseJSON === null) {
					mediaSettings.shadowboxWarn(transport.responseText);
				}	
				
				else {
					// Options for the jGrowl notification. After it has opened, it will create event listeners for the download
					// and watch links			
					options = {
						sticky: true,
						open:	function () {
							var hqfile, download, watch;
							// chop off the flv at the end of the file and replace it with mov/asf/mp4
							hqfile = (transport.responseJSON).slice(0, -3) + hqFormat;
							
							download = jQuery('#download-' + filename);
							watch	 = jQuery('#watch-' + filename);

							// Download the hq file event listener
							download.click(function () {
								window.open('api/index.php?action=downloadFile&url=' + hqfile, '_parent');
							});
							
							// Open shadowbox and display movie event listener
							watch.click(function () {
								self.playMovie(helioviewer, imgWidth, imgHeight, transport);
							});
						}
					};

					// Make the jGrowl notification with the options above.
					helioviewer.messageConsole.info("<div id='watch-" + filename + "' style='cursor: pointer'>Click here to watch '" + filename + "'</div>" +
						"-or-<br />" + 
						"<div id='download-" + filename + "' style='cursor: pointer'>Click here to download a high-quality version.</div>", options);
				} 
			}
		}); 
	}, 

	/**
	 * @description Calculates what dimensions the image has, whether to scale it or not, and how big Shadowbox should be. 
	 * 				Opens Shadowbox to play the movie.
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
		
		// 40 seems to be a good size for the iframe to completely surround the div. Can be changed if necessary.
		sbWidth  = imgWidth  + 40;
		sbHeight = imgHeight + 40;
		
		// 7-13-2009 -- Changed the player from 'iframe' to 'html' so that the movie could be surrounded by nice rounded corners and transparent border.
		Shadowbox.open({
			player	: 'html',
			title	: 'Helioviewer Movie Player',
			height	: sbHeight + 45,
			width	: sbWidth  + 40,
			content	: 	'<div class="ui-corner-all ui-helper-clearfix" style="margin: 10px; padding: 10px; background: black">' + 
							'<iframe src=' + url + ' width=' + sbWidth + ' height=' + sbHeight + ' frameborder=0>' + 
						'</div>'
		});									
	},	

	/**
	 * @description Displays a percentage, starting at 0, and increments it by one every <timeout> seconds. It is here so users
	 * 				can tell something is going on. 
	 * @param {Object} timeout -- a value in miliseconds that was calculated in buildMovie as an estimate of how long the movie 
	 * 								will take to build / 100.
	 */	
	updateProgress: function (timeout) {
        var self = this;
        
		// If 'video-done' is fired off, self.percent will e 101 so the next if statement will fail, and
		// the process will stop.
		jQuery(this).bind('video-done', function () { self.percent = 101; });
        
		if (this.percent <= 100) {
			this.controller.messageConsole.progress('Movie loading: ' + this.percent + '%');
			this.percent += 1;
			// call this function after <timeout> seconds.
			setTimeout(function (thisObj) {
				thisObj.updateProgress(timeout);
			}, timeout, this);
		}	
	}
});

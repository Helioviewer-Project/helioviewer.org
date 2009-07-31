/**
 * @author Jaclyn Beck
 * @fileoverview Contains the definition of a class that stores all settings relating to screenshots and movies.
 * 					This class has two jobs: 
 * 					1) store media settings, and
 * 					2) handle generation of the settings dialog that is created when the user clicks the settings button.
 * 
 * syntax: prototype, jQuery ()
 */
/*global jQuery, $, $A, Class, Ajax, Shadowbox */

var MediaSettings = Class.create(
	/** @lends MediaSettings.prototype */
    {
	/**
	 * @description Default options that user cannot change without opening media settings. These are loaded upon class creation.
	 */
	defaultOptions: {
		url         : "api/index.php",
		numFrames   : 40,
		frameRate   : 8,
		sharpen     : false,
		edgeEnhance : false,
		format      : {win: "asf", mac: "mov", linux: "mp4"},
		showImgIfGap: true,
		emailUser	: false,
		emailAddress: "",
		quality		: 8,
		filename	: ""
	},

	/**
	 * @constructs
	 * @description Loads default options, and creates a set of settings based on what is currently in the viewport. Also
	 * 				creates an event handler for the settings button.
	 * @param {Object} controller
	 */
	initialize: function (controller) {
		var visibleCoords, self;
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#settings-button");
		this.viewport 	= this.controller.viewport;
		
		// Have a set of settings ready in case the user never clicks on this button.
		visibleCoords = this.viewport.getHCViewportPixelCoords(); 
		this.getSettings(visibleCoords);
		
		self = this;
		
		// Refetch the viewport coordinates in case something's changed, refresh settings, and load dialog
		this.button.click(function () {
			visibleCoords = self.controller.viewport.getHCViewportPixelCoords(); 
			self.getSettings(self, visibleCoords);
			self.initSettingsDialog(self);
		});
	},

	/** 
	 * @description Pulls all necessary information from the viewport and time controls so that the user can customize them if they want to.
	 * 				Currently customizable options are: numFrames, timeStep, layers (which ones), start date/time, end date/time, image width, 
	 * 				image height, quality, format, filename, show layers if data gap, email link, and email address. 
	 * 
	 * Once the information is gathered, it is stored in this object. This method is called by takeScreenshot, buildMovie, and by clicking
	 * the settings button.

	 * @param {Array} visibleCoords -- heliocentric top, left, right, and bottom coordinates of either the entire viewport or a selected region.
	 */
	getSettings: function (visibleCoords) {
		var helioviewer = this.controller, vpWidth, vpHeight, maxImgSize, imgWidth, imgHeight;
			
		// startTime is in unix timestamp format in seconds. date.getTime() returns miliseconds so it needs to be divided by 1000.
		this.startTime = helioviewer.date.getTime() / 1000;
		
		// timeStep is in seconds
		this.timeStep  = helioviewer.timeControls.getTimeIncrement(); 
		this.hqFormat  = this.format.mac;
		
		// Default filename is the unix timestamp of the current time.
		this.filename  = (new Date()).getTime();

		this.dateString = helioviewer.date.toISOString();
		this.zoomLevel 	= helioviewer.viewport.zoomLevel;
				
		// Get the image width and height
		vpWidth  = visibleCoords.right  - visibleCoords.left;
		vpHeight = visibleCoords.bottom - visibleCoords.top;    

		maxImgSize = helioviewer.tileLayers.getMaxJP2Dimensions();
		
		// If the image is smaller than the visibleCoords area, then just use the image's size		
		imgWidth  = Math.round(Math.min(vpWidth,  maxImgSize.width));
		imgHeight = Math.round(Math.min(vpHeight, maxImgSize.height));		
		
		// phpvideotoolkit can only use even numbers for image dimensions               
		if (imgWidth % 2 !== 0) {
			imgWidth += 1;
		}
		if (imgHeight % 2 !== 0) {
			imgHeight += 1;
		}

		this.width 		= imgWidth;
		this.height 	= imgHeight;
		                 	
		// Get the layer information
		this.layerNames = this.getImageInformation(visibleCoords, vpWidth, vpHeight);
		
		// The default layers are those that are visible in the viewport, but this.layers can change if the user chooses. 
		this.layers   	= this.layerNames;	
	},

	/**
	 * @description Finds the jp2 image width/height, relative width/height, image coordinates, and hcOffset for each layer, 
	 * 				and adds those layers that are visible to an array. Returns the array of layers.
	 * @param {Array} visibleCoords -- heliocentric top, left, bottom, and right coordinates of either the viewport or the selected region
	 * @param {int} vpWidth -- width of the visibleCoords region (right-left)
	 * @param {int} vpHeight -- height of the visibleCoords region (bottom-top)
	 * @return {Array} layers -- array of all visible layers in string format: "obs,inst,det,meas,visible,opacity'x'XStart,XEnd,YStart,YEnd,offsetX,offsetY"
	 */
	getImageInformation: function (visibleCoords, vpWidth, vpHeight) {
		var self, layers = $A(), helioviewer, layerNames = $A(), imgCoords = $A();
		helioviewer = this.controller;

		this.hcOffset = this.getHCOffset(visibleCoords);
		self = this;
		
		// Only add visible tile layers to the array.
		helioviewer.tileLayers.each(function () {
			// "this" represents the tilelayer object
			if (this.visible) {
				var left, top, right, bottom, width, height, sizeOffset, jp2Width, jp2Height, xRange, yRange, relWidth, relHeight, layer = $A();
				
				// Making some aliases for clarity
				jp2Width 	= this.jp2Width;
				jp2Height 	= this.jp2Height;
				sizeOffset 	= this.width / this.relWidth;
				relWidth 	= jp2Width  / sizeOffset;
				relHeight 	= jp2Height / sizeOffset;
		
				// Convert viewport heliocentric coordinates into image coordinates
				left 	= Math.floor(visibleCoords.left + relWidth  / 2);
				top 	= Math.floor(visibleCoords.top  + relHeight / 2);
				right 	= Math.floor(visibleCoords.right  + relWidth  / 2);
				bottom 	= Math.floor(visibleCoords.bottom + relHeight / 2);
				
				/* 
				 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
				 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may be twice as large
				 * as its corresponding jp2 image. The sizeOffset for this image would be (image width)/(2x image width) or 0.5,
				 * so to get the pixel coordinate relative to the jp2 image, multiply "left" by .5, the sizeOffset.
				 * zoomOffset cannot be used here because images like LASCO C2 and C3 have different sizeOffsets than EIT images
				 * at the same zoomLevel.
				 * If "left" or "top" is less than 0, just use 0.
				 */
				left 	= Math.max(left * sizeOffset, 0);
				top 	= Math.max(top  * sizeOffset, 0);
				right 	= right  * sizeOffset;
				bottom 	= bottom * sizeOffset;
		
				// If the calculated width is greater than the possible width, just use the possible width. 							
				width  = Math.min((right - left), jp2Width - left);
				height = Math.min((bottom - top), jp2Height - top);
		
				// Round values off to the nearest integer, since you cannot have partial-pixels as a measurement
				width 	= Math.round(width);
				height 	= Math.round(height);
				left 	= Math.round(left);
				top 	= Math.round(top);
				
				// If the captured image just shows the black circular region of LASCO C2 or C3, don't even use that layer.		
				if (this.detector.toString() === "0C2" && left >= 437 && right <= 737 && top >= 437 && bottom < 737) {
					width = -1;
				}
				
				else if (this.detector.toString() === "0C3" && left >= 620 && right <= 781 && top >= 620 && bottom <= 781) {
					width = -1;
				}
							
				// If at least some of the image is currently visible, add that layer
				if (width > 0 && height > 0 && top < this.height && left < this.width) {
					xRange = {
						start: 	left,
						size: 	width
					};
					
					yRange = {
						start: 	top,
						size: 	height
					};
					
					// The -2 is there because 1 is added to odd-numbered dimensions for phpvideotoolkit, and if the dimensions are *.5, they are 
					// rounded up, making a difference of 2.
					// If this layer is the biggest layer, calculate the new image coords based around this layer.
					if (relWidth >= self.width - 2 || relHeight >= self.height - 2) {
						imgCoords = self.getImgCoords(xRange.start, xRange.size, yRange.start, yRange.size, jp2Width, jp2Height, relWidth, relHeight);
					}

					// Don't make a string out of the layer yet, because more work needs to be done on it and making a string and breaking it 
					// apart a couple lines further down is unnecessary.
					layer = {
						name	 : this.toString(),
						xRange	 : xRange,
						yRange	 : yRange,
						relWidth : relWidth,
						relHeight: relHeight,
						jp2Width : jp2Width,
						jp2Height: jp2Height
					};

					layers.push(layer);
				}
		   }
		});

		// Cannot do this function until the largest layer is found, so let the above loop finish and start a new one.	
		// This loop finds each layer's hcOffset and then pushes all the layer info into a string.
		layers.each(function (l) {
			var distX = 0, distY = 0;
			/* 
			 * If the actual image is smaller than the original extracted region, need to adjust the hcOffset to reflect this.
			 * The hcOffset = (distance from center to top left corner). The top left corner may be outside the real jp2 image's top left corner. 
			 * To calculate the distance: Assume the top left corner of the jp2 image, relative to the center, is relWidth / 2. Next, we know that 
			 * the center is a certain percent of the whole visibleCoords width/height, so let's say it's 50% to the right and 50% to the bottom. Assume
			 * the actual image width has the same proportions, but is just smaller. Therefore, the center is still 50% to the right and 50% to the bottom.
			 * So to find the distance between the center of the image and the top left corner, multiply the image width/height * 50%. 
			 * 
			 * Next, adjust for the part of the jp2 image that already has the center in it. You don't want to pad the whole distance between top left corner
			 * and center, or the jp2 image's top left corner will be where the center is. So subtract relWidth / 2 from the distance to get the final, 
			 * adjusted hcOffset.
			 * 
			 * If the xRange.start is NOT 0, or the yRange.start is NOT 0, this adjustment doesn't even apply because the upper-left corner is already 
			 * inside the image, not somewhere outside it, so the hcOffset is calculated normally.
			 */	
			if (l.xRange.start == 0) {
				distX = Math.floor(imgCoords.left + l.relWidth / 2);
			}	
			
			if (l.yRange.start == 0) {
				distY = Math.floor(imgCoords.top + l.relHeight / 2);
			}			
			
			layerNames.push(l.name + "x" + l.xRange.start + "," + l.xRange.size + "," + l.yRange.start + "," + l.yRange.size + "," + distX + "," + distY);
		});
		return layerNames;	
	},
	
	/**
	 * How far away the heliocenter is from the top left corner of the viewport, and in which direction.
	 * Note that the convert command reverses "+" and "-" for the x-direction, 
	 * so "+" means push the image to the left, "-" means push it to the right.
	 * A +x means the heliocenter (0,0) is left of the top-left corner, and a +y means
	 * the heliocenter is above the top-left corner.
	 */	
	getHCOffset: function (visibleCoords) {
		var offset = {
			x: visibleCoords.left,
			y: visibleCoords.top
		};
			
		return offset;
	},

	/**
	 * @description Finds the image coordinates of the biggest layer in the set, since all other layers will be padded according
	 * 				to the biggest layer's coordinates. 
	 * 				This is done because in cases where the user selects a region that is larger than the actual image, the image will
	 * 				crop by centering around the actual image. See <picture> for a more detailed explanation.
	 * @param {int} xStart -- starting x coordinate of biggest layer
	 * @param {int} xSize -- width of biggest layer
	 * @param {int} yStart -- starting y coordinate of biggest layer
	 * @param {int} ySize -- height of biggest layer
	 * @param {int} jp2Width -- width of the jp2 image
	 * @param {int} jp2Height -- height of the jp2 image
	 * @param {int} relWidth -- relative width of the jp2 image
	 * @param {int} relHeight -- relative height of the jp2 image
	 */	
	getImgCoords: function (xStart, xSize, yStart, ySize, jp2Width, jp2Height, relWidth, relHeight) {
		var imgCoords = $A(), relXSize, relXStart, relYSize, relYStart;
		imgCoords = {
			left	: 0,
			top		: 0,
			right	: 0,
			bottom	: 0
		};
		
		// If the image starts at 0, the right side of the image is either inside the jp2 image or its border.
		// Get the image coordinates starting with the right side and going to the left.
		if (xStart == 0) {
			relXSize = xSize * relWidth / jp2Width;
			imgCoords.right = relXSize - relWidth / 2;
			imgCoords.left 	= imgCoords.right - this.width;
		}
		// Otherwise, do the opposite, start on the left side and go toward the right.
		else {
			relXStart = xStart * relWidth / jp2Width;
			imgCoords.left = relXStart - relWidth / 2;
			imgCoords.right = imgCoords.left + this.width;
		}
		// Same with the top and bottom.
		if (yStart == 0) {
			relYSize = ySize * relHeight / jp2Height; 
			imgCoords.bottom = relYSize - relHeight / 2;
			imgCoords.top = imgCoords.bottom - this.height;
		}
		else {
			relYStart = yStart * relHeight / jp2Height;
			imgCoords.top = relYStart - relHeight / 2;
			imgCoords.bottom = imgCoords.top + this.height;
		}		

		return imgCoords;
	},
	
	/**
	 * @description Passes information to settings.php so that it can print out the html markup needed for the form.
	 * When done, it passes the markup to printContent to open Shadowbox.
	 * @param {Object} self
	 */
	initSettingsDialog: function (self) {
		var xhr = new Ajax.Request('dialogs/settings.php', {
			method: 'POST',
			parameters: {
				mode:		"movie",
				startDate	: self.dateString,
				hqFormat	: self.hqFormat,
				width		: self.width,
				height		: self.height,
				layers		: self.layerNames.join("/"),
				timeStep	: self.timeStep,	
				quality		: self.quality,
				numFrames	: self.numFrames,
				showImgIfGap: self.showImgIfGap,
				emailUser	: self.emailUser,
				emailAddress: self.emailAddress,
				filename	: self.filename
			},
			
			onComplete: function (transport) {
				var contents = transport.responseText;
				self.printContent(self, contents);
			}
		});
	},
	
	/**
	 * @description Opens shadowbox and displays the html markup sent to it. Shadowbox then runs an event handler for when the 'submit'
	 * button is pushed. It grabs all of the values from the input fields in the form and sends them off to buildMovie.
	 * 
	 * @TODO This is just a rough idea of how it should look, but is fully functional. The UI needs work.
	 * @param {Object} contents -- html markup generated from dialogs/settings.php
	 */
	printContent: function (self, contents) {
		var email_field_visible, send_email, layers, startDate, startTime, userSettings = $A();
		
		// Width and heights are not good right now, need to be adjusted to look better.
		Shadowbox.open({
			player:	"html",
			width: 	450,
			height: 450,
			content: contents,
			
			options:	{
				// "enableKeys : false" allows the user to type things into fields in Shadowbox.
				enableKeys: false,
				onFinish: function () {
					// Turn the divs into tabs
					jQuery("#select-options-tabs").tabs({ selected: 0 });

					// jQuery('#emailLink')[0].checked is the same as $('emailLink').checked
					send_email = jQuery('#emailLink');	
					// boolean, true if checked.
					email_field_visible = send_email[0].checked;

					// Toggles whether the "email address" field is visible					
					send_email.click(function () {
						email_field_visible = !email_field_visible;

						if (email_field_visible) {
							jQuery("#email-field")[0].style.display = "";
						}
						
						else {
							jQuery("#email-field")[0].style.display = "none";
						}
					});
					
					// Clicking the submit button gathers all information from all fields and closes shadowbox.
					jQuery('#submit-options-button').click(function () {
						self.layers = $A();
						
						layers = jQuery('input[name=layers]');
						layers.each(function () {
							if (this.checked) {
								self.layers.push(this.value);
							}
						});

						startDate = jQuery('#startDate').val();
						startTime = jQuery('#startTime').val();
						
						userSettings = {
							numFrames 	: jQuery('#numFrames').val(),
							timeStep 	: jQuery('#timeStep').val(),
							
							width 		: jQuery('#width').val(),
							height 		: jQuery('#height').val(),
							
							quality 	: jQuery('#quality').val(),
							hqFormat 	: jQuery('#hqFormat').val(), 

							filename 	: jQuery('#filename').val(),
							
							showImgIfGap: jQuery('#dataGaps')[0].checked,
							emailUser	: jQuery('#emailLink')[0].checked,
							emailAddress: jQuery('#emailAddress').val()
						};

						// Load all the settings into this object.
						Object.extend(self, userSettings);
						
						Shadowbox.close();
					}); 
				}
			}
		});	
	},

	/**
	 * @description Opens shadowbox and displays the error message and an ok button.
	 * @param {Object} message -- string containing message, can also have html markup
	 */
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
	}
});
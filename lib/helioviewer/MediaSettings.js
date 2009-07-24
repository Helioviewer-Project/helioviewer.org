/**
 * @author Jaclyn Beck
 */
/*global jQuery, $, $A, Class, UIElement, Ajax, Shadowbox */

var MediaSettings = Class.create(UIElement, {
	/*
	 * @description Default options that user cannot change without opening media settings
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
		quality		: 8
	},

	initialize: function (controller) {
		var visibleCoords, self;
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#settings-button");
		this.viewport 	= this.controller.viewport;
		
		// Have a set of settings ready in case the user never clicks on this button.
		visibleCoords = this.controller.viewport.getHCViewportPixelCoords(); 
		this.getDefaultInformation(this, visibleCoords);
		
		self = this;
		this.button.click(function () {
			visibleCoords = self.controller.viewport.getHCViewportPixelCoords(); 
			self.getDefaultInformation(self, visibleCoords);
			self.initSettingsDialog(self);
		});
	},

	/** 
	 * Pulls all necessary information from the viewport and time controls so that the user can customize them if they want to.
	 * Currently customizable options are: numFrames, timeStep, layers (which ones), start date/time, end date/time, image width, 
	 * image height, quality, format, filename, show layers if data gap, email link, and email address. Unfortunately you cannot
	 * type anything into Shadowbox so the only options that can -actually- be changed are those with drop-down menus and checkboxes.
	 * 
	 * Once the information is gathered, it is either returned to the screenshot or moviebuilder classes or a request is sent to 
	 * 'dialogs/settings.php', which generates html markup for the form, inserting the information values where they belong.
	 * 
	 * The generated html markup is then sent to Shadowbox, which displays it and handles what happens from there.
	 * @param {Object} self
	 * @param {Object} visibleCoords
	 */
	getDefaultInformation: function (self, visibleCoords) {
		var helioviewer = self.controller, layers = $A(), layerNames = $A(), vpWidth, vpHeight, maxImgSize, imgWidth, imgHeight;
			
		// startTime is in unix timestamp format in seconds
		self.startTime = helioviewer.date.getTime() / 1000;
		self.timeStep  = helioviewer.timeControls.getTimeIncrement(); 
		self.hqFormat  = self.format.mac;

		self.dateString = helioviewer.date.toISOString();
		self.zoomLevel 	= helioviewer.viewport.zoomLevel;
				
		// Get the image width and height
		vpWidth  = visibleCoords.right  - visibleCoords.left;
		vpHeight = visibleCoords.bottom - visibleCoords.top;    

		// If the image is smaller than the visibleCoords area, then just use the image's size
		maxImgSize = helioviewer.tileLayers.getMaxDimensions();
		
		imgWidth  = Math.min(vpWidth,  maxImgSize.width);
		imgHeight = Math.min(vpHeight, maxImgSize.height);		
		
		// phpvideotoolkit can only use even numbers for image dimensions               
		if (imgWidth % 2 !== 0) {
			imgWidth += 1;
		}
		if (imgHeight % 2 !== 0) {
			imgHeight += 1;
		}

		self.width 		= imgWidth;
		self.height 	= imgHeight;
		                     	
		// Get the layer information
		self.layerNames = self.getViewportInformation(visibleCoords, imgWidth, imgHeight, vpWidth, vpHeight, self);
		
		// The default layers are those that are visible in the viewport, but self.layers can change if the user chooses. 
		self.layers   	= self.layerNames;	
	},

	getViewportInformation: function (visibleCoords, imgWidth, imgHeight, vpWidth, vpHeight, self) {
		var layers, hcOffset, helioviewer, layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), totalRanges = $A(), centerX, centerY;
		helioviewer = this.controller;

		this.hcOffset = this.getHCOffset(visibleCoords);

		// Find the center as a percentage of width and height, for example: a centered image
		// will be -.5,-.5, meaning the center is 50% of the width to the left and 50% of the height to the bottom. 
		// This will be used to line up image centers later. An image with more on the left
		// than on the right will have < -.5. An image that doesn't even have the center in it will either be
		// positive (image is to the right of the heliocenter) or -1 (image is to the left)
		centerX = visibleCoords.left / vpWidth;
		centerY = visibleCoords.top / vpHeight;	
		
		// Only add visible tile layers to the array.
		helioviewer.tileLayers.each(function (t) {
			if (t.visible) {
				var left, top, right, bottom, width, height, sizeOffset, jp2Width, jp2Height, xRange, yRange, relWidth, relHeight, relCenterX, relCenterY, distX, distY, xhr;
/*				var xmlhttp = false;
				if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
					try {
						xmlhttp = new XMLHttpRequest();
					} catch (e) {
						xmlhttp=false;
					}
				}
				if (!xmlhttp && window.createRequest) {
					try {
						xmlhttp = window.createRequest();
					} catch (e) {
						xmlhttp=false;
					}
				}
				url = "api/index.php?action=getJP2Dimensions&observatory=" + t.observatory + "\&instrument=" + t.instrument + "\&detector=" + t.detector + "\&measurement=" + t.measurement
				console.log(url);
				 xmlhttp.open("POST", url, false);
				xmlhttp.send(null); 
				if(xmlhttp.status == 200) {
				  	console.log(xmlhttp.responseText); */
		       // TODO: find a way to not hard-code these that doesn't take much time.
				jp2Width = 1034;
				if (t.detector == "0C2") {
					jp2Width = 1174;
				}
		
			 	if (t.detector == "0C3") {
					jp2Width = 1418;
				}
		
				jp2Height = jp2Width;
				sizeOffset = t.width / t.relWidth;
				relWidth = jp2Width / sizeOffset;
				relHeight = jp2Height / sizeOffset;
				
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
				if (t.detector == "0C2" && left >= 437 && right <= 737 && top >= 437 && bottom < 737) {
					width = -1;
				}
				
				else if (t.detector == "0C3" && left >= 637 && right <= 781 && top >= 637 && bottom <= 781) {
					width = -1;
				}
							
				// If at least some of the image is currently visible, add that layer
				if (width > 0 && height > 0 && top < t.height && left < t.width) {
					xRange = {
						start: 	left.toString(),
						size: 	width.toString()
					};
					
					yRange = {
						start: 	top.toString(),
						size: 	height.toString()
					};
		
		
					/* If the actual image is smaller than the original extracted region, need to adjust the hcOffset to reflect this.
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
					 * 
					 */	
					if (xRange.start == 0) {
						relCenterX = relWidth / 2;
						distX  = Math.floor(relWidth / 2 + imgWidth * centerX);	
					}	
					else {
						distX = 0;
					}
					if (yRange.start == 0) {
						relCenterY = relHeight / 2;
						distY  = Math.floor(relHeight / 2 + imgHeight * centerY);
					}	
					else {
						distY = 0;
					}
		
					layerNames.push(t + "x" + xRange.start + "," + xRange.size + "," + yRange.start + "," + yRange.size + "," + distX + "," + distY);
				}
		   }
 
 

/*				xhr = new Ajax.Request('api/index.php', {
					method: 'POST',
					parameters: {
						action		: 'getJP2Dimensions',
						observatory	: t.observatory,
						instrument	: t.instrument,
						detector	: t.detector,
						measurement	: t.measurement
					},
					
					onComplete: function (transport) {
						console.log(transport);
						console.log(transport.responseText);
*/				


//			}
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
	 * Passes information to settings.php so that it can print out the html markup needed for the form.
	 * When done, it passes the markup to printContent to open Shadowbox.
	 * @param {Object} self
	 * @param {Object} visibleCoords
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
				emailAddress: self.emailAddress		
			},
			
			onComplete: function (transport) {
				var contents = transport.responseText;
				self.printContent(self, contents);
			}
		});
	},
	
	/**
	 * Opens shadowbox and displays the html markup sent to it. Shadowbox then runs an event handler for when the 'submit'
	 * button is pushed. It grabs all of the values from the input fields in the form and sends them off to buildMovie.
	 * 
	 * @param {Object} contents
	 */
	printContent: function (self, contents) {
		var email_field_visible, send_email, layers, startDate, startTime, userSettings = $A();
		Shadowbox.open({
			player:	"html",
			width: 	450,
			height: 450,
			options:	{
				enableKeys: false,
				onFinish: function () {
					jQuery("#select-options-tabs").tabs({ selected: 0 });
	
					email_field_visible = jQuery('#emailLink')[0].checked;
					send_email = jQuery('#emailLink');
					
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
					
					jQuery('#submit-options-button').click(function () {
						self.layers = $A();
						layers = jQuery('input[name=layers]');
						for (var i = 0; i < layers.length; i += 1) {
							if (layers[i].checked) {
								self.layers.push(layers[i].value);
							}
						}

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

						Object.extend(self, userSettings);
						
						Shadowbox.close();

					}); 
				}
			},
			content: contents /*'dialogs/settings.php?mode=movie&' + 
				'startDate=' + self.dateString + 
				'&hqFormat=' + self.hqFormat + 
				'&width=' + self.width + 
				'&height=' + self.height +
				'&layers=' + self.layers.join("/") + 
				'&timeStep=' + self.timeStep */
		});	
	}
});
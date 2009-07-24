/**
 * @author Jaclyn Beck
 */
/*globals Class, $A, UIElement, jQuery*/
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
		Object.extend(this, this.defaultOptions);
		this.controller	= controller;
		this.button		= jQuery("#settings-button");
		this.viewport 	= this.controller.viewport;
		
		// Have a set of settings ready in case the user never clicks on this button.
		visibleCoords = this.controller.viewport.getHCViewportPixelCoords(); 
		this.getDefaultInformation(this, visibleCoords);
		
		var self = this;
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
		var helioviewer = self.controller, layers = $A(), layerNames = $A(), vpWidth, vpHeight, maxImgSize;
			
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
		if(vpWidth % 2 != 0)
			vpWidth += 1;
		if(vpHeight % 2 != 0)
			vpHeight += 1;
                     	
		// Get the layer information
		layers = this.getViewportInformation(visibleCoords);
		self.layerNames = layers.layerNames;
		xStart			= layers.xStart;
		yStart			= layers.yStart;
		xEnd			= layers.xEnd;
		yEnd			= layers.yEnd;
		// The default layers are those that are visible in the viewport, but self.layers can change if the user chooses. 
		self.layers   	= self.layerNames;

		/* If the actual image is smaller than the original extracted region, need to adjust the hcOffset to reflect this.
		 * The hcOffset = (distance from center to top left corner). The top left corner may be outside the real jp2 image's top left corner. 
		 * To find the top left corner coordinates, I assumed that the bottom right corner of the image begins at the xRange.end and yRange.end. 
		 * 
		 * Example: Assume the desired image size is 600x600, and that the extracted jp2 image is also a square.
		 * Assume xRange = (0,1020), or the whole image.
		 * Assume the zoomLevel is 11, making the zoomOffset 2^(11-10) = 2. So the relative image size is 1020/2 = 512x512.
		 * Assuming the bottom right corner of the image starts at (1020, 1020) on the real image and (512,512) on the relative-sized image,
		 * the top left corner would be at (end - width) or (512-512), or 0. The distance from center to corner is width/2.
		 * 
		 * Another example with different numbers: Assume xRange is now (0,700), same zoom level, same image size. 
		 * Relative image size is 700 / 2 = 350. The bottom right corner of the real image starts at (700, 700), and
		 * at (350, 350) on the relative-sized image. The top-left corner of an image that is 512x512 and has a bottom-
		 * right corner of (350,350) is at (350 - 512), or -162. The adjustment is therefore -162 pixels beyond the left corner of the real image.
		 * The distance between center and corner is (width/2) - -162.
		 * 
		 * If the xRange.start is NOT 0, or the yRange.start is NOT 0, this adjustment doesn't even apply because the upper-left corner is already 
		 * inside the image, not somewhere outside it, so the hcOffset is calculated normally.
		 * 
		 */		
		if(imgWidth < vpWidth || imgHeight < vpHeight) {
			zoomOffset 	= Math.pow(2, self.zoomLevel - helioviewer.baseZoom);
			if (imgWidth < vpWidth && xStart == 0) {
				xAdjust 	= (xEnd / zoomOffset) - imgWidth;		
				self.hcOffset.x = -((imgWidth / 2) - xAdjust);
				
			}	
			if (imgHeight < vpHeight && yStart == 0) {
				yAdjust = yEnd / zoomOffset - imgHeight;			
				self.hcOffset.y = -((imgHeight / 2) - yAdjust);
			}	
		}

		self.width 		= imgWidth;
		self.height 	= imgHeight;
	},

	getViewportInformation: function (visibleCoords) {
		var layers, hcOffset, helioviewer, layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), totalRanges = $A();
		helioviewer = this.controller;
		
		totalRanges = {
			xStart: null,
			xEnd:	null,
			yStart:	null,
			yEnd:	null,
			width:	null,
			height:	null
		};

		this.hcOffset = this.getHCOffset(visibleCoords);
	
		// Only add visible tile layers to the array.
		helioviewer.tileLayers.each(function (t) {
			if (t.visible) {
				var left, top, right, bottom, width, height, sizeOffset, jp2Width, imagesize, xRange, yRange, name;
				
                // TODO: find a way to not hard-code these that doesn't take much time.
                 jp2Width = t.width;
                 if (t.detector == "0C2") {
				 	jp2Width = 1174;
				 }

			 	if (t.detector == "0C3") {
					jp2Width = 1418;
				}
				
				sizeOffset = jp2Width / t.relWidth;

				// Convert viewport heliocentric coordinates into image coordinates
				left 	= Math.floor(visibleCoords.left + t.relWidth / 2);
				top 	= Math.floor(visibleCoords.top  + t.relHeight / 2);
				right 	= Math.floor(visibleCoords.right  + t.relWidth / 2);
				bottom 	= Math.floor(visibleCoords.bottom + t.relHeight / 2);
				
				/* 
				 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
				 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may be twice as large
				 * as its corresponding jp2 image. The sizeOffset for this image would be (image width)/(2x image width) or 0.5,
				 * so to get the pixel coordinate relative to the jp2 image, multiply "left" by 0.5, the sizeOffset.
				 * zoomOffset cannot be used here because images like LASCO C2 and C3 have different sizeOffsets than EIT images
				 * at the same zoomLevel.
				 * If "left" or "top" is less than 0, just use 0.
				 */
				left 	= Math.max(left * sizeOffset, 0);
				top 	= Math.max(top  * sizeOffset, 0);
				right 	= right  * sizeOffset;
				bottom 	= bottom * sizeOffset;

				// If the calculated width is greater than the possible width, just use the possible width. 							
				width  = Math.min((right - left), t.width  - left);
				height = Math.min((bottom - top), t.height - top);

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
					
					layerNames.push(t + "x" + xRange.start + "," + xRange.size + "," + yRange.start + "," + yRange.size);
					
					// If one of the total range values is null, they all will be, so only need to check if one is null.
					// If the total range width is less than this layer's width, this layer must be the largest layer so far,
					// so use this layer's values for the ranges.
					if(totalRanges.xStart == null || totalRanges.width < width || totalRanges.height < height) {
						totalRanges.xStart 	= xRange.start;
						totalRanges.xEnd 	= xRange.size;
						totalRanges.yStart 	= yRange.start;
						totalRanges.yEnd 	= yRange.size;
						totalRanges.width	= width;
						totalRanges.height	= height;
					}
				}
			}
		});
		
		layers = {
			layerNames: layerNames,
			xStart:		totalRanges.xStart,
			xEnd:		totalRanges.xEnd,
			yStart:		totalRanges.yStart,
			yEnd:		totalRanges.yEnd
		};
		//console.log(layers);
		return layers;
	},

	/**
	 * How far away the heliocenter is from the top left corner of the viewport, and in which direction.
	 * Note that the convert command reverses "+" and "-" for the x-direction, 
	 * so "+" means push the image to the left, "-" means push it to the right.
	 * A +x means the heliocenter (0,0) is left of the top-left corner, and a +y means
	 * the heliocenter is above the top-left corner.
	 */	
	getHCOffset: function (visibleCoords) {
		var left, top, offset;

		left 	= visibleCoords.left;
		top 	= visibleCoords.top;

		offset = {
			x: left,
			y: top
		};
			
		return offset;
	},
	
	/**
	 * Passes information to settings.php so that it can print out the html markup needed for the form.
	 * When done, it passes the markup to printContent to open Shadowbox.
	 * @param {Object} self
	 * @param {Object} visibleCoords
	 */
	initSettingsDialog: function(self) {
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
				contents = transport.responseText;
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
		Shadowbox.open({
			player:	"html",
			width: 	450,
			height: 450,
			options:	{
				enableKeys: false,
				onFinish: function() {
					jQuery("#select-options-tabs").tabs({ selected: 0 });
	
					email_field_visible = jQuery('#emailLink')[0].checked;
					send_email = jQuery('#emailLink');
					
					// Toggles whether the "email address" field is visible					
					send_email.click(function () {
						email_field_visible = !email_field_visible;
						if (email_field_visible) {
							jQuery("#email-field")[0].style.display = ""
						}
						
						else {
							jQuery("#email-field")[0].style.display = "none"
						}
					});
					
					jQuery('#submit-options-button').click(function() {
						self.layers = $A();
						var layers = jQuery('input[name=layers]');
						for(var i=0; i<layers.length; i++) {
							if (layers[i].checked) {
								self.layers.push(layers[i].value);
							}
						}

						startDate = jQuery('#startDate').val();
						startTime = jQuery('#startTime').val();

						date = new Date();
														
						var userSettings = $A();
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

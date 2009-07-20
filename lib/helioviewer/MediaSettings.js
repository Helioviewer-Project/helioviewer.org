/**
 * @author Jaclyn Beck
 */

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
	 * Once the information is gathered, a request is sent to 'dialogs/settings.php', which generates html markup for the form, 
	 * inserting the information values where they belong.
	 * 
	 * The generated html markup is then sent to Shadowbox, which displays it and handles what happens from there.
	 * @param {Object} self
	 * @param {Object} visibleCoords
	 */
	getDefaultInformation: function (self, visibleCoords) {
		var helioviewer = self.controller, layers = $A(), layerNames = $A(), vpWidth, vpHeight, maxImgSize;
			
		// startTime is in unix timestamp format in seconds
		self.startTime = helioviewer.date.getTime() / 1000;
		self.timeStep  = helioviewer.timeControls._timeIncrement;
		self.hqFormat  = self.format.mac;

		self.dateString = helioviewer.date.toISOString();
		self.zoomLevel 	= helioviewer.viewport.zoomLevel;
				
		// Get the image width and height
		vpWidth  = visibleCoords.right  - visibleCoords.left;
		vpHeight = visibleCoords.bottom - visibleCoords.top;    

		// If the image is smaller than the visibleCoords area, then just use the image's size
		maxImgSize = helioviewer.tileLayers.getMaxDimensions();
		
		vpWidth  = Math.min(vpWidth,  maxImgSize.width);
		vpHeight = Math.min(vpHeight, maxImgSize.height);		
		 
		// phpvideotoolkit can only use even numbers for image dimensions               
		if(vpWidth % 2 != 0)
			vpWidth += 1;
		if(vpHeight % 2 != 0)
			vpHeight += 1;
                     	
		// Get the layer information
		layers = helioviewer.getViewportInformation(visibleCoords);
		self.layerNames = layers.layerNames;
		self.hcOffset 	= layers.hcOffset;
		self.layers   	= self.layerNames;
		// The default layers are those that are visible in the viewport, but self.layers can change if the user chooses. 
		self.width 		= vpWidth;
		self.height 	= vpHeight;
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
	},
});
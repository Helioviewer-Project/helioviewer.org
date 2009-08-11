/**
 * @author Jaclyn Beck
 * @fileoverview Contains the code for the Screenshot Builder class. Handles event listeners for the screenshot button and
 * 				 screenshot creation.
 * Syntax: Prototype, jQuery ()
 */
var ScreenshotBuilder = Class.create(
	/** @lends ScreenshotBuilder.prototype */
    {

	/**
	 * @constructs
	 * @description Loads default options, grabs mediaSettings, sets up event listener for the screenshot button
	 * @param {Object} controller -- the helioviewer class 
	 */	
	initialize: function (controller) {
		Object.extend(this);
        this.button    	= jQuery("#screenshot-button");
		this.building 	= false;
		this.viewport	= controller.viewport;
		this.controller = controller;
		
		this.mediaSettings = this.controller.mediaSettings;
		
		var self = this, visibleCoords;
		this.button.click(function () {
			if (self.building) {
				self.messageConsole.info("A link to your screenshot will be available shortly.");
			}
			else {
				visibleCoords = self.viewport.getHCViewportPixelCoords();
				self.takeScreenshot(visibleCoords);
			}
		});
	},
	
	/**
	 * @description Gathers all necessary information to generate a screenshot, and then displays the image when it is ready.
	 * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right coordinates of the visible region 
	 */
	takeScreenshot: function (visibleCoords) {
		var helioviewer = this.controller, self, xhr, imgWidth, imgHeight, url, mediaSettings, download, options, filename;
		
		// Refresh the settings in case something has changed.
		mediaSettings 	= this.mediaSettings;
		mediaSettings.getSettings(visibleCoords);

		filename  = mediaSettings.filename;
		this.building = true;

		imgWidth  = mediaSettings.width; 
		imgHeight = mediaSettings.height; 

		self = this;
		xhr = new Ajax.Request('api/index.php', {
			method: 'POST',
			parameters: {
				action: 	"takeScreenshot",
				layers: 	(mediaSettings.layers).join("/"),
				obsDate: 	mediaSettings.startTime,
				zoomLevel: 	mediaSettings.zoomLevel,
				edges: 		mediaSettings.edgeEnhance,
				sharpen: 	mediaSettings.sharpen,
				imageSize:	imgWidth + "," + imgHeight,
				filename:	filename
			},
			
			onComplete: function (transport) {
				self.building = false;
				url = transport.responseJSON;

				// If the response is an error message instead of a url, show the message
				if (url === null) {
					mediaSettings.shadowboxWarn(transport.responseText);
				}
				
				else {		
					// Options for the jGrowl notification. Clicking on the notification will let the user download the file.						
					options = {
						sticky: true,
						header: "Your screenshot is ready!",
						open:	function (e, m) {
							download = jQuery('#screenshot-' + filename);
							
							download.click(function () {
								window.open('api/index.php?action=downloadFile&url=' + url, '_parent');
							});
						}
					};

					// Create the jGrowl notification.
					helioviewer.messageConsole.info("<div id='screenshot-" + filename + "' style='cursor: pointer'>Click here to download. </div>", options);

					/*
					7-28-2009 -- This section is disabled because shadowbox no longer pops up when the screenshot is done. A notification now handles linking to the download.
					vpDimensions = helioviewer.viewport.getDimensions();
	
					vpWidth  = vpDimensions.width;
					vpHeight = vpDimensions.height;
	
					// The largest the image can be and not display with scrollbars is slightly smaller than the size of the viewport.
					// If the image is larger than that or equal in size to the viewport, scale it to 80%.			
					if (imgWidth >= vpWidth || imgHeight >= (vpHeight - 100)) {
						imgWidth  = imgWidth * 0.8;
						imgHeight = imgHeight * 0.8;
					}
	
					sbWidth  = Math.max(imgWidth + 40, 300);
					sbHeight = imgHeight + 45;      

			        Shadowbox.open({
			            content: 	'<div id="image-container" class="ui-corner-all" style="background:black; margin: 10px; padding: 10px; width: ' + sbWidth + '; ">' +
									'<img src=\"' + url + '\" width=' + imgWidth + ' height=' + imgHeight + ' ><br />' +
									'<div id="helioviewer-url-box" style="background:black">' +
									'Here is the url for your screenshot:' +
	            					'<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
	            					'</div></div>',
						player:		"html",
			            title:      "Helioviewer Screenshot Viewer",
						height:     sbHeight + 65,
						width:      sbWidth + 20
			        });
					*/	
				}
			}
		});
	}
});
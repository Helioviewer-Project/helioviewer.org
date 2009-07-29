/**
 * @author Jaclyn Beck
 * @description A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 * 				to select a subregion of the image in the viewport. It also currently handles taking screenshots.
 * syntax: prototype, jQuery ()
 */
/*global Class, jQuery, $, $A, Ajax, Builder, Shadowbox, setTimeout, window */
var ImageSelectTool = Class.create(
	/** @lends ImageSelectTool.prototype */
    {
		
	/**
	 * @description Sets up an event handler for the select region button and finds the divs where
	 * 				the fake transparent image will be inserted
	 * @param {Object} controller -- the helioviewer class
	 */
	initialize: function (controller) {
		Object.extend(this);
		this.button 	= jQuery("#select-region-button");
		this.bodyNode 	= $("outsideBox").parentNode;
		this.controller = controller;
		this.active 	= false;
		this.mediaSettings 	= this.controller.mediaSettings;
			
		var self = this;
	
		this.button.click(function () {
			var fullscreen = jQuery("#fullscreen-btn"), width, height, imgContainer, transImg, helioviewer;
			
			// If the user has already pushed the button but not done anything, this will turn the feature off.
			if (self.active) {
				self.cleanup();
			}
			// Otherwise, turn it on.
			else {
				// Disable keyboard shortcuts for fullscreen mode
				fullscreen.addClass('requests-disabled');
				self.active = true;
				helioviewer = self.controller;
				
				// Get viewport dimensions to make the transparent image with. 
				width  = helioviewer.viewport.dimensions.width;
				height = helioviewer.viewport.dimensions.height;
				
				/* 
				 * Create a temporary transparent image that spans the height and width of the viewport. Necessary because the viewport image
				 * is done in tiles and imgAreaSelect cannot cross over tile boundaries.
				 * Add the transparent image to the viewport, on top of the other tiles.
				 * 
				 * viewport.domNode corresponds to the div "#helioviewer-viewport", so add the tile directly inside this div.
				 * It is necessary to specify a z-index because otherwise it gets added underneath the rest of the tiles and
				 * the plugin will not work.
				 */
				transImg = helioviewer.viewport.domNode.appendChild(Builder.node('img', {
					id	: 'transparent-image',
					src	: 'images/transparent_512.png',
					alt	: "",
					width	: width,
					height	: height,
					style	: "position: relative; cursor: crosshair; z-index: 5;"
				}));
				
				/* Make a temporary container for imgAreaSelect to put all of its divs into.
				 * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
				 * do not span the whole image for some reason. All of the divs are put in "#outside-box"
				 */
				imgContainer = self.bodyNode.appendChild(Builder.node('div', {
					id: 'imgContainer'
				}));
				
				self.selectArea(self);
			}
		}); 
	},

	/**
	 * @description Loads the imgAreaSelect plugin and uses it on the transparent image that covers the viewport.
	 * 				The function imgAreaSelect() returns two variables, "img", which is the original transparent image, and "selection", which
	 * 				is an array describing the selected area. Available data for "selection" is x1, y1, x2, y2, width, and height.
	 * 				See http://odyniec.net/projects/imgareaselect/  for usage examples and documentation. 
	 * @param {Object} self
	 */
	selectArea: function (self) {
		var helioviewer = self.controller, coords = $A(), visibleCoords = $A();
		
		// Use imgAreaSelect on the transparent region to get the top, left, bottom, and right coordinates of the selected region. 
		jQuery("#transparent-image").imgAreaSelect({ 
			handles: 	true,
			parent:		"#imgContainer",
/*			onSelectChange:	function (img, selection) {
				helioviewer.messageConsole.info("Image dimensions: " + (selection.x2 - selection.x1) + "x" + (selection.y2 - selection.y1) + " px");
			}, */
			
			onSelectEnd:	function (img, selection) {	
				// Get the coordinates of the selected image, and adjust them to be heliocentric like the viewport coords. 
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords();
				
				coords = {
					top		: visibleCoords.top  + selection.y1,
					left	: visibleCoords.left + selection.x1,
					bottom	: visibleCoords.top  + selection.y2,
					right	: visibleCoords.left + selection.x2
				};
				
				//Pop up a dialog box in shadowbox asking the user what they want to do with it.				 
				self.createDialog(self, coords);
			}
		});
	},

	/**
	 * @description Loads a dialog pop-up that asks the user what they would like to do with the region they selected.
	 * 				Current options are: "Take Screenshot", "Build Movie", and "Cancel".
	 * @param {Array} coords -- an array of the heliocentric top, left, right, and bottom coordinates of the selected region, relative to the 
	 * 					viewport coordinates.
	 * @param {Object} self
	 */	
	createDialog: function (self, coords) {
		var helioviewer = self.controller;

		Shadowbox.open({
			options:	{
				onFinish: function () {
					jQuery('#take-screenshot-button').click(function () {
						self.cleanup();
						self.takeScreenshot(helioviewer, coords);														
					});
					
					jQuery('#cancel-button').click(function () {
						self.cleanup();
					});
					
					jQuery('#build-movie-button').click(function () {
						self.cleanup();
						// Delay the action for one second so Shadowbox doesn't crash from opening and closing at the same time.
						setTimeout(function () {
							helioviewer.movieBuilder.checkMovieLayers(helioviewer.movieBuilder, coords);								
						}, 1000);				
					});
				}			
			},
			player:	'html',
			width: 	500,
			height: 160,
			title:	'Select Region Options',
			content:	'<div id="shadowbox-form" class="ui-widget-content ui-corner-all" style="margin: 10px; padding: 20px; height: 100px; font-size: 12pt;">' +
							'<h2 style="font-size: 14pt;">What would you like to do with the selected region?</h2>' +
							'<br />' +
							'<div id="buttons" style="text-align: left; float: right;">' +
								'<button id="cancel-button" class="ui-state-default ui-corner-all">Cancel</button>' +
								'<button id="build-movie-button" class="ui-state-default ui-corner-all">Build Movie</button>' +
								'<button id="take-screenshot-button" class="ui-state-default ui-corner-all">Take Screenshot</button>' +
							'</div>' + 
						'</div>'
		});	
	},

	/**
	 * @description Gathers all necessary information to generate a screenshot, and then displays the image when it is ready.
	 * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right coordinates of the visible region 
	 * @param {Object} helioviewer
	 */
	takeScreenshot: function (helioviewer, visibleCoords) {
		var xhr, imgWidth, imgHeight, url, mediaSettings, download, options, filename;
		
		// Refresh the settings in case something has changed.
		mediaSettings 	= this.mediaSettings;
		mediaSettings.getSettings(this.mediaSettings, visibleCoords);

		filename  = mediaSettings.filename;
		helioviewer.building = true;

		imgWidth  = mediaSettings.width; 
		imgHeight = mediaSettings.height; 

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
				helioviewer.building = false;
				url = transport.responseJSON;

				// If the response is an error message instead of a url, show the message
				if (url === null) {
					mediaSettings.shadowboxWarn(transport.responseText);
				}
				
				else {		
					// Options for the jGrowl notification. Clicking on the notification will let the user download the file.						
					options = {
						sticky: true,
						open:	function (e, m) {
							download = jQuery('#screenshot-' + filename);
							
							download.click(function () {
								window.open('api/index.php?action=downloadFile&url=' + url, '_parent');
							});
						}
					};

					// Create the jGrowl notification.
					helioviewer.messageConsole.info("<div id='screenshot-" + filename + "' style='cursor: pointer'>Click here to download '" + filename + "' </div>", options);

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
	},

	/**
	 * Removes all divs created by imgAreaSelect. Also closes Shadowbox.
	 * @param imgContainer -- has all imgAreaSelect divs inside
	 * @param transImg -- temporary transparent image that imgAreaSelect is used on.
	 * @TODO: add error checking if the divs are already gone for whatever reason.
	 */	
	cleanup: function () {
		Shadowbox.close();
		var fullscreen;
		
		jQuery('#imgContainer').remove();
		jQuery('#transparent-image').remove();
		
		this.active = false;
		fullscreen = jQuery('#fullscreen-btn');
		fullscreen.removeClass('requests-disabled');
	}
});

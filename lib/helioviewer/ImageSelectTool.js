/**
 * @author Jaclyn Beck
 * @description A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 * 				to select a subregion of the image in the viewport. It also currently handles taking screenshots.
 */

var ImageSelectTool = Class.create(UIElement, {
	initialize: function (controller) {
		Object.extend(this);
		this.button 	= jQuery("#select-region-button");
		this.bodyNode 	= $("outsideBox").parentNode;
		this.controller = controller;
		this.active 	= false;
		this.settings 	= this.controller.mediaSettings;
			
		var self = this;
	
		this.button.click(function () {
			var fullscreen = jQuery("#fullscreen-btn");
			// If the user has already pushed the button but not done anything, this will turn the feature off.
			if (self.active) {
				self.cleanup();
			}
			// Otherwise, turn it on.
			else {
				fullscreen.addClass('requests-disabled');
				self.active = true;
				var width, height, imgContainer, transImg, helioviewer, dialog;
				helioviewer = self.controller;
				
				// Get viewport dimensions to make the transparent image with. 
				width = helioviewer.viewport.dimensions.width;
				height = helioviewer.viewport.dimensions.height;
				
				/* Create a temporary transparent image that spans the height and width of the viewport. Necessary because the viewport image
				 * is done in tiles and imgAreaSelect cannot cross over tile boundaries.
				 * Add the transparent image to the viewport, on top of the other tiles.
				 */
				transImg = helioviewer.viewport.domNode.appendChild(Builder.node('img', {
					id: 'transparent-image',
					src: 'images/transparent_512.png',
					alt: "",
					width: width,
					height: height,
					style: "position: relative; cursor: crosshair; z-index: 5;"
				}));
				
				/* Make a temporary container for imgAreaSelect to put all of its divs into.
				 * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
				 * do not span the whole image for some reason.
				 */
				imgContainer = self.bodyNode.appendChild(Builder.node('div', {
					id: 'imgContainer'
				}));
				
				// Add an empty div for the dialog box that will pop up later.
				dialog = imgContainer.appendChild(Builder.node('div', {
					id: 'select-image-dialog',
					style: 'cursor: pointer'
				}));
				self.selectArea(self);
			}
		}); 
	},

	/**
	 * Loads the imgAreaSelect plugin and uses it on the transparent image that covers the viewport.
	 * @param self
	 * The function imgAreaSelect returns two variables, "img", which is the original transparent image, and "selection", which
	 * is an array describing the selected area. Available data for "selection" is x1, y1, x2, y2, width, and height. 
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
			onSelectEnd: 	function (img, selection) {	
				// Get the coordinates of the selected image, and adjust them to be heliocentric like the viewport coords. 
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords();
				
				coords = {
					top:    visibleCoords.top       + selection.y1,
					left:   visibleCoords.left      + selection.x1,
					bottom: visibleCoords.top       + selection.y2,
					right:  visibleCoords.left      + selection.x2
				};
				
				//Pop up a dialog box asking the user what they want to do with it.				 
				self.createDialog(self, coords);
			}
		});
	},

	/**
	 * Loads a dialog pop-up that asks the user what they would like to do with the region they selected.
	 * Current options are: "Take Screenshot", "Build Movie", and "Cancel".
	 * @param coords -- an array of the heliocentric top, left, right, and bottom coordinates of the selected region, relative to the 
	 * 					viewport coordinates.
	 * @param self
	 */	
	createDialog: function (self, coords) {
		var helioviewer = self.controller, d;
        if (jQuery(self).hasClass("dialog-loaded")) {
			d = jQuery('#select-image-dialog');
			if (d.dialog('isOpen')) {
				d.dialog('close');
			}
			else {
				d.dialog('open');
			}
		}
		else {
			Shadowbox.open({
				options:	{
					onFinish:	function() {
						jQuery('#take-screenshot-button').click(function() {
							self.cleanup();
							self.takeScreenshot(helioviewer, coords);
							jQuery('#select-image-dialog').remove();							
						});
						
						jQuery('#cancel-button').click(function() {
							self.cleanup();
							jQuery('#select-image-dialog').remove();
						});
						
						jQuery('#build-movie-button').click(function() {
							self.cleanup();
							helioviewer.movieBuilder.buildMovie(helioviewer.movieBuilder, coords);
							jQuery('#select-image-dialog').remove();							
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
		}
		
	},

	/**
	 * Gathers all necessary information to generate a screenshot, and then displays the image when it is ready.
	 * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right coordinates of the visible region 
	 * @param {Object} helioviewer
	 */
	takeScreenshot: function (helioviewer, visibleCoords) {
		var zoomLevel, obsDate, layers = $A(), layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), xhr, hcOffset;
		this.settings.getDefaultInformation(this.settings, visibleCoords);

		zoomLevel = this.settings.zoomLevel; //helioviewer.viewport.zoomLevel;
		obsDate = this.settings.startTime; //helioviewer.date.getTime() / 1000;
		helioviewer.building = true;

		vpWidth  = this.settings.width; //visibleCoords.right  - visibleCoords.left;
		vpHeight = this.settings.height; //visibleCoords.bottom - visibleCoords.top;    

		// If the entire image is smaller than the viewport, or smaller than the selected region, just use the image's size
		maxImgSize = helioviewer.tileLayers.getMaxDimensions();
		
		vpWidth  = Math.min(vpWidth, maxImgSize.width);
		vpHeight = Math.min(vpHeight, maxImgSize.height);
             		 	
		// Get all of the layer information
		//layers 	= helioviewer.getViewportInformation(visibleCoords);
		layerNames 		= this.settings.layers; //layers.layerNames;
		hcOffset 		= this.settings.hcOffset; //layers.hcOffset;
	
		xhr = new Ajax.Request('api/index.php?', {
			method: 'POST',
			parameters: {
				action: 	"takeScreenshot",
				layers: 	layerNames.join("/"),
				obsDate: 	obsDate,
				zoomLevel: 	zoomLevel,
				edges: 		this.settings.edgeEnhance,
				sharpen: 	this.settings.sharpen,
				hcOffset: 	hcOffset.x + "," + hcOffset.y,
				imageSize:	vpWidth + "," + vpHeight
			},
			
			onComplete: function (transport) {
				helioviewer.building = false;
				var url = transport.responseJSON.replace("/Library/WebServer/Documents/", "http://localhost/"); 

				sbWidth  = vpWidth + 40;
				sbHeight = vpHeight + 40;              
 				
		        Shadowbox.open({
		            content: 	'<div id="image-container" class="ui-corner-all" style="background:black; margin: 10px; padding: 10px; width: ' + sbWidth + '; ">' +
								'<img src=\"' + url + '\"><br />' +
								'<div id="helioviewer-url-box" style="background:black">' +
								'Here is the url for your screenshot:' +
            					'<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
            					'</div></div>',
					player:		"html",
		            title:      "Helioviewer Screenshot Viewer",
					height:     sbHeight + 65,
					width:      sbWidth + 20
		        });
			}
		});
	},

	/**
	 * Removes all divs created by imgAreaSelect and the dialog loading. Also clears the messageConsole
	 * @param imgContainer -- has all imgAreaSelect divs inside
	 * @param transImg -- temporary transparent image that imgAreaSelect is used on.
	 * @TODO: add error checking if the divs are already gone for whatever reason.
	 */	
	cleanup: function () {
		Shadowbox.close();
		var dialogDiv = jQuery('#select-image-dialog');
		dialogDiv.dialog('close'); 
		dialogDiv.parent().remove();
		jQuery('#imgContainer').remove();
		jQuery('#transparent-image').remove();
		this.active = false;
		var fullscreen = jQuery('#fullscreen-btn');
		fullscreen.removeClass('requests-disabled');
	}
});

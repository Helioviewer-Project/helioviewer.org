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
			
		var self = this;
	
		this.button.click(function () {
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
				id: 	'transparent-image', 
				src: 	'images/transparent_512.png', 
				alt: 	"", 
				width: 	width, 
				height: height,
				style: 	"position: relative; cursor: crosshair; z-index: 5;"
			}));

			/* Make a temporary container for imgAreaSelect to put all of its divs into.
			 * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries 
			 * do not span the whole image for some reason.
			 */
			imgContainer = self.bodyNode.appendChild(Builder.node('div', {
				id:		'imgContainer'
			}));
					
			// Add an empty div for the dialog box that will pop up later.
			dialog = imgContainer.appendChild(Builder.node('div', { 
				id: 	'select-image-dialog',
				style:	'cursor: pointer'
			}));
			self.selectArea(self);
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
			onSelectChange:	function (img, selection) {
				helioviewer.messageConsole.info("Image dimensions: " + (selection.x2 - selection.x1) + "x" + (selection.y2 - selection.y1) + " px");
			},
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
    		jQuery('#select-image-dialog').load("dialogs/select-region.php").dialog({
	    		autoOpen: true,
    			title: 	"Helioviewer - Select Region",
    			width: 	480,
    			height: 150,
    			draggable: 	true,
				resizable: 	false,
				buttons: 	{
					// Cancel button closes dialog, disables imgAreaSelect, and deletes the transparent image and dialog div.
					"Cancel": function () { 
						self.cleanup();
					}, 
					// Build Movie and Take Screenshot send the information on to their respective functions.
					"Build Movie": function () { 
						self.cleanup();
						helioviewer.movieBuilder.buildMovie(helioviewer.movieBuilder, coords);
					},
					"Take Screenshot": function () {
						self.cleanup();
						self.takeScreenshot(helioviewer, coords);
					}
				}
    		});
            jQuery(self).addClass("dialog-loaded");
        } 		
	},

	/**
	 * Gathers all necessary information to generate a screenshot, and then displays the image when it is ready.
	 * @param {Object} visibleCoords -- array containing the heliocentric top, left, bottom, and right coordinates of the visible region 
	 * @param {Object} helioviewer
	 */
	takeScreenshot: function (helioviewer, visibleCoords) {
		var zoomLevel, obsDate, layers = $A(), layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), xhr, hcOffset;
		zoomLevel = helioviewer.viewport.zoomLevel;
		obsDate = helioviewer.date.getTime() / 1000;
		helioviewer.building = true;

		vpWidth  = visibleCoords.right  - visibleCoords.left;
		vpHeight = visibleCoords.bottom - visibleCoords.top;    
		 	
		// Get all of the layer information
		layers 	= helioviewer.getViewportInformation(visibleCoords);
		layerNames 		= layers.layerNames;
		hcOffset 		= layers.hcOffset;
	
		xhr = new Ajax.Request('api/index.php?', {
			method: 'POST',
			parameters: {
				action: 	"takeScreenshot",
				layers: 	layerNames.join("/"),
				obsDate: 	obsDate,
				zoomLevel: 	zoomLevel,
				edges: 		helioviewer.edgeEnhance,
				sharpen: 	helioviewer.sharpen,
				hcOffset: 	hcOffset.x + "," + hcOffset.y,
				imageSize:      vpWidth + "," + vpHeight
			},
			
			onComplete: function (transport) {
				helioviewer.building = false;
				var url = transport.responseJSON.replace("/Library/WebServer/Documents/", "http://localhost/"); 

				sbWidth = vpWidth + 40;
				sbHeight = vpHeight + 40;              
 				
		        Shadowbox.open({
		            content: 	'<div id="image-container" style="background:black; padding: 10px; width: ' + sbWidth + '; ">' +
								'<img src=\"' + url + '\"><br />' +
								'<div id="helioviewer-url-box" style="background:black">' +
								'Here is the url for your screenshot:' +
            					'<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
            					'</div></div>',
					player:		"html",
		            title:      "Helioviewer Screenshot Viewer",
					height:     sbHeight + 50,
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
		this.controller.messageConsole.clear();
		var dialogDiv = jQuery("#select-image-dialog");
		dialogDiv.dialog("close"); 
		dialogDiv.parent().remove();
		dialogDiv.remove();
		jQuery("#imgContainer").remove();
		jQuery("#transparent-image").remove();
	}
});

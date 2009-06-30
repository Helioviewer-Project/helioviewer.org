/**
 * @author Jaclyn Beck
 * @description A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 * 				to select a subregion of the image in the viewport.
 */

var ImageSelectTool = Class.create(UIElement, {
	initialize: function (controller) {
		Object.extend(this);
		this.button 	= jQuery("#select-region-button");
		this.bodyNode 	= $("outsideBox").parentNode;
		this.controller = controller;
			
		self = this;
	
		this.button.click(function() {
			var width, height, imgContainer, transImg, helioviewer;
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
			onSelectEnd: function (img, selection) {	
				// Get the coordinates of the selected image, and adjust them to be heliocentric like the viewport coords. 
				visibleCoords = helioviewer.viewport.getHCViewportPixelCoords();
				
				coords = {
					top: 	selection.y1 + visibleCoords.top,
					left: 	selection.x1 + visibleCoords.left,
					bottom: selection.y2 + visibleCoords.bottom,
					right: 	selection.x2 + visibleCoords.right
				};
				
				//Pop up a dialog box asking the user what they want to do with it.				 
				self.createDialog(coords, self);
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
	createDialog: function (coords, self) {
        if (jQuery(self).hasClass("dialog-loaded")) {
            var d = jQuery('#select-image-dialog');
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
					"Cancel": function() { 
						self.cleanup();
					}, 
					// Build Movie and Take Screenshot send the information on to their respective functions.
					"Build Movie": function() { 
						self.cleanup();
						helioviewer.movieBuilder.buildMovie(coords);
					},
					"Take Screenshot": function() {
						self.cleanup();
						helioviewer.takeScreenshot(coords);
					}
				}
    		});
            jQuery(self).addClass("dialog-loaded");
        } 		
	},

	/**
	 * Removes all divs created by imgAreaSelect and the dialog loading
	 * @param imgContainer -- has all imgAreaSelect divs inside
	 * @param transImg -- temporary transparent image that imgAreaSelect is used on.
	 * @TODO: add error checking if the divs are already gone for whatever reason.
	 */	
	cleanup: function() {
		var dialogDiv = jQuery("#select-image-dialog");
		dialogDiv.dialog("close"); 
		dialogDiv.parent().remove();
		dialogDiv.remove();
		jQuery("#imgContainer").remove();
		jQuery("#transparent-image").remove();
	}
});

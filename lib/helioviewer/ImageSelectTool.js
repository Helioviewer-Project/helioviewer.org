/**
 * @author Jaclyn Beck
 * @fileoverview A class that deals with using the imgAreaSelect plugin, which allows the user to click and drag 
 * 				to select a subregion of the image in the viewport. 
 */
/*global Class, $, Shadowbox, setTimeout, window */
var ImageSelectTool = Class.extend(
	/** @lends ImageSelectTool.prototype */
    {
		
	/**
	 * @constructs
	 * @description Sets up an event handler for the select region button and finds the divs where
	 * 				the fake transparent image will be inserted
	 * @param {Object} controller -- the helioviewer class
	 */
	init: function (controller) {
		$.extend(this); // TODO (2009/09/10): Necessary?
		this.button 	= $("#select-region-button");
		this.controller = controller;
		this.active 	= false;
			
		var self = this;
	
		this.button.click(function () {
			var width, height, imgContainer, transImg, helioviewer;
			
			// If the user has already pushed the button but not done anything, this will turn the feature off.
			if (self.active)
				self.cleanup();

			// Otherwise, turn it on.
			else {
				// Disable keyboard shortcuts for fullscreen mode
				$("#fullscreen-btn").addClass('requests-disabled');
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
                transImg = $('<img id="transparent-image" src="images/transparent_512.png" alt="" width="' + width + '" height="' + height + '" />');
                transImg.css({'position': 'relative', 'cursor': 'crosshair', 'z-index': 5});
                helioviewer.viewport.domNode.append(transImg);
                
				/* Make a temporary container for imgAreaSelect to put all of its divs into.
				 * Note that this container must be OUTSIDE of the viewport because otherwise the plugin's boundaries
				 * do not span the whole image for some reason. All of the divs are put in "#outside-box"
				 */
                imgContainer = $('body').append('<div id="imgContainer"></div>');
                
				self.selectArea();
			}
		}); 
	},

	/**
	 * @description Loads the imgAreaSelect plugin and uses it on the transparent image that covers the viewport.
	 * 				The function imgAreaSelect() returns two variables, "img", which is the original transparent image, and "selection", which
	 * 				is an array describing the selected area. Available data for "selection" is x1, y1, x2, y2, width, and height.
	 * 				See http://odyniec.net/projects/imgareaselect/  for usage examples and documentation. 
	 */
	selectArea: function () {
		var viewport, coords, visibleCoords, self = this;
        
        viewport = this.controller.viewport;
		
		// Use imgAreaSelect on the transparent region to get the top, left, bottom, and right coordinates of the selected region. 
		$("#transparent-image").imgAreaSelect({ 
			handles: 	true,
			parent:		"#imgContainer",
/*			onSelectChange:	function (img, selection) {
				helioviewer.messageConsole.info("Image dimensions: " + (selection.x2 - selection.x1) + "x" + (selection.y2 - selection.y1) + " px");
			}, */
			
			onSelectEnd:	function (img, selection) {	
				// Get the coordinates of the selected image, and adjust them to be heliocentric like the viewport coords. 
				visibleCoords = viewport.getHCViewportPixelCoords();
				
				coords = {
					top		: visibleCoords.top  + selection.y1,
					left	: visibleCoords.left + selection.x1,
					bottom	: visibleCoords.top  + selection.y2,
					right	: visibleCoords.left + selection.x2
				};
				
				//Pop up a dialog box in shadowbox asking the user what they want to do with it.				 
				self.createDialog(coords);
			}
		});
	},

	/**
	 * @description Loads a dialog pop-up that asks the user what they would like to do with the region they selected.
	 * 				Current options are: "Take Screenshot", "Build Movie", and "Cancel".
	 * @param {Array} coords -- an array of the heliocentric top, left, right, and bottom coordinates of the selected region, relative to the 
	 * 					viewport coordinates.
	 */	

	createDialog: function (coords) {
		var self = this;

		Shadowbox.open({
			options:	{
				onFinish: function () {
					$('#take-screenshot-button').click(function () {
						self.cleanup();
						self.controller.screenshotBuilder.takeScreenshot(coords);														
					});
					
					$('#cancel-button').click(function () {
						self.cleanup();
					});
					
					$('#build-movie-button').click(function () {
						self.cleanup();
						// Delay the action for one second so Shadowbox doesn't crash from opening and closing at the same time.
						setTimeout(function () {
							self.controller.movieBuilder.checkMovieLayers(coords);								
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
	 * Removes all divs created by imgAreaSelect. Also closes Shadowbox.
	 * @param imgContainer -- has all imgAreaSelect divs inside
	 * @param transImg -- temporary transparent image that imgAreaSelect is used on.
	 * @TODO: add error checking if the divs are already gone for whatever reason.
	 */	
	cleanup: function () {
		Shadowbox.close();
		
		$('#imgContainer, #transparent-image').remove();
		
		this.active = false;
		$("#fullscreen-btn").removeClass('requests-disabled');
	}
});

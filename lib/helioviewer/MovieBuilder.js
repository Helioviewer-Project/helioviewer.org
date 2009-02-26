/**
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 *
 */
/*global MoviesBuilder, Class, UIElement, Event, document, window, Shadowbox, getOS, Ajax */
//TODO: pass in bit-rate depending upon codec chosen! Xvid?

var MovieBuilder = Class.create(UIElement, 
	/** @lends MovieBuilder.prototype */
	{
	/**
	 * @description Default MovieBuilder options
	 */
	defaultOptions: {
		active      : false,
		url         : "api/index.php",
		minZoomLevel: 13, //can relax for single layer movies...
		numFrames   : 40,
		frameRate   : 8,
		sharpen     : false,
		edgeEnhance : false,
		format      : {win: "asf", mac: "mov", linux: "mp4"}
	},

	/**
     * @constructs
     * @description Creates a new MovieBuilder
     * @param {Object} options Custom MovieBuilder options
     */
    initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

        var self = this;

        //Quick Movie Event Handler
		Event.observe(this.id, 'click', function () {
			if (!self.active) {
				var hv = self.controller,
					hqFormat, displayRange, xhr;
	
				self.active = true;
				
				// Chose an optimal codec based on User's OS
				hqFormat = self.format[getOS()];
				
				// Get range of tiles to use
				displayRange = hv.viewports[0].displayRange();
	
				//Ajax Request
				xhr = new Ajax.Request(self.url, {
					method: 'POST',
					parameters: {
						action:    "buildQuickMovie",
	                	layers:    "SOHEITEIT304,SOHLAS0C20WL",
	                	startDate: hv.date.getTime() / 1000,
	                	zoomLevel: hv.viewports[0].zoomLevel, //Math.max(hv.viewports[0].zoomLevel, self.minZoomLevel),
	                	numFrames: self.numFrames,
	                	frameRate: self.frameRate,
	                	edges:     self.edgeEnhance,
	                	sharpen:   self.sharpen,
	                	format:    hqFormat,
	                	xRange:    displayRange.xStart + ", " + displayRange.xEnd,
						yRange:    displayRange.yStart + ", " + displayRange.yEnd
					},
					onComplete: function (transport) {
						// Let user know that video is read
						var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');
						
						self.active = false;
	
						Event.observe(linkId, 'click', function () {
							Shadowbox.open({
						        player:  'iframe',
						        title:   'Helioviewer Movie Player',
					        	height:   650,
					        	width:    550,
					        	content: self.url + '?action=playMovie&format=' + hqFormat + '&url=' + transport.responseJSON
							});
						});
					}
				});
			}
		});
    }
});

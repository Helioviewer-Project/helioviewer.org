/**
 * @fileoverview Contains the class definition for a class for generating and displaying movies.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class MovieBuilder
 *
 */
 /*global document, window */

//TODO: pass in bit-rate depending upon codec chosen! Xvid?

var MovieBuilder = Class.create(UIElement, {
	defaultOptions: {
		url: "api/getImageSeries.php",
		minZoomLevel: 13, //can relax for single layer movies...
		numFrames: 80,
		frameRate: 8,
		sharpen: false,
		edgeEnhance: false,
		format: {win: "avi", mac: "mov", linux: "mp4"}
	},

	/**
     * MovieBuilder Constructor
     * @constructor
     *
     */
    initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

        var self = this;

        //Quick Movie Event Handler
		Event.observe(this.id, 'click', function() {
			var hv = self.controller;

			// Chose an optimal codec based on User's OS
			var hqFormat = self.format[getOS()];
			
			// Get range of tiles to use
			var displayRange = hv.viewports[0].displayRange();

			//Ajax Request
			var xhr = new Ajax.Request(self.url, {
				parameters: {
					action:    "quickMovie",
                	layers:    "EITEIT304,LAS0C20WL",
                	startDate: hv.date.getTime() / 1000,
                	zoomLevel: Math.max(hv.viewports[0].zoomLevel, self.minZoomLevel),
                	numFrames: self.numFrames,
                	frameRate: self.frameRate,
                	edges:     self.edgeEnhance,
                	sharpen:   self.sharpen,
                	format:    hqFormat,
                	xRange:    displayRange.xStart + ", " + displayRange.xEnd,
					yRange:    displayRange.yStart + ", " + displayRange.yEnd
				},
				method: 'get',
				onComplete: function (transport) {
					// Let user know that video is read
					var linkId = self.controller.messageConsole.link('', 'Quick-Video ready! Click here to start watching.');

					Event.observe(linkId, 'click', function () {
							Shadowbox.open({
					        player:  'iframe',
					        title:   'Helioviewer Movie Player',
				        	height:   650,
				        	width:    550,
				        	content: self.url + '?action=play&format=' + hqFormat + '&url=' + transport.responseJSON
						});
					});
				}
			});
		});


    },

    /**
     * @method query
     * queries and caches information about available data
     */
    query: function (type) {
        var url = 'get' + type + '.php';
        var self = this;
        var xhr = new Ajax.Request(url, {
            parameters: {
                type: 'json'
            },
            method: 'get',
            onComplete: function (transport) {
                self.data.set(type, transport.responseJSON);
            }
        });
    }
});

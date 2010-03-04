/*!
* jquery.qtip.bgiframe. The jQuery tooltip plugin - BGIframe plugin
*
* BGIFrame jquery plugin adaption (http://plugins.jquery.com/project/bgiframe)
* Special thanks to Brandon Aaron
*
* Copyright (c) 2009 Craig Thompson
* http://craigsworks.com
*
* Licensed under MIT
* http://www.opensource.org/licenses/mit-license.php
*
* Launch	: August 2009
* Version  : TRUNK - NOT FOR USE IN PRODUCTION ENVIRONMENTS!!!!
*
* FOR STABLE VERSIONS VISIT: http://craigsworks.com/projects/qtip/download/
*/

"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
/*jslint onevar: true, browser: true, forin: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, maxerr: 300 */
/*global window: false, jQuery: false */
(function($)
{
	if(!$.fn.qtip) {
		if(window.console){ window.console.error('This plugin requires the qTip library.',''); }
		return false;
	}

	function Bgiframe(qTip)
	{
		var self = this;

		$.extend(self, {
			init: function()
			{
				// Update iframe on tooltip events
				qTip.elements.tooltip.bind('tooltipmove.bgiframe tooltipshow.bgiframe', self.update);

				// Create new element if one isn't present
				self.create();
			},

			create: function()
			{
				// Setup iframe HTML string
				qTip.elements.bgiframe = $('<iframe class="ui-tooltip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' +
					' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0);"></iframe>');

				// Append the new HTML and setup element reference
				qTip.elements.bgiframe.appendTo(qTip.elements.tooltip);
			},

			update: function()
			{
				var tipAdjust,
					offset = { left: 0, top: 0 },
					dimensions = qTip.get('dimensions'); // Determine current tooltip dimensions

				// Determine correct offset
				offset = parseInt(qTip.elements.tooltip.css('border-left-width'), 10);
				offset = { left: -offset, top: -offset };
				if(qTip.plugins.tip) {
					tipAdjust = (qTip.plugins.tip.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'];
					offset[ tipAdjust[1] ] -= qTip.elements.tip[ tipAdjust[0] ]();
				}

				// Update bgiframe
				qTip.elements.bgiframe.css(offset).css(dimensions);
			},

			destroy: function()
			{
				// Remove iframe
				qTip.elements.bgiframe.remove();

				// Remove bound events
				qTip.elements.tooltip.unbind('tooltiprender.bgiframe tooltipmove.bgiframe tooltipshow.bgiframe');
			}
		});

		self.init();
	}

	$.fn.qtip.plugins.bgiframe = function(qTip)
	{
		// Use this plugin _only_ if the browser is IE6
		if(!($.browser.msie && (/6\.0/).test($.browser.version) && $('select, object').length)) {
			return;
		}

		// Retrieve previous API object
		var api = qTip.plugins.bgiframe;

		// An API is already present,
		if(api) {
			return api;
		}
		// No API was found, create new instance
		else {
			qTip.plugins.bgiframe = new Bgiframe(qTip);
			return qTip.plugins.bgiframe;
		}
	};

	// Plugin needs to be initialized on render
	$.fn.qtip.plugins.bgiframe.initialize = 'render';
}(jQuery));
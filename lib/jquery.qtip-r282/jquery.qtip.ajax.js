/*!
* jquery.qtip.ajax. The jQuery tooltip plugin - AJAX plugin
*
* Allows you to use remote content for your tooltips via AJAX functionality
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

	function Ajax(qTip)
	{
		var self = this;

		$.extend(self, {

			init: function()
			{
				// Grab ajax options
				var ajax = qTip.options.content.ajax;

				qTip.elements.tooltip
					.bind('tooltiprender.ajax', function() {
						// Load the remote content
						self.load(ajax, true);
					})
					.bind('tooltipshow.ajax', function() {
						// Update content if content.ajax.once is falseand the tooltip is rendered
						if(ajax.once === false && qTip.rendered === true){ self.load(ajax, true); }
					})
			},

			load: function(ajax)
			{
				// Define success and error handlers
				function successHandler(content, status)
				{
					// Call user-defined success handler if present
					if($.isFunction(ajax.success)) {
						content = ajax.success(content, status);
						if(content === false){ return; }
					}

					// Update content
					qTip.updateContent(content);
				}
				function errorHandler(xhr, status, error)
				{
					var content = status || error;

					// Call user-defined success handler if present
					if($.isFunction(ajax.error)) {
						content = ajax.error(xhr, status, error);
						if(content === false){ return; }
					}

					// Update tooltip content to indicate error
					qTip.updateContent(content);
				}

				// Setup $.ajax option object and process the request
				$.ajax( $.extend(true, {}, ajax, { success: successHandler, error: errorHandler }) );

				return self;
			},

			destroy: function()
			{
				// Remove bound events
				qTip.elements.tooltip.unbind('tooltiprender.ajax tooltipshow.ajax')
			}
		});

		self.init();
	}

	$.fn.qtip.plugins.ajax = function(qTip)
	{
		var api = qTip.plugins.ajax,
			opts = qTip.options.content;

		// Make sure the qTip uses the $.ajax functionality
		if(opts.ajax) {
			// An API is already present,
			if(api) {
				return api;
			}
			// No API was found, create new instance
			else {
				qTip.plugins.ajax = new Ajax(qTip);
				return qTip.plugins.ajax;
			}
		}
	};

	// Plugin needs to be initialized on render
	$.fn.qtip.plugins.ajax.initialize = 'render';

	// Setup plugin checks
	$.fn.qtip.plugins.ajax.checks = {
		'^content.ajax': function(){ this.plugins.ajax.load(this.options.content.ajax); }
	}
	$.fn.qtip.plugins.ajax.sanitize = function(opts)
	{
		// Parse options into correct syntax
		if(typeof opts.content.ajax !== 'object'){ opts.content.ajax = { url: opts.content.ajax }; }
		if(opts.url){ opts.content.ajax.url = opts.url; delete opts.url; }
		if(opts.data){ opts.content.ajax.data = opts.data; delete opts.data; }
		if(opts.method){ opts.content.ajax.type = opts.method; delete opts.method; }
	}
}(jQuery));
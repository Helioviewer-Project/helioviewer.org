/*!
* jquery.qtip.modal. The jQuery tooltip plugin - Modal component
*
* Allows you to specify any tooltip as 'modal' e.g. dims document background on tooltip show.
* To enable this on your qTips, simply specify show.modal as true:
*
*  show: { modal: true }
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

	function Modal(qTip)
	{
		var self = this;

		self.blanket = $('#qtip-blanket');

		$.extend(self, {

			init: function()
			{
				// Check if the tooltip is modal
				qTip.elements.tooltip
					.bind('tooltipshow.modal', function(event, api, duration){
						self.show(duration);
					})
					.bind('tooltiphide.modal', function(event, api, duration){
						self.hide(duration);
					});

				// Create the blanket if needed
				if(!self.blanket.length) {
					self.create();
				}

				// Hide tooltip on blanket click
				self.blanket.click(function(){ qTip.hide.call(qTip); });
			},

			create: function()
			{
				// Create document blanket
				self.blanket = $('<div />')
					.attr('id', 'qtip-blanket')
					.css($.extend($.fn.qtip.plugins.modal.defaults, {
						position: 'absolute',
						top: $(document).scrollTop(),
						left: 0,
						width: '100%',
						height: '100%',
						zIndex: 14999
					}))
					.hide()
					.appendTo(document.body);

				// Update position on scroll or resize
				$(window).bind('scroll.blanket resize.blanket', function() {
					self.blanket.css({ top: $(document).scrollTop() })
				});
			},

			show: function(duration)
			{
				self.blanket.fadeIn(duration);
			},

			hide: function(duration)
			{
				var hide = true;

				// Check if any other modal tooltips are present
				$('*').each(function() {
					var api = $(this).data('qtip');
					if(api && api.rendered && api.id !== qTip.id && api.options.show.modal &&
						( api.elements.tooltip.is(':visible') && !api.elements.tooltip.is(':animated') )) {
						// Another modal tooltip was visible, leave blanket visible
						hide = false;
					}
				});

				if(hide){ self.blanket.fadeOut(duration); }
			},

			destroy: function()
			{
				var delBlanket = true;

				// Check if any other modal tooltips are present
				$('*').each(function() {
					var api = $(this).data('qtip');
					if(api && api.id !== qTip.id && api.options.show.modal) {
						// Another modal tooltip was present, leave blanket
						delBlanket = false;
						return false;
					}
				});

				// Remove blanket if needed
				if(delBlanket) {
					self.blanket.remove();
					$(window).unbind('scroll.blanket resize.blanket');
				}

				// Remove bound events
				qTip.elements.tooltip.unbind('tooltipshow.modal tooltiphide.modal');
			}
		});

		self.init();
	}

	$.fn.qtip.plugins.modal = function(qTip)
	{
		var api = qTip.plugins.modal.
			opts = qtip.options.show.modal;

		// An API is already present,
		if(api) {
			return api;
		}
		// No API was found, create new instance
		else if(opts === true) {
			qTip.plugins.modal = new Modal(qTip);
			return qTip.plugins.modal;
		}
	};

	// Plugin needs to be initialized on render
	$.fn.qtip.plugins.modal.initialize = 'render';

	// Setup plugin defaults
	$.fn.qtip.plugins.modal.defaults = {
		background: 'black',
		opacity: 0.7,
		cursor: 'pointer'
	};
}(jQuery));
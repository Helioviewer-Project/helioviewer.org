/*!
* jquery.qtip. The jQuery tooltip plugin
*
* Copyright (c) 2009 Craig Thompson
* http://craigsworks.com
*
* Licensed under MIT
* http://www.opensource.org/licenses/mit-license.php
*
* Launch	: February 2009
* Version  : TRUNK - NOT FOR USE IN PRODUCTION ENVIRONMENTS!!!!
* Debugging: jquery.qtip.debug.js
*
* FOR STABLE VERSIONS VISIT: http://craigsworks.com/projects/qtip/download/
*/

"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
/*jslint onevar: true, browser: true, forin: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, maxerr: 300 */
/*global window: false, jQuery: false */

(function($)
{
	/*
	* Document setup
	*/
	$(function()
	{
		// Adjust positions of the tooltips on window resize or scroll if enabled
		$(window).bind('resize.qtip scroll.qtip', function(event)
		{
			$(':not(.qtip.ui-tooltip)').each(function()
			{
				var api, adjust, size;

				// Access current elements API
				api = $(this).data('qtip');
				if(!api || !api.rendered){ return true; }
				adjust = api.options.position.adjust;

				// Cache event and dertermine current tooltip size
				size = api.get('dimensions');

				// Update tooltip position if event adjustment is enabled and tooltip is smaller than the window dimensions when scrolling
				if(api.elements.tooltip.is(':visible') && adjust[event.type] &&
					!(event.type === 'scroll' && (size.height < $(window).height() || size.width < $(window).height))) {
					api.updatePosition();
				}
			});
		});

		// Hide unfocus toolips on document mousedown
		$(document).bind('mousedown.qtip', function(event)
		{
			if($(event.target).parents('div.qtip').length === 0)
			{
				$(':not(.qtip.ui-tooltip)').each(function()
				{
					var api, tooltip;

					// Access current elements API
					var api = $(this).data('qtip');
					if(!api || !api.rendered){ return true; }
					tooltip = api.elements.tooltip;

					// Hide tooltip if unfocus
					if((/unfocus/i).test(api.options.hide.when.event) && $(event.target).add(api.elements.target).length > 1 &&
					tooltip.is(':visible') && !tooltip.hasClass('ui-state-disabled')){
						api.hide();
					}
				});
			}
		});
	});

	// Option object sanitizer
	function sanitizeOptions(opts)
	{
		if(!opts){ return; }

		if(opts.content.metadata && typeof opts.metadata !== 'object'){ opts.metadata = { type: opts.metadata }; }
		if(opts.content !== undefined)
		{
			if(typeof opts.content !== 'object' || (opts.content.jquery && opts.content.length > 0)){ opts.content = { text: opts.content }; }
			if(opts.content.title !== undefined && typeof opts.content.title !== 'object'){ opts.content.title = { text: opts.content.title }; }
		}
		if(opts.position !== undefined)
		{
			if(typeof opts.position !== 'object'){ opts.position = { corner: opts.position }; }
			if(typeof opts.position.corner !== 'object'){ opts.position.corner = { target: opts.position.corner, tooltip: opts.position.corner }; }
			if(opts.position.adjust !== undefined)
			{
				if(typeof opts.position.adjust !== 'object'){ opts.position.adjust = { }; }
				if(opts.position.adjust.screen === true){ opts.position.adjust.screen = 'flip'; }
				else if(String(opts.position.adjust.screen).search(/flip|fit/) < 0){ opts.position.adjust.screen = false; }
			}
		}
		if(opts.show !== undefined)
		{
			if(typeof opts.show !== 'object'){ opts.show = { when: opts.show }; }
			if(typeof opts.show.when !== 'object'){ opts.show.when = { event: opts.show.when }; }
		}
		if(opts.hide !== undefined)
		{
			if(typeof opts.hide !== 'object'){ opts.hide = { when: opts.hide }; }
			if(typeof opts.hide.when !== 'object'){ opts.hide.when = { event: opts.hide.when }; }
			if(typeof opts.hide.inactive !== 'number'){ delete opts.hide.inactive; }
		}
		if(opts.style !== undefined)
		{
			if(typeof opts.style !== 'object'){ opts.style = { classes: opts.style }; }
		}

		// Sanitize plugin options
		$.each($.fn.qtip.plugins, function() {
			if(this.sanitize){ this.sanitize(opts); }
		});
	}

	/*
	* Core plugin implementation
	*/
	function QTip(target, options, id)
	{
		// Declare this reference
		var self = this;

		// Setup class attributes
		self.id = id;
		self.rendered = false;
		self.elements = { target: target };
		self.cache = { title: '', event: {} };
		self.timers = {};
		self.options = options;
		self.plugins = {};

		/*
		* Private core functions
		*/
		function convertNotation(notation)
		{
			var actual, option, i = 1;

			// Split notation into array
			actual = notation.split('.');

			// Locate required option
			option = options[ actual[0] ];
			for(i; i < actual.length; i+=1) {
				if(typeof option[ actual[i] ] === 'object' && !option[ actual[i] ].jquery) {
					option = option[ actual[i] ];
				}
				else{ break; }
			}

			return [option, actual[i] ];
		}

		function calculate(detail)
		{
			var show = (!self.elements.tooltip.is(':visible')) ? true : false,
				returned,
				tipAdjust = self.plugins.tip['tip'] ? (self.plugins.tip.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'] : 0;

			// Make sure tooltip is rendered and if not, return
			if(!self.rendered){ return false; }

			// Show and hide tooltip to make sure properties are returned correctly
			if(show){ self.elements.tooltip.addClass('ui-tooltip-accessible'); }
			switch(detail)
			{
				case 'dimensions':
					// Find initial dimensions
					returned = {
						height: self.elements.tooltip.outerHeight(),
						width: self.elements.tooltip.outerWidth()
					};

					// Account for tip if present
					if(tipAdjust) {
						returned[ tipAdjust[0] ] += self.plugins.tip.tip[ tipAdjust[0] ]();
					}
				break;

				case 'position':
					returned = self.elements.tooltip.offset();

					// Account for tip if present
					if(tipAdjust) {
						returned[ tipAdjust[1] ] -= self.plugins.tip.tip[ tipAdjust[0] ]();
					}
				break;
			}
			if(show){ self.elements.tooltip.removeClass('ui-tooltip-accessible'); }

			return returned;
		}

		// IE max-width/min-width simulator function
		function updateWidth(newWidth)
		{
			// Make sure tooltip is rendered and the browser is IE. If not, return
			if(!self.rendered || !$.browser.msie){ return false; }

			var tooltip = self.elements.tooltip, max, min;

			// Determine actual width
			tooltip.css({ width: 'auto', maxWidth: 'none' });
			newWidth = calculate('dimensions').width;
			tooltip.css({ maxWidth: '' });

			// Parse and simulate max and min width
			max = parseInt(tooltip.css('max-width'), 10) || 0;
			min = parseInt(tooltip.css('min-width'), 10) || 0;
			newWidth = Math.min( Math.max(newWidth, min), max );
			if(newWidth % 2){ newWidth += 1; }

			// Set the new calculated width and if width has not numerical, grab new pixel width
			tooltip.width(newWidth);
		}

		function updateTitle(content)
		{
			// Make sure tooltip is rendered and content is defined. If not, return
			if(!self.rendered || !content){ return false; }

			// Set the new content
			self.elements.title.html(content);
		}

		function createTitle()
		{
			var elems = self.elements;

			// Destroy previous title element, if present
			if(elems.title){ elems.title.remove(); }

			// Append new ARIA attribute to tooltip
			elems.tooltip.attr('aria-labelledby', 'ui-tooltip-title-'+id);

			// Create elements
			elems.titlebar = $('<div />').addClass('ui-tooltip-titlebar ui-widget-header').prependTo(elems.wrapper);
			elems.title = $('<div />')
				.attr('id', 'ui-tooltip-title-'+id)
				.addClass('ui-tooltip-title')
				.html(options.content.title.text)
				.appendTo(elems.titlebar);
			elems.button = $('<a />')
				.attr('role', 'button')
				.addClass('ui-tooltip-close ui-state-default')
				.append(
					$('<span />').addClass('ui-icon ui-icon-close')
				)
				.prependTo(elems.titlebar);

			// Create title close buttons if enabled
			if(options.content.title.button)
			{
				elems.button.hover(
					function(){ $(this).addClass('ui-state-hover'); },
					function(){ $(this).removeClass('ui-state-hover'); }
				)
				.click(function()
				{
					if(elems.tooltip.hasClass('ui-state-disabled')){
						return false;
					}
					else{
						self.hide();
					}
				})
				.bind('mousedown keydown', function(){ $(this).addClass('ui-state-active ui-state-focus'); })
				.bind('mouseup keyup mouseout', function(){ $(this).removeClass('ui-state-active ui-state-focus'); });
			}
			else { elems.button.remove(); }
		}

		function assignEvents(show, hide, tooltip)
		{
			var prepend = '.qtip-'+id,
				targets = {
					show: parseInt(show, 10) !== 0 ? options.show.when.target : $('<div/>'),
					hide: parseInt(hide, 10) !== 0 ? options.hide.when.target : $('<div/>'),
					tooltip: parseInt(tooltip, 10) !== 0 ? self.elements.tooltip : $('<div/>')
				},
				events = { show: options.show.when.event.split(' '), hide: options.hide.when.event.split(' ') };

			// Define show event method
			function showMethod(event)
			{
				if(targets.tooltip.hasClass('ui-state-disabled')){ return; }

				// If set, hide tooltip when inactive for delay period
				targets.show.trigger('qtip-'+id+'-inactive');

				// Clear hide timers
				clearTimeout(self.timers.show);
				clearTimeout(self.timers.hide);

				// Start show timer
				self.timers.show = setTimeout(function(){ self.show(event); }, options.show.delay);
			}

			// Define hide method
			function hideMethod(event)
			{
				if(targets.tooltip.hasClass('ui-state-disabled')){ return; }

				// Clear timers and stop animation queue
				clearTimeout(self.timers.show);
				clearTimeout(self.timers.hide);

				// Prevent hiding if tooltip is fixed and event target is the tooltip
				if(options.hide.fixed && (/mouse(out|leave)/i).test(event.type) && $(event.relatedTarget).parents('.qtip.ui-tooltip').length)
				{
					// Prevent default and popagation
					event.stopPropagation();
					event.preventDefault();
					return false;
				}

				// If tooltip has displayed, start hide timer
				targets.tooltip.stop(true, true);
				self.timers.hide = setTimeout(function(){ self.hide(event); }, options.hide.delay);
			}

			// Check if the tooltip hides when inactive
			function inactiveMethod(event)
			{
				if(targets.tooltip.hasClass('ui-state-disabled')){ return; }

				//Clear and reset the timer
				clearTimeout(self.timers.inactive);
				self.timers.inactive = setTimeout(function(){ self.hide(event); }, options.hide.inactive);
			}
			if(typeof options.hide.inactive === 'number')
			{
				// Bind inactive method to target as a custom event
				targets.show.bind('qtip-'+id+'-inactive', inactiveMethod);

				// Define events which reset the 'inactive' event handler
				$.each($.fn.qtip.inactiveEvents, function(index, type){
					targets.hide.add(self.elements.tooltip).bind(type+prepend+'-inactive', inactiveMethod);
				});
			}

			// Check if the tooltip is 'fixed'
			if(options.hide.fixed)
			{
				// Add tooltip as a hide target
				targets.hide = targets.hide.add(targets.tooltip);

				// Clear hide timer on tooltip hover to prevent it from closing
				targets.tooltip.bind('mouseover'+prepend, function(){ if(!targets.tooltip.hasClass('ui-state-disabled')){ clearTimeout(self.timers.hide); } });
			}

			// Apply hide events
			$.each(events.hide, function(index, type) {
				var showIndex = $.inArray(type, events.show);

				// Both events and targets are identical, apply events using a toggle
				if((showIndex > -1 && $(targets.hide).add(targets.show).length === $(targets.hide).length) || type === 'unfocus')
				{
					targets.show.bind(type+prepend, function(event)
					{
						if(targets.tooltip.is(':visible')){ hideMethod(event); }
						else{ showMethod(event); }
					});

					// Don't bind the event again
					delete events.show[ showIndex ];
				}

				// Events are not identical, bind normally
				else{ targets.hide.bind(type+prepend, hideMethod); }
			});

			// Apply show events
			$.each(events.show, function(index, type) {
				targets.show.bind(type+prepend, showMethod);
			})

			// Focus the tooltip on mouseover
			targets.tooltip.bind('mouseover'+prepend, function(){ self.focus(); });

			// If mouse is the target, update tooltip position on mousemove
			if(options.position.target === 'mouse')
			{
				targets.show.bind('mousemove'+prepend, function(event)
				{
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(options.position.adjust.mouse && !targets.tooltip.hasClass('ui-state-disabled') && targets.tooltip.is(':visible')) {
						self.updatePosition(event);
					}
				});
			}
		}

		function unassignEvents(show, hide, tooltip)
		{
			var prepend = '.qtip-'+id,
				targets = {
					show: show ? options.show.when.target : $('<div/>'),
					hide: hide ? options.hide.when.target : $('<div/>'),
					tooltip: tooltip ? self.elements.tooltip : $('<div/>')
				},
				events = { show: options.show.when.event.split(' '), hide: options.hide.when.event.split(' ') };

			// Check if tooltip is rendered
			if(self.rendered)
			{
				// Remove show events
				$.each(events.show, function(index, type){ targets.show.unbind(type+prepend) });
				targets.show.unbind('mousemove'+prepend)
					.unbind('mouseout'+prepend)
					.unbind('qtip-'+id+'-inactive');

				// Remove hide events
				$.each(events.hide, function(index, type) {
					// Remove hide events
					targets.hide.add(targets.tooltip).unbind(type+prepend)
				});
				$.each($.fn.qtip.inactiveEvents, function(index, type){
					targets.hide.add(tooltip ? self.elements.content : null).unbind(type+prepend+'-inactive');
				});
				targets.hide.unbind('mouseout'+prepend);

				// Remove tooltip events
				targets.tooltip.unbind('mouseover'+prepend);
			}

			// Tooltip isn't yet rendered, remove render event
			else if(show){ targets.show.unbind(events.show+prepend+'-create'); }
		}

		/*
		* Public API methods
		*/
		$.extend(self, {

			render: function(show)
			{
				// If tooltip has already been rendered, exit
				if(self.rendered){ return false; }

				// Call API method and set rendered status
				self.rendered = show ? -2 : -1; // -1: rendering	 -2: rendering and show when done

				// Create initial tooltip elements
				self.elements.tooltip = $('<div/>')
					.attr('id', 'ui-tooltip-'+id)
					.attr('role', 'tooltip')
					.attr('area-describedby', 'ui-tooltip-content-'+id)
					.addClass('qtip ui-tooltip ui-widget ui-helper-reset '+options.style.classes)
					.css('z-index', 15000 + $('.qtip.ui-tooltip').length)
					.css('display', $.browser.msie ? 'inline-block' : '') // IE content z-index fix
					.data('qtip', self)
					.appendTo(options.position.container);

				// Append to container element
				self.elements.wrapper = $('<div />').addClass('ui-tooltip-wrapper').appendTo(self.elements.tooltip);
				self.elements.content = $('<div />').addClass('ui-tooltip-content')
					.attr('id', 'ui-tooltip-content-'+id)
					.addClass('ui-tooltip-content ui-widget-content')
					.appendTo(self.elements.wrapper);

				// Create title if enabled
				if(options.content.title.text){
					createTitle();
				}

				// Initialize plugins and apply border
				$.each($.fn.qtip.plugins, function() {
					if(this.initialize === 'render'){ this(self); }
				});

				// Set the tooltips content
				self.updateContent(options.content.text);

				// Assign events
				assignEvents(self);
				$.each(options.events, function(name, callback) {
					self.elements.tooltip.bind('tooltip'+name, callback);
				});

				// Call API method and if return value is false, halt
				self.elements.tooltip.trigger('tooltiprender', [self.hash()]);

				return self;
			},

			get: function(notation)
			{
				var result, option;

				switch(notation.toLowerCase())
				{
					case 'offset':
						result = calculate('position');
					break;

					case 'dimensions':
						result = calculate('dimensions');
					break;

					default:
						option = convertNotation(notation.toLowerCase());
						result = (option[0].precedance) ? option[0].string() : (option[0].jquery) ? option[0] : option[0][ option[1] ];
					break;
				}

				return result;
			},

			set: function(notation, value)
			{
				var option = convertNotation(notation.toLowerCase()),
					previous = { show: options.show.when.target, hide: options.hide.when.target },
					rule,
					checks = {
						// Content checks
						'^content.text': function(){ self.updateContent(value); },
						'^content.title.text': function(){ updateTitle(value); },

						// Position checks
						'^position.container$': function(){ if(self.rendered){ self.elements.tooltip.appendTo(value); } },
						'^position.corner.(target|tooltip)$': function(){
							// Parse new corner value into Corner objecct
							var opt = options.position.corner,
								corner = (notation.search(/target$/i) > -1) ? 'target' : 'tooltip';

							if(typeof value === 'string'){
								opt[corner] = new $.fn.qtip.plugins.Corner(value);
							}
						},
						'^position.(corner|adjust|target)': function(){ if(self.rendered){ self.updatePosition(); } },
						'^(show|hide).(when|fixed)': function() {
							var prop = (notation.search(/fixed/i) > -1) ? [0, [0,1,1]] : (notation.search(/hide/i) < 0) ? ['show', [1,0,0]] : ['hide', [0,1,0]];

							if(prop[0]){ options[prop[0]].when.target = previous[prop[0]]; }
							unassignEvents.apply(self, prop[1]);

							if(prop[0]){ options[prop[0]].when.target = value; }
							assignEvents.apply(self, prop[1]);
						},

						// Style checks
						'^style.(border|radius|top|bottom)': function() {
							if(self.plugins.qcorner){ $.fn.qtip.plugins.qcorner(self); }
						},
						'^style.tip': function() {
							if(self.plugins.tip){ self.plugins.tip.update(); }
							self.updatePosition();
						}
					};

				// Merge plugin checks
				$.each(self.plugins, function() {
					if(typeof this.checks === 'object') {
						checks = $.extend(checks, this.checks);
					}
				});

				// Set new option value
				option[0][ option[1] ] = value;

				// Re-sanitize options
				sanitizeOptions(options);

				// Check if callback is needed to update tooltip attributes
				for(rule in checks) {
					if( (new RegExp(rule, 'i')).test(notation) ) {
						checks[rule].call(self);
					}
				}

				return self;
			},

			toggle: function(state, event)
			{
				if(!self.rendered){ return false; }

				var type = state ? 'show' : 'hide',
					tooltip = self.elements.tooltip,
					opts = options[type],
					stop = false;

				// Detect state if valid one isn't provided
				if((typeof state).search('boolean|number')){ state = !tooltip.is(':visible'); }

				// Define after callback
				function after()
				{
					// Reset opacity to avoid bugs
					$(this).css({ opacity: '', height: '' });

					// Prevent antialias from disappearing in IE7 by removing filter attribute
					if(state && $.browser.msie && $(this).get(0).style){ $(this).get(0).style.removeAttribute('filter'); }
				}

				// Only continue if element is already in correct state
				if(tooltip.is(':visible') && state || !tooltip.is(':visible') && !state){ return self; }

				// Call API method
				tooltip.trigger('tooltip'+type, [self.hash(), 90])

				// Execute state specific properties
				if(state) {
					// Remoe title attribute
					self.cache.title = target.attr('title');
					target.removeAttr('title');

					self.focus(); // Focus the tooltip before show to prevent visual stacking
					self.updatePosition(event);  // Update tooltip position
					if(opts.solo){ $(':not(.qtip.ui-tooltip)').qtip('hide'); } // Hide other tooltips if tooltip is solo
				}
				else {
					target.attr('title', self.cache.title); // Reset attribute content
					clearTimeout(self.timers.show);  // Clear show timer
					tooltip.css({ opacity: '' }); // Reset opacity
				}

				// Set ARIA hidden status attribute
				tooltip.attr('aria-hidden', Boolean(state));

				// Clear animation queue
				tooltip.stop(true, false);

				// Use custom function if provided
				if($.isFunction(opts.effect)) {
					opts.effect.call(tooltip);
					tooltip.queue(function(){ after(); $(this).dequeue(); });
				}

				// If no animation type is supplied
				else if(!state && tooltip.is(':animated')) {
					tooltip[ type ]();
					after();
				}

				// Use basic fade function
				else if(opts.effect !== false) {
					tooltip['fade'+(state?'In':'Out')](90, after);
				}

				// If inactive hide method is set, active it
				if(state){ opts.when.target.trigger('qtip-'+id+'-inactive'); }

				return self;
			},

			show: function(event){ this.toggle(true, event); },

			hide: function(event){ this.toggle(false, event); },

			focus: function(event)
			{
				if(!self.rendered){ return false; }

				var tooltip = self.elements.tooltip,
					curIndex = parseInt(tooltip.css('z-index'), 10),
					newIndex = 15000 + $('.qtip.ui-tooltip').length;

				// Only update the z-index if it has changed and tooltip is not already focused
				if(!tooltip.hasClass('ui-state-focus') && curIndex !== newIndex)
				{
					$(':not(.qtip.ui-tooltip)').each(function()
					{
						var api = $(this).qtip(), tooltip, elemIndex;
						if(!api || !api.rendered){ return true; }
						tooltip = api.elements.tooltip;

						// Reduce all other tooltip z-index by 1
						elemIndex = parseInt(tooltip.css('z-index'), 10);
						if(!isNaN(elemIndex)){ tooltip.css({ zIndex: elemIndex - 1 }); }

						// Set focused status to false
						tooltip.removeClass('ui-state-focus');
					});

					// Set the new z-index and set focus status to true
					tooltip.css({ zIndex: newIndex }).addClass('ui-state-focus');

					// Call API method and if return value is false, halt
					tooltip.trigger('tooltipfocus', [self.hash()]);
				}

				return self;
			},

			updateContent: function(content)
			{
				var images, loadedImages = 0;

				// Make sure tooltip is rendered and content is defined. If not return
				if(!self.rendered || !content){ return false; }

				// Append new content if its a DOM array and show it if hidden
				if(content.jquery && content.length > 0)
				{
					if(options.content.clone) {
						self.elements.content.html( content.clone(true).removeAttr('id').css({ display: 'block' }) );
					}
					else {
						self.elements.content.append(content.css({ display: 'block' }));
					}
				}

				// Content is a regular string, insert the new content
				else{ self.elements.content.html(content); }

				// Show the tooltip if rendering is taking place
				if(self.rendered < 0)
				{
					if(options.show.ready || self.rendered === -2) {
						self.show(self.cache.event);
					}

					// Set rendered status to true
					self.rendered = true;
				}

				// Define afterLoad method
				function afterLoad()
				{
					// Update the tooltip width and position
					updateWidth();
					self.updatePosition(self.cache.event);

					return false;
				}

				// Check if images need to be loaded before position is updated to prevent mis-positioning
				images = self.elements.content.find('img');
				if(images.length) {
					images.bind('load error', function(){ if((loadedImages+=1) === images.length){ afterLoad(); } });
				}
				else{ updateWidth(); }

				return self;
			},

			updatePosition: function(event)
			{
				if(!self.rendered){ return false; }

				var target = $(options.position.target),
					tooltip = self.elements.tooltip,
					posOptions = options.position,
					targetWidth,
					targetHeight,
					elemWidth = self.elements.tooltip.width(),
					elemHeight = self.elements.tooltip.height(),
					position, newCorner, tip, which, my, at
					adapt = {
						fit: {
							left: function() {
								var beforePos = parseInt(position.left, 10),
									over = position.left + elemWidth - $(window).width() - $(window).scrollLeft();

								position.left = over > 0 ? position.left - over : Math.max(0, position.left);
								return Math.abs(beforePos !== position.left);
							},
							top: function() {
								var beforePos = parseInt(position.top, 10),
									over = position.top + elemHeight - $(window).height() - $(window).scrollTop();

								position.top = over > 0 ? position.top - over : Math.max(0, position.top);
								return Math.abs(beforePos !== position.top);
							}
						},

						flip: {
							left: function() {
								var over = position.left + elemWidth - $(window).width() - $(window).scrollLeft(),
									myOffset = my.x === 'left' ? -elemWidth : my.x === 'right' ? elemWidth : 0,
									offset = -2 * posOptions.adjust.x,
									beforePos = parseInt(position.left, 10);

								position.left += position.left < 0 ? myOffset + targetWidth + offset : over > 0 ? myOffset - targetWidth + offset : 0;
								return Math.abs(beforePos !== position.left);
							},
							top: function() {
								var over = position.top + elemHeight - $(window).height() - $(window).scrollTop(),
									myOffset = my.y === 'top' ? -elemHeight : my.y === 'bottom' ? elemHeight : 0,
									atOffset = at.y === 'top' ? targetHeight : at.y === 'bottom' ? -targetHeight : 0,
									offset = -2 * posOptions.adjust.y,
									beforePos = parseInt(position.top, 10);

								position.top += position.top < 0 ? myOffset + targetHeight + offset : over > 0 ? myOffset + atOffset + offset : 0;
								return Math.abs(beforePos - position.top);
							}
						}
					};

				// X and Y coordinates were given
				if(options.position.corner.left && options.position.corner.top) {
					position = $.extend({}, options.position.corner);
					my = at = { x: 'left', y: 'top' };
				}

				// Use smart corner positioning
				else{
					my = options.position.corner.tooltip;
					at = options.position.corner.target;

					if(event) {
						// Force left top to allow flipping
						at = { x: 'left', y: 'top' };
						targetWidth = targetHeight = 0;
						position = { top: event.pageY, left: event.pageX };
					}
					else {
						if(target.is('area') && $.fn.qtip.plugins.areaDetails) {
							position = $.fn.qtip.plugins.areaDetails(target, options.at);
							targetWidth = position.width;
							targetHeight = position.height;
							position = position.offset;
						}
						else if($(target).add(document).length < 2) {
							targetWidth = target.width();
							targetHeight = target.height();
							position = { top: 0, left: 0 };
						}
						else if($(target).add(window).length  < 2) {
							targetWidth = target.width();
							targetHeight = target.height();
							position = { top: target.scrollTop(), left: target.scrollLeft() };
						}
						else {
							targetWidth = target.outerWidth();
							targetHeight = target.outerHeight();
							position = target.offset();
						}

						// Adjust position relative to target
						position.left += at.x === 'right' ? targetWidth : at.x === 'center' ? targetWidth / 2 : 0;
						position.top += at.y === 'bottom' ? targetHeight : at.y === 'center' ? targetHeight / 2 : 0;
					}

					// Adjust position relative to tooltip
					position.left += posOptions.adjust.x + (my.x === 'right' ? -elemWidth : my.x === 'center' ? -elemWidth / 2 : 0);
					position.top += posOptions.adjust.y + (my.y === 'bottom' ? -elemHeight : my.y === 'center' ? -elemHeight / 2 : 0);
				}

				// Calculate collision offset values
				if(posOptions.adjust.screen) {
					position.adjust = {
						left: adapt[posOptions.adjust.screen].left(),
						top: adapt[posOptions.adjust.screen].top()
					};
				}
				else { position.adjust = { left: 0, top: 0 }; }

				// Call API method
				tooltip.trigger('tooltipmove', [self.hash(), position]);
				delete position.adjust;

				// Use custom function if provided
				if(tooltip.is(':visible') && $.isFunction(posOptions.adjust.effect)) {
					posOptions.adjust.effect.call(tooltip);
					tooltip.queue(function() {
						// Reset attributes to avoid cross-browser rendering bugs
						$(this).css({ opacity: '', height: '' });
						if($.browser.msie && $(this).get(0).style){ $(this).get(0).style.removeAttribute('filter'); }
						$(this).dequeue();
					});
				}

				// Use basic slide function
				else if(tooltip.is(':visible') && posOptions.adjust.effect === true) {
					tooltip.animate(position);
				}
				else {
					tooltip.css(position);
				}

				return self;
			},

			disable: function(state)
			{
				if(!self.rendered){ return false; }

				self.elements.tooltip[ (state?'add':'remove')+'Class' ]('ui-state-disabled');

				return self;
			},

			destroy: function()
			{
				// Destroy any associated plugins
				$.each(self.plugins, function() {
					if(self.rendered && this.initialize === 'render'){ this.destroy(); }
				});

				// Remove bound events
				unassignEvents(1, 1, 1);

				// Remove api object and tooltip
				target.removeData('qtip');
				if(self.rendered){ self.elements.tooltip.remove(); }

				return target.attr('title', self.cache.title);
			},

			hash: function()
			{
				var apiHash = $.extend({}, self);
				delete apiHash.cache;
				delete apiHash.timers;
				delete apiHash.options;
				delete apiHash.plugins;
				delete apiHash.render;
				delete apiHash.hash;

				return apiHash;
			},

			/* Deprecated methods - USE GET/SET INSTEAD */
			updateStyle: function(classes){ this.set('style.classes', classes); return self; },
			updateTitle: function(content){ this.set('content.title.text', content); return self; },
			getDimensions: function(){ return calculate('dimensions'); },
			getPosition: function(){ return calculate('position'); }
			/* End deprecated methods */

		});
	}

	// Initialization method
	function init(id, opts)
	{
		var obj,
			metadata = ($(this).metadata) ? $(this).metadata(opts.metadata) : {}, // Grab metadata from element if plugin is present
			config = $.extend(true, {}, opts, metadata), // Create unique configuration object using metadata
			newTarget = $(this).add(document).length < 2 ? $(document.body) : $(this);

		// Setup target options
		if(config.position.container === false){ config.position.container = $(document.body); }
		if(config.position.target === false){ config.position.target = newTarget; }
		if(config.show.when.target === false){ config.show.when.target = newTarget; }
		if(config.hide.when.target === false){ config.hide.when.target = newTarget; }

		// Convert position corner values into x and y strings
		config.position.corner.target = new $.fn.qtip.plugins.Corner(config.position.corner.target);
		config.position.corner.tooltip = new $.fn.qtip.plugins.Corner(config.position.corner.tooltip);

		// Destroy previous tooltip if overwrite is enabled, or skip element if not
		if(config.overwrite){
			$(this).qtip('destroy');
		}
		else if(config.overwrite === false && $(this).data('qtip')) {
			return false;
		}

		// Initialize the tooltip and add API reference
		obj = new QTip($(this), config, id);
		$(this).data('qtip', obj);

		return obj;
	}

	// jQuery $.fn extension method
	$.fn.qtip = function(options, notation, newValue)
	{
		var command =  String(options).toLowerCase(), // Parse command
			returned = false,
			opts, content;

		// Check for API request
		if(!options || command === 'api') {
			opts = $(this).eq(0).data('qtip');
			return opts !== undefined ? opts.hash() : undefined;
		}

		// Execute API command if present
		else if(typeof options === 'string')
		{
			$(this).each(function()
			{
				var api = $(this).data('qtip');
				if(!api){ return true; }

				// Call APIcommand
				if(command === 'option' && notation) {
					if(newValue !== undefined) {
						api.set(notation, newValue)
					}
					else {
						returned = api.get(notation);
					}
				}
				else if(command === 'destroy'){ api.destroy(); }
				else if(command === 'disable'){ api.disable(true); }
				else if(command === 'enable'){ api.disable(false); }
				else if(command === 'focus'){ api.focus(); }
				else if(command === 'update'){ api.updatePosition(); }
			});

			return returned ? returned : $(this);
		}

		// No API commands. validate provided options and setup qTips
		else if(typeof options === 'object')
		{
			// Sanitize options
			sanitizeOptions(options);

			// If no valid content can be found, don't create tooltip
			if((typeof options.content.text === 'string' && options.content.text.length < 1) || (options.content.text.jquery && options.content.text.is(':empty')) && !options.content.ajax) {
				return false;
			}

			// Build new sanitized options object
			opts = $.extend(true, {}, $.fn.qtip.defaults, options);

			// Iterate each matched element
			return $(this).each(function(cur) // Return original elements as per jQuery guidelines
			{
				var id, self, targets, events, namespace;

				// Find next available ID, or use custom ID if provided
				if(typeof opts.id === 'string' && opts.id.length > 0 && Boolean(opts.id) && $('#ui-tooltip-'+opts.id).length){ delete opts.id; }
				id = opts.id || ($.fn.qtip.nextid+=1);
				delete opts.id;

				// Initialize the qTip
				self = init.call($(this), id, opts);
				if(self === false){ return true };

				// Initialize plugins
				$.each($.fn.qtip.plugins, function() {
					if(this.initialize === 'initialize'){ this(self); }
				});

				// Determine hide and show targets
				targets = { show: self.options.show.when.target, hide: self.options.hide.when.target };
				events = {
					show: self.options.show.when.event,
					hide: (/(unfocus)/i).test(self.options.hide.when.event) ? 'mouseout' : self.options.hide.when.event
				};

				// If prerendering is disabled, create tooltip on show event
				if(!self.options.content.prerender && !self.options.show.ready && self.options.show.when.event)
				{
					// Setup temporary events namespace
					namespace = '.qtip-'+id+'-create';

					// Bind defined show event to show target to construct and show the tooltip
					targets.show.bind(events.show+namespace, function(event)
					{
						// Cache the mouse data and start the event sequence
						self.cache.event = $.extend({}, event);
						self.timers.show = setTimeout(function()
						{
							// Cache mouse coords,render and render the tooltip
							self.render(true);

							// Unbind show and hide event
							targets.show.unbind(events.show+'.qtip-'+self.id+'-create');
							targets.hide.unbind(events.hide+'.qtip-'+self.id+'-create');
						},
						self.options.show.delay);
					});

					// If hide and show targets and events aren't identical, bind hide event to reset show timer
					if(targets.show !== targets.hide && self.options.show.when.event !== self.options.hide.when.event) {
						targets.hide.bind(events.hide+namespace, function(event){ clearTimeout(self.timers.show); });
					}
				}

				// Prerendering is enabled
				else{ self.render(false); }
			});
		}
	};

	// Set global qTip properties
	$.fn.qtip.nextid = 0;
	$.fn.qtip.inactiveEvents = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseover'];

	// Setup base plugins
	$.fn.qtip.plugins = {};

	// Corner object parser
	$.fn.qtip.plugins.Corner = function(corner)
	{
		this.x = String(corner).replace(/middle/i, 'center').match(/left|right|center/i)[0].toLowerCase();
		this.y = String(corner).replace(/middle/i, 'center').match(/top|bottom|center/i)[0].toLowerCase();
		this.offset = { left: 0, top: 0 };
		this.precedance = (corner.charAt(0).search(/^(t|b)/) > -1) ? 'y' : 'x';

		this.string = function(){ return (this.precedance === 'y') ? this.y+this.x : this.x+this.y; };
	};

	// Define configuration defaults
	$.fn.qtip.defaults = {
		id: false,
		overwrite: true,

		// Metadata
		metadata: {
			type: 'class'
		},
		// Content
		content: {
			prerender: false,
			text: false,
			clone: true,
			title: {
				text: false,
				button: false
			}
		},
		// Position
		position: {
			target: false,
			corner: {
				target: 'bottomRight',
				tooltip: 'topLeft'
			},
			adjust: {
				x: 0, y: 0,
				mouse: true,
				screen: false,
				scroll: true,
				resize: true,
				effect: true
			},
			container: false
		},
		// Effects
		show: {
			when: {
				target: false,
				event: 'mouseover'
			},
			effect: true,
			delay: 140,
			solo: false,
			ready: false
		},
		hide: {
			when: {
				target: false,
				event: 'mouseout'
			},
			effect: true,
			delay: 0,
			fixed: false,
			inactive: false
		},
		style: {
			classes: ''
		},
		// Callbacks
		events: {
			render: function(){},
			move: function(){},
			show: function(){},
			hide: function(){},
			focus: function(){}
		}
	};
}(jQuery));
/*!
* qTip - Speech bubble tips plugin
*
* This plugin requires the main qTip library in order to function.
* Download it here: http://craigsworks.com/projects/qtip/
*
* Copyright (c) 2009 Craig Thompson
* http://craigsworks.com
*
* Licensed under MIT
* http://www.opensource.org/licenses/mit-license.php
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

	// Tip coordinates calculator
	function calculate(corner, width, height)
	{
		// Define tip coordinates in terms of height and width values
		var tips = {
			bottomright:	[[0,0],				[width,height],		[width,0]],
			bottomleft:		[[0,0],				[width,0],				[0,height]],
			topright:		[[0,height],		[width,0],				[width,height]],
			topleft:			[[0,0],				[0,height],				[width,height]],
			topcenter:		[[0,height],		[width/2,0],			[width,height]],
			bottomcenter:	[[0,0],				[width,0],				[width/2,height]],
			rightcenter:	[[0,0],				[width,height/2],		[0,height]],
			leftcenter:		[[width,0],			[width,height],		[0,height/2]]
		};
		tips.lefttop = tips.bottomright; tips.righttop = tips.bottomleft;
		tips.leftbottom = tips.topright; tips.rightbottom = tips.topleft;

		return tips[corner];
	}

	function Tip(qTip, command)
	{
		var self = this;
		self.qTip = qTip;

		self.tip = null;
		self.corner = null;
		self.type = null;
		self.size = null;
		self.method = 'css';

		// Calculate tip size
		function size()
		{
			// Determine new tip size
			qTip.elements.tooltip.addClass('ui-tooltip-accessible');
			self.size = { width: self.tip.width(), height: self.tip.height() };
			qTip.elements.tooltip.removeClass('ui-tooltip-accessible');
		}

		// Determines tip corner
		function determine()
		{
			var corner = qTip.options.style.tip.corner,
				type = qTip.options.style.tip.type || corner,
				corners = qTip.options.position.corner;

			if(corner === false) {
				return false;
			}
			else{
				if(corner === true) {
					if(corners.left && corners.top) {
						return false
					}
					else {
						self.corner = $.extend({}, corners.tooltip);
					}
				}
				else if(!corner.precedance) {
					self.corner = new $.fn.qtip.plugins.Corner(corner);
				}

				if(type === true) {
					if(corners.left && corners.top) {
						return false
					}
					else {
						self.type = $.extend({}, corners.tooltip);
					}
				}
				else if(!type.precedance) {
					self.type = new $.fn.qtip.plugins.Corner(type);
				}
			}

			return self.corner.string() !== 'centercenter';
		}

		// Tip position method
		function position()
		{
			var corner = self.corner,
				corners  = ['left', 'right'],
				opts = qTip.options.style,
				adjust = 0,
				borderAdjust = corner.y + corner.x.substr(0,1).toUpperCase() + corner.x.substr(1),
				ieAdjust = { left: 0, right: 0, top: 0, bottom: 0 };

			// Return if tips are disabled or tip is not yet rendered
			if(qTip.options.style.tip.corner === false || !self.tip){ return false; }

			// Set initial position
			self.tip.css({
				top: '', bottom: '',
				left: '', right: '',
				margin: ''
			});

			// Setup corners to be adjusted
			corners[ (corner.precedance === 'y') ? 'push' : 'unshift' ]('top', 'bottom');

			// Calculate border adjustment
			try{ borderAdjust = opts.radius || opts[ borderAdjust ].radius; }
			catch(e){ borderAdjust = 0; }

			// Setup adjustments
			adjust += parseInt(qTip.elements.tooltip.css('border-'+corners[0]+'-width'), 10) || 0;
			if($.browser.msie)
			{
				ieAdjust = {
					left: 1, top: 1,
					right: (corner.precedance === 'y') ? 1 : 2,
					bottom: (corner.precedance === 'x') ? 1 : 2
				};
			}

			// Adjust primary corners
			switch(corner[ corner.precedance === 'y' ? 'x' : 'y' ])
			{
				case 'center':
					self.tip.css(corners[0], '50%')
						.css('margin-'+corners[0], -(self.size[ (corner.precedance === 'y') ? 'width' : 'height' ] / 2) + corner.offset[ corners[0] ] );
				break;

				case corners[0]:
					self.tip.css(corners[0], corner.offset.left - ieAdjust[ corners[0] ] - adjust + borderAdjust);
				break;

				case corners[1]:
					self.tip.css(corners[1], corner.offset.left + ieAdjust[ corners[1] ] - adjust + borderAdjust);
				break;
			}

			// Adjust secondary corners
			adjust += self.size[ (corner.precedance === 'y') ? 'width' : 'height' ];
			if(corner[corner.precedance] === corners[2]) {
				self.tip.css(corners[2], corner.offset[ corners[2] ] - ieAdjust[ corners[2] ] - adjust);
			}
			else {
				self.tip.css(corners[3], corner.offset[ corners[2] ] + ieAdjust[ corners[3] ] - adjust);
			}
		}

		$.extend(self, {

			init: function()
			{
				// Determine tip corner and type
				var properties = determine.call(qTip);
				if(properties === false){ return false; }

				// Detect what type of tip to use
				self.method = $('<canvas/>').get(0).getContext && self.corner.string().search('center') > -1 ? 'canvas' : ($.browser.msie) ? 'vml' : 'css';

				// Bind update events
				qTip.elements.tooltip.bind('tooltipmove.tip', function(event, api, position) {
					// Clone current corner object
					var newCorner = $.extend({}, self.corner),
						precedance = 0,
						borderAdjust = 0,
						adjust = {
							left: api.get('position.adjust.screen.left'),
							top: api.get('position.adjust.screen.top'),
							screen: api.get('position.adjust.screen')
						};
					newCorner.offset = { left: 0, top: 0 };

					// Adjust position according to adjustment that took place
					if(adjust.screen === 'flip')
					{
						if(adjust.left && newCorner.x !== 'center') {
							newCorner.x = newCorner.x === 'left' ? 'right' : 'left';
						}
						if(adjust.top && newCorner.y !== 'center') {
							newCorner.y = newCorner.y === 'top' ? 'bottom' : 'top';
						}
					}
					else if(adjust.screen === 'fit')
					{
						newCorner.offset = adjust;

						if((adjust.left < adjust.top) && newCorner.precedance === 'y' && (/center/).test(newCorner.x)) {
							newCorner.precedance = 'x';
						}
						else if((adjust.left > adjust.top) && newCorner.precedance === 'x' && (/center/).test(newCorner.y)) {
							newCorner.precedance = 'y';
						}
					}

					// Adjust positioning
					if(self.corner.string() === newCorner.string())
					{
						// Determine the opposite corner precendance
						precedance = newCorner.precedance === 'y' ? ['y', 'x'] : ['x', 'y'];

						// Determine if border adjustments are needed
						if($.fn.qcorner && !(/center/).test(newCorner[ precedance[1] ])){
							borderAdjust = newCorner.y + newCorner.x.substr(0,1).toUpperCase() + newCorner.x.substr(1);
							try{ borderAdjust = qTip.options.style.radius || qTip.options.style[ borderAdjust ].radius; }
							catch(e){ borderAdjust = 0; }
						}

						// Adjust positioning
						if(newCorner.precedance === 'y') {
							position.top += (newCorner[ precedance[0] ] === 'top' ? 1 : -1) * self.size.height;
							position.left -= (newCorner[ precedance[1] ] === 'left' ? 1 : -1) * borderAdjust;
						}
						else {
							position.left += (newCorner[ precedance[0] ] === 'left' ? 1 : -1) * self.size.width;
							position.top -= (newCorner[ precedance[1] ] === 'top' ? 1 : -1) * borderAdjust;
						}

						// Update the tip
						self.update();
					}
					else {
						corner = newCorner;
						self.container();
						self.create();
						self.update(false);
					}
				})

				// Create a new tip
				self.container();
				self.create();
				self.update();

				return self;
			},

			container: function()
			{
				// Create tip element and prepend to the tooltip with corner data attached
				self.tip = $('<div class="ui-tooltip-tip ui-widget-content"></div>').prependTo(qTip.elements.tooltip);

				// Update size
				size();

				return self;
			},

			create: function()
			{
				var height = self.size.height,
					width = self.size.width;

				// Create tip element
				switch(self.method)
				{
					case 'canvas':
						self.tip.append('<canvas height="'+height+'" width="'+width+'"></canvas>');
					break;

					case 'vml':
						// Create VML element and a phantom image (IE won't show the last created VML element otherwise)
						self.tip.append('<vml:shape class="qtip_vml" coordsize="'+(width+','+height)+'"  stroked="false"' +
							' style=" behavior:url(#default#VML); antialias:true; display:inline-block; ' +
							' width:'+width+'px; height:'+height+'px; vertical-align:'+self.corner.y+'; border:0;"></vml:shape>');
					break;

					case 'css':
						self.tip.addClass('ui-tooltip-tip-'+self.corner.string()).append('<div class="ui-tooltip-tip-inner"></div>');
					break;
				}

				return self;
			},

			update: function(redetermine)
			{
				var color, context, toSet, path, coords,
					inner = self.tip.children(':first'),
					regular = 'px solid ',
					transparent = 'px solid transparent',
					height = self.size.height,
					width = self.size.width;

				// Re-determine tip if not already set
				if(redetermine !== false){ determine(); }
				if(self.method !== 'css'){ coords = calculate(self.type.string(), self.size.width, self.size.height); }

				// Detect new tip colour and reset background to transparent
				if(qTip.options.style.tip.color) {
					color = qTip.options.style.tip.color;
				}
				else {
					color = self.tip.css('background-color', '').css('background-color');
					color = (color === 'transparent') ? qTip.elements.wrapper.css('border-top-color') : color;
					self.tip.css('background-color', 'transparent');
				}
				regular += color;

				// Create tip element
				switch(self.method)
				{
					case 'canvas':
						// Setup canvas properties
						context = inner.get(0).getContext('2d');
						context.fillStyle = color;
						context.miterLimit = 0;

						// Draw the canvas tip (Delayed til after DOM creation)
						context.clearRect(0,0,3000,3000);
						context.beginPath();
						context.moveTo(coords[0][0], coords[0][1]);
						context.lineTo(coords[1][0], coords[1][1]);
						context.lineTo(coords[2][0], coords[2][1]);
						context.closePath();
						context.fill();
					break;

					case 'vml':
						// Create coordize and tip path using tip coordinates
						path = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
							',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

						// Set new attributes
						inner.attr('path', path).attr('fillcolor', color);
					break;

					case 'css':
						// Reset borders
						inner.attr('style', '');

						// Determine what border corners to set
						toSet = {
							x: self.type.precedance === 'x' ? (self.type.x === 'left' ? 'right' : 'left') : self.type.x,
							y: self.type.precedance === 'y' ? (self.type.y === 'top' ? 'bottom' : 'top') : self.type.y
						};

						// Setup borders based on corner values
						if(self.type.x === 'center')
						{
							inner.css({
								borderLeft: (width / 2) + transparent,
								borderRight: (width / 2) + transparent
							})
							.css('border-'+toSet.y, height + regular);
						}
						else if(self.type.y === 'center')
						{
							inner.css({
								borderTop: (height / 2) + transparent,
								borderBottom: (height / 2) + transparent
							})
							.css('border-'+toSet.x, width + regular);
						}
						else
						{
							inner.css('border-width', (height / 2) + 'px ' + (width / 2) + 'px')
							.css('border-' + toSet.x, (width / 2) + regular)
							.css('border-' + toSet.y, (height / 2) + regular);
						}
					break;
				}

				// Update position
				position();

				return self;
			},

			destroy: function()
			{
				// Remove previous tip if present
				if(self.tip) {
					self.tip.add(self.elements.qTip).removeData('qtip').remove();
				}

				// Remove bound events
				qTip.elements.tooltip.unbind('tooltipmove.tip');
			}
		});

		self.init();
	}

	$.fn.qtip.plugins.tip = function(qTip)
	{
		var api = qTip.plugins.tip,
			opts = qTip.options.style.tip;

		// Make sure tip options are present
		if(opts) {
			// An API is already present,
			if(api) {
				return api;
			}
			// No API was found, create new instance
			else {
				qTip.plugins.tip = new Tip(qTip);
				return qTip.plugins.tip;
			}
		}
	};

	$.fn.qtip.plugins.tip.initialize = 'render';
	$.fn.qtip.plugins.tip.sanitize = function(opts)
	{
		if(typeof opts.style.tip !== 'object'){ opts.style.tip = { corner: opts.style.tip }; }
	}
}(jQuery));
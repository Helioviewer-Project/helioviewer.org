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

	// Setup VML styles
	$(function() {
		var ieCSS;

		// IE FIXES - VML and style problems
		if($.browser.msie && !document.styleSheets.qtip_vml)
		{
			// Create new stylesheet and set its ID so we only create it once
			ieCSS = document.createStyleSheet();
			ieCSS.owningElement.id = 'qtip_vml';

			// Set style fixes for tooltip elements and VML
			ieCSS.cssText = '.qvml{ behavior:url(#default#VML); antialias:true; display:inline-block; } ' + // Base VML styles
				'.ui-tooltip-content{ display: inline-block; }'; // Fixes element overlap issues e.g. images disappearing in content
		}
	})

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

			// Setup coordinates if method isn't CSS
			if(self.method !== 'css') {
				self.size.coords = calculate(self.type.string(), self.size.width, self.size.height);
			}
		}

		// Determines tip corner
		function determine()
		{
			var corner = qTip.options.style.tip.corner,
				type = qTip.options.style.tip.type || corner;

			if(corner === false) {
				return false;
			}
			else{
				if(corner === true) {
					corner = $.extend({}, qTip.options.position.corner.tooltip);
				}
				else if(!corner.precedance) {
					corner = new $.fn.qtip.plugins.Corner(corner);
				}

				if(type === true) {
					type = $.extend({}, qTip.options.position.corner.tooltip);
				}
				else if(!type.precedance) {
					type = new $.fn.qtip.plugins.Corner(type);
				}
			}

			return corner.string() === 'centercenter' ? false : [corner, type];
		}

		// Tip position method
		function position()
		{
			var corner = self.corner,
				corners  = ['left', 'right'],
				adjust = 0,
				borderAdjust =  qTip.options.style.border.radius || 0,
				ieAdjust = { left: 0, right: 0, top: 0, bottom: 0 };

			// Return if tips are disabled or tip is not yet rendered
			if(qTip.options.style.tip.corner === false || !self.tip){ return false; }

			// Set initial position
			self.tip.css(corner.x, 0).css(corner.y, 0);

			// Setup corners to be adjusted
			corners[ (corner.precedance === 'y') ? 'push' : 'unshift' ]('top', 'bottom');

			// Setup adjustments
			adjust = parseInt(qTip.elements.tooltip.css('border-'+corners[0]+'-width').replace(/([0-9]+)/i, "$1"), 10);
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
					self.tip
						.css(corners[0], '50%')
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
				if(properties === false) {
					return false;
				}
				else {
					self.corner = properties[0];
					self.type = properties[1];
				}

				// Detect what type of tip to use
				self.method = $('<canvas/>').get(0).getContext && self.corner.string().search('center') > -1 ? 'canvas' : ($.browser.msie) ? 'vml' : 'css';

				// Bind update events
				qTip.elements.tooltip.bind('tooltipmove.tip', function(event, api, position) {
					// Clone current corner object
					var newCorner = $.extend({}, self.corner),
						adjust = {
							left: api.get('position.adjust.screen.left'),
							top: api.get('position.adjust.screen.top'),
							screen: api.get('position.adjust.screen')
						};

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

						if((adjust.left < adjust.top) && newCorner.precedance === 'y' && newCorner.x.search(/center/) < 0) {
							newCorner.precedance = 'x';
						}
						else if((adjust.left > adjust.top) && newCorner.precedance === 'x' && newCorner.y.search(/center/) < 0) {
							newCorner.precedance = 'y';
						}
						else {
							newCorner.offset = { left: 0, top: 0 };
						}
					}

					// If the new corner value is different, re-create the tip
					if( newCorner.string() !== self.corner.string() ) {
						corner = newCorner;
						self.container();
						self.create();
					}

					// Update the tip
					self.update();
				})

				// Create a new tip
				self.container();
				self.create();

				return self;
			},

			container: function()
			{
				// Create tip element and prepend to the tooltip with corner data attached
				self.tip = $('<div class="ui-tooltip-tip ui-widget-content"></div>')
					.prependTo(qTip.elements.tooltip);

				// Update API reference
				qTip.elements.tip = self.tip;

				// Update size
				size();

				return self;
			},

			create: function()
			{
				var height = self.size.height,
					width = self.size.width,
					path = self.size.coords;

				// Create tip element
				switch(self.method)
				{
					case 'canvas':
						self.tip.append('<canvas height="'+height+'" width="'+width+'"></canvas>');
					break;

					case 'vml':
						// Create coordize and tip path using tip coordinates
						path = 'm' + path[0][0] + ',' + path[0][1] + ' l' + path[1][0] +
							',' + path[1][1] + ' ' + path[2][0] + ',' + path[2][1] + ' xe';

						// Create VML element and a phantom image (IE won't show the last created VML element otherwise)
						self.tip.append('<vml:shape class="qvml" path="'+path+'" coordsize="'+(width+','+height)+'"  stroked="false"' +
							' style="width:'+width+'px; height:'+height+'px; vertical-align:'+self.corner.y+'; border:0;"></vml:shape>');
					break;

					case 'css':
						self.tip.addClass('ui-tooltip-tip-'+self.corner.string()).append('<div class="ui-tooltip-tip-inner"></div>');
					break;
				}

				return self;
			},

			update: function()
			{
				var color, context, toSet,
					coords = self.size.coords,
					inner = self.tip.children(':first'),
					regular = 'px solid ',
					transparent = 'px solid transparent',
					height = self.size.height,
					width = self.size.width;

				// Detect new tip colour and reset background to transparent
				color = self.tip.css('background-color', '').css('background-color');
				color = (color === 'transparent') ? qTip.elements.tooltip.css('border-top-color') : color;
				self.tip.css('background-color', 'transparent');

				// Update regular border colour
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
						// Set new fillcolor attribute
						inner.attr('fillcolor', color);
					break;

					case 'css':
						// Determine what border corners to set
						toSet = {
							x: self.corner.precedance === 'x' ? (self.corner.x === 'left' ? 'right' : 'left') : self.corner.x,
							y: self.corner.precedance === 'y' ? (self.corner.y === 'top' ? 'bottom' : 'top') : self.corner.y
						};

						// Setup borders based on corner values
						if(self.corner.x === 'center')
						{
							inner.css({
								borderLeft: (width / 2) + transparent,
								borderRight: (width / 2) + transparent
							})
							.css('border-'+toSet.y, height + regular);
						}
						else if(self.corner.y === 'center')
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
			// Parse options
			if(typeof opts !== 'object'){ qTip.options.style.tip = { corner: opts }; }

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

	// Plugin needs to be initialized on render
	$.fn.qtip.plugins.tip.initialize = 'render';
}(jQuery));
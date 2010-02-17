/*!
* jquery.qtip.imagemap. The jQuery tooltip plugin - Imagemap plugin
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

	$.fn.qtip.plugins.areaDetails = function(area, corner)
	{
		var shape = area.attr('shape').toLowerCase(),
			baseCoords = area.attr('coords').split(','),
			coords = [],
			imageOffset = $('img[usemap="#'+area.parent('map').attr('name')+'"]').offset(),
			result = {
				width: 0, height: 0,
				offset: { top: 10000, right: 0, bottom: 0, left: 10000 }
			},
			i = 0, next = 0;

		// POLY area coordinate calculator
		//	Special thanks to Ed Cradock for helping out with this.
		//	Uses a binary search algorithm to find suitable coordinates.
		function polyCoordinates(result, coords)
		{
			var i = 0,
				compareX = 1, compareY = 1,
				realX = 0, realY = 0,
				newWidth = result.width,
				newHeight = result.height;

			// Use a binary search algorithm to locate most suitable coordinate (hopefully)
			while(newWidth > 0 && newHeight > 0 && compareX > 0 && compareY > 0)
			{
				newWidth = Math.floor(newWidth / 2);
				newHeight = Math.floor(newHeight / 2);

				if(corner.x === 'left'){ compareX = newWidth; }
				else if(corner.x === 'right'){ compareX = result.width - newWidth; }
				else{ compareX += Math.floor(newWidth / 2); }

				if(corner.y === 'top'){ compareY = newHeight; }
				else if(corner.y === 'bottom'){ compareY = result.height - newHeight; }
				else{ compareY += Math.floor(newHeight / 2); }

				i = coords.length; while(i--)
				{
					if(coords.length < 2){ break; }

					realX = coords[i][0] - result.offset.left;
					realY = coords[i][1] - result.offset.top;

					if((corner.x === 'left' && realX >= compareX) ||
					(corner.x === 'right' && realX <= compareX) ||
					(corner.x === 'center' && (realX < compareX || realX > (result.width - compareX))) ||
					(corner.y === 'top' && realY >= compareY) ||
					(corner.y === 'bottom' && realY <= compareY) ||
					(corner.y === 'center' && (realY < compareY || realY > (result.height - compareY)))) {
						coords.splice(i, 1);
					}
				}
			}

			return { left: coords[0][0], top: coords[0][1] };
		}

		// Parse coordinates into proper array
		if(shape === 'poly') {
			i = baseCoords.length; while(i--)
			{
				next = [ parseInt(baseCoords[--i], 10), parseInt(baseCoords[i+1], 10) ];

				if(next[0] > result.offset.right){ result.offset.right = next[0]; }
				if(next[0] < result.offset.left){ result.offset.left = next[0]; }
				if(next[1] > result.offset.bottom){ result.offset.bottom = next[1]; }
				if(next[1] < result.offset.top){ result.offset.top = next[1]; }

				coords.push(next);
			}
		}
		else {
			coords = $.map(baseCoords, function(coord){ return parseInt(coord, 10); });
		}

		// Calculate details
		switch(shape)
		{
			case 'rect':
				result = {
					width: Math.abs(coords[2] - coords[0]),
					height: Math.abs(coords[3] - coords[1]),
					offset: { left: coords[0], top: coords[1] }
				};
			break;

			case 'circle':
				result = {
					width: coords[2] + 2,
					height: coords[2] + 2,
					offset: { left: coords[0], top: coords[1] }
				};
			break;

			case 'poly':
				$.extend(result, {
					width: Math.abs(result.offset.right - result.offset.left),
					height: Math.abs(result.offset.bottom - result.offset.top)
				});
				result.offset = polyCoordinates(result, coords.slice());
				result.width = result.height = 0;
			break;
		}

		// Add image position to offset coordinates
		result.offset.left += imageOffset.left;
		result.offset.top += imageOffset.top;

		return result;
	};
}(jQuery));
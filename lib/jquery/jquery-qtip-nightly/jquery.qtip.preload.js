/*!
* jquery.qtip.imageload. The jQuery tooltip plugin - Image preloader plugin
*
* This plugin fixes positioning issues caused by using images in your content
* by preloading them and attaching them the DOM in advance.  It's primarily useful
* for people who use qTip for things like lightbox functionality.
*
* Based on an article by matt: http://www.mattfarina.com/2007/02/01/preloading_images_with_jquery
*
* Copyright (c) 2009 Craig Thompson
* http://craigsworks.com
*
* Licensed under MIT
* http://www.opensource.org/licenses/mit-license.php
*
* Launch   : August 2009
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

	function matchImages(str, isGlobal)
	{
		var images = new RegExp("< *[img][^>]*[src] *= *[\"']{0,1}([^\"' >]*)[^>]*>", isGlobal ? 'ig' : 'i');

		return images.exec(str);
	}

	$.fn.qtip.plugins.preload = function(content)
	{
		var images = [], i, src;

		// If supplied content is a jQuery DOM array, grab it's inner HTML
		if(content.html) {
			content = content.html();
		}

		// Find all images within the content
		images = matchImages(content, true);
		if(images && images.length > 0)
		{
			// Loop through each image
			i = images.length; while(i--)
			{
				// Check if height and width are present and if so, skip this image
				if(images[i].search(/^</i) < 0 || images[i].search(/(width|height){1} *= *["']{0,1}([^>]*)/i) > -1) {
					continue;
				}

				// Grab the images src attribute
				src = matchImages(images[i]);

				// Append new image to document body and preload the image off screen
				if(src && src.length > 1 && src[1] && $('img.qtip-preload[src="'+src[1]+'"]').length < 1) {
					$(document.body).append('<img class="qtip-preload" src="'+src[1]+'" style="position:absolute; left:-10000em; top:-10000em;" />');
				}
			}
		}
	};

	// Plugin needs to be initialized on initialization e.g. qTip call
	$.fn.qtip.plugins.preload.initialize = 'initialize';
}(jQuery));
/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription Static class. Keeps a cache of retrieved urls.
 */
 
/*global Class, Control, document, $, $A, Ajax, Debug, GLOBAL_zoomLevel */
var AjaxRequestWrapper = Class.create();

AjaxRequestWrapper.cache = {};

/**
 * @classDescription Wraps a GET url request to contain state
 * information like the url, and simplifies the use by setting some
 * standard behaviour.
 * TODO: Create a non-cached version for retrieving data that is
 * updated frequently.
 */
AjaxRequestWrapper.getCached = Class.create();

AjaxRequestWrapper.getCached.prototype = {
	/**
	 * @constructor 				Creates a new instance and processes the request.
	 * @param {String} url			The url to retrieve.
	 * @param {Function} callback	The function that handles the retrieved data.
	 */
	initialize: function (url, callback) {

		// Closures
		this.url = url;
		this.callback = callback;
		
		// Get any additional arguments for XHR. The first two items of the array are
		// the url and callback function for the XHR. In many cases this.arguments will
		// simply eval to [].
		this.args = $A(arguments).slice(2);

		var self = this;
		
		if (AjaxRequestWrapper.cache[url]) {
			callback.apply(null, $A([AjaxRequestWrapper.cache[self.url]]).concat(self.args));
		} else {
			var onSuccess = function (transport) {
				AjaxRequestWrapper.cache[self.url] = transport.responseText;
				callback.apply(null, $A([AjaxRequestWrapper.cache[self.url]]).concat(self.args));
			};
			
			var onFailure = function (transport) {
				Debug.ajaxFailure(transport, self.url);
			};
			
			var trash = new Ajax.Request(
				url,
				{
					method: 'get',
					onSuccess: onSuccess,
					onFailure: onFailure
				}
			);
		}
	}
};

/**
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @fileOverview Provides basic debugging functionality to Helioviewer.
 */
var Debug = Class.create(
	/** @lends Debug.prototype */
	{
	/**
	 * @description Creates a new Debug instance.
	 * @constructs 
	 */ 
	initialize: function () {
		this.outputBuffer  = "";
		this.outputTimeout = null;		
	},

	/**
	 * @description test
	 * @param {Int} xIndex
	 * @param {Int} yIndex
	 * @param {Int} level
	 */
	test: function (xIndex, yIndex, level) {
		xIndex = 9;
		level = 3;
		for (var l = 0; l <= level; l++) {
			var x = (xIndex >> (level - l + 1)) / (1 << l);
			var x2 = 1 / (1 << l + 1);
			Debug.output(x, (1 << l), (xIndex >> (level - l)), x2);
		}
	},
	
	/**
	 * @description Outputs text to Firebug's console when available.
	 */
	output: function () {
		var txt = '';
		
		for (var i = 0; i < arguments.length; i++) {
			txt += arguments[i];
			if (i < arguments.length - 1) {
			    txt += ', ';
			}
		}
		
		if (window.console) {
			window.console.log(txt);
		} else {
			if (Debug.outputTimeout) {
			    clearTimeout(Debug.outputTimeout);
			}
			Debug.outputBuffer = txt + '\n' + Debug.outputBuffer;
			Debug.outputTimeout = setTimeout(Debug.flush, 100);
		}
	},
	
	/**
	 * @description Outputs the contents of a JavaScript array.
	 * @param {Array} a Array to output 
	 */
	plotArray: function (a) {
		Debug.output('----\n' + Debug.strArray(a, '', 0));
	},
	
	/**
	 * @description Converts an array to a string.
	 * @param {Array} a
	 * @param {int} indent
	 * @param {int} index
	 */
	strArray: function (a, indent, index) {
		//Debug.output(typeof(a), a instanceof Array);
		if (a instanceof Array) {
			if (a.length === 0) {
			    return indent + index + ': []\n';
			}
			var txt = indent + index + ': [\n';
			var c = 0;
			a.each(function (m) {
				txt += Debug.strArray(m, indent + '  ', c);
				++c;
			});
			return txt + indent + ']\n';
		} else {
			return indent + index + ': ' + a + '\n';
		}
	},
	
	/**
	 * @description Flushes output buffer.
	 */
	flush: function () {
	    if ($('debugOutput')) {
	        $('debugOutput').innerHTML = '----\n' + Debug.outputBuffer + $('debugOutput').innerHTML;
	        Debug.outputBuffer = '';
	    }
	},
	
	/**
	 * @description Outputs informative message when an AJAX request fails.
	 * @param {Object} transport
	 * @param {String} url
	 */
	ajaxFailure: function (transport, url) {
		Debug.output('Error getting file "' + url + '": ' + transport.status + ' ' + transport.statusText);
	}
});
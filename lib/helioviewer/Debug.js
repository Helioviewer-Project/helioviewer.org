/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription This class provides basic debugging functionality
 */
var Debug = Class.create();

Debug.outputBuffer = '';
Debug.outputTimeout = null;

Debug.test = function (xIndex, yIndex, level) {
	xIndex = 9;
	level = 3;
	for (var l = 0; l <= level; l++) {
		var x = (xIndex >> (level - l + 1)) / (1 << l);
		var x2 = 1 / (1 << l + 1);
		Debug.output(x, (1 << l), (xIndex >> (level - l)), x2);
	}
};

Debug.output = function () {
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
};

Debug.plotArray = function (a) {
	Debug.output('----\n' + Debug.strArray(a, '', 0));
};

Debug.strArray = function (a, indent, index) {
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
};

Debug.flush = function () {
    if ($('debugOutput')) {
        $('debugOutput').innerHTML = '----\n' + Debug.outputBuffer + $('debugOutput').innerHTML;
        Debug.outputBuffer = '';
    }
};

Debug.ajaxFailure = function (transport, url) {
	Debug.output('Error getting file "' + url + '": ' + transport.status + ' ' + transport.statusText);
};
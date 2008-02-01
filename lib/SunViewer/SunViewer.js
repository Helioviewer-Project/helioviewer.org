/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
 
var SunViewer = Class.create();

SunViewer.prototype = {
	defaultOptions: $H({
		widgets: []
	}),

	// Constructor
	initialize: function(id, options) {
		this.id = id;
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);
	}
};

SunViewer.showMessage = function(url) {
	var callback = function(transport) {
		var msgContainer = document.createElement('div');
		msgContainer.className = 'messageBox';
		var msgBg = document.createElement('div');
		msgBg.className = 'messageBg';
		msgContainer.appendChild(msgBg);
		var closeX = document.createElement('span');
		closeX.className = 'closeX';
		closeX.innerHTML = 'X';
		closeX.onclick = function() { this.parentNode.parentNode.removeChild(this.parentNode); };
		msgContainer.appendChild(closeX);
		var msgFg = document.createElement('div');
		msgFg.className = 'messageFg';
		msgFg.innerHTML = transport.responseText;
		msgContainer.appendChild(msgFg);
		var element = document.getElementsByTagName('body')[0].appendChild(msgContainer);
	}
	
	new Ajax.Request(url, {
		method: 'get',
		onSuccess: callback
	});
}

SunViewer.closeMessage = function(div) {
	div.parentElement.removeChild(div);
}

String.prototype.splitTrim = function(delimiter) {
	var part = '';
	var parts = [];
	var len = this.length;
	for (var i = 0; i < len; i++) {
		if (this[i] == delimiter) {
			if (part.length > 0) {
				parts.push(part);
				part = '';
			}
			continue;
		}
		part += this[i];
	}
	if (part.length > 0) parts.push(part);
	return parts;
}

Number.prototype.toRad = function() {
	return this / 180 * Math.PI;
}

Number.prototype.toDeg = function() {
	return this * 180 / Math.PI;
}

String.parseInt = function(val)
{
	if (typeof (val) != 'String') return parseInt(val);
	while (val.charAt(0) == '0')
    	val = val.substring(1, val.length);

	return parseInt(val);
}
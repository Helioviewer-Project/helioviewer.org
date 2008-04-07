/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
 /*global Class, $, $$, $H, Ajax, Element */
 
var SunViewer = Class.create();

SunViewer.prototype = {
	defaultOptions: $H({
		widgets: []
	}),

	// Constructor
	initialize: function (id, options) {
		this.id = id;
		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		$('about').observe('click', SunViewer.showMessage.curry('html/about.html'));
	}
};

SunViewer.showMessage = function (url) {
	var callback = function (transport) {
		//Container for a message box
		var msgContainer = new Element('div', {'class': 'messageBox'});

        //Background
		var msgBg = new Element('div', {'class': 'messageBg'});
		msgContainer.appendChild(msgBg);
	
	    //Close Button
		var closeX = new Element('span', {'class': 'closeX'}).update('X');
		closeX.onclick = function () {
		    this.parentNode.parentNode.removeChild(this.parentNode);
		};
		msgContainer.appendChild(closeX);
		
		//Foreground
		var msgFg = new Element('div', {'class': 'messageFg'}).update(transport.responseText);
		msgContainer.appendChild(msgFg);
		
		//Add to the <body> element
		var element = $$('body')[0].appendChild(msgContainer);
	};
	
	var trash = new Ajax.Request(url, {
		method: 'get',
		onSuccess: callback
	});
};

SunViewer.closeMessage = function (div) {
	div.parentElement.removeChild(div);
};

String.prototype.splitTrim = function (delimiter) {
	var part = '';
	var parts = [];
	var len = this.length;
	for (var i = 0; i < len; i++) {
		if (this[i] === delimiter) {
			if (part.length > 0) {
				parts.push(part);
				part = '';
			}
			continue;
		}
		part += this[i];
	}
	if (part.length > 0) {
	    parts.push(part);
	}
	return parts;
};

Number.prototype.toRad = function () {
	return this / 180 * Math.PI;
};

Number.prototype.toDeg = function () {
	return this * 180 / Math.PI;
};

String.parseInt = function (val)
{
	if (typeof (val) !== 'String') {
	    return parseInt(val, 10);
	}
	while (val.charAt(0) === '0') {
    	val = val.substring(1, val.length);
	}

	return parseInt(val, 10);
};
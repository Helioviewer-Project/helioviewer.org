/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @classDescription  ...
 */
 /*global Class, Ajax, $*/
var LoadingIndicator = Class.create();

LoadingIndicator.prototype = {
	initialize: function () {
		this.loadingItems = [];
		
		Ajax.Responders.register({
            onCreate:  this.loadingStarted.bind(this, 'Ajax'),
		    onComplete:this.loadingFinished.bind(this,'Ajax')
		});
	},

	show: function () {
		//Effect.Appear($('loading'), { duration: 1 });
		$('loading').show();
	},
	
	hide: function () {
		//Effect.Fade($('loading'), { duration: 1 });
		$('loading').hide();
	},
	
	reset: function () {
		this.loadingItems.length = 0;
		this.hide();
	},
	
	loadingStarted: function (e) {
		this.show();
		this.loadingItems.push({});
	},
	
	loadingFinished: function (i) {
		this.loadingItems.pop();
		if (this.loadingItems.length === 0) {
		    this.hide();
		}
	}
};
/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription  ...
 */
var LoadingIndicator = Class.create();

LoadingIndicator.prototype = {
	initialize: function() {
		this.loadingItems = [];
		
		Ajax.Responders.register({
		  onCreate: this.loadingStarted.bind(this, 'Ajax'),
		  onComplete: this.loadingFinished.bind(this, 'Ajax')
		});
	},

	show: function() {
		$('loading').show();
	},
	
	hide: function() {
		$('loading').hide();
	},
	
	reset: function() {
		this.loadingItems.length = 0;
		this.hide();
	},
	
	loadingStarted: function(item) {
		this.show();
		this.loadingItems.push(new Object());
		//Debug.output('Loading started: ' + item + ' (' + this.loadingItems.length + ')');
	},
	
	loadingFinished: function(item) {
		this.loadingItems.pop();
		if (this.loadingItems.length == 0) this.hide();
		//Debug.output('Loading finished: ' + item + ' (' + this.loadingItems.length + ')');
	}
};
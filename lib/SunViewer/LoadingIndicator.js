/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription  ...
 */
var LoadingIndicator = Class.create();

LoadingIndicator.prototype = {
	initialize: function() {
		//this.loadingItemCount = 0;
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
		this.loadingItemCount = 0;
		this.hide();
	},
	
	loadingStarted: function(item) {
		//if (!item) item = new object();
		this.show();
		this.loadingItems.push(new Object());
		//++this.loadingItemCount;
		//Debug.output('Loading started: ' + item + ' (' + this.loadingItems.length + ')');
	},
	
	loadingFinished: function(item) {
		this.loadingItems.pop();
		if (this.loadingItems.length == 0) this.hide();
		//if (this.loadingItemCount < 0) this.loadingItemCount = 0;
		//Debug.output('Loading finished: ' + item + ' (' + this.loadingItems.length + ')');
	}
};
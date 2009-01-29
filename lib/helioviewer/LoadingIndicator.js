/**
 * @fileOverview Definition of a simple AJAX Request Loading Indicator UI component
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 */
 /*global Class, Ajax, $*/
var LoadingIndicator = Class.create(
	/** @lends LoadingIndicator.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new LoadingIndicator
	 */
	initialize: function () {
		this.loadingItems = [];
		
		Ajax.Responders.register({
            onCreate:  this.loadingStarted.bind(this, 'Ajax'),
		    onComplete:this.loadingFinished.bind(this,'Ajax')
		});
	},

	/**
	 * @description Display the loading indicator
	 */
	show: function () {
		//Effect.Appear($('loading'), { duration: 1 });
		$('loading').show();
	},
	
	/**
	 * @description Hide the loading indicator
	 */
	hide: function () {
		//Effect.Fade($('loading'), { duration: 1 });
		$('loading').hide();
	},
	
	/**
	 * @description Reset the loading indicator
	 */
	reset: function () {
		this.loadingItems.length = 0;
		this.hide();
	},
	
	/**
	 * @description Add an AJAX request to the loading stack
	 * @param {Object} e Event
	 */
	loadingStarted: function (e) {
		this.show();
		this.loadingItems.push({});
	},
	
	/**
	 * @description Remove an AJAX request from the loading stack
	 * @param {Object} i Item to remove
	 */
	loadingFinished: function (i) {
		this.loadingItems.pop();
		if (this.loadingItems.length === 0) {
		    this.hide();
		}
	}
});
/**
 * @fileOverview Contains the class definition for an UIElement class.
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
 /*global Class */
var UIElement = Class.create(
	/** @lends UIElement.prototype */
	{
	/**
 	 * @description Enables inheriting classes to use the "event/notification" system
 	 * @constructs
 	 */
	initialize: function () {},
	
	/**
	 * @description Adds an event observer
	 * @param {String} eventName The name of the event to look for 
	 * @param {Function} callback The function to execute when the event occurs
	 */
	addObserver: function(eventName, callback) {
	    if (!this.observers) {
	    	this.observers = [];
	    }
	    if (!this.observers[eventName]) {
		    this.observers[eventName] = $A([]);
	    }
	    this.observers[eventName].push(callback);
	    return this;
	},

	/**
	 * @describe Fires a specific event
	 * @param {String} eventName The name of the event to trigger
	 * @param {Object} eventParameters The parameters to pass along with the event
	 */
	fire: function(eventName, eventParameters) {
		//$('output').innerHTML = eventName + ': ' + eventParameters;
	    if (!this.observers || !this.observers[eventName] || this.observers[eventName].length === 0) {
			return this;
	    }
	    this.observers[eventName].each(function(callback) {
	    	callback(eventParameters);
	    });
	    return this;
	}
});
/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription The SunViewerWidget class enables inheriting 
 * classes to use the "event/notification" system.
 * Other features that need to be available in all/most components
 * can be implemented here, too.
 */
var SunViewerWidget = Class.create();

SunViewerWidget.prototype = {

	/**
	 * @constructor Do not use the constructor to create object 
	 * properties.
	 * The inheriting classes add a instance of this class to their
	 * prototype, and thus they all would be sharing a reference
	 * to that same object.
	 */
	initialize: function() {
		
	},

	/**
	 * @method addListener					Adds an Event Listener.
	 * The Method called will be listener.oneventName
	 * @param {SunViewerWidget} listener	The listening widget.
	 * @param {String} eventName			The name of the event.
	 */	
	addListener: function(listener, eventName) {
		if (!this.eventListeners) this.eventListeners = [];
		if (!this.eventListeners[eventName])
			this.eventListeners[eventName] = [];
		this.eventListeners[eventName].push(listener);
		return this;
	},
	
	/**
	 * @methoremoveListeners		Remove all listeners to a specific event.
	 * @param {String} eventName	The name of the event.
	 */
	removeListeners: function(eventName) {
		if (this.eventListeners && this.eventListeners[eventName]) this.eventListeners[eventName].clear();
	},
	
	/**
	 * @method removeListener				Remove a specific listener/event combination.
	 * @param {SunViewerWidget} listener	The listener to remove.
	 * @param {String} eventName			The name of the event.
	 */
	removeListener: function(listener, eventName) {
		this.eventListeners[eventName] = $A(this.eventListeners[eventName]).without(listener);
	},
	
	/**
	 * @method notifyListeners					Notifies all listeners that a specific event has fired.
	 * @param {String} eventName				The name of the event.
	 * @param {Object} eventProperties			The properties of the event. Can be anything.
	 * @param {SunViewerWidget} firingWidget	The widget that fired the event. It is not notified again.
	 */
	notifyListeners: function(eventName, eventProperties, firingWidget) {
		if (!firingWidget) firingWidget = this;
		if (!this.eventListeners || !this.eventListeners[eventName]) return;
	
		this.eventListeners[eventName].each(function(listener) {
			// Don't notify the widget that has fired the event
			if (listener != firingWidget) {
				if (!listener['on' + eventName] || !(listener['on' + eventName] instanceof Function)) {
					// TODO: Exception: event handler not found
					return;
				}
				var eventHandler = listener['on' + eventName].bind(listener, eventProperties, firingWidget);
				
				// asynchronous call
				//window.setTimeout(eventHandler,0);
				
				// synchronous call
				eventHandler();
			}

		});
		
		return this;
	},

	/**
	 * @method observe					Observe a widget's event. Alias for widget.addListener(this, eventName).
	 * @param {SunViewerWidget} widget	The widget to observe.
	 * @param {Object} eventName		The name of the event.
	 */	
	observe: function(widget, eventName) {
		widget.addListener(this, eventName);
	},
	
	/**
	 * @method stopObserving			Stop observing a widget's event. Alias for widget.removeListener(this, eventName).
	 * @param {SunViewerWidget} widget	The widget to observe.
	 * @param {Object} eventName		The name of the event.
	 */
	stopObserving: function(widget, eventName) {
		widget.removeListener(this, eventName);
	}
}
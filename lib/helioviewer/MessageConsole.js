/**
 * @fileOverview Contains the "MessageConsole" class definition.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
 /*global document, UIElement, Effect, $, Class, Element, Event, window */
var MessageConsole = Class.create(UIElement ,
	/** @lends MessageConsole.prototype */
	{
    /**
     * @constructs
     * @description Creates a new MessageConsole.<br><br>
     * MessageConsole Provides a mechanism for displayed useful information to the user.
	 * For ease of use, the class provides methods comparable to Firebug's for outputting
	 * messages of different natures: "log" for generic unstyled messages, or for debbuging
	 * use, "info" to inform the user of some interesting change or event, and "warning" and
	 * "error" for getting the user's attention.
     * @param {Object} controller A reference to the Helioviewer (controller)
     * @param {String} container The id of the container for messages to be displayed in
     * @param {String} viewport  The id of the viewport container
     */
    initialize: function (controller, container, viewport) {
        this.controller = controller;
    },
    
	/**
	 * @description Logs a message to the message-console
	 * @param {String} msg Message to display
	 */
    log: function (msg) {
        jQuery.jGrowl(msg);
    },
    
    info: function (msg) {
        jQuery.jGrowl(msg);
    },


	progress: function (msg) {
        jQuery.jGrowl(msg);    
	},
    
	/**
	 * @description Displays a warning message in the message console
	 * @param {String} msg Message to display
	 */
    warn: function (msg) {
        jQuery.jGrowl(msg);
    },
    
	/**
	 * @description Displays an error message in the message console
	 * @param {String} msg Message to display
	 */
    error: function (msg) {
        jQuery.jGrowl(msg);
        var trash = new Effect.Shake('helioviewer-viewport-container-outer', {distance: 15, duration: 0.1});
    },
    
	/**
	 * @description Displays message along with a hyperlink in the message console
	 * @param {String} msg Message to display
	 * @param {String} Hyperlink text (Note: Event-handler should be used to handle hyperlink clicks. The link address thus is set to "#")
	 */
    link: function (msg, linkText) {
		var linkId, html;
			
    	// Generate a temporary id
    	linkId = 'link-' + this.controller.date.getTime() / 1000;
    	
    	// Html
    	html = "<a href='#' id='" + linkId + "' class='message-console-link'>" + linkText + "</a>" + msg;
        
        jQuery.jGrowl(html, {sticky: true});
        
        return linkId;
    }
});
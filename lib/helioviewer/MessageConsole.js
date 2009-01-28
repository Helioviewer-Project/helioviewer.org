/**
 * @fileoverview Contains the "MessageConsole" class definition. This class allows
 * information relevent to the user to be displayed in a specified location on-screen.
 */
/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a>
 * @class MessageConsole Provides a mechanism for displayed useful information to the user.
 *        For ease of use, the class provides methods comparable to Firebug's for outputting
 *        messages of different natures: "log" for generic unstyled messages, or for debbuging
 *        use, "info" to inform the user of some interesting change or event, and "warning" and
 *        "error" for getting the user's attention.
 */
 /*global document, UIElement, Effect, $, Class */
var MessageConsole = Class.create(UIElement , {
    /**
     * MessageClass Constructor
     * @constructor
     * @param {Controller} controller A reference to the Helioviewer (controller).
     * @param {String} container The id of the container for messages to be displayed in.
     * @param {String} viewport  The id of the viewport container.
     * sending and receiving events related to the message console.
     */
    initialize: function (controller, container, viewport) {
        this.controller = controller;
        this.console =  $(container);
        this.viewportId = viewport;

    },
    
    log: function (msg) {
        this.console.update(new Element('p', {style: 'color: #6495ED; font-weight: bold;'}).insert(msg));
        var trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
    info: function (msg) {
    },
    
    warn: function (msg) {
        this.console.update(new Element('p', {style: 'color: yellow; font-weight: bolder;'}).insert(msg));
        var trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
            var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);        
    },
    
    error: function (msg) {
        this.console.update(new Element('p', {style: 'color: red'}).insert(msg));
        var trash = new Effect.Shake(this.viewportId, {distance: 15, duration: 0.1});
        trash = new Effect.Appear(this.console, { duration: 3.0 });
    
        //Hide the message after several seconds have passed
        var self = this;
        window.setTimeout(function () {
           var trash = new Effect.Fade(self.console, { duration: 3.0 });
        }, 6500);
    },
    
    /*
     * @function
     * @name link
     */
    link: function (msg, linkText) {
    	// Generate a temporary id
    	var linkId = 'link-' + this.controller.date.getTime()/1000;
    	
    	// Html
    	var wrapper = new Element('span');
    	var link = new Element('a', {href: '#', id: linkId, 'class': 'message-console-link'}).update(linkText);
    	wrapper.insert(msg);
    	wrapper.insert(link)
    	
    	this.console.update(new Element('p', {style: 'color: #6495ED;'}).insert(wrapper));
        var trash = new Effect.Appear(this.console, { duration: 2.0 });
    
        //For downloads, leave the message up until the user clicks on the link provided.
        //Note: another possibility is to add a "close" option.
        var self = this;
        Event.observe(linkId, 'click', function() {
			self.console.hide();        	
        });
        
        return linkId;
    }
});
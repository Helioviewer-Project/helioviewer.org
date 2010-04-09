/**
 * @fileOverview Contains the "MessageConsole" class definition.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */ 
/*global document, $, Class, window */
"use strict";
var MessageConsole = Class.extend(
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
     */
    init: function () {
        this._setupEventHandlers();
    },
    
    /**
     * @description Logs a message to the message-console
     * @param {String} msg Message to display
     */
    log: function (msg, options) {
        $.jGrowl(msg, options);
    },
    
    /**
     * @description Makes a jGrowl notification and allows options to modify the notification
     * @param {Object} msg
     * @param {Object} options
     */
    info: function (msg, options) {
        $.jGrowl(msg, options);
    },
    
    /**
     * @description Displays a warning message in the message console
     * @param {String} msg Message to display
     */
    warn: function (msg, options) {
        $.jGrowl(msg, options);
    },
    
    /**
     * @description Displays an error message in the message console
     * @param {String} msg Message to display
     */
    error: function (msg, options) {
        $.jGrowl(msg, options);
        $("#helioviewer-viewport-container-outer").effect("shake", { times: 1 });
    },
    
    /**
     * Sets up event-handlers
     */
    _setupEventHandlers: function () {
        var events, self = this;
        
        events = "message-console-log message-console-info message-console-warn message-console-error";
        
        $(document).bind(events, function(event, msg, options) {
            if (typeof options === "undefined") {
                options = {};
            }
            if (event.type === "message-console-log") {
                self.log(msg, options);
            } else if (event.type === "message-console-info") {
                self.info(msg, options);
            } else if (event.type === "message-console-warn") {
                self.warn(msg, options);
            } else if (event.type === "message-console-error") {
                self.error(msg, options);
            }            
        });
    }
});
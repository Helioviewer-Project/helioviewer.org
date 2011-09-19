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
        $("#message-console").jGrowl(msg, options);
    },
    
    /**
     * @description Makes a jGrowl notification and allows options to modify the notification
     * @param {Object} msg
     * @param {Object} options
     */
    info: function (msg, options) {
        $("#message-console").jGrowl(msg, options);
    },
    
    /**
     * @description Displays a warning message in the message console
     * @param {String} msg Message to display
     */
    warn: function (msg, options) {
        $("#message-console").jGrowl(msg, options);
    },
    
    /**
     * @description Displays an error message in the message console
     * @param {String} msg Message to display
     */
    error: function (msg, options) {
        $("#message-console").jGrowl(msg, options);
        //$("#helioviewer-viewport-container-outer").effect("shake", { times: 1 });
    },
    
    /**
     * Sets up event-handlers
     */
    _setupEventHandlers: function () {
        var events, self = this;
        
        events = "message-console-log message-console-info message-console-warn message-console-error";
        
        $(document).bind(events, function (event, msg, options, showElapsedTime, easyClose) {
            // Default options
            if (typeof options === "undefined") {
                options = {};
            }
            if (typeof showElapsedTime == "undefined") {
                showElapsedTime = false;
            }
            if (typeof easyClose == "undefined") {
                easyClose = false;
            }

            // Show time elapsed since message was opened?
            if (showElapsedTime) {
                var id, header, headerText, i = 1;

                options = $.extend(options, {
                    beforeOpen: function (elem, message, opts) {
                        header = elem.find(".jGrowl-header");

                        id = window.setInterval(function () {
                            if (i == 1) {
                                headerText = "1 minute ago";
                            } else if (i < 60) {
                                headerText = i + " minutes ago";
                            } else if (i < 1440) {
                                headerText = parseInt(i / 60, 10) + " hours ago";
                            } else {
                                headerText = "A long time ago..."
                            }
                            
                            header.text(headerText);
                            i += 1;
                        }, 60000);
                        
                        // keep track of timer id so it can be disabled later
                        elem.data("timerId", id);
                    },
                    close: function(elem, message) {
                        window.clearInterval(elem.data("timerId"));
                    }
                });
            }

            // Click anywhere in the message to close?
            if (easyClose) {
                options = $.extend(options, {
                    open: function (msg) {
                        msg.click(function (e) {
                            msg.trigger("jGrowl.close");
                        });
                    }
                });
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
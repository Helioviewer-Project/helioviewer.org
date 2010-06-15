/**
 * @fileOverview
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*globals document, $, Class */
"use strict";
var KeyboardManager = Class.extend(
/** @lends KeyboardManager.prototype */
{
    /**
     * @constructs
     */
    init: function () {
        this._initEventHandlers();
    },
    

    /**
     * @description Initialize keyboard-related event handlers.
     * 
     * TODO: use events or public method instead of zoomControl's (private) method.
     * 
     * TODO (2009/07/29): Webkit doesn't support keypress events for non alphanumeric
     * keys (http://ejohn.org/blog/keypress-in-safari-31/).
     * 
     * Instead of using keypress, it may be better to use keydown and a boolean to decide 
     * when vp is moving and when it should be stationary.
     * 
     * Simple implementation:
     *     vp.movingUp (Boolean), vp.movingDown (Boolean), vp.movingLeft (Boolean), vp.movingRight (Boolean)
     *     
     * From there it is also simple to add support for diagonal movement, etc.
     */
    _initEventHandlers: function () {
        var onKeyPress, self = this;

        /**
         * @description Sets up keyboard shortcuts
         * @TODO 01/04/2010: Use something like js-hotkeys (http://code.google.com/p/js-hotkeys/)
         *                   to allow for more advanced keyboard navigation such as "cntl + z" to undo, etc
         * TODO 01/16/2009: Create buttons for mouse-coord and detail toggles
         * 
         * TODO 05/24/2010: To avoid direct links to different code, create hash of events
         * to trigger when a given key is pressed, e.g.:
         * 
         * {
         *     "c": "center-viewport",
         *     "m": "toggle-mouse-coordinates",
         *     etc..
         *  }
         */
        onKeyPress = function (e) {
            var key, character;
            
            // Letters use Event.which, while arrows, etc. use Event.keyCode
            if (e.keyCode) {
                key = e.keyCode;
            }
            else if (e.which) {
                key = e.which;
            }
            
            // Get character pressed (letters, etc)
            character = String.fromCharCode(key);

            // Arrow keys
            if (key === 37 || key === 38 || key === 39 || key === 40) {
                //Right-arrow
                if (key === 37) {
                    $(document).trigger('move-viewport', [8,0]);
                }
                    
                //Up-arrow
                else if (key === 38) {
                    $(document).trigger('move-viewport', [0,8]);
                }
                    
                //Left-arrow
                else if (key === 39) {
                    $(document).trigger('move-viewport', [-8,0]);
                }
                    
                //Down-arrow
                else if (key === 40) {
                    $(document).trigger('move-viewport', [0,-8]);
                }
                return false;
            }        

            else if (character === "c") {
                $("#center-button").click();
            }
            else if (character === "m") {
            	$(document).trigger('toggle-mouse-coords');
            }
            else if (character === "-" || character === "_") {
                $("#zoomControlZoomOut").click();
            }
            else if (character === "=" || character === "+") {
                $("#zoomControlZoomIn").click();
            }
            else if (character === "d") {
            	$(document).trigger('toggle-eventLayer-labels');
            }
            else if (character === "f") {
                $("#fullscreen-btn").click();
            }
            else if (character === ",") {
                $("#timeBackBtn").click();
            }
            else if (character === ".") {
                $("#timeForwardBtn").click();
            }
        };
        
        // Event-handlers
        $(document).keypress(function (e) {
            if (e.target.tagName !== "INPUT") {
                onKeyPress(e);
            }
        });     
    }
});

/**
 * @fileOverview
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, $, Class */
"use strict";
var KeyboardManager = Class.extend(
/** @lends KeyboardManager.prototype */
{
    /**
     * @constructs
     */
    init: function () {
        this._initEventHandlers();
        $(document).bind('re-enable-keyboard-shortcuts', $.proxy(this._initEventHandlers, this));
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
        var key, self = this;

        // Event-handlers
        $(document).keypress(function (e) {
            if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                key = self._getKeyCode(e);
                self.onKeyPress(key);
            }
        });

        // Webkit responds to arrow keys on keydown event
        if ($.browser.webkit) {
            $(document).keydown(function (e) {
                if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                    key = self._getKeyCode(e);

                    if (key === 37 || key === 38 || key === 39 || key === 40) {
                        self.onKeyPress(key);
                    }
                }
            });
        }

        // IE responds to arrow keys on keyup event
        if ($.browser.msie) {
            $(document).keyup(function (e) {
                if ((e.target.tagName !== "INPUT") && (e.target.tagName !== "TEXTAREA")) {
                    key = self._getKeyCode(e);

                    if (key === 37 || key === 38 || key === 39 || key === 40) {
                        self.onKeyPress(key);
                    }
                }
            });
        }

        $(document).keydown(function(e){
            if(e.which == 17){//ctrl
                self.ctrlPressed = true;
            }
        });

        $(document).keyup(function(){
            self.ctrlPressed = false;
        });

        this.ctrlPressed = false;
    },

    /**
     * Returns a normalized keycode for the given keypress/keydown event
     */
    _getKeyCode: function (e) {
        var key;

        // Letters use Event.which, while arrows, etc. use Event.keyCode
        if (e.keyCode) {
            key = e.keyCode;
        }
        else if (e.which) {
            key = e.which;
        }

        return key;
    },

    /**
     * @description Sets up keyboard shortcuts
     *
     * Because browsers assign different characters to the arrow keys,
     * the key code is used directly. In all other cases it is more reliable
     * to use the character code.
     *
     * @TODO 01/04/2010: Use something like js-hotkeys (http://code.google.com/p/js-hotkeys/)
     *                   to allow for more advanced keyboard navigation such as "cntl + z" to undo, etc
     */
    onKeyPress: function (key) {
        // Get character pressed (letters, etc)
        var character, keyMapping, charMapping, doc = $(document);

        // Arrow keys
        keyMapping = {
            '37': [-8, 0], // Right-arrow
            '38': [0, -8], // Up-arrow
            '39': [8, 0],  // Left-arrow
            '40': [0, 8]   // Down-arrow
        };

        if (typeof(keyMapping[key]) !== "undefined") {
            doc.trigger('move-viewport', keyMapping[key]);
            return false;
        }

        // All other keys
        charMapping = {
            'c': 'center-viewport',
            'd': 'toggle-event-labels',
            'm': 'toggle-mouse-coords',
            's': 'toggle-scale-window',
            '-': 'zoom-out',
            '_': 'zoom-out',
            '=': 'zoom-in',
            '+': 'zoom-in',
            'f': 'toggle-fullscreen',
            ',': 'timestep-backward',
            '<': 'timestep-backward',
            '.': 'timestep-forward',
            '>': 'timestep-forward'
        }

        character = String.fromCharCode(key);

        if (typeof(charMapping[character]) !== "undefined") {
            doc.trigger(charMapping[character]);
        }
    }
});

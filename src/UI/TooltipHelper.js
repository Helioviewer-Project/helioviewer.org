/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class acts as a simple wrapper around the qTip library and helps
 * to normalize behavior across the 1.0 and 1.1 series.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, loadCSS */
"use strict";

var TooltipHelper = Class.extend(
    /** @lends TooltipHelper.prototype */
    {
    /**
     * @description Creates a new TooltipHelper. 
     * @param {Boolean} Enable legacy support
     * @constructs 
     */ 
    init: function (legacyMode) {
        if ((typeof legacyMode === undefined) || !legacyMode) {
            this.legacyMode = false;
            loadCSS("lib/jquery.qtip-nightly/jquery.qtip.css");
            loadCSS("resources/css/tooltips.css");
        } else {
            this.legacyMode = true;
            loadCSS("resources/css/tooltips-LEGACY.css");
            this._setupTooltipStyles();
        }
        
        $(document).bind("create-tooltip", $.proxy(this.createTooltip, this));
    },
    
    /**
     * @description Creates a simple informative tooltip
     */    
    createTooltip: function (event, selector, direction) {
        if (direction === undefined) {
            direction = 'topLeft';
        }
        
        if (this.legacyMode) {
            this._createLegacyTooltip(selector, direction);
        }
        else {
            this._createTooltip(selector, direction);
        }
    },
    
    /**
     * @description Creates a more complex dialog used for EvenMarker meta information
     */
    createDialog: function (container, title, text) {
        if (this.legacyMode) {
            this._createLegacyDialog(container, title, text);
        }
        else {
            this._createDialog(container, title, text);
        }
    },
    
    /**
     * @description qTip 1.1x simple tooltips
     * @param {Object} selector
     * @param {Object} text
     */
    _createTooltip: function (selector, direction) {
        // use e.attr('title') to manually retrieve and set title text
    },
    
    /**
     * @description qTip 1.1x dialogs
     * @param {Object} container
     * @param {Object} title
     * @param {Object} text
     */
    _createDialog: function (container, title, text) {
        container.qtip({
            position: {
                container: container,
                corner: {
                    target: 'bottomRight',
                    tooltip: 'topLeft',
                    top: 10,
                    left: 8
                }
            },
            show: 'click',
            hide: 'click',                        
            content: {
                "title": {
                    "text": title,
                    "button": false
                },
                "text" : text
            },
            style: "qtip-helioviewer"
        });
    },
    
    /**
     * @description Create a legacy (qTip 1.0) tooltip
     * @param {Object} selector
     * @param {Object} text
     */
    _createLegacyTooltip: function (selector, direction) {
        var corner, tip;
        
        // Decide on orientation
        if (direction === "topLeft") {
            corner = {
                target: "bottomRight",
                tooltip: "topLeft" 
            };
            tip = "topLeft";
        }
        else {
            corner = {
                target: "bottomLeft",
                tooltip: "topRight" 
            };
            tip = "topRight";
        }

        // Apply settings and create tooltip
        $(selector).qtip({
            position: {
                adjust: {
                    x: 4,
                    y: 6
                },
                "corner": corner
            },
            style: {
                name: 'simple',
                "tip" : tip
            },
            hide: {
                effect: { length: 350 }
            },
            api: {
                onRender: function () { 
                    var self = this;
                    self.elements.target.click(function () {
                        self.hide();
                    }); 
                }
            }

        });
    },

    /**
     * @description Create a legacy (qTip 1.0) dialog
     * @param {Object} selector
     * @param {Object} text
     */
    _createLegacyDialog: function (container, title, text) {
        container.qtip({
            
            position: {
                "container": container,
                type: 'relative'
            },
            show: 'mousedown',
            hide: 'mousedown',
            content: {
                "title": {
                    "text": title,
                    "button": "x"
                },
                "text" : text
            },
            style: {name: "dialog"}
        });
    },
    
    /**
     * @description Sets up old-style qTip style methods
     */
    _setupTooltipStyles: function () {
        // Simple tooltips
        $.fn.qtip.styles.simple = {
            background: '#FFF',
            color: '#000',
            padding: 10, 
            textAlign: 'center',
            border: {
                width: 1,
                radius: 6,
                color: '#FFF'
            }            
        };
        
        // More advanced dialogs
        $.fn.qtip.styles.dialog = {
            textAlign: 'left',
            width: 250,
            padding: 8,
            button: {
                "color": "#FFF"
            },
            title: {
                "background-color": "#909A99"
            },
            tip: 'topLeft',
            border: {
                width: 1,
                radius: 6,
                color: '#6e6e6e'
            }
        };
    }
});

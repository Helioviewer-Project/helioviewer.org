/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Helps manage qtip tooltips and dialogs
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, loadCSS */
"use strict";
var TooltipHelper = Class.extend(
    /** @lends TooltipHelper.prototype */
    {
    /**
     * Creates a new TooltipHelper.
     * @constructs 
     */ 
    init: function (legacyMode) {
        $(document).bind("create-tooltip", $.proxy(this.createTooltip, this));
    },
    
    /**
     * @description Creates a simple informative tooltip
     */    
    createTooltip: function (event, selector, direction) {
        // use e.attr('title') to manually retrieve and set title text
        if (direction === undefined) {
            direction = 'topLeft';
        }
        
        $(selector).qtip();
    },
    
    /**
     * Creates a qTip-based dialog
     * 
     * @param {Object} container
     * @param {Object} title
     * @param {Object} text
     */
    createDialog: function (container, title, text) {
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
    }
});

/**
 * @description Abstract class that keeps track of previous media made and controls the display bar 
 *              and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, addIconHoverEventListener */
"use strict";
var MediaHistoryBar = Class.extend(
    /** @lends MediaHistoryBar.prototype */
    {
    /**
     * @constructs
     * @param id a unique id that identifies which container it belongs to,
     *           either "screenshot" or "movie".
     *           
     * @TODO This class is set up like it is in preparation to merge screenshot and movie history into 
     *       one bar. Currently they are separated into two bars and two instances of this class. 
     */    
    init: function (id, initialContent) {
        this.id = id;

        this.content   = initialContent;
        this.hasDialog = false;

        this.container = $("#qtip-" + this.id);
        this.button    = $("#" + this.id + "-button");
        
        if (this.content.length > 0) {
            this._setupDialog();
            this.hasDialog = true;
        }
    },
    
    /**
     * Adds the new item to history and re-makes the history dialog with the new item
     * included. 
     */
    addToHistory: function (content) {        
        this._cleanupTooltips();
        this.content = content;
        // It is necessary to completely recreate the tooltip because if you update the content only,
        // any selectors that depend on previous content will break and all movie information tooltips
        // would have to be re-created anyway. "Time ago" must also be re-calculated.
        this._setupDialog();
    },
    
    /**
     * Calls methods to get rid of divs left over from old dialogs
     */
    _cleanupTooltips: function () {
        if (this.hasDialog) {
            var api = this.container.qtip("api");
            if (api.elements && api.elements.tooltip) {
                api.elements.tooltip.remove();
            }
        } else {
            this.hasDialog = true;
        }
    },
    
    /**
     * Hides its dialog
     */
    hide: function () {
        this.container.qtip('hide');
    },
    
    /**
     * Adds divs for the new item including a text link and an empty, hidden div where the dialog
     * for playing the movie will be created. Adds the item to the front of the list so that the list
     * is in reverse chronological order.
     * 
     * @param item A Movie or Screenshot object
     */
    _createContentString: function () {
        this.content = this.history.createContentString();
        // Slice off the last "<br />" at the end.
        this.content = this.content.slice(0, -6);
    },
    
    /**
     * Completely empties its history and destroys all tooltips/dialogs 
     * associated with it.
     */
    clearHistory: function () {
        this._cleanupTooltips();
        this.hasDialog = false;
    },
    
    /**
     * Creates a dialog with the title "History" and a list of recently made media. 
     * When done, triggers the event "setup-information-tooltip", which should be 
     * received by Movie.js or Screenshot.js
     * 
     * The target field in show and hide points to either Movie-Button or Screenshot-Button,
     * so the dialog is shown or hidden when that button is clicked rather than when 
     * this.container is clicked. 
     */
    _setupDialog: function () {
        var self = this, titleContent, clearButton;
        titleContent = "<div style='line-height:1.6em'>" + 
                            this.id.slice(0, 1).toUpperCase() + this.id.slice(1) + " History" + 
                            "<div id='" + this.id + "-clear-history-button' class='text-btn' style='float:right;'>" +
                                "<span class='ui-icon ui-icon-trash' style='float:left;' />" +
                                "<span style='font-weight:normal'><i>Clear</i></span>" +
                            "</div>" + 
                        "</div>";
        
        this.container.qtip({
            position: {
                target: self.button,
                corner: {
                    target : 'bottomMiddle',
                    tooltip: 'topMiddle'
                },
                adjust: { y : 65 }
            },
            show   : {
                when  : {
                    event : 'click',
                    target: self.button
                }
            },
            hide   : {
                when  : {
                    event : 'click',
                    target: self.button
                }
            },                 
            content: {
                title : titleContent,
                text  : self.content
            },
            style  : "mediaDark",
            api    : {
                onRender: function () {
                    $(document).trigger('setup-' + self.id + '-history-tooltips');
                    
                    clearButton = $("#" + self.id + "-clear-history-button");
                    
                    clearButton.click(function () {
                        $(document).trigger('clear-' + self.id + '-history');
                        self.clearHistory();
                    });
                    
                    addIconHoverEventListener(clearButton);
                    
                    $("#social-buttons").click(function (e) {
                        var button = $(e.target);

                        if (button !== self.button && button.context.parentNode !== self.button[0]) {
                            self.hide();
                        } 
                    });
                },
                // Don't show unless hasDialog is true.
                beforeShow: function () {
                    return self.hasDialog;
                }
            }
        });
    }
});

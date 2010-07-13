/**
 * @description Abstract class that keeps track of previous media made and controls the display bar and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
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
    init: function (id, history) {
        this.id = id;
        this.history   = history;

        this.content   = "";
        this.hasDialog = false;
    },
    
    /**
     * Grabs divs that it needs to set up the qtip dialog and initializes the dialog if there is history.
     */
    setup: function () {
        this.container = $("#qtip-" + this.id);
        this.button    = $("#" + this.id + "-button");
        
        this._createContentString();
        if (this.content.length > 0 && !this.hasDialog) {
            this._setupDialog();
            this.hasDialog = true;
        }
    },
    
    /**
     * Adds the new item to history and re-makes the history dialog with the new item
     * included. 
     */
    addToHistory: function (item) {        
        this._cleanupTooltips();
        
        this.history.addToHistory(item);
        this._createContentString();
        // It is necessary to completely recreate the tooltip because if you update the content only,
        // any selectors that depend on previous content will break and all movie information tooltips
        // would have to be re-created anyway. "Time ago" must also be re-calculated.
        this._setupDialog();
    },
    
    _cleanupTooltips: function () {
        if (this.hasDialog) {
            this._removeTooltips(); 

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
        if (this.content.length > 0) {
            this.content += "<div id='" + this.id + "-clear-history-button' class='text-btn' style='float:right;'>" +
            		            "<span class='ui-icon ui-icon-trash' style='float:left;' />" +
                                "<span style='line-height: 1.6em'><i>Clear history</i></span>" +
            		        "</div>";
        }
    },
    
    _removeTooltips: function () {
        this.history.removeTooltips();
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
        titleContent = this.id.slice(0,1).toUpperCase() + this.id.slice(1) + " History" + 
                       "<div id='" + this.id + "-dialog-close' title='Close' class='ui-icon ui-icon-close'" +
                       		" style='float:right; cursor:pointer;'>&nbsp;</div>";
        
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
                    self.closed = false;
                    
                    self.history.setupTooltips();
                    
                    $("#" + self.id + "-dialog-close").click(function () {
                        self.container.qtip('hide');
                        self.closed = true;
                    });
                    
                    clearButton = $("#" + self.id + "-clear-history-button");
                    
                    clearButton.click(function () {
                        self._clearHistory();
                    });
                    
                    addIconHoverEventListener(clearButton);
                },
                
                beforeShow: function () {
                    if (self.closed) {
                        self.closed = false;
                        return false;
                    }
                }
            }
        });

        $("#social-buttons").click(function (e) {
            var button = $(e.target);

            if (button != self.button && button.context.parentNode != self.button[0]) {
                self.container.qtip("hide");
                self.closed = false;
            } 
        });
    },
    
    _clearHistory: function () {
        this._cleanupTooltips();
        this.closed    = false;
        this.hasDialog = false;
        this.history.clear();
    }
});

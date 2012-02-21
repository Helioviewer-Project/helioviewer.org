/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Handles the creation of a button which allows toggling between normal and fullscreen mode.
 * 
 *  TODO 03/15/2010:
 *  
 *  Instead of storing the original dimensions and then simply reverting to them later, a better
 *  approach might be to write methods to compute what those values should be for any given
 *  screen size. This way if a user switches to full screen mode, resizes the browser window, and then
 *  switches back to normal view-mode, the viewport will be optimized for the new window size.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, addIconHoverEventListener */
"use strict";
var FullscreenControl = Class.extend(
    /** @lends FullscreenControl.prototype */
    {
    /**
     * @description Creates a new FullscreenControl. 
     * @constructs 
     */ 
    init: function (btnId, speed) {
        this._fullscreenMode = false;

        // Sections to be resized or hidden
        this.body     = $('body');
        this.colmid   = $('#colmid');
        this.colright = $('#colright');
        this.col1pad  = $('#col1pad');
        this.col2     = $('#col2');
        this.viewport = $('#helioviewer-viewport-container-outer');
        this.shadow   = $('#helioviewer-viewport-container-shadow');
        this.sandbox  = $('#sandbox');
        this.header   = $('#header');
        this.meta     = $('#footer-container-outer');
        this.panels   = $("#col2, #col3, #header, #footer");
        
        // margin-size
        this.marginSize = 4;
        
        this._overrideAnimate();
        
        this._setupEventHandlers(btnId);
    },
    
    /**
     * Returns true if Helioviewer is currently in fullscreen mode
     */
    isEnabled: function () {
        return this._fullscreenMode;
    },
    
    /**
     * Enable fullscreen mode
     */
    enableFullscreenMode: function () {
        var self = this;
        
        // hide overflow and reduce min-width
        this.body.css({
            'overflow': 'hidden',
            'min-width': 450
        });
        
        this.meta.hide();

        // keep track of original dimensions
        this.origColMidLeft         = this.colmid.css("left");
        this.origColRightMarginLeft = this.colright.css("margin-left");
        this.origCol1PadMarginLeft  = this.col1pad.css("margin-left");
        this.origCol1PadMarginRight = this.col1pad.css("margin-right");
        this.origCol2Left           = this.col2.css("left");
        this.origCol2Width          = this.col2.width();
        this.origHeaderHeight       = this.header.height();
        this.origViewportHeight     = this.viewport.height();
        
        this.colmid.animate({
            left: 0
        }, this.speed,
        function () {
            $(document).trigger('update-viewport');
            self.shadow.css({
                "width": self.viewport.width(),
                "height": self.viewport.height(),
                "top": 4,
                "left": 4
            });
            self.panels.hide();
            self.body.removeClass('disable-fullscreen-mode');
        });
        
        this.colright.animate({
            "margin-left": 0
        }, this.speed);
        
        this.col1pad.animate({
            "margin-left" : 4,
            "margin-right": 4,
            "margin-top":   4
        }, this.speed);
        
        this.col2.animate({
            "left": -(parseInt(this.origCol2Left, 10) + this.origCol2Width)
        }, this.speed);
        
        this.header.animate({
            "height": 0
        }, this.speed);
           
        this.viewport.animate({
            height: $(window).height() - (this.marginSize * 3)
        }, this.speed);

        // Keep sandbox up to date
        this.sandbox.animate({
            right: 1 // Trash
        }, this.speed);   
    },
    
    /**
     * Disable fullscreen mode
     */
    disableFullscreenMode: function () {
        var offset, self = this;

        this.shadow.hide();
        this.panels.show();
                
        this.colmid.animate({ 
            left:  this.origColMidLeft
        }, this.speed,
        function () {
            self.meta.show();
            self.body.css({
                'overflow': 'visible',
            }).removeClass('disable-fullscreen-mode');
        });
        
        this.colright.animate({
            "margin-left": this.origColRightMarginLeft
        }, this.speed);
        
        this.col1pad.animate({
            "margin-left" : this.origCol1PadMarginLeft,
            "margin-right": this.origCol1PadMarginRight,
            "margin-top"  : 0
        }, this.speed);
        
        this.col2.animate({
            left: this.origCol2Left
        }, this.speed);
        
        this.header.animate({
            "height": this.origHeaderHeight
        }, this.speed);

        this.viewport.animate({
            height: this.origViewportHeight
        }, this.speed);
        this.sandbox.animate({
            right: 0
        }, this.speed, function () {
            offset = self.viewport.offset();
            self.shadow.css({
                "width": self.viewport.width(),
                "height": self.viewport.height(),
                "top": offset.top,
                "left": offset.left
            }).show();
        });
        
        this.body.animate({'min-width': 972}, this.speed);
    },
    
    /**
     * Sets up event handlers related to fullscreen control
     */
    _setupEventHandlers: function (btnId) {
        var btn = $(btnId).click($.proxy(this._onClick, this)),
            icon = btn.find(".ui-icon");

        addIconHoverEventListener(btn);
        
        $(document).bind('toggle-fullscreen', $.proxy(this._toggle, this));
    },
    
    /**
     * Toggles fullscreen mode on or off
     */
    _toggle: function () {
        if (this.body.hasClass('disable-fullscreen-mode')) {
            return;
        }
                        
        // toggle fullscreen class
        this._fullscreenMode = !this._fullscreenMode;
        
        // make sure action finishes before starting a new one
        this.body.addClass('disable-fullscreen-mode');
        
        if (this._fullscreenMode) {
            this.enableFullscreenMode();
            this.viewport.addClass("fullscreen-mode");
        } else {
            this.disableFullscreenMode();
            this.viewport.removeClass("fullscreen-mode");
        }
    },
    
    /**
     * Overides jQuery's animation method
     * 
     * http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
     */
    _overrideAnimate: function () {
        var doc               = $(document), 
            $_fx_step_default = $.fx.step._default;
        
        $.fx.step._default = function (fx) {
            if (fx.elem.id !== "sandbox") {
                return $_fx_step_default(fx);
            }
            doc.trigger('update-viewport');
            fx.elem.updated = true;
        };
    }
});

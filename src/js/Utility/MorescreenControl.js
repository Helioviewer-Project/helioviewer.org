/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a> 
 * @fileOverview Handles the creation of a button which allows toggling between normal and morescreen mode.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var MorescreenControl = Class.extend(
    /** @lends MorescreenControl.prototype */
    {
    /**
     * @description Creates a new MorescreenControl. 
     * @constructs 
     */ 
    init: function (btnId, speed) {
        
        // Create icon and apply title attribute
        this.btn      = $(btnId);
        this.btn.append('<span class="ui-icon ui-icon-arrowstop-1-e"></span>');
        this.btn.attr('title', 'Hide right sidebar.');
        this.icon     = $(btnId).find('span.ui-icon');
            
        // Sections to be resized or hidden
        this.body     = $('body');
        this.colmid   = $('#colmid');
        this.colright = $('#colright');
        this.col1pad  = $('#col1pad');
        this.col2     = $('#col2');
        this.col3     = $('#col3');
        this.viewport = $('#helioviewer-viewport-container-outer');
        this.shadow   = $('#helioviewer-viewport-container-shadow');
        this.sandbox  = $('#sandbox');
        this.header   = $('#header');
        this.footer   = $('#footer');
        this.meta     = $('#footer-container-outer');
        this.panels   = $("#col2, #header, #footer");
        
        // Layout assumptions
        this.sidebarWidth = 280;  // px
        this.marginSize   = 4;    // px
        
        // Positions when Morescreen mode is DISABLED
        //   (both sidebars on)
        this.disabled_col1padMarginLeft   = 2*(this.sidebarWidth + this.marginSize);
        this.disabled_colRightMarginLeft  = -this.disabled_col1padMarginLeft;
        this.disabled_col2Left = this.sidebarWidth + this.marginSize + 2;
        
        // Positions when Morescreen mode is ENABLED
        //   (left sidebar on, right sidebar off)
        this.enabled_col1padMarginLeft  =  2*(this.sidebarWidth + this.marginSize);
        this.enabled_col1padMarginRight = -this.sidebarWidth;
        this.enabled_col2Left           = this.sidebarWidth + this.marginSize + 2;
        this.enabled_colrightMarginLeft = -2*(this.sidebarWidth + this.marginSize);
        
        // Static positions (used to override any Fullscreen mode settings)
        this.static_colMidLeft   = this.sidebarWidth+this.marginSize;
        this.static_headerHeight = this.header.height();
        this.static_footerHeight = this.footer.height();
        
        this._overrideAnimate();
        
        this._setupEventHandlers();
    },
    
    /**
     * Returns true if Helioviewer is currently in morescreen mode
     */
    isEnabled: function () {
        if ( this.icon.hasClass('ui-icon-arrowstop-1-w') ) {
            return true;
        }
        return false;
    },
    
    /**
     * Enable morescreen mode
     */
    enableMorescreenMode: function (animated) {
        // hide overflow and reduce min-width
        this.body.css({
            'overflow' :'hidden',
            'min-width': 450
        });
        
        // Expand viewport
        if (animated) {
            this._expandAnimated();
        } else {
            this._expand();
        }
    },
    
    /**
     * Expand viewport and hide other UI componenets using an animated 
     * transition
     */
    _expandAnimated: function () {
        var self = this,
            fullScreenBtn;
        
        this.col3.hide();
        this.shadow.hide();
        
        this.colmid.animate({
            left : this.static_colMidLeft + 'px',
            right: 0
        }, this.speed,
        function () {
            var offset;
            $(document).trigger('update-viewport');
            self.col2.show();
            self.col2.animate({
                "left" : self.enabled_col2Left + 'px'
            });
            offset = self.viewport.offset();
            self.shadow.css({
                "width" : self.viewport.width(),
                "height": self.viewport.height(),
                "top"   : offset.top,
                "left"  : offset.left
            }).show();
            
            self.body.removeClass('disable-morescreen-mode');
        });
      
        this.col1pad.animate({
            "margin-left" : this.enabled_col1padMarginLeft  + "px",
            "margin-right": this.enabled_col1padMarginRight + "px"
        }, this.speed);
        
        this.colright.animate({
            "margin-left" : this.enabled_colrightMarginLeft + "px"
        }, this.speed);
        
        // Keep sandbox up to date
        this.sandbox.animate({
            "right": 0.1 // Trash
        }, this.speed);   
        
        this.icon.removeClass('ui-icon-arrowstop-1-e').addClass('ui-icon-arrowstop-1-w');
        this.btn.attr('title', 'Show right sidebar.');
        
        fullScreenBtn = $('#fullscreen-btn > span.ui-icon');
        if ( fullScreenBtn.length == 1 ) {
            $('#fullscreen-btn').attr('title','Enable fullscreen mode.');
        }
    },
    
    /**
     * Expand viewport and hide other UI components using an animated 
     * transition
     */
    _expand: function () {
        var offset,
            fullScreenBtn;
        
        this.col2.css({
            "left" : this.enabled_col2Left + 'px'
        });
        this.col2.show();
        this.col3.hide();
        this.shadow.hide();
    
        this.colmid.css({
            "left" : this.static_colMidLeft + 'px',
            "right": 0
        });        
        
        this.col1pad.css({
            "margin-left" : this.enabled_col1padMarginLeft  + "px",
            "margin-right": this.enabled_col1padMarginRight + "px"
        });
        
        this.colright.css({
            "margin-left" : this.enabled_colrightMarginLeft + "px"
        });
        
        this.sandbox.css({
            "right": 0.1 // Trash
        });
        
        $(document).trigger('update-viewport');
        offset = this.viewport.offset();
        this.shadow.css({
                "width" : this.viewport.width(),
                "height": this.viewport.height(),
                "top"   : offset.top,
                "left"  : offset.left
        }).show();
        
        this.body.removeClass('disable-morescreen-mode');
        
        this.icon.removeClass('ui-icon-arrowstop-1-e').addClass('ui-icon-arrowstop-1-w');
        this.btn.attr('title', 'Show right sidebar.');
        
        fullScreenBtn = $('#fullscreen-btn > span.ui-icon');
        if ( fullScreenBtn.length == 1 ) {
            $('#fullscreen-btn').attr('title','Enable fullscreen mode.');
        }
    },
    
    /**
     * Disable morescreen mode
     */
    disableMorescreenMode: function () {
        var offset, 
            self = this,
            viewportHeight = $(window).height() - this.static_headerHeight - this.static_footerHeight - 2,
            fullScreenBtn;
        
        this.shadow.hide();   
        this.colmid.animate({ 
            "left":  this.static_colMidLeft + 'px'
        }, this.speed,
        function () {
            self.panels.show();
            self.meta.show();
            self.col3.show();
            self.body.css({
                "overflow": "visible",
            }).removeClass('disable-morescreen-mode');
        });
        
        this.colright.animate({
            "margin-left" : this.disabled_colRightMarginLeft + 'px'
        }, this.speed);
        
        this.col1pad.animate({
            "margin-left" : this.disabled_col1padMarginLeft + 'px',
            "margin-right": 0,
            "margin-top"  : 0
        }, this.speed);
        
        this.col2.animate({
            "left": this.disabled_col2Left + 'px'
        }, this.speed);
        
        this.header.animate({
            "height": this.static_headerHeight + 'px'
        }, this.speed);
        
        this.viewport.animate({
            "height": viewportHeight
        }, this.speed);
        this.sandbox.animate({
            "right": 0
        }, this.speed, function () {
            offset = self.viewport.offset();
            self.shadow.css({
                "width" : self.viewport.width(),
                "height": self.viewport.height(),
                "top"   : offset.top,
                "left"  : offset.left
            }).show();
        });
        
        this.body.animate({
            "min-width": "972px"
        }, this.speed);
        
        this.icon.removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
        this.btn.attr('title', 'Hide right sidebar.');
        
        fullScreenBtn = $('#fullscreen-btn > span.ui-icon');
        if ( fullScreenBtn.length == 1 ) {
            $('#fullscreen-btn').attr('title','Enable fullscreen mode.');
        }
    },
    
    /**
     * Sets up event handlers related to morescreen control
     */
    _setupEventHandlers: function () {
        this.btn.click($.proxy(this._toggle, this));
        
        // Used by KeyboardManager:
        $(document).bind('toggle-morescreen', $.proxy(this._toggle, this));
    },
    
    /**
     * Toggles morescreen mode on or off
     */
    _toggle: function (animated) {
        
        if (this.body.hasClass('disable-morescreen-mode')) {
            return;
        }
        
        if (typeof(animated) == "undefined") {
            animated = true;
        }
        
        // make sure action finishes before starting a new one
        this.body.addClass('disable-morescreen-mode');
        
        if ( this.isEnabled() ) {
            this.disableMorescreenMode();
            this.viewport.removeClass("morescreen-mode");
        } else {
            this.enableMorescreenMode(animated);
            this.viewport.addClass("morescreen-mode");
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

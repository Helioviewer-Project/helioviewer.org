/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a> 
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Handles the creation of a button which allows toggling between normal and fullscreen mode.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var FullscreenControl = Class.extend(
    /** @lends FullscreenControl.prototype */
    {
    /**
     * @description Creates a new FullscreenControl. 
     * @constructs 
     */ 
    init: function (btnId, speed) {
        
        // Create icon and apply title attribute
        this.btn      = $(btnId);
        this.btn.append('<span class="ui-icon ui-icon-arrow-4-diag"></span>');
        this.btn.attr('title', 'Enable fullscreen mode.');
        this.icon     = $(btnId).find('span.ui-icon');
            
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
        this.footer   = $('#footer');
        this.meta     = $('#footer-container-outer');
        this.panels   = $('#col2, #col3, #header, #footer');
        
        // Layout assumptions
        this.sidebarWidth = 280;  // px
        this.marginSize   = 4;    // px
        
        // Positions when Morescreen mode is DISABLED
        //   (both sidebars on)
        this.disabled_col1padMarginLeft   =  2*(this.sidebarWidth + this.marginSize);
        this.disabled_col1padMarginRight  =  0;
        this.disabled_col1padMarginTop    =  0;
        this.disabled_colRightMarginLeft  = -2*(this.sidebarWidth + this.marginSize);
        this.disabled_col2Left   = this.sidebarWidth + this.marginSize + 2;
        this.disabled_colMidLeft = this.sidebarWidth + this.marginSize;
        
        // Positions when Morescreen mode is ENABLED
        //   (left sidebar on, right sidebar off)
        this.enabled_colMidLeft  = 0;
        this.enabled_colMidRight = 0;
        this.enabled_col2Left = -(this.sidebarWidth + this.marginSize + 2) - this.sidebarWidth;
        this.enabled_colrightMarginLeft = 0;
        
        // Static positions (used to override any Fullscreen mode settings)
        this.static_headerHeight = this.header.height();
        this.static_footerHeight = this.footer.height();
        
        this._overrideAnimate();
        
        this._setupEventHandlers();
    },
    
    /**
     * Returns true if Helioviewer is currently in fullscreen mode
     */
    isEnabled: function () {
        if ( $('#morescreen-btn > span.ui-icon').hasClass('ui-icon-arrowstop-1-w') ) { 
            this._fullscreenMode = false;
        }
        return this._fullscreenMode;
    },
    
    /**
     * Enable fullscreen mode
     */
    enableFullscreenMode: function (animated) {        
        // hide overflow and reduce min-width
        this.body.css({
            'overflow' :'hidden',
            'min-width': 450
        });
        
        this.meta.hide();
        
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
            moreScreenBtn;
        
        this.colmid.animate({
            left : this.enabled_colMidLeft  + 'px',
            right: this.enabled_colMidRight + 'px'
        }, this.speed,
        function () {
            $(document).trigger('update-viewport');
            self.shadow.css({
                'width' : self.viewport.width(),
                'height': self.viewport.height(),
                'top'   : self.marginSize,
                'left'  : self.marginSize
            });
            self.panels.hide();
            self.body.removeClass('disable-fullscreen-mode');
        });
        
        this.colright.animate({
            'margin-left': this.enabled_colrightMarginLeft + 'px'
        }, this.speed);
        
        this.col1pad.animate({
            'margin-left' : this.marginSize,
            'margin-right': this.marginSize,
            'margin-top'  : this.marginSize
        }, this.speed);
        
        this.col2.animate({
            'left': this.enabled_col2Left + 'px'
        }, this.speed);
        
        this.header.animate({
            'height': 0
        }, this.speed);
        
        this.viewport.animate({
            'height': $(window).height() - (3 * this.marginSize)
        }, this.speed);

        // Keep sandbox up to date
        this.sandbox.animate({
            'right': 0.1 // Trash
        }, this.speed);   
        
        this.btn.attr('title', 'Disable fullscreen mode.');
        
        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Show left sidebar.');
        }

    },
    
    /**
     * Expand viewport and hide other UI components using an animated 
     * transition
     */
    _expand: function () {
        var moreScreenBtn;
        
        this.colmid.css({
            'left' : this.enabled_colMidLeft  + 'px',
            'right': this.enabled_colMidRight + 'px'
        });        
        
        this.col1pad.css({
            'margin-left' : this.marginSize,
            'margin-right': this.marginSize,
            'margin-top'  : this.marginSize
        });
        
        this.col2.css({
            'left': this.enabled_col2Left + 'px'
        });
        
        this.header.height(0);
        this.viewport.css({
            'height': $(window).height() - (3 * this.marginSize)
        });
        
        this.sandbox.css({
            'right': 0.1 // Trash
        });
        
        $(document).trigger('update-viewport');
        this.shadow.css({
            'width' : this.viewport.width(),
            'height': this.viewport.height(),
            'top'   : this.marginSize,
            'left'  : this.marginSize
        });
        this.panels.hide();
        this.body.removeClass('disable-fullscreen-mode');
        
        this.btn.attr('title', 'Disable fullscreen mode.');
        
        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Show left sidebar.');
        }
    },
    
    /**
     * Disable fullscreen mode
     */
    disableFullscreenMode: function () {
        var offset, 
            self = this,
            viewportHeight = $(window).height() - this.static_headerHeight - this.static_footerHeight - 2,
            moreScreenBtn;
        
        this.shadow.hide();
        this.panels.show();
                
        this.colmid.animate({ 
            'left': this.disabled_colMidLeft + 'px'
        }, this.speed,
        function () {
            self.meta.show();
            self.body.css({
                'overflow': 'visible',
            }).removeClass('disable-fullscreen-mode');
        });
        
        this.colright.animate({
            'margin-left': this.disabled_colRightMarginLeft + 'px'
        }, this.speed);
        
        this.col1pad.animate({
            'margin-left' : this.disabled_col1padMarginLeft  + 'px',
            'margin-right': this.disabled_col1padMarginRight + 'px',
            'margin-top'  : this.disabled_col1padMarginTop   + 'px'
        }, this.speed);
        
        this.col2.animate({
            'left': this.disabled_col2Left + 'px'
        }, this.speed);
        
        this.header.animate({
            'height': this.static_headerHeight + 'px'
        }, this.speed);

        this.viewport.animate({
            'height': viewportHeight + 'px'
        }, this.speed);
        this.sandbox.animate({
            'right': 0
        }, this.speed, function () {
            offset = self.viewport.offset();
            self.shadow.css({
                'width' : self.viewport.width(),
                'height': self.viewport.height(),
                'top'   : offset.top,
                'left'  : offset.left
            }).show();
        });
        
        this.body.animate({
            'min-width': '972px'
        }, this.speed);
        
        this.btn.attr('title', 'Enable fullscreen mode.');
        
        moreScreenBtn = $('#morescreen-btn > span.ui-icon');
        if ( moreScreenBtn.length == 1 ) {
            $('#morescreen-btn > span.ui-icon').removeClass('ui-icon-arrowstop-1-w').addClass('ui-icon-arrowstop-1-e');
            $('#morescreen-btn').attr('title','Hide right sidebar.');
        }
    },
    
    /**
     * Sets up event handlers related to fullscreen control
     */
    _setupEventHandlers: function () {
        this.btn.click($.proxy(this._toggle, this));
        
        // Used by KeyboardManager:
        $(document).bind('toggle-fullscreen', $.proxy(this._toggle, this));
    },
    
    /**
     * Toggles fullscreen mode on or off
     */
    _toggle: function (animated) {
        
        if (this.body.hasClass('disable-fullscreen-mode')) {
            return;
        }
        
        if ( typeof(animated) == 'undefined' ) {
            animated = true;
        }
        
        // make sure action finishes before starting a new one
        this.body.addClass('disable-fullscreen-mode');
        
        if ( this.isEnabled() ) {
            this.disableFullscreenMode();
            this.viewport.removeClass('fullscreen-mode');
        }
        else {
            this.enableFullscreenMode(animated);
            this.viewport.addClass('fullscreen-mode');
        }
        
        // toggle fullscreen class
        this._fullscreenMode = !this._fullscreenMode;
        
        // Update viewport shadow
        $(document).trigger('viewport-resized');
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
            if ( fx.elem.id !== 'sandbox' ) {
                return $_fx_step_default(fx);
            }
            doc.trigger('update-viewport');
            fx.elem.updated = true;
        };
    }
});

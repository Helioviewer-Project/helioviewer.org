/**
 * @fileOverview Contains the class definition for an ImageScale class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var ImageScale = Class.extend(
    /** @lends ImageScale.prototype */
    {
    /**
     * @constructs
     *
     * Creates a new ImageScale
     */
    init: function () {

        // Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
        this._rsunInArcseconds       = 959.705;

        this._earthSunRadiusFraction = 6367.5 / 695500.;  // km

        this._initScale();

        // Position and display ImageScale UI widget
        this.display();
    },


    _initScale: function() {
        var earthURL = 'resources/images/earth.png';

        if ( $('#earth-container').length > 0 ) {
           $('#earth-container').remove();
        }

        this._earthDiameterInPixels();

        this.scale_container = $('<div id="earth-container"></div>').appendTo("#helioviewer-viewport");
        this.scale_container.draggable();
        this.scale_container.css({
            'position'    : 'absolute',
            'bottom'      : '0',
            'z-index'     : '999',
            'width'       : '73px',
            'height'      : '56px',
            'background-color':'rgba(17,17,17,0.5)',
            'border-top'  : '1px solid #333',
            'border-right': '1px solid #333',
            'box-shadow'  : '0px 0px 5px black',
            'cursor'      : 'move',
            'display'     : 'none'
        });
        this.scale_container.attr('title','Click and drag to re-position scale indicator.');

        $('<div style="position:relative; height:12px;"><div id="earthLabel" style="color: white; background-color: #333; text-align: center; font-size: 10px; padding: 2px 0 2px 2px;">Earth Scale</div></div>').appendTo("#earth-container");

        $('<div style="position:relative; width:72px; height:45px;"><img id="earthScale" src="resources/images/earth.png" style="width: '+this.earthDiameterInPixels+'px;height: '+this.earthDiameterInPixels+'px; position: absolute; left: '+(36-(this.earthDiameterInPixels/2))+'px; top: '+(23-(this.earthDiameterInPixels/2))+'px;" /></div>').appendTo("#earth-container");

        this.scale_button    = $(document).find('#earth-button');
        this.scale_image     = this.scale_container.find('#earthScale');
        this.scale_label     = this.scale_container.find('#earthLabel');

        $(document).bind("earth-scale",   $.proxy(this.earthRescale, this));

        this.scale_container.bind("mousedown", function () { return false; });
        this.scale_container.bind('dblclick',  function () { return false; });
        this.scale_container.bind('click',     function () { return false; });

        this.scale_container.bind('drag',     $.proxy(this.scaleContainerDrag, this));
        this.scale_container.bind('dragstop', $.proxy(this.scaleContainerDragStop, this));

        this.scale_button.bind('click', $.proxy(this.earthMinimize, this));
    },

    earthRescale: function() {
        // Grab new imageScale and recompute Earth scale pixel size
        this._earthDiameterInPixels();

        this.scale_image.css({
            'width' : this.earthDiameterInPixels+'px',
            'height': this.earthDiameterInPixels+'px',
            'position' : 'absolute',
            'left': (36-(this.earthDiameterInPixels/2))+'px',
            'top' : (23-(this.earthDiameterInPixels/2))+'px'
        });

        // Update X,Y position of scale container (in arcseconds)
        this.scaleContainerDragStop();
    },

    earthMinimize: function(event) {
        Helioviewer.userSettings.set("state.scale", false);
        Helioviewer.userSettings.set("state.scaleType", 'earth');
        Helioviewer.userSettings.set("state.scaleX", 0);
        Helioviewer.userSettings.set("state.scaleY", 0);
        this.scale_container.draggable({disabled:true});
        this.scale_image.hide();
        this.scale_label.hide();
        this.scale_button.attr('title','Show Scale Indicator');
        this.scale_container.css({
            'width'         : '10px',
            'height'        : '10px',
            'border'        : '1px solid #888',
            'border-left'   : '0',
            'border-bottom' : '0'
        });
        this.scale_container.css({
            'position'      : 'absolute',
            'top'           : 'auto',
            'bottom'        : '0px',
            'left'          : '0px'
        });
        this.scale_button.removeClass('minimize').addClass('maximize');
        this.scale_button.removeClass('ui-icon-arrow-1-sw').addClass('ui-icon-arrow-1-ne');
        this.scale_button.css({'margin':'-3px -3px 0 0'});
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMaximize,  this));
    },

    earthMaximize: function() {
        Helioviewer.userSettings.set("state.scale", true);
        Helioviewer.userSettings.set("state.scaleType", 'earth');
        Helioviewer.userSettings.set("state.scaleX", 0);
        Helioviewer.userSettings.set("state.scaleY", 0);
        this.scale_container.draggable({disabled:false});
        this.scale_image.show();
        this.scale_label.show();
        this.scale_button.attr('title','Hide Scale Indicator');
        this.scale_container.css({
            'position'      : 'absolute',
            'top'           : 'auto',
            'bottom'        : '0px',
            'left'          : '0px',
            'width'         : '73px',
            'height'        : '56px',
            'border'        : '1px solid #333',
            'border-left'   : '0',
            'border-bottom' : '0'
        });
        this.scale_button.removeClass('maximize').addClass('minimize');
        this.scale_button.removeClass('ui-icon-arrow-1-ne').addClass('ui-icon-arrow-1-sw');
        this.scale_button.css({'margin':'0'});
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMinimize,  this));
    },

    scaleContainerDrag: function() {
        this.scale_container.css({
            'border'        : '1px solid #888'
        });
    },

    scaleContainerDragTo: function(containerX, containerY) {
        this.scale_container.css({
            'position' : 'absolute',
            'top'      : containerY+'px',
            'left'     : containerX+'px',
            'border'   : '1px solid #888'
        });
    },

    scaleContainerDragStop: function(event) {
        var coords;

        coords = new HelioviewerMouseCoordinates(Helioviewer.userSettings.get("state.imageScale"), 959.705, false);
        coords = coords.computeMouseCoords(this.scale_container.offset().left, this.scale_container.offset().top)

        // Snap back to docked position if dragged outside of Viewport bounds
        if ( this.scale_container.position().left <= 0 ||
             this.scale_container.position().left+this.scale_container.width() >= this.scale_container.parent().width()  ||
             this.scale_container.position().top+this.scale_container.height() >= this.scale_container.parent().height() ||
             this.scale_container.position().top  <= 0 ) {

            this.earthMaximize();
        }
        else {
            Helioviewer.userSettings.set("state.scale",     true);
            Helioviewer.userSettings.set("state.scaleType",'earth');
            Helioviewer.userSettings.set("state.scaleX",    coords.x);
            Helioviewer.userSettings.set("state.scaleY",    coords.y);
            Helioviewer.userSettings.set("state.containerX",this.scale_container.position().left);
            Helioviewer.userSettings.set("state.containerY",this.scale_container.position().top);
        }
    },


    _earthDiameterInPixels: function() {
        this.imageScale  = Helioviewer.userSettings.get("state.imageScale");
        this.earthDiameterInPixels = Math.round(2 * this._earthSunRadiusFraction * (this._rsunInArcseconds / this.imageScale));
    },

    _getScaleSettings: function() {
        this.scale      = Helioviewer.userSettings.get("state.scale");
        this.scaleType  = Helioviewer.userSettings.get("state.scaleType");
        this.scaleX     = Helioviewer.userSettings.get("state.scaleX");
        this.scaleY     = Helioviewer.userSettings.get("state.scaleY");
        this.containerX = Helioviewer.userSettings.get("state.containerX");
        this.containerY = Helioviewer.userSettings.get("state.containerY");
    },

    display: function() {
        this._getScaleSettings();

        if ( this.scale === false ) {
            this.earthMinimize();
        }
        else {

            if ( this.scaleX == 0 || this.scaleY == 0 ) {
                this.earthMaximize();
            }
            else {
                this.scaleContainerDragTo(this.containerX, this.containerY);
            }
        }

        $(this.scale_container).css({
            'display'  :'block'
        });
    }
});

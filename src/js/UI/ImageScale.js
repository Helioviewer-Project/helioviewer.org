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
            'z-index'     : '999',
            'width'       : '73px',
            'height'      : '56px',
            'background-color':'rgba(17,17,17,0.5)',
            'border'      : '1px solid #888',
            'box-shadow'  : '0px 0px 5px black',
            'cursor'      : 'move'
        });
        this.scale_container.attr('title','Click and drag to re-position scale indicator.');

        $('<div style="position:relative; height:12px;"><div id="earthLabel" style="color: white; background-color: #333; text-align: center; font-size: 10px; padding: 2px 0 2px 2px;">Earth Scale</div></div>').appendTo("#earth-container");
        $('<div style="position:relative; width:72px; height:45px;"><img id="earthScale" src="resources/images/earth.png" style="width: '+this.earthDiameterInPixels+'px; height: '+this.earthDiameterInPixels+'px; position: absolute; left: '+(36-(this.earthDiameterInPixels/2))+'px; top: '+(23-(this.earthDiameterInPixels/2))+'px;" /></div>').appendTo("#earth-container");

        this.scale_button    = $(document).find('#earth-button');
        this.scale_image     = this.scale_container.find('#earthScale');
        this.scale_label     = this.scale_container.find('#earthLabel');

        $(document).bind("earth-scale",   $.proxy(this.earthRescale, this));

        this.scale_container.bind("mousedown", function () { return false; });
        this.scale_container.bind('dblclick',  function () { return false; });
        this.scale_container.bind('click',     function () { return false; });

        this.scale_container.bind('dragstop', $.proxy(this.scaleContainerDragStop, this));

        this.scale_button.bind('click', $.proxy(this.earthMinimize, this));

        this.display();
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
        this.scale_button.attr('title','Show Earth-Scale Indicator');
        this.scale_container.hide();
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMaximize,  this));
        this.scale_button.toggleClass('active', false);
    },

    earthMaximize: function() {
        var scaleXY;

        scaleXY = this.resetIfOutsideViewportBounds();

        Helioviewer.userSettings.set("state.scale", true);
        Helioviewer.userSettings.set("state.scaleType", 'earth');
        Helioviewer.userSettings.set("state.scaleX", scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY", scaleXY.y);
        this.scale_button.attr('title','Hide Earth-Scale Indicator');
        this.scale_container.show();
        this.scale_button.unbind();
        this.scale_button.bind('click',  $.proxy(this.earthMinimize,  this));
        this.scale_button.toggleClass('active', true);
    },

    scaleContainerDragTo: function(containerX, containerY) {
        this.scale_container.css({
            'position' : 'absolute',
            'top'      : containerY+'px',
            'left'     : containerX+'px'
        });
        this.scaleContainerDragStop();
    },

    scaleContainerDragStop: function(event) {
        var scaleXY;

        scaleXY = this.resetIfOutsideViewportBounds();

        Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);
        Helioviewer.userSettings.set("state.containerX",this.scale_container.position().left);
        Helioviewer.userSettings.set("state.containerY",this.scale_container.position().top);
    },

    resetIfOutsideViewportBounds: function(event) {
        var scaleXY, coords;

        coords = new HelioviewerMouseCoordinates(Helioviewer.userSettings.get("state.imageScale"), 959.705, false);

        // Snap back to default position if dragged outside of Viewport bounds
        if ( Helioviewer.userSettings.get("state.containerX") <= 0 ||
             Helioviewer.userSettings.get("state.containerX") >= this.scale_container.parent().width()-this.scale_container.width() ||
             Helioviewer.userSettings.get("state.containerY") <= $('#hv-header').height() ||
             Helioviewer.userSettings.get("state.containerY") >= this.scale_container.parent().height()-this.scale_container.height()
            ) {

            this.containerX = $('#earth-button').position().left + $('#scale').position().left - this.scale_container.width()/2;
            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.scale_container.height();

            this.scale_container.css({
                'position' : 'absolute',
                'top'      : this.containerY+'px',
                'left'     : this.containerX+'px'
            });
        }

        scaleXY = coords.computeMouseCoords(
            Helioviewer.userSettings.get("state.containerX"),
            Helioviewer.userSettings.get("state.containerY")
        );

        Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);

        return scaleXY;
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

        if ( Helioviewer.userSettings.get("state.scaleX") == 0 ||
             Helioviewer.userSettings.get("state.scaleY") == 0 ) {

            this.containerX = $('#earth-button').position().left + $('#scale').position().left - this.scale_container.width()/2;
            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.scale_container.height();
            this.scale = false;
        }

        this.scaleContainerDragTo(this.containerX, this.containerY);

        if ( this.scale === false ) {
            this.earthMinimize();
        }
        else {
            this.earthMaximize();
        }
    }
});

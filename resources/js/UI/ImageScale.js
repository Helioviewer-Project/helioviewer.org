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

		this.buttonEarth     	= $('#earth-button');
        this.buttonScaleBar 	= $('#scalebar-button');
        //this.container 			= $('#earth-container');

        this._initScale();
		this._initEventHandlers();
    },

    _initEventHandlers: function () {

        $(document).bind('toggle-scale-window', $.proxy(this.toggleScale, this));
        $(document).bind('hide-scale-window', $.proxy(this.hideScale, this));
        $(document).bind('scalebar-scale-window', $.proxy(this.barScale, this));
        $(document).bind('earch-scale-window', $.proxy(this.earthScale, this));
    },

    _initScale: function() {

        if ( $('#earth-container').length > 0 ) {
           $('#earth-container').remove();
        }

        this._earthDiameterInPixels();
        this._scaleBarSizeInKM();

        this.container = $('<div id="earth-container"></div>').appendTo("#helioviewer-viewport");
        this.container.draggable();
        this.container.css({
            'position'    : 'absolute',
            'z-index'     : '999',
            'width'       : '95px',
            'height'      : '65px',
            'background-color':'rgba(17,17,17,0.5)',
            'border'      : '1px solid #888',
            'box-shadow'  : '0px 0px 5px black',
            'cursor'      : 'move'
        });
        this.container.attr('title','Click and drag to re-position scale indicator.');

        $('<div style="position:relative; height:12px;"><div id="earthLabel" style="color: white; background-color: #333; text-align: center; font-size: 10px; padding: 2px 0 2px 2px;">Earth Scale</div></div>').appendTo("#earth-container");
        $('<div style="position:relative; text-align: center; width:95px; height:65px;"><div id="barScaleBlock"><p id="barScaleLabel" style="padding:0px 10px;text-align:center;font-size:8px;margin:13px 0px 5px;">'+this.scaleBarSizeInKM+' km</p><div id="js-bar-scale" style="display:block;clear:both;margin:0px auto;height:4px;border:2px solid #fcfcfc;border-top:none;width:50px"></div></div><div style="width: 100%, height: 100%; line-height: 50px"><img id="earthScale" src="resources/images/earth.png" style="width: '+this.earthDiameterInPixels+'px; height: '+this.earthDiameterInPixels+'px; vertical-align: middle;" alt="Earth scale image" /></div></div>').appendTo("#earth-container");

        this.scale_button    = $(document).find('#earth-button');
        this.scale_image     = this.container.find('#earthScale');
        this.scale_label     = this.container.find('#earthLabel');

        $(document).bind("earth-scale",   $.proxy(this.earthRescale, this));

        this.container.bind("mousedown", function () { return false; });
        this.container.bind('dblclick',  function () { return false; });
        this.container.bind('click',     function () { return false; });

        this.container.bind('dragstop', $.proxy(this.scaleContainerDragStop, this));

        this.display();
    },

    /**
     * @description
     */
    hideScale: function () {
        this.container.hide();

    	Helioviewer.userSettings.set("state.scale", false);
		Helioviewer.userSettings.set("state.scaleType", 'disabled');

		this.buttonScaleBar.attr('title','Show Length scale Indicator');
		this.buttonEarth.attr('title','Show Earth-Scale Indicator');

        this.buttonEarth.removeClass("active");
        this.buttonScaleBar.removeClass("active");
    },

    /**
     * @description
     */
    earthScale: function () {
		var scaleXY = this.resetIfOutsideViewportBounds();

        this.mouseCoords = "earth";
        this.container.show();

    	Helioviewer.userSettings.set("state.scale", true);
		Helioviewer.userSettings.set("state.scaleType", 'earth');
        Helioviewer.userSettings.set("state.scaleX", scaleXY.x);
		Helioviewer.userSettings.set("state.scaleY", scaleXY.y);

		this.buttonScaleBar.attr('title','Show Length scale Indicator');
		this.buttonEarth.attr('title','Hide Earth-Scale Indicator');

        $('#earthLabel').html('Earth Scale');
        $('#earthScale').show();
        $('#barScaleBlock').hide();
        this.buttonScaleBar.removeClass("active");
        this.buttonEarth.addClass("active");
        this.buttonScaleBar.removeClass("active");


        this._getScaleSettings();
    },

    /**
     * @description
     */
    barScale: function () {
		var scaleXY = this.resetIfOutsideViewportBounds();

        this.mouseCoords = "scalebar";
        this.container.show();

    	Helioviewer.userSettings.set("state.scale", true);
		Helioviewer.userSettings.set("state.scaleType", 'scalebar');
        Helioviewer.userSettings.set("state.scaleX", scaleXY.x);
		Helioviewer.userSettings.set("state.scaleY", scaleXY.y);

		this.buttonScaleBar.attr('title','Hide Length scale Indicator');
		this.buttonEarth.attr('title','Show Earth-Scale Indicator');

        $('#earthLabel').html('Bar Scale');
        $('#barScaleBlock').show();
        $('#earthScale').hide();
        this.buttonScaleBar.addClass("active");
        this.buttonEarth.removeClass("active");


        this._getScaleSettings();
    },

    updateImageScale: function (imageScale) {
        this.imageScale = imageScale;
        if ( this.scaleType == "earth" ) {
            this.earthScale();
        }
        else if ( this.scaleType == "scalebar" ) {
            this.barScale();
        }
    },

	/**
     * @description Toggles scale visibility
     */
    toggleScale: function () {
        // Case 1: Disabled -> Earth
        if (this.scaleType === "disabled") {
            this.earthScale();
        }

        // Case 2: Earth -> Bar
        else if (this.scaleType === "earth") {
            this.barScale();
        }

        // Case 3: Bar -> Disabled
        else if (this.mouseCoords === "scalebar") {
            this.container.hide();
            this.scaleType = "disabled";
            this.buttonEarth.removeClass("active");
            this.buttonScaleBar.removeClass("active");
        }
    },

    earthRescale: function() {
        // Grab new imageScale and recompute Earth scale pixel size
        this._earthDiameterInPixels();
        this._scaleBarSizeInKM();

        this.scale_image.css({
            'width' : this.earthDiameterInPixels+'px',
            'height': this.earthDiameterInPixels+'px',
        });

		$('#barScaleLabel').html( this.scaleBarSizeInKM + ' km');

        // Update X,Y position of scale container (in arcseconds)
        this.scaleContainerDragStop();
    },

    scaleContainerDragTo: function(containerX, containerY) {
        this.container.css({
            'position' : 'absolute',
            'top'      : containerY+'px',
            'left'     : containerX+'px'
        });
        this.scaleContainerDragStop();
    },

    scaleContainerDragStop: function(event) {
        var scaleXY;

        Helioviewer.userSettings.set("state.containerX",this.container.position().left);
        Helioviewer.userSettings.set("state.containerY",this.container.position().top);

        scaleXY = this.resetIfOutsideViewportBounds();

        //Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);
        this._getScaleSettings();
    },

    resetIfOutsideViewportBounds: function(event) {
        var scaleXY, coords;

        coords = new HelioviewerMouseCoordinates(Helioviewer.userSettings.get("state.imageScale"), 959.705, false);
        // regular helioviewer
        if(outputType!='minimal'){
        // Snap back to default position if dragged outside of Viewport bounds
        if ( Helioviewer.userSettings.get("state.containerX") <= 0 ||
             Helioviewer.userSettings.get("state.containerX") >= this.container.parent().width()-this.container.width() ||
             Helioviewer.userSettings.get("state.containerY") <= ( $('#hv-header').height() || 0 ) ||
             Helioviewer.userSettings.get("state.containerY") >= this.container.parent().height()-this.container.height()
            ) {
                this.containerX = this.container.parent().width()*0.66 - this.container.width()/2; //center the earth container
	            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.container.height();
                this.container.css({
                    'position' : 'absolute',
                    'top'      : this.containerY+'px',
                    'left'     : this.containerX+'px'
                });
            }
        }else{// minimal helioviewer
            var dm = $('#date-manager-container');
            var dmOffset = 15;
            if( (Helioviewer.userSettings.get("state.containerX") <= 0 ||
                Helioviewer.userSettings.get("state.containerX") >= this.container.parent().width()-this.container.width() ||
                Helioviewer.userSettings.get("state.containerY") <= ( $('#hv-header').height() || 0 ) ||
                Helioviewer.userSettings.get("state.containerY") >= this.container.parent().height()-this.container.height()
                ) ||
                (Helioviewer.userSettings.get("state.containerX") <= dm.outerWidth(true)+dmOffset &&
                 Helioviewer.userSettings.get("state.containerY") <= dm.outerHeight(true)+dmOffset )
                ) {
                var sc = $('#scale');
                this.containerX = sc.position().left + (sc.outerWidth()/2) - this.container.width()/2; //center the earth container
	            this.containerY = sc.position().top - this.container.height() - 3;
		        //this.containerX = this.container.parent().width() - 150;
                //this.containerY = this.container.parent().height() - 100;
                this.container.css({
                    'position' : 'absolute',
                    'top'      : this.containerY+'px',
                    'left'     : this.containerX+'px'
                });
           }


        }



        scaleXY = coords.computeMouseCoords(
            Helioviewer.userSettings.get("state.containerX"),
            Helioviewer.userSettings.get("state.containerY")
        );

        //Helioviewer.userSettings.set("state.scaleType",'earth');
        Helioviewer.userSettings.set("state.scaleX",    scaleXY.x);
        Helioviewer.userSettings.set("state.scaleY",    scaleXY.y);

        this._getScaleSettings();

        return scaleXY;
    },

	_scaleBarSizeInKM: function(){
		this.imageScale  = Helioviewer.userSettings.get("state.imageScale");

		var earthInPixels = 2 * this._earthSunRadiusFraction * (this._rsunInArcseconds / this.imageScale);

		var sizeInKM = Math.round((50 * (2 * 6367.5)) / earthInPixels);
		var sizeInKMRounded = Math.round(sizeInKM/1000)*1000;

		this.scaleBarSizeInKM = sizeInKMRounded.toLocaleString();
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

        if ( parseInt(Helioviewer.userSettings.get("state.scaleX")) == 0 ||
             parseInt(Helioviewer.userSettings.get("state.scaleY")) == 0 ) {


            if (outputType != 'minimal'){

	            this.containerX = this.container.parent().width()*0.66 - this.container.width()/2; //center the earth container
	            this.containerY = $('#earth-button').position().top + $('#scale').position().top + this.container.height();
	            this.scale = false;

	        }else{
                var sc = $('#scale');
                this.containerX = sc.position().left + (sc.outerWidth()/2) - this.container.width()/2; //center the earth container
	            this.containerY = sc.position().top - this.container.height() - 3;
		        //this.containerX = this.container.parent().width() - 150;
		        //this.containerY = this.container.parent().height() - 100;
		        this.scale = true;
	        }
        }

        this.scaleContainerDragTo(this.containerX, this.containerY);

        if ( this.scaleType === 'earth' ) {
            this.earthScale();
        } else if( this.scaleType === 'scalebar' ) {
            this.barScale();
        } else {
            this.hideScale();
        }
    }
});

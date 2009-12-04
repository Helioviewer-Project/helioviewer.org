/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Class, $, Calendar, EventLayerAccordion, EventLayerManager, EventTimeline, LayerManager, ImageSelectTool, MediaSettings, MovieBuilder, 
 TileLayerManager, MessageConsole, Shadowbox, TileLayer, TileLayerAccordion, TimeControls, UserSettings, ZoomControls, Viewport, ScreenshotBuilder, 
 document, window, localStorage, extendLocalStorage, getUTCTimestamp, Time */
"use strict";
var Helioviewer = Class.extend(
    /** @lends Helioviewer.prototype */
    {
    /**
     * @constructs
     * @description Creates a new Helioviewer instance.
     * @param {Object} options Custom application settings.
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *        <b>defaultZoomLevel</b>    - The initial zoom-level to display.<br>
     *        <b>defaultPrefetchSize</b> - The radius outside of the visible viewport to prefetch.<br>
     *        <b>timeIncrementSecs</b>    - The default amount of time to move when the time navigation arrows are pressed.<br>
     *        <b>minZoomLevel</b>        - Minimum zoom level allowed.<br>
     *        <b>maxZoomLevel</b>        - Maximum zoom level allowed.<br>
     *        <b>api</b>              - Primary API for querying image and event information.
     * </div>
     * @see Helioviewer#defaultOptions for a list of the available parameters.
     */
    init: function (viewportId, api, view, defaults) {
        $.extend(this, defaults);
        this.load        = view;
        this.api         = api;
        this.viewportId  = viewportId;

        // Determine browser support
        this._checkBrowser();

        // Load user-settings
        this.loadUserSettings();
        
        // Loading indicator
        this._initLoadingIndicator();
        
        // Get available data sources
        this._getDataSources();

        // Layer Managers
        this.tileLayers  = new TileLayerManager(this);
        this.eventLayers = new EventLayerManager(this);
        
        this._initViewport();
        this._initUI();
        this._initEvents();

        this.mediaSettings          = new MediaSettings(this);                
        this.movieBuilder          = new MovieBuilder(this);
        this.imageSelectTool     = new ImageSelectTool(this);
        this.screenshotBuilder     = new ScreenshotBuilder(this);
    },
    
    /**
     * @description Returns the current observation date as a JavaScript Date object
     */
    getDate: function () {
        return this.date.getDate();  
    },

    /**
     * @description Initialize Helioviewer's user interface (UI) components
     */
    _initUI: function () {
        var mouseCoords;

        // Observation date & controls
        this.date = new Time(this);
        
        //Tooltips
        this._initToolTips();

        //Zoom-controls
        this.zoomControls = new ZoomControls(this, {
            id: '#zoomControls',
            zoomLevel:    this.userSettings.get('zoomLevel'),
            minZoomLevel: this.minZoomLevel,
            maxZoomLevel: this.maxZoomLevel
        });

        //Time-navigation controls
        this.timeControls = new TimeControls(this, this.timeIncrementSecs, '#date', '#time', '#timestep-select', '#timeBackBtn', '#timeForwardBtn');

        //Message console
        this.messageConsole = new MessageConsole(this);

        //Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
        this.tileLayerAccordion  = new TileLayerAccordion(this, '#tileLayerAccordion');
        this.eventLayerAccordion = new EventLayerAccordion(this, '#eventAccordion');

        //Fullscreen button
        this._createFullscreenBtn();
            
        //Mouse coordinates
        mouseCoords = $('<div id="mouse-coords" style="display: none;"></div>').appendTo(this.viewport.innerNode);
        mouseCoords.append('<div id="mouse-coords-x" style="width: 50%; float: left;"></div>');
        mouseCoords.append('<div id="mouse-coords-y" style="width: 50%; float: left;"></div>');

        // Setup dialog event listeners
        this._setupDialogs();
        
        // Tooltips
        $("#fullscreen-btn, #timeBackBtn, #timeForwardBtn, #center-button").qtip({
            style: {
                name: 'helioviewer'
            }
        });
        
        //Movie builder
        //this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});

        // Timeline
        //this.timeline = new EventTimeline(this, "timeline");
    },
    
    /**
     * @description Checks browser support for various features used in Helioviewer
     * TODO: Check for IE: localStorage exists in IE8, but works differently
     */
    _checkBrowser: function () {
        // Native JSON (2009/07/02: Temporarily disabled: see notes in UserSettings.js)
        //$.support.nativeJSON = (typeof(JSON) !== "undefined") ? true: false;
        $.support.nativeJSON = false;
        
        // Web storage (local)
        $.support.localStorage = !!window.localStorage;
        
        // (2009/07/02) Temporarily disabled on IE (works differently)
        if ($.browser.msie) {
            $.support.localStorage = false;
        }
        
        // CSS3 text-shadows
        // (2009/07/16 Temporarily disabled while re-arranging social buttons & meta links)
        //$.support.textShadow = ((navigator.userAgent.search(/Firefox\/[1-3]\.[0-1]/) === -1) && (!$.browser.msie)) ? true : false;
        $.support.textShadow = false;
        

        // Add JSON support to local storage
        if ($.support.nativeJSON && $.support.localStorage) {
            extendLocalStorage();
        }

    },
    
    /**
     * @description Returns a tree representing available data sources
     */
    _getDataSources: function () {
        var callback, self = this;
        
        callback = function (data) {
            self.dataSources = data;
            
            // Add initial layers
            $.each(self.userSettings.get('tileLayers'), function () {
                self.tileLayers.addLayer(new TileLayer(self, this));
            });
        };
        $.post(this.api, {action: "getDataSources"}, callback, "json");
    },
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        $("#helioviewer-about").click(function () {
            if ($(this).hasClass("dialog-loaded")) {
                var d = $('#about-dialog');
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                $('#about-dialog').load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - About",
                    width: 480,
                    height: 300,
                    draggable: true
                });
                $(this).addClass("dialog-loaded");
            }
            return false; 
        });

        //Keyboard shortcuts dialog
        $("#helioviewer-usage").click(function () {
            if ($(this).hasClass("dialog-loaded")) {
                var d = $('#usage-dialog');
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                $('#usage-dialog').load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - Usage Tips",
                    width: 480,
                    height: 480,
                    draggable: true
                });
                $(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },

    /**
     * @description Loads user settings from URL, cookies, or defaults if no settings have been stored.
     */
    loadUserSettings: function () {
        var timestamp, layerSettings, layers, self = this;
        this.userSettings = new UserSettings(this);
        
        // Load any view parameters specified via API
        if (this.load.date) {
            timestamp = getUTCTimestamp(this.load.date);
            this.userSettings.set('date', timestamp);
        }

        if (this.load.imageScale) {
            this.userSettings.set('zoomLevel', this.scaleToZoomLevel(this.load.imageScale));
        }

        // Process and load and layer strings specified
        if (this.load.imageLayers) {
            layers = [];
            
            $.each(this.load.imageLayers, function () {
                layerSettings = self.userSettings.parseLayerString(this);
                
                // Choose server to use
                if ((self.distributed === true) && ((layers.length % 2) === 0)) {
                    layerSettings.server = self.tileServer2;
                }
                else {
                    layerSettings.server = self.tileServer1;
                }
                
                // Load layer
                layers.push(layerSettings);
            });
            this.userSettings.set('tileLayers', layers);
        }

    },
    
    /**
     * @description Creates an HTML button for toggling between regular and fullscreen display
     */
    _createFullscreenBtn: function () {
        var btn, footer, header, vp, sb, speed, marginSize, meta, panels, outsideBox, origOutsideMarginLeft, 
            origOutsideMarginRight, origHeaderHeight, origViewportHeight, $_fx_step_default, self, body;
        
        // get dom-node
        btn = $("#fullscreen-btn");
        
        // CSS Selectors
        outsideBox = $('#outsideBox');
        body       = $('body');
        vp         = $('#helioviewer-viewport-container-outer');
        sb         = $('#sandbox');
        footer     = $('#footer-links-container-outer');
        meta       = $('#footer-container-outer');
        header     = $('#middle-col-header');
        panels     = $("#left-col, #right-col, #footer-links-container-outer, #social-buttons-container-outer");
       
        // animation speed
        speed = 500;
        
        // margin-size
        marginSize = 5;

        // Overide jQuery's animation method
        // http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
        self  = this;
        $_fx_step_default = $.fx.step._default;
        $.fx.step._default = function (fx) {
            if (fx.elem.id !== "sandbox") {
                return $_fx_step_default(fx);
            }
            self.viewport.updateSandbox();
            fx.elem.updated = true;
        };
        
        // setup event-handler
        btn.click(function () {
            if (!btn.hasClass('requests-disabled')) {
                            
                // toggle fullscreen class
                outsideBox.toggleClass('fullscreen-mode');
                
                // make sure action finishes before starting a new one
                btn.addClass('requests-disabled');
                
                // fullscreen mode
                if (outsideBox.hasClass('fullscreen-mode')) {
                    
                    // hide overflow
                    body.css('overflow', 'hidden');
                    
                    meta.hide();
    
                    // keep track of original dimensions
                    origOutsideMarginLeft  = outsideBox.css("margin-left");
                    origOutsideMarginRight = outsideBox.css("margin-right");
                    origHeaderHeight       = header.height();
                    origViewportHeight     = vp.height();
                    
                    outsideBox.animate({ 
                        marginLeft:  marginSize,
                        marginRight: marginSize
                    }, speed,
                    function () {
                        self.viewport.checkTiles();
                        self.tileLayers.resetLayers();
                        self.eventLayers.resetLayers();
                        panels.hide();
                        btn.removeClass('requests-disabled');
                    });
                       
                    header.animate({
                        height: marginSize
                    }, speed);
    
                    vp.animate({
                        height: $(window).height() - (marginSize * 3)
                    }, speed);
     
                    sb.animate({
                        right: 1 // Trash
                    }, speed);                
               
                // regular mode      
                } else {
                    panels.show();
                        
                    outsideBox.animate({ 
                        marginLeft:  origOutsideMarginLeft,
                        marginRight: origOutsideMarginRight
                    }, speed,
                    function () {
                        btn.removeClass('requests-disabled');    
                        meta.show();
                        
                        // show overflow
                        body.css('overflow', 'visible');
                    });
    
                    vp.animate({
                        height: origViewportHeight
                    }, speed);
                    header.animate({
                        height: origHeaderHeight
                    }, speed);
                    sb.animate({
                        right: 0
                    }, speed);
                }
            }
        });
    },

    /**
     * @description Initialize Helioviewer's viewport(s).
     */
    _initViewport: function () {
        this.viewport =    new Viewport(this, {
            id: this.viewportId,
            zoomLevel: this.userSettings.get('zoomLevel'),
            prefetch: this.prefetchSize,
            debug: false
        });
    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEvents: function () {
        var self = this;
        
        $('#center-button').click(function () {
            self.viewport.center.call(self.viewport);
        });
        
        // Link button
        $('#link-button').click(function () {
            self.displayURL();
        });
        
        // Email button
        $('#email-button').click(function () {
            self.displayMailForm();
        });
        
        // JHelioviewer button
        $('#jhelioviewer-button').click(function () {
            //console.log(self.tileLayers.toURIString());
            //window.open("http://www.jhelioviewer.org", "_blank");
        });

        // Hover effect for text/icon buttons        
        $('.text-btn').hover(function () {
            $(this).children(".ui-icon").addClass("ui-icon-hover");
        },
            function () {
            $(this).children(".ui-icon").removeClass("ui-icon-hover");
        });
        
        // Key press
        $(document).keypress(function (e) {
            if (e.target.tagName !== "INPUT") {
                self._keyPress(e);
            }
        });
    },

    /**
     * @description Initialize keyboard-related event handlers.
     * 
     * TODO: use events or public method instead of zoomControl's (private) method.
     * 
     * TODO (2009/07/29): Webkit doesn't support keypress events for non alphanumeric
     * keys (http://ejohn.org/blog/keypress-in-safari-31/).
     * 
     * Instead of using keypress, it may be better to use keydown and a boolean to decide 
     * when vp is moving and when it should be stationary.
     * 
     * Simple implementation:
     *     vp.movingUp (Boolean), vp.movingDown (Boolean), vp.movingLeft (Boolean), vp.movingRight (Boolean)
     *     
     * From there it is also simple to add support for diagonal movement, etc.
     */
    _keyPress: function (e) {
        var key, character, vp;

        // Letters use which and arrows, etc. use keyCode
        if (e.keyCode) {
            key = e.keyCode;
        }
        else if (e.which) {
            key = e.which;
        }

        // Get character pressed (letters, etc)
        character = String.fromCharCode(key);
        
        //console.log("which: " + e.which + ", keyCode: " + e.keyCode + ", character: " + character);
        
        vp = this.viewport;
        
        // Arrow keys
        if (key === 37 || key === 38 || key === 39 || key === 40) {
            vp.startMoving();
            
            // Threshold
            vp.viewportHandlers.moveCounter += 1;
            
            //if ((vp.viewportHandlers.moveCounter % vp.viewportHandlers.imageUpdateThrottle) !== 0)
            //    return;
        
            vp.viewportHandlers.moveCounter = vp.viewportHandlers.moveCounter % vp.viewportHandlers.tileUpdateThrottle;
        }
        
        //Right-arrow
        if (key === 37) {
            vp.moveBy(8, 0);
            vp.endMoving();
            return false;
        }

        //Up-arrow
        else if (key === 38) {
            vp.moveBy(0, 8);
            vp.endMoving();
            return false;
        }
        
        //Left-arrow
        else if (key === 39) {
            vp.moveBy(-8, 0);
            vp.endMoving();
            return false;
        }
        
        //Down-arrow
        else if (key === 40) {
            vp.moveBy(0, -8);
            vp.endMoving();
            return false;
        }            
        
        // Center
        else if (character === "c") {
            vp.center();
        }           

        // Mouse coordinates
        else if (character === "m") {
            vp.viewportHandlers.toggleMouseCoords();
        }

        // Zoom out
        else if (character === "-" || character === "_") {
            this.zoomControls.zoomButtonClicked(-1);
        }

        // Zoom in
        else if (character === "=" || character === "+") {
            this.zoomControls.zoomButtonClicked(+1);
        }
        
        // Event details
        else if (character === "d") {
            this.eventLayers.toggleLabels();
        }
       
        // Full-screen mode
        else if (character === "f") {
            $("#fullscreen-btn").click();
        }
        
        // Step back in time
        else if (character === ",") {
            this.timeControls.timePrevious();
        }
        
        // Step forward in time
        else if (character === ".") {
            this.timeControls.timeNext();
        }
    },
    
    /**
     * @description Sets up a simple AJAX-request loading indicator
     */
    _initLoadingIndicator: function () {
        $(document).ajaxStart(function () {
            $('#loading').show();
        });
        $(document).ajaxStop(function () {
            $('#loading').hide();
        });  
    },

    /**
     * @description Adds tooltips to all elements that are loaded everytime (buttons, etc) using default tooltip options.
     */
    _initToolTips: function () {
        $.fn.qtip.styles.helioviewer = {
            background: '#FFF',
            color: '#000',
            tip: 'topLeft',
            //position: 'bottomRight',
            padding: 10, 
            textAlign: 'center',
            border: {
                width: 1,
                radius: 6,
                color: '#FFF'
            }            
        };
    },

    /**
     * @description Adds a tooltip with specified settings to a given component.
     * @param {String} CSS selector of th element to add ToolTip to.
     * @param {Hash}   A hash containing any options configuration parameters to use.
     */
    addToolTip: function (id, params) {
        var options = params || [],
            classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");

        $(id).tooltip({
            delay: (options.delay ? options.delay : 1000),
            track: (options.track ? options.track : false),
            showURL: false,
            opacity: 1,
            fixPNG: true,
            showBody: " - ",
            extraClass: classname,
            top:  (options.yOffset ? options.yOffset : 0),
            left: (options.xOffset ? options.xOffset : 12)
        });
    },

    /**
     * @description Finds the closest support zoom-level to a given pixel scale (arcseconds per pixel)
     * @param {Float} imgScale The image scale in arcseconds per pixel
     */
    scaleToZoomLevel: function (imgScale) {
        var zoomOffset = Math.round(Math.lg((imgScale / this.baseScale)));
        return this.baseZoom + zoomOffset;
    },
    
    /**
     * @description Translates a given zoom-level into an image plate scale.
     */
    getImageScale: function () {
        var zoomOffset = this.viewport.zoomLevel - this.baseZoom;
        return this.baseScale * (Math.pow(2, zoomOffset));
    },
    
    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function () {
        var url, w;
        
        // Get URL
        url = this.userSettings.toURL();
        
        // Shadowbox width
        w = $('html').width() * 0.5;
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Use the following link to refer to current page:' + 
                        '<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
                        '</div>',
            options: {
                enableKeys : false,
                onFinish   : function () {
                    $("#helioviewer-url-input-box").select();
                }
            },
            player:     "html",
            title:      "URL",
            height:     80,
            width:      w
        });
    },
    
    /**
     * @description Displays a form to allow the user to mail the current view to someone
     * 
     * http://www.w3schools.com/php/php_secure_mail.asp
     * http://www.datahelper.com/mailform_demo.phtml
     */
    displayMailForm: function () {
        // Get URL
        var url = this.userSettings.toURL();
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Who would you like to send this page to?<br>' + 
                        '<form style="margin-top:15px;">' +
                        '<label>From:</label>' +
                        '<input type="text" class="email-input-field" id="email-from" value="Your Email Address"></input><br>' +
                        '<label>To:</label>' +
                        '<input type="text" class="email-input-field" id="email-from" value="Recipient\'s Email Address"></input>' +
                        '<label style="float:none; margin-top: 10px;">Message: </label>' + 
                        '<textarea style="width: 370px; height: 270px; margin-top: 8px;">Check this out:\n\n' + url + '</textarea>' + 
                        '<span style="float: right; margin-top:8px;"><input type="submit" value="Send"></input></span>' +
                        '</form>' +
                        '</div>',
            options: {
                enableKeys : false,
                onFinish: function () {
                    $(".email-input-field").one("click", function (e) {
                        this.value = "";
                    });
                }
            },
            player:     "html",
            title:      "Email",
            height:     455,
            width:      400
        });
    }
});


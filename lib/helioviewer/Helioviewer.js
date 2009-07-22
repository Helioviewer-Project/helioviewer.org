/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Helioviewer, Class, $, $A, Builder, Calendar, Event, EventLayerAccordion, EventTimeline, LayerManager, MessageConsole,TileLayer, TileLayerAccordion, TimeControls, UserSettings, ZoomControl, jQuery, LoadingIndicator, Viewport, document, window */
var Helioviewer = Class.create(
	/** @lends Helioviewer.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new Helioviewer instance.
	 * @param {Object} options Custom application settings.
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>defaultZoomLevel</b>	- The initial zoom-level to display.<br>
	 *		<b>defaultPrefetchSize</b> - The radius outside of the visible viewport to prefetch.<br>
	 *		<b>timeIncrementSecs</b>	- The default amount of time to move when the time navigation arrows are pressed.<br>
	 *		<b>minZoomLevel</b>		- Minimum zoom level allowed.<br>
	 *		<b>maxZoomLevel</b>		- Maximum zoom level allowed.<br>
	 *		<b>api</b>              - Primary API for querying image and event information.
	 * </div>
	 * @see Helioviewer#defaultOptions for a list of the available parameters.
	 */
	initialize: function (viewportId, api, view, defaults) {
       	Object.extend(this, defaults);
        this.load        = view;
        this.api         = api;
        this.viewportId  = viewportId;

        // Determine browser support
        this._checkBrowser();

		// Loading indication
		this.loadingIndicator = new LoadingIndicator();

		// Load user-settings
		this.loadUserSettings();

		// Layer Managers
		this.tileLayers  = new TileLayerManager(this);
		this.eventLayers = new EventLayerManager(this);
		
		this._initViewport();
		this._initUI();
		this._initEvents();
		this._initKeyBoardListeners();

		this.mediaSettings 	 = new MediaSettings(this);				
		this.movieBuilder 	 = new MovieBuilder(this);
		this.imageSelectTool = new ImageSelectTool(this);

		// Add initial layers
		this.userSettings.get('tileLayers').each((function (settings) {
			this.tileLayers.addLayer(new TileLayer(this.viewport, settings));
		}).bind(this));
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
		var centerBtn, outsideBox, mouseCoords;

		// Observation date & controls
		this.date = new Time(this);

		//Zoom-control
		this.zoomControl = new ZoomControl(this, {
			id: 'zoomControl',
			zoomLevel:    this.userSettings.get('zoomLevel'),
			minZoomLevel: this.minZoomLevel,
			maxZoomLevel: this.maxZoomLevel
		});

		//Time-navigation controls
		this.timeControls = new TimeControls(this, this.timeIncrementSecs, '#date', '#time', '#timestep-select', '#timeBackBtn', '#timeForwardBtn');

		//Message console
		this.messageConsole = new MessageConsole(this);

		//Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
		this.tileLayerAccordion  = new TileLayerAccordion (this, 'tileLayerAccordion');
		this.eventLayerAccordion = new EventLayerAccordion(this, 'eventAccordion');

		//Tooltips
		this._initToolTips();

        //Fullscreen button
        this._createFullscreenBtn();

		this._createScreenshotButton();
			
		//Mouse coordinates
		mouseCoords =  Builder.node('div', {id: 'mouse-coords', style: 'display: none'});

		// IE will choke here if we don't manually extend mouseCoords... see last paragraph at http://prototypejs.org/learn/extensions
		Element.extend(mouseCoords);

		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-x', style: 'width:50%; float: left'}));
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-y', style: 'width:50%; float: left'}));
		this.viewport.innerNode.insert(mouseCoords);

        // Setup dialog event listeners
        this._setupDialogs();
        
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
        this.support = {};
        
        // Native JSON (2009/07/02: Temporarily disabled: see notes in UserSettings.js)
        //this.support.nativeJSON = (typeof(JSON) !== "undefined") ? true: false;
        this.support.nativeJSON = false;
        
        // Web storage (local)
        this.support.localStorage = (typeof(localStorage) !== "undefined") ? true: false;
        
        // (2009/07/02) Temporarily disabled on IE (works differently)
        if (navigator.userAgent.search(/MSIE/) !== -1)
            this.support.localStorage = false;
        
        // CSS3 text-shadows
        // (2009/07/16 Temporarily disabled while re-arranging social buttons & meta links)
        //this.support.textShadow = ((navigator.userAgent.search(/Firefox\/[1-3]\.[0-1]/) === -1) && (navigator.userAgent.search(/MSIE/) === -1)) ? true : false;
        
        this.support.textShadow = false;
        

        // Add JSON support to local storage
        if (this.support.nativeJSON && this.support.localStorage)
            extendLocalStorage();
    },
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        jQuery("#helioviewer-about").click(function () {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#about-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#about-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - About",
        			width: 480,
        			height: 300,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });

		//Keyboard shortcuts dialog
        jQuery("#helioviewer-usage").click(function () {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#usage-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#usage-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - Usage Tips",
        			width: 480,
        			height: 480,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },

	/**
	 * @description Loads user settings from URL, cookies, or defaults if no settings have been stored.
	 */
	loadUserSettings: function () {
    	this.userSettings = new UserSettings(this);
		
		// Load any view parameters specified via API
		if (this.load["date"]) {
            var timestamp = getUTCTimestamp(this.load["date"]);
            this.userSettings.set('date', timestamp);
		}

		if (this.load["imageScale"]) {
			this.userSettings.set('zoomLevel', this.scaleToZoomLevel(this.load["imageScale"]));
		}

        // Process and load and layer strings specified
		if (this.load.imageLayers) {
			var layerSettings, layers = [], self = this;
            
			$A(this.load.imageLayers).each(function (layerString) {
				layerSettings = self.userSettings.parseLayerString(layerString);
				
                // Choose server to use
                if ((self.distributed === true) && ((layers.length % 2) == 0))
                    layerSettings.server = self.tileServer2;
                else
                    layerSettings.server = self.tileServer1;
                
                // Load layer
				layers.push(layerSettings);
			});
			this.userSettings.set('tileLayers', layers);
		}

	},
    
    /**
     * @description Creates an HTML button for toggling between regular and fullscreen display
     * Syntax: jQuery
     */
    _createFullscreenBtn: function () {
        var btn, footer, header, vp, sb, speed, marginSize, panels, btns, outsideBox, origOutsideMarginLeft, 
            origOutsideMarginRight, origHeaderHeight, origViewportHeight, $_fx_step_default, self;
        
        // get dom-node
        btn = jQuery("#fullscreen-btn");
        
        // CSS Selectors
        outsideBox = jQuery('#outsideBox');
        body       = jQuery('body');
        vp         = jQuery('#helioviewer-viewport-container-outer');
        sb         = jQuery('#sandbox');
        footer     = jQuery('#footer-links-container-outer');
        meta       = jQuery('#footer-container-outer');
        header     = jQuery('#middle-col-header');
        panels     = jQuery("#left-col, #right-col, #footer-links-container-outer, #social-buttons-container-outer");
       
        // animation speed
        speed = 500;
        
        // margin-size
        marginSize = 5;

        // Overide jQuery's animation method
        // http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
        self  = this;
        var $_fx_step_default = jQuery.fx.step._default;
        jQuery.fx.step._default = function (fx) {
            if (!(fx.elem.id === "sandbox")) {
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
                        height: jQuery(window).height() - (marginSize * 3)
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
	 * @description Creates a button that allows the user to take screenshots of what is in their viewport.
	 */
	_createScreenshotButton: function () {
        this.button = jQuery("#screenshot-button");
		this.url 	= "api/index.php";
		this.sharpen 	 = false;
		this.edgeEnhance = false;
		this.building 	 = false;
		
		var self = this;
		this.button.click(function () {
			if (self.building) {
				self.messageConsole.info("A link to your screenshot will be available shortly.");
			}
			else {
				var visibleCoords = self.viewport.getHCViewportPixelCoords();
				self.imageSelectTool.takeScreenshot(self, visibleCoords);
			}
		});
	},

	/**
	 * @description Initialize Helioviewer's viewport(s).
	 */
	_initViewport: function () {
		this.viewport =	new Viewport(this, {
            id: this.viewportId,
            zoomLevel: this.userSettings.get('zoomLevel'),
            prefetch: this.prefetchSize,
            debug: false
        });

		// Dynamically resize the viewport when the browser window is resized.
		Event.observe(window, 'resize', this.viewport.resize.bind(this.viewport));
	},

	/**
	 * @description Initialize event-handlers for UI components controlled by the Helioviewer class
	 */
	_initEvents: function () {
        var self = this;
        
		this.observe(this.zoomControl, 'zoom-slider-change', this.handlers.zoom);
		
        jQuery('#center-button').click(function () {
            self.viewport.center.call(self.viewport);
        });
        
        // Link button
        jQuery('#link-button').click(function () {
            self.displayURL();
        });
        
        // Email button
        jQuery('#email-button').click(function () {
        	self.displayMailForm();
        });
        
        // JHelioviewer button
        jQuery('#jhelioviewer-button').click(function () {
            console.log(self.tileLayers.toURIString());
            window.open("http://www.jhelioviewer.org", "_blank");
        });

        // Hover effect for text/icon buttons        
        jQuery('.text-btn').hover(function () {
            jQuery(this).children(".ui-icon").addClass("ui-icon-hover");
        },
            function () {
            jQuery(this).children(".ui-icon").removeClass("ui-icon-hover");
        });
        

	},

	/**
	 * @description Initialize keyboard-related event handlers.
	 * @see Based off method by <a href="http://www.quirksmode.org/js/events_properties.html#key">PPK</a>
	 */
	_initKeyBoardListeners: function () {
		var self = this;
		Event.observe(document, 'keypress', function (e) {

			//Ignore event if user is type in an input form field
			if (e.target.tagName !== "INPUT") {
				var code, character;
				if (!e) {
					e = window.event;
				}
				if (e.keyCode) {
					code = e.keyCode;
				}
				else if (e.which) {
					code = e.which;
				}

				character = String.fromCharCode(code);

				//TODO: use events or public method instead of zoomControl's (private) method.
				if (character === "-" || character === "_") {
					self.zoomControl.zoomButtonClicked(+1);
				}
				else if (character === "=" || character === "+") {
					self.zoomControl.zoomButtonClicked(-1);
				}
				else if (character === "c") {
                    self.viewport.center();
				}
				// event label visibility toggle
				else if (character === "d") {
                    self.eventLayers.toggleLabels();
				}
                
				// toggle mouse-coords display
				else if (character === "m") {
    				self.viewport.viewportHandlers.toggleMouseCoords();
				}
                
                // toggle full-screen display
                else if (character === "f") {
                    jQuery("#fullscreen-btn").click();
                }
                
                // step back in time
                else if (character === ",") {
                    self.timeControls.timePrevious();
                }
                
                // step forward in time
                else if (character === ".") {
                    self.timeControls.timeNext();
                }                          
			}
		});
	},

	/**
	 * @description Adds tooltips to all elements that are loaded everytime (buttons, etc) using default tooltip options.
	 */
	_initToolTips: function () {
		var items = $A([
			'#zoomControlZoomOut',
			'#zoomControlHandle',
			'#timeBackBtn',
			'#timeForwardBtn'
		]),

		self = this;
		items.each(function (item) {
			self.addToolTip(item, {yOffset: -125});
		});

		//Handle some special cases separately
		//this.addToolTip('#movieBuilder', {position: 'topleft'});
        this.addToolTip('#zoomControlZoomIn', {position: 'topleft'});
        this.addToolTip('#fullscreen-btn', {position: 'topright', yOffset: 10, xOffset: -185});

	},

	/**
	 * @description Adds a tooltip with specified settings to a given component.
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
	 */
	addToolTip: function (id, params) {
		var options = params || [],
			classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");

		jQuery(id).tooltip({
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
	 * @description Add an event-handler to a given component.
	 * @param {Object} uielement The UI component to attach the event to
	 * @param {String} eventName The name of the event to monitor for
	 * @param {Function} eventHandler A reference to the event-handler
	 * @see UIElement
	 */
	observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
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
        w = jQuery('html').width() * 0.5;
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Use the following link to refer to current page:' + 
                        '<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
                        '</div>',
            player:     "html",
            title:      "URL",
            height:     80,
            width:      w
        });
    },
    
    /**
     * @description Displays a form to allow the user to mail the current view to someone
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
            player:     "html",
            title:      "Email",
            height:     455,
            width:      400
        });
        
    },

	/**
	 * @namespace
	 * @description Helioviewer application-level event handlers
	 */
	handlers: {
		/**
		 * @description Changes the zoom-level to a new value
		 * @param {Int} level The new zoom-level to use
		 */
		zoom: function (level) {
			this.viewport.zoomTo(level);
		},

		newToolTip: function (tooltip) {
			this.addToolTip(tooltip.id, tooltip.params);
		}
	},
	
	/**
	 * How far away the heliocenter is from the top left corner of the viewport, and in which direction.
	 * Note that the convert command reverses "+" and "-" for the x-direction, 
	 * so "+" means push the image to the left, "-" means push it to the right.
	 * A +x means the heliocenter (0,0) is left of the top-left corner, and a +y means
	 * the heliocenter is above the top-left corner.
	 */	
	getHCOffset: function (visibleCoords) {
		var left, top, offset;

		left 	= visibleCoords.left;
		top 	= visibleCoords.top;

		offset = {
			x: left,
			y: top
		};
			
		return offset;
	},
	
	getViewportInformation: function (visibleCoords) {
		var layers, hcOffset, layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), totalRanges = $A();
		
		totalRanges = {
			xStart: null,
			xEnd:	null,
			yStart:	null,
			yEnd:	null,
			width:	null,
			height:	null
		};

		hcOffset = this.getHCOffset(visibleCoords);
	
		// Only add visible tile layers to the array.
		this.tileLayers.each(function (t) {
			if (t.visible) {
				var left, top, right, bottom, width, height, sizeOffset, jp2Width, imagesize, xRange, yRange, name;
				
                // TODO: find a way to not hard-code these that doesn't take much time.
                 jp2Width = t.width;
                 if (t.detector == "0C2") {
				 	jp2Width = 1174;
				 }

			 	if (t.detector == "0C3") {
					jp2Width = 1418;
				}
				
				sizeOffset = jp2Width / t.relWidth;

				// Convert viewport heliocentric coordinates into image coordinates
				left 	= Math.floor(visibleCoords.left + t.relWidth / 2);
				top 	= Math.floor(visibleCoords.top  + t.relHeight / 2);
				right 	= Math.floor(visibleCoords.right  + t.relWidth / 2);
				bottom 	= Math.floor(visibleCoords.bottom + t.relHeight / 2);
				
				/* 
				 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
				 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may be twice as large
				 * as its corresponding jp2 image. The sizeOffset for this image would be (image width)/(2x image width) or 0.5,
				 * so to get the pixel coordinate relative to the jp2 image, multiply "left" by 0.5, the sizeOffset.
				 * zoomOffset cannot be used here because images like LASCO C2 and C3 have different sizeOffsets than EIT images
				 * at the same zoomLevel.
				 * If "left" or "top" is less than 0, just use 0.
				 */
				left 	= Math.max(left * sizeOffset, 0);
				top 	= Math.max(top  * sizeOffset, 0);
				right 	= right  * sizeOffset;
				bottom 	= bottom * sizeOffset;

				// If the calculated width is greater than the possible width, just use the possible width. 							
				width  = Math.min((right - left), t.width  - left);
				height = Math.min((bottom - top), t.height - top);

				// Round values off to the nearest integer, since you cannot have partial-pixels as a measurement
				width 	= Math.round(width);
				height 	= Math.round(height);
				left 	= Math.round(left);
				top 	= Math.round(top);
				
				// If the captured image just shows the black circular region of LASCO C2 or C3, don't even use that layer.		
				if (t.detector == "0C2" && left >= 437 && right <= 737 && top >= 437 && bottom < 737) {
					width = -1;
				}
				
				else if (t.detector == "0C3" && left >= 637 && right <= 781 && top >= 637 && bottom <= 781) {
					width = -1;
				}
							
				// If at least some of the image is currently visible, add that layer
				if (width > 0 && height > 0 && top < t.height && left < t.width) {
					xRange = {
						start: 	left.toString(),
						size: 	width.toString()
					};
					
					yRange = {
						start: 	top.toString(),
						size: 	height.toString()
					};
					
					layerNames.push(t + "x" + xRange.start + "," + xRange.size + "," + yRange.start + "," + yRange.size);
					
					// If one of the total range values is null, they all will be, so only need to check if one is null.
					// If the total range width is less than this layer's width, this layer must be the largest layer so far,
					// so use this layer's values for the ranges.
					if(totalRanges.xStart == null || totalRanges.width < width || totalRanges.height < height) {
						totalRanges.xStart 	= xRange.start;
						totalRanges.xEnd 	= xRange.end;
						totalRanges.yStart 	= yRange.start;
						totalRanges.yEnd 	= yRange.end;
						totalRanges.width	= width;
						totalRanges.height	= height;
					}
				}
			}
		});
		
		layers = {
			layerNames: layerNames,
			hcOffset: 	hcOffset,
			xStart:		totalRanges.xStart,
			xEnd:		totalRanges.xEnd,
			yStart:		totalRanges.yStart,
			yEnd:		totalRanges.yEnd
		};

		return layers;
	}
});


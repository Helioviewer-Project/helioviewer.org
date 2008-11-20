/**
 * @fileoverview Contains the main application class and controller for HelioViewer.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @class Helioviewer
 * 
 *	Required Parameters:
 * 		defaultZoomLevel	- The initial zoom-level to display.
 *		defaultPrefetchSize - The radius outside of the visible viewport to prefetch.
 *		timeIncrementSecs	- The default amount of time to move when the time navigation arrows are pressed.
 *		minZoomLevel		- Minimum zoom level allowed. 
 *		maxZoomLevel		- Maximum zoom level allowed.
 *		imageAPI			- URL to the API for retrieving image meta information.
 *		tileAPI				- URL to the API for retrieving tiles.
 *		eventAPI			- URL to the API for retrieving events and event-catalogs.
 *
 */
var Helioviewer = Class.create({
	defaultOptions: {
		defaultZoomLevel: 12,
		resZoomLevel: 10,
		res: 2.63,
		defaultPrefetchSize: 0,
		timeIncrementSecs: 86400,
		minZoomLevel: 5,
		maxZoomLevel: 20,
		tileAPI:  'api/getTile.php',
		imageAPI: 'api/getImage.php',
		eventAPI: 'api/getEvents.php'
	},

	// starting date
	date: new Date(Date.UTC(2003, 9, 5)),

	/**
	 * @constructor
	 */
	initialize: function (options) {
		Object.extend(this, this.defaultOptions);
		Object.extend(this, options);

		// Load user-settings
		this.loadUserSettings();
		
		this.layerManager =  new LayerManager(this);
		this.initViewports();
		this.initUI();
		this.initEvents();
		this.initKeyBoardListeners();
		
		// Add initial layers
		this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileAPI: this.tileAPI, observatory: 'SOH', instrument: 'EIT', detector: 'EIT', measurement: '195' }));
		//this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileAPI: this.tileAPI, observatory: 'SOH', instrument: 'LAS', detector: '0C2', measurement: '0WL' }));
		//this.layerManager.addLayer(new TileLayer(this.viewports[0], { tileAPI: this.tileAPI, observatory: 'SOH', instrument: 'MDI', detector: 'MDI', measurement: 'mag' }));
		
		//Shadow-box
		//Shadowbox.init({skipSetup: true});

	},

	/**
	 * @method initUI Initialized HelioViewer's user interface (UI) components
	 */
	initUI: function () {
		//Calendar
		this.calendar = new Calendar(this, 'date', 'time');

		//Zoom-control
		this.zoomControl = new ZoomControl(this, {
			id: 'zoomControl',
			zoomLevel:    this.userSettings.get('zoom-level'),
			minZoomLevel: this.minZoomLevel,
			maxZoomLevel: this.maxZoomLevel
		});

		//Time-navigation controls
		//this.timeStepSlider = new TimeStepSlider(this, 'timestepHandle', 'timestepTrack', 'timeBackBtn', 'timeForwardBtn', this.timeIncrementSecs, 8);
		this.timeControls = new TimeControls(this, 'timestep-select', 'timeBackBtn', 'timeForwardBtn', this.timeIncrementSecs);

		//Message console
		this.messageConsole = new MessageConsole(this, 'message-console', 'helioviewer-viewport-container-outer');

		//Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
		this.tileLayerAccordion = new TileLayerAccordion(this.layerManager, 'layerManager');
		this.eventLayerAccordion = new EventLayerAccordion(this.viewports[0], 'eventAccordion');

		//Tooltips
		this.initToolTips();
		
		//Center button
		var centerBtn =  Builder.node('div', {className: 'center-button'}, Builder.node('span', {}, "center"));
		Event.observe(centerBtn, 'click', this.viewports[0].center.bindAsEventListener(this.viewports[0]));
		this.viewports[0].innerNode.insert(centerBtn);
		
		//Mouse coordinates
		var mouseCoords = Builder.node('div', {id: 'mouse-coords', style: 'display: none'});
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-x', style:'width:50%; float: left'}));
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-y', style:'width:50%; float: left'}));
		this.viewports[0].innerNode.insert(mouseCoords);
		
		//About button
		jQuery('#about-dialog').dialog({
			autoOpen: false,
			title: "About",
			width: 480,
			height: 300,
			draggable: true
		});
		jQuery('#helioviewer-about').click(function(e){
			if (jQuery('#about-dialog').dialog('isOpen')) {
				Debug.output("closing dialog...");
				jQuery('#about-dialog').dialog('close');
			}
			else {
				Debug.output("opening dialog...");
				jQuery('#about-dialog').dialog('open');
			}
		});
		
		//Movie builder
		//this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});
	},

	/**
	 * @function
	 */
	loadUserSettings: function () {
		this.userSettings = new UserSettings(this);
	},

	/**
	 * @function
	 * @description Initialize Helioviewer's viewport(s).
	 */
	initViewports: function () {
		this.viewports = $A([
			new Viewport(this, { id: this.viewportId, zoomLevel: this.userSettings.get('zoom-level'), prefetch: this.defaultPrefetchSize, debug: false })
		]);

		// Dynamically resize the viewport when the browser window is resized.
		this.viewports.each(function (viewport) {
			Event.observe(window, 'resize', viewport.resize.bind(viewport));
		});
	},

	initEvents: function () {
		this.observe(this.zoomControl, 'change', this.handlers.zoom);
		this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
		//this.observe(this.timeStepSlider, 'timeIncrementChange', this.handlers.timeIncrementChange);
		this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
		Event.observe(this.calendar.timeField, 'change', this.handlers.observationTimeChange.bindAsEventListener(this));
	},

	//Courtesy of PPK (http://www.quirksmode.org/js/events_properties.html#key)
	initKeyBoardListeners: function () {
		var self = this;
		Event.observe(document, 'keypress', function (e) {

			//Ignore event if user is type in an input form field
			if (e.target.tagName !== "INPUT") {
				var code;
				if (!e) var e = window.event;
				if (e.keyCode) code = e.keyCode;
				else if (e.which) code = e.which;
				var character = String.fromCharCode(code);

				//TODO: use events or public method instead of zoomControl's (private) method.
				if (character === "-" || character === "_") {
					self.zoomControl.zoomButtonClicked(+1);
				}
				else if (character === "=" || character === "+") {
					self.zoomControl.zoomButtonClicked(-1);
				}
				else if (character === "c") {
					self.viewports.each(function (viewport){
						viewport.center();
					});
				}
				//event label visibility toggle
				else if (character === "d") {
					self.layerManager.layers.each(function (layer){
						if (layer.type === "EventLayer") {
								layer.toggleLabelVisibility();
						}
					});
				}
				// toggle mouse-coords display
				else if (character === "m") {
					self.viewports.each(function (viewport){
						viewport.ViewportHandlers.toggleMouseCoords();
					});
				}
				
			}
		});
	},

	/*
	 * @function
	 * @description Adds tooltips to all elements that are loaded everytime (buttons, etc).
	 * 				Uses default options. 
	 */
	initToolTips: function () {
		var items = $A([
			'#zoomControlZoomIn',
			'#zoomControlZoomOut',
			'#zoomControlHandle',
			'#timeBackBtn',
			'#timeForwardBtn'
		]);

		var self = this;
		items.each(function (item) {
			self.addToolTip(item, {yOffset: -125});
		});
		
		//Handle some special cases separately
		this.addToolTip('#movieBuilder', {position: 'topleft'});

	},

	/**
	 * @method addToolTip
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
	 */
	addToolTip: function (id, params) {
		var options = params || [];
		var classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");

		jQuery(id).tooltip({
			delay: (options.delay ? options.delay : 1000),
			track: (options.track ? options.track : false),
			showURL: false,
			opacity: 1,
			fixPNG: true,
			showBody: " - ",
			extraClass: classname,
			top: (options.yOffset ? options.yOffset : 0),
			left: 12
		});
	},

	addViewport: function (viewport) {
		this.viewports.push(viewport);
		return this;
	},

	observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
	},

	setDate: function (date) {
		this.date = date;
		this.layerManager.reloadLayers();
	},

	/**
	 * EVENT HANDLERS
	 */
	handlers: {
		zoom: function (level) {
			this.viewports.each(function (viewport) {
				viewport.zoomTo(level);
			});
		},

		observationDateChange: function (date) {
			this.setDate(date);
			this.calendar.updateFields();
		},

		observationTimeChange: function (e) {
			var time = e.target.value;

			//make sure time entered in correct format
			var regex = /^\d{2}:\d{2}:\d{2}?/;

			//Check to see if the input is a valid time
			if (time.match(regex)) {
				//Get the difference in times and add to this.date
				var newTime = time.split(':');
				var hours = parseInt(newTime[0], 10) - this.date.getUTCHours();
				var mins  = parseInt(newTime[1], 10) - this.date.getUTCMinutes();
				var secs  = parseInt(newTime[2], 10) - this.date.getUTCSeconds();

				this.date.addHours(hours);
				this.date.addMinutes(mins);
				this.date.setSeconds(secs);

				this.setDate(this.date);

				//Update colors of timestamps
				//this.layerManager.updateTimeStamps();

			} else {
				this.messageConsole.warn('Invalid time. Please enter a time in of form HH:MM:SS');
			}
		},

		//timeIncrementChange: function (timeIncrement) {
		//	this.timeStepSlider.setTimeIncrement(timeIncrement);
		//},

		newToolTip: function (tooltip) {
			this.addToolTip(tooltip.id, tooltip.params);
		},

		/**
		 * @method newLayer Initializes new layer upon user request
		 * @param {Object} instrument Contains necessary information for creating a new layer
		 * @param {LayerManagerMenuEntry} menuEntry Reference to the menu entry to allow layer to be tied to the entry
		 */
		newLayer: function (data) {
			var inst = data.instrument;
			var ui =   data.menuEntry;
			var viewport = this.viewports[0];

			// Inialize layer and add it to the viewport
			var layer = new TileLayer(viewport, { tileAPI: this.tileAPI, observatory: inst.observatory, instrument: inst.instrument, detector: inst.detector, measurement: inst.measurement });
			viewport.addLayer(layer);

			//Update menu entry display
			ui.layer = layer;
			ui.displayTileLayerOptions();
		}
	}
});


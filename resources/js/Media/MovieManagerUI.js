/**
 * MovieManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, MovieManager, MediaManagerUI, Helioviewer, helioviewer,
  layerStringToLayerArray, humanReadableNumSeconds
 */
"use strict";

import ReactDOM from 'react-dom/client';
import React from 'react';
import { MediaManagerUI } from './MediaManagerUI';
import { VideoPlayer } from './VideoPlayer';

var MovieManagerUI = MediaManagerUI.extend(
	/** @lends MovieManagerUI */
	{
	/**
	 * @constructs
	 * Creates a new MovieManagerUI instance
	 *
	 * @param {int} regenerateMovieThreshold Number of days to wait before displaying the "regenerate" option on an old movie.
	 * @param {bool} enable_helios Determines whether or not to render helios links on movies
	 */
	init: function (regenerateMovieThreshold = 90, enable_helios = false) {
		var movies = Helioviewer.userSettings.get('history.movies');
		this._manager = new MovieManager(movies);
		this._super("movie", enable_helios);
		this._settingsDialog   = $("#movie-settings-container");
		this._advancedSettings = $("#movie-settings-advanced");
		this._settingsHelp   = $("#movie-settings-help");
		this._settingsForm   = $("#movie-settings-form-container");
		this._settingsConsole  = $("#movie-settings-validation-console");
		this._movieScale = null;
		this._movieROI = null;
		this._movieLayers = null;
		this._regenerateMovieThreshold = regenerateMovieThreshold;
		this._initEvents();
		this._initSettings();

		this.show();
	},

	/**
	 * Plays the movie with the specified id if it is ready
	 */
	playMovie: function (id) {
		var movie = this._manager.get(id);

		// If the movie is ready, open movie player
		if (movie.status === 2) {
			this._createMoviePlayerDialog(movie);
		} else {
			return;
		}
	},

	/**
	 * This function can be used to request a new movie from other parts of the helioviewer application.
	 *
	 * The movie requested will use the given serialized parameters, and the current viewport.
	 */
	requestQueueMovie: function (serializedFormParams) {
		// Load parameters for the current viewport to be used in the movie request
		this._loadMovieQueueParameters();
		// Request the movie
		this._buildMovieRequest(serializedFormParams);
	},

	/**
	 * Uses the layers passed in to send an Ajax request to api.php, to have it
	 * build a movie. Upon completion, it displays a notification that lets the
	 * user click to view it in a popup.
	 */
	_buildMovieRequest: function (serializedFormParams) {
		var formParams, baseParams, params, frameRate, celestialBodiesLabels, celestialBodiesTrajectories;

		// Convert to an associative array for easier processing
		formParams = {};

		$.each(serializedFormParams, function (i, field) {
			formParams[field.name] = field.value;
		});

		this.building = true;

		var switchSources = false;
		if(outputType == 'minimal'){
			switchSources = true;
		}

		celestialBodiesLabels = helioviewerWebClient.getCelestialBodiesLabels();
		celestialBodiesTrajectories = helioviewerWebClient.getCelestialBodiesTrajectories();

		// Movie request parameters
		baseParams = {
			imageScale   : this._movieScale,
			layers	 : this._movieLayers,
			eventsState : Helioviewer.userSettings.get("state.events_v2"),
			scale	   : Helioviewer.userSettings.get("state.scale"),
			scaleType   : Helioviewer.userSettings.get("state.scaleType"),
			scaleX	 : Helioviewer.userSettings.get("state.scaleX"),
			scaleY	 : Helioviewer.userSettings.get("state.scaleY"),
			format	 : this._manager.format,
			size		 : 0,
			movieIcons   : 0,
			followViewport   : 0,
			reqObservationDate   : new Date(Helioviewer.userSettings.get("state.date")).toISOString(),
			switchSources   : switchSources,
			celestialBodiesLabels : celestialBodiesLabels,
			celestialBodiesTrajectories : celestialBodiesTrajectories
		};

		// Add ROI and start and end dates
		if(typeof formParams['startTime'] != 'undefined'){
			var dates =  {
				"startTime": formParams['startTime'],
				"endTime"  : formParams['endTime']
			};
			params = $.extend(baseParams, this._movieROI, dates);
		}else{
			params = $.extend(baseParams, this._movieROI, this._getMovieTimeWindow());
		}

		// (Optional) Frame-rate or movie-length
		if (formParams['speed-method'] === "framerate") {
			frameRate = parseInt(formParams['framerate'], 10);
			if (frameRate < 1 || frameRate > 30) {
				throw "Frame-rate must be between 1 and 30.";
			}
			params['frameRate'] = parseInt(formParams['framerate']);
		}
		else {
			if (formParams['framerate'] < 5 ||
				formParams['framerate'] > 100) {
				throw "Movie length must be between 5 and 100 seconds.";
			}
			params['movieLength'] = parseInt(formParams['framerate']);
		}

		if(typeof formParams['size'] != 'undefined' && (parseInt(formParams['size']) >=0 || parseInt(formParams['size']) <=5)){
			params['size'] = parseInt(formParams['size']);
		}

		if(typeof formParams['movie-icons'] != 'undefined' && parseInt(formParams['movie-icons']) >0){
			params['movieIcons'] = true;
		}

		if(typeof formParams['followViewport'] != 'undefined' && parseInt(formParams['followViewport']) >0){
			params['followViewport'] = true;
		}

		// Submit request
		this._queueMovie(params);

		this._advancedSettings.hide();
		this._settingsDialog.hide();

		this.show();

		this.building = false;
	},

	/**
	 * Determines the start and end dates to use when requesting a movie
	 */
	_getMovieTimeWindow: function () {
		var movieLength, currentTime, endTime, startTimeStr, endTimeStr,
			now, diff;

		movieLength = Helioviewer.userSettings.get("options.movies.duration");

		// Webkit doesn't like new Date("2010-07-27T12:00:00.000Z")
		currentTime = helioviewerWebClient.getDate();

		// We want shift start and end time if needed to ensure that entire
		// duration will be used. For now, we will assume that the most
		// recent data available is close to now() to make things simple

		endTime = new Date(helioviewerWebClient.getDate().getTime() + (movieLength / 2) * 1000);

		now = new Date();
		diff = endTime.getTime() - now.getTime();
		currentTime = new Date(currentTime.getTime() + Math.min(0, -diff));

		startTimeStr = new Date(currentTime.getTime() + (-movieLength / 2) * 1000);
		endTimeStr = new Date(currentTime.getTime() + (movieLength / 2) * 1000);
		// Start and end datetime strings
		return {
			"startTime": startTimeStr.toISOString(),
			"endTime"  : endTimeStr.toISOString()
		};
	},

	/**
	 * Prefills this._movie* settings to be used later on in a movie request.
	 */
	_loadMovieQueueParameters: function (roi) {
		if (typeof roi === "undefined") {
			roi = helioviewerWebClient.getViewportRegionOfInterest();
		}

		var layers = helioviewerWebClient.getVisibleLayers(roi);

		// Make sure selection region and number of layers are acceptible
		if (!this._validateRequest(roi, layers)) {
			return;
		}

		// Store chosen ROI and layers
		this._movieScale  = helioviewerWebClient.getZoomedImageScale();
		this._movieROI  = this._toArcsecCoords(roi, this._movieScale);
		this._movieLayers = layers;
	},

	/**
	 * Displays movie settings dialog
	 */
	_showMovieSettings: function (roi) {
		this._loadMovieQueueParameters(roi);

		//Choose dialog format
		if(Helioviewer.userSettings.get("options.movies.dialog") == 'advanced'){
			$('.movie-duration-box').hide();
			$('.movie-time-box').show();
			$('.movie-format-box').show();
			$('.movie-icons-box').show();
			$('.movie-follow-viewport-box').show();
			$('.movie-settings-more-btn').hide();
			$('.movie-settings-less-btn').show();
		}else{
			$('.movie-time-box').hide();
			$('.movie-format-box').hide();
			$('.movie-icons-box').hide();
			$('.movie-follow-viewport-box').hide();
			$('.movie-duration-box').show();
			$('.movie-settings-less-btn').hide();
			$('.movie-settings-more-btn').show();
		}

		this.hide();
		this._settingsConsole.hide();
		this._settingsDialog.show();
		this._advancedSettings.show();
	},

	/**
	 * Queues a movie request
	 */
	_queueMovie: function (params) {
		var callback, self = this;


		// Notification Permission
		if("Notification" in window){//if browser supports notifications
			var savedMovieNotificationsState = Helioviewer.userSettings.get("options.movieNotifications");
			if (savedMovieNotificationsState == undefined || savedMovieNotificationsState == null || savedMovieNotificationsState !== Notification.permission){
				if (Notification.permission !== "denied"){//if the user has not denied the notification
					Notification.requestPermission();//get notification permission
				}
				if(Notification.permission == "denied" || Notification.permission == "granted"){
					var notifParams = {
						action: 'logNotificationStatistics',
						notifications: Notification.permission
					}
					$.get(Helioviewer.api, notifParams, null , "json");
					Helioviewer.userSettings.set("options.movieNotifications", Notification.permission);
				}
			}
		}

		// AJAX Responder
		let successCallback = function (response) {

			var msg, movie, waitTime;

			movie = self._manager.queue(
				response.id, response.eta, response.token,
				params.imageScale, params.layers, params.eventsState,
				params.scale, params.scaleType,
				params.scaleX, params.scaleY, new Date().toISOString(),
				params.startTime, params.endTime, params.x1, params.x2,
				params.y1, params.y2, params.size
			);

			self._addItem(movie);

			waitTime = humanReadableNumSeconds(response.eta);
			Helioviewer.messageConsole.info("Your video is processing and will be available in approximately " + waitTime + ". You may view it at any time after it is ready by clicking the 'Movie' button");
			self._refresh();
		};

		let failCallback = function (errResp) {
			// 12 - No images found in requested time range
			// 16 - Insufficient data found in requested time range
			const showErrorMessageWhitelist = [12, 16];
			if (showErrorMessageWhitelist.indexOf(errResp.responseJSON.errno) != -1) {
				Helioviewer.messageConsole.warn(errResp.responseJSON.error);
			} else {
				Helioviewer.messageConsole.error("Unable to create movie, please try again later");
			}
			console.error(errResp.responseJSON);
		}

		return postJSON("postMovie", params).then(successCallback, failCallback);
	},


	/**
	 * Initializes MovieManager-related event handlers
	 */
	_initEvents: function () {
		var timer, self = this;

		this._super();

		// ROI selection buttons
		this._fullViewportBtn.click(function () {
			self._showMovieSettings();
		});

		this._selectAreaBtn.click(function () {
			self._cleanupFunctions = [];

			if ( helioviewerWebClient.drawerLeftOpened ) {
				self._cleanupFunctions.push('helioviewerWebClient.drawerLeftClick()');
				helioviewerWebClient.drawerLeftClick();
			}
			self._cleanupFunctions.push('helioviewerWebClient.drawerMoviesClick()');
			helioviewerWebClient.drawerMoviesClick();

			$(document).trigger("enable-select-tool",
								[$.proxy(self._showMovieSettings, self),
								 $.proxy(self._cleanup, self)]);
		});

		// Setup hover and click handlers for movie history items
		$("#movie-history").on('click', '.history-entry', $.proxy(this._onMovieClick, this));
		$("#message-console").on('click', '.message-console-movie-ready', $.proxy(this._onMovieClick, this));
		$("#movie-history .history-entry").on('mouseover mouseout', $.proxy(this._onMovieHover, this));


		// Download completion notification link
		$(".message-console-movie-ready").on('click', function (event) {
			var movie = $(event.currentTarget).data('movie');
			self._createMoviePlayerDialog(movie);
		});

		// Update tooltip when movie is finished downloading
		$(document).bind("movie-ready", function (event, movie) {
			$("#" + self._type + "-" + movie.id).qtip("destroy");
			self._buildPreviewTooltip(movie);
			self._refresh();
		});

		// Upload form submission
		$("#youtube-video-info").submit(function () {
			self.submitVideoUploadForm();
			return false;
		});

		// Toggle advanced settings display
		$("#movie-settings-toggle-advanced").click(function () {
			// If help is visible, simply hide
			if (self._settingsHelp.is(":visible")) {
				self._settingsHelp.hide();
				self._settingsForm.show();
				return;
			}

			// Otherwise, toggle advanced settings visibility
			if (self._advancedSettings.is(":visible")) {
				self._advancedSettings.animate({"height": 0}, function () {
					self._advancedSettings.hide();
				});
			} else {
				self._advancedSettings.css('height', 0).show();
				self._advancedSettings.animate({"height": 85}, function () {
				});
			}
		});

		// Toggle help display
		$("#movie-settings-toggle-help").click(function () {
			self._settingsForm.toggle();
			self._settingsHelp.toggle();
		});
	},

	/**
	 * Initializes movie settings events
	 */
	_initSettings: function () {
		var length, lengthInput, duration, durationSelect,
			frameRateInput, settingsForm, self = this;

		duration = Math.round(Helioviewer.userSettings.get("options.movies.duration") / 2) * 1000;

		//Movie Generation time pickers
		$('#movie-start-date').flatpickr({
			allowInput: true,
			dateFormat: 'Y/m/d'
		});
		$('#movie-end-date').flatpickr({
			allowInput: true,
			dateFormat: 'Y/m/d'
		});
		if ($('#movie-start-date').length > 0) {
			$('#movie-start-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCDateString());
			$('#movie-end-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCDateString());
		}

		//TimePicker
		$('#movie-start-time').flatpickr({
			allowInput: true,
			noCalendar: true,
			enableTime: true,
			enableSeconds: true,
			time_24hr: true,
			minuteIncrement: 1,
			secondIncrement: 1,
		});
		$('#movie-end-time').flatpickr({
			allowInput: true,
			noCalendar: true,
			enableTime: true,
			enableSeconds: true,
			time_24hr: true,
			minuteIncrement: 1,
			secondIncrement: 1,
			theme:'dark'
		});
		if ($('#movie-start-time').length > 0) {
			$('#movie-start-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCTimeString());
			$('#movie-end-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCTimeString());
		}

		$(document).on('observation-time-changed', function(e){
			var duration = Math.round(Helioviewer.userSettings.get("options.movies.duration") / 2) * 1000;
			if ($('#movie-start-date').length > 0) {
				$('#movie-start-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCDateString());
				$('#movie-end-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCDateString());
				$('#movie-start-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCTimeString());
				$('#movie-end-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCTimeString());
			}
		});
		$(document).on('movies-setting-duration-trigger', function(e){
			var duration = Math.round(Helioviewer.userSettings.get("options.movies.duration") / 2) * 1000;
			if ($('#movie-start-date').length > 0) {
				$('#movie-start-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCDateString());
				$('#movie-end-date')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCDateString());
				$('#movie-start-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") - duration).toUTCTimeString());
				$('#movie-end-time')[0]._flatpickr.setDate(new Date(Helioviewer.userSettings.get("state.date") + duration).toUTCTimeString());
			}
		});

		// Advanced movie settings
		frameRateInput = $("#frame-rate");
		lengthInput = $("#movie-length");
		durationSelect = $("#movie-duration");

		// Speed method enable/disable
		$("#speed-method-f").change(function () {
			lengthInput.attr("disabled", true);
			frameRateInput.attr("disabled", false);
		}).attr("checked", "checked").change();

		$("#speed-method-l").change(function () {
			frameRateInput.attr("disabled", true);
			lengthInput.attr("disabled", false);
		});

		// Cancel button
		$("#movie-settings-cancel-btn").button().click(function (e) {
			self._advancedSettings.hide();
			self._settingsDialog.hide();
			self.show();
		});

		// More button
		$(".movie-settings-more-btn").click(function (e) {
			$('.movie-duration-box').hide();
			$('.movie-time-box').show();
			$('.movie-format-box').show();
			$('.movie-icon-box').show();
			$('.movie-follow-viewport-box').show();
			$('.movie-settings-more-btn').hide();
			$('.movie-settings-less-btn').show();
			Helioviewer.userSettings.set("options.movies.dialog", 'advanced');
		});

		// less button
		$(".movie-settings-less-btn").click(function (e) {
			$('.movie-time-box').hide();
			$('.movie-format-box').hide();
			$('.movie-icon-box').hide();
			$('.movie-follow-viewport-box').hide();
			$('.movie-duration-box').show();
			$('.movie-settings-less-btn').hide();
			$('.movie-settings-more-btn').show();
			Helioviewer.userSettings.set("options.movies.dialog", 'default');
		});

		// Duration event listener
		durationSelect.bind('change', function (e) {
			Helioviewer.userSettings.set("options.movies.duration",
			parseInt(this.value, 10));
			$(document).trigger('movies-setting-duration-trigger');
		});

		durationSelect.find("[value=" + Helioviewer.userSettings.get("options.movies.duration") + "]").attr("selected", "selected");

		// Reset to default values
		frameRateInput.val(15);
		lengthInput.val(20);


		// Submit button
		settingsForm = $("#movie-settings-form");

		$("#movie-settings-submit-btn").button().click(function (e) {
			// Validate and submit movie request
			try {
				var speedMethodVal = $('#speed-method-f').is(':checked') ? 'framerate' : 'length';
				var frameRateVal = $('#speed-method-f').is(':checked') ? $('#frame-rate').val() : $('#movie-length').val();
				var startTimeVal = $('#movie-start-date').val().replace(/\//g, '-') + 'T' + $('#movie-start-time').val() + '.000Z';
				var endTimeVal = $('#movie-end-date').val().replace(/\//g, '-') + 'T' + $('#movie-end-time').val() + '.000Z';
				var sizeVal = $('#movie-size').val();
				var durationVal = $('#movie-duration').val();
				var movieIcons = $('#movie-icons').is(':checked') ? 1 : 0;
				var followViewport = $('#follow-viewport').is(':checked') ? 1 : 0;

				var formSettings = [
					{name : 'speed-method', value : speedMethodVal},
					{name : 'framerate', value : frameRateVal},
					{name : 'startTime', value : startTimeVal},
					{name : 'endTime', value : endTimeVal},
					{name : 'size', value : sizeVal},
					{name : 'movie-icons', value : movieIcons},
					{name : 'followViewport', value : followViewport}
				];

				if(Helioviewer.userSettings.get("options.movies.dialog") !== 'advanced'){
					formSettings['size'] = 0;
				}

				self._buildMovieRequest(formSettings);
			} catch (ex) {
				// Display an error message if invalid values are specified
				// for movie settings
				self._settingsConsole.text(ex).fadeIn(1000, function () {
					setTimeout(function () {
						self._settingsConsole.text(ex).fadeOut(1000);
					}, 10000);
				});
			}
			return false;
		});
	},

	/**
	 * If the movie is ready, play the movie in a popup dialog. Otherwise do
	 * nothing.
	 */
	_onMovieClick: function (event) {
		var id, movie, dialog, action, dateRequested;

		if (event.target.hasOwnProperty('href') && event.target.href.indexOf("gl.helioviewer.org") != -1) {
			window.open(event.target.href, '_blank');
			return false;
		}

		id  = $(event.currentTarget).data('id');
		movie = this._manager.get(id);

		dateRequested = Date.parseUTCDate(movie.dateRequested);
		if((new Date) - dateRequested >= this._regenerateMovieThreshold * 24 * 60 * 60 * 1000 || movie.status === 3){
			this._rebuildItem(movie);
			return false;
		}

		if(helioviewerWebClient.keyboard.ctrlPressed){//ctrl + click to copy movie link
			// copy the link to the clipboard by creating a placeholder textinput
			var $temp = $('<input>');
			$('body').append($temp);
			$temp.val('http://' + document.domain + '/?movieId=' + movie.id).select();
			document.execCommand("copy");//perform copy
			$temp.remove();
		}else{
			// If the movie is ready, open movie player
			if (movie.status === 2) {
				dialog = $("#movie-player-" + id);
				// If the dialog has already been created, toggle display
				if (dialog.length > 0) {
					action = dialog.dialog('isOpen') ? "close" : "open";
					dialog.dialog(action);

				// Otherwise create and display the movie player dialog
				} else {
					this._createMoviePlayerDialog(movie);
				}
			}
		}

		return false;
	},

   /**
	* Shows movie details and preview.
	*/
	_onMovieHover: function (event) {
		if (event.type === 'mouseover') {
			//console.log('hover on');
		} else {
			//console.log('hover off');
		}
	},

	/**
	 * Creates HTML for a preview tooltip with a preview thumbnail,
	 * if available, and some basic information about the screenshot or movie
	 */
	_buildPreviewTooltipHTML: function (movie) {
		var width, height, thumbnail, html = "", dateRequested;

		dateRequested = Date.parseUTCDate(movie.dateRequested);

		if (movie.status === 2 && (new Date) - dateRequested <= 180 * 24 * 60 * 60 * 1000) {

			thumbnail = movie.thumbnail;

			html += "<div style='text-align: center;'>" +
				"<img src='" + thumbnail +
				"' width='95%' alt='preview thumbnail' /></div>";

			width  = movie.width;
			height = movie.height;
		} else {
			width  = Math.round(movie.x2 - movie.x1);
			height = Math.round(movie.y2 - movie.y1);

			if(typeof movie.size != 'undefined'){
				if(movie.size == 0){
					width = Math.round(width / movie.imageScale);
					height = Math.round(height / movie.imageScale);
				}else if(movie.size == 1){
					width = 1280;
					height = 720;
				}else if(movie.size == 2){
					width = 1920;
					height = 1080;
				}else if(movie.size == 3){
					width = 2560;
					height = 1440;
				}else if(movie.size == 4){
					width = 3840;
					height = 2160;
				}
			}else{
				width = Math.round(width / movie.imageScale);
				height = Math.round(height / movie.imageScale);
			}
		}

		html += "<table class='preview-tooltip'>" +
			"<tr><td><b>Start:</b></td><td>" + movie.startDate + "</td></tr>" +
			"<tr><td><b>End:</b></td><td>"   + movie.endDate   + "</td></tr>" +
			"<tr><td><b>Scale:</b></td><td>" + movie.imageScale.toFixed(2) +
			" arcsec/px</td></tr>" +
			"<tr><td><b>Dimensions:</b></td><td>" + width +
			"x" + height +
			" px</td></tr>" +
			"<tr><td><b><i>Control + Click</i>:</b></td><td><i>Copy Link to Movie</i></td></tr>" +
			"</table>";

		return html;
	},

	/**
	 * @description Opens a pop-up with the movie player in it.
	 */
	_createMoviePlayerDialog: async function (movie) {
		var dimensions, title, uploadURL, flvURL, swfURL, html, dialog,
			screenshot, callback, self = this;

		// Make sure dialog fits nicely inside the browser window
		dimensions = this.getVideoPlayerDimensions(movie.width, movie.height);

        html = await self.getVideoPlayerHTML(movie, dimensions.width, dimensions.height, Helioviewer.outputType);

		// Movie player dialog
		let htmlId = "movie-player-" + movie.id;
		dialog = $(
			"<div id='"+htmlId+"' " +
			"class='movie-player-dialog'></div>"
		);
		let reactApp = ReactDOM.createRoot(dialog[0]);
		reactApp.render(html);

		// Movie dialog title
		title = movie.name + " (" + movie.startDate + " - " +
				movie.endDate + " UTC)";

		// Have to append the video player here, otherwise adding it to the div
		// beforehand results in the browser attempting to download it.
		dialog.dialog({
			dialogClass: "movie-player-dialog-" + movie.id,
			title	: "Movie Player: " + title,
			width	: ((dimensions.width < 575)?600:dimensions.width+25),
			height  : dimensions.height + 90,
			resizable : $.support.h264 || $.support.vp8,
			close	: function () {
							reactApp.unmount();
							$(this).remove();
						},
			zIndex  : 9999,
			show	  : 'fade'
		});
	},

	/**
	 * Opens YouTube uploader either in a separate tab or in a dialog
	 */
	showYouTubeUploadDialog: function (movie) {
		var title, tags, url1, url2, description;

		// Suggested movie title
		title = movie.name + " (" + movie.startDate + " - " +
				movie.endDate + " UTC)";

		// Suggested YouTube tags
		tags = [];

		$.each(movie.layers.split("],["), function (i, layerStr) {
			//console.error('MovieManagerUI.showYouTubeUploadDialog() assumes 4-level hierarchy in layerStr');
			var parts = layerStr.replace(']', "").replace('[', "")
						.split(",").slice(0, 4);

			// Add observatories, instruments, detectors and measurements
			$.each(parts, function (i, item) {
				if ($.inArray(item, tags) === -1) {
					tags.push(item);
				}
			});
		});

		// URLs
		url1 = Helioviewer.api + "?action=playMovie&id=" + movie.id +
			   "&format=mp4&hq=true";
		url2 = Helioviewer.api + "?action=downloadMovie&id=" + movie.id +
			   "&format=mp4&hq=true";

		// Suggested Description
		description = "This movie was produced by Helioviewer.org. See the " +
					  "original at " + url1 + " or download a high-quality " +
					  "version from " + url2;

		// Update form defaults
		$("#youtube-title").val(title);
		$("#youtube-tags").val(tags);
		$("#youtube-desc").val(description);
		$("#youtube-movie-id").val(movie.id);

		// Hide movie dialogs (Flash player blocks upload form)
		$(".movie-player-dialog").dialog("close");

		// Open upload dialog
		$("#upload-dialog").dialog({
			"title" : "Upload video to YouTube",
			"width" : 550,
			"height": 500
		});
	},

	/**
	 * Processes form and submits video upload request to YouTube
	 */
	submitVideoUploadForm: function (event) {
		var params, successMsg, uploadDialog, url, form, loader, callback,
			self = this;

		// Validate and submit form
		try {
			this._validateVideoUploadForm();
		} catch (ex) {
			this._displayValidationErrorMsg(ex);
			return false;
		}

		// Clear any remaining error messages before continuing
		$("#upload-error-console").hide();

		form = $("#upload-form").hide();
		loader = $("#youtube-auth-loading-indicator").show();

		// Callback function
		callback = function (auth) {
			loader.hide();
			form.show();

			// Base URL
			url = Helioviewer.api + "?" + $("#youtube-video-info").serialize();

			// If the user has already authorized Helioviewer, upload the movie
			if (auth) {
				$.get(url, {"action": "uploadMovieToYouTube"},
					function (response) {
						if (response.error) {
							self.hide();
							$(document).trigger("message-console-warn",
												[response.error]);
						}
				}, "json");
			} else {
				// Otherwise open an authorization page in a new tab/window
				window.open(url + "&action=getYouTubeAuth", "_blank");
			}

			// Close the dialog
			$("#upload-dialog").dialog("close");
			return false;
		}

		// Check YouTube authorization
		$.ajax({
			url : Helioviewer.api + "?action=checkYouTubeAuth",
			dataType: Helioviewer.dataType,
			success: callback
		});
	},

	/**
	 * Displays an error message in the YouTube upload dialog
	 *
	 * @param string Error message
	 */
	_displayValidationErrorMsg: function (ex) {
		var errorConsole = $("#upload-error-console");

		errorConsole.html("<b>Error:</b> " + ex).fadeIn(function () {
			window.setTimeout(function () {
				errorConsole.fadeOut();
			}, 15000);
		});
	},

	/**
	 * Validates title, description and keyword fields for YouTube upload.
	 *
	 * @see http://code.google.com/apis/youtube/2.0/reference.html
	 *	#Media_RSS_elements_reference
	 */
	_validateVideoUploadForm: function () {
		var keywords		 = $("#youtube-tags").val(),
			keywordMinLength = 1,
			keywordMaxLength = 30;

		// Make sure the title field is not empty
		if ($("#youtube-title").val().length === 0) {
			throw "Please specify a title for the movie.";
		}

		// User must specify at least one keyword
		if (keywords.length === 0) {
			throw "You must specifiy at least one tag for your video.";
		}

		// Make sure each keywords are between 2 and 30 characters each
		$.each(keywords.split(","), function (i, keyword) {
			var len = $.trim(keyword).length;

			if (len > keywordMaxLength) {
				throw "YouTube tags must not be longer than " +
					  keywordMaxLength + " characters each.";
			} else if (len < keywordMinLength) {
				throw "YouTube tags must be at least " + keywordMinLength +
					  " characters each.";
			}
			return;
		});

		// < and > are not allowed in title, description or keywords
		$.each($("#youtube-video-info input[type='text'], " +
				 "#youtube-video-info textarea"), function (i, input) {
			if ($(input).val().match(/[<>]/)) {
				throw "< and > characters are not allowed";
			}
			return;
		});
	},

	/**
	 * Adds a movie to the history using it's id
	 */
	addMovieUsingId: function (id) {
		var callback, params, movie, self = this;

		callback = function (response) {
			if (response.status === 2) {
				movie = self._manager.add(
					id,
					response.duration,
					response.imageScale,
					response.layers,
					response.events,
					response.scale,
					response.scaleType,
					response.scaleX,
					response.scaleY,
					response.timestamp.replace(" ", "T") + ".000Z",
					response.startDate,
					response.endDate,
					response.frameRate,
					response.numFrames,
					response.x1,
					response.x2,
					response.y1,
					response.y2,
					response.width,
					response.height,
					response.thumbnails.small,
					response.url
				);

				self._addItem(movie);
				self._createMoviePlayerDialog(movie);
			}
		};

		params = {
			"action" : "getMovieStatus",
			"id"	 : id,
			"format" : self._manager.format,
			"verbose": true
		};
		$.get(Helioviewer.api, params)
		.done(callback)
		.fail((resp) => {
			console.error(resp.responseJSON);
			Helioviewer.messageConsole.error("Could not load movie, please try again later");
		});
	},

	/**
	 * Determines dimensions for which movie should be displayed
	 */
	getVideoPlayerDimensions: function (width, height) {
		var maxWidth	= $(window).width() * 0.80,
			maxHeight   = $(window).height() * 0.80,
			scaleFactor = Math.max(1, width / maxWidth, height / maxHeight);

		return {
			"width"  : Math.floor(width  / scaleFactor),
			"height" : Math.floor(height / scaleFactor)
		};
	},

	/**
	 * Decides how to display video and returns HTML corresponding to that
	 * method
	 */
	getVideoPlayerHTML: async function (movie, width, height, outputType) {
		// Initialize YouTube upload button
		let onYoutubeBtnClick = () => {this.showYouTubeUploadDialog(movie); return false;}
		return <VideoPlayer movie={movie} width={width} height={height} onClickYoutubeBtn={onYoutubeBtnClick} outputType={outputType}/>;
	},

	/**
	 * Decides how to display video and returns HTML corresponding to that
	 * method
	 */
	getK12VideoPlayerHTML: function (movie, width, height) {
		var downloadURL, downloadLink;

		// Download
		downloadURL = Helioviewer.api + "?action=downloadMovie&id=" + movie.id +
					  "&format=mp4&hq=true";

		downloadLink = "<div style='float:left;'><a target='_parent' href='" + downloadURL +
			"' title='Download high-quality video'>" +
			"<img style='width:93px; height:32px;' class='video-download-icon' " +
			"src='resources/images/download_93x32.png' /></a></div>";

		// HTML5 Video (H.264 or WebM)
		//if ($.support.vp8 || $.support.h264) {
			// Work-around: use relative paths to simplify debugging
			var url = movie.url.substr(movie.url.search("cache"));
			var fileNameIndex = url.lastIndexOf("/") + 1;
			var filename = url.substr(fileNameIndex);
			var filenameHQ = filename.replace('.mp4', '-hq.mp4');
			var filenameWebM = filename.replace('.mp4', '-.webm');
			var filePath = url.substring(0, url.lastIndexOf("/"));
			var autoplay = (Helioviewer.userSettings.get("options.movieautoplay") ? 'autoplay="autoplay"' : '');

			return '<style>.mejs-container .mejs-controls {bottom: -20px;}.mejs-container.mejs-container-fullscreen .mejs-controls{bottom: 0px;}</style>\
					<div>\
						<video id="movie-player-' + movie.id + '" width="'+(width - 15)+'" height="'+(height - 20)+'" poster="'+Helioviewer.serverSettings.rootURL+'/'+filePath+'/preview-full.png" controls="controls" preload="none" '+autoplay+'>\
							<source type="video/mp4" src="'+Helioviewer.serverSettings.rootURL+'/'+filePath+'/'+filenameHQ+'" />\
							<source type="video/webm" src="'+Helioviewer.serverSettings.rootURL+'/'+filePath+'/'+filenameWebM+'" />\
							<object width="'+width+'" height="'+(height - 20)+'" type="application/x-shockwave-flash" data="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf">\
								<param name="movie" value="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf" />\
								<param name="flashvars" value="controls=true&amp;poster='+Helioviewer.serverSettings.rootURL+'/'+filePath+'/preview-full.png&amp;file='+Helioviewer.serverSettings.rootURL+'/'+filePath+'/'+filename+'" />\
								<img src="'+Helioviewer.serverSettings.rootURL+'/'+filePath+'/preview-full.png" width="'+width+'" height="'+height+'" title="No video playback capabilities" />\
							</object>\
						</video>\
					</div>\
					<div style="width:100%;padding-top: 25px;">\
						<div style="float:left;" class="video-links">' + downloadLink +
						'</div>\
					</div>';
	},

	/**
	 * Refreshes status information for movies in the history
	 */
	_refresh: function () {
		var status, statusMsg, dateRequested;

		let regenThreshold = this._regenerateMovieThreshold;
		// Update the status information for each row in the history
		$.each(this._manager.toArray(), function (i, item) {
			status = $("#movie-" + item.id).find(".status");

			// For completed entries, display elapsed time
			if (item.status === 2) {
				dateRequested = Date.parseUTCDate(item.dateRequested);
				if((new Date) - dateRequested >= regenThreshold * 24 * 60 * 60 * 1000){
					statusMsg = '<span class="rebuild-item" data-id="'+item.id+'" title="Regenerate movie"> regenerate <span class="fa fa-refresh"></span></span>';
				}else{
					statusMsg = dateRequested.getElapsedTime();
				}
			// For failed movie requests, display an error
			} else if (item.status === 3) {
				statusMsg = '<span style="color:LightCoral;" class="rebuild-item" data-id="'+item.id+'">error</span>';
			// Otherwise show the item as processing
			} else if (item.status === 1) {
				statusMsg = '<span class="processing">processing '+item.progress+'%</span>';
			// Otherwise show the item as processing
			} else {
				statusMsg = '<span style="color:#f9a331">queued</span>';
			}
			status.html(statusMsg);
		});
	},

	/**
	 * Refreshes status information for movies in the history
	 */
	_rebuildItem: function (movie) {
		var callback, self = this, params = {};

		params = {
			'action': 'reQueueMovie',
			'id': movie.id,
			'force': true
		};

		// AJAX Responder
		let success = function (response) {
			var msg, waitTime;

			self._manager.update( movie.id, {'status':0, 'dateRequested':new Date().toISOString(), 'token': response.token});
			self._manager._monitorQueuedMovie(movie.id, new Date().toISOString(), response.token, 5);

			waitTime = humanReadableNumSeconds(response.eta);
			msg = "Your video is processing and will be available in " +
				  "approximately " + waitTime + ". You may view it at any " +
				  "time after it is ready by clicking the 'Movie' button";
			$(document).trigger("message-console-info", msg);
			self._refresh();
		};

		let failure = function(response) {
			let msg = null;
			if (response.responseJSON) {
				if (response.responseJSON.error) {
					if (response.responseJSON.errno === 40) {
						msg = response.responseJSON.error;
					} else {
						// other error
						msg = "we are unable to create a movie for the time you " +
							"requested. please select a different time range " +
							"and try again. ("+response.responseJSON.error+")";
					}
				}

				if (response.responseJSON.status_code) {
					msg = response.responseJSON.data;
				}

			}

			if (msg) {
				Helioviewer.messageConsole.error(msg);
			} else {
				Helioviewer.messageConsole.error("Could not rebuild your movie, Please try again later.");
			}

			console.error(msg);

		};
		// Make request
		$.get(Helioviewer.api, params, success, Helioviewer.dataType).fail(failure);
	},

	/**
	 * Validates the request and returns false if any of the requirements are
	 * not met
	 */
	_validateRequest: function (roi, layerString) {
		var layers, visibleLayers, message;

		layers = layerStringToLayerArray(layerString);
		visibleLayers = $.grep(layers, function (layer, i) {
			var parts = layer.split(",");
			return (parts[4] === "1" && parts[5] !== "0");
		});

		if (visibleLayers.length > 3) {
			message = "Movies cannot have more than three layers. " +
					  "Please hide/remove layers until there are no more " +
					  "than three layers visible.";

			$(document).trigger("message-console-warn", [message]);

			return false;
		}
		return this._super(roi, layerString);
	},

	_cleanup: function () {
		$.each(this._cleanupFunctions, function(i, func) {
			eval(func);
		});
	}
});

export { MovieManagerUI }

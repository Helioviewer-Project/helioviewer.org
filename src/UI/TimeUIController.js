/**
 * @fileOverview Contains the class definition for an TimeControls class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see Time
 *
 * TODO: Use highlight or similar effect on date and time input fields themselves when
 * invalid data is specified.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, window, Class */
"use strict";
var TimeUIController = Class.extend(
    /** @lends TimeUIController.prototype */
    {
    /**
     * @constructs
     * @description Creates a new TimeControl component
     * @param {Int} initialDate        Timestamp of the initial date to use
     * @param {Int}    increment       The initial amount of time to move forward or backwards, in seconds.
     * @param {String} dateId          The id of the date form field associated with the Time.
     * @param {String} timeId          The id of the time form field associated with the Time.
     * @param {String} incrementSelect The id of the HTML element for selecting the time increment
     * @param {String} backBtn         The id of the time "Back" button
     * @param {String} forwardBtn      The id of the time "Forward" button
     */
    init : function (timestamp, increment, dateInput, timeInput, incrementSelect, backBtn, forwardBtn) {
    	this._timeControls = new TimeControls(timestamp, increment, dateInput, timeInput, incrementSelect);
    	this._backButton 	= backBtn;
    	this._forwardButton = forwardBtn;
    	this._dateInput 	= dateInput;
    	this._timeInput 	= timeInput;
    	
        this._initEvents();
        this._initDatePicker();
    },
    
    /**
     * @descriptional Initialize date and Time-related events
     */
    _initEvents: function () {
        this._backButton.bind	('click', $.proxy(this._timeControls.timePrevious, this));
        this._forwardButton.bind('click', $.proxy(this._timeControls.timeNext, this));
        this._timeInput.bind('change', $.proxy(this._onTextFieldChange, this));
        this._dateInput.bind('change', $.proxy(this._onTextFieldChange, this));
        $("#timeNowBtn").click($.proxy(this.goToPresent, this));
    },
    
    /**
     * Initializes the observation time datepicker
     */
    _initDatePicker: function () {
        var btnId, btn, self = this;
        
        // Initialize datepicker
        this.cal = this._dateInput.datepicker({
            buttonImage    : 'resources/images/blackGlass/calendar_small.png',
            buttonImageOnly: true,
            buttonText     : "Select a date.",
            changeYear     : true,
            dateFormat     : 'yy/mm/dd',
            mandatory      : true,
            showOn         : 'button',
            yearRange      : '1993:2010',
            onSelect       : function (dateStr) {
                window.setTimeout(function () {
                    self._onTextFieldChange();
                }, 500);
            }
        });
        
        // Datepicker icon
        btnId = '#observation-controls .ui-datepicker-trigger';
        btn   = $(btnId);

        btn.hover(
            function () {
                this.src = "resources/images/blackGlass/calendar_small-hover.png";
            },
            function () {
                this.src = "resources/images/blackGlass/calendar_small.png";              
            }
        ).attr("title", "Select an observation date.")
         .click(function () {
                btn.qtip("hide");
            });
        
        // Tooltips
        $(document).trigger('create-tooltip', [btnId]);
    },
    
    /**
     * Updates form fields and let's other interested objects know about new time
     */
    _onDateChange: function () {
        this._updateInputFields();
        $(document).trigger("save-setting", ["date", this._date.getTime()])
                   .trigger("observation-time-changed", [this._date]);
    },
    
    /**
     * Handles changes to date and time text fields
     */
    _onTextFieldChange: function () {
        if (this._validateDate() && this._validateTime()) {
            this.setDate(this._timeFieldsToDateObj());
        }
        // IE8: Prevent default button click from being triggered
        return false;
    },
    
   /**
    * @description Time-incremenet change event handler
    * @param {Event} e Prototype Event Object
    */
    _onTimeIncrementChange: function (e) {
        this._timeIncrement = parseInt(e.target.value, 10);
        $(document).trigger("time-step-changed", [this._timeIncrement]);
    },
});

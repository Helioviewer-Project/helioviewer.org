/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class handles the management of all date and time related
 * components in Helioviewer including the input fields, datepicker, and time-forward and
 * backward buttons.
 * 
 * @see ui.datepicker.js, TimeControls
 * 
 * Syntax: jQuery
 */
/*global Class, Time, $, jQuery, window */
var Time = Class.create(
	/** @lends Time.prototype */
	{
	/**
	 * @description Creates a new Time. 
	 * @param {Object} controller Reference to the controller class (Helioviewer).
	 * @constructs 
	 */ 
    initialize: function (controller) {
        this.controller = controller;
		this._date = new Date(this.controller.userSettings.get('date'));
    },
    
    /**
     * @description Returns the current observation date as a JavaScript Date object
     */    
    getDate: function () {
        return this._date; 
    },
    
    /**
	 * @description Sets the desired viewing date and time.
	 * @param {Date} date A JavaScript Date object with the new time to use
	 */
	setDate: function (date) {
		this._date = date;
		var ts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		this.controller.userSettings.set('date', parseInt(ts, 10));
		this.controller.tileLayers.reloadLayers();
		this.controller.eventLayers.reloadLayers();
	},
    
    /**
     * @description Increments the current time by the specified number of seconds
     * @param {Integer} seconds
     */
    addSeconds: function (seconds) {
        return this._date.addSeconds(seconds);
    },
    
    /**
     * @description Returns a unix timestamp for the current observation time
     */
    getTime: function () {
        return this._date.getTime();  
    },
    
    /**
     * @description Gets an ISO 8601 string representation of the current observation time
     */
    toISOString: function () {
		// Work-around: In Firefox 3.1+, Date.toISOString() Returns single-quoted strings
		// http://code.google.com/p/datejs/issues/detail?id=54
        var isoString = this._date.toISOString();
		return ((navigator.userAgent.search(/3\.[1-9]/) !== -1) ?  isoString : isoString.slice(1, -1));
    },
    

    
    /**
     * @description Updates the observation date
     * @param {Object} dateStr
     */
    updateDate: function (dateStr) {
        var date, time, hours, minutes, seconds, utcDate;
        
        //Check to see if the input is a valid time
		if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}?/)) {
            date = Date.parse(dateStr);
            time = this.controller.timeControls.getTimeField();
            
            //Factor in time portion of timestamp
            hours = parseInt(time.substring(0, 2), 10);
            minutes = parseInt(time.substring(3, 5), 10);
            seconds = parseInt(time.substring(6, 8), 10);
            
            //Convert to UTC
            utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds));
            
            this.setDate(utcDate);
        }
        else
			this.controller.messageConsole.warn('Invalid date. Please enter a time in of form YYYY/MM/DD.');
    },

    
    /**
     * @description takes a string of the form "hh:mm:ss" and after validating it, sets the
     * new application time to it.
     * @param {String} time - The new time to use
     */
    updateTime: function (time) {
        var newTime, hours, mins, secs;
        
        //Check to see if the input is a valid time
		if (time.match(/^\d{2}:\d{2}:\d{2}?/)) {
            
			//Get the difference in times and add to this.date
			newTime = time.split(':');
			hours = parseInt(newTime[0], 10) - this._date.getUTCHours();
			mins  = parseInt(newTime[1], 10) - this._date.getUTCMinutes();
			secs  = parseInt(newTime[2], 10) - this._date.getUTCSeconds();

			this._date.addHours(hours);
			this._date.addMinutes(mins);
			this._date.addSeconds(secs);

			this.setDate(this._date);
		}
        else
			this.controller.messageConsole.warn('Invalid time. Please enter a time in of form HH:MM:SS.');
    }
});

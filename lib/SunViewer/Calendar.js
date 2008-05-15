/**
 * @fileoverview Contains the class definition for a popup calendar based
 * off of YUI's Calendar widget.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class Calendar Displays a popup calendar when a button is pressed, which
 *  can be used to navigate through time in HelioViewer. Uses the YUI <a href="http://developer.yahoo.com/yui/calendar/">Calendar</a>
 *  and <a href="http://developer.yahoo.com/yui/container/dialog/index.html">Dialog</a> widgets. The use of a floating dialog to hold
 *  the calendar is based off of <a href="http://developer.yahoo.com/yui/examples/calendar/calcontainer.html">an example</a> at the
 *  YUI docs. 
 */
 /*global document, Class, YAHOO, $, $A, Ajax, Debug */
var Calendar = Class.create();

Calendar.prototype = {
    /**
     * Calendar constructor
     * @constructor
     * @param {String} calId        The id of calendar container
     * @param {String} txtFieldId   The id of the text field where the date should be inputed.  
     * @param {String} btnId        The id of for the button which shows/hides the calendar.
     */
    initialize: function (calId, txtFieldId, btnId) {
        this.classId    = "Calendar";
        this.calId      = calId;
        this.btnId      = btnId;
        this.txtFieldId = txtFieldId;
        this.dialog     = null;
        this.calendar   = null;
        
        // Call the YUI Calendar constructor
        this.calendar = new YAHOO.widget.Calendar(this.calId, {
            iframe: false,
            hide_blank_weeks: true
        });
        
        // Configure and render calendar
        this.configureCalendar();
        this.createPopup();
        this.calendar.render();
        
        //Event-handlers
        document.monthChange.subscribe(this.onMonthChange, this, true);
        
        //Stylize month
        document.monthChange.fire(10, 2003);
    },
    
    /**
     * @method configureCalendar Sets up various parameters to the desired format
     */
    configureCalendar: function () {
        var cal = this.calendar;
        
        // Year Navigator
        var navConfig = {
            strings : {
                month: "Choose Month",
                year: "Enter Year",
                submit: "OK",
                cancel: "Cancel",
                invalidYear: "Please enter a valid year"
            },
            monthFormat: YAHOO.widget.Calendar.SHORT,
            initialFocus: "year"
        };
        
        cal.cfg.setProperty("navigator", navConfig);

        // Configure calendar to display dates in the form: YEAR-MONTH-DAY        
        cal.cfg.setProperty("MDY_DAY_POSITION", 3);
        cal.cfg.setProperty("MDY_MONTH_POSITION", 2);
        cal.cfg.setProperty("MDY_YEAR_POSITION", 1);
        
        cal.cfg.setProperty("MD_DAY_POSITION", 2);
        cal.cfg.setProperty("MD_MONTH_POSITION", 1);
        
        cal.cfg.setProperty("MY_YEAR_POSITION", 1);
        cal.cfg.setProperty("MY_MONTH_POSITION", 2);

        cal.cfg.setProperty("MY_LABEL_YEAR_POSITION", 1);
        cal.cfg.setProperty("MY_LABEL_MONTH_POSITION", 2);
        cal.cfg.setProperty("MY_LABEL_MONTH_SUFFIX",  "");
        cal.cfg.setProperty("MY_LABEL_YEAR_SUFFIX",  " ");
        
        // Initial date selection
        cal.cfg.setProperty("pagedate", "2003/10/5"); // should set dynamically...        
    },
     
    /**
     * createPopup Creates a dialog box/popup to display the calendar on demand
     */
    createPopup: function () {
        var calendar = this.calendar;
        
        //Create a floating dialog to hold the calendar
        this.dialog = new YAHOO.widget.Dialog("container", {
            context: [this.btnId, "tl", "bl"],
            zIndex: 3, //Assures that calendar will appear above the UI layer at all times
            
            //Set event handlers for calendar buttons. Prefill arguments using curry.
            buttons: [ {text: "Select", isDefault: true, handler: this.okHandler.bindAsEventListener(this)}, 
                       {text: "Cancel", handler: this.cancelHandler}],
            width: "16em",  // Sam Skin dialog needs to have a width defined (7*2em + 2*1em = 16em).
            draggable: false,
            close: true
        });
        
        var dialog = this.dialog;
        
        dialog.render();
        dialog.hide(); // Using dialog.hide() instead of visible:false is a workaround for an IE6/7 container known issue with border-collapse:collapse.

        this.calendar.renderEvent.subscribe(function () {
            // Tell Dialog it's contents have changed, Currently used by container for IE6/Safari2 to sync underlay size
            dialog.fireEvent("changeContent");
        });

        YAHOO.util.Event.on(this.btnId, "click", dialog.show, dialog, true);
    },
    
    /**
     * okHandler Called when user presses the "Ok" button.
     */
    okHandler: function () {
        var calendar = this.calendar;
        if (calendar.getSelectedDates().length > 0) {

            var selDate = calendar.getSelectedDates()[0];

            // Date string components
            var dStr = selDate.getDate();
            var mStr = selDate.getMonth() + 1;
            var yStr = selDate.getFullYear();
    
            // Set text-field to the new date
            var date = yStr + "/" + mStr + "/" + dStr;
            YAHOO.util.Dom.get(this.txtFieldId).value = date;
            
            // Fire an event to let the DataNavigator know
            document.observationDateChange.fire(date);

        } else {
            YAHOO.util.Dom.get(this.txtFieldId).value = "";
        }
        this.dialog.hide();
    },
    
    /**
     * cancelHandler Called when user pressed the "Cancel" button.
     */
    cancelHandler: function () {
        this.hide();
    },
    
    /**
     * @method onMonthChange (04-18-2008: in the works...)
     */
    onMonthChange: function (type, args) {
        // get date info
        var month = args[0];
        var year  = args[1];
        var instruments = [];
         
        //use a simple array to keep track of how many data sources are available for each day
        var dataSources = $A([]);
         
        //fill array
        for (var i = 1; i <= Date.getDaysInMonth(year, month) + 1; i++) {
            dataSources[i] = 0;
        }
        var instCount =   0;
         
        var closure = this;
         
        //what filters (-> instruments) are there current data for? For now, just set statically...
        var filters = $A(["EIT", "LAS"]);
        var trash;
         
        filters.each(function (inst) {
           //Find out which days have data available

            trash = new Ajax.Request('lib/HV_Database/DataAvailability.php', {
                method:      'get',
                asynchronous: false,
                parameters: {
                    'inst':  inst,
                    'month': month,
                    'year':  year      
                },
                onSuccess: function (transport) {
                    //closure.collection = closure.collection.concat(transport.responseJSON);
                    //Debug.output($A(transport.responseJSON).inspect());
                    instruments[inst] = transport.responseJSON;
                    instCount++;
                        
                    //TODO: Make this part dynamic!
					var highlight = closure.calendar.renderCellStyleHighlight1.bind();

                    if (inst === "LASCO") {
            	        highlight = closure.calendar.renderCellStyleHighlight2.bind();
                    }
                
                    for (var i = 1; i <= Date.getDaysInMonth(year, month) + 1; i++) {
                	    if (instruments[inst][i] !== null) {
                        	dataSources[i]++;
                                
                            //If data is available from multiple sources, highlight with color number 3
                            if (dataSources[i] > 1) {
                                closure.calendar.addRenderer(year + "/" + month + "/" + i, closure.calendar.renderCellStyleHighlight3);
                            }
                            else {
                                closure.calendar.addRenderer(year + "/" + month + "/" + i, highlight);
                            }
                        }
                    }

                    //}
 
                    //rendering twice would overwrite earlier properties
                    if (inst === "LAS") {
 	                   closure.calendar.render();
                    }
				},
                onFailure: function () {
                    Debug.output("Calendar.js: Ajax Request Failed!");
                }
            });
        });
    }
};
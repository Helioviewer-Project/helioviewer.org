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
 /*global document, Class, YAHOO, $ */
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
        this.calId      = calId;
        this.txtFieldId = txtFieldId;
        this.btnId      = btnId;
        this.createCalendar();
        
        //Event-handlers
        document.onMonthChange.subscribe (this.onMonthChange, this, true);
    },
     
    /**
     * createCalendar Creates a calendar using the parameters specified in the constructor.
     */
    createCalendar: function () {
        //var dialog, calendar;
        var dialog;
        
        //Year Navigator
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
        
        //Call the YUI Calendar constructor
        this.calendar = new YAHOO.widget.Calendar(this.calId, {
        	navigator: navConfig,
        	pagedate: "2003/10/5", // should set dynamically...
        	MDY_DAY_POSITION: 3,
			MDY_MONTH_POSITION: 2,
			MDY_YEAR_POSITION: 1,
			MY_MONTH_POSITION: 2,
			MY_YEAR_POSITION: 1,
            iframe: false,          // Turn iframe off, since container has iframe support.
            hide_blank_weeks: true  // Enable, to demonstrate how we handle changing height, using changeContent
        });
        
        var calendar = this.calendar;
        
        //Configure calendar to display dates in the form: YEAR-MONTH-DAY
		calendar.cfg.setProperty("MDY_DAY_POSITION", 3);
		calendar.cfg.setProperty("MDY_MONTH_POSITION", 2);
		calendar.cfg.setProperty("MDY_YEAR_POSITION", 1);
		
		calendar.cfg.setProperty("MD_DAY_POSITION", 2);
		calendar.cfg.setProperty("MD_MONTH_POSITION", 1);
		
		calendar.cfg.setProperty("MY_YEAR_POSITION", 1);
		calendar.cfg.setProperty("MY_MONTH_POSITION", 2);

		calendar.cfg.setProperty("MY_LABEL_YEAR_POSITION", 1);
		calendar.cfg.setProperty("MY_LABEL_MONTH_POSITION", 2);
		calendar.cfg.setProperty("MY_LABEL_MONTH_SUFFIX",  "");
		calendar.cfg.setProperty("MY_LABEL_YEAR_SUFFIX",  " "); 
		
		//Styling individual cells (test)
		//calendar.addRenderer("10/29", calendar.renderBodyCellRestricted); 
		//calendar.addRenderer("2003/10/1-2003/10/10", calendar.renderCellStyleHighlight1);
		//calendar.addRenderer("2003/10/7-2003/10/13", calendar.renderCellStyleHighlight2);
		
		//Apply the new settings and re-render the calendar
		//calendar.render();

        /**
         * okHandler Called when user presses the "Ok" button.
         */
        function okHandler(txtFieldId) {
            if (calendar.getSelectedDates().length > 0) {
    
                var selDate = calendar.getSelectedDates()[0];
    
                // Date string components
                var dStr = selDate.getDate();
                var mStr = selDate.getMonth() + 1;
                var yStr = selDate.getFullYear();
        
                // Set text-field to the new date
                var date = yStr + "/" + mStr + "/" + dStr;
                YAHOO.util.Dom.get(txtFieldId).value = date;
                
                // Fire an event to let the DataNavigator know
                document.observationDateChange.fire(date);

            } else {
                YAHOO.util.Dom.get(txtFieldId).value = "";
            }
            this.hide();
        }
       
        /**
         * cancelHandler Called when user pressed the "Cancel" button.
         */
        function cancelHandler() {
            this.hide();
        }

        //Create a floating dialog to hold the calendar
        dialog = new YAHOO.widget.Dialog("container", {
            context: [this.btnId, "tl", "bl"],
            zIndex: 3, //Assures that calendar will appear above the UI layer at all times
            
            //Set event handlers for calendar buttons. Prefill arguments using curry.
            buttons: [ {text: "Select", isDefault: true, handler: okHandler.curry(this.txtFieldId)}, 
                      {text: "Cancel", handler: cancelHandler}],
            width: "16em",  // Sam Skin dialog needs to have a width defined (7*2em + 2*1em = 16em).
            draggable: false,
            close: true
        });
        this.calendar.render();
        dialog.render();

        // Using dialog.hide() instead of visible:false is a workaround for an IE6/7 container known issue with border-collapse:collapse.
        dialog.hide();

        this.calendar.renderEvent.subscribe(function () {
            // Tell Dialog it's contents have changed, Currently used by container for IE6/Safari2 to sync underlay size
            dialog.fireEvent("changeContent");
        });

        YAHOO.util.Event.on(this.btnId, "click", dialog.show, dialog, true);
    },
    /*
     * @function setDate
     */
    setDate: function () {

    },
    
    /**
     * @method onMonthChange
     */
     onMonthChange: function (type, args) {
         // get date info
         var month = args[0];
         var year  = args[1];
         var instruments = [];
         
         //use a simple array to keep track of how many data sources are available for each day
         var dataSources = $A([]);
         
         //fill array
         for (var i = 1; i <= Date.getDaysInMonth(year, month) +1; i++) {
             dataSources[i] = 0;
         }
         var instCount =   0;
         
         var closure = this;
         
         //what filters (-> instruments) are there current data for? For now, just set statically...
         var filters = $A(["EIT", "LAS"]);
         var trash;
         
         filters.each (function(inst) {
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
                        if (inst == "EIT") {
                            var highlight = closure.calendar.renderCellStyleHighlight1.bind();
                        }
                        if (inst == "LAS") {
                            var highlight = closure.calendar.renderCellStyleHighlight2.bind();
                        }
                        
                        for (var i = 1; i <= Date.getDaysInMonth(year, month) + 1; i++) {
                            if (instruments[inst][i] != null) {
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
                            Debug.output("render();");
                        }
                        
                },
                onFailure: function () {
                    Debug.output("Calendar.js: Ajax Request Failed!");
                }
            });
         });
     }
};
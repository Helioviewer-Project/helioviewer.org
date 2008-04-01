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
 * 
 *  last updated: 03/07/2008
 */
var Calendar = Class.create();

Calendar.prototype = {
    /**
     * Calendar constructor
     * @constructor
     * @param {String} calId        The id of calendar container
     * @param {String} txtFieldId   The id of the text field where the date should be inputed.  
     * @param {String} btnId        The id of for the button which shows/hides the calendar.
     */
    initialize: function(calId, txtFieldId, btnId) {
         this.calId      = calId;
         this.txtFieldId = txtFieldId;
         this.btnId      = btnId;
         this.createCalendar();

         //Configure initial value for the date input text field
         $(this.txtFieldId).value = (GLOBAL_TIME_YEAR + "/" + GLOBAL_TIME_MONTH + "/" + GLOBAL_TIME_DAY);
     },
     
    /**
     * createCalendar Creates a calendar using the parameters specified in the constructor.
     */
    createCalendar: function() {
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
            	navigator:navConfig,
            	//pagedate: "2003/10/4", //GLOBAL_TIME_YEAR + "/" + GLOBAL_TIME_MONTH + "/" + GLOBAL_TIME_DAY,
            	pagedate: GLOBAL_TIME_YEAR + "/" + GLOBAL_TIME_MONTH + "/" + GLOBAL_TIME_DAY,
            	MDY_DAY_POSITION:3,
    			MDY_MONTH_POSITION:2,
    			MDY_YEAR_POSITION:1,
    			MY_MONTH_POSITION:2,
    			MY_YEAR_POSITION:1,
                iframe:false,          // Turn iframe off, since container has iframe support.
                hide_blank_weeks:true  // Enable, to demonstrate how we handle changing height, using changeContent
            });
            
            calendar = this.calendar;
            
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
    		calendar.addRenderer("3/29", calendar.renderBodyCellRestricted); 
    		calendar.addRenderer("2008/3/1-2008/3/10", calendar.renderCellStyleHighlight1);
    		
    		//Apply the new settings and re-render the calendar
    		calendar.render();

            /**
             * okHandler Called when user presses the "Ok" button.
             */
            function okHandler(txtFieldId) {
                if (calendar.getSelectedDates().length > 0) {
        
                    var selDate = calendar.getSelectedDates()[0];
        
                    //Pretty Date Output, using Calendar's Locale values: Friday, 8 February 2008
                    //var wStr = calendar.cfg.getProperty("WEEKDAYS_LONG")[selDate.getDay()];
                    var dStr = selDate.getDate();
                    var mStr = selDate.getMonth() +1;
                    var yStr = selDate.getFullYear();
            
                    //YAHOO.util.Dom.get(txtFieldId).value = wStr + ", " + dStr + " " + mStr + " " + yStr;
                    YAHOO.util.Dom.get(txtFieldId).value = yStr + "/" + mStr + "/" + dStr;

                    //Sync with initial date set by SelectByDateMenu (not implemented yet...)
                } else {
                    YAHOO.util.Dom.get(txtFieldId).value = "";
                }
                this.hide();
                
                //Load first image for the selected day...
                
            }
           
            /**
             * cancelHandler Called when user pressed the "Cancel" button.
             */
            function cancelHandler() {
                this.hide();
            }
    
            //Create a floating dialog to hold the calendar
            dialog = new YAHOO.widget.Dialog("container", {
                context:[this.btnId, "tl", "bl"],
                zIndex:3, //Assures that calendar will appear above the UI layer at all times
                
                //Set event handlers for calendar buttons. Prefill arguments using curry.
                buttons:[ {text:"Select", isDefault:true, handler: okHandler.curry(this.txtFieldId)}, 
                          {text:"Cancel", handler: cancelHandler}],
                width:"16em",  // Sam Skin dialog needs to have a width defined (7*2em + 2*1em = 16em).
                draggable:false,
                close:true
            });
            this.calendar.render();
            dialog.render();
    
            // Using dialog.hide() instead of visible:false is a workaround for an IE6/7 container known issue with border-collapse:collapse.
            dialog.hide();
    
            this.calendar.renderEvent.subscribe(function() {
                // Tell Dialog it's contents have changed, Currently used by container for IE6/Safari2 to sync underlay size
                dialog.fireEvent("changeContent");
            });
    
            YAHOO.util.Event.on(this.btnId, "click", dialog.show, dialog, true);
    },
    /*
     * @function setDate
     */
    setDate: function() {

    }
};
/**
 * @fileoverview Contains the class definition for a class which handles navigating through the different dimensions
 *               of the available data sources.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class DataNavigator
 * 
 */
 /*global document, window, Event, UIElement, Class, Hash, $, $A, Effect */
var DataNavigator = Class.create(UIElement, {
    /**
     * DataNavigator Constructor
     * @constructor
     * 
     * @param {Helioviewer} A reference to the controller
     * @param {Hash} The initial time increment in seconds
     * @param {String} The id of the time navigation back button
     * @param {String} The id of the time navigation forward button
     */
    initialize: function (controller) {
        // Set-up initial date
        this.controller = controller;
        
        // Cache all data queried in an hash
        this.data = new Hash();
    },
    
    /**
     * @method query
     * queries and caches information about available data
     */
    query: function (type) {
        var url = 'get' + type + '.php';
        var self = this;
        var xhr = new Ajax.Request(url, {
            parameters: {
                type: 'json'
            },
            method: 'get',
            onComplete: function (transport) {
                self.data.set(type, transport.responseJSON);
            }
        });
    }     

});
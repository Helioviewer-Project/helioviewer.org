/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class extends the base Simile Timeline
 * @see http://code.google.com/p/simile-widgets/
 */
/*global Class, $, EventTimeline, Timeline, window */
var EventTimeline = Class.extend(
    /** @lends EventTimeline.prototype */
    {
    /**
     * @description Creates a new EventTimeline. 
     * @param {Object} controller Reference to the controller class (Helioviewer).
     * @param {String} container The ID for the timeline's container.
     * @constructs 
     */ 
    init: function (controller, container) {
        this.controller = controller;
        this.container  = container;
        this.resizeTimerID = null;
        
        this.eventSource = new Timeline.DefaultEventSource();
        var bandInfos = [
            Timeline.createBandInfo({
                eventSource:    this.eventSource,
                width:          "70%", 
                intervalUnit:   Timeline.DateTime.MONTH, 
                intervalPixels: 100
            }),
            Timeline.createBandInfo({
                eventSource:    this.eventSource,
                width:          "30%", 
                intervalUnit:   Timeline.DateTime.YEAR, 
                intervalPixels: 200
            })
        ],
        self = this;
        
        bandInfos[1].syncWith = 0;
        bandInfos[1].highlight = true;
        this.timeline = Timeline.create($(this.container), bandInfos);
        this.timeline.loadJSON("http://localhost/dev/test.json", function (json, url) {
            self.eventSource.loadJSON(json, url);
        });
    },

    /**
     * @description Event-hanlder for window resize
     */
    resize: function () {
        if (this.resizeTimerID === null) {
            this.resizeTimerID = window.setTimeout(function () {
                this.resizeTimerID = null;
                this.timeline.layout();
            }, 500);
        }
    }    
});
/**
 * Helioviewer.org Visual Glossary
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, Class, helioviewer*/
"use strict"; 
var VisualGlossary = Class.extend(
    /** @lends VisualGlossary.prototype */
    {
    /**
     * Visual glossary constructor 
     * @constructs 
     */ 
    init: function (setupDialog) {
        // Settings dialog
        setupDialog("#helioviewer-glossary", "#glossary-dialog", {
            "title": "Helioviewer - Glossary",
            "width": 800,
            "height": $(document).height() * 0.8,
            "create": this._loadVideos
        });
    },
    
    /**
     * Loads video elements using stored metadata
     */
    _loadVideos: function(evt) {
        var videos = {
            "v4s15": "http://helioviewer.org/cache/movies/2011/11/03/v4s15/2011_10_31_15_21_56_2011_11_01_15_09_08_AIA_304__LASCO_C3__LASCO_C2",
            "dQD15": "http://helioviewer.org/cache/movies/2011/09/30/dQD15/2011_09_24_08_13_14_2011_09_24_11_12_38_AIA_94.mp4"
        }
        
        //$.each(videos, function (id, url) {
        //    $("#" + id).html(helioviewer._movieManagerUI.getVideoPlayerHTML(id, 450, 360, url + ".mp4"));            
        //});
    }
});
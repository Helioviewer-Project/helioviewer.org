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
        setupDialog("#help-links-glossary", "#glossary-dialog", {
            "title": "Helioviewer - Glossary",
            "width": 800,
            "height": $(document).height() * 0.8
        }, $.proxy(this._onLoad, this));
    },
    
    /**
     * Setup event handlers
     */
    _onLoad: function (evt) {
        var self = this;
        
        // Category buttons
        this.btns = $('#glossary-menu .text-btn');
        
        // Glossary entries
        this.entries = $("#glossary-contents tr");
        
        // Highlight both text and icons for text buttons
        $("#glossary-menu .text-btn").hover(
            function () {
                $(this).find(".ui-icon").addClass("ui-icon-hover");
            },
            function () {
                $(this).find(".ui-icon").removeClass("ui-icon-hover");
            }
        );
        
        // On select
        this.btns.click(function (e) {
            self.btns.removeClass("selected");
            self.btns.find('.ui-icon').removeClass('ui-icon-bullet').addClass('ui-icon-radio-on');
            $(this).addClass("selected").find('.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-bullet');

            self._showCategory(this.id.split("-").pop());
        });

        // Show basic entries
        this._showCategory("basic");
    },
    
    /**
     * On category select
     */
    _showCategory: function (category) {
        this.entries.hide();

        if (category === "all") {
            this.entries.show();
        } else {
            this.entries.filter(".g-" + category).show();    
        }
    }
});
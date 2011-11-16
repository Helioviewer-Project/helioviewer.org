/**
 * Manages metadata tags for the page.
 * 
 * In order to provide the most relevant title, description, etc when
 * a user shares a Helioviewer.org page or movie link, the OpenGraph metadata 
 * tags for the page are adjusted to in real-time to reflect the state 
 * of the application.
 * 
 * @see http://ogp.me/
 * @see https://www.addthis.com/help/widget-sharing
 * 
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, 
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Class, Helioviewer, helioviewer */
"use strict";
var MetaDataManager = Class.extend(
    /** @lends MetaDataManager */
    {
    /**
     * @constructs
     * Creates a new MetaDataManager instance
     */    
    init: function () {
        this._$title = $("meta[property='og:title']");
        this._$desc  = $("meta[property='og:description']");
        this._$image = $("meta[property='og:image']");
    },
    
    /**
     * Sets the title, description and image metatags
     * 
     * @param string title Title metatag
     * @param string desc  Description metatag
     * @param string image Image thumbnail metatag
     */
    setMetaTags: function (title, desc, image) {
        this._$title.attr('content', title);
        this._$title.attr('content', desc);
        this._$title.attr('content', image);
    },
    
    /**
     * Set video-specific metadata tags
     */
    setVideoMetaTags: function (title, url, width, height) {

    },
    
    /**
     * Reverts to the default values for the metatags
     */
    reset: function () {
        this._$title.attr('content', "Helioviewer.org");
        this._$title.attr('content', "Solar and heliospheric image visualization tool.");
        this._$title.attr('content', "http://helioviewer.org/resources/images/logos/hvlogo1s_transparent.png");
    }
    
    
    /**
     *     <meta property="og:video" content="http://www.youtube.com/v/1F7DKyFt5pY&fs=1" />
    <meta property="og:video:width" content="560" />
    <meta property="og:video:height" content="340" />
    <meta property="og:video:type" content="application/x-shockwave-flash" />
     * 
     */
});
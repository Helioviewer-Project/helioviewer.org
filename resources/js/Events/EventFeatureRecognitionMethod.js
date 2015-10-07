/**
 * EventFeatureRecognitionMethod Class Definition
 *
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, EventMarker */

"use strict";

var EventFeatureRecognitionMethod = Class.extend({

    init: function (name, eventGlossary) {
        this._events  = [];
        this._name    = name;
        this._visible = false;
        this.eventGlossary = eventGlossary;
    },

    getName: function () {
        return this._name;
    },

    setDomNode: function (domNode) {
        this.domNode = domNode;
    }
});

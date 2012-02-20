/**
 * @fileOverview "Abstract" Layer class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class */
"use strict";
var Layer = Class.extend(
    /** @lends Layer.prototype */
    {
    visible: true,

    /**
     * @constructs
     * @description Creates a new Layer
     * @param {Object} viewport Viewport to place the layer in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *        <b>visible</b> - The default layer visibility<br>
     * </div>
     */
    init: function () {
        this.dimensions = {
            "left"  : 0,
            "top"   : 0,
            "bottom": 0,
            "right" : 0
        };
    },

    /**
     * @description Sets the Layer's visibility
     * @param {Boolean} visible Hide/Show layer 
     * @returns {Boolean} Returns new setting
     */
    setVisibility: function (visible) {
        this.visible = visible;
        if (visible) {
            this.domNode.show();
        }
        else {
            this.domNode.hide();
        }
        
        return this.visible;
    },

    /**
     * @description Toggle layer visibility
     */
    toggleVisibility: function () {
        return this.setVisibility(!this.visible);
    }
});
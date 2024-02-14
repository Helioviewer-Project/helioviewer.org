/**
 * @fileOverview Contains the class definition for the Sandbox class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window */
"use strict";
var SandboxHelper = Class.extend(
    /** @lends Sandbox.prototype */
    {
    init: function (x, y) {
        this.domNode = $("#sandbox");
        this.movingContainer = $("#moving-container");
        this.domNode.css({"left": x, "top": y});
    },

    /**
     * Find the center of the sandbox and put the movingContainer there
     */
    center: function () {
        let center = this.getCenter();
        this.moveContainerTo(center.x, center.y);
    },

    centerWithOffset: function (x, y) {
        let center = this.getCenter();
        this.moveContainerTo(center.x + x, center.y + y);
    },

    /**
     * Find the center of the sandbox
     */
    getCenter: function () {
        return {
            x: 0.5 * this.domNode.width(),
            y: 0.5 * this.domNode.height()
        };
    },

    /**
     * Called when the viewport has moved or resized. Calculates the difference
     * between current sandbox's size and position and desired sandbox size,
     * and updates the css accordingly. Also repositions the movingContainer.
     */
    updateSandbox: function (viewportCenter, desiredSandboxSize) {
        //Get ViewPort size offset
        let heightOffset = $(window).height();
        let widthOffset = $(window).width();

        // Get moving container position on screen
        let mc_pos = this.movingContainer[0].getBoundingClientRect();

        // Update sandbox dimensions
        this.domNode.css({
            width  : (desiredSandboxSize.width + widthOffset)  + 'px',
            height : (desiredSandboxSize.height + heightOffset) + 'px',
            left   : (viewportCenter.x - ( widthOffset * 0.5 ) ) - (0.5 * desiredSandboxSize.width) + 'px',
            top    : (viewportCenter.y - ( heightOffset * 0.5 ) ) - (0.5 * desiredSandboxSize.height) + 'px'
        });

        // Get new container position after changing the sandbox size
        let mc_shift = this.movingContainer[0].getBoundingClientRect();

        // Get the delta needed to put the moving container back where it was.
        let dt = {
            left: mc_pos.x - mc_shift.x,
            top: mc_pos.y - mc_shift.y
        };

        // Add the delta to the current coordinates. This should put it back
        // to where it appeared to be on screen.
        let new_pos = {
            left: parseFloat(this.movingContainer.css("left")) + dt.left,
            top: parseFloat(this.movingContainer.css("top")) + dt.top
        };

        this.moveContainerTo(new_pos.left, new_pos.top);
    },

    moveContainerTo: function (x, y) {
        this.movingContainer.css({left: x, top: y});
    }
});
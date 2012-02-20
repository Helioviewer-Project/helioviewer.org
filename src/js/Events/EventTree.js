/**
 * @author Jonathan Harper
 * @fileOverview TO BE ADDED
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventTree = Class.extend({
	
    init: function (data, controller) {
        this._build(data);
        this.controller = controller;
    },
    
    destroy: function (data) {
        $("#eventAccordion").unbind();
    },
    
	reload: function (newData) {
	    this.destroy();
	    this._build(newData);
	},
    
    _build: function (treeData) {
        var self = this, tree;
        $("#eventAccordion").jstree({
            json_data : { data: treeData },
            themes : { theme: "default", dots : true },
            plugins : [ "crrm", "json_data", "themes", "ui", "checkbox" ]
        });

        $("#eventAccordion").bind("jstree.change_state", $.proxy(this._treeChangedState, this));
	},
	
    _treeChangedState: function (event, data) {
        var nodeChanged, self = this;
        nodeChanged = $(data.args[0]).parent().parent();
        this.controller.query(nodeChanged.attr("type"), nodeChanged.attr("name"));
    }
});

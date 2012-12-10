/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Contains the definition for a Hierarchical or "Tree Select" class which links
 * several select form elements together based off a given tree structure such changes at any level automatically
 * determine valid options for select items at lower levels.
 */
/*jslint browser: true, evil: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, forin: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */
"use strict";
var TreeSelect = Class.extend(
    /** @lends TreeSelect.prototype */
    {
    /**
     * @description
     * @param {Object} 
     * @constructs 
     */ 
    init: function (selectIds, tree, initialChoices, callback) {
        this.selectIds  = selectIds;
        this.tree       = tree;
        this.height     = selectIds.length;
        this.callback   = callback;
        this.selected   = initialChoices;
        
        this._initSelectMenus();
        
        this._setupEventHandlers();
    },
    
    /**
     * @description Populates SELECT menus and selects initial choices
     */
    _initSelectMenus: function () {
        var self = this;
        
        // Load initial options into select menus
        this._updateSelectMenus(0);
        
        // Set initial choices in select menus
        $.each(this.selectIds, function (depth, id) {
            $(id + " > option").each(function (index, option) {
                if (option.value === self.selected[depth]) {
                    $(id).prop("selectedIndex", index);     
                }
            });
        });
    },
    
    /**
     * @description Update the list of selected options
     * @param {Object} depth
     * @param {Object} newChoice
     */
    _updateSelected: function (depth, newChoice) {
        var nav, selectField, i;
        
        this.selected[depth] = newChoice;
        
        // Function to determine which field should be selected
        selectField = function (original, arr) {
            if (original in arr) {
                return original;
            }
            for (var item in arr) {
                return item;
            }
        };
        
        // For each item below the selected parameter, preserve the value if
        // possible, otherwise use first available value
        nav = "this.tree";
        for (i = 0; i < this.height; i += 1) {
            if (i > depth) {
                this.selected[i] = selectField(this.selected[i], eval(nav));
            }
            nav += '["' + this.selected[i] + '"]';
        }
        
        this._updateSelectMenus(depth + 1);
    },

    /**
     * @description Updates the SELECT menus to show valid choices at
     *              each level based on chosen values from above levels.
     * @param {Object} startDepth
     */
    _updateSelectMenus: function (startDepth) {
        var select, choice, i, nav, opt, self = this;
        
        $.each(this.selectIds, function (depth, id) {
            if (depth >= startDepth) {
                select = $(id);
                
                // remove old choices
                select.empty();
                
                // navigate to current depth
                nav = "self.tree";
                for (i = 0; i < depth; i += 1) {
                    nav += '["' + self.selected[i] + '"]';
                }
                
                // get choices
                for (var choice in eval(nav)) {
                    opt = $("<option value='" + choice + "'>" + 
                          choice.replace(/_/, "-") + "</option>");
                    select.append(opt);
                }
                
                // set selected value
                choice = self.selected[depth];
                // escape any periods ('.') before using in a JQuery selector
                choice = choice.replace('.','\\.');
                select.find("option[value=" + choice + "]").prop("selected", true);
            }
        });
    },
    
    /**
     * @description Returns the value associated with the currently selected leaf-node
     */
    _value: function () {
        var nav = "this.tree";
        $.each(this.selected, function (i, choice) {
            nav += '["' + choice + '"]';
        });
        
        return eval(nav);
    },
    
    /**
     * @description Sets up event-handlers for each form field
     */
    _setupEventHandlers: function () {
        var self = this;
        
        $.each(this.selectIds, function (i, id) {
            $(id).change(function (e) {
                self._updateSelected(i, this.value);
                self.callback(self._value());
            });
        });
    }

});

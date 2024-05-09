/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
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
        this.selectIds     = selectIds;
        this.tree          = tree;
        this.callback      = callback;
        this.selected      = initialChoices;

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
                    $(id).attr("selectedIndex", index);
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
        selectField = function (original, arr, depth) {
            if (original == null) {
                for (var item in arr) {
                    if (item == 'sourceId') {
                        item = null;
                    }
                    return item;
                }
            }
            else if (typeof arr == 'undefined' ||
                     typeof arr == 'number') {

                return null;
            }
            else if (original in arr) {
                return original;
            }
            for (var item in arr) {
                return item;
            }
        };

        // For each item below the selected parameter, preserve the value if
        // possible, otherwise use first available value
        nav = "this.tree";

        for (i = 0; i < this.selectIds.length; i += 1) {
            if (i > depth) {
                this.selected[i] = selectField(this.selected[i], eval(nav), depth);
            }
            if ( typeof this.selected[i] != 'undefined' ) {
                nav += '["' + this.selected[i] + '"]';
            }
        }

        this._updateSelectMenus(depth + 1);
    },

    /**
     * @description Updates the <SELECT> menus to show valid choices at
     *              each level based on chosen values from above levels.
     * @param {Object} startDepth
     */
    _updateSelectMenus: function (startDepth) {
        var select, name, label, uiLabels, maxIndex, i, nav, opt, self = this;

        maxIndex = this.selectIds.length;
        console.log(this.selectIds);
        console.log(this.selected);

        $.each(this.selectIds, function (depth, id) {

            if (depth >= startDepth) {
                select = $(id);

                // remove old choices
                select.empty();

                // navigate to current depth
                nav = "self.tree";
                for (i = 0; i < depth; i += 1) {
                    if ( self.selected[i] === null ) {
                        break;
                    }
                    nav += '["' + self.selected[i] + '"]';
                }

                label = $(id.replace('-select-','-label-'));

                console.log(nav);
                if ( depth > maxIndex ) {
                    select.hide();
                    select.removeAttr('selectedIndex');
                    label.hide();
                    label.empty();
                }
                else if ( 'sourceId' in eval(nav) ) {
                    // Reached the end of the hierarchy
                    // Clear extra popup-menus
                    select.hide();
                    select.removeAttr('selectedIndex');
                    label.hide();
                    label.empty();

                    // Refresh non-hidden labels
                    uiLabels = eval(nav+"['uiLabels']");
                    $.each( uiLabels, function (i, obj) {
                        label = $(self.selectIds[i]
                                      .replace('-select-','-label-'));
                        label.html(obj['label']+':');
                    });

                    maxIndex = depth;
                }
                else {
                    // get choices
                    for (var choice in eval(nav)) {
                        opt = $("<option value='" + choice + "'>" +
                              choice.replace(/_/, "-") + "</option>");
                        select.append(opt);

                    }

                    // set selected value
                    name  = self.selected[depth];
                    if ( name !== null ) {
                        // escape any periods ('.') before using in a
                        // JQuery selector
                        name = name.replace('.','\\.');
                        select.find("option[value="+name+"]")
                              .attr("selected", true);
                    }
                    else {
                        select.find('option:first-child')
                              .attr("selected", true);
                        select.attr('selectedIndex',0);
                    }

                    label.show();
                    select.show();
                }
            }
        });
    },

    /**
     * @description Returns the value associated with the currently
     * selected leaf-node
     */
    _value: function () {
        var nav = "this.tree";

        $.each(this.selected, function (i, choice) {
            if ( choice === null || choice == 'sourceId' ) {
                return false;  // break out of $.each loop early
            }
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
                if ( $(this).val() != '' ) {
                    self._updateSelected(i, $(this).val());
                    self.callback(self._value());
                }
            });
        });
    }

});

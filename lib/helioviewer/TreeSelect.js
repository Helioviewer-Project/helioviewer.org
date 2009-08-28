/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview 
 * 
 * syntax: jQuery (x)
 */
/*global Class, TreeSelect, $, jQuery, window */
var TreeSelect = Class.create(
	/** @lends TreeSelect.prototype */
	{
	/**
	 * @description
	 * @param {Object} 
	 * @constructs 
	 */ 
    initialize: function(selectIds, tree, callback, initialChoices) {
    	this.selectIds  = selectIds;
    	this.tree       = tree;
        this.height     = selectIds.length;
    	this.callback   = callback;
        this.selected   = initialChoices;
    	
    	this._updateSelectMenus();
        
        this._setupEventHandlers();
    },
    
    /**
     * @description Update the list of selected options
     * @param {Object} depth
     * @param {Object} newChoice
     */
    _updateSelected: function (depth, newChoice) {
        var nav, getFirstItem, self = this;
        
        this.selected[depth] = newChoice;
        
        // Function to get the first item in an array
        getFirstItem = function (arr) {
            for (var item in arr)
            	return item;
        };
        
        // For each item below the selected parameter, use first available value
        nav = "this.tree";
        for (i = 0; i < this.height; i++) {
            if (i > depth) {
                this.selected[i] = getFirstItem(eval(nav));
            }
            nav += '["' + this.selected[i] + '"]';
        }
        
        this._updateSelectMenus(depth + 1);
    },

    /**
     * @description Updates the SELECT menus to show valid choices at each level based on chosen values from above levels.
     * @param {Object} startDepth
     */
	_updateSelectMenus: function(startDepth) {
		var select, self = this;
        
        if (typeof(startDepth) === "undefined")
            startDepth = 0;
        
		$.each(this.selectIds, function (depth, id) {
            if (depth >= startDepth) {
                //console.log(id);
                select = $(id);
                
                // remove old choices
                select.empty();
                
                // navigate to current depth
                nav = "self.tree";
                for (i = 0; i < depth; i++) 
                    nav += '["' + self.selected[i] + '"]';
                
                // get choices
                for (choice in eval(nav)) {
                    opt = $("<option value='" + choice + "'>" + choice + "</option>");
                    select.append(opt);
                }
            }
		});
	},
    
    /**
     * @description Returns the value associated with the currently selected leaf-node
     */
    _value: function () {
        var nav, self = this;
        
        nav = "this.tree"  ;
        $.each(this.selected, function (i, choice) {
            nav += '["' + choice + '"]';
        });
        
        return eval(nav)
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
            })
        });
    }

});

/**
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview Contains the definition for a Hierarchical or "Tree Select" class which links
 * several select form elements together based off a given tree structure such changes at any level automatically
 * determine valid options for select items at lower levels.
 */
/*global Class, TreeSelect, $, window */
var TreeSelect = Class.extend(
	/** @lends TreeSelect.prototype */
	{
	/**
	 * @description
	 * @param {Object} 
	 * @constructs 
	 */ 
    init: function(selectIds, tree, initialChoices, callback) {
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
		
        this._updateSelectMenus();
        
		// Set initial choices in select menus
		$.each(this.selectIds, function (depth, id) {
			$(id + " > option").each(function (index, option) {
                if (option.value === self.selected[depth])
				    $(id).attr("selectedIndex", index);      
			});
		});
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

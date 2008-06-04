/*global Class, $H */
var Counter = Class.create();

Object.extend(Counter, {
	items: $H({}),
  
	getNext: function (category) {
		if (!this.items.get(category)) {
    		this.items.set(category, 0);
		}
	    else {
    		this.items.set(category, this.items.get(category)++);
	    }
		return this.items.get(category);
	}
});
/*global Class, $H */
var Counter = Class.create();

Object.extend(Counter, {
	items: $H({}),
  
	getNext: function (category) {
		if (!this.items[category]) {
    		this.items[category] = 0;
		}
	    else {
    		this.items[category]++;
	    }
		return this.items[category];
	}
});
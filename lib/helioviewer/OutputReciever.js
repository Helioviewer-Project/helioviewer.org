var OutputReceiver = Class.create({
	initialize: function (elementId) {
		this.domNode = $(elementId);    
	},
  
	output: function (text) {
		this.domNode.innerHTML = text;
	}
});
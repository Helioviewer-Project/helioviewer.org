//container object for params used during tile layer creation and mutation
var TileLayerData = Class.extend({
    init: function(id, sourceId, difference, diffCount, diffTime, baseDiffTime, 
        onDifference, onDiffCount, onDiffTime, onDiffDate, hierarchy, 
        index, name, visible, startOpened, opacity, onOpacityChange) {
        
            this.id = id;
            this.sourceId = sourceId;
            this.difference = difference;
            this.diffCount = diffCount;
            this.diffTime = diffTime;
            this.baseDiffTime = baseDiffTime;
            this.onDifference = onDifference;
            this.onDiffCount = onDiffCount;
            this.onDiffTime = onDiffTime;
            this.onDiffDate = onDiffDate;
            this.hierarchy = hierarchy;
            this.index = index;
            this.name = name;
            this.visible = visible;
            this.startOpened = startOpened;
            this.opacity = opacity;
            this.onOpacityChange = onOpacityChange;

    }
});
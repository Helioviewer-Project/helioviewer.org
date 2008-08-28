/*global Class*/
var Coordinates = Class.create({});
Coordinates.getOffset = function (fullSize, tileSize) {
//  return (fullSize < tileSize ? Math.round((tileSize - fullSize) / 2) : 0);
	return 0;
};

Coordinates.worldAbs2rel = function (coords, fullSize, tileSize) {
	var offset = Coordinates.getOffset(fullSize, tileSize);
	return {
		x: (coords.x - offset) / fullSize,
    	y: (coords.y - offset) / fullSize
	};
};
  
Coordinates.worldRel2abs = function (coords, fullSize, tileSize) {
	var offset = Coordinates.getOffset(fullSize, tileSize);
	return {
		x: Math.round(coords.x * fullSize) + offset,
		y: Math.round(coords.y * fullSize) + offset
	};
};
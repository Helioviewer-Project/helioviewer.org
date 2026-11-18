import fs from 'fs';
import vm from 'vm';

function tile(image) {
  const context = {Layer: {extend: methods => methods}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('resources/js/Tiling/Layer/TileLayer.js', 'utf8'), context);
  return Object.assign(Object.create(context.TileLayer), {image});
}

test('real SPICE PC shear and anisotropic scales preserve FITS handedness in screen coordinates', () => {
  // getClosestImage source 601, 2026-01-11 18:19:24, normalized to 1 AU.
  const layer = tile({scale: 3.177326446104258, wcs: {cd: [[3.130536649949535,0.14912795240290275],[-0.5432712291542627,0.8593323104111558]]}});
  const p = layer._transformWCSPoint({x: 100, y: 200});
  expect(p.x).toBeCloseTo((3.130536649949535 * 100 - 0.14912795240290275 * 200) / 3.177326446104258);
  expect(p.y).toBeCloseTo((0.5432712291542627 * 100 + 0.8593323104111558 * 200) / 3.177326446104258);
  const inverse = layer._inverseTransformWCSPoint(p);
  expect(inverse.x).toBeCloseTo(100);
  expect(inverse.y).toBeCloseTo(200);
});

test.each([{}, {scale: 1, wcs: {cd: [[1,2],[2,4]]}}, {scale: 1, wcs: {cd: [[NaN,0],[0,1]]}}])('legacy or invalid WCS keeps a usable identity transform', image => {
  expect(tile(image)._transformWCSPoint({x: 15, y: -20})).toEqual({x:15,y:-20});
});

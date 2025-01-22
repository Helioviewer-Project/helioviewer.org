import { test, expect } from "@playwright/test";
import { Helioviewer } from "page_objects/helioviewer";
import { Point, RadialPoint } from "page_objects/mouse_coordinates";

/**
 * Test the mouse coordinate feature by moving the mouse to preset positions
 * on the sun, then verify that the displayed coordinates are what we expect
 * them to be.
 *
 * 1. Go to preset image
 * 2. Move mouse to center of the viewport
 * 3. Verify x, y coordinates are approximately (0, 0)
 * 4. Verify that radial coordinates display approximately 0R.
 */
test("Test mouse coordinates at sun center", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);
  // 1. Go to preset image
  await hv.Load();
  await hv.UseNewestImage();

  // 2. Move mouse to center of the viewport
  // Default playwright browser is 1280x720. This moves the mouse to the
  // center of the screen/browser/page.
  // For some reason, firefox just will not work with page.mouse.move(640, 360)
  // but it works for (640, 359) and (640, 361)
  // This approach to manaully dispatch the mousemove event works for all browsers.
  await hv.coordinates.moveMouse(640, 360);
  await hv.saveScreenshot();

  // 3. Verify x, y coordinates are approximately (0, 0)
  let coordinate: Point | RadialPoint = await hv.coordinates.getXY();
  expect(coordinate.x).toBe(0);
  // Technically this should be 0, but ends up as -1 from rounding errors.
  expect(coordinate.y).toBe(1);

  // 4. Verify that radial coordinates display approximately 0R.
  await hv.coordinates.useRadialCoordinates();
  await hv.coordinates.moveMouse(640, 360);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate.r).toBeCloseTo(0, 2);
});

/**
 * Test the mouse coordinate feature by moving the mouse to preset positions
 * on the sun, then verify that the displayed coordinates are what we expect
 * them to be.
 *
 * 1. Go to preset image
 * 2. Move the mouse to the top of the sun
 * 3. Check coordinates
 * 4. Repeat steps 2 and 3 for the right, bottom, and left of the sun.
 */
test("Test cartesian coordinates at sun edges", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);
  // 1. Go to preset image
  await hv.Load();
  await hv.UseNewestImage();

  // 2. Move the mouse to the top of the sun
  // Default image scale is 4.84 arcseconds per pixel. The sun's edges are
  // approximately 960 arcseconds. So moving 198 pixels * 4.84 arcseconds per pixel
  // is close to 960 arcseconds, a little bit under.
  // Each image in helioviewer is scaled such that the size you see in
  // Helioviewer is the size you would see if observing the sun from 1AU.
  // This is done to help overlay images on each other that may be taken
  // from different distances from the sun. This distance is accounted for
  // in the calculation, so each image provides a scaling factor. For the
  // sample data, this scaling factor is 0.986.
  // Doing the math, 198 pixels * 4.84 arcsec/pixel * 0.986 ~ 945.
  // Last, do some hand waving to account for rounding errors, and we expect
  // that the coordinate displayed for the image is actually 944.
  await hv.coordinates.moveMouse(640, 360 - 198);
  await hv.saveScreenshot();

  // 3. Check coordinates
  let coordinate: Point = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 0, y: 976 });

  // 2b. Do the same for the bottom of the sun
  await hv.coordinates.moveMouse(640, 360 + 198);
  await hv.saveScreenshot();

  // 3b. Check coordinates
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 0, y: -974 });

  // 2b. Do the same for the left of the sun
  await hv.coordinates.moveMouse(640 - 198, 360);
  await hv.saveScreenshot();

  // 3b. Check coordinates
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: -975, y: 1 });

  // 2b. Do the same for the left of the sun
  await hv.coordinates.moveMouse(640 + 198, 360);
  await hv.saveScreenshot();

  // 3b. Check coordinates
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 975, y: 1 });
});

/**
 * Test the mouse coordinate feature at a continuous zoom scale by moving the
 * mouse to preset positions on the sun, then verify that the displayed
 * coordinates are what we expect them to be.
 *
 * 1. Go to preset image
 * 2. Scroll to zoom in
 * 3. Move the mouse to the top of the sun
 * 4. Check coordinates
 * 5. Repeat steps 2 and 3 for the right, bottom, and left of the sun.
 */
test("Test cartesian coordinates at sun edges after partial zoom", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);
  // 1. Go to preset image
  await hv.Load();
  await hv.UseNewestImage();

  // 2. Scroll to zoom in
  await hv.saveScreenshot();
  await page.mouse.move(640, 360);
  // This amount zooms in to make the image about 20% larger.
  // The effective image scale changes from 4.84 arcseconds per pixel to 3.872 arcseconds per pixel.
  await page.mouse.wheel(0, -50);
  await page.waitForTimeout(250);
  await hv.saveScreenshot();

  // 3. Move the mouse to the top of the sun.
  // Scaling factor for the sample image is 0.986.
  // Doing the math, to get to the same spot,  240 pixels * 3.872 arcsec/pixel * 0.986 ~ 916.
  await hv.coordinates.moveMouse(640, 360 - 240);
  await hv.saveScreenshot();

  // 4. Check coordinates
  let coordinate: Point = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 0, y: 946 });

  await hv.coordinates.moveMouse(640, 360 + 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 0, y: -944 });

  await hv.coordinates.moveMouse(640 + 240, 360);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 945, y: 1 });

  await hv.coordinates.moveMouse(640 - 240, 360);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: -945, y: 1 });

  await hv.coordinates.moveMouse(640 - 240, 360 + 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: -945, y: -944 });

  await hv.coordinates.moveMouse(640 + 240, 360 - 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getXY();
  expect(coordinate).toStrictEqual({ x: 945, y: 946 });
});

/**
 * Test the mouse coordinate feature at a continuous zoom scale by moving the
 * mouse to preset positions on the sun, then verify that the displayed
 * coordinates are what we expect them to be. (Radial coordinates)
 *
 * 1. Go to preset image
 * 2. Scroll to zoom in
 * 3. Change to radial coordinates
 * 4. Move the mouse to the top of the sun
 * 5. Check coordinates
 * 6. Repeat steps 2 and 3 for the right, bottom, and left of the sun.
 */
test("Test radial coordinates at sun edges after partial zoom", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);
  // 1. Go to preset image
  await hv.Load();
  await hv.UseNewestImage();

  // 2. Scroll to zoom in
  await hv.saveScreenshot();
  await page.mouse.move(640, 360);
  // This amount zooms in to make the image about 20% larger.
  // The effective image scale changes from 4.84 arcseconds per pixel to 3.872 arcseconds per pixel.
  await page.mouse.wheel(0, -50);
  await page.waitForTimeout(250);
  await hv.saveScreenshot();

  // 3. Change to radial coordinates
  await hv.coordinates.useRadialCoordinates();

  // 4. Move the mouse to the top of the sun.
  // Scaling factor for the sample image is 0.986.
  // Doing the math, to get to the same spot,  240 pixels * 3.872 arcsec/pixel * 0.986 ~ 916.
  await hv.coordinates.moveMouse(640, 360 - 240);
  await hv.saveScreenshot();

  // 5. Check coordinates
  let coordinate: RadialPoint = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 360, r: 0.985 });

  await hv.coordinates.moveMouse(640, 360 + 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 180, r: 0.983 });

  await hv.coordinates.moveMouse(640 + 240, 360);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 270, r: 0.984 });

  await hv.coordinates.moveMouse(640 - 240, 360);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 90, r: 0.984 });

  await hv.coordinates.moveMouse(640 - 240, 360 + 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 135, r: 1.391 });

  await hv.coordinates.moveMouse(640 + 240, 360 - 240);
  await hv.saveScreenshot();
  coordinate = await hv.coordinates.getRadial();
  expect(coordinate).toStrictEqual({ angle: 315, r: 1.393 });
});

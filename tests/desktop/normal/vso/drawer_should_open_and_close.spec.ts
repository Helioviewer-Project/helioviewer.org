import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

/**
 * This test checks drawer open/close functionality
 */
test("validate drawer should open and close the required tab", async ({ page }) => {
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open data drawer
  await hv.vso_drawer.toggleVisibility();

  // Check drawer is open
  await hv.vso_drawer.assertDrawerOpen();

  // Action 3 : Close drawer
  await hv.vso_drawer.toggleVisibility();

  // Check drawer is closed
  await hv.vso_drawer.assertDrawerClose();

  // Action 4 : Open again
  await hv.vso_drawer.toggleVisibility();

  // Check drawer is open again
  await hv.vso_drawer.assertDrawerOpen();
});

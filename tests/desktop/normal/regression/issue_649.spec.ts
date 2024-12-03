import { test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test is a regression test for proving issue 649 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/649
 */
test("Issue 649, New Layer for fresh state break url sharing ", async ({ page, browser }, info) => {
  let hv = new Helioviewer(page, info);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.ClickDataSourcesTab();

  // Action 3: Add new layer
  await hv.AddImageLayer();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // Action 4: Check if we can do share url
  await hv.urlshare.triggerShareURL();
  await hv.urlshare.sharedURLIsVisibleAndDone();
});

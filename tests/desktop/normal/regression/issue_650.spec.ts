import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test is a regression test for proving issue 650 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/650
 */
test("Issue 650, Default base difference should be one hour earlier of observation date", async ({
  page,
  browser
}, info) => {
  let hv = new Helioviewer(page, info);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  // Action 3: Add new layer
  let layer = await hv.getImageLayer(0);
  await layer.set("Difference", "Base difference");

  // Action 4: Get the default base difference date from layer 0
  let baseDifferenceDateForLayer = await layer.getBaseDifferenceDateObject();

  // Action 5: Get the observation date
  let observationDate = await hv.GetLoadedDate();

  // Action 6: Get one hour earlier of observation date
  let oneHourEarlierOfObservationDate: number = observationDate.getTime() - 1000 * 60 * 60;

  // Action 7: Layer's base difference date should be one our earlier of observation date
  await expect(baseDifferenceDateForLayer.getTime()).toBe(oneHourEarlierOfObservationDate);
});

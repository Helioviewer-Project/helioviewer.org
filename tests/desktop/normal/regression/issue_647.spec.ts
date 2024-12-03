import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

/**
 * This test is a regression test for proving issue 647 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/647
 */
test("Issue 647, Movie making,  'Earth Scale Indicator' is off location if the requested movie needs tobe in resolution other than 'Original' ", async ({
  page,
  browser
}, info) => {
  const hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. USE NEWEST SOHO
  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  await hv.CloseSidebar();

  // 3. MOVE EARTH SCALE INDICATOR TO SOMEWHERE
  await hv.moveEarthScaleIndicator(200, 200);

  // 4. OPEN MOVIE DRAWER
  await hv.movie.toggleMovieDrawer();

  // 5. SET IMAGE TO RESOLUTION
  await hv.movie.selectFullScreenMovie();

  // 6. GET ADVANCED MOVIE CONTROLS
  await hv.movie.getAdvancedControls();

  // 7. SELECT SIZE OTHER THAN ORIGINAL
  await page.getByLabel("Size").selectOption({ label: "1440p (2560 x 1440, Quad HD)" });

  // 8. START MAKING
  await page.getByLabel("Submit").click();

  // 9. WAIT FOR MOVIE TO END
  await expect(page.getByText("Your LASCO C2 movie is ready! Click here to watch or download it.")).toBeVisible({
    timeout: 100000
  });

  // 10. CLICK MOVIE TO OPEN WATCH DIALOG
  await page.getByText("Your LASCO C2 movie is ready! Click here to watch or download it.").click();

  // 11. SCREENSHOT SHOULD MATCH
  await expect(page.locator(".movie-player-dialog")).toHaveScreenshot("movie_player_screenshot.png");
});

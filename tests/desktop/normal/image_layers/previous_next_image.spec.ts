import { expect, test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/*
 * Go to the image just before the last available image
 * It should have previous image button green and available
 * Then go to previous image,
 * This time it should have previous image button red and not-available
 * Also loaded date should match the last images date
 */
test("Going back to layer's last available image should disable previous image button with correct colors and availability.", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  const firstBeforeLastImage = new Date("2024/12/30 20:00:05Z");
  const lastImage = new Date("2021/06/01 00:01:29Z");

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. SET OBSERVATION DATE TO FIRST IMAGE BEFORE LAST IMAGE
  await hv.SetObservationDateTimeFromDate(firstBeforeLastImage);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  const layer = await hv.getImageLayer(0);

  // 3. Assert : Image date should be  2024/12/30 20:00:05Z,
  await layer.assertImageDate(firstBeforeLastImage);

  // 3. Assert : Previous image button should be be green ( and clickable )
  await layer.assertHasPreviousImage();

  // 4. Action : Go to previous image
  await layer.gotoPreviousImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 5. Assert : observation date should be 2021/06/01 00:01:29 ,
  const loadedDate = await hv.GetLoadedDate();
  await expect(loadedDate.getTime()).toBe(lastImage.getTime());

  // 6. Assert : Layer date should change to green
  await layer.assertImageDateAvailable();

  // 7. Assert : Previous image button should be be red ( and not-clickable )
  await layer.assertHasNoPreviousImage();
});

/**
 * Going previous available image should bring earliest available image,
 * and should correctly load previous available image,
 * and all ui should be updated correctly and screenshots should match for those dates
 */
test("Go back button should first bring observation date to available image date, then next click should bring that image, with matching screenshots and correct colors for controls", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  const previousImageDate = new Date("2024/12/31 00:04:53Z");

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // Layer to check controls
  const layer = await hv.getImageLayer(0);

  // 2. Assert : Image date should be  2024/12/31 00:04:53,
  await layer.assertImageDate(previousImageDate);

  // 3. Assert : Go back should be green ( and clickable )
  await layer.assertHasPreviousImage();

  // 4. Assert : Go Forward should be red ( and not clickable )
  await layer.assertHasNoNextImage();

  // 5. Action : Go to previous image
  await layer.gotoPreviousImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 6. Assert : Observation date should change to 2021/06/01 00:01:29 ,
  const loadedDate = await hv.GetLoadedDate();
  await expect(loadedDate.getTime()).toBe(previousImageDate.getTime());

  // 7. Assert : Layer date should change to green
  await layer.assertImageDateAvailable();

  // 8. Assert : Go back go forward should be all red ( not clickable )
  await layer.assertHasPreviousImage();
  await layer.assertHasNoNextImage();

  // 9. Register: Sunscreenshot from 2021/06/01 00:01:29 ,
  const previousImageScreenshot = await hv.saveScreenshot("previous_image_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  // 10. Action : Go to date directly  2021/06/01 00:01:29 ,
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  await hv.SetObservationDateTimeFromDate(previousImageDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  const directDateScreenshot = await hv.saveScreenshot("direct_date_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  // 11. Assert: compare registered screenshot
  await expect(directDateScreenshot).toBe(previousImageScreenshot);
});

/**
 * Going previous image two times, should bring first and the second available image also with matching screnshots  ,
 * All previous and next image buttons should have the correct colors as well
 */
test("Go back for multiple buttons should bring first and seconds image with matching screenshots with matching UI updates.", async ({
  page
}, info) => {
  // Helioviewer object
  let hv = new Helioviewer(page, info);

  //  Action : Load page
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Image date should be  2023/12/01 00:48:07 ,
  const previousImageDate = new Date("2023/12/01 00:48:07Z");
  await layer.assertImageDate(previousImageDate);

  //  Assert : Go back should be green ( and clickable )
  await layer.assertHasPreviousImage();

  //  Assert : Go Forward should be red ( and not clickable )
  await layer.assertHasNoNextImage();

  //  Action : Press Go back ,
  await layer.gotoPreviousImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Observation date should change to 2023/12/01 00:48:07
  const loadedDate = await hv.GetLoadedDate();
  await expect(loadedDate.getTime()).toBe(previousImageDate.getTime());

  //  Assert : Layer date should change to green
  await layer.assertImageDateAvailable();

  //  Assert : Go back go forward should not change colors
  await layer.assertHasPreviousImage();
  await layer.assertHasNoNextImage();

  //  Register: Sunscreenshot from  2023/12/01 00:48:07
  const previousImageScreenshot = await hv.saveScreenshot("previous_image_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  //  Action  : Press Another Go back
  await layer.gotoPreviousImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Image date should change to 2023/12/01 00:36:07
  const morePreviousImageDate = new Date("2023/12/01 00:36:07Z");
  await layer.assertImageDate(morePreviousImageDate);

  //  Assert : Observation date should change to 2023/12/01 00:36:07
  const morePreviousLoadedDate = await hv.GetLoadedDate();
  await expect(morePreviousLoadedDate.getTime()).toBe(morePreviousImageDate.getTime());

  //  Assert : Go back and forward now should be fully green
  await layer.assertHasPreviousImage();
  await layer.assertHasNextImage();

  //  Register : Sunscreenshot from 2023/12/01 00:36:07
  const morePreviousImageScreenshot = await hv.saveScreenshot("more_previous_image_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  //  Action : Go to date directly  2023/12/01 00:48:07
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layerPrevious = await hv.getImageLayer(0);
  await layerPrevious.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await hv.SetObservationDateTimeFromDate(previousImageDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert: compare registered screenshot
  const directPreviousDateScreenshot = await hv.saveScreenshot("direct_previous_date_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });
  await expect(directPreviousDateScreenshot).toBe(previousImageScreenshot);

  //  Action : Go to date directly  2023/12/01 00:36:07
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layerMorePrevious = await hv.getImageLayer(0);
  await layerMorePrevious.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await hv.SetObservationDateTimeFromDate(morePreviousImageDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert: compare registered screenshot
  const directMorePreviousDateScreenshot = await hv.saveScreenshot("direct_more_previous_date_screenshot", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  //  Assert: compare registered screenshot
  await expect(directMorePreviousDateScreenshot).toBe(morePreviousImageScreenshot);
});

/**
 * This test first goes back in time to make current date unavailable for the given layer ( SOHO )
 * then with slowly going to the next images, it should validate next images are correct
 * and also should validate UI pieces are aligned with the next available image dates
 */
test("Going next image multiple times should bring screenshot validated next available images and button/date colors should match with the matching screenshots", async ({
  page
}, info) => {
  // Helioviewer object
  let hv = new Helioviewer(page, info);

  //  Action : Load page
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Action : Try to load 2023/11/01 00:48:07 ,
  const initialDate = new Date("2023/11/01 00:48:07Z");
  await hv.SetObservationDateTimeFromDate(initialDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Image date should change to 2023/12/01 00:36:07
  const earliestAvailableImageDate = new Date("2023/12/01 00:00:07Z");
  await layer.assertImageDate(earliestAvailableImageDate);

  //  Assert : Go back should be red ( and not clickable )
  //  Assert : Go Forward should green ( and clickable )
  await layer.assertHasNoPreviousImage();
  await layer.assertHasNextImage();

  //  Action : Press Go forward ,
  await layer.gotoNextImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Observation date should change to 2023/12/01 00:00:07
  const loadedDate = await hv.GetLoadedDate();
  await expect(loadedDate.getTime()).toBe(earliestAvailableImageDate.getTime());

  //  Assert : Layer date should change to green
  await layer.assertImageDateAvailable();

  //  Assert : Go back go forward should not change colors
  await layer.assertHasNoPreviousImage();
  await layer.assertHasNextImage();

  //  Register: Sunscreenshot from  2023/12/01 00:00:07
  const earliestAvailableImage = await hv.saveScreenshot("earliest_available_image", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  //  Action : Press another Go forward ,
  await layer.gotoNextImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert : Image and observation date should change to 2023/12/01 00:12:07
  const expectedNextImageDate = new Date("2023/12/01 00:12:07Z");
  const nextLoadedImageDate = await hv.GetLoadedDate();
  await expect(nextLoadedImageDate.getTime()).toBe(expectedNextImageDate.getTime());

  //  Assert : Go back and forward now should be fully green
  await layer.assertHasPreviousImage();
  await layer.assertHasNextImage();

  //  Register : Sunscreenshot from 2023/12/01 00:12:07
  const nextAvailableImage = await hv.saveScreenshot("next_available_image", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });

  //  Action : Go to date directly  2023/12/01 00:00:07
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layerEarliesAvailable = await hv.getImageLayer(0);
  await layerEarliesAvailable.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await hv.SetObservationDateTimeFromDate(earliestAvailableImageDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert: compare registered screenshot
  const directEarliestAvailableImage = await hv.saveScreenshot("direct_earliest_available_image", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });
  await expect(directEarliestAvailableImage).toBe(earliestAvailableImage);

  //  Action : Go to date directly  2023/12/01 00:12:07
  await page.evaluate(() => localStorage.clear());
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  //  Action : Switch the LASCO C2 Layer
  const layerNextAvailable = await hv.getImageLayer(0);
  await layerNextAvailable.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await hv.SetObservationDateTimeFromDate(expectedNextImageDate);
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  //  Assert: compare registered screenshot
  const directNextAvailableImage = await hv.saveScreenshot("direct_next_available_image", {
    style: "#helioviewer-viewport-container-outer {z-index:200000}"
  });
  await expect(directNextAvailableImage).toBe(nextAvailableImage);
});

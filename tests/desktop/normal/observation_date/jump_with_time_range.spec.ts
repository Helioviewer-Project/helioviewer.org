import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

const time_jump_ranges = [
  { jump_label: "1Min", seconds: 60 },
  { jump_label: "6Hours", seconds: 21600 },
  { jump_label: "1Week", seconds: 604800 },
  { jump_label: "1Year", seconds: 31556926 }
];

time_jump_ranges.forEach(({ jump_label, seconds }) => {
  /**
   * This test is testing jumping backwads functionality with given label for range select-box
   */
  test(
    "Jump backwards with " + jump_label + " should go to matching datetime in past, with matching screenshots",
    { tag: "@production" },
    async ({ page, context, browser }, info) => {
      const hv = new Helioviewer(page, info);

      // 1. LOAD HV
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 2. LAYER 0 , SWITH TO SOHO
      const layer = await hv.getImageLayer(0);
      await layer.set("Observatory:", "SOHO");
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 3. USE NEWEST SOHO
      await hv.UseNewestImage();
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 4. MARK TIME BEFORE JUMP BACKWARDS
      const dateBeforeJump = await hv.GetLoadedDate();

      // 5. JUMP BACKWARDS WITH GIVEN SECONDS
      await hv.JumpBackwardsDateWithSelection(seconds);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 6. MARK TIME AFTER JUMP BACKWARDS
      const dateAfterJump = await hv.GetLoadedDate();

      // 7. ASSERT JUMPED TIME, SHOULD BE EXACTLY GIVEN SECONDSp
      await expect(seconds * 1000).toBe(dateBeforeJump.getTime() - dateAfterJump.getTime());

      // 8. SAVE CURRENT SCREENSHOT TO COMPARE LATER
      const afterJumpScreenshot = await hv.saveScreenshot("after_jump_screenshot", {
        style: "#helioviewer-viewport-container-outer {z-index:200000}"
      });

      // 9. START FRESH AND RELOAD HV
      await page.evaluate(() => localStorage.clear());
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 10. LAYER 0 , SWITH TO SOHO
      const new_page_layer = await hv.getImageLayer(0);
      await new_page_layer.set("Observatory:", "SOHO");
      await hv.WaitForLoadingComplete();

      // 11. USE NEWEST SOHO
      await hv.UseNewestImage();
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 12. LOAD THE JUMPED DATETIME, SO WE CAN COMPARE SCREENSHOT
      await hv.SetObservationDateTimeFromDate(dateAfterJump);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 13. GET CURRENT SCREENSHOT TO COMPARE PREVIOUS SCREENSHOT
      const directDateScreenshot = await hv.saveScreenshot("direct_date_screenshot", {
        style: "#helioviewer-viewport-container-outer {z-index:200000}"
      });

      // 14, 2 SCREENSHOTS ARE FROM SAME DATE, AND SHOULD MATCH
      await expect(directDateScreenshot).toBe(afterJumpScreenshot);
    }
  );

  /**
   * This test is testing jumping forward functionality with given label for range select-box
   */
  test(
    "Jump forwards with " + jump_label + " should go to matching datetime in future, with matching screenshots",
    { tag: "@production" },
    async ({ page, context, browser }, info) => {
      const hv = new Helioviewer(page, info);

      // 1. LOAD HV
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 2. LAYER 0 , SWITH TO SOHO
      const layer = await hv.getImageLayer(0);
      await layer.set("Observatory:", "SOHO");
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 3. REGISTER INITIAL DATE
      const initialDate = await hv.GetLoadedDate();

      // 3. TO TEST GO FORWARD WE ARE GOING BACK GIVEN SECONDS + SOME RANDOM TIME
      const randomMilliseconds = Math.floor(Math.random() * 90) * (24 * 60 * 60 * 1000);
      const wayBackInTime = new Date();
      wayBackInTime.setTime(initialDate.getTime() - seconds * 1000 - randomMilliseconds);

      // 4. NOW GO BACK TO THIS DATE
      await hv.SetObservationDateTimeFromDate(wayBackInTime);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 5. NOW JUMP FORWARD WITH GIVEN SECONDS
      await hv.JumpForwardDateWithSelection(seconds);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 6. NOW REGISTER THIS DATE
      const dateAfterJumpForward = await hv.GetLoadedDate();

      // 7, ASSERT WE STILL NEED TO GO RANDOM TIME TO GO WHERE WE STARTED
      await expect(randomMilliseconds).toBe(initialDate.getTime() - dateAfterJumpForward.getTime());

      // 8. TAKE A PICTURE , WE WILL COMPARE LATER
      const navigatedDateScreenshot = await hv.saveScreenshot("navigated_date_screenshot", {
        mask: [page.locator("#timestep-select")]
      });

      // 9. RELOAD HV WITH FRESH DATA
      await page.evaluate(() => localStorage.clear());
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 10.. LAYER 0 , SWITH TO SOHO
      const layer_2 = await hv.getImageLayer(0);
      await layer_2.set("Observatory:", "SOHO");
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 11. CALCULATE THE DATE WE GO TO COMPARE SCREENSHOTS
      const navigatedDate = new Date();
      navigatedDate.setTime(initialDate.getTime() - randomMilliseconds);

      // 12. GO TO THAT DATE
      await hv.SetObservationDateTimeFromDate(navigatedDate);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 13. TAKE A SCREENSOTi AND COMPARE
      const directDateScreenshot = await hv.saveScreenshot("direct_date_screenshot", {
        mask: [page.locator("#timestep-select")]
      });

      await expect(directDateScreenshot).toBe(navigatedDateScreenshot);
    }
  );
});

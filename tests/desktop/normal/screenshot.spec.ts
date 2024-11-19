import { test, expect, PageScreenshotOptions } from "@playwright/test";
import * as fs from "fs";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  // loading of wrong url , is creating problems
  test(
    `[${view.name}] Screenshot button should toggle screenshot drawer`,
    { tag: [view.tag] },
    async ({ page }, info) => {
      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

      await hv.Load();
      await hv.CloseAllNotifications();
      const screenshotMask: PageScreenshotOptions = {
        mask: [
          page.locator("#screenshot-manager-container .status"),
          page.locator("#hvmobtime_td #time"),
          page.locator("#hvmobdate_td #date")
        ]
      };

      await hv.screenshot.toggleScreenshotDrawer();

      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("screenshot-drawer-enabled.png");

      await hv.screenshot.toggleScreenshotDrawer();

      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("screenshot-drawer-disabled.png");
    }
  );

  // create multiple screenshots and compare them
  test(
    `[${view.name}] Create a new screenshot and view it and close it`,
    { tag: [view.tag] },
    async ({ page, context, browserName }, info) => {
      test.fixme(
        browserName === "webkit",
        "We couldn't be able to trigger download event for webkit, skipping this test now"
      );

      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;
      // Mask the screenshot creation time.
      // The screenshot may expect "1 second ago"
      // but the actual result may be "2 seconds ago". causing the test to fail.
      const screenshotMask: PageScreenshotOptions = {
        mask: [
          page.locator("#screenshot-manager-container .status"),
          page.locator("#hvmobtime_td #time"),
          page.locator("#hvmobdate_td #date")
        ]
      };

      // load helioviewer
      await hv.Load();
      await hv.CloseAllNotifications();

      // open screenshot drawer
      await hv.screenshot.toggleScreenshotDrawer();

      // create a full-screen screenshot
      await hv.screenshot.createFullScreenshot();
      await hv.screenshot.waitForScreenshotCompleteNotifitication();

      // assert there should be one screenshot in drawer
      await hv.screenshot.assertScreenshotCountFromDrawer(1);

      // download and save screenshot from notification ( by clicking your screenshot ready in jgrowl messsage)
      const screenshotFileFromNotification = await hv.screenshot.downloadScreenshotFromNotification();
      const screenshot_notification_report_file = info.outputPath("screenshot_from_notification.png");
      await fs.promises.writeFile(
        screenshot_notification_report_file,
        Buffer.from(screenshotFileFromNotification, "base64")
      );
      await info.attach("screenshot-notification", { path: screenshot_notification_report_file });

      // close the notification
      await hv.CloseAllNotifications();

      // On mobile, we have to close the drawer to close notifications.
      // So open the screenshots back up to check that the screenshot is in the list.
      if (view == MobileView) {
        await hv.OpenScreenshotsDialog();
      }
      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("first-screenshot-created.png");

      // now click the created screenshot link and see the screenshot in full screen
      await hv.screenshot.viewScreenshotFromScreenshotHistory(1, true);
      expect(await page.screenshot()).toMatchSnapshot("view-first-screenshot.png");

      // Close the screenshot from X
      // compare the test snapshot with the one we have created for
      await hv.screenshot.closeScreenshotView();
      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("first-screenshot-created.png");

      // See screenshot again
      await hv.screenshot.viewScreenshotFromScreenshotHistory(1);
      await hv.WaitForLoadingComplete();

      // now download screenshot from screenshot view via download button
      const screenshotFileFromScreenshotView = await hv.screenshot.downloadScreenshotFromViewScreenshotFeature();
      const screenshot_view_screenshot_report_file = info.outputPath("screenshot_view_screenshot.png");
      await fs.promises.writeFile(
        screenshot_view_screenshot_report_file,
        Buffer.from(screenshotFileFromScreenshotView, "base64")
      );
      await info.attach("screenshot-view-screenshot", { path: screenshot_view_screenshot_report_file });

      // compare screenshots downloaded from different sources
      await expect(screenshotFileFromNotification).toBe(screenshotFileFromScreenshotView);

      // Close screenshot from X in the view
      await hv.screenshot.closeScreenshotView();

      // Close screenshot drawer
      await hv.screenshot.toggleScreenshotDrawer();

      // This test snapshot should match the initial state
      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("screenshot-drawer-disabled.png");

      // Reopen screenshot drawer
      await hv.screenshot.toggleScreenshotDrawer();

      // Test snapshot with initial first screenshot created view
      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("first-screenshot-created.png");

      // Now add another snapshot
      await hv.screenshot.createFullScreenshot();
      await hv.screenshot.waitForScreenshotCompleteNotifitication();
      await hv.CloseAllNotifications();

      // assert there should be two screenshots in drawer
      await hv.screenshot.assertScreenshotCountFromDrawer(2);

      expect(await page.screenshot(screenshotMask)).toMatchSnapshot("second-screenshot-created.png");

      // assert there should be two screenshots in drawer
      await hv.screenshot.viewScreenshotFromScreenshotHistory(1, true);

      expect(await page.screenshot()).toMatchSnapshot("view-first-screenshot.png");
    }
  );
});

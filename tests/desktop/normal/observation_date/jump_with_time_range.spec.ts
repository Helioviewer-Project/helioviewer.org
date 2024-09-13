import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../../page_objects/helioviewer';
import path from 'path';

const time_jump_ranges = [
  { jump_label: '1Min', seconds : 60 }, 
  { jump_label: '6Hours', seconds : 21600 }, 
  { jump_label: '1Week', seconds : 604800 }, 
  { jump_label: '1Year', seconds : 31556926 }, 
];

time_jump_ranges.forEach(({ jump_label, seconds }) => {

    test('Jump backwards with '+jump_label+' should go to matching datetime in past, with matching screenshots', async ({ page, context, browser }, info) => {

      const hv = new Helioviewer(page, info);

      // 1. LOAD HV 
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 2. LAYER 0 , SWITH TO SOHO
      const layer = await hv.getImageLayer(0);
      await layer.set('Observatory:', 'SOHO');

      await hv.WaitForLoadingComplete();

      // 3. USE NEWEST SOHO
      await hv.UseNewestImage();
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Register date before jump
      const dateBeforeJump = await hv.GetLoadedDate();
      expect(dateBeforeJump).not.toBeNull();

      // 4 JUMP BACKWARDS WITH GIVEN SECONDS 
      await hv.JumpBackwardsDateWithSelection(seconds);

      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Register date after jump
      const dateAfterJump = await hv.GetLoadedDate();
      expect(dateAfterJump).not.toBeNull();

      // Assert; date after jump should be earlier then date before jump
      await expect(dateAfterJump.getTime()).toBe(dateBeforeJump.getTime() - (seconds * 1000))

      // Save screenshot to compare later
      const afterJumpScreenshot = await hv.getBase64Screenshot({
          // mask : [page.locator('#timestep-select')],
          // stylePath : path.join(__dirname, 'screenshot_only_sun.css')
          style: '#helioviewer-viewport-container-outer {z-index:200000}'
      });

      // Save screenshot to hv report
      await hv.attachBase64FileToTrace('after_jump_screenshot.png', afterJumpScreenshot)

      // Load directly the date after we made the  jump 
      // // Make a clean request to that date;
      await page.evaluate(() => localStorage.clear());

      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      const new_page_layer = await hv.getImageLayer(0);
      await new_page_layer.set('Observatory:', 'SOHO');
      await hv.WaitForLoadingComplete();

      // 3. USE NEWEST SOHO
      await hv.UseNewestImage();
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // 
      await hv.SetObservationDateTimeFromDate(dateAfterJump);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      const directDateScreenshot = await hv.getBase64Screenshot({
          // mask : [newPage.locator('#timestep-select')],
          style: '#helioviewer-viewport-container-outer {z-index:200000}'
      });

      await hv.attachBase64FileToTrace('direct_date_screenshot.png', directDateScreenshot)
      await expect(directDateScreenshot).toBe(afterJumpScreenshot)

    });

    test('Jump forwards with '+jump_label+' should go to matching datetime in future, with matching screenshots', async ({ page, context, browser }, info) => {

      const hv = new Helioviewer(page, info);

      // 1. LOAD HV 
      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      await hv.pr("initial"+jump_label+".png");
      // 2. LAYER 0 , SWITH TO SOHO
      const layer = await hv.getImageLayer(0);
      await layer.set('Observatory:', 'SOHO');

      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      const initialDate = await hv.GetLoadedDate();
      expect(initialDate).not.toBeNull();

      await hv.pr("after_soho_change"+jump_label+".png");

      // 3. GO TO SOME PAST DAY FIRST SO WE CAN JUMP FORWARD
      const randomMilliseconds = Math.floor(Math.random() * 90) * (24*60*60*1000);
      const newDate = new Date();
      newDate.setTime(initialDate.getTime() - (seconds*1000) - randomMilliseconds);

      await hv.SetObservationDateTimeFromDate(newDate);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      await hv.pr("after_go_back_for_"+(randomMilliseconds/(24*60*60*1000))+"_"+jump_label+".png");

      // 4 JUMP FORWARD WITH GIVEN SECONDS 
      await hv.JumpForwardDateWithSelection(seconds);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      await hv.pr("after_jump_forward_"+jump_label+".png");
      //
      const dateAfterJumpForward = await hv.GetLoadedDate();
      expect(dateAfterJumpForward).not.toBeNull();

      // Needs to be exactly difference milliseconds 
      await expect(randomMilliseconds).toBe(initialDate.getTime() - dateAfterJumpForward.getTime())

      const navigatedDateScreenshot = await hv.getBase64Screenshot({
          mask : [page.locator('#timestep-select')],
          // style: '#helioviewer-viewport-container-outer {z-index:200000}'
      });

      await hv.attachBase64FileToTrace('navigated_date_screenshot.png', navigatedDateScreenshot)

      const navigatedDate = new Date();
      navigatedDate.setTime(initialDate.getTime() - randomMilliseconds);

      // Load directly the date after we made the  jump 
      // // Make a clean request to that date;
      await page.evaluate(() => localStorage.clear());

      await hv.Load();
      await hv.CloseAllNotifications();
      await hv.OpenSidebar();

      // 2. LAYER 0 , SWITH TO SOHO
      const layer_2 = await hv.getImageLayer(0);
      await layer_2.set('Observatory:', 'SOHO');

      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      await hv.SetObservationDateTimeFromDate(navigatedDate);
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();


      const directDateScreenshot = await hv.getBase64Screenshot({
          mask : [page.locator('#timestep-select')],
          // style: '#helioviewer-viewport-container-outer {z-index:200000}'
      });

      await hv.attachBase64FileToTrace('direct_date_screenshot.png', directDateScreenshot)
      await expect(directDateScreenshot).toBe(navigatedDateScreenshot)

    });


});

// // create multiple screenshots and compare them 
// test('Create a new screenshot and view it and close it', async ({ page, context, browserName }, info) => {
//
//   test.fixme(browserName === 'webkit', "We couldn't be able to trigger download event for webkit, skipping this test now");
//
//   let hv = new Helioviewer(page);
//
//   // load helioviewer
//   await hv.Load();
//   await hv.CloseAllNotifications();
//
//   // open screenshot drawer
//   await hv.screenshot.toggleScreenshotDrawer();
//
//   // create a full-screen screenshot
//   await hv.screenshot.createFullScreenshot();
//   await hv.screenshot.waitForScreenshotCompleteNotifitication(); 
//
//   // assert there should be one screenshot in drawer
//   await hv.screenshot.assertScreenshotCountFromDrawer(1);
//
//   // download and save screenshot from notification ( by clicking your screenshot ready in jgrowl messsage)  
//   const screenshotFileFromNotification = await hv.screenshot.downloadScreenshotFromNotification();
//   const screenshot_notification_report_file = info.outputPath('screenshot_from_notification.png');
//   await fs.promises.writeFile(screenshot_notification_report_file, Buffer.from(screenshotFileFromNotification, 'base64'));
//   await info.attach('screenshot-notification', { path: screenshot_notification_report_file });
//
//   // close the notification
//   await hv.CloseAllNotifications();
//
//   expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png');
//
//   // now click the created screenshot link and see the screenshot in full screen
//   await hv.screenshot.viewScreenshotFromScreenshotHistory(1);
//   await hv.WaitForImageLoad();
//   expect(await page.screenshot()).toMatchSnapshot('view-first-screenshot.png');
//
//   // Close the screenshot from X 
//   // compare the test snapshot with the one we have created for
//   await hv.screenshot.closeScreenshotView();
//   expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png');
//  
//   // See screenshot again
//   await hv.screenshot.viewScreenshotFromScreenshotHistory(1);
//   await hv.WaitForImageLoad();
//
//   // now download screenshot from screenshot view via download button 
//   const screenshotFileFromScreenshotView = await hv.screenshot.downloadScreenshotFromViewScreenshotFeature();
//   const screenshot_view_screenshot_report_file = info.outputPath('screenshot_view_screenshot.png');
//   await fs.promises.writeFile(screenshot_view_screenshot_report_file, Buffer.from(screenshotFileFromScreenshotView, 'base64'));
//   await info.attach('screenshot-view-screenshot', { path: screenshot_view_screenshot_report_file });
//
//   // compare screenshots downloaded from different sources
//   await expect(screenshotFileFromNotification).toBe(screenshotFileFromScreenshotView);
//
//   // Close screenshot from X in the view
//   await hv.screenshot.closeScreenshotView();
//
//   // Close screenshot drawer
//   await hv.screenshot.toggleScreenshotDrawer();
//
//   // This test snapshot should match the initial state
//   expect(await page.screenshot()).toMatchSnapshot('screenshot-drawer-disabled.png');
//
//   // Reopen screenshot drawer
//   await hv.screenshot.toggleScreenshotDrawer();
//
//   // Test snapshot with initial first screenshot created view
//   expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png', {
//   	maxDiffPixels: 100,
//   });
//
//   // Now add another snapshot
//   await hv.screenshot.createFullScreenshot();
//   await hv.screenshot.waitForScreenshotCompleteNotifitication(); 
//   await hv.CloseAllNotifications();
//
//   // assert there should be two screenshots in drawer
//   await hv.screenshot.assertScreenshotCountFromDrawer(2);
//
//   expect(await page.screenshot()).toMatchSnapshot('second-screenshot-created.png', {
//   	maxDiffPixels: 100,
//   });
//
//   // assert there should be two screenshots in drawer
//   await hv.screenshot.viewScreenshotFromScreenshotHistory(1);
//   await hv.WaitForImageLoad();
//
//   expect(await page.screenshot()).toMatchSnapshot('view-first-screenshot.png');
// });

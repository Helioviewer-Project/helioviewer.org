import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../page_objects/helioviewer'
import * as fs from 'fs';

// loading of wrong url , is creating problems
test.only('Movie button should toggle movie drawer', async ({ page, context }, info) => {

  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.CloseAllNotifications();

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot('movie-no-drawer.png');

});

// 
test.only('Create a new movie and view it and close it', async ({ page, context, browserName }, info) => {

//   test.fixme(browserName === 'webkit', "We couldn't be able to trigger download event for webkit, skipping this test now");
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : CLICK MOVIE TAB BUTTON
  await hv.movie.toggleMovieDrawer();

  // Action 3 : CLICK FULLSCREEN MOVIE
  await hv.movie.selectFullScreenMovie();

  // Now we should be seeing movie make form
  expect(await page.screenshot()).toMatchSnapshot('movie-form-drawer.png');

  // Action 4 : CANCEL MOVIE CREATION
  await page.getByLabel('Cancel').click();

  // Now we should be seeing movie history lists
  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');

  // Action 5 : CLICK PARTIAL SCREEN MOVIE
  await hv.movie.selectPartialScreenMovie();

  // Now we should be seeing movie make form
  expect(await page.screenshot()).toMatchSnapshot('partial-movie-selection.png');

  // Action 4 : CANCEL PARTIAL SELECTION
  await page.locator('#cancel-selecting-image').getByText('Cancel').click();
  
  // Now we should be seeing movie history lists again
  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');


  // await hv.screenshot.waitForScreenshotCompleteNotifitication(); 
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
});

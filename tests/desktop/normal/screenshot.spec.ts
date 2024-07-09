import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../page_objects/helioviewer'
import * as fs from 'fs';

const clickScreenshotButton = async (page) => {
  await page.locator('#screenshots-button').click();
  await page.mouse.move(200, 200);
  await page.mouse.up();
};

const createFullSnapshot = async (page) => {
  await page.locator('#screenshot-manager-full-viewport').click();
  await page.mouse.move(200, 200);
  await page.mouse.up();
}

const viewFirstScreenshot = async(page) => {
  await page.locator('#screenshot-history .history-entry:first-child a.text-btn').click();
  await page.mouse.move(200, 200);
  await page.mouse.up();
}

const viewSecondScreenshot = async(page) => {
  await page.locator('#screenshot-history .history-entry:nth-child(2) a.text-btn').click();
  await page.mouse.move(200, 200);
  await page.mouse.up();
}

const closeFirstScreenshot = async(page) => {
  await page.locator('.__react_modal_image__icon_menu > a:nth-of-type(2)').click();
  await page.mouse.move(200, 200);
  await page.mouse.up();
}

const downloadScreenshotFromNotification = async(page) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Your AIA 304 screenshot is' }).click();
  const download = await downloadPromise;
  const readStream = await download.createReadStream();

  const chunks = [];
  for await (let chunk of readStream) {
    chunks.push(chunk);
  }
 
  return Buffer.concat(chunks).toString('base64');
}

const downloadScrenshotFromViewScreenshotFeature = async(page) => {
  await page.locator('.__react_modal_image__icon_menu > a:nth-of-type(1)').click();

  const downloadPromise = page.waitForEvent('download');
  const download = await downloadPromise;
  const readStream = await download.createReadStream();

  const chunks = [];
  for await (let chunk of readStream) {
    chunks.push(chunk);
  }
 
  return Buffer.concat(chunks).toString('base64');
}

const assertScreenshotCountFromDrawer = async(page, count) => {
  const list = page.locator('#screenshot-history > .history-entry');
  await expect(list).toHaveCount(count);
}

// loading of wrong url , is creating problems
test('Screenshot button should toggle screenshot pagen', async ({ page, context }, info) => {

  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  await clickScreenshotButton(page);

  expect(await page.screenshot()).toMatchSnapshot('screenshot-drawer-enabled.png');

  await clickScreenshotButton(page);

  expect(await page.screenshot()).toMatchSnapshot('screenshot-drawer-disabled.png');

});

test('Create a new screenshot and view it and close it', async ({ page, context }, info) => {

  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  await clickScreenshotButton(page);

  await createFullSnapshot(page);
  await hv.CloseAllNotifications();

  await assertScreenshotCountFromDrawer(page, 1)

  const screenshotNotification = await downloadScreenshotFromNotification(page);

  const screenshot_notification_report_file = info.outputPath('screenshot_notification.png');
  await fs.promises.writeFile(screenshot_notification_report_file, Buffer.from(screenshotNotification, 'base64'));
  await info.attach('screenshot-notification', { path: screenshot_notification_report_file });

  await hv.CloseAllNotifications();

  expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png');
  await viewFirstScreenshot(page);

  expect(await page.screenshot()).toMatchSnapshot('view-first-screenshot.png');
  
  await closeFirstScreenshot(page);
  //
  expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png');
 
  await viewFirstScreenshot(page);

  const screenshotViewScreenshot = await downloadScrenshotFromViewScreenshotFeature(page);

  const screenshot_view_screenshot_report_file = info.outputPath('screenshot_view_screenshot.png');
  await fs.promises.writeFile(screenshot_view_screenshot_report_file, Buffer.from(screenshotViewScreenshot, 'base64'));
  await info.attach('screenshot-view-screenshot', { path: screenshot_view_screenshot_report_file });

  await expect(screenshotNotification).toBe(screenshotViewScreenshot);

  await closeFirstScreenshot(page);

  await clickScreenshotButton(page);

  expect(await page.screenshot()).toMatchSnapshot('screenshot-drawer-disabled.png');

  // To see again the drawer 
  await clickScreenshotButton(page);

  expect(await page.screenshot()).toMatchSnapshot('first-screenshot-created.png', {
  	maxDiffPixels: 100,
  });

  // Now add another snapshot
  await createFullSnapshot(page);
  await hv.CloseAllNotifications();

  await assertScreenshotCountFromDrawer(page, 2)
  expect(await page.screenshot()).toMatchSnapshot('second-screenshot-created.png');

  await viewSecondScreenshot(page);

  expect(await page.screenshot()).toMatchSnapshot('view-first-screenshot.png');


//	NEW 

  // await expect(page.getByText('×Just nowYour AIA 304')).toBeVisible();
  // await expect(page.getByText('AIA 3041 seconds ago')).toBeVisible();
  // await expect(page.getByRole('link', { name: 'AIA 304', exact: true })).toBeVisible();
  // const downloadPromise = page.waitForEvent('download');
  // await page.getByRole('link', { name: 'Your AIA 304 screenshot is' }).click();
  // const download = await downloadPromise;
  // const download1Promise = page.waitForEvent('download');
  // await page.getByRole('link', { name: 'AIA 304', exact: true }).click();
  // const download1 = await download1Promise;
  // await page.goto('http://app.necdet.nasa.gov/');
  // await page.getByRole('link', { name: 'AIA' }).click();
  // await expect(page.locator('#react-modal-image-img')).toBeVisible();
  // const download2Promise = page.waitForEvent('download');
  // await page.getByRole('link').nth(3).click();
  // const download2 = await download2Promise;
  // await page.locator('.__react_modal_image__icon_menu > a:nth-child(2)').click();
  // await expect(page.locator('div').filter({ hasText: '► Generate a Screenshot Full' }).nth(2)).toBeVisible();

});

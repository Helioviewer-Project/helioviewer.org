import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../../page_objects/helioviewer';
import * as fs from 'fs';

test.only('Event viewer dialog menu should not overflow with tabs', async ({ page }) => {

  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : OPEN SIDEBAR
  await hv.OpenSidebar();

  // Action 3: SET OBSERVATION TIME
  await hv.SetObservationTime('2021/05/31', '00:01:29');

  // Action 4: View CCMC CME events 
  await expect(page.locator('#tree_CCMC').getByRole('link', { name: 'CME'})).toBeVisible();
  await page.locator('#tree_CCMC').getByRole('link', { name: 'CME'}).click();

  // Action 5: Click Matching Marker 
  await expect(page.locator('#marker_2021-05-30T163600-CME-001')).toBeVisible();
  await page.locator('#marker_2021-05-30T163600-CME-001').click();

  // Action 6: Click link to view dialog menu
  await expect(page.getByText('View source data')).toBeVisible();
  await page.getByText('View source data').click();

  // Dialog should be visible
  await expect(page.locator('.event-info-dialog-menu')).toBeVisible();

  // Action 7 : ADD NEW TABGROUPS TO OVERFLOW
  await page.evaluate(() => {
      $('.event-info-dialog-menu').append($('div.tabgroup:nth-of-type(2)').clone());
      $('.event-info-dialog-menu').append($('div.tabgroup:nth-of-type(2)').clone());
      $('.event-info-dialog-menu').append($('div.tabgroup:nth-of-type(2)').clone());
      $('.event-info-dialog-menu').append($('div.tabgroup:nth-of-type(2)').clone());
  });

  // Check if scrollbar is loaded 
  const dialogMenu = page.locator('.event-info-dialog-menu');
  expect(await dialogMenu.evaluate(a => a.scrollWidth > a.clientWidth )).toBe(true);

});

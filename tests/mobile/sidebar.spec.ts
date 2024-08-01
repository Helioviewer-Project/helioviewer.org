import { test, expect } from '@playwright/test';
import { HvMobile } from '../page_objects/mobile_hv';

test('[Mobile] Open Announcements', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await expect(page.getByText('Helioviewer Project Announcements', { exact: true })).not.toBeVisible();
  await mobile.OpenAnnouncements();
  await expect(page.getByText('Helioviewer Project Announcements', { exact: true })).toBeVisible();
});

test('[Mobile] Open Shared Youtube Videos', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await expect(page.getByText('Shared To Youtube', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Movies Spanning Observation Date', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Recently Shared to YouTube', { exact: true })).not.toBeVisible();
  await mobile.OpenYoutubeVideos();
  await expect(page.getByText('Shared To Youtube', { exact: true })).toBeVisible();
  await expect(page.getByText('Movies Spanning Observation Date', { exact: true })).toBeVisible();
  await expect(page.getByText('Recently Shared to YouTube', { exact: true })).toBeVisible();
});

test('[Mobile] Open Movies dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
});

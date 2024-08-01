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
  await expect(page.getByText('Create A Movie', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Movie History')).not.toBeVisible();
  await mobile.OpenMovieDialog();
  await expect(page.getByText('Create A Movie', { exact: true })).toBeVisible();
  await expect(page.getByText('Movie History')).toBeVisible();
});

test('[Mobile] Open Screenshots dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await expect(page.getByText('Create A Screenshot', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Screenshot History')).not.toBeVisible();
  await mobile.OpenScreenshotsDialog();
  await expect(page.getByText('Create A Screenshot', { exact: true })).toBeVisible();
  await expect(page.getByText('Screenshot History')).toBeVisible();
});


test('[Mobile] Open Share Viewport dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await expect(page.getByText('Share Viewport On Social Media', { exact: true})).not.toBeVisible();
  await expect(page.getByText('Copy Link')).not.toBeVisible();
  await expect(page.getByText('Email Link')).not.toBeVisible();
  await expect(page.getByText('Share Screenshot on X')).not.toBeVisible();
  await expect(page.getByText('Share Screenshot with Facebook')).not.toBeVisible();
  await expect(page.getByText('Pin Screenshot')).not.toBeVisible();

  await mobile.OpenShareViewportDialog();

  await expect(page.getByText('Share Viewport On Social Media', { exact: true})).toBeVisible();
  await expect(page.getByText('Copy Link')).toBeVisible();
  await expect(page.getByText('Email Link')).toBeVisible();
  await expect(page.getByText('Share Screenshot on X')).toBeVisible();
  await expect(page.getByText('Share Screenshot with Facebook')).toBeVisible();
  await expect(page.getByText('Pin Screenshot')).toBeVisible();
});

import { test, expect, Locator } from '@playwright/test';
import { HvMobile } from '../page_objects/mobile_hv';

/**
 * Expect that he visibility of all the given locators match the expected visibility
 * @param shouldBeVisible Assert locators match this visibility (true/false)
 * @param locators Locators to test
 */
async function ExpectVisibility(shouldBeVisible: boolean, locators: Array<Locator>) {
  for (let idx = 0; idx < locators.length; idx++) {
    const locator = locators[idx];
    if (shouldBeVisible) {
      await expect(locator).toBeVisible();
      await expect(locator).toBeInViewport();
    } else {
      // If the element is visible, but its not on-screen (InViewport) then
      // it's essentially not visible.
      await expect(locator).not.toBeInViewport();
    }
  }
}

/**
 * The process for these tests is to assert that the dialog is closed,
 * open the dialog, assert it is open by verifying certain elements are visible,
 * close the dialog, and assert the dialog is closed again.
 * @param open_dialog Function to open the dialog
 * @param close_dialog Function to close the dialog
 * @param locators Elements that should be visible only when the dialog is open.
 */
async function RunDialogTest(
  open_dialog: () => void,
  close_dialog: () => void,
  locators: Array<Locator>) {
    await ExpectVisibility(false, locators);
    await open_dialog();
    await ExpectVisibility(true, locators);
    await close_dialog();
    await ExpectVisibility(false, locators);
}

test('[Mobile] Open Announcements', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => await mobile.OpenAnnouncements(),
    async () => await mobile.CloseAnnouncements(),
    [
      page.getByText('Helioviewer Project Announcements', { exact: true })
    ]
  );
});

test('[Mobile] Open Shared Youtube Videos', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenYoutubeVideosDialog(),
    async () => mobile.CloseYoutubeVideosDialog(),
    [
      page.getByText('Shared To Youtube', { exact: true }),
      page.getByText('Movies Spanning Observation Date', { exact: true }),
      page.getByText('Recently Shared to YouTube', { exact: true })
    ]
  );
});

test('[Mobile] Open Movies dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenMovieDialog(),
    async () => mobile.CloseMovieDialog(),
    [
      page.getByText('Create A Movie', { exact: true }),
      page.getByText('Movie History')
    ]
  )
});

test('[Mobile] Open Screenshots dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenScreenshotsDialog(),
    async () => mobile.CloseScreenshotsDialog(),
    [
      page.getByText('Create A Screenshot', { exact: true }),
      page.getByText('Screenshot History')
    ]
  )
});


test('[Mobile] Open Share Viewport dialog', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenShareViewportDialog(),
    async () => mobile.CloseShareViewportDialog(),
    [
      page.getByText('Share Viewport On Social Media', { exact: true}),
      page.getByText('Copy Link'),
      page.getByText('Email Link'),
      page.getByText('Share Screenshot on X'),
      page.getByText('Share Screenshot with Facebook'),
      page.getByText('Pin Screenshot')
    ]
  )
});

test('[Mobile] Open Help Menu', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await RunDialogTest(
    async () => mobile.OpenHelpMenu(),
    async () => mobile.CloseHelpMenu(),
    [
      page.locator('#hvhelp').getByText('About Helioviewer', {exact: true}),
      page.locator('#hvhelp').getByText('Visual Glossary'),
      page.locator('#hvhelp').getByText('Public API Documentation'),
      page.locator('#hvhelp').getByText('Blog'),
      page.locator('#hvhelp').getByText('Contact'),
      page.locator('#hvhelp').getByText('Report Problem')
    ]
  )
});

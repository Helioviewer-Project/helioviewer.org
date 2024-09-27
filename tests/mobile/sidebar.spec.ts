import { test, expect, Locator } from "@playwright/test";
import { HvMobile } from "../page_objects/mobile_hv";

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
async function RunDialogTest(open_dialog: () => void, close_dialog: () => void, locators: Array<Locator>) {
  await ExpectVisibility(false, locators);
  await open_dialog();
  await ExpectVisibility(true, locators);
  await close_dialog();
  await ExpectVisibility(false, locators);
}

test("[Mobile] Open Announcements", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => await mobile.OpenAnnouncements(),
    async () => await mobile.CloseAnnouncements(),
    [page.getByText("Helioviewer Project Announcements", { exact: true })]
  );
});

test("[Mobile] Open Shared Youtube Videos", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenYoutubeVideosDialog(),
    async () => mobile.CloseYoutubeVideosDialog(),
    [
      page.getByText("Shared To Youtube", { exact: true }),
      page.getByText("Movies Spanning Observation Date", { exact: true }),
      page.getByText("Recently Shared to YouTube", { exact: true })
    ]
  );
});

test("[Mobile] Open Movies dialog", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenMovieDialog(),
    async () => mobile.CloseMovieDialog(),
    [page.getByText("Create A Movie", { exact: true }), page.getByText("Movie History")]
  );
});

test("[Mobile] Open Screenshots dialog", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenScreenshotsDialog(),
    async () => mobile.CloseScreenshotsDialog(),
    [page.getByText("Create A Screenshot", { exact: true }), page.getByText("Screenshot History")]
  );
});

test("[Mobile] Open Share Viewport dialog", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  await RunDialogTest(
    async () => mobile.OpenShareViewportDialog(),
    async () => mobile.CloseShareViewportDialog(),
    [
      page.getByText("Share Viewport On Social Media", { exact: true }),
      page.getByText("Copy Link"),
      page.getByText("Email Link"),
      page.getByText("Share Screenshot on X"),
      page.getByText("Share Screenshot with Facebook"),
      page.getByText("Pin Screenshot")
    ]
  );
});

test("[Mobile] Open Help Menu", async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await RunDialogTest(
    async () => mobile.OpenHelpMenu(),
    async () => mobile.CloseHelpMenu(),
    [
      page.locator("#hvhelp").getByText("About Helioviewer", { exact: true }),
      page.locator("#hvhelp").getByText("Visual Glossary"),
      page.locator("#hvhelp").getByText("Public API Documentation"),
      page.locator("#hvhelp").getByText("Blog"),
      page.locator("#hvhelp").getByText("Contact"),
      page.locator("#hvhelp").getByText("Report Problem")
    ]
  );
});

test("[Mobile] Test Help Links", async ({ page, context }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();

  // Link 1: About Helioviewer
  await mobile.OpenHelpMenu();
  let help_menu = page.locator("#hvhelp");
  await help_menu.getByText("About Helioviewer").tap();
  await expect(page.getByText("Helioviewer - About")).toBeVisible();
  await expect(page.getByText("Helioviewer - About")).toBeInViewport();
  await expect(page.getByText("Last Updated")).toBeVisible();
  await expect(page.getByText("Last Updated")).toBeInViewport();
  await mobile.CloseDialog();

  // Link 2: Visual Glossary
  // Waiting for this thumbnail is important for the snapshot
  let youtubePreviewPromise = page.waitForResponse("https://i.ytimg.com/vi/TWySQHjIRSg/maxresdefault.jpg");
  await mobile.OpenSidebar();
  await help_menu.getByText("Visual Glossary").tap();
  await expect(page.getByText("Helioviewer - Glossary")).toBeVisible();
  await expect(page.getByText("Coronal Mass Ejection (CME)")).toBeVisible();
  await expect(page.getByText("Solar Terrestrial Relations Observatory")).toBeVisible();
  await youtubePreviewPromise;
  await expect(page).toHaveScreenshot();
  await mobile.CloseDialog();

  // Link 3: Public API Docs, test that it opens the API docs in a new tab
  const apiDocsTabPromise = context.waitForEvent("page");
  await mobile.OpenSidebar();
  await help_menu.getByText("Public API Documentation").tap();
  const docsPage = await apiDocsTabPromise;
  await docsPage.waitForLoadState("domcontentloaded");
  expect(await docsPage.title()).toContain("Helioviewer API V2 documentation");
  await docsPage.close();

  // Link 4: Helioviewer Blog, test that it opens the API docs in a new tab
  const blogTabPromise = context.waitForEvent("page");
  await help_menu.getByText("Blog").tap();
  const blogPage = await blogTabPromise;
  await blogPage.waitForLoadState("domcontentloaded");
  expect(await blogPage.title()).toBe("Helioviewer Project – Visualization of solar and heliospheric data");
  await blogPage.close();

  // Link 5: Contact button
  const contactButton = await help_menu.getByText("Contact");
  await expect(contactButton).toHaveAttribute("href", /^mailto:.*$/);

  // Link 6: Report Problem button, links to github
  const githubTabPromise = context.waitForEvent("page");
  await help_menu.getByText("Report Problem").tap();
  const githubTab = await githubTabPromise;
  await githubTab.waitForLoadState("domcontentloaded");
  expect(githubTab.url()).toContain("github.com");
  expect(githubTab.url()).toContain("Helioviewer-Project");
  expect(githubTab.url()).toContain("helioviewer.org");
});

import { test, expect, Locator } from '@playwright/test';
import { HvMobile } from '../../page_objects/mobile_hv';

/**
 * The bug here was every time you re-open the shared youtube videos popup,
 * the text "No shared movies found" was appended to the DOM each time.
 * It should only appear once.
 *
 * Test steps:
 *   1. Open the youtube dialog
 *   2. Expect that the text appears once
 *   3. Close and re-open the youtube dialog
 *   4. Expect that the text still appears once
 */
test('[Mobile] "No shared movies found" should not be duplicated', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.OpenYoutubeVideosDialog();
  await expect(page.getByText("No shared movies found.")).toHaveCount(1);
  await mobile.CloseYoutubeVideosDialog();
  await mobile.OpenYoutubeVideosDialog();
  await expect(page.getByText("No shared movies found.")).toHaveCount(1);
});

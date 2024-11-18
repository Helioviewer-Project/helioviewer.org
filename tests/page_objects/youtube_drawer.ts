import { Page, Locator, expect } from "@playwright/test";

/**
 * Interface for interacting with elements related to youtube shared videos drawer drawer
 */
class YoutubeDrawer {
  /** Playwright page instance */
  private page: Page;
  private drawer: Locator;
  private accordionYoutube: Locator;
  private accordionObservationDate: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = this.page.locator("#hv-drawer-youtube");
    this.accordionYoutube = this.drawer.locator("#accordion-youtube");
    this.accordionObservationDate = this.drawer.locator("#accordion-youtube-current");
  }

  /**
   * Assert drawer is open
   * @returns {Promise<void>}
   */
  async assertDrawerOpen(): Promise<void> {
    await expect(this.drawer).toBeVisible();
  }

  /**
   * Assert drawer is closed
   * @returns {Promise<void>}
   */
  async assertDrawerClose(): Promise<void> {
    await expect(this.drawer).not.toBeVisible();
  }

  /**
   * Assert video count of youtube shared videos
   * @param {number} count expected video number
   * @returns {Promise<void>}
   */
  async assertYoutubeSharedVideoCount(count: number): Promise<void> {
    await expect(this.accordionYoutube.locator("img").locator("visible=true")).toHaveCount(count);
  }

  /**
   * Assert video count of observation date youtube shared videos
   * @param {number} count expected video number
   * @returns {Promise<void>}
   */
  async assertObservationDateYoutubeSharedVideoCount(count: number): Promise<void> {
    await expect(this.accordionObservationDate.locator("img").locator("visible=true")).toHaveCount(count);
  }

  /**
   * Assert visibility of video and its title for shared youtube videos
   * @param {string} id of video
   * @param {string} title for the video
   * @returns {Promise<void>}
   */
  async assertYoutubeSharedVideoVisibleWithTitle(id: string, title: string): Promise<void> {
    await expect(this.accordionYoutube.locator(`#youtube-movie-current-${id}`)).toBeVisible();
    await expect(this.accordionYoutube.locator(`#youtube-movie-current-${id}`).locator("xpath=..")).toHaveText(title);
  }

  /**
   * Assert visibility of video and its title for observation date shared youtube videos
   * @param {string} id of video
   * @param {string} title for the video
   * @returns {Promise<void>}
   */
  async assertObservationDateYoutubeSharedVideoVisibleWithTitle(id: string, title: string): Promise<void> {
    await expect(this.accordionObservationDate.locator(`#youtube-movie-current-${id}`)).toBeVisible();
    await expect(this.accordionObservationDate.locator(`#youtube-movie-current-${id}`).locator("xpath=..")).toHaveText(
      title
    );
  }

  /**
   * Assert the video link for given shared youtube video
   * @param {string} id of video
   * @param {string} link for the video
   * @returns {Promise<void>}
   */
  async assertYoutubeSharedVideoGoesToLink(id: string, link: string): Promise<void> {
    await expect(this.accordionYoutube.locator(`#youtube-movie-current-${id}`)).toBeVisible();
    await expect(this.accordionYoutube.locator(`#youtube-movie-current-${id}`)).toHaveAttribute("href", link);
  }

  /**
   * Assert the video link for given shared observation date youtube video
   * @param {string} id of video
   * @param {string} link for the video
   * @returns {Promise<void>}
   */
  async assertObservationDateYoutubeSharedVideoGoesToLink(id: string, link: string): Promise<void> {
    await expect(this.accordionObservationDate.locator(`#youtube-movie-current-${id}`)).toBeVisible();
    await expect(this.accordionObservationDate.locator(`#youtube-movie-current-${id}`)).toHaveAttribute("href", link);
  }

  /**
   * Assert visibility of helpful message when there is no youtube shared video
   * @returns {Promise<void>}
   */
  async assertNoYoutubeSharedVideoMessage(): Promise<void> {
    await expect(this.accordionYoutube.locator("#user-video-gallery")).toHaveText("No shared movies found.");
  }

  /**
   * Assert visibility of helpful message when there is no observation date youtube shared video
   * @returns {Promise<void>}
   */
  async assertNoObservationDateYoutubeSharedVideoMessage(): Promise<void> {
    await expect(this.accordionObservationDate.locator("#user-video-gallery-current")).toContainText(
      "No movies found around the observation date."
    );
  }

  /**
   * Toggle visibility of youtube shared videos accordion inside the youtube drawer
   * @returns {Promise<void>}
   */
  async toggleYoutubeSharedAccordion(): Promise<void> {
    await this.accordionYoutube.locator(".header").click();
  }

  /**
   * Toggle visibility of youtube observation date shared videos accordion inside the youtube drawer
   * @returns {Promise<void>}
   */
  async toggleObservationDateYoutubeSharedAccordion(): Promise<void> {
    await this.accordionObservationDate.locator(".header").click();
  }

  /**
   * Enable visibility of video markers indicating locations of the recorded video
   * @returns {Promise<void>}
   */
  async showSunLocationMarkersForForObservationDateVideos(): Promise<void> {
    await this.accordionObservationDate.locator("#movies-show-in-viewport").check();
  }

  /**
   * Disable visibility of video markers indicating locations of the recorded video
   * @returns {Promise<void>}
   */
  async hideSunLocationMarkersForForObservationDateVideos(): Promise<void> {
    await this.accordionObservationDate.locator("#movies-show-in-viewport").uncheck();
  }

  /**
   * Assert visibility for observation date  youtube video markers are visible
   * @param {string} markerTitle of the marker
   * @returns {Promise<void>}
   */
  async assertObservationDateYoutubeSharedVideoMarkersVisibleWithTitle(markerTitle: string): Promise<void> {
    await expect(this.page.getByRole("link", { name: markerTitle })).toBeVisible();
  }

  /**
   * Assert no-visibility for observation date  youtube video markers are visible
   * @param {string} markerTitle of the marker
   * @returns {Promise<void>}
   */
  async assertObservationDateYoutubeSharedVideoMarkersNotVisibleWithTitle(markerTitle: string): Promise<void> {
    await expect(this.page.getByRole("link", { name: markerTitle })).not.toBeVisible();
  }
}

export { YoutubeDrawer };

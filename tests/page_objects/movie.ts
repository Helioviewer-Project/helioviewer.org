import { Page, Locator, expect } from "@playwright/test";

/**
 * Interface for interacting with elements related to a specific
 * image layer on Heliovewer.org
 */
class Movie {
  /** Playwright page instance */
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the button for toggling movie drawer
   * @returns {Promise<void>}
   */
  async toggleMovieDrawer(): Promise<void> {
    await this.page.locator("#movies-button").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * See advanced controls for movie making
   * @returns {Promise<void>}
   */
  async getAdvancedControls(): Promise<void> {
    await this.page.getByRole("link", { name: "Advanced Settings" }).click();
  }

  /**
   * Create screenshot with pressing fullscreen button
   * @returns {Promise<void>}
   */
  async selectFullScreenMovie(): Promise<void> {
    await this.page.locator("#movie-manager-full-viewport").getByText("Full Viewport").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Create screenshot with pressing fullscreen button
   * @returns {Promise<void>}
   */
  async selectPartialScreenMovie(): Promise<void> {
    await this.page.locator("#movie-manager-select-area").getByText("Select Area").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Execute actions to create fullscreen movie
   * @returns {Promise<void>}
   */
  async makeFullScreenmovie(): Promise<void> {
    await this.toggleMovieDrawer();
    await this.selectFullScreenMovie();
    await this.page.getByLabel("Submit").click();
  }
}

export { Movie };

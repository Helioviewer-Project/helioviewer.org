import {Page, Locator, expect} from "@playwright/test";

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
   * @return void
   */
  async toggleMovieDrawer() {
    await this.page.locator("#movies-button").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Create screenshot with pressing fullscreen button
   * @return void
   */
  async selectFullScreenMovie() {
    await this.page.locator("#movie-manager-full-viewport").getByText("Full Viewport").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Create screenshot with pressing fullscreen button
   * @return void
   */
  async selectPartialScreenMovie() {
    await this.page.locator("#movie-manager-select-area").getByText("Select Area").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Execute actions to create fullscreen movie
   * @return void
   */
  async makeFullScreenmovie() {
    await this.toggleMovieDrawer();
    await this.selectFullScreenMovie();
    await this.page.getByLabel("Submit").click();
  }
}

export {Movie};

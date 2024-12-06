import { Locator, Page } from "@playwright/test";

interface Point {
  x: number;
  y: number;
}

interface RadialPoint {
  r: number;
  angle: number;
}

/**
 * Interface for interacting with mouse coordinates from the HV UI.
 */
class MouseCoordinates {
  private page: Page;
  private cartesian_button: Locator;
  private polar_button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartesian_button = this.page.locator("#mouse-cartesian");
    this.polar_button = this.page.locator("#mouse-polar");
  }

  private async getCoordinates(): Promise<Point> {
    let x = await this.page.locator("#mouse-coords-x").textContent();
    let y = await this.page.locator("#mouse-coords-y").textContent();
    return { x: parseFloat(x), y: parseFloat(y) };
  }

  private async getRadialCoordinates(): Promise<RadialPoint> {
    let coord = await this.getCoordinates();
    return {
      r: coord.x,
      angle: coord.y
    };
  }

  async getXY(): Promise<Point> {
    let isCartesianActive = await this.cartesian_button.evaluate((el) => el.classList.contains("active"));
    if (isCartesianActive) {
      return this.getCoordinates();
    } else {
      await this.cartesian_button.click();
      return this.getCoordinates();
    }
  }

  async useRadialCoordinates(): Promise<void> {
    await this.polar_button.click();
  }

  async getRadial(): Promise<RadialPoint> {
    // If radial coordinates aren't visible, display them.
    let isRadialActive = await this.polar_button.evaluate((el) => el.classList.contains("active"));
    if (isRadialActive) {
      return this.getRadialCoordinates();
    } else {
      await this.useRadialCoordinates();
      return this.getRadialCoordinates();
    }
  }

  /**
   * Move the mouse to a specified position.
   *
   * Default playwright browser is 1280x720.
   * For some reason, firefox just will not work with page.mouse.move(640, 360)
   * but it works for (640, 359) and (640, 361)
   * This function will manaully dispatch the mousemove event works for all browsers.
   */
  async moveMouse(x: number, y: number): Promise<void> {
    let container = await this.page.locator("#moving-container");
    await container.dispatchEvent("mousemove", {
      clientX: x,
      clientY: y
    });
  }
}

export { Point, RadialPoint, MouseCoordinates };

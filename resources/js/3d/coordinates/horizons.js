import { CoordinateList } from "./coordinate";
import { Coordinator } from "./coordinator";

/**
 * Interface to JPL Horizons (passes through our Coordinator server).
 */
class Horizons {
  /**
   * Creates an instance of Horizons suitable for making ephemeris queries.
   * @param {Coordinator} coordinator instance of coordinator interface
   */
  constructor(coordinator) {
    this.coordinator = coordinator;
  }

  /**
   * Queries the location of the given observatory
   * @param {string} observatory
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise<CoordinateList>}
   */
  GetLocations(observatory, start, end) {
    return this.coordinator.Position(
      Horizons.getObservatoryByName(observatory),
      start.toISOString(),
      end.toISOString()
    );
  }

  /**
   * Maps Helioviewer observatory names to observatory names supported by
   * JPL Horizons
   * @param {string} observatory
   * @returns {string}
   */
  static getObservatoryByName(observatory) {
    const mapping = {
      "goes-r": "goes-18",
      "goes": "goes-18",
      // I could not find IRIS in the Horizons database
      // https://ssd.jpl.nasa.gov/horizons/time_spans.html
      // 399 maps to earth.
      iris: "399",
      rhessi: "399",
      trace: "399",
      yohkoh: "399",
      hinode: "399",
      mlso: "399",
      proba2: "399",
      stereo_a: "stereo-a",
      stereo_b: "stereo-b"
    };

    const lowercase = observatory.toLowerCase();
    if (mapping.hasOwnProperty(lowercase)) {
      return mapping[lowercase];
    }
    return observatory;
  }
}

export { Horizons };

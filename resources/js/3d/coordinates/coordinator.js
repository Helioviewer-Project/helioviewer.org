import { Coordinate, CoordinateList } from "./coordinate";

/**
 * Helper class to deal with coordinate transformations between a given
 * coordinate and the coordinates of the 3D scene being rendered
 */
class Coordinator {
  /**
   * Construct a coordinator which uses the given endpoint for the service.
   * @param {string} url Coordinator URL
   */
  constructor(url = "https://api.helioviewer.org/coordinate") {
    this.BASE_URL = url;
  }

  /**
   * Transform GSE coordinates to the rendering coordinate system
   * @param {Array<Coordinate>} coordinates Transform a list of GSE coordinates to the system coordinate frame.
   * @return {Promise<CoordinateList>} A promise that resolves to a CoordinateList.
   */
  async GSE(coordinates) {
    const response = await fetch(this.BASE_URL + "/gse2frame", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: coordinates })
    });
    const data = await response.json();
    return CoordinateList.fromCoordinatorResponse(data);
  }

  /**
   * Queries the location of the given observatory
   * @param {string} observatory
   * @param {Date} start
   * @param {Date} end
   * @returns {Promise<CoordinateList>}
   */
  async Position(observatory, start, end) {
    const response = await fetch(`${this.BASE_URL}/position/${observatory}?start=${start}&stop=${end}`);
    const result = await response.json();
    return CoordinateList.fromCoordinatorResponse(result);
  }
}

export { Coordinator };

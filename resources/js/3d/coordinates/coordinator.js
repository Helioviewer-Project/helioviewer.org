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
    this.BASE_URL = url
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
    /**
     * (y, z, x) below is the correct mapping of solar coordinates to the
     * threejs axes. The threejs axes are:
     * x -> to the right
     * y -> up
     * z -> towards the screen.
     *
     * In solar coordinates
     * x -> towards the screen/earth
     * y -> to the right / towards the sun's west limb as seen from earth
     * z -> up / towards the solar north pole
     *
     * So to align with this, we need to map the coordinates to this y, z, x
     * pattern.
     */
    return new CoordinateList(
      data.coordinates.map((coord) => new Coordinate(coord.y, coord.z, coord.x, new Date(coord.time + "Z")))
    );
  }
}

export { Coordinator };

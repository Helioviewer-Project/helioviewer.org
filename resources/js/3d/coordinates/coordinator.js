import { Coordinate, CoordinateList } from "./coordinate";
import { Config } from "../../Utility/Config";

/**
 * Helper class to deal with coordinate transformations between a given
 * coordinate and the coordinates of the 3D scene being rendered
 */
class Coordinator {
  /**
   * URL for coordinator API service.
   */
  static BASE_URL = (new Config()).params.coordinator_url;

  /**
   * Transform GSE coordinates to the rendering coordinate system
   * @param {Array<Coordinate>} coordinates Transform a list of GSE coordinates to the system coordinate frame.
   * @return {Promise<CoordinateList>} A promise that resolves to a CoordinateList.
   */
  static async GSE(coordinates) {
    const response = await fetch(this.BASE_URL + "/gse2frame", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: coordinates })
    });
    const data = await response.json();
    return new CoordinateList(
      data.coordinates.map((coord) => new Coordinate(coord.x, coord.y, coord.z, new Date(coord.time + "Z")))
    );
  }
}

export { Coordinator };

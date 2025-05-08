import { Vector3 } from "three";

/**
 * Represents a coordinate in 3D space with a timestamp.
 */
class Coordinate {
  /**
   * Creates a new Coordinate instance.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {number} z - The z-coordinate.
   * @param {Date} time - The timestamp associated with this coordinate.
   */
  constructor(x, y, z, time) {
    /**
     * The x-coordinate.
     * @type {number}
     */
    this.x = x;

    /**
     * The y-coordinate.
     * @type {number}
     */
    this.y = y;

    /**
     * The z-coordinate.
     * @type {number}
     */
    this.z = z;

    /**
     * The timestamp associated with this coordinate.
     * @type {Date}
     */
    this.time = time;
  }

  /**
   * Converts the coordinate to a Vector3 object.
   * @returns {Vector3} A Vector3 representation of the coordinate.
   */
  toVec() {
    return new Vector3(this.x, this.y, this.z);
  }
}

/**
 * Manages searching for coordinates within a list
 */
class CoordinateList {
  /**
   * Creates a new CoordinateList instance.
   * @param {Coordinate[]} data - An array of Coordinate objects.
   */
  constructor(data) {
    data.sort((a, b) => a.time.getTime() - b.time.getTime());

    /**
     * @type {Coordinate[]}
     */
    this.data = data;
  }

  /**
   * Creates an instance of CoordinateList using the typical response
   * from the Coordinator API.
   *
   * @typedef {Object} CoordinateData
   * @property {number} x - The x-coordinate.
   * @property {number} y - The y-coordinate.
   * @property {number} z - The z-coordinate.
   * @property {string} time - The timestamp associated with this coordinate.
   *
   * @typedef {Object} CoordinatorResponse
   * @property {CoordinateData[]} coordinates - An array of coordinate data objects.
   *
   * @param {CoordinatorResponse} data
   */
  static fromCoordinatorResponse(data) {
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
     * let xt, yt, zt denote x, y, z from standard threejs axes.
     * let xs, ys, zs denote x, y, z from solar axes
     * The response from coordinator is using the solar axes.
     * So to map to our 3D scene axes, we need to assign the values to the appropriate
     * axis.
     * ys -> xt
     * zs -> yt
     * xs -> zt
     */
    return new CoordinateList(
      data.coordinates.map((coord) => new Coordinate(coord.y, coord.z, coord.x, new Date(coord.time + "Z")))
    );
  }

  /**
   * Returns a coordinate computed by linear interpolation of stored coordinates.
   * @param {Date} date - The date for which to compute the interpolated coordinate.
   * @returns {Coordinate} The interpolated coordinate for the given date.
   */
  Get(date) {
    const [before, after] = this._get_coord_before_and_after(date);
    // Progress value of 0 to 1 for the date.
    // 0 means date == before, 1 means date == after, 0.5 means date is halfway between.
    const percentage_complete =
      (date.getTime() - before.time.getTime()) / (after.time.getTime() - before.time.getTime());
    // percentage_complete may be undefied if before and after are the same.
    // This can happen if the data array only contains 1 coordinate.
    const progress = this._clamp(isNaN(percentage_complete) ? 1 : percentage_complete, 0, 1);
    return this._lerp_coordinates(before, after, progress, date);
  }

  /**
   * Returns an array containing two coordinates: the one immediately before and after the given date.
   * @param {Date} date - The date to compare against.
   * @returns {Coordinate[]} An array containing two Coordinate objects: [beforeCoordinate, afterCoordinate].
   *                         If the date is before the first coordinate or after the last coordinate in the list,
   *                         both elements in the array will be the same (either the first or last coordinate).
   */
  _get_coord_before_and_after(date) {
    // Case where date < the first element
    if (date < this.data[0].time) {
      return [this.data[0], this.data[0]];
    }

    // Find the before and after
    let previous = this.data[0];
    for (const c of this.data) {
      if (date < c.time) {
        return [previous, c];
      }
      previous = c;
    }

    // This indicates that the date is beyond the last value
    const final = this.data[this.data.length - 1];
    return [final, final];
  }

  /**
   * Clamps a value between a minimum and maximum range.
   * @param {number} val - The value to clamp.
   * @param {number} start - The minimum value of the range.
   * @param {number} end - The maximum value of the range.
   * @returns {number} The clamped value.
   * @private
   */
  _clamp(val, start, end) {
    // obfuscation!
    return val < start ? start : end < val ? end : val;
  }

  /**
   * Performs linear interpolation between two coordinates.
   * @param {Coordinate} a - The starting coordinate.
   * @param {Coordinate} b - The ending coordinate.
   * @param {number} progress - The interpolation progress, between 0 and 1.
   * @param {Date} date - The date for the interpolated coordinate.
   * @returns {Coordinate} The interpolated coordinate.
   * @private
   */
  _lerp_coordinates(a, b, progress, date) {
    return new Coordinate(
      this._lerp_value(a.x, b.x, progress),
      this._lerp_value(a.y, b.y, progress),
      this._lerp_value(a.z, b.z, progress),
      date
    );
  }

  /**
   * Linear interpolate (lerp) between start and end.
   * @param {number} start - Start Value
   * @param {number} end - End Value
   * @param {number} progress - Progress between 0 and 1.
   * @returns {number} The interpolated value
   * @private
   */
  _lerp_value(start, end, progress) {
    return (end - start) * progress + start;
  }
}

export { CoordinateList, Coordinate };

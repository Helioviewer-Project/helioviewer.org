import { Coordinate } from "./coordinate";
import { AppException } from "./exception";

/**
 * Represents a satellite in the SSC Web Services.
 * @typedef {Object} SSCSatellite
 * @property {string} Id - Id used for querying this observatory
 * @property {string} Name - Name of the observatory
 * @property {number} Resolution - Time resolution of data in seconds (presumed, not well documented)
 * @property {Date} StartTime - Start time of available data
 * @property {Date} EndTime - End time of available data
 * @property {string} ResourceId - SPASE ID for this resource
 */

class SSCWSException extends Error {
  constructor(message, error) {
    super();
    this.message = message;
    this.error = error;
  }
}

/**
 * Interface to location data provided by SSC Web Services
 * @see https://sscweb.gsfc.nasa.gov/WebServices/REST/#Get_Locations_GET
 */
class SSCWS {
  static BASE_URL = "https://sscweb.gsfc.nasa.gov/WS/sscr/2";
  static HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };

  /**
   * Get location data for the specified observatory.
   * Data is always returned in GSE format
   * @param {string} observatory Observatory to get the position of. See https://sscweb.gsfc.nasa.gov/WS/sscr/2/observatories for options
   * @param {Date} start Start date to request position information for
   * @param {Date} end End date to request position information for
   * @returns {Promise<Object>} Unaltered response from SSCWS
   */
  static async GetLocationsRaw(observatory, start, end) {
    const obs = this.observatoryName(observatory);
    const resolutionFactor = this.computeResolutionFactor(start, end);
    const url =
      this.BASE_URL +
      `/locations/${obs}/${this._formatDate(start)},${this._formatDate(end)}/gse?resolutionFactor=${resolutionFactor}`;
    const data = await fetch(url, { headers: this.HEADERS });
    return await data.json();
  }

  /**
   * Returns the list of observatories supported by SSCWS
   * @returns {Promise<Array<SSCSatellite>>}
   */
  static async GetObservatories() {
    const url = this.BASE_URL + `/observatories`;
    const data = await fetch(url, { headers: this.HEADERS });
    const json = await data.json();
    const observatories = json[1]["Observatory"][1].map((ret) => ret[1]);

    // Convert the date format from ['javax.xml.datatype.XMLGregorianCalendar', 'date']
    // to just a javascript date
    for (const obs of observatories) {
      obs.StartTime = new Date(obs.StartTime[1]);
      obs.EndTime = new Date(obs.EndTime[1]);
    }
    return observatories;
  }

  /**
   * Get location data for the specified observatory.
   * @param {string} observatory - Observatory to get the position of. See https://sscweb.gsfc.nasa.gov/WS/sscr/2/observatories for options
   * @param {Date} start - Start date to request position information for
   * @param {Date} end - End date to request position information for
   * @returns {Promise<Array<Coordinate>>} Array of Coordinate objects
   * @throws {SSCWSException} on error
   */
  static async GetLocations(observatory, start, end) {
    const data = await this.GetLocationsRaw(observatory, start, end);
    // Navigate the structure to get to the XYZ data
    const result = data[1].Result[1];
    if (result.StatusCode == "ERROR") {
      throw new SSCWSException(result.StatusText[1][0], result);
    }
    if (!result.hasOwnProperty("Data")) {
      throw new SSCWSException("No data returned by SSCWS", result);
    }
    const coordinates = result.Data[1][0][1].Coordinates[1][0][1];
    // Navigate the structure to get timestamps for the coordinates
    const timestamps = data[1].Result[1].Data[1][0][1].Time[1];
    const XList = coordinates.X[1];
    const YList = coordinates.Y[1];
    const ZList = coordinates.Z[1];
    // Get the number of coordinates returned by the request
    const n_coordinates = XList.length;
    let out = [];
    for (let i = 0; i < n_coordinates; i++) {
      out.push(new Coordinate(XList[i], YList[i], ZList[i], new Date(timestamps[i][1])));
    }
    return out;
  }

  /**
   * Returns date formatted to be used with the SSCWS API
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   * @private
   */
  static _formatDate(date) {
    return date.toISOString().replace(/(:|-|\.\d\d\d)/g, "");
  }

  /**
   * Converts the observatory name to the format expected by the SSCWS API.
   * @param {string} name - The original observatory name.
   * @returns {string} The formatted observatory name.
   * @private
   */
  static observatoryName(name) {
    const lower = name.toLowerCase().replace(/(-)/g, "");
    const mapping = {
      goesr: "goes16",
      solo: "solarorbiter"
    };
    if (mapping.hasOwnProperty(lower)) {
      return mapping[lower];
    }
    return lower;
  }

  /**
   * Computes the resolution factor for SSCWS API requests.
   * @param {Date} start - The start date of the request.
   * @param {Date} end - The end date of the request.
   * @returns {number} The computed resolution factor, clamped between 1 and 999.
   */
  static computeResolutionFactor(start, end) {
    // Set the resolution factor so that we limit the amount of data returned
    // to 60 locations
    const dt_ms = end.getTime() - start.getTime();
    const dt_s = dt_ms / 1000;
    // Minutes between end and start
    const dt_m = dt_s / 60;
    const factor = dt_m / 60;
    // The API limits resolutionFactor to be between 1 and 999...
    // Which I think is a bit silly.
    if (factor < 1) return 1;
    else if (factor > 999) return 999;
    else return Math.round(factor);
  }
}

export { SSCWS };

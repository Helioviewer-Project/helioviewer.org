/**
 * Class representing an API client.
 */
export default class API {
  /**
   * Create a new API client.
   * @param {string} apiurl - The base URL of the API.
   */
  constructor(apiurl) {
    // Ensure the API URL ends with a forward slash
    if (!apiurl.endsWith("/")) {
      apiurl += "/";
    }

    this.apiurl = apiurl;
  }

  /**
   * Get events from the API for a specific date and source.
   * @param {Date} date - The date for which to retrieve events.
   * @param {string} source - The source of the events.
   * @returns {Promise} A promise that resolves to the event data.
   */
  async getEvents(date, source, { signal } = {}) {
    // Convert the date to ISO string format
    const startTime = date.toISOString();

    // Construct the URL with query parameters
    const url = `${this.apiurl}?startTime=${encodeURIComponent(startTime)}&action=events&sources=${encodeURIComponent(
      source
    )}`;

    // Fetch data from the API
    const response = await fetch(url, { signal });

    // Handle error responses
    if (!response.ok) {
      console.error(response);
    }

    // Parse the response data as JSON
    const data = await response.json();

    return data;
  }
}

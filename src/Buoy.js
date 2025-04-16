// Buoy.js


/**
 * Import any constants you need from your `constants.js`.
 * For example, we only need `API_BASE_URL` here to build the request URL.
 */
import { API_BASE_URL } from "./constants.js";

/**
 * This `Buoy` class represents one buoy/station. Each instance
 * (created via `new Buoy(...)`) will store details about that station 
 * and have methods to fetch and parse data for it.
 */
export class Buoy {
  /**
   * The constructor is a special method that runs when you do `new Buoy(...)`.
   * Here, we initialize (or set) the station’s ID, name, arrival order, etc.
   * 
   * @param {string} stationId - the station/buoy ID (e.g., "51101").
   * @param {string} stationName - the human-readable name (e.g., "Pauwela").
   * @param {number|null} arrivalOrder - the order in which swell arrives.
   * @param {number|string} relativeHours - hour difference from reference station (or "NA").
   */
  constructor(stationId, stationName, arrivalOrder, relativeHours) {
    // These become instance properties, like in Python self.stationId = stationId
    this.stationId = stationId;
    this.stationName = stationName;
    this.arrivalOrder = arrivalOrder;
    this.relativeHours = relativeHours;

    // We'll store all processed time-series data here, after we parse it
    this.timeSeries = [];
  }

  /**
   * `fetchData` is an asynchronous method that uses `fetch` to make an HTTP request
   * to the surfbuoys API. 
   * 
   * If the request fails, it throws an error; otherwise it returns the parsed JSON.
   * 
   * @returns {Promise<Array>} The raw, un-transformed JSON data from the API.
   */
  async fetchData() {
    // We build the URL by combining the base URL with the station ID
    const url = `${API_BASE_URL}/${this.stationId}`;

    // Use fetch to get the data. In Node.js, fetch returns a promise.
    const response = await fetch(url);

    // If the response is not "ok" (status 200-299), we throw an error
    if (!response.ok) {
      throw new Error(
        `Failed to fetch station ${this.stationId}. HTTP status ${response.status}`
      );
    }

    // Return the body of the response as JSON (this also returns a promise)
    return response.json();
  }

  /**
   * `parseData` receives raw data (an array of measurement objects) 
   * and transforms it by:
   * - Sorting by GMT timestamp
   * - Trimming to the first `numReadings` measurements
   * - Converting each measurement into a standard shape
   *
   * @param {Array} rawData - The raw data array from `fetchData`.
   * @param {number} numReadings - How many readings to keep.
   */
/**
 * Parse and normalize rawData into this.timeSeries.
 *
 * @param {*} rawData      The fetch() result: could be an Array,
 *                         or an object like { data: [...] }, or { [stationId]: [...] }.
 * @param {number} numReadings  How many readings to keep.
 */
  parseData(rawData, numReadings) {
    let measurements;

    // 1. Raw data is already an Array?
    if (Array.isArray(rawData)) {
      measurements = rawData;

    // 2. Raw data is an object with a .data Array?
    } else if (
      rawData !== null &&
      typeof rawData === "object" &&
      Array.isArray(rawData.data)
    ) {
      measurements = rawData.data;

    // 3. Raw data is an object keyed by station ID?
    } else if (
      rawData !== null &&
      typeof rawData === "object" &&
      Array.isArray(rawData[this.stationId])
    ) {
      measurements = rawData[this.stationId];

    } else {
      // Nothing matched – throw a clear error so you know exactly what shape you got
      throw new Error(
        `parseData expected an Array, { data: Array }, or { ${this.stationId}: Array }, but got:\n` +
        JSON.stringify(rawData).slice(0, 200) + "…"
      );
    }

    // Now measurements is guaranteed to be an Array, so we can sort + slice + map:

    // Sort ascending by timestamp (newer first)
    measurements.sort((a, b) => new Date(a.GMT) - new Date(b.GMT));

    // Take only the first `numReadings`
    const trimmed = measurements.slice(0, numReadings);

    // Build our normalized timeSeries
    this.timeSeries = trimmed.map((entry) => {
      const { GMT, height, period, swellDir } = entry;

      let timestampUTC;
      try {
        timestampUTC = new Date(GMT).toISOString();
      } catch {
        timestampUTC = GMT;
      }

      return {
        timestampUTC,
        waveHeight_m: height != null ? parseFloat(height) : null,
        wavePeriod_s: period != null ? parseFloat(period) : null,
        swellDirection: swellDir || null,
      };
    });
  }


  /**
   * `getTransformedData` returns an object in the final shape 
   * we expect for each station, i.e.:
   * {
   *   arrivalOrder_NW_swell: number,
   *   relativeHoursFromPauwela: number|string,
   *   timeSeries: Array
   * }
   *
   * We'll use this data when we're ready to combine all buoys into one 
   * final JSON structure or string prompt for an LLM.
   * 
   * @returns {Object} The final transformed data object for this station.
   */
  getTransformedData() {
    return {
      arrivalOrder_NW_swell: this.arrivalOrder,
      relativeHoursFromPauwela: this.relativeHours,
      timeSeries: this.timeSeries,
    };
  }
}

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
    const response = await fetch(url, { cache: 'no-cache' });

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
parseData(rawData, numReadings, outputFormat = "readable") {
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

  // Sort ascending (oldest first)
  measurements.sort((a, b) => new Date(a.GMT) - new Date(b.GMT));

  // Take the *newest* numReadings by slicing from the end
  const trimmed = measurements.slice(-numReadings);

  // Build normalized timeSeries
  this.timeSeries = trimmed.map((entry) => {
    const {
      GMT,
      height,
      period,
      swellDir,
      windSpeed,
      windGust,
      windDir,
      airTemp,
      waterTemp,
    } = entry;

    let timestampUTC;
    try {
      timestampUTC = new Date(GMT).toISOString();
    } catch {
      timestampUTC = GMT;
    }

    let result = {
      timestampUTC,
    };

    if (this.stationId === "KLIH1") {
      result = {
        ...result,
        windSpeed: windSpeed != null ? parseFloat(windSpeed) : null,
        windGust: windGust != null ? parseFloat(windGust) : null,
        windDir: windDir || null,
        airTemp: airTemp != null ? parseFloat(airTemp) : null,
        waterTemp: waterTemp != null ? parseFloat(waterTemp) : null,
      };
    } else {
      result = {
        ...result,
        waveHeight_ft: height != null ? parseFloat(height) : null,
        wavePeriod_s: period != null ? parseFloat(period) : null,
        swellDirection: swellDir || null,
      };
    }

    return result;
  });
  // const toHST = (utcString) => {
  //   const date = new Date(utcString);

  //   // 1) Convert to HST (UTC−10)
  //   date.setHours(date.getHours() - 10);

  //   // 2) Pull out date parts
  //   const mm = String(date.getMonth() + 1).padStart(2, "0");
  //   const dd = String(date.getDate()).padStart(2, "0");
  //   let hh = date.getHours();      // 0–23
  //   const min = String(date.getMinutes()).padStart(2, "0");

  //   // 3) Build 12‑hour clock
  //   const ampm = hh >= 12 ? "PM" : "AM";
  //   hh = hh % 12 || 12;            // map “0” → “12”

  //   // 4) Return MM/DD h:MM AM/PM
  //   return `${mm}/${dd} ${hh}:${min} ${ampm}`;
  // };

  // Convert from UTC to HST (UTC-10) in a short format
  const toHST = (utcString) => {
    const date = new Date(utcString);
    // Subtract 10 hours to get HST
    date.toLocaleString("en-US", { timeZone: "Pacific/Honolulu" });

    // Format as YYYY-MM-DD HH:MM HST (short and consistent)
    // (Feel free to adjust formatting as you prefer)
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${mm}/${dd} ${hh}:${min}`;
  };

  // Return JSON if requested
  if (outputFormat === "json") {
    return JSON.stringify(this.timeSeries, null, 2);
  }

  // Otherwise, return a compact, readable format
  // (Prefix each line with this.stationId, as in your example)
  const waveHeights = this.timeSeries
    .map((ts) => (ts.waveHeight_ft != null ? ts.waveHeight_ft : "null"))
    .join(" | ");
  const wavePeriods = this.timeSeries
    .map((ts) => (ts.wavePeriod_s != null ? ts.wavePeriod_s : "null"))
    .join(" | ");
  const directions = this.timeSeries
    .map((ts) => (ts.swellDirection != null ? ts.swellDirection : "null"))
    .join(" | ");
  const timestamps = this.timeSeries
    .map((ts) => toHST(ts.timestampUTC))
    .join(" | ");

  if (this.stationId === "KLIH1") {
    const timestamps = this.timeSeries
      .map((ts) => toHST(ts.timestampUTC))
      .join(" | ");
    const windSpeeds = this.timeSeries
      .map((ts) => (ts.windSpeed != null ? parseFloat(ts.windSpeed) : "null"))
      .join(" | ");
    const windGusts = this.timeSeries
      .map((ts) => (ts.windGust != null ? parseFloat(ts.windGust) : "null"))
      .join(" | ");
    const windDirs = this.timeSeries
      .map((ts) => (ts.windDir != null ? ts.windDir : "null"))
      .join(" | ");


    return [
      'timestamps: ' + timestamps,
      `windSpeed_mph: ${windSpeeds}`,
      `windGust_mph: ${windGusts}`,
      `windDirection: ${windDirs}`,
      '\n',

    ].join("\n");
  }

  return [
    `arrivalOrder_NW_swell: ${this.arrivalOrder}`,
    `relativeHoursFromPauwela: ${this.relativeHours}`,
    `waveHeight_ft: ${waveHeights}`,
    `wavePeriod_s: ${wavePeriods}`,
    `swellDirection: ${directions}`,
    `timestamps: ${timestamps}`,
    '\n',
  ].join("\n");
}

  getTransformedData() {
    return {
      arrivalOrder_NW_swell: this.arrivalOrder,
      relativeHoursFromPauwela: this.relativeHours,
      timeSeries: this.timeSeries,
    };
  }
}

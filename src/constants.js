// constants.js

/**
 * A dictionary mapping buoy station IDs to their "arrival order"
 * (an integer representing the order in which the swells arrive).
 */
export const ARRIVAL_ORDERS = {
  "51101": 1,
  "51208": 2,
  "51201": 3,
  "51210": 4,
  "51202": 4, // shares same order as 51210, per your original code
  "51205": 5,
  "51213": "NA",
  "51002": "NA",
  "KLIH1": "NA"

};

/**
 * A dictionary mapping each station ID to its human-readable name.
 */
export const STATION_NAME_MAP = {
  "51101": "H2NorthWest",
  "51208": "Hanalei",
  "51201": "Waimea",
  "51210": "Kaneohe",
  "51202": "Mokapu",
  "51205": "Pauwela",
  "51213": "Kaumalapau, Lanai",
  "51002": "215NM SSW of Hilo, HI",

  "KLIH1": "Kahului Airport",
};

/**
 * A dictionary mapping each station to a relative hour offset 
 * from the reference station "Pauwela." This can be a number or "NA" 
 * if not applicable. 
 */
export const RELATIVE_HOURS_FROM_PAUWELA = {
  "51205": 0,
  "51208": 12,
  "51210": "NA",
  "51202": "NA",
  "51201": 6,
  "51101": 24,
  "51213": "NA",
  "51002": "NA",
  "KLIH1": "NA",
};

/**
 * The base URL for fetching wave data from the surfbuoys API.
 * In Python you used: https://api.surfbuoys.com/wavedata/stationId/{stationId}
 * Here, we define only the prefix so we can dynamically add the station ID later.
 */
export const API_BASE_URL = "https://api.surfbuoys.com/wavedata/stationId";

export const NUM_READINGS = 10; // Number of readings to fetch from the API
export const BASE_PROMPT = `Be concise, keep it the length of a short text message.
You are an expert surf forecaster for Maui island. Interpret the following buoy data across the Hawaiian Islands. Use the arrivalOrder_NW_swell to track the northwest swell’s progression, and relativeHoursFromPauwela to compare timing across stations. Consider changes in waveHeight_ft, wavePeriod_s, and swellDirection over the last 6 hours to determine whether the swell is rising, peaking, or fading. take into account how swells propogate etc, (eg the period arrives first, then the waveheight slowly increases, peaks then fads, then the period goes away, right?)

Then, predict how the swell will evolve over the next several hours at each station, based on recent trends and relative timing. Be concise and focus on insights that matter to surfers.

NorthWest Swells go from H2NorthWest > ~6hrs > Hanalei > ~6hrs > Waimea > ~6hrs> Pauwela> 

Always mention whats been happening with the buoys, and if there is a swell somewhere, discuss specific timing in windows (10am-12 eg). relate the buoy trends to the forecast. 

Data format:
For each buoy:
  •  arrivalOrder_NW_swell
  •  relativeHoursFromPauwela
  •  timeSeries (timestamps, waveHeight_ft, wavePeriod_s, swellDirection)
for weather station there is only wind information (kahului)

Also included is an NWS forecast. Please:
1. Summarize the **current** wave conditions and predict how conditions will **change** over the next 12–24 hours, noting the NW swell arrival timeline by location. 

Keep the response **terse and precise** like a text message from a friend who is an expert. concisely describe what's happening with swells and wind, and then relate it to what you see generally in the buoy data. (buoy data is in feet)`;

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
};

/**
 * A dictionary mapping each station ID to its human-readable name.
 */
export const STATION_NAME_MAP = {
  "51205": "Pauwela",
  "51208": "Hanalei",
  "51210": "Kaneohe",
  "51202": "Mokapu",
  "51201": "Waimea",
  "51101": "H2NorthWest",
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
};

/**
 * The base URL for fetching wave data from the surfbuoys API.
 * In Python you used: https://api.surfbuoys.com/wavedata/stationId/{stationId}
 * Here, we define only the prefix so we can dynamically add the station ID later.
 */
export const API_BASE_URL = "https://api.surfbuoys.com/wavedata/stationId";

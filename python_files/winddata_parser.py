import json
from datetime import datetime

# fetch from https://api.surfbuoys.com/wavedata/stationId/KLIH1
import requests


def fetch_klih1_data():
    url = "https://api.surfbuoys.com/wavedata/stationId/KLIH1"
    resp = requests.get(url)
    resp.raise_for_status()
    return {"KLIH1": resp.json()}


def transform_klih1_to_kahului(input_file, output_file, num_readings=6):
    """
    Parses the 'KLIH1' station data from input_file, sorts by 'GMT',
    renames the station to 'kahului', and extracts only:
      - timestamp (UTC)
      - wind speed
      - wind direction
      - wind gust

    The output will include the first `num_readings` entries (default=6).
    Saves the transformed JSON to output_file.
    """

    with open(input_file, "r") as f:
        raw_data = json.load(f)

    # Grab the list of measurements for KLIH1 (default to empty list if missing)
    klih1_measurements = raw_data.get("KLIH1", [])

    # Sort measurements by timestamp ascending, if possible
    def parse_gmt(entry):
        gmt_str = entry.get("GMT")
        if not gmt_str:
            return datetime.min  # If no GMT, push it to the beginning
        try:
            # Attempt to parse as ISO-like datetime
            return datetime.fromisoformat(gmt_str.replace("Z", ""))
        except ValueError:
            # If it fails, default to a minimal time
            return datetime.min

    klih1_measurements.sort(key=parse_gmt)

    # Take only the first `num_readings`
    trimmed = klih1_measurements[:num_readings]

    # Build the new data structure
    kahului_data = []

    for entry in trimmed:
        timestamp_utc = entry.get("GMT")  # Original or parse if you prefer
        wind_dir = entry.get("windDir")

        # Convert wind speed & gust to float if valid, else None
        try:
            wind_speed = float(entry["windSpeed"]) if entry.get("windSpeed") else None
        except ValueError:
            wind_speed = None

        try:
            wind_gust = float(entry["windGust"]) if entry.get("windGust") else None
        except ValueError:
            wind_gust = None

        kahului_data.append(
            {
                "timestampUTC": timestamp_utc,
                "windDirection": wind_dir,
                "windSpeed": wind_speed,
                "windGust": wind_gust,
            }
        )

    # Wrap the results under the new station name
    transformed_data = {"kahului": kahului_data}

    # Write the output JSON
    with open(output_file, "w") as f:
        json.dump(transformed_data, f, indent=2)


# Example usage:
# transform_klih1_to_kahului("klih1_input.json", "kahului_wind.json", 6)
# print("Transformed data saved to kahului_wind.json")

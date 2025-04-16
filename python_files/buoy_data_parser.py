import json
from datetime import datetime

# fetch from https://api.surfbuoys.com/wavedata/stationId/{buoy_id}
import requests


def fetch_buoy_data(buoy_ids):
    base_url = "https://api.surfbuoys.com/wavedata/stationId/"
    data = {}
    for buoy_id in buoy_ids:
        url = f"{base_url}{buoy_id}"
        resp = requests.get(url)
        resp.raise_for_status()
        data[buoy_id] = resp.json()
    return data


def transform_buoy_data(input_file, output_file, num_readings):
    # Predefined reference dictionaries
    arrival_orders = {
        "51101": 1,
        "51208": 2,
        "51201": 3,
        "51210": 4,
        "51202": 4,
        "51205": 5,
    }
    station_name_map = {
        "51205": "Pauwela",
        "51208": "Hanalei",
        "51210": "Kaneohe",
        "51202": "Mokapu",
        "51201": "Waimea",
        "51101": "H2NorthWest",
    }
    # This dictionary gives the approximate delay (in hours) from Pauwela
    relative_hours_from_pauwela = {
        "51205": 0,
        "51208": 12,
        "51210": "NA",
        "51202": "NA",
        "51201": 6,
        "51101": 24,
    }

    with open(input_file, "r") as f:
        raw_data = json.load(f)

    transformed_data = {}

    for station_id, measurements in raw_data.items():
        # Sort measurements by timestamp so we have a clear chronological order
        # Assuming 'GMT' is an ISO-8601 date string or similar
        measurements.sort(key=lambda x: x["GMT"])

        # Take only the first num_readings items after sorting
        trimmed_measurements = measurements[:num_readings]

        # Look up station metadata
        arrival_order = arrival_orders.get(station_id)
        station_name = station_name_map.get(station_id, station_id)
        rel_hours = relative_hours_from_pauwela.get(station_id, "NA")

        time_series = []
        for entry in trimmed_measurements:
            wave_height = float(entry["height"]) if entry.get("height") else None
            wave_period = float(entry["period"]) if entry.get("period") else None
            swell_dir = entry.get("swellDir")
            timestamp_str = entry["GMT"]

            # Optionally, parse and re-format timestamp for clarity
            # If 'GMT' is already a nice ISO string, you can keep it as is.
            try:
                dt = datetime.fromisoformat(timestamp_str.replace("Z", ""))
                # Convert back to ISO with trailing Z for clarity
                timestamp_utc = dt.isoformat() + "Z"
            except ValueError:
                # If we can’t parse, just keep the original string
                timestamp_utc = timestamp_str

            time_series.append(
                {
                    "timestampUTC": timestamp_utc,
                    "waveHeight_m": wave_height,
                    "wavePeriod_s": wave_period,
                    "swellDirection": swell_dir,
                }
            )

        # Build the per-station result
        transformed_data[station_name] = {
            "arrivalOrder_NW_swell": arrival_order,
            "relativeHoursFromPauwela": rel_hours,
            "timeSeries": time_series,
        }

    # Write output to JSON
    with open(output_file, "w") as f:
        json.dump(transformed_data, f, indent=2)


if __name__ == "__main__":
    num_readings = 15

    input_json = "buoydata.json"
    output_json = "parsed_buoydata.json"
    transform_buoy_data(input_json, output_json, num_readings)
    print(f"Transformed JSON saved to {output_json}")

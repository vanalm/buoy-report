// index.js
import { getSurfForecast } from "./fetchSurfForecast.js"; // Import the surf forecast function
import { Buoy } from "./Buoy.js";
import config from "./config.js"; 
import {
  ARRIVAL_ORDERS,
  STATION_NAME_MAP,
  RELATIVE_HOURS_FROM_PAUWELA,
  BASE_PROMPT

} from "./constants.js";

const { numReadings } = config; 
/**
 * Because we are writing an async function `main()` which uses `await`,
 * we’ll wrap it in an immediately-invoked function expression or 
 * just call `main()` at the bottom.
 * 
 * This pattern allows us to use `await` at the top level, 
 * which is not allowed in plain JS files (unless you're in a module).
 */
async function main() {

  // We'll build an array of station IDs from the keys of STATION_NAME_MAP, 
  // which are "51205", "51208", etc. 
  // Alternatively, you could define them manually or from other data.
  const stationIds = Object.keys(STATION_NAME_MAP);

  //   feed each stationId in the array into a new Buoy instance.
  //  this creates an object that looks like this:
  //   [
  //     Buoy { stationId: '51205', stationName: 'Buoy 1', ... },
  //     Buoy { stationId: '51208', stationName: 'Buoy 2', ... },
  //     ...
  //   ]
  const buoys = stationIds.map((stationId) => {
    // We use the `||` operator to provide default values if a key isn't found.
    return new Buoy(
      stationId,
      STATION_NAME_MAP[stationId] || stationId,    
      ARRIVAL_ORDERS[stationId] || null,        
      RELATIVE_HOURS_FROM_PAUWELA[stationId] || "NA"
    );
  });

    // fetch and parse all buoys to produce an array of readable segments
    const readableStrings = await Promise.all(
      buoys.map(async (buoy) => {
        try {
          const rawData = await buoy.fetchData();
          const result = buoy.parseData(rawData, numReadings, "readable");
          return `\n--- ${buoy.stationName} ---\n${result}`;
        } catch (error) {
          console.error(`Error processing buoy ${buoy.stationId}:`, error);
          return '';
        }
      })
    );
    // join all segments into one string
    const readableString = readableStrings.join('');
    
    // fetch surf forecast and include in prompt
    const surfForecast = await getSurfForecast();

  const transformedData = {};
  for (const buoy of buoys) {
    transformedData[buoy.stationName] = buoy.getTransformedData();
  }

  const llmPromptString = JSON.stringify(transformedData, null, 2);
  // current time in hawaii timezone, iso format
  const hawaiiTime = new Date().toLocaleString("en-US", {
    timeZone: "Pacific/Honolulu",
  });
  const fullPrompt = `${BASE_PROMPT}\n\nCurrent Date time: ${hawaiiTime}\n\nSurf Forecast:\n${surfForecast}\n\nBuoy Data\n${readableString}`;
  console.log(fullPrompt);

  // Example for writing to a file (Node.js):
  /*
  import fs from 'fs';
  fs.writeFileSync("parsed_buoydata.json", llmPromptString);
  */
}


main().catch((err) => console.error("Fatal error:", err));

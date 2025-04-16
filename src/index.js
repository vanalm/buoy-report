// index.js

import { Buoy } from "./Buoy.js";
import config from "./config.js"; 
import {
  ARRIVAL_ORDERS,
  STATION_NAME_MAP,
  RELATIVE_HOURS_FROM_PAUWELA,
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
  const buoys = stationIds.map((stationId) => {
    // We use the `||` operator to provide default values if a key isn't found.
    return new Buoy(
      stationId,
      STATION_NAME_MAP[stationId] || stationId,    
      ARRIVAL_ORDERS[stationId] || null,        
      RELATIVE_HOURS_FROM_PAUWELA[stationId] || "NA"
    );
  });

    // Run all fetch-and-parse operations in parallel:
    await Promise.all(
    buoys.map(async (buoy) => {
        try {
        // fetchData() still returns a Promise, now kicked off in parallel
        const rawData = await buoy.fetchData();

        // parseData() is synchronous, but runs as soon as fetchData resolves
        buoy.parseData(rawData, numReadings);
        } catch (error) {
        console.error(`Error processing buoy ${buoy.stationId}:`, error);
        }
    })
    );


  const transformedData = {};
  for (const buoy of buoys) {
    transformedData[buoy.stationName] = buoy.getTransformedData();
  }

  const llmPromptString = JSON.stringify(transformedData, null, 2);

  // For demonstration, we’ll just print it to the console.
  // In a real scenario, you could store it in a file or send it via an API.
  console.log("Prompt for LLM:\n", llmPromptString);

  // Example for writing to a file (Node.js):
  /*
  import fs from 'fs';
  fs.writeFileSync("parsed_buoydata.json", llmPromptString);
  */
}


main().catch((err) => console.error("Fatal error:", err));

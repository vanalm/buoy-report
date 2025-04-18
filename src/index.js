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

    // Run all fetch-and-parse operations in parallel:a 
    await Promise.all(
      buoys.map(async (buoy) => {
        try {
          const rawData = await buoy.fetchData();
          const result = buoy.parseData(rawData, numReadings, "readable");
          console.log(`\n--- ${buoy.stationName} ---\n${result}`);
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



  // Example for writing to a file (Node.js):
  /*
  import fs from 'fs';
  fs.writeFileSync("parsed_buoydata.json", llmPromptString);
  */
}


main().catch((err) => console.error("Fatal error:", err));

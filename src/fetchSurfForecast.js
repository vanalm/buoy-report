import { load } from 'cheerio';

export async function getSurfForecast() {
    const url = 'https://www.hawaiiweathertoday.com/surfing/';
    const res = await fetch(url);
    const html = await res.text();
    
    // parse into a DOM using cheerio
    const $ = load(html);
    // grab the element whose text contains both our start/end markers
    const el = $('p, div, span, section').toArray().find(e => {
      const txt = $(e).text();
      return /Forecast/.test(txt) && /maui beaches/i.test(txt);
    });
    if (!el) throw new Error('Forecast element not found');
    
    // extract just the portion between “Forecast” and “maui beaches”
    const text = $(el).text();
    const match = text.match(/Forecast([\s\S]*?)(?=maui beaches)/i);
    if (!match) throw new Error('Couldn’t extract forecast text');
    
    // clean out ad/junk lines
    const rawForecast = match[1].trim();
    const lines = rawForecast.split(/\r?\n/);
    const filtered = lines
      .filter(line => !/google/i.test(line))
      .join('\n')
      .trim();
    return filtered;
  }
  
//   // usage example
//   getSurfForecast()
//     .then(forecast => console.log(forecast))
//     .catch(err => console.error(err));

// ZIP code lookup against the bundled data in data/zip/ (works offline once loaded).

import { haversineMiles } from './util.js';

const chunkCache = new Map();
let indexPromise;

async function loadChunk(prefix) {
  if (!chunkCache.has(prefix)) {
    chunkCache.set(
      prefix,
      fetch(`./data/zip/${prefix}.json`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch((err) => {
          chunkCache.delete(prefix);
          throw err;
        }),
    );
  }
  return chunkCache.get(prefix);
}

function toPlace(zip, rec, source = 'zip') {
  const [city, state, county, fips, lat, lon] = rec;
  return { zip, city, state, county, fips, lat, lon, source };
}

export async function lookupZip(zip) {
  zip = String(zip).trim();
  if (!/^\d{5}$/.test(zip)) return null;
  const chunk = await loadChunk(zip.slice(0, 2));
  return chunk[zip] ? toPlace(zip, chunk[zip]) : null;
}

// Nearest ZIP to a coordinate, using the per-chunk bounding boxes in index.json.
export async function nearestZip(lat, lon) {
  indexPromise ||= fetch('./data/zip/index.json').then((r) => r.json());
  const index = await indexPromise;
  const pad = 0.75;
  const prefixes = Object.entries(index)
    .filter(([, [s, w, n, e]]) => lat >= s - pad && lat <= n + pad && lon >= w - pad && lon <= e + pad)
    .map(([p]) => p);
  let best = null;
  for (const p of prefixes) {
    const chunk = await loadChunk(p);
    for (const [zip, rec] of Object.entries(chunk)) {
      const d = haversineMiles(lat, lon, rec[4], rec[5]);
      if (!best || d < best.d) best = { d, zip, rec };
    }
  }
  if (!best || best.d > 60) return null;
  return { ...toPlace(best.zip, best.rec, 'gps'), lat, lon, approxMiles: best.d };
}

export const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands',
  GU: 'Guam', AS: 'American Samoa', MP: 'Northern Mariana Islands',
};

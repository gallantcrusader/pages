// Live data feeds. Every source is free, needs no API key, and is called straight from
// the visitor's browser. Each returns { items, at, stale } or throws; callers render
// a friendly fallback with a link to the official page when a source is down.

import { CONFIG } from './config.js';
import { fetchJSON, haversineMiles } from './util.js';

const NWS = 'https://api.weather.gov';
const NWS_HEADERS = { Accept: 'application/geo+json' };
const r4 = (n) => Number(n).toFixed(4);

// --- National Weather Service: point metadata (office, radar, county zone, forecast) ---
export async function nwsPoint(lat, lon) {
  const res = await fetchJSON(`${NWS}/points/${r4(lat)},${r4(lon)}`, {
    cacheKey: `point:${r4(lat)},${r4(lon)}`,
    maxAgeMin: 60 * 24 * 7,
    headers: NWS_HEADERS,
  });
  const p = res.data.properties || {};
  return {
    cwa: p.cwa || p.gridId,
    radar: p.radarStation,
    timeZone: p.timeZone,
    forecastUrl: p.forecast,
    countyZone: (p.county || '').split('/').pop(),
    forecastZone: (p.forecastZone || '').split('/').pop(),
    city: p.relativeLocation?.properties?.city,
    state: p.relativeLocation?.properties?.state,
  };
}

const SEVERITY_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

export async function nwsAlerts(lat, lon) {
  const res = await fetchJSON(`${NWS}/alerts/active?point=${r4(lat)},${r4(lon)}`, {
    cacheKey: `alerts:${r4(lat)},${r4(lon)}`,
    headers: NWS_HEADERS,
  });
  const items = (res.data.features || [])
    .map((f) => f.properties || {})
    .filter((a) => a.status !== 'Test')
    .sort((a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0));
  return { ...res, items };
}

export async function nwsForecast(url) {
  const res = await fetchJSON(url, { cacheKey: `fc:${url}`, maxAgeMin: 30, headers: NWS_HEADERS });
  return { ...res, items: (res.data.properties?.periods || []).slice(0, 4) };
}

// --- Local Storm Reports (damage, flooding, surge, downed trees) via Iowa Environmental Mesonet ---
export async function stormReports(cwa, place, hours = 72) {
  const url = `https://mesonet.agron.iastate.edu/geojson/lsr.geojson?wfos=${encodeURIComponent(cwa)}&hours=${hours}`;
  const res = await fetchJSON(url, { cacheKey: `lsr:${cwa}` });
  const items = (res.data.features || [])
    .map((f) => {
      const p = f.properties || {};
      const [lon, lat] = f.geometry?.coordinates || [p.lon, p.lat];
      const valid = /Z$|[+-]\d\d:?\d\d$/.test(p.valid || '') ? p.valid : (p.valid || '').replace(' ', 'T') + 'Z';
      return {
        type: p.typetext || p.type || 'Report',
        magnitude: p.magnitude,
        unit: p.unit,
        city: p.city,
        county: p.county,
        state: p.st || p.state,
        source: p.source,
        remark: p.remark,
        time: valid,
        lat: Number(lat),
        lon: Number(lon),
        miles: place ? haversineMiles(place.lat, place.lon, Number(lat), Number(lon)) : null,
      };
    })
    .filter((r) => r.miles == null || r.miles <= CONFIG.nearbyMiles)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
  return { ...res, items };
}

// --- National Hurricane Center: active tropical cyclones ---
const CLASSIFICATION = {
  HU: 'Hurricane', TS: 'Tropical Storm', TD: 'Tropical Depression', STS: 'Subtropical Storm',
  STD: 'Subtropical Depression', PTC: 'Potential Tropical Cyclone', PC: 'Post-Tropical Cyclone',
  TY: 'Typhoon', RL: 'Remnant Low',
};

export function hurricaneCategory(mph) {
  if (mph >= 157) return 5;
  if (mph >= 130) return 4;
  if (mph >= 111) return 3;
  if (mph >= 96) return 2;
  if (mph >= 74) return 1;
  return 0;
}

export async function activeStorms(place) {
  const res = await fetchJSON('https://www.nhc.noaa.gov/CurrentStorms.json', { cacheKey: 'nhc', maxAgeMin: 10 });
  const items = (res.data.activeStorms || []).map((s) => {
    const id = String(s.id || '').toUpperCase(); // e.g. AL092026
    const basin = id.slice(0, 2);
    const num = id.slice(2, 4);
    const folder = (basin === 'AL' ? 'AT' : basin) + num;
    const kt = Number(s.intensity);
    const mph = Math.round(kt * 1.15078 / 5) * 5;
    const lat = Number(s.latitudeNumeric ?? s.latitude);
    const lon = Number(s.longitudeNumeric ?? s.longitude);
    return {
      id,
      name: s.name,
      kind: CLASSIFICATION[s.classification] || s.classification || 'Tropical system',
      mph: isNaN(mph) ? null : mph,
      category: s.classification === 'HU' && !isNaN(mph) ? hurricaneCategory(mph) : 0,
      pressure: s.pressure,
      movement: s.movementDir != null && s.movementSpeed != null ? `${compassFromDeg(s.movementDir)} at ${Math.round(s.movementSpeed * 1.15078)} mph` : '',
      updated: s.lastUpdate,
      advisoryUrl: s.publicAdvisory?.url,
      graphicsUrl: s.binNumber ? `https://www.nhc.noaa.gov/graphics_${String(s.binNumber).toLowerCase()}.shtml?cone` : 'https://www.nhc.noaa.gov',
      coneImg: `https://www.nhc.noaa.gov/storm_graphics/${folder}/${id}_5day_cone_no_line_and_wind.png`,
      miles: place && !isNaN(lat) && !isNaN(lon) ? haversineMiles(place.lat, place.lon, lat, lon) : null,
    };
  });
  return { ...res, items };
}

function compassFromDeg(deg) {
  return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][
    Math.round(Number(deg) / 22.5) % 16
  ];
}

// --- FEMA disaster declarations for the county (and statewide) ---
export async function femaDeclarations(place) {
  const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const filter = `state eq '${place.state}' and declarationDate ge '${since}T00:00:00.000Z'`;
  const url =
    'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=' +
    encodeURIComponent(filter) +
    '&$orderby=' + encodeURIComponent('declarationDate desc') + '&$top=500';
  const res = await fetchJSON(url, { cacheKey: `fema:${place.state}`, maxAgeMin: 60 });
  const county = (place.fips || '').slice(2);
  const byDisaster = new Map();
  for (const d of res.data.DisasterDeclarationsSummaries || []) {
    const mine = d.fipsCountyCode === county || d.fipsCountyCode === '000';
    if (!mine) continue;
    const prev = byDisaster.get(d.disasterNumber);
    if (!prev || (prev.fipsCountyCode === '000' && d.fipsCountyCode === county)) byDisaster.set(d.disasterNumber, d);
  }
  const items = [...byDisaster.values()].map((d) => ({
    number: d.disasterNumber,
    type: { DR: 'Major Disaster', EM: 'Emergency', FM: 'Fire Management' }[d.declarationType] || d.declarationType,
    title: d.declarationTitle,
    incident: d.incidentType,
    date: d.declarationDate,
    area: d.designatedArea,
    individualAssistance: Boolean(d.ihProgramDeclared || d.iaProgramDeclared),
    publicAssistance: Boolean(d.paProgramDeclared),
    deadline: d.lastIAFilingDate,
    url: `https://www.fema.gov/disaster/${d.disasterNumber}`,
  }));
  return { ...res, items };
}

// --- River & flood gauges (NOAA National Water Prediction Service) ---
const FLOOD_RANK = { major: 4, moderate: 3, minor: 2, action: 1 };

export async function floodGauges(place) {
  const dLat = 0.6;
  const dLon = 0.7;
  const url =
    'https://api.water.noaa.gov/nwps/v1/gauges?' +
    new URLSearchParams({
      'bbox.xmin': (place.lon - dLon).toFixed(3),
      'bbox.ymin': (place.lat - dLat).toFixed(3),
      'bbox.xmax': (place.lon + dLon).toFixed(3),
      'bbox.ymax': (place.lat + dLat).toFixed(3),
      srid: 'EPSG_4326',
    });
  const res = await fetchJSON(url, { cacheKey: `gauges:${place.zip || r4(place.lat)}` });
  const items = (res.data.gauges || [])
    .map((g) => {
      const obs = g.status?.observed || {};
      const fc = g.status?.forecast || {};
      return {
        id: g.lid,
        name: g.name,
        lat: g.latitude,
        lon: g.longitude,
        level: obs.primary,
        unit: obs.primaryUnit,
        category: (obs.floodCategory || '').toLowerCase(),
        forecastCategory: (fc.floodCategory || '').toLowerCase(),
        time: obs.validTime,
        miles: haversineMiles(place.lat, place.lon, g.latitude, g.longitude),
        url: `https://water.noaa.gov/gauges/${String(g.lid || '').toLowerCase()}`,
      };
    })
    .filter((g) => g.level != null && g.level > -900)
    .sort((a, b) => {
      const r = Math.max(FLOOD_RANK[b.category] || 0, FLOOD_RANK[b.forecastCategory] || 0) -
        Math.max(FLOOD_RANK[a.category] || 0, FLOOD_RANK[a.forecastCategory] || 0);
      return r || a.miles - b.miles;
    });
  return { ...res, items };
}

export function floodLabel(cat) {
  return { major: 'Major flooding', moderate: 'Moderate flooding', minor: 'Minor flooding', action: 'Near flood stage', no_flooding: 'Normal' }[cat] || '';
}

// --- Community reports (GitHub Issues in this site's repo) ---
export async function communityReports() {
  const { owner, name } = CONFIG.repo;
  const url = `https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=100&sort=created&direction=desc`;
  const res = await fetchJSON(url, {
    cacheKey: 'reports',
    maxAgeMin: 3,
    headers: { Accept: 'application/vnd.github+json' },
  });
  const items = (Array.isArray(res.data) ? res.data : [])
    .filter((i) => !i.pull_request)
    .filter((i) => /^\[Report\]/i.test(i.title) || (i.labels || []).some((l) => l.name === 'community-report'))
    .map(parseReport)
    .filter((r) => r.zip);
  return { ...res, items };
}

function section(body, heading) {
  const re = new RegExp(`###\\s*${heading}[^\\n]*\\n+([\\s\\S]*?)(?=\\n###\\s|$)`, 'i');
  const m = (body || '').match(re);
  const v = m ? m[1].trim() : '';
  return v === '_No response_' ? '' : v;
}

export function parseReport(issue) {
  const body = issue.body || '';
  const titleMatch = issue.title.match(/\[Report\]\s*(?:([A-Z]{2})\s+)?(\d{5})?/i) || [];
  const zip = section(body, 'ZIP').match(/\d{5}/)?.[0] || titleMatch[2] || '';
  return {
    id: issue.number,
    url: issue.html_url,
    title: issue.title,
    open: issue.state === 'open',
    created: issue.created_at,
    updated: issue.updated_at,
    comments: issue.comments,
    state: (titleMatch[1] || '').toUpperCase(),
    zip,
    service: section(body, 'Service') || '',
    provider: section(body, 'Provider') || '',
    status: section(body, 'Status') || '',
    started: section(body, 'When did it start'),
    restored: section(body, 'When was it restored'),
    details: section(body, 'Details'),
  };
}

export function newReportUrl({ zip = '', state = '', service = '', provider = '', status = '', details = '' } = {}) {
  const { owner, name } = CONFIG.repo;
  const title = `[Report] ${state ? state + ' ' : ''}${zip}${service ? ' · ' + service : ''}${provider ? ' · ' + provider : ''}${status ? ' · ' + status : ''}`;
  const q = new URLSearchParams({ template: 'community-report.yml', title });
  if (zip) q.set('zip', zip);
  if (provider) q.set('provider', provider);
  if (details) q.set('details', details);
  return `https://github.com/${owner}/${name}/issues/new?${q}`;
}

// --- Is the internet reachable from this device? ---
export async function connectivityCheck() {
  const targets = [
    { label: 'This site (GitHub Pages)', url: `./manifest.webmanifest?ping=${Date.now()}`, mode: 'same-origin' },
    { label: 'Google', url: 'https://www.gstatic.com/generate_204', mode: 'no-cors' },
    { label: 'Cloudflare', url: `https://www.cloudflare.com/cdn-cgi/trace?ping=${Date.now()}`, mode: 'no-cors' },
  ];
  return Promise.all(
    targets.map(async (t) => {
      const start = performance.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        await fetch(t.url, { mode: t.mode, cache: 'no-store', signal: ctrl.signal });
        return { ...t, ok: true, ms: Math.round(performance.now() - start) };
      } catch {
        return { ...t, ok: false };
      } finally {
        clearTimeout(timer);
      }
    }),
  );
}

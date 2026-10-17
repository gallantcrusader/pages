// App state that persists on this device only (localStorage). Nothing is sent anywhere.

import { store, setTimeZone } from './util.js';
import { getProvider, providerPhone } from './providers.js';
import { nwsPoint } from './sources.js';

const saveData = Boolean(navigator.connection && navigator.connection.saveData);

export const state = {
  place: store.get('place'),
  nws: null,
  recent: store.get('recent', []),
  providers: store.get('providers', {}), // { [zip]: { electric: {...}, water: {...}, ... } }
  settings: { theme: 'auto', dataSaver: saveData, ...store.get('settings', {}) },
};

const listeners = new Set();
export function onChange(fn) {
  listeners.add(fn);
}
function emit(what) {
  listeners.forEach((fn) => fn(what));
}

export function setPlace(place) {
  state.place = place;
  state.nws = null;
  setTimeZone(undefined);
  store.set('place', place);
  if (place && place.zip) {
    state.recent = [place.zip, ...state.recent.filter((z) => z !== place.zip)].slice(0, 5);
    store.set('recent', state.recent);
  }
  emit('place');
}

export function setNws(nws) {
  state.nws = nws;
  if (nws && nws.timeZone) setTimeZone(nws.timeZone);
}

export function saveSettings(patch) {
  Object.assign(state.settings, patch);
  store.set('settings', state.settings);
  emit('settings');
}

function zipKey() {
  return state.place?.zip || 'gps';
}

// Returns a normalized provider: { id?, name, site, outage, phone, text, note, downdetector, network, custom }
export function myProvider(type) {
  const sel = state.providers[zipKey()]?.[type];
  if (!sel) return null;
  if (sel.id) {
    const p = getProvider(sel.id);
    if (!p) return null;
    return { ...p, phone: providerPhone(p, state.place?.state) };
  }
  return { ...sel, custom: true };
}

export function setMyProvider(type, value) {
  const key = zipKey();
  state.providers[key] = { ...(state.providers[key] || {}) };
  if (value) state.providers[key][type] = value;
  else delete state.providers[key][type];
  store.set('providers', state.providers);
  emit('providers');
}

// NWS point metadata (forecast office, radar, time zone) for the current place.
let nwsPromise = null;
export function ensureNws() {
  if (!state.place) return Promise.resolve(null);
  if (state.nws) return Promise.resolve(state.nws);
  const place = state.place;
  nwsPromise ||= nwsPoint(place.lat, place.lon)
    .then((n) => {
      if (state.place === place) setNws(n);
      return n;
    })
    .catch(() => null)
    .finally(() => {
      nwsPromise = null;
    });
  return nwsPromise;
}

export function countyLabel(place) {
  if (!place || !place.county) return '';
  const c = place.county;
  if (/\b(county|parish|borough|city|municipality|census area)\b/i.test(c)) return c;
  if (place.state === 'LA') return `${c} Parish`;
  if (place.state === 'AK') return `${c} Borough`;
  if (['PR', 'VI', 'GU'].includes(place.state)) return c;
  return `${c} County`;
}

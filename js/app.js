// StormCheck app shell: routing, location, header, global event handling.

import { CONFIG } from './config.js';
import { state, setPlace, onChange, ensureNws } from './state.js';
import { lookupZip, nearestZip } from './zip.js';
import { esc, store, toast } from './util.js';
import { zipForm } from './ui.js';
import * as home from './views/home.js';
import * as live from './views/live.js';
import * as services from './views/services.js';
import * as track from './views/track.js';
import * as safety from './views/safety.js';
import { updateBleach, findProviders } from './views/services.js';

const contacts = { render: safety.renderContacts, actions: safety.contactActions };
const about = { render: safety.renderAbout, actions: safety.aboutActions, changes: safety.aboutChanges };

const ROUTES = { '': home, home, live, services, track, safety, contacts, about };
const TAB_FOR = { '': 'home', home: 'home', live: 'live', services: 'services', track: 'track', safety: 'safety', contacts: 'safety', about: '' };
const TITLES = { live: 'Live feed', services: 'Services', track: 'Accountability', safety: 'Safety', contacts: 'Emergency numbers', about: 'About' };

const main = document.getElementById('view');
let token = 0;
let current = { view: home, ctx: null };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || '', parts, query: new URLSearchParams(query || '') };
}

function render({ keepScroll = false } = {}) {
  const route = parseHash();
  const view = ROUTES[route.name] || home;
  const my = ++token;
  const ctx = {
    route,
    alive: () => my === token,
    rerender: () => render({ keepScroll: true }),
  };
  current = { view, ctx };
  const y = window.scrollY;
  main.innerHTML = view.render(ctx);
  view.mount?.(ctx);
  updateChrome(route);
  if (keepScroll) window.scrollTo(0, y);
  else window.scrollTo(0, 0);
}

function updateChrome(route) {
  const tab = TAB_FOR[route.name] ?? 'home';
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const place = state.place;
  const chip = document.getElementById('loc-chip');
  chip.innerHTML = place
    ? `<span aria-hidden="true">📍</span> <span>${esc(place.zip || 'GPS')}</span><span class="chip-city"> · ${esc(place.city)}</span>`
    : '<span aria-hidden="true">📍</span> Set ZIP';
  chip.setAttribute('aria-label', place ? `Location: ${place.city}, ${place.state} ${place.zip || ''}. Change location` : 'Set your ZIP code');
  const t = TITLES[route.name];
  document.title = t ? `${t} · ${CONFIG.appName}` : place ? `${place.city}, ${place.state} · ${CONFIG.appName}` : `${CONFIG.appName} — Hurricane & outage info by ZIP`;
  renderBanner();
}

// ---------- Featured event banner ----------
function renderBanner() {
  const el = document.getElementById('event-banner');
  const ev = CONFIG.featuredEvent;
  const show =
    ev &&
    new Date() < new Date(ev.expires + 'T23:59:59') &&
    !store.get('dismissed:' + ev.id) &&
    (!state.place || !ev.states || ev.states.includes(state.place.state));
  if (!show) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = `<div><strong>${esc(ev.title)}</strong> — ${esc(ev.body)}</div>
    <button type="button" class="icon-btn" data-action="dismiss-banner" aria-label="Dismiss">×</button>`;
}

// ---------- Location ----------
async function setZip(zip, form) {
  const msg = form?.querySelector('.form-msg');
  const say = (t) => {
    if (msg) msg.textContent = t;
  };
  zip = String(zip || '').trim();
  if (!/^\d{5}$/.test(zip)) return say('Enter a 5-digit ZIP code.');
  say('Looking up…');
  try {
    const place = await lookupZip(zip);
    if (!place) return say(`We couldn’t find ZIP ${zip}. Check the number and try again.`);
    applyPlace(place);
  } catch {
    say('Couldn’t load ZIP data. Check your connection and try again.');
  }
}

function applyPlace(place) {
  setPlace(place);
  closeLocationDialog();
  ensureNws();
  autoFindProviders();
  if (['', 'home'].includes(parseHash().name)) render();
  else render({ keepScroll: true });
}

// First visit to a ZIP: try to fill in electric and water providers automatically.
function autoFindProviders() {
  const key = 'autofound:' + (state.place?.zip || 'gps');
  if (store.get(key)) return;
  store.set(key, true);
  findProviders(['electric', 'water']).then(() => {
    if (['', 'home', 'services'].includes(parseHash().name)) current.ctx?.rerender();
  });
}

function useGps(btn) {
  const form = btn.closest('form');
  const msg = form?.querySelector('.form-msg');
  const say = (t) => {
    if (msg) msg.textContent = t;
  };
  if (!navigator.geolocation) return say('Location isn’t available on this device. Enter a ZIP instead.');
  say('Finding your location…');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const place = await nearestZip(pos.coords.latitude, pos.coords.longitude);
        if (!place) return say('That location is outside the areas we cover. Enter a ZIP instead.');
        applyPlace(place);
      } catch {
        say('Couldn’t match your location to a ZIP. Enter one instead.');
      }
    },
    () => say('Location permission was denied or timed out. Enter a ZIP instead.'),
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
  );
}

function openLocationDialog() {
  const dlg = document.getElementById('loc-dialog');
  const recent = state.recent.filter((z) => z !== state.place?.zip);
  dlg.querySelector('.dialog-body').innerHTML = `
    <h2>Choose a location</h2>
    ${zipForm({ autofocus: true })}
    ${recent.length ? `<p class="small">Recent: ${recent.map((z) => `<button type="button" class="chip" data-action="recent-zip" data-zip="${esc(z)}">${esc(z)}</button>`).join(' ')}</p>` : ''}
    <p class="small muted">Check on family elsewhere by entering their ZIP — your providers are saved per ZIP.</p>`;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
  dlg.querySelector('input')?.focus();
}

function closeLocationDialog() {
  const dlg = document.getElementById('loc-dialog');
  if (dlg.open) dlg.close?.();
  dlg.removeAttribute('open');
}

// ---------- Global events ----------
const GLOBAL_ACTIONS = {
  gps: (btn) => useGps(btn),
  'change-place': () => openLocationDialog(),
  'recent-zip': (btn) => setZip(btn.dataset.zip, btn.closest('.dialog-body')?.querySelector('form')),
  'close-dialog': () => closeLocationDialog(),
  'dismiss-banner': () => {
    store.set('dismissed:' + CONFIG.featuredEvent.id, true);
    renderBanner();
  },
  'load-img': (btn) => {
    const img = document.createElement('img');
    img.src = btn.dataset.src;
    img.alt = btn.dataset.alt || '';
    img.className = 'feed-img';
    img.addEventListener('error', () => {
      img.replaceWith(Object.assign(document.createElement('p'), { className: 'small muted', textContent: 'Image unavailable right now.' }));
    });
    btn.replaceWith(img);
  },
  async 'find-providers'(btn) {
    btn.disabled = true;
    btn.textContent = 'Searching…';
    await findProviders(['electric', 'water']);
    toast('Done — check the Services page to confirm');
    current.ctx?.rerender();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const name = el.dataset.action;
  const handler = current.view.actions?.[name] || GLOBAL_ACTIONS[name];
  if (!handler) return;
  e.preventDefault();
  handler(el, current.ctx);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) {
    const handler = current.view.changes?.[el.dataset.change];
    if (handler) handler(el, current.ctx);
  }
  const bleach = e.target.closest('form.bleach');
  if (bleach) updateBleach(bleach);
});

document.addEventListener('input', (e) => {
  const bleach = e.target.closest('form.bleach');
  if (bleach) updateBleach(bleach);
  if (e.target.name === 'zip' && e.target.closest('[data-zip-form]')) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.matches('[data-zip-form]')) {
    setZip(form.zip.value, form);
    return;
  }
  const name = form.dataset.submit;
  const handler = current.view.submits?.[name];
  if (handler) handler(form, current.ctx);
});

// Hide broken live images instead of showing a broken-image icon.
document.addEventListener(
  'error',
  (e) => {
    const t = e.target;
    if (t.tagName === 'IMG' && t.hasAttribute('data-hide-on-error')) t.hidden = true;
  },
  true,
);

document.getElementById('loc-chip').addEventListener('click', openLocationDialog);
document.getElementById('loc-dialog').addEventListener('click', (e) => {
  if (e.target.id === 'loc-dialog') closeLocationDialog();
});

// ---------- Theme, connectivity, refresh ----------
function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function updateOnline() {
  const off = !navigator.onLine;
  document.body.classList.toggle('offline', off);
  const el = document.getElementById('net-status');
  el.hidden = !off;
}

onChange((what) => {
  if (what === 'settings') {
    applyTheme();
    current.ctx?.rerender();
  }
});

window.addEventListener('online', () => {
  updateOnline();
  toast('Back online — refreshing');
  current.view.refresh?.(current.ctx);
});
window.addEventListener('offline', updateOnline);

setInterval(() => {
  if (document.visibilityState === 'visible' && navigator.onLine) current.view.refresh?.(current.ctx);
}, CONFIG.refreshMinutes * 60000);

let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 2 * 60000) current.view.refresh?.(current.ctx);
});

window.addEventListener('hashchange', () => render());

// ---------- Start ----------
async function start() {
  applyTheme();
  updateOnline();
  // Shareable links: ?zip=78205 (or #/live?zip=78205) opens that ZIP.
  const zipParam = new URLSearchParams(location.search).get('zip') || parseHash().query.get('zip');
  if (zipParam && /^\d{5}$/.test(zipParam) && zipParam !== state.place?.zip) {
    try {
      const place = await lookupZip(zipParam);
      if (place) {
        setPlace(place);
        autoFindProviders();
      }
    } catch {
      /* fall through to saved place */
    }
  }
  if (state.place) ensureNws();
  render();
}

start();

// Offline support (service workers need https, or localhost for testing).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker
    .register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      // ZIP lookups made before the worker took over weren't cached; save them now so the
      // same ZIPs still work offline. The cache name must match VERSION in sw.js.
      const prefixes = new Set(state.recent.map((z) => z.slice(0, 2)));
      return caches.open('stormcheck-v2').then((c) => c.addAll([...prefixes].map((p) => `./data/zip/${p}.json`)));
    })
    .catch(() => {});
}

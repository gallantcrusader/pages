// Small shared helpers: escaping, storage, fetch-with-cache, geo math, time formatting.

const NS = 'stormcheck:v1:';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only allow http(s) links from outside data; add a scheme to bare domains.
export function safeUrl(url) {
  if (!url) return '';
  let u = String(url).trim();
  if (!/^[a-z]+:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}

export function ext(url, label, cls = '') {
  const href = safeUrl(url);
  if (!href) return esc(label);
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ''}>${esc(label)}</a>`;
}

export function telHref(phone) {
  return 'tel:' + String(phone).replace(/[^\d+]/g, '');
}

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: the app still works, it just won't remember */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(NS + key);
    } catch {
      /* ignore */
    }
  },
};

export async function fetchWithTimeout(url, { timeout = 12000, ...opts } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Fetch JSON, remembering the last good response so the page still shows
// something (marked stale) when the network drops during a storm.
export async function fetchJSON(url, { cacheKey, maxAgeMin = 0, headers, timeout } = {}) {
  const key = cacheKey ? 'cache:' + cacheKey : null;
  const cached = key ? store.get(key) : null;
  if (cached && maxAgeMin && Date.now() - cached.at < maxAgeMin * 60000) {
    return { data: cached.data, at: cached.at, stale: false, fromCache: true };
  }
  try {
    const res = await fetchWithTimeout(url, { headers, timeout });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (key) store.set(key, { at: Date.now(), data });
    return { data, at: Date.now(), stale: false };
  } catch (err) {
    if (cached) return { data: cached.data, at: cached.at, stale: true, error: err };
    throw err;
  }
}

export function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function compass(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

export function distanceLabel(from, lat, lon) {
  if (!from || lat == null || lon == null) return '';
  const mi = haversineMiles(from.lat, from.lon, lat, lon);
  if (mi < 1) return 'under 1 mi away';
  return `${Math.round(mi)} mi ${compass(from.lat, from.lon, lat, lon)}`;
}

let timeZone;
export function setTimeZone(tz) {
  timeZone = tz || undefined;
}

export function fmtTime(value, { date = true } = {}) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return String(value);
  const opts = { hour: 'numeric', minute: '2-digit', timeZone };
  if (date) Object.assign(opts, { weekday: 'short', month: 'short', day: 'numeric' });
  try {
    return d.toLocaleString(undefined, opts);
  } catch {
    return d.toLocaleString();
  }
}

export function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return d.toDateString();
  }
}

export function timeAgo(value) {
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (isNaN(t)) return '';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 0) return 'in ' + durationLabel(-s * 1000);
  if (s < 60) return 'just now';
  return durationLabel(s * 1000) + ' ago';
}

export function durationLabel(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 48) return m ? `${h} hr ${m} min` : `${h} hr`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d} days ${rh} hr` : `${d} days`;
}

// Value for <input type="datetime-local"> in the viewer's local time.
export function toLocalInput(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function searchUrl(query) {
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(query);
}

export function newsUrl(query) {
  return 'https://news.google.com/search?q=' + encodeURIComponent(query) + '&hl=en-US&gl=US&ceid=US:en';
}

export function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: type + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function toast(message) {
  let el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

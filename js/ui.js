// Shared UI pieces used by several views.

import { esc, ext, safeUrl, telHref, timeAgo, searchUrl } from './util.js';
import { TYPE_LABELS } from './providers.js';

export function card(inner, cls = '') {
  return `<section class="card ${cls}">${inner}</section>`;
}

export function sectionHead(title, { id, action = '' } = {}) {
  return `<div class="section-head"${id ? ` id="${id}"` : ''}><h2>${esc(title)}</h2>${action}</div>`;
}

export function loading(label = 'Loading…') {
  return `<p class="muted loading" role="status"><span class="spinner" aria-hidden="true"></span>${esc(label)}</p>`;
}

export function freshness(res) {
  if (!res || !res.at) return '';
  const when = timeAgo(res.at);
  return res.stale
    ? `<p class="stamp stale">⚠ Offline — showing saved data from ${esc(when)}</p>`
    : `<p class="stamp">Updated ${esc(when)}</p>`;
}

export function unavailable(what, url, label) {
  return `<p class="muted">Couldn’t load ${esc(what)} right now.${url ? ` Check ${ext(url, label || 'the official page')}.` : ''}</p>`;
}

export function button(label, { href, action, cls = '', attrs = '', external = false } = {}) {
  if (href) {
    const ex = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="btn ${cls}" href="${esc(href)}"${ex} ${attrs}>${label}</a>`;
  }
  return `<button type="button" class="btn ${cls}" data-action="${esc(action || '')}" ${attrs}>${label}</button>`;
}

export function phoneButton(phone, label = 'Call') {
  if (!phone) return '';
  // Some entries list two options, e.g. "611 or 1-800-…": offer the full number.
  const parts = String(phone).split(/\s+or\s+/i);
  const num = parts[parts.length - 1];
  return `<a class="btn" href="${esc(telHref(num))}">📞 ${esc(label)} ${esc(phone)}</a>`;
}

// Provider card: everything needed to check status and report a problem.
export function providerCard(p, type) {
  if (!p) return '';
  const links = [];
  if (p.outage) links.push(`<a class="btn primary" href="${esc(safeUrl(p.outage))}" target="_blank" rel="noopener noreferrer">${type === 'electric' ? '⚡ Outage map' : '📶 Service status'}</a>`);
  if (p.phone) links.push(phoneButton(p.phone, type === 'electric' ? 'Report outage' : 'Call'));
  if (p.text) links.push(`<span class="pill">💬 ${esc(p.text)}</span>`);
  if (p.site) links.push(`<a class="btn" href="${esc(safeUrl(p.site))}" target="_blank" rel="noopener noreferrer">🌐 Website</a>`);
  if (p.downdetector) links.push(`<a class="btn" href="${esc(p.downdetector)}" target="_blank" rel="noopener noreferrer">👥 Others reporting problems?</a>`);
  if (p.name && !p.outage) {
    const q = `${p.name} ${type === 'electric' ? 'outage map' : type === 'water' ? 'boil water notice' : 'outage'}`;
    links.push(`<a class="btn" href="${esc(searchUrl(q))}" target="_blank" rel="noopener noreferrer">🔎 Search “${esc(type === 'water' ? 'boil water notice' : 'outage')}”</a>`);
  }
  return `
    <div class="provider">
      <div class="provider-name">
        <span class="label">${esc(TYPE_LABELS[type])}</span>
        <strong>${esc(p.name)}</strong>
        ${p.custom ? `<span class="tag">${p.found ? 'from service map' : 'your entry'}</span>` : ''}
      </div>
      ${p.network ? `<p class="small">Runs on the <strong>${esc(p.network)}</strong> network — outages there affect you too.</p>` : ''}
      ${p.note ? `<p class="small">${esc(p.note)}</p>` : ''}
      <div class="btn-row">${links.join('')}</div>
    </div>`;
}

export function severityClass(sev) {
  return { Extreme: 'sev-extreme', Severe: 'sev-severe', Moderate: 'sev-moderate', Minor: 'sev-minor' }[sev] || 'sev-unknown';
}

export function emptyState(text) {
  return `<p class="empty">${esc(text)}</p>`;
}

let formCount = 0;
export function zipForm({ autofocus = false } = {}) {
  const id = `zip-${++formCount}`;
  return `
    <form class="zip-form" data-zip-form novalidate>
      <label for="${id}">ZIP code</label>
      <div class="zip-row">
        <input id="${id}" name="zip" type="text" inputmode="numeric" autocomplete="postal-code"
          pattern="[0-9]{5}" maxlength="5" placeholder="e.g. 78205" required ${autofocus ? 'autofocus' : ''}>
        <button class="btn primary" type="submit">Go</button>
      </div>
      <button type="button" class="btn link" data-action="gps">📍 Use my current location</button>
      <p class="form-msg" role="alert"></p>
    </form>`;
}

export function zipPrompt(what) {
  return card(`
    <h1>${esc(what)}</h1>
    <p>Enter a ZIP code to see information for that area.</p>
    ${zipForm({ autofocus: true })}`);
}

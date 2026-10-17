// Home dashboard: location, alerts at a glance, your providers, quick actions.

import { CONFIG } from '../config.js';
import { state, myProvider, countyLabel } from '../state.js';
import { esc, ext, safeUrl, telHref } from '../util.js';
import { card, sectionHead, loading, zipForm } from '../ui.js';
import { TYPE_LABELS } from '../providers.js';
import { stateInfo } from '../states.js';
import { loadAlerts, loadStorms, loadForecast, loadFema, loadCommunity } from './live.js';

const ICONS = { electric: '⚡', internet: '📶', water: '💧', cell: '📱' };

function serviceTile(type) {
  const p = myProvider(type);
  if (!p) {
    return `<a class="tile tile-empty" href="#/services/${type}">
      <span class="tile-icon" aria-hidden="true">${ICONS[type]}</span>
      <span class="tile-label">${esc(TYPE_LABELS[type])}</span>
      <span class="tile-sub">Choose provider →</span></a>`;
  }
  const quick = [];
  if (p.outage) quick.push(`<a href="${esc(safeUrl(p.outage))}" target="_blank" rel="noopener noreferrer">${type === 'electric' ? 'Outage map' : 'Status'}</a>`);
  if (p.phone) {
    const num = String(p.phone).split(/\s+or\s+/i).pop();
    quick.push(`<a href="${esc(telHref(num))}">Call</a>`);
  }
  return `<div class="tile">
      <a class="tile-main" href="#/services/${type}">
        <span class="tile-icon" aria-hidden="true">${ICONS[type]}</span>
        <span class="tile-label">${esc(TYPE_LABELS[type])}</span>
        <span class="tile-sub">${esc(p.name)}</span>
      </a>
      ${quick.length ? `<span class="tile-quick">${quick.join(' · ')}</span>` : ''}
    </div>`;
}

export function render() {
  const place = state.place;
  if (!place) {
    return `
      <section class="card hero">
        <h1>Storm info for your ZIP code</h1>
        <p>Weather alerts, power and internet outages, boil-water info, local storm reports and safety steps — in one place that works on any phone, even on a weak connection.</p>
        ${zipForm()}
      </section>
      ${card(`${sectionHead('Get ready now')}
        <div class="quick-grid">
          <a class="quick" href="#/safety/before">📋 Prep checklist</a>
          <a class="quick" href="#/contacts">☎️ Emergency numbers</a>
          <a class="quick" href="#/safety/water">💧 Boil-water how-to</a>
          <a class="quick" href="#/safety/generator">⚠️ Generator safety</a>
        </div>`)}
      ${card(`${sectionHead('What StormCheck does')}
        <ul>
          <li><strong>Live feed</strong> — National Weather Service alerts, hurricane tracks, local storm reports and flood gauges for your ZIP.</li>
          <li><strong>Your providers</strong> — finds your power and water company and gives you their outage map and report line, plus internet and cell status.</li>
          <li><strong>Boil-water info</strong> — how to check for notices and make water safe.</li>
          <li><strong>Accountability</strong> — log outages, missed restoration times and provider responses; turn them into credit requests and complaints; post public community reports.</li>
          <li><strong>Works offline</strong> — safety guides and your saved info stay available when the network drops. Add it to your home screen.</li>
        </ul>`)}`;
  }

  const st = stateInfo(place.state);
  return `
    <div class="place-head">
      <h1>${esc(place.city)}, ${esc(place.state)}</h1>
      <p class="muted">${esc(countyLabel(place))}${place.zip ? ` · ZIP ${esc(place.zip)}` : ''}${place.source === 'gps' ? ' · near your location' : ''}
        · <button type="button" class="btn link inline" data-action="change-place">Change</button></p>
    </div>
    ${card(`${sectionHead('Weather alerts', { action: '<a class="small" href="#/live">Live feed →</a>' })}<div id="h-alerts">${loading()}</div>`)}
    ${card(`${sectionHead('Tropics')}<div id="h-storms">${loading()}</div>`)}
    ${card(`<div id="h-fema">${loading()}</div>`, 'fema-card')}
    ${card(`${sectionHead('Your services', { action: '<a class="small" href="#/services/power">Manage →</a>' })}
      <div class="tiles">${['electric', 'internet', 'water', 'cell'].map(serviceTile).join('')}</div>
      <div class="btn-row"><a class="btn" href="#/track">📝 Track an outage</a><button type="button" class="btn" data-action="find-providers">🔎 Find my providers</button></div>`)}
    ${card(`${sectionHead('Community reports')}<div id="h-community">${loading()}</div>`)}
    ${card(`${sectionHead('Forecast')}<div id="h-forecast">${loading()}</div>`)}
    ${card(`${sectionHead('Quick help')}
      <div class="quick-grid">
        <a class="quick" href="#/contacts">☎️ Emergency numbers</a>
        <a class="quick" href="sms:43362?&body=${encodeURIComponent('SHELTER ' + (place.zip || ''))}">🏠 Find a shelter (text)</a>
        <a class="quick" href="#/services/water">💧 Boil-water info</a>
        <a class="quick" href="#/safety/generator">⚠️ Generator safety</a>
        <a class="quick" href="#/safety/power">🔌 Power outage tips</a>
        <a class="quick" href="#/safety/after">🧹 After the storm</a>
      </div>`)}
    ${card(`${sectionHead(`${place.state} resources`)}
      <ul class="links">
        <li>${ext(st.ema[1], st.ema[0])}</li>
        ${st.evac ? `<li>${ext(st.evac[1], st.evac[0])}</li>` : ''}
        ${st.roads ? `<li>${ext(st.roads[1], st.roads[0])}</li>` : ''}
        ${(st.extra || []).map(([l, u]) => `<li>${ext(u, l)}</li>`).join('')}
      </ul>
      ${(st.notes || []).map((n) => `<p class="small">${esc(n)}</p>`).join('')}`)}
  `;
}

export function mount(ctx) {
  if (!state.place) return;
  loadAll(ctx);
}

function loadAll(ctx) {
  loadAlerts(ctx, 'h-alerts', { compact: true });
  loadStorms(ctx, 'h-storms', { compact: true });
  loadFema(ctx, 'h-fema', { compact: true });
  loadCommunity(ctx, 'h-community', { compact: true });
  loadForecast(ctx, 'h-forecast');
}

export function refresh(ctx) {
  loadAll(ctx);
}

export const meta = { refreshes: true, title: () => (state.place ? `${state.place.city}, ${state.place.state}` : CONFIG.appName) };

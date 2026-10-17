// Live feed: weather alerts, tropical systems, storm reports, river gauges,
// federal declarations and community reports for the selected location.

import { CONFIG } from '../config.js';
import { state, ensureNws } from '../state.js';
import {
  nwsAlerts, nwsForecast, stormReports, activeStorms, femaDeclarations,
  floodGauges, floodLabel, communityReports, newReportUrl,
} from '../sources.js';
import { esc, ext, fmtTime, fmtDate, timeAgo, distanceLabel, newsUrl } from '../util.js';
import { card, sectionHead, loading, freshness, unavailable, severityClass, emptyState, zipPrompt } from '../ui.js';
import { stateInfo } from '../states.js';
import { STATE_NAMES } from '../zip.js';

const fill = (ctx, id, html) => {
  if (!ctx.alive()) return;
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
};

// ---------- Alerts ----------
export async function loadAlerts(ctx, id, { compact = false } = {}) {
  const place = state.place;
  try {
    const res = await nwsAlerts(place.lat, place.lon);
    const items = res.items;
    if (!items.length) {
      fill(ctx, id, `<div class="all-clear">✅ No active National Weather Service alerts for this location.</div>${freshness(res)}`);
      return res;
    }
    const list = (compact ? items.slice(0, 3) : items)
      .map((a) => {
        const until = a.ends || a.expires;
        const body = compact
          ? ''
          : `<details><summary>Details &amp; what to do</summary>
              ${a.description ? `<p class="pre">${esc(a.description)}</p>` : ''}
              ${a.instruction ? `<h4>What to do</h4><p class="pre">${esc(a.instruction)}</p>` : ''}
              <p class="small muted">${esc(a.senderName || 'National Weather Service')} · Issued ${esc(fmtTime(a.sent || a.effective))}</p>
            </details>`;
        return `<li class="alert ${severityClass(a.severity)}">
            <div class="alert-title">${esc(a.event)}</div>
            ${until ? `<div class="small">Until ${esc(fmtTime(until))}</div>` : ''}
            ${!compact && a.headline ? `<div class="small">${esc(a.headline)}</div>` : ''}
            ${body}
          </li>`;
      })
      .join('');
    const more = compact && items.length > 3 ? `<p><a href="#/live">+${items.length - 3} more alert${items.length - 3 > 1 ? 's' : ''}</a></p>` : '';
    fill(ctx, id, `<ul class="alerts">${list}</ul>${more}${compact ? '<p><a href="#/live">Full details and what to do →</a></p>' : ''}${freshness(res)}`);
    return res;
  } catch {
    fill(ctx, id, unavailable('weather alerts', 'https://www.weather.gov/alerts', 'weather.gov/alerts'));
  }
}

// ---------- Tropical ----------
export async function loadStorms(ctx, id, { compact = false } = {}) {
  const place = state.place;
  const outlook = `
    <div class="outlook">
      <p class="small">7-day tropical outlook (National Hurricane Center):</p>
      ${imageSlot('https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png', 'Atlantic 7-day tropical weather outlook map', 'Atlantic outlook')}
      ${place && (place.lon < -115 || place.state === 'HI') ? imageSlot('https://www.nhc.noaa.gov/xgtwo/two_pac_7d0.png', 'Eastern Pacific 7-day tropical weather outlook map', 'Eastern Pacific outlook') : ''}
    </div>`;
  try {
    const res = await activeStorms(place);
    let items = res.items;
    if (place) items = [...items].sort((a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9));
    if (!items.length) {
      fill(ctx, id, `<p>🌤 No active tropical storms or hurricanes right now.</p>${compact ? '' : outlook}${freshness(res)}`);
      return;
    }
    const list = (compact ? items.slice(0, 2) : items)
      .map((s) => {
        const near = s.miles != null && s.miles < 500;
        return `<li class="storm ${near ? 'storm-near' : ''}">
          <div class="storm-name">${s.category ? `<span class="cat">Cat ${s.category}</span>` : ''}${esc(s.kind)} ${esc(s.name)}</div>
          <div class="small">${s.mph ? `Winds ${s.mph} mph` : ''}${s.pressure ? ` · ${esc(s.pressure)} mb` : ''}${s.movement ? ` · Moving ${esc(s.movement)}` : ''}</div>
          ${s.miles != null ? `<div class="small"><strong>${Math.round(s.miles)} miles</strong> from ${esc(place.city || 'you')}</div>` : ''}
          ${compact ? '' : `${imageSlot(s.coneImg, `Forecast cone for ${s.name}`, 'Forecast cone')}
            <div class="btn-row">${s.advisoryUrl ? ext(s.advisoryUrl, 'Latest advisory', 'btn') : ''}${ext(s.graphicsUrl, 'All graphics', 'btn')}</div>`}
        </li>`;
      })
      .join('');
    fill(ctx, id, `<ul class="storms">${list}</ul>${compact ? '<p><a href="#/live">Forecast cones →</a></p>' : outlook}${freshness(res)}`);
  } catch {
    fill(ctx, id, `${unavailable('the hurricane center feed', 'https://www.nhc.noaa.gov', 'nhc.noaa.gov')}${compact ? '' : outlook}`);
  }
}

// Images load right away unless Data Saver is on, in which case they're tap-to-load.
export function imageSlot(src, alt, label) {
  if (state.settings.dataSaver) {
    return `<button type="button" class="btn img-load" data-action="load-img" data-src="${esc(src)}" data-alt="${esc(alt)}">🖼 Load ${esc(label)}</button>`;
  }
  return `<img class="feed-img" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" data-hide-on-error>`;
}

// ---------- Forecast ----------
export async function loadForecast(ctx, id) {
  const nws = await ensureNws();
  if (!nws || !nws.forecastUrl) {
    fill(ctx, id, unavailable('the forecast', 'https://www.weather.gov', 'weather.gov'));
    return;
  }
  try {
    const res = await nwsForecast(nws.forecastUrl);
    const rows = res.items
      .map(
        (p) => `<li><span class="fc-name">${esc(p.name)}</span><span class="fc-temp">${esc(p.temperature)}°${esc(p.temperatureUnit || '')}</span><span class="fc-text">${esc(p.shortForecast)}${p.windSpeed ? ` · Wind ${esc(p.windDirection || '')} ${esc(p.windSpeed)}` : ''}</span></li>`,
      )
      .join('');
    fill(ctx, id, `<ul class="forecast">${rows}</ul>${freshness(res)}`);
  } catch {
    fill(ctx, id, unavailable('the forecast', 'https://www.weather.gov', 'weather.gov'));
  }
}

// ---------- FEMA ----------
export async function loadFema(ctx, id, { compact = false } = {}) {
  const place = state.place;
  if (!place.fips) {
    fill(ctx, id, '');
    return;
  }
  try {
    const res = await femaDeclarations(place);
    let items = res.items;
    if (compact) {
      const cutoff = Date.now() - 120 * 86400000;
      items = items.filter((d) => d.individualAssistance && new Date(d.date) > cutoff);
      if (!items.length) {
        const el = document.getElementById(id);
        if (el && ctx.alive()) el.closest('.card')?.remove();
        return;
      }
    }
    if (!items.length) {
      fill(ctx, id, `<p>No federal disaster declarations for this county in the past year.</p>${freshness(res)}`);
      return;
    }
    const list = items
      .map(
        (d) => `<li>
          <strong>${esc(d.title || d.incident)}</strong> <span class="tag">${esc(d.type)}</span>
          <div class="small">Declared ${esc(fmtDate(d.date))} · ${esc(d.area)}</div>
          ${d.individualAssistance ? `<div class="callout ok small">Individual Assistance is available — you may qualify for FEMA help with housing, repairs and other needs. ${ext('https://www.disasterassistance.gov', 'Apply at DisasterAssistance.gov')} or call 1-800-621-3362.${d.deadline ? ` Deadline to apply: ${esc(fmtDate(d.deadline))}.` : ''}</div>` : ''}
          <div>${ext(d.url, `FEMA-${d.number} details`)}</div>
        </li>`,
      )
      .join('');
    fill(ctx, id, `<ul class="plain">${list}</ul>${freshness(res)}`);
  } catch {
    if (compact) {
      const el = document.getElementById(id);
      if (el && ctx.alive()) el.closest('.card')?.remove();
      return;
    }
    fill(ctx, id, unavailable('FEMA declarations', 'https://www.fema.gov/disaster/declarations', 'fema.gov'));
  }
}

// ---------- Storm reports ----------
export async function loadStormReports(ctx, id) {
  const nws = await ensureNws();
  const place = state.place;
  if (!nws || !nws.cwa) {
    fill(ctx, id, unavailable('storm reports', 'https://www.weather.gov', 'your NWS office'));
    return;
  }
  try {
    const res = await stormReports(nws.cwa, place);
    if (!res.items.length) {
      fill(ctx, id, `<p>No storm reports within ${CONFIG.nearbyMiles} miles in the last 3 days.</p>${freshness(res)}`);
      return;
    }
    const list = res.items
      .slice(0, 40)
      .map(
        (r) => `<li class="lsr">
          <div><strong>${esc(r.type)}</strong>${r.magnitude ? ` <span class="tag">${esc(r.magnitude)} ${esc(r.unit || '')}</span>` : ''}</div>
          <div class="small">${esc([r.city, r.county && r.county + ' Co.', r.state].filter(Boolean).join(', '))} · ${esc(distanceLabel(place, r.lat, r.lon))}</div>
          ${r.remark ? `<div class="small">${esc(r.remark)}</div>` : ''}
          <div class="small muted">${esc(fmtTime(r.time))} (${esc(timeAgo(r.time))})${r.source ? ` · Source: ${esc(r.source)}` : ''}</div>
        </li>`,
      )
      .join('');
    fill(
      ctx,
      id,
      `<ul class="plain feed">${list}</ul>
       <p class="small muted">Local Storm Reports from NWS ${esc(nws.cwa)}, via the Iowa Environmental Mesonet.</p>${freshness(res)}`,
    );
  } catch {
    fill(ctx, id, unavailable('storm reports', `https://www.weather.gov/${String(nws.cwa).toLowerCase()}`, `NWS ${nws.cwa}`));
  }
}

// ---------- River gauges ----------
export async function loadGauges(ctx, id) {
  const place = state.place;
  try {
    const res = await floodGauges(place);
    const items = res.items.filter((g) => g.miles <= CONFIG.nearbyMiles).slice(0, 8);
    if (!items.length) {
      fill(ctx, id, `<p>No river gauges reporting near you.</p>${freshness(res)}`);
      return;
    }
    const list = items
      .map((g) => {
        // NWPS also reports codes like not_defined, fcst_not_current and out_of_service;
        // only real flood stages get a label.
        const stage = (c) => (c && c !== 'no_flooding' && floodLabel(c) ? c : '');
        const cat = stage(g.category);
        const fc = g.forecastCategory !== g.category ? stage(g.forecastCategory) : '';
        return `<li class="gauge ${cat ? 'flood-' + cat : ''}">
          <div>${ext(g.url, g.name)}</div>
          <div class="small">${esc(g.level)} ${esc(g.unit || '')}${cat ? ` · <strong>${esc(floodLabel(cat))}</strong>` : g.category === 'no_flooding' ? ' · Normal' : ''}${fc ? ` · Forecast: <strong>${esc(floodLabel(fc))}</strong>` : ''} · ${esc(distanceLabel(place, g.lat, g.lon))}</div>
        </li>`;
      })
      .join('');
    fill(ctx, id, `<ul class="plain">${list}</ul>${freshness(res)}`);
  } catch {
    fill(ctx, id, unavailable('river gauges', 'https://water.noaa.gov', 'water.noaa.gov'));
  }
}

// ---------- Community reports ----------
export async function loadCommunity(ctx, id, { compact = false, scope = 'zip' } = {}) {
  const place = state.place;
  try {
    const res = await communityReports();
    const mine = res.items.filter((r) => (scope === 'zip' ? r.zip === place.zip : scope === 'state' ? r.state === place.state || r.zip === place.zip : true));
    const recent = mine.filter((r) => Date.now() - new Date(r.created) < 14 * 86400000);
    const postUrl = newReportUrl({ zip: place.zip, state: place.state });
    if (compact) {
      fill(
        ctx,
        id,
        recent.length
          ? `<p><strong>${recent.length}</strong> community report${recent.length > 1 ? 's' : ''} in ZIP ${esc(place.zip)} in the last 2 weeks. <a href="#/track/community">See reports →</a></p>`
          : `<p>No community reports for ZIP ${esc(place.zip)} yet. <a href="#/track/community">Post one →</a></p>`,
      );
      return res;
    }
    const list = mine.slice(0, 30).map(reportItem).join('');
    fill(
      ctx,
      id,
      `${mine.length ? `<ul class="plain feed">${list}</ul>` : emptyState(`No community reports ${scope === 'zip' ? 'for ZIP ' + place.zip : 'here'} yet.`)}
       <div class="btn-row">${ext(postUrl, '＋ Post a public report', 'btn primary')}</div>${freshness(res)}`,
    );
    return res;
  } catch {
    fill(ctx, id, compact ? '' : unavailable('community reports'));
  }
}

export function reportItem(r) {
  const restored = /restored/i.test(r.status);
  return `<li class="report">
    <div><strong>${esc(r.service || 'Report')}</strong>${r.provider ? ` · ${esc(r.provider)}` : ''} <span class="tag ${restored ? 'tag-ok' : 'tag-warn'}">${esc(r.status || 'Report')}</span>${r.open ? '' : ' <span class="tag">closed</span>'}</div>
    <div class="small">ZIP ${esc(r.zip)}${r.started ? ` · Started ${esc(r.started)}` : ''}${r.restored ? ` · Restored ${esc(r.restored)}` : ''}</div>
    ${r.details ? `<div class="small clamp">${esc(r.details)}</div>` : ''}
    <div class="small muted">Posted ${esc(timeAgo(r.created))} · ${ext(r.url, `#${r.id}${r.comments ? ` · ${r.comments} comment${r.comments > 1 ? 's' : ''}` : ''}`)}</div>
  </li>`;
}

// ---------- View ----------
export function render() {
  const place = state.place;
  if (!place) return zipPrompt('Live alerts and local reports');
  const st = stateInfo(place.state);
  const stName = STATE_NAMES[place.state] || place.state;
  return `
    <h1 class="page-title">Live feed</h1>
    <p class="muted">For ${esc(place.city)}, ${esc(place.state)} ${esc(place.zip || '')}. Refreshes every ${CONFIG.refreshMinutes} minutes while open.
      <button type="button" class="btn small" data-action="refresh">↻ Refresh now</button></p>
    ${card(`${sectionHead('Weather alerts')}<div id="lv-alerts">${loading()}</div>`)}
    ${card(`${sectionHead('Hurricanes & tropical storms', { id: 'tropics' })}<div id="lv-storms">${loading()}</div>`)}
    ${card(`${sectionHead('Local storm reports')}<p class="small muted">Damage, flooding, surge and downed trees reported to the National Weather Service by spotters, officials and the public.</p><div id="lv-lsr">${loading()}</div>`)}
    ${card(`${sectionHead('Rivers & flood gauges')}<div id="lv-gauges">${loading()}</div>`)}
    ${card(`${sectionHead('Community reports')}<p class="small muted">Outages and provider responses posted by people in your ZIP. Unverified.</p><div id="lv-community">${loading()}</div>`)}
    ${card(`${sectionHead('Federal disaster declarations')}<div id="lv-fema">${loading()}</div>`)}
    ${card(`${sectionHead('Radar')}<div id="lv-radar">${loading()}</div>`)}
    ${card(`${sectionHead('More local sources')}
      <ul class="links">
        ${st.roads ? `<li>${ext(st.roads[1], st.roads[0] + ' (road closures)')}</li>` : ''}
        <li>${ext(st.ema[1], st.ema[0])}</li>
        ${st.evac ? `<li>${ext(st.evac[1], st.evac[0])}</li>` : ''}
        <li>${ext(newsUrl(`${place.city} ${stName} outage OR "boil water" OR flooding`), `Latest local news for ${place.city}`)}</li>
        <li>${ext('https://www.fcc.gov/general/disaster-information-reporting-system-dirs-0', 'FCC communications outage reports (cell & internet)')}</li>
        <li>${ext(`https://poweroutage.us/area/state/${encodeURIComponent(stName.toLowerCase())}`, `Power outages across ${stName} (PowerOutage.us)`)}</li>
      </ul>`)}
  `;
}

export async function mount(ctx) {
  if (!state.place) return;
  loadAll(ctx);
}

function loadAll(ctx) {
  loadAlerts(ctx, 'lv-alerts');
  loadStorms(ctx, 'lv-storms');
  loadStormReports(ctx, 'lv-lsr');
  loadGauges(ctx, 'lv-gauges');
  loadCommunity(ctx, 'lv-community');
  loadFema(ctx, 'lv-fema');
  loadRadar(ctx, 'lv-radar');
}

async function loadRadar(ctx, id) {
  const nws = await ensureNws();
  if (!nws || !nws.radar) {
    fill(ctx, id, `<p>${ext('https://radar.weather.gov', 'Open the NWS radar map')}</p>`);
    return;
  }
  const src = `https://radar.weather.gov/ridge/standard/${encodeURIComponent(nws.radar)}_loop.gif`;
  fill(
    ctx,
    id,
    `<p class="small muted">Radar loop from ${esc(nws.radar)} (usually under 1 MB).</p>
     <button type="button" class="btn" data-action="load-img" data-src="${esc(src)}" data-alt="Radar loop">🛰 Load radar loop</button>
     <p>${ext(`https://radar.weather.gov/station/${encodeURIComponent(nws.radar.toLowerCase())}/standard`, 'Open interactive radar')}</p>`,
  );
}

export function refresh(ctx) {
  loadAll(ctx);
}

export const actions = {
  refresh(_el, ctx) {
    ['lv-alerts', 'lv-storms', 'lv-lsr', 'lv-gauges', 'lv-community', 'lv-fema'].forEach((id) => fill(ctx, id, loading()));
    loadAll(ctx);
  },
};

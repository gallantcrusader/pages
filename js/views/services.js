// Services: pick your providers (or find them automatically) and get status, reporting
// links and topic-specific help for power, internet, water and cell service.

import { state, myProvider, setMyProvider } from '../state.js';
import {
  TYPE_LABELS, providersFor, suggestionsFor, getProvider, findElectric, findWater,
} from '../providers.js';
import { connectivityCheck, communityReports, newReportUrl } from '../sources.js';
import { stateInfo } from '../states.js';
import { STATE_NAMES } from '../zip.js';
import {
  esc, ext, store, toLocalInput, durationLabel, fmtTime, newsUrl, searchUrl, toast,
} from '../util.js';
import { card, sectionHead, providerCard, zipPrompt, loading } from '../ui.js';
import { reportItem } from './live.js';

const TABS = [
  ['power', 'electric', '⚡ Power'],
  ['internet', 'internet', '📶 Internet'],
  ['water', 'water', '💧 Water'],
  ['cell', 'cell', '📱 Cell'],
];

function foundKey() {
  return 'found:' + (state.place?.zip || 'gps');
}

// ---------- Provider picker ----------
function picker(type) {
  const place = state.place;
  const current = state.providers[place?.zip || 'gps']?.[type];
  const sugg = suggestionsFor(place)[type] || [];
  const groups = providersFor(type, place?.state);
  const found = (store.get(foundKey(), {})[type] || []).filter((f) => !f.match);
  const opt = (p) => `<option value="${esc(p.id)}"${current?.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`;
  const suggested = sugg.map(getProvider).filter(Boolean);
  const suggestedIds = new Set(suggested.map((p) => p.id));
  const stName = STATE_NAMES[place?.state] || place?.state || '';
  const local = groups.local.filter((p) => !suggestedIds.has(p.id));
  const national = groups.national.filter((p) => !suggestedIds.has(p.id));
  const customSelected = current && !current.id;
  const customName = customSelected ? current.name : '';
  return `
    <div class="picker">
      <label for="pick-${type}">Choose yours</label>
      <select id="pick-${type}" data-change="pick-provider" data-type="${type}">
        <option value="">— Choose your provider —</option>
        ${suggested.length ? `<optgroup label="Common in ZIP ${esc(place?.zip || '')}">${suggested.map(opt).join('')}</optgroup>` : ''}
        ${found.length ? `<optgroup label="Found on the service map">${found.map((f, i) => `<option value="__found:${i}"${customSelected && current.name === f.name ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</optgroup>` : ''}
        ${local.length ? `<optgroup label="${esc(stName)}">${local.map(opt).join('')}</optgroup>` : ''}
        ${national.length ? `<optgroup label="Nationwide">${national.map(opt).join('')}</optgroup>` : ''}
        ${customSelected && !found.some((f) => f.name === customName) ? `<option value="__current" selected>${esc(customName)} (your entry)</option>` : ''}
        <option value="__custom">Other — type it in…</option>
      </select>
      <form class="custom-provider" data-submit="save-custom" data-type="${type}" hidden>
        <label>Provider name <input name="name" required maxlength="80" autocomplete="off"></label>
        <label>Outage / support phone <input name="phone" type="tel" maxlength="30" autocomplete="off"></label>
        <label>Website or outage map <input name="site" type="url" maxlength="200" placeholder="https://" autocomplete="off"></label>
        <button class="btn primary" type="submit">Save</button>
      </form>
    </div>`;
}

function finder(type) {
  if (type !== 'electric' && type !== 'water') {
    const tool = type === 'internet'
      ? `<p class="small">Not sure who serves your address? The ${ext('https://broadbandmap.fcc.gov/home', 'FCC National Broadband Map')} lists every internet provider at your exact address.</p>`
      : `<p class="small">Not sure which network your phone uses? Prepaid brands run on AT&amp;T, Verizon or T-Mobile — it’s listed in your phone’s settings under carrier.</p>`;
    return tool;
  }
  return `
    <div class="finder">
      <button type="button" class="btn" data-action="find-one" data-type="${type}">🔎 Find my ${type === 'electric' ? 'power company' : 'water system'} on the map</button>
      <div id="found-${type}" aria-live="polite"></div>
      ${type === 'water' ? `<p class="small muted">Or look it up on ${ext('https://gispub.epa.gov/serviceareas/', 'EPA’s water system map')}.</p>` : ''}
    </div>`;
}

function providerSection(type) {
  const p = myProvider(type);
  return card(`
    ${sectionHead(`${TYPE_LABELS[type]} provider`)}
    ${picker(type)}
    <div id="pcard-${type}">${p ? providerCard(p, type) : '<p class="muted small">Pick a provider to get its outage map and report line here and on your home screen.</p>'}</div>
    ${finder(type)}`);
}

// ---------- Power ----------
function powerTimer() {
  const out = store.get('powerOut');
  if (!out) {
    return `
      <p>Track how long the power has been out, so you know when fridge and freezer food is no longer safe.</p>
      <form class="inline-form" data-submit="power-start">
        <label>Power went out at <input type="datetime-local" name="at" value="${toLocalInput()}" required></label>
        <button class="btn primary" type="submit">Start timer</button>
      </form>`;
  }
  const ms = Date.now() - new Date(out.at).getTime();
  const h = ms / 3600000;
  const bar = (label, limit) => {
    const pct = Math.min(100, (h / limit) * 100);
    const over = h >= limit;
    return `<div class="meter ${over ? 'over' : ''}">
      <div class="meter-label"><span>${esc(label)}</span><span>${over ? 'Past safe limit' : `${durationLabel((limit - h) * 3600000)} left`}</span></div>
      <div class="meter-track" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div class="meter-fill" data-pct="${pct.toFixed(1)}"></div></div>
    </div>`;
  };
  return `
    <p>Power out since <strong>${esc(fmtTime(out.at))}</strong> — <strong>${esc(durationLabel(ms))}</strong>.</p>
    ${bar('Refrigerator (door kept closed)', 4)}
    ${bar('Half-full freezer', 24)}
    ${bar('Full freezer', 48)}
    <p class="small">Throw out perishable food that has been above 40°F for more than 2 hours. When in doubt, throw it out.</p>
    <div class="btn-row">
      <button type="button" class="btn primary" data-action="power-back">✅ Power is back</button>
      <a class="btn" href="#/track/new?service=electric">📝 Log it for accountability</a>
    </div>`;
}

function powerContent() {
  const place = state.place;
  const st = stateInfo(place.state);
  const stName = STATE_NAMES[place.state] || place.state;
  return `
    ${place.state === 'TX' ? card(`<p class="small"><strong>Texas tip:</strong> ${esc(st.notes[0])}</p>`, 'note-card') : ''}
    ${card(`${sectionHead('Food safety timer')}<div id="power-timer">${powerTimer()}</div>`)}
    ${card(`${sectionHead('How widespread is it?')}
      <ul class="links">
        <li>${ext(`https://poweroutage.us/area/state/${encodeURIComponent(stName.toLowerCase())}`, `Customers out across ${stName} by county (PowerOutage.us)`)}</li>
        ${place.state === 'TX' ? `<li>${ext('https://www.ercot.com', 'ERCOT grid conditions')}</li>` : ''}
        <li>${ext(newsUrl(`${place.city} power outage`), `News: ${place.city} power outage`)}</li>
      </ul>`)}
    ${card(`${sectionHead('Unofficial signals')}
      <p class="small">When a utility’s outage map goes down, people get creative. After Hurricane Beryl in 2024, Houstonians used the <strong>Whataburger app</strong> — San Antonio’s 24-hour burger chain — as an outage map: open (orange) stores meant that area had power. Restaurant and gas-station status can hint at where power is back, but it’s not official.</p>
      <ul class="links">
        <li>${ext('https://whataburger.com', 'Whataburger (open locations map in the app)')}</li>
      </ul>
      <p class="small muted">FEMA has long joked about the “Waffle House Index”: if the local Waffle House is closed, things are bad.</p>`)}
    ${card(`${sectionHead('Stay safe')}
      <ul>
        <li>Stay at least 35 feet from downed lines and anything touching them. Call 911 and your utility.</li>
        <li>Generators go outside, 20+ feet from the house. Never plug one into a wall outlet.</li>
        <li>Unplug electronics to protect them from surges when power returns.</li>
      </ul>
      <div class="btn-row"><a class="btn" href="#/safety/generator">⚠️ Generator & CO safety</a><a class="btn" href="#/safety/power">🔌 Power outage guide</a><a class="btn" href="#/safety/heat">🌡️ Heat illness</a></div>`)}`;
}

// ---------- Internet ----------
function internetContent() {
  return `
    ${card(`${sectionHead('Is it just me?')}
      <p class="small">Test whether this device can reach the internet right now.</p>
      <button type="button" class="btn primary" data-action="net-check">Run connection check</button>
      <div id="net-result" aria-live="polite"></div>
      <p class="small muted">${navigator.connection && navigator.connection.effectiveType ? `Your browser reports a ${esc(navigator.connection.effectiveType.toUpperCase())}-class connection.` : ''}</p>`)}
    ${card(`${sectionHead('Wider outages')}
      <ul class="links">
        <li>${ext('https://www.fcc.gov/general/disaster-information-reporting-system-dirs-0', 'FCC disaster outage reports (cable, wireline & cell sites by county)')}</li>
        <li>${ext('https://ioda.inetintel.cc.gatech.edu/country/US', 'IODA internet outage monitor')}</li>
        <li>${ext('https://radar.cloudflare.com/outage-center', 'Cloudflare Radar outage center')}</li>
        <li>${ext('https://downdetector.com/', 'Downdetector (crowd reports by provider)')}</li>
      </ul>`)}
    ${card(`${sectionHead('Getting back online')}
      <ul>
        <li>Cable and fiber need power at your home <em>and</em> in the neighborhood. If your power is out, your modem or fiber box (ONT) is too — a small battery backup (UPS) keeps it running.</li>
        <li>Restart your modem and router: unplug for 30 seconds, plug the modem in first, wait 2 minutes, then the router.</li>
        <li>Use your phone as a hotspot, and turn off auto-updates and video autoplay to save data.</li>
        <li>After big disasters, cable companies often open their Wi-Fi hotspots to everyone for free — look for networks like <em>xfinitywifi</em> or <em>SpectrumWiFi</em>.</li>
        <li>Libraries, shelters and disaster recovery centers usually have Wi-Fi and charging stations.</li>
        <li>Ask for a credit for days without service — log the outage in <a href="#/track">Track</a> and use the credit request letter.</li>
      </ul>`)}`;
}

// ---------- Water ----------
export function bleachCalc() {
  return `
    <form class="bleach" data-submit="noop" aria-label="Bleach calculator">
      <div class="bleach-inputs">
        <label>Gallons <input type="number" name="gal" min="0.25" step="0.25" value="1" inputmode="decimal"></label>
        <label>Bleach strength
          <select name="pct"><option value="6">6%</option><option value="8.25">8.25%</option></select>
        </label>
        <label>Water is
          <select name="cloudy"><option value="0">Clear</option><option value="1">Cloudy / cold</option></select>
        </label>
      </div>
      <output class="bleach-out" name="out" aria-live="polite"></output>
    </form>`;
}

const FRACTIONS = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
// Round up to the next amount a measuring spoon can do, so water is never under-dosed.
function niceTsp(x) {
  let whole = Math.floor(x);
  const rest = x - whole;
  let frac = '';
  if (rest > 0.02) {
    const hit = FRACTIONS.find(([v]) => v >= rest - 0.02);
    if (hit) frac = hit[1];
    else whole += 1;
  }
  return `${whole || ''}${whole && frac ? ' ' : ''}${frac} tsp`.trim();
}

export function updateBleach(form) {
  const gal = Math.max(0, Number(form.gal.value) || 0);
  const strong = form.pct.value === '8.25';
  const mult = form.cloudy.value === '1' ? 2 : 1;
  let text;
  if (gal <= 0) text = 'Enter how many gallons you are treating.';
  else if (gal <= 2) {
    const drops = Math.ceil(gal * (strong ? 6 : 8) * mult);
    text = `Add <strong>${drops} drops</strong> of ${strong ? '8.25' : '6'}% bleach, stir, wait 30 minutes.`;
  } else {
    const tsp = gal * (strong ? 1 / 16 : 1 / 12) * mult;
    text = `Add about <strong>${niceTsp(tsp)}</strong> of ${strong ? '8.25' : '6'}% bleach, stir, wait 30 minutes.`;
  }
  form.out.innerHTML = text;
}

function waterContent() {
  const place = state.place;
  const st = stateInfo(place.state);
  const p = myProvider('water');
  const county = place.county ? `${place.county} County ${place.state}` : `${place.city} ${place.state}`;
  return `
    ${card(`${sectionHead('Is there a boil-water notice?')}
      <div id="boil-community">${loading('Checking community reports…')}</div>
      <p class="small">Boil-water notices come from your water system and state health or environmental agency. Check:</p>
      <ul class="links">
        ${p && p.site ? `<li>${ext(p.site, `${p.name} website`)}</li>` : ''}
        ${p && p.name ? `<li>${ext(searchUrl(`"${p.name}" boil water notice`), `Search: ${p.name} boil water notice`)}</li>` : ''}
        ${st.water ? `<li>${ext(st.water[1], st.water[0])}</li>` : ''}
        <li>${ext(newsUrl(`"boil water" ${place.city} ${place.state}`), `News: boil water ${place.city}`)}</li>
        <li>${ext(newsUrl(`"boil water" ${county}`), `News: boil water ${place.county || place.city}`)}</li>
      </ul>
      <p class="small">Got the notice? ${ext(newReportUrl({ zip: place.zip, state: place.state, service: 'Water', provider: p?.name || '', status: 'Boil-water notice' }), 'Post it for your neighbors')}.</p>`)}
    ${card(`${sectionHead('Make water safe')}
      <ul>
        <li><strong>Boil:</strong> rolling boil for 1 minute (3 minutes above 6,500 ft), then cool.</li>
        <li>Use boiled or bottled water for drinking, cooking, ice, brushing teeth, baby formula and washing produce.</li>
        <li>No way to boil? Disinfect with plain unscented bleach:</li>
      </ul>
      ${bleachCalc()}
      <div class="btn-row"><a class="btn" href="#/safety/water">💧 Full boil-water guide</a></div>`)}
    ${card(`${sectionHead('Store water')}
      <p>Keep at least <strong>1 gallon per person per day</strong> for several days — more in hot weather, and extra for pets. Fill clean containers and bathtubs before the storm (tub water is for flushing and cleaning).</p>`)}`;
}

// ---------- Cell ----------
function cellContent() {
  return `
    ${card(`${sectionHead('When the network is struggling')}
      <ul>
        <li><strong>Text instead of calling.</strong> Texts need far less network capacity and keep retrying.</li>
        <li>Turn on <strong>Wi-Fi Calling</strong> so calls and texts go over any working Wi-Fi.</li>
        <li><strong>911 calls go through on any carrier’s network</strong> — even without service from your own carrier, try 911 in an emergency.</li>
        <li>Make sure <strong>Emergency Alerts</strong> are turned on in your phone’s notification settings.</li>
        <li>Save battery: low-power mode, dim screen, close apps. If there’s no signal at all, airplane mode stops the phone from draining the battery searching for one.</li>
        <li>When the FCC activates its disaster reporting system, wireless carriers must let customers roam on each other’s working networks.</li>
      </ul>`)}
    ${card(`${sectionHead('Check outages')}
      <ul class="links">
        <li>${ext('https://www.fcc.gov/general/disaster-information-reporting-system-dirs-0', 'FCC disaster reports: % of cell sites out by county')}</li>
        <li>${ext('https://downdetector.com/', 'Downdetector')}</li>
      </ul>`)}`;
}

// ---------- View ----------
export function render(ctx) {
  if (!state.place) return zipPrompt('Your providers');
  const tab = TABS.find((t) => t[0] === ctx.route.parts[1]) || TABS[0];
  const [, type] = tab;
  const body = { power: powerContent, internet: internetContent, water: waterContent, cell: cellContent }[tab[0]]();
  return `
    <h1 class="page-title">Services</h1>
    <nav class="segmented" aria-label="Service type">
      ${TABS.map(([slug, , label]) => `<a href="#/services/${slug}"${slug === tab[0] ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
    ${providerSection(type)}
    ${body}`;
}

export function mount(ctx) {
  if (!state.place) return;
  const tab = (TABS.find((t) => t[0] === ctx.route.parts[1]) || TABS[0])[0];
  paintMeters();
  document.querySelectorAll('form.bleach').forEach(updateBleach);
  if (tab === 'water') loadBoilReports(ctx);
  if (tab === 'power') {
    const timer = setInterval(() => {
      if (!ctx.alive()) return clearInterval(timer);
      const el = document.getElementById('power-timer');
      if (el && store.get('powerOut')) {
        el.innerHTML = powerTimer();
        paintMeters();
      }
    }, 60000);
  }
}

function paintMeters() {
  document.querySelectorAll('.meter-fill[data-pct]').forEach((el) => {
    el.style.width = el.dataset.pct + '%';
  });
}

async function loadBoilReports(ctx) {
  const el = document.getElementById('boil-community');
  try {
    const res = await communityReports();
    const hits = res.items.filter(
      (r) => r.zip === state.place.zip && /water/i.test(r.service) && /boil/i.test(r.status + ' ' + r.title) && Date.now() - new Date(r.created) < 14 * 86400000,
    );
    if (!ctx.alive() || !el) return;
    el.innerHTML = hits.length
      ? `<div class="callout warn"><strong>Community reports mention a boil-water notice in ZIP ${esc(state.place.zip)}.</strong> These are unverified — confirm with your water system.</div><ul class="plain feed">${hits.slice(0, 3).map(reportItem).join('')}</ul>`
      : `<p class="small muted">No community boil-water reports for ZIP ${esc(state.place.zip)} in the last 2 weeks. That doesn’t mean there isn’t one — check the official sources below.</p>`;
  } catch {
    if (el && ctx.alive()) el.innerHTML = '';
  }
}

function showFound(type, results, err) {
  const el = document.getElementById(`found-${type}`);
  if (!el) return;
  if (err) {
    el.innerHTML = `<p class="small">The service-area map didn’t answer (it may be busy). Pick from the list above, or choose “Other” to type in your provider.</p>`;
    return;
  }
  if (!results.length) {
    el.innerHTML = `<p class="small">No ${type === 'electric' ? 'power company' : 'water system'} found at this ZIP’s center point. Pick from the list or choose “Other”.</p>`;
    return;
  }
  el.innerHTML = `<p class="small">Found at the center of ZIP ${esc(state.place.zip || '')} (your address may differ):</p>
    <ul class="plain found-list">${results
      .map((r, i) => {
        const known = r.match ? getProvider(r.match) : null;
        return `<li><strong>${esc(known ? known.name : r.name)}</strong>
          ${known && known.name.toUpperCase() !== r.name.toUpperCase() ? `<span class="small muted">(${esc(r.name)})</span>` : ''}
          ${r.phone ? `<span class="small"> · ${esc(r.phone)}</span>` : ''}
          <button type="button" class="btn small" data-action="use-found" data-type="${type}" data-index="${i}">Use this</button></li>`;
      })
      .join('')}</ul>`;
}

export async function findProviders(types = ['electric', 'water']) {
  const place = state.place;
  const found = store.get(foundKey(), {});
  const out = {};
  await Promise.all(
    types.map(async (type) => {
      try {
        const rows = type === 'electric' ? await findElectric(place.lat, place.lon, place.state) : await findWater(place.lat, place.lon, place.state);
        found[type] = rows.map((r) => ({ name: r.name, phone: r.phone || '', site: r.website || '', match: r.match ? r.match.id : null }));
        out[type] = { rows };
      } catch (err) {
        out[type] = { err };
      }
    }),
  );
  store.set(foundKey(), found);
  // Pick automatically when there's exactly one answer and nothing chosen yet.
  for (const type of types) {
    const f = found[type];
    if (!myProvider(type) && f && f.length === 1) setMyProvider(type, f[0].match ? { id: f[0].match } : { name: f[0].name, phone: f[0].phone, site: f[0].site, found: true });
  }
  // Fall back to well-known county suggestions.
  const sugg = suggestionsFor(place);
  for (const type of types) {
    if (!myProvider(type) && sugg[type] && sugg[type].length === 1) setMyProvider(type, { id: sugg[type][0] });
  }
  return out;
}

export const actions = {
  async 'find-one'(btn) {
    const type = btn.dataset.type;
    btn.disabled = true;
    const el = document.getElementById(`found-${type}`);
    if (el) el.innerHTML = loading('Checking the service-area map…');
    const res = await findProviders([type]);
    btn.disabled = false;
    showFound(type, store.get(foundKey(), {})[type] || [], res[type]?.err);
    refreshCard(type);
  },
  'use-found'(btn, ctx) {
    const type = btn.dataset.type;
    const f = (store.get(foundKey(), {})[type] || [])[Number(btn.dataset.index)];
    if (!f) return;
    setMyProvider(type, f.match ? { id: f.match } : { name: f.name, phone: f.phone, site: f.site, found: true });
    toast('Saved');
    ctx.rerender();
  },
  'power-back'(_btn, ctx) {
    store.remove('powerOut');
    toast('Glad it’s back. Logged outages stay in Track.');
    ctx.rerender();
  },
  async 'net-check'(btn) {
    const el = document.getElementById('net-result');
    btn.disabled = true;
    el.innerHTML = loading('Testing…');
    const results = await connectivityCheck();
    btn.disabled = false;
    const ok = results.filter((r) => r.ok);
    const verdict = !ok.length
      ? '<div class="callout danger"><strong>No internet connection from this device.</strong> Check Wi-Fi/cellular, restart your modem, and check your provider’s outage page from another device.</div>'
      : ok.length === results.length
        ? `<div class="callout ok"><strong>You’re online.</strong> If a specific app or site isn’t working, the problem is on their end.</div>`
        : '<div class="callout warn"><strong>Partly online.</strong> Some sites answered and some didn’t — the connection may be overloaded.</div>';
    el.innerHTML = `${verdict}<ul class="plain small">${results.map((r) => `<li>${r.ok ? '✅' : '❌'} ${esc(r.label)}${r.ok ? ` — ${r.ms} ms` : ''}</li>`).join('')}</ul>`;
  },
};

export const changes = {
  'pick-provider'(sel, ctx) {
    const type = sel.dataset.type;
    const v = sel.value;
    const form = sel.parentElement.querySelector('.custom-provider');
    if (v === '__custom') {
      form.hidden = false;
      form.name.focus();
      return;
    }
    form.hidden = true;
    if (v === '__current') return;
    if (v.startsWith('__found:')) {
      const found = (store.get(foundKey(), {})[type] || []).filter((f) => !f.match);
      const f = found[Number(v.split(':')[1])];
      if (f) setMyProvider(type, { name: f.name, phone: f.phone, site: f.site, found: true });
    } else {
      setMyProvider(type, v ? { id: v } : null);
    }
    refreshCard(type);
    ctx.onProvidersChanged?.();
  },
};

export const submits = {
  'save-custom'(form) {
    const type = form.dataset.type;
    const name = form.name.value.trim();
    if (!name) return;
    setMyProvider(type, { name, phone: form.phone.value.trim(), site: form.site.value.trim() });
    form.hidden = true;
    toast('Saved');
    refreshCard(type);
  },
  'power-start'(form, ctx) {
    const at = new Date(form.at.value);
    store.set('powerOut', { at: (isNaN(at) ? new Date() : at).toISOString() });
    ctx.rerender();
  },
  noop() {},
};

function refreshCard(type) {
  const el = document.getElementById(`pcard-${type}`);
  const p = myProvider(type);
  if (el) el.innerHTML = p ? providerCard(p, type) : '';
}


// Accountability: private outage log, community board and where to file complaints.

import { CONFIG } from '../config.js';
import { state, myProvider } from '../state.js';
import { TYPE_LABELS } from '../providers.js';
import { communityReports, newReportUrl } from '../sources.js';
import {
  EVENT_KINDS, loadIncidents, getIncident, createIncident, deleteIncident, addEvent, removeEvent,
  stats, summaryText, creditLetter, complaintText, whereToFile,
} from '../track.js';
import {
  esc, ext, fmtTime, durationLabel, toLocalInput, copyText, downloadText, toast, telHref,
} from '../util.js';
import { card, sectionHead, loading, freshness, emptyState, unavailable } from '../ui.js';
import { reportItem } from './live.js';

const SERVICES = ['electric', 'internet', 'water', 'cell'];
const ICON = { electric: '⚡', internet: '📶', water: '💧', cell: '📱' };
let communityScope = 'zip';

function subnav(active) {
  const items = [
    ['', 'My log'],
    ['community', 'Community'],
    ['file', 'Where to file'],
  ];
  return `<nav class="segmented" aria-label="Accountability sections">
    ${items.map(([slug, label]) => `<a href="#/track${slug ? '/' + slug : ''}"${slug === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
  </nav>`;
}

// ---------- My log ----------
function newIncidentForm(service = 'electric') {
  const p = myProvider(service);
  return `
    <form class="stack" data-submit="new-incident">
      <label>What’s out?
        <select name="service" data-change="incident-service">
          ${SERVICES.map((s) => `<option value="${s}"${s === service ? ' selected' : ''}>${ICON[s]} ${esc(TYPE_LABELS[s])}</option>`).join('')}
        </select>
      </label>
      <label>Provider <input name="provider" value="${esc(p?.name || '')}" maxlength="80" placeholder="e.g. CPS Energy" autocomplete="off"></label>
      <label>When did it go out? <input type="datetime-local" name="startedAt" value="${toLocalInput()}" required></label>
      <button class="btn primary" type="submit">Start tracking</button>
    </form>`;
}

function incidentRow(inc) {
  const s = stats(inc);
  return `<li><a class="incident-row" href="#/track/i/${esc(inc.id)}">
    <span class="tile-icon" aria-hidden="true">${ICON[inc.service] || '•'}</span>
    <span class="grow">
      <strong>${esc(TYPE_LABELS[inc.service] || inc.service)}${inc.provider ? ' · ' + esc(inc.provider) : ''}</strong>
      <span class="small block">${s.open ? `<span class="tag tag-warn">Still out</span> ${esc(durationLabel(s.durationMs))}` : `<span class="tag tag-ok">Restored</span> after ${esc(durationLabel(s.durationMs))}`}${s.missedEtas ? ` · ${s.missedEtas} missed ETA${s.missedEtas > 1 ? 's' : ''}` : ''}</span>
      <span class="small muted block">Started ${esc(fmtTime(inc.startedAt))}${inc.zip ? ` · ${esc(inc.zip)}` : ''}</span>
    </span></a></li>`;
}

function logView(ctx) {
  const list = loadIncidents();
  const preset = ctx.route.parts[1] === 'new' ? ctx.route.query.get('service') : null;
  return `
    ${card(`${sectionHead('Start tracking an outage')}
      <p class="small">Keep a timestamped record of the outage and every promise your provider makes. It stays on this device — nothing is shared unless you choose to. Use it to ask for bill credits and file complaints.</p>
      ${newIncidentForm(SERVICES.includes(preset) ? preset : 'electric')}`)}
    ${card(`${sectionHead('Your records')}
      ${list.length ? `<ul class="plain incidents">${list.map(incidentRow).join('')}</ul>` : emptyState('No outages logged yet.')}`)}`;
}

// ---------- Incident detail ----------
function eventForm(kind) {
  const k = EVENT_KINDS[kind];
  return `
    <form class="stack event-form" data-submit="add-event" data-kind="${kind}">
      <h3>${esc(k.label)}</h3>
      <label>When <input type="datetime-local" name="at" value="${toLocalInput()}" required></label>
      ${k.fields.includes('eta') ? `<label>They said service would be back by <input type="datetime-local" name="eta" required></label>` : ''}
      ${k.fields.includes('ref') ? `<label>${esc(k.refLabel || 'Reference #')} <input name="ref" maxlength="80" autocomplete="off"></label>` : ''}
      ${k.fields.includes('note') ? `<label>Notes <textarea name="note" rows="2" maxlength="500" placeholder="Who you talked to, what they said, how long you waited…"></textarea></label>` : ''}
      <div class="btn-row"><button class="btn primary" type="submit">Add to timeline</button><button class="btn" type="button" data-action="cancel-event">Cancel</button></div>
    </form>`;
}

function detailView(inc) {
  const s = stats(inc);
  const svc = TYPE_LABELS[inc.service] || inc.service;
  const timeline = [
    `<li class="tl-item tl-start"><span class="tl-time">${esc(fmtTime(inc.startedAt))}</span><span>${esc(svc)} service went out</span></li>`,
    ...inc.events.map((e) => {
      const k = EVENT_KINDS[e.kind] || { label: e.kind };
      const late = e.kind === 'eta' && e.eta && new Date(e.eta) < (s.restoredAt ? new Date(s.restoredAt) : new Date());
      return `<li class="tl-item tl-${esc(e.kind)}">
        <span class="tl-time">${esc(fmtTime(e.at))}</span>
        <span><strong>${esc(k.label)}</strong>
          ${e.eta ? `<span class="block">Promised by ${esc(fmtTime(e.eta))} ${late ? '<span class="tag tag-bad">missed</span>' : s.open ? '' : '<span class="tag tag-ok">met</span>'}</span>` : ''}
          ${e.ref ? `<span class="block small">${esc(k.refLabel || 'Ref')}: ${esc(e.ref)}</span>` : ''}
          ${e.note ? `<span class="block small">${esc(e.note)}</span>` : ''}
        </span>
        <button type="button" class="icon-btn" data-action="remove-event" data-event="${esc(e.id)}" aria-label="Remove this entry">×</button>
      </li>`;
    }),
  ].join('');
  const provider = myProvider(inc.service);
  const reportLine = provider && provider.name === inc.provider && provider.phone
    ? `<a class="btn" href="${esc(telHref(String(provider.phone).split(/\s+or\s+/i).pop()))}">📞 Call ${esc(provider.name)}</a>`
    : '';
  const filing = whereToFile(inc.service, inc.state || state.place?.state);
  return `
    <p><a href="#/track">← All records</a></p>
    <h1 class="page-title">${ICON[inc.service] || ''} ${esc(svc)} outage${inc.provider ? ` · ${esc(inc.provider)}` : ''}</h1>
    <p class="muted">${[inc.city, inc.state, inc.zip].filter(Boolean).map(esc).join(' · ')}</p>
    ${card(`
      <div class="stats">
        <div class="stat"><span class="stat-num">${esc(durationLabel(s.durationMs))}</span><span class="stat-label">${s.open ? 'without service so far' : 'without service'}</span></div>
        <div class="stat"><span class="stat-num">${s.etas}</span><span class="stat-label">restoration times promised</span></div>
        <div class="stat ${s.missedEtas ? 'stat-bad' : ''}"><span class="stat-num">${s.missedEtas}</span><span class="stat-label">missed</span></div>
        <div class="stat"><span class="stat-num">${s.responseMs != null ? esc(durationLabel(s.responseMs)) : '—'}</span><span class="stat-label">first response after reporting</span></div>
      </div>
      ${s.ticket ? `<p class="small">Ticket #: <strong>${esc(s.ticket)}</strong></p>` : ''}
      <div class="btn-row">${reportLine}</div>`)}
    ${card(`${sectionHead('Add to the timeline')}
      <div class="kind-grid">
        ${Object.entries(EVENT_KINDS).map(([key, k]) => `<button type="button" class="btn ${key === 'restored' ? 'primary' : ''}" data-action="show-event-form" data-kind="${key}">${esc(k.label)}</button>`).join('')}
      </div>
      <div id="event-form-slot"></div>`)}
    ${card(`${sectionHead('Timeline')}<ol class="timeline">${timeline}</ol>`)}
    ${card(`${sectionHead('Use your record')}
      <div class="btn-row">
        <button type="button" class="btn" data-action="copy-summary">📋 Copy summary</button>
        ${navigator.share ? '<button type="button" class="btn" data-action="share-summary">📤 Share</button>' : ''}
        <button type="button" class="btn" data-action="download-summary">⬇️ Download</button>
        <button type="button" class="btn" data-action="show-letter" data-letter="credit">💵 Bill credit request</button>
        <button type="button" class="btn" data-action="show-letter" data-letter="complaint">📣 Complaint</button>
        <a class="btn" href="${esc(publicReportUrl(inc))}" target="_blank" rel="noopener noreferrer">🌐 Post publicly</a>
      </div>
      <div id="letter-slot"></div>`)}
    ${card(`${sectionHead('Where to take it')}${filingList(filing)}`)}
    <p><button type="button" class="btn danger" data-action="delete-incident">Delete this record</button></p>`;
}

function publicReportUrl(inc) {
  const s = stats(inc);
  const label = { electric: 'Power', internet: 'Internet', water: 'Water', cell: 'Cell service' }[inc.service] || 'Other';
  const status = s.open ? (s.missedEtas ? 'Provider missed an ETA' : 'Outage ongoing') : 'Service restored';
  const details = [
    `Started: ${fmtTime(inc.startedAt)}`,
    s.open ? `Still out after ${durationLabel(s.durationMs)}` : `Restored: ${fmtTime(s.restoredAt)} (${durationLabel(s.durationMs)})`,
    s.etas ? `Restoration times promised: ${s.etas}, missed: ${s.missedEtas}` : '',
  ].filter(Boolean).join('\n');
  return newReportUrl({ zip: inc.zip, state: inc.state, service: label, provider: inc.provider, status, details });
}

function filingList(items) {
  return `<ul class="plain filing">${items
    .map((f) => `<li><strong>${f.url ? ext(f.url, f.name) : esc(f.name)}</strong>${f.phone ? ` · <a href="${esc(telHref(f.phone))}">${esc(f.phone)}</a>` : ''}<div class="small">${esc(f.why)}</div></li>`)
    .join('')}</ul>`;
}

// ---------- Community ----------
function communityView() {
  const place = state.place;
  const scopes = [['zip', place ? `ZIP ${place.zip}` : 'My ZIP'], ['state', place ? place.state : 'My state'], ['all', 'Everywhere']];
  return `
    ${card(`${sectionHead('Community board')}
      <p class="small">Public reports of outages, boil-water notices and how providers are responding — posted by residents. Reports are unverified. Posting uses a free GitHub account and is public, so leave out names, addresses and account numbers.</p>
      <div class="btn-row">${ext(newReportUrl({ zip: place?.zip, state: place?.state }), '＋ Post a public report', 'btn primary')}</div>
      <nav class="chips" aria-label="Filter reports">
        ${scopes.map(([s, label]) => `<button type="button" class="chip" data-action="community-scope" data-scope="${s}" aria-pressed="${s === communityScope}">${esc(label)}</button>`).join('')}
      </nav>
      <div id="community-board">${loading()}</div>`)}`;
}

async function loadBoard(ctx) {
  const el = () => document.getElementById('community-board');
  try {
    const res = await communityReports();
    const place = state.place;
    const items = res.items.filter((r) => {
      if (communityScope === 'all' || !place) return true;
      if (communityScope === 'zip') return r.zip === place.zip;
      return r.state === place.state || r.zip === place.zip;
    });
    if (!ctx.alive() || !el()) return;
    if (!items.length) {
      el().innerHTML = emptyState('No reports here yet. Be the first to post one.') + freshness(res);
      return;
    }
    el().innerHTML = `${scorecard(items)}<h3>Latest reports</h3><ul class="plain feed">${items.slice(0, 50).map(reportItem).join('')}</ul>${freshness(res)}`;
  } catch {
    if (ctx.alive() && el()) el().innerHTML = unavailable('community reports', `https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/issues`, 'the issues page');
  }
}

function scorecard(items) {
  const by = new Map();
  for (const r of items) {
    const name = (r.provider || 'Unknown provider').trim();
    const key = name.toLowerCase();
    if (!by.has(key)) by.set(key, { name, total: 0, out: 0, restored: 0, missed: 0, noResponse: 0, boil: 0 });
    const row = by.get(key);
    row.total++;
    const st = (r.status || '').toLowerCase();
    if (/restored/.test(st) || !r.open) row.restored++;
    else row.out++;
    if (/missed/.test(st)) row.missed++;
    if (/no response/.test(st)) row.noResponse++;
    if (/boil/.test(st)) row.boil++;
  }
  const rows = [...by.values()].sort((a, b) => b.out - a.out || b.total - a.total).slice(0, 12);
  return `
    <h3>Provider scorecard</h3>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Provider</th><th>Reports</th><th>Out</th><th>Fixed</th><th>Missed ETA</th><th>No reply</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.total}</td><td>${r.out}</td><td>${r.restored}</td><td>${r.missed}</td><td>${r.noResponse}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

// ---------- Where to file ----------
function fileView() {
  const st = state.place?.state;
  return `
    ${SERVICES.map((s) => card(`${sectionHead(`${ICON[s]} ${TYPE_LABELS[s]}`)}${filingList(whereToFile(s, st))}`)).join('')}
    ${card(`${sectionHead('Tips that make complaints stick')}
      <ul>
        <li>Write down every ticket number, call time, wait time and the name of who you spoke with. Log it here as it happens.</li>
        <li>Screenshot the outage map and any estimated restoration time — they change and disappear.</li>
        <li>Ask for a bill credit for every day without service, in writing. Many providers only credit you if you ask.</li>
        <li>If someone in your home depends on powered medical equipment, ask your utility about its medical or critical-care program before the next storm.</li>
        <li>Keep receipts for spoiled food, hotels and generator fuel — some insurance policies, utilities or FEMA programs may reimburse them.</li>
        <li>Public comment at city council, co-op board or utility commission meetings goes on the record. Bring your timeline.</li>
      </ul>`)}`;
}

// ---------- View plumbing ----------
export function render(ctx) {
  const sub = ctx.route.parts[1] || '';
  if (sub === 'i') {
    const inc = getIncident(ctx.route.parts[2]);
    if (!inc) return `<p><a href="#/track">← All records</a></p>${emptyState('That record was not found on this device.')}`;
    return detailView(inc);
  }
  const active = sub === 'community' ? 'community' : sub === 'file' ? 'file' : '';
  const body = active === 'community' ? communityView() : active === 'file' ? fileView() : logView(ctx);
  return `<h1 class="page-title">Accountability</h1>${subnav(active)}${body}`;
}

export function mount(ctx) {
  if (ctx.route.parts[1] === 'community') loadBoard(ctx);
}

const currentId = (ctx) => ctx.route.parts[2];

export const actions = {
  'show-event-form'(btn) {
    const slot = document.getElementById('event-form-slot');
    slot.innerHTML = eventForm(btn.dataset.kind);
    slot.querySelector('input, textarea')?.focus();
    slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
  'cancel-event'() {
    document.getElementById('event-form-slot').innerHTML = '';
  },
  'remove-event'(btn, ctx) {
    if (!confirm('Remove this entry from the timeline?')) return;
    removeEvent(currentId(ctx), btn.dataset.event);
    ctx.rerender();
  },
  'delete-incident'(_btn, ctx) {
    if (!confirm('Delete this outage record from this device? This cannot be undone.')) return;
    deleteIncident(currentId(ctx));
    location.hash = '#/track';
  },
  async 'copy-summary'(_btn, ctx) {
    const ok = await copyText(summaryText(getIncident(currentId(ctx))));
    toast(ok ? 'Summary copied' : 'Could not copy — try Download');
  },
  async 'share-summary'(_btn, ctx) {
    try {
      await navigator.share({ title: 'Outage record', text: summaryText(getIncident(currentId(ctx))) });
    } catch {
      /* user cancelled */
    }
  },
  'download-summary'(_btn, ctx) {
    const inc = getIncident(currentId(ctx));
    downloadText(`outage-${inc.service}-${inc.startedAt.slice(0, 10)}.txt`, summaryText(inc));
  },
  'show-letter'(btn, ctx) {
    const inc = getIncident(currentId(ctx));
    const isCredit = btn.dataset.letter === 'credit';
    const text = isCredit ? creditLetter(inc) : complaintText(inc);
    document.getElementById('letter-slot').innerHTML = `
      <h3>${isCredit ? 'Bill credit request' : 'Complaint'}</h3>
      <p class="small">Fill in the [brackets], then send it by email, the provider’s website or the agency’s complaint form.</p>
      <textarea class="letter" rows="14">${esc(text)}</textarea>
      <div class="btn-row"><button type="button" class="btn primary" data-action="copy-letter">📋 Copy</button></div>`;
  },
  async 'copy-letter'() {
    const ok = await copyText(document.querySelector('#letter-slot textarea').value);
    toast(ok ? 'Copied' : 'Could not copy');
  },
  'community-scope'(btn, ctx) {
    communityScope = btn.dataset.scope;
    document.querySelectorAll('[data-action="community-scope"]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    document.getElementById('community-board').innerHTML = loading();
    loadBoard(ctx);
  },
};

export const changes = {
  'incident-service'(sel) {
    const p = myProvider(sel.value);
    const input = sel.form.provider;
    input.value = p?.name || '';
  },
};

export const submits = {
  'new-incident'(form) {
    const inc = createIncident({
      service: form.service.value,
      provider: form.provider.value.trim(),
      startedAt: new Date(form.startedAt.value),
      place: state.place,
    });
    location.hash = `#/track/i/${inc.id}`;
  },
  'add-event'(form, ctx) {
    const kind = form.dataset.kind;
    const at = new Date(form.at.value);
    const ev = { kind, at: isNaN(at) ? new Date() : at };
    if (form.eta && form.eta.value) ev.eta = new Date(form.eta.value).toISOString();
    if (form.ref && form.ref.value.trim()) ev.ref = form.ref.value.trim();
    if (form.note && form.note.value.trim()) ev.note = form.note.value.trim();
    addEvent(currentId(ctx), ev);
    toast('Added');
    ctx.rerender();
  },
};

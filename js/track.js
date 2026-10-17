// Accountability log: a private, timestamped record of an outage and the provider's
// response, kept on this device. It turns into a summary, a bill-credit request and a
// regulator complaint the user can send.

import { store, uid, fmtTime, durationLabel } from './util.js';
import { TYPE_LABELS } from './providers.js';
import { stateInfo } from './states.js';
import { STATE_NAMES } from './zip.js';

export const EVENT_KINDS = {
  reported: { label: 'Reported to provider', fields: ['ref', 'note'], refLabel: 'Ticket / confirmation #' },
  eta: { label: 'Provider gave a restoration time', fields: ['eta', 'note'] },
  update: { label: 'Provider update or message', fields: ['note'] },
  noresponse: { label: 'Could not reach provider', fields: ['note'] },
  crew: { label: 'Crew / technician seen', fields: ['note'] },
  partial: { label: 'Partially restored', fields: ['note'] },
  restored: { label: 'Service restored', fields: ['note'] },
  credit: { label: 'Asked for a bill credit', fields: ['ref', 'note'], refLabel: 'Reference #' },
  complaint: { label: 'Filed a complaint', fields: ['ref', 'note'], refLabel: 'Agency & case #' },
  note: { label: 'Note', fields: ['note'] },
};

export function loadIncidents() {
  return store.get('incidents', []);
}

function saveIncidents(list) {
  store.set('incidents', list);
}

export function getIncident(id) {
  return loadIncidents().find((i) => i.id === id) || null;
}

export function createIncident({ service, provider, startedAt, place }) {
  const inc = {
    id: uid(),
    service,
    provider: provider || '',
    zip: place?.zip || '',
    city: place?.city || '',
    state: place?.state || '',
    startedAt: new Date(startedAt || Date.now()).toISOString(),
    events: [],
  };
  saveIncidents([inc, ...loadIncidents()]);
  return inc;
}

export function updateIncident(id, patch) {
  const list = loadIncidents().map((i) => (i.id === id ? { ...i, ...patch } : i));
  saveIncidents(list);
}

export function deleteIncident(id) {
  saveIncidents(loadIncidents().filter((i) => i.id !== id));
}

export function addEvent(id, ev) {
  const list = loadIncidents();
  const inc = list.find((i) => i.id === id);
  if (!inc) return;
  inc.events.push({ ...ev, id: uid(), at: new Date(ev.at || Date.now()).toISOString() });
  inc.events.sort((a, b) => new Date(a.at) - new Date(b.at));
  saveIncidents(list);
}

export function removeEvent(id, eventId) {
  const list = loadIncidents();
  const inc = list.find((i) => i.id === id);
  if (!inc) return;
  inc.events = inc.events.filter((e) => e.id !== eventId);
  saveIncidents(list);
}

export function stats(inc) {
  const restored = [...inc.events].reverse().find((e) => e.kind === 'restored');
  const end = restored ? new Date(restored.at) : new Date();
  const start = new Date(inc.startedAt);
  const etas = inc.events.filter((e) => e.kind === 'eta' && e.eta);
  const missed = etas.filter((e) => new Date(e.eta) < end);
  const reported = inc.events.find((e) => e.kind === 'reported');
  const firstReply = reported
    ? inc.events.find((e) => ['eta', 'update', 'crew'].includes(e.kind) && new Date(e.at) >= new Date(reported.at))
    : null;
  return {
    open: !restored,
    restoredAt: restored ? restored.at : null,
    durationMs: end - start,
    etas: etas.length,
    missedEtas: missed.length,
    reportedAt: reported ? reported.at : null,
    ticket: reported?.ref || '',
    responseMs: firstReply ? new Date(firstReply.at) - new Date(reported.at) : null,
    noResponse: inc.events.filter((e) => e.kind === 'noresponse').length,
  };
}

function eventLine(e) {
  const k = EVENT_KINDS[e.kind] || { label: e.kind };
  let line = `- ${fmtTime(e.at)} — ${k.label}`;
  if (e.eta) line += `: promised by ${fmtTime(e.eta)}`;
  if (e.ref) line += ` (${k.refLabel || 'ref'}: ${e.ref})`;
  if (e.note) line += ` — ${e.note}`;
  return line;
}

export function timelineText(inc) {
  return [`- ${fmtTime(inc.startedAt)} — ${TYPE_LABELS[inc.service] || inc.service} service went out`, ...inc.events.map(eventLine)].join('\n');
}

function where(inc) {
  return [inc.zip && `ZIP ${inc.zip}`, [inc.city, inc.state].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
}

export function summaryText(inc) {
  const s = stats(inc);
  const svc = TYPE_LABELS[inc.service] || inc.service;
  const lines = [
    `${svc} outage record`,
    `Provider: ${inc.provider || 'not specified'}`,
    `Location: ${where(inc)}`,
    `Started: ${fmtTime(inc.startedAt)}`,
    s.open ? `Status: STILL OUT as of ${fmtTime(new Date())}` : `Restored: ${fmtTime(s.restoredAt)}`,
    `Time without service: ${durationLabel(s.durationMs)}`,
  ];
  if (s.ticket) lines.push(`Ticket #: ${s.ticket}`);
  if (s.etas) lines.push(`Restoration times promised: ${s.etas} (${s.missedEtas} missed)`);
  if (s.responseMs != null) lines.push(`First response after reporting: ${durationLabel(s.responseMs)}`);
  if (s.noResponse) lines.push(`Times unable to reach provider: ${s.noResponse}`);
  lines.push('', 'Timeline:', timelineText(inc), '', 'Recorded with StormCheck.');
  return lines.join('\n');
}

export function creditLetter(inc) {
  const s = stats(inc);
  const svc = (TYPE_LABELS[inc.service] || inc.service).toLowerCase();
  const end = s.open ? 'today (service is still out)' : fmtTime(s.restoredAt);
  const parts = [
    `To: ${inc.provider || '[provider]'} customer service`,
    `Subject: Request for bill credit — ${svc} outage`,
    '',
    'Account number: [your account number]',
    `Service address: [your address]${inc.zip ? `, ${inc.zip}` : ''}`,
    '',
    'Hello,',
    '',
    `My ${svc} service was out from ${fmtTime(inc.startedAt)} until ${end} — a total of ${durationLabel(s.durationMs)}.`,
  ];
  if (s.reportedAt) parts.push(`I reported the outage on ${fmtTime(s.reportedAt)}${s.ticket ? ` (ticket #${s.ticket})` : ''}.`);
  if (s.missedEtas) parts.push(`Your company gave ${s.etas} estimated restoration time${s.etas > 1 ? 's' : ''}, and ${s.missedEtas} passed without service being restored.`);
  parts.push(
    '',
    'I am asking for a prorated credit on my bill for every day I did not have service, and for written confirmation of the credit amount.',
    '',
    'Timeline:',
    timelineText(inc),
    '',
    'Thank you,',
    '[your name]',
    '[phone or email]',
  );
  return parts.join('\n');
}

export function complaintText(inc) {
  const s = stats(inc);
  const svc = (TYPE_LABELS[inc.service] || inc.service).toLowerCase();
  const stName = STATE_NAMES[inc.state] || inc.state || '';
  const concerns = [];
  if (s.durationMs > 24 * 3600000) concerns.push(`the length of the outage (${durationLabel(s.durationMs)})`);
  if (s.missedEtas) concerns.push(`${s.missedEtas} missed restoration estimate${s.missedEtas > 1 ? 's' : ''}`);
  if (s.noResponse) concerns.push('being unable to reach the company');
  if (s.responseMs != null && s.responseMs > 24 * 3600000) concerns.push(`waiting ${durationLabel(s.responseMs)} for a response`);
  if (!concerns.length) concerns.push('the outage and how it was handled');
  return [
    `Complaint about ${inc.provider || '[provider]'} — ${svc} outage`,
    '',
    `I am a customer in ${[inc.city, stName].filter(Boolean).join(', ')}${inc.zip ? ` (ZIP ${inc.zip})` : ''}.`,
    `My ${svc} service went out on ${fmtTime(inc.startedAt)} and ${s.open ? `is still out as of ${fmtTime(new Date())}` : `was restored on ${fmtTime(s.restoredAt)}`} (${durationLabel(s.durationMs)}).`,
    '',
    `I am concerned about ${concerns.join(', ')}.`,
    '',
    `I ask that you review ${inc.provider || 'the company'}'s response and communication during this event, and make sure customers receive credits for the time without service.`,
    '',
    'Timeline:',
    timelineText(inc),
    '',
    '[your name, service address, account number and contact info]',
  ].join('\n');
}

// Where to take a complaint, by service type and state.
export function whereToFile(service, stateCode) {
  const st = stateInfo(stateCode);
  const out = [];
  if (service === 'electric' || service === 'water') {
    out.push({
      name: st.puc[0],
      url: st.puc[1],
      why: 'Regulates investor-owned utilities. Ask the utility for a resolution first, then file here if it is not resolved.',
    });
    out.push({
      name: 'City council or co-op board',
      why: 'City-owned utilities (such as CPS Energy, Austin Energy, JEA or OUC) answer to the city council; electric co-ops answer to a board their members elect. Public comment at their meetings goes on the record.',
    });
  }
  if (service === 'internet' || service === 'cell') {
    out.push({
      name: 'FCC Consumer Complaint Center',
      url: 'https://consumercomplaints.fcc.gov',
      why: 'The FCC forwards your complaint to the company, which must respond to you, usually within 30 days.',
    });
    if (st.puc && st.known) out.push({ name: st.puc[0], url: st.puc[1], why: 'Some states also take complaints about phone service.' });
  }
  out.push({
    name: st.ag[0],
    url: st.ag[1],
    phone: st.agPhone,
    why: 'Price gouging, billing for service you did not receive, and deceptive practices.',
  });
  out.push({
    name: 'Better Business Bureau',
    url: 'https://www.bbb.org/file-a-complaint',
    why: 'Public complaint record; companies often respond to resolve it.',
  });
  return out;
}

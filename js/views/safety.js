// Safety guides (offline), emergency contacts, and the About/settings page.

import { CONFIG } from '../config.js';
import { state, myProvider, saveSettings, countyLabel } from '../state.js';
import { GUIDES, getGuide } from '../guides.js';
import { NATIONAL_CONTACTS, FEDERAL_LINKS, stateInfo } from '../states.js';
import { TYPE_LABELS } from '../providers.js';
import { esc, ext, telHref, store, downloadText, toast } from '../util.js';
import { card, sectionHead, emptyState } from '../ui.js';
import { bleachCalc, updateBleach } from './services.js';

// ---------- Safety ----------
function guideList() {
  return `
    <h1 class="page-title">Safety</h1>
    <a class="card emergency-card" href="#/contacts">
      <strong>☎️ Emergency numbers</strong>
      <span class="small">911, 211, FEMA, shelters, crisis lines and your providers — save them to your phone.</span>
    </a>
    <ul class="plain guide-list">
      ${GUIDES.map((g) => `<li><a class="guide-link" href="#/safety/${g.id}"><span class="guide-icon" aria-hidden="true">${g.icon}</span><span><strong>${esc(g.title)}</strong><span class="small block">${esc(g.summary)}</span></span></a></li>`).join('')}
    </ul>
    <p class="small muted">Guides are saved on your device and work without a connection.</p>`;
}

function checklist(g) {
  const done = store.get('check:' + g.id, {});
  const count = g.checklist.filter(([id]) => done[id]).length;
  return `
    <p class="small"><strong id="check-count">${count} of ${g.checklist.length}</strong> done. Your progress is saved on this device.</p>
    <ul class="plain checklist">
      ${g.checklist.map(([id, text]) => `<li><label><input type="checkbox" data-change="check-item" data-guide="${g.id}" data-item="${id}"${done[id] ? ' checked' : ''}> <span>${esc(text)}</span></label></li>`).join('')}
    </ul>
    <button type="button" class="btn small" data-action="reset-checklist" data-guide="${g.id}">Reset checklist</button>`;
}

function guideView(g) {
  return `
    <p><a href="#/safety">← All safety guides</a></p>
    <article class="card guide">
      <h1>${g.icon} ${esc(g.title)}</h1>
      ${g.checklist ? checklist(g) : g.html}
    </article>
    <p class="small muted">Not a substitute for instructions from local officials. In an emergency, call 911.</p>`;
}

export function render(ctx) {
  const g = getGuide(ctx.route.parts[1]);
  return g ? guideView(g) : guideList();
}

export function mount() {
  const slot = document.getElementById('bleach-calc');
  if (slot) {
    slot.innerHTML = bleachCalc();
    updateBleach(slot.querySelector('form'));
  }
}

export const actions = {
  'reset-checklist'(btn, ctx) {
    store.remove('check:' + btn.dataset.guide);
    ctx.rerender();
  },
};

export const changes = {
  'check-item'(box) {
    const key = 'check:' + box.dataset.guide;
    const done = store.get(key, {});
    if (box.checked) done[box.dataset.item] = true;
    else delete done[box.dataset.item];
    store.set(key, done);
    const g = getGuide(box.dataset.guide);
    const el = document.getElementById('check-count');
    if (el && g) el.textContent = `${g.checklist.filter(([id]) => done[id]).length} of ${g.checklist.length}`;
  },
};

// ---------- Contacts ----------
function contactRows() {
  const rows = NATIONAL_CONTACTS.map((c) => ({ ...c }));
  const place = state.place;
  const mine = ['electric', 'water', 'internet', 'cell']
    .map((t) => [t, myProvider(t)])
    .filter(([, p]) => p && p.phone)
    .map(([t, p]) => ({ label: `${p.name} (${TYPE_LABELS[t].toLowerCase()})`, phone: String(p.phone).split(/\s+or\s+/i).pop(), url: p.outage || p.site }));
  const st = place ? stateInfo(place.state) : null;
  return { rows, mine, st };
}

function contactItem(c) {
  const actions = [];
  if (c.phone) actions.push(`<a class="btn primary" href="${esc(telHref(c.phone))}">📞 ${esc(c.phone)}</a>`);
  if (c.sms) actions.push(`<a class="btn primary" href="sms:${esc(c.sms)}?&body=${encodeURIComponent(`${c.smsBody} ${state.place?.zip || ''}`.trim())}">💬 Text ${esc(c.smsBody)} to ${esc(c.sms)}</a>`);
  if (c.url) actions.push(ext(c.url, 'Website', 'btn'));
  return `<li class="contact"><strong>${esc(c.label)}</strong>${c.note ? `<span class="small block">${esc(c.note)}</span>` : ''}<div class="btn-row">${actions.join('')}</div></li>`;
}

export function renderContacts() {
  const { rows, mine, st } = contactRows();
  return `
    <h1 class="page-title">Emergency numbers</h1>
    <div class="callout danger"><strong>Life-threatening emergency? Call 911.</strong> If calls won’t go through, try texting 911 — it works in many areas.</div>
    ${card(`${sectionHead('Your providers')}
      ${mine.length ? `<ul class="plain contacts">${mine.map(contactItem).join('')}</ul>` : emptyState('Choose your providers on the Services page to list their outage lines here.')}
      <a class="btn" href="#/services/power">Choose providers</a>`)}
    ${card(`${sectionHead('Help lines')}<ul class="plain contacts">${rows.map(contactItem).join('')}</ul>`)}
    ${st ? card(`${sectionHead(`${state.place.state} agencies`)}
      <ul class="links">
        <li>${ext(st.ema[1], st.ema[0])}</li>
        ${st.evac ? `<li>${ext(st.evac[1], st.evac[0])}</li>` : ''}
        <li>${ext(st.puc[1], st.puc[0])}</li>
        <li>${ext(st.ag[1], st.ag[0])}${st.agPhone ? ` · <a href="${esc(telHref(st.agPhone))}">${esc(st.agPhone)}</a>` : ''}</li>
      </ul>`) : ''}
    ${card(`${sectionHead('Save for when you’re offline')}
      <p class="small">Download these numbers into your phone’s contacts, or print a one-page sheet for the fridge.</p>
      <div class="btn-row">
        <button type="button" class="btn primary" data-action="download-vcf">⬇️ Add to my contacts (.vcf)</button>
        <button type="button" class="btn" data-action="print">🖨 Print emergency sheet</button>
      </div>`)}
    ${card(`${sectionHead('Federal resources')}<ul class="links">${FEDERAL_LINKS.map(([l, u]) => `<li>${ext(u, l)}</li>`).join('')}</ul>`)}`;
}

function vcard(name, phone, note = '') {
  const clean = (s) => String(s).replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
  return ['BEGIN:VCARD', 'VERSION:3.0', `FN:${clean(name)}`, `ORG:Emergency contacts`, `TEL;TYPE=VOICE:${phone}`, note ? `NOTE:${clean(note)}` : '', 'END:VCARD']
    .filter(Boolean)
    .join('\r\n');
}

export const contactActions = {
  'download-vcf'() {
    const { rows, mine } = contactRows();
    const cards = [
      ...mine.map((c) => vcard(c.label, c.phone, 'Outage line')),
      ...rows.filter((c) => c.phone && c.phone.length > 3).map((c) => vcard(c.label, c.phone, c.note || '')),
    ];
    downloadText('emergency-contacts.vcf', cards.join('\r\n'), 'text/vcard');
    toast('Open the downloaded file to add the contacts');
  },
  print() {
    window.print();
  },
};

// ---------- About / settings ----------
export function renderAbout() {
  const s = state.settings;
  const place = state.place;
  return `
    <h1 class="page-title">About & settings</h1>
    ${card(`${sectionHead('Settings')}
      <form class="stack" data-submit="noop">
        <label>Theme
          <select data-change="setting" data-key="theme">
            ${[['auto', 'Match my phone'], ['light', 'Light'], ['dark', 'Dark (saves battery on many phones)']].map(([v, l]) => `<option value="${v}"${s.theme === v ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
        <label class="check"><input type="checkbox" data-change="setting" data-key="dataSaver"${s.dataSaver ? ' checked' : ''}> Data saver — don’t load maps and images until I tap them</label>
      </form>
      ${place ? `<p class="small">Current location: ${esc(place.city)}, ${esc(place.state)} ${esc(place.zip || '')} (${esc(countyLabel(place))}).</p>` : ''}
      <button type="button" class="btn danger" data-action="clear-data">Erase everything saved on this device</button>`)}
    ${card(`${sectionHead('About StormCheck')}
      <p>StormCheck keeps people in storm- and disaster-prone areas informed: live alerts, power, internet and water status, local incident reports, safety steps, and tools to hold service providers accountable.</p>
      <p><strong>It is not an official source.</strong> Always follow instructions from local officials. In an emergency, call 911.</p>`)}
    ${card(`${sectionHead('Privacy')}
      <ul>
        <li>No accounts, ads, cookies or tracking.</li>
        <li>Your ZIP, providers, checklists and outage logs are stored only in this browser.</li>
        <li>To get live data, your browser asks public agencies (NWS, NHC, FEMA, NOAA, EPA) about your ZIP’s center point — not your exact location.</li>
        <li>Community reports are public GitHub issues. Only post what you’re comfortable sharing.</li>
      </ul>`)}
    ${card(`${sectionHead('Data sources')}
      <ul class="small">
        <li>Weather alerts, forecasts and radar: ${ext('https://www.weather.gov', 'National Weather Service')}</li>
        <li>Tropical storms: ${ext('https://www.nhc.noaa.gov', 'National Hurricane Center')}</li>
        <li>Local storm reports: NWS, via the ${ext('https://mesonet.agron.iastate.edu', 'Iowa Environmental Mesonet')}</li>
        <li>River gauges: ${ext('https://water.noaa.gov', 'NOAA National Water Prediction Service')}</li>
        <li>Disaster declarations: ${ext('https://www.fema.gov/about/openfema', 'OpenFEMA')}</li>
        <li>Water system areas: ${ext('https://www.epa.gov', 'U.S. EPA')}; electric service territories: HIFLD / Oak Ridge National Laboratory</li>
        <li>ZIP codes: ${ext('https://www.geonames.org', 'GeoNames')} (CC BY 4.0)</li>
        <li>Safety guidance: Ready.gov, CDC, EPA, USDA, FDA, FEMA</li>
      </ul>`)}
    ${card(`${sectionHead('Get involved')}
      <p>Spotted a wrong phone number or a missing provider? ${ext(`https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/issues/new`, 'Open an issue')} or a pull request.</p>`)}`;
}

export const aboutChanges = {
  setting(el) {
    const key = el.dataset.key;
    saveSettings({ [key]: el.type === 'checkbox' ? el.checked : el.value });
    toast('Saved');
  },
};

export const aboutActions = {
  'clear-data'() {
    if (!confirm('Erase your ZIP, providers, checklists and outage logs from this device?')) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('stormcheck:')).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    location.hash = '#/';
    location.reload();
  },
};

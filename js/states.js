// State & territory resources: emergency management, evacuation zones, road conditions,
// utility regulators (for complaints), consumer protection (price gouging) and drinking water.

export const STATES = {
  TX: {
    ema: ['Texas Division of Emergency Management', 'https://tdem.texas.gov'],
    roads: ['DriveTexas road conditions', 'https://drivetexas.org'],
    puc: ['Public Utility Commission of Texas', 'https://www.puc.texas.gov'],
    ag: ['Texas Attorney General – Consumer Protection', 'https://www.texasattorneygeneral.gov/consumer-protection'],
    agPhone: '1-800-621-0508',
    water: ['TCEQ Drinking Water Watch (look up your water system)', 'https://dww2.tceq.texas.gov/DWW/'],
    extra: [['ERCOT grid conditions', 'https://www.ercot.com']],
    notes: [
      'In most of Texas your bill comes from a retail provider, but outages are fixed by the poles-and-wires utility (CenterPoint, Oncor, AEP Texas, TNMP). Report outages to them.',
      'People who need help evacuating can register with STEAR by dialing 2-1-1.',
    ],
  },
  LA: {
    ema: ['GOHSEP (Louisiana emergency management)', 'https://gohsep.la.gov'],
    evac: ['Get A Game Plan (GOHSEP)', 'https://gohsep.la.gov/get-a-game-plan/'],
    roads: ['511 Louisiana', 'https://www.511la.org'],
    puc: ['Louisiana Public Service Commission', 'https://www.lpsc.louisiana.gov'],
    ag: ['Louisiana Attorney General', 'https://www.ag.state.la.us'],
    agPhone: '1-800-351-4889',
    water: ['Louisiana Department of Health', 'https://ldh.la.gov'],
  },
  MS: {
    ema: ['Mississippi Emergency Management Agency', 'https://www.msema.org'],
    roads: ['MDOT Traffic', 'https://www.mdottraffic.com'],
    puc: ['Mississippi Public Service Commission', 'https://www.psc.ms.gov'],
    ag: ['Mississippi Attorney General', 'https://www.ago.state.ms.us'],
    water: ['Mississippi State Department of Health', 'https://msdh.ms.gov'],
  },
  AL: {
    ema: ['Alabama Emergency Management Agency', 'https://ema.alabama.gov'],
    roads: ['ALGO Traffic', 'https://algotraffic.com'],
    puc: ['Alabama Public Service Commission', 'https://psc.alabama.gov'],
    ag: ['Alabama Attorney General', 'https://www.alabamaag.gov'],
    agPhone: '1-800-392-5658',
    water: ['Alabama Dept. of Environmental Management', 'https://adem.alabama.gov'],
  },
  FL: {
    ema: ['Florida Division of Emergency Management', 'https://www.floridadisaster.org'],
    evac: ['Know Your Zone (Florida)', 'https://www.floridadisaster.org/knowyourzone/'],
    roads: ['FL511', 'https://fl511.com'],
    puc: ['Florida Public Service Commission', 'https://www.floridapsc.com'],
    ag: ['Florida Attorney General', 'https://www.myfloridalegal.com'],
    agPhone: '1-866-966-7226',
    water: ['Florida Department of Health (county boil-water notices)', 'https://www.floridahealth.gov'],
  },
  GA: {
    ema: ['Georgia Emergency Management (GEMA)', 'https://gema.georgia.gov'],
    roads: ['Georgia 511', 'https://511ga.org'],
    puc: ['Georgia Public Service Commission', 'https://psc.ga.gov'],
    ag: ['Georgia Consumer Protection Division', 'https://consumer.georgia.gov'],
    water: ['Georgia Environmental Protection Division', 'https://epd.georgia.gov'],
  },
  SC: {
    ema: ['South Carolina Emergency Management', 'https://www.scemd.org'],
    evac: ['Know Your Zone (South Carolina)', 'https://www.scemd.org/prepare/know-your-zone/'],
    roads: ['SC 511', 'https://www.511sc.org'],
    puc: ['SC Office of Regulatory Staff (utility complaints)', 'https://ors.sc.gov'],
    ag: ['South Carolina Attorney General', 'https://www.scag.gov'],
    water: ['SC Dept. of Environmental Services', 'https://des.sc.gov'],
  },
  NC: {
    ema: ['ReadyNC', 'https://www.readync.gov'],
    evac: ['Know Your Zone (North Carolina)', 'https://knowyourzone.nc.gov'],
    roads: ['DriveNC', 'https://drivenc.gov'],
    puc: ['North Carolina Utilities Commission', 'https://www.ncuc.gov'],
    ag: ['North Carolina Attorney General', 'https://ncdoj.gov'],
    agPhone: '1-877-566-7226',
    water: ['NC Dept. of Environmental Quality', 'https://www.deq.nc.gov'],
  },
  VA: {
    ema: ['Virginia Dept. of Emergency Management', 'https://www.vaemergency.gov'],
    roads: ['Virginia 511', 'https://511.vdot.virginia.gov'],
    puc: ['Virginia State Corporation Commission', 'https://www.scc.virginia.gov'],
    ag: ['Virginia Attorney General', 'https://www.oag.state.va.us'],
    agPhone: '1-800-552-9963',
    water: ['Virginia Department of Health', 'https://www.vdh.virginia.gov'],
  },
  MD: {
    ema: ['Maryland Dept. of Emergency Management', 'https://mdem.maryland.gov'],
    roads: ['Maryland CHART traffic', 'https://chart.maryland.gov'],
    puc: ['Maryland Public Service Commission', 'https://psc.maryland.gov'],
    ag: ['Maryland Attorney General', 'https://oag.maryland.gov'],
    water: ['Maryland Dept. of the Environment', 'https://mde.maryland.gov'],
  },
  DE: {
    ema: ['Delaware Emergency Management Agency', 'https://dema.delaware.gov'],
    puc: ['Delaware Public Service Commission', 'https://depsc.delaware.gov'],
    ag: ['Delaware Attorney General', 'https://attorneygeneral.delaware.gov'],
  },
  NJ: {
    ema: ['Ready NJ', 'https://ready.nj.gov'],
    roads: ['511NJ', 'https://511nj.org'],
    puc: ['NJ Board of Public Utilities', 'https://www.nj.gov/bpu'],
    ag: ['NJ Division of Consumer Affairs', 'https://www.njconsumeraffairs.gov'],
    agPhone: '1-800-242-5846',
    water: ['NJ Dept. of Environmental Protection', 'https://dep.nj.gov'],
  },
  NY: {
    ema: ['NY Division of Homeland Security & Emergency Services', 'https://www.dhses.ny.gov'],
    evac: ['NYC: Hurricane Evacuation Zone Finder', 'https://maps.nyc.gov/hurricane/'],
    roads: ['511NY', 'https://511ny.org'],
    puc: ['NY Department of Public Service', 'https://dps.ny.gov'],
    ag: ['NY Attorney General', 'https://ag.ny.gov'],
    agPhone: '1-800-771-7755',
    water: ['NY State Department of Health', 'https://www.health.ny.gov'],
  },
  CT: {
    ema: ['CT Emergency Management (DEMHS)', 'https://portal.ct.gov/demhs'],
    roads: ['CTroads', 'https://ctroads.org'],
    puc: ['CT Public Utilities Regulatory Authority', 'https://portal.ct.gov/pura'],
    ag: ['CT Attorney General', 'https://portal.ct.gov/ag'],
  },
  RI: {
    ema: ['Rhode Island Emergency Management', 'https://riema.ri.gov'],
    puc: ['RI Public Utilities Commission', 'https://ripuc.ri.gov'],
    ag: ['RI Attorney General', 'https://riag.ri.gov'],
  },
  MA: {
    ema: ['Massachusetts Emergency Management Agency', 'https://www.mass.gov/orgs/massachusetts-emergency-management-agency'],
    roads: ['Mass511', 'https://mass511.com'],
    puc: ['MA Department of Public Utilities', 'https://www.mass.gov/orgs/department-of-public-utilities'],
    ag: ['MA Attorney General', 'https://www.mass.gov/orgs/office-of-the-attorney-general'],
  },
  ME: {
    ema: ['Maine Emergency Management Agency', 'https://www.maine.gov/mema'],
    roads: ['New England 511', 'https://newengland511.org'],
    puc: ['Maine Public Utilities Commission', 'https://www.maine.gov/mpuc'],
    ag: ['Maine Attorney General', 'https://www.maine.gov/ag'],
  },
  PR: {
    ema: ['Negociado para el Manejo de Emergencias (NMEAD)', 'https://dsp.pr.gov/negociados/negociado-manejo-de-emergencia-y-administracion-de-desastres'],
    puc: ['Negociado de Energía de Puerto Rico', 'https://energia.pr.gov'],
    ag: ['DACO (consumer affairs)', 'https://www.daco.pr.gov'],
    water: ['AAA / PRASA', 'https://www.acueductospr.com'],
  },
  VI: {
    ema: ['VITEMA', 'https://vitema.vi.gov'],
  },
  HI: {
    ema: ['Hawaiʻi Emergency Management Agency', 'https://dod.hawaii.gov/hiema/'],
    puc: ['Hawaiʻi Public Utilities Commission', 'https://puc.hawaii.gov'],
    water: ['Hawaiʻi State Department of Health', 'https://health.hawaii.gov'],
  },
  GU: {
    ema: ['Guam Homeland Security / Office of Civil Defense', 'https://ghs.guam.gov'],
  },
};

// Fallbacks for anywhere not listed above.
export const DEFAULT_STATE = {
  ema: ['Find your state emergency management agency', 'https://www.usa.gov/state-emergency-management'],
  puc: ['Find your state utility commission (NARUC)', 'https://www.naruc.org/about-naruc/our-mission/regulatory-commissions/'],
  ag: ['Find your state attorney general', 'https://www.naag.org/find-my-ag/'],
};

export function stateInfo(code) {
  const s = STATES[code] || {};
  return { ...DEFAULT_STATE, ...s, known: Boolean(STATES[code]) };
}

// Nationwide numbers and links that work everywhere.
export const NATIONAL_CONTACTS = [
  { label: 'Emergency (police, fire, EMS)', phone: '911', note: 'Text-to-911 works in many areas if you cannot call.' },
  { label: 'Local help: shelters, food, rent, utility bills', phone: '211', url: 'https://www.211.org' },
  { label: 'FEMA disaster assistance', phone: '1-800-621-3362', url: 'https://www.disasterassistance.gov' },
  { label: 'Find an open shelter (text)', sms: '43362', smsBody: 'SHELTER', note: 'Text SHELTER and your ZIP code to 43362.' },
  { label: 'American Red Cross', phone: '1-800-733-2767', url: 'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html' },
  { label: 'Disaster Distress Helpline (call or text)', phone: '1-800-985-5990', note: 'Free, 24/7 crisis counseling after a disaster.' },
  { label: 'Suicide & Crisis Lifeline', phone: '988' },
  { label: 'Poison Control', phone: '1-800-222-1222', note: 'Includes carbon monoxide exposure questions.' },
  { label: 'Dialysis patients: KHARES kidney emergency hotline', phone: '1-866-446-3507' },
  { label: 'Report FEMA / disaster-aid fraud (DHS Inspector General)', phone: '1-800-323-8603', url: 'https://www.oig.dhs.gov/hotline' },
];

export const FEDERAL_LINKS = [
  ['National Hurricane Center', 'https://www.nhc.noaa.gov'],
  ['National Weather Service', 'https://www.weather.gov'],
  ['Ready.gov – Hurricanes', 'https://www.ready.gov/hurricanes'],
  ['DisasterAssistance.gov (apply for FEMA help)', 'https://www.disasterassistance.gov'],
  ['SBA disaster loans', 'https://www.sba.gov/funding-programs/disaster-assistance'],
  ['FCC – file an internet/phone complaint', 'https://consumercomplaints.fcc.gov'],
  ['FTC – report a scam', 'https://reportfraud.ftc.gov'],
];

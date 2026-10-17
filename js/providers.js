// Provider directory + automatic provider finder.
//
// Directory entries are curated for hurricane-prone states. Fields:
//   id, type ('electric' | 'water' | 'internet' | 'cell'), name, states ('*' = nationwide),
//   site, outage (outage map / status page), phone, phoneByState, text (SMS outage reporting),
//   downdetector (crowd outage reports), network (for prepaid/MVNO brands), note,
//   aliases (uppercase fragments used to match names returned by the territory lookups).
// Phone numbers are the publicly listed outage/support lines; people should still confirm
// against their bill. Anything not listed can be typed in as "Other".

import { fetchWithTimeout } from './util.js';

const DD = (slug) => `https://downdetector.com/status/${slug}/`;

export const PROVIDERS = [
  // ---------------- Electric: Texas ----------------
  { id: 'cps-energy', type: 'electric', name: 'CPS Energy', states: ['TX'], site: 'https://www.cpsenergy.com', outage: 'https://outagemap.cpsenergy.com/', phone: '210-353-2222', aliases: ['CPS ENERGY', 'CITY OF SAN ANTONIO'] },
  { id: 'centerpoint', type: 'electric', name: 'CenterPoint Energy', states: ['TX', 'IN', 'OH'], site: 'https://www.centerpointenergy.com', outage: 'https://www.centerpointenergy.com/en-us/outage', phone: '713-207-2222', note: 'Houston-area outages are handled by CenterPoint even if your bill comes from a retail provider.', aliases: ['CENTERPOINT'] },
  { id: 'oncor', type: 'electric', name: 'Oncor', states: ['TX'], site: 'https://www.oncor.com', outage: 'https://stormcenter.oncor.com/', phone: '1-888-313-4747', note: 'Oncor handles outages even if your bill comes from a retail provider.', aliases: ['ONCOR'] },
  { id: 'aep-texas', type: 'electric', name: 'AEP Texas', states: ['TX'], site: 'https://www.aeptexas.com', outage: 'https://www.aeptexas.com/outages/', phone: '1-866-223-8508', note: 'AEP Texas handles outages even if your bill comes from a retail provider.', aliases: ['AEP TEXAS', 'AEP TEXAS CENTRAL', 'AEP TEXAS NORTH'] },
  { id: 'tnmp', type: 'electric', name: 'TNMP (Texas-New Mexico Power)', states: ['TX'], site: 'https://www.tnmp.com', outage: 'https://www.tnmp.com/outages', phone: '1-888-866-7456', note: 'TNMP handles outages even if your bill comes from a retail provider.', aliases: ['TEXAS-NEW MEXICO POWER', 'TEXAS NEW MEXICO POWER', 'TNMP'] },
  { id: 'entergy', type: 'electric', name: 'Entergy', states: ['TX', 'LA', 'MS', 'AR'], site: 'https://www.entergy.com', outage: 'https://www.etrviewoutage.com/', phone: '1-800-968-8243', aliases: ['ENTERGY'] },
  { id: 'austin-energy', type: 'electric', name: 'Austin Energy', states: ['TX'], site: 'https://austinenergy.com', outage: 'https://outagemap.austinenergy.com/', phone: '512-322-9100', aliases: ['AUSTIN ENERGY', 'CITY OF AUSTIN'] },
  { id: 'nbu', type: 'electric', name: 'New Braunfels Utilities', states: ['TX'], site: 'https://www.nbutexas.com', aliases: ['NEW BRAUNFELS'] },
  { id: 'gvec', type: 'electric', name: 'GVEC (Guadalupe Valley Electric Co-op)', states: ['TX'], site: 'https://www.gvec.org', aliases: ['GUADALUPE VALLEY', 'GVEC'] },
  { id: 'pec', type: 'electric', name: 'Pedernales Electric Co-op (PEC)', states: ['TX'], site: 'https://www.pec.coop', aliases: ['PEDERNALES'] },
  { id: 'bluebonnet', type: 'electric', name: 'Bluebonnet Electric Co-op', states: ['TX'], site: 'https://www.bluebonnet.coop', aliases: ['BLUEBONNET'] },
  { id: 'btu', type: 'electric', name: 'Bryan Texas Utilities', states: ['TX'], site: 'https://www.btutilities.com', aliases: ['BRYAN TEXAS UTILITIES', 'CITY OF BRYAN'] },
  { id: 'swepco', type: 'electric', name: 'SWEPCO (AEP)', states: ['TX', 'LA', 'AR'], site: 'https://www.swepco.com', outage: 'https://www.swepco.com/outages/', aliases: ['SOUTHWESTERN ELECTRIC POWER', 'SWEPCO'] },
  { id: 'tx-coops', type: 'electric', name: 'Other Texas electric co-op', states: ['TX'], site: 'https://www.texas-ec.org', note: 'Texas Electric Cooperatives keeps a directory of member co-ops.' },

  // ---------------- Electric: Louisiana / Mississippi / Alabama ----------------
  { id: 'cleco', type: 'electric', name: 'Cleco', states: ['LA'], site: 'https://www.cleco.com', aliases: ['CLECO'] },
  { id: 'slemco', type: 'electric', name: 'SLEMCO', states: ['LA'], site: 'https://www.slemco.com', aliases: ['SOUTHWEST LOUISIANA ELECTRIC', 'SLEMCO'] },
  { id: 'demco', type: 'electric', name: 'DEMCO (Dixie Electric Membership Corp.)', states: ['LA'], site: 'https://www.demco.org', aliases: ['DIXIE ELECTRIC MEMBERSHIP', 'DEMCO'] },
  { id: 'mississippi-power', type: 'electric', name: 'Mississippi Power', states: ['MS'], site: 'https://www.mississippipower.com', outage: 'https://outagemap.mississippipower.com/', aliases: ['MISSISSIPPI POWER'] },
  { id: 'coast-epa', type: 'electric', name: 'Coast Electric Power Association', states: ['MS'], site: 'https://www.coastepa.com', aliases: ['COAST ELECTRIC'] },
  { id: 'singing-river', type: 'electric', name: 'Singing River Electric', states: ['MS', 'AL'], site: 'https://www.singingriver.com', aliases: ['SINGING RIVER'] },
  { id: 'alabama-power', type: 'electric', name: 'Alabama Power', states: ['AL'], site: 'https://www.alabamapower.com', outage: 'https://outagemap.alabamapower.com/', phone: '1-800-888-2726', aliases: ['ALABAMA POWER'] },
  { id: 'baldwin-emc', type: 'electric', name: 'Baldwin EMC', states: ['AL'], site: 'https://baldwinemc.com', aliases: ['BALDWIN COUNTY EL', 'BALDWIN EMC'] },
  { id: 'riviera', type: 'electric', name: 'Riviera Utilities', states: ['AL'], site: 'https://www.rivierautilities.com', aliases: ['RIVIERA UTILITIES'] },

  // ---------------- Electric: Florida ----------------
  { id: 'fpl', type: 'electric', name: 'FPL (Florida Power & Light)', states: ['FL'], site: 'https://www.fpl.com', outage: 'https://www.fplmaps.com/', phone: '1-800-468-8243', note: 'Includes the former Gulf Power area in Northwest Florida.', aliases: ['FLORIDA POWER & LIGHT', 'FLORIDA POWER AND LIGHT', 'GULF POWER', 'FPL'] },
  { id: 'duke-energy', type: 'electric', name: 'Duke Energy', states: ['FL', 'NC', 'SC'], site: 'https://www.duke-energy.com', outage: 'https://outagemap.duke-energy.com/', phoneByState: { FL: '1-800-228-8485', NC: '1-800-769-3766', SC: '1-800-769-3766' }, text: 'Text OUT to 57801', aliases: ['DUKE ENERGY'] },
  { id: 'teco', type: 'electric', name: 'Tampa Electric (TECO)', states: ['FL'], site: 'https://www.tampaelectric.com', phone: '1-877-588-1010', aliases: ['TAMPA ELECTRIC'] },
  { id: 'jea', type: 'electric', name: 'JEA', states: ['FL'], site: 'https://www.jea.com', phone: '904-665-6000', aliases: ['JEA', 'JACKSONVILLE ELECTRIC'] },
  { id: 'ouc', type: 'electric', name: 'OUC (Orlando Utilities Commission)', states: ['FL'], site: 'https://www.ouc.com', phone: '407-423-9018', aliases: ['ORLANDO UTILITIES', 'OUC'] },
  { id: 'lakeland', type: 'electric', name: 'Lakeland Electric', states: ['FL'], site: 'https://www.lakelandelectric.com', aliases: ['LAKELAND'] },
  { id: 'gru', type: 'electric', name: 'Gainesville Regional Utilities', states: ['FL'], site: 'https://www.gru.com', aliases: ['GAINESVILLE REGIONAL', 'CITY OF GAINESVILLE'] },
  { id: 'tallahassee', type: 'electric', name: 'City of Tallahassee Utilities', states: ['FL'], site: 'https://www.talgov.com', aliases: ['CITY OF TALLAHASSEE'] },
  { id: 'keys-energy', type: 'electric', name: 'Keys Energy Services', states: ['FL'], site: 'https://www.keysenergy.com', aliases: ['KEYS ENERGY', 'UTILITY BOARD OF THE CITY OF KEY WEST'] },
  { id: 'fkec', type: 'electric', name: 'Florida Keys Electric Co-op', states: ['FL'], site: 'https://www.fkec.com', aliases: ['FLORIDA KEYS ELECTRIC'] },
  { id: 'chelco', type: 'electric', name: 'CHELCO', states: ['FL'], site: 'https://www.chelco.com', aliases: ['CHOCTAWHATCHEE', 'CHELCO'] },
  { id: 'gcec', type: 'electric', name: 'Gulf Coast Electric Co-op', states: ['FL'], site: 'https://www.gcec.com', aliases: ['GULF COAST ELECTRIC'] },
  { id: 'erec', type: 'electric', name: 'Escambia River Electric Co-op', states: ['FL'], site: 'https://www.erec.com', aliases: ['ESCAMBIA RIVER'] },
  { id: 'talquin', type: 'electric', name: 'Talquin Electric Co-op', states: ['FL'], site: 'https://www.talquinelectric.com', aliases: ['TALQUIN'] },
  { id: 'wrec', type: 'electric', name: 'Withlacoochee River Electric Co-op', states: ['FL'], site: 'https://www.wrec.net', aliases: ['WITHLACOOCHEE'] },
  { id: 'seco', type: 'electric', name: 'SECO Energy', states: ['FL'], site: 'https://www.secoenergy.com', aliases: ['SUMTER ELECTRIC', 'SECO'] },
  { id: 'clay-electric', type: 'electric', name: 'Clay Electric Co-op', states: ['FL'], site: 'https://www.clayelectric.com', aliases: ['CLAY ELECTRIC'] },
  { id: 'lcec', type: 'electric', name: 'LCEC (Lee County Electric Co-op)', states: ['FL'], site: 'https://www.lcec.net', aliases: ['LEE COUNTY ELECTRIC', 'LCEC'] },

  // ---------------- Electric: Georgia / Carolinas / Mid-Atlantic ----------------
  { id: 'georgia-power', type: 'electric', name: 'Georgia Power', states: ['GA'], site: 'https://www.georgiapower.com', outage: 'https://outagemap.georgiapower.com/', phone: '1-888-891-0938', aliases: ['GEORGIA POWER'] },
  { id: 'georgia-emc', type: 'electric', name: 'Georgia EMC (electric co-op)', states: ['GA'], site: 'https://georgiaemc.com', note: 'Georgia EMC lists every member co-op and its outage line.' },
  { id: 'dominion', type: 'electric', name: 'Dominion Energy', states: ['VA', 'NC', 'SC'], site: 'https://www.dominionenergy.com', outage: 'https://outagemap.dominionenergy.com/', phoneByState: { VA: '1-866-366-4357', NC: '1-866-366-4357' }, aliases: ['VIRGINIA ELECTRIC', 'DOMINION', 'SOUTH CAROLINA ELECTRIC & GAS', 'SOUTH CAROLINA ELECTRIC AND GAS'] },
  { id: 'santee-cooper', type: 'electric', name: 'Santee Cooper', states: ['SC'], site: 'https://www.santeecooper.com', aliases: ['SOUTH CAROLINA PUBLIC SERVICE', 'SANTEE COOPER'] },
  { id: 'berkeley-ec', type: 'electric', name: 'Berkeley Electric Co-op', states: ['SC'], site: 'https://www.becsc.com', aliases: ['BERKELEY ELECTRIC'] },
  { id: 'sc-coops', type: 'electric', name: 'Other South Carolina electric co-op', states: ['SC'], site: 'https://www.ecsc.org' },
  { id: 'brunswick-emc', type: 'electric', name: 'Brunswick Electric (BEMC)', states: ['NC'], site: 'https://www.bemc.org', aliases: ['BRUNSWICK ELECTRIC'] },
  { id: 'chec', type: 'electric', name: 'Cape Hatteras Electric Co-op', states: ['NC'], site: 'https://www.chec.coop', aliases: ['CAPE HATTERAS'] },
  { id: 'nc-coops', type: 'electric', name: 'Other North Carolina electric co-op', states: ['NC'], site: 'https://www.ncelectriccooperatives.com' },
  { id: 'electricities', type: 'electric', name: 'NC public power city (ElectriCities)', states: ['NC'], site: 'https://www.electricities.com' },
  { id: 'bge', type: 'electric', name: 'BGE', states: ['MD'], site: 'https://www.bge.com', phone: '1-877-778-2222', aliases: ['BALTIMORE GAS'] },
  { id: 'pepco', type: 'electric', name: 'Pepco', states: ['MD', 'DC'], site: 'https://www.pepco.com', phone: '1-877-737-2662', aliases: ['POTOMAC ELECTRIC', 'PEPCO'] },
  { id: 'delmarva', type: 'electric', name: 'Delmarva Power', states: ['MD', 'DE'], site: 'https://www.delmarva.com', phone: '1-800-898-8042', aliases: ['DELMARVA'] },
  { id: 'smeco', type: 'electric', name: 'SMECO', states: ['MD'], site: 'https://www.smeco.coop', aliases: ['SOUTHERN MARYLAND ELECTRIC'] },
  { id: 'delaware-coop', type: 'electric', name: 'Delaware Electric Co-op', states: ['DE'], site: 'https://www.delaware.coop', aliases: ['DELAWARE ELECTRIC COOP'] },
  { id: 'firstenergy', type: 'electric', name: 'FirstEnergy (JCP&L, Potomac Edison, Met-Ed…)', states: ['NJ', 'MD', 'PA', 'OH', 'WV'], site: 'https://www.firstenergycorp.com', phone: '1-888-544-4877', aliases: ['JERSEY CENTRAL', 'POTOMAC EDISON', 'METROPOLITAN EDISON', 'PENNSYLVANIA ELECTRIC', 'OHIO EDISON', 'MONONGAHELA'] },
  { id: 'pseg', type: 'electric', name: 'PSE&G', states: ['NJ'], site: 'https://nj.pseg.com', phone: '1-800-436-7734', aliases: ['PUBLIC SERVICE ELECTRIC'] },
  { id: 'ace', type: 'electric', name: 'Atlantic City Electric', states: ['NJ'], site: 'https://www.atlanticcityelectric.com', phone: '1-800-833-7476', aliases: ['ATLANTIC CITY ELECTRIC'] },

  // ---------------- Electric: New York / New England ----------------
  { id: 'coned', type: 'electric', name: 'Con Edison', states: ['NY'], site: 'https://www.coned.com', phone: '1-800-752-6633', aliases: ['CONSOLIDATED EDISON'] },
  { id: 'pseg-li', type: 'electric', name: 'PSEG Long Island', states: ['NY'], site: 'https://www.psegliny.com', phone: '1-800-490-0075', aliases: ['LONG ISLAND POWER', 'PSEG LONG ISLAND'] },
  { id: 'national-grid', type: 'electric', name: 'National Grid', states: ['NY', 'MA'], site: 'https://www.nationalgridus.com', phoneByState: { NY: '1-800-867-5222', MA: '1-800-465-1212' }, aliases: ['NIAGARA MOHAWK', 'MASSACHUSETTS ELECTRIC', 'NANTUCKET ELECTRIC', 'NATIONAL GRID'] },
  { id: 'nyseg', type: 'electric', name: 'NYSEG', states: ['NY'], site: 'https://www.nyseg.com', phone: '1-800-572-1121', aliases: ['NEW YORK STATE ELEC'] },
  { id: 'eversource', type: 'electric', name: 'Eversource', states: ['CT', 'MA', 'NH'], site: 'https://www.eversource.com', phoneByState: { CT: '1-800-286-2000', MA: '1-800-592-2000' }, aliases: ['CONNECTICUT LIGHT', 'NSTAR', 'PUBLIC SERVICE CO OF NH', 'EVERSOURCE'] },
  { id: 'ui', type: 'electric', name: 'United Illuminating', states: ['CT'], site: 'https://www.uinet.com', phone: '1-800-722-5584', aliases: ['UNITED ILLUMINATING'] },
  { id: 'ri-energy', type: 'electric', name: 'Rhode Island Energy', states: ['RI'], site: 'https://www.rienergy.com', aliases: ['NARRAGANSETT ELECTRIC', 'RHODE ISLAND ENERGY'] },
  { id: 'cmp', type: 'electric', name: 'Central Maine Power', states: ['ME'], site: 'https://www.cmpco.com', phone: '1-800-696-1000', aliases: ['CENTRAL MAINE POWER'] },
  { id: 'versant', type: 'electric', name: 'Versant Power', states: ['ME'], site: 'https://www.versantpower.com', aliases: ['VERSANT', 'EMERA MAINE'] },

  // ---------------- Electric: territories / Pacific ----------------
  { id: 'luma', type: 'electric', name: 'LUMA Energy', states: ['PR'], site: 'https://lumapr.com', phone: '1-844-888-5862', aliases: ['LUMA', 'PUERTO RICO ELECTRIC', 'PREPA'] },
  { id: 'wapa', type: 'electric', name: 'WAPA (Water & Power Authority)', states: ['VI'], site: 'https://www.viwapa.vi', aliases: ['VIRGIN ISLANDS WATER'] },
  { id: 'gpa', type: 'electric', name: 'Guam Power Authority', states: ['GU'], site: 'https://guampowerauthority.com', aliases: ['GUAM POWER'] },
  { id: 'heco', type: 'electric', name: 'Hawaiian Electric', states: ['HI'], site: 'https://www.hawaiianelectric.com', aliases: ['HAWAIIAN ELECTRIC', 'MAUI ELECTRIC', 'HAWAII ELECTRIC LIGHT'] },
  { id: 'kiuc', type: 'electric', name: 'KIUC (Kauaʻi Island Utility Co-op)', states: ['HI'], site: 'https://www.kiuc.coop', aliases: ['KAUAI ISLAND'] },

  // ---------------- Water ----------------
  { id: 'saws', type: 'water', name: 'SAWS (San Antonio Water System)', states: ['TX'], site: 'https://www.saws.org', phone: '210-704-7297', aliases: ['SAN ANTONIO WATER SYSTEM', 'SAWS'] },
  { id: 'houston-water', type: 'water', name: 'Houston Public Works (City of Houston water)', states: ['TX'], site: 'https://www.houstonpublicworks.org', phone: '311 or 713-837-0311', aliases: ['CITY OF HOUSTON'] },
  { id: 'austin-water', type: 'water', name: 'Austin Water', states: ['TX'], site: 'https://www.austintexas.gov/department/water', phone: '512-972-1000', aliases: ['CITY OF AUSTIN'] },
  { id: 'jea-water', type: 'water', name: 'JEA (water)', states: ['FL'], site: 'https://www.jea.com', phone: '904-665-6000', aliases: ['JEA'] },
  { id: 'miami-dade-water', type: 'water', name: 'Miami-Dade Water and Sewer', states: ['FL'], site: 'https://www.miamidade.gov/water', aliases: ['MIAMI DADE', 'MIAMI-DADE'] },
  { id: 'tampa-water', type: 'water', name: 'City of Tampa Water', states: ['FL'], site: 'https://www.tampa.gov/water', aliases: ['CITY OF TAMPA'] },
  { id: 'ouc-water', type: 'water', name: 'OUC (water)', states: ['FL'], site: 'https://www.ouc.com', phone: '407-423-9018', aliases: ['ORLANDO UTILITIES'] },
  { id: 'ecua', type: 'water', name: 'ECUA (Emerald Coast Utilities Authority)', states: ['FL'], site: 'https://www.ecua.fl.gov', aliases: ['EMERALD COAST UTILITIES', 'ECUA'] },
  { id: 'swbno', type: 'water', name: 'Sewerage & Water Board of New Orleans', states: ['LA'], site: 'https://www.swbno.org', phone: '504-529-2837', aliases: ['NEW ORLEANS'] },
  { id: 'mawss', type: 'water', name: 'MAWSS (Mobile Area Water & Sewer)', states: ['AL'], site: 'https://www.mawss.com', aliases: ['MOBILE AREA WATER', 'MAWSS'] },
  { id: 'charleston-water', type: 'water', name: 'Charleston Water System', states: ['SC'], site: 'https://www.charlestonwater.com', aliases: ['CHARLESTON WATER', 'CHARLESTON CPW'] },
  { id: 'cfpua', type: 'water', name: 'Cape Fear Public Utility Authority', states: ['NC'], site: 'https://www.cfpua.org', aliases: ['CAPE FEAR PUBLIC'] },
  { id: 'prasa', type: 'water', name: 'AAA / PRASA (Acueductos)', states: ['PR'], site: 'https://www.acueductospr.com', aliases: ['PRASA', 'ACUEDUCTOS'] },
  { id: 'well', type: 'water', name: 'Private well', states: '*', note: 'If a well was flooded, do not drink the water until it is disinfected and tested. Your county health department can test it.' },

  // ---------------- Internet ----------------
  { id: 'xfinity', type: 'internet', name: 'Xfinity (Comcast)', states: '*', site: 'https://www.xfinity.com', outage: 'https://www.xfinity.com/support/status', phone: '1-800-934-6489', downdetector: DD('comcast-xfinity') },
  { id: 'spectrum', type: 'internet', name: 'Spectrum', states: '*', site: 'https://www.spectrum.net/support', downdetector: DD('spectrum') },
  { id: 'att-internet', type: 'internet', name: 'AT&T Internet / Fiber', states: '*', site: 'https://www.att.com/support/', outage: 'https://www.att.com/outages/', phone: '1-800-288-2020', downdetector: DD('att') },
  { id: 'verizon-fios', type: 'internet', name: 'Verizon Fios / Home Internet', states: '*', site: 'https://www.verizon.com/support/', phone: '1-800-837-4966', downdetector: DD('verizon') },
  { id: 'tmobile-home', type: 'internet', name: 'T-Mobile Home Internet', states: '*', site: 'https://www.t-mobile.com/support', outage: 'https://www.t-mobile.com/coverage/network-status', phone: '1-800-937-8997', downdetector: DD('t-mobile') },
  { id: 'cox', type: 'internet', name: 'Cox', states: '*', site: 'https://www.cox.com', phone: '1-800-234-3993', downdetector: DD('cox') },
  { id: 'frontier', type: 'internet', name: 'Frontier', states: '*', site: 'https://frontier.com', phone: '1-800-921-8101' },
  { id: 'centurylink', type: 'internet', name: 'CenturyLink / Quantum Fiber', states: '*', site: 'https://www.centurylink.com', downdetector: DD('centurylink') },
  { id: 'brightspeed', type: 'internet', name: 'Brightspeed', states: '*', site: 'https://www.brightspeed.com' },
  { id: 'optimum', type: 'internet', name: 'Optimum (incl. former Suddenlink)', states: '*', site: 'https://www.optimum.com' },
  { id: 'windstream', type: 'internet', name: 'Kinetic by Windstream', states: '*', site: 'https://www.windstream.com' },
  { id: 'mediacom', type: 'internet', name: 'Mediacom', states: '*', site: 'https://mediacomcable.com' },
  { id: 'sparklight', type: 'internet', name: 'Sparklight', states: '*', site: 'https://www.sparklight.com' },
  { id: 'wow', type: 'internet', name: 'WOW!', states: '*', site: 'https://www.wowway.com' },
  { id: 'breezeline', type: 'internet', name: 'Breezeline', states: '*', site: 'https://www.breezeline.com' },
  { id: 'astound', type: 'internet', name: 'Astound (Grande, RCN, Wave)', states: '*', site: 'https://www.astound.com' },
  { id: 'google-fiber', type: 'internet', name: 'Google Fiber', states: '*', site: 'https://fiber.google.com' },
  { id: 'metronet', type: 'internet', name: 'Metronet', states: '*', site: 'https://www.metronet.com' },
  { id: 'hotwire', type: 'internet', name: 'Hotwire Communications', states: ['FL', 'GA', 'SC', 'NC'], site: 'https://www.hotwirecommunications.com' },
  { id: 'starlink', type: 'internet', name: 'Starlink', states: '*', site: 'https://www.starlink.com/support', downdetector: DD('starlink'), note: 'Satellite service keeps working when local lines are down, as long as the dish has power and a clear view of the sky.' },
  { id: 'hughesnet', type: 'internet', name: 'HughesNet', states: '*', site: 'https://www.hughesnet.com' },
  { id: 'viasat', type: 'internet', name: 'Viasat', states: '*', site: 'https://www.viasat.com' },
  { id: 'liberty-pr', type: 'internet', name: 'Liberty', states: ['PR', 'VI'], site: 'https://libertypr.com' },
  { id: 'claro-pr', type: 'internet', name: 'Claro', states: ['PR'], site: 'https://www.claropr.com' },
  { id: 'hawaiian-tel', type: 'internet', name: 'Hawaiian Telcom', states: ['HI'], site: 'https://www.hawaiiantel.com' },
  { id: 'gta', type: 'internet', name: 'GTA', states: ['GU'], site: 'https://www.gta.net' },
  { id: 'docomo', type: 'internet', name: 'Docomo Pacific', states: ['GU'], site: 'https://www.docomopacific.com' },

  // ---------------- Cell ----------------
  { id: 'att', type: 'cell', name: 'AT&T Wireless', states: '*', site: 'https://www.att.com/support/', outage: 'https://www.att.com/outages/', phone: '611 or 1-800-331-0500', downdetector: DD('att') },
  { id: 'verizon', type: 'cell', name: 'Verizon Wireless', states: '*', site: 'https://www.verizon.com/support/', phone: '611 or 1-800-922-0204', downdetector: DD('verizon') },
  { id: 'tmobile', type: 'cell', name: 'T-Mobile', states: '*', site: 'https://www.t-mobile.com/support', outage: 'https://www.t-mobile.com/coverage/network-status', phone: '611 or 1-800-937-8997', downdetector: DD('t-mobile') },
  { id: 'cricket', type: 'cell', name: 'Cricket Wireless', states: '*', site: 'https://www.cricketwireless.com', network: 'AT&T' },
  { id: 'metro', type: 'cell', name: 'Metro by T-Mobile', states: '*', site: 'https://www.metrobyt-mobile.com', network: 'T-Mobile' },
  { id: 'visible', type: 'cell', name: 'Visible', states: '*', site: 'https://www.visible.com', network: 'Verizon' },
  { id: 'straight-talk', type: 'cell', name: 'Straight Talk / Total / Tracfone', states: '*', site: 'https://www.straighttalk.com', network: 'Verizon, AT&T or T-Mobile (check your SIM)' },
  { id: 'boost', type: 'cell', name: 'Boost Mobile', states: '*', site: 'https://www.boostmobile.com', network: 'Boost and AT&T/T-Mobile roaming' },
  { id: 'mint', type: 'cell', name: 'Mint Mobile', states: '*', site: 'https://www.mintmobile.com', network: 'T-Mobile' },
  { id: 'xfinity-mobile', type: 'cell', name: 'Xfinity Mobile', states: '*', site: 'https://www.xfinity.com/mobile', network: 'Verizon' },
  { id: 'spectrum-mobile', type: 'cell', name: 'Spectrum Mobile', states: '*', site: 'https://www.spectrum.com/mobile', network: 'Verizon' },
];

// Well-known service areas, used to suggest providers before (or without) the map lookup.
// Keyed by 5-digit county FIPS. Only lists utilities that serve a large share of the county.
export const COUNTY_HINTS = {
  48029: { electric: ['cps-energy', 'gvec', 'pec'], water: ['saws'] }, // Bexar, TX
  48201: { electric: ['centerpoint', 'entergy'], water: ['houston-water'] }, // Harris, TX
  48157: { electric: ['centerpoint'] }, // Fort Bend, TX
  48039: { electric: ['centerpoint', 'tnmp'] }, // Brazoria, TX
  48167: { electric: ['centerpoint', 'tnmp'] }, // Galveston, TX
  48339: { electric: ['entergy', 'centerpoint'] }, // Montgomery, TX
  48245: { electric: ['entergy'] }, // Jefferson, TX
  48355: { electric: ['aep-texas'] }, // Nueces, TX
  48061: { electric: ['aep-texas'] }, // Cameron, TX
  48215: { electric: ['aep-texas'] }, // Hidalgo, TX
  48453: { electric: ['austin-energy', 'pec', 'bluebonnet'], water: ['austin-water'] }, // Travis, TX
  48091: { electric: ['nbu', 'gvec', 'pec'] }, // Comal, TX
  48187: { electric: ['gvec'] }, // Guadalupe, TX
  48041: { electric: ['btu'] }, // Brazos, TX
  22071: { electric: ['entergy'], water: ['swbno'] }, // Orleans, LA
  22051: { electric: ['entergy'] }, // Jefferson, LA
  22033: { electric: ['entergy', 'demco'] }, // East Baton Rouge, LA
  22055: { electric: ['slemco', 'cleco'] }, // Lafayette, LA
  22019: { electric: ['entergy'] }, // Calcasieu, LA
  28047: { electric: ['mississippi-power', 'coast-epa'] }, // Harrison, MS
  28059: { electric: ['mississippi-power', 'singing-river'] }, // Jackson, MS
  28045: { electric: ['coast-epa', 'mississippi-power'] }, // Hancock, MS
  '01097': { electric: ['alabama-power'], water: ['mawss'] }, // Mobile, AL
  '01003': { electric: ['alabama-power', 'baldwin-emc', 'riviera'] }, // Baldwin, AL
  12033: { electric: ['fpl', 'erec'], water: ['ecua'] }, // Escambia, FL
  12113: { electric: ['fpl', 'erec'] }, // Santa Rosa, FL
  12091: { electric: ['fpl', 'chelco'] }, // Okaloosa, FL
  12131: { electric: ['chelco', 'gcec', 'fpl'] }, // Walton, FL
  12005: { electric: ['fpl', 'gcec'] }, // Bay, FL
  12086: { electric: ['fpl'], water: ['miami-dade-water'] }, // Miami-Dade, FL
  12011: { electric: ['fpl'] }, // Broward, FL
  12099: { electric: ['fpl'] }, // Palm Beach, FL
  12057: { electric: ['teco'], water: ['tampa-water'] }, // Hillsborough, FL
  12103: { electric: ['duke-energy'] }, // Pinellas, FL
  12095: { electric: ['duke-energy', 'ouc'], water: ['ouc-water'] }, // Orange, FL
  12031: { electric: ['jea'], water: ['jea-water'] }, // Duval, FL
  12073: { electric: ['tallahassee', 'talquin'] }, // Leon, FL
  12071: { electric: ['fpl', 'lcec'] }, // Lee, FL
  12087: { electric: ['keys-energy', 'fkec'] }, // Monroe, FL
  12001: { electric: ['gru', 'clay-electric', 'duke-energy'] }, // Alachua, FL
  12105: { electric: ['teco', 'duke-energy', 'lakeland'] }, // Polk, FL
  13051: { electric: ['georgia-power'] }, // Chatham, GA
  13121: { electric: ['georgia-power'] }, // Fulton, GA
  45019: { electric: ['dominion', 'berkeley-ec', 'santee-cooper'], water: ['charleston-water'] }, // Charleston, SC
  45051: { electric: ['santee-cooper', 'duke-energy'] }, // Horry, SC
  37129: { electric: ['duke-energy'], water: ['cfpua'] }, // New Hanover, NC
  37019: { electric: ['duke-energy', 'brunswick-emc'] }, // Brunswick, NC
  37055: { electric: ['dominion', 'chec'] }, // Dare, NC
  51810: { electric: ['dominion'] }, // Virginia Beach, VA
  51710: { electric: ['dominion'] }, // Norfolk, VA
};

export const STATE_DEFAULTS = {
  PR: { electric: ['luma'], water: ['prasa'] },
  VI: { electric: ['wapa'] },
  GU: { electric: ['gpa'] },
};

export const TYPE_LABELS = {
  electric: 'Electric',
  water: 'Water',
  internet: 'Internet',
  cell: 'Cell phone',
};

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}

export function providerPhone(p, state) {
  if (!p) return '';
  return (p.phoneByState && p.phoneByState[state]) || p.phone || '';
}

export function providersFor(type, state) {
  const all = PROVIDERS.filter((p) => p.type === type);
  const local = all.filter((p) => Array.isArray(p.states) && p.states.includes(state));
  const national = all.filter((p) => p.states === '*');
  const otherIds = new Set([...local, ...national].map((p) => p.id));
  const rest = all.filter((p) => !otherIds.has(p.id));
  return { local, national, rest };
}

export function suggestionsFor(place) {
  if (!place) return {};
  const hint = COUNTY_HINTS[place.fips] || COUNTY_HINTS[Number(place.fips)] || {};
  const st = STATE_DEFAULTS[place.state] || {};
  return { electric: hint.electric || st.electric || [], water: hint.water || st.water || [] };
}

function normalize(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9& -]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Match a name from a territory map ("CITY OF SAN ANTONIO - (TX)") to a directory entry.
// Aliases must appear as whole words; the longest matching alias wins.
export function matchProvider(type, name, state) {
  const n = ' ' + normalize(name) + ' ';
  let best = null;
  for (const p of PROVIDERS) {
    if (p.type !== type || !p.aliases) continue;
    if (Array.isArray(p.states) && state && !p.states.includes(state)) continue;
    for (const a of p.aliases) {
      const na = normalize(a);
      if (na && n.includes(' ' + na + ' ') && (!best || na.length > best.len)) best = { p, len: na.length };
    }
  }
  return best ? best.p : null;
}

// ---------------- Automatic finder (map lookups) ----------------
// Public ArcGIS layers of utility service areas. Several mirrors are tried because
// these services move around; whichever answers first wins.
const ELECTRIC_LAYERS = [
  'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Retail_Service_Territories/FeatureServer/0',
  'https://services6.arcgis.com/tboeqGwETr5ppr5Q/arcgis/rest/services/Electric_Retail_Service_Territories/FeatureServer/0',
  'https://eedgis.pnnl.gov/arcgis/rest/services/Hosted/Electric_Service_Territories/FeatureServer/0',
];
const WATER_SERVICE =
  'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Water_System_Boundaries/FeatureServer';

function pick(attrs, patterns) {
  const keys = Object.keys(attrs || {});
  for (const re of patterns) {
    const k = keys.find((key) => re.test(key));
    if (k && attrs[k] != null && String(attrs[k]).trim() && String(attrs[k]).trim() !== 'NOT AVAILABLE') {
      return String(attrs[k]).trim();
    }
  }
  return '';
}

async function pointQuery(layerUrl, lat, lon) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });
  const res = await fetchWithTimeout(`${layerUrl}/query?${params}`, { timeout: 10000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'query failed');
  return (json.features || []).map((f) => f.attributes || {});
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Of|And|The)\b/g, (m) => m.toLowerCase())
    .replace(/\b(Llc|Emc|Pud|Wsc|Mud|Sud)\b/g, (m) => m.toUpperCase());
}

export async function findElectric(lat, lon, state) {
  let lastErr;
  for (const layer of ELECTRIC_LAYERS) {
    try {
      const rows = await pointQuery(layer, lat, lon);
      return rows.map((a) => {
        const rawName = pick(a, [/^NAME$/i, /UTILITY_?NAME/i, /^UTILITY$/i, /NAME/i]);
        const name = rawName.replace(/\s*-\s*\([A-Z]{2}\)\s*$/, '');
        const match = matchProvider('electric', rawName, state);
        return {
          name: titleCase(name),
          phone: pick(a, [/TELEPHONE/i, /PHONE/i]),
          website: pick(a, [/WEBSITE/i, /^URL$/i, /WEB/i]),
          kind: pick(a, [/^TYPE$/i, /OWNERSHIP/i]),
          customers: pick(a, [/CUSTOMERS/i]),
          match,
        };
      }).filter((r) => r.name);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('No electric service map available');
}

let waterLayerId;
export async function findWater(lat, lon, state) {
  if (waterLayerId == null) {
    const res = await fetchWithTimeout(`${WATER_SERVICE}?f=json`, { timeout: 10000 });
    const info = await res.json();
    const layer = (info.layers || []).find((l) => !l.geometryType || /Polygon/i.test(l.geometryType)) || (info.layers || [])[0];
    if (!layer) throw new Error('Water service map unavailable');
    waterLayerId = layer.id;
  }
  const rows = await pointQuery(`${WATER_SERVICE}/${waterLayerId}`, lat, lon);
  return rows.map((a) => {
    const name = pick(a, [/PWS_?NAME/i, /SYSTEM_?NAME/i, /^NAME$/i, /NAME/i]);
    return {
      name: titleCase(name),
      pwsid: pick(a, [/^PWSID$/i, /PWS_?ID/i]),
      population: pick(a, [/POPULATION/i]),
      match: matchProvider('water', name, state),
    };
  }).filter((r) => r.name);
}

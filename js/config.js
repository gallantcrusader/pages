// Site-wide settings. Edit this file to change the featured event banner or the
// GitHub repo that holds community reports.

export const CONFIG = {
  appName: 'StormCheck',

  // Community reports are GitHub Issues in this repo (see .github/ISSUE_TEMPLATE).
  // When the site runs on <owner>.github.io/<repo>/ this is detected automatically.
  repo: { owner: 'gallantcrusader', name: 'pages' },

  // How often live feeds refresh while the page is open.
  refreshMinutes: 5,

  // How far (miles) to look for storm reports and river gauges.
  nearbyMiles: 60,

  // Banner for an ongoing event. Shown until `expires` to people in `states`
  // (or to everyone who hasn't entered a ZIP yet). Set to null to hide.
  featuredEvent: {
    id: 'isaias-2026',
    title: 'Hurricane Isaias recovery',
    body:
      'Isaias hit near Destin, FL on Oct. 9 as a Category 2 and knocked out power across ' +
      'the Panhandle, Alabama and Georgia. Enter your ZIP for local outages and help.',
    states: ['FL', 'AL', 'GA', 'MS'],
    expires: '2026-11-15',
  },
};

// Detect owner/repo when hosted on GitHub Pages so forks work without edits.
(() => {
  const m = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
  if (!m) return;
  const repo = location.pathname.split('/').filter(Boolean)[0];
  CONFIG.repo = { owner: m[1], name: repo || `${m[1]}.github.io` };
})();

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  pwa: 80
};

const AUDIT_URLS = [
  'http://localhost:3000',
  'http://localhost:3000/events',
  'http://localhost:3000/booking',
  'http://localhost:3000/admin'
];

async function runLighthouseAudit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { 
    logLevel: 'info', 
    output: 'html', 
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port 
  };

  const runnerResult = await lighthouse(url, options);
  const reportHtml = runnerResult.report;
  const { categories } = runnerResult.lhr;

  await chrome.kill();

  return { 
    url, 
    scores: Object.fromEntries(
      Object.entries(categories).map(([key, cat]) => [key, cat.score * 100])
    ),
    reportHtml 
  };
}

async function performanceAudit() {
  const auditResults = [];
  const reportDir = path.join(__dirname, 'performance-reports');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  for (const url of AUDIT_URLS) {
    console.log(`Auditing: ${url}`);
    const result = await runLighthouseAudit(url);
    auditResults.push(result);

    // Save HTML report
    const reportPath = path.join(reportDir, `${new URL(url).pathname.replace(/\//g, '_') || 'home'}_report.html`);
    fs.writeFileSync(reportPath, result.reportHtml);

    // Validate against thresholds
    for (const [category, threshold] of Object.entries(PERFORMANCE_THRESHOLDS)) {
      if (result.scores[category] < threshold) {
        console.error(`${url} failed ${category} threshold: ${result.scores[category]} < ${threshold}`);
      }
    }
  }

  // Generate summary report
  const summaryReport = {
    date: new Date().toISOString(),
    results: auditResults.map(result => ({
      url: result.url,
      scores: result.scores
    }))
  };

  fs.writeFileSync(
    path.join(reportDir, 'performance_summary.json'), 
    JSON.stringify(summaryReport, null, 2)
  );

  console.log('Performance audit complete. Reports generated in performance-reports/');
}

performanceAudit().catch(console.error);
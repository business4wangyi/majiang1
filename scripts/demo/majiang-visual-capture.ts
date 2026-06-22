import * as fs from 'fs';
import * as path from 'path';

// Read HTML, CSS, and JS for structural validation
const htmlPath = path.join(__dirname, '../../src/majiang/web/public/index.html');
const cssPath = path.join(__dirname, '../../src/majiang/web/public/styles.css');
const jsPath = path.join(__dirname, '../../src/majiang/web/public/app.js');
const html = fs.readFileSync(htmlPath, 'utf-8');
const css = fs.readFileSync(cssPath, 'utf-8');
const js = fs.readFileSync(jsPath, 'utf-8');

const checks = [
  { name: 'table-stage', source: html, pattern: /class="table-stage"/ },
  { name: 'table-stage-frame', source: html, pattern: /class="table-stage-frame"/ },
  { name: 'table-felt', source: html, pattern: /class="table-felt"/ },
  { name: 'center-plate', source: html, pattern: /class="center-plate"/ },
  { name: 'center-wind', source: html, pattern: /id="center-wind"/ },
  { name: 'center-round', source: html, pattern: /id="center-round"/ },
  { name: 'seat-avatar-css', source: css, pattern: /\.seat-avatar/ },
  { name: 'table-felt-bg', source: css, pattern: /table-felt\.jpg/ },
  { name: 'center-plate-bg', source: css, pattern: /center-plate\.jpg/ },
  { name: 'avatar-east', source: js, pattern: /avatar-east\.jpg/ },
  { name: 'avatar-south', source: js, pattern: /avatar-south\.jpg/ },
  { name: 'avatar-west', source: js, pattern: /avatar-west\.jpg/ },
  { name: 'avatar-north', source: js, pattern: /avatar-north\.jpg/ },
  { name: 'tile-wan', source: js, pattern: /tile-wan\.jpg/ },
  { name: 'tile-tong', source: js, pattern: /tile-tong\.jpg/ },
  { name: 'tile-tiao', source: js, pattern: /tile-tiao\.jpg/ },
  { name: 'tile-zhong', source: js, pattern: /tile-zhong\.jpg/ },
  { name: 'tile-back', source: css, pattern: /tile-back\.jpg/ },
  { name: 'tile-real-style', source: css, pattern: /background-size: cover/ },
  { name: 'tile-label', source: css, pattern: /\.tile-label/ },
  { name: 'player-seat-style', source: css, pattern: /\.player-seat/ },
];

const results = checks.map(c => ({
  name: c.name,
  found: c.pattern.test(c.source)
}));

const allFound = results.every(r => r.found);

console.log(JSON.stringify({
  ok: allFound,
  checks: results
}, null, 2));

process.exit(allFound ? 0 : 1);

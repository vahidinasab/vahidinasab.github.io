// Draws the link-preview picture for each job page: jobs/img/<job>.jpg, 1200 x 630.
//
//   node _build/build-previews.mjs         (run from the sustainable-skills folder)
//
// The job name, what the job does and the pay come from JOBS in index.html, word for word.
// It needs Playwright with Chromium on your computer (npm install playwright); the site itself does not.
// Run build-pages.mjs afterwards so each job page points at its picture.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => pathToFileURL(path.join(ROOT, p)).href;

const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sandbox = { window: { localStorage: { getItem: () => null } }, location: { search: '' } };
vm.createContext(sandbox);
vm.runInContext(index.slice(index.indexOf('  var CONFIG = {'), index.indexOf('  var SUBJ = {};')) + '\nthis.DATA = { JOBS: JOBS, ROLES: ROLES };', sandbox);
const { JOBS, ROLES } = sandbox.DATA;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '£' + n.toLocaleString('en-GB');
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const html = (j) => `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>
@font-face{font-family:"Archivo";font-weight:800;src:url(${file('fonts/archivo-latin-800-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:400;src:url(${file('fonts/ibm-plex-sans-latin-400-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:600;src:url(${file('fonts/ibm-plex-sans-latin-600-normal.woff2')}) format("woff2")}
@font-face{font-family:"IBM Plex Sans";font-weight:700;src:url(${file('fonts/ibm-plex-sans-latin-700-normal.woff2')}) format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;display:grid;grid-template-columns:690px 510px;background:linear-gradient(155deg,#032A3B 0%,#05374B 55%,#0A4A5B 100%);color:#FFFFFF;font-family:"IBM Plex Sans",Arial,sans-serif;overflow:hidden}
.text{padding:52px 44px 44px 60px;display:flex;flex-direction:column;gap:20px}
.top{display:flex;align-items:center;gap:18px}
.top img{height:58px;width:auto}
.rule{width:1px;height:42px;background:rgba(255,255,255,.4)}
.tool{font-family:"Archivo",Arial,sans-serif;font-weight:800;font-size:21px;line-height:1.15}
.eyebrow{margin-top:14px;display:flex;align-items:center;gap:12px;font-size:21px;font-weight:700;color:#86E6CC}
.eyebrow::before{content:"";width:30px;height:4px;border-radius:2px;background:#2EB895}
h1{font-family:"Archivo",Arial,sans-serif;font-weight:800;font-size:${j.name.length > 34 ? 46 : j.name.length > 24 ? 54 : 66}px;line-height:1.04;letter-spacing:-.02em}
.what{font-size:22px;line-height:1.4;color:#E2EAF0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pay{margin-top:auto;font-size:23px;color:#DCE5EB}
.pay b{display:block;font-family:"Archivo",Arial,sans-serif;font-weight:800;font-size:40px;color:#FFFFFF;letter-spacing:-.01em}
.pic{position:relative;margin:44px 44px 44px 0;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:48% 50%}
.tags{position:absolute;left:16px;right:16px;bottom:16px;display:flex;flex-wrap:wrap;gap:8px}
.tag{padding:7px 15px;border-radius:999px;background:#FFFFFF;color:#032A3B;font-size:19px;font-weight:700}
</style></head><body>
<div class="text">
  <div class="top"><img src="${file('assets/uos-logo-white.png')}" alt=""><span class="rule"></span><span class="tool">Sustainable Local Energy<br>Skills Roadmap</span></div>
  <p class="eyebrow">Clean energy job</p>
  <h1>${esc(j.name)}</h1>
  <p class="what">${esc(j.what)}</p>
  <p class="pay"><b>${money(j.pay[0])} to ${money(j.pay[1])}</b>a year, from starting pay to experienced</p>
</div>
<div class="pic"><img src="${file('images/home-scene-1344.jpg')}" alt=""><div class="tags">${(j.roles || []).map((r) => '<span class="tag">' + esc(ROLES[r]) + '</span>').join('')}</div></div>
</body></html>`;

fs.mkdirSync(path.join(ROOT, 'jobs', 'img'), { recursive: true });
const tmp = path.join(ROOT, 'jobs', 'img', '.preview.html');
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
for (const j of JOBS) {
  fs.writeFileSync(tmp, html(j));
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'jobs', 'img', slug(j.name) + '.jpg'), type: 'jpeg', quality: 72 });
}
await browser.close();
fs.unlinkSync(tmp);
console.log(`Drew ${JOBS.length} preview pictures in jobs/img/.`);

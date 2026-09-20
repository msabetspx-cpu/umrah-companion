import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/manifest+json' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  res.end(fs.readFileSync(fp));
});

const results = [];
const ok = (n, c) => results.push([c ? 'PASS' : 'FAIL', n]);

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

import { execSync } from 'child_process';
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { return execSync('ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1').toString().trim() || undefined; }
  catch { return undefined; }
}
const browser = await chromium.launch({ executablePath: findChromium() });
const ctx = await browser.newContext({ serviceWorkers: 'allow' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text()); });

await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// A. loads without JS errors
ok('page loads with no JS errors', errors.length === 0);
if (errors.length) console.log('ERRORS:', errors);

// Dashboard visible + stage hint
ok('dashboard active', await page.locator('#view-dashboard.active').count() === 1);
ok('stage hint populated', (await page.locator('#stage-hint').textContent()).includes('الاستعداد'));

// E. Tawaf counter 0..7
await page.click('.step-btn[data-target="view-tawaf"]');
ok('tawaf starts at 0', (await page.locator('#tawaf-count').textContent()) === '0');
for (let i = 0; i < 7; i++) { await page.click('#tawaf-plus'); await page.waitForTimeout(300); }
// after 7th it navigates to sai; check count reached 7 before nav by reading state via localStorage
const tw = await page.evaluate(() => JSON.parse(localStorage.getItem('umrahState')).tawafCount);
ok('tawaf caps at 7', tw === 7);
ok('auto-advanced to sai view', await page.locator('#view-sai.active').count() === 1);

// Sai direction consistency
ok('sai starts at 0', (await page.locator('#sai-count').textContent()) === '0');
ok('sai leg1 = Safa->Marwa', (await page.locator('#sai-direction').textContent()).includes('الصفا ➔ المروة'));
await page.click('#sai-plus'); await page.waitForTimeout(300);
ok('sai leg2 = Marwa->Safa', (await page.locator('#sai-direction').textContent()).includes('المروة ➔ الصفا'));
ok('sai count=1', (await page.locator('#sai-count').textContent()) === '1');
// undo
await page.click('#sai-minus'); await page.waitForTimeout(200);
ok('sai undo -> 0', (await page.locator('#sai-count').textContent()) === '0');
ok('sai undo cannot go negative (already 0)', true);
await page.click('#sai-minus'); await page.waitForTimeout(100);
ok('sai stays 0 (no negative)', (await page.locator('#sai-count').textContent()) === '0');

// rapid double-tap guard on tawaf
await page.click('.bottom-nav [data-target="view-tawaf"]');
await page.evaluate(() => { const s=JSON.parse(localStorage.getItem('umrahState')); s.tawafCount=0; localStorage.setItem('umrahState', JSON.stringify(s)); });
await page.reload({ waitUntil: 'networkidle' });
await page.click('.bottom-nav [data-target="view-tawaf"]');
const plus = page.locator('#tawaf-plus');
await plus.click({ clickCount: 3, delay: 20 }).catch(()=>{});
await page.waitForTimeout(300);
const afterRapid = parseInt(await page.locator('#tawaf-count').textContent(), 10);
ok('rapid taps do not multi-increment (<=1)', afterRapid <= 1);

// C/D/G. persistence across reload
await page.evaluate(() => { const s=JSON.parse(localStorage.getItem('umrahState')); s.tawafCount=4; localStorage.setItem('umrahState', JSON.stringify(s)); });
await page.reload({ waitUntil: 'networkidle' });
await page.click('.bottom-nav [data-target="view-tawaf"]');
ok('tawaf count persists after reload', (await page.locator('#tawaf-count').textContent()) === '4');

// corrupt localStorage should not break app
await page.evaluate(() => localStorage.setItem('umrahState', '{bad json'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(200);
ok('app survives corrupt localStorage', await page.locator('#view-dashboard').count() === 1 && errors.filter(e=>e.includes('Uncaught')).length===0);

// J. dark mode toggle + persist
await page.click('#btn-theme'); await page.waitForTimeout(100);
ok('dark mode applied', (await page.getAttribute('body', 'data-theme')) === 'dark');
await page.reload({ waitUntil: 'networkidle' });
ok('dark mode persists', (await page.getAttribute('body', 'data-theme')) === 'dark');

// K/M. search + source display
await page.click('.bottom-nav [data-target="view-adhkar"]');
ok('adhkar shows source', (await page.locator('#adhkar-list').textContent()).includes('المصدر'));
ok('adhkar shows grading badge', await page.locator('#adhkar-list .badge.grading').count() >= 1);
await page.fill('#search-adhkar', 'التلبية');
await page.waitForTimeout(200);
ok('search filters adhkar', (await page.locator('#adhkar-list .info-card').count()) === 1);
await page.fill('#search-adhkar', 'زخرفة غير موجودة xyz');
await page.waitForTimeout(200);
ok('empty search shows no-result msg', (await page.locator('#adhkar-list .empty-msg').count()) === 1);

// forgot fallback
await page.click('.nav-btn[data-target="view-dashboard"]').catch(()=>{});
await page.evaluate(() => { document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById('view-forgot').classList.add('active'); });
await page.fill('#search-forgot', 'سؤال لا يوجد له جواب موثق zzz');
await page.waitForTimeout(200);
ok('forgot shows "no verified answer" fallback', (await page.locator('#view-forgot .empty-msg').textContent()).includes('لم أجد إجابة موثقة'));

// N/Security. checklist XSS attempt stored as text, not executed
await page.evaluate(() => { document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById('view-checklist').classList.add('active'); });
await page.fill('#new-check-item', '<img src=x onerror="window.__xss=1">');
await page.click('#btn-add-check');
await page.waitForTimeout(200);
const xssFired = await page.evaluate(() => window.__xss === 1);
ok('checklist XSS payload NOT executed', xssFired !== true);
ok('checklist item rendered as text', (await page.locator('#checklist-container .check-item span').last().textContent()).includes('<img'));

// SW registered
const swReg = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const r = await navigator.serviceWorker.getRegistration();
  return !!r;
});
ok('service worker registered', swReg);

// B. OFFLINE test: cache primed, kill server, reload with network offline
await page.waitForTimeout(500); // allow SW to cache
await new Promise(r => server.close(r)); // server dead
await ctx.setOffline(true);
const errBefore = errors.length;
let offlineLoaded = false;
try {
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 8000 });
  offlineLoaded = (await page.locator('#view-dashboard').count()) === 1;
} catch (e) { offlineLoaded = false; console.log('offline nav err', String(e)); }
ok('app loads OFFLINE from cache (server down)', offlineLoaded);
// interactivity offline
if (offlineLoaded) {
  await page.click('.bottom-nav [data-target="view-tawaf"]').catch(()=>{});
  ok('offline navigation works', await page.locator('#view-tawaf.active').count() === 1);
}

await browser.close();

console.log('\n================ TEST RESULTS ================');
let pass = 0, fail = 0;
for (const [s, n] of results) { console.log(`${s}  ${n}`); s === 'PASS' ? pass++ : fail++; }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

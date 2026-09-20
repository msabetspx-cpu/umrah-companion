import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { return execSync('ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1').toString().trim() || undefined; }
  catch { return undefined; }
}

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: findChromium() });
const ctx = await browser.newContext({ serviceWorkers: 'allow' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text()); });

const txt = (sel) => page.locator(sel).textContent();
const go = (id) => page.evaluate(i => { document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById(i).classList.add('active'); }, id);
const setCounts = (t, s) => page.evaluate(([t,s]) => { const o=JSON.parse(localStorage.getItem('umrahState')||'{}'); o.completedTawaf=t; o.completedSai=s; localStorage.setItem('umrahState', JSON.stringify(o)); }, [t,s]);

await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// A. loads clean
ok('page loads with no JS errors', errors.length === 0);
if (errors.length) console.log('ERRORS:', errors);
ok('dashboard active', await page.locator('#view-dashboard.active').count() === 1);
ok('dashboard shows current stage', (await txt('#current-stage')).includes('الاستعداد'));

// Companion: full journey has 11 stages, next/prev
await page.click('[data-target="view-companion"]');
ok('companion renders stage 1', (await txt('#companion-content')).includes('الخطوة 1 من 11'));
await page.click('#comp-next');
ok('companion next advances', (await txt('#companion-content')).includes('الخطوة 2 من 11'));
await page.click('#comp-prev');
ok('companion prev works', (await txt('#companion-content')).includes('الخطوة 1 من 11'));

// E. Tawaf: display is round-based (starts 1/7), dots, cap at 7
await page.click('.bottom-nav [data-target="view-tawaf"]');
await setCounts(0,0); await page.reload({ waitUntil:'networkidle' }); await page.click('.bottom-nav [data-target="view-tawaf"]');
ok('tawaf shows 1/7 at start', (await txt('#tawaf-big')).trim() === '1 / 7');
ok('tawaf ordinal = الأول', (await txt('#tawaf-ordinal')).includes('الأول'));
ok('tawaf has 7 dots', await page.locator('#tawaf-dots .dot').count() === 7);
ok('tawaf dot 1 active', await page.locator('#tawaf-dots .dot.active').count() === 1);
for (let i=0;i<3;i++){ await page.click('#tawaf-plus'); await page.waitForTimeout(280); }
ok('after 3 laps shows 4/7', (await txt('#tawaf-big')).trim() === '4 / 7');
ok('3 dots done', await page.locator('#tawaf-dots .dot.done').count() === 3);
for (let i=0;i<4;i++){ await page.click('#tawaf-plus'); await page.waitForTimeout(280); }
const tw = await page.evaluate(()=>JSON.parse(localStorage.getItem('umrahState')).completedTawaf);
ok('tawaf caps at 7', tw === 7);
ok('auto-advanced to sai', await page.locator('#view-sai.active').count() === 1);

// rapid taps guard
await setCounts(0,0); await page.reload({ waitUntil:'networkidle' }); await page.click('.bottom-nav [data-target="view-tawaf"]');
await page.locator('#tawaf-plus').click({ clickCount: 3, delay: 20 }).catch(()=>{});
await page.waitForTimeout(300);
ok('rapid taps increment at most 1', (await page.evaluate(()=>JSON.parse(localStorage.getItem('umrahState')).completedTawaf)) <= 1);

// undo + reset(confirm) + no negative
await setCounts(2,0); await page.reload({ waitUntil:'networkidle' }); await page.click('.bottom-nav [data-target="view-tawaf"]');
await page.click('#tawaf-minus'); await page.waitForTimeout(150);
ok('tawaf undo 3/7 -> 2/7', (await txt('#tawaf-big')).trim() === '2 / 7');
await page.click('#tawaf-minus'); await page.click('#tawaf-minus'); await page.waitForTimeout(150);
ok('tawaf never negative (1/7)', (await txt('#tawaf-big')).trim() === '1 / 7');
page.once('dialog', d => d.accept());
await page.click('#tawaf-reset'); await page.waitForTimeout(150);
ok('reset with confirm -> 1/7', (await txt('#tawaf-big')).trim() === '1 / 7');

// F. Sa'i direction never contradicts round
await setCounts(0,0); await page.reload({ waitUntil:'networkidle' }); await page.click('.bottom-nav [data-target="view-sai"]');
ok('sai 1/7 Safa->Marwa', (await txt('#sai-big')).trim()==='1 / 7' && (await txt('#sai-direction')).includes('الصفا ➔ المروة'));
await page.click('#sai-plus'); await page.waitForTimeout(280);
ok('sai 2/7 Marwa->Safa', (await txt('#sai-big')).trim()==='2 / 7' && (await txt('#sai-direction')).includes('المروة ➔ الصفا'));

// G. persistence across reload
await setCounts(4,3); await page.reload({ waitUntil:'networkidle' }); await page.click('.bottom-nav [data-target="view-tawaf"]');
ok('tawaf persists (5/7)', (await txt('#tawaf-big')).trim() === '5 / 7');

// corrupt localStorage
await page.evaluate(()=>localStorage.setItem('umrahState','{bad json'));
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(200);
ok('survives corrupt localStorage', await page.locator('#view-dashboard').count()===1 && errors.filter(e=>e.includes('Uncaught')).length===0);
ok('self-heals corrupt localStorage', await page.evaluate(()=>{ try { JSON.parse(localStorage.getItem('umrahState')); return true; } catch(e){ return false; } }));

// Context-aware "ماذا أفعل الآن": set stage TAWAF and check round text
await page.evaluate(()=>{const o=JSON.parse(localStorage.getItem('umrahState')||'{}');o.stage='TAWAF';o.completedTawaf=3;localStorage.setItem('umrahState',JSON.stringify(o));});
await page.reload({ waitUntil:'networkidle' });
await page.click('#btn-what-now'); await page.waitForTimeout(200);
const mw = await txt('#mw-body');
ok('what-now is context-aware (round 4)', mw.includes('الرابع') && mw.includes('الشوط 4 من 7') && mw.includes('لا يوجد دعاء مخصوص'));
ok('what-now has no uncited "الحمد لله بنعمته"', !mw.includes('بنعمته تتم الصالحات'));
await page.keyboard.press('Escape'); await page.waitForTimeout(100);
ok('modal closes on Escape', (await page.getAttribute('#modal-what-now','aria-hidden'))==='true');

// Confused view
await go("view-confused");
ok('confused list populated', await page.locator('#confused-list .confused-btn').count() >= 10);
await page.click('#confused-list .confused-btn[data-id="r-count-doubt"]');
await page.waitForTimeout(150);
ok('confused answer shows source + khilaf', (await txt('#confused-answer')).includes('اليقين') && (await txt('#confused-answer')).includes('خلاف'));
await page.click('#confused-list .confused-btn[data-id="r-special"]');
await page.waitForTimeout(150);
ok('confused fallback for special case', (await txt('#confused-answer')).includes('لم أجد'));

// Search with Arabic normalization
await go("view-adhkar");
await page.fill('#search-adhkar','التلبيه'); // ta marbuta variant
await page.waitForTimeout(150);
ok('adhkar search normalizes (ة/ه)', await page.locator('#adhkar-list .info-card').count() >= 1);
await page.fill('#search-adhkar','xyzلاشيء');
await page.waitForTimeout(150);
ok('adhkar empty search msg', await page.locator('#adhkar-list .empty-msg').count() === 1);

// Sources page separates religious vs official
await go("view-sources");
ok('sources religious populated', await page.locator('#sources-religious .info-card').count() >= 4);
ok('sources official separate + dated', (await txt('#sources-official')).includes('آخر تحقق'));

// Tahallul religious correctness: women's trim non-firm, no fabricated dhikr
await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-tahallul').classList.add('active');});
const th = await txt('#tahallul-content');
ok('tahallul: women trim marked khilaf + ask mufti', th.includes('اسأل جهة إفتاء') && th.includes('أنملة'));
ok('tahallul: no "بنعمته تتم الصالحات" as ritual dhikr', !th.includes('بنعمته تتم الصالحات'));

// Checklist sections + XSS-safe add
await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-checklist').classList.add('active');});
ok('checklist has section titles', await page.locator('#checklist-container .section-title').count() >= 2);
await page.fill('#new-check-item','<img src=x onerror="window.__xss=1">');
await page.click('#btn-add-check'); await page.waitForTimeout(150);
ok('checklist XSS not executed', (await page.evaluate(()=>window.__xss===1)) !== true);

// Trip info local save
await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-trip').classList.add('active');});
await page.fill('#trip-hotel','فندق التجربة');
await page.click('#btn-save-trip'); await page.waitForTimeout(150);
await page.reload({ waitUntil:'networkidle' });
await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-trip').classList.add('active');});
ok('trip info persists locally', (await page.inputValue('#trip-hotel')) === 'فندق التجربة');

// Crowd mode toggle + persists
await page.click('#btn-crowd'); await page.waitForTimeout(100);
ok('crowd mode on', await page.evaluate(()=>document.body.classList.contains('crowd-mode')));
await page.reload({ waitUntil:'networkidle' });
ok('crowd mode persists', await page.evaluate(()=>document.body.classList.contains('crowd-mode')));
await page.click('#btn-crowd'); // turn off

// Dark mode
await page.click('#btn-theme'); await page.waitForTimeout(100);
ok('dark mode', (await page.getAttribute('body','data-theme'))==='dark');
await page.reload({ waitUntil:'networkidle' });
ok('dark mode persists', (await page.getAttribute('body','data-theme'))==='dark');

// No horizontal overflow at iPhone width
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(base + '/index.html', { waitUntil:'networkidle' });
const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
ok('no horizontal overflow at 375px', overflow === false);

// SW registered
ok('service worker registered', await page.evaluate(async()=>{ if(!('serviceWorker'in navigator))return false; return !!(await navigator.serviceWorker.getRegistration()); }));

// B. OFFLINE: kill server + go offline, reload from cache
await page.waitForTimeout(600);
await new Promise(r => server.close(r));
await ctx.setOffline(true);
let offlineLoaded = false;
try {
  await page.goto(base + '/index.html', { waitUntil:'domcontentloaded', timeout: 8000 });
  offlineLoaded = (await page.locator('#view-dashboard').count()) === 1;
} catch(e){ console.log('offline err', String(e)); }
ok('app loads OFFLINE from cache (server down)', offlineLoaded);
if (offlineLoaded) {
  await page.click('.bottom-nav [data-target="view-tawaf"]').catch(()=>{});
  ok('offline navigation works', await page.locator('#view-tawaf.active').count() === 1);
  await page.click('#tawaf-plus').catch(()=>{});
  await page.waitForTimeout(200);
  ok('offline counter works', parseInt((await txt('#tawaf-big')).trim()) >= 1);
}

await browser.close();

console.log('\n================ TEST RESULTS ================');
let pass=0, fail=0;
for (const [s,n] of results){ console.log(`${s}  ${n}`); s==='PASS'?pass++:fail++; }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

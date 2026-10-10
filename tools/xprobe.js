const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ locale: 'ar' });
  await p.goto('https://azlartr.github.io/mubader-preview/xtest.html');
  await p.waitForTimeout(15000);
  for (const f of p.frames()) {
    const u = f.url(); if (!/twitter|x\.com/.test(u)) continue;
    const txt = await f.evaluate(() => document.body ? document.body.innerText.slice(0, 600) : '').catch(e => 'ERR ' + e);
    const ids = await f.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/status/"]')].map(a => a.href.match(/status\/(\d+)/)?.[1]).filter(Boolean))]).catch(() => []);
    console.log('FRAME', u.slice(0, 120), '\nTEXT', JSON.stringify(txt), '\nIDS', ids.join(','));
  }
  const id = '20';
  const r = await p.evaluate(async (id) => {
    const tok = ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
    try { const res = await fetch('https://cdn.syndication.twimg.com/tweet-result?id=' + id + '&lang=ar&token=' + tok); return res.status + ' ' + (await res.text()).slice(0, 200); } catch (e) { return 'FETCH-ERR ' + e; }
  }, id);
  console.log('TWEET-RESULT from page:', r);
  await b.close();
})();

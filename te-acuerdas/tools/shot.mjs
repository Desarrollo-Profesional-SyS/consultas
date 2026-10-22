// Captura una página local: node tools/shot.mjs <url> <archivo.png> [ancho] [alto]
import { chromium } from 'playwright';
const [url, out, w = '1200', h = '800'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(url); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true }); await b.close();

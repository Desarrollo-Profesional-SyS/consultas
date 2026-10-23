// Revisión de diseño responsivo: recorre las pantallas del juego en varios tamaños
// (celular chico, normal, horizontal y tablet), busca desbordes horizontales y guarda capturas.
//   node tools/responsive.mjs   (con el servidor local en :8080)
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = new URL('./out/resp/', import.meta.url).pathname;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const b = await chromium.launch();
const ctx = await b.newContext({ deviceScaleFactor: 1 });

// Elementos que se salen del ancho de la pantalla (sin contar los que viven dentro de algo con scroll).
async function audit(p, name) {
  const r = await p.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]') || el.classList.contains('fly') || el.closest('.toast')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right <= W + 1 && r.left >= -1) continue;
      let q = el.parentElement, clipped = false;
      while (q && q !== document.body) { if (getComputedStyle(q).overflowX !== 'visible') { clipped = true; break; } q = q.parentElement; }
      if (!clipped) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} [${Math.round(r.left)}→${Math.round(r.right)}]`);
    }
    return { W, sw: document.documentElement.scrollWidth, out: out.slice(0, 6) };
  });
  const bad = r.sw > r.W + 1 || r.out.length;
  if (bad) problems.push(`${name}: ancho ${r.W}, scroll ${r.sw} · ${r.out.join(' | ')}`);
  console.log(`${bad ? '✗' : '✓'} ${name}${bad ? ` (scroll ${r.sw} > ${r.W}) ${r.out.join(' | ')}` : ''}`);
  await p.screenshot({ path: `${OUT}${name}.png`, fullPage: true });
}

// Joss y Alex
const joss = await ctx.newPage();
await joss.setViewportSize({ width: 1280, height: 720 });
await joss.goto(`${BASE}/index.html?ensayo&segundos=8`);
await joss.click('#btnCreate');
await joss.waitForSelector('#stepLinks:not([hidden])');
const adminLink = (await joss.textContent('#adminLink')).replace('alex.html?', 'alex.html?segundos=8&');
const playerLink = await joss.textContent('#playerLink');
const notesLink = await joss.textContent('#notesLink');
for (const [w, h] of [[375, 812], [768, 1024]]) { await joss.setViewportSize({ width: w, height: h }); await wait(300); await audit(joss, `menu-joss-${w}x${h}`); }
await joss.setViewportSize({ width: 1280, height: 720 });

const alex = await ctx.newPage();
await alex.setViewportSize({ width: 1280, height: 900 });
await alex.goto(adminLink);
await wait(600);
await alex.click('[data-tab="rehearsal"]');
await alex.click('#addBots');

// Celulares de distintos tamaños
const SIZES = [[320, 568], [360, 740], [390, 844], [844, 390], [768, 1024]];
const phones = [];
for (const [i, [w, h]] of SIZES.entries()) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto(playerLink);
  await p.waitForSelector('.avatars button');
  await wait(300);
  await audit(p, `cel-entrar-${w}x${h}`);
  await p.click(`[data-c="${i}"]`);
  await p.click(`.avatars button[data-a="${i * 3}"]`);
  await p.fill('#name', ['Fernanda Gómez', 'Luis', 'Ana Paula', 'Beto', 'Majo'][i]);
  await p.click('#join');
  phones.push({ p, w, h });
}
await joss.click('#btnStart');
await wait(1500);
const slideId = () => joss.evaluate(() => document.querySelector('#stage section:last-of-type')?.id);
const go = async (id, ms = 1500) => { await alex.selectOption('#goto', id); await wait(ms); if ((await slideId()) !== id) problems.push(`no llegó a ${id}`); };
const press = async (ms = 900) => { await joss.keyboard.press('ArrowRight'); await wait(ms); };
const shotAll = async (label) => { for (const { p, w, h } of phones) await audit(p, `cel-${label}-${w}x${h}`); };

await alex.click('[data-tab="live"]');
await go('sala'); await shotAll('sala');
await go('ronda-1', 2200); await shotAll('portada');
await go('despierta'); await shotAll('calificar');
await phones[0].p.click('[data-v="7"]'); await wait(500); await audit(phones[0].p, 'cel-calificar-votado-320x568');
await go('gancho'); await shotAll('texto');
await go('miller'); await shotAll('si-no');
await go('chunk'); await press(400); await wait(6200); await shotAll('numero');
await go('adivina'); await shotAll('a-d');
await phones[0].p.click('[data-v="C"]'); await wait(400);
await press(); await press(1200); await shotAll('a-d-revela');
await go('mito-1'); await shotAll('v-f');
await go('p05', 1200); await shotAll('palabras');
await go('escribe'); await press(1200); await shotAll('hoja-1');
for (const { p } of phones) await p.fill('#w1', 'sol');
await wait(9000); await press(1500);
await shotAll('resultado-1');
await go('cierre'); await shotAll('cierre');
await go('segunda'); await press(1200); await shotAll('hoja-2');
await wait(9000);
await go('resumen', 2500); await shotAll('final');

// Notas y panel de Alex en celular y tablet
const notes = await ctx.newPage();
for (const [w, h] of [[375, 812], [768, 1024]]) {
  await notes.setViewportSize({ width: w, height: h });
  await notes.goto(notesLink);
  await wait(1500);
  await audit(notes, `notas-${w}x${h}`);
}
for (const [w, h] of [[375, 812], [768, 1024]]) {
  await alex.setViewportSize({ width: w, height: h });
  for (const tab of ['live', 'players', 'questions', 'review', 'table', 'rehearsal']) {
    await alex.click(`[data-tab="${tab}"]`);
    await wait(400);
    await audit(alex, `alex-${tab}-${w}x${h}`);
  }
}
// La presentación en pantallas chicas
for (const [w, h] of [[375, 812], [812, 375], [1024, 768]]) {
  await joss.setViewportSize({ width: w, height: h });
  await wait(500);
  await audit(joss, `presentacion-${w}x${h}`);
}

console.log(problems.length ? `\nPROBLEMAS (${problems.length}):\n${problems.join('\n')}` : '\nSin desbordes.');
await b.close();

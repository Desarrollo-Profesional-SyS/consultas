// Prueba completa en modo ensayo local: Joss + Alex + 3 celulares + 25 jugadores
// de prueba recorren las 61 diapositivas, con capturas en tools/out/. Revisa también
// las notas de Joss, el panel de Alex, las reacciones y el PDF del recuerdo.
//   npx http-server -p 8080 -c-1 .   (desde te-acuerdas/)
//   node tools/e2e.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = new URL('./out/', import.meta.url).pathname;
const errors = [];
const checks = [];
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true }); // misma sesión: comparten localStorage y BroadcastChannel
const watch = (p, who) => {
  p.on('pageerror', (e) => errors.push(`[${who}] ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${who}] ${m.text()}`); });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (p, name) => p.screenshot({ path: `${OUT}${name}.png` });
const check = (ok, msg) => { checks.push(`${ok ? '✓' : '✗'} ${msg}`); console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) errors.push(`[check] ${msg}`); };

// Joss
const joss = await ctx.newPage();
await joss.setViewportSize({ width: 1600, height: 900 });
watch(joss, 'joss');
await joss.goto(`${BASE}/index.html?ensayo&segundos=25`);
await joss.click('#btnCreate');
await joss.waitForSelector('#stepLinks:not([hidden])');
const adminLink = await joss.textContent('#adminLink');
const playerLink = await joss.textContent('#playerLink');
const slideId = () => joss.evaluate(() => document.querySelector('#stage section:last-of-type')?.id);
const press = async (ms = 800) => { await joss.keyboard.press('ArrowRight'); await wait(ms); };
async function goTo(id, ms = 800) {
  for (let i = 0; i < 30 && (await slideId()) !== id; i++) await press(ms);
  check((await slideId()) === id, `llegó a «${id}»`);
  await wait(700);
}

// Notas de Joss: se abren antes de empezar y muestran el guion
const [notes] = await Promise.all([ctx.waitForEvent('page'), joss.click('#btnNotes')]);
watch(notes, 'notas');
await notes.waitForSelector('.line.joss', { timeout: 5000 }).catch(() => {});
check(await notes.isVisible('.line.joss'), 'las notas muestran el guion de Joss antes de empezar');
check(/notas\.html\?s=[A-Z]{4}/.test(await joss.textContent('#notesLink')), 'hay link de notas para el celular o la tablet');

// Alex
const alex = await ctx.newPage();
await alex.setViewportSize({ width: 1280, height: 900 });
watch(alex, 'alex');
await alex.goto(adminLink.replace('alex.html?', 'alex.html?segundos=25&'));
await wait(600);

await joss.click('#btnStart');
await wait(1500);
await shot(joss, '01-cover');
await press(); // sala
await goTo('sala');

// 3 celulares entran en la sala
const phones = [];
for (const [name, av, color] of [['Rosbel', 3, 0], ['Joss Jr', 8, 4], ['Mariana', 18, 8]]) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  watch(p, name);
  await p.goto(playerLink);
  await p.waitForSelector('.avatars button');
  await wait(400);
  if (name === 'Rosbel') await shot(p, '02-phone-join');
  await p.click(`[data-c="${color}"]`);
  await p.click(`.avatars button[data-a="${av}"]`);
  if (name === 'Rosbel') await shot(p, '02b-phone-join-color');
  await p.fill('#name', name);
  await p.click('#join');
  phones.push(p);
}
await alex.click('[data-tab="rehearsal"]');
await alex.click('#addBots');
await wait(10000);
await shot(joss, '03-sala');
await shot(phones[0], '04-phone-lobby');
const avs = await joss.evaluate(() => JSON.parse(localStorage.getItem('te-acuerdas-ensayo') || '{}'));
const room0 = Object.values(avs.rooms || {})[0] || {};
const mine = Object.values(room0.players || {}).filter((p) => ['Rosbel', 'Joss Jr', 'Mariana'].includes(p.name)).map((p) => p.avatar);
check(mine.length === 3 && mine.every((a) => a >= 32), `los avatares guardan cerebro + color (${mine.join(', ')})`);

// Reacciones: desde un celular y de los jugadores de prueba
check(await phones[0].isVisible('#reactbar [data-r="risa"]'), 'la barra de reacciones se ve en el celular');
await phones[0].click('#reactbar [data-r="risa"]');
await phones[1].click('#reactbar [data-r="boom"]');
await wait(700);
check((await joss.locator('#stage .reaction').count()) >= 1, 'la reacción del celular aparece en la pantalla de Joss');
await shot(joss, '03b-reacciones');
await alex.click('#botReact');
await wait(2500);
check((await joss.locator('#stage .reaction').count()) >= 2, 'las reacciones de prueba aparecen en pantalla');
await shot(joss, '03c-reacciones-bots');

// Calificar la memoria
await goTo('despierta');
await wait(400);
await shot(phones[0], '05-phone-rating');
for (const [k, v] of [[0, 8], [1, 5], [2, 9]]) await phones[k].click(`[data-v="${v}"]`);
await wait(6500);
await shot(joss, '06-despierta');
check((await notes.textContent('#title')).length > 0 && (await notes.isVisible('.line.joss')), 'las notas siguen la diapositiva');
await shot(notes, '06b-notas');
await alex.click('[data-tab="live"]');
await wait(500);
check(await alex.isVisible('.guion .line.alex'), 'el panel de Alex muestra su parte del guion');
await shot(alex, '06c-alex-guion');
await alex.click('[data-tab="rehearsal"]');
check(/\d/.test(await joss.textContent('[data-live="rating-avg"]')), 'promedio de la calificación en pantalla');

// Portada de la ronda 1: en pantalla y en el celular
await goTo('reglas');
await shot(phones[0], '07-phone-look');
await goTo('ronda-1');
await wait(1600);
await shot(joss, '07b-ronda-1');
await shot(phones[0], '07c-phone-ronda');
check(/TU MEMORIA/.test(await phones[0].textContent('#view')), 'el celular muestra la portada de la ronda');

// Gancho: respuesta libre
await goTo('gancho');
await phones[0].fill('#qin', 'Que el café era gratis');
await phones[0].click('#qsend');
await phones[1].fill('#qin', 'Algo de Excel avanzado');
await phones[1].click('#qsend');
await wait(6500);
await alex.click('[data-tab="questions"]');
await wait(400);
await alex.click('[data-hide^="gancho|"]');
await wait(800);
await shot(alex, '08-alex-questions');
await shot(joss, '09-gancho');
await shot(phones[1], '10-phone-text');

// Sí / No
await goTo('memoria');
await goTo('miller');
await press(); // aparece la votación
for (const [k, v] of [[0, 'si'], [1, 'si'], [2, 'no']]) await phones[k].click(`[data-v="${v}"]`);
await wait(6500);
await shot(joss, '11-miller');

// El número
await goTo('chunk');
await press(400); // aparece el número y la cuenta regresiva
await shot(joss, '12-chunk-countdown');
await wait(5600);
await phones[0].fill('#qin', '5518274390');
await phones[0].click('#qsend');
await phones[1].fill('#qin', '55 18 27 11');
await phones[1].click('#qsend');
await wait(6000);
await shot(joss, '13-chunk-open');
await shot(phones[2], '14-phone-number');
await press(); // chunk-res
await goTo('chunk-res');
for (let i = 0; i < 3; i++) await press(800);
await shot(joss, '15-chunk-res');
await shot(phones[0], '16-phone-chunk-ok');
await shot(phones[1], '17-phone-chunk-no');

// A-D
await goTo('chunk-truco');
await goTo('adivina');
await phones[0].click('[data-v="C"]');
await phones[1].click('[data-v="B"]');
await shot(phones[0], '18-phone-choice');
await wait(6500);
await press(); // porcentajes
await shot(joss, '19-adivina-votos');
await press(); // ¡era la C!
await wait(1200);
await shot(joss, '20-adivina-c');
await shot(phones[0], '21-phone-acerto');
await shot(phones[1], '22-phone-fallo');

// Mitos V/F
await goTo('curva', 900);
await press(700);
await press(700);
await wait(600);
check(/CLIC 2/.test(await notes.textContent('.beat.now .cue.click').catch(() => '')), 'las notas marcan el clic 2 en la curva');
check(/CLIC 3/.test(await notes.textContent('.beat.next .cue.click').catch(() => '')), 'las notas anuncian el próximo clic');
await shot(notes, '22b-notas-clic');
await alex.click('[data-tab="live"]');
await wait(500);
check(/CLIC 2/.test(await alex.textContent('.guion .beat.now .cue.click').catch(() => '')), 'el panel de Alex marca el mismo clic');
await shot(alex, '22c-alex-clic');
await goTo('mitos', 900);
for (const m of [1, 2, 3, 4]) {
  await goTo(`mito-${m}`);
  for (const [k, v] of [[0, 'V'], [1, 'F'], [2, m % 2 ? 'F' : 'V']]) await phones[k].click(`[data-v="${v}"]`);
  await wait(m === 1 ? 6500 : 3000);
  if (m === 1) { await shot(joss, '23-mito1-votos'); await shot(phones[0], '24-phone-mito'); }
  await press(); // revela y cierra
  await wait(900);
  if (m === 1) { await shot(joss, '25-mito1-revela'); await shot(phones[1], '26-phone-mito-acerto'); }
}

// Las 20 palabras: avance solo cada 5 s, P pausa
await goTo('funciona');
await goTo('reto');
await press(1500); // a p01, desde aquí corre solo
check((await slideId()) === 'p01', 'el clic en «reto» entra a p01');
await wait(5800);
check((await slideId()) === 'p02', 'p01 avanzó sola a p02');
await wait(2500);
await shot(joss, '27-p02-anillo');
await shot(phones[0], '28-phone-watch');
await wait(3000);
check((await slideId()) === 'p03', 'p02 avanzó sola a p03');
await joss.keyboard.press('p');
await wait(6500);
check((await slideId()) === 'p03', 'P pausa el avance');
await joss.keyboard.press('p');
await wait(5800);
check((await slideId()) === 'p04', 'P reanuda el avance');
for (let i = 0; i < 16 && (await slideId()) !== 'p20'; i++) await press(900);
check((await slideId()) === 'p20', 'avance a mano hasta p20');
await wait(6500);
check((await slideId()) === 'p20', 'en p20 se detiene');
await shot(joss, '29-p20');

// Ronda 1
await press(1400); // escribe
check((await slideId()) === 'escribe', 'p20 → escribe con clic');
await press(800); // arranca el reloj
const r1 = [
  ['sol', 'calsetines', '', 'coche', '', 'dado', '', '∞', '', '', 'windows', '', '', '', '', 'celular', 'cohete', 'INE', 'tapabocas', 'pies y manos'],
  ['sol', 'calcetin', 'semaforo', '', 'estrella', '', '', '', '', 'manos', '', '', '', 'corazón', '', 'iphone', '', '', 'cubrebocas', 'manos'],
  ['el sol', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'manos y pies'],
];
for (let k = 0; k < phones.length; k++) for (let n = 1; n <= 20; n++) if (r1[k][n - 1]) await phones[k].fill(`#w${n}`, r1[k][n - 1]);
await shot(phones[0], '30-phone-sheet1');
await phones[2].click('#done');
await phones[2].click('#yes');
await wait(25000);
await press(1600); // resultados
await goTo('resultados');
await wait(1500);
await shot(joss, '31-resultados');
await goTo('serial', 900);
await wait(1500);
await shot(joss, '32-serial');

// Revela: respuesta libre
await goTo('revela');
await phones[0].fill('#qin', '¡Porque son un par!');
await phones[0].click('#qsend');
await wait(6500);
await shot(joss, '33-revela');

// Código
await goTo('codigo-1', 900);
for (let i = 0; i < 5; i++) await press(700);
await shot(joss, '34-codigo-1');
await goTo('codigo-3', 700);
for (let i = 0; i < 5; i++) await press(700);
await shot(joss, '35-codigo-3');
await goTo('segunda', 700);
await wait(800);

// Ronda 2
await press(900);
const words = ['sol', 'calcetines', 'semaforo', 'carro', 'estrella', 'dado', 'arcoiris', 'infinito', 'bebe', 'manos', 'windows 11', 'reloj', 'martes', 'corazon', 'vestido', 'iphone', 'nave espacial', 'credencial', 'cubrebocas', 'pies y manos'];
for (let k = 0; k < phones.length; k++) for (let n = 1; n <= 20; n++) if ((n + k) % 7 !== 0) await phones[k].fill(`#w${n}`, words[n - 1]);
await wait(26000);
await press(1800); // comparativo
for (let i = 0; i < 3; i++) await press(1400);
await shot(joss, '36-comparativo');
await goTo('podio');
for (let i = 0; i < 4; i++) await press(1000);
await wait(800);
await shot(joss, '37-podio');

// Cierre + muro
await goTo('cierre', 900);
await phones[0].fill('#qin', 'Los pasos para dar de alta un curso nuevo');
await phones[0].click('[data-a="Sistemas"]');
await phones[0].click('#qsend');
await phones[1].fill('#qin', 'Los nombres de los clientes');
await phones[1].click('#qsend');
await shot(phones[0], '38-phone-cierre');
await wait(6500);
await goTo('muro');
await wait(1500);
await shot(joss, '39-muro');
await goTo('llevar');
await wait(1200);
await shot(joss, '40-llevar');
await goTo('resumen');
await wait(2500);
await shot(joss, '40b-resumen');
check((await joss.locator('[data-live="summary-grid"] > *').count()) >= 20, 'el resumen final muestra a los jugadores');
await shot(phones[0], '41-phone-final');
await phones[0].locator('#btnPdf').scrollIntoViewIfNeeded();
await shot(phones[0], '41b-phone-pdf');
const [dl] = await Promise.all([phones[0].waitForEvent('download', { timeout: 60000 }), phones[0].click('#btnPdf')]);
const pdfPath = `${OUT}recuerdo-Rosbel.pdf`;
await dl.saveAs(pdfPath);
const { statSync, readFileSync } = await import('node:fs');
check(dl.suggestedFilename() === 'Te-acuerdas-Rosbel.pdf' && statSync(pdfPath).size > 100000 && readFileSync(pdfPath).subarray(0, 5).toString() === '%PDF-', `el celular descarga su recuerdo en PDF (${dl.suggestedFilename()}, ${Math.round(statSync(pdfPath).size / 1024)} KB)`);
const total = await joss.evaluate(() => document.getElementById('hCount').textContent);
check(/\/ 61$/.test(total), `la presentación tiene 61 diapositivas (${total})`);

// Control remoto desde el panel de Alex
await alex.click('[data-tab="live"]');
await wait(400);
await alex.click('#prev');
await wait(1500);
check((await slideId()) === 'llevar', 'el «Anterior» de Alex mueve la presentación');
await alex.click('#next');
await wait(1500);
check((await slideId()) === 'resumen', 'el «Siguiente» de Alex mueve la presentación');
await notes.click('#prev');
await wait(1500);
check((await slideId()) === 'llevar', 'el «Anterior» de las notas mueve la presentación');

// Notas en otro aparato: siguen la sala sin la ventana de la presentación
// (en ensayo se simula otro aparato cortando solo el canal directo con la presentación)
const nl = await joss.evaluate(() => document.getElementById('notesLink').textContent);
const remote = await ctx.newPage();
watch(remote, 'notas-link');
await remote.addInitScript(() => {
  const BC = window.BroadcastChannel;
  window.BroadcastChannel = function (name) { return new BC(name === 'te-acuerdas-notas' ? 'aislado' : name); };
});
await remote.setViewportSize({ width: 768, height: 1024 });
await remote.goto(nl);
await wait(2000);
check(/Diapositiva 60 de 61/.test(await remote.textContent('#count')) && (await remote.isVisible('.line.joss')), 'las notas por link siguen la diapositiva sin la ventana emergente');
await alex.click('#next');
await wait(1500);
check(/Diapositiva 61 de 61/.test(await remote.textContent('#count')), 'las notas por link cambian solas con la presentación');
await shot(remote, '41c-notas-link');
await alex.click('[data-tab="table"]');
await wait(400);
await shot(alex, '42-alex-table');

// Ningún texto de chat ni de instrucciones en pantalla (salvo el link de la sala)
const leaks = await joss.evaluate(async () => {
  const { SLIDES } = await import('./js/slides-data.js');
  const bad = [];
  for (const s of SLIDES) {
    const t = s.html.replace(/<[^>]+>/g, ' ');
    if (/en el chat/i.test(t) && s.id !== 'sala') bad.push(`${s.id}: chat`);
    if (/da clic|dale clic|haz clic/i.test(t)) bad.push(`${s.id}: clic`);
    if (/<aside/.test(s.html)) bad.push(`${s.id}: notas`);
  }
  return bad;
});
check(!leaks.length, `sin «en el chat», «da clic» ni notas en pantalla ${leaks.join(', ')}`);

console.log(checks.join('\n'));
console.log(errors.length ? `ERRORES:\n${errors.join('\n')}` : 'Sin errores.');
await b.close();
process.exit(errors.length ? 1 : 0);

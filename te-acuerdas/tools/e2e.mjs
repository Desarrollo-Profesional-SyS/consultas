// Prueba completa en modo ensayo local: Joss + Alex + 3 celulares + 25 jugadores
// de prueba, con capturas de cada momento clave en tools/out/.
//   npx http-server -p 8080 -c-1 .   (desde te-acuerdas/)
//   node tools/e2e.mjs
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = new URL('./out/', import.meta.url).pathname;
const errors = [];
const b = await chromium.launch();
const ctx = await b.newContext(); // misma sesión: comparten localStorage y BroadcastChannel
const watch = (p, who) => {
  p.on('pageerror', (e) => errors.push(`[${who}] ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${who}] ${m.text()}`); });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (p, name) => p.screenshot({ path: `${OUT}${name}.png` });

// Joss
const joss = await ctx.newPage();
await joss.setViewportSize({ width: 1600, height: 900 });
watch(joss, 'joss');
await joss.goto(`${BASE}/index.html?segundos=25`);
await joss.click('#btnCreate');
await joss.waitForSelector('#stepLinks:not([hidden])');
const adminLink = await joss.textContent('#adminLink');
const playerLink = await joss.textContent('#playerLink');
console.log('admin:', adminLink, '\nplayer:', playerLink);
await shot(joss, '01-setup');

// Alex
const alex = await ctx.newPage();
await alex.setViewportSize({ width: 1280, height: 900 });
watch(alex, 'alex');
await alex.goto(adminLink.replace('alex.html?', 'alex.html?segundos=25&'));
await wait(600);

// Joss empieza en la sala
await joss.selectOption('#startAt', { label: await joss.$eval('#startAt option:nth-child(14)', (o) => o.textContent) });
await joss.click('#btnStart');
await wait(1200);

// 3 celulares
const phones = [];
const people = [['Rosbel', 3], ['Joss Jr', 8], ['Mariana', 13]];
for (const [name, av] of people) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  watch(p, name);
  await p.goto(playerLink);
  await p.waitForSelector('.avatars button');
  await wait(500);
  if (name === 'Rosbel') await shot(p, '02-phone-join');
  await p.click(`.avatars button[data-a="${av}"]`);
  await p.fill('#name', name);
  await p.click('#join');
  phones.push(p);
}
await wait(500);
await shot(phones[0], '03-phone-wait');

// Jugadores de prueba
await alex.click('[data-tab="rehearsal"]');
await alex.click('#addBots');
await wait(10000);
await shot(joss, '04-sala');
await alex.click('[data-tab="players"]');
await wait(300);
await shot(alex, '05-alex-players');

// El reto: reto + 20 palabras
await joss.keyboard.press('ArrowRight');
await wait(900);
for (let i = 0; i < 5; i++) { await joss.keyboard.press('ArrowRight'); await wait(900); }
await shot(joss, '06-p05');
await shot(phones[0], '07-phone-watch');
for (let i = 0; i < 15; i++) { await joss.keyboard.press('ArrowRight'); await wait(800); }
await joss.keyboard.press('ArrowRight'); // a «Escribe»
await wait(1400);
await shot(joss, '08-escribe-idle');

// Ronda 1
await joss.keyboard.press('ArrowRight'); // arranca el reloj
await wait(800);
const r1 = [
  ['sol', 'calsetines', '', 'coche', '', '', '', '', '', '', '', '', '', '', '', '', '', 'INE', 'tapabocas', 'pies y manos'],
  ['sol', 'calcetin', 'semaforo', '', 'estrella', '', '', '', '', 'manos', '', '', '', 'corazón', '', '', '', '', 'cubrebocas', 'manos'],
  ['el sol', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'manos y pies'],
];
for (let k = 0; k < phones.length; k++) {
  const p = phones[k];
  for (let n = 1; n <= 20; n++) if (r1[k][n - 1]) await p.fill(`#w${n}`, r1[k][n - 1]);
}
await wait(600);
await shot(phones[0], '09-phone-sheet1');
await alex.click('[data-tab="live"]');
await wait(400);
await shot(alex, '10-alex-live');
await shot(joss, '11-escribe-running');
await phones[2].click('#done');
await phones[2].click('#yes');
await wait(24000); // se acaba el reloj
await shot(joss, '12-escribe-closed');
await joss.keyboard.press('ArrowRight'); // resultados
await wait(2500);
await shot(joss, '13-resultados');
await shot(phones[0], '14-phone-after1');
await joss.keyboard.press('ArrowRight'); // serial
await wait(2200);
await shot(joss, '15-serial');
await alex.click('[data-tab="review"]');
await wait(400);
await shot(alex, '16-alex-review');

// Revela + código
for (let i = 0; i < 6; i++) { await joss.keyboard.press('ArrowRight'); await wait(900); }
await shot(joss, '17-codigo');
// Hasta «segunda» (cada código tiene 5 clics)
for (let i = 0; i < 40; i++) {
  const id = await joss.evaluate(() => document.querySelector('#stage section:last-child')?.id);
  if (id === 'segunda') break;
  await joss.keyboard.press('ArrowRight');
  await wait(750);
}
await wait(1200);
await shot(joss, '18-segunda-idle');
await joss.keyboard.press('ArrowRight'); // arranca ronda 2
await wait(900);
const words = ['sol', 'calcetines', 'semaforo', 'carro', 'estrella', 'hormiga', 'arcoiris', 'pulpo', 'bebe', 'manos', 'balon', 'reloj', 'martes', 'corazon', 'vestido', 'bandera', 'urna', 'credencial', 'cubrebocas', 'pies y manos'];
for (let k = 0; k < phones.length; k++) {
  for (let n = 1; n <= 20; n++) if ((n + k) % 7 !== 0) await phones[k].fill(`#w${n}`, words[n - 1]);
}
await shot(phones[1], '19-phone-sheet2');
await wait(26000);
await joss.keyboard.press('ArrowRight'); // comparativo
await wait(2000);
await joss.keyboard.press('ArrowRight');
await wait(1600);
await joss.keyboard.press('ArrowRight');
await wait(1400);
await shot(joss, '20-comparativo');
await joss.keyboard.press('ArrowRight'); // podio
await wait(900);
for (let i = 0; i < 3; i++) { await joss.keyboard.press('ArrowRight'); await wait(900); }
await wait(600);
await shot(joss, '21-podio-1');
await joss.keyboard.press('ArrowRight');
await wait(1200);
await shot(joss, '22-podio');
await shot(phones[0], '23-phone-final');
await phones[0].evaluate(() => scrollTo(0, 900));
await shot(phones[0], '24-phone-final-codes');
// Control remoto desde el panel de Alex
await alex.click('[data-tab="live"]');
await wait(400);
await alex.click('#prev');
await wait(1500);
const afterPrev = await joss.evaluate(() => document.querySelector('#stage section:last-child')?.id);
if (afterPrev !== 'comparativo') errors.push(`[alex] «Anterior» no movió la presentación (quedó en ${afterPrev})`);
await alex.click('#next');
await wait(1500);
await alex.click('[data-tab="table"]');
await wait(400);
await shot(alex, '25-alex-table');

console.log(errors.length ? `ERRORES:\n${errors.join('\n')}` : 'Sin errores de consola.');
await b.close();

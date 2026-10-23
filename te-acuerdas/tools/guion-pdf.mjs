// Arma el guion recomendado en PDF (para imprimir o leer en tablet) a partir de js/guion.js,
// el mismo que se ve en las notas de Joss y en el panel de Alex.
//   node tools/guion-pdf.mjs   → guion/Guion-Te-acuerdas.pdf
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const { GUION } = await import(pathToFileURL(join(app, 'js/guion.js')));
const { WORDS } = await import(pathToFileURL(join(app, 'js/game.js')));
const order = JSON.parse(readFileSync(join(app, 'slides/deck.json'), 'utf8')).order;

const T = {
  cover: '¿TE ACUERDAS?', sala: '¡SAQUEN EL CELULAR!', despierta: '¡HOLA, CEREBROS!', reglas: 'ASÍ SE JUEGA HOY',
  'ronda-1': 'PORTADA · RONDA 1: TU MEMORIA', gancho: '¿QUÉ RECUERDAS DE LA ÚLTIMA CAPACITACIÓN?', memoria: '3 PASOS PARA RECORDAR ALGO',
  miller: 'TU LÍMITE: 7 COSAS A LA VEZ', chunk: 'MEMORIZA ESTE NÚMERO', 'chunk-res': '¿QUIÉN SE LO SUPO?', 'chunk-truco': 'AGRÚPALO',
  'ronda-2': 'PORTADA · RONDA 2: EL OLVIDO', adivina: '¿CUÁNTO OLVIDAS EN UN DÍA?', curva: 'LA CURVA DEL OLVIDO', repaso: 'CÓMO LE GANAS A LA CURVA',
  'ronda-3': 'PORTADA · RONDA 3: MITOS', mitos: '¿VERDADERO O FALSO?', 'mito-1': 'MITO 1: RELEER', 'mito-2': 'MITO 2: DORMIR',
  'mito-3': 'MITO 3: TU ESTILO', 'mito-4': 'MITO 4: RECORDAR SIN VER', funciona: 'LO QUE SÍ FUNCIONA',
  'ronda-final': 'PORTADA · LA FINAL: EL RETO', reto: 'EL RETO DE LAS 20 PALABRAS', escribe: 'ESCRIBE DEL 1 AL 20', resultados: '¿CUÁNTAS SACASTE?',
  serial: 'EL HOYO DEL MEDIO', revela: '¿POR QUÉ CALCETINES ERA EL 2?', 'codigo-1': 'EL CÓDIGO SECRETO · 1 AL 5', 'codigo-2': 'EL CÓDIGO SECRETO · 6 AL 10',
  'codigo-3': 'EL CÓDIGO SECRETO · 11 AL 15', 'codigo-4': 'EL CÓDIGO SECRETO · 16 AL 20', segunda: 'LAS 20 OTRA VEZ… EN DESORDEN',
  comparativo: 'ANTES Y DESPUÉS DEL CÓDIGO', podio: '¿QUIÉN SE ACORDÓ DE MÁS?', porque: '¿POR QUÉ FUNCIONÓ?', 'gancho-final': 'NO TIENES MALA MEMORIA',
  cierre: 'TU TURNO', muro: 'EL MURO DEL GRUPO', llevar: 'PARA LLEVAR', resumen: '¡GRACIAS, CEREBROS!',
};
const SECTIONS = [
  ['Arranque', '0:00–5:30', 'Joss abre, la gente entra a la sala con su celular y los dos se presentan.', ['cover', 'sala', 'despierta', 'reglas']],
  ['Ronda 1 · Tu memoria', '5:30–14:00', 'El grupo comprueba en carne propia el límite de unas 7 cosas y cómo agrupar lo rompe.', ['ronda-1', 'gancho', 'memoria', 'miller', 'chunk', 'chunk-res', 'chunk-truco']],
  ['Ronda 2 · El olvido', '14:00–18:30', 'Sin repaso se olvidan dos terceras partes en un día; la curva y el repaso espaciado lo explican.', ['ronda-2', 'adivina', 'curva', 'repaso']],
  ['Ronda 3 · Mitos', '18:30–23:30', 'Cuatro frases de verdadero o falso; cada celular dice si le atinó.', ['ronda-3', 'mitos', 'mito-1', 'mito-2', 'mito-3', 'mito-4', 'funciona']],
  ['La final · El reto de las 20 palabras', '23:30–31:00', 'Las palabras avanzan solas cada 5 segundos y se turnan para leerlas.', ['ronda-final', 'reto', 'WORDS', 'escribe', 'resultados', 'serial', 'revela']],
  ['El código y la segunda ronda', '31:00–40:00', 'Se revela por qué cada palabra estaba en su número y la segunda ronda muestra la mejora.', ['codigo-1', 'codigo-2', 'codigo-3', 'codigo-4', 'segunda', 'comparativo', 'podio']],
  ['Cierre', '40:00–47:30', 'Cada quien cuelga algo de su trabajo de un gancho de su área y se lleva su recuerdo en PDF.', ['porque', 'gancho-final', 'cierre', 'muro', 'llevar', 'resumen']],
];

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Las acotaciones entre paréntesis van en cursiva gris: no se dicen en voz alta.
const say = (t) => esc(t).replace(/\(([^)]*)\)/g, '<em>($1)</em>');
const N = { J: 'JOSS', A: 'ALEX' };

function slideCard(id) {
  const g = GUION[id];
  const n = order.indexOf(id) + 1;
  const beats = g.beats.map((b) => `
    <div class="beat">
      <p class="cue ${b.click ? 'click' : ''}">${b.click ? `<span>CLIC ${b.click}</span>` : ''}${esc(b.cue)}</p>
      ${b.lines.map(([w, t]) => `<div class="line ${w === 'J' ? 'j' : 'a'}"><b>${N[w]}</b><p>${say(t)}</p></div>`).join('')}
    </div>`).join('');
  return `<article class="slide">
    <header><span class="n">${n}</span><h3>${esc(T[id] || id)}</h3>${g.t ? `<span class="t">${esc(g.t)}</span>` : ''}</header>
    ${beats}
    ${g.tip ? `<p class="tip"><b>Cómo funciona</b> ${esc(g.tip)}</p>` : ''}
  </article>`;
}

function wordsCard() {
  const first = order.indexOf('p01') + 1;
  return `<article class="slide">
    <header><span class="n">${first}–${first + 19}</span><h3>LAS 20 PALABRAS</h3><span class="t">24:15–26:00</span></header>
    <p class="intro">Nadie toca nada: cada palabra avanza sola en 5 segundos. Lean solo el número y la palabra, sin explicar. En la 20 se detiene y el siguiente clic lleva a escribir. La última columna es para ustedes: se revela hasta el código.</p>
    <table><thead><tr><th>Núm.</th><th>Lo lee</th><th>Dice</th><th>Por qué (no decirlo aún)</th></tr></thead><tbody>
      ${WORDS.map((w) => { const [who, line] = GUION['p' + String(w.n).padStart(2, '0')].beats[0].lines[0]; return `<tr class="${who === 'J' ? 'j' : 'a'}"><td>${w.n}</td><td><b>${N[who]}</b></td><td>${esc(line)}</td><td>${esc(w.why)}</td></tr>`; }).join('')}
    </tbody></table>
  </article>`;
}

const fonts = pathToFileURL(join(app, 'fonts')).href;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Guion — ¿Te acuerdas?</title><style>
@font-face { font-family: 'Bowlby One'; src: url(${fonts}/bowlby-one-400.woff2) format('woff2'); }
@font-face { font-family: 'Rubik'; src: url(${fonts}/rubik-400.woff2) format('woff2'); font-weight: 400; }
@font-face { font-family: 'Rubik'; src: url(${fonts}/rubik-600.woff2) format('woff2'); font-weight: 500 600; }
@font-face { font-family: 'Rubik'; src: url(${fonts}/rubik-800.woff2) format('woff2'); font-weight: 700 900; }
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Rubik, Arial, sans-serif; color: #1d1530; font-size: 11pt; line-height: 1.45; }
h1, h2, h3, .display { font-family: 'Bowlby One', 'Arial Black', sans-serif; font-weight: 400; margin: 0; }
.cover { min-height: 262mm; display: flex; flex-direction: column; gap: 5mm; padding: 11mm 12mm; background: #160A26; color: #FFF4E0; border-radius: 6mm; break-after: page; }
.cover h1 { font-size: 40pt; line-height: 1; color: #C6F432; text-shadow: 3pt 3pt 0 #FF3E8E; }
.cover .sub { font-size: 15pt; font-weight: 800; color: #FF3E8E; letter-spacing: 1pt; }
.cover .lead { font-size: 12pt; color: #D9C9F2; margin: 0; }
.cover .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.cover .box { background: #2A1745; border: 2px solid #3B1766; border-radius: 4mm; padding: 4mm 5mm; }
.cover .box h4 { margin: 0 0 2mm; font-size: 10pt; letter-spacing: 1pt; color: #C6F432; }
.cover .box p { margin: 0 0 1.2mm; font-size: 10pt; color: #FFF4E0; }
.legend { display: flex; flex-direction: column; gap: 2.5mm; }
.legend p { margin: 0; display: flex; gap: 3mm; align-items: center; font-size: 10.5pt; }
.chip { display: inline-block; white-space: nowrap; min-width: 16mm; text-align: center; font-weight: 800; font-size: 9pt; letter-spacing: .8pt; padding: 1mm 2.5mm; border-radius: 99px; }
.chip.j { background: #FF3E8E; color: #160A26; } .chip.a { background: #C6F432; color: #160A26; } .chip.c { background: #160A26; color: #FFF4E0; border: 1.5px solid #FFF4E0; } .chip.t { background: #FFF4E0; color: #160A26; }
.check { margin: 0; padding-left: 5mm; } .check li { margin: 0 0 1mm; font-size: 10pt; }
.cover .foot { margin-top: auto; font-size: 9.5pt; color: #b3a3cf; }
section.part { break-before: page; }
section.part > h2 { font-size: 20pt; color: #160A26; text-shadow: 2pt 2pt 0 #C6F432; }
section.part > .time { margin: 1mm 0 1mm; font-weight: 800; color: #FF3E8E; letter-spacing: .8pt; font-size: 10pt; }
section.part > .lead { margin: 0 0 5mm; color: #4b3d63; }
.slide { break-inside: avoid; border: 1.5px solid #e2d8f2; border-radius: 4mm; padding: 3.5mm 4.5mm 3mm; margin: 0 0 4mm; background: #fff; }
.slide header { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
.slide header .n { font-family: 'Bowlby One', sans-serif; font-size: 11pt; background: #160A26; color: #C6F432; border-radius: 99px; padding: .6mm 3mm; white-space: nowrap; }
.slide header h3 { font-size: 11.5pt; color: #160A26; flex: 1; letter-spacing: .3pt; }
.slide header .t { font-size: 9pt; font-weight: 800; color: #7a6a95; white-space: nowrap; }
.beat { margin: 1.5mm 0 0; }
.cue { margin: 0 0 1.2mm; font-size: 8.5pt; font-weight: 800; letter-spacing: .8pt; color: #7a6a95; text-transform: uppercase; display: flex; align-items: center; gap: 2mm; }
.cue.click { color: #160A26; }
.cue.click span { background: #FF3E8E; color: #fff; border-radius: 99px; padding: .4mm 2.2mm; letter-spacing: 1pt; }
.line { display: grid; grid-template-columns: 15mm 1fr; gap: 2.5mm; align-items: baseline; margin: 0 0 1.2mm; }
.line b { font-size: 8.5pt; letter-spacing: 1pt; text-align: center; border-radius: 99px; padding: .5mm 0; }
.line.j b { background: #FF3E8E; color: #fff; } .line.a b { background: #C6F432; color: #160A26; }
.line p { margin: 0; font-size: 11pt; }
.line em { color: #8a7aa5; font-style: italic; }
.tip { margin: 2mm 0 0; font-size: 9pt; color: #5b4b70; background: #f6f1fd; border: 1px dashed #c9b8e6; border-radius: 2.5mm; padding: 1.8mm 3mm; }
.tip b { color: #FF3E8E; letter-spacing: .6pt; text-transform: uppercase; font-size: 8pt; margin-right: 1.5mm; }
.intro { margin: 0 0 2mm; font-size: 10pt; color: #4b3d63; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
th { text-align: left; font-size: 8pt; letter-spacing: .8pt; color: #7a6a95; text-transform: uppercase; border-bottom: 1.5px solid #e2d8f2; padding: 1mm 1.5mm; }
td { padding: .9mm 1.5mm; border-bottom: 1px solid #f0eaf8; }
tr.j td b { color: #FF3E8E; } tr.a td b { color: #5b7a00; }
td:first-child { font-family: 'Bowlby One', sans-serif; color: #160A26; width: 10mm; }
</style></head><body>
<div class="cover">
  <p class="sub">CAPACITACIÓN INTERNA · GUION RECOMENDADO</p>
  <h1>¿TE ACUERDAS?<br>EL JUEGO</h1>
  <p class="lead">Aprender a aprender: por qué olvidamos casi todo… y cómo hacer que se quede. Unos 47 minutos y 61 diapositivas, con juego en vivo desde el celular.</p>
  <div class="grid">
    <div class="box"><h4>QUIÉN HACE QUÉ</h4>
      <p><b>Joss</b> conduce y da todos los clics. Lee su parte en las notas (tecla N).</p>
      <p><b>Alex</b> co-conduce: lleva el reloj, lee resultados y nombres, y cuida las respuestas desde su panel. Mueve la presentación solo si algo falla.</p>
      <p>Los dos explican, los dos bromean: el diálogo está repartido casi en partes iguales. Este mismo guion sale en las notas de Joss y en el panel de Alex, con el clic en que van marcado en verde.</p>
    </div>
    <div class="box legend"><h4>CÓMO LEER ESTE GUION</h4>
      <p><span class="chip j">JOSS</span> lo que dice Joss</p>
      <p><span class="chip a">ALEX</span> lo que dice Alex</p>
      <p><span class="chip c">CLIC 2</span> el momento exacto de cada clic de Joss</p>
      <p><span class="chip t">(gris)</span> acotaciones: se hacen, no se dicen</p>
    </div>
  </div>
  <div class="box"><h4>ANTES DE EMPEZAR</h4>
    <ol class="check">
      <li>Abrir la presentación, recargar con Ctrl + Shift + R y crear una sala nueva. Si sale el aviso rojo, pegar database.rules.json en Firebase y publicar.</li>
      <li>Mandar a Alex el link de su panel por privado y abrir las notas (botón «Abrir mis notas» o tecla N).</li>
      <li>Compartir solo la pestaña de la presentación, con «compartir audio de la pestaña» activado.</li>
      <li>Probar con un celular: entrar, mandar una reacción y ver que suene.</li>
      <li>En el chat, pedir que abran el link en Safari o Chrome (no dentro de WhatsApp).</li>
    </ol>
    <p style="margin-top:2mm"><b>Teclas de Joss:</b> → o clic, siguiente · ←, anterior · F, pantalla completa · N, notas · P, pausa de las 20 palabras · S, sonido · M, menú y links.</p>
  </div>
</div>
${SECTIONS.map(([h, t, lead, ids]) => `<section class="part"><h2>${esc(h)}</h2><p class="time">${esc(t)}</p><p class="lead">${esc(lead)}</p>
  ${ids.map((id) => (id === 'WORDS' ? wordsCard() : slideCard(id))).join('')}</section>`).join('')}
</body></html>`;

const out = join(app, 'tools/out/guion.html');
writeFileSync(out, html);
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(out).href);
await p.evaluate(() => document.fonts.ready);
await p.pdf({
  path: join(app, 'guion/Guion-Te-acuerdas.pdf'),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-family:Arial;font-size:8px;color:#8a7aa5;padding:0 14mm;display:flex;justify-content:space-between"><span>¿Te acuerdas? · Guion de Joss y Alex</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
  margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
});
await b.close();
console.log('guion/Guion-Te-acuerdas.pdf');

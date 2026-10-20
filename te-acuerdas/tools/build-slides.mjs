// Junta slides/*.html en js/slides-data.js en el orden de slides/deck.json.
// Correr después de editar cualquier diapositiva:  node tools/build-slides.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const deck = JSON.parse(readFileSync(join(app, 'slides/deck.json'), 'utf8'));
const slides = deck.order.map((id) => {
  const html = readFileSync(join(app, `slides/${id}.html`), 'utf8').trim();
  const m = html.match(/^<section id="([^"]+)"/);
  if (!m || m[1] !== id) throw new Error(`slides/${id}.html debe empezar con <section id="${id}"`);
  return { id, html };
});
writeFileSync(
  join(app, 'js/slides-data.js'),
  `// Generado por tools/build-slides.mjs desde slides/*.html. No editar a mano.\n` +
    `export const DECK_TITLE = ${JSON.stringify(deck.title)};\n` +
    `export const SLIDES = ${JSON.stringify(slides)};\n`,
);
console.log(`${slides.length} diapositivas → js/slides-data.js`);

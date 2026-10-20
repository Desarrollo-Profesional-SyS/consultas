// Copia a la app todo lo que viene de npm, para que en vivo no dependa de ningún CDN:
// Firebase (empaquetado con esbuild), el generador de QR, las fuentes y los íconos.
import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const nm = join(here, 'node_modules');

mkdirSync(join(app, 'vendor'), { recursive: true });
mkdirSync(join(app, 'fonts'), { recursive: true });

// 1. Firebase: solo lo que usamos (app, auth anónima y Realtime Database).
await build({
  stdin: {
    contents: `
      export { initializeApp } from 'firebase/app';
      export { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
      export { getDatabase, ref, onValue, set, update, remove, get, onDisconnect } from 'firebase/database';
    `,
    resolveDir: here,
    loader: 'js',
  },
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2020',
  legalComments: 'eof',
  outfile: join(app, 'vendor/firebase.js'),
});

// 2. QR (MIT, Kazuhiko Arase).
copyFileSync(join(nm, 'qrcode-generator/dist/qrcode.mjs'), join(app, 'vendor/qrcode.mjs'));

// 3. Fuentes (SIL OFL): Bowlby One y Rubik, subconjunto latino (cubre acentos, ñ, ¿ y ¡).
copyFileSync(join(nm, '@fontsource/bowlby-one/files/bowlby-one-latin-400-normal.woff2'), join(app, 'fonts/bowlby-one-400.woff2'));
for (const w of [400, 600, 800]) {
  copyFileSync(join(nm, `@fontsource/rubik/files/rubik-latin-${w}-normal.woff2`), join(app, `fonts/rubik-${w}.woff2`));
}

// 4. Íconos (Lucide, ISC): se guardan solo los trazos internos de cada SVG.
const ICONS = {
  // Los de las diapositivas (<x-icon name="…">)
  Lightbulb: 'lightbulb', Clock: 'clock', Chat: 'message-circle', Lock: 'lock', Link: 'link', Key: 'key-round',
  // Los de la interfaz
  check: 'check', x: 'x', users: 'users', play: 'play', pause: 'pause', plus: 'plus', reset: 'rotate-ccw',
  trophy: 'trophy', copy: 'copy', open: 'external-link', prev: 'chevron-left', next: 'chevron-right',
  wifi: 'wifi', wifiOff: 'wifi-off', fullscreen: 'maximize', notes: 'notebook-pen', bot: 'bot', trash: 'trash-2',
  timer: 'timer', eye: 'eye', send: 'send', crown: 'crown', sparkles: 'sparkles', edit: 'square-pen',
  kick: 'user-x', refresh: 'refresh-cw', monitor: 'monitor', phone: 'smartphone', qr: 'qr-code',
  sound: 'volume-2', mute: 'volume-x',
};
const out = {};
for (const [name, file] of Object.entries(ICONS)) {
  const svg = readFileSync(join(nm, `lucide-static/icons/${file}.svg`), 'utf8');
  out[name] = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>')).replace(/\s+/g, ' ').trim();
}
writeFileSync(
  join(app, 'js/icons.js'),
  `// Generado por tools/vendor.mjs a partir de Lucide (ISC). No editar a mano.\n` +
  `export const ICON_PATHS = ${JSON.stringify(out, null, 1)};\n\n` +
  `export function icon(name, size = 24, extra = '') {\n` +
  `  const p = ICON_PATHS[name] || '';\n` +
  `  return \`<svg class="ico" \${extra} xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${p}</svg>\`;\n` +
  `}\n`,
);

console.log('Listo: vendor/firebase.js, vendor/qrcode.mjs, fuentes e íconos.');

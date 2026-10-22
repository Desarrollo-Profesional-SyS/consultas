// Avatares: versiones de Memo (el cerebro de la presentación). Cada jugador elige
// un cerebro (accesorio y expresión) y un color. Se dibujan como SVG, sin imágenes.
// El avatar se guarda como un solo número: cerebro + 32 × (color + 1).
// Los números menores que 32 son de la versión anterior: cerebro con su color de siempre.

const INK = '#07030D';
const CREAM = '#FFF4E0';

const BODIES = [
  ['#FF7BB0', '#D9407F'], // rosa (Memo original)
  ['#C6F432', '#86AD12'], // lima
  ['#7FD3FF', '#3B9AD1'], // cielo
  ['#FF9F1C', '#C96E00'], // naranja
  ['#B69CFF', '#7C5BE0'], // lila
  ['#FFD23F', '#C99A00'], // amarillo
  ['#5EE6A8', '#1FA86C'], // menta
  ['#FF6B5E', '#CC3A2D'], // coral
  ['#8C9BFF', '#5566D9'], // azul
  ['#F3E6CF', '#C9AE84'], // hueso
];

export const COLORS = [
  { name: 'Rosa', body: 0 }, { name: 'Lima', body: 1 }, { name: 'Cielo', body: 2 }, { name: 'Naranja', body: 3 },
  { name: 'Lila', body: 4 }, { name: 'Amarillo', body: 5 }, { name: 'Menta', body: 6 }, { name: 'Coral', body: 7 },
  { name: 'Azul', body: 8 }, { name: 'Hueso', body: 9 },
].map((c) => ({ ...c, hex: BODIES[c.body][0] }));

export const AVATARS = [
  { name: 'Memo', body: 0, acc: 'none', eyes: 'classic', mouth: 'grin' },
  { name: 'Lentes', body: 1, acc: 'glasses', eyes: 'classic', mouth: 'grin' },
  { name: 'Gorra', body: 2, acc: 'cap', eyes: 'wink', mouth: 'grin' },
  { name: 'Corona', body: 3, acc: 'crown', eyes: 'classic', mouth: 'open' },
  { name: 'Moño', body: 4, acc: 'bow', eyes: 'happy', mouth: 'grin' },
  { name: 'Audífonos', body: 5, acc: 'headphones', eyes: 'happy', mouth: 'grin' },
  { name: 'Fiesta', body: 6, acc: 'party', eyes: 'classic', mouth: 'tongue' },
  { name: 'Bigote', body: 7, acc: 'mustache', eyes: 'classic', mouth: 'none' },
  { name: 'Lentes de sol', body: 2, acc: 'shades', eyes: 'none', mouth: 'grin' },
  { name: 'Flor', body: 1, acc: 'flower', eyes: 'happy', mouth: 'grin' },
  { name: 'Curita', body: 3, acc: 'bandaid', eyes: 'wink', mouth: 'tongue' },
  { name: 'Gorro', body: 0, acc: 'beanie', eyes: 'classic', mouth: 'open' },
  { name: 'Cuernitos', body: 7, acc: 'horns', eyes: 'wink', mouth: 'grin' },
  { name: 'Aureola', body: 4, acc: 'halo', eyes: 'happy', mouth: 'grin' },
  { name: 'Chef', body: 6, acc: 'chef', eyes: 'classic', mouth: 'grin' },
  { name: 'Vaquero', body: 5, acc: 'cowboy', eyes: 'classic', mouth: 'tongue' },
  { name: 'Birrete', body: 8, acc: 'grad', eyes: 'happy', mouth: 'grin' },
  { name: 'Pirata', body: 7, acc: 'pirate', eyes: 'classic', mouth: 'tongue' },
  { name: 'Gatito', body: 9, acc: 'cat', eyes: 'happy', mouth: 'open' },
  { name: 'Antenas', body: 6, acc: 'antennae', eyes: 'classic', mouth: 'grin' },
];

const LOBES = [
  [130, 170, 78], [200, 128, 82], [272, 168, 78], [158, 238, 72], [244, 238, 72], [200, 205, 88],
];

function brain(fill, fold) {
  const outline = LOBES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 9}"/>`).join('');
  const lobes = LOBES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return `<g fill="${INK}" transform="translate(10 10)">${outline}</g><g fill="${INK}">${outline}</g>` +
    `<g fill="${fill}">${lobes}</g>` +
    `<g fill="none" stroke="${fold}" stroke-width="8" stroke-linecap="round"><path d="M105 140 q18 -18 36 0 q18 18 36 0"/><path d="M210 95 q14 22 40 14"/><path d="M268 130 q22 10 26 34"/><path d="M110 215 q-6 22 10 36"/><path d="M290 228 q10 22 -4 40"/></g>`;
}

function eyes(kind) {
  const whites = `<circle cx="162" cy="185" r="44" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><circle cx="252" cy="176" r="31" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>`;
  const arc = (cx, cy, w) => `<path d="M${cx - w} ${cy + 6} Q${cx} ${cy - w * 0.9} ${cx + w} ${cy + 6}" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>`;
  if (kind === 'none') return '';
  if (kind === 'happy') return arc(162, 190, 30) + arc(252, 180, 22);
  if (kind === 'wink') return `<circle cx="162" cy="185" r="44" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><circle cx="170" cy="192" r="19" fill="${INK}"/><circle cx="176" cy="185" r="6" fill="${CREAM}"/>` + arc(252, 180, 22);
  return whites + `<circle cx="170" cy="192" r="19" fill="${INK}"/><circle cx="247" cy="181" r="13" fill="${INK}"/><circle cx="176" cy="185" r="6" fill="${CREAM}"/><circle cx="251" cy="177" r="4" fill="${CREAM}"/>`;
}

function mouth(kind) {
  if (kind === 'none') return `<path d="M175 268 Q205 284 235 266" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`;
  if (kind === 'open') return `<ellipse cx="208" cy="268" rx="26" ry="22" fill="${INK}"/><ellipse cx="208" cy="278" rx="14" ry="8" fill="#FF3E8E"/>`;
  const base = `<path d="M150 252 Q205 268 268 246 Q212 312 150 252 Z" fill="${INK}"/>`;
  const teeth = `<rect x="186" y="257" width="15" height="13" fill="${CREAM}"/><rect x="214" y="256" width="15" height="12" fill="${CREAM}"/>`;
  if (kind === 'tongue') return base + teeth + `<path d="M196 274 q14 34 34 0 Z" fill="#FF3E8E" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  return base + `<ellipse cx="212" cy="276" rx="20" ry="7" fill="#FF3E8E"/>` + teeth;
}

const S = `stroke="${INK}" stroke-width="9" stroke-linejoin="round"`;

const ACC = {
  none: '',
  glasses: `<g fill="none" stroke="${INK}" stroke-width="10"><circle cx="162" cy="185" r="54"/><circle cx="252" cy="176" r="42"/><path d="M214 180 h-2"/><path d="M108 176 L58 156"/><path d="M294 170 L348 148"/></g><path d="M132 160 q12 -14 28 -16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>`,
  shades: `<path d="M98 150 H222 V200 Q222 236 186 236 H134 Q98 236 98 200 Z" fill="${INK}"/><path d="M232 146 H312 V188 Q312 222 280 222 H262 Q232 222 232 192 Z" fill="${INK}"/><path d="M222 166 H232" stroke="${INK}" stroke-width="12"/><path d="M118 168 l28 0 M248 162 l22 0" stroke="#7FD3FF" stroke-width="9" stroke-linecap="round"/>`,
  cap: `<path d="M98 112 C98 -42 302 -42 302 112 Z" fill="#FF3E8E" ${S}/><path d="M200 -4 V110" stroke="${INK}" stroke-width="6" opacity=".35"/><path d="M290 102 Q356 92 392 124 Q344 132 292 124 Z" fill="#FF3E8E" ${S}/><circle cx="200" cy="-6" r="12" fill="#C6F432" ${S}/>`,
  beanie: `<path d="M96 120 C96 -40 304 -40 304 120 Z" fill="#7FD3FF" ${S}/><rect x="86" y="94" width="228" height="40" rx="18" fill="#3B9AD1" ${S}/><circle cx="200" cy="-24" r="26" fill="${CREAM}" ${S}/>`,
  crown: `<path d="M118 92 L126 -4 L170 46 L205 -30 L240 46 L284 -4 L292 92 Z" fill="#FFD23F" ${S}/><circle cx="205" cy="62" r="13" fill="#FF3E8E" stroke="${INK}" stroke-width="6"/><circle cx="150" cy="70" r="9" fill="#7FD3FF" stroke="${INK}" stroke-width="5"/><circle cx="260" cy="70" r="9" fill="#5EE6A8" stroke="${INK}" stroke-width="5"/>`,
  bow: `<g transform="translate(296 62) rotate(18)"><path d="M0 0 L-62 -40 L-62 40 Z" fill="#FF3E8E" ${S}/><path d="M0 0 L62 -40 L62 40 Z" fill="#FF3E8E" ${S}/><circle r="18" fill="#FFD23F" ${S}/></g>`,
  headphones: `<path d="M64 210 C52 -6 348 -16 338 196" fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M64 210 C52 -6 348 -16 338 196" fill="none" stroke="#FF3E8E" stroke-width="14" stroke-linecap="round"/><rect x="30" y="166" width="62" height="96" rx="26" fill="#FF3E8E" ${S}/><rect x="310" y="152" width="62" height="96" rx="26" fill="#FF3E8E" ${S}/>`,
  party: `<path d="M150 88 L212 -58 L270 78 Z" fill="#B69CFF" ${S}/><path d="M168 52 L246 24 M184 12 L232 -6" stroke="#FFD23F" stroke-width="12" stroke-linecap="round"/><circle cx="212" cy="-60" r="20" fill="#FFD23F" ${S}/>`,
  mustache: `<path d="M206 240 C186 214 140 222 134 254 C160 236 186 252 206 250 C226 252 252 236 280 252 C272 220 226 214 206 240 Z" fill="${INK}"/>`,
  flower: `<g transform="translate(96 70)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-30" rx="20" ry="30" transform="rotate(${a})" fill="${CREAM}" stroke="${INK}" stroke-width="7"/>`).join('')}<circle r="18" fill="#FFD23F" stroke="${INK}" stroke-width="7"/></g>`,
  bandaid: `<g transform="rotate(-24 230 66)"><rect x="170" y="44" width="124" height="44" rx="22" fill="#F2B48C" stroke="${INK}" stroke-width="8"/><rect x="214" y="48" width="36" height="36" fill="#E09A6E"/><circle cx="190" cy="66" r="4" fill="${INK}"/><circle cx="276" cy="66" r="4" fill="${INK}"/></g>`,
  horns: `<path d="M120 76 Q96 6 136 -22 Q140 28 172 56 Z" fill="#FF3E8E" ${S}/><path d="M280 72 Q306 2 268 -26 Q262 24 232 52 Z" fill="#FF3E8E" ${S}/>`,
  halo: `<ellipse cx="204" cy="-6" rx="86" ry="24" fill="none" stroke="${INK}" stroke-width="26"/><ellipse cx="204" cy="-6" rx="86" ry="24" fill="none" stroke="#FFD23F" stroke-width="12"/>`,
  chef: `<g fill="${CREAM}" ${S}><circle cx="148" cy="20" r="44"/><circle cx="252" cy="20" r="44"/><circle cx="200" cy="-10" r="50"/><rect x="120" y="30" width="160" height="70" rx="10"/></g><path d="M140 34 V96 M200 34 V96 M260 34 V96" stroke="${INK}" stroke-width="5" opacity=".3"/>`,
  grad: `<path d="M130 70 V108 Q205 132 280 108 V70 Z" fill="#2A1745" ${S}/><path d="M80 52 L205 4 L330 52 L205 100 Z" fill="#160A26" ${S}/><path d="M205 52 L300 74 L304 124" fill="none" stroke="${INK}" stroke-width="6"/><path d="M296 120 h18 l-4 34 h-10 Z" fill="#C6F432" stroke="${INK}" stroke-width="5"/><circle cx="205" cy="52" r="9" fill="#C6F432" stroke="${INK}" stroke-width="5"/>`,
  pirate: `<path d="M96 112 C104 6 306 6 314 112 Q205 84 96 112 Z" fill="#FF3E8E" ${S}/><circle cx="160" cy="62" r="7" fill="${CREAM}"/><circle cx="206" cy="44" r="7" fill="${CREAM}"/><circle cx="254" cy="60" r="7" fill="${CREAM}"/><path d="M308 96 l40 -10 l-12 34 Z" fill="#FF3E8E" ${S}/><path d="M118 132 L330 200" stroke="${INK}" stroke-width="8"/><ellipse cx="254" cy="178" rx="38" ry="32" fill="${INK}"/>`,
  cat: `<path d="M86 104 Q205 40 324 104" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M112 96 L128 -6 L196 58 Z" fill="#2A1745" ${S}/><path d="M214 58 L282 -6 L298 96 Z" fill="#2A1745" ${S}/><path d="M134 72 L140 22 L176 56 Z" fill="#FF7BB0"/><path d="M234 56 L270 22 L276 72 Z" fill="#FF7BB0"/><path d="M196 252 l-34 -6 M196 260 l-36 6 M226 252 l34 -6 M226 260 l36 6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  antennae: `<path d="M160 70 Q140 20 112 -10" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M250 64 Q272 14 300 -14" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><circle cx="110" cy="-14" r="20" fill="#C6F432" ${S}/><circle cx="302" cy="-18" r="20" fill="#FF3E8E" ${S}/>`,
  cowboy: `<ellipse cx="200" cy="92" rx="190" ry="34" fill="#C96E00" ${S}/><path d="M118 92 C118 -40 282 -40 282 92 Z" fill="#FF9F1C" ${S}/><path d="M122 70 H278" stroke="#FF3E8E" stroke-width="16"/><path d="M200 6 Q200 30 200 50" stroke="${INK}" stroke-width="7" opacity=".35"/>`,
};

const cache = new Map();

export const STYLE_COUNT = AVATARS.length;
export const COLOR_COUNT = COLORS.length;
export const encodeAvatar = (style, color) => style + 32 * (color + 1);

// número guardado → { style, color } (color = null: el de siempre de ese cerebro)
export function decodeAvatar(v) {
  const n = Math.max(0, Math.floor(+v || 0));
  const style = (n % 32) % STYLE_COUNT;
  const color = n >= 32 ? (Math.floor(n / 32) - 1) % COLOR_COUNT : null;
  return { style, color };
}

export function avatarSVG(i, { size = 96, title = '' } = {}) {
  const { style, color } = decodeAvatar(i);
  const a = AVATARS[style];
  const key = `${style}-${color}`;
  if (!cache.has(key)) {
    const [fill, fold] = BODIES[color === null ? a.body : COLORS[color].body];
    // Lo que va sobre la cabeza se dibuja después; los lentes y el bigote, sobre la cara.
    cache.set(key, brain(fill, fold) + eyes(a.eyes) + mouth(a.mouth) + ACC[a.acc]);
  }
  const label = title || `Avatar ${a.name}`;
  return `<svg class="av" viewBox="-14 -74 432 432" width="${size}" height="${size}" role="img" aria-label="${label.replace(/"/g, '&quot;')}" xmlns="http://www.w3.org/2000/svg">${cache.get(key)}</svg>`;
}

export const AVATAR_COUNT = AVATARS.length;

export function randomAvatar(rand = Math.random) {
  return encodeAvatar(Math.floor(rand() * STYLE_COUNT), Math.floor(rand() * COLOR_COUNT));
}

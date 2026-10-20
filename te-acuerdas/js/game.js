// Reglas del juego: las 20 palabras, cómo se califica una respuesta escrita a mano
// y cómo se arma la tabla de posiciones. No toca la red: lo usan la presentación,
// el panel de Alex y los celulares por igual, así todos calculan lo mismo.

export const WORDS = [
  { n: 1, word: 'Sol', why: 'Solo hay uno', accept: ['sol', 'soles'] },
  { n: 2, word: 'Calcetines', why: 'Siempre van en par', accept: ['calcetines', 'calcetin', 'calceta', 'calcetas', 'medias', 'media', 'par de calcetines'] },
  { n: 3, word: 'Semáforo', why: 'Tres luces', accept: ['semaforo', 'semaforos'] },
  { n: 4, word: 'Carro', why: 'Cuatro llantas', accept: ['carro', 'carros', 'coche', 'coches', 'auto', 'autos', 'automovil', 'carrito'] },
  { n: 5, word: 'Estrella', why: 'Cinco picos', accept: ['estrella', 'estrellas'] },
  { n: 6, word: 'Hormiga', why: 'Seis patas', accept: ['hormiga', 'hormigas'] },
  { n: 7, word: 'Arcoíris', why: 'Siete colores', accept: ['arcoiris', 'arco iris'] },
  { n: 8, word: 'Pulpo', why: 'Ocho tentáculos', accept: ['pulpo', 'pulpos'] },
  { n: 9, word: 'Bebé', why: 'Nueve meses de embarazo', accept: ['bebe', 'bebes', 'baby'] },
  { n: 10, word: 'Manos', why: 'Diez dedos', accept: ['manos', 'mano'] },
  { n: 11, word: 'Balón', why: 'Once jugadores en la cancha', accept: ['balon', 'balones', 'pelota', 'pelotas', 'balon de futbol'] },
  { n: 12, word: 'Reloj', why: 'Doce horas en la carátula', accept: ['reloj', 'relojes'] },
  { n: 13, word: 'Martes', why: 'Martes 13, día de mala suerte', accept: ['martes', 'martes 13'] },
  { n: 14, word: 'Corazón', why: '14 de febrero', accept: ['corazon', 'corazones'] },
  { n: 15, word: 'Vestido', why: 'Fiesta de XV años', accept: ['vestido', 'vestidos', 'vestido de xv'] },
  { n: 16, word: 'Bandera', why: '16 de septiembre', accept: ['bandera', 'banderas', 'bandera de mexico'] },
  { n: 17, word: 'Urna de votación', why: 'Voto de la mujer en México (17 de octubre de 1953)', accept: ['urna', 'urna de votacion', 'urna electoral', 'urna para votar', 'urnas'] },
  { n: 18, word: 'Credencial', why: 'Mayoría de edad para votar', accept: ['credencial', 'credencial para votar', 'credencial de elector', 'ine', 'credencial ine', 'credencial del ine', 'ife'] },
  { n: 19, word: 'Cubrebocas', why: 'COVID-19', accept: ['cubrebocas', 'cubreboca', 'cubre bocas', 'tapabocas', 'mascarilla', 'barbijo'] },
  { n: 20, word: 'Pies y manos', why: 'Veinte dedos', accept: ['pies y manos', 'manos y pies'] },
];

export const N_WORDS = WORDS.length;

// Escalas de la diapositiva «¿Cuántas sacaste?»
export const RANGES = [
  { from: 0, to: 5 },
  { from: 6, to: 10 },
  { from: 11, to: 15 },
  { from: 16, to: 20 },
];

const STOP = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'e', 'para', 'mi', 'su']);

// "  Un SEMÁFORO!! " → "semaforo". Quita acentos, signos y artículos.
export function norm(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .join(' ');
}

// Llave segura para guardar una respuesta como nombre de nodo en la base de datos.
export const answerKey = (text) => norm(text).replace(/ /g, '_').slice(0, 60);

function lev(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Cuántos errores de dedo se perdonan según el largo de la palabra.
const tolerance = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

const VARIANTS = WORDS.map((w) => [...new Set(w.accept.map(norm))]);

// Qué tan bien se parece una respuesta (ya normalizada) a la palabra n:
// 3 = idéntica, 2 = con un error de dedo, 1 = la contiene («un carro rojo»), 0 = nada.
function quality(a, n) {
  let best = 0;
  const tokens = a.split(' ');
  for (const v of VARIANTS[n - 1]) {
    if (a === v) return 3;
    if (lev(a, v) <= tolerance(v.length)) best = Math.max(best, 2);
    else if (tokens.length <= 4) {
      if (` ${a} `.includes(` ${v} `)) best = Math.max(best, 1);
      else if (!v.includes(' ') && tokens.some((t) => t.length > 3 && lev(t, v) <= tolerance(v.length))) best = Math.max(best, 1);
    }
  }
  return best;
}

// ¿La respuesta escrita en la casilla n es correcta?
// overrides = { [n]: { [answerKey]: true|false } } — las correcciones de Alex mandan.
const verdicts = new Map(); // calificación automática ya calculada: "n|texto" → sí/no

export function isCorrect(n, text, overrides) {
  const a = norm(text);
  if (!a) return false;
  const o = overrides?.[n]?.[answerKey(text)];
  if (o === true || o === false) return o;
  const key = `${n}|${a}`;
  if (!verdicts.has(key)) {
    const q = quality(a, n);
    // Si se parece más a otra palabra de la lista, no cuenta aquí
    // (así «manos» en la 20 no vale: es la 10).
    let ok = q > 0;
    for (let m = 1; ok && m <= N_WORDS; m++) if (m !== n && quality(a, m) > q) ok = false;
    verdicts.set(key, ok);
  }
  return verdicts.get(key);
}

// Lo que el sistema decidiría sin la corrección de Alex (para mostrarlo en el panel).
export function autoVerdict(n, text) {
  return isCorrect(n, text, null);
}

// Calificación de una hoja: answers = { w1: 'sol', w2: '…', … }
export function gradeSheet(answers, overrides) {
  const hits = [];
  for (let n = 1; n <= N_WORDS; n++) if (isCorrect(n, answers?.['w' + n], overrides)) hits.push(n);
  return { score: hits.length, hits };
}

// El orden salteado de la segunda ronda: siempre el mismo para todos, nunca
// empieza en 1 y no deja dos números seguidos uno tras otro.
export function shuffledOrder(seed = Date.now()) {
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let attempt = 0; attempt < 500; attempt++) {
    const arr = Array.from({ length: N_WORDS }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr[0] !== 1 && arr.every((v, i) => i === 0 || Math.abs(v - arr[i - 1]) > 1)) return arr;
  }
  return [14, 8, 3, 19, 11, 6, 17, 1, 15, 9, 20, 5, 12, 2, 18, 10, 4, 16, 7, 13];
}

// Tabla completa a partir de jugadores, respuestas y correcciones.
// Devuelve filas ordenadas con su lugar.
export function buildTable(players, answers, overrides, kicked = {}) {
  const rows = Object.entries(players || {})
    .filter(([id, p]) => p && p.name && !kicked?.[id])
    .map(([id, p]) => {
      const a1 = answers?.[1]?.[id];
      const a2 = answers?.[2]?.[id];
      const g1 = gradeSheet(a1, overrides);
      const g2 = gradeSheet(a2, overrides);
      const played1 = !!a1;
      const played2 = !!a2;
      return {
        id,
        name: p.name,
        avatar: p.avatar ?? 0,
        bot: !!p.bot,
        online: p.online !== false,
        r1: g1.score,
        r2: g2.score,
        hits1: g1.hits,
        hits2: g2.hits,
        played1,
        played2,
        total: g1.score + g2.score,
        gain: played1 && played2 ? g2.score - g1.score : null,
        t2: a2?._t ?? Infinity,
        t1: a1?._t ?? Infinity,
      };
    });
  rows.sort((a, b) => b.total - a.total || b.r2 - a.r2 || a.t2 - b.t2 || a.t1 - b.t1 || a.name.localeCompare(b.name));
  // El orden ya desempata (ronda 2 y luego quién terminó primero), así que no hay lugares compartidos.
  rows.forEach((r, i) => { r.place = i + 1; });
  return rows;
}

// Promedios y datos para las diapositivas en vivo.
export function stats(rows, round) {
  const k = round === 1 ? 'r1' : 'r2';
  const played = rows.filter((r) => (round === 1 ? r.played1 : r.played2));
  const avg = played.length ? played.reduce((s, r) => s + r[k], 0) / played.length : 0;
  const byNumber = Array.from({ length: N_WORDS }, (_, i) => {
    const n = i + 1;
    const hits = played.filter((r) => (round === 1 ? r.hits1 : r.hits2).includes(n)).length;
    return played.length ? hits / played.length : 0;
  });
  const ranges = RANGES.map((g) => played.filter((r) => r[k] >= g.from && r[k] <= g.to));
  return { count: played.length, avg, byNumber, ranges };
}

// La mayor mejora entre ronda 1 y ronda 2 (null si nadie jugó ambas).
export function bestGain(rows) {
  const both = rows.filter((r) => r.gain !== null);
  if (!both.length) return null;
  return [...both].sort((a, b) => b.gain - a.gain || b.r2 - a.r2 || a.t2 - b.t2)[0];
}

// Etapas del juego según la diapositiva en pantalla (lo que ven los celulares).
export const STAGE_BY_SLIDE = {
  sala: 'lobby',
  reto: 'watch',
  escribe: 'r1',
  resultados: 'after1',
  serial: 'after1',
  revela: 'after1',
  'codigo-1': 'code',
  'codigo-2': 'code',
  'codigo-3': 'code',
  'codigo-4': 'code',
  segunda: 'r2',
  comparativo: 'final',
  podio: 'final',
};
for (let n = 1; n <= N_WORDS; n++) STAGE_BY_SLIDE['p' + String(n).padStart(2, '0')] = 'watch';

export function stageFor(slideId, slideIndex, lobbyIndex) {
  if (STAGE_BY_SLIDE[slideId]) return STAGE_BY_SLIDE[slideId];
  if (lobbyIndex >= 0 && slideIndex > lobbyIndex) return 'final';
  return 'pre';
}

export const clampName = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 18);

export function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Respuestas de práctica para los jugadores de ensayo (bots): recuerdan bien
// el principio y el final en la ronda 1, y casi todo en la ronda 2.
export function botSheet(round, rand = Math.random) {
  const sheet = {};
  const typo = (w) => {
    const t = norm(w);
    const r = rand();
    if (r < 0.15 && t.length > 5) return t.slice(0, -1);
    if (r < 0.3) return t;
    return w.toLowerCase();
  };
  for (let n = 1; n <= N_WORDS; n++) {
    const edge = Math.min(n - 1, N_WORDS - n);
    const p = round === 1 ? Math.max(0.1, 0.8 - edge * 0.11) : 0.86;
    if (rand() < p) sheet['w' + n] = typo(WORDS[n - 1].word);
    else if (rand() < 0.25) sheet['w' + n] = WORDS[Math.floor(rand() * N_WORDS)].word.toLowerCase();
  }
  return sheet;
}

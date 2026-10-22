// Reglas del juego: las 20 palabras, cómo se califica una respuesta escrita a mano
// y cómo se arma la tabla de posiciones. No toca la red: lo usan la presentación,
// el panel de Alex y los celulares por igual, así todos calculan lo mismo.

export const WORDS = [
  { n: 1, word: 'Sol', why: 'Solo hay uno', accept: ['sol', 'soles'] },
  { n: 2, word: 'Calcetines', why: 'Siempre van en par', accept: ['calcetines', 'calcetin', 'calceta', 'calcetas', 'medias', 'media', 'par de calcetines'] },
  { n: 3, word: 'Semáforo', why: 'Tres luces', accept: ['semaforo', 'semaforos'] },
  { n: 4, word: 'Carro', why: 'Cuatro llantas', accept: ['carro', 'carros', 'coche', 'coches', 'auto', 'autos', 'automovil', 'carrito'] },
  { n: 5, word: 'Estrella', why: 'Cinco picos', accept: ['estrella', 'estrellas'] },
  { n: 6, word: 'Dado', why: 'Seis caras', accept: ['dado', 'dados'] },
  { n: 7, word: 'Arcoíris', why: 'Siete colores', accept: ['arcoiris', 'arco iris'] },
  { n: 8, word: 'Infinito', why: 'Un 8 acostado', accept: ['infinito', 'simbolo de infinito', 'infinity', '∞', 'ocho acostado', '8 acostado'] },
  { n: 9, word: 'Bebé', why: 'Nueve meses de embarazo', accept: ['bebe', 'bebes', 'baby'] },
  { n: 10, word: 'Manos', why: 'Diez dedos', accept: ['manos', 'mano'] },
  { n: 11, word: 'Windows', why: 'Windows 11', accept: ['windows', 'windows 11', 'computadora', 'compu', 'ventana', 'ventanas', 'pc'] },
  { n: 12, word: 'Reloj', why: 'Doce horas en la carátula', accept: ['reloj', 'relojes'] },
  { n: 13, word: 'Martes', why: 'Martes 13, día de mala suerte', accept: ['martes', 'martes 13'] },
  { n: 14, word: 'Corazón', why: '14 de febrero', accept: ['corazon', 'corazones'] },
  { n: 15, word: 'Vestido', why: 'Fiesta de XV años', accept: ['vestido', 'vestidos', 'vestido de xv'] },
  { n: 16, word: 'iPhone', why: 'El iPhone 16', accept: ['iphone', 'iphone 16', 'celular', 'telefono', 'smartphone', 'cel'] },
  { n: 17, word: 'Cohete', why: 'Dieci-siete rima con co-hete', accept: ['cohete', 'cohetes', 'cohete espacial', 'cohetito', 'nave', 'nave espacial', 'rocket'] },
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
    .replace(/∞/g, ' infinito ')
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
// Las diapositivas con pregunta las maneja QUESTIONS; antes del reto, por defecto,
// el celular dice «Mira la pantalla».
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
  resumen: 'final',
};
for (let n = 1; n <= N_WORDS; n++) STAGE_BY_SLIDE['p' + String(n).padStart(2, '0')] = 'watch';

// Portadas de ronda: el celular también las muestra.
export const ROUND_COVERS = {
  'ronda-1': { n: 1, label: 'RONDA 1', big: '1', title: 'Tu memoria', sub: 'Cómo guarda (y pierde) información tu cerebro.' },
  'ronda-2': { n: 2, label: 'RONDA 2', big: '2', title: 'El olvido', sub: 'Adivina cuánto se te va en un solo día.' },
  'ronda-3': { n: 3, label: 'RONDA 3', big: '3', title: 'Mitos', sub: 'Verdadero o falso: vota desde tu celular.' },
  'ronda-final': { n: 4, label: 'LA FINAL', big: '20', title: 'El reto', sub: '20 palabras, 2 intentos. ¿Cuántas recuerdas?' },
};

export function stageFor(slideId, slideIndex, retoIndex) {
  if (STAGE_BY_SLIDE[slideId]) return STAGE_BY_SLIDE[slideId];
  if (retoIndex >= 0 && slideIndex > retoIndex) return 'final';
  return 'pre';
}

// ---------- Preguntas en vivo (no suman puntos al marcador de las 20 palabras) ----------
// open: 'enter' = se abre al entrar a su diapositiva; 'manual' = la abre el código (chunk).
// close: 'leave' = al salir de su diapositiva (o de closeAfter); un número = con ese clic de la diapositiva.
export const CHUNK_NUMBER = '5518274390';
export const AREAS = ['Eje Cursos', 'Recursos Humanos', 'Sistemas', 'Publicidad', 'Administración', 'Eje Empresas', 'Diseño', 'Ejecutiva Directiva'];
const VF = [{ id: 'V', label: 'VERDADERO' }, { id: 'F', label: 'FALSO' }];

export const QUESTIONS = {
  rating: { slide: 'despierta', type: 'scale', min: 1, max: 10, prompt: 'Del 1 al 10, ¿qué tan buena crees que es tu memoria?', close: 'leave' },
  gancho: { slide: 'gancho', type: 'text', max: 80, prompt: '¿Qué recuerdas de la última capacitación que tomaste?', close: 'leave' },
  cuarto: { slide: 'miller', type: 'choice', options: [{ id: 'si', label: 'SÍ' }, { id: 'no', label: 'NO' }], prompt: '¿Alguna vez entraste a un cuarto y olvidaste a qué ibas?', close: 'leave' },
  chunk: { slide: 'chunk', type: 'number', answer: CHUNK_NUMBER, prompt: '¿Cuál era el número?', open: 'manual', close: 'leave', resultSlide: 'chunk-res' },
  olvido: {
    slide: 'adivina', type: 'choice', prompt: 'Si no lo vuelves a ver, ¿cuánto olvidas en un día?', close: 2, correct: 'C',
    options: [{ id: 'A', label: 'Una décima parte' }, { id: 'B', label: 'Una tercera parte' }, { id: 'C', label: 'Dos terceras partes' }, { id: 'D', label: 'Casi todo' }],
  },
  'mito-1': { slide: 'mito-1', type: 'choice', options: VF, correct: 'F', prompt: 'Releer mis apuntes es la mejor forma de estudiar.', close: 1 },
  'mito-2': { slide: 'mito-2', type: 'choice', options: VF, correct: 'V', prompt: 'Dormir bien te ayuda a recordar lo que aprendiste.', close: 1 },
  'mito-3': { slide: 'mito-3', type: 'choice', options: VF, correct: 'F', prompt: 'Aprendes mejor si te enseñan en tu estilo: visual o auditivo.', close: 1 },
  'mito-4': { slide: 'mito-4', type: 'choice', options: VF, correct: 'V', prompt: 'Intentar recordar sin ver tus notas funciona mejor que releerlas.', close: 1 },
  revela: { slide: 'revela', type: 'text', max: 80, prompt: '¿Por qué calcetines era el 2?', close: 'leave' },
  cierre: { slide: 'cierre', type: 'text', max: 120, areas: AREAS, prompt: '¿Qué te cuesta recordar o enseñar en tu trabajo… y de qué lo podrías colgar?', close: 'leave', closeAfter: 'muro' },
};

// Diapositiva → pregunta que muestran los celulares mientras está en pantalla.
export const QUESTION_BY_SLIDE = {};
for (const [id, q] of Object.entries(QUESTIONS)) {
  QUESTION_BY_SLIDE[q.slide] = id;
  if (q.resultSlide) QUESTION_BY_SLIDE[q.resultSlide] = id;
  if (q.closeAfter) QUESTION_BY_SLIDE[q.closeAfter] = id;
}

// El número de la prueba rápida: sin espacios, guiones ni puntos.
export const digitsOnly = (v) => String(v ?? '').replace(/[\s.\-]/g, '').replace(/\D/g, '');

// Cuántos dígitos están en su lugar y si lo recordó completo.
export function chunkScore(value) {
  const d = digitsOnly(value);
  let hits = 0;
  for (let i = 0; i < CHUNK_NUMBER.length; i++) if (d[i] === CHUNK_NUMBER[i]) hits++;
  return { hits, ok: d === CHUNK_NUMBER };
}

// Las preguntas con respuesta correcta (para el resumen y el recuerdo).
export const SCORED_QUESTIONS = ['olvido', 'mito-1', 'mito-2', 'mito-3', 'mito-4'];

// Por jugador: su calificación inicial, cuántas de las preguntas con respuesta
// correcta le atinó y cómo le fue con el número. qa = { pregunta: { uid: { v } } }.
export function playerExtras(qa = {}) {
  const out = {};
  const get = (uid) => out[uid] || (out[uid] = { rate: null, ok: 0, n: 0, chunk: null });
  for (const [uid, a] of Object.entries(qa.rating || {})) if (a?.v != null) get(uid).rate = +a.v;
  for (const qid of SCORED_QUESTIONS) {
    for (const [uid, a] of Object.entries(qa[qid] || {})) {
      if (!a?.v) continue;
      const e = get(uid);
      e.n++;
      if (a.v === QUESTIONS[qid].correct) e.ok++;
    }
  }
  for (const [uid, a] of Object.entries(qa.chunk || {})) if (a?.v) get(uid).chunk = chunkScore(a.v);
  return out;
}

// Resumen de una pregunta para pantallas y panel. answers = { uid: { v, area, t } }.
export function summarize(qid, answers, rows, hidden = {}) {
  const q = QUESTIONS[qid];
  const ids = new Set(rows.map((r) => r.id));
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const list = Object.entries(answers || {})
    .filter(([id, a]) => ids.has(id) && a && a.v !== undefined && a.v !== null && a.v !== '')
    .map(([id, a]) => ({ id, ...a, name: byId[id].name, avatar: byId[id].avatar, hidden: !!hidden?.[id] }))
    .sort((a, b) => (b.t || 0) - (a.t || 0));
  const out = { q, count: list.length, total: rows.length, list };
  if (q.type === 'scale') {
    out.bins = Array.from({ length: q.max - q.min + 1 }, (_, i) => list.filter((a) => +a.v === q.min + i).length);
    out.avg = list.length ? list.reduce((s, a) => s + +a.v, 0) / list.length : null;
  } else if (q.type === 'choice') {
    out.byOption = Object.fromEntries(q.options.map((o) => [o.id, list.filter((a) => a.v === o.id)]));
  } else if (q.type === 'number') {
    const scored = list.map((a) => ({ ...a, ...chunkScore(a.v) }));
    out.ok = scored.filter((a) => a.ok);
    out.avgHits = scored.length ? scored.reduce((s, a) => s + a.hits, 0) / scored.length : null;
  } else if (q.type === 'text') {
    out.visible = list.filter((a) => !a.hidden);
  }
  return out;
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

const BOT_TEXT = {
  gancho: ['Excel con tablas dinámicas', 'Casi nada, la verdad', 'Que hay que hacer pausas activas', 'Algo de seguridad informática', 'El nombre del instructor', 'Que había café'],
  revela: ['¡Porque son un par!', 'Dos pies, dos calcetines', 'Van en pares', 'Ni idea jaja', '¿Por el 2 de par?'],
  cierre: ['Los pasos del proceso de ventas', 'Los nombres de los clientes nuevos', 'Las fechas de cierre del mes', 'Las contraseñas', 'El orden de la inducción'],
};

// Respuesta de práctica de un bot a una pregunta en vivo.
export function botAnswer(qid, rand = Math.random) {
  const q = QUESTIONS[qid];
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  if (q.type === 'scale') return { v: Math.max(1, Math.min(10, Math.round(4 + rand() * 4 + (rand() - 0.5) * 3))) };
  if (q.type === 'number') {
    const r = rand();
    if (r < 0.3) return { v: CHUNK_NUMBER };
    const d = CHUNK_NUMBER.split('');
    for (let i = 0; i < d.length; i++) if (rand() < (i < 4 ? 0.15 : 0.5)) d[i] = String(Math.floor(rand() * 10));
    return { v: d.join('') };
  }
  if (q.type === 'text') {
    const a = { v: pick(BOT_TEXT[qid] || BOT_TEXT.gancho) };
    if (q.areas) a.area = pick(q.areas);
    return a;
  }
  if (qid === 'cuarto') return { v: rand() < 0.88 ? 'si' : 'no' };
  if (qid === 'olvido') return { v: pick(['A', 'B', 'B', 'B', 'C', 'C', 'D']) };
  const right = qid === 'mito-3' ? 0.45 : 0.7;
  return { v: rand() < right ? q.correct : q.options.find((o) => o.id !== q.correct).id };
}

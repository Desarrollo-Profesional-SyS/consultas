// Efectos de la presentación: sonidos sintetizados (sin archivos) y confeti.
import { qrcode } from '../vendor/qrcode.mjs';

// ---------- Sonidos ----------
// Todo se sintetiza en el navegador (sin archivos): sonidos cortos, juguetones y
// con rebote, al estilo de los juegos de fiesta tipo Fibbage.
let ctx = null;
let master = null;
let noiseBuf = null;
let enabled = true;

export function setSound(on) { enabled = on; }
export function soundOn() { return enabled; }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return enabled ? ctx : null;
}

function env(g, t0, peak, attack, dur) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

// Un oscilador con envolvente; to = frecuencia final; vib = [velocidad, profundidad].
function tone(freq, start, dur, { type = 'sine', gain = 0.18, to = 0, attack = 0.012, vib = null, filter = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (vib) {
    const l = a.createOscillator();
    const lg = a.createGain();
    l.frequency.value = vib[0];
    lg.gain.value = vib[1];
    l.connect(lg).connect(o.frequency);
    l.start(t0);
    l.stop(t0 + dur + 0.05);
  }
  env(g, t0, gain, attack, dur);
  let node = o;
  if (filter) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    node = o.connect(f);
  }
  node.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Ruido filtrado (palmas, soplidos, explosiones).
function noise(start, dur, { gain = 0.2, type = 'bandpass', freq = 1200, to = 0, q = 1, attack = 0.005 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = a.createGain();
  env(g, t0, gain, attack, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0, Math.random());
  src.stop(t0 + dur + 0.05);
}

const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];
let lastAt = {};
// Evita que muchos sonidos iguales se encimen (p. ej. 30 votos en un segundo).
function throttle(name, ms) {
  const now = performance.now();
  if (now - (lastAt[name] || 0) < ms) return false;
  lastAt[name] = now;
  return true;
}

export const sfx = {
  unlock() { audio(); },
  // Portada de ronda, estilo programa de concurso: subida, golpe y metales. Cada ronda sube de tono.
  round(n = 1) {
    if (!throttle('round', 900)) return;
    const k = 2 ** ([0, 2, 4, 7][n - 1] / 12 || 0);
    const hit = 0.74;
    noise(0, hit, { gain: 0.12, freq: 300, to: 5000, q: 0.9, attack: hit * 0.9 }); // subida
    tone(110 * k, 0, hit, { type: 'sawtooth', to: 440 * k, gain: 0.05, filter: 1800, attack: hit * 0.8 });
    tone(110, hit, 0.5, { type: 'sine', to: 38, gain: 0.45 }); // bombo
    noise(hit, 1.3, { gain: 0.16, type: 'highpass', freq: 5000, attack: 0.004 }); // platillo
    const chord = [262, 330, 392].map((f) => f * k);
    chord.forEach((f) => tone(f, hit + 0.02, 0.2, { type: 'sawtooth', gain: 0.07, filter: 2800 })); // ¡ta!
    chord.forEach((f) => tone(f * 1.125, hit + 0.3, 0.18, { type: 'sawtooth', gain: 0.07, filter: 2800 })); // ¡ta!
    [...chord, chord[0] * 2].forEach((f) => tone(f * 1.335, hit + 0.58, n === 4 ? 1.6 : 1.1, { type: 'sawtooth', gain: 0.06, filter: 3200, vib: [5.5, 7] })); // ¡taaaa!
    if (n === 4) { sfx.drumroll(hit - 0.02); sfx.applause(2); }
  },
  // Algo aparece
  pop() { tone(520, 0, 0.11, { type: 'triangle', to: 900, gain: 0.14 }); tone(1300, 0.01, 0.05, { type: 'sine', gain: 0.05 }); },
  // Alguien entra a la sala: resorte
  join() { if (throttle('join', 90)) tone(240, 0, 0.45, { type: 'sine', to: 520, gain: 0.16, vib: [16, 40] }); },
  // Llega un voto o una respuesta
  bloop() {
    if (!throttle('bloop', 110)) return;
    const f = PENTA[Math.floor(Math.random() * PENTA.length)];
    tone(f, 0, 0.14, { type: 'sine', to: f * 0.75, gain: 0.13 });
  },
  // Se abre una pregunta en los celulares
  chime() { tone(784, 0, 0.35, { type: 'triangle', gain: 0.14 }); tone(1175, 0.12, 0.5, { type: 'triangle', gain: 0.12 }); tone(1568, 0.12, 0.4, { type: 'sine', gain: 0.05 }); },
  tick() { tone(1500, 0, 0.04, { type: 'square', gain: 0.05 }); noise(0, 0.03, { gain: 0.05, freq: 3000, q: 4 }); },
  // El número se esfuma
  poof() { noise(0, 0.45, { gain: 0.16, type: 'lowpass', freq: 3000, to: 200 }); tone(700, 0, 0.3, { type: 'sine', to: 180, gain: 0.08 }); },
  drumroll(dur = 0.9) {
    for (let t = 0; t < dur; t += 0.045) noise(t, 0.05, { gain: 0.04 + (t / dur) * 0.1, freq: 1800, q: 1.2 });
    noise(dur, 0.25, { gain: 0.18, freq: 900, q: 0.7 });
  },
  // ¡Ta-dá!
  tada() {
    [[523, 0], [659, 0.09], [784, 0.18]].forEach(([f, t]) => tone(f, t, 0.18, { type: 'sawtooth', gain: 0.06, filter: 2600 }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.3, 0.7, { type: 'sawtooth', gain: 0.05, filter: 3000, vib: [6, 6] }));
  },
  // Trombón triste: wah, wah, wah, waaah
  sad() {
    [[392, 0, 0.32], [370, 0.36, 0.32], [349, 0.72, 0.32]].forEach(([f, t, d]) => tone(f, t, d, { type: 'sawtooth', gain: 0.09, filter: 900, attack: 0.04 }));
    tone(330, 1.08, 0.9, { type: 'sawtooth', gain: 0.09, filter: 900, attack: 0.04, vib: [6, 10] });
  },
  start() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.2, { type: 'square', gain: 0.07, filter: 3500 }));
    tone(60, 0, 0.25, { type: 'sine', to: 40, gain: 0.3 });
  },
  end() { tone(220, 0, 0.55, { type: 'sawtooth', to: 130, gain: 0.12, filter: 1500 }); tone(180, 0.05, 0.6, { type: 'square', to: 110, gain: 0.06, filter: 1200 }); },
  applause(dur = 1.6) {
    for (let t = 0; t < dur; t += 0.018) if (Math.random() < 0.8) noise(t, 0.03, { gain: 0.05 + Math.random() * 0.07 * (1 - t / dur), freq: 1000 + Math.random() * 2500, q: 2 });
  },
  fanfare() {
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.4], [784, 0.56], [1047, 0.7]].forEach(([f, t]) => tone(f, t, 0.3, { type: 'square', gain: 0.06, filter: 3500 }));
    [1047, 1319, 1568].forEach((f) => tone(f, 0.86, 0.9, { type: 'sawtooth', gain: 0.04, filter: 4000, vib: [6, 8] }));
    sfx.applause(2.2);
  },
};

// ---------- Reacciones ----------
export const REACTIONS = [
  { id: 'risa', emoji: '😂', label: '¡Jajaja!' },
  { id: 'bravo', emoji: '👏', label: '¡Bravo!' },
  { id: 'boom', emoji: '🤯', label: '¡Me explotó!' },
  { id: 'cerebro', emoji: '🧠', label: '¡Cerebrito!' },
  { id: 'zzz', emoji: '😴', label: 'Zzz' },
  { id: 'ups', emoji: '🎺', label: '¡Ups!' },
];

const REACTION_SOUND = {
  // Risa de caricatura: ja-ja-ja-ja
  risa() { for (let i = 0; i < 5; i++) tone(620 - i * 45, i * 0.11, 0.08, { type: 'sawtooth', gain: 0.08, filter: 1400, to: 520 - i * 45 }); },
  bravo() { sfx.applause(1.1); },
  // Explosión y silbato que sube
  boom() { noise(0, 0.7, { gain: 0.3, type: 'lowpass', freq: 900, to: 80 }); tone(90, 0, 0.6, { type: 'sine', to: 35, gain: 0.35 }); tone(400, 0.45, 0.5, { type: 'sine', to: 1800, gain: 0.08 }); },
  // Resorte
  cerebro() { tone(180, 0, 0.6, { type: 'sine', to: 420, gain: 0.2, vib: [14, 60] }); },
  // Ronquido: ronco al inhalar, silbidito al exhalar
  zzz() { tone(70, 0, 0.55, { type: 'sawtooth', gain: 0.1, filter: 380, vib: [28, 12] }); tone(950, 0.62, 0.35, { type: 'sine', to: 620, gain: 0.06 }); },
  ups() { sfx.sad(); },
};

export function reactionSound(id) {
  if (throttle('r-' + id, 380) && throttle('reaction', 140)) REACTION_SOUND[id]?.();
}

// ---------- Confeti ----------
const COLORS = ['#C6F432', '#FF3E8E', '#FF9F1C', '#B69CFF', '#7FD3FF', '#FFF4E0', '#FFD23F'];

export function confetti(host, { count = 220, duration = 4200 } = {}) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  c.width = 1920;
  c.height = 1080;
  host.appendChild(c);
  const g = c.getContext('2d');
  const parts = Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -20 : 1940,
      y: 700 + Math.random() * 300,
      vx: (fromLeft ? 1 : -1) * (8 + Math.random() * 16),
      vy: -(18 + Math.random() * 20),
      w: 12 + Math.random() * 14,
      h: 8 + Math.random() * 10,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[i % COLORS.length],
    };
  });
  const t0 = performance.now();
  const frame = (t) => {
    const k = (t - t0) / duration;
    g.clearRect(0, 0, 1920, 1080);
    for (const p of parts) {
      p.vy += 0.55;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.7) / 0.3);
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.color;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 2);
      g.restore();
    }
    if (k < 1 && c.isConnected) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

// ---------- QR ----------
export function qrSVG(text, { dark = '#160A26', light = 'transparent' } = {}) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const quiet = 2;
  const size = n + quiet * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) if (q.isDark(r, col)) d += `M${col + quiet} ${r + quiet}h1v1h-1z`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Código QR para entrar al juego"><rect width="${size}" height="${size}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}

// Efectos de la presentación: sonidos sintetizados (sin archivos) y confeti.
import { qrcode } from '../vendor/qrcode.mjs';

// ---------- Sonidos ----------
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }
export function soundOn() { return enabled; }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18, slide = 0 } = {}) {
  const a = audio();
  if (!a || !enabled) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  unlock() { audio(); },
  join() { tone(520, 0, 0.12, { type: 'triangle', slide: 1.6 }); tone(880, 0.07, 0.12, { type: 'triangle', gain: 0.12 }); },
  start() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, { type: 'square', gain: 0.08 })); },
  tick() { tone(1200, 0, 0.05, { type: 'square', gain: 0.06 }); },
  end() { tone(220, 0, 0.5, { type: 'sawtooth', gain: 0.12, slide: 0.6 }); tone(180, 0.05, 0.55, { type: 'square', gain: 0.06, slide: 0.6 }); },
  pop() { tone(660, 0, 0.1, { type: 'triangle', slide: 1.4, gain: 0.12 }); },
  fanfare() {
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.4], [784, 0.56], [1047, 0.7]].forEach(([f, t]) => tone(f, t, 0.32, { type: 'square', gain: 0.07 }));
    tone(1568, 0.7, 0.6, { type: 'triangle', gain: 0.08 });
  },
};

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

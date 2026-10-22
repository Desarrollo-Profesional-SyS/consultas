// Motor de la presentación: muestra las diapositivas de 1920×1080 escaladas a la
// ventana y reproduce lo que hacía la presentación en Claude: apariciones por clic
// (data-build-in / data-build-out), transiciones (push, fade, magic) y notas.
import { ICON_PATHS } from './icons.js';

const W = 1920;
const H = 1080;
const DUR = { push: 650, fade: 450, magic: 600 };
const EASE = 'cubic-bezier(.65,0,.35,1)';

export class Deck extends EventTarget {
  constructor(stage, slides) {
    super();
    this.stage = stage;
    this.slides = slides; // [{ id, html }]
    this.index = -1;
    this.el = null; // <section> en pantalla
    this.steps = []; // grupos de apariciones pendientes
    this.stepAt = 0;
    this.busy = false;
    this.autoTimer = null;
    this.guard = null; // función que puede frenar el "siguiente" (rondas en curso)
    this.fit();
    addEventListener('resize', () => this.fit());
  }

  fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    this.scale = s;
    this.stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  get current() { return this.slides[this.index]; }
  indexOf(id) { return this.slides.findIndex((s) => s.id === id); }

  // ---------- Construcción de una diapositiva ----------
  build(i) {
    const tpl = document.createElement('template');
    tpl.innerHTML = this.slides[i].html;
    const el = tpl.content.firstElementChild;
    hydrateCustomElements(el);
    return el;
  }

  // Pasos de aparición. Dentro de un mismo número de orden, lo marcado «auto» sale
  // solo y lo demás espera el clic (así «drop 1 auto» y «rise 1» son dos pasos).
  parseBuilds(el) {
    const groups = new Map();
    const add = (node, attr, kind) => {
      const [effect = 'fade', orderTxt, autoTxt] = node.getAttribute(attr).trim().split(/\s+/);
      const order = parseInt(orderTxt, 10) || 1;
      const auto = autoTxt === 'auto' || orderTxt === 'auto';
      const key = `${order}-${auto ? 0 : 1}`;
      if (!groups.has(key)) groups.set(key, { order, auto, items: [] });
      groups.get(key).items.push({ node, kind, effect });
    };
    el.querySelectorAll('[data-build-in]').forEach((n) => add(n, 'data-build-in', 'in'));
    el.querySelectorAll('[data-build-out]').forEach((n) => add(n, 'data-build-out', 'out'));
    return [...groups.values()].sort((a, b) => a.order - b.order || Number(b.auto) - Number(a.auto));
  }

  // ---------- Navegación ----------
  async go(i, { dir = 1, final = false, instant = false } = {}) {
    if (i < 0 || i >= this.slides.length || this.busy) return;
    clearTimeout(this.autoTimer);
    const prevEl = this.el;
    const prevSlide = this.current;
    const el = this.build(i);
    const steps = this.parseBuilds(el);

    // Estado inicial de las apariciones
    for (const g of steps) for (const it of g.items) if (it.kind === 'in') it.node.setAttribute('data-pending', '');
    this.index = i;
    this.el = el;
    this.steps = steps;
    this.stepAt = 0;
    this.stage.appendChild(el);
    this.dispatchEvent(new CustomEvent('enter', { detail: { el, slide: this.current, index: i, prevSlide } }));

    if (final) {
      while (this.stepAt < this.steps.length) this.playStep(true);
    }

    if (prevEl) {
      const kind = instant ? 'none' : prevEl.dataset.transition || 'push';
      this.busy = true;
      await this.transition(prevEl, el, kind, dir);
      prevEl.remove();
      this.busy = false;
    }
    this.dispatchEvent(new CustomEvent('change', { detail: { el, slide: this.current, index: i } }));
    if (!final) this.runAutoSteps(prevEl ? 120 : 350);
  }

  next() {
    if (this.busy) return;
    if (this.guard && this.guard('next') === false) return;
    clearTimeout(this.autoTimer);
    // Si solo faltan apariciones automáticas, el clic las termina y avanza.
    if (this.stepAt < this.steps.length && this.steps.slice(this.stepAt).every((g) => g.auto)) {
      while (this.stepAt < this.steps.length) this.playStep(true);
    }
    if (this.stepAt < this.steps.length) {
      this.playStep();
      this.runAutoSteps(450);
      return;
    }
    if (this.index < this.slides.length - 1) this.go(this.index + 1, { dir: 1 });
  }

  prev() {
    if (this.busy) return;
    if (this.index > 0) this.go(this.index - 1, { dir: -1, final: true });
  }

  goto(id, opts = {}) {
    const i = typeof id === 'number' ? id : this.indexOf(id);
    if (i >= 0) this.go(i, { dir: i >= this.index ? 1 : -1, final: !!opts.final, instant: !!opts.instant });
  }

  get pendingSteps() { return this.steps.length - this.stepAt; }

  runAutoSteps(delay) {
    clearTimeout(this.autoTimer);
    const g = this.steps[this.stepAt];
    if (!g || !g.auto) return;
    this.autoTimer = setTimeout(() => {
      this.playStep();
      this.runAutoSteps(380);
    }, delay);
  }

  playStep(instant = false) {
    const g = this.steps[this.stepAt++];
    if (!g) return;
    this.dispatchEvent(new CustomEvent('step', { detail: { order: g.order, auto: g.auto, instant, slide: this.current } }));
    for (const it of g.items) {
      if (it.kind === 'in') {
        it.node.removeAttribute('data-pending');
        if (!instant) animateIn(it.node, it.effect);
      } else if (instant) {
        it.node.style.visibility = 'hidden';
      } else {
        animateOut(it.node, it.effect);
      }
      if (it.kind === 'in') this.dispatchEvent(new CustomEvent('built', { detail: { node: it.node, instant } }));
    }
  }

  // ---------- Transiciones ----------
  transition(from, to, kind, dir) {
    if (kind === 'none') return Promise.resolve();
    if (kind === 'magic') return magicMove(from, to);
    if (kind === 'fade') {
      const a = to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR.fade, easing: 'ease' });
      from.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR.fade, easing: 'ease', fill: 'forwards' });
      return a.finished.catch(() => {});
    }
    const d = dir >= 0 ? 1 : -1;
    const a = to.animate([{ transform: `translateX(${d * W}px)` }, { transform: 'translateX(0)' }], { duration: DUR.push, easing: EASE });
    from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-d * W}px)` }], { duration: DUR.push, easing: EASE, fill: 'forwards' });
    return a.finished.catch(() => {});
  }
}

// ---------- Animaciones de aparición ----------
const IN = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  rise: [{ opacity: 0, translate: '0 60px' }, { opacity: 1, translate: '0 0' }],
  drop: [
    { opacity: 0, translate: '0 -140px', offset: 0 },
    { opacity: 1, translate: '0 14px', offset: 0.7 },
    { opacity: 1, translate: '0 0', offset: 1 },
  ],
  left: [{ opacity: 0, translate: '-160px 0' }, { opacity: 1, translate: '0 0' }],
  right: [{ opacity: 0, translate: '160px 0' }, { opacity: 1, translate: '0 0' }],
  scale: [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1' }],
  pop: [
    { opacity: 0, scale: '0.2', offset: 0 },
    { opacity: 1, scale: '1.1', offset: 0.65 },
    { opacity: 1, scale: '1', offset: 1 },
  ],
};
const IN_DUR = { fade: 500, rise: 600, drop: 650, left: 600, right: 600, scale: 500, pop: 550 };

export function animateIn(node, effect = 'fade') {
  const kf = IN[effect] || IN.fade;
  return node.animate(kf, { duration: IN_DUR[effect] || 500, easing: effect === 'pop' || effect === 'drop' ? 'ease-out' : 'cubic-bezier(.2,.8,.2,1)' });
}

function animateOut(node, effect = 'fade') {
  const kf = [...(IN[effect] || IN.fade)].reverse();
  const a = node.animate(kf, { duration: 400, easing: 'ease-in', fill: 'forwards' });
  a.finished.then(() => { node.style.visibility = 'hidden'; a.cancel(); }).catch(() => {});
}

// ---------- Magic move: los elementos con el mismo id viajan de una diapositiva a otra ----------
function magicMove(from, to) {
  const pairs = [];
  to.querySelectorAll('[id]').forEach((n) => {
    if (n === to) return;
    const o = from.querySelector(`[id="${CSS.escape(n.id)}"]`);
    if (o) pairs.push([o, n]);
  });
  const anims = [];
  for (const [o, n] of pairs) {
    o.style.visibility = 'hidden';
    const changed = o.innerHTML !== n.innerHTML;
    if (changed && n.hasAttribute('data-build-in')) continue; // su propia aparición se encarga
    const os = getComputedStyle(o);
    const ns = getComputedStyle(n);
    const props = ['left', 'top', 'width', 'height', 'transform', 'opacity'];
    const fromKf = {};
    const toKf = {};
    for (const p of props) {
      if (os[p] !== ns[p]) {
        fromKf[p] = os[p];
        toKf[p] = ns[p];
      }
    }
    if (Object.keys(fromKf).length) anims.push(n.animate([fromKf, toKf], { duration: DUR.magic, easing: EASE }));
    if (changed) anims.push(n.animate([{ scale: '0.85', opacity: 0.3 }, { scale: '1', opacity: 1 }], { duration: 320, easing: 'ease-out' }));
  }
  // El resto se funde
  const keep = new Set(pairs.map(([, n]) => n));
  for (const child of to.children) {
    if (!keep.has(child)) child.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR.magic * 0.7, easing: 'ease' });
  }
  from.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR.magic * 0.5, easing: 'ease', fill: 'forwards' });
  return Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => new Promise((r) => setTimeout(r, 60)));
}

// ---------- <x-icon> y <x-shape> del formato de diapositivas ----------
function hydrateCustomElements(root) {
  root.querySelectorAll('x-icon').forEach((n) => {
    const path = ICON_PATHS[n.getAttribute('name')] || '';
    n.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  });
  root.querySelectorAll('x-shape').forEach((n) => {
    const fill = n.style.background || n.style.backgroundColor || '#07030D';
    n.style.background = 'none';
    const kind = n.getAttribute('kind');
    const shapes = {
      'arrow-right': '<polygon points="0,30 60,30 60,0 100,50 60,100 60,70 0,70"/>',
      'arrow-left': '<polygon points="100,30 40,30 40,0 0,50 40,100 40,70 100,70"/>',
      'arrow-up': '<polygon points="30,100 30,40 0,40 50,0 100,40 70,40 70,100"/>',
      'arrow-down': '<polygon points="30,0 30,60 0,60 50,100 100,60 70,60 70,0"/>',
      ellipse: '<ellipse cx="50" cy="50" rx="50" ry="50"/>',
      diamond: '<polygon points="50,0 100,50 50,100 0,50"/>',
      rect: '<rect width="100" height="100"/>',
      rounded: '<rect width="100" height="100" rx="16"/>',
      line: '<rect y="45" width="100" height="10"/>',
    };
    n.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="${fill}" aria-hidden="true">${shapes[kind] || shapes.rect}</svg>`;
  });
}

// Texto de las notas del orador de una diapositiva.
export function notesOf(slide) {
  const m = slide.html.match(/<aside>([\s\S]*?)<\/aside>/);
  return m ? m[1].trim() : '';
}

// Primer título de una diapositiva (para el panel de Alex y las notas).
export function titleOf(slide) {
  const tpl = document.createElement('template');
  tpl.innerHTML = slide.html;
  const h = tpl.content.querySelector('h1, h2, h3') || tpl.content.querySelector('p');
  return (h?.textContent || slide.id).replace(/\s+/g, ' ').trim();
}

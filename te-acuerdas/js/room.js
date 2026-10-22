// Acciones sobre una sala del juego. Todas las páginas hablan con la base de
// datos solo a través de esto, así las rutas y los formatos viven en un lugar.
//
// rooms/{CODE}/
//   owner, hostKey, hosts/{uid}       quién puede conducir
//   state    { slide, index, stage, word, total }   lo que hay en pantalla
//   rounds/{1|2} { status, endsAt, left, duration } el reloj de cada ronda
//   order2   [14, 8, 3, …]            orden salteado de la ronda 2
//   cmd      { id, type, slide }      control remoto desde el panel de Alex
//   players/{uid} { name, avatar, joinedAt, online, bot }
//   kicked/{uid} true                  nombres que Alex sacó del juego
//   answers/{1|2}/{uid} { w1…w20, _t }
//   overrides/{n}/{respuesta} true|false   correcciones de Alex
//   results  { {uid}: { r1, r2, total, place, h1, h2, gain }, _meta: { … } }
//   q/{pregunta} { open, openedAt, closedAt, revealed }   preguntas en vivo
//   qa/{pregunta}/{uid} { v, area?, t }                    un voto o respuesta por persona
//   qhide/{pregunta}/{uid} true                            respuestas de texto que Alex ocultó
import { ROUND_SECONDS } from './config.js';
import { shuffledOrder, clampName, answerKey } from './game.js';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // sin I, L, O para no confundir

export function newCode() {
  return Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
}

function newKey() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class Room {
  constructor(store, code) {
    this.store = store;
    this.code = code;
    this.base = `rooms/${code}`;
  }

  p(path = '') { return path ? `${this.base}/${path}` : this.base; }
  on(path, cb) { return this.store.on(this.p(path), cb); }
  get(path) { return this.store.get(this.p(path)); }

  // ---------- Conductores ----------
  static async create(store) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = newCode();
      const room = new Room(store, code);
      const key = newKey();
      try {
        if (await store.get(`rooms/${code}/owner`)) continue;
        // Primero el dueño (las reglas de Firebase lo exigen antes que lo demás)
        await store.update(room.p(), { owner: store.uid, hostKey: key, createdAt: store.now() });
        await store.update(room.p(), {
          state: { slide: 'cover', index: 0, stage: 'pre', word: 0, total: 0 },
          rounds: { 1: { status: 'idle' }, 2: { status: 'idle' } },
          order2: shuffledOrder(Date.now()),
        });
        return { room, key };
      } catch (e) {
        console.warn('No se pudo crear la sala', code, e);
      }
    }
    throw new Error('No se pudo crear la sala. Revisa la conexión y las reglas de Firebase.');
  }

  exists() { return this.store.get(this.p('owner')).then(Boolean); }

  claimHost(key) { return this.store.set(this.p(`hosts/${this.store.uid}`), key); }

  setState(patch) { return this.store.update(this.p('state'), patch); }

  sendCmd(type, slide = null) {
    return this.store.set(this.p('cmd'), { id: `${this.store.uid}-${Date.now()}`, type, slide, at: this.store.now() });
  }

  startRound(r) {
    // ?segundos=20 en el link acorta las rondas (útil para ensayar rápido)
    const quick = +new URLSearchParams(location.search).get('segundos');
    const duration = (quick || ROUND_SECONDS[r] || 120) * 1000;
    return this.store.set(this.p(`rounds/${r}`), { status: 'running', duration, endsAt: this.store.now() + duration, startedAt: this.store.now() });
  }

  pauseRound(r, round) {
    return this.store.update(this.p(`rounds/${r}`), { status: 'paused', left: Math.max(0, round.endsAt - this.store.now()) });
  }

  resumeRound(r, round) {
    return this.store.update(this.p(`rounds/${r}`), { status: 'running', endsAt: this.store.now() + (round.left || 0), left: null });
  }

  addTime(r, round, seconds) {
    if (round.status === 'paused') return this.store.update(this.p(`rounds/${r}`), { left: (round.left || 0) + seconds * 1000 });
    if (round.status === 'closed') return this.store.update(this.p(`rounds/${r}`), { status: 'running', endsAt: this.store.now() + seconds * 1000 });
    return this.store.update(this.p(`rounds/${r}`), { endsAt: round.endsAt + seconds * 1000 });
  }

  closeRound(r) {
    return this.store.update(this.p(`rounds/${r}`), { status: 'closed', closedAt: this.store.now(), left: null });
  }

  resetRound(r) {
    return Promise.all([
      this.store.set(this.p(`rounds/${r}`), { status: 'idle' }),
      this.store.remove(this.p(`answers/${r}`)),
    ]);
  }

  setOverride(n, text, value) {
    const k = answerKey(text);
    if (!k) return Promise.resolve();
    return this.store.set(this.p(`overrides/${n}/${k}`), value);
  }

  kick(uid) { return this.store.set(this.p(`kicked/${uid}`), true); }
  unkick(uid) { return this.store.remove(this.p(`kicked/${uid}`)); }

  publishResults(results) { return this.store.set(this.p('results'), results); }

  // ---------- Preguntas en vivo ----------
  openQuestion(qid) {
    return this.store.update(this.p(`q/${qid}`), { open: true, openedAt: this.store.now(), closedAt: null });
  }

  closeQuestion(qid, { reveal = false } = {}) {
    return this.store.update(this.p(`q/${qid}`), { open: false, closedAt: this.store.now(), ...(reveal ? { revealed: true } : {}) });
  }

  resetQuestion(qid) {
    return this.store.update(this.p(), { [`q/${qid}`]: null, [`qa/${qid}`]: null, [`qhide/${qid}`]: null });
  }

  hideAnswer(qid, uid, hidden) {
    return this.store.set(this.p(`qhide/${qid}/${uid}`), hidden ? true : null);
  }

  answerQuestion(qid, value, extra = {}, uid = this.store.uid) {
    return this.store.set(this.p(`qa/${qid}/${uid}`), { v: value, ...extra, t: this.store.now() });
  }

  // ---------- Jugadores ----------
  join(name, avatar, extra = {}) {
    return this.store.update(this.p(`players/${this.store.uid}`), {
      name: clampName(name),
      avatar,
      joinedAt: this.store.now(),
      online: true,
      ...extra,
    });
  }

  markOnline() {
    const path = this.p(`players/${this.store.uid}/online`);
    this.store.onDisconnectSet(path, false);
    return this.store.set(path, true);
  }

  saveAnswers(r, patch) {
    return this.store.update(this.p(`answers/${r}/${this.store.uid}`), { ...patch, _t: this.store.now() });
  }
}

export function joinUrl(code) {
  const u = new URL('j.html', location.href);
  u.search = `?s=${code}`;
  if (new URLSearchParams(location.search).has('ensayo')) u.search += '&ensayo';
  return u.toString();
}

export function adminUrl(code, key) {
  const u = new URL('alex.html', location.href);
  u.search = `?s=${code}`;
  if (new URLSearchParams(location.search).has('ensayo')) u.search += '&ensayo';
  u.hash = `k=${key}`;
  return u.toString();
}

// Reloj de una ronda: milisegundos que faltan (o null si no ha empezado).
export function timeLeft(round, now) {
  if (!round || round.status === 'idle') return null;
  if (round.status === 'paused') return round.left || 0;
  if (round.status === 'closed') return 0;
  return Math.max(0, round.endsAt - now);
}

export const isOpen = (round) => round && (round.status === 'running' || round.status === 'paused');

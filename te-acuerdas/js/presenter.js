// Pantalla de Joss: la presentación completa más el "cerebro" del juego
// (abre la sala, arranca y cierra las rondas, califica y publica resultados).
import { openStore } from './store.js';
import { Room, joinUrl, adminUrl, timeLeft } from './room.js';
import { Deck, notesOf, titleOf } from './deck.js';
import { SLIDES } from './slides-data.js';
import { renderLive, updateTimers, countUp } from './live.js';
import { buildTable, stats, bestGain, stageFor } from './game.js';
import { sfx, setSound, soundOn, confetti } from './fx.js';
import { icon } from './icons.js';
import { SOUND_DEFAULT } from './config.js';

const $ = (id) => document.getElementById(id);
const ROUND_SLIDE = { escribe: 1, segunda: 2 };
const LOBBY_INDEX = SLIDES.findIndex((s) => s.id === 'sala');
const SAVED = 'te-acuerdas-joss';

let store;
let room = null;
let deck = null;
let data = emptyData();
let roomData = {};
let lastCmd; // id de la última orden del panel de Alex ya atendida
let lastPublished = '';
let publishTimer = null;
let closing = {};
let lastTickSecond = {};
let confirmCloseUntil = 0;
const notesChan = new BroadcastChannel('te-acuerdas-notas');

function emptyData() {
  const s = { count: 0, avg: 0, byNumber: Array(20).fill(0), ranges: [[], [], [], []] };
  return { code: '', url: '', rows: [], stats: { 1: s, 2: s }, rounds: {}, order2: [], best: null, answers: {}, now: Date.now() };
}

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

function hint(msg, ms = 2600) {
  const h = $('hint');
  h.textContent = msg;
  h.classList.add('show');
  clearTimeout(h._h);
  h._h = setTimeout(() => h.classList.remove('show'), ms);
}

// ---------- Arranque ----------
async function boot() {
  setSound(loadSaved().sound ?? SOUND_DEFAULT);
  $('soundChk').checked = soundOn();
  $('startAt').innerHTML = SLIDES.map((s, i) => `<option value="${i}">${i + 1}. ${titleOf(s).slice(0, 48)}</option>`).join('');
  try {
    store = await openStore();
  } catch (e) {
    console.error(e);
    $('roomMsg').textContent = e?.code === 'auth/operation-not-allowed' || e?.code === 'auth/admin-restricted-operation'
      ? 'Falta activar el inicio de sesión «Anónimo» en Firebase (Authentication → Método de acceso).'
      : `No se pudo conectar con Firebase (${e?.code || e?.message || 'error'}). Revisa js/config.js y tu internet.`;
    $('modeBadge').textContent = 'Sin conexión';
    return;
  }
  const local = store.mode === 'local';
  $('modeBadge').className = `mode ${local ? 'local' : 'live'}`;
  $('modeBadge').textContent = local ? 'Modo ensayo (solo esta compu)' : 'En vivo · Firebase';
  $('localTools').hidden = !local;

  const params = new URLSearchParams(location.search);
  const saved = loadSaved();
  const wanted = params.get('s') || saved.code;
  if (wanted) {
    const r = new Room(store, wanted);
    const owner = await r.get('owner').catch(() => null);
    if (owner && owner === store.uid) {
      const st = await r.get('state').catch(() => null);
      $('btnResume').hidden = false;
      $('btnResume').textContent = `Continuar sala ${wanted}${st?.index ? ` (diapositiva ${st.index + 1})` : ''}`;
      $('btnResume').onclick = () => useRoom(r, saved.code === wanted ? saved.key : null, st?.index || 0);
    }
  }
  $('roomMsg').textContent = local
    ? 'Modo ensayo: los "celulares" son otras pestañas de este mismo navegador. Para jugar en vivo hay que poner la configuración de Firebase en js/config.js.'
    : 'Crea una sala nueva para el evento (o continúa la que ya tenías si recargaste la página).';
  $('btnCreate').disabled = false;
  $('btnCreate').onclick = async () => {
    $('btnCreate').disabled = true;
    try {
      const { room: r, key } = await Room.create(store);
      useRoom(r, key, 0);
    } catch (e) {
      toast(e.message, 5000);
      $('btnCreate').disabled = false;
    }
  };
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED)) || {}; } catch { return {}; }
}
function save(patch) {
  try { localStorage.setItem(SAVED, JSON.stringify({ ...loadSaved(), ...patch })); } catch {}
}

async function useRoom(r, key, startIndex) {
  room = r;
  if (!key) key = await r.get('hostKey').catch(() => null);
  save({ code: r.code, key });
  const q = new URLSearchParams(location.search);
  q.set('s', r.code);
  history.replaceState(null, '', `?${q}`);
  data.code = r.code;
  data.url = joinUrl(r.code);
  $('playerLink').textContent = data.url;
  $('adminLink').textContent = key ? adminUrl(r.code, key) : '(no disponible)';
  $('stepRoom').querySelector('p').textContent = `Sala ${r.code} lista.`;
  $('btnCreate').hidden = true;
  $('btnResume').hidden = true;
  $('stepLinks').hidden = false;
  $('startAt').value = String(startIndex);
  $('btnFakePlayer').onclick = () => open(data.url, '_blank');
  $('btnFakeAdmin').onclick = () => open(adminUrl(r.code, key), '_blank');

  // Con 30 celulares escribiendo llegan muchos cambios por segundo: se recalcula a lo más 5 veces por segundo.
  let pendingRecompute = null;
  room.on('', (v) => {
    roomData = v || {};
    if (!pendingRecompute) pendingRecompute = setTimeout(() => { pendingRecompute = null; recompute(); }, 200);
  });
  store.onConnection((ok) => {
    $('netDot').classList.toggle('off', !ok);
    $('netTxt').textContent = ok ? (store.mode === 'local' ? 'ensayo' : 'en línea') : 'sin conexión';
  });
  setInterval(tick, 200);
}

// ---------- Datos del juego ----------
function recompute() {
  const rows = buildTable(roomData.players, roomData.answers, roomData.overrides, roomData.kicked);
  data.rows = rows;
  data.rounds = roomData.rounds || {};
  data.order2 = roomData.order2 || [];
  data.answers = roomData.answers || {};
  data.stats = { 1: stats(rows, 1), 2: stats(rows, 2) };
  data.best = bestGain(rows);
  data.now = store.now();
  if (deck?.el) renderLive(deck.el, data);
  handleCmd(roomData.cmd);
  schedulePublish();
  postNotes();
  updateHud();
}

function schedulePublish() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(() => {
    const results = { _meta: { count: data.rows.length, avg1: round1(data.stats[1].avg), avg2: round1(data.stats[2].avg), played1: data.stats[1].count, played2: data.stats[2].count } };
    for (const r of data.rows) {
      results[r.id] = { r1: r.r1, r2: r.r2, total: r.total, place: r.place, h1: r.hits1.join(','), h2: r.hits2.join(','), gain: r.gain ?? 0, p1: r.played1, p2: r.played2 };
    }
    const json = JSON.stringify(results);
    if (json !== lastPublished) {
      lastPublished = json;
      room.publishResults(results).catch((e) => console.warn('No se publicaron resultados', e));
    }
  }, 500);
}
const round1 = (x) => Math.round(x * 10) / 10;

function handleCmd(cmd) {
  if (!deck || lastCmd === undefined || !cmd || cmd.id === lastCmd) return;
  lastCmd = cmd.id;
  if (store.now() - (cmd.at || 0) > 15000) return;
  if (cmd.type === 'next') deck.next();
  else if (cmd.type === 'prev') deck.prev();
  else if (cmd.type === 'goto' && cmd.slide) deck.goto(cmd.slide, { final: true });
}

// ---------- Reloj de las rondas ----------
function tick() {
  data.now = store.now();
  if (deck?.el) updateTimers(deck.el, data.rounds, data.now);
  for (const r of [1, 2]) {
    const rd = data.rounds[r];
    if (!rd || rd.status !== 'running') { closing[r] = false; continue; }
    const left = timeLeft(rd, data.now);
    const sec = Math.ceil(left / 1000);
    if (deck?.current?.id && ROUND_SLIDE[deck.current.id] === r && sec <= 5 && sec > 0 && lastTickSecond[r] !== sec) {
      lastTickSecond[r] = sec;
      sfx.tick();
    }
    const online = data.rows.filter((row) => row.online);
    const everyoneDone = online.length > 0 && online.every((row) => data.answers?.[r]?.[row.id]?._d);
    if (!closing[r] && (left <= 0 && data.now > rd.endsAt + 1500 || everyoneDone)) {
      closing[r] = true;
      room.closeRound(r).then(() => {
        if (deck?.current?.id && ROUND_SLIDE[deck.current.id] === r) sfx.end();
        if (everyoneDone && left > 0) toast('¡Todos terminaron! Ronda cerrada.');
      });
    }
  }
}

// ---------- La presentación ----------
function startDeck(index) {
  $('setup').hidden = true;
  sfx.unlock();
  if (!deck) {
    deck = new Deck($('stage'), SLIDES);
    lastCmd = roomData.cmd?.id ?? ''; // no repetir órdenes viejas al abrir
    deck.guard = guard;
    deck.addEventListener('enter', (e) => renderLive(e.detail.el, data, { entering: true }));
    deck.addEventListener('change', onSlide);
    deck.addEventListener('built', onBuilt);
    bindKeys();
    deck.go(index, { final: index > 0 });
  }
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function guard() {
  const r = ROUND_SLIDE[deck.current.id];
  if (!r || deck.pendingSteps > 0) return true;
  const rd = data.rounds[r] || { status: 'idle' };
  if (rd.status === 'idle') {
    room.startRound(r);
    sfx.start();
    hint(`¡Arrancó la ronda ${r}! Los celulares ya están abiertos.`);
    return false;
  }
  if (rd.status === 'running' && timeLeft(rd, store.now()) <= 0) {
    // El reloj ya llegó a cero: se cierra en este momento y se avanza.
    room.closeRound(r);
    return true;
  }
  if (rd.status === 'running' || rd.status === 'paused') {
    if (Date.now() < confirmCloseUntil) {
      room.closeRound(r);
      sfx.end();
      confirmCloseUntil = 0;
      return false;
    }
    confirmCloseUntil = Date.now() + 3000;
    hint('La ronda sigue abierta. Pulsa → otra vez para cerrarla ya.', 3000);
    return false;
  }
  return true;
}

function onSlide(e) {
  const { slide, index } = e.detail;
  const stage = stageFor(slide.id, index, LOBBY_INDEX);
  const word = /^p\d\d$/.test(slide.id) ? parseInt(slide.id.slice(1), 10) : 0;
  room.setState({ slide: slide.id, index, stage, word, total: SLIDES.length, at: store.now() });
  save({ index });
  updateHud();
  postNotes();
}

function onBuilt(e) {
  const { node, instant } = e.detail;
  node.querySelectorAll?.('[data-live="cmp-avg"]').forEach((n) => (instant ? null : countUp(n)));
  if (instant) return;
  if (node.dataset.live === 'podium') {
    if (node.dataset.place === '1') {
      sfx.fanfare();
      confetti($('stage'));
    } else sfx.pop();
  }
  if (node.dataset.live === 'best-gain') sfx.pop();
}

// ---------- Controles ----------
function bindKeys() {
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); deck.next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); deck.prev(); }
    else if (k === 'Home') deck.goto(0);
    else if (k === 'End') deck.goto(SLIDES.length - 1, { final: true });
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'n' || k === 'N') openNotes();
    else if (k === 's' || k === 'S') toggleSound();
    else if (k === 'm' || k === 'M') $('setup').hidden = false;
  });
  $('viewport').addEventListener('click', (e) => {
    if (e.button === 0) deck.next();
  });
  let idle;
  addEventListener('mousemove', () => {
    $('hud').classList.add('show');
    document.body.style.cursor = '';
    clearTimeout(idle);
    idle = setTimeout(() => {
      $('hud').classList.remove('show');
      document.body.style.cursor = 'none';
    }, 2200);
  });
}

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

function toggleSound() {
  setSound(!soundOn());
  save({ sound: soundOn() });
  $('soundChk').checked = soundOn();
  $('hSound').innerHTML = icon(soundOn() ? 'sound' : 'mute', 20);
  hint(soundOn() ? 'Sonidos encendidos' : 'Sonidos apagados', 1400);
}

function openNotes() {
  open(`notas.html${room ? `?s=${room.code}` : ''}`, 'te-acuerdas-notas', 'width=760,height=820');
  setTimeout(postNotes, 600);
}

function updateHud() {
  if (!deck) return;
  $('hCount').textContent = `${deck.index + 1} / ${SLIDES.length}`;
}

function postNotes() {
  if (!deck?.current) return;
  const i = deck.index;
  const next = SLIDES[i + 1];
  const r = ROUND_SLIDE[deck.current.id];
  notesChan.postMessage({
    type: 'slide',
    index: i,
    total: SLIDES.length,
    title: titleOf(deck.current),
    notes: notesOf(deck.current),
    next: next ? titleOf(next) : '— Fin —',
    players: data.rows.length,
    round: r ? { r, ...(data.rounds[r] || {}) } : null,
    serverOffset: store.now() - Date.now(),
  });
}

notesChan.onmessage = (e) => {
  const m = e.data || {};
  if (m.type === 'hello') postNotes();
  if (m.type === 'cmd' && deck) {
    if (m.cmd === 'next') deck.next();
    if (m.cmd === 'prev') deck.prev();
  }
};

// Botones
$('hPrev').innerHTML = icon('prev', 20);
$('hNext').innerHTML = icon('next', 20);
$('hNotes').innerHTML = icon('notes', 20);
$('hSound').innerHTML = icon(soundOn() ? 'sound' : 'mute', 20);
$('hFull').innerHTML = icon('fullscreen', 20);
$('hMenu').innerHTML = icon('qr', 20);
for (const b of $('hud').querySelectorAll('button')) b.addEventListener('click', (e) => e.stopPropagation());
$('hud').addEventListener('click', (e) => e.stopPropagation());
$('hPrev').onclick = () => deck?.prev();
$('hNext').onclick = () => deck?.next();
$('hNotes').onclick = openNotes;
$('hSound').onclick = toggleSound;
$('hFull').onclick = toggleFull;
$('hMenu').onclick = () => ($('setup').hidden = false);
$('soundChk').onchange = () => { setSound($('soundChk').checked); save({ sound: soundOn() }); $('hSound').innerHTML = icon(soundOn() ? 'sound' : 'mute', 20); };
$('btnStart').onclick = () => {
  const i = +$('startAt').value || 0;
  if (deck) {
    $('setup').hidden = true;
    if (i !== deck.index) deck.goto(i, { final: true });
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else startDeck(i);
};
document.querySelectorAll('[data-copy]').forEach((b) => {
  b.onclick = async () => {
    const text = $(b.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); toast('Copiado'); } catch { toast(text, 6000); }
  };
});

boot();

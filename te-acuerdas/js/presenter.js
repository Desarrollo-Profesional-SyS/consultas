// Pantalla de Joss: la presentación completa más el "cerebro" del juego
// (abre la sala, arranca y cierra las rondas, califica y publica resultados).
import { openStore } from './store.js';
import { Room, joinUrl, adminUrl, notesUrl, timeLeft } from './room.js';
import { Deck, notesOf, titleOf } from './deck.js';
import { SLIDES } from './slides-data.js';
import { renderLive, updateTimers, countUp } from './live.js';
import { buildTable, stats, bestGain, stageFor, QUESTIONS, QUESTION_BY_SLIDE, ROUND_COVERS, summarize, escapeHtml, playerExtras } from './game.js';
import { sfx, setSound, soundOn, confetti, REACTIONS, reactionSound } from './fx.js';
import { icon } from './icons.js';
import { avatarSVG } from './avatars.js';
import { guionText } from './guion.js';
import { SOUND_DEFAULT, WORD_SECONDS } from './config.js';

const $ = (id) => document.getElementById(id);
const ROUND_SLIDE = { escribe: 1, segunda: 2 };
const RETO_INDEX = SLIDES.findIndex((s) => s.id === 'reto');
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
let lastSlideId = null;
let clickNo = 0; // en qué clic del guion va la diapositiva actual
let wordTimer = null; // avance automático de las 20 palabras
let wordsPaused = false;
let chunkTimer = null; // cuenta regresiva del número de la prueba rápida
let seenReactions = null; // última reacción vista de cada jugador
let answerCounts = {}; // para sonar cuando llega un voto nuevo
const notesChan = new BroadcastChannel('te-acuerdas-notas');

function emptyData() {
  const s = { count: 0, avg: 0, byNumber: Array(20).fill(0), ranges: [[], [], [], []] };
  return { code: '', url: '', rows: [], stats: { 1: s, 2: s }, rounds: {}, order2: [], best: null, answers: {}, qs: {}, qstate: {}, now: Date.now() };
}

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

// Avisos para Joss: nunca en la diapositiva (la ve todo el grupo), solo en la ventana de notas.
function hint(msg) {
  notesChan.postMessage({ type: 'hint', text: msg, at: Date.now() });
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

// Revisa que en Firebase estén publicadas las reglas de esta versión (avatares con color y
// reacciones). Si no, avisa a Joss: los celulares entran con el avatar sin color y las
// reacciones no llegan. Se escribe un jugador de revisión y se borra al momento.
async function checkRules(r) {
  if (store.mode !== 'firebase') return;
  const flag = `ta-reglas-${r.code}`;
  try { if (localStorage.getItem(flag) === 'ok') return; } catch {}
  const id = '_revision';
  let ok = true;
  try {
    await store.update(r.p(`players/${id}`), { name: 'Revisión', avatar: 339, joinedAt: store.now() });
    await store.set(r.p(`reactions/${id}`), { r: 'risa', t: store.now() });
  } catch (e) {
    console.warn('Reglas de Firebase desactualizadas', e);
    ok = false;
  }
  await store.remove(r.p(`reactions/${id}`)).catch(() => {});
  await store.remove(r.p(`players/${id}`)).catch(() => {});
  if (ok) { try { localStorage.setItem(flag, 'ok'); } catch {} }
  $('rulesWarn').hidden = ok;
}

async function useRoom(r, key, startIndex) {
  room = r;
  await checkRules(r);
  if (!key) key = await r.get('hostKey').catch(() => null);
  save({ code: r.code, key });
  const q = new URLSearchParams(location.search);
  q.set('s', r.code);
  history.replaceState(null, '', `?${q}`);
  data.code = r.code;
  data.url = joinUrl(r.code);
  $('playerLink').textContent = data.url;
  $('adminLink').textContent = key ? adminUrl(r.code, key) : '(no disponible)';
  $('notesLink').textContent = notesUrl(r.code);
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
  data.qstate = roomData.q || {};
  data.qs = {};
  const comments = (qid) => Object.fromEntries(rows.map((r) => [r.id, roomData.players?.[r.id]?.c?.[qid]]));
  for (const qid of Object.keys(QUESTIONS)) data.qs[qid] = summarize(qid, roomData.qa?.[qid], rows, roomData.qhide?.[qid], QUESTIONS[qid].type === 'text' ? comments(qid) : {});
  data.extras = playerExtras(roomData.qa || {});
  data.now = store.now();
  if (deck?.el) renderLive(deck.el, data);
  playAnswerSounds();
  showReactions(roomData.reactions || {});
  handleCmd(roomData.cmd);
  schedulePublish();
  postNotes();
  updateHud();
}

function schedulePublish() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(() => {
    const ex = data.extras || {};
    const allOk = data.rows.reduce((s, r) => s + (ex[r.id]?.ok || 0), 0);
    const allN = data.rows.reduce((s, r) => s + (ex[r.id]?.n || 0), 0);
    const results = {
      _meta: {
        count: data.rows.length, avg1: round1(data.stats[1].avg), avg2: round1(data.stats[2].avg), played1: data.stats[1].count, played2: data.stats[2].count,
        rateAvg: data.qs.rating?.avg != null ? round1(data.qs.rating.avg) : null,
        chunkOk: data.qs.chunk?.ok?.length || 0,
        mythsPct: allN ? Math.round((allOk / allN) * 100) : null,
        quotes: (data.qs.cierre?.visible || []).slice(-6).reverse().map((a) => ({ name: a.name, avatar: a.avatar, v: a.v, area: a.area || '' })),
      },
    };
    for (const r of data.rows) {
      const e = ex[r.id] || {};
      results[r.id] = {
        r1: r.r1, r2: r.r2, total: r.total, place: r.place, h1: r.hits1.join(','), h2: r.hits2.join(','), gain: r.gain ?? 0, p1: r.played1, p2: r.played2,
        rate: e.rate ?? null, mok: e.ok || 0, mn: e.n || 0, ch: e.chunk ? e.chunk.hits : null,
      };
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
  if (cmd.type === 'next') manualNext();
  else if (cmd.type === 'prev') manualPrev();
  else if (cmd.type === 'words') toggleWords();
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
        if (everyoneDone && left > 0) hint('¡Todos terminaron! Ronda cerrada.');
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
    deck.addEventListener('enter', (e) => {
      const cover = ROUND_COVERS[e.detail.slide.id];
      if (cover && e.detail.transition !== 'none') sfx.round(cover.n);
      renderLive(e.detail.el, data, { entering: true });
      resetWordTimer(e.detail.el, false);
    });
    deck.addEventListener('change', onSlide);
    deck.addEventListener('built', onBuilt);
    deck.addEventListener('step', onStep);
    bindKeys();
    deck.go(index, { final: index > 0 });
  }
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function guard() {
  if (chunkTimer) { finishChunk(); return false; } // clic durante la cuenta regresiva: se adelanta
  const r = ROUND_SLIDE[deck.current.id];
  if (!r || deck.pendingSteps > 0) return true;
  const rd = data.rounds[r] || { status: 'idle' };
  if (rd.status === 'idle') {
    room.startRound(r);
    setClick(1);
    sfx.start();
    hint(`Arrancó la ronda ${r}.`);
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
    hint('La ronda sigue abierta. Pulsa → otra vez para cerrarla ya.');
    return false;
  }
  return true;
}

function onSlide(e) {
  const { slide, index } = e.detail;
  const prev = lastSlideId;
  lastSlideId = slide.id;
  cancelChunk();
  if (!/^p\d\d$/.test(slide.id)) cancelWordClock();
  if (prev === 'reto' && slide.id === 'p01') wordsPaused = false; // el primer clic en reto arranca el avance solo
  syncQuestions(prev, slide.id, index);
  const stage = stageFor(slide.id, index, RETO_INDEX);
  const word = /^p\d\d$/.test(slide.id) ? parseInt(slide.id.slice(1), 10) : 0;
  const title = titleOf(slide).slice(0, 90);
  const next = SLIDES[index + 1] ? titleOf(SLIDES[index + 1]).slice(0, 90) : '— Fin —';
  clickNo = countClicks();
  room.setState({ slide: slide.id, index, stage, word, total: SLIDES.length, title, next, click: clickNo, q: QUESTION_BY_SLIDE[slide.id] || null, wordsPaused, at: store.now() });
  save({ index });
  updateHud();
  postNotes();
}

// ---------- Preguntas en vivo: se abren al entrar y se cierran al salir o con su clic ----------
// Última diapositiva donde sigue viva cada pregunta (la suya, la de resultados o la del muro).
const Q_LAST = Object.fromEntries(Object.entries(QUESTIONS).map(([qid, q]) =>
  [qid, Math.max(...[q.slide, q.resultSlide, q.closeAfter].filter(Boolean).map((id) => SLIDES.findIndex((s) => s.id === id)))]));

// Se cierra sola al avanzar más allá de la pregunta; si se regresa, no se cierra nada.
// Si una pregunta se cerró solo por avanzar (sin revelar la respuesta) y se vuelve a ella, se reabre.
const reopenable = (st) => !st?.open && (!st?.closedAt || (st.left && !st.revealed));

function syncQuestions(prevId, nowId, index) {
  const qs = roomData.q || {};
  const prevIndex = prevId ? SLIDES.findIndex((s) => s.id === prevId) : -1;
  if (index > prevIndex) {
    for (const [qid, st] of Object.entries(qs)) if (st?.open && Q_LAST[qid] < index) room.closeQuestion(qid, { left: true });
  }
  const nowQ = QUESTION_BY_SLIDE[nowId];
  if (nowQ) {
    const q = QUESTIONS[nowQ];
    if (nowId === q.slide && q.open !== 'manual' && reopenable(qs[nowQ])) {
      room.openQuestion(nowQ);
      sfx.chime();
    }
  }
}

// Clics de Joss que ya se dieron en esta diapositiva (para marcar el guion). En «chunk» el
// segundo paso lo da la cuenta regresiva; en las rondas, el clic es el que arranca el reloj.
function countClicks() {
  const id = deck?.current?.id;
  if (!id) return 0;
  const r = ROUND_SLIDE[id];
  if (r) return (data.rounds[r]?.status || 'idle') !== 'idle' ? 1 : 0;
  const n = deck.steps.slice(0, deck.stepAt).filter((g) => !g.auto).length;
  return id === 'chunk' ? Math.min(n, 1) : n;
}

function setClick(n) {
  if (n === clickNo) return;
  clickNo = n;
  room.setState({ click: n });
  postNotes();
}

function onStep(e) {
  const { order, auto, instant, slide } = e.detail;
  if (!auto) setClick(countClicks());
  if (instant || auto) return;
  const qid = QUESTION_BY_SLIDE[slide.id];
  const q = qid && QUESTIONS[qid];
  if (q && slide.id === q.slide && q.close === order) {
    room.closeQuestion(qid, { reveal: true });
    sfx.tada();
  }
  if (slide.id === 'chunk' && order === 1) startChunk();
  if (slide.id === 'chunk-res') ({ 1: sfx.tada, 2: sfx.sad })[order]?.();
  if (slide.id === 'comparativo' && order === 2) { sfx.drumroll(1); setTimeout(sfx.tada, 1050); }
  if (slide.id === 'miller' && order === 1) sfx.pop();
}

// Prueba rápida: el número se ve 5 segundos con cuenta regresiva, se oculta solo y se abre la pregunta.
function startChunk() {
  const el = deck.el;
  const cd = el.querySelector('[data-live="chunk-countdown"]');
  let left = 5;
  const show = () => {
    if (!cd) return;
    cd.style.visibility = 'visible';
    cd.textContent = String(left);
    cd.animate([{ scale: '1.25' }, { scale: '1' }], { duration: 300, easing: 'ease-out' });
  };
  show();
  sfx.tick();
  chunkTimer = setInterval(() => {
    left--;
    if (left <= 0) return finishChunk();
    show();
    sfx.tick();
  }, 1000);
}

function finishChunk() {
  cancelChunk();
  const cd = deck.el?.querySelector('[data-live="chunk-countdown"]');
  if (cd) cd.style.visibility = 'hidden';
  if (deck.current?.id === 'chunk' && deck.pendingSteps > 0) deck.next(); // oculta el número y muestra el resto
  sfx.poof();
  if (reopenable((roomData.q || {}).chunk)) {
    room.openQuestion('chunk');
    setTimeout(sfx.chime, 450);
  }
}

function cancelChunk() {
  clearInterval(chunkTimer);
  chunkTimer = null;
}

// ---------- Las 20 palabras: cada una se queda WORD_SECONDS y avanza sola ----------
function wordSvg(el = deck?.el) {
  return el?.querySelector('[data-live="word-timer"]');
}

function resetWordTimer(el, run) {
  const svg = wordSvg(el);
  if (!svg?.setCurrentTime) return;
  svg.pauseAnimations();
  svg.setCurrentTime(0);
  if (run) svg.unpauseAnimations();
}

function startWordClock() {
  cancelWordClock();
  if (wordsPaused || !/^p\d\d$/.test(deck.current?.id || '')) return;
  resetWordTimer(deck.el, true);
  const id = deck.current.id;
  wordTimer = setTimeout(() => {
    wordTimer = null;
    if (deck.current?.id === id && id !== 'p20') deck.next(); // en la 20 se detiene
  }, (WORD_SECONDS || 5) * 1000);
}

function cancelWordClock() {
  clearTimeout(wordTimer);
  wordTimer = null;
}

function toggleWords() {
  wordsPaused = !wordsPaused;
  if (wordsPaused) {
    cancelWordClock();
    wordSvg()?.pauseAnimations();
  } else startWordClock();
  room.setState({ wordsPaused });
  hint(wordsPaused ? 'Avance de palabras en pausa (P para seguir).' : 'Avance de palabras reanudado.');
}

// Avanzar o retroceder a mano cancela el reloj de la palabra en curso.
function manualNext() {
  cancelWordClock();
  deck.next();
}

function manualPrev() {
  if (/^p\d\d$/.test(deck.current?.id || '')) {
    wordsPaused = true;
    room.setState({ wordsPaused });
  }
  cancelWordClock();
  deck.prev();
}

function onBuilt(e) {
  const { node, instant } = e.detail;
  if (node.id === 'word' && !instant) { startWordClock(); sfx.pop(); } // el reloj corre desde que se ven imagen y palabra
  node.querySelectorAll?.('[data-live="cmp-avg"]').forEach((n) => (instant ? null : countUp(n)));
  if (instant) return;
  if (node.dataset.live === 'podium') {
    if (node.dataset.place === '1') {
      sfx.fanfare();
      confetti($('stage'));
    } else sfx.tada();
  }
  if (node.dataset.live === 'best-gain') sfx.applause(1.2);
}

// ---------- Sonido cuando llegan votos y respuestas ----------
function playAnswerSounds() {
  const qid = QUESTION_BY_SLIDE[deck?.current?.id];
  for (const [id, sm] of Object.entries(data.qs)) {
    const before = answerCounts[id];
    answerCounts[id] = sm.count;
    if (id === qid && before !== undefined && sm.count > before) sfx.bloop();
  }
}

// ---------- Reacciones: flotan sobre la diapositiva con su sonido ----------
function reactionsAllowed() {
  const id = deck?.current?.id || '';
  if (/^(reto|p\d\d)$/.test(id)) return false; // no distraer mientras se memorizan las palabras
  return ![1, 2].some((r) => data.rounds[r]?.status === 'running' || data.rounds[r]?.status === 'paused');
}

function showReactions(all) {
  if (seenReactions === null || !deck) { seenReactions = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v?.t])); return; }
  const byId = Object.fromEntries(data.rows.map((r) => [r.id, r]));
  let shown = $('stage').querySelectorAll('.reaction').length;
  for (const [uid, v] of Object.entries(all)) {
    if (!v || seenReactions[uid] === v.t) continue;
    seenReactions[uid] = v.t;
    const who = byId[uid];
    const re = REACTIONS.find((x) => x.id === v.r);
    if (!who || !re || !reactionsAllowed() || store.now() - v.t > 8000 || shown >= 14) continue;
    shown++;
    spawnReaction(re, who);
  }
}

function spawnReaction(re, who) {
  const el = document.createElement('div');
  el.className = 'reaction';
  el.style.left = `${120 + Math.random() * 1600}px`;
  el.innerHTML = `<span class="emo">${re.emoji}</span><span class="who">${avatarSVG(who.avatar, { size: 34, title: who.name })}<b>${escapeHtml(who.name)}</b></span>`;
  $('stage').appendChild(el);
  const drift = (Math.random() - 0.5) * 160;
  const a = el.animate([
    { transform: 'translate(0, 0) scale(.4)', opacity: 0 },
    { transform: `translate(${drift * 0.3}px, -120px) scale(1.1)`, opacity: 1, offset: 0.15 },
    { transform: `translate(${drift}px, -560px) scale(1)`, opacity: 1, offset: 0.8 },
    { transform: `translate(${drift * 1.2}px, -680px) scale(.9)`, opacity: 0 },
  ], { duration: 3400, easing: 'cubic-bezier(.2,.7,.3,1)' });
  a.finished.then(() => el.remove()).catch(() => el.remove());
  reactionSound(re.id);
}

// ---------- Controles ----------
function bindKeys() {
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, select, textarea')) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); manualNext(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); manualPrev(); }
    else if (k === 'p' || k === 'P') toggleWords();
    else if (k === 'Home') deck.goto(0);
    else if (k === 'End') deck.goto(SLIDES.length - 1, { final: true });
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'n' || k === 'N') openNotes();
    else if (k === 's' || k === 'S') toggleSound();
    else if (k === 'm' || k === 'M') $('setup').hidden = false;
  });
  $('viewport').addEventListener('click', (e) => {
    if (e.button === 0) manualNext();
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
  hint(soundOn() ? 'Sonidos encendidos' : 'Sonidos apagados');
}

function openNotes() {
  const w = open(room ? notesUrl(room.code) : 'notas.html', 'te-acuerdas-notas', 'width=760,height=820');
  if (!w) toast('Tu navegador bloqueó la ventana de notas. Permite las ventanas emergentes de esta página o abre el link de notas en tu celular o tablet (está en el menú, tecla M).', 7000);
  setTimeout(postNotes, 600);
}

function updateHud() {
  if (!deck) return;
  $('hCount').textContent = `${deck.index + 1} / ${SLIDES.length}`;
}

function postNotes() {
  const i = deck?.current ? deck.index : +$('startAt').value || 0;
  const cur = SLIDES[i];
  const next = SLIDES[i + 1];
  const r = ROUND_SLIDE[cur.id];
  notesChan.postMessage({
    type: 'slide',
    index: i,
    total: SLIDES.length,
    title: titleOf(cur),
    id: cur.id,
    click: deck?.current ? clickNo : null,
    notes: guionText(cur.id) || notesOf(cur),
    next: next ? titleOf(next) : '— Fin —',
    wordsPaused,
    players: data.rows.length,
    round: r ? { r, ...(data.rounds[r] || {}) } : null,
    serverOffset: store ? store.now() - Date.now() : 0,
  });
}

notesChan.onmessage = (e) => {
  const m = e.data || {};
  if (m.type === 'hello') postNotes();
  if (m.type === 'cmd' && deck) {
    if (m.cmd === 'next') manualNext();
    if (m.cmd === 'prev') manualPrev();
    if (m.cmd === 'words') toggleWords();
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
$('hPrev').onclick = () => deck && manualPrev();
$('hNext').onclick = () => deck && manualNext();
$('hNotes').onclick = openNotes;
$('btnNotes').onclick = openNotes;
$('startAt').onchange = postNotes;
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

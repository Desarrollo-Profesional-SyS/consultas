// Panel de Alex (co-conductor): reloj de las rondas, control remoto de la
// presentación, corrección de respuestas, tabla y jugadores de prueba.
import { openStore } from './store.js';
import { Room, joinUrl, timeLeft, isOpen } from './room.js';
import { SLIDES } from './slides-data.js';
import { notesOf, titleOf } from './deck.js';
import { avatarSVG, AVATAR_COUNT } from './avatars.js';
import { WORDS, N_WORDS, buildTable, stats, isCorrect, autoVerdict, answerKey, botSheet, fmtTime, escapeHtml, norm } from './game.js';

const $ = (id) => document.getElementById(id);
const tabEl = $('tab');
const ROUND_SLIDE = { escribe: 1, segunda: 2 };
const BOT_NAMES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer', 'Gaby', 'Hugo', 'Iván', 'Jime', 'Karla', 'Leo', 'Majo', 'Nico', 'Óscar', 'Pau', 'Quique', 'Rocío', 'Santi', 'Tere', 'Uli', 'Vale', 'Wendy', 'Ximena', 'Yaz'];

let store;
let room;
let data = {};
let rows = [];
let tab = 'live';
let reviewRound = 1;
let lastRender = '';
let botTimers = [];
let botsScheduled = {};
const closingBackup = {};
const titles = SLIDES.map(titleOf);

function toast(msg, ms = 2400) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('s') || '').toUpperCase();
  const key = new URLSearchParams(location.hash.slice(1)).get('k');
  if (!code || !key) {
    tabEl.innerHTML = '<div class="card"><p class="lead">Este panel se abre con el link que Joss te manda desde su pantalla de inicio.</p></div>';
    return;
  }
  try {
    store = await openStore();
  } catch (e) {
    tabEl.innerHTML = '<div class="card"><p class="lead">No se pudo conectar. Revisa tu internet y recarga.</p></div>';
    return;
  }
  room = new Room(store, code);
  $('roomPill').textContent = `SALA ${code}`;
  try {
    await room.claimHost(key);
  } catch (e) {
    console.error(e);
    tabEl.innerHTML = '<div class="card"><p class="lead">El link del panel no es válido para esta sala. Pídele a Joss que te lo mande otra vez.</p></div>';
    return;
  }
  store.onConnection((ok) => {
    $('netDot').classList.toggle('off', !ok);
    $('netTxt').textContent = ok ? (store.mode === 'local' ? 'ensayo local' : 'en línea') : 'sin conexión';
  });
  let pending = null;
  room.on('', (v) => {
    data = v || {};
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      rows = buildTable(data.players, data.answers, data.overrides, data.kicked);
      $('nPlayers').textContent = rows.length;
      runBots();
      render();
    }, 200);
  });
  setInterval(tick, 250);
}

// ---------- Pestañas ----------
document.querySelectorAll('[data-tab]').forEach((b) => {
  b.onclick = () => {
    tab = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
    lastRender = '';
    render();
  };
});

$('copyLink').onclick = async () => {
  if (!room) return;
  const text = `Entra al juego aquí 👉 ${joinUrl(room.code)}`;
  try { await navigator.clipboard.writeText(text); toast('Link copiado. Pégalo en el chat.'); } catch { toast(text, 8000); }
};

function render() {
  const sig = JSON.stringify([tab, reviewRound, data.state, data.rounds, data.players, data.answers, data.overrides, data.kicked]);
  if (sig === lastRender) return;
  lastRender = sig;
  const scroll = scrollY;
  ({ live: renderLive, players: renderPlayers, review: renderReview, table: renderTable, rehearsal: renderRehearsal })[tab]();
  scrollTo({ top: scroll });
}

// ---------- En vivo ----------
function currentRound() {
  const open = [1, 2].find((r) => isOpen(data.rounds?.[r]));
  if (open) return open;
  const slide = data.state?.slide;
  if (ROUND_SLIDE[slide]) return ROUND_SLIDE[slide];
  const idx = data.state?.index ?? 0;
  return idx > SLIDES.findIndex((s) => s.id === 'escribe') && data.rounds?.[1]?.status === 'closed' ? 2 : 1;
}

function renderLive() {
  const idx = data.state?.index ?? 0;
  const slide = SLIDES[idx] || SLIDES[0];
  const r = currentRound();
  const rd = data.rounds?.[r] || { status: 'idle' };
  const sheets = data.answers?.[r] || {};
  const writing = rows.filter((row) => sheets[row.id] && Object.keys(sheets[row.id]).some((k) => k[0] === 'w' && sheets[row.id][k])).length;
  const done = rows.filter((row) => sheets[row.id]?._d).length;
  const label = { idle: 'Sin empezar', running: 'Corriendo', paused: 'En pausa', closed: 'Cerrada' }[rd.status];
  tabEl.innerHTML = `
    <div class="cols">
      <div class="card now-slide">
        <p class="kicker">En pantalla · ${idx + 1} de ${SLIDES.length}</p>
        <h2>${escapeHtml(titles[idx])}</h2>
        <div class="notes">${escapeHtml(notesOf(slide)) || 'Sin notas.'}</div>
        <p class="muted">Sigue: ${escapeHtml(titles[idx + 1] || '— fin —')}</p>
        <div class="row">
          <button class="btn small dark" id="prev">← Anterior</button>
          <button class="btn small" id="next">Siguiente →</button>
          <select id="goto" style="font:inherit;border-radius:12px;padding:8px;background:var(--night);color:var(--cream);border:2px solid var(--grape);max-width:100%">
            <option value="">Ir a…</option>
            ${SLIDES.map((s, i) => `<option value="${s.id}">${i + 1}. ${escapeHtml(titles[i].slice(0, 44))}</option>`).join('')}
          </select>
        </div>
        <p class="muted">Estos botones mueven la presentación de Joss (por si se le traba el clic).</p>
      </div>
      <div class="card round-box">
        <p class="kicker">Ronda ${r} · ${label}</p>
        <div class="timer ${r === 2 ? 'r2' : ''}" id="timer">${fmtTime(timeLeft(rd, store.now()) ?? (r === 1 ? 120000 : 180000))}</div>
        <p class="lead"><b>${writing}</b> de ${rows.length} escribiendo · <b>${done}</b> ya enviaron</p>
        <div class="row">
          ${rd.status === 'idle' ? '<button class="btn" id="start">Arrancar reloj</button>' : ''}
          ${rd.status === 'running' ? '<button class="btn cream" id="pause">Pausar</button>' : ''}
          ${rd.status === 'paused' ? '<button class="btn" id="resume">Reanudar</button>' : ''}
          ${rd.status !== 'idle' ? '<button class="btn dark" id="plus">+30 s</button>' : ''}
          ${isOpen(rd) ? '<button class="btn pink" id="close">Cerrar ya</button>' : ''}
        </div>
        <p class="muted">Normalmente Joss arranca el reloj con su clic y se cierra solo al llegar a 0. Usa esto solo si hace falta.</p>
        ${rd.status !== 'idle' ? '<button class="btn ghost small" id="reset">Reiniciar esta ronda (borra sus respuestas)</button>' : ''}
      </div>
    </div>`;
  $('prev').onclick = () => room.sendCmd('prev');
  $('next').onclick = () => room.sendCmd('next');
  $('goto').onchange = (e) => { if (e.target.value) room.sendCmd('goto', e.target.value); e.target.value = ''; };
  const on = (id, fn) => { if ($(id)) $(id).onclick = fn; };
  on('start', () => room.startRound(r));
  on('pause', () => room.pauseRound(r, rd));
  on('resume', () => room.resumeRound(r, rd));
  on('plus', () => room.addTime(r, rd, 30).then(() => toast('+30 segundos')));
  on('close', () => confirm('¿Cerrar la ronda ya? Los celulares se bloquean.') && room.closeRound(r));
  on('reset', () => confirm(`¿Reiniciar la ronda ${r}? Se borran todas sus respuestas.`) && room.resetRound(r));
}

function tick() {
  if (!store || !data.rounds) return;
  // Respaldo: si la pantalla de Joss no está abierta, el panel cierra la ronda vencida.
  for (const r of [1, 2]) {
    const rd = data.rounds[r];
    if (rd?.status === 'running' && store.now() > rd.endsAt + 5000 && !closingBackup[r]) {
      closingBackup[r] = true;
      room.closeRound(r).finally(() => setTimeout(() => (closingBackup[r] = false), 3000));
    }
  }
  const t = $('timer');
  if (t && tab === 'live') {
    const r = currentRound();
    const left = timeLeft(data.rounds?.[r], store.now());
    if (left !== null) {
      t.textContent = fmtTime(left);
      t.classList.toggle('warn', left > 0 && left <= 30000);
    }
  }
}

// ---------- Jugadores ----------
function sheetStatus(r, id) {
  const s = data.answers?.[r]?.[id];
  if (!s) return '—';
  const n = Object.keys(s).filter((k) => k[0] === 'w' && s[k]).length;
  return s._d ? `✔ enviado (${n})` : `${n}/20`;
}

function renderPlayers() {
  const all = Object.entries(data.players || {}).filter(([, p]) => p?.name).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
  tabEl.innerHTML = `
    <div class="card">
      <p class="lead" style="margin-bottom:10px"><b>${rows.length}</b> en el juego. Si alguien pone un nombre inapropiado, sácalo con el botón (desaparece de la pantalla y de la tabla).</p>
      <table class="table">
        <thead><tr><th>Jugador</th><th>Conexión</th><th>Ronda 1</th><th>Ronda 2</th><th></th></tr></thead>
        <tbody>
          ${all.map(([id, p]) => {
            const out = !!data.kicked?.[id];
            return `<tr style="${out ? 'opacity:.45' : ''}">
              <td><span class="who">${avatarSVG(p.avatar ?? 0, { size: 36 })}${escapeHtml(p.name)}${p.bot ? ' <span class="pill">prueba</span>' : ''}</span></td>
              <td><span class="dot ${p.online === false ? 'off' : ''}"></span></td>
              <td>${sheetStatus(1, id)}</td>
              <td>${sheetStatus(2, id)}</td>
              <td style="text-align:right"><button class="btn small ${out ? '' : 'dark'}" data-kick="${id}" data-out="${out}">${out ? 'Regresar' : 'Sacar'}</button></td>
            </tr>`;
          }).join('') || '<tr><td colspan="5" class="muted">Todavía no entra nadie.</td></tr>'}
        </tbody>
      </table>
    </div>`;
  tabEl.querySelectorAll('[data-kick]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.kick;
      if (b.dataset.out === 'true') room.unkick(id);
      else if (confirm(`¿Sacar a «${data.players[id].name}» del juego?`)) room.kick(id);
    };
  });
}

// ---------- Revisar respuestas ----------
function renderReview() {
  const sheets = data.answers?.[reviewRound] || {};
  const ids = new Set(rows.map((r) => r.id));
  const overrides = data.overrides || {};
  const blocks = WORDS.map((w) => {
    const groups = new Map();
    for (const [id, s] of Object.entries(sheets)) {
      if (!ids.has(id)) continue;
      const raw = (s?.['w' + w.n] || '').trim();
      if (!raw || !norm(raw)) continue;
      const k = answerKey(raw);
      if (!groups.has(k)) groups.set(k, { text: raw, count: 0 });
      groups.get(k).count++;
    }
    const list = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);
    const chips = list.map(([k, g]) => {
      const ok = isCorrect(w.n, g.text, overrides);
      const forced = overrides?.[w.n]?.[k] !== undefined && overrides?.[w.n]?.[k] !== null;
      return `<button class="ans ${ok ? 'ok' : 'no'} ${forced ? 'forced' : ''}" data-n="${w.n}" data-text="${escapeHtml(g.text)}" title="${forced ? 'Corregido por ti · clic para cambiar' : 'Calificado automático · clic para cambiar'}">${ok ? '✓' : '✗'} ${escapeHtml(g.text)} <small>×${g.count}</small></button>`;
    }).join('');
    return `<div class="word"><h4><b>${w.n}</b>${escapeHtml(w.word)}</h4><div class="answers-list">${chips || '<span class="muted">Sin respuestas</span>'}</div></div>`;
  }).join('');
  tabEl.innerHTML = `
    <div class="card review">
      <div class="row" style="justify-content:space-between">
        <p class="lead">Toca una respuesta para marcarla como buena o mala <b>para todos</b> los que la escribieron. Las que tienen borde rosa las corregiste tú. La pantalla y la tabla se actualizan solas.</p>
        <div class="row">
          <button class="btn small ${reviewRound === 1 ? '' : 'dark'}" data-r="1">Ronda 1</button>
          <button class="btn small ${reviewRound === 2 ? '' : 'dark'}" data-r="2">Ronda 2</button>
        </div>
      </div>
      ${blocks}
    </div>`;
  tabEl.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => { reviewRound = +b.dataset.r; lastRender = ''; render(); }; });
  tabEl.querySelectorAll('.ans').forEach((b) => {
    b.onclick = () => {
      const n = +b.dataset.n;
      const text = b.dataset.text;
      const now = isCorrect(n, text, overrides);
      const auto = autoVerdict(n, text);
      // Si al cambiarla queda igual que la calificación automática, se quita la corrección.
      room.setOverride(n, text, !now === auto ? null : !now);
    };
  });
}

// ---------- Tabla ----------
function renderTable() {
  const s1 = stats(rows, 1);
  const s2 = stats(rows, 2);
  tabEl.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <p class="lead">Promedio ronda 1: <b>${s1.count ? s1.avg.toFixed(1) : '—'}</b> · ronda 2: <b>${s2.count ? s2.avg.toFixed(1) : '—'}</b></p>
        <button class="btn small pink" id="toPodium">Mostrar el podio en pantalla</button>
      </div>
      <table class="table">
        <thead><tr><th>#</th><th>Jugador</th><th style="text-align:right">R1</th><th style="text-align:right">R2</th><th style="text-align:right">Total</th><th style="text-align:right">Mejora</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>
            <td class="num" style="text-align:left">${r.place}</td>
            <td><span class="who">${avatarSVG(r.avatar, { size: 36 })}${escapeHtml(r.name)}</span></td>
            <td class="num">${r.played1 ? r.r1 : '—'}</td>
            <td class="num">${r.played2 ? r.r2 : '—'}</td>
            <td class="num" style="color:var(--lime)">${r.total}</td>
            <td class="num">${r.gain === null ? '—' : (r.gain > 0 ? '+' : '') + r.gain}</td>
          </tr>`).join('') || '<tr><td colspan="6" class="muted">Sin jugadores todavía.</td></tr>'}
        </tbody>
      </table>
    </div>`;
  $('toPodium').onclick = () => room.sendCmd('goto', 'podio');
}

// ---------- Ensayo ----------
function renderRehearsal() {
  const bots = Object.entries(data.players || {}).filter(([, p]) => p?.bot);
  tabEl.innerHTML = `
    <div class="cols">
      <div class="card">
        <h3 style="margin:0 0 8px">Jugadores de prueba</h3>
        <p class="lead">Para ensayar sin gente: entran ${BOT_NAMES.length} jugadores falsos y contestan solos cuando arranca cada ronda (mientras este panel esté abierto). <b>Quítalos antes del evento real</b> o crea una sala nueva.</p>
        <div class="row" style="margin-top:12px">
          <button class="btn" id="addBots" ${bots.length ? 'disabled' : ''}>Agregar ${BOT_NAMES.length} jugadores de prueba</button>
          <button class="btn dark" id="delBots" ${bots.length ? '' : 'disabled'}>Quitar jugadores de prueba (${bots.length})</button>
        </div>
      </div>
      <div class="card">
        <h3 style="margin:0 0 8px">Empezar de cero</h3>
        <p class="lead">Borra las respuestas de las dos rondas y deja los relojes sin empezar. Los jugadores siguen dentro.</p>
        <button class="btn pink" id="wipe" style="margin-top:12px">Reiniciar las dos rondas</button>
      </div>
    </div>`;
  $('addBots').onclick = addBots;
  $('delBots').onclick = async () => {
    const patch = {};
    for (const [id] of bots) {
      patch[`players/${id}`] = null;
      patch[`answers/1/${id}`] = null;
      patch[`answers/2/${id}`] = null;
    }
    await store.update(room.p(), patch);
    toast('Jugadores de prueba fuera');
  };
  $('wipe').onclick = async () => {
    if (!confirm('¿Borrar las respuestas de las dos rondas?')) return;
    await Promise.all([room.resetRound(1), room.resetRound(2), store.remove(room.p('results'))]);
    botsScheduled = {};
    toast('Rondas reiniciadas');
  };
}

function addBots() {
  BOT_NAMES.forEach((name, i) => {
    const id = `bot-${String(i + 1).padStart(2, '0')}`;
    botTimers.push(setTimeout(() => {
      store.update(room.p(`players/${id}`), { name, avatar: (i * 7) % AVATAR_COUNT, joinedAt: store.now(), online: true, bot: true });
    }, 250 + i * 350 + Math.random() * 300));
  });
  toast('Entrando jugadores de prueba…');
}

// Cuando arranca una ronda, los jugadores de prueba van contestando poco a poco.
function runBots() {
  const bots = Object.entries(data.players || {}).filter(([id, p]) => p?.bot && !data.kicked?.[id]);
  if (!bots.length) return;
  for (const r of [1, 2]) {
    const rd = data.rounds?.[r];
    const key = `${r}-${rd?.startedAt}`;
    if (rd?.status !== 'running' || botsScheduled[key]) continue;
    botsScheduled[key] = true;
    const span = Math.max(4000, rd.endsAt - store.now() - 3000);
    for (const [id] of bots) {
      const sheet = botSheet(r);
      const keys = Object.keys(sheet);
      const parts = [keys.slice(0, Math.ceil(keys.length / 2)), keys.slice(Math.ceil(keys.length / 2))];
      parts.forEach((ks, j) => {
        botTimers.push(setTimeout(() => {
          if (!isOpen(data.rounds?.[r])) return;
          const patch = {};
          for (const k of ks) patch[k] = sheet[k];
          store.update(room.p(`answers/${r}/${id}`), { ...patch, _t: store.now(), ...(j === 1 && Math.random() < 0.5 ? { _d: store.now() } : {}) });
        }, span * (0.15 + j * 0.4 + Math.random() * 0.3)));
      });
    }
  }
}

boot();

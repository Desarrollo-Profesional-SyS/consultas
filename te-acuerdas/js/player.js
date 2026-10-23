// El celular de cada participante: entrar a la sala (avatar + nombre), contestar
// las preguntas en vivo, ver la pantalla mientras pasan las palabras, contestar
// las dos rondas y ver su lugar.
import { openStore } from './store.js';
import { REACTIONS } from './fx.js';
import { Room, timeLeft, isOpen } from './room.js';
import { avatarSVG, AVATARS, COLORS, encodeAvatar, decodeAvatar, randomAvatar } from './avatars.js';
import { WORDS, N_WORDS, RANGES, QUESTIONS, ROUND_COVERS, CHUNK_NUMBER, chunkScore, clampName, fmtTime, escapeHtml } from './game.js';

const $ = (id) => document.getElementById(id);
const view = $('view');
const JOKES = ['Bienvenido al club. Es lo normal.', 'Arriba del promedio. Nada mal.', 'Sospechoso. ¿Hiciste trampa?', 'Ven a dar tú la capacitación.'];

let store;
let room;
let st = { state: {}, rounds: {}, players: {}, results: {}, kicked: {}, order2: [], q: {}, mine: { 1: null, 2: null }, qa: {} };
let me = null; // { name, avatar }
let editing = false;
let draft = { name: '', avatar: null };
let screenKey = '';
let sheetRound = 0;
let pending = {};
let saveTimer = null;
let wakeLock = null;

function toast(msg, ms = 2400) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('s') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  try {
    store = await openStore();
  } catch (e) {
    console.error(e);
    view.innerHTML = `<p class="mid">Sin conexión</p><p class="lead">No pudimos conectarnos. Revisa tu internet y vuelve a abrir el link.</p><button class="btn" onclick="location.reload()">Reintentar</button>`;
    return;
  }
  if (!code) return askCode();
  room = new Room(store, code);
  if (!(await room.exists().catch(() => false))) return askCode(`No encontramos la sala ${code}. Revisa el código.`);

  const watch = (path, key) => room.on(path, (v) => { st[key] = v || (key === 'order2' ? [] : {}); render(); });
  watch('state', 'state');
  watch('rounds', 'rounds');
  watch('players', 'players');
  watch('results', 'results');
  watch('kicked', 'kicked');
  watch('order2', 'order2');
  watch('q', 'q');
  for (const qid of Object.keys(QUESTIONS)) room.on(`qa/${qid}/${store.uid}`, (v) => { st.qa[qid] = v; render(); });
  for (const r of [1, 2]) room.on(`answers/${r}/${store.uid}`, (v) => { st.mine[r] = v; render(); });
  store.onConnection((ok) => {
    if (ok && me) room.markOnline().catch(() => {});
    if (!ok && me) toast('Sin conexión… reintentando', 2000);
  });
  setInterval(tickTimer, 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && isOpen(st.rounds[sheetRound])) lockScreen(true); });
}

function askCode(msg = '') {
  view.innerHTML = `
    <p class="mid">ENTRA A LA SALA</p>
    <p class="lead">${escapeHtml(msg) || 'Escribe el código de 4 letras que aparece en la pantalla.'}</p>
    <input class="input" id="code" maxlength="4" autocomplete="off" autocapitalize="characters" style="text-align:center;font-size:32px;letter-spacing:10px;text-transform:uppercase" aria-label="Código de la sala">
    <button class="btn" id="go">Entrar</button>`;
  $('go').onclick = () => {
    const c = $('code').value.toUpperCase().replace(/[^A-Z]/g, '');
    if (c.length === 4) location.search = `?s=${c}${new URLSearchParams(location.search).has('ensayo') ? '&ensayo' : ''}`;
  };
}

// ---------- Reacciones ----------
let reactCool = false;
function setupReactions() {
  const bar = $('reactbar');
  bar.innerHTML = REACTIONS.map((r) => `<button type="button" data-r="${r.id}" aria-label="${r.label}"><span>${r.emoji}</span>${r.label}</button>`).join('');
  bar.querySelectorAll('[data-r]').forEach((b) => {
    b.onclick = () => {
      if (reactCool) return;
      reactCool = true;
      bar.classList.add('cool');
      setTimeout(() => { reactCool = false; bar.classList.remove('cool'); }, 1500);
      room.react(b.dataset.r).catch(() => {});
      navigator.vibrate?.(15);
      const r = b.getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'fly';
      f.textContent = b.querySelector('span').textContent;
      f.style.left = `${r.left + r.width / 2 - 21}px`;
      f.style.top = `${r.top - 30}px`;
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 1000);
    };
  });
}

// La barra se ve cuando ya entraste, salvo mientras pasan las palabras o en una ronda.
function showReactions(on) {
  const bar = $('reactbar');
  if (on && !bar.childElementCount) setupReactions();
  bar.hidden = !on;
}

// ---------- Qué pantalla toca ----------
function render() {
  const mineP = st.players?.[store.uid];
  me = mineP?.name ? { name: mineP.name, avatar: mineP.avatar ?? 0 } : null;
  $('me').innerHTML = me && !editing ? `${avatarSVG(me.avatar, { size: 36 })}<span>${escapeHtml(me.name)}</span>` : room ? `<span class="pill">SALA ${room.code}</span>` : '';

  const roundOpen = [1, 2].some((r) => isOpen(st.rounds?.[r]));
  showReactions(!!me && !editing && !st.kicked?.[store.uid] && !roundOpen && st.state?.stage !== 'watch');
  if (st.kicked?.[store.uid]) return show('kicked', kickedScreen);
  if (!me || editing) return show(`join${editing ? '-edit' : ''}`, joinScreen);

  const open = [1, 2].find((r) => isOpen(st.rounds[r]));
  if (open) return show(`sheet-${open}`, () => sheetScreen(open), true);

  const qid = st.state?.q;
  if (qid && QUESTIONS[qid]) {
    const qs = st.q?.[qid] || {};
    const mine = st.qa?.[qid];
    return show(`q-${qid}-${qs.open ? 'o' : 'c'}-${qs.closedAt ? 'x' : ''}-${qs.revealed ? 'r' : ''}-${mine ? `${mine.v}|${mine.area || ''}|${mine.t}` : ''}-${st.state.slide}`, () => questionScreen(qid));
  }

  const stage = st.state?.stage || 'pre';
  const s1 = st.rounds?.[1]?.status || 'idle';
  const s2 = st.rounds?.[2]?.status || 'idle';
  const res = st.results?.[store.uid];

  if (s2 === 'closed' || stage === 'final') {
    if (s2 === 'closed' || s1 === 'closed') return show(`final-${!!res}-${res?.r1}-${res?.r2}-${res?.place}-${st.results?._meta?.count}-${stage === 'final'}`, finalScreen);
  }
  if (stage === 'r2') return show('ready-2', () => readyScreen(2));
  if (s1 === 'closed' && (stage === 'r1' || stage === 'after1' || stage === 'code')) {
    return show(`after1-${stage}-${res?.r1}-${res?.place}-${res?.h1}`, () => afterOneScreen(stage));
  }
  if (stage === 'r1') return show('ready-1', () => readyScreen(1));
  if (stage === 'watch') return show(`watch-${st.state.word || 0}`, watchScreen, false, true);
  if (stage === 'lobby') {
    const count = Object.keys(st.players || {}).filter((id) => !st.kicked?.[id]).length;
    return show(`wait-${count}-${me.name}-${me.avatar}`, waitScreen);
  }
  const cover = ROUND_COVERS[st.state?.slide];
  if (cover) return show(`cover-${st.state.slide}-${me.avatar}`, () => coverScreen(cover));
  return show(`look-${me.name}-${me.avatar}`, lookScreen);
}

// Redibuja solo si cambió la pantalla (para no perder lo que se está escribiendo).
function show(key, fn, sticky = false, soft = false) {
  if (key === screenKey) return;
  if (soft && screenKey.split('-')[0] === key.split('-')[0]) {
    const prevKey = screenKey;
    screenKey = key;
    if (prevKey.startsWith('watch')) return updateWatch();
  }
  const leavingSheet = screenKey.startsWith('sheet') && !key.startsWith('sheet');
  screenKey = key;
  if (leavingSheet) { flush(); lockScreen(false); }
  view.classList.remove('screen');
  void view.offsetWidth;
  view.classList.add('screen');
  view.className = `screen ${sticky ? '' : 'center'}`;
  fn();
  scrollTo({ top: 0 });
}

// ---------- Entrar ----------
function joinScreen() {
  if (draft.avatar === null) {
    draft = me ? { name: me.name, avatar: me.avatar } : { name: '', avatar: randomAvatar() };
  }
  let { style, color } = decodeAvatar(draft.avatar);
  if (color === null) color = COLORS.findIndex((c) => c.body === AVATARS[style].body); // avatar de la versión anterior
  const styles = () => AVATARS.map((a, i) => `<button type="button" data-a="${i}" aria-pressed="${i === style}" aria-label="${a.name}">${avatarSVG(encodeAvatar(i, color), { size: 72 })}</button>`).join('');
  view.innerHTML = `
    <div class="bounce" id="preview">${avatarSVG(draft.avatar, { size: 120 })}</div>
    <div class="field" style="text-align:left">
      <p class="label">1. Elige tu cerebro</p>
      <div class="avatars" id="styles" role="group" aria-label="Cerebros">${styles()}</div>
    </div>
    <div class="field" style="text-align:left">
      <p class="label">2. Elige tu color</p>
      <div class="swatches" role="group" aria-label="Colores">
        ${COLORS.map((c, k) => `<button type="button" data-c="${k}" aria-pressed="${k === color}" aria-label="${c.name}" style="background:${c.hex}"></button>`).join('')}
      </div>
    </div>
    <div class="field" style="text-align:left">
      <label class="label" for="name">3. Tu nombre</label>
      <input class="input" id="name" maxlength="18" autocomplete="nickname" enterkeyhint="go" placeholder="Como te dicen en la ofi" value="${escapeHtml(draft.name)}">
      <span class="hint-text">Así vas a salir en la pantalla, en la tabla y en tu recuerdo.</span>
    </div>
    <p class="lead" style="font-size:16px">Durante toda la sesión vas a contestar aquí: votaciones, un número, tu opinión, reacciones y el reto de las 20 palabras.</p>
    <button class="btn" id="join" style="font-size:22px;min-height:60px">${editing ? 'Guardar cambios' : '¡Entrar al juego!'}</button>
    ${editing ? '<button class="btn ghost" id="cancel">Cancelar</button>' : ''}`;
  const update = () => {
    draft.avatar = encodeAvatar(style, color);
    $('preview').innerHTML = avatarSVG(draft.avatar, { size: 120 });
    navigator.vibrate?.(10);
  };
  const bindStyles = () => view.querySelectorAll('#styles button').forEach((b) => {
    b.onclick = () => {
      style = +b.dataset.a;
      view.querySelectorAll('#styles button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      update();
    };
  });
  bindStyles();
  view.querySelectorAll('[data-c]').forEach((b) => {
    b.onclick = () => {
      color = +b.dataset.c;
      view.querySelectorAll('[data-c]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      $('styles').innerHTML = styles();
      bindStyles();
      update();
    };
  });
  draft.avatar = encodeAvatar(style, color);
  const name = $('name');
  name.oninput = () => { draft.name = name.value; };
  name.onkeydown = (e) => { if (e.key === 'Enter') $('join').click(); };
  $('join').onclick = async () => {
    const n = clampName(name.value);
    if (!n) { toast('Escribe tu nombre'); name.focus(); return; }
    $('join').disabled = true;
    try {
      try {
        await room.join(n, draft.avatar);
      } catch (e) {
        // Si en Firebase siguen las reglas anteriores (solo 16 avatares sin color), entra con su cerebro sin color.
        if (draft.avatar < 16) throw e;
        console.warn('Avatar con color rechazado; se usa el clásico', e);
        draft.avatar = decodeAvatar(draft.avatar).style % 16;
        await room.join(n, draft.avatar);
      }
      await room.markOnline();
      editing = false;
      navigator.vibrate?.([20, 40, 20]);
      render();
    } catch (e) {
      console.error(e);
      toast('No se pudo entrar. Intenta otra vez.');
      $('join').disabled = false;
    }
  };
  if ($('cancel')) $('cancel').onclick = () => { editing = false; render(); };
}

function kickedScreen() {
  view.innerHTML = `<p class="mid">FUERA DEL JUEGO</p><p class="lead">Alex retiró este nombre del juego. Si fue un error, avísale por el chat.</p>`;
}

// ---------- Esperando ----------
function waitScreen() {
  const count = Object.keys(st.players || {}).filter((id) => !st.kicked?.[id]).length;
  view.innerHTML = `
    <div class="bounce" style="margin-top:12px">${avatarSVG(me.avatar, { size: 170 })}</div>
    <p class="big">¡LISTO, ${escapeHtml(me.name.toUpperCase())}!</p>
    <p class="lead">Ya estás en el juego. Deja esta página abierta: <b>aquí te van a llegar las preguntas</b> durante toda la sesión.</p>
    <span class="pill">${count} ${count === 1 ? 'cerebro conectado' : 'cerebros conectados'}</span>
    <button class="btn ghost small" id="edit">Cambiar nombre o avatar</button>`;
  $('edit').onclick = () => { editing = true; draft.avatar = null; render(); };
}

// Entre preguntas: el avatar y «Mira la pantalla», para que nadie se quede en una pregunta vieja.
function lookScreen() {
  view.innerHTML = `
    <div class="bounce" style="margin-top:16px">${avatarSVG(me.avatar, { size: 170 })}</div>
    <p class="big">MIRA LA PANTALLA</p>
    <p class="lead">Cuando haya una pregunta, aparece aquí sola.</p>`;
}

function coverScreen(c) {
  view.innerHTML = `
    <p class="label" style="margin-top:12px">${c.label}</p>
    <p class="score pop-in">${c.big}</p>
    <p class="big">${escapeHtml(c.title.toUpperCase())}</p>
    <p class="lead">${escapeHtml(c.sub)}</p>
    <div class="bounce">${avatarSVG(me.avatar, { size: 110 })}</div>
    <p class="lead">Mira la pantalla: ya empieza.</p>`;
  navigator.vibrate?.([30, 60, 30]);
}

const CHOICE_COLORS = { A: 'var(--lime)', B: 'var(--pink)', C: 'var(--orange)', D: 'var(--lilac)', V: 'var(--lime)', F: 'var(--pink)', si: 'var(--lime)', no: 'var(--lilac)' };

function questionScreen(qid) {
  const q = QUESTIONS[qid];
  const qs = st.q?.[qid] || {};
  const mine = st.qa?.[qid];
  const isMito = qid.startsWith('mito');
  const head = `<p class="label" style="margin-top:6px">${isMito ? `Mito ${qid.slice(-1)} de 4 · ¿verdadero o falso?` : 'Pregunta en vivo'}</p>
    <p class="${isMito ? 'mid' : 'lead'}" style="${isMito ? 'font-size:26px;line-height:1.2;color:var(--cream);text-shadow:none;font-family:var(--body);font-weight:800' : 'font-size:22px;font-weight:800;color:var(--cream)'}">${escapeHtml(q.prompt)}</p>`;

  // La prueba del número: antes de abrir, a memorizar
  if (q.type === 'number' && !qs.open && !qs.closedAt) {
    view.innerHTML = `<p class="label" style="margin-top:20px">Prueba rápida</p><p class="big pulse">MIRA LA PANTALLA</p><p class="lead">Memoriza el número. En 5 segundos se borra y aquí lo escribes.</p>`;
    return;
  }

  // Cerrada: resultado o «mira la pantalla»
  if (!qs.open) {
    if (q.type === 'number') return chunkResult(mine);
    if (q.correct && qs.revealed) {
      const right = q.options.find((o) => o.id === q.correct);
      const ok = mine?.v === q.correct;
      const two = q.options.length === 2;
      const what = two ? `ERA ${right.label}` : `ERA LA ${right.id}`;
      const mineOpt = q.options.find((o) => o.id === mine?.v);
      const lower = (o) => escapeHtml(o.label.toLowerCase());
      const detail = ok
        ? (two ? `Era ${lower(right)}.` : `Era la ${right.id}: ${lower(right)}.`)
        : !mineOpt ? `No alcanzaste a votar.${two ? '' : ` Era ${lower(right)}.`}`
        : two ? `Votaste ${lower(mineOpt)}.` : `Votaste la ${mineOpt.id} (${lower(mineOpt)}). Era ${lower(right)}.`;
      view.innerHTML = `
        <div class="bounce" style="margin-top:12px">${avatarSVG(me.avatar, { size: 140 })}</div>
        <p class="big" style="${ok ? '' : 'color:var(--pink);text-shadow:4px 4px 0 var(--ink)'}">${ok ? '¡LE ATINASTE!' : what}</p>
        <p class="lead">${detail}</p>`;
      navigator.vibrate?.(ok ? [30, 40, 30] : 60);
      return;
    }
    view.innerHTML = `
      <div class="bounce" style="margin-top:16px">${avatarSVG(me.avatar, { size: 150 })}</div>
      <p class="big">${mine ? '¡GRACIAS!' : 'SE CERRÓ'}</p>
      <p class="lead">Mira la pantalla.</p>`;
    return;
  }

  if (q.type === 'scale') {
    view.innerHTML = `${head}
      <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(6px,2.5vw,10px);width:100%">
        ${Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n) => `<button class="btn ${+mine?.v === n ? '' : 'dark'}" data-v="${n}" style="min-height:clamp(52px,15vw,64px);font-family:var(--display);font-size:clamp(22px,7vw,30px);padding:0;min-width:0">${n}</button>`).join('')}
      </div>
      <p class="lead">${mine ? `Tu calificación: <b>${mine.v}</b>. Puedes cambiarla mientras esté abierta.` : '1 = la de un pez · 10 = la de un elefante'}</p>`;
    view.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => send(qid, +b.dataset.v)));
    return;
  }

  if (q.type === 'choice') {
    const big = q.options.length === 2;
    view.innerHTML = `${head}
      <div style="display:grid;grid-template-columns:${big ? 'repeat(auto-fit,minmax(150px,1fr))' : 'minmax(0,1fr)'};gap:12px;width:100%">
        ${q.options.map((o) => {
          const on = mine?.v === o.id;
          return `<button class="btn" data-v="${o.id}" style="background:${CHOICE_COLORS[o.id]};min-height:${big ? 'clamp(84px,26vw,120px)' : '76px'};font-size:${big ? 'clamp(19px,5.4vw,26px)' : 'clamp(16px,4.8vw,20px)'};min-width:0;${big ? 'padding:0 10px;' : ''}justify-content:${big ? 'center' : 'flex-start'};text-align:left;${on ? 'outline:5px solid var(--cream);outline-offset:3px' : mine ? 'filter:saturate(.5) brightness(.8)' : ''}">
            ${big ? escapeHtml(o.label) : `<span style="font-family:var(--display);font-size:30px;width:36px">${o.id}</span>${escapeHtml(o.label)}`}${on ? ' ✓' : ''}</button>`;
        }).join('')}
      </div>
      <p class="lead">${mine ? 'Voto registrado. Puedes cambiarlo mientras esté abierta.' : 'Toca tu respuesta.'}</p>`;
    view.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => send(qid, b.dataset.v)));
    return;
  }

  if (q.type === 'number') {
    view.innerHTML = `${head}
      <input class="input" id="qin" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="10 dígitos" value="${escapeHtml(mine?.v || '')}" style="text-align:center;font-size:30px;letter-spacing:4px">
      <button class="btn" id="qsend" style="font-size:22px;min-height:58px">${mine ? 'Cambiar respuesta' : 'Enviar'}</button>
      ${mine ? `<p class="lead">Enviaste <b>${escapeHtml(mine.v)}</b>.</p>` : ''}`;
    $('qsend').onclick = () => {
      const v = $('qin').value.replace(/[^\d\s.\-]/g, '').trim();
      if (!v) return toast('Escribe el número');
      send(qid, v.slice(0, 16));
    };
    $('qin').onkeydown = (e) => { if (e.key === 'Enter') $('qsend').click(); };
    if (!mine) setTimeout(() => $('qin')?.focus(), 200);
    return;
  }

  // Texto libre (con área opcional en el cierre)
  let area = mine?.area || '';
  view.innerHTML = `${head}
    <textarea class="input" id="qin" maxlength="${q.max}" rows="3" placeholder="Escribe aquí (máximo ${q.max} letras)" style="resize:none;font-size:19px">${escapeHtml(mine?.v || '')}</textarea>
    <p class="hint-text" id="qcount" style="align-self:flex-end;margin-top:-10px"></p>
    ${q.areas ? `<p class="label" style="align-self:flex-start">Tu área (opcional)</p><div class="row" id="areas" style="gap:8px">${q.areas.map((a) => `<button class="btn small ${a === area ? '' : 'dark'}" data-a="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('')}</div>` : ''}
    <button class="btn" id="qsend" style="font-size:22px;min-height:58px">${mine ? 'Actualizar' : 'Enviar'}</button>
    ${mine ? '<p class="lead">¡Listo! Ya sale en la pantalla. Puedes cambiarla mientras esté abierta.</p>' : ''}`;
  const inp = $('qin');
  const count = () => ($('qcount').textContent = `${inp.value.length}/${q.max}`);
  inp.oninput = count;
  count();
  view.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => {
    area = area === b.dataset.a ? '' : b.dataset.a;
    view.querySelectorAll('[data-a]').forEach((x) => x.classList.toggle('dark', x.dataset.a !== area));
  }));
  $('qsend').onclick = () => {
    const v = inp.value.replace(/\s+/g, ' ').trim().slice(0, q.max);
    if (!v) return toast('Escribe tu respuesta');
    send(qid, v, q.areas && area ? { area } : {});
  };
}

async function send(qid, v, extra = {}) {
  try {
    await room.answerQuestion(qid, v, extra);
    navigator.vibrate?.(20);
  } catch (e) {
    console.warn(e);
    toast('Ya se cerró esta pregunta');
  }
}

function chunkResult(mine) {
  if (!mine) {
    view.innerHTML = `<p class="label" style="margin-top:20px">Prueba rápida</p><p class="big">ERA ${CHUNK_NUMBER}</p><p class="lead">No alcanzaste a contestar. Mira el truco en la pantalla.</p>`;
    return;
  }
  const { hits, ok } = chunkScore(mine.v);
  view.innerHTML = `
    <div class="bounce" style="margin-top:12px">${avatarSVG(me.avatar, { size: 140 })}</div>
    <p class="big" style="${ok ? '' : 'font-size:clamp(30px,9vw,48px)'}">${ok ? '¡LO RECORDASTE!' : `ERA ${CHUNK_NUMBER}`}</p>
    <p class="lead">${ok ? 'Los 10 dígitos en orden.' : `Acertaste <b>${hits} de 10</b> dígitos en su lugar.`}</p>`;
}

function watchScreen() {
  view.innerHTML = `
    <p class="label" style="margin-top:20px">El reto está en curso</p>
    <p class="big">MIRA LA PANTALLA</p>
    <p class="lead">Escucha a Alex y <b>no anotes nada</b>. Cuando terminen las 20 palabras, aquí se abren las casillas.</p>
    <div class="dots" id="dots">${Array.from({ length: N_WORDS }, () => '<i></i>').join('')}</div>
    <p class="lead" id="wordTxt"></p>`;
  updateWatch();
}

function updateWatch() {
  const w = st.state?.word || 0;
  const dots = $('dots');
  if (!dots) return;
  [...dots.children].forEach((d, i) => { d.className = i + 1 < w ? 'on' : i + 1 === w ? 'now' : ''; });
  $('wordTxt').textContent = w ? `Palabra ${w} de ${N_WORDS}` : 'Prepárate…';
}

function readyScreen(r) {
  const done = st.rounds?.[r]?.status === 'closed';
  view.innerHTML = r === 1
    ? `<p class="label" style="margin-top:20px">Ronda 1 · sin ayuda</p>
       <p class="big pulse">PREPÁRATE</p>
       <p class="lead">En cuanto Joss dé clic se abren <b>20 casillas</b>. Escribe cada palabra en su número; si no recuerdas alguna, déjala vacía.</p>
       <p class="lead">Tienes <b>2 minutos</b>.</p>`
    : `<p class="label" style="margin-top:20px">Segunda ronda · con el código</p>
       <p class="big pulse">${done ? '¡TIEMPO!' : 'OTRA VEZ…'}</p>
       <p class="lead">${done ? 'Calculando tu resultado…' : 'Ahora te las vamos a pedir <b>en desorden</b>. Usa el gancho de cada número.'}</p>`;
}

// ---------- La hoja ----------
function sheetScreen(r) {
  sheetRound = r;
  pending = {};
  const order = r === 2 && st.order2?.length === N_WORDS ? st.order2 : Array.from({ length: N_WORDS }, (_, i) => i + 1);
  const mine = st.mine[r] || {};
  const done = !!mine._d;
  view.innerHTML = `
    <div class="sheet-head">
      <div>
        <p class="label">${r === 1 ? 'Ronda 1' : 'Ronda 2 · en desorden'}</p>
        <p style="margin:0;font-weight:800;color:var(--cream)" id="filled"></p>
      </div>
      <div class="timer ${r === 2 ? 'r2' : ''}" id="timer">0:00</div>
    </div>
    <p class="lead" style="text-align:left">${r === 1 ? 'Escribe cada palabra en su número.' : 'Ojo: los números van salteados.'} Se guarda solo mientras escribes.</p>
    <div class="sheet" id="sheet" aria-disabled="${done}">
      ${order.map((n, i) => `
        <label class="slot" for="w${n}">
          <span class="num">${n}</span>
          <input class="input" id="w${n}" data-n="${n}" data-i="${i}" maxlength="40" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="${i === N_WORDS - 1 ? 'done' : 'next'}" value="${escapeHtml(mine['w' + n] || '')}" ${done ? 'disabled' : ''} aria-label="Palabra ${n}">
        </label>`).join('')}
    </div>
    <div class="sheet-foot"><button class="btn pink" id="done" ${done ? 'disabled' : ''}>${done ? '¡Enviado! Espera el resultado' : '¡Terminé!'}</button></div>
    <div class="overlay" id="paused" hidden><div class="card"><p class="mid">PAUSA</p><p class="lead">Alex detuvo el reloj un momento.</p></div></div>`;
  const inputs = [...view.querySelectorAll('.sheet .input')];
  inputs.forEach((inp) => {
    inp.addEventListener('input', () => {
      pending['w' + inp.dataset.n] = inp.value.slice(0, 40);
      inp.closest('.slot').classList.toggle('filled', !!inp.value.trim());
      updateFilled();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 350);
    });
    inp.addEventListener('blur', flush);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nxt = inputs[+inp.dataset.i + 1];
        if (nxt) nxt.focus(); else inp.blur();
      }
    });
    inp.closest('.slot').classList.toggle('filled', !!inp.value.trim());
  });
  $('done').onclick = () => {
    const filled = inputs.filter((i) => i.value.trim()).length;
    const ask = document.createElement('div');
    ask.className = 'overlay';
    ask.innerHTML = `<div class="card"><p class="mid">¿YA TERMINASTE?</p><p class="lead">Llevas <b>${filled} de ${N_WORDS}</b>. Después ya no podrás cambiar tus respuestas.</p><button class="btn pink" id="yes">Sí, enviar</button><button class="btn ghost" id="no">Seguir escribiendo</button></div>`;
    document.body.appendChild(ask);
    ask.querySelector('#no').onclick = () => ask.remove();
    ask.querySelector('#yes').onclick = async () => {
      ask.remove();
      flush();
      inputs.forEach((i) => (i.disabled = true));
      $('sheet').setAttribute('aria-disabled', 'true');
      $('done').disabled = true;
      $('done').textContent = '¡Enviado! Espera el resultado';
      await room.saveAnswers(r, { _d: store.now() }).catch(() => {});
      navigator.vibrate?.(30);
    };
  };
  updateFilled();
  tickTimer();
  lockScreen(true);
  navigator.vibrate?.([30, 60, 30]);
  if (!done) setTimeout(() => inputs.find((i) => !i.value)?.focus({ preventScroll: true }), 300);
}

function updateFilled() {
  const n = [...view.querySelectorAll('.sheet .input')].filter((i) => i.value.trim()).length;
  if ($('filled')) $('filled').textContent = `${n} de ${N_WORDS} escritas`;
}

function flush() {
  clearTimeout(saveTimer);
  if (!sheetRound || !Object.keys(pending).length) return;
  const patch = pending;
  pending = {};
  room.saveAnswers(sheetRound, patch).catch((e) => {
    console.warn('No se guardó', e);
    Object.assign(pending, patch);
  });
}

function tickTimer() {
  const t = $('timer');
  if (!t || !sheetRound) return;
  const rd = st.rounds?.[sheetRound];
  const left = timeLeft(rd, store.now());
  if (left === null) return;
  t.textContent = fmtTime(left);
  t.classList.toggle('warn', left <= 30000 && left > 0);
  if ($('paused')) $('paused').hidden = rd?.status !== 'paused';
  if (rd?.status === 'running' && left <= 0) {
    // Se acabó el tiempo: se guarda lo último y se bloquea la hoja.
    flush();
    view.querySelectorAll('.sheet .input').forEach((i) => (i.disabled = true));
    if ($('done') && !$('done').disabled) {
      $('done').disabled = true;
      $('done').textContent = '¡Tiempo! Se guardó lo que escribiste';
      navigator.vibrate?.([80, 60, 80]);
    }
  }
}

async function lockScreen(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}

// ---------- Resultados ----------
function hitsGrid(h) {
  const hits = new Set(String(h || '').split(',').filter(Boolean).map(Number));
  return `<div class="grid20">${Array.from({ length: N_WORDS }, (_, i) => `<i class="${hits.has(i + 1) ? 'hit' : ''}">${i + 1}</i>`).join('')}</div>`;
}

function afterOneScreen(stage) {
  const res = st.results?.[store.uid];
  const total = st.results?._meta?.count || 0;
  if (!res || !res.p1) {
    view.innerHTML = res
      ? `<p class="mid" style="margin-top:20px">TE PERDISTE LA RONDA 1</p><p class="lead">No pasa nada: en la segunda ronda sí juegas.</p>`
      : `<p class="mid pulse" style="margin-top:20px">CALIFICANDO…</p><p class="lead">Tu resultado sale en un momento.</p>`;
    return;
  }
  const range = RANGES.findIndex((g) => res.r1 >= g.from && res.r1 <= g.to);
  view.innerHTML = `
    <p class="label" style="margin-top:8px">Tu ronda 1</p>
    <p class="score">${res.r1}<small> / ${N_WORDS}</small></p>
    <p class="lead"><b>${JOKES[range]}</b></p>
    ${hitsGrid(res.h1)}
    <p class="lead">Lugar <b>${res.place}</b> de ${total} · en verde, los números que acertaste.</p>
    ${stage === 'code' ? '<div class="card"><p class="lead" style="margin:0">🔐 <b>Pon atención:</b> Joss está revelando el código secreto. Te va a servir en la segunda ronda.</p></div>' : ''}`;
}

function finalScreen() {
  const res = st.results?.[store.uid];
  const total = st.results?._meta?.count || 0;
  if (!res) {
    view.innerHTML = `<p class="mid pulse" style="margin-top:20px">CALIFICANDO…</p><p class="lead">Tu resultado sale en un momento.</p>`;
    return;
  }
  const medal = res.place <= 3 ? ['', '🥇', '🥈', '🥉'][res.place] : '';
  const gain = res.p1 && res.p2 ? res.gain : null;
  view.innerHTML = `
    <div class="bounce">${avatarSVG(me.avatar, { size: 120 })}</div>
    <p class="place">${medal} LUGAR ${res.place} DE ${total}</p>
    <div class="versus">
      <div class="card"><p class="label">Ronda 1</p><p class="n">${res.p1 ? res.r1 : '—'}</p></div>
      <div style="font-family:var(--display);font-size:28px;color:var(--lime)">→</div>
      <div class="card" style="border-color:var(--pink)"><p class="label">Ronda 2</p><p class="n">${res.p2 ? res.r2 : '—'}</p></div>
    </div>
    <p class="lead">${gain === null ? `Total: <b>${res.total} puntos</b>.` : gain > 0 ? `Mejoraste <b>+${gain}</b> con el código. Total: <b>${res.total} puntos</b>.` : `Total: <b>${res.total} puntos</b>.`}</p>
    <p class="lead" style="font-style:italic">Tu memoria no cambió. Cambió la forma de guardar.</p>
    <div class="card recuerdo${st.state?.stage === 'final' ? ' pop' : ''}">
      <p class="lead" style="margin:0">📲 <b>Tu recuerdo en PDF</b>: tu avatar, tus respuestas, cómo jugó el grupo y una guía corta para usar lo aprendido.</p>
      <button class="btn pink" id="btnPdf">Descargar mi recuerdo (PDF)</button>
      ${st.state?.stage === 'final' ? '' : '<p class="label" style="margin:0">Al final de la sesión se completa con tus últimas respuestas.</p>'}
      <p class="label" id="pdfAlt" hidden style="margin:0">¿No se descargó? <a href="#" id="pdfOpen">Ábrelo aquí</a> y guárdalo o compártelo.</p>
    </div>
    <p class="label" style="margin-top:12px">Tu código para llevar</p>
    <div class="codes">${WORDS.map((w) => `<div><b>${w.n}</b><span><strong>${escapeHtml(w.word)}</strong>${escapeHtml(w.why)}</span></div>`).join('')}</div>
    <div class="card"><p class="lead" style="margin:0">📅 En 7 días te preguntamos: <b>¿cuál era la 7?</b></p></div>`;
  $('btnPdf').onclick = downloadPdf;
  if (!pdfReady) pdfReady = import('../vendor/pdf.js').catch(() => null); // se precarga para que el botón responda rápido
}

// Datos del recuerdo: lo mío, la tabla del grupo y mis respuestas en vivo.
function recuerdoData() {
  const results = st.results || {};
  const players = Object.entries(st.players || {})
    .filter(([id, p]) => p?.name && !st.kicked?.[id])
    .map(([id, p]) => ({ id, name: p.name, avatar: p.avatar ?? 0, ...(results[id] || {}) }))
    .sort((a, b) => (a.place || 999) - (b.place || 999) || a.name.localeCompare(b.name, 'es'));
  return { me, uid: store.uid, res: results[store.uid] || {}, meta: results._meta || {}, players, qa: { ...st.qa } };
}

let pdfBusy = false;
let pdfReady = null;
async function downloadPdf() {
  if (pdfBusy) return;
  pdfBusy = true;
  const btn = $('btnPdf');
  btn.disabled = true;
  btn.textContent = 'Armando tu recuerdo…';
  try {
    const { downloadRecuerdo, fechaLarga } = await import('./recuerdo.js');
    const out = await downloadRecuerdo({ ...recuerdoData(), fecha: fechaLarga() });
    toast('¡Listo! Revisa tus descargas 📄', 3000);
    const alt = $('pdfAlt');
    if (alt && out.url) {
      alt.hidden = false;
      $('pdfOpen').onclick = (e) => { e.preventDefault(); window.open(out.url, '_blank'); };
    }
  } catch (e) {
    console.error(e);
    toast('No se pudo armar el PDF. Intenta otra vez.', 3000);
  } finally {
    pdfBusy = false;
    if ($('btnPdf')) {
      $('btnPdf').disabled = false;
      $('btnPdf').textContent = 'Descargar otra vez (PDF)';
    }
  }
}

boot();

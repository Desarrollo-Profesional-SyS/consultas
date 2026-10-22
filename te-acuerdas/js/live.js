// Las partes "en vivo" de las diapositivas: el QR de la sala, los avatares que
// van llegando, el reloj de cada ronda, los resultados reales y el podio.
// Cada elemento con data-live="…" se llena aquí con los datos del juego.
import { avatarSVG } from './avatars.js';
import { animateIn } from './deck.js';
import { qrSVG, sfx } from './fx.js';
import { fmtTime, escapeHtml, N_WORDS, QUESTIONS } from './game.js';
import { timeLeft } from './room.js';
import { ROUND_SECONDS } from './config.js';

const MIN_FOR_CHART = 3;
const memo = new WeakMap(); // estado por elemento (para no repetir animaciones)

const $$ = (root, sel) => [...root.querySelectorAll(sel)];
const one = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// data = { code, url, rows, players, stats: {1,2}, rounds, order2, best, answers, qs: { pregunta: resumen } }
export function renderLive(el, data, { entering = false } = {}) {
  if (!el) return;

  for (const n of $$(el, '[data-live="qr"]')) {
    if (memo.get(n) !== data.url && data.url) {
      n.innerHTML = qrSVG(data.url);
      memo.set(n, data.url);
    }
  }
  for (const n of $$(el, '[data-live="room"]')) n.textContent = data.code ? `SALA ${data.code}` : 'SALA ····';
  for (const n of $$(el, '[data-live="join-url"]')) {
    n.textContent = '¿En la compu? Abre el link que está en el chat.';
  }

  const joined = data.rows;
  for (const n of $$(el, '[data-live="lobby-count"]')) n.textContent = joined.length;
  for (const n of $$(el, '[data-live="lobby-count-label"]')) n.textContent = joined.length === 1 ? 'cerebro conectado' : 'cerebros conectados';
  for (const n of $$(el, '[data-live="lobby-avatars"]')) lobbyAvatars(n, joined, entering);

  for (const n of $$(el, '[data-live="submitted"]')) {
    if (n.dataset.q) {
      const sm = data.qs?.[n.dataset.q];
      n.textContent = sm ? `${sm.count} de ${data.rows.length} ya contestaron` : '';
    } else n.textContent = submittedText(+n.dataset.round, data);
  }

  for (const n of $$(el, '[data-live="range-count"]')) {
    const list = data.stats[1].ranges[+n.dataset.range];
    n.textContent = data.stats[1].count ? `${list.length} ${list.length === 1 ? 'persona' : 'personas'}` : '';
  }
  const ranges = data.stats[1].ranges;
  const top = Math.max(0, ...ranges.map((l) => l.length));
  for (const n of $$(el, '[data-live="range-card"]')) {
    const list = ranges[+n.dataset.range];
    const lit = top > 0 && list.length === top;
    n.style.outline = lit ? '6px solid #FFF4E0' : '';
    n.style.outlineOffset = lit ? '6px' : '';
  }
  for (const n of $$(el, '[data-live="range-avatars"]')) rangeAvatars(n, ranges[+n.dataset.range], entering);

  for (const n of $$(el, '[data-live="avg"]')) {
    const s = data.stats[+n.dataset.round];
    n.textContent = s.count ? one(Math.round(s.avg * 10) / 10) : '—';
  }

  for (const n of $$(el, '[data-live="serial-chart"]')) serialChart(n, data.stats[1]);
  for (const n of $$(el, '[data-live="serial-foot"]')) {
    n.textContent = data.stats[1].count >= MIN_FOR_CHART
      ? `Datos reales de este grupo: porcentaje que acertó cada número en la ronda 1 (${data.stats[1].count} personas). Efecto de posición serial (Murdock, 1962).`
      : 'Ilustrativo. Efecto de posición serial (Murdock, 1962).';
  }

  for (const n of $$(el, '[data-live="order2-preview"]')) {
    const o = data.order2 || [];
    n.textContent = o.length ? `${o.slice(0, 6).join(' · ')} · …` : '';
  }

  for (const n of $$(el, '[data-live="cmp-avg"]')) {
    const s = data.stats[+n.dataset.round];
    const v = s.count ? Math.round(s.avg * 10) / 10 : null;
    n.dataset.value = v ?? '';
    if (!n.dataset.counted) n.textContent = v === null ? '—' : one(v);
  }

  for (const n of $$(el, '[data-live="best-gain"]')) bestGain(n, data.best);
  for (const n of $$(el, '[data-live="podium"]')) podium(n, data.rows);
  for (const n of $$(el, '[data-live="board-rest"]')) boardRest(n, data.rows);

  renderQuestions(el, data, entering);
  updateTimers(el, data.rounds, data.now);
}

export function updateTimers(el, rounds, now) {
  if (!el) return;
  for (const n of $$(el, '[data-live="timer"]')) {
    const r = +n.dataset.round;
    const left = timeLeft(rounds?.[r], now);
    const txt = left === null ? fmtTime((ROUND_SECONDS[r] || 120) * 1000) : fmtTime(left);
    if (n.textContent !== txt) {
      n.textContent = txt;
      if (left !== null && left > 0 && left <= 10000 && rounds[r].status === 'running') {
        n.animate([{ scale: '1.12' }, { scale: '1' }], { duration: 400, easing: 'ease-out' });
      }
    }
  }
  for (const n of $$(el, '[data-live="timer-state"]')) {
    const st = rounds?.[+n.dataset.round]?.status || 'idle';
    n.textContent = { idle: 'MINUTOS', running: '¡A ESCRIBIR!', paused: 'EN PAUSA', closed: '¡TIEMPO!' }[st];
  }
}

function submittedText(r, data) {
  const st = data.rounds?.[r]?.status || 'idle';
  const total = data.rows.length;
  const sheets = data.answers?.[r] || {};
  const ids = data.rows.map((row) => row.id);
  const writing = ids.filter((id) => sheets[id] && Object.keys(sheets[id]).some((k) => k[0] === 'w' && sheets[id][k])).length;
  const done = ids.filter((id) => sheets[id]?._d).length;
  if (st === 'idle') return total ? `${total} ${total === 1 ? 'jugador listo' : 'jugadores listos'}` : 'Esperando jugadores…';
  if (st === 'closed') return `¡Listo! ${writing} ${writing === 1 ? 'hoja recibida' : 'hojas recibidas'}`;
  if (done) return `${done} de ${total} ya terminaron`;
  return `${writing} de ${total} escribiendo…`;
}

function chip(row, size, withName) {
  const d = document.createElement('div');
  d.className = withName ? 'lobby-chip' : 'range-chip';
  d.dataset.id = row.id;
  d.title = row.name;
  d.innerHTML = avatarSVG(row.avatar, { size, title: row.name }) + (withName ? `<span>${escapeHtml(row.name)}</span>` : '');
  return d;
}

function lobbyAvatars(host, rows, entering) {
  const known = memo.get(host) || new Set();
  const ids = new Set(rows.map((r) => r.id));
  for (const c of [...host.children]) if (!ids.has(c.dataset.id)) c.remove();
  rows.forEach((row, i) => {
    let c = host.querySelector(`[data-id="${CSS.escape(row.id)}"]`);
    if (!c) {
      c = chip(row, 64, true);
      host.appendChild(c);
      if (!entering && !known.has(row.id)) {
        animateIn(c, 'drop');
        sfx.join();
      } else if (entering) {
        c.animate([{ opacity: 0, scale: '0.3' }, { opacity: 1, scale: '1' }], { duration: 380, delay: i * 40, easing: 'ease-out', fill: 'backwards' });
      }
    } else {
      c.querySelector('span').textContent = row.name;
    }
  });
  memo.set(host, ids);
}

function rangeAvatars(host, rows, entering) {
  const ids = new Set(rows.map((r) => r.id));
  for (const c of [...host.children]) if (!ids.has(c.dataset.id)) c.remove();
  rows.forEach((row, i) => {
    if (host.querySelector(`[data-id="${CSS.escape(row.id)}"]`)) return;
    const c = chip(row, 52, false);
    host.appendChild(c);
    c.animate([{ opacity: 0, translate: '0 -60px' }, { opacity: 1, translate: '0 0' }], {
      duration: 500, delay: entering ? 300 + i * 70 : 0, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards',
    });
  });
}

function serialChart(host, s) {
  if (s.count < MIN_FOR_CHART) return; // se queda la gráfica ilustrativa
  const key = s.byNumber.map((v) => Math.round(v * 100)).join(',');
  if (memo.get(host) === key) return;
  memo.set(host, key);
  const maxH = 330;
  const bars = s.byNumber.map((v, i) => {
    const n = i + 1;
    const edge = n <= 4 || n >= N_WORDS - 3;
    const h = Math.max(8, Math.round(v * maxH));
    const color = edge ? '#C6F432' : '#B69CFF';
    return `<div style="width:49px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%">
      <span style="font-size:20px;font-weight:800;color:#FFF4E0;font-variant-numeric:tabular-nums;white-space:nowrap">${Math.round(v * 100)}%</span>
      <div class="bar" style="width:40px;height:${h}px;background:${color};border:3px solid #07030D;border-radius:4px 4px 0 0"></div>
      <span style="font-size:24px;font-weight:800;color:#D9C9F2;line-height:1">${n}</span>
    </div>`;
  }).join('');
  host.innerHTML = `<div style="display:flex;flex-direction:row;align-items:flex-end;justify-content:space-between;width:1100px;height:420px">${bars}</div>`;
  host.querySelectorAll('.bar').forEach((b, i) => {
    b.animate([{ scale: '1 0' }, { scale: '1 1' }], { duration: 600, delay: 150 + i * 35, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
    b.style.transformOrigin = 'bottom';
  });
}

function bestGain(host, best) {
  const key = best ? `${best.id}|${best.gain}|${best.name}` : 'none';
  if (memo.get(host) === key) return;
  memo.set(host, key);
  if (!best || best.gain <= 0) {
    host.innerHTML = `<p style="font-family:'Bowlby One',sans-serif;font-size:28px;color:#160A26;text-align:center;line-height:1.1">MAYOR MEJORA</p><p style="font-size:24px;color:#160A26">Aún sin datos</p>`;
    return;
  }
  host.innerHTML = `
    <p style="font-family:'Bowlby One',sans-serif;font-size:28px;color:#FF3E8E;text-align:center;line-height:1.1">MAYOR MEJORA</p>
    ${avatarSVG(best.avatar, { size: 120, title: best.name })}
    <p style="font-size:30px;font-weight:800;color:#160A26;text-align:center;line-height:1.15;max-width:290px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(best.name)}</p>
    <p style="font-family:'Bowlby One',sans-serif;font-size:44px;color:#160A26;line-height:1">+${best.gain}</p>`;
}

const PODIUM_COLORS = { 1: '#C6F432', 2: '#B69CFF', 3: '#FF9F1C' };

function podium(host, rows) {
  const place = +host.dataset.place;
  const block = +host.dataset.block;
  const winners = rows.filter((r) => r.place === place);
  const row = winners[0];
  const key = row ? `${winners.map((w) => w.id).join(',')}|${row.total}` : 'none';
  if (memo.get(host) === key) return;
  memo.set(host, key);
  const names = winners.map((w) => escapeHtml(w.name)).join(' y ');
  const avatars = winners.slice(0, 2).map((w) => avatarSVG(w.avatar, { size: winners.length > 1 ? 120 : 170, title: w.name })).join('');
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  host.style.alignItems = 'center';
  host.style.justifyContent = 'flex-end';
  host.style.gap = '10px';
  host.innerHTML = `
    ${row ? `<div style="display:flex;flex-direction:row;gap:4px;align-items:flex-end">${avatars}</div>
    <p style="font-size:${winners.length > 1 ? 26 : 34}px;font-weight:800;color:#FFF4E0;text-align:center;line-height:1.15;width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${names}</p>
    <p style="font-size:28px;font-weight:800;color:#D9C9F2;line-height:1">${row.total} pts · ${row.r1} + ${row.r2}</p>`
    : `<p style="font-size:30px;font-weight:800;color:#6b5a85">—</p>`}
    <div style="width:300px;height:${block}px;display:flex;align-items:flex-start;justify-content:center;padding-top:18px;background:${PODIUM_COLORS[place]};border:5px solid #07030D;border-radius:18px 18px 0 0;box-shadow:12px 12px 0 #07030D">
      <p style="font-family:'Bowlby One',sans-serif;font-size:${place === 1 ? 120 : 96}px;line-height:1;color:#160A26">${place}</p>
    </div>`;
}

function boardRest(host, rows) {
  const rest = rows.filter((r) => r.place >= 4).slice(0, 7);
  const key = rest.map((r) => `${r.id}:${r.place}:${r.total}`).join('|');
  if (memo.get(host) === key) return;
  memo.set(host, key);
  host.innerHTML = rest.map((r) => `
    <div style="display:flex;flex-direction:row;align-items:center;gap:16px;background:#2A1745;border:3px solid #3B1766;border-radius:16px;padding:8px 18px">
      <p style="font-family:'Bowlby One',sans-serif;font-size:32px;color:#FF3E8E;width:48px;line-height:1">${r.place}</p>
      ${avatarSVG(r.avatar, { size: 52, title: r.name })}
      <p style="flex:1;font-size:28px;font-weight:800;color:#FFF4E0;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.name)}</p>
      <p style="font-size:28px;font-weight:800;color:#C6F432;line-height:1">${r.total}</p>
    </div>`).join('') || '';
}

// Cuenta de 0 al valor final (para el "antes y después").
export function countUp(n) {
  const v = parseFloat(n.dataset.value);
  if (Number.isNaN(v)) return;
  n.dataset.counted = '1';
  const t0 = performance.now();
  const dur = 1100;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    n.textContent = one(Math.round(v * e * 10) / 10);
    if (k < 1) requestAnimationFrame(step);
    else n.textContent = one(v);
  };
  requestAnimationFrame(step);
}

// ---------- Preguntas en vivo ----------
const ACCENTS = ['#C6F432', '#FF9F1C', '#FF3E8E', '#B69CFF', '#FFD23F', '#7FD3FF'];
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function renderQuestions(el, data, entering) {
  const qs = data.qs || {};
  const sum = (n) => qs[n.dataset.q || 'rating'];

  for (const n of $$(el, '[data-live="rating-avg"]')) {
    const sm = qs.rating;
    n.textContent = sm?.avg != null ? one(Math.round(sm.avg * 10) / 10) : '—';
  }
  for (const n of $$(el, '[data-live="rating-count"]')) {
    const c = qs.rating?.count || 0;
    n.textContent = `${c} ${c === 1 ? 'voto' : 'votos'}`;
  }
  for (const n of $$(el, '[data-live="rating-bars"]')) ratingBars(n, qs.rating);

  for (const n of $$(el, '[data-live="poll"]')) pollRows(n, sum(n));
  for (const n of $$(el, '[data-live="poll-option"]')) {
    const sm = sum(n);
    const v = sm?.byOption?.[n.dataset.option]?.length || 0;
    const html = `${pct(v, sm?.count)}%<br><span style="font-size:22px">${v} ${v === 1 ? 'voto' : 'votos'}</span>`;
    if (n.innerHTML !== html) n.innerHTML = html;
  }
  for (const n of $$(el, '[data-live="vote-count"]')) n.textContent = String(sum(n)?.byOption?.[n.dataset.option]?.length || 0);
  for (const n of $$(el, '[data-live="vote-names"]')) voteNames(n, sum(n)?.byOption?.[n.dataset.option] || [], entering);

  for (const n of $$(el, '[data-live="answers"]')) textAnswers(n, sum(n), entering);
  for (const n of $$(el, '[data-live="answers-count"]')) {
    const sm = sum(n);
    const c = sm?.visible?.length || 0;
    n.textContent = c > 12 ? `${c} respuestas · se ven las 12 más recientes` : c ? `${c} ${c === 1 ? 'respuesta' : 'respuestas'}` : 'Las respuestas aparecen aquí en cuanto las escriban.';
  }

  const ch = qs.chunk;
  for (const n of $$(el, '[data-live="chunk-ok-count"]')) n.textContent = String(ch?.ok?.length || 0);
  for (const n of $$(el, '[data-live="chunk-no-count"]')) n.textContent = String(Math.max(0, data.rows.length - (ch?.ok?.length || 0)));
  for (const n of $$(el, '[data-live="chunk-ok"]')) voteNames(n, ch?.ok || [], entering, 14);
  for (const n of $$(el, '[data-live="chunk-avg"]')) {
    const a = ch?.avgHits;
    const r = a == null ? null : Math.round(a);
    n.textContent = r == null
      ? 'Nadie contestó esta vez.'
      : `En promedio le atinaron a ${r} de 10 dígitos.${r >= 5 && r <= 9 ? ' ¿Te suena el 7?' : ''}`;
  }
}

function ratingBars(host, sm) {
  const bins = sm?.bins || Array(10).fill(0);
  const key = bins.join(',');
  if (memo.get(host) === key) return;
  memo.set(host, key);
  const max = Math.max(1, ...bins);
  host.innerHTML = bins.map((c, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div style="width:26px;height:${Math.max(6, Math.round((c / max) * 110))}px;background:${i < 7 ? '#C6F432' : '#FF3E8E'};border:3px solid #07030D;border-radius:6px;transition:height .4s"></div><p style="font-size:18px;font-weight:800;color:#D9C9F2">${i + 1}</p></div>`).join('');
}

function pollRows(host, sm) {
  const q = QUESTIONS[host.dataset.q];
  if (!q) return;
  const total = sm?.count || 0;
  const key = q.options.map((o) => sm?.byOption?.[o.id]?.length || 0).join(',');
  if (memo.get(host) === key) return;
  memo.set(host, key);
  const colors = ['#C6F432', '#B69CFF', '#FF9F1C', '#FF3E8E'];
  host.innerHTML = q.options.map((o, i) => {
    const v = sm?.byOption?.[o.id]?.length || 0;
    const w = Math.round((pct(v, total) / 100) * 552);
    return `<div style="display:flex;flex-direction:row;align-items:center;gap:18px"><p style="width:80px;font-family:'Bowlby One', Arial, sans-serif;font-size:36px;color:#FFF4E0">${escapeHtml(o.label)}</p><div style="width:560px;height:48px;background:#2A1745;border:4px solid #07030D;border-radius:999px;display:flex;flex-direction:row"><div style="width:${w}px;height:40px;background:${colors[i]};border-radius:999px;transition:width .5s"></div></div><p style="font-family:'Bowlby One', Arial, sans-serif;font-size:36px;color:${colors[i]}">${pct(v, total)}%</p></div>`;
  }).join('');
}

function nameChip(a, size = 40, font = 24) {
  return `<div data-id="${escapeHtml(a.id)}" style="font-family:Rubik, Arial, sans-serif;display:flex;flex-direction:row;align-items:center;gap:8px;background:#3B1766;padding:4px 18px 4px 4px;border:3px solid #07030D;border-radius:999px">${avatarSVG(a.avatar, { size, title: a.name })}<p style="font-size:${font}px;font-weight:800;color:#FFF4E0;white-space:nowrap">${escapeHtml(a.name)}</p></div>`;
}

function voteNames(host, list, entering, max = 8) {
  const shown = list.slice(0, max);
  const key = shown.map((a) => a.id).join(',') + '|' + list.length;
  if (memo.get(host) === key) return;
  const before = new Set([...host.querySelectorAll('[data-id]')].map((c) => c.dataset.id));
  memo.set(host, key);
  host.innerHTML = shown.map((a) => nameChip(a)).join('') +
    (list.length > max ? `<p style="font-size:24px;font-weight:800;padding:10px 18px;color:#160A26;background:#FFF4E0;border:3px solid #07030D;border-radius:999px">+${list.length - max} más</p>` : '');
  host.querySelectorAll('[data-id]').forEach((c) => {
    if (!before.has(c.dataset.id) && !entering) c.animate([{ opacity: 0, scale: '0.4' }, { opacity: 1, scale: '1' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' });
  });
}

function textAnswers(host, sm, entering) {
  const cards = host.dataset.style === 'cards';
  const max = +(host.dataset.max || (cards ? 12 : host.dataset.q === 'revela' ? 4 : 6));
  const list = (sm?.visible || []).slice(0, max);
  const key = list.map((a) => `${a.id}:${a.t}`).join(',');
  if (memo.get(host) === key) return;
  const before = new Set([...host.querySelectorAll('[data-id]')].map((c) => c.dataset.id + ':' + c.dataset.t));
  memo.set(host, key);
  host.innerHTML = list.map((a, i) => {
    const accent = ACCENTS[i % ACCENTS.length];
    const rot = i % 2 ? 1 : -1;
    if (cards) {
      return `<div data-id="${escapeHtml(a.id)}" data-t="${a.t}" style="font-family:Rubik, Arial, sans-serif;display:flex;flex-direction:column;gap:12px;background:#FFF4E0;padding:18px 20px;border:4px solid #07030D;border-radius:22px;box-shadow:8px 8px 0px ${accent};transform:rotate(${rot * 0.8}deg)">
        <p style="font-size:24px;font-weight:800;line-height:1.25;color:#160A26;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(a.v)}</p>
        <div style="display:flex;flex-direction:row;align-items:center;gap:8px;flex-wrap:wrap">${avatarSVG(a.avatar, { size: 34, title: a.name })}<p style="font-size:20px;font-weight:800;color:#5B4B70">${escapeHtml(a.name)}</p>${a.area ? `<p style="font-size:18px;font-weight:800;color:#160A26;background:${accent};padding:4px 12px;border:2px solid #07030D;border-radius:999px">${escapeHtml(a.area)}</p>` : ''}</div>
      </div>`;
    }
    return `<div data-id="${escapeHtml(a.id)}" data-t="${a.t}" style="font-family:Rubik, Arial, sans-serif;display:flex;flex-direction:column;gap:10px;width:350px;background:#FFF4E0;padding:16px 20px;border:4px solid #07030D;border-radius:24px 24px 24px 6px;box-shadow:8px 8px 0px ${accent};transform:rotate(${rot}deg)">
      <p style="font-size:26px;font-weight:800;line-height:1.2;color:#160A26;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(a.v)}</p>
      <div style="display:flex;flex-direction:row;align-items:center;gap:8px">${avatarSVG(a.avatar, { size: 34, title: a.name })}<p style="font-size:22px;font-weight:800;color:#5B4B70">${escapeHtml(a.name)}</p></div>
    </div>`;
  }).join('');
  host.querySelectorAll('[data-id]').forEach((c) => {
    if (!entering && !before.has(c.dataset.id + ':' + c.dataset.t)) c.animate([{ opacity: 0, translate: '0 30px', scale: '0.8' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 420, easing: 'cubic-bezier(.2,1.3,.4,1)' });
  });
}

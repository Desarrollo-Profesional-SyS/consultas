// Las partes "en vivo" de las diapositivas: el QR de la sala, los avatares que
// van llegando, el reloj de cada ronda, los resultados reales y el podio.
// Cada elemento con data-live="…" se llena aquí con los datos del juego.
import { avatarSVG } from './avatars.js';
import { animateIn } from './deck.js';
import { qrSVG, sfx } from './fx.js';
import { fmtTime, escapeHtml, N_WORDS } from './game.js';
import { timeLeft } from './room.js';
import { ROUND_SECONDS } from './config.js';

const MIN_FOR_CHART = 3;
const memo = new WeakMap(); // estado por elemento (para no repetir animaciones)

const $$ = (root, sel) => [...root.querySelectorAll(sel)];
const one = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// data = { code, url, rows, players, stats: {1,2}, rounds, order2, best, answers }
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
    n.textContent = data.code ? '¿Estás en la compu? Abre el link del chat.' : '';
  }

  const joined = data.rows;
  for (const n of $$(el, '[data-live="lobby-count"]')) n.textContent = joined.length;
  for (const n of $$(el, '[data-live="lobby-count-label"]')) n.textContent = joined.length === 1 ? 'cerebro conectado' : 'cerebros conectados';
  for (const n of $$(el, '[data-live="lobby-avatars"]')) lobbyAvatars(n, joined, entering);

  for (const n of $$(el, '[data-live="submitted"]')) {
    const r = +n.dataset.round;
    n.textContent = submittedText(r, data);
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

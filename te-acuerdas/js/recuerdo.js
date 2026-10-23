// El recuerdo en PDF de cada participante: su avatar, nombre, fecha y respuestas;
// el resumen del grupo; y una guía corta para usar lo aprendido. Se arma en el
// celular (sin servidor) y se descarga con su nombre.
import { avatarSVG } from './avatars.js';
import { WORDS, N_WORDS, QUESTIONS, CHUNK_NUMBER, chunkScore, escapeHtml } from './game.js';
import { AREA_HOOKS } from './guion.js';

const W = 794; // A4 a 96 ppp
const H = 1123;
const C = { night: '#160A26', ink: '#07030D', plum: '#2A1745', grape: '#3B1766', lime: '#C6F432', pink: '#FF3E8E', orange: '#FF9F1C', lilac: '#B69CFF', cream: '#FFF4E0', mist: '#D9C9F2' };
const ACC = [C.lime, C.orange, C.pink, C.lilac, '#FFD23F', '#7FD3FF'];
const DISPLAY = "'Bowlby One', 'Arial Black', Arial, sans-serif";

export function fechaLarga(d = new Date()) {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

const page = (inner, bg = C.night) => `<div class="pg" style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${bg};color:${C.cream};font-family:Rubik, Arial, sans-serif;padding:40px 44px;display:flex;flex-direction:column;gap:16px;box-sizing:border-box">${inner}</div>`;

const header = (name, fecha, n) => `<div style="display:flex;justify-content:space-between;align-items:center">
  <p style="margin:0;font-family:${DISPLAY};font-size:30px;color:${C.lime};text-shadow:3px 3px 0 ${C.pink}">¿TE ACUERDAS?</p>
  <p style="margin:0;font-size:14px;font-weight:800;letter-spacing:1.5px;color:${C.mist};text-align:right">${escapeHtml(name)} · ${escapeHtml(fecha)}<br><span style="color:${C.pink}">${n} DE 3</span></p>
</div>`;

const h2 = (t, color = C.lime) => `<p style="margin:0;font-family:${DISPLAY};font-size:30px;line-height:1.05;color:${color};text-shadow:3px 3px 0 ${C.pink}">${t}</p>`;
const kicker = (t, color = C.pink) => `<p style="margin:0;font-size:13px;font-weight:800;letter-spacing:2px;color:${color}">${t}</p>`;

function hitsRow(label, hits, played) {
  const set = new Set(String(hits || '').split(',').filter(Boolean).map(Number));
  return `<div style="display:flex;align-items:center;gap:8px">
    <p style="margin:0;width:70px;font-size:13px;font-weight:800;color:${C.mist}">${label}</p>
    ${Array.from({ length: N_WORDS }, (_, i) => `<p style="margin:0;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border-radius:7px;border:2px solid ${set.has(i + 1) ? C.ink : C.grape};background:${set.has(i + 1) ? C.lime : C.plum};color:${set.has(i + 1) ? C.night : '#7d6c98'}">${i + 1}</p>`).join('')}
    ${played ? '' : `<p style="margin:0;font-size:12px;color:${C.mist}">no jugó</p>`}
  </div>`;
}

function answerItem(label, value, ok = null) {
  const mark = ok === null ? '' : `<span style="font-weight:800;color:${ok ? C.lime : C.pink}">${ok ? '  ✓' : '  ✗'}</span>`;
  return `<div style="display:flex;flex-direction:column;gap:4px;background:${C.plum};border:2px solid ${C.grape};border-radius:14px;padding:11px 14px">
    <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:1px;color:${C.mist}">${label}</p>
    <p style="margin:0;font-size:16px;font-weight:800;line-height:1.3;color:${C.cream}">${value}${mark}</p>
  </div>`;
}

// ---------- Página 1: mi recuerdo ----------
function pageMine(d) {
  const { me, res = {}, meta = {}, qa = {}, fecha } = d;
  const label = (qid, v) => QUESTIONS[qid].options?.find((o) => o.id === v)?.label;
  // Varios comentarios: los 3 más recientes completos y cuántos más hubo.
  const said = (a) => {
    const all = a.all?.length ? a.all : [a.v];
    const last = all.slice(-3);
    return last.map((v) => `«${escapeHtml(v)}»`).join(' ') + (all.length > 3 ? ` <span style="color:${C.mist}">(y ${all.length - 3} más)</span>` : '');
  };
  const items = [];
  if (qa.rating?.v) items.push(answerItem('TU MEMORIA, CALIFICADA POR TI AL INICIO', `${qa.rating.v} de 10${meta.rateAvg != null ? ` (el grupo: ${meta.rateAvg})` : ''}`));
  if (qa.gancho?.v) items.push(answerItem('LO QUE RECORDABAS DE TU ÚLTIMA CAPACITACIÓN', said(qa.gancho)));
  if (qa.cuarto?.v) items.push(answerItem('¿ENTRASTE A UN CUARTO Y OLVIDASTE A QUÉ IBAS?', label('cuarto', qa.cuarto.v)));
  if (qa.chunk?.v) {
    const c = chunkScore(qa.chunk.v);
    items.push(answerItem(`EL NÚMERO ${CHUNK_NUMBER}`, c.ok ? '¡Lo recordaste completo!' : `Acertaste ${c.hits} de 10 dígitos en su lugar`, c.ok));
  }
  if (qa.olvido?.v) items.push(answerItem('¿CUÁNTO OLVIDAS EN UN DÍA?', `${qa.olvido.v}: ${escapeHtml(label('olvido', qa.olvido.v))}`, qa.olvido.v === QUESTIONS.olvido.correct));
  const mitos = ['mito-1', 'mito-2', 'mito-3', 'mito-4'].filter((id) => qa[id]?.v);
  if (mitos.length) {
    const ok = mitos.filter((id) => qa[id].v === QUESTIONS[id].correct).length;
    items.push(answerItem('MITOS: ¿VERDADERO O FALSO?', `Le atinaste a ${ok} de ${mitos.length} · ${mitos.map((id) => `${id.slice(-1)}${qa[id].v === QUESTIONS[id].correct ? '✓' : '✗'}`).join('  ')}`));
  }
  if (qa.revela?.v) items.push(answerItem('¿POR QUÉ CALCETINES ERA EL 2?', said(qa.revela)));
  if (qa.cierre?.v) items.push(answerItem('LO QUE TE CUESTA RECORDAR… Y DE DÓNDE COLGARLO', `${said(qa.cierre)}${qa.cierre.area ? ` · ${escapeHtml(qa.cierre.area)}` : ''}`));

  const gain = res.p1 && res.p2 ? res.r2 - res.r1 : null;
  return page(`
    ${header(me.name, fecha, 1)}
    <div style="display:flex;align-items:center;gap:22px;background:${C.cream};color:${C.night};border:4px solid ${C.ink};border-radius:26px;box-shadow:8px 8px 0 ${C.lime};padding:18px 24px">
      ${avatarSVG(me.avatar, { size: 150, title: me.name })}
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        ${kicker('RECUERDO DE')}
        <p style="margin:0;font-family:${DISPLAY};font-size:42px;line-height:1;color:${C.night}">${escapeHtml(me.name.toUpperCase())}</p>
        <p style="margin:0;font-size:16px;font-weight:800;color:#5B4B70">Capacitación «¿Te acuerdas? Aprender a aprender» · ${escapeHtml(fecha)}</p>
        ${res.place ? `<p style="margin:4px 0 0;align-self:flex-start;font-family:${DISPLAY};font-size:20px;color:${C.night};background:${C.lime};padding:6px 14px;border:3px solid ${C.ink};border-radius:12px">LUGAR ${res.place} DE ${meta.count || '—'}</p>` : ''}
      </div>
    </div>
    <div style="display:flex;align-items:stretch;gap:14px">
      <div style="flex:1;background:${C.plum};border:3px solid ${C.lime};border-radius:20px;padding:14px 18px">
        ${kicker('RONDA 1 · SIN CÓDIGO')}
        <p style="margin:4px 0 0;font-family:${DISPLAY};font-size:44px;line-height:1">${res.p1 ? res.r1 : '—'}<span style="font-size:20px;color:${C.mist}"> / 20</span></p>
      </div>
      <div style="flex:1;background:${C.pink};color:${C.night};border:3px solid ${C.ink};border-radius:20px;padding:14px 18px">
        ${kicker('RONDA 2 · CON CÓDIGO', C.night)}
        <p style="margin:4px 0 0;font-family:${DISPLAY};font-size:44px;line-height:1">${res.p2 ? res.r2 : '—'}<span style="font-size:20px"> / 20</span></p>
      </div>
      <div style="width:160px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:${C.lime};color:${C.night};border:3px solid ${C.ink};border-radius:20px;padding:10px">
        ${kicker('MEJORA', C.night)}
        <p style="margin:2px 0 0;font-family:${DISPLAY};font-size:40px;line-height:1">${gain === null ? '—' : (gain > 0 ? '+' : '') + gain}</p>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${kicker('TUS ACIERTOS, NÚMERO POR NÚMERO', C.lime)}
      ${hitsRow('Ronda 1', res.h1, res.p1)}
      ${hitsRow('Ronda 2', res.h2, res.p2)}
    </div>
    ${kicker('TUS RESPUESTAS DURANTE LA SESIÓN', C.lime)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${items.join('') || answerItem('SIN RESPUESTAS', 'Esta vez no contestaste las preguntas en vivo.')}</div>
    <p style="margin:auto 0 0;font-family:${DISPLAY};font-size:22px;line-height:1.15;color:${C.lime}">TU MEMORIA NO CAMBIÓ.<br>CAMBIÓ LA FORMA DE GUARDAR.</p>
  `);
}

// ---------- Página 2: así jugamos hoy ----------
function pageGroup(d) {
  const { me, uid, meta = {}, players = [], fecha } = d;
  const list = players.slice(0, 35);
  const pills = [
    `${meta.count || players.length} cerebros jugaron`,
    meta.played1 ? `Palabras: ${meta.avg1} → ${meta.played2 ? meta.avg2 : '—'} de 20` : '',
    meta.rateAvg != null ? `Memoria al inicio: ${meta.rateAvg}/10` : '',
    meta.chunkOk ? `Recordaron el número: ${meta.chunkOk}` : '',
    meta.mythsPct != null ? `Atinaron mitos y olvido: ${meta.mythsPct}%` : '',
  ].filter(Boolean);
  return page(`
    ${header(me.name, fecha, 2)}
    ${h2('ASÍ JUGAMOS HOY')}
    <div style="display:flex;flex-wrap:wrap;gap:8px">${pills.map((p, i) => `<p style="margin:0;font-size:14px;font-weight:800;color:${i ? C.cream : C.night};background:${i ? C.plum : C.lime};padding:6px 14px;border:2px solid ${C.ink};border-radius:999px">${p}</p>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px">
      ${list.map((p, i) => `<div style="display:flex;align-items:center;gap:6px;background:${p.id === uid ? C.cream : C.plum};color:${p.id === uid ? C.night : C.cream};border:2px solid ${p.id === uid ? C.pink : ACC[i % ACC.length]};border-radius:12px;padding:5px 7px;min-width:0">
        ${avatarSVG(p.avatar, { size: 40, title: p.name })}
        <div style="display:flex;flex-direction:column;min-width:0">
          <p style="margin:0;font-size:12px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.place ? `${p.place}. ` : ''}${escapeHtml(p.name)}</p>
          <p style="margin:0;font-size:13px;font-weight:800;line-height:1.2;color:${p.id === uid ? C.pink : C.lime}">${p.p1 ? p.r1 : '—'} → ${p.p2 ? p.r2 : '—'}</p>
          ${p.rate != null ? `<p style="margin:0;font-size:10px;font-weight:800;line-height:1.2;white-space:nowrap;color:${p.id === uid ? '#5B4B70' : C.mist}">memoria ${p.rate}/10</p>` : ''}
        </div>
      </div>`).join('')}
    </div>
    ${players.length > list.length ? `<p style="margin:0;font-size:13px;color:${C.mist}">y ${players.length - list.length} más</p>` : ''}
    ${(meta.quotes || []).length ? `${kicker('EL MURO DEL GRUPO: LO QUE NOS CUESTA RECORDAR', C.lime)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${meta.quotes.map((q, i) => `<div style="display:flex;flex-direction:column;gap:6px;background:${C.cream};color:${C.night};border:3px solid ${C.ink};border-radius:16px;box-shadow:4px 4px 0 ${ACC[i % ACC.length]};padding:10px 12px">
        <div style="display:flex;align-items:center;gap:6px">${avatarSVG(q.avatar, { size: 30, title: q.name })}<p style="margin:0;font-size:13px;font-weight:800">${escapeHtml(q.name)}</p>${q.area ? `<p style="margin:0;font-size:11px;font-weight:800;background:${ACC[i % ACC.length]};padding:2px 8px;border-radius:999px;border:2px solid ${C.ink}">${escapeHtml(q.area)}</p>` : ''}</div>
        <p style="margin:0;font-size:14px;font-weight:800;line-height:1.3">«${escapeHtml(q.v)}»</p>
      </div>`).join('')}
    </div>` : ''}
    <p style="margin:auto 0 0;font-size:13px;color:${C.mist}">Cada tarjeta: lugar, nombre, palabras recordadas en la ronda 1 → ronda 2 y la calificación que se puso cada quien a su memoria al inicio.</p>
  `);
}

// ---------- Página 3: guía rápida ----------
const STRATEGIES = [
  ['1', 'AGRUPA', 'Tu memoria de corto plazo carga unas 7 cosas a la vez.', ['Parte números y folios largos en bloques de 3 o 4: 55 · 1827 · 4390.', 'Convierte una lista de 15 pendientes en 3 grupos de 5.']],
  ['2', 'REPASA ESPACIADO', 'Sin repaso, en un día se va casi todo.', ['Hoy: 5 minutos de repaso.', 'En 2 días: explícaselo a alguien.', 'En 1 semana: recuérdalo sin ver.']],
  ['3', 'RECUERDA SIN VER', 'Releer engaña: se siente conocido, pero no entrena.', ['Cierra el cuaderno y escribe lo que recuerdas.', 'Antes de una junta, di en voz alta los 3 puntos clave sin leerlos.']],
  ['4', 'ASOCIA', 'Lo que se cuelga de algo, se queda.', ['Cuelga lo nuevo de un número, un lugar, una rima o una imagen.', 'Usa tu código del 1 al 20 para cualquier lista.']],
];

function pageGuide(d) {
  const { me, qa = {}, fecha } = d;
  const area = qa.cierre?.area && AREA_HOOKS.find(([a]) => a === qa.cierre.area);
  return page(`
    ${header(me.name, fecha, 3)}
    ${h2('GUÍA RÁPIDA PARA QUE SE QUEDE')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${STRATEGIES.map(([n, t, why, steps], i) => `<div style="display:flex;flex-direction:column;gap:6px;background:${C.plum};border:3px solid ${ACC[i]};border-radius:18px;padding:12px 14px">
        <div style="display:flex;align-items:center;gap:10px"><p style="margin:0;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-family:${DISPLAY};font-size:18px;color:${C.night};background:${ACC[i]};border:2px solid ${C.ink};border-radius:999px">${n}</p><p style="margin:0;font-family:${DISPLAY};font-size:19px;color:${C.cream}">${t}</p></div>
        <p style="margin:0;font-size:13px;font-weight:800;color:${C.mist}">${why}</p>
        ${steps.map((s) => `<p style="margin:0;font-size:13px;line-height:1.35;color:${C.cream}">• ${s}</p>`).join('')}
      </div>`).join('')}
    </div>
    ${kicker('TU CÓDIGO DEL 1 AL 20 (GUÁRDALO: SIRVE PARA CUALQUIER LISTA)', C.lime)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 12px">
      ${WORDS.map((w) => `<div style="display:flex;align-items:center;gap:8px;background:${C.plum};border-radius:10px;padding:4px 8px">
        <p style="margin:0;width:28px;font-family:${DISPLAY};font-size:15px;color:${C.lime};text-align:center">${w.n}</p>
        <p style="margin:0;font-size:13px;font-weight:800;color:${C.cream};width:118px">${escapeHtml(w.word)}</p>
        <p style="margin:0;font-size:11px;color:${C.mist};line-height:1.2">${escapeHtml(w.why)}</p>
      </div>`).join('')}
    </div>
    ${area ? `<div style="background:${C.cream};color:${C.night};border:3px solid ${C.ink};border-radius:16px;box-shadow:4px 4px 0 ${C.lime};padding:10px 14px">
      ${kicker(`UN GANCHO PARA TU ÁREA: ${escapeHtml(area[0].toUpperCase())}`)}
      <p style="margin:4px 0 0;font-size:14px;font-weight:800;line-height:1.35">${escapeHtml(area[1])}</p>
    </div>` : ''}
    <div style="margin-top:auto;display:flex;align-items:center;gap:12px;background:${C.lime};color:${C.night};border:3px solid ${C.ink};border-radius:16px;padding:12px 16px">
      <p style="margin:0;font-family:${DISPLAY};font-size:20px;line-height:1.1">EN 7 DÍAS TE PREGUNTAMOS: ¿CUÁL ERA LA 7?</p>
    </div>
  `);
}

// Arma las tres páginas y descarga el PDF.
export async function downloadRecuerdo(d) {
  const { jsPDF, html2canvas } = await import('../vendor/pdf.js');
  try {
    await Promise.all([document.fonts.load(`30px ${DISPLAY}`), document.fonts.load('800 16px Rubik'), document.fonts.load('400 16px Rubik')]);
  } catch {}
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:absolute;left:0;top:0;width:${W}px;z-index:-1;pointer-events:none`;
  host.innerHTML = pageMine(d) + pageGroup(d) + pageGuide(d);
  document.body.appendChild(host);
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pages = [...host.querySelectorAll('.pg')];
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2, width: W, height: H, windowWidth: W + 40, backgroundColor: C.night, logging: false });
      if (i) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    }
    const slug = d.me.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jugador';
    const name = `Te-acuerdas-${slug}.pdf`;
    if (d.preview) return { pdf, pages: pages.length, name };
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { pages: pages.length, name, url };
  } finally {
    if (!d.keepHost) host.remove();
  }
}

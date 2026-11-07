# Qué pasa después de la recomendación actual (audio + links de cursos), siguiendo a cada lead 7 días.
import json, os, re, sys
from datetime import datetime, timedelta, timezone
import pandas as pd
sys.argv = [sys.argv[0], sys.argv[1], 'x']
D = sys.argv[1]
import importlib.util
spec = importlib.util.spec_from_file_location('an', os.path.join(D, 'scripts', 'analizar.py')); an = importlib.util.module_from_spec(spec); spec.loader.exec_module(an)
dur = an.dur_audio_desde_cache()
CORTE = an.PERIODOS['nuevo'][1]
LINK = re.compile(r'academy\.dpsys\.com\.mx/(?!clase-demo|mapa|egresados|ruta)[\w\-]+')
PRECIO = re.compile(r'3,?799|3,?400|2,?799|1,?950|3,?999')
filas = []
for p in ['base', 'nuevo']:
    L = pd.read_pickle(os.path.join(D, f'leads_{p}.pkl'))
    X = L[(L.contesto_area == True) & (L.aud_occ == True)]
    for r in X.itertuples():
        d = json.load(open(os.path.join(D, 'det', r.id + '.json')))
        ms = sorted([m for m in d['msgs'] if not m.get('eliminadoAt')], key=an.ts)
        preg = [m for m in ms if an.es_bot(m) and an.PREG_AREA.search(an.norm(m.get('texto')))]
        tq = an.ts(preg[0])
        ent = [m for m in ms if m['direccion'] == 'entrante']
        occ = [m for m in ent if tq < an.ts(m) <= tq + timedelta(hours=24) and an.OCUPA.search(' ' + an.norm(m.get('texto')) + ' ')]
        t0 = an.ts(occ[0])
        a = next(m for m in ms if an.es_persona(m) and m['tipo'] == 'audio' and an.ts(m) >= t0)
        ta = an.ts(a)
        if ta > CORTE - timedelta(days=7): continue          # sin 7 días de seguimiento
        fin = ta + timedelta(days=7)
        ent7 = [m for m in ent if ta < an.ts(m) <= fin]
        tr = an.ts(ent7[0]) if ent7 else None
        # bloque de la recomendación: lo que manda una persona en los 30 min después del audio, antes de que el lead conteste
        lim_blq = min(ta + timedelta(minutes=30), tr) if tr else ta + timedelta(minutes=30)
        blq = [m for m in ms if an.es_persona(m) and ta <= an.ts(m) <= lim_blq]
        tb = max(an.ts(m) for m in blq)
        links = sorted({u for m in blq for u in LINK.findall(m.get('texto') or '')})
        sal = [m for m in ms if an.es_saliente(m) and tb < an.ts(m) <= (tr or fin)]
        if tr is None: clase = 'No volvió a escribir en 7 días'
        elif any(PRECIO.search(m.get('texto') or '') for m in sal): clase = 'Contestó más adelante, con una oferta'
        elif tr - ta <= timedelta(hours=2): clase = 'Contestó en las primeras 2 horas'
        else: clase = 'Contestó más adelante, con un seguimiento'
        sub = None
        if clase == 'Contestó en las primeras 2 horas':
            sub = 'a la recomendación' if not [m for m in sal if m.get('automatico')] else 'a las facilidades que manda el bot enseguida'
        # ofertas que recibió en los 7 días
        of7 = [m for m in ms if an.es_saliente(m) and ta < an.ts(m) <= fin and PRECIO.search(m.get('texto') or '')]
        filas.append(dict(periodo=p, id=r.id, lead=r.lead, embudo=r.embudo, seg_audio=dur(a), audio_leido=a.get('estado') == 'leido' or bool(a.get('leidoAt')),
                          n_links=len(links), clase=clase, sub=sub, h_resp=((tr - ta).total_seconds() / 3600 if tr else None), resp24=bool(tr and tr - ta <= timedelta(hours=24)),
                          msgs_lead_7d=len(ent7), oferta_7d=bool(of7), venta=r.venta, precio=r.precio, llego_fac=r.llego_facilidades))
R = pd.DataFrame(filas)
R.to_pickle(os.path.join(D, 'recomendacion.pkl'))
ORD = ['Contestó en las primeras 2 horas', 'Contestó más adelante, con un seguimiento', 'Contestó más adelante, con una oferta', 'No volvió a escribir en 7 días']
for nom, X in [('base', R[R.periodo == 'base']), ('nuevo', R[R.periodo == 'nuevo']), ('juntos', R)]:
    print(f'===== {nom}: {len(X)} leads con recomendación y 7 días de seguimiento')
    print(f'  audio: mediana {X.seg_audio.median():.0f} s · >90 s {(X.seg_audio > 90).mean():.0%} · ≤60 s {(X.seg_audio <= 60).mean():.1%} · leído {X.audio_leido.mean():.0%} · links mediana {X.n_links.median():.0f} · con 2+ links {(X.n_links >= 2).mean():.0%}')
    g = X.groupby('clase').agg(n=('id', 'size'), ventas=('venta', 'sum'), fac=('llego_fac', 'mean'), h=('h_resp', 'median')).reindex(ORD)
    g['%'] = g.n / len(X); g['conv'] = g.ventas / g.n
    print(g.round(3).to_string())
    print('  sub', X['sub'].value_counts().to_dict(), '| ventas sub', X[X.venta]['sub'].value_counts().to_dict())
    print(f'  contestó en 24 h {X.resp24.mean():.1%} · ventas {int(X.venta.sum())} ({X.venta.mean():.1%}) · con descuento {int((X[X.venta].precio < 3999).sum())} · recibió oferta en 7 días {X.oferta_7d.mean():.0%}')

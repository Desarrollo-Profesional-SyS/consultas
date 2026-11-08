# ¿El lead vuelve a escribir en las primeras 2 h desde que llega?
import json, os, sys
from datetime import timedelta
import pandas as pd
sys.argv = [sys.argv[0], sys.argv[1], 'x']
D = sys.argv[1]
import importlib.util
spec = importlib.util.spec_from_file_location('an', os.path.join(D, 'scripts', 'analizar.py')); an = importlib.util.module_from_spec(spec); spec.loader.exec_module(an)
out = []
for p in ['base', 'nuevo']:
    L = pd.read_pickle(os.path.join(D, f'leads_{p}.pkl'))
    corte = an.PERIODOS[p][1]
    for r in L.itertuples():
        d = json.load(open(os.path.join(D, 'det', r.id + '.json')))
        ms = sorted([m for m in d['msgs'] if not m.get('eliminadoAt') and an.ts(m) <= corte], key=an.ts)
        ent = [an.ts(m) for m in ms if m['direccion'] == 'entrante']
        t0 = ent[0]
        # respuesta = lo que escribe después del primer mensaje que le mandamos (el saludo del bot)
        sal = [m for m in ms if an.es_saliente(m) and an.ts(m) >= t0]
        pide = next((an.ts(m) for m in sal if an.PIDE_NOMBRE.search(an.norm(m.get('texto')))), None)
        t_sal = pide or (an.ts(sal[0]) if sal else None)
        seg = next((t for t in ent if t_sal and t > t_sal), None)
        h = (seg - t0).total_seconds() / 3600 if seg else None
        if h is not None and h <= 2: g = 'En las primeras 2 h'
        elif h is not None and h <= 24: g = 'Entre 2 y 24 h'
        elif h is not None: g = 'Después de 24 h'
        else: g = 'No volvió a escribir'
        out.append(dict(periodo=p, id=r.id, lead=r.lead, embudo=r.embudo, h_2do=h, grupo=g, completo=(corte - t0) >= timedelta(hours=2),
                        fuera=r.fuera_horario, occ=r.contesto_area == True, venta=r.venta, precio=r.precio, entrada=r.entrada))
T = pd.DataFrame(out); T.to_pickle(os.path.join(D, 'respuesta_2h.pkl'))
ORD = ['En las primeras 2 h', 'Entre 2 y 24 h', 'Después de 24 h', 'No volvió a escribir']
for nom, X in [('base', T[T.periodo == 'base']), ('nuevo', T[T.periodo == 'nuevo']), ('juntos', T)]:
    X = X[X.completo]
    print(f'===== {nom}: {len(X)} leads con 2 h o más al corte')
    g = X.groupby('grupo').agg(n=('id', 'size'), occ=('occ', 'mean'), ventas=('venta', 'sum')).reindex(ORD)
    g['%'] = g.n / len(X); g['conv'] = g.ventas / g.n
    print(g.round(3).to_string())
    print('  mediana min a la respuesta (de los que contestan en 2 h):', round(X[X.grupo == ORD[0]].h_2do.median() * 60, 1), '| ventas totales', int(X.venta.sum()), '| precio prom 2h', round(X[(X.grupo == ORD[0]) & X.venta].precio.mean()))
    for f, Y in [('en horario', X[~X.fuera]), ('fuera de horario', X[X.fuera])]:
        print(f'  {f}: {len(Y)} leads · contestan en 2 h {(Y.grupo == ORD[0]).mean():.1%}')
    for e in ['ISO + Calidad', 'Manufactura y Calidad', 'Core Tools Premium']:
        Y = X[X.embudo == e]; print(f'  {e}: {(Y.grupo == ORD[0]).mean():.1%}')

# Mismo plazo para todos: lo que pasó en los primeros 7 días de cada lead (solo leads con 7 días o más).
import json, os, sys
from datetime import timedelta
import pandas as pd
sys.argv = [sys.argv[0], sys.argv[1], 'x']
D = sys.argv[1]
import importlib.util
spec = importlib.util.spec_from_file_location('an', os.path.join(D, 'scripts', 'analizar.py')); an = importlib.util.module_from_spec(spec); spec.loader.exec_module(an)
dur = an.dur_audio_desde_cache()
convs = {c['id']: c for c in json.load(open(os.path.join(D, 'convs.json')))}
LIM = an.PERIODOS['nuevo'][1] - timedelta(days=7)
out = []
for p in ['base', 'nuevo']:
    L = pd.read_pickle(os.path.join(D, f'leads_{p}.pkl'))
    for r in L.itertuples():
        if r.entrada > LIM: continue
        d = json.load(open(os.path.join(D, 'det', r.id + '.json')))
        x = an.lead(convs[r.id], d, r.entrada, r.entrada + timedelta(days=7), dur)
        if x: x['periodo'] = p; out.append(x)
W = pd.DataFrame(out)
W['caso'] = ((W.temperatura == 'Caliente') & ~(W.ruta_pdf & W.audio_corto)) | ((W.temperatura != 'Caliente') & W.recibio_2799)
W.to_pickle(os.path.join(D, 'ventana7.pkl'))
g = W.groupby('periodo').agg(leads=('id', 'size'), caso=('caso', 'mean'), o2799=('recibio_2799', 'mean'), oferta=('recibio_oferta', 'mean'),
    deja=('dejo_en_saludo', 'mean'), venta=('venta', 'mean'), ventas=('venta', 'sum'), plant=('plantillas_pagadas', 'mean'), meta=('meta_retenido', 'mean'))
print(g.round(3).T)
TF = W[W.temperatura != 'Caliente']
print(TF.groupby('periodo').agg(n=('id', 'size'), o2799=('recibio_2799', 'mean'), plant=('plantillas_pagadas', 'sum'), resp=('plantillas_pagadas_resp', 'sum')))
print(W.groupby(['periodo', 'temperatura']).size().unstack())

# De los leads que dicen a qué se dedican: ¿recibieron audio del equipo? ¿contestaron después?
import json, os, sys
from datetime import timedelta
import pandas as pd
sys.argv = [sys.argv[0], sys.argv[1], 'x']
D = sys.argv[1]
import importlib.util
spec = importlib.util.spec_from_file_location('an', os.path.join(D, 'scripts', 'analizar.py')); an = importlib.util.module_from_spec(spec); spec.loader.exec_module(an)
dur = an.dur_audio_desde_cache()
cache = json.load(open(os.path.join(D, 'audios', 'duraciones.json')))
def detalle(cid, entrada, corte):
    d = json.load(open(os.path.join(D, 'det', cid + '.json')))
    ms = sorted([m for m in d['msgs'] if not m.get('eliminadoAt') and an.ts(m) <= corte], key=an.ts)
    ent = [m for m in ms if m['direccion'] == 'entrante']
    preg = [m for m in ms if an.es_bot(m) and an.PREG_AREA.search(an.norm(m.get('texto')))]
    r = {'occ': False, 'audio': False, 'audio_bot': False, 'min_audio': None, 'seg_audio': None, 'resp24': False, 'resp_alguna': False, 'audio_antes_occ': False}
    if not preg: return r
    tq = an.ts(preg[0])
    occ = [m for m in ent if tq < an.ts(m) <= tq + timedelta(hours=24) and an.OCUPA.search(' ' + an.norm(m.get('texto')) + ' ')]
    if not occ: return r
    t0 = an.ts(occ[0]); r['occ'] = True; r['t_occ'] = t0
    r['audio_antes_occ'] = any(an.es_persona(m) and m['tipo'] == 'audio' and tq <= an.ts(m) < t0 for m in ms)
    au = [m for m in ms if an.es_persona(m) and m['tipo'] == 'audio' and an.ts(m) >= t0]
    r['audio_bot'] = any(an.es_bot(m) and m['tipo'] == 'audio' and an.ts(m) >= t0 for m in ms)
    if au:
        a = au[0]; ta = an.ts(a); r['audio'] = True
        r['min_audio'] = (ta - t0).total_seconds() / 60
        r['seg_audio'] = dur(a)
        r['resp24'] = any(ta < an.ts(e) <= ta + timedelta(hours=24) for e in ent)
        r['resp_alguna'] = any(an.ts(e) > ta for e in ent)
    return r
out = []
for p in ['base', 'nuevo']:
    L = pd.read_pickle(os.path.join(D, f'leads_{p}.pkl'))
    corte = an.PERIODOS[p][1]
    for r in L.itertuples():
        x = detalle(r.id, r.entrada, corte)
        x.update(periodo=p, id=r.id, lead=r.lead, embudo=r.embudo, temperatura=r.temperatura, venta=r.venta, recibio_2799=r.recibio_2799, dias=r.dias_al_corte)
        out.append(x)
A = pd.DataFrame(out)
A.to_pickle(os.path.join(D, 'audio_ocupacion.pkl'))
for p in ['base', 'nuevo']:
    X = A[A.periodo == p]; O = X[X.occ]; Au = O[O.audio]
    print(f'== {p}: leads {len(X)} | dijeron ocupación {len(O)} ({len(O)/len(X):.1%})')
    print(f'   recibieron audio del equipo {len(Au)} ({len(Au)/len(O):.1%}) | sin audio {len(O)-len(Au)} | audio del bot {int(O.audio_bot.sum())} | audio antes de la ocupación {int(O.audio_antes_occ.sum())}')
    print(f'   min al audio mediana {Au.min_audio.median():.1f} | seg audio mediana {Au.seg_audio.median():.0f} | ≤60 s {int((Au.seg_audio<=60).sum())}')
    print(f'   contestaron en 24 h {int(Au.resp24.sum())} ({Au.resp24.mean():.1%}) | en algún momento {int(Au.resp_alguna.sum())} ({Au.resp_alguna.mean():.1%})')
    print(f'   ventas: dijeron ocupación {int(O.venta.sum())} | con audio y contestaron {int(Au[Au.resp24].venta.sum())} de {int(Au.resp24.sum())} | con audio sin contestar {int(Au[~Au.resp24].venta.sum())} de {int((~Au.resp24).sum())} | sin audio {int(O[~O.audio].venta.sum())} de {int((~O.audio).sum())}')
    caso_occ = O[~(O.audio & O.resp24)]
    TF = X[X.temperatura != 'Caliente']
    print(f'   caso ocupación (sin audio o sin respuesta 24 h): {len(caso_occ)} de {len(O)} ({len(caso_occ)/len(O):.1%}) | tibios+fríos con 2799 {int(TF.recibio_2799.sum())} de {len(TF)}')
    rev = len(O) + len(TF); cas = len(caso_occ) + int(TF.recibio_2799.sum())
    print(f'   CASO: revisados {rev} con problema {cas} ({cas/rev:.1%}) | ocupación ∩ tibio/frío {int((O.temperatura != "Caliente").sum())}')
    for e in ['ISO + Calidad', 'Manufactura y Calidad', 'Core Tools Premium']:
        Oe = O[O.embudo == e]; Ae = Oe[Oe.audio]
        print(f'     {e}: ocup {len(Oe)} audio {len(Ae)} ({len(Ae)/max(1,len(Oe)):.0%}) resp24 {int(Ae.resp24.sum())} ({Ae.resp24.mean():.0%})')

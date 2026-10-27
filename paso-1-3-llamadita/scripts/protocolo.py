# Compara lo que pasa despues del audio segun el protocolo:
#   - Pregunta abierta de Joceline sin mover a 1.3
#   - 1.3 (bot: llamadita a los 5 min y facilidades a los 15 min), con o sin la pregunta
# Ancla: el primer audio de una persona tras la respuesta del cliente al area.
import json, math, os, re, sys, unicodedata
from datetime import datetime, timedelta
import pandas as pd

D = sys.argv[1]
def norm(t): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower())
def ts(m): return datetime.fromisoformat((m.get('timestampMeta') or m['createdAt']).replace('Z', '+00:00'))
def iso(v): return datetime.fromisoformat(v.replace('Z', '+00:00')) if v else None

PREG = re.compile(r'que te parece (mi )?recomendacion|cuentame que te parece|si gustas saber mas')
LLAM = re.compile(r'llamadita para explicarte')
FACI_BOT = re.compile(r'quieres que te muestre como quedaria')
FACI = re.compile(r'pago en una sola exhibicion|facilidades de pago:|te comparto las facilidades|manejamos 3 facilidades|quieres que te muestre como quedaria')
JO = 'Joceline Sarahi Benavides Serrano'

P = pd.read_pickle(os.path.join(D, 'P.pkl'))
R = P[P.contesto_en_12 & (P.t_pregunta >= '2026-10-05') & P.audio].copy()
filas = []
for _, r in R.iterrows():
    d = json.load(open(os.path.join(D, 'det', r.id + '.json')))
    msgs = sorted([m for m in d['msgs'] if not m.get('eliminadoAt')], key=ts)
    movs = d['mov']
    t0 = r.t_audio
    audio = next(m for m in msgs if m['direccion'] == 'saliente' and not m['automatico'] and m['tipo'] == 'audio' and ts(m) == t0)
    leido = iso(audio.get('leidoAt'))
    sal = [m for m in msgs if m['direccion'] == 'saliente' and not m['interno'] and ts(m) > t0]
    ent = [m for m in msgs if m['direccion'] == 'entrante' and ts(m) > t0]
    preg = [m for m in sal if not m['automatico'] and PREG.search(norm(m['texto']))]
    llam = [m for m in sal if m['automatico'] and LLAM.search(norm(m['texto']))]
    faci_bot = [m for m in sal if m['automatico'] and FACI_BOT.search(norm(m['texto']))]
    faci = [m for m in sal if FACI.search(norm(m['texto']))]
    neg = sorted([iso(mv['createdAt']) for mv in movs if 'negativo' in norm(mv['hacia']['nombre']) and iso(mv['createdAt']) > t0])
    t_neg = neg[0] if neg else None
    mov13 = sorted([iso(mv['createdAt']) for mv in movs if mv['hacia']['nombre'].startswith('1.3') and iso(mv['createdAt']) >= r.t_pregunta])
    con13 = bool(mov13) and (t_neg is None or mov13[0] < t_neg)
    # Primer "empujon" despues del audio: la pregunta de la persona o la llamadita del bot.
    cands = [ts(x[0]) for x in (preg, llam) if x]
    t_emp = min(cands) if cands else None
    e0 = ent[0] if ent else None
    def resp_en(h): return any(ts(m) <= t0 + timedelta(hours=h) for m in ent)
    resp_antes_neg = any(t_neg is None or ts(m) < t_neg for m in ent)
    # Mensajes que le llegaron antes de que volviera a escribir (o en 2 h si no escribio)
    tope = ts(e0) if e0 else t0 + timedelta(hours=2)
    presion = [m for m in sal if ts(m) < tope and ts(m) <= t0 + timedelta(hours=2)]
    filas.append({
        'lead': r.lead, 'embudo': r.embudo, 'audio_de': r.audio_quien, 'franja': r.franja if 'franja' in r else None,
        'con_pregunta': bool(preg), 'con_13': con13,
        'protocolo': ('1.3 + pregunta' if preg else '1.3 sin pregunta') if con13 else ('Pregunta sin 1.3' if preg else 'Ni pregunta ni 1.3'),
        'min_empujon': (t_emp - t0).total_seconds() / 60 if t_emp else None,
        'leyo_audio': leido is not None, 'min_leer': (leido - t0).total_seconds() / 60 if leido else None,
        'leyo_antes_empujon': (leido is not None and t_emp is not None and leido <= t_emp),
        'resp_30m': resp_en(0.5), 'resp_2h': resp_en(2), 'resp_24h': resp_en(24), 'resp_antes_neg': resp_antes_neg,
        'min_resp': (ts(e0) - t0).total_seconds() / 60 if e0 else None,
        'resp_tras_preg_30m': bool(preg) and any(ts(preg[0]) < ts(m) <= ts(preg[0]) + timedelta(minutes=30) for m in ent),
        'msgs_antes_resp': len(presion),
        'horas_a_neg': (t_neg - t0).total_seconds() / 3600 if t_neg else None,
        'neg_en_24h': t_neg is not None and t_neg <= t0 + timedelta(hours=24),
        'neg_con_resp': t_neg is not None and any(ts(m) < t_neg for m in ent) and t_neg <= t0 + timedelta(hours=24),
        'faci_24h': any(ts(m) <= t0 + timedelta(hours=24) for m in faci),
        'llego_14': r.llego_14_o_mas, 'llego_pago': r.llego_pago, 'venta': bool(r.venta), 'maduro': bool(r.maduro),
    })
A = pd.DataFrame(filas)
hora = R.set_index('lead').t_resp.dt.tz_convert('America/Matamoros').dt.hour
A['franja'] = A.lead.map(lambda l: '9 a 18 h' if 9 <= hora[l] < 18 else ('18 a 22 h' if 18 <= hora[l] < 22 else '22 a 9 h'))
A.to_pickle(os.path.join(D, 'protocolo.pkl'))

def wilson(k, n, z=1.96):
    if n == 0: return (0, 0)
    p = k / n; den = 1 + z * z / n; c = (p + z * z / (2 * n)) / den; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (max(0, c - h), min(1, c + h))
def fisher(a, b, c, d):
    n1, n2, k = a + b, c + d, a + c; N = n1 + n2
    def pr(x): return math.comb(n1, x) * math.comb(n2, k - x) / math.comb(N, k)
    p0 = pr(a); return min(1, sum(pr(x) for x in range(max(0, k - n2), min(k, n1) + 1) if pr(x) <= p0 * (1 + 1e-9)))

pd.set_option('display.width', 250); pd.set_option('display.max_columns', 30)
agg = dict(n=('lead', 'size'), resp30=('resp_30m', 'mean'), resp2h=('resp_2h', 'mean'), resp24=('resp_24h', 'mean'), resp_neg=('resp_antes_neg', 'mean'),
           min_resp=('min_resp', 'median'), min_emp=('min_empujon', 'median'), leyo=('leyo_audio', 'mean'), min_leer=('min_leer', 'median'),
           leyo_antes=('leyo_antes_empujon', 'mean'), presion=('msgs_antes_resp', 'median'), h_neg=('horas_a_neg', 'median'),
           neg_con_resp=('neg_con_resp', 'mean'), faci=('faci_24h', 'mean'))
print(A.groupby('protocolo').agg(**agg).round(3).T)
print('\nSolo 9 a 18 h'); print(A[A.franja == '9 a 18 h'].groupby('protocolo').agg(**agg).round(3).T)
M = A[A.maduro]
print('\nMaduros'); print(M.groupby('protocolo').agg(n=('lead', 'size'), a14=('llego_14', 'mean'), pago=('llego_pago', 'mean'), venta=('venta', 'mean'), ventas=('venta', 'sum'), n14=('llego_14', 'sum')).round(3))
print(M[M.franja == '9 a 18 h'].groupby('protocolo').agg(n=('lead', 'size'), a14=('llego_14', 'mean'), venta=('venta', 'mean'), ventas=('venta', 'sum')).round(3))
# Pruebas: Pregunta sin 1.3 vs 1.3 (todos)
def comp(col, g1, g2, df=A):
    x = df[df.protocolo.isin(g1)][col]; y = df[df.protocolo.isin(g2)][col]
    a, b, c, d = int(x.sum()), int(len(x) - x.sum()), int(y.sum()), int(len(y) - y.sum())
    print(f'{col}: {g1} {a}/{len(x)}={a/len(x):.3f} {tuple(round(v,3) for v in wilson(a,len(x)))} vs {g2} {c}/{len(y)}={c/len(y):.3f} {tuple(round(v,3) for v in wilson(c,len(y)))} p={fisher(a,b,c,d):.3f}')
T13 = ['1.3 + pregunta', '1.3 sin pregunta']; PJ = ['Pregunta sin 1.3']
for col in ['resp_30m', 'resp_2h', 'resp_24h', 'resp_antes_neg', 'faci_24h']:
    comp(col, PJ, T13)
for col in ['llego_14', 'llego_pago', 'venta']:
    comp(col, PJ, T13, M)
print('pregunta dentro de 1.3:')
for col in ['resp_30m', 'resp_2h', 'resp_24h']:
    comp(col, ['1.3 + pregunta'], ['1.3 sin pregunta'])
for col in ['llego_14', 'venta']:
    comp(col, ['1.3 + pregunta'], ['1.3 sin pregunta'], M)
print(pd.crosstab(A.protocolo, A.audio_de))

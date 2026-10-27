# Tablas de resumen del paso 1.3 a partir de leads.pkl y entradas13.pkl.
import json, os, sys
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import pandas as pd

D = sys.argv[1]
TZ = ZoneInfo('America/Matamoros')
CORTE = datetime(2026, 10, 27, 20, 0, tzinfo=timezone.utc)
pd.set_option('display.width', 250); pd.set_option('display.max_columns', 40)
L = pd.read_pickle(os.path.join(D, 'leads.pkl'))
E = pd.read_pickle(os.path.join(D, 'entradas13.pkl'))

# Compras confirmadas (sistema de ventas), si ya se bajaron.
def compro(cid, desde):
    f = os.path.join(D, 'conv', cid + '.json')
    if not os.path.exists(f): return None
    d = json.load(open(f))
    for v in (d.get('compras') or {}).get('compras', []) if isinstance(d.get('compras'), dict) else (d.get('compras') or []):
        if v.get('cancelada'): continue
        if desde is not None and v['fecha'] < (desde - timedelta(days=1)).strftime('%Y-%m-%d'): continue
        return True
    return False

P = L[L.recibio_pregunta].copy()
for col in ['movido_13', 'audio', 'plantilla_audio', '13_antes_neg', 'pregunta_precio', 'llego_14_o_mas', 'llego_pago', 'manual_a_14_o_pago', 'resp_en_12', 'resp_audio_cliente']:
    P[col] = P[col].fillna(False).astype(bool)
P['semana'] = P.t_pregunta.dt.tz_convert(TZ).dt.tz_localize(None).dt.to_period('W-SUN').dt.start_time.dt.date
P['maduro'] = P.t_pregunta <= CORTE - timedelta(days=7)
P['contesto'] = P.t_resp.notna()
P['contesto_en_12'] = P.contesto & (P.resp_en_12 == True)
P['compra'] = [compro(i, t) for i, t in zip(P.id, P.t_pregunta)]
P['venta'] = P.gano | (P.compra == True)
P.to_pickle(os.path.join(D, 'P.pkl'))

print('== Periodo', P.t_pregunta.min(), P.t_pregunta.max(), 'leads con pregunta', len(P))
print(P.groupby('embudo').agg(leads=('id', 'size'), contesto=('contesto', 'sum'), en12=('contesto_en_12', 'sum')))

R = P[P.contesto_en_12].copy()
hora = R.t_resp.dt.tz_convert(TZ).dt.hour
R['franja'] = pd.cut(hora, [-1, 8, 17, 21, 23], labels=['22-9 h', '9-18 h', '18-22 h', '22-9 h b']).astype(str).str.replace(' b', '')
R['dia'] = R.t_resp.dt.tz_convert(TZ).dt.dayofweek
print('\n== Contestaron en 1.2:', len(R))
print(pd.crosstab(R.embudo, R.orden, margins=True))
print('\nmovido 1.3 %', R.groupby('embudo').movido_13.mean().round(3).to_dict(), 'total', round(R.movido_13.mean(), 3))
print('audio %', R.groupby('embudo').audio.mean().round(3).to_dict(), round(R.audio.mean(), 3))
print('plantilla audio %', round(R.plantilla_audio.mean(), 3))
print('min primera respuesta humana mediana', R.min_humano.median(), 'p75', R.min_humano.quantile(.75))
print('min audio mediana', R.min_audio.median(), 'p75', R.min_audio.quantile(.75))
print('min a 1.3 mediana', R.min_13.median(), 'p75', R.min_13.quantile(.75), 'p90', R.min_13.quantile(.9))
print('movido antes del Negativo', R['13_antes_neg'].sum(), 'de', R.movido_13.sum())
print('\nNo movidos: salida', R[~R.movido_13].salida_12.value_counts(dropna=False).to_dict(), R[~R.movido_13].salida_12_origen.value_counts(dropna=False).to_dict())
print('No movidos con respuesta humana', R[~R.movido_13].t_humano.notna().sum(), 'pregunta precio', R[~R.movido_13].pregunta_precio.sum())
print('No movidos que llegaron a 1.4+', R[~R.movido_13].llego_14_o_mas.sum(), 'manual 1.4/pago', R[~R.movido_13].manual_a_14_o_pago.sum())
print('\nPor franja horaria'); print(R.groupby('franja').agg(n=('id', 'size'), movido=('movido_13', 'mean'), audio=('audio', 'mean'), min13=('min_13', 'median')))
print('\nPor quien contesto primero'); print(R.groupby('humano_quien', dropna=False).agg(n=('id', 'size'), audio=('audio', 'mean'), movido=('movido_13', 'mean'), plantilla=('plantilla_audio', 'mean'), min_h=('min_humano', 'median'), min13=('min_13', 'median')))
print('\nQuien movio a 1.3'); print(R.quien_13.value_counts())
print('Quien mando audio'); print(R.audio_quien.value_counts())
print('\nPor semana'); print(R.groupby('semana').agg(n=('id', 'size'), movido=('movido_13', 'mean'), audio=('audio', 'mean')))

M = R[R.maduro]
print('\n== Resultado (maduros, 7+ dias):', len(M))
print(M.groupby('movido_13').agg(n=('id', 'size'), a14=('llego_14_o_mas', 'mean'), pago=('llego_pago', 'mean'), venta=('venta', 'mean'), ventas=('venta', 'sum')))
print(M.groupby(['movido_13', 'audio']).agg(n=('id', 'size'), a14=('llego_14_o_mas', 'mean'), venta=('venta', 'mean')))

T = P[P.contesto & ~P.contesto_en_12]
print('\n== Contestaron tarde (ya en Negativo u otra etapa):', len(T), 'movidos 1.3', T.movido_13.sum(), 'audio', T.audio.sum())

# Entradas a 1.3 desde el 5/10
E2 = E[E.t_13 >= P.t_pregunta.min()].copy()
E2['semana'] = E2.t_13.dt.tz_convert(TZ).dt.tz_localize(None).dt.to_period('W-SUN').dt.start_time.dt.date
print('\n== Entradas a 1.3 desde', P.t_pregunta.min().date(), len(E2), 'leads', E2.id.nunique())
print(pd.crosstab(E2.embudo, E2.desde_k, margins=True))
print(pd.crosstab(E2.semana, E2.embudo, margins=True))
print(E2.origen.value_counts().to_dict()); print(E2.quien.value_counts().to_dict())
print(pd.crosstab(E2.embudo, E2.siguiente, margins=True))
print(E2.groupby('embudo')[['bot_llamadita', 'bot_facilidades', 'bot_fallido', 'cliente_respondio', 'cliente_resp_tras_llamadita', 'humano_escribio', 'humano_faci_antes_bot', 'tarea_llamada', 'despues_14_o_mas', 'despues_pago', 'despues_gano', 'cliente_resp_y_bot_a_neg']].mean().round(3).T)
print('sum', E2[['cliente_respondio', 'despues_14_o_mas', 'despues_pago', 'despues_gano', 'cliente_resp_y_bot_a_neg', 'tarea_llamada', 'humano_faci_antes_bot']].sum().to_dict())
print('horas en 1.3 mediana', E2.horas_en_13.median(), 'min resp cliente mediana', E2.min_resp_cliente.median())
print(E2.groupby('siguiente_origen').size())
E2.to_pickle(os.path.join(D, 'E2.pkl')); R.to_pickle(os.path.join(D, 'R.pkl'))

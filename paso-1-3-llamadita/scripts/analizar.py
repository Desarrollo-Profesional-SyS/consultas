# Analisis del paso 1.3 (Llamadita y facilidades de pago) en ISO + Calidad,
# Core Tools Premium y Manufactura y Calidad. Lee lo descargado por descargar.py.
import json, os, re, sys, unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import pandas as pd

D = sys.argv[1]
TZ = ZoneInfo('America/Matamoros')
H = timedelta(hours=1)

def norm(t):
    t = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', t)

def ts(m):
    v = m.get('timestampMeta') or m.get('createdAt')
    return datetime.fromisoformat(v.replace('Z', '+00:00'))

def tipo_etapa(nombre, tipo):
    n = norm(nombre)
    if tipo == 'ganada': return 'GAN'
    if tipo == 'perdida': return 'PER'
    if 'negativo' in n: return 'NEG'
    if n.startswith('1.3'): return 'S13'
    if n.startswith('1.4') or n.startswith('1.5'): return 'S14'
    if n.startswith('1.2'): return 'S12'
    if n.startswith('1.1'): return 'S11'
    if 'saludo' in n: return 'S1'
    if 'entrantes' in n: return 'ENT'
    if 'stby' in n: return 'STBY'
    if re.match(r'^(2|3|msi)', n): return 'PAGO'
    return 'OTRA'

ORDEN = {'ENT': 0, 'S1': 1, 'S11': 2, 'S12': 3, 'NEG': 3.5, 'S13': 4, 'S14': 5, 'STBY': 5, 'PAGO': 6, 'GAN': 7, 'PER': -1, 'OTRA': -1}
NOMBRE_EMBUDO = {'iso': 'ISO + Calidad', 'ct': 'Core Tools Premium', 'mc': 'Manufactura y Calidad'}

PREGUNTA = re.compile(r'en que area trabajas')
AUDIO_PLANTILLA = re.compile(r'audio rapidito')
LLAMADITA_BOT = re.compile(r'llamadita para explicarte')
FACILIDADES_BOT = re.compile(r'facilidades de pago.*quieres que te muestre|quieres que te muestre como quedaria')
FACILIDADES_HUMANO = re.compile(r'pago en una sola exhibicion|facilidades de pago:|te paso nuestras facilidades|manejamos 3 facilidades')
PRECIO = re.compile(r'cost|precio|cuanto|cuesta|pago|mensualidad|meses|inscrib|promo|descuento')

def es_humano(m):
    return m['direccion'] == 'saliente' and not m['automatico'] and not m['interno']

convs = json.load(open(os.path.join(D, 'convs.json')))
filas = []
entradas13 = []
for c in convs:
    f = os.path.join(D, 'det', c['id'] + '.json')
    if not os.path.exists(f):
        continue
    d = json.load(open(f))
    msgs = sorted([m for m in d['msgs'] if not m.get('eliminadoAt')], key=ts)
    movs = d['mov']
    for mv in movs:
        mv['_t'] = datetime.fromisoformat(mv['createdAt'].replace('Z', '+00:00'))
        mv['_k'] = tipo_etapa(mv['hacia']['nombre'], mv['hacia']['tipo'])
    tareas = d['tareas'].get('items', []) if isinstance(d['tareas'], dict) else d['tareas']
    r = {
        'id': c['id'], 'lead': c['numero'], 'embudo': NOMBRE_EMBUDO[c['_embudo']],
        'asignado': (c.get('asignado') or {}).get('nombre'),
        'etapa_actual': (c.get('etapa') or {}).get('nombre'),
        'razon_perdida': c.get('razonPerdida'),
        'llegada': ts(msgs[0]) if msgs else None,
        'gano': any(mv['_k'] == 'GAN' for mv in movs),
        'n_msgs': len(msgs),
    }
    preg = [m for m in msgs if m['direccion'] == 'saliente' and m['automatico'] and PREGUNTA.search(norm(m['texto']))]
    r['recibio_pregunta'] = bool(preg)
    if preg:
        tq = ts(preg[0])
        r['t_pregunta'] = tq
        # Movimientos despues de la pregunta
        mv_desp = [mv for mv in movs if mv['_t'] >= tq - timedelta(seconds=5)]
        neg_bot = [mv for mv in mv_desp if mv['_k'] == 'NEG' and mv['origen'] == 'secuencia']
        r['t_neg_bot'] = neg_bot[0]['_t'] if neg_bot else None
        # Primer movimiento que saca al lead de 1.2 despues de la pregunta
        salida = [mv for mv in mv_desp if mv['_k'] != 'S12']
        r['salida_12'] = salida[0]['_k'] if salida else None
        r['salida_12_origen'] = salida[0]['origen'] if salida else None
        r['salida_12_t'] = salida[0]['_t'] if salida else None
        # Respuesta del cliente
        ent = [m for m in msgs if m['direccion'] == 'entrante' and ts(m) > tq]
        if ent:
            e0 = ent[0]
            r['t_resp'] = ts(e0)
            r['min_resp'] = (ts(e0) - tq).total_seconds() / 60
            r['tipo_resp'] = e0['tipo']
            r['texto_resp'] = (e0['texto'] or '')[:200]
            # Lo que escribio en los primeros 10 min tras su primera respuesta
            bloque = ' '.join(norm(m['texto']) for m in ent if ts(m) <= ts(e0) + timedelta(minutes=10))
            r['pregunta_precio'] = bool(PRECIO.search(bloque))
            r['resp_audio_cliente'] = any(m['tipo'] == 'audio' for m in ent if ts(m) <= ts(e0) + timedelta(minutes=10))
            # Estaba en 1.2 cuando contesto (antes de que el bot lo mandara al Negativo o lo sacara)
            r['resp_en_12'] = (r['salida_12_t'] is None) or (ts(e0) < r['salida_12_t'])
        else:
            r['t_resp'] = None
        if r.get('t_resp'):
            t0 = r['t_resp']
            hum = [m for m in msgs if es_humano(m) and ts(m) >= t0]
            r['t_humano'] = ts(hum[0]) if hum else None
            r['min_humano'] = (ts(hum[0]) - t0).total_seconds() / 60 if hum else None
            r['humano_quien'] = ((hum[0].get('autor') or {}).get('nombre') or 'Fuera del CRM') if hum else None
            pl = [m for m in hum if AUDIO_PLANTILLA.search(norm(m['texto']))]
            r['plantilla_audio'] = bool(pl)
            r['t_plantilla'] = ts(pl[0]) if pl else None
            au = [m for m in hum if m['tipo'] == 'audio']
            r['audio'] = bool(au)
            r['t_audio'] = ts(au[0]) if au else None
            r['min_audio'] = (ts(au[0]) - t0).total_seconds() / 60 if au else None
            r['audio_quien'] = ((au[0].get('autor') or {}).get('nombre') or 'Fuera del CRM') if au else None
            r['audio_dur'] = None
            m13 = [mv for mv in movs if mv['_k'] == 'S13' and mv['_t'] >= tq]
            r['movido_13'] = bool(m13)
            r['t_13'] = m13[0]['_t'] if m13 else None
            r['min_13'] = (m13[0]['_t'] - t0).total_seconds() / 60 if m13 else None
            r['origen_13'] = m13[0]['origen'] if m13 else None
            r['quien_13'] = ((m13[0].get('usuario') or {}).get('nombre') or m13[0]['origen']) if m13 else None
            r['13_antes_neg'] = bool(m13) and (r['t_neg_bot'] is None or m13[0]['_t'] < r['t_neg_bot'])
            if au and m13:
                r['orden'] = 'Audio y después 1.3' if ts(au[0]) <= m13[0]['_t'] else '1.3 y después audio'
            elif au:
                r['orden'] = 'Audio sin mover a 1.3'
            elif m13:
                r['orden'] = 'Movido a 1.3 sin audio'
            else:
                r['orden'] = 'Ni audio ni 1.3'
            # Otros caminos: movido directo a 1.4 o pago sin pasar por 1.3
            otros = [mv for mv in movs if mv['_t'] >= t0 and mv['origen'] == 'manual' and mv['_k'] in ('S14', 'PAGO', 'GAN', 'STBY')]
            r['manual_a_14_o_pago'] = bool(otros)
            r['llego_14_o_mas'] = any(mv['_k'] in ('S14', 'PAGO', 'GAN', 'STBY') and mv['_t'] >= tq for mv in movs)
            r['llego_pago'] = any(mv['_k'] in ('PAGO', 'GAN') and mv['_t'] >= tq for mv in movs)
        # Entradas a 1.3 (todas, aunque no hayan contestado la pregunta)
    for i, mv in enumerate(movs):
        if mv['_k'] != 'S13':
            continue
        if i > 0 and movs[i - 1]['_k'] == 'S13':
            continue
        t13 = mv['_t']
        sig = next((x for x in movs[i + 1:] if x['_k'] != 'S13'), None)
        t_fin = sig['_t'] if sig else None
        dentro = [m for m in msgs if ts(m) >= t13 and (t_fin is None or ts(m) < t_fin)]
        bot13 = [m for m in dentro if m['direccion'] == 'saliente' and m['automatico'] and re.search(r'1\.3', m.get('bot') or '')]
        llam = [m for m in bot13 if LLAMADITA_BOT.search(norm(m['texto']))]
        faci = [m for m in bot13 if FACILIDADES_BOT.search(norm(m['texto']))]
        cli = [m for m in dentro if m['direccion'] == 'entrante']
        hum = [m for m in dentro if es_humano(m)]
        hum_faci_antes = bool(faci) and any(FACILIDADES_HUMANO.search(norm(m['texto'])) and ts(m) < ts(faci[0]) for m in hum)
        cli_tras_llam = [m for m in cli if llam and ts(m) > ts(llam[0])]
        tareas_llamada = [t for t in tareas if (t.get('tipo') or '').lower().startswith('llamada') and datetime.fromisoformat(t['createdAt'].replace('Z', '+00:00')) >= t13 - timedelta(minutes=30) and (t_fin is None or datetime.fromisoformat(t['createdAt'].replace('Z', '+00:00')) < t_fin + timedelta(hours=24))]
        desde = mv['desde']['nombre'] if mv.get('desde') else None
        posteriores = [x for x in movs[i + 1:]]
        def r30(b):
            if not b: return None
            return any(m['direccion'] == 'entrante' and ts(b[0]) < ts(m) <= ts(b[0]) + timedelta(minutes=30) for m in msgs)
        entradas13.append({
            'resp30_llamadita': r30(llam), 'resp30_facilidades': r30(faci),
            'id': c['id'], 'lead': c['numero'], 'embudo': NOMBRE_EMBUDO[c['_embudo']],
            't_13': t13, 'origen': mv['origen'], 'quien': (mv.get('usuario') or {}).get('nombre') or mv['origen'],
            'desde': desde, 'desde_k': tipo_etapa(desde or '', None) if desde else None,
            'asignado': r['asignado'],
            'siguiente': sig['_k'] if sig else 'SIGUE_EN_13', 'siguiente_origen': sig['origen'] if sig else None,
            'siguiente_quien': ((sig.get('usuario') or {}).get('nombre') if sig else None),
            'horas_en_13': ((t_fin - t13).total_seconds() / 3600) if t_fin else None,
            'bot_llamadita': bool(llam), 'bot_facilidades': bool(faci),
            'bot_fallido': any(m['estado'] in ('fallido', 'error') for m in bot13),
            'cliente_respondio': bool(cli), 'cliente_resp_tras_llamadita': bool(cli_tras_llam),
            'min_resp_cliente': ((ts(cli[0]) - t13).total_seconds() / 60) if cli else None,
            'humano_escribio': bool(hum), 'n_humano': len(hum),
            'humano_faci_antes_bot': hum_faci_antes,
            'tarea_llamada': bool(tareas_llamada),
            'despues_14_o_mas': any(x['_k'] in ('S14', 'PAGO', 'GAN', 'STBY') for x in posteriores),
            'despues_pago': any(x['_k'] in ('PAGO', 'GAN') for x in posteriores),
            'despues_gano': any(x['_k'] == 'GAN' for x in posteriores),
            'cliente_resp_y_bot_a_neg': bool(cli) and sig is not None and sig['_k'] == 'NEG' and sig['origen'] == 'secuencia',
        })
    filas.append(r)

L = pd.DataFrame(filas)
E = pd.DataFrame(entradas13)
L.to_pickle(os.path.join(D, 'leads.pkl'))
E.to_pickle(os.path.join(D, 'entradas13.pkl'))
print('leads', len(L), 'con pregunta', int(L.recibio_pregunta.sum()), 'entradas a 1.3', len(E))
